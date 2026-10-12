(function () {
  const state = {
    client: null,
    rows: [],
    totals: { debit: 0, credit: 0 },
    sources: [],
    coaFilter: '',
    reportYear: new Date().getFullYear(),
    loading: false,
    selectedJournalKey: '',
    journalSourceFilter: ''
  };

  const elements = {
    alert: document.getElementById('bukuBesarAlert'),
    clientMeta: document.getElementById('bukuBesarClientMeta'),
    userName: document.getElementById('bukuBesarUserName'),
    userEmail: document.getElementById('bukuBesarUserEmail'),
    refreshButton: document.getElementById('bukuBesarRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('bukuBesarBackLink'),
    subtitle: document.getElementById('bukuBesarSubtitle'),
    rowCount: document.getElementById('bukuBesarRowCount'),
    debitTotal: document.getElementById('bukuBesarDebitTotal'),
    creditTotal: document.getElementById('bukuBesarCreditTotal'),
    sourceCount: document.getElementById('bukuBesarSourceCount'),
    coaFilter: document.getElementById('bukuBesarCoaFilter'),
    rows: document.getElementById('bukuBesarRows'),
    viewJournalButton: document.getElementById('bukuBesarViewJournalBtn'),
    exportButton: document.getElementById('bukuBesarExportBtn')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDisplayDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '-' + match[2] + '-' + match[1] : raw;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function setAlert(message, kind) {
    if (!elements.alert) return;
    elements.alert.hidden = !message;
    elements.alert.textContent = message || '';
    elements.alert.className = 'portal-alert' + (kind ? ' ' + kind : '');
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/buku-besar/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/buku-besar';
  }

  async function requestJson(url, options) {
    const response = await fetch(url, Object.assign({
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    }, options || {}));
    if (response.status === 401) {
      window.location.assign('/app/client/login?expired=' + Date.now());
      return null;
    }
    const data = await response.json().catch(function () {
      return {};
    });
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Buku Besar.');
    return data;
  }

  async function loadBukuBesar() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      state.rows = Array.isArray(data.rows) ? data.rows : [];
      state.totals = data.totals || { debit: 0, credit: 0 };
      state.sources = Array.isArray(data.sources) ? data.sources : [];
      state.reportYear = Number(data.reportYear || state.reportYear || new Date().getFullYear());
      if (state.coaFilter && !state.rows.some(function (row) { return coaFilterKey(row) === state.coaFilter; })) {
        state.coaFilter = '';
      }
      renderClient();
      renderCoaFilter();
      renderSummary();
      renderRows();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Buku Besar.', 'error');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
    }
  }

  async function logout() {
    if (elements.logoutButton) elements.logoutButton.disabled = true;
    try {
      const response = await fetch('/app/api/client/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json().catch(function () {
        return {};
      });
      window.location.assign(data.redirectUrl || '/app/client/login');
    } catch {
      window.location.assign('/app/client/login');
    }
  }

  function renderShell(data) {
    const user = data.user || {};
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
  }

  function renderClient() {
    const client = state.client || {};
    setText(elements.clientMeta, text(client.name, 'PT X'));
    const reportYear = Number(state.reportYear || window.ClientPortalPeriod?.currentYear?.()) || new Date().getFullYear();
    setText(elements.subtitle, text(client.name, 'Klien') + ' | Data gabungan dari menu klien | Tahun ' + reportYear);
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function renderSummary() {
    const rows = visibleRows();
    const totals = sumRows(rows);
    const sources = uniqueSources(rows);
    setText(elements.rowCount, String(rows.length));
    setText(elements.debitTotal, formatAmount(totals.debit));
    setText(elements.creditTotal, formatAmount(totals.credit));
    setText(elements.sourceCount, sources.length + ' menu');
  }

  function renderRows() {
    clearNode(elements.rows);
    const rows = visibleRows();
    rows.forEach(function (row) {
      elements.rows.appendChild(ledgerRow(row));
    });

    const blankCount = Math.max(5 - rows.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
  }

  function renderCoaFilter() {
    if (!elements.coaFilter) return;
    const current = state.coaFilter;
    clearNode(elements.coaFilter);
    elements.coaFilter.appendChild(option('', 'Semua COA dan nama akun'));
    coaOptions().forEach(function (item) {
      elements.coaFilter.appendChild(option(item.key, item.label));
    });
    elements.coaFilter.value = current;
  }

  function option(value, label) {
    const item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    return item;
  }

  function coaOptions() {
    const map = new Map();
    state.rows.forEach(function (row) {
      const key = coaFilterKey(row);
      if (!key || map.has(key)) return;
      map.set(key, {
        key,
        label: text(row.coa) + ' - ' + text(row.accountName, 'Tanpa nama akun')
      });
    });
    return Array.from(map.values()).sort(function (left, right) {
      return left.label.localeCompare(right.label, 'id', { numeric: true, sensitivity: 'base' });
    });
  }

  function visibleRows() {
    if (!state.coaFilter) return state.rows;
    return state.rows.filter(function (row) {
      return coaFilterKey(row) === state.coaFilter;
    });
  }

  function coaFilterKey(row) {
    return text(row && row.coa) + '|' + text(row && row.accountName);
  }

  function sumRows(rows) {
    return rows.reduce(function (totals, row) {
      totals.debit += Number(row.debit || 0);
      totals.credit += Number(row.credit || 0);
      return totals;
    }, { debit: 0, credit: 0 });
  }

  function uniqueSources(rows) {
    const names = new Set();
    rows.forEach(function (row) {
      const source = text(row.sumber);
      if (source) names.add(source);
    });
    return Array.from(names);
  }

  function ledgerRow(row) {
    const tr = document.createElement('tr');
    tr.className = 'ledger-clickable-row';
    tr.tabIndex = 0;
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-label', 'Lihat jurnal ' + text(row.noBukti, row.sumber));
    tr.addEventListener('click', function () {
      openJournalModal(row);
    });
    tr.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openJournalModal(row);
      }
    });
    tr.appendChild(cell(row.businessEntityName || row.businessEntityKey || '', 'client-entity-column'));
    tr.appendChild(cell(row.coa));
    tr.appendChild(cell(row.accountName));
    tr.appendChild(cell(formatDisplayDate(row.tanggal)));
    tr.appendChild(cell(row.noBukti));
    tr.appendChild(cell(row.sumber));
    tr.appendChild(cell(row.keterangan));
    tr.appendChild(cell(formatAmount(row.debit), 'number'));
    tr.appendChild(cell(formatAmount(row.credit), 'number'));
    tr.appendChild(cell(row.catatanPajak));
    return tr;
  }

  function journalGroupKey(row) {
    const sourceKey = text(row && row.sourceKey);
    const sourceId = text(row && row.sourceId);
    if (sourceId) return sourceKey + '|' + sourceId;
    const id = text(row && row.id);
    if (id && id.indexOf(':') > 0) return sourceKey + '|' + id.split(':')[0];
    return [sourceKey, row?.tanggal, row?.noBukti, row?.sumber, row?.keterangan].map(text).join('|');
  }

  function journalRowsFor(row) {
    const key = journalGroupKey(row);
    return state.rows.filter(function (item) {
      return journalGroupKey(item) === key;
    }).sort(function (left, right) {
      return Number(left.journalOrder || 0) - Number(right.journalOrder || 0) ||
        text(left.coa).localeCompare(text(right.coa), 'id', { numeric: true, sensitivity: 'base' });
    });
  }

  function ensureJournalModal() {
    let modal = document.getElementById('bukuBesarJournalModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'bukuBesarJournalModal';
    modal.className = 'portal-modal-backdrop ledger-journal-modal';
    modal.hidden = true;
    modal.innerHTML = [
      '<section class="portal-modal portal-modal-wide" role="dialog" aria-modal="true" aria-labelledby="bukuBesarJournalTitle">',
        '<header class="portal-modal-header">',
          '<div><h2 id="bukuBesarJournalTitle">Detail Jurnal</h2><span id="bukuBesarJournalMeta">Rincian debit kredit.</span></div>',
          '<button class="icon-button" type="button" data-ledger-journal-close aria-label="Tutup detail jurnal"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
        '</header>',
        '<div class="ledger-journal-body" id="bukuBesarJournalBody"></div>',
        '<footer class="portal-modal-footer"><button class="ghost-button" type="button" data-ledger-journal-close>Tutup</button></footer>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.closest('[data-ledger-journal-close]')) closeJournalModal();
    });
    return modal;
  }

  function journalGroups(rows) {
    const groups = new Map();
    rows.forEach(function (row) {
      const key = journalGroupKey(row);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.entries()).map(function (item) {
      const groupRows = item[1].slice().sort(function (left, right) {
        return Number(left.journalOrder || 0) - Number(right.journalOrder || 0) ||
          text(left.coa).localeCompare(text(right.coa), 'id', { numeric: true, sensitivity: 'base' });
      });
      return {
        key: item[0],
        rows: groupRows,
        header: groupRows[0] || {}
      };
    }).sort(function (left, right) {
      return text(left.header.tanggal).localeCompare(text(right.header.tanggal)) ||
        text(left.header.noBukti).localeCompare(text(right.header.noBukti), 'id', { numeric: true, sensitivity: 'base' }) ||
        text(left.header.sumber).localeCompare(text(right.header.sumber));
    });
  }

  function journalSourceOptions() {
    const sourceMap = new Map((state.sources || []).map(function (source) {
      return [text(source.key), source];
    }));
    return [{ key: '', label: 'Semua', count: journalGroups(state.rows).length }].concat(
      Array.from(sourceMap.values()).filter(function (source) {
        return text(source.key);
      }).map(function (source) {
        const sourceRows = state.rows.filter(function (row) {
          return text(row.sourceKey) === text(source.key);
        });
        return {
          key: text(source.key),
          label: text(source.label, text(source.key)),
          count: journalGroups(sourceRows).length
        };
      })
    );
  }

  function safeFilePart(value) {
    return text(value, 'data')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'data';
  }

  function selectedCoaLabel() {
    if (!elements.coaFilter || !state.coaFilter) return 'Semua COA dan nama akun';
    const selected = elements.coaFilter.options[elements.coaFilter.selectedIndex];
    return selected ? text(selected.textContent, 'Semua COA dan nama akun') : 'Semua COA dan nama akun';
  }

  function exportBukuBesar() {
    if (!window.XLSX) {
      setAlert('Library Excel belum termuat. Refresh halaman lalu coba lagi.', 'error');
      return;
    }
    const rows = visibleRows();
    if (!rows.length) {
      setAlert('Tidak ada data Buku Besar pada filter ini untuk diekspor.', 'error');
      return;
    }

    const hasEntity = rows.some(function (row) {
      return text(row.businessEntityName || row.businessEntityKey);
    });
    const headers = (hasEntity ? ['Entitas'] : []).concat([
      'COA', 'Nama Akun', 'Tanggal', 'No Bukti', 'Sumber', 'Keterangan', 'Debit', 'Credit', 'Catatan Pajak'
    ]);
    const totals = sumRows(rows);
    const exportRows = [
      ['BUKU BESAR'],
      [text(state.client && state.client.name, 'Klien')],
      ['Tahun', Number(state.reportYear || new Date().getFullYear())],
      ['Filter COA', selectedCoaLabel()],
      [],
      headers
    ];

    rows.forEach(function (row) {
      exportRows.push((hasEntity ? [text(row.businessEntityName || row.businessEntityKey)] : []).concat([
        text(row.coa),
        text(row.accountName),
        formatDisplayDate(row.tanggal),
        text(row.noBukti),
        text(row.sumber),
        text(row.keterangan),
        Number(row.debit || 0),
        Number(row.credit || 0),
        text(row.catatanPajak)
      ]));
    });

    const totalRow = new Array(headers.length).fill('');
    totalRow[Math.max(0, headers.length - 4)] = 'TOTAL';
    totalRow[headers.length - 3] = Number(totals.debit || 0);
    totalRow[headers.length - 2] = Number(totals.credit || 0);
    exportRows.push(totalRow);

    const workbook = window.XLSX.utils.book_new();
    const sheet = window.XLSX.utils.aoa_to_sheet(exportRows);
    const finalColumn = window.XLSX.utils.encode_col(headers.length - 1);
    sheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }
    ];
    sheet['!autofilter'] = { ref: 'A6:' + finalColumn + String(5 + rows.length) };
    sheet['!cols'] = (hasEntity ? [{ wch: 22 }] : []).concat([
      { wch: 12 }, { wch: 28 }, { wch: 13 }, { wch: 22 }, { wch: 25 },
      { wch: 55 }, { wch: 18 }, { wch: 18 }, { wch: 22 }
    ]);
    window.XLSX.utils.book_append_sheet(workbook, sheet, 'Buku Besar');
    window.XLSX.writeFile(
      workbook,
      'buku-besar-' + safeFilePart(state.client && state.client.name) + '-' + Number(state.reportYear || new Date().getFullYear()) + '.xlsx'
    );
    setAlert('Buku Besar berhasil diekspor sesuai filter yang tampil.', 'success');
  }

  function journalRowsBySourceFilter() {
    if (!state.journalSourceFilter) return state.rows;
    return state.rows.filter(function (row) {
      return text(row.sourceKey) === state.journalSourceFilter;
    });
  }

  function compactJournalTable(rows) {
    const table = document.createElement('table');
    table.className = 'financial-report-detail-table ledger-journal-table ledger-all-journal-table';
    const body = document.createElement('tbody');
    rows.forEach(function (item) {
      const tr = document.createElement('tr');
      [item.coa, item.accountName, item.keterangan].forEach(function (value) {
        const td = document.createElement('td');
        td.textContent = text(value, '-');
        tr.appendChild(td);
      });
      const debit = document.createElement('td');
      debit.textContent = formatAmountZero(item.debit);
      const credit = document.createElement('td');
      credit.textContent = formatAmountZero(item.credit);
      tr.appendChild(debit);
      tr.appendChild(credit);
      body.appendChild(tr);
    });
    table.appendChild(body);
    return table;
  }

  function journalColumnHeaderTable() {
    const table = document.createElement('table');
    table.className = 'financial-report-detail-table ledger-journal-table ledger-all-journal-table ledger-all-journal-columns-table';
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['COA', 'Nama Akun', 'Keterangan', 'Debit', 'Credit'].forEach(function (title) {
      const th = document.createElement('th');
      th.textContent = title;
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);
    return table;
  }

  function renderAllJournalModal() {
    let modal = document.getElementById('bukuBesarAllJournalModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'bukuBesarAllJournalModal';
      modal.className = 'portal-modal-backdrop ledger-all-journal-modal';
      modal.hidden = true;
      modal.innerHTML = [
        '<section class="portal-modal portal-modal-wide" role="dialog" aria-modal="true" aria-labelledby="bukuBesarAllJournalTitle">',
          '<header class="portal-modal-header">',
            '<div><h2 id="bukuBesarAllJournalTitle">Lihat Jurnal</h2><span id="bukuBesarAllJournalMeta">Semua jurnal dalam periode ini.</span></div>',
            '<button class="icon-button" type="button" data-all-journal-close aria-label="Tutup jurnal"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
          '</header>',
          '<div class="ledger-all-journal-tabs" id="bukuBesarAllJournalTabs" role="tablist" aria-label="Sumber jurnal"></div>',
          '<div class="ledger-all-journal-columns" id="bukuBesarAllJournalColumns"></div>',
          '<div class="ledger-all-journal-body" id="bukuBesarAllJournalBody"></div>',
          '<footer class="portal-modal-footer"><button class="ghost-button" type="button" data-all-journal-close>Tutup</button></footer>',
        '</section>'
      ].join('');
      document.body.appendChild(modal);
      modal.addEventListener('click', function (event) {
        if (event.target === modal || event.target.closest('[data-all-journal-close]')) {
          modal.hidden = true;
          return;
        }
        const tab = event.target.closest('[data-journal-source-key]');
        if (!tab) return;
        state.journalSourceFilter = tab.getAttribute('data-journal-source-key') || '';
        renderAllJournalModal();
      });
    }

    const tabs = modal.querySelector('#bukuBesarAllJournalTabs');
    clearNode(tabs);
    journalSourceOptions().forEach(function (source) {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'ledger-source-tab' + (source.key === state.journalSourceFilter ? ' active' : '');
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-selected', source.key === state.journalSourceFilter ? 'true' : 'false');
      tab.setAttribute('data-journal-source-key', source.key);
      tab.innerHTML = '<strong>' + escapeHtml(source.label) + '</strong><span>' + escapeHtml(String(source.count)) + '</span>';
      tabs.appendChild(tab);
    });

    const columns = modal.querySelector('#bukuBesarAllJournalColumns');
    clearNode(columns);
    columns.appendChild(journalColumnHeaderTable());

    const body = modal.querySelector('#bukuBesarAllJournalBody');
    clearNode(body);
    const groups = journalGroups(journalRowsBySourceFilter());
    setText(modal.querySelector('#bukuBesarAllJournalMeta'), groups.length + ' jurnal | ' + text(state.reportYear));
    if (!groups.length) {
      const empty = document.createElement('div');
      empty.className = 'ledger-all-journal-empty';
      empty.textContent = 'Belum ada jurnal pada sumber ini.';
      body.appendChild(empty);
    } else {
      groups.forEach(function (group) {
        const card = document.createElement('article');
        card.className = 'ledger-all-journal-card';
        const totals = sumRows(group.rows);
        const header = document.createElement('div');
        header.className = 'ledger-all-journal-card-header';
        header.innerHTML = '<div><strong>' + escapeHtml(text(group.header.noBukti, 'Tanpa nomor bukti')) + '</strong><span>' + escapeHtml([formatDisplayDate(group.header.tanggal), text(group.header.sumber), text(group.header.keterangan)].filter(Boolean).join(' | ')) + '</span></div>' +
          '<span class="ledger-all-journal-balance ' + (Math.abs(totals.debit - totals.credit) <= 0.009 ? 'is-balanced' : 'is-unbalanced') + '">' + (Math.abs(totals.debit - totals.credit) <= 0.009 ? 'Balance' : 'Tidak balance') + '</span>';
        card.appendChild(header);
        card.appendChild(compactJournalTable(group.rows));
        body.appendChild(card);
      });
    }
    modal.hidden = false;
  }

  function openJournalModal(row) {
    const modal = ensureJournalModal();
    const rows = journalRowsFor(row);
    const totals = sumRows(rows);
    setText(modal.querySelector('#bukuBesarJournalTitle'), text(row.noBukti, 'Detail Jurnal'));
    setText(
      modal.querySelector('#bukuBesarJournalMeta'),
      [formatDisplayDate(row.tanggal), text(row.sumber), text(row.keterangan)].filter(Boolean).join(' | ')
    );
    const body = modal.querySelector('#bukuBesarJournalBody');
    clearNode(body);

    const summary = document.createElement('div');
    summary.className = 'ledger-journal-summary';
    [
      ['Total Debit', formatAmountZero(totals.debit)],
      ['Total Credit', formatAmountZero(totals.credit)],
      ['Status', Math.abs(Number(totals.debit || 0) - Number(totals.credit || 0)) <= 0.009 ? 'Balance' : 'Tidak balance']
    ].forEach(function (item) {
      const card = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = item[0];
      const value = document.createElement('strong');
      value.textContent = item[1];
      card.appendChild(label);
      card.appendChild(value);
      summary.appendChild(card);
    });
    body.appendChild(summary);

    const table = document.createElement('table');
    table.className = 'financial-report-detail-table ledger-journal-table';
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['COA', 'Nama Akun', 'Keterangan', 'Debit', 'Credit'].forEach(function (title) {
      const th = document.createElement('th');
      th.textContent = title;
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);
    const tbody = document.createElement('tbody');
    rows.forEach(function (item) {
      const tr = document.createElement('tr');
      [item.coa, item.accountName, item.keterangan].forEach(function (value) {
        const td = document.createElement('td');
        td.textContent = text(value, '-');
        tr.appendChild(td);
      });
      const debit = document.createElement('td');
      debit.textContent = formatAmountZero(item.debit);
      const credit = document.createElement('td');
      credit.textContent = formatAmountZero(item.credit);
      tr.appendChild(debit);
      tr.appendChild(credit);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.appendChild(table);
    modal.hidden = false;
  }

  function closeJournalModal() {
    const modal = document.getElementById('bukuBesarJournalModal');
    if (modal) modal.hidden = true;
  }

  function closeAllJournalModal() {
    const modal = document.getElementById('bukuBesarAllJournalModal');
    if (modal) modal.hidden = true;
  }

  function blankRow() {
    const tr = document.createElement('tr');
    for (let index = 0; index < 10; index += 1) {
      tr.appendChild(cell(''));
    }
    return tr;
  }

  function cell(value, variant) {
    const td = document.createElement('td');
    if (variant) td.className = variant;
    const fullText = text(value);
    td.textContent = fullText;
    if (fullText) td.title = fullText;
    return td;
  }

  function formatAmount(value) {
    const number = Number(value || 0);
    return number ? currency.format(number) : '';
  }

  function formatAmountZero(value) {
    return currency.format(Number(value || 0));
  }

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadBukuBesar);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.coaFilter) {
    elements.coaFilter.addEventListener('change', function () {
      state.coaFilter = elements.coaFilter.value || '';
      renderSummary();
      renderRows();
    });
  }
  if (elements.viewJournalButton) {
    elements.viewJournalButton.addEventListener('click', function () {
      state.journalSourceFilter = '';
      renderAllJournalModal();
    });
  }
  if (elements.exportButton) elements.exportButton.addEventListener('click', exportBukuBesar);
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeJournalModal();
    closeAllJournalModal();
  });

  loadBukuBesar();
})();
