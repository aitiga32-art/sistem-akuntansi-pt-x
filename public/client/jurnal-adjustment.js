(function () {
  const state = {
    client: null,
    coaAccounts: [],
    entries: [],
    selectedEntryId: '',
    attachmentFiles: [],
    attachmentDirty: false,
    attachmentLoading: false,
    attachmentLoadFailed: false,
    attachmentLoadPromise: null,
    loading: false,
    saving: false
  };

  const elements = {
    alert: document.getElementById('adjustmentAlert'),
    clientMeta: document.getElementById('adjustmentClientMeta'),
    userName: document.getElementById('adjustmentUserName'),
    userEmail: document.getElementById('adjustmentUserEmail'),
    refreshButton: document.getElementById('adjustmentRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('adjustmentBackLink'),
    subtitle: document.getElementById('adjustmentSubtitle'),
    addButton: document.getElementById('adjustmentAddBtn'),
    searchInput: document.getElementById('adjustmentSearchInput'),
    dateSort: document.getElementById('adjustmentDateSort'),
    paymentFilter: document.getElementById('adjustmentPaymentFilter'),
    documentFilter: document.getElementById('adjustmentDocumentFilter'),
    count: document.getElementById('adjustmentCount'),
    totalDebit: document.getElementById('adjustmentDebitTotal'),
    totalCredit: document.getElementById('adjustmentCreditTotal'),
    rows: document.getElementById('adjustmentRows'),
    selectedDetail: document.getElementById('adjustmentSelectedDetail'),
    modal: document.getElementById('adjustmentModal'),
    form: document.getElementById('adjustmentForm'),
    modalTitle: document.getElementById('adjustmentModalTitle'),
    modalMeta: document.getElementById('adjustmentModalMeta'),
    closeButton: document.getElementById('adjustmentCloseBtn'),
    cancelButton: document.getElementById('adjustmentCancelBtn'),
    saveButton: document.getElementById('adjustmentSaveBtn'),
    entryId: document.getElementById('adjustmentEntryId'),
    tanggal: document.getElementById('adjustmentTanggal'),
    keterangan: document.getElementById('adjustmentKeterangan'),
    attachmentPickButton: document.getElementById('adjustmentAttachmentPickBtn'),
    attachmentName: document.getElementById('adjustmentAttachmentName'),
    attachmentFile: document.getElementById('adjustmentAttachmentFile'),
    attachmentNote: document.getElementById('adjustmentAttachmentNote'),
    attachmentList: document.getElementById('adjustmentAttachmentList'),
    debitLines: document.getElementById('adjustmentDebitLines'),
    creditLines: document.getElementById('adjustmentCreditLines'),
    addDebitButton: document.getElementById('adjustmentAddDebitBtn'),
    addCreditButton: document.getElementById('adjustmentAddCreditBtn'),
    debitModalTotal: document.getElementById('adjustmentDebitModalTotal'),
    creditModalTotal: document.getElementById('adjustmentCreditModalTotal'),
    balanceStatus: document.getElementById('adjustmentBalanceStatus'),
    fileModal: document.getElementById('adjustmentFileModal'),
    fileTitle: document.getElementById('adjustmentFileTitle'),
    fileMeta: document.getElementById('adjustmentFileMeta'),
    fileViewer: document.getElementById('adjustmentFileViewer'),
    fileCloseButton: document.getElementById('adjustmentFileCloseBtn'),
    journalModal: document.getElementById('adjustmentJournalModal'),
    journalTitle: document.getElementById('adjustmentJournalTitle'),
    journalMeta: document.getElementById('adjustmentJournalMeta'),
    journalBody: document.getElementById('adjustmentJournalBody'),
    journalCloseButton: document.getElementById('adjustmentJournalCloseBtn')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  const pageConfig = /\/(?:hti-)?jurnal-umum(?:\/)?$/i.test(window.location.pathname)
    ? {
      slug: 'jurnal-umum',
      title: 'Jurnal Umum',
      countLabel: 'jurnal umum',
      subtitle: 'Input jurnal umum manual',
      modalAddTitle: 'Tambah Jurnal Umum',
      modalEditTitle: 'Ubah Jurnal Umum',
      modalMeta: 'Input jurnal umum dengan total Debet dan Kredit seimbang.',
      emptyLabel: 'Jurnal Umum',
      savedMessage: 'Jurnal Umum tersimpan.',
      saveError: 'Gagal menyimpan Jurnal Umum.',
      deleteConfirm: 'Hapus Jurnal Umum ini?',
      deletedMessage: 'Jurnal Umum dihapus.',
      deleteError: 'Gagal menghapus Jurnal Umum.'
    }
    : {
      slug: 'jurnal-adjustment',
      title: 'Jurnal Adjustment',
      countLabel: 'jurnal',
      subtitle: 'Input jurnal manual',
      modalAddTitle: 'Tambah Jurnal Adjustment',
      modalEditTitle: 'Ubah Jurnal Adjustment',
      modalMeta: 'Input jurnal manual dengan total Debet dan Kredit seimbang.',
      emptyLabel: 'Jurnal Adjustment',
      savedMessage: 'Jurnal Adjustment tersimpan.',
      saveError: 'Gagal menyimpan Jurnal Adjustment.',
      deleteConfirm: 'Hapus Jurnal Adjustment ini?',
      deletedMessage: 'Jurnal Adjustment dihapus.',
      deleteError: 'Gagal menghapus Jurnal Adjustment.'
    };

  function applyPageLabels() {
    document.title = pageConfig.title + ' - Client Portal';
    const title = document.querySelector('.portal-title');
    if (title) title.textContent = pageConfig.title;
    const toolbar = document.querySelector('.cashbook-toolbar');
    if (toolbar) toolbar.setAttribute('aria-label', 'Aksi ' + pageConfig.title);
    const sheet = document.querySelector('.cashbook-sheet-panel');
    if (sheet) sheet.setAttribute('aria-label', 'Tabel ' + pageConfig.title);
    const empty = elements.rows && elements.rows.querySelector('td');
    if (empty && /Memuat Jurnal Adjustment/i.test(empty.textContent || '')) {
      empty.textContent = 'Memuat ' + pageConfig.title + '...';
    }
    setText(elements.modalTitle, pageConfig.modalAddTitle);
    setText(elements.modalMeta, pageConfig.modalMeta);
    setText(elements.journalMeta, 'Rincian ' + pageConfig.title.toLowerCase() + '.');
    configurePageTableColumns();
  }

  function configurePageTableColumns() {
    if (!isHtiJournalPage()) return;
    const table = document.querySelector('.adjustment-table');
    if (table && !table.querySelector('colgroup[data-hti-journal-cols]')) {
      const colgroup = document.createElement('colgroup');
      ['13%', '10%', '32%', '13%', '13%', '9%', '10%'].forEach(function (width) {
        const col = document.createElement('col');
        col.style.width = width;
        colgroup.appendChild(col);
      });
      colgroup.setAttribute('data-hti-journal-cols', 'true');
      table.insertBefore(colgroup, table.firstChild);
    }
    const entityHead = document.querySelector('.adjustment-table thead .client-entity-column');
    if (entityHead) entityHead.remove();
    const loadingCell = elements.rows && elements.rows.querySelector('td[colspan]');
    if (loadingCell) loadingCell.colSpan = 7;
  }

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, function (char) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char];
    });
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
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/(?:jurnal-adjustment|jurnal-umum|hti-jurnal-umum)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/' + pageConfig.slug;
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat ' + pageConfig.title + '.');
    return data;
  }

  async function loadAdjustment() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      configureClientPageLabels();
      state.coaAccounts = Array.isArray(data.coaAccounts) ? data.coaAccounts : [];
      state.entries = (Array.isArray(data.entries) ? data.entries : []).map(function (entry) {
        if (pageConfig.title !== 'Jurnal Memorial' || text(entry.sourceLabel) !== 'Jurnal Adjustment') return entry;
        return Object.assign({}, entry, { sourceLabel: 'Jurnal Memorial' });
      });
      if (state.selectedEntryId && !state.entries.some(function (entry) { return entry.id === state.selectedEntryId; })) {
        state.selectedEntryId = '';
      }
      renderClient();
      renderRows();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat ' + pageConfig.title + '.', 'error');
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
    document.body.classList.toggle('hti-journal-page', isHtiJournalPage());
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.subtitle, text(client.name, 'Klien') + ' | ' + pageConfig.subtitle);
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function configureClientPageLabels() {
    if (pageConfig.slug !== 'jurnal-adjustment') return;
    const clientName = text(state.client && state.client.name).toUpperCase();
    const isTbb = clientName.includes('PERUSAHAAN DISTRIBUSI CONTOH') ||
      clientName.includes('DISTRIBUSI CONTOH') ||
      clientName.includes('DISTRIBUSI CONTOH');
    if (!isTbb) return;
    Object.assign(pageConfig, {
      title: 'Jurnal Memorial',
      countLabel: 'jurnal memorial',
      subtitle: 'Input jurnal memorial dan penyesuaian',
      modalAddTitle: 'Tambah Jurnal Memorial',
      modalEditTitle: 'Ubah Jurnal Memorial',
      modalMeta: 'Input jurnal memorial dengan total Debet dan Kredit seimbang.',
      emptyLabel: 'Jurnal Memorial',
      savedMessage: 'Jurnal Memorial tersimpan.',
      saveError: 'Gagal menyimpan Jurnal Memorial.',
      deleteConfirm: 'Hapus Jurnal Memorial ini?',
      deletedMessage: 'Jurnal Memorial dihapus.',
      deleteError: 'Gagal menghapus Jurnal Memorial.'
    });
    applyPageLabels();
  }

  function isHtiJournalPage() {
    return /\/pt-x-jurnal-umum(?:\/)?$/i.test(window.location.pathname);
  }

  function htiProtectedJournalCoas() {
    return new Set([
      '1100', '1201', '1202', '1203', '1204', '1205', '1206',
      '1500', '1602', '1701', '1703', '1704', '1705', '1706', '1707', '1708', '1709', '1710', '1711', '1712',
      '1810', '1811', '1820', '1821',
      '2100', '2101', '2200', '2400', '2502', '2503', '2504', '2505',
      '4100', '5101', '5102', '5103', '5201', '6110', '6125'
    ]);
  }

  function coaAccountsForInput() {
    if (!isHtiJournalPage()) return state.coaAccounts;
    const protectedCoas = htiProtectedJournalCoas();
    return state.coaAccounts.filter(function (account) {
      return !protectedCoas.has(text(account.coa));
    });
  }

  function filteredEntries() {
    const query = text(elements.searchInput && elements.searchInput.value).toLowerCase();
    const paymentFilter = text(elements.paymentFilter && elements.paymentFilter.value) || 'all';
    const documentFilter = text(elements.documentFilter && elements.documentFilter.value) || 'all';
    let entries = state.entries.slice();
    if (documentFilter === 'missing') {
      entries = entries.filter(function (entry) {
        return !entry.hasAttachment;
      });
    } else if (documentFilter === 'uploaded') {
      entries = entries.filter(function (entry) {
        return Boolean(entry.hasAttachment);
      });
    }
    if (paymentFilter === 'unpaid' || paymentFilter === 'paid') {
      entries = entries.filter(function (entry) {
        return journalPaymentStatus(entry) === paymentFilter;
      });
    }
    if (query) {
      entries = entries.filter(function (entry) {
      const haystack = [
        entry.noJurnal,
        entry.tanggal,
        formatDisplayDate(entry.tanggal),
        entry.keterangan,
        entry.businessEntityKey,
        entry.businessEntityName,
        entry.attachmentName,
        entry.sourceLabel,
        entry.lockReason,
        entry.isAutomatic ? 'otomatis terkunci' : ''
      ];
      (Array.isArray(entry.debitLines) ? entry.debitLines : []).forEach(function (line) {
        haystack.push(line.coa, line.accountName, line.memo, line.keterangan);
      });
      (Array.isArray(entry.creditLines) ? entry.creditLines : []).forEach(function (line) {
        haystack.push(line.coa, line.accountName, line.memo, line.keterangan);
      });
      return haystack.join(' ').toLowerCase().includes(query);
      });
    }
    return sortEntriesByDate(entries);
  }

  function sortEntriesByDate(entries) {
    const mode = text(elements.dateSort && elements.dateSort.value) || 'date-desc';
    const direction = mode === 'date-asc' ? 1 : -1;
    return entries.slice().sort(function (a, b) {
      const aDate = journalDateValue(a);
      const bDate = journalDateValue(b);
      if (aDate !== bDate) return (aDate - bDate) * direction;
      return text(a.noJurnal || a.id).localeCompare(text(b.noJurnal || b.id)) * direction;
    });
  }

  function journalDateValue(entry) {
    const raw = text(entry && entry.tanggal);
    const parsed = Date.parse(raw + 'T00:00:00');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function journalPaymentStatus(entry) {
    const explicit = text(entry && (entry.paymentStatus || entry.statusPembayaran || entry.statusBayar || entry.payment_status)).toLowerCase();
    if (/belum|parsial|partial|sisa|utang|piutang/.test(explicit)) return 'unpaid';
    if (/lunas|paid|terbayar|selesai/.test(explicit)) return 'paid';
    const outstandingFields = [
      entry && entry.sisaTagihan,
      entry && entry.sisaPiutang,
      entry && entry.sisaUtang,
      entry && entry.outstanding,
      entry && entry.outstandingAmount,
      entry && entry.remainingAmount,
      entry && entry.remaining
    ];
    let hasOutstandingSignal = false;
    for (const value of outstandingFields) {
      if (value == null || value === '') continue;
      hasOutstandingSignal = true;
      if (parseAmount(value) > 0.009) return 'unpaid';
    }
    if (hasOutstandingSignal) return 'paid';
    const total = parseAmount(entry && (entry.totalTagihan || entry.jumlahTagihan || entry.totalAmount || entry.invoiceTotal));
    const paid = parseAmount(entry && (entry.sudahTerbayar || entry.terbayar || entry.paidAmount || entry.paymentAmount));
    if (total > 0) return paid + 0.009 >= total ? 'paid' : 'unpaid';
    return 'none';
  }

  function renderRows() {
    clearNode(elements.rows);
    const rows = filteredEntries();
    rows.forEach(function (entry) {
      elements.rows.appendChild(entryRow(entry));
    });
    if (rows.length) {
      setText(elements.count, rows.length + ' ' + pageConfig.countLabel);
    } else {
      setText(elements.count, state.entries.length ? '0 dari ' + state.entries.length + ' ' + pageConfig.countLabel : '0 ' + pageConfig.countLabel);
    }
    const blankCount = Math.max(8 - rows.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
    renderTotals(rows);
    renderSelectedDetail();
  }

  function entryRow(entry) {
    const row = document.createElement('tr');
    row.classList.toggle('is-selected', state.selectedEntryId === entry.id);
    row.classList.toggle('is-locked', isLockedEntry(entry));
    row.title = isLockedEntry(entry)
      ? text(entry.lockReason, 'Jurnal otomatis terkunci.') + ' Klik dua kali untuk melihat jurnal.'
      : 'Klik untuk melihat detail. Klik dua kali untuk melihat jurnal.';
    if (!isHtiJournalPage()) row.appendChild(businessEntityCell(entry));
    row.appendChild(journalNumberCell(entry));
    row.appendChild(cell(formatDisplayDate(entry.tanggal), 'adjustment-col-date'));
    row.appendChild(cellWithTitle(entry.keterangan, 'adjustment-col-desc'));
    row.appendChild(cell(formatAmount(entry.totalDebit), 'number adjustment-col-debit'));
    row.appendChild(cell(formatAmount(entry.totalCredit), 'number adjustment-col-credit'));
    row.appendChild(documentStatusCell(entry));
    row.appendChild(rowActionCell(entry));
    row.addEventListener('click', function () {
      state.selectedEntryId = entry.id;
      renderRows();
    });
    row.addEventListener('dblclick', function () {
      state.selectedEntryId = entry.id;
      renderRows();
      openJournalViewer(entry);
    });
    return row;
  }

  function isLockedEntry(entry) {
    return Boolean(entry && (entry.locked || entry.isAutomatic));
  }

  function journalNumberCell(entry) {
    const td = cell('');
    td.className = 'adjustment-col-no';
    const number = document.createElement('span');
    number.textContent = text(entry && entry.noJurnal);
    td.appendChild(number);
    if (isLockedEntry(entry)) {
      const badge = document.createElement('span');
      badge.className = 'adjustment-system-badge';
      badge.textContent = 'Otomatis';
      td.appendChild(badge);
      td.title = text(entry.lockReason, 'Jurnal otomatis terkunci.');
    }
    return td;
  }

  function blankRow() {
    const row = document.createElement('tr');
    const classes = [
      'adjustment-col-no',
      'adjustment-col-date',
      'adjustment-col-desc',
      'adjustment-col-debit',
      'adjustment-col-credit',
      'adjustment-col-doc',
      'adjustment-col-action'
    ];
    if (!isHtiJournalPage()) classes.unshift('client-entity-column');
    classes.forEach(function (className) {
      row.appendChild(cell('', className));
    });
    return row;
  }

  function businessEntityCell(entry) {
    return cellWithTitle(entry?.businessEntityName || entry?.businessEntityKey || '', 'client-entity-column');
  }

  function documentStatusCell(entry) {
    const td = cell('');
    td.className = 'hti-document-check-cell adjustment-document-cell adjustment-col-doc';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(entry && entry.hasAttachment);
    input.disabled = true;
    td.appendChild(input);
    if (entry && entry.hasAttachment) td.title = text(entry.attachmentName, 'Ada dokumen');
    return td;
  }

  function rowActionCell(entry) {
    const td = cell('');
    td.className = 'adjustment-row-action-cell adjustment-col-action';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cashbook-action-button adjustment-row-action-button';
    button.textContent = 'Detail';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      state.selectedEntryId = entry.id;
      renderRows();
    });
    td.appendChild(button);
    return td;
  }

  function cell(value, variant) {
    const td = document.createElement('td');
    if (variant) td.className = variant;
    td.textContent = text(value);
    return td;
  }

  function cellWithTitle(value, variant) {
    const td = cell(value, variant);
    const fullText = text(value);
    if (fullText) td.title = fullText;
    return td;
  }

  function actionButton(label, onClick, disabled, variant, disabledReason) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cashbook-action-button' + (variant ? ' ' + variant : '');
    button.textContent = label;
    button.disabled = Boolean(disabled);
    if (disabled) button.title = disabledReason || 'Aksi tidak tersedia.';
    if (onClick) button.addEventListener('click', onClick);
    return button;
  }

  function selectedEntry() {
    return state.entries.find(function (entry) {
      return entry.id === state.selectedEntryId;
    }) || null;
  }

  function renderSelectedDetail() {
    if (!elements.selectedDetail) return;
    clearNode(elements.selectedDetail);
    const entry = selectedEntry();
    elements.selectedDetail.hidden = !entry;
    if (!entry) return;

    const card = document.createElement('div');
    card.className = 'tbb-row-detail-card adjustment-row-detail-card';

    const header = document.createElement('div');
    header.className = 'tbb-row-detail-header';
    const titleWrap = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = text(entry.noJurnal, pageConfig.emptyLabel);
    const subtitle = document.createElement('p');
    subtitle.textContent = isLockedEntry(entry)
      ? text(entry.sourceLabel, 'Otomatis Penyesuaian') + ' | ' + text(entry.lockReason, 'Jurnal otomatis terkunci.')
      : text(entry.keterangan, 'Jurnal manual');
    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);
    header.appendChild(titleWrap);
    card.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'tbb-row-detail-grid adjustment-row-detail-grid';
    grid.appendChild(detailMetricNode('Tanggal', formatDisplayDate(entry.tanggal)));
    grid.appendChild(detailMetricNode('Total Debet', formatAmountZero(entry.totalDebit)));
    grid.appendChild(detailMetricNode('Total Kredit', formatAmountZero(entry.totalCredit)));
    grid.appendChild(detailMetricNode('Status', isLockedEntry(entry) ? 'Otomatis - terkunci' : (Math.abs(Number(entry.totalDebit || 0) - Number(entry.totalCredit || 0)) <= 0.009 ? 'Balance' : 'Belum balance')));
    grid.appendChild(detailMetricNode('Sumber', text(entry.sourceLabel, pageConfig.title)));
    grid.appendChild(detailMetricNode('File', entry.hasAttachment ? text(entry.attachmentName, 'Ada file') : 'Belum ada file'));
    card.appendChild(grid);

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'tbb-row-detail-actions adjustment-row-detail-actions';
    const actions = document.createElement('div');
    actions.className = 'cashbook-actions';
    actions.appendChild(actionButton('Jurnal', function () { openJournalViewer(entry); }));
    if (entry.hasAttachment) actions.appendChild(actionButton('Lihat File', function () { openFileViewer(entry); }));
    if (isLockedEntry(entry)) {
      actions.appendChild(actionButton('Terkunci', null, true, 'locked', text(entry.lockReason, 'Jurnal otomatis tidak bisa diubah atau dihapus.')));
    } else {
      actions.appendChild(actionButton('Ubah', function () { openEditModal(entry); }));
      actions.appendChild(actionButton('Hapus', function () { deleteEntry(entry); }, false, 'danger'));
    }
    actions.appendChild(actionButton('Tutup', function () {
      state.selectedEntryId = '';
      renderRows();
    }));
    actionsWrap.appendChild(actions);
    card.appendChild(actionsWrap);
    elements.selectedDetail.appendChild(card);
  }

  function detailMetricNode(label, value) {
    const item = document.createElement('div');
    item.className = 'tbb-row-detail-metric';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = text(value, '-');
    item.appendChild(span);
    item.appendChild(strong);
    return item;
  }

  function renderTotals(sourceEntries) {
    const totals = (Array.isArray(sourceEntries) ? sourceEntries : state.entries).reduce(function (acc, entry) {
      acc.debit += Number(entry.totalDebit || 0);
      acc.credit += Number(entry.totalCredit || 0);
      return acc;
    }, { debit: 0, credit: 0 });
    setText(elements.totalDebit, formatAmount(totals.debit) || '0');
    setText(elements.totalCredit, formatAmount(totals.credit) || '0');
  }

  function today() {
    const current = new Date();
    return current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');
  }

  function formatAmount(value) {
    const number = Number(value || 0);
    return number ? currency.format(number) : '';
  }

  function formatAmountZero(value) {
    return currency.format(Number(value || 0));
  }

  function parseAmount(value) {
    const raw = value && value.value != null ? value.value : value;
    if (raw == null || raw === '') return 0;
    const cleaned = String(raw).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
  }

  function formatInputAmount(value) {
    const number = Number(value || 0);
    if (!Number.isFinite(number) || !number) return '';
    return currency.format(number);
  }

  function formatFileSize(value) {
    const size = Number(value || 0);
    if (!size) return '0 KB';
    if (size < 1024 * 1024) return Math.max(1, Math.round(size / 1024)) + ' KB';
    return (size / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB';
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(new Error('Gagal membaca file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  function openCreateModal() {
    elements.form.reset();
    elements.entryId.value = '';
    elements.tanggal.value = today();
    if (elements.keterangan) elements.keterangan.value = '';
    clearNode(elements.debitLines);
    clearNode(elements.creditLines);
    addJournalLine('debit');
    addJournalLine('credit');
    resetAttachmentInput(null);
    setText(elements.modalTitle, pageConfig.modalAddTitle);
    setText(elements.modalMeta, pageConfig.modalMeta);
    updateModalTotals();
    showModal();
  }

  function openEditModal(entry) {
    if (isLockedEntry(entry)) {
      setAlert(text(entry.lockReason, 'Jurnal otomatis tidak bisa diubah.'), 'info');
      return;
    }
    elements.form.reset();
    elements.entryId.value = entry.id || '';
    elements.tanggal.value = entry.tanggal || today();
    if (elements.keterangan) elements.keterangan.value = entry.keterangan || '';
    clearNode(elements.debitLines);
    clearNode(elements.creditLines);
    const debitLines = Array.isArray(entry.debitLines) && entry.debitLines.length ? entry.debitLines : [{}];
    const creditLines = Array.isArray(entry.creditLines) && entry.creditLines.length ? entry.creditLines : [{}];
    debitLines.forEach(function (line) { addJournalLine('debit', line); });
    creditLines.forEach(function (line) { addJournalLine('credit', line); });
    resetAttachmentInput(entry);
    setText(elements.modalTitle, pageConfig.modalEditTitle);
    setText(elements.modalMeta, text(entry.noJurnal, pageConfig.emptyLabel));
    updateModalTotals();
    showModal();
  }

  function showModal() {
    elements.modal.hidden = false;
    window.setTimeout(function () {
      elements.tanggal.focus();
    }, 0);
  }

  function closeModal() {
    elements.modal.hidden = true;
  }

  function addJournalLine(side, line) {
    const container = elements.debitLines;
    const row = document.createElement('div');
    row.className = 'adjustment-line-row';
    row.dataset.side = side;

    const coaSelect = document.createElement('select');
    coaSelect.className = 'adjustment-line-coa';
    coaSelect.required = true;
    appendCoaOptions(coaSelect);
    coaSelect.value = text(line && line.coa);

    const accountSelect = document.createElement('select');
    accountSelect.className = 'adjustment-line-account';
    accountSelect.required = true;
    appendAccountOptions(accountSelect);
    accountSelect.value = text(line && line.coa);

    const memoInput = document.createElement('input');
    memoInput.className = 'adjustment-line-memo';
    memoInput.type = 'text';
    memoInput.value = text(line && (line.memo || line.keterangan), elements.keterangan.value || '');
    memoInput.placeholder = 'Keterangan baris';

    const debitInput = document.createElement('input');
    debitInput.className = 'adjustment-line-nominal adjustment-line-debit';
    debitInput.type = 'text';
    debitInput.inputMode = 'decimal';
    debitInput.dataset.rupiah = 'true';
    debitInput.placeholder = '0';
    debitInput.value = side === 'credit' ? '' : formatInputAmount(line && line.nominal);

    const creditInput = document.createElement('input');
    creditInput.className = 'adjustment-line-nominal adjustment-line-credit';
    creditInput.type = 'text';
    creditInput.inputMode = 'decimal';
    creditInput.dataset.rupiah = 'true';
    creditInput.placeholder = '0';
    creditInput.value = side === 'credit' ? formatInputAmount(line && line.nominal) : '';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'adjustment-remove-line';
    removeButton.textContent = 'Hapus';

    coaSelect.addEventListener('change', function () {
      syncLineAccount(row);
    });
    accountSelect.addEventListener('change', function () {
      syncLineCoa(row);
    });
    debitInput.addEventListener('input', function () {
      if (parseAmount(debitInput.value) > 0) creditInput.value = '';
      updateModalTotals();
    });
    creditInput.addEventListener('input', function () {
      if (parseAmount(creditInput.value) > 0) debitInput.value = '';
      updateModalTotals();
    });
    [debitInput, creditInput].forEach(function (amountInput) {
      amountInput.addEventListener('blur', function () {
        amountInput.value = formatInputAmount(parseAmount(amountInput.value));
        updateModalTotals();
      });
    });
    [coaSelect, accountSelect, memoInput, debitInput, creditInput].forEach(function (control) {
      control.addEventListener('keydown', handleJournalLineEnter);
    });
    memoInput.addEventListener('input', function () {
      updateModalTotals();
    });
    removeButton.addEventListener('click', function () {
      const rows = Array.from(container.querySelectorAll('.adjustment-line-row'));
      if (rows.length <= 1) {
        coaSelect.value = '';
        accountSelect.value = '';
        memoInput.value = '';
        debitInput.value = '';
        creditInput.value = '';
      } else {
        row.remove();
      }
      updateModalTotals();
    });

    row.appendChild(labelWrap('No Akun', coaSelect));
    row.appendChild(labelWrap('Nama Akun', accountSelect));
    row.appendChild(labelWrap('Keterangan', memoInput));
    row.appendChild(labelWrap('Debet', debitInput));
    row.appendChild(labelWrap('Kredit', creditInput));
    row.appendChild(removeButton);
    container.appendChild(row);
    syncLineAccount(row);
    updateModalTotals();
    return row;
  }

  function handleJournalLineEnter(event) {
    if (event.key !== 'Enter' || event.repeat || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
    event.preventDefault();
    if (event.target?.classList?.contains('adjustment-line-nominal')) {
      event.target.value = formatInputAmount(parseAmount(event.target.value));
    }
    const row = addJournalLine('debit');
    window.setTimeout(function () {
      row.querySelector('.adjustment-line-coa')?.focus();
    }, 0);
  }

  function labelWrap(label, control) {
    const wrap = document.createElement('label');
    wrap.className = 'adjustment-line-field';
    const span = document.createElement('span');
    span.textContent = label;
    wrap.appendChild(span);
    wrap.appendChild(control);
    return wrap;
  }

  function appendCoaOptions(select) {
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Pilih No Akun';
    select.appendChild(empty);
    coaAccountsForInput().forEach(function (account) {
      const option = document.createElement('option');
      option.value = account.coa;
      option.textContent = account.coa;
      option.title = account.accountName || account.coa;
      select.appendChild(option);
    });
  }

  function appendAccountOptions(select) {
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Pilih Nama Akun';
    select.appendChild(empty);
    coaAccountsForInput().forEach(function (account) {
      const option = document.createElement('option');
      option.value = account.coa;
      option.textContent = account.accountName || account.coa;
      option.title = account.coa;
      select.appendChild(option);
    });
  }

  function accountByCoa(coa) {
    return state.coaAccounts.find(function (account) {
      return account.coa === coa;
    }) || null;
  }

  function syncLineAccount(row) {
    const select = row.querySelector('.adjustment-line-coa');
    const accountSelect = row.querySelector('.adjustment-line-account');
    const account = accountByCoa(select.value);
    accountSelect.value = account ? account.coa : '';
  }

  function syncLineCoa(row) {
    const coaSelect = row.querySelector('.adjustment-line-coa');
    const accountSelect = row.querySelector('.adjustment-line-account');
    coaSelect.value = accountSelect.value || '';
  }

  function collectLines(side) {
    const container = elements.debitLines;
    const amountSelector = side === 'credit' ? '.adjustment-line-credit' : '.adjustment-line-debit';
    return Array.from(container.querySelectorAll('.adjustment-line-row')).map(function (row) {
      const coa = text(row.querySelector('.adjustment-line-coa')?.value);
      const nominal = parseAmount(row.querySelector(amountSelector)?.value);
      const memo = text(row.querySelector('.adjustment-line-memo')?.value);
      return { coa, nominal, memo };
    }).filter(function (line) {
      return Number(line.nominal || 0) > 0;
    });
  }

  function lineTotal(side) {
    return collectLines(side).reduce(function (sum, line) {
      return sum + Number(line.nominal || 0);
    }, 0);
  }

  function updateModalTotals() {
    const debit = lineTotal('debit');
    const credit = lineTotal('credit');
    const difference = debit - credit;
    const isBalanced = Math.abs(difference) <= 0.009 && debit > 0 && credit > 0;
    setText(elements.debitModalTotal, formatAmountZero(debit));
    setText(elements.creditModalTotal, formatAmountZero(credit));
    setText(elements.balanceStatus, 'Selisih: ' + formatAmountZero(Math.abs(difference)));
    elements.balanceStatus.classList.toggle('balanced', isBalanced);
    if (elements.saveButton) {
      elements.saveButton.disabled = state.saving || !isBalanced;
      elements.saveButton.title = isBalanced ? '' : 'Total Debet dan Kredit harus balance sebelum disimpan.';
    }
  }

  function selectedUploadFiles() {
    if (!elements.attachmentFile) return [];
    return typeof window.clientPortalSelectedFiles === 'function'
      ? window.clientPortalSelectedFiles(elements.attachmentFile)
      : Array.from(elements.attachmentFile.files || []);
  }

  function attachmentFileKey(file, index) {
    return text(file && file.id) || [text(file && file.name), Number(file && file.size || 0), index].join('|');
  }

  function ensureAttachmentId(file) {
    if (!file) return file;
    if (file.id) return file;
    return Object.assign({}, file, {
      id: 'file-' + Date.now() + '-' + Math.random().toString(16).slice(2),
      isNew: true
    });
  }

  function clearAttachmentFileInput() {
    if (!elements.attachmentFile) return;
    if (typeof window.clientPortalClearUploadSelection === 'function') {
      window.clientPortalClearUploadSelection(elements.attachmentFile);
    } else {
      elements.attachmentFile.value = '';
    }
  }

  function resetAttachmentInput(entry) {
    clearAttachmentFileInput();
    state.attachmentFiles = [];
    state.attachmentDirty = false;
    state.attachmentLoading = false;
    state.attachmentLoadFailed = false;
    state.attachmentLoadPromise = null;
    if (elements.attachmentName) elements.attachmentName.value = entry && entry.hasAttachment ? text(entry.attachmentName) : '';
    if (elements.attachmentFile) {
      elements.attachmentFile.disabled = false;
      elements.attachmentFile.dataset.currentName = entry && entry.hasAttachment ? text(entry.attachmentName, 'File sudah tersimpan') : '';
    }
    renderAttachmentManager();
    if (entry && entry.hasAttachment) loadExistingAttachmentFiles(entry.id);
  }

  function queueSelectedAttachmentFiles() {
    if (!elements.attachmentFile) return;
    const selected = selectedUploadFiles().map(ensureAttachmentId);
    if (!selected.length) {
      renderAttachmentManager();
      return;
    }
    state.attachmentFiles = state.attachmentFiles.concat(selected);
    state.attachmentDirty = true;
    clearAttachmentFileInput();
    renderAttachmentManager();
  }

  function updateAttachmentNote() {
    if (!elements.attachmentNote || !elements.attachmentFile) return;
    if (state.attachmentLoading) {
      elements.attachmentNote.textContent = 'Memuat file tersimpan...';
      return;
    }
    if (state.attachmentLoadFailed) {
      elements.attachmentNote.textContent = 'File lama belum bisa dimuat. Refresh halaman sebelum mengubah lampiran.';
      return;
    }
    const files = state.attachmentFiles || [];
    if (files.length) {
      elements.attachmentNote.textContent = typeof window.clientPortalFormatFilesNote === 'function'
        ? window.clientPortalFormatFilesNote(files, 'Lampiran jurnal')
        : (files.length === 1 ? files[0].name : files.length + ' file dipilih.');
      return;
    }
    if (state.attachmentDirty && elements.attachmentFile.dataset.currentName) {
      elements.attachmentNote.textContent = 'Semua lampiran akan dihapus saat disimpan.';
      return;
    }
    elements.attachmentNote.textContent = elements.attachmentFile.dataset.currentName
      ? 'File saat ini: ' + elements.attachmentFile.dataset.currentName
      : 'Belum ada file dipilih.';
  }

  function renderAttachmentManager() {
    updateAttachmentNote();
    if (!elements.attachmentList || !elements.attachmentFile) return;
    clearNode(elements.attachmentList);
    const files = state.attachmentFiles || [];
    const hasAnyAttachment = Boolean(files.length || elements.attachmentFile.dataset.currentName);
    if (elements.attachmentPickButton) {
      elements.attachmentPickButton.textContent = hasAnyAttachment ? 'Tambahkan Dokumen' : 'Upload Dokumen';
    }
    const qrButton = elements.attachmentFile.parentElement?.querySelector('.client-upload-qr-button');
    if (qrButton) {
      qrButton.textContent = hasAnyAttachment ? 'Tambahkan Dokumen dari HP' : 'Upload dari HP';
    }
    const hasRows = files.length || state.attachmentLoading || state.attachmentLoadFailed || (state.attachmentDirty && elements.attachmentFile.dataset.currentName);
    elements.attachmentList.hidden = !hasRows;
    if (!hasRows) return;
    if (state.attachmentLoading) {
      const loading = document.createElement('div');
      loading.className = 'tbb-attachment-row is-loading';
      loading.textContent = 'Memuat daftar file tersimpan...';
      elements.attachmentList.appendChild(loading);
      return;
    }
    if (state.attachmentLoadFailed) {
      const failed = document.createElement('div');
      failed.className = 'tbb-attachment-row is-loading';
      failed.textContent = 'File lama belum bisa dimuat. Refresh halaman sebelum mengubah lampiran.';
      elements.attachmentList.appendChild(failed);
      return;
    }
    files.forEach(function (file, index) {
      const row = document.createElement('div');
      row.className = 'tbb-attachment-row' + (file.isNew || file.file ? ' is-new' : '');
      row.setAttribute('data-adjustment-preview-attachment', attachmentFileKey(file, index));
      row.title = 'Klik untuk melihat file';
      row.innerHTML = '<span title="' + escapeHtml(file.name) + '">' + escapeHtml(file.name) + '</span><small>' + escapeHtml((file.isNew || file.file ? 'baru | ' : '') + formatFileSize(file.size)) + '</small>';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tbb-attachment-remove';
      button.textContent = 'X';
      button.setAttribute('data-adjustment-remove-attachment', attachmentFileKey(file, index));
      row.appendChild(button);
      elements.attachmentList.appendChild(row);
    });
    if (state.attachmentDirty && !files.length && elements.attachmentFile.dataset.currentName) {
      const empty = document.createElement('div');
      empty.className = 'tbb-attachment-row is-loading';
      empty.textContent = 'Semua lampiran lama akan dihapus ketika data disimpan.';
      elements.attachmentList.appendChild(empty);
    }
  }

  function loadExistingAttachmentFiles(entryId) {
    state.attachmentLoading = true;
    state.attachmentLoadFailed = false;
    renderAttachmentManager();
    const expectedId = text(entryId);
    const loadPromise = requestJson(apiBase() + '/' + encodeURIComponent(expectedId) + '/file', { headers: { Accept: 'application/json' } })
      .then(function (data) {
        if (text(elements.entryId.value) !== expectedId) return;
        const files = typeof window.clientPortalFilesFromResponse === 'function'
          ? window.clientPortalFilesFromResponse(data)
          : [];
        state.attachmentFiles = files;
        if (elements.attachmentFile) {
          elements.attachmentFile.dataset.currentName = files.length
            ? (files.length === 1 ? files[0].name : files.length + ' file')
            : '';
        }
      })
      .catch(function () {
        if (text(elements.entryId.value) !== expectedId) return;
        state.attachmentFiles = [];
        state.attachmentLoadFailed = true;
      })
      .finally(function () {
        if (text(elements.entryId.value) !== expectedId) return;
        state.attachmentLoading = false;
        state.attachmentLoadPromise = null;
        renderAttachmentManager();
      });
    state.attachmentLoadPromise = loadPromise;
  }

  async function previewQueuedAttachment(file) {
    if (!file) return;
    const dataUrl = file.dataUrl || (file.file ? await fileToDataUrl(file.file) : '');
    const previewFile = {
      name: text(file.name, 'lampiran'),
      mimeType: text(file.mimeType || file.type) || mimeTypeFromDataUrl(dataUrl) || 'application/octet-stream',
      size: Number(file.size || 0),
      dataUrl
    };
    clearNode(elements.fileViewer);
    elements.fileModal.hidden = false;
    if (window.clientPortalRenderAttachmentViewer) {
      window.clientPortalRenderAttachmentViewer(elements.fileViewer, { file: previewFile }, {
        titleEl: elements.fileTitle,
        metaEl: elements.fileMeta,
        label: 'Preview Dokumen'
      });
    } else {
      renderFileViewer(previewFile);
    }
  }

  function derivedJournalDescription(debitLines, creditLines) {
    const explicit = text(elements.keterangan && elements.keterangan.value);
    if (explicit) return explicit;
    const line = debitLines.concat(creditLines).find(function (item) {
      return text(item.memo);
    });
    return text(line && line.memo, pageConfig.emptyLabel);
  }

  async function attachmentPayload() {
    if (!elements.attachmentFile) return {};
    if (state.attachmentLoadPromise) await state.attachmentLoadPromise;
    const selected = selectedUploadFiles();
    if (selected.length) queueSelectedAttachmentFiles();
    if (state.attachmentLoadFailed && elements.attachmentFile.dataset.currentName && state.attachmentFiles.some(function (file) { return file.isNew || file.file; })) {
      throw new Error('File lama belum berhasil dimuat. Refresh halaman dulu sebelum menambah lampiran.');
    }
    if (!state.attachmentDirty) return {};
    const files = state.attachmentFiles || [];
    if (!files.length) return { clearAttachment: true };
    let payload = {};
    if (typeof window.clientPortalBuildAttachmentPayloadFromFiles === 'function') {
      payload = await window.clientPortalBuildAttachmentPayloadFromFiles(files);
    } else if (typeof window.clientPortalBuildAttachmentPayload === 'function') {
      payload = await window.clientPortalBuildAttachmentPayload(elements.attachmentFile);
    } else {
      payload = await legacyAttachmentPayload(elements.attachmentFile);
    }
    const attachmentName = text(elements.attachmentName && elements.attachmentName.value);
    if (attachmentName && payload.attachmentDataUrl) payload.attachmentName = attachmentName;
    return payload;
  }

  async function formPayload() {
    const debitLines = collectLines('debit');
    const creditLines = collectLines('credit');
    const payload = {
      tanggal: elements.tanggal.value,
      keterangan: derivedJournalDescription(debitLines, creditLines),
      debitLines,
      creditLines
    };
    Object.assign(payload, await attachmentPayload());
    return payload;
  }

  async function legacyAttachmentPayload(input) {
    const file = input && input.files && input.files[0];
    if (!file) return {};
    return {
      attachmentName: file.name,
      attachmentMimeType: file.type || 'application/octet-stream',
      attachmentSize: file.size || 0,
      attachmentDataUrl: await fileToDataUrl(file)
    };
  }

  async function submitForm(event) {
    event.preventDefault();
    if (state.saving) return;
    const debit = lineTotal('debit');
    const credit = lineTotal('credit');
    if (debit <= 0 || credit <= 0) {
      setAlert('Total Debet dan Kredit wajib lebih dari 0.', 'error');
      return;
    }
    if (Math.abs(debit - credit) > 0.009) {
      setAlert('Total Debet dan Kredit harus sama sebelum disimpan.', 'error');
      return;
    }

    const entryId = text(elements.entryId.value);
    const url = entryId ? apiBase() + '/' + encodeURIComponent(entryId) : apiBase();
    const method = entryId ? 'PUT' : 'POST';
    state.saving = true;
    elements.saveButton.disabled = true;
    elements.saveButton.setAttribute('aria-busy', 'true');
    elements.saveButton.textContent = 'Menyimpan...';
    setAlert('');
    try {
      const data = await requestJson(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(await formPayload())
      });
      if (!data) return;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      renderClient();
      renderRows();
      closeModal();
      setAlert(pageConfig.savedMessage, 'info');
    } catch (err) {
      setAlert(err.message || pageConfig.saveError, 'error');
    } finally {
      state.saving = false;
      elements.saveButton.removeAttribute('aria-busy');
      elements.saveButton.textContent = 'Simpan';
      updateModalTotals();
    }
  }

  async function deleteEntry(entry) {
    if (!entry || !entry.id) return;
    if (isLockedEntry(entry)) {
      setAlert(text(entry.lockReason, 'Jurnal otomatis tidak bisa dihapus.'), 'info');
      return;
    }
    const ok = window.clientPortalConfirm
      ? await window.clientPortalConfirm({
        title: 'Hapus ' + pageConfig.title + '?',
        meta: text(entry.noJurnal || entry.keterangan, pageConfig.title),
        message: pageConfig.deleteConfirm,
        cancelText: 'Batal',
        confirmText: 'Hapus'
      })
      : window.confirm(pageConfig.deleteConfirm);
    if (!ok) return;
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entry.id), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!data) return;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      renderClient();
      renderRows();
      setAlert(pageConfig.deletedMessage, 'info');
    } catch (err) {
      setAlert(err.message || pageConfig.deleteError, 'error');
    }
  }

  async function openFileViewer(entry) {
    if (!entry || !entry.hasAttachment) {
      setAlert('Belum ada file ter-upload untuk jurnal ini.', 'info');
      return;
    }
    showFileModal(entry);
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entry.id) + '/file');
      if (!data) return;
      renderFileViewer(data);
    } catch (err) {
      closeFileModal();
      setAlert(err.message || 'Gagal membuka file.', 'error');
    }
  }

  function openJournalViewer(entry) {
    if (!entry || !elements.journalModal || !elements.journalBody) return;
    clearNode(elements.journalBody);
    setText(elements.journalTitle, text(entry.noJurnal, 'Lihat Jurnal'));
    setText(elements.journalMeta, formatDisplayDate(entry.tanggal) + ' | ' + text(entry.keterangan, pageConfig.emptyLabel));

    const table = document.createElement('table');
    table.className = 'financial-report-detail-table adjustment-journal-view-table';
    table.innerHTML = '<thead><tr><th>No Akun</th><th>Nama Akun</th><th>Keterangan</th><th>Debet</th><th>Kredit</th></tr></thead>';
    const tbody = document.createElement('tbody');
    const debitLines = Array.isArray(entry.debitLines) ? entry.debitLines : [];
    const creditLines = Array.isArray(entry.creditLines) ? entry.creditLines : [];
    debitLines.forEach(function (line) {
      tbody.appendChild(journalViewRow(line, line.nominal, 0));
    });
    creditLines.forEach(function (line) {
      tbody.appendChild(journalViewRow(line, 0, line.nominal));
    });
    const total = document.createElement('tr');
    total.className = 'adjustment-journal-total-row';
    total.innerHTML = '<td colspan="3">Total</td><td>' + escapeHtml(formatAmountZero(entry.totalDebit)) + '</td><td>' + escapeHtml(formatAmountZero(entry.totalCredit)) + '</td>';
    tbody.appendChild(total);
    table.appendChild(tbody);
    elements.journalBody.appendChild(table);
    elements.journalModal.hidden = false;
  }

  function journalViewRow(line, debit, credit) {
    const row = document.createElement('tr');
    row.appendChild(cell(text(line && line.coa)));
    row.appendChild(cell(text(line && line.accountName)));
    row.appendChild(cellWithTitle(text(line && (line.memo || line.keterangan))));
    row.appendChild(cell(formatAmount(Number(debit || 0)) || '-', 'number'));
    row.appendChild(cell(formatAmount(Number(credit || 0)) || '-', 'number'));
    return row;
  }

  function closeJournalViewer() {
    if (!elements.journalModal) return;
    elements.journalModal.hidden = true;
    clearNode(elements.journalBody);
  }

  function showFileModal(entry) {
    clearNode(elements.fileViewer);
    setText(elements.fileTitle, text(entry.attachmentName, 'Lihat File'));
    setText(elements.fileMeta, 'Memuat file...');
    const loading = document.createElement('div');
    loading.className = 'cashbook-file-fallback';
    loading.textContent = 'Memuat file...';
    elements.fileViewer.appendChild(loading);
    elements.fileModal.hidden = false;
  }

  function closeFileModal() {
    elements.fileModal.hidden = true;
    clearNode(elements.fileViewer);
  }

  function renderFileViewer(file) {
    if (window.clientPortalRenderAttachmentViewer) {
      window.clientPortalRenderAttachmentViewer(elements.fileViewer, file, {
        titleEl: elements.fileTitle,
        metaEl: elements.fileMeta,
        label: 'Lihat File'
      });
      return;
    }
    const dataUrl = text(file.dataUrl);
    const mimeType = text(file.mimeType) || mimeTypeFromDataUrl(dataUrl);
    const fileName = text(file.name, 'lampiran');
    clearNode(elements.fileViewer);
    setText(elements.fileTitle, fileName);
    setText(elements.fileMeta, [mimeType || 'file', formatFileSize(file.size)].filter(Boolean).join(' | '));

    if (!dataUrl) {
      const empty = document.createElement('div');
      empty.className = 'cashbook-file-fallback';
      empty.textContent = 'File belum tersedia.';
      elements.fileViewer.appendChild(empty);
      return;
    }

    if (mimeType.startsWith('image/')) {
      const image = document.createElement('img');
      image.className = 'cashbook-file-image';
      image.src = dataUrl;
      image.alt = fileName;
      elements.fileViewer.appendChild(image);
      return;
    }

    if (mimeType === 'application/pdf') {
      const frame = document.createElement('iframe');
      frame.className = 'cashbook-file-frame';
      frame.src = dataUrl;
      frame.title = fileName;
      elements.fileViewer.appendChild(frame);
      return;
    }

    const fallback = document.createElement('div');
    fallback.className = 'cashbook-file-fallback';
    const textNode = document.createElement('p');
    textNode.textContent = 'File tersimpan, tetapi format ini tidak dapat ditampilkan langsung di browser.';
    const link = document.createElement('a');
    link.className = 'ghost-button cashbook-file-download';
    link.href = dataUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Buka File';
    fallback.appendChild(textNode);
    fallback.appendChild(link);
    elements.fileViewer.appendChild(fallback);
  }

  function mimeTypeFromDataUrl(dataUrl) {
    const match = /^data:([^;,]+)/i.exec(text(dataUrl));
    return match ? match[1].toLowerCase() : '';
  }

  applyPageLabels();

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadAdjustment);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.addButton) elements.addButton.addEventListener('click', openCreateModal);
  if (elements.searchInput) elements.searchInput.addEventListener('input', renderRows);
  [elements.dateSort, elements.paymentFilter, elements.documentFilter].forEach(function (control) {
    if (control) control.addEventListener('change', renderRows);
  });
  if (elements.closeButton) elements.closeButton.addEventListener('click', closeModal);
  if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeModal);
  if (elements.form) elements.form.addEventListener('submit', submitForm);
  if (elements.addDebitButton) elements.addDebitButton.addEventListener('click', function () { addJournalLine('debit'); });
  if (elements.addCreditButton) elements.addCreditButton.addEventListener('click', function () { addJournalLine('credit'); });
  if (elements.attachmentPickButton) {
    elements.attachmentPickButton.addEventListener('click', function () {
      if (elements.attachmentFile && !elements.attachmentFile.disabled) elements.attachmentFile.click();
    });
  }
  if (elements.attachmentFile) {
    elements.attachmentFile.addEventListener('change', queueSelectedAttachmentFiles);
    elements.attachmentFile.addEventListener('client-portal-upload-files', queueSelectedAttachmentFiles);
  }
  if (elements.attachmentList) {
    elements.attachmentList.addEventListener('click', function (event) {
      const remove = event.target.closest('[data-adjustment-remove-attachment]');
      if (remove) {
        event.preventDefault();
        event.stopPropagation();
        const key = remove.getAttribute('data-adjustment-remove-attachment');
        state.attachmentFiles = state.attachmentFiles.filter(function (file, index) {
          return attachmentFileKey(file, index) !== key;
        });
        state.attachmentDirty = true;
        renderAttachmentManager();
        return;
      }
      const preview = event.target.closest('[data-adjustment-preview-attachment]');
      if (preview) {
        const key = preview.getAttribute('data-adjustment-preview-attachment');
        const file = state.attachmentFiles.find(function (item, index) {
          return attachmentFileKey(item, index) === key;
        });
        previewQueuedAttachment(file).catch(function (err) {
          setAlert(err.message || 'Gagal membuka preview file.', 'error');
        });
      }
    });
  }
  if (elements.fileCloseButton) elements.fileCloseButton.addEventListener('click', closeFileModal);
  if (elements.journalCloseButton) elements.journalCloseButton.addEventListener('click', closeJournalViewer);
  if (elements.modal) {
    elements.modal.addEventListener('click', function (event) {
      if (event.target === elements.modal) closeModal();
    });
  }
  if (elements.fileModal) {
    elements.fileModal.addEventListener('click', function (event) {
      if (event.target === elements.fileModal) closeFileModal();
    });
  }
  if (elements.journalModal) {
    elements.journalModal.addEventListener('click', function (event) {
      if (event.target === elements.journalModal) closeJournalViewer();
    });
  }

  loadAdjustment();
})();
