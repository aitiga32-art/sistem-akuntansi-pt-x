(function () {
  const state = {
    client: null,
    entries: [],
    settlements: [],
    fakturEntries: [],
    completeEntries: [],
    inventoryOptions: [],
    settlementSources: [],
    businessEntities: [],
    nextReceipt: null,
    nextInvoice: null,
    editingDpId: '',
    editingLengkapId: '',
    activeCompleteSettlementId: '',
    activeDetailKind: '',
    activeDetailId: '',
    lengkapStep: 'idle',
    pelunasanPaymentRowsDirty: false,
    searchTerm: '',
    selectedIds: new Set(),
    loading: false
  };

  const elements = {
    alert: document.getElementById('salesAlert'),
    title: document.querySelector('.portal-title'),
    clientMeta: document.getElementById('salesClientMeta'),
    userName: document.getElementById('salesUserName'),
    userEmail: document.getElementById('salesUserEmail'),
    refreshButton: document.getElementById('salesRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('salesBackLink'),
    subtitle: document.getElementById('salesSubtitle'),
    stockWarning: document.getElementById('salesStockWarning'),
    addButton: document.getElementById('salesAddBtn'),
    importButton: document.getElementById('salesImportBtn'),
    importFile: document.getElementById('salesImportFile'),
    searchInput: document.getElementById('salesSearchInput'),
    searchButton: document.getElementById('salesSearchBtn'),
    deleteSelectedButton: document.getElementById('salesDeleteSelectedBtn'),
    exportButton: document.getElementById('salesExportBtn'),
    selectAll: document.getElementById('salesSelectAll'),
    count: document.getElementById('salesCount'),
    rows: document.getElementById('salesRows'),
    typeModal: document.getElementById('salesTypeModal'),
    typeCloseButton: document.getElementById('salesTypeCloseBtn'),
    dpModal: document.getElementById('salesDpModal'),
    dpForm: document.getElementById('salesDpForm'),
    dpTitle: document.getElementById('salesDpTitle'),
    dpCloseButton: document.getElementById('salesDpCloseBtn'),
    dpCancelButton: document.getElementById('salesDpCancelBtn'),
    dpSaveButton: document.getElementById('salesDpSaveBtn'),
    dpMeta: document.getElementById('salesDpMeta'),
    searchDpModal: document.getElementById('salesSearchDpModal'),
    searchDpCloseButton: document.getElementById('salesSearchDpCloseBtn'),
    dpSearch: document.getElementById('salesDpSearch'),
    dpSearchRows: document.getElementById('salesDpSearchRows'),
    detailModal: document.getElementById('salesDetailModal'),
    detailCloseButton: document.getElementById('salesDetailCloseBtn'),
    detailDoneButton: document.getElementById('salesDetailDoneBtn'),
    detailMeta: document.getElementById('salesDetailMeta'),
    detailContent: document.getElementById('salesDetailContent'),
    detailActions: document.getElementById('salesDetailActions'),
    pelunasanModal: document.getElementById('salesPelunasanModal'),
    pelunasanForm: document.getElementById('salesPelunasanForm'),
    pelunasanTitle: document.getElementById('salesPelunasanTitle'),
    pelunasanMeta: document.getElementById('salesPelunasanMeta'),
    pelunasanCloseButton: document.getElementById('salesPelunasanCloseBtn'),
    pelunasanCancelButton: document.getElementById('salesPelunasanCancelBtn'),
    pelunasanSaveButton: document.getElementById('salesPelunasanSaveBtn'),
    pelunasanSimpleGrid: document.getElementById('salesMbarepSettlementGrid'),
    pelunasanLegacyForm: document.getElementById('salesLegacySettlementForm'),
    pelunasanSimpleDate: document.getElementById('salesPelunasanSimpleDate'),
    pelunasanSimpleAmount: document.getElementById('salesPelunasanSimpleAmount'),
    pelunasanSimpleSource: document.getElementById('salesPelunasanSimpleSource'),
    pelunasanSimpleNotes: document.getElementById('salesPelunasanSimpleNotes'),
    pelunasanSimplePayments: document.getElementById('salesPelunasanSimplePayments'),
    pelunasanSimpleAddPaymentButton: document.getElementById('salesPelunasanSimpleAddPaymentBtn'),
    pelunasanSimplePaymentsTotal: document.getElementById('salesPelunasanSimplePaymentsTotal'),
    pelunasanDpSelect: document.getElementById('salesPelunasanDpSelect'),
    pelunasanDpOptions: document.getElementById('salesPelunasanDpOptions'),
    pelunasanTanggalKwitansi: document.getElementById('salesPelunasanTanggalKwitansi'),
    pelunasanNoRangka: document.getElementById('salesPelunasanNoRangka'),
    pelunasanTipeMotor: document.getElementById('salesPelunasanTipeMotor'),
    pelunasanNoMesin: document.getElementById('salesPelunasanNoMesin'),
    pelunasanWarna: document.getElementById('salesPelunasanWarna'),
    pelunasanNoInvoice: document.getElementById('salesPelunasanNoInvoice'),
    pelunasanTanggalInvoice: document.getElementById('salesPelunasanTanggalInvoice'),
    pelunasanNamaCustomer: document.getElementById('salesPelunasanNamaCustomer'),
    pelunasanNikNpwp: document.getElementById('salesPelunasanNikNpwp'),
    pelunasanAlamat: document.getElementById('salesPelunasanAlamat'),
    pelunasanHargaPricelist: document.getElementById('salesPelunasanHargaPricelist'),
    pelunasanDisc: document.getElementById('salesPelunasanDisc'),
    pelunasanDiscTambahan: document.getElementById('salesPelunasanDiscTambahan'),
    pelunasanHargaSetelahDisc: document.getElementById('salesPelunasanHargaSetelahDisc'),
    pelunasanDpPaid: document.getElementById('salesPelunasanDpPaid'),
    pelunasanBbnNotice: document.getElementById('salesPelunasanBbnNotice'),
    pelunasanNilaiPajak: document.getElementById('salesPelunasanNilaiPajak'),
    pelunasanDpp: document.getElementById('salesPelunasanDpp'),
    pelunasanPpn: document.getElementById('salesPelunasanPpn'),
    pelunasanDppPpn: document.getElementById('salesPelunasanDppPpn'),
    pelunasanSource: document.getElementById('salesPelunasanSource'),
    pelunasanPayments: document.getElementById('salesPelunasanPayments'),
    pelunasanAddPaymentButton: document.getElementById('salesPelunasanAddPaymentBtn'),
    pelunasanPaymentsTotal: document.getElementById('salesPelunasanPaymentsTotal'),
    receiptNo: document.getElementById('salesReceiptNo'),
    tanggal: document.getElementById('salesTanggal'),
    inventoryVehicleSelect: document.getElementById('salesInventoryVehicleSelect'),
    noRangka: document.getElementById('salesNoRangka'),
    tipeMotor: document.getElementById('salesTipeMotor'),
    noMesin: document.getElementById('salesNoMesin'),
    warna: document.getElementById('salesWarna'),
    inventoryFrameOptions: document.getElementById('salesInventoryFrameOptions'),
    inventoryTypeOptions: document.getElementById('salesInventoryTypeOptions'),
    inventoryColorOptions: document.getElementById('salesInventoryColorOptions'),
    namaCustomer: document.getElementById('salesNamaCustomer'),
    nikNpwp: document.getElementById('salesNikNpwp'),
    alamat: document.getElementById('salesAlamat'),
    catatan: document.getElementById('salesCatatan'),
    hargaPricelist: document.getElementById('salesHargaPricelist'),
    disc: document.getElementById('salesDisc'),
    hargaSetelahDisc: document.getElementById('salesHargaSetelahDisc'),
    dpCustomer: document.getElementById('salesDpCustomer'),
    dpTambahan: document.getElementById('salesDpTambahan'),
    jumlahDp: document.getElementById('salesJumlahDp'),
    dpAttachmentFile: document.getElementById('salesDpAttachmentFile'),
    dpAttachmentNote: document.getElementById('salesDpAttachmentNote'),
    bbnNotice: document.getElementById('salesBbnNotice'),
    nilaiPenyerahanPajak: document.getElementById('salesNilaiPenyerahanPajak'),
    bbnUnnotice: document.getElementById('salesBbnUnnotice'),
    dpp: document.getElementById('salesDpp'),
    ppn: document.getElementById('salesPpn'),
    dppPpn: document.getElementById('salesDppPpn'),
    pelunasanAttachmentFile: document.getElementById('salesPelunasanAttachmentFile'),
    pelunasanAttachmentNote: document.getElementById('salesPelunasanAttachmentNote'),
    fakturModal: document.getElementById('salesFakturModal'),
    fakturForm: document.getElementById('salesFakturForm'),
    fakturCloseButton: document.getElementById('salesFakturCloseBtn'),
    fakturCancelButton: document.getElementById('salesFakturCancelBtn'),
    fakturSaveButton: document.getElementById('salesFakturSaveBtn'),
    fakturMeta: document.getElementById('salesFakturMeta'),
    fakturDpEntryId: document.getElementById('salesFakturDpEntryId'),
    fakturNo: document.getElementById('salesFakturNo'),
    fakturTanggal: document.getElementById('salesFakturTanggal'),
    fakturAttachmentFile: document.getElementById('salesFakturAttachmentFile'),
    fakturAttachmentNote: document.getElementById('salesFakturAttachmentNote'),
    lengkapModal: document.getElementById('salesLengkapModal'),
    lengkapForm: document.getElementById('salesLengkapForm'),
    lengkapCloseButton: document.getElementById('salesLengkapCloseBtn'),
    lengkapCancelButton: document.getElementById('salesLengkapCancelBtn'),
    lengkapSaveButton: document.getElementById('salesLengkapSaveBtn'),
    lengkapEntityGateGrid: document.getElementById('salesLengkapEntityGateGrid'),
    lengkapEntityGateField: document.getElementById('salesLengkapEntityGateField'),
    lengkapEntityGateSelect: document.getElementById('salesLengkapEntityGateSelect'),
    lengkapDetails: document.getElementById('salesLengkapDetails'),
    lengkapFooter: document.getElementById('salesLengkapFooter'),
    lengkapReceiptNo: document.getElementById('salesLengkapReceiptNo'),
    lengkapTanggal: document.getElementById('salesLengkapTanggal'),
    lengkapInventoryVehicleSelect: document.getElementById('salesLengkapInventoryVehicleSelect'),
    lengkapNoRangka: document.getElementById('salesLengkapNoRangka'),
    lengkapTipeMotor: document.getElementById('salesLengkapTipeMotor'),
    lengkapNoMesin: document.getElementById('salesLengkapNoMesin'),
    lengkapWarna: document.getElementById('salesLengkapWarna'),
    lengkapNamaCustomer: document.getElementById('salesLengkapNamaCustomer'),
    lengkapNikNpwp: document.getElementById('salesLengkapNikNpwp'),
    lengkapAlamat: document.getElementById('salesLengkapAlamat'),
    lengkapCatatan: document.getElementById('salesLengkapCatatan'),
    lengkapNoInvoice: document.getElementById('salesLengkapNoInvoice'),
    lengkapTanggalInvoice: document.getElementById('salesLengkapTanggalInvoice'),
    lengkapItemsList: document.getElementById('salesLengkapItemsList'),
    lengkapAddItemButton: document.getElementById('salesLengkapAddItemBtn'),
    lengkapItemsSummary: document.getElementById('salesLengkapItemsSummary'),
    lengkapHargaPricelist: document.getElementById('salesLengkapHargaPricelist'),
    lengkapDisc: document.getElementById('salesLengkapDisc'),
    lengkapHargaSetelahDisc: document.getElementById('salesLengkapHargaSetelahDisc'),
    lengkapBbnNotice: document.getElementById('salesLengkapBbnNotice'),
    lengkapNilaiPajak: document.getElementById('salesLengkapNilaiPajak'),
    lengkapDpp: document.getElementById('salesLengkapDpp'),
    lengkapPpn: document.getElementById('salesLengkapPpn'),
    lengkapDppPpn: document.getElementById('salesLengkapDppPpn'),
    lengkapTotalTagihan: document.getElementById('salesLengkapTotalTagihan'),
    lengkapAttachmentFile: document.getElementById('salesLengkapAttachmentFile'),
    lengkapAttachmentNote: document.getElementById('salesLengkapAttachmentNote'),
    fileModal: document.getElementById('salesFileModal'),
    fileTitle: document.getElementById('salesFileTitle'),
    fileMeta: document.getElementById('salesFileMeta'),
    fileTabs: document.getElementById('salesFileTabs'),
    fileViewer: document.getElementById('salesFileViewer'),
    fileCloseButton: document.getElementById('salesFileCloseBtn')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));
  elements.totalHeaders = Array.from(document.querySelectorAll('[data-sales-total-key]'));

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  const salesTotalKeys = [
    'hargaPricelist',
    'quantity',
    'totalDiscount',
    'hargaSetelahDisc',
    'jumlahDp',
    'bbnUnnotice',
    'nilaiPenyerahanPajak',
    'dpp',
    'ppn',
    'dppPpn',
    'bbnNotice',
    'totalTagihan',
    'sisaPiutang'
  ];
  let alertTimer = null;

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

  function setAlert(message, kind) {
    if (!elements.alert) return;
    if (alertTimer) {
      window.clearTimeout(alertTimer);
      alertTimer = null;
    }
    elements.alert.hidden = !message;
    elements.alert.textContent = message || '';
    elements.alert.className = 'portal-alert' + (kind ? ' ' + kind : '');
    if (message && kind !== 'error') {
      const expectedMessage = String(message);
      alertTimer = window.setTimeout(function () {
        if (elements.alert.textContent === expectedMessage) {
          elements.alert.hidden = true;
          elements.alert.textContent = '';
        }
        alertTimer = null;
      }, 3000);
    }
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/buku-penjualan/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/buku-penjualan';
  }

  async function requestJson(url, options) {
    const response = await fetch(url, Object.assign({
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Buku Penjualan.');
    return data;
  }

  async function loadSales(receiptDate, options) {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const params = new URLSearchParams();
      const loadOptions = options || {};
      if (receiptDate) params.set('date', receiptDate);
      if (loadOptions.invoiceDate) params.set('invoiceDate', loadOptions.invoiceDate);
      if (loadOptions.businessEntityKey) params.set('businessEntityKey', loadOptions.businessEntityKey);
      const queryString = params.toString();
      const url = apiBase() + (queryString ? '?' + queryString : '');
      const data = await requestJson(url);
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.settlements = Array.isArray(data.settlements) ? data.settlements : [];
      state.fakturEntries = Array.isArray(data.fakturEntries) ? data.fakturEntries : [];
      state.completeEntries = Array.isArray(data.completeEntries) ? data.completeEntries : [];
      state.inventoryOptions = Array.isArray(data.inventoryOptions) ? data.inventoryOptions : [];
      state.settlementSources = Array.isArray(data.settlementSources) ? data.settlementSources : [];
      state.businessEntities = Array.isArray(data.businessEntities) ? data.businessEntities : [];
      window.clientPortalBusinessEntities = state.businessEntities.map(function (entity) { return { ...entity }; });
      state.nextReceipt = data.nextReceipt || null;
      state.nextInvoice = data.nextInvoice || null;
      if (elements.searchInput) state.searchTerm = elements.searchInput.value || state.searchTerm || '';
      renderClient();
      renderInventoryOptions();
      renderRows();
      syncReceiptPreview();
      syncInvoicePreview();
      renderPelunasanOptions();
      renderPelunasanSourceOptions();
      renderDpSearchRows();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Buku Penjualan.', 'error');
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

  function normalizedClientName() {
    return text(state.client?.name || elements.clientMeta?.textContent).toUpperCase();
  }

  function isDemoMotorClient() {
    return normalizedClientName().indexOf('DEMO_MOTOR') !== -1;
  }

  function hasDemoMotorBbnNoticeInUnnotice(source) {
    return isDemoMotorClient() && !Number(source?.bbnNotice || 0) && Number(source?.bbnUnnotice || 0);
  }

  function persadaBbnNoticeValue(source) {
    return hasDemoMotorBbnNoticeInUnnotice(source)
      ? Number(source.bbnUnnotice || 0)
      : Number(source?.bbnNotice || 0);
  }

  function persadaBbnUnnoticeValue(source) {
    return hasDemoMotorBbnNoticeInUnnotice(source) ? 0 : Number(source?.bbnUnnotice || 0);
  }

  function normalizeDemoMotorBbnNoticeSummary(summary) {
    if (!hasDemoMotorBbnNoticeInUnnotice(summary)) return summary;
    const restoredBbnNotice = Number(summary.bbnUnnotice || 0);
    const totalTagihan = roundAmount(Number(summary.totalTagihan || 0) + restoredBbnNotice);
    return Object.assign({}, summary, {
      bbnNotice: restoredBbnNotice,
      bbnUnnotice: 0,
      totalTagihan,
      sisaPiutang: summary.settlement ? 0 : Math.max(0, roundAmount(Number(summary.sisaPiutang || 0) + restoredBbnNotice))
    });
  }

  function salesDisplaySummary(entry) {
    return normalizeDemoMotorBbnNoticeSummary(salesSummary(entry));
  }

  function completeDisplaySummary(entry) {
    return completeSummary(entry);
  }

  function hasBusinessEntityLayout() {
    return !isDemoMotorClient() && Array.isArray(state.businessEntities) && state.businessEntities.length > 0;
  }

  function salesBookLabel() {
    return isDemoMotorClient() ? 'Buku Penjualan SPM' : 'Buku Penjualan';
  }

  function syncSalesGridLayout() {
    document.body.classList.toggle('client-mbarep-layout', hasBusinessEntityLayout());
    document.body.classList.toggle('client-has-business-entities', hasBusinessEntityLayout());
    document.body.classList.toggle('client-persada-layout', isDemoMotorClient());
    const header = document.querySelector('[data-sales-column="quantityOrDiscount"]');
    if (!header) return;
    const label = header.querySelector('.sales-head-label');
    if (hasBusinessEntityLayout()) {
      header.setAttribute('data-sales-total-key', 'quantity');
      if (label) label.textContent = 'Qty';
    } else {
      header.setAttribute('data-sales-total-key', 'totalDiscount');
      if (label) label.textContent = 'Disc';
    }
  }

  function renderClient() {
    const client = state.client || {};
    syncSalesGridLayout();
    syncDemoMotorVehicleControls();
    setText(elements.clientMeta, text(client.name, 'PT X'));
    const label = salesBookLabel();
    setText(elements.title, label);
    setText(elements.subtitle, text(client.name, 'Klien') + ' | ' + label);
    document.title = label + ' - Client Portal';
    setText(elements.count, (state.entries.length + groupedCompleteEntries(state.completeEntries).length) + ' data');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
    if (elements.exportButton) elements.exportButton.hidden = !isDemoMotorClient();
    renderStockWarning();
  }

  function syncDemoMotorVehicleControls() {
    const persada = isDemoMotorClient();
    [elements.noRangka, elements.lengkapNoRangka].forEach(function (input) {
      if (input) input.readOnly = false;
    });
    [elements.tipeMotor, elements.noMesin, elements.warna, elements.lengkapTipeMotor, elements.lengkapNoMesin, elements.lengkapWarna].forEach(function (input) {
      if (input) input.readOnly = persada;
    });
    [elements.inventoryVehicleSelect, elements.lengkapInventoryVehicleSelect].forEach(function (select) {
      if (!select) return;
      select.required = persada && !select.disabled;
    });
  }

  function renderStockWarning() {
    if (!elements.stockWarning) return;
    const missingEntries = state.entries.concat(state.completeEntries).filter(function (entry) {
      return entry && entry.stockMissing;
    });
    if (!missingEntries.length) {
      elements.stockWarning.hidden = true;
      elements.stockWarning.textContent = '';
      elements.stockWarning.removeAttribute('title');
      return;
    }
    const count = missingEntries.length;
    elements.stockWarning.hidden = false;
    elements.stockWarning.textContent = 'Peringatan: ' + count + ' penjualan tidak ada stock.';
    elements.stockWarning.title = missingEntries.slice(0, 12).map(function (entry) {
      return [
        text(entry.receiptNo || entry.noInvoice || entry.id, '-'),
        text(entry.noRangka, '-'),
        text(entry.namaCustomer, '-')
      ].join(' | ');
    }).join('\n');
  }

  function applySalesData(data) {
    state.client = data.client || state.client;
    state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
    state.settlements = Array.isArray(data.settlements) ? data.settlements : state.settlements;
    state.fakturEntries = Array.isArray(data.fakturEntries) ? data.fakturEntries : state.fakturEntries;
    state.completeEntries = Array.isArray(data.completeEntries) ? data.completeEntries : state.completeEntries;
    state.inventoryOptions = Array.isArray(data.inventoryOptions) ? data.inventoryOptions : state.inventoryOptions;
    state.settlementSources = Array.isArray(data.settlementSources) ? data.settlementSources : state.settlementSources;
    if (Array.isArray(data.businessEntities)) state.businessEntities = data.businessEntities;
    window.clientPortalBusinessEntities = state.businessEntities.map(function (entity) { return { ...entity }; });
    state.nextReceipt = data.nextReceipt || state.nextReceipt;
    state.nextInvoice = data.nextInvoice || state.nextInvoice;
  }

  function renderRows() {
    clearNode(elements.rows);
    const entries = filteredSalesEntries();
    const completeEntries = filteredCompleteEntries();
    pruneSelection();
    entries.forEach(function (entry) {
      elements.rows.appendChild(entryRow(entry));
    });
    completeEntries.forEach(function (entry) {
      elements.rows.appendChild(completeEntryRow(entry));
    });

    if (!entries.length && !completeEntries.length && state.searchTerm) {
      const emptyRow = document.createElement('tr');
      const emptyCell = cell('Tidak ada data yang cocok dengan pencarian.');
      emptyCell.colSpan = 21;
      emptyRow.appendChild(emptyCell);
      elements.rows.appendChild(emptyRow);
    }

    const blankCount = Math.max(8 - entries.length - completeEntries.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
    renderHeaderTotals(entries, completeEntries);
    syncSelectionControls(entries);
    if (elements.exportButton) elements.exportButton.disabled = entries.length + completeEntries.length === 0;
  }

  function filteredSalesEntries() {
    const query = normalizeSearch(state.searchTerm);
    if (!query) return state.entries.slice();
    return state.entries.filter(function (entry) {
      return salesEntrySearchText(entry).indexOf(query) !== -1;
    });
  }

  function filteredCompleteEntries() {
    const query = normalizeSearch(state.searchTerm);
    const entries = groupedCompleteEntries(state.completeEntries);
    if (!query) return entries;
    return entries.filter(function (entry) {
      return completeEntrySearchText(entry).indexOf(query) !== -1;
    });
  }

  function completeEntryGroupKey(entry) {
    const documentKey = [entry.receiptNo, entry.noInvoice].filter(Boolean).join('|');
    if (!documentKey) return 'entry|' + text(entry.id);
    return [
      documentKey,
      entry.tanggal || '',
      entry.tanggalInvoice || '',
      entry.businessEntityKey || '',
      entry.namaCustomer || ''
    ].join('|');
  }

  function groupedCompleteEntries(entries) {
    const groups = new Map();
    (Array.isArray(entries) ? entries : []).forEach(function (entry) {
      const key = completeEntryGroupKey(entry);
      if (!groups.has(key)) {
        groups.set(key, Object.assign({}, entry, {
          groupKey: key,
          primaryId: entry.id,
          itemIds: [],
          items: []
        }));
      }
      const group = groups.get(key);
      group.itemIds.push(entry.id);
      group.items.push(entry);
    });
    return Array.from(groups.values()).map(function (group) {
      group.itemCount = group.items.length;
      group.hasAttachment = group.items.some(function (item) { return item.hasAttachment; });
      return group;
    });
  }

  function findCompleteEntryGroup(entryId) {
    const id = text(entryId);
    return groupedCompleteEntries(state.completeEntries).find(function (group) {
      return group.primaryId === id || group.id === id || group.itemIds.indexOf(id) !== -1;
    }) || null;
  }

  function normalizeSearch(value) {
    return text(value)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function salesEntrySearchText(entry) {
    const summary = salesDisplaySummary(entry);
    const settlement = summary.settlement || {};
    const faktur = fakturForEntry(entry) || {};
    return normalizeSearch([
      entry.receiptNo,
      settlement.noInvoice,
      faktur.noFaktur,
      summary.status.label,
      entry.tanggal,
      entry.noRangka,
      entry.namaBarang,
      entry.noMesin,
      entry.tipeMotor,
      entry.warna,
      entry.namaCustomer,
      entry.nikNpwp,
      entry.alamat,
      entry.catatan,
      formatAmount(summary.hargaPricelist),
      formatAmount(summary.totalDiscount),
      formatAmount(summary.hargaSetelahDisc),
      formatAmount(entry.jumlahDp),
      formatAmount(summary.totalTagihan),
      formatAmountZero(summary.sisaPiutang)
    ].join(' '));
  }

  function completeEntrySearchText(entry) {
    const items = completeItems(entry);
    return normalizeSearch([
      entry.receiptNo,
      entry.noInvoice,
      entry.tanggal,
      entry.tanggalInvoice,
      entry.noRangka,
      entry.noMesin,
      entry.tipeMotor,
      entry.warna,
      entry.namaCustomer,
      entry.nikNpwp,
      entry.alamat,
      entry.catatan || entry.keterangan,
      items.map(function (item) {
        return [
          item.namaBarang,
          item.tipeMotor,
          item.noRangka,
          item.noMesin,
          item.warna
        ].join(' ');
      }).join(' '),
      formatAmount(entry.hargaSatuan || entry.hargaPricelist),
      formatAmount(entry.jumlah),
      formatAmount(entry.disc),
      formatAmount(entry.hargaSetelahDisc || entry.total),
      formatAmount(entry.totalTagihan || entry.total)
    ].join(' '));
  }

  function completeItems(entry) {
    return Array.isArray(entry?.items) && entry.items.length ? entry.items : (entry ? [entry] : []);
  }

  function completeSummary(entry) {
    const items = completeItems(entry);
    const settlement = settlementForCompleteEntry(entry);
    const quantity = items.reduce(function (total, item) {
      return total + Number(item.jumlah || item.quantity || 0);
    }, 0);
    const lineTotal = items.reduce(function (total, item) {
      return total + Number(item.total || item.totalTagihan || item.hargaSetelahDisc || 0);
    }, 0);
    const unitPriceTotal = items.reduce(function (total, item) {
      return total + Number(item.hargaSatuan || item.hargaPricelist || 0);
    }, 0);
    const dpp = items.reduce(function (total, item) {
      return total + Number(item.dpp || item.total || item.totalTagihan || item.hargaSetelahDisc || 0);
    }, 0);
    const ppn = items.reduce(function (total, item) {
      return total + Number(item.ppn || 0);
    }, 0);
    const dppPpn = items.reduce(function (total, item) {
      return total + Number(item.dppPpn || item.total || item.totalTagihan || item.hargaSetelahDisc || 0);
    }, 0);
    const bbnNotice = items.reduce(function (total, item) {
      return total + Number(item.bbnNotice || 0);
    }, 0);
    const paidAmount = settlement
      ? roundAmount(Number(settlement.dppPpnPelunasan || 0) + Number(settlement.bbnNotice || 0))
      : 0;
    return {
      settlement,
      quantity,
      hargaPricelist: unitPriceTotal,
      totalDiscount: items.reduce(function (total, item) {
        return total + Number(item.disc || 0);
      }, 0),
      hargaSetelahDisc: lineTotal,
      jumlahDp: 0,
      bbnUnnotice: 0,
      nilaiPenyerahanPajak: items.reduce(function (total, item) {
        return total + Number(item.nilaiPenyerahanPajak || item.total || item.totalTagihan || item.hargaSetelahDisc || 0);
      }, 0),
      dpp,
      ppn,
      dppPpn,
      bbnNotice,
      totalTagihan: lineTotal,
      sisaPiutang: Math.max(0, roundAmount(lineTotal - paidAmount))
    };
  }

  function salesNominalTotals(entries, completeEntries) {
    const totals = {};
    salesTotalKeys.forEach(function (key) {
      totals[key] = 0;
    });
    entries.forEach(function (entry) {
      const summary = salesDisplaySummary(entry);
      salesTotalKeys.forEach(function (key) {
        const value = key === 'jumlahDp' ? entry.jumlahDp : summary[key];
        totals[key] += Number(value || 0);
      });
    });
    (completeEntries || []).forEach(function (entry) {
      const summary = completeDisplaySummary(entry);
      salesTotalKeys.forEach(function (key) {
        totals[key] += Number(summary[key] || 0);
      });
    });
    salesTotalKeys.forEach(function (key) {
      totals[key] = roundAmount(totals[key]);
    });
    return totals;
  }

  function renderHeaderTotals(entries, completeEntries) {
    const totals = salesNominalTotals(entries, completeEntries);
    elements.totalHeaders.forEach(function (header) {
      const key = header.getAttribute('data-sales-total-key');
      const totalNode = header.querySelector('.sales-head-total');
      if (totalNode && Object.prototype.hasOwnProperty.call(totals, key)) {
        totalNode.textContent = formatAmountZero(totals[key]);
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

  function syncSelectionControls(entries) {
    const visibleIds = entries.map(function (entry) {
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
      const selectedCount = state.selectedIds.size;
      elements.deleteSelectedButton.disabled = selectedCount === 0;
      elements.deleteSelectedButton.textContent = selectedCount ? 'Hapus Terpilih (' + selectedCount + ')' : 'Hapus Terpilih';
    }
  }

  function inventoryVehicleLabel(item) {
    return [
      text(item.noRangka),
      text(item.noMesin),
      text(item.namaBarang),
      text(item.warna)
    ].filter(Boolean).join(' | ');
  }

  function inventoryVehicleOptionTarget(control) {
    if (!control) return null;
    return control.tagName === 'INPUT' ? control.list : control;
  }

  function addInventoryVehicleOption(control, item) {
    const target = inventoryVehicleOptionTarget(control);
    if (!target || !item || !text(item.noRangka)) return;
    const option = document.createElement('option');
    option.value = text(item.noRangka);
    option.label = inventoryVehicleLabel(item) || text(item.noRangka);
    option.textContent = inventoryVehicleLabel(item) || text(item.noRangka);
    target.appendChild(option);
  }

  function ensureInventoryVehicleOption(control, entry) {
    const target = inventoryVehicleOptionTarget(control);
    if (!target || !entry || !text(entry.noRangka)) return;
    const value = text(entry.noRangka);
    const exists = Array.from(target.options || []).some(function (option) {
      return option.value === value;
    });
    if (exists) return;
    addInventoryVehicleOption(control, {
      noRangka: entry.noRangka,
      noMesin: entry.noMesin,
      namaBarang: entry.namaBarang || entry.tipeMotor,
      warna: entry.warna
    });
  }

  function renderInventoryVehicleSelect(control, selectedValue) {
    if (!control) return;
    if (control.tagName === 'INPUT') {
      control.disabled = !state.inventoryOptions.length;
      control.placeholder = state.inventoryOptions.length
        ? 'Ketik / pilih dari Buku Persediaan'
        : 'Belum ada kendaraan tersedia di Buku Persediaan';
      const selected = findInventoryVehicle(selectedValue);
      control.value = selected ? text(selected.noRangka) : '';
      return;
    }
    clearNode(control);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = state.inventoryOptions.length
      ? 'Pilih dari Buku Persediaan'
      : 'Belum ada kendaraan tersedia di Buku Persediaan';
    control.appendChild(placeholder);
    state.inventoryOptions.forEach(function (item) {
      addInventoryVehicleOption(control, item);
    });
    control.disabled = !state.inventoryOptions.length;
    control.value = selectedValue && Array.from(control.options || []).some(function (option) {
      return option.value === selectedValue;
    }) ? selectedValue : '';
  }

  function findInventoryVehicle(value) {
    const cleanValue = text(value).toUpperCase();
    if (!cleanValue) return null;
    return state.inventoryOptions.find(function (option) {
      return text(option.noRangka).toUpperCase() === cleanValue || text(option.noMesin).toUpperCase() === cleanValue;
    }) || null;
  }

  function renderInventoryOptions() {
    clearNode(elements.inventoryFrameOptions);
    clearNode(elements.inventoryTypeOptions);
    clearNode(elements.inventoryColorOptions);
    renderInventoryVehicleSelect(elements.inventoryVehicleSelect, elements.inventoryVehicleSelect?.value || elements.noRangka?.value);
    renderInventoryVehicleSelect(elements.lengkapInventoryVehicleSelect, elements.lengkapInventoryVehicleSelect?.value || elements.lengkapNoRangka?.value);
    const types = new Set();
    const colors = new Set();
    state.inventoryOptions.forEach(function (item) {
      if (elements.inventoryFrameOptions) {
        const option = document.createElement('option');
        option.value = item.noRangka || '';
        option.label = [item.namaBarang, item.warna, item.noMesin].filter(Boolean).join(' | ');
        elements.inventoryFrameOptions.appendChild(option);
      }
      if (text(item.namaBarang)) types.add(text(item.namaBarang));
      if (text(item.warna)) colors.add(text(item.warna));
    });
    types.forEach(function (value) {
      if (!elements.inventoryTypeOptions) return;
      const option = document.createElement('option');
      option.value = value;
      elements.inventoryTypeOptions.appendChild(option);
    });
    colors.forEach(function (value) {
      if (!elements.inventoryColorOptions) return;
      const option = document.createElement('option');
      option.value = value;
      elements.inventoryColorOptions.appendChild(option);
    });
    syncDemoMotorVehicleControls();
  }

  function applyVehicleToFields(item, fields) {
    if (!item) return;
    if (fields.noRangka) fields.noRangka.value = item.noRangka || fields.noRangka.value;
    if (fields.tipeMotor) fields.tipeMotor.value = item.namaBarang || fields.tipeMotor.value;
    if (fields.warna) fields.warna.value = item.warna || fields.warna.value;
    if (fields.noMesin) fields.noMesin.value = item.noMesin || fields.noMesin.value;
  }

  function fillVehicleFromInventory() {
    const item = findInventoryVehicle(elements.inventoryVehicleSelect?.value || elements.noRangka?.value);
    applyVehicleToFields(item, {
      noRangka: elements.noRangka,
      tipeMotor: elements.tipeMotor,
      warna: elements.warna,
      noMesin: elements.noMesin
    });
    if (item && elements.inventoryVehicleSelect) elements.inventoryVehicleSelect.value = item.noRangka || '';
  }

  function fillLengkapVehicleFromInventory() {
    const item = findInventoryVehicle(elements.lengkapInventoryVehicleSelect?.value || elements.lengkapNoRangka?.value);
    applyVehicleToFields(item, {
      noRangka: elements.lengkapNoRangka,
      tipeMotor: elements.lengkapTipeMotor,
      warna: elements.lengkapWarna,
      noMesin: elements.lengkapNoMesin
    });
    if (item && elements.lengkapInventoryVehicleSelect) elements.lengkapInventoryVehicleSelect.value = item.noRangka || '';
  }

  function validateDemoMotorVehicleSelection(select, fields, editingId) {
    if (!isDemoMotorClient()) return true;
    const matched = findInventoryVehicle(select?.value || fields.noRangka?.value || fields.noMesin?.value);
    if (!text(editingId) && (!select || select.disabled || !matched)) {
      throw new Error('Ketik atau pilih No.Rangka / Mesin yang ada di Buku Persediaan terlebih dahulu.');
    }
    if (!matched || !text(fields.noRangka?.value) || !text(fields.noMesin?.value)) {
      throw new Error('Data No.Rangka dan No.Mesin wajib berasal dari Buku Persediaan.');
    }
    const frameMatches = text(fields.noRangka.value).toUpperCase() === text(matched.noRangka).toUpperCase();
    const engineMatches = text(fields.noMesin.value).toUpperCase() === text(matched.noMesin).toUpperCase();
    if (!frameMatches || !engineMatches) {
      throw new Error('Data kendaraan belum cocok dengan Buku Persediaan.');
    }
    return true;
  }

  function entryRow(entry) {
    const summary = salesDisplaySummary(entry);
    const faktur = fakturForEntry(entry);
    const row = document.createElement('tr');
    if (entry.stockMissing) {
      row.classList.add('sales-row-stock-missing');
      row.title = 'Nomor rangka penjualan ini belum ditemukan di Buku Persediaan.';
    }
    row.appendChild(selectionCell(entry));
    row.appendChild(businessEntityCell(entry));
    row.appendChild(cell(summary.settlement ? summary.settlement.noInvoice : entry.receiptNo));
    row.appendChild(cell(faktur ? faktur.noFaktur : ''));
    row.appendChild(statusCell(summary.status, { stockMissing: entry.stockMissing }));
    row.appendChild(cell(formatDisplayDate(entry.tanggal)));
    row.appendChild(cell(entry.noRangka));
    row.appendChild(cell(entry.namaCustomer));
    row.appendChild(cell(formatAmount(summary.hargaPricelist), 'number'));
    row.appendChild(cell(formatAmount(hasBusinessEntityLayout() ? summary.quantity : summary.totalDiscount), 'number'));
    row.appendChild(cell(formatAmount(summary.hargaSetelahDisc), 'number'));
    row.appendChild(cell(formatAmount(entry.jumlahDp), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.bbnNotice), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.nilaiPenyerahanPajak), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmountRound(summary.dpp), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmountRound(summary.ppn), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.dppPpn), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.bbnUnnotice), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.totalTagihan), 'number'));
    row.appendChild(cell(formatAmountZero(summary.sisaPiutang), 'number'));
    row.classList.add('sales-clickable-row');
    row.tabIndex = 0;
    row.setAttribute('data-sales-row-view', entry.id);
    row.setAttribute('aria-label', 'Lihat detail Buku Penjualan ' + text(summary.settlement ? summary.settlement.noInvoice : entry.receiptNo, entry.id));
    row.appendChild(cellWithTitle(entry.catatan, 'sales-note-cell'));
    return row;
  }

  function completeEntryRow(entry) {
    const summary = completeDisplaySummary(entry);
    const itemCount = Number(entry.itemCount || completeItems(entry).length || 1);
    const itemLabel = itemCount > 1 ? itemCount + ' barang' : (entry.namaBarang || entry.tipeMotor || entry.noRangka);
    const row = document.createElement('tr');
    row.appendChild(selectionCell(null));
    row.appendChild(businessEntityCell(entry));
    row.appendChild(cell([entry.receiptNo, entry.noInvoice].filter(Boolean).join(' / ') || '-'));
    row.appendChild(cell(''));
    row.appendChild(statusCell(summary.settlement
      ? { label: 'Lunas', className: 'settled' }
      : { label: 'Penjualan', className: 'complete' }));
    row.appendChild(cell(formatDisplayDate(entry.tanggalInvoice || entry.tanggal)));
    row.appendChild(cell(itemLabel));
    row.appendChild(cell(entry.namaCustomer));
    row.appendChild(cell(formatAmount(summary.hargaPricelist), 'number'));
    row.appendChild(cell(formatAmount(hasBusinessEntityLayout() ? summary.quantity : summary.totalDiscount), 'number'));
    row.appendChild(cell(formatAmount(summary.hargaSetelahDisc), 'number'));
    row.appendChild(cell('', 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.bbnNotice), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.nilaiPenyerahanPajak), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmountRound(summary.dpp), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmountRound(summary.ppn), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.dppPpn), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.bbnUnnotice), 'number sales-mbarep-hidden-column'));
    row.appendChild(cell(formatAmount(summary.totalTagihan), 'number'));
    row.appendChild(cell(formatAmountZero(summary.sisaPiutang), 'number'));
    row.classList.add('sales-clickable-row');
    row.tabIndex = 0;
    row.setAttribute('data-sales-complete-row-view', entry.primaryId || entry.id);
    row.setAttribute('aria-label', 'Lihat detail Buku Penjualan ' + text(entry.noInvoice || entry.receiptNo, entry.id));
    row.appendChild(cellWithTitle(entry.catatan || entry.keterangan, 'sales-note-cell'));
    return row;
  }

  function blankRow() {
    const row = document.createElement('tr');
    for (let index = 0; index < 21; index += 1) {
      row.appendChild(cell(''));
    }
    return row;
  }

  function businessEntityCell(entry) {
    return cellWithTitle(entry?.businessEntityName || entry?.businessEntityKey || '', 'client-entity-column');
  }

  function selectionCell(entry) {
    const td = document.createElement('td');
    td.className = 'sales-select-cell';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'sales-row-checkbox';
    if (entry && entry.id) {
      checkbox.setAttribute('data-sales-select', entry.id);
      checkbox.checked = state.selectedIds.has(entry.id);
      checkbox.setAttribute('aria-label', 'Pilih data ' + text(entry.receiptNo, entry.id));
    } else {
      checkbox.disabled = true;
      checkbox.setAttribute('aria-label', 'Tidak dapat dipilih');
    }
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
    td.title = text(value);
    return td;
  }

  function statusCell(status, options) {
    const td = document.createElement('td');
    td.className = 'sales-status-cell';
    const stack = document.createElement('div');
    stack.className = 'sales-status-stack';
    const badge = document.createElement('span');
    badge.className = 'sales-status-badge ' + status.className;
    badge.textContent = status.label;
    stack.appendChild(badge);
    if (options && options.stockMissing) {
      const stockBadge = document.createElement('span');
      stockBadge.className = 'sales-status-badge stock-missing';
      stockBadge.textContent = 'Stock tidak ada';
      stack.appendChild(stockBadge);
    }
    td.appendChild(stack);
    return td;
  }

  function salesActionButtons(entry, summary, faktur) {
    const buttons = [];
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'cashbook-action-button sales-edit-button';
    editButton.textContent = 'Ubah';
    editButton.setAttribute('data-sales-edit', entry.id);
    buttons.push(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'cashbook-action-button sales-delete-button danger';
    deleteButton.textContent = 'Hapus';
    deleteButton.setAttribute('data-sales-delete', entry.id);
    buttons.push(deleteButton);

    const settlementButton = document.createElement('button');
    settlementButton.type = 'button';
    settlementButton.className = 'cashbook-action-button sales-settlement-button';
    settlementButton.textContent = summary.settlement ? 'Ubah Pelunasan' : 'Input Pelunasan';
    settlementButton.setAttribute('data-sales-settlement', entry.id);
    if (summary.settlement) {
      settlementButton.title = 'Ubah data pelunasan yang sudah tersimpan.';
    }
    buttons.push(settlementButton);

    const fakturButton = document.createElement('button');
    fakturButton.type = 'button';
    fakturButton.className = 'cashbook-action-button sales-faktur-button';
    fakturButton.textContent = faktur ? 'Ubah Faktur' : 'Input Faktur';
    fakturButton.setAttribute('data-sales-faktur', entry.id);
    if (!summary.settlement) {
      fakturButton.disabled = true;
      fakturButton.title = 'Faktur dapat diinput setelah invoice dibuat.';
    }
    buttons.push(fakturButton);

    const dpReceiptButton = document.createElement('button');
    dpReceiptButton.type = 'button';
    dpReceiptButton.className = 'cashbook-action-button sales-print-button sales-receipt-button';
    dpReceiptButton.textContent = 'Kwitansi DP';
    dpReceiptButton.setAttribute('data-sales-print', 'receipt-dp');
    dpReceiptButton.setAttribute('data-sales-id', entry.id);
    buttons.push(dpReceiptButton);

    const invoiceButton = document.createElement('button');
    invoiceButton.type = 'button';
    invoiceButton.className = 'cashbook-action-button sales-print-button';
    invoiceButton.textContent = 'Invoice';
    invoiceButton.setAttribute('data-sales-print', 'invoice');
    invoiceButton.setAttribute('data-sales-id', entry.id);
    if (!summary.settlement) {
      invoiceButton.disabled = true;
      invoiceButton.title = 'Invoice tersedia setelah pelunasan dibuat.';
    }
    buttons.push(invoiceButton);

    const settlementReceiptButton = document.createElement('button');
    settlementReceiptButton.type = 'button';
    settlementReceiptButton.className = 'cashbook-action-button sales-print-button sales-receipt-button';
    settlementReceiptButton.textContent = 'Kwitansi Pelunasan';
    settlementReceiptButton.setAttribute('data-sales-print', 'receipt-settlement');
    settlementReceiptButton.setAttribute('data-sales-id', entry.id);
    if (!summary.settlement) {
      settlementReceiptButton.disabled = true;
      settlementReceiptButton.title = 'Kwitansi pelunasan tersedia setelah data pelunasan dibuat.';
    }
    buttons.push(settlementReceiptButton);

    const fileButton = document.createElement('button');
    fileButton.type = 'button';
    fileButton.className = 'cashbook-action-button sales-file-button';
    fileButton.textContent = 'Lihat File';
    fileButton.setAttribute('data-sales-files', entry.id);
    if (!hasSalesFiles(entry, summary, faktur)) {
      fileButton.title = 'Belum ada file ter-upload.';
    }
    buttons.push(fileButton);
    return buttons;
  }

  function completeActionButtons(entry) {
    const buttons = [];
    const actionId = entry.primaryId || entry.id;
    const summary = completeDisplaySummary(entry);

    const settlementButton = document.createElement('button');
    settlementButton.type = 'button';
    settlementButton.className = 'cashbook-action-button sales-settlement-button';
    settlementButton.textContent = summary.settlement ? 'Ubah Pelunasan' : 'Input Pelunasan';
    settlementButton.setAttribute('data-sales-complete-settlement', actionId);
    if (summary.settlement) {
      settlementButton.title = 'Ubah data pelunasan yang sudah tersimpan.';
    }
    buttons.push(settlementButton);

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'cashbook-action-button sales-edit-button';
    editButton.textContent = 'Ubah';
    editButton.setAttribute('data-sales-complete-edit', actionId);
    if (Number(entry.itemCount || 1) > 1) {
      editButton.title = 'Ubah salah satu rincian barang melalui data pertama invoice ini.';
    }
    buttons.push(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'cashbook-action-button sales-delete-button danger';
    deleteButton.textContent = 'Hapus';
    deleteButton.setAttribute('data-sales-complete-delete', actionId);
    buttons.push(deleteButton);

    const invoiceButton = document.createElement('button');
    invoiceButton.type = 'button';
    invoiceButton.className = 'cashbook-action-button sales-print-button';
    invoiceButton.textContent = 'Invoice';
    invoiceButton.setAttribute('data-sales-complete-print', 'invoice');
    invoiceButton.setAttribute('data-sales-complete-id', actionId);
    buttons.push(invoiceButton);

    const receiptButton = document.createElement('button');
    receiptButton.type = 'button';
    receiptButton.className = 'cashbook-action-button sales-print-button sales-receipt-button';
    receiptButton.textContent = 'Kwitansi';
    receiptButton.setAttribute('data-sales-complete-print', 'receipt-complete');
    receiptButton.setAttribute('data-sales-complete-id', actionId);
    buttons.push(receiptButton);

    const fileButton = document.createElement('button');
    fileButton.type = 'button';
    fileButton.className = 'cashbook-action-button sales-file-button';
    fileButton.textContent = 'Lihat File';
    fileButton.setAttribute('data-sales-complete-file', actionId);
    if (!entry.hasAttachment) {
      fileButton.title = 'Belum ada file ter-upload.';
    }
    buttons.push(fileButton);
    return buttons;
  }

  function renderDetailActions(buttons) {
    if (!elements.detailActions) return;
    clearNode(elements.detailActions);
    (buttons || []).forEach(function (button) {
      elements.detailActions.appendChild(button);
    });
  }

  function hasSalesFiles(entry, summary, faktur) {
    return Boolean(entry.hasAttachment || (summary && summary.settlement && summary.settlement.hasAttachment) || (faktur && faktur.hasAttachment));
  }

  function settlementForEntry(entry) {
    return state.settlements.find(function (settlement) {
      return settlement.dpEntryId === entry.id;
    }) || null;
  }

  function settlementForCompleteEntry(entry) {
    if (!entry) return null;
    const ids = new Set([entry.id, entry.primaryId].concat(entry.itemIds || []).filter(Boolean));
    return state.settlements.find(function (settlement) {
      return settlement.completeEntryId && ids.has(settlement.completeEntryId);
    }) || state.settlements.find(function (settlement) {
      return settlement.sourceStage === 'lengkap'
        && text(settlement.noKwitansi) === text(entry.receiptNo)
        && text(settlement.noInvoice) === text(entry.noInvoice);
    }) || null;
  }

  function fakturForEntry(entry) {
    return state.fakturEntries.find(function (faktur) {
      return faktur.dpEntryId === entry.id;
    }) || null;
  }

  function salesSummary(entry) {
    const settlement = settlementForEntry(entry);
    if (settlement) {
      const dppPpn = roundAmount(Number(entry.dppPpn || 0) + Number(settlement.dppPpnPelunasan || 0));
      const bbnNotice = Number(settlement.bbnNotice || 0);
      const totalTagihan = roundAmount(dppPpn + bbnNotice);
      return {
        settlement,
        status: {
          label: 'DP + Pelunasan',
          className: 'settled'
        },
        quantity: Number(entry.jumlah || entry.quantity || 1),
        hargaPricelist: Number(entry.hargaPricelist || 0),
        totalDiscount: roundAmount(Number(entry.disc || 0) + Number(settlement.discTambahan || 0)),
        hargaSetelahDisc: Number(settlement.hargaSetelahDisc || entry.hargaSetelahDisc || 0),
        bbnNotice,
        bbnUnnotice: Number(entry.bbnUnnotice || 0),
        nilaiPenyerahanPajak: roundAmount(Number(entry.jumlahDp || 0) + Number(settlement.nilaiPelunasanPajak || 0)),
        dpp: roundAmount(Number(entry.dpp || 0) + Number(settlement.dppPelunasan || 0)),
        ppn: roundAmount(Number(entry.ppn || 0) + Number(settlement.ppnPelunasan || 0)),
        dppPpn,
        totalTagihan,
        sisaPiutang: 0
      };
    }
    const taxableDeliveryValue = Number(entry.nilaiPenyerahanPajak || 0);
    const dpp = roundAmount(taxableDeliveryValue / 1.11);
    const ppn = roundAmount(dpp * 0.11);
    const dppPpn = roundAmount(dpp + ppn);
    const bbnNotice = Number(entry.bbnNotice || 0);
    const totalTagihan = roundAmount(dppPpn + bbnNotice);
    return {
      settlement: null,
      status: {
        label: 'DP',
        className: 'dp'
      },
      quantity: Number(entry.jumlah || entry.quantity || 1),
      hargaPricelist: Number(entry.hargaPricelist || 0),
      totalDiscount: Number(entry.disc || 0),
      hargaSetelahDisc: Number(entry.hargaSetelahDisc || 0),
      bbnNotice,
      bbnUnnotice: Number(entry.bbnUnnotice || 0),
      nilaiPenyerahanPajak: taxableDeliveryValue,
      dpp,
      ppn,
      dppPpn,
      totalTagihan,
      sisaPiutang: Math.max(0, roundAmount(totalTagihan - Number(entry.jumlahDp || 0)))
    };
  }

  function today() {
    const current = new Date();
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function salesLengkapEntitySelect() {
    return elements.lengkapForm ? elements.lengkapForm.querySelector('select[name="businessEntityKey"]') : null;
  }

  function salesBusinessEntities() {
    const source = Array.isArray(state.businessEntities) ? state.businessEntities : [];
    return Array.isArray(source)
      ? source.map(function (entity) {
        return {
          key: text(entity.key || entity.id || entity.name),
          name: text(entity.name || entity.label || entity.key)
        };
      }).filter(function (entity) {
        return entity.key && entity.name;
      })
      : [];
  }

  function salesRequiresBusinessEntity() {
    return hasBusinessEntityLayout() && salesBusinessEntities().length > 0;
  }

  function selectedSalesLengkapEntity() {
    if (!salesRequiresBusinessEntity()) return null;
    const key = text(elements.lengkapEntityGateSelect?.value || salesLengkapEntitySelect()?.value);
    if (!key) return null;
    const entity = salesBusinessEntities().find(function (item) { return item.key === key; });
    return {
      key,
      name: text(entity?.name, key)
    };
  }

  function populateSalesLengkapEntityGate(forceBlank) {
    if (!elements.lengkapEntityGateSelect) return;
    const actualSelect = salesLengkapEntitySelect();
    const current = forceBlank ? '' : elements.lengkapEntityGateSelect.value;
    clearNode(elements.lengkapEntityGateSelect);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pilih entitas';
    elements.lengkapEntityGateSelect.appendChild(placeholder);
    const sourceOptions = actualSelect
      ? Array.from(actualSelect.options).filter(function (option) { return option.value; })
      : salesBusinessEntities().map(function (entity) {
        return { value: entity.key, textContent: entity.name };
      });
    sourceOptions.forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value;
      option.textContent = source.textContent;
      elements.lengkapEntityGateSelect.appendChild(option);
    });
    elements.lengkapEntityGateSelect.value = current && sourceOptions.some(function (option) {
      return option.value === current;
    }) ? current : '';
  }

  function syncTechnicalSalesLengkapEntitySelect() {
    const actualSelect = salesLengkapEntitySelect();
    if (actualSelect) {
      const actualField = actualSelect.closest('.client-entity-form-field');
      if (actualField) actualField.hidden = true;
      if (elements.lengkapEntityGateSelect?.value) {
        actualSelect.value = elements.lengkapEntityGateSelect.value;
        actualSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    const entity = selectedSalesLengkapEntity();
    const nameInput = elements.lengkapForm?.querySelector('input[name="businessEntityName"]');
    if (nameInput && entity) nameInput.value = entity.name;
  }

  function hasSelectedSalesLengkapEntity() {
    if (!salesRequiresBusinessEntity()) return true;
    if (elements.lengkapEntityGateSelect && state.lengkapStep !== 'idle') return Boolean(elements.lengkapEntityGateSelect.value);
    const select = salesLengkapEntitySelect();
    return Boolean(select && select.value);
  }

  function syncSalesLengkapFormSteps() {
    const isEdit = Boolean(state.editingLengkapId);
    const requiresEntity = salesRequiresBusinessEntity();
    const hasEntity = isEdit || !requiresEntity || hasSelectedSalesLengkapEntity();
    if (elements.lengkapEntityGateGrid) elements.lengkapEntityGateGrid.hidden = isEdit || !requiresEntity;
    if (elements.lengkapEntityGateSelect) {
      elements.lengkapEntityGateSelect.required = requiresEntity && !isEdit;
      elements.lengkapEntityGateSelect.disabled = !requiresEntity || isEdit;
    }
    if (elements.lengkapDetails) elements.lengkapDetails.hidden = !hasEntity;
    if (elements.lengkapFooter) elements.lengkapFooter.hidden = !hasEntity;
    if (elements.lengkapSaveButton) elements.lengkapSaveButton.disabled = !hasEntity;
    syncTechnicalSalesLengkapEntitySelect();
  }

  function prepareSalesLengkapEntityGate(forceBlank) {
    if (!salesRequiresBusinessEntity()) {
      if (elements.lengkapEntityGateSelect) elements.lengkapEntityGateSelect.value = '';
      syncSalesLengkapFormSteps();
      return;
    }
    if (forceBlank && elements.lengkapEntityGateSelect) elements.lengkapEntityGateSelect.value = '';
    populateSalesLengkapEntityGate(forceBlank);
    syncSalesLengkapFormSteps();
    [0, 80, 250, 600].forEach(function (delay) {
      window.setTimeout(function () {
        populateSalesLengkapEntityGate(forceBlank && !hasSelectedSalesLengkapEntity());
        syncSalesLengkapFormSteps();
      }, delay);
    });
  }

  function openTypeModal() {
    if (!isDemoMotorClient() || !elements.typeModal) return openLengkapModal();
    elements.typeModal.hidden = false;
  }

  function closeTypeModal() {
    if (elements.typeModal) elements.typeModal.hidden = true;
  }

  function openDpModal() {
    closeTypeModal();
    state.editingDpId = '';
    elements.dpForm.reset();
    if (elements.inventoryVehicleSelect) elements.inventoryVehicleSelect.value = '';
    clearUploadInput(elements.dpAttachmentFile);
    setText(elements.dpTitle, 'Input DP');
    setText(elements.dpMeta, 'No kwitansi otomatis berdasarkan tanggal.');
    if (elements.dpSaveButton) elements.dpSaveButton.textContent = 'Simpan';
    setFileNote(elements.dpAttachmentNote, null);
    elements.tanggal.value = today();
    calculateDp();
    formatAllRupiahFields(elements.dpModal);
    loadSales(elements.tanggal.value);
    elements.dpModal.hidden = false;
    window.setTimeout(function () {
      if (isDemoMotorClient() && elements.inventoryVehicleSelect && !elements.inventoryVehicleSelect.disabled) {
        elements.inventoryVehicleSelect.focus();
      } else {
        elements.tanggal.focus();
      }
    }, 0);
  }

  function openEditDpModal(entryId) {
    const entry = state.entries.find(function (item) {
      return item.id === entryId;
    });
    if (!entry) {
      setAlert('Data DP tidak ditemukan.', 'error');
      return;
    }
    closeTypeModal();
    state.editingDpId = entry.id;
    elements.dpForm.reset();
    clearUploadInput(elements.dpAttachmentFile);
    setText(elements.dpTitle, 'Ubah DP');
    setText(elements.dpMeta, 'No kwitansi tetap: ' + text(entry.receiptNo, '-'));
    if (elements.dpSaveButton) elements.dpSaveButton.textContent = 'Simpan Perubahan';
    setFileNote(elements.dpAttachmentNote, null);
    if (elements.dpAttachmentNote && entry.hasAttachment) {
      elements.dpAttachmentNote.textContent = 'File tersimpan: ' + text(entry.attachmentName, 'lampiran') + '. Pilih file baru jika ingin mengganti.';
    }
    setInput(elements.receiptNo, entry.receiptNo);
    setInput(elements.tanggal, entry.tanggal);
    setInput(elements.noRangka, entry.noRangka);
    setInput(elements.tipeMotor, entry.tipeMotor);
    setInput(elements.noMesin, entry.noMesin);
    setInput(elements.warna, entry.warna);
    setInput(elements.namaCustomer, entry.namaCustomer);
    setInput(elements.nikNpwp, entry.nikNpwp);
    setInput(elements.alamat, entry.alamat);
    setInput(elements.catatan, entry.catatan);
    setNumber(elements.hargaPricelist, entry.hargaPricelist);
    setNumber(elements.disc, entry.disc);
    setNumber(elements.dpCustomer, entry.dpCustomer);
    setNumber(elements.dpTambahan, entry.dpTambahan);
    setNumber(elements.bbnNotice, persadaBbnNoticeValue(entry));
    setNumber(elements.bbnUnnotice, persadaBbnUnnoticeValue(entry));
    ensureInventoryVehicleOption(elements.inventoryVehicleSelect, entry);
    if (elements.inventoryVehicleSelect && entry.noRangka) elements.inventoryVehicleSelect.value = entry.noRangka;
    calculateDp();
    formatAllRupiahFields(elements.dpModal);
    elements.dpModal.hidden = false;
    window.setTimeout(function () {
      elements.tanggal.focus();
    }, 0);
  }

  function closeDpModal() {
    elements.dpModal.hidden = true;
    state.editingDpId = '';
    if (elements.dpSaveButton) elements.dpSaveButton.textContent = 'Simpan';
  }

  function openSearchDpModal() {
    closeTypeModal();
    elements.searchDpModal.hidden = false;
    renderDpSearchRows();
    window.setTimeout(function () {
      elements.dpSearch.focus();
    }, 0);
  }

  function closeSearchDpModal() {
    elements.searchDpModal.hidden = true;
  }

  function openPelunasanModal(selectedEntryId) {
    closeTypeModal();
    state.activeCompleteSettlementId = '';
    const selectedEntry = selectedEntryId
      ? state.entries.find(function (item) { return item.id === selectedEntryId; })
      : null;
    const currentSettlement = selectedEntry ? settlementForEntry(selectedEntry) : null;
    if (elements.pelunasanForm) elements.pelunasanForm.dataset.mode = 'dp';
    if (elements.pelunasanTitle) elements.pelunasanTitle.textContent = currentSettlement ? 'Ubah Pelunasan' : 'Pelunasan';
    if (elements.pelunasanMeta) {
      elements.pelunasanMeta.textContent = currentSettlement
        ? 'Ubah data pelunasan yang sudah tersimpan.'
        : (usesSimplePelunasanForm()
          ? 'Isi pembayaran penjualan, sama seperti pelunasan pembelian.'
          : 'Pilih DP dari No Kwitansi, lalu lengkapi data invoice.');
    }
    if (elements.pelunasanSaveButton) elements.pelunasanSaveButton.textContent = currentSettlement ? 'Simpan Perubahan' : 'Simpan';
    if (elements.pelunasanDpSelect) {
      elements.pelunasanDpSelect.disabled = false;
      elements.pelunasanDpSelect.required = true;
      const line = elements.pelunasanDpSelect.closest('.sales-line');
      if (line) line.hidden = false;
    }
    [elements.pelunasanDiscTambahan, elements.pelunasanBbnNotice].forEach(function (input) {
      if (input) input.readOnly = false;
    });
    elements.pelunasanForm.reset();
    clearUploadInput(elements.pelunasanAttachmentFile);
    setFileNote(elements.pelunasanAttachmentNote, null);
    elements.pelunasanTanggalInvoice.value = today();
    renderPelunasanOptions();
    renderPelunasanSourceOptions('kas:kas-besar');
    if (selectedEntryId && elements.pelunasanDpSelect) {
      setPelunasanDpInputValue(selectedEntryId);
    }
    syncInvoicePreview();
    populatePelunasanFromDp();
    syncSimplePelunasanDefaults();
    setPelunasanFormMode();
    resetPelunasanPaymentRows(pelunasanPaymentExpectedAmount(), elements.pelunasanSource?.value || 'kas:kas-besar');
    if (currentSettlement) applyExistingPelunasanToForm(currentSettlement);
    formatAllRupiahFields(elements.pelunasanModal);
    elements.pelunasanModal.hidden = false;
    if (!state.entries.length) {
      setAlert('Belum ada data DP untuk dipilih pada Pelunasan.', 'info');
    }
    window.setTimeout(function () {
      if (usesSimplePelunasanForm() && elements.pelunasanSimpleAmount) {
        elements.pelunasanSimpleAmount.focus();
      } else {
        elements.pelunasanDpSelect.focus();
      }
    }, 0);
  }

  function openCompletePelunasanModal(entryId) {
    const entry = findCompleteEntryGroup(entryId);
    if (!entry) {
      setAlert('Data Penjualan tidak ditemukan.', 'error');
      return;
    }
    const summary = completeSummary(entry);
    closeTypeModal();
    closeSalesDetail();
    state.activeCompleteSettlementId = entry.primaryId || entry.id;
    if (elements.pelunasanForm) elements.pelunasanForm.dataset.mode = 'lengkap';
    if (elements.pelunasanTitle) elements.pelunasanTitle.textContent = summary.settlement ? 'Ubah Pelunasan Penjualan' : 'Pelunasan Penjualan';
    if (elements.pelunasanMeta) elements.pelunasanMeta.textContent = summary.settlement
      ? 'Ubah data pelunasan yang sudah tersimpan.'
      : (usesSimplePelunasanForm()
        ? 'Isi pembayaran penjualan, sama seperti pelunasan pembelian.'
        : 'Pilih sumber kas/bank untuk melunasi invoice ini.');
    if (elements.pelunasanSaveButton) elements.pelunasanSaveButton.textContent = summary.settlement ? 'Simpan Perubahan' : 'Simpan';
    elements.pelunasanForm.reset();
    clearUploadInput(elements.pelunasanAttachmentFile);
    setFileNote(elements.pelunasanAttachmentNote, null);
    renderPelunasanSourceOptions('kas:kas-besar');
    if (elements.pelunasanDpSelect) {
      elements.pelunasanDpSelect.required = false;
      elements.pelunasanDpSelect.disabled = true;
      const line = elements.pelunasanDpSelect.closest('.sales-line');
      if (line) line.hidden = true;
    }
    [elements.pelunasanDiscTambahan, elements.pelunasanBbnNotice].forEach(function (input) {
      if (input) input.readOnly = true;
    });
    const itemNames = completeItems(entry).map(function (item) {
      return text(item.namaBarang || item.tipeMotor);
    }).filter(Boolean).join(', ');
    setInput(elements.pelunasanTanggalKwitansi, entry.tanggal || '');
    setInput(elements.pelunasanNoRangka, '');
    setInput(elements.pelunasanTipeMotor, itemNames);
    setInput(elements.pelunasanNoMesin, '');
    setInput(elements.pelunasanWarna, '');
    setInput(elements.pelunasanNoInvoice, entry.noInvoice || '');
    setInput(elements.pelunasanTanggalInvoice, today());
    setInput(elements.pelunasanNamaCustomer, entry.namaCustomer || '');
    setInput(elements.pelunasanNikNpwp, entry.nikNpwp || '');
    setInput(elements.pelunasanAlamat, entry.alamat || '');
    setNumber(elements.pelunasanHargaPricelist, summary.totalTagihan);
    setNumber(elements.pelunasanDisc, 0);
    setNumber(elements.pelunasanDiscTambahan, 0);
    setNumber(elements.pelunasanHargaSetelahDisc, summary.totalTagihan);
    setNumber(elements.pelunasanDpPaid, 0);
    setNumber(elements.pelunasanBbnNotice, summary.bbnNotice);
    setNumber(elements.pelunasanNilaiPajak, Math.max(0, roundAmount(summary.totalTagihan - summary.bbnNotice)));
    setRoundedNumber(elements.pelunasanDpp, summary.dpp);
    setRoundedNumber(elements.pelunasanPpn, summary.ppn);
    setNumber(elements.pelunasanDppPpn, summary.dppPpn || Math.max(0, roundAmount(summary.totalTagihan - summary.bbnNotice)));
    syncSimplePelunasanDefaults();
    setPelunasanFormMode();
    resetPelunasanPaymentRows(pelunasanPaymentExpectedAmount(), elements.pelunasanSource?.value || 'kas:kas-besar');
    if (summary.settlement) applyExistingPelunasanToForm(summary.settlement);
    formatAllRupiahFields(elements.pelunasanModal);
    elements.pelunasanModal.hidden = false;
    window.setTimeout(function () {
      if (usesSimplePelunasanForm() && elements.pelunasanSimpleAmount) {
        elements.pelunasanSimpleAmount.focus();
      } else if (elements.pelunasanSource) {
        elements.pelunasanSource.focus();
      }
    }, 0);
  }

  function closePelunasanModal() {
    elements.pelunasanModal.hidden = true;
    state.activeCompleteSettlementId = '';
    if (elements.pelunasanSaveButton) elements.pelunasanSaveButton.textContent = 'Simpan';
    if (elements.pelunasanForm) elements.pelunasanForm.dataset.mode = '';
    if (elements.pelunasanDpSelect) {
      elements.pelunasanDpSelect.disabled = false;
      elements.pelunasanDpSelect.required = true;
      const line = elements.pelunasanDpSelect.closest('.sales-line');
      if (line) line.hidden = false;
    }
    [elements.pelunasanDiscTambahan, elements.pelunasanBbnNotice].forEach(function (input) {
      if (input) input.readOnly = false;
    });
    setPelunasanFormMode();
  }

  function openFakturModal(entryId) {
    const entry = state.entries.find(function (item) {
      return item.id === entryId;
    });
    if (!entry) {
      setAlert('Data DP untuk faktur tidak ditemukan.', 'error');
      return;
    }
    const summary = salesDisplaySummary(entry);
    if (!summary.settlement) {
      setAlert('Faktur dapat diinput setelah invoice dibuat.', 'info');
      return;
    }
    const faktur = fakturForEntry(entry);
    elements.fakturForm.reset();
    clearUploadInput(elements.fakturAttachmentFile);
    setFileNote(elements.fakturAttachmentNote, null);
    setInput(elements.fakturDpEntryId, entry.id);
    setInput(elements.fakturNo, faktur ? faktur.noFaktur : '');
    setInput(elements.fakturTanggal, faktur ? faktur.tanggalFaktur : today());
    setText(elements.fakturMeta, (summary.settlement.noInvoice || entry.receiptNo) + ' | ' + entry.namaCustomer);
    elements.fakturModal.hidden = false;
    window.setTimeout(function () {
      elements.fakturNo.focus();
    }, 0);
  }

  function closeFakturModal() {
    elements.fakturModal.hidden = true;
  }

  function openLengkapModal(entryId) {
    closeTypeModal();
    const editingEntry = entryId
      ? state.completeEntries.find(function (item) {
        return item.id === entryId;
      })
      : null;
    if (entryId && !editingEntry) {
      setAlert('Data Penjualan tidak ditemukan.', 'error');
      return;
    }
    state.editingLengkapId = editingEntry ? editingEntry.id : '';
    elements.lengkapForm.reset();
    clearUploadInput(elements.lengkapAttachmentFile);
    if (elements.lengkapSaveButton) {
      elements.lengkapSaveButton.textContent = editingEntry ? 'Simpan Perubahan' : 'Simpan';
    }
    if (editingEntry) {
      state.lengkapStep = 'details';
      setInput(elements.lengkapReceiptNo, editingEntry.receiptNo);
      setInput(elements.lengkapTanggal, editingEntry.tanggal);
      setInput(elements.lengkapNoInvoice, editingEntry.noInvoice);
      setInput(elements.lengkapTanggalInvoice, editingEntry.tanggalInvoice || editingEntry.tanggal);
      setInput(elements.lengkapNoRangka, editingEntry.noRangka);
      setInput(elements.lengkapTipeMotor, editingEntry.tipeMotor || editingEntry.namaBarang);
      setInput(elements.lengkapNoMesin, editingEntry.noMesin);
      setInput(elements.lengkapWarna, editingEntry.warna);
      setInput(elements.lengkapNamaCustomer, editingEntry.namaCustomer);
      setInput(elements.lengkapNikNpwp, editingEntry.nikNpwp);
      setInput(elements.lengkapAlamat, editingEntry.alamat);
      setInput(elements.lengkapCatatan, editingEntry.catatan || editingEntry.keterangan);
      if (elements.lengkapEntityGateSelect && editingEntry.businessEntityKey) {
        elements.lengkapEntityGateSelect.value = editingEntry.businessEntityKey;
      }
      if (isDemoMotorClient()) {
        ensureInventoryVehicleOption(elements.lengkapInventoryVehicleSelect, editingEntry);
        if (elements.lengkapInventoryVehicleSelect && editingEntry.noRangka) elements.lengkapInventoryVehicleSelect.value = editingEntry.noRangka;
        setNumber(elements.lengkapHargaPricelist, editingEntry.hargaPricelist);
        setNumber(elements.lengkapDisc, editingEntry.disc);
        setNumber(elements.lengkapHargaSetelahDisc, editingEntry.hargaSetelahDisc);
        setNumber(elements.lengkapBbnNotice, editingEntry.bbnNotice);
        setNumber(elements.lengkapNilaiPajak, editingEntry.nilaiPenyerahanPajak);
        setRoundedNumber(elements.lengkapDpp, editingEntry.dpp);
        setRoundedNumber(elements.lengkapPpn, editingEntry.ppn);
        setNumber(elements.lengkapDppPpn, editingEntry.dppPpn);
        setNumber(elements.lengkapTotalTagihan, editingEntry.totalTagihan);
        resetLengkapItems(null);
      } else {
        resetLengkapItems(editingEntry);
      }
    } else {
      state.lengkapStep = isDemoMotorClient() ? 'details' : (salesRequiresBusinessEntity() ? 'entity' : 'details');
      elements.lengkapTanggal.value = today();
      elements.lengkapTanggalInvoice.value = today();
      if (elements.lengkapInventoryVehicleSelect) elements.lengkapInventoryVehicleSelect.value = '';
      [
        elements.lengkapNoRangka,
        elements.lengkapTipeMotor,
        elements.lengkapNoMesin,
        elements.lengkapWarna,
        elements.lengkapHargaPricelist,
        elements.lengkapDisc,
        elements.lengkapHargaSetelahDisc,
        elements.lengkapBbnNotice,
        elements.lengkapNilaiPajak,
        elements.lengkapDpp,
        elements.lengkapPpn,
        elements.lengkapDppPpn,
        elements.lengkapTotalTagihan
      ].forEach(function (input) {
        if (input) input.value = '';
      });
      syncReceiptPreview();
      syncInvoicePreview();
      if (isDemoMotorClient()) {
        calculateLengkapDemoMotor();
        resetLengkapItems(null);
      } else {
        resetLengkapItems(null);
      }
    }
    if (elements.lengkapAddItemButton) elements.lengkapAddItemButton.hidden = Boolean(editingEntry) || isDemoMotorClient();
    prepareSalesLengkapEntityGate(!editingEntry);
    if (editingEntry && elements.lengkapEntityGateSelect && editingEntry.businessEntityKey) {
      elements.lengkapEntityGateSelect.value = editingEntry.businessEntityKey;
      syncSalesLengkapFormSteps();
    }
    if (isDemoMotorClient()) {
      calculateLengkapDemoMotor();
    } else {
      recalculateLengkapItems();
    }
    setFileNote(elements.lengkapAttachmentNote, null);
    if (editingEntry && elements.lengkapAttachmentNote && editingEntry.hasAttachment) {
      elements.lengkapAttachmentNote.textContent = 'File tersimpan: ' + text(editingEntry.attachmentName, 'lampiran') + '. Pilih file baru jika ingin mengganti.';
    }
    formatAllRupiahFields(elements.lengkapModal);
    elements.lengkapModal.hidden = false;
    window.setTimeout(function () {
      if (!editingEntry && isDemoMotorClient() && elements.lengkapInventoryVehicleSelect && !elements.lengkapInventoryVehicleSelect.disabled) {
        elements.lengkapInventoryVehicleSelect.focus();
      } else if (!editingEntry && salesRequiresBusinessEntity() && elements.lengkapEntityGateSelect) elements.lengkapEntityGateSelect.focus();
      else elements.lengkapTanggal.focus();
    }, 0);
  }

  function closeLengkapModal() {
    elements.lengkapModal.hidden = true;
    state.editingLengkapId = '';
    state.lengkapStep = 'idle';
    if (elements.lengkapSaveButton) elements.lengkapSaveButton.textContent = 'Simpan';
  }

  function confirmCloseModal(modal) {
    if (!modal || modal.hidden) return;
    const hasForm = Boolean(modal.querySelector('form'));
    const message = hasForm
      ? 'Tutup popup ini? Data yang belum disimpan akan hilang.'
      : 'Tutup popup ini?';
    if (window.confirm(message)) {
      modal.hidden = true;
    }
  }

  function syncReceiptPreview() {
    if (elements.receiptNo && state.nextReceipt) {
      elements.receiptNo.value = text(state.nextReceipt.receiptNo);
    }
    if (elements.lengkapReceiptNo && state.nextReceipt) {
      elements.lengkapReceiptNo.value = text(state.nextReceipt.receiptNo);
      if (elements.lengkapNoInvoice) {
        elements.lengkapNoInvoice.value = invoiceNoFromReceiptNo(state.nextReceipt.receiptNo);
      }
    }
  }

  function syncInvoicePreview() {
    if (elements.pelunasanNoInvoice && state.nextInvoice) {
      elements.pelunasanNoInvoice.value = text(state.nextInvoice.invoiceNo);
    }
    if (elements.lengkapNoInvoice && state.nextInvoice && !state.nextReceipt) {
      elements.lengkapNoInvoice.value = text(state.nextInvoice.invoiceNo);
    }
  }

  function invoiceNoFromReceiptNo(receiptNo) {
    const clean = text(receiptNo);
    return clean ? clean.replace(/\/KW([A-Z0-9]*)\//i, '/INV$1/') : '';
  }

  function refreshLengkapDocumentPreview() {
    const requiresEntity = salesRequiresBusinessEntity();
    if (state.editingLengkapId || state.lengkapStep === 'idle' || (requiresEntity && !hasSelectedSalesLengkapEntity())) return;
    const entity = selectedSalesLengkapEntity();
    const receiptDate = elements.lengkapTanggal?.value || today();
    const invoiceDate = elements.lengkapTanggalInvoice?.value || receiptDate;
    if (!receiptDate) return;
    loadSales(receiptDate, {
      businessEntityKey: entity?.key || '',
      invoiceDate
    });
  }

  function parseAmountInput(input) {
    if (!input || input.value == null || input.value === '') return 0;
    const cleaned = String(input.value)
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : 0;
  }

  function roundAmount(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
  }

  function setNumber(input, value) {
    if (!input) return;
    input.value = formatInputAmount(value);
  }

  function setRoundedNumber(input, value) {
    if (!input) return;
    input.value = formatInputAmount(roundInteger(value));
  }

  function formatInputAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || !amount) return '0';
    const rounded = Math.round(amount);
    const sign = rounded < 0 ? '-' : '';
    return sign + String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function amountPayload(input) {
    return String(parseAmountInput(input));
  }

  function formatRupiahField(input) {
    if (!input || input.value == null || input.value === '') return;
    input.value = formatInputAmount(parseAmountInput(input));
  }

  function formatAllRupiahFields(root) {
    const scope = root || document;
    Array.from(scope.querySelectorAll('[data-rupiah="true"]')).forEach(formatRupiahField);
  }

  function setInput(input, value) {
    if (!input) return;
    input.value = text(value);
  }

  function formatFileSize(value) {
    const size = Number(value || 0);
    if (!size) return '0 KB';
    if (size < 1024 * 1024) return Math.max(1, Math.round(size / 1024)) + ' KB';
    return (size / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB';
  }

  function normalizeImportHeader(value) {
    return text(value).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }

  function excelSerialToDate(value) {
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 1) return '';
    const epoch = Date.UTC(1899, 11, 30);
    return new Date(epoch + serial * 86400000);
  }

  function importDateValue(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'number') {
      const date = excelSerialToDate(value);
      return date ? date.toISOString().slice(0, 10) : '';
    }
    const raw = text(value);
    if (!raw) return '';
    const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return iso[1] + '-' + iso[2].padStart(2, '0') + '-' + iso[3].padStart(2, '0');
    const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (slash) {
      const year = slash[3].length === 2 ? '20' + slash[3] : slash[3];
      return year + '-' + slash[2].padStart(2, '0') + '-' + slash[1].padStart(2, '0');
    }
    return raw;
  }

  function readFileAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error('Gagal membaca file Excel.'));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function parseSalesImportWorkbook(arrayBuffer) {
    if (!window.XLSX) throw new Error('Library pembaca Excel belum termuat. Refresh halaman lalu coba lagi.');
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets.penjualan_unit || workbook.Sheets.Penjualan_Unit || workbook.Sheets['Penjualan Unit'];
    if (!sheet) throw new Error('Sheet "penjualan_unit" tidak ditemukan.');
    const grid = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
    if (!grid.length) throw new Error('Sheet penjualan_unit kosong.');
    const headers = (grid[0] || []).map(normalizeImportHeader);
    const required = ['tanggal_kwitansi_dp', 'no_kwitansi_dp', 'tanggal_invoice', 'no_invoice', 'no_faktur', 'tanggal_faktur'];
    const missing = required.filter(function (key) {
      return !headers.includes(key);
    });
    if (missing.length) throw new Error('Header penjualan_unit tidak lengkap: ' + missing.join(', '));
    return grid.slice(1).map(function (line, index) {
      const row = { rowNumber: index + 2 };
      headers.forEach(function (header, columnIndex) {
        if (!header) return;
        row[header] = line[columnIndex];
      });
      ['tanggal_kwitansi_dp', 'tanggal_invoice', 'tanggal_faktur'].forEach(function (key) {
        row[key] = importDateValue(row[key]);
      });
      return row;
    }).filter(function (row) {
      return Object.keys(row).some(function (key) {
        return key !== 'rowNumber' && text(row[key]);
      });
    });
  }

  async function importSalesWorkbook(file) {
    if (!file) return;
    if (elements.importButton) elements.importButton.disabled = true;
    setAlert('');
    try {
      const rows = parseSalesImportWorkbook(await readFileAsArrayBuffer(file));
      if (!rows.length) throw new Error('Tidak ada baris penjualan yang dapat diimpor.');
      const ok = window.confirm('Impor ' + rows.length + ' baris dari sheet penjualan_unit ke Buku Penjualan?');
      if (!ok) return;
      const data = await requestJson(apiBase() + '/import', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rows })
      });
      if (!data) return;
      applySalesData(data);
      renderClient();
      renderRows();
      renderPelunasanOptions();
      renderPelunasanSourceOptions();
      setAlert('Impor penjualan selesai: ' + (data.importedCount || rows.length) + ' baris diproses.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal impor penjualan.', 'error');
    } finally {
      if (elements.importButton) elements.importButton.disabled = false;
      if (elements.importFile) elements.importFile.value = '';
    }
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

  function setFileNote(note, file) {
    if (!note) return;
    note.textContent = file
      ? 'File dipilih: ' + file.name + ' (' + formatFileSize(file.size) + ')'
      : 'Belum ada file dipilih.';
  }

  function setUploadFileNote(note, input, prefix) {
    if (!note) return;
    const files = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(input) : [];
    if (files.length && window.clientPortalFormatFilesNote) {
      note.textContent = window.clientPortalFormatFilesNote(files, prefix || 'File dipilih');
      return;
    }
    const file = input && input.files && input.files[0];
    setFileNote(note, file || null);
  }

  function clearUploadInput(input) {
    if (window.clientPortalClearUploadSelection) {
      window.clientPortalClearUploadSelection(input);
      return;
    }
    if (input) input.value = '';
  }

  async function attachmentPayload(fileInput) {
    if (window.clientPortalBuildAttachmentPayload) {
      return window.clientPortalBuildAttachmentPayload(fileInput);
    }
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (!file) return {};
    return {
      attachmentName: file.name,
      attachmentMimeType: file.type || 'application/octet-stream',
      attachmentSize: file.size || 0,
      attachmentDataUrl: await fileToDataUrl(file)
    };
  }

  function calculateDp() {
    const priceList = parseAmountInput(elements.hargaPricelist);
    const discount = parseAmountInput(elements.disc);
    const priceAfterDiscount = roundAmount(priceList - discount);
    const dpCustomer = parseAmountInput(elements.dpCustomer);
    const dpAdditional = parseAmountInput(elements.dpTambahan);
    const dpTotal = roundAmount(dpCustomer + dpAdditional);
    const bbnNotice = parseAmountInput(elements.bbnNotice);
    const taxableDeliveryValue = roundAmount(priceAfterDiscount - bbnNotice);
    const dpp = roundAmount(dpTotal / 1.11);
    const ppn = roundAmount(dpp * 0.11);
    const dppPpn = roundAmount(dpp + ppn);
    setNumber(elements.hargaSetelahDisc, priceAfterDiscount);
    setNumber(elements.jumlahDp, dpTotal);
    setNumber(elements.nilaiPenyerahanPajak, taxableDeliveryValue);
    setRoundedNumber(elements.dpp, dpp);
    setRoundedNumber(elements.ppn, ppn);
    setNumber(elements.dppPpn, dppPpn);
    formatAllRupiahFields(elements.dpModal);
  }

  function calculateLengkapDemoMotor() {
    const priceList = parseAmountInput(elements.lengkapHargaPricelist);
    const discount = parseAmountInput(elements.lengkapDisc);
    const priceAfterDiscount = roundAmount(priceList - discount);
    const bbnNotice = parseAmountInput(elements.lengkapBbnNotice);
    const taxableDeliveryValue = roundAmount(priceAfterDiscount - bbnNotice);
    const dpp = roundAmount(taxableDeliveryValue / 1.11);
    const ppn = roundAmount(dpp * 0.11);
    const dppPpn = roundAmount(dpp + ppn);
    const totalTagihan = roundAmount(dppPpn + bbnNotice);
    setNumber(elements.lengkapHargaSetelahDisc, priceAfterDiscount);
    setNumber(elements.lengkapNilaiPajak, taxableDeliveryValue);
    setRoundedNumber(elements.lengkapDpp, dpp);
    setRoundedNumber(elements.lengkapPpn, ppn);
    setNumber(elements.lengkapDppPpn, dppPpn);
    setNumber(elements.lengkapTotalTagihan, totalTagihan);
    formatAllRupiahFields(elements.lengkapModal);
  }

  async function dpPayload() {
    calculateDp();
    const bbnNoticeInput = parseAmountInput(elements.bbnNotice);
    const bbnUnnotice = parseAmountInput(elements.bbnUnnotice);
    return Object.assign({
      tanggal: elements.tanggal.value,
      noRangka: elements.noRangka.value,
      tipeMotor: elements.tipeMotor.value,
      noMesin: elements.noMesin.value,
      warna: elements.warna.value,
      namaCustomer: elements.namaCustomer.value,
      nikNpwp: elements.nikNpwp.value,
      alamat: elements.alamat.value,
      catatan: elements.catatan ? elements.catatan.value : '',
      hargaPricelist: amountPayload(elements.hargaPricelist),
      disc: amountPayload(elements.disc),
      dpCustomer: amountPayload(elements.dpCustomer),
      dpTambahan: amountPayload(elements.dpTambahan),
      bbnNotice: String(bbnNoticeInput),
      bbnUnnotice: String(bbnUnnotice)
    }, await attachmentPayload(elements.dpAttachmentFile));
  }

  async function submitDp(event) {
    event.preventDefault();
    setAlert('');
    fillVehicleFromInventory();
    try {
      validateDemoMotorVehicleSelection(elements.inventoryVehicleSelect, {
        noRangka: elements.noRangka,
        noMesin: elements.noMesin
      }, state.editingDpId);
    } catch (err) {
      setAlert(err.message || 'Pilih kendaraan dari Buku Persediaan.', 'error');
      if (elements.inventoryVehicleSelect && !elements.inventoryVehicleSelect.disabled) elements.inventoryVehicleSelect.focus();
      return;
    }
    elements.dpSaveButton.disabled = true;
    try {
      const editingId = text(state.editingDpId);
      const data = await requestJson(apiBase() + '/dp' + (editingId ? '/' + encodeURIComponent(editingId) : ''), {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(await dpPayload())
      });
      if (!data) return;
      applySalesData(data);
      renderClient();
      renderInventoryOptions();
      renderPelunasanOptions();
      renderPelunasanSourceOptions();
      renderRows();
      renderDpSearchRows();
      closeDpModal();
      setAlert((editingId ? 'Data DP diperbarui: ' : 'Data DP tersimpan: ') + text(data.receiptNo), 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan DP.', 'error');
    } finally {
      elements.dpSaveButton.disabled = false;
    }
  }

  async function deleteDpEntry(entryId) {
    const entry = state.entries.find(function (item) {
      return item.id === entryId;
    });
    if (!entry) {
      setAlert('Data DP tidak ditemukan.', 'error');
      return;
    }
    const summary = salesDisplaySummary(entry);
    const warning = summary.settlement
      ? 'Data ini sudah memiliki pelunasan/faktur. Hapus data ini beserta data terkait?'
      : 'Hapus data DP ini?';
    if (!window.confirm(warning + '\n\n' + text(entry.receiptNo, '-') + ' - ' + text(entry.namaCustomer, '-'))) return;
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/dp/' + encodeURIComponent(entry.id), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!data) return;
      state.client = data.client || state.client;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.settlements = Array.isArray(data.settlements) ? data.settlements : state.settlements;
      state.fakturEntries = Array.isArray(data.fakturEntries) ? data.fakturEntries : state.fakturEntries;
      state.inventoryOptions = Array.isArray(data.inventoryOptions) ? data.inventoryOptions : state.inventoryOptions;
      state.nextReceipt = data.nextReceipt || state.nextReceipt;
      renderClient();
      renderInventoryOptions();
      renderPelunasanOptions();
      renderPelunasanSourceOptions();
      renderRows();
      renderDpSearchRows();
      setAlert('Data DP dihapus: ' + text(data.receiptNo), 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus DP.', 'error');
    }
  }

  async function deleteSelectedEntries() {
    const ids = Array.from(state.selectedIds).filter(function (id) {
      return state.entries.some(function (entry) {
        return entry.id === id;
      });
    });
    if (!ids.length) {
      setAlert('Belum ada data yang dipilih.', 'info');
      return;
    }
    const linkedCount = ids.filter(function (id) {
      const entry = state.entries.find(function (item) {
        return item.id === id;
      });
      return entry && (salesSummary(entry).settlement || fakturForEntry(entry));
    }).length;
    const warning = linkedCount
      ? 'Hapus ' + ids.length + ' data terpilih beserta pelunasan/faktur terkait?'
      : 'Hapus ' + ids.length + ' data DP terpilih?';
    if (!window.confirm(warning)) return;
    const originalText = elements.deleteSelectedButton ? elements.deleteSelectedButton.textContent : '';
    if (elements.deleteSelectedButton) {
      elements.deleteSelectedButton.disabled = true;
      elements.deleteSelectedButton.textContent = 'Menghapus...';
    }
    setAlert('');
    let lastData = null;
    let deletedCount = 0;
    try {
      for (let index = 0; index < ids.length; index += 1) {
        const data = await requestJson(apiBase() + '/dp/' + encodeURIComponent(ids[index]), {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        if (!data) return;
        lastData = data;
        deletedCount += 1;
      }
      if (lastData) applySalesData(lastData);
      state.selectedIds.clear();
      renderClient();
      renderInventoryOptions();
      renderPelunasanOptions();
      renderPelunasanSourceOptions();
      renderRows();
      renderDpSearchRows();
      setAlert(deletedCount + ' data terpilih berhasil dihapus.', 'info');
    } catch (err) {
      state.selectedIds.clear();
      renderRows();
      setAlert((deletedCount ? deletedCount + ' data sudah terhapus. ' : '') + (err.message || 'Gagal menghapus data terpilih.'), 'error');
      loadSales();
    } finally {
      if (elements.deleteSelectedButton) {
        elements.deleteSelectedButton.textContent = originalText || 'Hapus Terpilih';
        syncSelectionControls(filteredSalesEntries());
      }
    }
  }

  function renderPelunasanOptions() {
    if (!elements.pelunasanDpSelect) return;
    const selectedEntry = selectedPelunasanDpEntry();
    const selectedValue = elements.pelunasanDpSelect.value;
    elements.pelunasanDpSelect.placeholder = state.entries.length ? 'Ketik / pilih No Kwitansi DP' : 'Belum ada data DP';
    if (!elements.pelunasanDpOptions) return;
    clearNode(elements.pelunasanDpOptions);

    state.entries.forEach(function (entry) {
      const option = document.createElement('option');
      option.value = pelunasanDpOptionLabel(entry);
      option.label = text(entry.receiptNo, entry.id);
      option.dataset.entryId = entry.id;
      elements.pelunasanDpOptions.appendChild(option);
    });

    elements.pelunasanDpSelect.value = selectedEntry ? pelunasanDpOptionLabel(selectedEntry) : selectedValue;
  }

  function renderPelunasanSourceSelect(select, selectedValue) {
    if (!select) return;
    const sources = state.settlementSources.length
      ? state.settlementSources
      : [{ value: 'kas:kas-besar', label: 'Buku Kas Besar', coa: '1-1003', accountName: 'KAS 2' }];
    const currentValue = selectedValue || select.value || 'kas:kas-besar';
    clearNode(select);
    sources.forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value || '';
      option.textContent = [source.label, source.coa, source.accountName].filter(Boolean).join(' | ');
      select.appendChild(option);
    });
    const hasCurrent = sources.some(function (source) {
      return source.value === currentValue;
    });
    select.value = hasCurrent ? currentValue : 'kas:kas-besar';
  }

  function renderPelunasanSourceOptions(selectedValue) {
    renderPelunasanSourceSelect(elements.pelunasanSource, selectedValue);
    renderPelunasanSourceSelect(elements.pelunasanSimpleSource, selectedValue);
    refreshPelunasanPaymentSourceSelects(selectedValue);
  }

  function activePelunasanPaymentContainer() {
    return usesSimplePelunasanForm() ? elements.pelunasanSimplePayments : elements.pelunasanPayments;
  }

  function activePelunasanPaymentTotalLabel() {
    return usesSimplePelunasanForm() ? elements.pelunasanSimplePaymentsTotal : elements.pelunasanPaymentsTotal;
  }

  function pelunasanPaymentRows(container) {
    return Array.from((container || activePelunasanPaymentContainer())?.querySelectorAll('.sales-payment-source-row') || []);
  }

  function pelunasanPaymentExpectedAmount() {
    if (usesSimplePelunasanForm()) {
      return roundAmount(parseAmountInput(elements.pelunasanSimpleAmount));
    }
    return roundAmount(parseAmountInput(elements.pelunasanDppPpn) + parseAmountInput(elements.pelunasanBbnNotice));
  }

  function createPelunasanPaymentSelect(selectedValue) {
    const select = document.createElement('select');
    select.className = 'sales-payment-source-select';
    select.setAttribute('aria-label', 'Sumber pelunasan');
    renderPelunasanSourceSelect(select, selectedValue || 'kas:kas-besar');
    select.addEventListener('change', function () {
      state.pelunasanPaymentRowsDirty = true;
      syncPelunasanPaymentTotals();
      syncPelunasanPrimarySourceFromRows();
    });
    return select;
  }

  function addPelunasanPaymentRow(container, values, options) {
    if (!container) return null;
    const data = values || {};
    const row = document.createElement('div');
    row.className = 'sales-payment-source-row';

    const amountLabel = document.createElement('label');
    amountLabel.className = 'sales-payment-source-field amount';
    const amountTitle = document.createElement('span');
    amountTitle.textContent = 'Nominal';
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.inputMode = 'decimal';
    amountInput.autocomplete = 'off';
    amountInput.dataset.rupiah = 'true';
    amountInput.className = 'sales-payment-source-amount';
    amountInput.value = formatInputAmount(data.amount || 0);
    amountInput.addEventListener('input', function () {
      state.pelunasanPaymentRowsDirty = true;
      formatRupiahField(amountInput);
      syncPelunasanPaymentTotals();
    });
    amountInput.addEventListener('blur', function () {
      amountInput.value = formatInputAmount(parseAmountInput(amountInput));
      syncPelunasanPaymentTotals();
    });
    amountLabel.appendChild(amountTitle);
    amountLabel.appendChild(amountInput);

    const sourceLabel = document.createElement('label');
    sourceLabel.className = 'sales-payment-source-field source';
    const sourceTitle = document.createElement('span');
    sourceTitle.textContent = 'Sumber';
    const sourceSelect = createPelunasanPaymentSelect(data.source || data.sumber || data.sumberPelunasan || 'kas:kas-besar');
    sourceLabel.appendChild(sourceTitle);
    sourceLabel.appendChild(sourceSelect);

    const notesLabel = document.createElement('label');
    notesLabel.className = 'sales-payment-source-field notes';
    const notesTitle = document.createElement('span');
    notesTitle.textContent = 'Keterangan';
    const notesInput = document.createElement('input');
    notesInput.type = 'text';
    notesInput.autocomplete = 'off';
    notesInput.className = 'sales-payment-source-notes';
    notesInput.value = data.notes || data.keterangan || '';
    notesInput.addEventListener('input', function () {
      state.pelunasanPaymentRowsDirty = true;
    });
    notesLabel.appendChild(notesTitle);
    notesLabel.appendChild(notesInput);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'sales-payment-source-remove';
    removeButton.textContent = 'Hapus';
    removeButton.addEventListener('click', function () {
      const rows = pelunasanPaymentRows(container);
      state.pelunasanPaymentRowsDirty = true;
      if (rows.length <= 1) {
        amountInput.value = '0';
        notesInput.value = '';
      } else {
        row.remove();
      }
      syncPelunasanPaymentTotals();
      syncPelunasanPrimarySourceFromRows();
    });

    row.appendChild(amountLabel);
    row.appendChild(sourceLabel);
    row.appendChild(notesLabel);
    row.appendChild(removeButton);
    container.appendChild(row);
    if (!options?.keepClean) state.pelunasanPaymentRowsDirty = true;
    syncPelunasanPaymentTotals();
    return row;
  }

  function resetPelunasanPaymentContainer(container, amount, source) {
    clearNode(container);
    addPelunasanPaymentRow(container, {
      amount,
      source: source || 'kas:kas-besar'
    }, { keepClean: true });
  }

  function resetPelunasanPaymentRows(amount, source) {
    state.pelunasanPaymentRowsDirty = false;
    resetPelunasanPaymentContainer(elements.pelunasanPayments, amount, source);
    resetPelunasanPaymentContainer(elements.pelunasanSimplePayments, amount, source);
    state.pelunasanPaymentRowsDirty = false;
    syncPelunasanPaymentTotals();
    syncPelunasanPrimarySourceFromRows();
  }

  function pelunasanSettlementAmount(settlement) {
    return roundAmount(Number(settlement?.dppPpnPelunasan || 0) + Number(settlement?.bbnNotice || 0));
  }

  function pelunasanRowsFromSettlement(settlement) {
    const existingRows = Array.isArray(settlement?.pelunasanPaymentRows)
      ? settlement.pelunasanPaymentRows
      : [];
    const rows = existingRows.map(function (row) {
      return {
        amount: roundAmount(Number(row.amount || 0)),
        source: text(row.source || row.sumber || row.sumberPelunasan || settlement?.sumberPelunasan || 'kas:kas-besar'),
        notes: text(row.notes || row.keterangan || settlement?.keteranganPelunasan || '')
      };
    }).filter(function (row) {
      return row.amount > 0 || row.source || row.notes;
    });
    if (rows.length) return rows;
    return [{
      amount: pelunasanSettlementAmount(settlement),
      source: text(settlement?.sumberPelunasan || 'kas:kas-besar'),
      notes: text(settlement?.keteranganPelunasan || '')
    }];
  }

  function setPelunasanPaymentRows(rows) {
    const cleanRows = (rows || []).length ? rows : [{ amount: 0, source: 'kas:kas-besar', notes: '' }];
    state.pelunasanPaymentRowsDirty = false;
    [elements.pelunasanPayments, elements.pelunasanSimplePayments].forEach(function (container) {
      clearNode(container);
      cleanRows.forEach(function (row) {
        addPelunasanPaymentRow(container, row, { keepClean: true });
      });
    });
    state.pelunasanPaymentRowsDirty = false;
    syncPelunasanPaymentTotals();
    syncPelunasanPrimarySourceFromRows();
  }

  function refreshPelunasanPaymentSourceSelects(selectedValue) {
    [elements.pelunasanPayments, elements.pelunasanSimplePayments].forEach(function (container) {
      pelunasanPaymentRows(container).forEach(function (row) {
        const select = row.querySelector('.sales-payment-source-select');
        if (select) renderPelunasanSourceSelect(select, select.value || selectedValue || 'kas:kas-besar');
      });
    });
  }

  function collectPelunasanPaymentRows(container) {
    return pelunasanPaymentRows(container).map(function (row) {
      const amountInput = row.querySelector('.sales-payment-source-amount');
      const sourceSelect = row.querySelector('.sales-payment-source-select');
      const notesInput = row.querySelector('.sales-payment-source-notes');
      return {
        amount: roundAmount(parseAmountInput(amountInput)),
        source: text(sourceSelect?.value),
        notes: text(notesInput?.value)
      };
    }).filter(function (row) {
      return row.amount > 0 || row.source || row.notes;
    });
  }

  function syncPelunasanPrimarySourceFromRows() {
    const rows = collectPelunasanPaymentRows(activePelunasanPaymentContainer());
    const source = rows.find(function (row) { return row.source; })?.source || 'kas:kas-besar';
    if (elements.pelunasanSource) elements.pelunasanSource.value = source;
    if (elements.pelunasanSimpleSource) elements.pelunasanSimpleSource.value = source;
  }

  function syncPelunasanPaymentTotals() {
    const container = activePelunasanPaymentContainer();
    const totalLabel = activePelunasanPaymentTotalLabel();
    if (!container || !totalLabel) return;
    const rows = collectPelunasanPaymentRows(container);
    const total = roundAmount(rows.reduce(function (sum, row) {
      return sum + row.amount;
    }, 0));
    const expected = pelunasanPaymentExpectedAmount();
    const difference = roundAmount(total - expected);
    totalLabel.textContent = 'Total sumber: ' + formatInputAmount(total) + ' dari ' + formatInputAmount(expected);
    totalLabel.classList.toggle('ok', Math.abs(difference) <= 0.5 && expected > 0);
    totalLabel.classList.toggle('warning', Math.abs(difference) > 0.5);
  }

  function syncPelunasanPaymentRowsToExpected() {
    const container = activePelunasanPaymentContainer();
    const rows = pelunasanPaymentRows(container);
    if (!container || rows.length === 0) return;
    if (!state.pelunasanPaymentRowsDirty && rows.length === 1) {
      const amountInput = rows[0].querySelector('.sales-payment-source-amount');
      if (amountInput) amountInput.value = formatInputAmount(pelunasanPaymentExpectedAmount());
    }
    syncPelunasanPaymentTotals();
    syncPelunasanPrimarySourceFromRows();
  }

  function validatePelunasanPaymentRows() {
    const expected = pelunasanPaymentExpectedAmount();
    const rows = collectPelunasanPaymentRows(activePelunasanPaymentContainer());
    if (expected <= 0) throw new Error('Nilai Pelunasan wajib lebih dari 0.');
    if (!rows.length) throw new Error('Rincian Sumber Pelunasan wajib diisi.');
    rows.forEach(function (row, index) {
      if (row.amount <= 0) throw new Error('Nominal sumber pelunasan baris ' + (index + 1) + ' wajib lebih dari 0.');
      if (!row.source) throw new Error('Sumber pelunasan baris ' + (index + 1) + ' wajib dipilih.');
    });
    const total = roundAmount(rows.reduce(function (sum, row) {
      return sum + row.amount;
    }, 0));
    if (Math.abs(total - expected) > 0.5) {
      throw new Error('Total rincian sumber pelunasan harus sama dengan nilai pelunasan: ' + formatInputAmount(expected) + '.');
    }
  }

  function usesSimplePelunasanForm() {
    return hasBusinessEntityLayout();
  }

  function setPelunasanFormMode() {
    const simpleMode = usesSimplePelunasanForm();
    if (elements.pelunasanSimpleGrid) elements.pelunasanSimpleGrid.hidden = !simpleMode;
    if (elements.pelunasanLegacyForm) elements.pelunasanLegacyForm.hidden = simpleMode;
    Array.from(elements.pelunasanSimpleGrid?.querySelectorAll('input, select, textarea') || []).forEach(function (control) {
      control.disabled = !simpleMode;
    });
    Array.from(elements.pelunasanLegacyForm?.querySelectorAll('input, select, textarea') || []).forEach(function (control) {
      control.disabled = simpleMode;
    });
    if (elements.pelunasanSimpleAddPaymentButton) elements.pelunasanSimpleAddPaymentButton.disabled = !simpleMode;
    if (elements.pelunasanAddPaymentButton) elements.pelunasanAddPaymentButton.disabled = simpleMode;
    syncPelunasanPaymentTotals();
  }

  function simplePelunasanDefaultAmount() {
    const completeEntry = selectedPelunasanCompleteEntry();
    if (completeEntry) return roundAmount(completeSummary(completeEntry).totalTagihan);
    const dppPpn = parseAmountInput(elements.pelunasanDppPpn);
    const bbnNotice = parseAmountInput(elements.pelunasanBbnNotice);
    return roundAmount(dppPpn + bbnNotice);
  }

  function syncSimplePelunasanDefaults() {
    if (!usesSimplePelunasanForm()) return;
    if (elements.pelunasanSimpleDate) {
      elements.pelunasanSimpleDate.value = elements.pelunasanTanggalInvoice?.value || today();
    }
    if (elements.pelunasanSimpleAmount) {
      elements.pelunasanSimpleAmount.value = formatInputAmount(simplePelunasanDefaultAmount());
    }
    if (elements.pelunasanSimpleSource) {
      elements.pelunasanSimpleSource.value = elements.pelunasanSource?.value || 'kas:kas-besar';
    }
    if (elements.pelunasanSimpleNotes) elements.pelunasanSimpleNotes.value = '';
  }

  function applySimplePelunasanValuesToLegacyFields() {
    if (!usesSimplePelunasanForm()) return;
    const amount = parseAmountInput(elements.pelunasanSimpleAmount);
    const source = elements.pelunasanSimpleSource?.value || 'kas:kas-besar';
    setInput(elements.pelunasanTanggalInvoice, elements.pelunasanSimpleDate?.value || today());
    setNumber(elements.pelunasanBbnNotice, 0);
    setNumber(elements.pelunasanNilaiPajak, amount);
    setRoundedNumber(elements.pelunasanDpp, amount);
    setRoundedNumber(elements.pelunasanPpn, 0);
    setNumber(elements.pelunasanDppPpn, amount);
    if (elements.pelunasanSource) elements.pelunasanSource.value = source;
  }

  function applyExistingPelunasanToForm(settlement) {
    if (!settlement) return;
    const amount = pelunasanSettlementAmount(settlement);
    const rows = pelunasanRowsFromSettlement(settlement);
    const primarySource = rows.find(function (row) {
      return row.source;
    })?.source || settlement.sumberPelunasan || 'kas:kas-besar';
    renderPelunasanSourceOptions(primarySource);
    setInput(elements.pelunasanNoInvoice, settlement.noInvoice || '');
    setInput(elements.pelunasanTanggalInvoice, settlement.tanggalInvoice || today());
    setNumber(elements.pelunasanDiscTambahan, settlement.discTambahan || 0);
    setNumber(elements.pelunasanHargaSetelahDisc, settlement.hargaSetelahDisc || 0);
    setNumber(elements.pelunasanBbnNotice, settlement.bbnNotice || 0);
    setNumber(elements.pelunasanNilaiPajak, settlement.nilaiPelunasanPajak || 0);
    setRoundedNumber(elements.pelunasanDpp, settlement.dppPelunasan || 0);
    setRoundedNumber(elements.pelunasanPpn, settlement.ppnPelunasan || 0);
    setNumber(elements.pelunasanDppPpn, settlement.dppPpnPelunasan || 0);
    if (elements.pelunasanSource) elements.pelunasanSource.value = primarySource;
    if (elements.pelunasanSimpleDate) elements.pelunasanSimpleDate.value = settlement.tanggalInvoice || today();
    if (elements.pelunasanSimpleAmount) elements.pelunasanSimpleAmount.value = formatInputAmount(amount);
    if (elements.pelunasanSimpleSource) elements.pelunasanSimpleSource.value = primarySource;
    if (elements.pelunasanSimpleNotes) elements.pelunasanSimpleNotes.value = settlement.keteranganPelunasan || '';
    setPelunasanPaymentRows(rows);
    if (settlement.hasAttachment && elements.pelunasanAttachmentNote) {
      elements.pelunasanAttachmentNote.textContent = 'File lama tetap dipakai. Pilih file baru hanya jika ingin mengganti lampiran.';
    }
    formatAllRupiahFields(elements.pelunasanModal);
  }

  function pelunasanDpOptionLabel(entry) {
    return [
      entry?.receiptNo,
      entry?.namaCustomer,
      entry?.noRangka
    ].filter(Boolean).join(' | ');
  }

  function pelunasanDpLookupText(entry) {
    return normalizeSearch([
      entry?.id,
      entry?.receiptNo,
      entry?.namaCustomer,
      entry?.noRangka,
      entry?.noMesin,
      pelunasanDpOptionLabel(entry)
    ].join(' '));
  }

  function findPelunasanDpEntry(value) {
    const raw = text(value);
    if (!raw) return null;
    const exactMatch = state.entries.find(function (entry) {
      return raw === text(entry.id)
        || raw === text(entry.receiptNo)
        || raw === text(entry.noRangka)
        || raw === text(entry.noMesin)
        || raw === pelunasanDpOptionLabel(entry);
    });
    if (exactMatch) return exactMatch;
    const query = normalizeSearch(raw);
    if (!query || query.length < 3) return null;
    const matches = state.entries.filter(function (entry) {
      return pelunasanDpLookupText(entry).indexOf(query) !== -1;
    });
    return matches.length === 1 ? matches[0] : null;
  }

  function setPelunasanDpInputValue(entryOrId) {
    if (!elements.pelunasanDpSelect) return;
    const entry = typeof entryOrId === 'string'
      ? state.entries.find(function (item) { return item.id === entryOrId; })
      : entryOrId;
    elements.pelunasanDpSelect.value = entry ? pelunasanDpOptionLabel(entry) : '';
  }

  function normalizePelunasanDpInput() {
    const entry = selectedPelunasanDpEntry();
    if (entry) setPelunasanDpInputValue(entry);
    populatePelunasanFromDp();
    const settlement = entry ? settlementForEntry(entry) : null;
    if (settlement) {
      applyExistingPelunasanToForm(settlement);
      if (elements.pelunasanTitle) elements.pelunasanTitle.textContent = 'Ubah Pelunasan';
      if (elements.pelunasanMeta) elements.pelunasanMeta.textContent = 'Ubah data pelunasan yang sudah tersimpan.';
      if (elements.pelunasanSaveButton) elements.pelunasanSaveButton.textContent = 'Simpan Perubahan';
    } else {
      syncSimplePelunasanDefaults();
      resetPelunasanPaymentRows(pelunasanPaymentExpectedAmount(), elements.pelunasanSource?.value || 'kas:kas-besar');
      if (elements.pelunasanTitle) elements.pelunasanTitle.textContent = 'Pelunasan';
      if (elements.pelunasanMeta) {
        elements.pelunasanMeta.textContent = usesSimplePelunasanForm()
          ? 'Isi pembayaran penjualan, sama seperti pelunasan pembelian.'
          : 'Pilih DP dari No Kwitansi, lalu lengkapi data invoice.';
      }
      if (elements.pelunasanSaveButton) elements.pelunasanSaveButton.textContent = 'Simpan';
    }
  }

  function selectedPelunasanDpEntry() {
    if (state.activeCompleteSettlementId) return null;
    return findPelunasanDpEntry(elements.pelunasanDpSelect ? elements.pelunasanDpSelect.value : '');
  }

  function selectedPelunasanCompleteEntry() {
    return state.activeCompleteSettlementId
      ? findCompleteEntryGroup(state.activeCompleteSettlementId)
      : null;
  }

  function populatePelunasanFromDp() {
    if (state.activeCompleteSettlementId) return;
    const entry = selectedPelunasanDpEntry();
    setInput(elements.pelunasanTanggalKwitansi, entry ? entry.tanggal : '');
    setInput(elements.pelunasanNoRangka, entry ? entry.noRangka : '');
    setInput(elements.pelunasanTipeMotor, entry ? entry.tipeMotor : '');
    setInput(elements.pelunasanNoMesin, entry ? entry.noMesin : '');
    setInput(elements.pelunasanWarna, entry ? entry.warna : '');
    setInput(elements.pelunasanNamaCustomer, entry ? entry.namaCustomer : '');
    setInput(elements.pelunasanNikNpwp, entry ? entry.nikNpwp : '');
    setInput(elements.pelunasanAlamat, entry ? entry.alamat : '');
    setNumber(elements.pelunasanHargaPricelist, entry ? entry.hargaPricelist : 0);
    setNumber(elements.pelunasanDisc, entry ? entry.disc : 0);
    setNumber(elements.pelunasanDpPaid, entry ? entry.jumlahDp : 0);
    setNumber(elements.pelunasanBbnNotice, entry ? persadaBbnNoticeValue(entry) : 0);
    calculatePelunasan();
  }

  function calculatePelunasan() {
    const completeEntry = selectedPelunasanCompleteEntry();
    if (completeEntry) {
      const summary = completeSummary(completeEntry);
      setNumber(elements.pelunasanHargaSetelahDisc, summary.totalTagihan);
      setNumber(elements.pelunasanNilaiPajak, Math.max(0, roundAmount(summary.totalTagihan - summary.bbnNotice)));
      setRoundedNumber(elements.pelunasanDpp, summary.dpp);
      setRoundedNumber(elements.pelunasanPpn, summary.ppn);
      setNumber(elements.pelunasanDppPpn, summary.dppPpn || Math.max(0, roundAmount(summary.totalTagihan - summary.bbnNotice)));
      applySimplePelunasanValuesToLegacyFields();
      formatAllRupiahFields(elements.pelunasanModal);
      syncPelunasanPaymentRowsToExpected();
      return;
    }
    const priceList = parseAmountInput(elements.pelunasanHargaPricelist);
    const discount = parseAmountInput(elements.pelunasanDisc);
    const discountAdditional = parseAmountInput(elements.pelunasanDiscTambahan);
    const priceAfterDiscount = roundAmount(priceList - discount - discountAdditional);
    const dpPaid = parseAmountInput(elements.pelunasanDpPaid);
    const bbnNotice = parseAmountInput(elements.pelunasanBbnNotice);
    const taxableSettlementValue = roundAmount(priceAfterDiscount - dpPaid - bbnNotice);
    const dpp = roundAmount(taxableSettlementValue / 1.11);
    const ppn = roundAmount(dpp * 0.11);
    const dppPpn = roundAmount(dpp + ppn);
    setNumber(elements.pelunasanHargaSetelahDisc, priceAfterDiscount);
    setNumber(elements.pelunasanNilaiPajak, taxableSettlementValue);
    setRoundedNumber(elements.pelunasanDpp, dpp);
    setRoundedNumber(elements.pelunasanPpn, ppn);
    setNumber(elements.pelunasanDppPpn, dppPpn);
    applySimplePelunasanValuesToLegacyFields();
    formatAllRupiahFields(elements.pelunasanModal);
    syncPelunasanPaymentRowsToExpected();
  }

  function lengkapItemRows() {
    return Array.from(elements.lengkapItemsList?.querySelectorAll('.purchase-item-row') || []);
  }

  function lengkapItemField(row, name) {
    return row ? row.querySelector('[data-sales-item-field="' + name + '"]') : null;
  }

  function createLengkapItemInput(name, label, value, options) {
    const wrap = document.createElement('label');
    wrap.className = 'form-field';
    if (options && options.wide) wrap.classList.add('wide');
    if (options && options.className) wrap.classList.add(options.className);
    const span = document.createElement('span');
    span.textContent = label;
    const input = document.createElement('input');
    input.dataset.salesItemField = name;
    input.value = value == null ? '' : String(value);
    input.autocomplete = 'off';
    input.type = options && options.type ? options.type : 'text';
    if (options && options.inputMode) input.inputMode = options.inputMode;
    if (options && options.readOnly) input.readOnly = true;
    if (options && options.required) input.required = true;
    if (options && options.min != null) input.min = String(options.min);
    if (options && options.step != null) input.step = String(options.step);
    if (options && options.noVisibleLabel) {
      input.setAttribute('aria-label', label);
    } else {
      wrap.appendChild(span);
    }
    wrap.appendChild(input);
    return wrap;
  }

  function renderLengkapItemsSummary() {
    if (!elements.lengkapItemsSummary) return;
    const rows = lengkapItemRows();
    const totals = rows.reduce(function (acc, row) {
      acc.qty += parseAmountInput(lengkapItemField(row, 'jumlah'));
      acc.amount += parseAmountInput(lengkapItemField(row, 'total'));
      return acc;
    }, { qty: 0, amount: 0 });
    clearNode(elements.lengkapItemsSummary);
    [
      { label: rows.length + ' barang' },
      { label: 'Qty ' + (formatAmount(totals.qty) || '0') },
      { label: 'Total Rupiah', value: formatAmount(totals.amount) || '0', highlight: true }
    ].forEach(function (stat) {
      const item = document.createElement('span');
      item.className = 'purchase-items-summary-item' + (stat.highlight ? ' highlight' : '');
      if (stat.value) {
        const label = document.createElement('span');
        label.textContent = stat.label;
        const value = document.createElement('strong');
        value.textContent = stat.value;
        item.appendChild(label);
        item.appendChild(value);
      } else {
        item.textContent = stat.label;
      }
      elements.lengkapItemsSummary.appendChild(item);
    });
  }

  function calculateLengkapItemTotals(row) {
    const qtyInput = lengkapItemField(row, 'jumlah');
    const priceInput = lengkapItemField(row, 'harga');
    const totalInput = lengkapItemField(row, 'total');
    const qty = Math.max(1, parseAmountInput(qtyInput) || 1);
    const price = parseAmountInput(priceInput);
    const total = roundAmount(qty * price);
    if (qtyInput && parseAmountInput(qtyInput) < 1) qtyInput.value = '1';
    if (totalInput) totalInput.value = formatInputAmount(total);
    renderLengkapItemsSummary();
  }

  function recalculateLengkapItems() {
    lengkapItemRows().forEach(calculateLengkapItemTotals);
    renderLengkapItemsSummary();
  }

  function renumberLengkapItems() {
    lengkapItemRows().forEach(function (row, index) {
      const numberInput = lengkapItemField(row, 'nomor');
      if (numberInput) numberInput.value = String(index + 1);
    });
    renderLengkapItemsSummary();
  }

  function addLengkapItemRow(entry) {
    if (!elements.lengkapItemsList) return null;
    const row = document.createElement('section');
    row.className = 'purchase-item-row sales-item-row';

    const grid = document.createElement('div');
    grid.className = 'purchase-item-grid is-non-ppn sales-item-grid';
    grid.appendChild(createLengkapItemInput('nomor', 'No', '', { readOnly: true, className: 'purchase-item-number-field', noVisibleLabel: true }));
    grid.appendChild(createLengkapItemInput('namaBarang', 'Nama Barang', entry?.namaBarang || entry?.tipeMotor || '', { required: true, wide: true, noVisibleLabel: true }));
    grid.appendChild(createLengkapItemInput('jumlah', 'Qty', entry?.jumlah || entry?.quantity || 1, { type: 'number', min: 1, step: 1, required: true, noVisibleLabel: true }));
    grid.appendChild(createLengkapItemInput('harga', 'Harga Satuan', formatAmount(entry?.hargaSatuan || entry?.hargaPricelist), { inputMode: 'decimal', noVisibleLabel: true }));
    grid.appendChild(createLengkapItemInput('total', 'Jumlah', formatAmount(entry?.total || entry?.totalTagihan), { inputMode: 'decimal', readOnly: true, noVisibleLabel: true }));
    const action = document.createElement('div');
    action.className = 'sales-item-actions';
    const removeButton = document.createElement('button');
    removeButton.className = 'cashbook-action-button danger sales-item-remove-button';
    removeButton.type = 'button';
    removeButton.dataset.action = 'remove-sales-item';
    removeButton.textContent = 'Hapus';
    action.appendChild(removeButton);
    grid.appendChild(action);
    row.appendChild(grid);

    removeButton.addEventListener('click', function () {
      row.remove();
      renumberLengkapItems();
    });

    ['jumlah', 'harga'].forEach(function (name) {
      const input = lengkapItemField(row, name);
      if (!input) return;
      input.addEventListener('input', function () {
        if (name === 'harga') input.value = formatInputAmount(parseAmountInput(input));
        calculateLengkapItemTotals(row);
      });
      input.addEventListener('blur', function () {
        if (name === 'jumlah' && parseAmountInput(input) < 1) input.value = '1';
        if (name === 'harga') input.value = formatInputAmount(parseAmountInput(input));
        calculateLengkapItemTotals(row);
      });
    });

    elements.lengkapItemsList.appendChild(row);
    calculateLengkapItemTotals(row);
    renumberLengkapItems();
    return row;
  }

  function resetLengkapItems(entry) {
    clearNode(elements.lengkapItemsList);
    if (entry) addLengkapItemRow(entry);
    renderLengkapItemsSummary();
  }

  function collectLengkapItems() {
    return lengkapItemRows().map(function (row) {
      return {
        namaBarang: lengkapItemField(row, 'namaBarang')?.value || '',
        jumlah: lengkapItemField(row, 'jumlah')?.value || '1',
        harga: lengkapItemField(row, 'harga')?.value || '',
        total: lengkapItemField(row, 'total')?.value || ''
      };
    });
  }

  function pelunasanPaymentPayloadRows() {
    return collectPelunasanPaymentRows(activePelunasanPaymentContainer()).map(function (row) {
      return {
        amount: String(row.amount),
        source: row.source,
        notes: row.notes
      };
    });
  }

  function pelunasanPrimaryPaymentSource() {
    return pelunasanPaymentPayloadRows().find(function (row) {
      return row.source;
    })?.source || elements.pelunasanSource?.value || elements.pelunasanSimpleSource?.value || 'kas:kas-besar';
  }

  function simplePelunasanPayloadFields() {
    if (!usesSimplePelunasanForm()) return {};
    const amount = amountPayload(elements.pelunasanSimpleAmount);
    const paymentRows = pelunasanPaymentPayloadRows();
    return {
      tanggalInvoice: elements.pelunasanSimpleDate?.value || elements.pelunasanTanggalInvoice?.value || today(),
      sumberPelunasan: paymentRows[0]?.source || elements.pelunasanSimpleSource?.value || elements.pelunasanSource?.value || '',
      pelunasanPaymentRows: paymentRows,
      nilaiPelunasan: amount,
      pelunasan: amount,
      settlementAmount: amount,
      bbnNotice: '0',
      dppPelunasan: amount,
      ppnPelunasan: '0',
      dppPpnPelunasan: amount,
      keteranganPelunasan: elements.pelunasanSimpleNotes?.value || ''
    };
  }

  function validateSimplePelunasanFields() {
    if (!usesSimplePelunasanForm()) return;
    if (!elements.pelunasanSimpleDate?.value) {
      throw new Error('Tanggal Pelunasan wajib diisi.');
    }
    if (parseAmountInput(elements.pelunasanSimpleAmount) <= 0) {
      throw new Error('Nilai Pelunasan wajib lebih dari 0.');
    }
  }

  async function pelunasanPayload() {
    calculatePelunasan();
    const simpleFields = simplePelunasanPayloadFields();
    const paymentRows = pelunasanPaymentPayloadRows();
    const primarySource = paymentRows[0]?.source || pelunasanPrimaryPaymentSource();
    const completeEntry = selectedPelunasanCompleteEntry();
    if (completeEntry) {
      const summary = completeSummary(completeEntry);
      return Object.assign({
        completeEntryId: completeEntry.primaryId || completeEntry.id,
        noKwitansi: completeEntry.receiptNo || '',
        noInvoice: completeEntry.noInvoice || '',
        tanggalInvoice: elements.pelunasanTanggalInvoice.value,
        sumberPelunasan: primarySource,
        pelunasanPaymentRows: paymentRows,
        bbnNotice: amountPayload(elements.pelunasanBbnNotice),
        totalTagihan: summary.totalTagihan
      }, simpleFields, await attachmentPayload(elements.pelunasanAttachmentFile));
    }
    const entry = selectedPelunasanDpEntry();
    if (!entry) throw new Error('Pilih atau ketik No Kwitansi DP yang tersedia.');
    return Object.assign({
      dpEntryId: entry ? entry.id : '',
      noKwitansi: entry ? entry.receiptNo : '',
      tanggalInvoice: elements.pelunasanTanggalInvoice.value,
      sumberPelunasan: primarySource,
      pelunasanPaymentRows: paymentRows,
      discTambahan: amountPayload(elements.pelunasanDiscTambahan),
      bbnNotice: amountPayload(elements.pelunasanBbnNotice)
    }, simpleFields, await attachmentPayload(elements.pelunasanAttachmentFile));
  }

  async function submitPelunasan(event) {
    event.preventDefault();
    elements.pelunasanSaveButton.disabled = true;
    setAlert('');
    try {
      validateSimplePelunasanFields();
      validatePelunasanPaymentRows();
      const data = await requestJson(apiBase() + '/pelunasan', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(await pelunasanPayload())
      });
      if (!data) return;
      applySalesData(data);
      renderClient();
      renderPelunasanOptions();
      renderPelunasanSourceOptions();
      renderRows();
      closePelunasanModal();
      setAlert('Data Pelunasan tersimpan: ' + text(data.invoiceNo), 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan Pelunasan.', 'error');
    } finally {
      elements.pelunasanSaveButton.disabled = false;
    }
  }

  async function fakturPayload() {
    return Object.assign({
      dpEntryId: elements.fakturDpEntryId.value,
      noFaktur: elements.fakturNo.value,
      tanggalFaktur: elements.fakturTanggal.value
    }, await attachmentPayload(elements.fakturAttachmentFile));
  }

  async function submitFaktur(event) {
    event.preventDefault();
    elements.fakturSaveButton.disabled = true;
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/faktur', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(await fakturPayload())
      });
      if (!data) return;
      state.client = data.client || state.client;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.settlements = Array.isArray(data.settlements) ? data.settlements : state.settlements;
      state.fakturEntries = Array.isArray(data.fakturEntries) ? data.fakturEntries : state.fakturEntries;
      renderClient();
      renderRows();
      closeFakturModal();
      setAlert('Data faktur tersimpan.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan faktur.', 'error');
    } finally {
      elements.fakturSaveButton.disabled = false;
    }
  }

  async function lengkapPayload() {
    const entity = selectedSalesLengkapEntity();
    if (isDemoMotorClient()) {
      calculateLengkapDemoMotor();
      return Object.assign({
        tanggal: elements.lengkapTanggal.value,
        tanggalInvoice: elements.lengkapTanggalInvoice.value,
        noRangka: elements.lengkapNoRangka.value,
        tipeMotor: elements.lengkapTipeMotor.value,
        noMesin: elements.lengkapNoMesin.value,
        warna: elements.lengkapWarna.value,
        namaCustomer: elements.lengkapNamaCustomer.value,
        nikNpwp: elements.lengkapNikNpwp.value,
        alamat: elements.lengkapAlamat.value,
        catatan: elements.lengkapCatatan ? elements.lengkapCatatan.value : '',
        hargaPricelist: amountPayload(elements.lengkapHargaPricelist),
        disc: amountPayload(elements.lengkapDisc),
        bbnNotice: amountPayload(elements.lengkapBbnNotice)
      }, await attachmentPayload(elements.lengkapAttachmentFile));
    }
    recalculateLengkapItems();
    const items = collectLengkapItems();
    const firstItem = items[0] || {};
    return Object.assign({
      businessEntityKey: entity?.key || '',
      businessEntityName: entity?.name || '',
      tanggal: elements.lengkapTanggal.value,
      tanggalInvoice: elements.lengkapTanggalInvoice.value,
      namaCustomer: elements.lengkapNamaCustomer.value,
      nikNpwp: elements.lengkapNikNpwp.value,
      alamat: elements.lengkapAlamat.value,
      catatan: elements.lengkapCatatan ? elements.lengkapCatatan.value : '',
      items,
      namaBarang: firstItem.namaBarang || '',
      jumlah: firstItem.jumlah || '1',
      harga: firstItem.harga || '',
      total: firstItem.total || ''
    }, await attachmentPayload(elements.lengkapAttachmentFile));
  }

  async function submitLengkap(event) {
    event.preventDefault();
    setAlert('');
    if (!text(state.editingLengkapId) && salesRequiresBusinessEntity() && !hasSelectedSalesLengkapEntity()) {
      setAlert('Pilih entitas sebelum menyimpan Penjualan.', 'error');
      if (elements.lengkapEntityGateSelect) elements.lengkapEntityGateSelect.focus();
      return;
    }
    if (isDemoMotorClient()) {
      fillLengkapVehicleFromInventory();
      try {
        validateDemoMotorVehicleSelection(elements.lengkapInventoryVehicleSelect, {
          noRangka: elements.lengkapNoRangka,
          noMesin: elements.lengkapNoMesin
        }, state.editingLengkapId);
      } catch (err) {
        setAlert(err.message || 'Pilih kendaraan dari Buku Persediaan.', 'error');
        if (elements.lengkapInventoryVehicleSelect && !elements.lengkapInventoryVehicleSelect.disabled) elements.lengkapInventoryVehicleSelect.focus();
        return;
      }
      calculateLengkapDemoMotor();
    } else {
      recalculateLengkapItems();
      const itemRows = lengkapItemRows();
      if (!itemRows.length) {
        setAlert('Tambahkan minimal satu barang penjualan.', 'error');
        if (elements.lengkapAddItemButton) elements.lengkapAddItemButton.focus();
        return;
      }
      const invalidRow = itemRows.find(function (row) {
        return !text(lengkapItemField(row, 'namaBarang')?.value);
      });
      if (invalidRow) {
        setAlert('Nama barang wajib diisi.', 'error');
        lengkapItemField(invalidRow, 'namaBarang')?.focus();
        return;
      }
    }
    elements.lengkapSaveButton.disabled = true;
    try {
      const editingId = text(state.editingLengkapId);
      const data = await requestJson(apiBase() + '/lengkap' + (editingId ? '/' + encodeURIComponent(editingId) : ''), {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(await lengkapPayload())
      });
      if (!data) return;
      applySalesData(data);
      renderClient();
      renderInventoryOptions();
      renderPelunasanOptions();
      renderPelunasanSourceOptions();
      renderRows();
      closeLengkapModal();
      setAlert((editingId ? 'Data Penjualan diperbarui: ' : 'Data Penjualan tersimpan: ') + [text(data.receiptNo), text(data.invoiceNo)].filter(Boolean).join(' / '), 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan data Penjualan.', 'error');
    } finally {
      elements.lengkapSaveButton.disabled = false;
    }
  }

  async function deleteLengkapEntry(entryId) {
    const entry = findCompleteEntryGroup(entryId);
    if (!entry) {
      setAlert('Data Penjualan tidak ditemukan.', 'error');
      return;
    }
    const itemIds = entry.itemIds && entry.itemIds.length ? entry.itemIds : [entry.id];
    const itemInfo = itemIds.length > 1 ? '\n\nData ini berisi ' + itemIds.length + ' barang dalam satu invoice.' : '';
    if (!window.confirm('Hapus data Penjualan ini?' + itemInfo + '\n\n' + [text(entry.receiptNo), text(entry.noInvoice), text(entry.namaCustomer)].filter(Boolean).join(' - '))) return;
    setAlert('');
    try {
      let data = null;
      for (let index = 0; index < itemIds.length; index += 1) {
        data = await requestJson(apiBase() + '/lengkap/' + encodeURIComponent(itemIds[index]), {
          method: 'DELETE',
          headers: { 'Accept': 'application/json' }
        });
        if (!data) return;
      }
      applySalesData(data || {});
      renderClient();
      renderInventoryOptions();
      renderPelunasanOptions();
      renderPelunasanSourceOptions();
      renderRows();
      renderDpSearchRows();
      setAlert('Data Penjualan dihapus: ' + [text(data?.receiptNo || entry.receiptNo), text(data?.invoiceNo || entry.noInvoice)].filter(Boolean).join(' / '), 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus data Penjualan.', 'error');
    }
  }

  function openSalesDetail(entryId) {
    const entry = state.entries.find(function (item) {
      return item.id === entryId;
    });
    if (!entry) {
      setAlert('Data Buku Penjualan tidak ditemukan.', 'error');
      return;
    }

    const summary = salesDisplaySummary(entry);
    const faktur = fakturForEntry(entry);
    setText(elements.detailMeta, text(entry.receiptNo, '-') + ' | ' + summary.status.label);
    clearNode(elements.detailContent);

    elements.detailContent.appendChild(detailSummaryCards([
      ['Status', summary.status.label],
      ['Stock', entry.stockMissing ? 'Belum ada di Buku Persediaan' : 'Ada di Buku Persediaan'],
      ['DPP Gabungan', formatAmountRound(summary.dpp)],
      ['PPN Gabungan', formatAmountRound(summary.ppn)],
      ['DPP + PPN Gabungan', formatAmount(summary.dppPpn)]
    ], summary.status));

    const taxableDeliveryDpp = roundAmount(Number(summary.nilaiPenyerahanPajak || 0) / 1.11);
    const taxableDeliveryPpn = roundAmount(taxableDeliveryDpp * 0.11);
    const taxableDeliveryDppPpn = roundAmount(taxableDeliveryDpp + taxableDeliveryPpn);

    elements.detailContent.appendChild(detailSection('Informasi Umum', [
      ['Nama Customer', entry.namaCustomer],
      ['NIK/NPWP', entry.nikNpwp],
      ['Alamat', entry.alamat],
      ['Catatan', entry.catatan],
      ['No.Rangka', entry.noRangka],
      ['No.Mesin', entry.noMesin],
      ['', ''],
      ['Harga Pricelist', formatAmount(summary.hargaPricelist)],
      ['Disc', formatAmount(summary.totalDiscount)],
      ['Harga Setelah Disc', formatAmount(summary.hargaSetelahDisc)],
      ['BBN Notice', formatAmount(summary.bbnNotice)],
      ['Nilai Penyerahan Pajak', formatAmount(summary.nilaiPenyerahanPajak)],
      ['', ''],
      ['DPP Nilai Penyerahan Pajak', formatAmountRound(taxableDeliveryDpp)],
      ['PPN Nilai Penyerahan Pajak', formatAmountRound(taxableDeliveryPpn)],
      ['DPP + PPN Penyerahan', formatAmountRound(taxableDeliveryDppPpn)],
      ['BBN Unnotice', formatAmount(summary.bbnUnnotice)],
      ['', ''],
      ['', '']
    ]));

    elements.detailContent.appendChild(detailSection('Input DP', [
      ['No Kwitansi', entry.receiptNo],
      ['Tanggal Kwitansi', entry.tanggal],
      ['', ''],
      ['DP Customer', formatAmount(entry.dpCustomer)],
      ['DP Tambahan', formatAmount(entry.dpTambahan)],
      ['Total DP', formatAmount(entry.jumlahDp)],
      ['DPP DP', formatAmountRound(entry.dpp)],
      ['PPN DP', formatAmountRound(entry.ppn)],
      ['DPP + PPN DP', formatAmount(entry.dppPpn)]
    ]));

    if (summary.settlement) {
      if (usesSimplePelunasanForm()) {
        elements.detailContent.appendChild(detailSection('Input Pelunasan', [
          ['No Invoice', summary.settlement.noInvoice],
          ['Tanggal Pelunasan', formatDisplayDate(summary.settlement.tanggalInvoice)],
          ['Sumber Pelunasan', [summary.settlement.coaPelunasan, summary.settlement.namaAkunPelunasan].filter(Boolean).join(' - ')],
          ['Nilai Pelunasan', formatAmount(Number(summary.settlement.dppPpnPelunasan || 0) + Number(summary.settlement.bbnNotice || 0))],
          ['Keterangan', summary.settlement.keteranganPelunasan || '-']
        ]));
      } else {
        elements.detailContent.appendChild(detailSection('Input Pelunasan', [
          ['No Invoice', summary.settlement.noInvoice],
          ['Tanggal Invoice', summary.settlement.tanggalInvoice],
          ['', ''],
          ['DPP Pelunasan', formatAmountRound(summary.settlement.dppPelunasan)],
          ['PPN Pelunasan', formatAmountRound(summary.settlement.ppnPelunasan)],
          ['DPP + PPN Pelunasan', formatAmount(summary.settlement.dppPpnPelunasan)],
          ['Sumber Pelunasan', [summary.settlement.coaPelunasan, summary.settlement.namaAkunPelunasan].filter(Boolean).join(' - ')]
        ]));
      }
    } else {
      elements.detailContent.appendChild(detailEmptySection('Input Pelunasan', 'Belum ada data pelunasan untuk No Kwitansi ini.'));
    }

    if (faktur) {
      elements.detailContent.appendChild(detailSection('Input Faktur', [
        ['No Faktur', faktur.noFaktur],
        ['Tanggal Faktur', faktur.tanggalFaktur],
        ['File Faktur', faktur.hasAttachment ? text(faktur.attachmentName, 'Ada file') : 'Belum ada file']
      ]));
    } else {
      elements.detailContent.appendChild(detailEmptySection('Input Faktur', 'Belum ada data faktur untuk invoice ini.'));
    }

    state.activeDetailKind = 'legacy';
    state.activeDetailId = entry.id;
    renderDetailActions(salesActionButtons(entry, summary, faktur));
    elements.detailModal.hidden = false;
  }

  function openCompleteDetail(entryId) {
    const entry = findCompleteEntryGroup(entryId);
    if (!entry) {
      setAlert('Data Penjualan tidak ditemukan.', 'error');
      return;
    }
    const summary = completeDisplaySummary(entry);
    const status = { label: 'Penjualan', className: 'complete' };
    const items = completeItems(entry);
    setText(elements.detailMeta, [text(entry.receiptNo, '-'), text(entry.noInvoice, '-')].join(' | '));
    clearNode(elements.detailContent);

    elements.detailContent.appendChild(detailSummaryCards([
      ['Status', 'Penjualan'],
      ['Barang', String(items.length)],
      ['Qty', formatAmount(summary.quantity)],
      ['Total Rupiah', formatAmount(summary.totalTagihan)]
    ], status));

    elements.detailContent.appendChild(detailSection('Identitas Customer', [
      ['No Kwitansi', entry.receiptNo],
      ['Tanggal Kwitansi', formatDisplayDate(entry.tanggal)],
      ['No Invoice', entry.noInvoice],
      ['Tanggal Invoice', formatDisplayDate(entry.tanggalInvoice || entry.tanggal)],
      ['Nama Customer', entry.namaCustomer],
      ['NIK/NPWP', entry.nikNpwp],
      ['Alamat', entry.alamat],
      ['Catatan', entry.catatan || entry.keterangan]
    ]));

    elements.detailContent.appendChild(detailItemsSection('Rincian Barang', items, summary.totalTagihan));

    if (summary.settlement) {
      if (usesSimplePelunasanForm()) {
        elements.detailContent.appendChild(detailSection('Pelunasan', [
          ['Tanggal Pelunasan', formatDisplayDate(summary.settlement.tanggalInvoice)],
          ['Sumber Pelunasan', [summary.settlement.coaPelunasan, summary.settlement.namaAkunPelunasan].filter(Boolean).join(' - ')],
          ['Nilai Pelunasan', formatAmount(Number(summary.settlement.dppPpnPelunasan || 0) + Number(summary.settlement.bbnNotice || 0))],
          ['Keterangan', summary.settlement.keteranganPelunasan || '-']
        ]));
      } else {
        elements.detailContent.appendChild(detailSection('Pelunasan', [
          ['Tanggal Pelunasan', formatDisplayDate(summary.settlement.tanggalInvoice)],
          ['Sumber Pelunasan', [summary.settlement.coaPelunasan, summary.settlement.namaAkunPelunasan].filter(Boolean).join(' - ')],
          ['DPP', formatAmountRound(summary.settlement.dppPelunasan)],
          ['PPN', formatAmountRound(summary.settlement.ppnPelunasan)],
          ['Jumlah Pelunasan', formatAmount(Number(summary.settlement.dppPpnPelunasan || 0) + Number(summary.settlement.bbnNotice || 0))]
        ]));
      }
    } else {
      elements.detailContent.appendChild(detailEmptySection('Pelunasan', 'Belum ada data pelunasan untuk invoice ini.'));
    }

    state.activeDetailKind = 'complete';
    state.activeDetailId = entry.primaryId || entry.id;
    renderDetailActions(completeActionButtons(entry));
    elements.detailModal.hidden = false;
  }

  function closeSalesDetail() {
    elements.detailModal.hidden = true;
    state.activeDetailKind = '';
    state.activeDetailId = '';
    renderDetailActions([]);
  }

  function salesFileItems(entry, summary) {
    const files = [];
    if (entry && entry.hasAttachment) {
      files.push({
        stage: 'dp',
        id: entry.id,
        label: 'File DP',
        name: entry.attachmentName,
        size: entry.attachmentSize
      });
    }
    if (summary && summary.settlement && summary.settlement.hasAttachment) {
      files.push({
        stage: 'pelunasan',
        id: summary.settlement.id,
        label: 'File Pelunasan',
        name: summary.settlement.attachmentName,
        size: summary.settlement.attachmentSize
      });
    }
    const faktur = fakturForEntry(entry);
    if (faktur && faktur.hasAttachment) {
      files.push({
        stage: 'faktur',
        id: faktur.id,
        label: 'File Faktur',
        name: faktur.attachmentName,
        size: faktur.attachmentSize
      });
    }
    return files;
  }

  async function openSalesFiles(entryId) {
    const entry = state.entries.find(function (item) {
      return item.id === entryId;
    });
    if (!entry) {
      setAlert('Data Buku Penjualan tidak ditemukan.', 'error');
      return;
    }
    const summary = salesDisplaySummary(entry);
    const files = salesFileItems(entry, summary);
    if (!files.length) {
      setAlert('Belum ada file ter-upload untuk data ini.', 'info');
      return;
    }
    showFileModal(files);
    await loadSalesFile(files[0]);
  }

  async function openCompleteFile(entryId) {
    const entry = findCompleteEntryGroup(entryId);
    const files = completeItems(entry).filter(function (item) {
      return item.hasAttachment;
    }).map(function (item, index) {
      return {
        stage: 'lengkap',
        id: item.id,
        label: completeItems(entry).length > 1 ? 'File Penjualan ' + (index + 1) : 'File Penjualan',
        name: item.attachmentName,
        size: item.attachmentSize
      };
    });
    if (!files.length) {
      setAlert('Belum ada file ter-upload untuk data Penjualan.', 'info');
      return;
    }
    showFileModal(files);
    await loadSalesFile(files[0]);
  }

  function showFileModal(files) {
    clearNode(elements.fileTabs);
    clearNode(elements.fileViewer);
    setText(elements.fileTitle, 'Lihat File');
    setText(elements.fileMeta, 'Memuat file...');
    files.forEach(function (file) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cashbook-action-button sales-file-tab';
      button.textContent = file.label;
      button.addEventListener('click', function () {
        loadSalesFile(file);
      });
      elements.fileTabs.appendChild(button);
    });
    const loading = document.createElement('div');
    loading.className = 'cashbook-file-fallback';
    loading.textContent = 'Memuat file...';
    elements.fileViewer.appendChild(loading);
    elements.fileModal.hidden = false;
  }

  function closeFileModal() {
    elements.fileModal.hidden = true;
    clearNode(elements.fileTabs);
    clearNode(elements.fileViewer);
  }

  async function loadSalesFile(fileRef) {
    clearNode(elements.fileViewer);
    const loading = document.createElement('div');
    loading.className = 'cashbook-file-fallback';
    loading.textContent = 'Memuat file...';
    elements.fileViewer.appendChild(loading);
    setText(elements.fileTitle, fileRef.label);
    setText(elements.fileMeta, text(fileRef.name, 'lampiran') + (fileRef.size ? ' | ' + formatFileSize(fileRef.size) : ''));
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(fileRef.stage) + '/' + encodeURIComponent(fileRef.id) + '/file');
      if (!data) return;
      renderFileViewer(data, data.label || fileRef.label);
    } catch (err) {
      clearNode(elements.fileViewer);
      const error = document.createElement('div');
      error.className = 'cashbook-file-fallback';
      error.textContent = err.message || 'Gagal membuka file.';
      elements.fileViewer.appendChild(error);
    }
  }

  function renderFileViewer(file, label) {
    if (window.clientPortalRenderAttachmentViewer) {
      window.clientPortalRenderAttachmentViewer(elements.fileViewer, file, {
        titleEl: elements.fileTitle,
        metaEl: elements.fileMeta,
        label: label || 'Lihat File'
      });
      return;
    }
    const dataUrl = text(file.dataUrl);
    const mimeType = text(file.mimeType) || mimeTypeFromDataUrl(dataUrl);
    const fileName = text(file.name, 'lampiran');
    clearNode(elements.fileViewer);
    setText(elements.fileTitle, label || 'Lihat File');
    setText(elements.fileMeta, [fileName, mimeType || 'file', formatFileSize(file.size)].filter(Boolean).join(' | '));

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

  async function printSalesDocument(entryId, type) {
    const entry = state.entries.find(function (item) {
      return item.id === entryId;
    });
    if (!entry) {
      setAlert('Data Buku Penjualan tidak ditemukan untuk dicetak.', 'error');
      return;
    }

    const summary = salesDisplaySummary(entry);
    if ((type === 'invoice' || type === 'receipt-settlement') && !summary.settlement) {
      setAlert('Invoice dan kwitansi pelunasan baru bisa dicetak setelah data pelunasan dibuat.', 'info');
      return;
    }

    const context = salesPrintContext(entry, summary, type);
    const html = type === 'invoice'
      ? invoicePrintHtml(context)
      : receiptPrintHtml(context);
    const title = type === 'invoice'
      ? 'Invoice ' + context.invoiceNo
      : context.receiptTitle + ' ' + context.receiptNo;
    const popup = window.open('', '_blank', 'width=920,height=980');
    if (!popup) {
      await downloadPdfDocument(context, type, title);
      setAlert('PDF sudah diunduh. Popup preview diblokir browser.', 'info');
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.document.title = title;
    try {
      const footerSlug = slugifyPrintFooter(context.printFooterText || title);
      popup.history.replaceState(null, title, '/app/client/cetak/' + footerSlug);
    } catch {}
    popup.focus();
    await downloadPdfDocument(context, type, title);
    setAlert(title + ' PDF sudah diunduh dan preview dibuka.', 'info');
  }

  async function printCompleteSalesDocument(entryId, type) {
    const entry = findCompleteEntryGroup(entryId);
    if (!entry) {
      setAlert('Data Penjualan tidak ditemukan untuk dicetak.', 'error');
      return;
    }
    const context = completeSalesPrintContext(entry, type);
    const normalizedType = type === 'invoice' ? 'invoice' : 'receipt-complete';
    const html = normalizedType === 'invoice'
      ? invoicePrintHtml(context)
      : receiptPrintHtml(context);
    const title = normalizedType === 'invoice'
      ? 'Invoice ' + context.invoiceNo
      : context.receiptTitle + ' ' + context.receiptNo;
    const popup = window.open('', '_blank', 'width=920,height=980');
    if (!popup) {
      await downloadPdfDocument(context, normalizedType, title);
      setAlert('PDF sudah diunduh. Popup preview diblokir browser.', 'info');
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.document.title = title;
    try {
      const footerSlug = slugifyPrintFooter(context.printFooterText || title);
      popup.history.replaceState(null, title, '/app/client/cetak/' + footerSlug);
    } catch {}
    popup.focus();
    await downloadPdfDocument(context, normalizedType, title);
    setAlert(title + ' PDF sudah diunduh dan preview dibuka.', 'info');
  }

  async function downloadPdfDocument(context, type, title) {
    const logoImage = await loadPrintLogoPdfImage();
    const pdf = type === 'invoice'
      ? invoicePrintPdf(context, logoImage)
      : receiptPrintPdf(context, logoImage);
    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeFileName(title) + '.pdf';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
      link.remove();
    }, 1200);
  }

  function salesPrintContext(entry, summary, type) {
    const settlement = summary.settlement || {};
    const bbnTitipan = roundInteger(Number(summary.bbnNotice || 0));
    const totalTagihan = roundInteger(Number(summary.dppPpn || 0) + bbnTitipan);
    const pelunasanYmhDibayar = Math.max(0, roundInteger(totalTagihan - Number(entry.jumlahDp || 0)));
    const isSettlementReceipt = type === 'receipt-settlement';
    const isDpReceipt = type === 'receipt-dp';
    const printDate = isDpReceipt ? entry.tanggal : (settlement.tanggalInvoice || entry.tanggal);
    const receiptAmount = isSettlementReceipt
      ? pelunasanYmhDibayar
      : Number(entry.jumlahDp || 0);
    const receiptNo = isSettlementReceipt
      ? (settlement.noInvoice || entry.receiptNo || '-')
      : (entry.receiptNo || '-');
    const receiptTitle = isSettlementReceipt ? 'Kwitansi Pelunasan' : 'Kwitansi DP';
    const receiptKind = isSettlementReceipt ? 'CASH' : 'DP';
    const context = {
      entry,
      summary,
      settlement,
      companyName: 'CV. DEMO_MOTOR ABR',
      companyAddress: 'Jl. Jend Sudirman No.55 Kupang-Ambarawa Kab. Semarang',
      companyArea: 'Jawa Tengah',
      companyPhone: 'Telp. (0298) 592 655',
      receiptNo,
      dpReceiptNo: entry.receiptNo || '-',
      invoiceNo: settlement.noInvoice || '-',
      receiptTitle,
      receiptKind,
      date: formatPrintDate(printDate),
      customerName: entry.namaCustomer || '-',
      customerNik: entry.nikNpwp || '-',
      customerNpwp: entry.nikNpwp || '-',
      customerAddress: entry.alamat || '-',
      motorType: entry.tipeMotor || '-',
      motorKind: '',
      frameNo: entry.noRangka || '-',
      engineNo: entry.noMesin || '-',
      color: entry.warna || '-',
      year: yearFromDate(printDate),
      priceList: Number(summary.hargaPricelist || 0),
      totalDiscount: Number(summary.totalDiscount || 0),
      priceAfterDiscount: Number(summary.hargaSetelahDisc || 0),
      dpPaid: Number(entry.jumlahDp || 0),
      bbnNotice: Number(summary.bbnNotice || 0),
      bbnUnnotice: Number(summary.bbnUnnotice || 0),
      bbnTitipan,
      totalTagihan,
      pelunasanYmhDibayar,
      dpp: Number(summary.dpp || 0),
      ppn: Number(summary.ppn || 0),
      dppPpn: Number(summary.dppPpn || 0),
      receiptAmount,
      receiptAmountWords: terbilangRupiah(receiptAmount),
      printerName: text(elements.userName ? elements.userName.textContent : '', 'Client Portal'),
      printedAt: formatPrintDateTime(new Date()),
      printFooterText: ''
    };
    context.printFooterText = 'Dicetak oleh ' + context.printerName + ' | ' + context.printedAt;
    return context;
  }

  function completeSalesPrintContext(entry, type) {
    const summary = completeDisplaySummary(entry);
    const items = completeItems(entry);
    const printDate = entry.tanggalInvoice || entry.tanggal;
    const totalTagihan = roundInteger(Number(summary.totalTagihan || 0));
    const itemNames = items.map(function (item) {
      return text(item.namaBarang || item.tipeMotor);
    }).filter(Boolean).join(', ');
    const context = {
      entry,
      items,
      summary,
      settlement: {},
      companyName: 'CV. DEMO_MOTOR ABR',
      companyAddress: 'Jl. Jend Sudirman No.55 Kupang-Ambarawa Kab. Semarang',
      companyArea: 'Jawa Tengah',
      companyPhone: 'Telp. (0298) 592 655',
      receiptNo: entry.receiptNo || '-',
      dpReceiptNo: entry.receiptNo || '-',
      invoiceNo: entry.noInvoice || '-',
      receiptTitle: 'Kwitansi',
      receiptKind: 'CASH',
      date: formatPrintDate(printDate),
      customerName: entry.namaCustomer || '-',
      customerNik: entry.nikNpwp || '-',
      customerNpwp: entry.nikNpwp || '-',
      customerAddress: entry.alamat || '-',
      motorType: itemNames || entry.tipeMotor || '-',
      motorKind: '',
      frameNo: entry.noRangka || '-',
      engineNo: entry.noMesin || '-',
      color: entry.warna || '-',
      year: yearFromDate(printDate),
      priceList: Number(summary.totalTagihan || summary.hargaPricelist || 0),
      totalDiscount: Number(summary.totalDiscount || 0),
      priceAfterDiscount: Number(summary.hargaSetelahDisc || 0),
      dpPaid: 0,
      bbnNotice: Number(summary.bbnNotice || 0),
      bbnUnnotice: 0,
      bbnTitipan: roundInteger(Number(summary.bbnNotice || 0)),
      totalTagihan,
      pelunasanYmhDibayar: totalTagihan,
      dpp: Number(summary.dpp || 0),
      ppn: Number(summary.ppn || 0),
      dppPpn: Number(summary.dppPpn || 0),
      receiptAmount: totalTagihan,
      receiptAmountWords: terbilangRupiah(totalTagihan),
      printerName: text(elements.userName ? elements.userName.textContent : '', 'Client Portal'),
      printedAt: formatPrintDateTime(new Date()),
      printFooterText: ''
    };
    if (type === 'invoice') context.receiptTitle = 'Kwitansi';
    context.printFooterText = 'Dicetak oleh ' + context.printerName + ' | ' + context.printedAt;
    return context;
  }

  let printLogoPdfImagePromise = null;

  function loadPrintLogoPdfImage() {
    if (printLogoPdfImagePromise) return printLogoPdfImagePromise;
    printLogoPdfImagePromise = new Promise(function (resolve) {
      const image = new Image();
      image.onload = function () {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth || image.width || 200;
          canvas.height = image.naturalHeight || image.height || 200;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
          const base64 = dataUrl.split(',')[1] || '';
          resolve({
            width: canvas.width,
            height: canvas.height,
            hex: base64ToHex(base64)
          });
        } catch (error) {
          resolve(null);
        }
      };
      image.onerror = function () {
        resolve(null);
      };
      image.src = '/app/assets/client/persada-motor-logo.png';
    });
    return printLogoPdfImagePromise;
  }

  function receiptPrintPdf(context, logoImage) {
    const doc = createPdfDocument('Kwitansi ' + context.receiptNo, logoImage);
    doc.rect(35, 30, 525, 800, '#ffffff', '#111111', 1);
    pdfHeader(doc, context, '');
    doc.text(context.receiptTitle.toUpperCase(), 190, 124, 12, 'bold');
    doc.text('NO ' + context.receiptNo, 330, 124, 11);

    let y = 156;
    pdfLineField(doc, 'Diterima dari', context.customerName + ' - ' + context.customerAddress, y);
    y += 32;
    doc.text('Jumlah uang', 48, y + 18, 10);
    doc.text(':', 124, y + 18, 10);
    doc.rect(135, y, 420, 38, '#cfe2f3', '#111111', 1);
    doc.text(pdfClip(context.receiptAmountWords, 62), 145, y + 15, 11, 'bold');

    y += 62;
    pdfLineField(doc, 'Jenis Pelunasan', context.receiptKind, y, 140);
    y += 35;
    doc.text('Untuk', 48, y, 10);
    doc.text('pembayaran', 48, y + 12, 10);
    doc.text(':', 124, y + 6, 10);
    doc.text('Sepeda Motor Yamaha', 140, y, 10);
    y += 18;
    [
      ['Type', context.motorType],
      ['Jenis', context.motorKind],
      ['No.Rangka', context.frameNo],
      ['No.Mesin', context.engineNo],
      ['Tahun', context.year],
      ['Warna', context.color],
      ['Atas nama STNK', context.customerName],
      ['Alamat', context.customerAddress]
    ].forEach(function (row) {
      pdfSmallLine(doc, row[0], row[1], y, 140, 420);
      y += 14;
    });

    y += 14;
    pdfLineField(doc, 'Keterangan', '', y);
    y += 38;
    doc.rect(48, y, 145, 40, '#cfe2f3', '#111111', 1);
    doc.text('Rp', 62, y + 24, 14);
    doc.text(formatAmountRound(context.receiptAmount), 92, y + 24, 14, 'bold');
    doc.text('INCLUDE BBN', 48, y + 66, 10);
    doc.text('Kwitansi ini dianggap sah apabila pembayaran', 48, y + 92, 9);
    doc.text('dengan cek / giro telah diuangkan / clearing', 48, y + 106, 9);
    doc.text('Ambarawa,   ' + context.date, 370, y + 34, 10);
    doc.text('(                              )', 360, y + 122, 11);
    pdfFooter(doc, context);
    return doc.output();
  }

  function invoicePrintPdf(context, logoImage) {
    const doc = createPdfDocument('Invoice ' + context.invoiceNo, logoImage);
    doc.rect(35, 30, 525, 800, '#ffffff', '#111111', 1);
    pdfHeader(doc, context, 'I N V O I C E');

    let y = 132;
    doc.line(42, y, 553, y, 1);
    pdfTextPair(doc, 'No.Invoice', context.invoiceNo, 48, y + 14, 'Tanggal', context.date, 285);
    pdfTextPair(doc, 'No.Kwitansi', context.receiptNo, 48, y + 29, '', '', 285);
    doc.line(42, y + 36, 553, y + 36, 1);
    y += 48;

    y = pdfTableBlock(doc, 'Identitas Pembeli', [
      ['Nama', context.customerName],
      ['NIK', context.customerNik],
      ['NPWP', context.customerNpwp],
      ['Alamat', context.customerAddress]
    ], y);

    y = pdfTwoColumnBlock(doc, 'Keterangan Unit', [
      ['Type', context.motorType, 'Jenis', context.motorKind],
      ['Nomor Rangka', context.frameNo, 'Warna', context.color],
      ['Nomor Mesin', context.engineNo, 'Tahun', context.year]
    ], y);

    y = pdfTableBlock(doc, 'Identitas Bea Balik Nama', [
      ['Nama', context.customerName],
      ['Fotocopy KTP', context.customerNik],
      ['Fotocopy NPWP', context.customerNpwp],
      ['Alamat', context.customerAddress]
    ], y);

    y = pdfPriceBlock(doc, 'Harga Penjualan', [
      ['Pricelist (termasuk helm dan jaket)', context.priceList],
      ['Discount', context.totalDiscount],
      ['Total Harga Penjualan', context.priceAfterDiscount, true]
    ], y, false);

    y = pdfPriceBlock(doc, 'Rincian Harga Penjualan', [
      ['Jumlah DPP', roundInteger(context.dpp)],
      ['Jumlah PPN', roundInteger(context.ppn)],
      ['Bea Balik Nama (titipan)', context.bbnTitipan],
      ['TOTAL TAGIHAN', context.totalTagihan, true]
    ], y, true);

    y = pdfPriceBlock(doc, '', [
      ['Total DP', context.dpPaid],
      ['Pelunasan Ymh Dibayar', context.pelunasanYmhDibayar, true]
    ], y, true);

    doc.rect(42, y, 511, 42, '#cfe2f3', '#111111', 1);
    doc.text('Terbilang', 52, y + 23, 10);
    doc.text(pdfClip(terbilangRupiah(context.pelunasanYmhDibayar), 54), 126, y + 23, 10, 'bold');
    doc.line(125, y + 26, 395, y + 26, 0.8);
    y += 58;
    doc.line(42, y, 553, y, 1);
    doc.text('Cat :', 42, y + 16, 9);
    doc.text('Invoice ini dianggap sah apabila pembayaran dengan cek / giro telah diuangkan / clearing', 42, y + 30, 8);
    doc.text('Ambarawa,   ' + context.date, 360, y + 50, 10);
    doc.text('(                              )', 352, y + 92, 11);
    pdfFooter(doc, context);
    return doc.output();
  }

  function receiptPrintHtml(context) {
    return printDocumentShell(
      context.receiptTitle + ' ' + context.receiptNo,
      '<main class="receipt-print">' +
        printHeaderHtml(context, '') +
        '<div class="receipt-title"><strong>' + escapeHtml(context.receiptTitle.toUpperCase()) + '</strong><span>NO ' + escapeHtml(context.receiptNo) + '</span></div>' +
        printLine('Diterima dari', context.customerName + ' - ' + context.customerAddress) +
        '<div class="print-row print-row-highlight"><span>Jumlah uang</span><i>:</i><strong>' + escapeHtml(context.receiptAmountWords) + '</strong></div>' +
        printLine('Jenis Pelunasan', context.receiptKind) +
        '<div class="payment-detail">' +
          '<span>Untuk pembayaran</span>' +
          '<i>:</i>' +
          '<div class="payment-lines">' +
            '<div class="payment-product">Sepeda Motor Yamaha</div>' +
            printSmallLine('Type', context.motorType) +
            printSmallLine('Jenis', context.motorKind) +
            printSmallLine('No.Rangka', context.frameNo) +
            printSmallLine('No.Mesin', context.engineNo) +
            printSmallLine('Tahun', context.year) +
            printSmallLine('Warna', context.color) +
            printSmallLine('Atas nama STNK', context.customerName) +
            printSmallLine('Alamat', context.customerAddress) +
          '</div>' +
        '</div>' +
        printLine('Keterangan', '') +
        '<div class="receipt-bottom">' +
          '<div>' +
            '<div class="receipt-amount"><span>Rp</span><strong>' + escapeHtml(formatAmount(context.receiptAmount)) + '</strong></div>' +
            '<p>INCLUDE BBN</p>' +
            '<p>Kwitansi ini dianggap sah apabila pembayaran dengan cek / giro telah diuangkan / clearing</p>' +
          '</div>' +
          '<div class="sign-box">' +
            '<p>Ambarawa, &nbsp; ' + escapeHtml(context.date) + '</p>' +
            '<span>(</span><span>)</span>' +
          '</div>' +
        '</div>' +
        printFooterHtml(context) +
      '</main>'
    );
  }

  function invoicePrintHtml(context) {
    return printDocumentShell(
      'Invoice ' + context.invoiceNo,
      '<main class="invoice-print">' +
        printHeaderHtml(context, 'INVOICE') +
        '<table class="print-table compact">' +
          '<tbody>' +
            printTableRow('No.Invoice', context.invoiceNo, 'Tanggal', context.date) +
            printTableRow('No.Kwitansi', context.receiptNo, '', '') +
          '</tbody>' +
        '</table>' +
        printTableBlock('Identitas Pembeli', [
          ['Nama', context.customerName],
          ['NIK', context.customerNik],
          ['NPWP', context.customerNpwp],
          ['Alamat', context.customerAddress]
        ]) +
        '<section class="print-block"><h3>Keterangan Unit</h3>' +
          '<table class="print-table two-col"><tbody>' +
            printTableRow('Type', context.motorType, 'Jenis', context.motorKind) +
            printTableRow('Nomor Rangka', context.frameNo, 'Warna', context.color) +
            printTableRow('Nomor Mesin', context.engineNo, 'Tahun', context.year) +
          '</tbody></table>' +
        '</section>' +
        printTableBlock('Identitas Bea Balik Nama', [
          ['Nama', context.customerName],
          ['Fotocopy KTP', context.customerNik],
          ['Fotocopy NPWP', context.customerNpwp],
          ['Alamat', context.customerAddress]
        ]) +
        '<section class="print-block price-block"><h3>Harga Penjualan</h3>' +
          '<table class="price-table"><tbody>' +
            printPriceRow('Pricelist (termasuk helm dan jaket)', context.priceList) +
            printPriceRow('Discount', context.totalDiscount) +
            printPriceRow('Total Harga Penjualan', context.priceAfterDiscount, '', true) +
          '</tbody></table>' +
        '</section>' +
        '<section class="print-block blue-block"><h3>Rincian Harga Penjualan</h3>' +
          '<table class="price-table"><tbody>' +
            printPriceRow('Jumlah DPP', roundInteger(context.dpp)) +
            printPriceRow('Jumlah PPN', roundInteger(context.ppn)) +
            printPriceRow('Bea Balik Nama (titipan)', context.bbnTitipan) +
            printPriceRow('TOTAL TAGIHAN', context.totalTagihan, '', true) +
          '</tbody></table>' +
        '</section>' +
        '<section class="print-block blue-block payment-block">' +
          '<table class="price-table"><tbody>' +
            printPriceRow('Total DP', context.dpPaid) +
            printPriceRow('Pelunasan Ymh Dibayar', context.pelunasanYmhDibayar, '', true) +
          '</tbody></table>' +
        '</section>' +
        '<div class="terbilang"><span>Terbilang</span><strong>' + escapeHtml(terbilangRupiah(context.pelunasanYmhDibayar)) + '</strong></div>' +
        '<p class="invoice-note">Cat :<br>Invoice ini dianggap sah apabila pembayaran dengan cek / giro telah diuangkan / clearing</p>' +
        '<div class="invoice-sign">Ambarawa, &nbsp; ' + escapeHtml(context.date) + '<br><br><br><br>( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; )</div>' +
        printFooterHtml(context) +
      '</main>'
    );
  }

  function printDocumentShell(title, body) {
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + escapeHtml(title) + '</title>' +
      '<base href="' + escapeHtml(window.location.origin + '/') + '">' +
      '<style>' + printDocumentStyles() + '</style></head><body>' + body + '</body></html>';
  }

  function printDocumentStyles() {
    return [
      '@page{size:A4;margin:10mm}',
      'html,body,*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}',
      'body{margin:0;background:#e5e7eb;color:#000;font-family:Arial,sans-serif;font-size:12px}',
      '.receipt-print,.invoice-print{position:relative;width:190mm;min-height:270mm;margin:0 auto;background:#fff;box-shadow:inset 0 0 0 1px #111;padding:12px 14px 30px;overflow:hidden}',
      '.print-header{display:grid;grid-template-columns:90px 1fr;align-items:start;gap:14px;margin-bottom:8px}',
      '.pm-logo{width:76px;height:76px;display:block}',
      '.pm-logo img{display:block;width:76px;height:76px}',
      '.print-company h1{margin:4px 0 2px;font-size:16px}',
      '.print-company p{margin:0 0 2px;font-size:12px;font-weight:700}',
      '.document-title{text-align:center;font-size:22px;font-weight:900;letter-spacing:7px;margin:-2px 0 2px}',
      '.receipt-title{display:flex;justify-content:center;gap:28px;margin:18px 0 16px;font-size:13px}',
      '.print-line,.print-row{display:grid;grid-template-columns:90px 12px 1fr;align-items:center;gap:3px;margin:9px 10px}',
      '.print-line strong{border-bottom:1px solid #111;min-height:18px;font-weight:400}',
      '.print-row-highlight strong{min-height:42px;padding:8px;background:#cfe2f3;border:1px solid #111;text-transform:uppercase;box-shadow:inset 0 0 0 999px #cfe2f3}',
      '.payment-detail{display:grid;grid-template-columns:90px 12px 1fr;gap:3px;margin:10px}',
      '.print-line span:after{content:":";float:right}',
      '.small-line{display:grid;grid-template-columns:110px 12px 1fr;max-width:430px}',
      '.small-line strong{border-bottom:1px solid #111;font-weight:400}',
      '.receipt-bottom{display:grid;grid-template-columns:230px 1fr;gap:80px;margin:18px 10px}',
      '.receipt-amount{width:155px;display:flex;gap:14px;align-items:center;padding:12px 10px;border:1px solid #111;background:#cfe2f3;box-shadow:inset 0 0 0 999px #cfe2f3;font-size:16px}',
      '.receipt-bottom p{margin:12px 0 0;font-size:11px;line-height:1.45}',
      '.sign-box{text-align:center;padding-top:8px}',
      '.sign-box span{display:inline-block;margin:86px 60px 0}',
      '.print-table{width:100%;border-collapse:collapse;margin-bottom:10px}',
      '.print-table td,.print-table th{border:1px solid #111;padding:3px 5px;vertical-align:top}',
      '.print-table.compact td{border-left:0;border-right:0}',
      '.print-table .label{width:150px;font-weight:700}',
      '.print-table .sep{width:12px;text-align:center}',
      '.print-block{margin-top:10px}',
      '.print-block h3{margin:0;padding:4px 5px;border:1px solid #111;border-bottom:0;font-size:13px}',
      '.two-col .label{width:150px}',
      '.price-table{width:100%;border-collapse:collapse;table-layout:fixed}',
      '.price-table td{padding:3px 5px}',
      '.price-table .label{font-weight:700;width:48%}',
      '.price-table .rp{width:28px}',
      '.price-table .value{text-align:right;border-bottom:1px solid #111;padding-right:8px}',
      '.price-table .total .label,.price-table .total .value{font-weight:900}',
      '.price-block{box-shadow:inset 0 0 0 1px #111;padding:4px 6px 7px;overflow:hidden}',
      '.price-block h3{border:0;padding:0 0 4px}',
      '.price-block .price-table .value{padding-right:6px}',
      '.blue-block{background:#cfe2f3;box-shadow:inset 0 0 0 1px #111,inset 0 0 0 999px #cfe2f3;padding:4px 6px 7px;overflow:hidden}',
      '.blue-block h3{border:0;padding:0 0 4px}',
      '.blue-block .price-table .value{padding-right:6px}',
      '.payment-block{margin-top:12px}',
      '.terbilang{display:grid;grid-template-columns:80px 1fr;gap:14px;margin:12px 0 10px;padding:16px 12px;border:1px solid #111;background:#cfe2f3;box-shadow:inset 0 0 0 999px #cfe2f3}',
      '.terbilang strong{text-transform:uppercase;text-decoration:underline;line-height:1.5}',
      '.invoice-note{border-top:1px solid #111;margin:12px 0 0;padding-top:6px;font-size:11px;line-height:1.4}',
      '.invoice-sign{width:260px;text-align:center;margin:16px 36px 0 auto}',
      '.print-footer{position:absolute;left:14px;right:14px;bottom:9px;display:flex;justify-content:space-between;gap:12px;border-top:1px solid #d1d5db;padding-top:4px;font-size:10px;color:#111}',
      '.receipt-print{padding:14px 18px}',
      '.receipt-print .print-header{grid-template-columns:84px 1fr;gap:18px;margin-bottom:14px}',
      '.receipt-print .print-line,.receipt-print .print-row,.receipt-print .payment-detail{grid-template-columns:104px 14px 1fr;margin:10px 0}',
      '.receipt-print .print-row-highlight strong{display:flex;align-items:center;min-height:38px;padding:8px 12px;line-height:1.3}',
      '.receipt-print .print-line strong{padding-left:4px}',
      '.receipt-print .payment-lines{max-width:520px}',
      '.receipt-print .payment-product{margin-bottom:2px;font-weight:400}',
      '.receipt-print .small-line{grid-template-columns:118px 12px 1fr;max-width:520px}',
      '.receipt-print .receipt-bottom{grid-template-columns:210px 1fr;gap:110px;margin:18px 0}',
      '.receipt-print .receipt-amount{width:170px;justify-content:space-between}',
      '@media print{body{background:#fff}.receipt-print,.invoice-print{margin:0;width:100%;min-height:auto}}'
    ].join('');
  }

  function printHeaderHtml(context, documentTitle) {
    return '<header class="print-header">' +
      '<div class="pm-logo"><img src="/app/assets/client/persada-motor-logo.png" alt="DemoMotor Motor"></div>' +
      '<div class="print-company">' +
        '<h1>' + escapeHtml(context.companyName) + '</h1>' +
        '<p>' + escapeHtml(context.companyAddress) + '</p>' +
        '<p>' + escapeHtml(context.companyArea) + '</p>' +
        '<p>' + escapeHtml(context.companyPhone) + '</p>' +
      '</div>' +
    '</header>' +
    (documentTitle ? '<div class="document-title">' + escapeHtml(documentTitle) + '</div>' : '');
  }

  function printFooterHtml(context) {
    return '<footer class="print-footer">' +
      '<span>' + escapeHtml(context.printFooterText) + '</span>' +
      '<span>Halaman 1/1</span>' +
    '</footer>';
  }

  function printLine(label, value) {
    return '<div class="print-line">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<i></i>' +
      '<strong>' + escapeHtml(value || '') + '</strong>' +
    '</div>';
  }

  function printSmallLine(label, value) {
    return '<div class="small-line">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<i>:</i>' +
      '<strong>' + escapeHtml(value || '') + '</strong>' +
    '</div>';
  }

  function printTableRow(leftLabel, leftValue, rightLabel, rightValue) {
    return '<tr>' +
      '<td class="label">' + escapeHtml(leftLabel) + '</td>' +
      '<td class="sep">:</td>' +
      '<td>' + escapeHtml(leftValue || '-') + '</td>' +
      '<td class="label">' + escapeHtml(rightLabel || '') + '</td>' +
      '<td class="sep">' + (rightLabel ? ':' : '') + '</td>' +
      '<td>' + escapeHtml(rightValue || '') + '</td>' +
    '</tr>';
  }

  function printTableBlock(title, rows) {
    return '<section class="print-block">' +
      '<h3>' + escapeHtml(title) + '</h3>' +
      '<table class="print-table"><tbody>' +
        rows.map(function (row) {
          return '<tr>' +
            '<td class="label">' + escapeHtml(row[0]) + '</td>' +
            '<td class="sep">:</td>' +
            '<td>' + escapeHtml(row[1] || '-') + '</td>' +
          '</tr>';
        }).join('') +
      '</tbody></table>' +
    '</section>';
  }

  function printPriceRow(label, value, fallback, strong) {
    const display = fallback || formatAmountRound(value);
    return '<tr' + (strong ? ' class="total"' : '') + '>' +
      '<td class="label">' + escapeHtml(label) + '</td>' +
      '<td class="rp">Rp.</td>' +
      '<td class="value">' + escapeHtml(display || '-') + '</td>' +
    '</tr>';
  }

  function createPdfDocument(title, logoImage) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const commands = [];
    const doc = {
      rect: function (x, y, width, height, fill, stroke, lineWidth) {
        commands.push('q');
        if (fill) commands.push(pdfColor(fill, 'rg'));
        if (stroke) commands.push(pdfColor(stroke, 'RG'));
        commands.push(pdfNumber(lineWidth || 0.7) + ' w');
        commands.push(pdfNumber(x) + ' ' + pdfNumber(pageHeight - y - height) + ' ' + pdfNumber(width) + ' ' + pdfNumber(height) + ' re ' + (fill && stroke ? 'B' : fill ? 'f' : 'S'));
        commands.push('Q');
      },
      line: function (x1, y1, x2, y2, lineWidth, color) {
        commands.push('q');
        commands.push(pdfColor(color || '#111111', 'RG'));
        commands.push(pdfNumber(lineWidth || 0.7) + ' w');
        commands.push(pdfNumber(x1) + ' ' + pdfNumber(pageHeight - y1) + ' m ' + pdfNumber(x2) + ' ' + pdfNumber(pageHeight - y2) + ' l S');
        commands.push('Q');
      },
      text: function (value, x, y, size, weight, options) {
        const opts = options || {};
        commands.push('q');
        commands.push(pdfColor(opts.color || '#111111', 'rg'));
        commands.push('BT /' + (weight === 'bold' ? 'F2' : 'F1') + ' ' + pdfNumber(size || 10) + ' Tf ' + pdfNumber(x) + ' ' + pdfNumber(pageHeight - y) + ' Td (' + pdfEscape(value) + ') Tj ET');
        commands.push('Q');
      },
      textRight: function (value, right, y, size, weight) {
        const display = pdfSafeText(value);
        const width = display.length * (size || 10) * 0.5;
        doc.text(display, right - width, y, size, weight);
      },
      textCenter: function (value, center, y, size, weight) {
        const display = pdfSafeText(value);
        const width = display.length * (size || 10) * 0.5;
        doc.text(display, center - (width / 2), y, size, weight);
      },
      logo: function (x, y) {
        if (logoImage) {
          commands.push('q');
          commands.push('62 0 0 62 ' + pdfNumber(x) + ' ' + pdfNumber(pageHeight - y - 62) + ' cm /Im1 Do');
          commands.push('Q');
          return;
        }
        pdfCircle(commands, pageHeight, x + 31, y + 31, 31, '#2f3293');
        doc.text('PM', x + 10, y + 39, 24, 'bold', { color: '#ffffff' });
      },
      output: function () {
        return pdfDocumentBytes(title, pageWidth, pageHeight, commands.join('\n'), logoImage);
      }
    };
    return doc;
  }

  function pdfHeader(doc, context, documentTitle) {
    doc.logo(52, 46);
    doc.text(context.companyName, 120, 55, 14, 'bold');
    doc.text(context.companyAddress, 120, 72, 9, 'bold');
    doc.text(context.companyArea, 120, 86, 9, 'bold');
    doc.text(context.companyPhone, 120, 100, 9, 'bold');
    if (documentTitle) {
      doc.textCenter(documentTitle, 298, 126, 18, 'bold');
    }
  }

  function pdfFooter(doc, context) {
    doc.line(42, 792, 553, 792, 0.5, '#d1d5db');
    doc.text(context.printFooterText, 44, 804, 7);
    doc.textRight('Halaman 1/1', 553, 804, 7);
  }

  function pdfLineField(doc, label, value, y, valueWidth) {
    doc.text(label, 48, y, 10);
    doc.text(':', 124, y, 10);
    doc.text(pdfClip(value, 86), 140, y, 10);
    doc.line(138, y + 4, 138 + (valueWidth || 420), y + 4, 0.7);
  }

  function pdfSmallLine(doc, label, value, y, x, width) {
    doc.text(label, x, y, 9);
    doc.text(':', x + 102, y, 9);
    doc.text(pdfClip(value, 54), x + 116, y, 9);
    doc.line(x + 114, y + 4, x + width, y + 4, 0.6);
  }

  function pdfTextPair(doc, leftLabel, leftValue, x, y, rightLabel, rightValue, rightX) {
    doc.text(leftLabel, x, y, 8, 'bold');
    doc.text(':', x + 78, y, 8);
    doc.text(pdfClip(leftValue, 28), x + 92, y, 8);
    if (rightLabel) {
      doc.text(rightLabel, rightX, y, 8, 'bold');
      doc.text(':', rightX + 78, y, 8);
      doc.text(pdfClip(rightValue, 30), rightX + 92, y, 8);
    }
  }

  function pdfTableBlock(doc, title, rows, y) {
    const x = 42;
    const width = 511;
    const rowHeight = 14;
    const headerHeight = 15;
    const height = headerHeight + rows.length * rowHeight;
    doc.rect(x, y, width, height, '#ffffff', '#111111', 1);
    doc.text(title, x + 6, y + 11, 8, 'bold');
    doc.line(x, y + headerHeight, x + width, y + headerHeight, 0.7);
    rows.forEach(function (row, index) {
      const rowY = y + headerHeight + index * rowHeight;
      doc.line(x, rowY + rowHeight, x + width, rowY + rowHeight, 0.5, '#111111');
      doc.text(row[0], x + 6, rowY + 10, 7, 'bold');
      doc.text(':', x + 112, rowY + 10, 7);
      doc.text(pdfClip(row[1], 82), x + 126, rowY + 10, 7);
    });
    return y + height + 7;
  }

  function pdfTwoColumnBlock(doc, title, rows, y) {
    const x = 42;
    const width = 511;
    const rowHeight = 15;
    const headerHeight = 15;
    const height = headerHeight + rows.length * rowHeight;
    doc.rect(x, y, width, height, '#ffffff', '#111111', 1);
    doc.text(title, x + 6, y + 11, 8, 'bold');
    doc.line(x, y + headerHeight, x + width, y + headerHeight, 0.7);
    rows.forEach(function (row, index) {
      const rowY = y + headerHeight + index * rowHeight;
      doc.line(x, rowY + rowHeight, x + width, rowY + rowHeight, 0.5);
      doc.line(x + 250, rowY, x + 250, rowY + rowHeight, 0.5);
      doc.text(row[0], x + 6, rowY + 10, 7, 'bold');
      doc.text(':', x + 105, rowY + 10, 7);
      doc.text(pdfClip(row[1], 30), x + 118, rowY + 10, 7);
      doc.text(row[2], x + 260, rowY + 10, 7, 'bold');
      doc.text(':', x + 350, rowY + 10, 7);
      doc.text(pdfClip(row[3], 28), x + 363, rowY + 10, 7);
    });
    return y + height + 7;
  }

  function pdfPriceBlock(doc, title, rows, y, blue) {
    const x = 42;
    const width = 511;
    const rowHeight = 14;
    const titleHeight = title ? 14 : 5;
    const height = titleHeight + rows.length * rowHeight + 6;
    doc.rect(x, y, width, height, blue ? '#cfe2f3' : '#ffffff', '#111111', 1);
    if (title) doc.text(title, x + 6, y + 10, 8, 'bold');
    rows.forEach(function (row, index) {
      const rowY = y + titleHeight + index * rowHeight + 9;
      doc.text(row[0], x + 8, rowY, 7, row[2] ? 'bold' : '');
      doc.text('Rp.', x + 272, rowY, 7);
      doc.line(x + 300, rowY + 3, x + 500, rowY + 3, 0.7);
      doc.textRight(formatAmountRound(row[1]), x + 500, rowY, 7, row[2] ? 'bold' : '');
    });
    return y + height + 7;
  }

  function pdfCircle(commands, pageHeight, cx, cyTop, radius, fill) {
    const k = 0.5522847498;
    const cy = pageHeight - cyTop;
    const c = radius * k;
    commands.push('q');
    commands.push(pdfColor(fill, 'rg'));
    commands.push(pdfNumber(cx + radius) + ' ' + pdfNumber(cy) + ' m');
    commands.push(pdfNumber(cx + radius) + ' ' + pdfNumber(cy + c) + ' ' + pdfNumber(cx + c) + ' ' + pdfNumber(cy + radius) + ' ' + pdfNumber(cx) + ' ' + pdfNumber(cy + radius) + ' c');
    commands.push(pdfNumber(cx - c) + ' ' + pdfNumber(cy + radius) + ' ' + pdfNumber(cx - radius) + ' ' + pdfNumber(cy + c) + ' ' + pdfNumber(cx - radius) + ' ' + pdfNumber(cy) + ' c');
    commands.push(pdfNumber(cx - radius) + ' ' + pdfNumber(cy - c) + ' ' + pdfNumber(cx - c) + ' ' + pdfNumber(cy - radius) + ' ' + pdfNumber(cx) + ' ' + pdfNumber(cy - radius) + ' c');
    commands.push(pdfNumber(cx + c) + ' ' + pdfNumber(cy - radius) + ' ' + pdfNumber(cx + radius) + ' ' + pdfNumber(cy - c) + ' ' + pdfNumber(cx + radius) + ' ' + pdfNumber(cy) + ' c f');
    commands.push('Q');
  }

  function pdfDocumentBytes(title, pageWidth, pageHeight, content, logoImage) {
    const imageResource = logoImage ? ' /XObject << /Im1 7 0 R >>' : '';
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pdfNumber(pageWidth) + ' ' + pdfNumber(pageHeight) + '] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>' + imageResource + ' >> /Contents 6 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
      '<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream'
    ];
    if (logoImage) {
      const imageStream = logoImage.hex + '>';
      objects.push(
        '<< /Type /XObject /Subtype /Image /Width ' + Number(logoImage.width || 1) +
        ' /Height ' + Number(logoImage.height || 1) +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter [/ASCIIHexDecode /DCTDecode] /Length ' + imageStream.length +
        ' >>\nstream\n' + imageStream + '\nendstream'
      );
    }
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach(function (object, index) {
      offsets.push(pdf.length);
      pdf += (index + 1) + ' 0 obj\n' + object + '\nendobj\n';
    });
    const xref = pdf.length;
    pdf += 'xref\n0 ' + (objects.length + 1) + '\n';
    pdf += '0000000000 65535 f \n';
    offsets.slice(1).forEach(function (offset) {
      pdf += String(offset).padStart(10, '0') + ' 00000 n \n';
    });
    pdf += 'trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\n';
    pdf += 'startxref\n' + xref + '\n%%EOF';
    return pdf;
  }

  function pdfColor(hex, operator) {
    const cleaned = text(hex, '#111111').replace('#', '');
    const r = parseInt(cleaned.slice(0, 2), 16) / 255;
    const g = parseInt(cleaned.slice(2, 4), 16) / 255;
    const b = parseInt(cleaned.slice(4, 6), 16) / 255;
    return pdfNumber(r) + ' ' + pdfNumber(g) + ' ' + pdfNumber(b) + ' ' + operator;
  }

  function pdfNumber(value) {
    return Number(value || 0).toFixed(3).replace(/\.?0+$/, '');
  }

  function pdfClip(value, maxLength) {
    const display = pdfSafeText(value);
    return display.length > maxLength ? display.slice(0, Math.max(0, maxLength - 2)) + '..' : display;
  }

  function pdfSafeText(value) {
    return text(value, '')
      .normalize('NFKD')
      .replace(/[^\x20-\x7E]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function pdfEscape(value) {
    return pdfSafeText(value).replace(/[\\()]/g, function (char) {
      return '\\' + char;
    });
  }

  function base64ToHex(base64) {
    const binary = atob(base64);
    let hex = '';
    for (let index = 0; index < binary.length; index += 1) {
      hex += binary.charCodeAt(index).toString(16).padStart(2, '0');
    }
    return hex;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }

  function dateFromInput(value) {
    const source = text(value);
    const match = source.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const parsed = new Date(source);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  function formatPrintDate(value) {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(dateFromInput(value));
  }

  function formatPrintDateTime(value) {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(value);
  }

  function slugifyPrintFooter(value) {
    return text(value, 'client-portal')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'client-portal';
  }

  function safeFileName(value) {
    return text(value, 'dokumen-client-portal')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'dokumen-client-portal';
  }

  function yearFromDate(value) {
    return String(dateFromInput(value).getFullYear());
  }

  function terbilangRupiah(value) {
    const amount = roundInteger(value);
    if (!amount) return 'NOL RUPIAH';
    return (numberToWords(amount) + ' rupiah').toUpperCase();
  }

  function numberToWords(value) {
    const number = Math.floor(Math.abs(Number(value || 0)));
    const words = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    if (number < 12) return words[number];
    if (number < 20) return numberToWords(number - 10) + ' belas';
    if (number < 100) return numberToWords(Math.floor(number / 10)) + ' puluh' + wordRemainder(number % 10);
    if (number < 200) return 'seratus' + wordRemainder(number - 100);
    if (number < 1000) return numberToWords(Math.floor(number / 100)) + ' ratus' + wordRemainder(number % 100);
    if (number < 2000) return 'seribu' + wordRemainder(number - 1000);
    if (number < 1000000) return numberToWords(Math.floor(number / 1000)) + ' ribu' + wordRemainder(number % 1000);
    if (number < 1000000000) return numberToWords(Math.floor(number / 1000000)) + ' juta' + wordRemainder(number % 1000000);
    if (number < 1000000000000) return numberToWords(Math.floor(number / 1000000000)) + ' milyar' + wordRemainder(number % 1000000000);
    return String(number);
  }

  function wordRemainder(value) {
    return value ? ' ' + numberToWords(value) : '';
  }

  function detailSummaryCards(items, status) {
    const wrap = document.createElement('div');
    wrap.className = 'sales-detail-summary';
    items.forEach(function (item) {
      const card = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = item[0];
      const value = document.createElement('strong');
      if (item[0] === 'Status') {
        const badge = document.createElement('span');
        badge.className = 'sales-status-badge ' + status.className;
        badge.textContent = item[1];
        value.appendChild(badge);
      } else {
        value.textContent = text(item[1], '-');
      }
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
      const isBlank = !text(row[0]) && !text(row[1]);
      if (isBlank) item.className = 'blank';
      const label = document.createElement('span');
      label.textContent = row[0];
      const value = document.createElement('strong');
      value.textContent = isBlank ? '' : text(row[1], '-');
      item.appendChild(label);
      item.appendChild(value);
      grid.appendChild(item);
    });
    section.appendChild(heading);
    section.appendChild(grid);
    return section;
  }

  function detailItemsSection(title, items, totalAmount) {
    const section = document.createElement('section');
    section.className = 'sales-detail-section sales-detail-items-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const table = document.createElement('div');
    table.className = 'sales-detail-items-table';

    const head = document.createElement('div');
    head.className = 'sales-detail-items-head';
    ['No', 'Nama Barang', 'Qty', 'Harga Satuan', 'Jumlah'].forEach(function (label) {
      const cell = document.createElement('span');
      cell.textContent = label;
      head.appendChild(cell);
    });
    table.appendChild(head);

    (Array.isArray(items) ? items : []).forEach(function (item, index) {
      const row = document.createElement('div');
      row.className = 'sales-detail-items-row';
      const qty = Number(item.jumlah || item.quantity || 0);
      const price = Number(item.hargaSatuan || item.hargaPricelist || 0);
      const total = Number(item.total || item.totalTagihan || item.hargaSetelahDisc || 0);
      [
        String(index + 1),
        text(item.namaBarang || item.tipeMotor, 'Barang'),
        formatAmount(qty),
        formatAmount(price),
        formatAmount(total)
      ].forEach(function (value, cellIndex) {
        const cell = document.createElement(cellIndex === 1 ? 'strong' : 'span');
        cell.textContent = value;
        row.appendChild(cell);
      });
      table.appendChild(row);
    });

    const footer = document.createElement('div');
    footer.className = 'sales-detail-items-total';
    const label = document.createElement('span');
    label.textContent = 'Total Rupiah';
    const value = document.createElement('strong');
    value.textContent = formatAmount(totalAmount);
    footer.appendChild(label);
    footer.appendChild(value);
    table.appendChild(footer);

    section.appendChild(heading);
    section.appendChild(table);
    return section;
  }

  function detailEmptySection(title, message) {
    const section = document.createElement('section');
    section.className = 'sales-detail-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = message;
    section.appendChild(heading);
    section.appendChild(empty);
    return section;
  }

  function renderDpSearchRows() {
    clearNode(elements.dpSearchRows);
    const keyword = text(elements.dpSearch.value).toLowerCase();
    const entries = state.entries.filter(function (entry) {
      if (!keyword) return true;
      return [
        entry.receiptNo,
        entry.namaCustomer,
        entry.noRangka,
        entry.nikNpwp
      ].join(' ').toLowerCase().includes(keyword);
    });

    if (!entries.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Data DP tidak ditemukan.';
      elements.dpSearchRows.appendChild(empty);
      return;
    }

    entries.forEach(function (entry) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'sales-search-row';
      row.innerHTML = '<strong></strong><span></span>';
      row.querySelector('strong').textContent = text(entry.receiptNo, '-');
      row.querySelector('span').textContent = [entry.namaCustomer, entry.noRangka, formatAmount(entry.jumlahDp)].filter(Boolean).join(' | ');
      row.addEventListener('click', function () {
        setAlert('DP dipilih: ' + text(entry.receiptNo), 'info');
        closeSearchDpModal();
      });
      elements.dpSearchRows.appendChild(row);
    });
  }

  function formatAmount(value) {
    const number = Number(value || 0);
    return number ? currency.format(number) : '';
  }

  function formatAmountZero(value) {
    const number = Number(value || 0);
    return currency.format(Number.isFinite(number) ? number : 0);
  }

  function roundInteger(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? Math.round(number) : 0;
  }

  function formatAmountRound(value) {
    const number = roundInteger(value);
    return number ? currency.format(number) : '';
  }

  function exportNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = text(value);
    if (!raw) return 0;
    const normalized = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(',', '.').replace(/[^0-9.-]/g, '');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function fitWorksheetColumns(worksheet, rows) {
    if (!worksheet || !rows.length) return;
    const headers = Object.keys(rows[0]);
    worksheet['!cols'] = headers.map(function (header) {
      const maxContent = rows.reduce(function (width, row) {
        return Math.max(width, String(row[header] == null ? '' : row[header]).length);
      }, header.length);
      return { wch: Math.min(42, Math.max(12, maxContent + 2)) };
    });
  }

  function salesDpExportRow(entry) {
    const summary = salesDisplaySummary(entry);
    const settlement = summary.settlement || {};
    const faktur = fakturForEntry(entry) || {};
    return {
      'Jenis': settlement.noInvoice ? 'DP + Pelunasan' : 'DP',
      'Entitas': text(entry.businessEntityName || entry.businessEntityKey),
      'No Kwitansi': text(entry.receiptNo),
      'No Invoice': text(settlement.noInvoice),
      'No Faktur': text(faktur.noFaktur),
      'Tanggal Kwitansi': text(entry.tanggal),
      'Tanggal Invoice': text(settlement.tanggalInvoice),
      'Tanggal Faktur': text(faktur.tanggalFaktur),
      'Tanggal Pelunasan': text(settlement.tanggalPelunasan || settlement.tanggalInvoice),
      'Nama Customer': text(entry.namaCustomer),
      'NIK/NPWP': text(entry.nikNpwp),
      'Alamat': text(entry.alamat),
      'Nama Barang': text(entry.namaBarang || entry.tipeMotor),
      'No Rangka': text(entry.noRangka),
      'No Mesin': text(entry.noMesin),
      'Warna': text(entry.warna),
      'Qty': exportNumber(summary.quantity || entry.jumlah || 1),
      'Harga Satuan': exportNumber(summary.hargaPricelist),
      'Disc': exportNumber(summary.totalDiscount),
      'Jumlah Barang': exportNumber(summary.hargaSetelahDisc),
      'Jumlah DP': exportNumber(entry.jumlahDp),
      'BBN Notice': exportNumber(summary.bbnNotice),
      'Nilai Penyerahan Pajak': exportNumber(summary.nilaiPenyerahanPajak),
      'DPP': exportNumber(summary.dpp),
      'PPN': exportNumber(summary.ppn),
      'DPP + PPN': exportNumber(summary.dppPpn),
      'BBN Unnotice': exportNumber(summary.bbnUnnotice),
      'Total Tagihan': exportNumber(summary.totalTagihan),
      'Nilai Pelunasan': exportNumber(settlement.dppPpnPelunasan) + exportNumber(settlement.bbnNotice),
      'Sisa Piutang': exportNumber(summary.sisaPiutang),
      'Catatan': text(entry.catatan)
    };
  }

  function salesCompleteExportRows(entry) {
    const summary = completeDisplaySummary(entry);
    const settlement = summary.settlement || {};
    return completeItems(entry).map(function (item, index) {
      const total = exportNumber(item.total || item.totalTagihan || item.hargaSetelahDisc);
      return {
        'Jenis': settlement.noInvoice ? 'Lengkap + Pelunasan' : 'Lengkap',
        'Entitas': text(item.businessEntityName || entry.businessEntityName || item.businessEntityKey || entry.businessEntityKey),
        'No Kwitansi': text(entry.receiptNo || item.receiptNo),
        'No Invoice': text(entry.noInvoice || item.noInvoice || settlement.noInvoice),
        'No Faktur': text(item.noFaktur || entry.noFaktur),
        'Tanggal Kwitansi': text(entry.tanggal || item.tanggal),
        'Tanggal Invoice': text(entry.tanggalInvoice || item.tanggalInvoice),
        'Tanggal Faktur': text(item.tanggalFaktur || entry.tanggalFaktur),
        'Tanggal Pelunasan': index === 0 ? text(settlement.tanggalPelunasan || settlement.tanggalInvoice) : '',
        'Nama Customer': text(entry.namaCustomer || item.namaCustomer),
        'NIK/NPWP': text(entry.nikNpwp || item.nikNpwp),
        'Alamat': text(entry.alamat || item.alamat),
        'Nama Barang': text(item.namaBarang || item.tipeMotor || entry.namaBarang || entry.tipeMotor),
        'No Rangka': text(item.noRangka || entry.noRangka),
        'No Mesin': text(item.noMesin || entry.noMesin),
        'Warna': text(item.warna || entry.warna),
        'Qty': exportNumber(item.jumlah || item.quantity || 1),
        'Harga Satuan': exportNumber(item.hargaSatuan || item.hargaPricelist),
        'Disc': exportNumber(item.disc),
        'Jumlah Barang': total,
        'Jumlah DP': 0,
        'BBN Notice': exportNumber(item.bbnNotice),
        'Nilai Penyerahan Pajak': exportNumber(item.nilaiPenyerahanPajak || total),
        'DPP': exportNumber(item.dpp || total),
        'PPN': exportNumber(item.ppn),
        'DPP + PPN': exportNumber(item.dppPpn || total),
        'BBN Unnotice': exportNumber(item.bbnUnnotice),
        'Total Tagihan': total,
        'Nilai Pelunasan': index === 0 ? exportNumber(settlement.dppPpnPelunasan) + exportNumber(settlement.bbnNotice) : 0,
        'Sisa Piutang': index === 0 ? exportNumber(summary.sisaPiutang) : 0,
        'Catatan': text(item.catatan || item.keterangan || entry.catatan || entry.keterangan)
      };
    });
  }

  function salesExportRows() {
    return filteredSalesEntries().map(salesDpExportRow).concat(
      filteredCompleteEntries().flatMap(salesCompleteExportRows)
    );
  }

  function exportSalesWorkbook() {
    if (!isDemoMotorClient()) {
      setAlert('Ekspor data hanya tersedia untuk Buku Penjualan DemoMotor.', 'error');
      return;
    }
    if (!window.XLSX) {
      setAlert('Library pembuat Excel belum termuat. Refresh halaman lalu coba lagi.', 'error');
      return;
    }
    const rows = salesExportRows();
    if (!rows.length) {
      setAlert('Tidak ada data Buku Penjualan untuk diekspor.', 'error');
      return;
    }
    try {
      const workbook = window.XLSX.utils.book_new();
      const sheet = window.XLSX.utils.json_to_sheet(rows);
      fitWorksheetColumns(sheet, rows);
      window.XLSX.utils.book_append_sheet(workbook, sheet, 'buku_penjualan');
      window.XLSX.writeFile(workbook, safeFileName('buku-penjualan-persada-' + text(state.client?.name, 'client') + '-' + today()) + '.xlsx');
      setAlert(rows.length + ' baris Buku Penjualan berhasil diekspor.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal mengekspor Buku Penjualan.', 'error');
    }
  }

  function applySalesSearch(value) {
    state.searchTerm = text(value);
    if (elements.searchInput && elements.searchInput.value !== state.searchTerm) {
      elements.searchInput.value = state.searchTerm;
    }
    state.selectedIds.clear();
    renderRows();
  }

  function handleSalesSearchEvent() {
    applySalesSearch(elements.searchInput ? elements.searchInput.value : '');
  }

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', function () { loadSales(); });
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.addButton) elements.addButton.addEventListener('click', openTypeModal);
  if (elements.exportButton) elements.exportButton.addEventListener('click', exportSalesWorkbook);
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', handleSalesSearchEvent);
    elements.searchInput.addEventListener('change', handleSalesSearchEvent);
    elements.searchInput.addEventListener('search', handleSalesSearchEvent);
    elements.searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSalesSearchEvent();
      }
    });
  }
  if (elements.searchButton) elements.searchButton.addEventListener('click', handleSalesSearchEvent);
  if (elements.selectAll) {
    elements.selectAll.addEventListener('change', function () {
      filteredSalesEntries().forEach(function (entry) {
        if (elements.selectAll.checked) {
          state.selectedIds.add(entry.id);
        } else {
          state.selectedIds.delete(entry.id);
        }
      });
      renderRows();
    });
  }
  if (elements.deleteSelectedButton) elements.deleteSelectedButton.addEventListener('click', deleteSelectedEntries);
  if (elements.typeCloseButton) elements.typeCloseButton.addEventListener('click', closeTypeModal);
  if (elements.dpCloseButton) elements.dpCloseButton.addEventListener('click', closeDpModal);
  if (elements.dpCancelButton) elements.dpCancelButton.addEventListener('click', closeDpModal);
  if (elements.searchDpCloseButton) elements.searchDpCloseButton.addEventListener('click', closeSearchDpModal);
  if (elements.detailCloseButton) elements.detailCloseButton.addEventListener('click', closeSalesDetail);
  if (elements.detailDoneButton) elements.detailDoneButton.addEventListener('click', closeSalesDetail);
  if (elements.fileCloseButton) elements.fileCloseButton.addEventListener('click', closeFileModal);
  if (elements.pelunasanCloseButton) elements.pelunasanCloseButton.addEventListener('click', closePelunasanModal);
  if (elements.pelunasanCancelButton) elements.pelunasanCancelButton.addEventListener('click', closePelunasanModal);
  if (elements.fakturCloseButton) elements.fakturCloseButton.addEventListener('click', closeFakturModal);
  if (elements.fakturCancelButton) elements.fakturCancelButton.addEventListener('click', closeFakturModal);
  if (elements.lengkapCloseButton) elements.lengkapCloseButton.addEventListener('click', closeLengkapModal);
  if (elements.lengkapCancelButton) elements.lengkapCancelButton.addEventListener('click', closeLengkapModal);
  if (elements.dpForm) elements.dpForm.addEventListener('submit', submitDp);
  if (elements.pelunasanForm) elements.pelunasanForm.addEventListener('submit', submitPelunasan);
  if (elements.fakturForm) elements.fakturForm.addEventListener('submit', submitFaktur);
  if (elements.lengkapForm) elements.lengkapForm.addEventListener('submit', submitLengkap);
  if (elements.importButton) {
    elements.importButton.addEventListener('click', function () {
      if (elements.importFile) elements.importFile.click();
    });
  }
  if (elements.importFile) {
    elements.importFile.addEventListener('change', function () {
      const file = elements.importFile.files && elements.importFile.files[0];
      importSalesWorkbook(file);
    });
  }
  if (elements.dpAttachmentFile) elements.dpAttachmentFile.addEventListener('change', function () {
    setUploadFileNote(elements.dpAttachmentNote, elements.dpAttachmentFile, 'File dipilih');
  });
  if (elements.dpAttachmentFile) elements.dpAttachmentFile.addEventListener('client-portal-upload-files', function () {
    setUploadFileNote(elements.dpAttachmentNote, elements.dpAttachmentFile, 'File dari HP');
  });
  if (elements.pelunasanAttachmentFile) elements.pelunasanAttachmentFile.addEventListener('change', function () {
    setUploadFileNote(elements.pelunasanAttachmentNote, elements.pelunasanAttachmentFile, 'File dipilih');
  });
  if (elements.pelunasanAttachmentFile) elements.pelunasanAttachmentFile.addEventListener('client-portal-upload-files', function () {
    setUploadFileNote(elements.pelunasanAttachmentNote, elements.pelunasanAttachmentFile, 'File dari HP');
  });
  if (elements.fakturAttachmentFile) elements.fakturAttachmentFile.addEventListener('change', function () {
    setUploadFileNote(elements.fakturAttachmentNote, elements.fakturAttachmentFile, 'File dipilih');
  });
  if (elements.fakturAttachmentFile) elements.fakturAttachmentFile.addEventListener('client-portal-upload-files', function () {
    setUploadFileNote(elements.fakturAttachmentNote, elements.fakturAttachmentFile, 'File dari HP');
  });
  if (elements.lengkapAttachmentFile) elements.lengkapAttachmentFile.addEventListener('change', function () {
    setUploadFileNote(elements.lengkapAttachmentNote, elements.lengkapAttachmentFile, 'File dipilih');
  });
  if (elements.lengkapAttachmentFile) elements.lengkapAttachmentFile.addEventListener('client-portal-upload-files', function () {
    setUploadFileNote(elements.lengkapAttachmentNote, elements.lengkapAttachmentFile, 'File dari HP');
  });
  if (elements.dpSearch) elements.dpSearch.addEventListener('input', renderDpSearchRows);
  if (elements.pelunasanDpSelect) {
    elements.pelunasanDpSelect.addEventListener('input', populatePelunasanFromDp);
    elements.pelunasanDpSelect.addEventListener('change', normalizePelunasanDpInput);
    elements.pelunasanDpSelect.addEventListener('blur', normalizePelunasanDpInput);
    elements.pelunasanDpSelect.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      normalizePelunasanDpInput();
      if (elements.pelunasanTanggalInvoice) elements.pelunasanTanggalInvoice.focus();
    });
  }
  function isDetailActionClick(event) {
    return Boolean(elements.detailModal && elements.detailModal.contains(event.target));
  }

  function closeDetailBeforeAction(event) {
    if (isDetailActionClick(event)) closeSalesDetail();
  }

  function handleSalesActionClick(event) {
    const printButton = event.target.closest('[data-sales-print]');
    if (printButton && !printButton.disabled) {
      printSalesDocument(printButton.getAttribute('data-sales-id'), printButton.getAttribute('data-sales-print'));
      return true;
    }
    const completePrintButton = event.target.closest('[data-sales-complete-print]');
    if (completePrintButton && !completePrintButton.disabled) {
      printCompleteSalesDocument(completePrintButton.getAttribute('data-sales-complete-id'), completePrintButton.getAttribute('data-sales-complete-print'));
      return true;
    }
    const settlementButton = event.target.closest('[data-sales-settlement]');
    if (settlementButton && !settlementButton.disabled) {
      const entryId = settlementButton.getAttribute('data-sales-settlement');
      closeDetailBeforeAction(event);
      openPelunasanModal(entryId);
      return true;
    }
    const editButton = event.target.closest('[data-sales-edit]');
    if (editButton && !editButton.disabled) {
      closeDetailBeforeAction(event);
      openEditDpModal(editButton.getAttribute('data-sales-edit'));
      return true;
    }
    const deleteButton = event.target.closest('[data-sales-delete]');
    if (deleteButton && !deleteButton.disabled) {
      closeDetailBeforeAction(event);
      deleteDpEntry(deleteButton.getAttribute('data-sales-delete'));
      return true;
    }
    const completeSettlementButton = event.target.closest('[data-sales-complete-settlement]');
    if (completeSettlementButton && !completeSettlementButton.disabled) {
      closeDetailBeforeAction(event);
      openCompletePelunasanModal(completeSettlementButton.getAttribute('data-sales-complete-settlement'));
      return true;
    }
    const completeEditButton = event.target.closest('[data-sales-complete-edit]');
    if (completeEditButton && !completeEditButton.disabled) {
      closeDetailBeforeAction(event);
      openLengkapModal(completeEditButton.getAttribute('data-sales-complete-edit'));
      return true;
    }
    const completeDeleteButton = event.target.closest('[data-sales-complete-delete]');
    if (completeDeleteButton && !completeDeleteButton.disabled) {
      closeDetailBeforeAction(event);
      deleteLengkapEntry(completeDeleteButton.getAttribute('data-sales-complete-delete'));
      return true;
    }
    const fakturButton = event.target.closest('[data-sales-faktur]');
    if (fakturButton && !fakturButton.disabled) {
      closeDetailBeforeAction(event);
      openFakturModal(fakturButton.getAttribute('data-sales-faktur'));
      return true;
    }
    const fileButton = event.target.closest('[data-sales-files]');
    if (fileButton && !fileButton.disabled) {
      closeDetailBeforeAction(event);
      openSalesFiles(fileButton.getAttribute('data-sales-files'));
      return true;
    }
    const completeFileButton = event.target.closest('[data-sales-complete-file]');
    if (completeFileButton && !completeFileButton.disabled) {
      closeDetailBeforeAction(event);
      openCompleteFile(completeFileButton.getAttribute('data-sales-complete-file'));
      return true;
    }
    return false;
  }

  function openDetailFromRow(row) {
    if (!row) return false;
    const salesId = row.getAttribute('data-sales-row-view');
    if (salesId) {
      openSalesDetail(salesId);
      return true;
    }
    const completeId = row.getAttribute('data-sales-complete-row-view');
    if (completeId) {
      openCompleteDetail(completeId);
      return true;
    }
    return false;
  }

  if (elements.rows) {
    elements.rows.addEventListener('change', function (event) {
      const checkbox = event.target.closest('[data-sales-select]');
      if (!checkbox) return;
      const entryId = checkbox.getAttribute('data-sales-select');
      if (checkbox.checked) {
        state.selectedIds.add(entryId);
      } else {
        state.selectedIds.delete(entryId);
      }
      syncSelectionControls(filteredSalesEntries());
    });
    elements.rows.addEventListener('click', function (event) {
      if (event.target.closest('[data-sales-select]')) return;
      if (handleSalesActionClick(event)) return;
      openDetailFromRow(event.target.closest('[data-sales-row-view], [data-sales-complete-row-view]'));
    });
    elements.rows.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target.closest('[data-sales-select]')) return;
      const row = event.target.closest('[data-sales-row-view], [data-sales-complete-row-view]');
      if (!row) return;
      event.preventDefault();
      openDetailFromRow(row);
    });
  }

  if (elements.detailActions) {
    elements.detailActions.addEventListener('click', handleSalesActionClick);
  }

  Array.from(document.querySelectorAll('[data-sales-type]')).forEach(function (button) {
    button.addEventListener('click', function () {
      const type = button.getAttribute('data-sales-type');
      if (type === 'dp') return openDpModal();
      if (type === 'pelunasan') return openPelunasanModal();
      if (type === 'lengkap') return openLengkapModal();
    });
  });

  [
    elements.hargaPricelist,
    elements.disc,
    elements.dpCustomer,
    elements.dpTambahan,
    elements.bbnNotice,
    elements.bbnUnnotice
  ].forEach(function (input) {
    if (input) input.addEventListener('input', function () {
      formatRupiahField(input);
      calculateDp();
    });
  });

  [
    elements.lengkapHargaPricelist,
    elements.lengkapDisc,
    elements.lengkapBbnNotice
  ].forEach(function (input) {
    if (input) input.addEventListener('input', function () {
      formatRupiahField(input);
      calculateLengkapDemoMotor();
    });
  });

  [
    elements.pelunasanDiscTambahan,
    elements.pelunasanBbnNotice
  ].forEach(function (input) {
    if (input) input.addEventListener('input', function () {
      formatRupiahField(input);
      calculatePelunasan();
    });
  });

  if (elements.pelunasanSimpleAmount) {
    elements.pelunasanSimpleAmount.addEventListener('input', function () {
      formatRupiahField(elements.pelunasanSimpleAmount);
      calculatePelunasan();
    });
    elements.pelunasanSimpleAmount.addEventListener('blur', function () {
      elements.pelunasanSimpleAmount.value = formatInputAmount(parseAmountInput(elements.pelunasanSimpleAmount));
      calculatePelunasan();
    });
  }

  if (elements.pelunasanSimpleDate) {
    elements.pelunasanSimpleDate.addEventListener('change', function () {
      setInput(elements.pelunasanTanggalInvoice, elements.pelunasanSimpleDate.value);
    });
  }

  if (elements.pelunasanSimpleSource) {
    elements.pelunasanSimpleSource.addEventListener('change', function () {
      if (elements.pelunasanSource) elements.pelunasanSource.value = elements.pelunasanSimpleSource.value;
    });
  }

  if (elements.pelunasanAddPaymentButton) {
    elements.pelunasanAddPaymentButton.addEventListener('click', function () {
      const row = addPelunasanPaymentRow(elements.pelunasanPayments, {
        amount: 0,
        source: elements.pelunasanSource?.value || 'kas:kas-besar'
      });
      row?.querySelector('.sales-payment-source-amount')?.focus();
    });
  }

  if (elements.pelunasanSimpleAddPaymentButton) {
    elements.pelunasanSimpleAddPaymentButton.addEventListener('click', function () {
      const row = addPelunasanPaymentRow(elements.pelunasanSimplePayments, {
        amount: 0,
        source: elements.pelunasanSimpleSource?.value || elements.pelunasanSource?.value || 'kas:kas-besar'
      });
      row?.querySelector('.sales-payment-source-amount')?.focus();
    });
  }

  if (elements.lengkapAddItemButton) {
    elements.lengkapAddItemButton.addEventListener('click', function () {
      const row = addLengkapItemRow({});
      const nameInput = lengkapItemField(row, 'namaBarang');
      if (nameInput) nameInput.focus();
    });
  }

  if (elements.lengkapEntityGateSelect) {
    elements.lengkapEntityGateSelect.addEventListener('change', function () {
      state.lengkapStep = elements.lengkapEntityGateSelect.value ? 'details' : 'entity';
      syncSalesLengkapFormSteps();
      refreshLengkapDocumentPreview();
    });
  }

  Array.from(document.querySelectorAll('[data-rupiah="true"]')).forEach(function (input) {
    ['focus', 'blur', 'change'].forEach(function (eventName) {
      input.addEventListener(eventName, function () {
        formatRupiahField(input);
      });
    });
  });

  if (elements.tanggal) {
    elements.tanggal.addEventListener('change', function () {
      if (elements.tanggal.value) loadSales(elements.tanggal.value);
    });
  }

  if (elements.noRangka) {
    elements.noRangka.addEventListener('change', fillVehicleFromInventory);
    elements.noRangka.addEventListener('blur', fillVehicleFromInventory);
  }

  if (elements.inventoryVehicleSelect) {
    elements.inventoryVehicleSelect.addEventListener('input', fillVehicleFromInventory);
    elements.inventoryVehicleSelect.addEventListener('change', fillVehicleFromInventory);
    elements.inventoryVehicleSelect.addEventListener('blur', fillVehicleFromInventory);
  }

  if (elements.lengkapNoRangka) {
    elements.lengkapNoRangka.addEventListener('change', fillLengkapVehicleFromInventory);
    elements.lengkapNoRangka.addEventListener('blur', fillLengkapVehicleFromInventory);
  }

  if (elements.lengkapInventoryVehicleSelect) {
    elements.lengkapInventoryVehicleSelect.addEventListener('input', fillLengkapVehicleFromInventory);
    elements.lengkapInventoryVehicleSelect.addEventListener('change', fillLengkapVehicleFromInventory);
    elements.lengkapInventoryVehicleSelect.addEventListener('blur', fillLengkapVehicleFromInventory);
  }

  if (elements.pelunasanTanggalInvoice) {
    elements.pelunasanTanggalInvoice.addEventListener('change', function () {
      if (elements.pelunasanTanggalInvoice.value) loadSales(elements.pelunasanTanggalInvoice.value);
    });
  }

  if (elements.lengkapTanggal) {
    elements.lengkapTanggal.addEventListener('change', function () {
      refreshLengkapDocumentPreview();
    });
  }

  if (elements.lengkapTanggalInvoice) {
    elements.lengkapTanggalInvoice.addEventListener('change', function () {
      refreshLengkapDocumentPreview();
    });
  }

  [elements.typeModal, elements.dpModal, elements.pelunasanModal, elements.fakturModal, elements.lengkapModal, elements.detailModal, elements.fileModal, elements.searchDpModal].forEach(function (modal) {
    if (!modal) return;
    modal.addEventListener('click', function (event) {
      if (event.target === modal) {
        confirmCloseModal(modal);
      }
    });
  });

  formatAllRupiahFields();
  loadSales();
})();
