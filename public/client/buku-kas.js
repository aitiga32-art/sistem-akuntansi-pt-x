(function () {
  const state = {
    client: null,
    cashBooks: [],
    activeCashBook: null,
    coaAccounts: [],
    entries: [],
    taxOptions: [],
    selectedIds: new Set(),
    loading: false,
    modalWindowBound: false,
    modalDrag: null,
    sort: null
  };

  const elements = {
    alert: document.getElementById('bukuKasAlert'),
    clientMeta: document.getElementById('bukuKasClientMeta'),
    userName: document.getElementById('bukuKasUserName'),
    userEmail: document.getElementById('bukuKasUserEmail'),
    refreshButton: document.getElementById('bukuKasRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('bukuKasBackLink'),
    title: document.querySelector('.portal-title'),
    subtitle: document.getElementById('bukuKasSubtitle'),
    addButton: document.getElementById('bukuKasAddBtn'),
    advanceButton: document.getElementById('bukuKasAdvanceBtn'),
    exportButton: document.getElementById('bukuKasExportBtn'),
    deleteSelectedButton: document.getElementById('bukuKasDeleteSelectedBtn'),
    selectAll: document.getElementById('bukuKasSelectAll'),
    totalMasuk: document.getElementById('bukuKasTotalMasuk'),
    totalKeluar: document.getElementById('bukuKasTotalKeluar'),
    totalSaldo: document.getElementById('bukuKasTotalSaldo'),
    coaCount: document.getElementById('bukuKasCoaCount'),
    rows: document.getElementById('bukuKasRows'),
    modal: document.getElementById('bukuKasModal'),
    form: document.getElementById('bukuKasForm'),
    modalTitle: document.getElementById('bukuKasModalTitle'),
    modalMeta: document.getElementById('bukuKasModalMeta'),
    closeButton: document.getElementById('bukuKasCloseBtn'),
    cancelButton: document.getElementById('bukuKasCancelBtn'),
    saveButton: document.getElementById('bukuKasSaveBtn'),
    entryId: document.getElementById('bukuKasEntryId'),
    detailRows: document.getElementById('bukuKasDetailRows'),
    addDetailRowButton: document.getElementById('bukuKasAddRowBtn'),
    tanggal: document.getElementById('bukuKasTanggal'),
    coa: document.getElementById('bukuKasCoa'),
    accountName: document.getElementById('bukuKasAccountName'),
    keterangan: document.getElementById('bukuKasKeterangan'),
    uangMasuk: document.getElementById('bukuKasUangMasuk'),
    uangKeluar: document.getElementById('bukuKasUangKeluar'),
    pajak: document.getElementById('bukuKasPajak'),
    attachmentFile: document.getElementById('bukuKasAttachmentFile'),
    attachmentNote: document.getElementById('bukuKasAttachmentNote'),
    fileModal: document.getElementById('bukuKasFileModal'),
    fileTitle: document.getElementById('bukuKasFileTitle'),
    fileMeta: document.getElementById('bukuKasFileMeta'),
    fileViewer: document.getElementById('bukuKasFileViewer'),
    fileCloseButton: document.getElementById('bukuKasFileCloseBtn')
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
      .replace(/'/g, '&#39;');
  }

  function formatDisplayDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '-' + match[2] + '-' + match[1] : raw;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function modalDialog() {
    return elements.modal?.querySelector('.portal-modal') || null;
  }

  function modalLimits() {
    const viewportWidth = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 1024);
    const viewportHeight = Math.max(320, window.innerHeight || document.documentElement.clientHeight || 768);
    return {
      margin: 16,
      minWidth: Math.min(680, viewportWidth - 32),
      minHeight: Math.min(420, viewportHeight - 32),
      maxWidth: Math.max(320, viewportWidth - 32),
      maxHeight: Math.max(320, viewportHeight - 32)
    };
  }

  function clampNumber(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  function resetModalWindow() {
    const dialog = modalDialog();
    if (!dialog) return;
    dialog.style.left = '';
    dialog.style.top = '';
    dialog.style.width = '';
    dialog.style.height = '';
    window.requestAnimationFrame(function () {
      if (!dialog || elements.modal.hidden) return;
      const limits = modalLimits();
      const rect = dialog.getBoundingClientRect();
      const width = clampNumber(rect.width || limits.maxWidth, limits.minWidth, limits.maxWidth);
      const height = clampNumber(rect.height || limits.maxHeight, limits.minHeight, limits.maxHeight);
      dialog.style.width = width + 'px';
      dialog.style.height = height + 'px';
      dialog.style.left = Math.max(limits.margin, Math.round((window.innerWidth - width) / 2)) + 'px';
      dialog.style.top = Math.max(limits.margin, Math.round((window.innerHeight - height) / 2)) + 'px';
      dialog.style.transform = 'none';
    });
  }

  function bindModalWindowControls() {
    const dialog = modalDialog();
    if (!dialog || state.modalWindowBound) return;
    state.modalWindowBound = true;
    const header = dialog.querySelector('.portal-modal-header');
    if (header) {
      header.addEventListener('pointerdown', startModalDrag);
      header.addEventListener('dblclick', resetModalWindow);
    }
    window.addEventListener('resize', keepModalInBounds);
  }

  function startModalDrag(event) {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest('button, input, select, textarea, a')) return;
    const dialog = modalDialog();
    if (!dialog || elements.modal.hidden) return;
    const rect = dialog.getBoundingClientRect();
    dialog.style.left = rect.left + 'px';
    dialog.style.top = rect.top + 'px';
    dialog.style.width = rect.width + 'px';
    dialog.style.height = rect.height + 'px';
    dialog.style.transform = 'none';
    state.modalDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top
    };
    dialog.classList.add('is-dragging');
    event.currentTarget.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', moveModalDrag);
    window.addEventListener('pointerup', stopModalDrag);
    window.addEventListener('pointercancel', stopModalDrag);
    event.preventDefault();
  }

  function moveModalDrag(event) {
    const drag = state.modalDrag;
    const dialog = modalDialog();
    if (!drag || !dialog) return;
    const limits = modalLimits();
    const width = dialog.offsetWidth || limits.minWidth;
    const height = dialog.offsetHeight || limits.minHeight;
    const maxLeft = Math.max(limits.margin, window.innerWidth - width - limits.margin);
    const maxTop = Math.max(limits.margin, window.innerHeight - Math.min(80, height) - limits.margin);
    dialog.style.left = clampNumber(drag.startLeft + event.clientX - drag.startX, limits.margin, maxLeft) + 'px';
    dialog.style.top = clampNumber(drag.startTop + event.clientY - drag.startY, limits.margin, maxTop) + 'px';
  }

  function stopModalDrag() {
    const dialog = modalDialog();
    state.modalDrag = null;
    if (dialog) dialog.classList.remove('is-dragging');
    window.removeEventListener('pointermove', moveModalDrag);
    window.removeEventListener('pointerup', stopModalDrag);
    window.removeEventListener('pointercancel', stopModalDrag);
    keepModalInBounds();
  }

  function keepModalInBounds() {
    const dialog = modalDialog();
    if (!dialog || elements.modal.hidden) return;
    const limits = modalLimits();
    const rect = dialog.getBoundingClientRect();
    const width = clampNumber(rect.width, limits.minWidth, limits.maxWidth);
    const height = clampNumber(rect.height, limits.minHeight, limits.maxHeight);
    dialog.style.width = width + 'px';
    dialog.style.height = height + 'px';
    dialog.style.left = clampNumber(rect.left, limits.margin, Math.max(limits.margin, window.innerWidth - width - limits.margin)) + 'px';
    dialog.style.top = clampNumber(rect.top, limits.margin, Math.max(limits.margin, window.innerHeight - Math.min(80, height) - limits.margin)) + 'px';
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
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/buku-kas/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/buku-kas';
  }

  function activeCashBookKey() {
    return text(state.activeCashBook?.key) || text(new URLSearchParams(window.location.search).get('cash'), 'kas-kecil');
  }

  function isTbbClient() {
    return /tiga\s+belas\s+bersaudara/i.test(text(state.client?.name)) || activeCashBookKey().indexOf('tbb-') === 0;
  }

  function isHtiClient() {
    const clientName = text(state.client?.name).toUpperCase();
    return clientName === 'PT X' || /PT\s*X/.test(clientName);
  }

  function useDebitCreditLabels() {
    return isHtiClient() && !isTbbClient();
  }

  function moneyInLabel() {
    return useDebitCreditLabels() ? 'Debit' : 'Uang Masuk';
  }

  function moneyOutLabel() {
    return useDebitCreditLabels() ? 'Kredit' : 'Uang Keluar';
  }

  function amountSideHint() {
    return moneyInLabel() + ' atau ' + moneyOutLabel();
  }

  function applyAmountLabels() {
    setText(elements.totalMasuk?.closest('th')?.querySelector('.sales-head-label'), moneyInLabel());
    setText(elements.totalKeluar?.closest('th')?.querySelector('.sales-head-label'), moneyOutLabel());
    const detailHeads = elements.form?.querySelectorAll('.bankbook-detail-table thead th');
    if (detailHeads?.length >= 6) {
      detailHeads[4].textContent = moneyInLabel();
      detailHeads[5].textContent = moneyOutLabel();
    }
  }

  function canDeleteTbbMirrorSource(entry) {
    return Boolean(entry && entry.isAutoMirror && entry.canDeleteMirrorSource);
  }

  function isHtiPaymentMirror(entry) {
    return Boolean(entry && entry.isAutoMirror && [
      'hti_sales',
      'hti_purchase_fp',
      'hti_purchase_non_ppn'
    ].includes(text(entry.mirrorSourceTable)));
  }

  function isHtiAdvance(entry) {
    return Boolean(entry && entry.isHtiAdvance);
  }

  function isHtiExpense(entry) {
    return Boolean(entry && entry.isHtiExpense && entry.htiExpenseId);
  }

  function isHtiTfGabMirror(entry) {
    return isHtiPaymentMirror(entry) && /(?:^|\|)\s*TF\s*GAB\s*:/i.test(text(entry.keterangan));
  }

  function htiPaymentSourceSlug(entry) {
    return {
      hti_sales: 'hti-buku-penjualan',
      hti_purchase_fp: 'hti-buku-pembelian-fp',
      hti_purchase_non_ppn: 'hti-buku-pembelian-non-ppn'
    }[text(entry && entry.mirrorSourceTable)] || '';
  }

  function htiPaymentSourceUrl(entry) {
    if (isHtiExpense(entry)) {
      const clientId = text(state.client && state.client.id);
      const expenseId = text(entry && entry.htiExpenseId);
      if (!clientId || !expenseId) return '';
      const url = new URL('/app/client/clients/' + encodeURIComponent(clientId) + '/pt-x-biaya', window.location.origin);
      url.searchParams.set('openExpense', expenseId);
      url.searchParams.set('fromMutation', '1');
      url.searchParams.set('embeddedExpense', '1');
      return url.pathname + url.search;
    }
    const slug = htiPaymentSourceSlug(entry);
    const sourceId = text(entry && entry.mirrorSourceId);
    const clientId = text(state.client && state.client.id);
    if (!slug || !sourceId || !clientId) return '';
    const url = new URL('/app/client/clients/' + encodeURIComponent(clientId) + '/' + slug, window.location.origin);
    url.searchParams.set('openPayment', sourceId);
    url.searchParams.set('paymentMode', 'edit');
    url.searchParams.set('fromMutation', '1');
    url.searchParams.set('embeddedPayment', '1');
    const paymentAmount = Math.max(Number(entry.uangMasuk || 0), Number(entry.uangKeluar || 0));
    if (text(entry.tanggal)) url.searchParams.set('paymentDate', text(entry.tanggal));
    if (paymentAmount > 0) url.searchParams.set('paymentAmount', String(paymentAmount));
    if (text(entry.cashBookKey || activeCashBookKey())) url.searchParams.set('paymentSourceKey', text(entry.cashBookKey || activeCashBookKey()));
    if (text(state.activeCashBook && state.activeCashBook.label)) url.searchParams.set('paymentSource', text(state.activeCashBook.label));
    if (text(entry && entry.mirrorSourceDetailKey)) {
      url.searchParams.set('paymentRow', text(entry.mirrorSourceDetailKey));
    }
    return url.pathname + url.search;
  }

  function tbbBookOptionsHtml(selectedValue) {
    const selected = text(selectedValue, activeCashBookKey());
    return [
      ['tbb-bank-bca', 'BANK BCA'],
      ['tbb-bank-bca-fetty', 'BANK BCA CabangContoh'],
      ['tbb-kas', 'KAS']
    ].map(function (item) {
      return '<option value="' + item[0] + '"' + (item[0] === selected ? ' selected' : '') + '>' + item[1] + '</option>';
    }).join('');
  }

  function ensureTbbBookSwitch() {
    const grid = elements.form?.querySelector('.cashbook-form-grid');
    if (!grid) return;
    let wrapper = document.getElementById('bukuKasTbbBookSwitchField');
    if (!isTbbClient()) {
      if (wrapper) wrapper.remove();
      return;
    }
    if (!wrapper) {
      wrapper = document.createElement('label');
      wrapper.className = 'form-field full';
      wrapper.id = 'bukuKasTbbBookSwitchField';
      wrapper.innerHTML = '<span>Jenis Bank</span><select id="bukuKasTbbBookSwitch"></select>';
      grid.insertBefore(wrapper, grid.firstChild);
      wrapper.querySelector('select').addEventListener('change', function (event) {
        const value = event.target.value;
        if (value === 'tbb-kas') return;
        if (state.client?.id) {
          window.location.assign('/app/client/clients/' + encodeURIComponent(state.client.id) + '/buku-bank?bank=' + encodeURIComponent(value));
        }
      });
    }
    wrapper.querySelector('select').innerHTML = tbbBookOptionsHtml('tbb-kas');
  }

  function removeTbbBookSwitch() {
    const wrapper = document.getElementById('bukuKasTbbBookSwitchField');
    if (wrapper) wrapper.remove();
  }

  function tbbKasSourceAccount() {
    return {
      coa: text(state.activeCashBook?.sourceCoa, '1-0100'),
      accountName: text(state.activeCashBook?.sourceAccountName, 'KAS')
    };
  }

  function tbbKasBookLabel() {
    return text(state.activeCashBook?.label, 'KAS');
  }

  function tbbKasBookCode() {
    return text(tbbKasSourceAccount().coa) + ' - ' + text(tbbKasSourceAccount().accountName);
  }

  function apiListUrl() {
    return apiBase() + '?cash=' + encodeURIComponent(activeCashBookKey());
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Buku Kas.');
    return data;
  }

  async function loadBukuKas() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiListUrl());
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      state.cashBooks = Array.isArray(data.cashBooks) ? data.cashBooks : [];
      state.activeCashBook = data.activeCashBook || state.cashBooks[0] || null;
      state.coaAccounts = Array.isArray(data.coaAccounts) ? data.coaAccounts : [];
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.taxOptions = Array.isArray(data.taxOptions) ? data.taxOptions : [];
      state.selectedIds.clear();
      renderClient();
      renderSelects();
      renderRows();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Buku Kas.', 'error');
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

  function openHtiAdvanceInput() {
    if (!isHtiClient() || !state.client?.id) return;
    window.location.assign('/app/client/clients/' + encodeURIComponent(state.client.id) + '/buku-bank?openAdvance=1&source=kas-kecil');
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
    const bookLabel = text(state.activeCashBook?.label, 'Buku Kas');
    document.body.classList.toggle('is-tbb-cashbook', isTbbClient());
    document.body.classList.toggle('is-hti-cashbook', isHtiClient() && !isTbbClient());
    if (elements.addButton) elements.addButton.hidden = isHtiClient() && !isTbbClient();
    if (elements.deleteSelectedButton) elements.deleteSelectedButton.hidden = isHtiClient() && !isTbbClient();
    if (elements.advanceButton) elements.advanceButton.hidden = true;
    if (elements.coaCount) elements.coaCount.hidden = isHtiClient() && !isTbbClient();
    applyAmountLabels();
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.title, bookLabel);
    setText(elements.subtitle, isHtiClient() && !isTbbClient()
      ? text(client.name, 'Klien') + ' | ' + bookLabel + ' | Cek mutasi kas kecil terkontrol'
      : text(client.name, 'Klien') + ' | ' + bookLabel + ' | Database COA dan Buku Kas client portal');
    setText(elements.coaCount, state.coaAccounts.length + ' COA');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function renderSelects() {
    if (elements.coa) {
      clearNode(elements.coa);
      const emptyCoa = document.createElement('option');
      emptyCoa.value = '';
      emptyCoa.textContent = 'Pilih COA';
      elements.coa.appendChild(emptyCoa);
      state.coaAccounts.forEach(function (account) {
        const option = document.createElement('option');
        option.value = account.coa;
        option.textContent = account.coa + ' - ' + account.accountName;
        elements.coa.appendChild(option);
      });
    }

    if (elements.pajak) {
      clearNode(elements.pajak);
      const emptyTax = document.createElement('option');
      emptyTax.value = '';
      emptyTax.textContent = 'Pilih pajak';
      elements.pajak.appendChild(emptyTax);
      state.taxOptions.forEach(function (tax) {
        const option = document.createElement('option');
        option.value = tax;
        option.textContent = tax;
        elements.pajak.appendChild(option);
      });
    }
  }

  function renderRows() {
    clearNode(elements.rows);
    const entries = sortedEntries(state.entries);
    const validIds = new Set(state.entries.map(function (entry) {
      return text(entry.id);
    }));
    state.selectedIds.forEach(function (id) {
      if (!validIds.has(id)) state.selectedIds.delete(id);
    });
    entries.forEach(function (entry) {
      elements.rows.appendChild(entryRow(entry));
    });

    const blankCount = Math.max(12 - entries.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
    renderHeaderTotals();
    syncSelectionControls();
    updateSortHeaderState();
  }

  function compareValues(left, right, direction) {
    const multiplier = direction === 'desc' ? -1 : 1;
    if (typeof left === 'number' || typeof right === 'number') {
      return ((Number(left || 0) - Number(right || 0)) || 0) * multiplier;
    }
    return text(left).localeCompare(text(right), 'id', { numeric: true, sensitivity: 'base' }) * multiplier;
  }

  function dateRank(value) {
    const stamp = Date.parse(text(value).slice(0, 10));
    return Number.isFinite(stamp) ? stamp : 0;
  }

  function sortValue(entry, key) {
    return {
      tanggal: dateRank(entry.tanggal),
      coa: entry.coa,
      accountName: entry.accountName,
      keterangan: entry.keterangan,
      uangMasuk: Number(entry.uangMasuk || 0),
      uangKeluar: Number(entry.uangKeluar || 0),
      saldo: Number(entry.saldo || 0),
      pajak: entry.pajak
    }[key];
  }

  function sortedEntries(entries) {
    if (!state.sort || !state.sort.key) return entries.slice();
    return entries.slice().sort(function (left, right) {
      return compareValues(sortValue(left, state.sort.key), sortValue(right, state.sort.key), state.sort.direction)
        || (dateRank(right.tanggal) - dateRank(left.tanggal));
    });
  }

  function setupSortHeaders() {
    const table = elements.rows?.closest('table');
    if (!table) return;
    const keys = ['', '', 'tanggal', 'coa', 'accountName', 'keterangan', 'uangMasuk', 'uangKeluar', 'saldo', 'pajak', '', ''];
    Array.from(table.querySelectorAll('thead th')).forEach(function (header, index) {
      const key = keys[index];
      if (!key) return;
      header.setAttribute('data-cash-sort-key', key);
      header.setAttribute('tabindex', '0');
      header.classList.add('client-sortable-head');
      header.title = 'Klik untuk sort data';
    });
    updateSortHeaderState();
  }

  function updateSortHeaderState() {
    document.querySelectorAll('[data-cash-sort-key]').forEach(function (header) {
      const active = state.sort && state.sort.key === header.getAttribute('data-cash-sort-key');
      header.classList.toggle('is-sorted-asc', Boolean(active && state.sort.direction === 'asc'));
      header.classList.toggle('is-sorted-desc', Boolean(active && state.sort.direction === 'desc'));
      header.setAttribute('aria-sort', active ? (state.sort.direction === 'asc' ? 'ascending' : 'descending') : 'none');
    });
  }

  function setSort(key) {
    const current = state.sort;
    const defaultDirection = /tanggal|masuk|keluar|saldo/i.test(key) ? 'desc' : 'asc';
    state.sort = current && current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: defaultDirection };
    renderRows();
  }

  function entryRow(entry) {
    const row = document.createElement('tr');
    if (isTbbClient()) {
      row.className = 'tbb-cash-display-row';
      row.title = 'Klik untuk melihat jurnal';
      row.setAttribute('tabindex', '0');
      row.addEventListener('click', function (event) {
        if (event.target.closest('button, input, select, a, .cashbook-actions')) return;
        openJournalModal(entry);
      });
      row.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.target.closest('button, input, select, a, .cashbook-actions')) return;
        event.preventDefault();
        openJournalModal(entry);
      });
    } else {
      row.className = 'bankbook-clickable-row';
      row.title = 'Klik sekali untuk melihat data';
      row.setAttribute('tabindex', '0');
      row.addEventListener('click', function (event) {
        if (event.target.closest('button, input, select, a, .cashbook-actions')) return;
        openViewOnlyModal(entry);
      });
      row.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.target.closest('button, input, select, a, .cashbook-actions')) return;
        event.preventDefault();
        openViewOnlyModal(entry);
      });
    }
    row.appendChild(selectCell(entry));
    row.appendChild(businessEntityCell(entry));
    row.appendChild(cell(formatDisplayDate(entry.tanggal)));
    row.appendChild(cell(entry.coa));
    row.appendChild(cell(entry.accountName));
    row.appendChild(cellWithTitle(entry.keterangan));
    row.appendChild(cell(formatAmount(entry.uangMasuk), 'number'));
    row.appendChild(cell(formatAmount(entry.uangKeluar), 'number'));
    row.appendChild(cell(formatAmount(entry.saldo), 'number'));
    row.appendChild(taxCell(entry));
    row.appendChild(documentStatusCell(entry));

    const actionCell = document.createElement('td');
    actionCell.className = 'cashbook-actions';
    const canDeleteMirror = canDeleteTbbMirrorSource(entry);
    const canEditMirror = isHtiPaymentMirror(entry);
    const autoMirrorReason = canDeleteMirror
      ? (canEditMirror
        ? 'Ubah atau hapus akan memperbarui pelunasan PT X dan jurnal sumbernya.'
        : 'Hapus akan menghapus pelunasan DEMO_DISTRIBUTION dari transaksi sumbernya.')
      : 'Data otomatis dari lawan jurnal. Ubah atau hapus data sumbernya.';
    if (entry.isAutoMirror) {
      actionCell.title = autoMirrorReason;
    }
    if (isHtiClient() && !isTbbClient()) {
      actionCell.appendChild(actionButton('Lihat', function () {
        openViewOnlyModal(entry);
      }));
      row.appendChild(actionCell);
      return row;
    }
    actionCell.appendChild(actionButton('Ubah', function () {
      openEditModal(entry);
    }, entry.isAutoMirror && !canEditMirror, '', autoMirrorReason));
    if (entry.hasAttachment) {
      actionCell.appendChild(actionButton('Lihat', function () {
        openFileViewer(entry);
      }));
    }
    actionCell.appendChild(actionButton('Hapus', function () {
      deleteEntry(entry);
    }, entry.isAutoMirror && !canDeleteMirror, 'danger', autoMirrorReason));
    row.appendChild(actionCell);
    return row;
  }

  function blankRow() {
    const row = document.createElement('tr');
    for (let index = 0; index < 12; index += 1) {
      if (index === 9) row.appendChild(taxCell(null, true));
      else if (index === 10) row.appendChild(cell('', 'bankbook-document-cell'));
      else if (index === 11) row.appendChild(cell('', 'cashbook-actions'));
      else row.appendChild(cell(''));
    }
    return row;
  }

  function businessEntityCell(entry) {
    return cellWithTitle(entry?.businessEntityName || entry?.businessEntityKey || '', 'client-entity-column');
  }

  function selectCell(entry) {
    const td = document.createElement('td');
    td.className = 'sales-select-cell';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'sales-row-checkbox';
    checkbox.disabled = Boolean(entry.isAutoMirror || isHtiClient());
    if (entry.isAutoMirror || isHtiClient()) checkbox.title = 'Mutasi kas kecil PT X hanya bisa dilihat. Koreksi dilakukan dari transaksi sumbernya.';
    checkbox.checked = state.selectedIds.has(text(entry.id));
    checkbox.setAttribute('aria-label', 'Pilih data Buku Kas ' + text(entry.tanggal, entry.coa));
    checkbox.addEventListener('change', function () {
      const id = text(entry.id);
      if (checkbox.checked) state.selectedIds.add(id);
      else state.selectedIds.delete(id);
      syncSelectionControls();
    });
    td.appendChild(checkbox);
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

  function documentStatusCell(entry) {
    const td = document.createElement('td');
    td.className = 'bankbook-document-cell';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.disabled = true;
    checkbox.checked = Boolean(entry && entry.hasAttachment);
    checkbox.setAttribute('aria-label', checkbox.checked ? 'Dokumen terupload' : 'Dokumen belum terupload');
    checkbox.title = checkbox.checked
      ? 'Dokumen terupload: ' + text(entry.attachmentName, 'lampiran')
      : 'Belum ada dokumen terupload';
    td.appendChild(checkbox);
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

  function renderHeaderTotals() {
    const totalMasuk = state.entries.reduce(function (total, entry) {
      return total + Number(entry.uangMasuk || 0);
    }, 0);
    const totalKeluar = state.entries.reduce(function (total, entry) {
      return total + Number(entry.uangKeluar || 0);
    }, 0);
    const lastEntry = state.entries[state.entries.length - 1] || {};
    setHeaderTotalValue(elements.totalMasuk, totalMasuk, 'debit');
    setHeaderTotalValue(elements.totalKeluar, totalKeluar, 'neutral');
    setHeaderTotalValue(elements.totalSaldo, Number(lastEntry.saldo || 0), 'neutral');
  }

  function setHeaderTotalValue(element, amount, tone) {
    const value = Number(amount || 0);
    setText(element, formatAmount(value) || '0');
    if (!element) return;
    element.classList.remove('is-positive-debit', 'is-negative-cash', 'is-neutral-cash');
    if (value < 0) {
      element.classList.add('is-negative-cash');
    } else if (tone === 'debit' && value > 0) {
      element.classList.add('is-positive-debit');
    } else {
      element.classList.add('is-neutral-cash');
    }
  }

  function syncSelectionControls() {
    const selectedCount = state.selectedIds.size;
    if (elements.deleteSelectedButton) {
      elements.deleteSelectedButton.disabled = selectedCount === 0;
      elements.deleteSelectedButton.textContent = selectedCount ? 'Hapus Terpilih (' + selectedCount + ')' : 'Hapus Terpilih';
    }
    if (elements.selectAll) {
      const selectableEntries = state.entries.filter(function (entry) {
        return !entry.isAutoMirror && !isHtiClient();
      });
      const selectedSelectableCount = selectableEntries.filter(function (entry) {
        return state.selectedIds.has(text(entry.id));
      }).length;
      const selectableCount = selectableEntries.length;
      elements.selectAll.checked = selectableCount > 0 && selectedSelectableCount === selectableCount;
      elements.selectAll.indeterminate = selectedSelectableCount > 0 && selectedSelectableCount < selectableCount;
      elements.selectAll.disabled = selectableCount === 0;
    }
  }

  function toggleSelectAll() {
    if (!elements.selectAll) return;
    state.selectedIds.clear();
    if (elements.selectAll.checked) {
      state.entries.forEach(function (entry) {
        if (!entry.isAutoMirror && !isHtiClient()) state.selectedIds.add(text(entry.id));
      });
    }
    renderRows();
  }

  function taxCell(entry, disabled) {
    const td = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'cashbook-tax-select';
    select.disabled = Boolean(disabled || !entry || entry.isAutoMirror || isHtiClient());
    if (entry && entry.isAutoMirror) {
      select.title = 'Data otomatis dari lawan jurnal. Ubah pilihan pajak dari data sumbernya.';
    }
    appendTaxOption(select, '', '');
    state.taxOptions.forEach(function (tax) {
      appendTaxOption(select, tax, tax);
    });
    select.value = entry ? (entry.pajak || '') : '';
    if (entry) {
      select.addEventListener('change', function () {
        updateEntryTax(entry, select.value, select);
      });
    }
    td.appendChild(select);
    return td;
  }

  function appendTaxOption(select, value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  function formatAmount(value) {
    const number = Number(value || 0);
    return number ? currency.format(number) : '';
  }

  function slugFilePart(value, fallback) {
    return text(value, fallback || 'data').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || (fallback || 'data');
  }

  function exportWorkbook(fileName, sheetName, rows) {
    if (window.XLSX) {
      const workbook = window.XLSX.utils.book_new();
      const sheet = window.XLSX.utils.aoa_to_sheet(rows);
      window.XLSX.utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
      window.XLSX.writeFile(workbook, fileName + '.xlsx');
      return;
    }
    const htmlRows = rows.map(function (row) {
      return '<tr>' + row.map(function (cellValue) {
        return '<td>' + escapeHtml(cellValue) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    const blob = new Blob(['\ufeff<table>' + htmlRows + '</table>'], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName + '.xls';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function exportRows() {
    const rows = [
      ['Tanggal', 'COA', 'Nama Akun', 'Keterangan', moneyInLabel(), moneyOutLabel(), 'Saldo', 'Pajak']
    ].concat(sortedEntries(state.entries).map(function (entry) {
      return [
        formatDisplayDate(entry.tanggal),
        entry.coa,
        entry.accountName,
        entry.keterangan,
        Number(entry.uangMasuk || 0),
        Number(entry.uangKeluar || 0),
        Number(entry.saldo || 0),
        entry.pajak || ''
      ];
    }));
    exportWorkbook(
      'buku-kas-' + slugFilePart(state.client?.name, 'client') + '-' + slugFilePart(state.activeCashBook?.label, 'kas') + '-' + today(),
      'buku_kas',
      rows
    );
  }

  function parseAmountInput(input) {
    const value = input && input.value != null ? input.value : input;
    if (window.clientParseMoneyInput) return window.clientParseMoneyInput(value);
    if (value == null || value === '') return 0;
    const cleaned = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : 0;
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

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function cashAccountByValue(value) {
    const key = text(value).toUpperCase();
    if (!key) return null;
    return state.coaAccounts.find(function (account) {
      return text(account.coa).toUpperCase() === key || text(account.accountName).toUpperCase() === key;
    }) || null;
  }

  function cashAccountOptions(selectedValue, mode) {
    const selectedAccount = cashAccountByValue(selectedValue);
    const selectedCoa = text(selectedAccount?.coa, selectedValue);
    const placeholder = mode === 'name' ? 'Pilih nama akun' : 'Pilih nomor akun';
    const options = ['<option value="">' + escapeHtml(placeholder) + '</option>'];
    state.coaAccounts.forEach(function (account) {
      const value = text(account.coa);
      const label = mode === 'name' ? text(account.accountName, value) : value;
      options.push('<option value="' + escapeHtml(value) + '"' +
        (value === selectedCoa ? ' selected' : '') + '>' + escapeHtml(label) + '</option>');
    });
    return options.join('');
  }

  function cashTaxOptions(selectedValue) {
    const selected = text(selectedValue);
    return ['<option value="">-</option>'].concat(state.taxOptions.map(function (tax) {
      return '<option value="' + escapeHtml(tax) + '"' +
        (tax === selected ? ' selected' : '') + '>' + escapeHtml(tax) + '</option>';
    })).join('');
  }

  function cashDetailDateValue(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : raw;
  }

  function cashDetailRowHtml(entry) {
    const row = entry || {};
    const account = cashAccountByValue(row.coa || row.accountName);
    const coa = text(account?.coa, row.coa);
    return '<tr class="bankbook-detail-row">' +
      '<td><input data-cash-detail-field="tanggal" type="date" value="' + escapeHtml(cashDetailDateValue(row.tanggal)) + '" aria-label="Tanggal"></td>' +
      '<td><select data-cash-detail-field="coa" aria-label="Nomor akun">' + cashAccountOptions(coa, 'coa') + '</select></td>' +
      '<td><select data-cash-detail-field="accountName" aria-label="Nama akun">' + cashAccountOptions(coa, 'name') + '</select></td>' +
      '<td><input data-cash-detail-field="keterangan" type="text" value="' + escapeHtml(row.keterangan || row.description || '') + '" autocomplete="off" aria-label="Keterangan"></td>' +
      '<td><input data-cash-detail-field="uangMasuk" type="text" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatAmount(row.uangMasuk)) + '" autocomplete="off" aria-label="Uang masuk"></td>' +
      '<td><input data-cash-detail-field="uangKeluar" type="text" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatAmount(row.uangKeluar)) + '" autocomplete="off" aria-label="Uang keluar"></td>' +
      '<td><select data-cash-detail-field="pajak" aria-label="Pajak">' + cashTaxOptions(row.pajak) + '</select></td>' +
      '<td class="bankbook-detail-action"><button class="icon-button" type="button" data-cash-detail-remove aria-label="Hapus baris" title="Hapus baris">' +
        '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      '</button></td>' +
      '</tr>';
  }

  function appendCashDetailRow(values) {
    if (!elements.detailRows) return null;
    const template = document.createElement('template');
    template.innerHTML = cashDetailRowHtml(values || { tanggal: today() });
    const row = template.content.firstElementChild;
    elements.detailRows.appendChild(row);
    row.querySelectorAll('[data-cash-detail-field="coa"], [data-cash-detail-field="accountName"]').forEach(function (control) {
      control.addEventListener('change', function () {
        syncCashDetailAccount(row, control.value);
      });
    });
    return row;
  }

  function resetCashDetailRows(entry) {
    clearNode(elements.detailRows);
    appendCashDetailRow(entry || { tanggal: today() });
  }

  function syncCashDetailAccount(row, value) {
    if (!row) return;
    const account = cashAccountByValue(value);
    const coaSelect = row.querySelector('[data-cash-detail-field="coa"]');
    const nameSelect = row.querySelector('[data-cash-detail-field="accountName"]');
    const selectedCoa = text(account?.coa, value);
    if (coaSelect) coaSelect.value = selectedCoa;
    if (nameSelect) nameSelect.value = selectedCoa;
  }

  function collectCashDetailRows() {
    return Array.from(elements.detailRows?.querySelectorAll('.bankbook-detail-row') || [])
      .map(function (row, index) {
        const field = function (name) {
          return row.querySelector('[data-cash-detail-field="' + name + '"]');
        };
        const coa = text(field('coa')?.value);
        const account = cashAccountByValue(coa || field('accountName')?.value);
        return {
          rowNumber: index + 1,
          tanggal: text(field('tanggal')?.value),
          coa: text(account?.coa, coa),
          accountName: text(account?.accountName),
          keterangan: text(field('keterangan')?.value),
          uangMasuk: parseAmountInput(field('uangMasuk')),
          uangKeluar: parseAmountInput(field('uangKeluar')),
          pajak: text(field('pajak')?.value)
        };
      })
      .filter(function (row) {
        return text(row.coa) || text(row.keterangan) || row.uangMasuk || row.uangKeluar || text(row.pajak);
      });
  }

  function selectedCoaAccount() {
    const coa = text(elements.coa?.value);
    return state.coaAccounts.find(function (account) {
      return account.coa === coa;
    }) || null;
  }

  function syncSelectedAccountName() {
    const account = selectedCoaAccount();
    if (elements.accountName) elements.accountName.value = account ? account.accountName : '';
  }

  function tbbKasNoBuktiPrefix() {
    const source = tbbKasSourceAccount();
    return text(source.accountName, 'KAS').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'KAS';
  }

  function tbbKasExistingNoBukti(entry) {
    const candidates = [
      entry?.noBukti,
      entry?.no_bukti,
      entry?.nomorBukti,
      entry?.keterangan,
      entry?.description
    ];
    for (const candidate of candidates) {
      const match = text(candidate).match(/\bDEMO_DISTRIBUTION-[A-Z0-9-]+-\d{8}(?:-\d{3})?\b/i);
      if (match) return match[0].toUpperCase();
    }
    return '';
  }

  function tbbKasNoBuktiIndex(noBukti, base) {
    const value = text(noBukti).toUpperCase();
    if (value === base) return 1;
    if (value.indexOf(base + '-') !== 0) return 0;
    const suffix = value.slice(base.length + 1);
    return /^\d+$/.test(suffix) ? Number(suffix) : 0;
  }

  function tbbKasNoBukti(dateValue, currentEntryId) {
    const date = text(dateValue, today()).replace(/-/g, '');
    const base = 'DEMO_DISTRIBUTION-' + tbbKasNoBuktiPrefix() + '-' + date;
    const currentId = text(currentEntryId);
    const maxIndex = (state.entries || []).reduce(function (max, entry) {
      if (currentId && text(entry.id) === currentId) return max;
      return Math.max(max, tbbKasNoBuktiIndex(tbbKasExistingNoBukti(entry), base));
    }, 0);
    return base + '-' + String(maxIndex + 1).padStart(3, '0');
  }

  function tbbKasNoBuktiForEntry(entry, dateValue) {
    return tbbKasExistingNoBukti(entry) || tbbKasNoBukti(dateValue, entry?.id);
  }

  function setNativeKasFormVisible(visible) {
    const grid = elements.form?.querySelector('.cashbook-form-grid');
    if (!grid) return;
    elements.form.classList.toggle('is-tbb-kas-custom-form', !visible);
    grid.hidden = !visible;
    grid.style.display = visible ? '' : 'none';
    if (visible) {
      grid.removeAttribute('aria-hidden');
    } else {
      grid.setAttribute('aria-hidden', 'true');
    }
    grid.querySelectorAll('input, select, textarea').forEach(function (control) {
      control.disabled = !visible;
    });
    if (visible) {
      elements.form.querySelectorAll('[data-tbb-kas-form], [data-tbb-kas-journal]').forEach(function (panel) {
        panel.remove();
      });
    }
  }

  function tbbKasCoaOptions(selectedValue) {
    const selected = text(selectedValue);
    return ['<option value="">Pilih akun lawan</option>'].concat(state.coaAccounts.map(function (account) {
      const value = text(account.coa);
      return '<option value="' + escapeHtml(value) + '"' + (value === selected ? ' selected' : '') + '>' +
        escapeHtml(value + ' - ' + text(account.accountName)) +
      '</option>';
    })).join('');
  }

  function isTbbFixedAssetCoa(coa) {
    return ['1-1101', '1-1102', '1-1103', '1-1106'].includes(text(coa).toUpperCase());
  }

  function assertNotTbbFixedAssetRow(row) {
    if (isTbbClient() && isTbbFixedAssetCoa(row.coa)) {
      throw new Error('Baris ' + row.rowNumber + ': transaksi aset tetap diinput melalui Buku Aktiva.');
    }
  }

  function tbbKasRowHtml(entry) {
    const row = entry || {};
    return '<div class="tbb-kas-input-row">' +
      '<select data-tbb-kas-field="coa" required>' + tbbKasCoaOptions(row.coa) + '</select>' +
      '<input data-tbb-kas-field="keterangan" value="' + escapeHtml(row.keterangan || '') + '" autocomplete="off">' +
      '<input data-tbb-kas-field="uangMasuk" data-rupiah="true" inputmode="decimal" value="' + escapeHtml(formatAmount(row.uangMasuk)) + '">' +
      '<input data-tbb-kas-field="uangKeluar" data-rupiah="true" inputmode="decimal" value="' + escapeHtml(formatAmount(row.uangKeluar)) + '">' +
      '<button class="icon-button tbb-kas-remove-row" type="button" data-tbb-kas-remove-row aria-label="Hapus baris"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>' +
    '</div>';
  }

  function setTbbKasReadOnly(panel, readOnly) {
    panel.classList.toggle('is-readonly', Boolean(readOnly));
    panel.setAttribute('data-readonly', readOnly ? 'true' : 'false');
    panel.querySelectorAll('input, textarea').forEach(function (control) {
      if (control.type === 'checkbox') control.disabled = Boolean(readOnly);
      else control.readOnly = Boolean(readOnly);
    });
    panel.querySelectorAll('select').forEach(function (control) {
      control.disabled = Boolean(readOnly);
    });
    panel.querySelectorAll('[data-tbb-kas-add-row], [data-tbb-kas-remove-row], [data-tbb-kas-select-file], [data-tbb-kas-upload-qr], [data-tbb-kas-clear-file]').forEach(function (button) {
      button.hidden = Boolean(readOnly);
      button.disabled = Boolean(readOnly);
    });
    elements.saveButton.hidden = Boolean(readOnly);
    elements.cancelButton.textContent = readOnly ? 'Tutup' : 'Batal';
  }

  function renderTbbKasInputForm(entry, readOnly) {
    setNativeKasFormVisible(false);
    let panel = elements.form.querySelector('[data-tbb-kas-form]');
    if (panel) panel.remove();
    const dateValue = text(entry?.tanggal, today());
    const footer = elements.form.querySelector('.portal-modal-footer');
    panel = document.createElement('section');
    panel.className = 'tbb-kas-entry-form';
    panel.setAttribute('data-tbb-kas-form', 'true');
    panel.innerHTML = [
      '<div class="tbb-kas-input-top">',
        '<label><span>Tanggal</span><input data-tbb-kas-header="tanggal" type="date" value="' + escapeHtml(dateValue) + '" required></label>',
        '<label><span>No. Bukti</span><input data-tbb-kas-header="noBukti" value="' + escapeHtml(tbbKasNoBuktiForEntry(entry, dateValue)) + '" readonly></label>',
        '<label><span>Jenis Buku</span><select data-tbb-kas-header="book">' + tbbBookOptionsHtml('tbb-kas') + '</select></label>',
        '<div class="tbb-kas-source-pill"><span>Akun Buku</span><strong>' + escapeHtml(tbbKasBookLabel()) + '</strong><small>' + escapeHtml(tbbKasBookCode()) + '</small></div>',
      '</div>',
      '<div class="tbb-kas-input-detail">',
        '<div class="tbb-kas-input-toolbar">',
          '<div><strong>Rincian Operasional</strong><small>Akun lawan dipilih per baris.</small></div>',
          '<button class="ghost-button" type="button" data-tbb-kas-add-row>Tambah baris</button>',
        '</div>',
        '<div class="tbb-kas-input-head">',
          '<span>Akun Lawan</span><span>Keterangan</span><span>Uang Masuk</span><span>Uang Keluar</span><span></span>',
        '</div>',
        '<div class="tbb-kas-input-list">' + tbbKasRowHtml(entry) + '</div>',
      '</div>',
      '<div class="tbb-kas-input-attachment">',
        '<div><strong>Lampiran</strong><small data-tbb-kas-attachment-note>Belum ada file tersimpan.</small></div>',
        '<div class="tbb-kas-attachment-actions">',
          '<button class="ghost-button" type="button" data-tbb-kas-select-file>Pilih File</button>',
          '<button class="ghost-button" type="button" data-tbb-kas-upload-qr>Upload via QR</button>',
          '<button class="ghost-button" type="button" data-tbb-kas-clear-file>Batalkan File Baru</button>',
        '</div>',
      '</div>'
    ].join('');
    elements.form.insertBefore(panel, footer);
    if (elements.attachmentFile) elements.attachmentFile.disabled = Boolean(readOnly);
    setAttachmentNote(entry || null);
    setText(elements.modalTitle, readOnly ? 'Lihat Buku KAS' : (entry ? 'Ubah Buku KAS' : 'Tambah Buku KAS'));
    setText(elements.modalMeta, readOnly ? tbbKasBookLabel() + ' | Tampilan terkunci.' : 'Format input Buku KAS DEMO_DISTRIBUTION.');
    setTbbKasReadOnly(panel, Boolean(readOnly));
  }

  function resetTbbKasInputForm() {
    elements.entryId.value = '';
    renderTbbKasInputForm(null, false);
    window.setTimeout(function () {
      elements.form.querySelector('[data-tbb-kas-header="tanggal"]')?.focus();
    }, 0);
  }

  function appendTbbKasInputRow(defaults) {
    const list = elements.form.querySelector('.tbb-kas-input-list');
    if (!list) return null;
    const template = document.createElement('template');
    template.innerHTML = tbbKasRowHtml(defaults || {});
    const row = template.content.firstChild;
    list.appendChild(row);
    return row;
  }

  function collectTbbKasRows() {
    const panel = elements.form.querySelector('[data-tbb-kas-form]');
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('.tbb-kas-input-row')).map(function (row, index) {
      const coa = row.querySelector('[data-tbb-kas-field="coa"]')?.value || '';
      const keterangan = row.querySelector('[data-tbb-kas-field="keterangan"]')?.value || '';
      const uangMasuk = parseAmountInput(row.querySelector('[data-tbb-kas-field="uangMasuk"]'));
      const uangKeluar = parseAmountInput(row.querySelector('[data-tbb-kas-field="uangKeluar"]'));
      return { rowNumber: index + 1, coa, keterangan, uangMasuk, uangKeluar };
    }).filter(function (row) {
      return text(row.coa) || text(row.keterangan) || row.uangMasuk || row.uangKeluar;
    });
  }

  async function submitTbbKasForm() {
    const panel = elements.form.querySelector('[data-tbb-kas-form]');
    const entryId = text(elements.entryId.value);
    const tanggal = panel.querySelector('[data-tbb-kas-header="tanggal"]')?.value || today();
    const noBukti = panel.querySelector('[data-tbb-kas-header="noBukti"]')?.value || tbbKasNoBukti(tanggal, entryId);
    const rows = collectTbbKasRows();
    if (!rows.length) throw new Error('Minimal 1 baris rincian wajib diisi.');
    if (entryId && rows.length > 1) throw new Error('Ubah data Buku KAS hanya untuk 1 baris. Hapus baris tambahan dulu.');

    let latestData = null;
    const attachment = window.clientPortalBuildAttachmentPayload
      ? await window.clientPortalBuildAttachmentPayload(elements.attachmentFile)
      : await legacyAttachmentPayload(elements.attachmentFile);
    for (const row of rows) {
      if (!text(row.coa)) throw new Error('Baris ' + row.rowNumber + ': akun lawan wajib dipilih.');
      assertNotTbbFixedAssetRow(row);
      if (row.uangMasuk <= 0 && row.uangKeluar <= 0) throw new Error('Baris ' + row.rowNumber + ': isi Uang Masuk atau Uang Keluar.');
      if (row.uangMasuk > 0 && row.uangKeluar > 0) throw new Error('Baris ' + row.rowNumber + ': isi salah satu saja antara Uang Masuk dan Uang Keluar.');
      const payload = {
        cashBookKey: activeCashBookKey(),
        tanggal,
        noBukti,
        coa: row.coa,
        keterangan: [noBukti, row.keterangan].filter(Boolean).join(' | '),
        uangMasuk: String(row.uangMasuk),
        uangKeluar: String(row.uangKeluar),
        pajak: '',
        ...attachment
      };
      latestData = await requestJson(entryId ? apiBase() + '/' + encodeURIComponent(entryId) : apiBase(), {
        method: entryId ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    }
    if (!latestData) return;
    state.entries = Array.isArray(latestData.entries) ? latestData.entries : state.entries;
    state.activeCashBook = latestData.activeCashBook || state.activeCashBook;
    renderRows();
    if (entryId) {
      closeModal();
      setAlert('Data Buku KAS tersimpan.', 'info');
      return;
    }
    resetTbbKasInputForm();
    showSavedToast();
    setAlert('Data Tersimpan.', 'info');
  }

  function tbbKasSettlementUrl(type) {
    const tab = type === 'purchases' ? 'pembelian' : 'penjualan';
    const action = type === 'purchases' ? 'settlement-payable' : 'settlement-receivable';
    return '/app/client/clients/' + encodeURIComponent(state.client?.id || clientIdFromPath()) +
      '/tbb-transaksi?tab=' + encodeURIComponent(tab) +
      '&action=' + encodeURIComponent(action) +
      '&source=' + encodeURIComponent(activeCashBookKey());
  }

  function ensureTbbKasChoiceModal() {
    let modal = document.getElementById('tbbKasChoiceModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'tbbKasChoiceModal';
    modal.className = 'portal-modal-backdrop';
    modal.hidden = true;
    modal.innerHTML = [
      '<section class="portal-modal tbb-choice-modal tbb-cash-choice-modal" role="dialog" aria-modal="true" aria-labelledby="tbbKasChoiceTitle">',
        '<header class="portal-modal-header">',
          '<div><h2 id="tbbKasChoiceTitle">Pilih Input Buku KAS</h2><span>Pilih jenis transaksi untuk ' + escapeHtml(tbbKasBookLabel()) + '.</span></div>',
          '<button class="icon-button" type="button" data-tbb-kas-choice-close aria-label="Tutup popup"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
        '</header>',
        '<div class="tbb-choice-grid tbb-cash-choice-grid">',
          tbbKasChoiceCard('operational', 'Pencatatan Operasional', 'Input transaksi kas/bank harian.'),
          tbbKasChoiceCard('receivable', 'Pelunasan Piutang Dagang', 'Lunasi invoice penjualan DEMO_DISTRIBUTION.'),
          tbbKasChoiceCard('payable', 'Pembayaran Utang Dagang', 'Bayar invoice pembelian DEMO_DISTRIBUTION.'),
        '</div>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.target.closest('[data-tbb-kas-choice-close]')) {
        closeTbbKasChoiceModal();
        return;
      }
      const button = event.target.closest('[data-tbb-kas-choice]');
      if (!button) return;
      const choice = button.getAttribute('data-tbb-kas-choice');
      closeTbbKasChoiceModal();
      if (choice === 'operational') {
        openTbbKasOperationalModal();
        return;
      }
      window.location.assign(tbbKasSettlementUrl(choice === 'payable' ? 'purchases' : 'sales'));
    });
    return modal;
  }

  function tbbKasChoiceCard(value, title, description) {
    return '<button class="tbb-choice-card" type="button" data-tbb-kas-choice="' + escapeHtml(value) + '">' +
      '<span class="tbb-choice-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg></span>' +
      '<span class="tbb-choice-copy"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(description) + '</small></span>' +
      '<span class="tbb-choice-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></span>' +
    '</button>';
  }

  function openTbbKasChoiceModal() {
    const modal = ensureTbbKasChoiceModal();
    const title = modal.querySelector('#tbbKasChoiceTitle');
    const meta = modal.querySelector('.portal-modal-header span');
    if (title) title.textContent = 'Pilih Input Buku KAS';
    if (meta) meta.textContent = 'Pilih jenis transaksi untuk ' + tbbKasBookLabel() + '.';
    modal.hidden = false;
  }

  function closeTbbKasChoiceModal() {
    const modal = document.getElementById('tbbKasChoiceModal');
    if (modal) modal.hidden = true;
  }

  function openTbbKasOperationalModal() {
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = '';
    renderTbbKasInputForm(null, false);
    showModal();
  }

  function openCreateModal() {
    if (isTbbClient()) {
      openTbbKasChoiceModal();
      return;
    }
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = '';
    resetCashDetailRows();
    setAttachmentNote(null);
    setText(elements.modalTitle, 'Tambah Buku Kas');
    setText(elements.modalMeta, text(state.activeCashBook?.label, 'Buku Kas') + ' | Input transaksi baru.');
    ensureTbbBookSwitch();
    showModal();
  }

  function resetCreateModalAfterSave() {
    if (isTbbClient() && elements.form.querySelector('[data-tbb-kas-form]')) {
      resetTbbKasInputForm();
      return;
    }
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = '';
    resetCashDetailRows();
    setAttachmentNote(null);
    setText(elements.modalTitle, 'Tambah Buku Kas');
    setText(elements.modalMeta, text(state.activeCashBook?.label, 'Buku Kas') + ' | Input transaksi baru.');
    ensureTbbBookSwitch();
    window.setTimeout(function () {
      elements.detailRows?.querySelector('[data-cash-detail-field="tanggal"]')?.focus();
    }, 0);
  }

  function showSavedToast() {
    let toast = document.getElementById('clientPortalSavedToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'clientPortalSavedToast';
      toast.className = 'client-portal-floating-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = 'Data Tersimpan';
    toast.hidden = false;
    window.clearTimeout(showSavedToast.timer);
    showSavedToast.timer = window.setTimeout(function () {
      toast.hidden = true;
    }, 1100);
  }

  function openEditModal(entry) {
    if (isTbbClient()) {
      elements.form.reset();
      if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
      elements.entryId.value = entry.id || '';
      renderTbbKasInputForm(entry, false);
      showModal();
      return;
    }
    const htiPaymentCorrection = isHtiClient() && isHtiPaymentMirror(entry);
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = entry.id || '';
    resetCashDetailRows({
      tanggal: entry.tanggal || today(),
      coa: entry.coa,
      accountName: entry.accountName,
      keterangan: entry.keterangan,
      uangMasuk: entry.uangMasuk,
      uangKeluar: entry.uangKeluar,
      pajak: entry.pajak
    });
    if (htiPaymentCorrection) {
      elements.detailRows?.querySelectorAll('[data-cash-detail-field="coa"], [data-cash-detail-field="accountName"], [data-cash-detail-field="keterangan"], [data-cash-detail-field="pajak"]').forEach(function (control) {
        control.disabled = true;
        control.setAttribute('aria-readonly', 'true');
      });
      elements.detailRows?.querySelectorAll('[data-cash-detail-remove]').forEach(function (button) {
        button.hidden = true;
      });
    }
    setAttachmentNote(entry);
    setText(elements.modalTitle, htiPaymentCorrection ? 'Ubah Pembayaran' : 'Ubah Buku Kas');
    setText(elements.modalMeta, htiPaymentCorrection
      ? text(state.activeCashBook?.label, 'Buku Kas') + ' | Koreksi pelunasan dari transaksi sumber.'
      : text(entry.coa) + ' - ' + text(entry.accountName, 'Data Buku Kas'));
    removeTbbBookSwitch();
    showModal();
  }

  function showModal() {
    elements.modal.hidden = false;
    bindModalWindowControls();
    resetModalWindow();
    window.setTimeout(function () {
      const customFocus = elements.form.querySelector('[data-tbb-kas-header="tanggal"]');
      if (customFocus) customFocus.focus();
      else elements.detailRows?.querySelector('[data-cash-detail-field="tanggal"]')?.focus();
    }, 0);
  }

  function closeModal() {
    elements.modal.hidden = true;
    stopModalDrag();
    elements.form.querySelectorAll('[data-cashbook-view-only]').forEach(function (panel) {
      panel.remove();
    });
    elements.form.querySelectorAll('[data-cashbook-view-action]').forEach(function (button) {
      button.remove();
    });
    elements.saveButton.hidden = false;
    elements.cancelButton.textContent = 'Batal';
    setNativeKasFormVisible(true);
  }

  function canOpenHtiMutationSource(entry) {
    if (!isHtiClient()) return false;
    if (isHtiExpense(entry)) return Boolean(htiPaymentSourceUrl(entry));
    return isHtiPaymentMirror(entry) && !isHtiTfGabMirror(entry) && Boolean(htiPaymentSourceUrl(entry));
  }

  function openHtiMutationSource(entry) {
    if (!canOpenHtiMutationSource(entry)) {
      setAlert(isHtiTfGabMirror(entry)
        ? 'TF Gab dikoreksi dengan hapus TF Gab lalu input ulang.'
        : 'Mutasi ini belum punya transaksi sumber yang bisa diubah dari sini.', 'info');
      return;
    }
    openHtiSourcePaymentFrame(entry);
  }

  function closeHtiSourcePaymentFrame(refreshAfterClose) {
    const backdrop = document.getElementById('htiSourcePaymentFrameModal');
    if (backdrop) backdrop.remove();
    document.body.classList.toggle('modal-open', Boolean(!elements.modal.hidden));
    if (refreshAfterClose) loadBook();
  }

  function openHtiSourcePaymentFrame(entry) {
    const url = htiPaymentSourceUrl(entry);
    if (!url) {
      setAlert('Transaksi sumber pembayaran tidak ditemukan.', 'error');
      return;
    }
    const title = isHtiExpense(entry) ? 'Ubah Biaya' : 'Ubah Pembayaran';
    closeModal();
    closeHtiSourcePaymentFrame(false);
    const backdrop = document.createElement('div');
    backdrop.id = 'htiSourcePaymentFrameModal';
    backdrop.className = 'portal-modal-backdrop hti-source-payment-frame-backdrop';
    backdrop.innerHTML = [
      '<section class="portal-modal hti-source-payment-frame-modal" role="dialog" aria-modal="true" aria-labelledby="htiSourcePaymentFrameTitle">',
        '<header class="portal-modal-header">',
          '<div>',
            '<h2 id="htiSourcePaymentFrameTitle">' + escapeHtml(title) + '</h2>',
            '<span>' + escapeHtml(text(entry && entry.keterangan, 'Transaksi sumber')) + '</span>',
          '</div>',
          '<button class="icon-button" type="button" data-hti-source-payment-close aria-label="Tutup popup">',
            '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
          '</button>',
        '</header>',
        '<iframe class="hti-source-payment-frame" src="' + escapeHtml(url) + '" title="' + escapeHtml(title) + ' transaksi sumber"></iframe>',
      '</section>'
    ].join('');
    backdrop.querySelector('[data-hti-source-payment-close]')?.addEventListener('click', function () {
      closeHtiSourcePaymentFrame(true);
    });
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');
  }

  function renderCashbookViewOnlyForm(entry) {
    setNativeKasFormVisible(false);
    elements.form.querySelectorAll('[data-cashbook-view-only]').forEach(function (panel) {
      panel.remove();
    });
    elements.form.querySelectorAll('[data-cashbook-view-action]').forEach(function (button) {
      button.remove();
    });

    const footer = elements.form.querySelector('.portal-modal-footer');
    const panel = document.createElement('section');
    panel.className = 'bankbook-view-only';
    panel.setAttribute('data-cashbook-view-only', 'true');
    const hasDocument = Boolean(entry && entry.hasAttachment);
    const documentName = text(entry?.attachmentName, 'Lampiran transaksi');
    panel.innerHTML = [
      '<div class="bankbook-view-summary">',
        '<div><span>Tanggal</span><strong>' + escapeHtml(formatDisplayDate(entry?.tanggal)) + '</strong></div>',
        '<div><span>Buku Kas</span><strong>' + escapeHtml(text(state.activeCashBook?.label, 'Buku Kas')) + '</strong></div>',
        '<div><span>No. Akun</span><strong>' + escapeHtml(text(entry?.coa, '-')) + '</strong></div>',
        '<div><span>Nama Akun</span><strong>' + escapeHtml(text(entry?.accountName, '-')) + '</strong></div>',
      '</div>',
      '<div class="bankbook-view-section">',
        '<div class="bankbook-view-section-header"><strong>Rincian Transaksi</strong><small>Tampilan hanya baca.</small></div>',
        '<div class="bankbook-view-table-wrap">',
          '<table class="bankbook-view-table">',
            '<thead><tr><th>Keterangan</th><th>' + escapeHtml(moneyInLabel()) + '</th><th>' + escapeHtml(moneyOutLabel()) + '</th><th>Saldo</th><th>Pajak</th></tr></thead>',
            '<tbody><tr>' +
              '<td>' + escapeHtml(text(entry?.keterangan) || '-') + '</td>' +
              '<td class="number">' + escapeHtml(formatAmount(entry?.uangMasuk) || '-') + '</td>' +
              '<td class="number">' + escapeHtml(formatAmount(entry?.uangKeluar) || '-') + '</td>' +
              '<td class="number">' + escapeHtml(formatAmount(entry?.saldo) || '0') + '</td>' +
              '<td>' + escapeHtml(text(entry?.pajak, '-')) + '</td>' +
            '</tr></tbody>',
          '</table>',
        '</div>',
      '</div>',
      '<div class="bankbook-view-section bankbook-view-documents">',
        '<div class="bankbook-view-section-header"><strong>Checklist Dokumen</strong><small>Dokumen yang terhubung dengan transaksi ini.</small></div>',
        '<div class="bankbook-document-checklist">',
          '<label class="bankbook-document-check">',
            '<input type="checkbox" disabled' + (hasDocument ? ' checked' : '') + '>',
            '<span><strong>' + escapeHtml(documentName) + '</strong><small>' + escapeHtml(hasDocument ? formatFileSize(entry.attachmentSize) : 'Belum ada dokumen terupload.') + '</small></span>',
            (hasDocument ? '<button class="ghost-button" type="button" data-cashbook-view-file>Lihat Dokumen</button>' : '<em>Belum ada</em>'),
          '</label>',
        '</div>',
      '</div>'
    ].join('');
    if (footer) elements.form.insertBefore(panel, footer);
    else elements.form.appendChild(panel);
    const viewFileButton = panel.querySelector('[data-cashbook-view-file]');
    if (viewFileButton) viewFileButton.addEventListener('click', function () {
      openFileViewer(entry);
    });
    elements.saveButton.hidden = true;
    if (footer && canOpenHtiMutationSource(entry)) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'ghost-button';
      editButton.textContent = 'Ubah';
      editButton.setAttribute('data-cashbook-view-action', 'edit-source');
      editButton.addEventListener('click', function () {
        openHtiMutationSource(entry);
      });
      footer.insertBefore(editButton, elements.cancelButton);
    }
    elements.cancelButton.textContent = 'Tutup';
    setText(elements.modalTitle, 'Lihat Buku Kas Kecil');
    setText(elements.modalMeta, text(state.activeCashBook?.label, 'Buku Kas') + ' | Tampilan terkunci.');
  }

  function openViewOnlyModal(entry) {
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = entry.id || '';
    if (isTbbClient()) renderTbbKasInputForm(entry, true);
    else renderCashbookViewOnlyForm(entry);
    showModal();
  }

  function tbbKasJournalLines(entry) {
    const source = tbbKasSourceAccount();
    const contra = {
      coa: text(entry.coa),
      accountName: text(entry.accountName, 'Akun lawan')
    };
    const moneyIn = Number(entry.uangMasuk || 0);
    const moneyOut = Number(entry.uangKeluar || 0);
    const amount = Math.max(moneyIn, moneyOut, 0);
    if (amount <= 0) return [];
    if (moneyIn > 0) {
      return [
        { coa: source.coa, accountName: source.accountName, description: entry.keterangan, debit: amount, credit: 0 },
        { coa: contra.coa, accountName: contra.accountName, description: entry.keterangan, debit: 0, credit: amount }
      ];
    }
    return [
      { coa: contra.coa, accountName: contra.accountName, description: entry.keterangan, debit: amount, credit: 0 },
      { coa: source.coa, accountName: source.accountName, description: entry.keterangan, debit: 0, credit: amount }
    ];
  }

  function tbbKasJournalRowHtml(line) {
    return '<tr>' +
      '<td>' + escapeHtml(line.coa) + '</td>' +
      '<td>' + escapeHtml(line.accountName) + '</td>' +
      '<td>' + escapeHtml(line.description || '-') + '</td>' +
      '<td class="number">' + escapeHtml(line.debit ? formatAmount(line.debit) : '-') + '</td>' +
      '<td class="number">' + escapeHtml(line.credit ? formatAmount(line.credit) : '-') + '</td>' +
    '</tr>';
  }

  function openJournalModal(entry) {
    const lines = tbbKasJournalLines(entry);
    const totalDebit = lines.reduce(function (sum, line) { return sum + Number(line.debit || 0); }, 0);
    const totalCredit = lines.reduce(function (sum, line) { return sum + Number(line.credit || 0); }, 0);
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = entry.id || '';
    setNativeKasFormVisible(false);
    const oldPanel = elements.form.querySelector('[data-tbb-kas-journal]');
    if (oldPanel) oldPanel.remove();
    const footer = elements.form.querySelector('.portal-modal-footer');
    const panel = document.createElement('div');
    panel.setAttribute('data-tbb-kas-journal', 'true');
    panel.className = 'ledger-journal-body tbb-cash-journal-view';
    panel.innerHTML = [
      '<div class="ledger-journal-summary">',
        '<div><span>Tanggal</span><strong>' + escapeHtml(formatDisplayDate(entry.tanggal)) + '</strong></div>',
        '<div><span>Buku</span><strong>' + escapeHtml(tbbKasBookLabel()) + '</strong></div>',
        '<div><span>No. Bukti</span><strong>' + escapeHtml(tbbKasExistingNoBukti(entry) || '-') + '</strong></div>',
      '</div>',
      '<div class="adjustment-journal-view">',
        '<table class="cashbook-table ledger-journal-table adjustment-journal-view-table">',
          '<thead><tr><th>No Akun</th><th>Nama Akun</th><th>Keterangan</th><th>Debet</th><th>Kredit</th></tr></thead>',
          '<tbody>',
            (lines.length ? lines.map(tbbKasJournalRowHtml).join('') : '<tr><td colspan="5">Belum ada nilai jurnal.</td></tr>'),
            '<tr class="adjustment-journal-total-row"><td colspan="3">Total</td><td class="number">' + escapeHtml(formatAmount(totalDebit) || '0') + '</td><td class="number">' + escapeHtml(formatAmount(totalCredit) || '0') + '</td></tr>',
          '</tbody>',
        '</table>',
      '</div>'
    ].join('');
    elements.form.insertBefore(panel, footer);
    elements.saveButton.hidden = true;
    elements.cancelButton.textContent = 'Tutup';
    setText(elements.modalTitle, 'Jurnal ' + tbbKasBookLabel());
    setText(elements.modalMeta, formatDisplayDate(entry.tanggal) + ' | ' + text(entry.keterangan, 'Transaksi Buku KAS'));
    showModal();
  }

  function setAttachmentNote(entry, file) {
    if (!elements.attachmentNote) return;
    const customNote = elements.form?.querySelector('[data-tbb-kas-attachment-note]');
    function applyNote(message) {
      elements.attachmentNote.textContent = message;
      if (customNote) customNote.textContent = message;
    }
    const selected = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.attachmentFile) : [];
    if (selected.length) {
      applyNote(window.clientPortalFormatFilesNote
        ? window.clientPortalFormatFilesNote(selected, 'File baru')
        : 'File baru: ' + selected.length + ' file');
      return;
    }
    if (file) {
      applyNote('File baru: ' + file.name + ' (' + formatFileSize(file.size) + ')');
      return;
    }
    if (entry && entry.hasAttachment) {
      applyNote('File tersimpan: ' + text(entry.attachmentName, 'lampiran') + ' (' + formatFileSize(entry.attachmentSize) + ')');
      return;
    }
    applyNote('Belum ada file tersimpan.');
  }

  async function formPayload(extra) {
    const payload = Object.assign({
      cashBookKey: activeCashBookKey(),
      tanggal: elements.tanggal.value,
      coa: elements.coa.value,
      keterangan: elements.keterangan.value,
      uangMasuk: String(parseAmountInput(elements.uangMasuk)),
      uangKeluar: String(parseAmountInput(elements.uangKeluar)),
      pajak: elements.pajak.value
    }, extra || {});
    const attachment = window.clientPortalBuildAttachmentPayload
      ? await window.clientPortalBuildAttachmentPayload(elements.attachmentFile)
      : await legacyAttachmentPayload(elements.attachmentFile);
    Object.assign(payload, attachment);
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

  async function submitCashDetailForm() {
    const entryId = text(elements.entryId.value);
    const rows = collectCashDetailRows();
    if (!rows.length) throw new Error('Minimal 1 baris rincian wajib diisi.');
    if (entryId && rows.length > 1) throw new Error('Ubah data hanya untuk 1 baris. Hapus baris tambahan dulu.');

    const attachment = window.clientPortalBuildAttachmentPayload
      ? await window.clientPortalBuildAttachmentPayload(elements.attachmentFile)
      : await legacyAttachmentPayload(elements.attachmentFile);
    let latestData = null;

    for (const [index, row] of rows.entries()) {
      if (!text(row.tanggal)) throw new Error('Baris ' + row.rowNumber + ': tanggal wajib diisi.');
      if (!text(row.coa)) throw new Error('Baris ' + row.rowNumber + ': nomor atau nama akun wajib dipilih.');
      if (row.uangMasuk <= 0 && row.uangKeluar <= 0) {
        throw new Error('Baris ' + row.rowNumber + ': isi ' + amountSideHint() + '.');
      }
      if (row.uangMasuk > 0 && row.uangKeluar > 0) {
        throw new Error('Baris ' + row.rowNumber + ': isi salah satu saja antara ' + moneyInLabel() + ' atau ' + moneyOutLabel() + '.');
      }
      const url = entryId ? apiBase() + '/' + encodeURIComponent(entryId) : apiBase();
      latestData = await requestJson(url, {
        method: entryId ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cashBookKey: activeCashBookKey(),
          tanggal: row.tanggal,
          coa: row.coa,
          keterangan: row.keterangan,
          uangMasuk: String(row.uangMasuk),
          uangKeluar: String(row.uangKeluar),
          pajak: row.pajak,
          ...(index === 0 ? attachment : {})
        })
      });
    }

    if (!latestData) return;
    state.activeCashBook = latestData.activeCashBook || state.activeCashBook;
    state.entries = Array.isArray(latestData.entries) ? latestData.entries : state.entries;
    renderRows();
    closeModal();
    setAlert(rows.length + ' baris Buku Kas tersimpan.', 'info');
  }

  async function submitForm(event) {
    event.preventDefault();
    const tbbPanel = elements.form.querySelector('[data-tbb-kas-form]');
    if (tbbPanel) {
      if (tbbPanel.getAttribute('data-readonly') === 'true') return;
      elements.saveButton.disabled = true;
      setAlert('');
      try {
        await submitTbbKasForm();
      } catch (err) {
        setAlert(err.message || 'Gagal menyimpan Buku KAS.', 'error');
      } finally {
        elements.saveButton.disabled = false;
      }
      return;
    }
    elements.saveButton.disabled = true;
    setAlert('');
    try {
      await submitCashDetailForm();
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan Buku Kas.', 'error');
    } finally {
      elements.saveButton.disabled = false;
    }
  }

  async function updateEntryTax(entry, pajak, select) {
    const previousValue = entry.pajak || '';
    if (pajak === previousValue) return;
    select.disabled = true;
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entry.id), {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cashBookKey: activeCashBookKey(),
          tanggal: entry.tanggal,
          coa: entry.coa,
          keterangan: entry.keterangan,
          uangMasuk: entry.uangMasuk,
          uangKeluar: entry.uangKeluar,
          pajak
        })
      });
      if (!data) return;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      renderRows();
      setAlert('Pilihan pajak tersimpan.', 'info');
    } catch (err) {
      select.value = previousValue;
      select.disabled = false;
      setAlert(err.message || 'Gagal menyimpan pilihan pajak.', 'error');
    }
  }

  async function deleteEntry(entry, silent) {
    if (!entry || !entry.id) return false;
    if (!silent) {
      const ok = await window.clientPortalConfirm({
        title: 'Hapus Buku Kas',
        meta: 'Data yang dihapus tidak masuk laporan.',
        message: 'Hapus data Buku Kas ini?',
        cancelText: 'Batal',
        confirmText: 'Hapus'
      });
      if (!ok) return false;
    }
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entry.id) + '?cash=' + encodeURIComponent(activeCashBookKey()), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!data) return false;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.selectedIds.delete(text(entry.id));
      renderRows();
      if (!silent) setAlert('Data Buku Kas dihapus.', 'info');
      return true;
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus Buku Kas.', 'error');
      return false;
    }
  }

  async function deleteSelectedEntries() {
    const ids = Array.from(state.selectedIds);
    if (!ids.length) return;
    const ok = await window.clientPortalConfirm({
      title: 'Hapus Data Terpilih',
      meta: 'Data yang dihapus tidak masuk laporan.',
      message: 'Hapus ' + ids.length + ' data Buku Kas yang dipilih?',
      cancelText: 'Batal',
      confirmText: 'Hapus'
    });
    if (!ok) return;
    if (elements.deleteSelectedButton) elements.deleteSelectedButton.disabled = true;
    let deletedCount = 0;
    for (const id of ids) {
      const entry = state.entries.find(function (item) {
        return text(item.id) === id;
      });
      if (entry && await deleteEntry(entry, true)) deletedCount += 1;
    }
    state.selectedIds.clear();
    renderRows();
    setAlert(deletedCount + ' data Buku Kas dihapus.', 'info');
  }

  async function openFileViewer(entry) {
    if (!entry || !entry.hasAttachment) {
      setAlert('Belum ada file ter-upload untuk data Buku Kas ini.', 'info');
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

  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin) return;
    const data = event.data || {};
    if (data.type === 'client-portal-hti-source-payment-closed') {
      closeHtiSourcePaymentFrame(data.refresh !== false);
    }
  });

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadBukuKas);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.addButton) elements.addButton.addEventListener('click', openCreateModal);
  if (elements.advanceButton) elements.advanceButton.addEventListener('click', openHtiAdvanceInput);
  if (elements.exportButton) elements.exportButton.addEventListener('click', exportRows);
  if (elements.deleteSelectedButton) elements.deleteSelectedButton.addEventListener('click', deleteSelectedEntries);
  if (elements.selectAll) elements.selectAll.addEventListener('change', toggleSelectAll);
  if (elements.closeButton) elements.closeButton.addEventListener('click', closeModal);
  if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeModal);
  if (elements.addDetailRowButton) {
    elements.addDetailRowButton.addEventListener('click', function () {
      const row = appendCashDetailRow({ tanggal: today() });
      row?.querySelector('[data-cash-detail-field="tanggal"]')?.focus();
    });
  }
  if (elements.form) elements.form.addEventListener('submit', submitForm);
  if (elements.form) {
    elements.form.addEventListener('click', function (event) {
      if (event.target.closest('[data-tbb-kas-add-row]')) {
        appendTbbKasInputRow();
        return;
      }
      if (event.target.closest('[data-tbb-kas-select-file]')) {
        event.preventDefault();
        if (elements.attachmentFile) elements.attachmentFile.click();
        return;
      }
      if (event.target.closest('[data-tbb-kas-upload-qr]')) {
        event.preventDefault();
        const qrButton = elements.attachmentFile?.parentElement?.querySelector('.client-upload-qr-button');
        if (qrButton) qrButton.click();
        return;
      }
      if (event.target.closest('[data-tbb-kas-clear-file]')) {
        event.preventDefault();
        if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
        else if (elements.attachmentFile) elements.attachmentFile.value = '';
        setAttachmentNote(null);
        return;
      }
      const detailRemoveButton = event.target.closest('[data-cash-detail-remove]');
      if (detailRemoveButton) {
        const row = detailRemoveButton.closest('.bankbook-detail-row');
        if (row) row.remove();
        if (elements.detailRows && !elements.detailRows.querySelector('.bankbook-detail-row')) {
          appendCashDetailRow({ tanggal: today() });
        }
        return;
      }
      const removeButton = event.target.closest('[data-tbb-kas-remove-row]');
      if (removeButton) {
        const row = removeButton.closest('.tbb-kas-input-row');
        const list = elements.form.querySelector('.tbb-kas-input-list');
        if (row) row.remove();
        if (list && !list.querySelector('.tbb-kas-input-row')) appendTbbKasInputRow();
      }
    });
    elements.form.addEventListener('change', function (event) {
      if (event.target.matches('[data-tbb-kas-header="tanggal"]')) {
        const noBukti = elements.form.querySelector('[data-tbb-kas-header="noBukti"]');
        if (noBukti) noBukti.value = tbbKasNoBukti(event.target.value, elements.entryId?.value);
      }
      if (event.target.matches('[data-tbb-kas-header="book"]')) {
        const value = event.target.value;
        if (value === 'tbb-kas') return;
        if (state.client?.id) {
          window.location.assign('/app/client/clients/' + encodeURIComponent(state.client.id) + '/buku-bank?bank=' + encodeURIComponent(value));
        }
      }
      if (event.target.matches('[data-cash-detail-field="coa"], [data-cash-detail-field="accountName"]')) {
        syncCashDetailAccount(event.target.closest('.bankbook-detail-row'), event.target.value);
      }
    });
    elements.form.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      if (event.target.matches('[data-tbb-kas-field]')) {
        const row = event.target.closest('.tbb-kas-input-row');
        const list = elements.form.querySelector('.tbb-kas-input-list');
        if (!row || !list || row !== list.lastElementChild) return;
        event.preventDefault();
        const nextRow = appendTbbKasInputRow();
        nextRow?.querySelector('[data-tbb-kas-field="coa"]')?.focus();
        return;
      }
      if (!event.target.matches('[data-cash-detail-field]')) return;
      const row = event.target.closest('.bankbook-detail-row');
      if (!row || row !== elements.detailRows?.lastElementChild) return;
      event.preventDefault();
      const nextRow = appendCashDetailRow({ tanggal: today() });
      nextRow?.querySelector('[data-cash-detail-field="tanggal"]')?.focus();
    });
  }
  if (elements.coa) elements.coa.addEventListener('change', syncSelectedAccountName);
  if (elements.attachmentFile) {
    elements.attachmentFile.addEventListener('change', function () {
      const file = elements.attachmentFile.files && elements.attachmentFile.files[0];
      setAttachmentNote(null, file || null);
    });
    elements.attachmentFile.addEventListener('client-portal-upload-files', function () {
      setAttachmentNote(null);
    });
  }
  if (elements.fileCloseButton) elements.fileCloseButton.addEventListener('click', closeFileModal);
  if (elements.modal) {
    elements.modal.addEventListener('click', function (event) {
      if (event.target === elements.modal) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }
  if (elements.fileModal) {
    elements.fileModal.addEventListener('click', function (event) {
      if (event.target === elements.fileModal) closeFileModal();
    });
  }
  document.addEventListener('click', function (event) {
    const header = event.target.closest('[data-cash-sort-key]');
    if (!header || event.target.closest('.client-col-resize-handle')) return;
    setSort(header.getAttribute('data-cash-sort-key'));
  });
  document.addEventListener('keydown', function (event) {
    const header = event.target.closest('[data-cash-sort-key]');
    if (!header || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    setSort(header.getAttribute('data-cash-sort-key'));
  });

  setupSortHeaders();
  loadBukuKas();
})();
