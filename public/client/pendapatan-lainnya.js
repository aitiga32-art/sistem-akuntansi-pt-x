(function () {
  const state = {
    client: { id: '', name: 'CV DEMO_MOTOR AMBARAWA' },
    entries: [],
    selectedIds: new Set(),
    searchTerm: '',
    readonly: false
  };

  const elements = {
    alert: document.getElementById('incomeAlert'),
    clientMeta: document.getElementById('incomeClientMeta'),
    userName: document.getElementById('incomeUserName'),
    userEmail: document.getElementById('incomeUserEmail'),
    refreshButton: document.getElementById('incomeRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('incomeBackLink'),
    subtitle: document.getElementById('incomeSubtitle'),
    addButton: document.getElementById('incomeAddBtn'),
    deleteSelectedButton: document.getElementById('incomeDeleteSelectedBtn'),
    searchInput: document.getElementById('incomeSearchInput'),
    count: document.getElementById('incomeCount'),
    selectAll: document.getElementById('incomeSelectAll'),
    rows: document.getElementById('incomeRows'),
    modal: document.getElementById('incomeModal'),
    form: document.getElementById('incomeForm'),
    modalTitle: document.getElementById('incomeModalTitle'),
    modalMeta: document.getElementById('incomeModalMeta'),
    closeButton: document.getElementById('incomeCloseBtn'),
    cancelButton: document.getElementById('incomeCancelBtn'),
    saveButton: document.getElementById('incomeSaveBtn'),
    entryId: document.getElementById('incomeEntryId'),
    noDokumen: document.getElementById('incomeNoDokumen'),
    tanggalDokumen: document.getElementById('incomeTanggalDokumen'),
    namaCustomer: document.getElementById('incomeNamaCustomer'),
    nikNpwp: document.getElementById('incomeNikNpwp'),
    alamat: document.getElementById('incomeAlamat'),
    keterangan: document.getElementById('incomeKeterangan'),
    jumlah: document.getElementById('incomeJumlah'),
    dpp: document.getElementById('incomeDpp'),
    ppn: document.getElementById('incomePpn'),
    pph23: document.getElementById('incomePph23'),
    nilaiDiterima: document.getElementById('incomeNilaiDiterima'),
    noFaktur: document.getElementById('incomeNoFaktur'),
    tanggalFaktur: document.getElementById('incomeTanggalFaktur'),
    fakturFile: document.getElementById('incomeFakturFile'),
    fakturNote: document.getElementById('incomeFakturNote'),
    detailModal: document.getElementById('incomeDetailModal'),
    detailCloseButton: document.getElementById('incomeDetailCloseBtn'),
    detailDoneButton: document.getElementById('incomeDetailDoneBtn'),
    detailMeta: document.getElementById('incomeDetailMeta'),
    detailContent: document.getElementById('incomeDetailContent'),
    settlementModal: document.getElementById('incomeSettlementModal'),
    settlementForm: document.getElementById('incomeSettlementForm'),
    settlementCloseButton: document.getElementById('incomeSettlementCloseBtn'),
    settlementCancelButton: document.getElementById('incomeSettlementCancelBtn'),
    settlementMeta: document.getElementById('incomeSettlementMeta'),
    settlementEntryId: document.getElementById('incomeSettlementEntryId'),
    tanggalPelunasan: document.getElementById('incomeTanggalPelunasan'),
    pelunasan: document.getElementById('incomePelunasan'),
    sisaPiutang: document.getElementById('incomeSisaPiutang'),
    keteranganPelunasan: document.getElementById('incomeKeteranganPelunasan')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));
  elements.totalHeaders = Array.from(document.querySelectorAll('[data-income-total-key]'));

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  const IMPORT_VERSION = '20260605-pendapatan-lainnya-33';
  const incomeTotalKeys = ['jumlah', 'dpp', 'ppn', 'pph23', 'nilaiDiterima', 'pelunasan', 'sisaPiutang'];

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function formatDisplayDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '-' + match[2] + '-' + match[1] : raw;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function setFileNote(fileMeta, file) {
    if (!elements.fakturNote) return;
    const selected = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.fakturFile) : [];
    if (selected.length && window.clientPortalFormatFilesNote) {
      elements.fakturNote.textContent = window.clientPortalFormatFilesNote(selected, 'File dipilih');
      return;
    }
    if (fileMeta && fileMeta.name) {
      elements.fakturNote.textContent = 'File: ' + fileMeta.name + ' (' + formatFileSize(fileMeta.size || 0) + ')';
      return;
    }
    if (file) {
      elements.fakturNote.textContent = 'File: ' + file.name + ' (' + formatFileSize(file.size || 0) + ')';
      return;
    }
    elements.fakturNote.textContent = 'Belum ada file dipilih.';
  }

  function formatFileSize(size) {
    const bytes = Number(size || 0);
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
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
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/pendapatan-lainnya/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function selectedPeriod() {
    const params = new URLSearchParams(window.location.search);
    const month = Number(params.get('month'));
    const year = Number(params.get('year'));
    return {
      month: Number.isFinite(month) && month >= 0 && month <= 12 ? month : null,
      year: Number.isFinite(year) && year >= 1900 ? year : null
    };
  }

  function entryWithinPeriod(entry) {
    const period = selectedPeriod();
    if (period.month == null || !period.year) return true;
    const raw = text(entry && entry.tanggalDokumen);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (!match) return false;
    if (period.month === 0) return Number(match[1]) === period.year;
    return Number(match[1]) === period.year && Number(match[2]) === period.month;
  }

  function storageKey() {
    return 'clientPortalPendapatanLainnya:' + clientIdFromPath();
  }

  function importVersionKey() {
    return storageKey() + ':importVersion';
  }

  function today() {
    const current = new Date();
    return current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');
  }

  function formatAmount(value) {
    const amount = Number(value || 0);
    return amount ? currency.format(amount) : '';
  }

  function formatAmountZero(value) {
    return currency.format(Number(value || 0));
  }

  function parseAmount(input) {
    const value = input && input.value != null ? input.value : input;
    if (value == null || value === '') return 0;
    const cleaned = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : 0;
  }

  function roundAmount(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
  }

  function formatInputAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || !amount) return '0';
    return String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function setNumber(input, value) {
    if (input) input.value = formatInputAmount(value);
  }

  function formatRupiahField(input) {
    if (!input || input.value == null || input.value === '') return;
    input.value = formatInputAmount(parseAmount(input));
  }

  function calculateIncome() {
    const jumlah = parseAmount(elements.jumlah);
    const pph23 = parseAmount(elements.pph23);
    const dpp = roundAmount(jumlah / 1.11);
    const ppn = roundAmount(dpp * 0.11);
    const nilaiDiterima = roundAmount(dpp - pph23 + ppn);
    setNumber(elements.dpp, dpp);
    setNumber(elements.ppn, ppn);
    setNumber(elements.nilaiDiterima, nilaiDiterima);
    return { jumlah, dpp, ppn, pph23, nilaiDiterima };
  }

  function entryPelunasan(entry) {
    return roundAmount(Number(entry && entry.pelunasan || 0));
  }

  function entrySisaPiutang(entry) {
    return Math.max(0, roundAmount(Number(entry && entry.nilaiDiterima || 0) - entryPelunasan(entry)));
  }

  function normalizeEntry(entry) {
    const item = entry || {};
    return Object.assign({}, item, {
      businessEntityKey: text(item.businessEntityKey || item.business_entity_key),
      businessEntityName: text(item.businessEntityName || item.business_entity_name),
      pelunasan: entryPelunasan(item),
      tanggalPelunasan: item.tanggalPelunasan || '',
      keteranganPelunasan: item.keteranganPelunasan || ''
    });
  }

  function currentBusinessEntitySelection(fallback) {
    const current = window.clientPortalSelectedBusinessEntity;
    if (current && current.key) {
      return {
        key: text(current.key),
        name: text(current.name, current.key)
      };
    }
    const select = document.querySelector('#incomeForm select[name="businessEntityKey"], #clientBusinessEntitySelect, select[name="businessEntityKey"]');
    if (select && select.value) {
      const option = select.options[select.selectedIndex];
      return {
        key: text(select.value),
        name: text(option && option.textContent, select.value)
      };
    }
    if (fallback && (fallback.businessEntityKey || fallback.businessEntityName)) {
      return {
        key: text(fallback.businessEntityKey),
        name: text(fallback.businessEntityName, fallback.businessEntityKey)
      };
    }
    return { key: '', name: '' };
  }

  function calculateSettlementPreview() {
    const entry = state.entries.find(function (item) {
      return item.id === elements.settlementEntryId.value;
    });
    const nilaiDiterima = entry ? Number(entry.nilaiDiterima || 0) : 0;
    const pelunasan = parseAmount(elements.pelunasan);
    setNumber(elements.sisaPiutang, Math.max(0, roundAmount(nilaiDiterima - pelunasan)));
  }

  async function loadImportedEntries() {
    try {
      const response = await fetch('/app/assets/client/pendapatan-lainnya-imported-entries.json?v=' + IMPORT_VERSION, {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return null;
      const entries = await response.json();
      return Array.isArray(entries) ? entries.map(normalizeEntry) : null;
    } catch {
      return null;
    }
  }

  async function loadEntries() {
    const saved = window.localStorage.getItem(storageKey());
    const savedImportVersion = window.localStorage.getItem(importVersionKey());
    const importedEntries = await loadImportedEntries();
    if (importedEntries && savedImportVersion !== IMPORT_VERSION) {
      state.entries = importedEntries;
      saveEntries();
      window.localStorage.setItem(importVersionKey(), IMPORT_VERSION);
      return;
    }
    if (saved) {
      state.entries = JSON.parse(saved).map(normalizeEntry);
    } else if (importedEntries) {
      state.entries = importedEntries;
      saveEntries();
      window.localStorage.setItem(importVersionKey(), IMPORT_VERSION);
    } else {
      state.entries = [{
        id: cryptoId(),
        noDokumen: 'PL-001/VI/2026',
        tanggalDokumen: today(),
        namaCustomer: 'CONTOH CUSTOMER',
        nikNpwp: '3170000000000000',
        alamat: 'Semarang',
        keterangan: 'Pendapatan jasa administrasi',
        noFaktur: '010.001-26.00000001',
        tanggalFaktur: today(),
        fakturName: '',
        fakturMimeType: '',
        fakturSize: 0,
        fakturDataUrl: '',
        jumlah: 11100000,
        dpp: 10000000,
        ppn: 1100000,
        pph23: 200000,
        nilaiDiterima: 10900000,
        pelunasan: 0,
        tanggalPelunasan: '',
        keteranganPelunasan: ''
      }].map(normalizeEntry);
      saveEntries();
    }
  }

  function saveEntries() {
    window.localStorage.setItem(storageKey(), JSON.stringify(state.entries));
  }

  function cryptoId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'income-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  async function loadShell() {
    try {
      const response = await fetch('/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()), {
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json().catch(function () { return {}; });
      if (data.ok) {
        state.client = data.client || state.client;
        renderShell(data);
      }
    } catch {
      renderShell({
        user: { displayName: 'Local Preview', email: 'local@preview.test', isAdmin: true },
        client: state.client
      });
    }
  }

  function renderShell(data) {
    const user = data.user || {};
    const client = data.client || state.client;
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    setText(elements.clientMeta, text(client.name, 'Client Portal'));
    setText(elements.subtitle, text(client.name, 'Klien') + ' | Pendapatan Lainnya');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
  }

  function renderRows() {
    clearNode(elements.rows);
    const rows = filteredEntries();
    pruneSelection();
    rows.forEach(function (entry) {
      elements.rows.appendChild(entryRow(entry));
    });
    if (!rows.length) {
      const row = document.createElement('tr');
      const td = cell(state.searchTerm ? 'Tidak ada data yang cocok.' : 'Belum ada data Pendapatan Lainnya.');
      td.colSpan = 19;
      row.appendChild(td);
      elements.rows.appendChild(row);
    }
    const blankCount = Math.max(8 - rows.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
    setText(elements.count, rows.length + ' data');
    renderHeaderTotals(rows);
    syncSelectionControls(rows);
  }

  function renderHeaderTotals(rows) {
    const totals = {};
    incomeTotalKeys.forEach(function (key) {
      totals[key] = 0;
    });
    (Array.isArray(rows) ? rows : filteredEntries()).forEach(function (entry) {
      incomeTotalKeys.forEach(function (key) {
        const value = key === 'sisaPiutang' ? entrySisaPiutang(entry) : entry[key];
        totals[key] += Number(value || 0);
      });
    });
    elements.totalHeaders.forEach(function (header) {
      const key = header.getAttribute('data-income-total-key');
      const totalNode = header.querySelector('.sales-head-total');
      if (totalNode && Object.prototype.hasOwnProperty.call(totals, key)) {
        totalNode.textContent = formatAmountZero(roundAmount(totals[key]));
      }
    });
  }

  function pruneSelection() {
    const existingIds = new Set(state.entries.map(function (entry) {
      return entry.id;
    }));
    Array.from(state.selectedIds).forEach(function (id) {
      if (!existingIds.has(id)) state.selectedIds.delete(id);
    });
  }

  function syncSelectionControls(rows) {
    const visibleIds = rows.map(function (entry) {
      return entry.id;
    });
    const visibleSelected = visibleIds.filter(function (id) {
      return state.selectedIds.has(id);
    }).length;
    if (elements.selectAll) {
      elements.selectAll.checked = Boolean(visibleIds.length && visibleSelected === visibleIds.length);
      elements.selectAll.indeterminate = Boolean(visibleSelected && visibleSelected < visibleIds.length);
      elements.selectAll.disabled = !visibleIds.length;
    }
    if (elements.deleteSelectedButton) {
      const count = state.selectedIds.size;
      elements.deleteSelectedButton.disabled = count === 0;
      elements.deleteSelectedButton.textContent = count ? 'Hapus Terpilih (' + count + ')' : 'Hapus Terpilih';
    }
  }

  function filteredEntries() {
    const query = text(state.searchTerm).toLowerCase();
    return state.entries.filter(function (entry) {
      if (!entryWithinPeriod(entry)) return false;
      if (!query) return true;
      return [
        entry.noDokumen,
        entry.tanggalDokumen,
        entry.namaCustomer,
        entry.nikNpwp,
        entry.alamat,
        entry.keterangan,
        entry.businessEntityName,
        entry.businessEntityKey,
        entry.noFaktur,
        entry.tanggalFaktur,
        entry.fakturName,
        formatAmount(entry.nilaiDiterima),
        formatAmount(entryPelunasan(entry)),
        formatAmount(entrySisaPiutang(entry))
      ].join(' ').toLowerCase().includes(query);
    });
  }

  async function syncPostingStatus() {
    if (!window.ClientPortalPeriod || typeof window.ClientPortalPeriod.renderPosting !== 'function') return;
    const period = typeof window.ClientPortalPeriod.currentPeriod === 'function'
      ? window.ClientPortalPeriod.currentPeriod()
      : selectedPeriod();
    if (!period.month || !period.year) return;
    try {
      const response = await fetch(
        '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/period-posting?year=' + encodeURIComponent(period.year),
        {
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        }
      );
      if (!response.ok) return;
      const data = await response.json().catch(function () { return null; });
      if (!data || !data.ok || !Array.isArray(data.periods)) return;
      const posting = data.periods.find(function (item) {
        return Number(item.month) === Number(period.month);
      });
      window.ClientPortalPeriod.renderPosting(posting || { month: period.month, year: period.year, isPosted: false });
    } catch {}
  }

  function entryRow(entry) {
    const row = document.createElement('tr');
    row.appendChild(selectionCell(entry));
    row.appendChild(businessEntityCell(entry));
    row.appendChild(cellWithTitle(entry.noDokumen));
    row.appendChild(cell(formatDisplayDate(entry.tanggalDokumen)));
    row.appendChild(cellWithTitle(entry.namaCustomer));
    row.appendChild(cellWithTitle(entry.nikNpwp));
    row.appendChild(cellWithTitle(entry.alamat));
    row.appendChild(cellWithTitle(entry.keterangan));
    row.appendChild(cellWithTitle(entry.noFaktur));
    row.appendChild(cell(formatDisplayDate(entry.tanggalFaktur)));
    row.appendChild(cellWithTitle(entry.fakturName ? 'Ada file: ' + entry.fakturName : ''));
    row.appendChild(cell(formatAmount(entry.jumlah), 'number'));
    row.appendChild(cell(formatAmount(entry.dpp), 'number'));
    row.appendChild(cell(formatAmount(entry.ppn), 'number'));
    row.appendChild(cell(formatAmount(entry.pph23), 'number'));
    row.appendChild(cell(formatAmount(entry.nilaiDiterima), 'number'));
    row.appendChild(cell(formatAmount(entryPelunasan(entry)), 'number purchase-paid-cell'));
    row.appendChild(cell(formatAmount(entrySisaPiutang(entry)), 'number'));
    row.appendChild(actionCell(entry));
    return row;
  }

  function blankRow() {
    const row = document.createElement('tr');
    for (let index = 0; index < 19; index += 1) row.appendChild(cell(''));
    return row;
  }

  function businessEntityCell(entry) {
    return cellWithTitle(entry?.businessEntityName || entry?.businessEntityKey || '', 'client-entity-column');
  }

  function selectionCell(entry) {
    const td = document.createElement('td');
    td.className = 'sales-select-cell';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'sales-row-checkbox';
    input.checked = state.selectedIds.has(entry.id);
    input.setAttribute('aria-label', 'Pilih ' + text(entry.keterangan || entry.noDokumen, 'data'));
    input.addEventListener('change', function () {
      if (input.checked) {
        state.selectedIds.add(entry.id);
      } else {
        state.selectedIds.delete(entry.id);
      }
      syncSelectionControls(filteredEntries());
    });
    td.appendChild(input);
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

  function actionCell(entry) {
    const td = document.createElement('td');
    td.className = 'cashbook-actions';
    [
      ['Ubah', function () { openEditModal(entry); }, ''],
      ['Lihat', function () { openDetail(entry); }, ''],
      ['Pelunasan', function () { openSettlementModal(entry); }, ''],
      ['Inv', function () { printIncomeDocument(entry, 'invoice'); }, ''],
      ['Kwitansi', function () { printIncomeDocument(entry, 'receipt'); }, ''],
      ['Hapus', function () { deleteEntry(entry.id); }, 'danger']
    ].forEach(function (item) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cashbook-action-button' + (item[2] ? ' ' + item[2] : '');
      button.textContent = item[0];
      button.addEventListener('click', item[1]);
      td.appendChild(button);
    });
    return td;
  }

  function setReadonly(readonly) {
    state.readonly = readonly;
    Array.from(elements.form.querySelectorAll('input')).forEach(function (input) {
      if (input.type !== 'hidden') input.readOnly = readonly || input.hasAttribute('readonly');
    });
    elements.saveButton.hidden = readonly;
    elements.modalMeta.textContent = readonly ? 'Mode lihat data.' : 'Input dokumen pendapatan selain penjualan unit.';
  }

  function openAddModal() {
    elements.form.reset();
    elements.entryId.value = '';
    elements.tanggalDokumen.value = today();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.fakturFile);
    else if (elements.fakturFile) elements.fakturFile.value = '';
    setFileNote(null, null);
    setReadonly(false);
    elements.modalTitle.textContent = 'Tambah Pendapatan Lainnya';
    calculateIncome();
    elements.modal.hidden = false;
    window.setTimeout(function () { elements.noDokumen.focus(); }, 0);
  }

  function openEditModal(entry) {
    fillForm(entry);
    setReadonly(false);
    elements.modalTitle.textContent = 'Ubah Pendapatan Lainnya';
    elements.modal.hidden = false;
  }

  function openViewModal(entry) {
    fillForm(entry);
    setReadonly(true);
    elements.modalTitle.textContent = 'Lihat Pendapatan Lainnya';
    elements.modal.hidden = false;
  }

  function openSettlementModal(entry) {
    elements.settlementEntryId.value = entry.id;
    elements.tanggalPelunasan.value = entry.tanggalPelunasan || today();
    setNumber(elements.pelunasan, entryPelunasan(entry) || Number(entry.nilaiDiterima || 0));
    elements.keteranganPelunasan.value = entry.keteranganPelunasan || '';
    setText(elements.settlementMeta, text(entry.noDokumen) + ' | ' + text(entry.keterangan));
    calculateSettlementPreview();
    elements.settlementModal.hidden = false;
    window.setTimeout(function () { elements.pelunasan.focus(); }, 0);
  }

  function fillForm(entry) {
    elements.entryId.value = entry.id;
    elements.noDokumen.value = entry.noDokumen || '';
    elements.tanggalDokumen.value = entry.tanggalDokumen || today();
    elements.namaCustomer.value = entry.namaCustomer || '';
    elements.nikNpwp.value = entry.nikNpwp || '';
    elements.alamat.value = entry.alamat || '';
    elements.keterangan.value = entry.keterangan || '';
    elements.noFaktur.value = entry.noFaktur || '';
    elements.tanggalFaktur.value = entry.tanggalFaktur || '';
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.fakturFile);
    else if (elements.fakturFile) elements.fakturFile.value = '';
    setFileNote({
      name: entry.fakturName,
      size: entry.fakturSize
    });
    setNumber(elements.jumlah, entry.jumlah);
    setNumber(elements.pph23, entry.pph23);
    calculateIncome();
  }

  function closeModal() {
    elements.modal.hidden = true;
    setReadonly(false);
  }

  function closeSettlementModal() {
    elements.settlementModal.hidden = true;
  }

  function filePayload() {
    if (window.clientPortalBuildNamedFilePayload) {
      return window.clientPortalBuildNamedFilePayload(elements.fakturFile, 'faktur').then(function (payload) {
        if (payload.fakturDataUrl) return payload;
        const existing = state.entries.find(function (entry) {
          return entry.id === elements.entryId.value;
        });
        return {
          fakturName: existing ? existing.fakturName || '' : '',
          fakturMimeType: existing ? existing.fakturMimeType || '' : '',
          fakturSize: existing ? existing.fakturSize || 0 : 0,
          fakturDataUrl: existing ? existing.fakturDataUrl || '' : ''
        };
      });
    }
    return new Promise(function (resolve, reject) {
      const file = elements.fakturFile && elements.fakturFile.files && elements.fakturFile.files[0];
      if (!file) {
        const existing = state.entries.find(function (entry) {
          return entry.id === elements.entryId.value;
        });
        resolve({
          fakturName: existing ? existing.fakturName || '' : '',
          fakturMimeType: existing ? existing.fakturMimeType || '' : '',
          fakturSize: existing ? existing.fakturSize || 0 : 0,
          fakturDataUrl: existing ? existing.fakturDataUrl || '' : ''
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        resolve({
          fakturName: file.name,
          fakturMimeType: file.type || 'application/octet-stream',
          fakturSize: file.size || 0,
          fakturDataUrl: String(reader.result || '')
        });
      };
      reader.onerror = function () {
        reject(new Error('Gagal membaca file faktur.'));
      };
      reader.readAsDataURL(file);
    });
  }

  async function formPayload() {
    const totals = calculateIncome();
    const existing = state.entries.find(function (entry) {
      return entry.id === elements.entryId.value;
    }) || {};
    const entity = currentBusinessEntitySelection(existing);
    return Object.assign({
      id: elements.entryId.value || cryptoId(),
      businessEntityKey: entity.key,
      businessEntityName: entity.name,
      noDokumen: text(elements.noDokumen.value),
      tanggalDokumen: elements.tanggalDokumen.value,
      namaCustomer: text(elements.namaCustomer.value),
      nikNpwp: text(elements.nikNpwp.value),
      alamat: text(elements.alamat.value),
      keterangan: text(elements.keterangan.value),
      noFaktur: text(elements.noFaktur.value),
      tanggalFaktur: elements.tanggalFaktur.value,
      jumlah: totals.jumlah,
      dpp: totals.dpp,
      ppn: totals.ppn,
      pph23: totals.pph23,
      nilaiDiterima: totals.nilaiDiterima,
      pelunasan: entryPelunasan(existing),
      tanggalPelunasan: existing.tanggalPelunasan || '',
      keteranganPelunasan: existing.keteranganPelunasan || ''
    }, await filePayload());
  }

  async function submitForm(event) {
    event.preventDefault();
    if (state.readonly) return;
    elements.saveButton.disabled = true;
    let payload = null;
    try {
      payload = await formPayload();
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan file faktur.', 'error');
      elements.saveButton.disabled = false;
      return;
    }
    try {
      const index = state.entries.findIndex(function (entry) { return entry.id === payload.id; });
      if (index >= 0) {
        state.entries[index] = normalizeEntry(payload);
      } else {
        state.entries.unshift(normalizeEntry(payload));
      }
      saveEntries();
      renderRows();
      closeModal();
      setAlert('Data Pendapatan Lainnya tersimpan: ' + payload.noDokumen, 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan data Pendapatan Lainnya.', 'error');
    } finally {
      elements.saveButton.disabled = false;
    }
  }

  function deleteEntry(entryId) {
    const entry = state.entries.find(function (item) { return item.id === entryId; });
    if (!entry) return;
    if (!window.confirm('Hapus data Pendapatan Lainnya?\n\n' + text(entry.noDokumen) + ' - ' + text(entry.namaCustomer))) return;
    state.entries = state.entries.filter(function (item) { return item.id !== entryId; });
    state.selectedIds.delete(entryId);
    saveEntries();
    renderRows();
    setAlert('Data dihapus: ' + text(entry.noDokumen), 'info');
  }

  function deleteSelectedEntries() {
    const ids = Array.from(state.selectedIds);
    if (!ids.length) return;
    if (!window.confirm('Hapus ' + ids.length + ' data Pendapatan Lainnya yang dipilih?')) return;
    const selected = new Set(ids);
    state.entries = state.entries.filter(function (entry) {
      return !selected.has(entry.id);
    });
    state.selectedIds.clear();
    saveEntries();
    renderRows();
    setAlert(ids.length + ' data terpilih dihapus.', 'info');
  }

  function submitSettlement(event) {
    event.preventDefault();
    const entry = state.entries.find(function (item) {
      return item.id === elements.settlementEntryId.value;
    });
    if (!entry) return;
    entry.pelunasan = roundAmount(parseAmount(elements.pelunasan));
    entry.tanggalPelunasan = elements.tanggalPelunasan.value || today();
    entry.keteranganPelunasan = text(elements.keteranganPelunasan.value);
    saveEntries();
    renderRows();
    closeSettlementModal();
    setAlert('Pelunasan tersimpan: ' + text(entry.noDokumen), 'info');
  }

  function openDetail(entry) {
    setText(elements.detailMeta, text(entry.noDokumen) + ' | ' + text(entry.namaCustomer));
    clearNode(elements.detailContent);
    elements.detailContent.appendChild(detailSummaryCards([
      ['No Dokumen', entry.noDokumen],
      ['Tanggal', entry.tanggalDokumen],
      ['Customer', entry.namaCustomer],
      ['Nilai Diterima', formatAmount(entry.nilaiDiterima)],
      ['Sisa Piutang', formatAmount(entrySisaPiutang(entry))]
    ]));
    elements.detailContent.appendChild(detailSection('Identitas', [
      ['Nama Customer', entry.namaCustomer],
      ['NIK/NPWP', entry.nikNpwp],
      ['Alamat', entry.alamat],
      ['Keterangan Penghasilan', entry.keterangan],
      ['No Faktur', entry.noFaktur],
      ['Tanggal Faktur', entry.tanggalFaktur],
      ['File Faktur', entry.fakturName || '-']
    ]));
    elements.detailContent.appendChild(detailSection('Nominal', [
      ['Jumlah', formatAmount(entry.jumlah)],
      ['DPP', formatAmount(entry.dpp)],
      ['PPN', formatAmount(entry.ppn)],
      ['PPH 23', formatAmount(entry.pph23)],
      ['Nilai Diterima', formatAmount(entry.nilaiDiterima)],
      ['Pelunasan', formatAmount(entryPelunasan(entry))],
      ['Tanggal Pelunasan', entry.tanggalPelunasan],
      ['Keterangan Pelunasan', entry.keteranganPelunasan],
      ['Sisa Piutang', formatAmount(entrySisaPiutang(entry))]
    ]));
    elements.detailModal.hidden = false;
  }

  function detailSummaryCards(items) {
    const wrap = document.createElement('div');
    wrap.className = 'sales-detail-summary';
    items.forEach(function (item) {
      const card = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = item[0];
      const value = document.createElement('strong');
      value.textContent = text(item[1], '-');
      card.appendChild(label);
      card.appendChild(value);
      wrap.appendChild(card);
    });
    return wrap;
  }

  function detailSection(title, rows) {
    const section = document.createElement('section');
    section.className = 'sales-detail-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const grid = document.createElement('div');
    grid.className = 'sales-detail-grid';
    rows.forEach(function (row) {
      const item = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = row[0];
      const value = document.createElement('strong');
      value.textContent = text(row[1], '-');
      item.appendChild(label);
      item.appendChild(value);
      grid.appendChild(item);
    });
    section.appendChild(heading);
    section.appendChild(grid);
    return section;
  }

  function printIncomeDocument(entry, type) {
    const popup = window.open('', '_blank');
    if (!popup) {
      setAlert('Popup diblokir browser. Izinkan popup untuk mencetak dokumen.', 'error');
      return;
    }
    popup.document.open();
    popup.document.write(type === 'invoice' ? invoiceHtml(entry) : receiptHtml(entry));
    popup.document.close();
    popup.focus();
  }

  function invoiceHtml(entry) {
    return documentShell('Invoice ' + entry.noDokumen,
      '<main class="income-print invoice-print">' +
        printHeader('INVOICE') +
        '<table class="print-table compact"><tbody>' +
          printTableRow('No.Invoice', entry.noDokumen, 'Tanggal', formatPrintDate(entry.tanggalDokumen)) +
          printTableRow('No.Kwitansi', entry.noDokumen, '', '') +
        '</tbody></table>' +
        printTableBlock('Identitas Pembeli', [
          ['Nama', entry.namaCustomer],
          ['NIK', entry.nikNpwp],
          ['NPWP', entry.nikNpwp],
          ['Alamat', entry.alamat]
        ]) +
        printTableBlock('Keterangan Penghasilan', [
          ['Uraian', entry.keterangan],
          ['No Dokumen', entry.noDokumen],
          ['Tanggal Dokumen', formatPrintDate(entry.tanggalDokumen)],
          ['No Faktur', entry.noFaktur],
          ['Tanggal Faktur', formatPrintDate(entry.tanggalFaktur)]
        ]) +
        '<section class="income-amount-box">' +
          '<h2>Rincian Pendapatan</h2>' +
          amountLine('Jumlah', entry.jumlah, false) +
          amountLine('DPP', entry.dpp, false) +
          amountLine('PPN', entry.ppn, false) +
          amountLine('PPH 23', entry.pph23, false) +
          amountLine('NILAI DITERIMA', entry.nilaiDiterima, true) +
        '</section>' +
        '<div class="terbilang"><span>Terbilang</span><strong>' + escapeHtml(terbilangRupiah(entry.nilaiDiterima)) + '</strong></div>' +
        printSign(entry) +
        printFooter() +
      '</main>');
  }

  function receiptHtml(entry) {
    return documentShell('Kwitansi ' + entry.noDokumen,
      '<main class="income-print receipt-print">' +
        printHeader('') +
        '<div class="receipt-title"><strong>KWITANSI</strong><span>NO ' + escapeHtml(entry.noDokumen) + '</span></div>' +
        printLine('Diterima dari', entry.namaCustomer + (text(entry.alamat) ? ' - ' + entry.alamat : '')) +
        '<div class="print-row print-row-highlight"><span>Jumlah uang</span><i>:</i><strong>' + escapeHtml(terbilangRupiah(entry.nilaiDiterima)) + '</strong></div>' +
        printLine('Jenis Pembayaran', 'Pendapatan Lainnya') +
        '<div class="payment-detail">' +
          '<span>Untuk pembayaran</span>' +
          '<i>:</i>' +
          '<div class="payment-lines">' +
            '<div class="payment-product">' + escapeHtml(entry.keterangan) + '</div>' +
            '<div class="small-line"><span>No Dokumen</span><i>:</i><strong>' + escapeHtml(entry.noDokumen) + '</strong></div>' +
            '<div class="small-line"><span>Tanggal</span><i>:</i><strong>' + escapeHtml(formatPrintDate(entry.tanggalDokumen)) + '</strong></div>' +
          '</div>' +
        '</div>' +
        '<div class="receipt-bottom">' +
          '<div>' +
            '<div class="receipt-amount"><span>Rp</span><strong>' + escapeHtml(formatAmount(entry.nilaiDiterima)) + '</strong></div>' +
            '<p>Pembayaran dengan cek/giro dianggap sah setelah diuangkan/clearing.</p>' +
          '</div>' +
          '<div class="sign-box">Ambarawa, ' + escapeHtml(formatPrintDate(entry.tanggalDokumen)) + '<br><span>( ____________________ )</span></div>' +
        '</div>' +
        printSign(entry) +
        printFooter() +
      '</main>');
  }

  function documentShell(title, body) {
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title>' +
      '<style>' + printStyles() + '</style></head><body>' + body + '</body></html>';
  }

  function printHeader(title) {
    return '<header class="print-header">' +
      '<div class="pm-logo"><img src="/app/assets/client/persada-motor-logo.png" alt="DemoMotor Motor"></div>' +
      '<div class="print-company">' +
        '<h1>CV. DEMO_MOTOR ABR</h1>' +
        '<p>Jl. Jend Sudirman No.55 Kupang-Ambarawa Kab. Semarang</p>' +
        '<p>Jawa Tengah</p>' +
        '<p>Telp. (0298) 592 655</p>' +
      '</div>' +
    '</header>' +
    (title ? '<div class="document-title">' + escapeHtml(title) + '</div>' : '');
  }

  function printTableRow(leftLabel, leftValue, rightLabel, rightValue) {
    return '<tr><td class="meta-label">' + escapeHtml(leftLabel) + '</td><td class="colon">:</td><td>' + escapeHtml(leftValue) + '</td>' +
      '<td class="meta-label">' + escapeHtml(rightLabel) + '</td><td class="colon">:</td><td>' + escapeHtml(rightValue) + '</td></tr>';
  }

  function printTableBlock(title, rows) {
    return '<table class="print-table block"><tbody>' +
      '<tr><th colspan="3">' + escapeHtml(title) + '</th></tr>' +
      rows.map(function (row) {
        return '<tr><td class="block-label">' + escapeHtml(row[0]) + '</td><td class="colon">:</td><td>' + escapeHtml(row[1]) + '</td></tr>';
      }).join('') +
    '</tbody></table>';
  }

  function amountLine(label, value, strong) {
    return '<div class="amount-line' + (strong ? ' total' : '') + '"><span>' + escapeHtml(label) + '</span><b>Rp.</b><strong>' + escapeHtml(formatAmount(value) || '-') + '</strong></div>';
  }

  function printLine(label, value) {
    return '<div class="receipt-line"><span>' + escapeHtml(label) + '</span><b>:</b><strong>' + escapeHtml(value) + '</strong></div>';
  }

  function printSign(entry) {
    return '<div class="print-sign">Ambarawa, ' + escapeHtml(formatPrintDate(entry.tanggalDokumen)) + '<br><br><br><br><strong>( ____________________ )</strong></div>';
  }

  function printFooter() {
    return '<footer class="print-footer"><span>CV. DEMO_MOTOR ABR</span><span>Dokumen Pendapatan Lainnya</span></footer>';
  }

  function printStyles() {
    return [
      '@page{size:A4;margin:10mm}',
      'html,body,*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}',
      'body{margin:0;background:#e5e7eb;color:#000;font-family:Arial,sans-serif;font-size:12px}',
      '.income-print{position:relative;width:190mm;min-height:270mm;margin:0 auto;background:#fff;box-shadow:inset 0 0 0 1px #111;padding:12px 14px 30px;overflow:hidden}',
      '.print-header{display:grid;grid-template-columns:90px 1fr;align-items:start;gap:14px;margin-bottom:8px}',
      '.pm-logo{width:76px;height:76px;display:block}.pm-logo img{display:block;width:76px;height:76px}',
      '.print-company h1{margin:4px 0 2px;font-size:16px}.print-company p{margin:0 0 2px;font-size:12px;font-weight:700}',
      '.document-title{text-align:center;font-size:22px;font-weight:900;letter-spacing:7px;margin:-2px 0 2px}',
      '.print-table{width:100%;border-collapse:collapse;margin-bottom:10px}.print-table td,.print-table th{border:1px solid #111;padding:4px 6px;vertical-align:top}.print-table th{font-size:13px;text-align:left}.print-table.compact td{border-left:0;border-right:0}.meta-label,.block-label{font-weight:700}.meta-label{width:150px}.block-label{width:185px}.colon{width:14px;text-align:center}',
      '.income-amount-box{border:1px solid #111;margin-top:12px;padding:10px 12px}.income-amount-box h2{margin:0 0 8px;font-size:14px}.amount-line{display:grid;grid-template-columns:1fr 42px 280px;gap:4px;align-items:center;margin:6px 0}.amount-line strong{border-bottom:1px solid #111;text-align:right;padding:2px 8px}.amount-line.total{font-weight:900}.amount-line.total strong{font-size:14px}',
      '.terbilang{margin:12px 0;padding:8px 10px;border:1px solid #111;background:#cfe2f3;box-shadow:inset 0 0 0 999px #cfe2f3}.terbilang span{display:block;font-size:11px}.terbilang strong{text-transform:uppercase;line-height:1.5}',
      '.receipt-title{display:flex;justify-content:center;gap:28px;margin:18px 0 16px;font-size:13px}.receipt-line,.print-row{display:grid;grid-template-columns:104px 14px 1fr;align-items:center;gap:3px;margin:10px 0}.receipt-line strong{border-bottom:1px solid #111;min-height:18px;font-weight:400;padding-left:4px}.print-row-highlight strong{display:flex;align-items:center;min-height:38px;padding:8px 12px;background:#cfe2f3;border:1px solid #111;text-transform:uppercase;box-shadow:inset 0 0 0 999px #cfe2f3}.payment-detail{display:grid;grid-template-columns:104px 14px 1fr;gap:3px;margin:10px 0}.payment-lines{max-width:520px}.payment-product{margin-bottom:2px}.small-line{display:grid;grid-template-columns:118px 12px 1fr;gap:3px;margin:3px 0}.small-line strong{border-bottom:1px solid #111;font-weight:400}',
      '.receipt-bottom{display:grid;grid-template-columns:210px 1fr;gap:110px;margin:18px 0}.receipt-amount{width:170px;display:flex;gap:14px;align-items:center;justify-content:space-between;padding:12px 10px;border:1px solid #111;background:#cfe2f3;box-shadow:inset 0 0 0 999px #cfe2f3;font-size:16px}.receipt-bottom p{margin:12px 0 0;font-size:11px;line-height:1.45}.sign-box{text-align:center;padding-top:8px}.sign-box span{display:inline-block;margin:86px 60px 0}',
      '.print-sign{width:260px;text-align:center;margin:16px 36px 0 auto}.receipt-print .print-sign{display:none}',
      '.print-footer{position:absolute;left:14px;right:14px;bottom:9px;display:flex;justify-content:space-between;gap:12px;border-top:1px solid #d1d5db;padding-top:4px;font-size:10px;color:#111}',
      '@media print{body{background:#fff}.income-print{margin:0;width:100%;min-height:auto;box-shadow:none}}'
    ].join('');
  }

  function formatPrintDate(value) {
    if (!value) return '-';
    const parts = String(value).split('-');
    if (parts.length !== 3) return value;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
  }

  function terbilangRupiah(value) {
    const amount = Math.round(Number(value || 0));
    if (!amount) return 'Nol Rupiah';
    return terbilang(amount) + ' Rupiah';
  }

  function terbilang(value) {
    const words = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    const n = Math.floor(Number(value || 0));
    if (n < 12) return words[n];
    if (n < 20) return terbilang(n - 10) + ' Belas';
    if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
    if (n < 200) return 'Seratus ' + terbilang(n - 100);
    if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
    if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
    return terbilang(Math.floor(n / 1000000000)) + ' Miliar ' + terbilang(n % 1000000000);
  }

  async function refresh() {
    await loadEntries();
    renderRows();
    await syncPostingStatus();
  }

  async function logout() {
    window.location.assign('/app/client/login');
  }

  if (elements.addButton) elements.addButton.addEventListener('click', openAddModal);
  if (elements.deleteSelectedButton) elements.deleteSelectedButton.addEventListener('click', deleteSelectedEntries);
  if (elements.refreshButton) elements.refreshButton.addEventListener('click', refresh);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.closeButton) elements.closeButton.addEventListener('click', closeModal);
  if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeModal);
  if (elements.form) elements.form.addEventListener('submit', submitForm);
  if (elements.settlementForm) elements.settlementForm.addEventListener('submit', submitSettlement);
  if (elements.settlementCloseButton) elements.settlementCloseButton.addEventListener('click', closeSettlementModal);
  if (elements.settlementCancelButton) elements.settlementCancelButton.addEventListener('click', closeSettlementModal);
  if (elements.selectAll) {
    elements.selectAll.addEventListener('change', function () {
      const rows = filteredEntries();
      rows.forEach(function (entry) {
        if (elements.selectAll.checked) {
          state.selectedIds.add(entry.id);
        } else {
          state.selectedIds.delete(entry.id);
        }
      });
      renderRows();
    });
  }
  if (elements.detailCloseButton) elements.detailCloseButton.addEventListener('click', function () { elements.detailModal.hidden = true; });
  if (elements.detailDoneButton) elements.detailDoneButton.addEventListener('click', function () { elements.detailModal.hidden = true; });
  if (elements.searchInput) elements.searchInput.addEventListener('input', function () {
    state.searchTerm = elements.searchInput.value || '';
    renderRows();
  });
  [elements.jumlah, elements.pph23].forEach(function (input) {
    if (!input) return;
    input.addEventListener('input', function () {
      formatRupiahField(input);
      calculateIncome();
    });
  });
  if (elements.pelunasan) {
    elements.pelunasan.addEventListener('input', function () {
      formatRupiahField(elements.pelunasan);
      calculateSettlementPreview();
    });
  }
  if (elements.fakturFile) {
    elements.fakturFile.addEventListener('change', function () {
      setFileNote(null, null);
    });
    elements.fakturFile.addEventListener('client-portal-upload-files', function () {
      setFileNote(null, null);
    });
  }
  Array.from(document.querySelectorAll('[data-rupiah="true"]')).forEach(function (input) {
    ['focus', 'blur', 'change'].forEach(function (eventName) {
      input.addEventListener(eventName, function () { formatRupiahField(input); });
    });
  });
  [elements.modal, elements.detailModal, elements.settlementModal].forEach(function (modal) {
    if (!modal) return;
    modal.addEventListener('click', function (event) {
      if (event.target === modal) modal.hidden = true;
    });
  });

  loadShell().then(refresh);
})();
