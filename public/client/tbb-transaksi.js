(function () {
  'use strict';

  const currency = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const decimalFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  const moneyInputFormat = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const DEMO_DISTRIBUTION_PAYMENT_SOURCES = [
    { key: 'tbb-bank-bca', label: 'BANK BCA' },
    { key: 'tbb-bank-bca-fetty', label: 'BANK BCA CabangContoh' },
    { key: 'tbb-kas', label: 'KAS' }
  ];
  const DEMO_DISTRIBUTION_DEFAULT_CUSTOMER = {
    code: 'CUS',
    name: 'PT CUSTOMER CONTOH',
    address: 'Jl. WR. Supratman, Kel. Panjang Wetan, Pekalongan Utara',
    identityNo: '0000000000000000'
  };
  const DEMO_DISTRIBUTION_LEGACY_DEFAULT_REFERENCE = 'PPN Dibebaskan\nberdasarkan PP Nomor 49\nTahun 2022';
  const DEMO_DISTRIBUTION_DEFAULT_REFERENCE = '';
  const DEMO_DISTRIBUTION_INVOICE_TAX_NOTE = DEMO_DISTRIBUTION_LEGACY_DEFAULT_REFERENCE;
  const DEMO_DISTRIBUTION_INVOICE_MIN_ROWS = 10;
  const DEMO_DISTRIBUTION_COMPANY = {
    name: 'PT. PERUSAHAAN DISTRIBUSI CONTOH',
    npwp: '1000 0000 0120 0283',
    address: 'Jalan Pantai Sari Gang Ii Nomor 04Rt 001 Rw 013, Panjang Wetan, Pekalongan Utara, Kota Pekalongan, Jawa Tengah',
    contact: 'Telp. 0800 0000 0000 | Email : demo@example.local'
  };
  const DEMO_DISTRIBUTION_ENTRY_MODAL_MIN_WIDTH = 720;
  const DEMO_DISTRIBUTION_ENTRY_MODAL_MIN_HEIGHT = 460;

  function initialTab() {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'pembelian') return 'purchases';
    if (tab === 'kontrol') return 'control';
    return 'sales';
  }

  function preferredPaymentSourceKey() {
    const params = new URLSearchParams(window.location.search);
    const selected = params.get('source') || params.get('paymentSource') || params.get('jenisBank') || '';
    return DEMO_DISTRIBUTION_PAYMENT_SOURCES.some(function (source) { return source.key === selected; }) ? selected : '';
  }

  function initialEntryLineLayout() {
    return 'table';
  }

  const state = {
    client: null,
    user: null,
    sales: [],
    purchases: [],
    settlements: [],
    masters: { suppliers: [], fish: [] },
    next: {},
    activeTab: initialTab(),
    searchTerm: '',
    invoicePreview: null,
    entryReadOnly: false,
    entryLineLayout: initialEntryLineLayout(),
    selected: { sales: '', purchases: '' },
    rowClickTimer: null,
    alertTimer: null,
    entryModalWindowBound: false,
    entryModalDrag: null,
    entryAttachmentFiles: [],
    entryAttachmentDirty: false,
    entryAttachmentLoading: false,
    entryAttachmentLoadFailed: false,
    entryAttachmentLoadPromise: null,
    autoOpenHandled: false,
    filters: {
      sales: [],
      purchases: []
    },
    sorts: {
      sales: null,
      purchases: null,
      control: null
    }
  };

  const elements = {
    alert: document.getElementById('tbbAlert'),
    clientMeta: document.getElementById('tbbClientMeta'),
    subtitle: document.getElementById('tbbSubtitle'),
    userName: document.getElementById('tbbUserName'),
    userEmail: document.getElementById('tbbUserEmail'),
    backLink: document.getElementById('tbbBackLink'),
    refreshButton: document.getElementById('tbbRefreshBtn'),
    tabs: Array.from(document.querySelectorAll('[data-tbb-tab]')),
    panels: Array.from(document.querySelectorAll('[data-tbb-panel]')),
    addButton: document.getElementById('tbbAddBtn'),
    importButton: document.getElementById('tbbImportBtn'),
    importInput: document.getElementById('tbbImportInput'),
    journalButton: document.getElementById('tbbJournalBtn'),
    exportButton: document.getElementById('tbbExportBtn'),
    searchInput: document.getElementById('tbbSearchInput'),
    searchButton: document.getElementById('tbbSearchBtn'),
    filterControls: document.getElementById('tbbFilterControls'),
    filterToggle: document.getElementById('tbbFilterToggle'),
    filterDropdown: document.getElementById('tbbFilterDropdown'),
    filterOptions: Array.from(document.querySelectorAll('[data-tbb-filter-option]')),
    count: document.getElementById('tbbCount'),
    salesRows: document.getElementById('tbbSalesRows'),
    purchaseRows: document.getElementById('tbbPurchaseRows'),
    controlRows: document.getElementById('tbbControlRows'),
    salesDetail: document.getElementById('tbbSalesDetail'),
    purchaseDetail: document.getElementById('tbbPurchaseDetail'),
    choiceModal: document.getElementById('tbbChoiceModal'),
    choiceTitle: document.getElementById('tbbChoiceTitle'),
    choiceMeta: document.getElementById('tbbChoiceMeta'),
    choiceTransactionTitle: document.getElementById('tbbChoiceTransactionTitle'),
    choiceTransactionText: document.getElementById('tbbChoiceTransactionText'),
    choiceSettlementText: document.getElementById('tbbChoiceSettlementText'),
    choiceCloseButton: document.getElementById('tbbChoiceCloseBtn'),
    entryModal: document.getElementById('tbbEntryModal'),
    entryForm: document.getElementById('tbbEntryForm'),
    entryTitle: document.getElementById('tbbEntryModalTitle'),
    entryMeta: document.getElementById('tbbEntryModalMeta'),
    entryType: document.getElementById('tbbEntryType'),
    entryId: document.getElementById('tbbEntryId'),
    entryBody: document.getElementById('tbbEntryBody'),
    entryLayoutButton: document.getElementById('tbbEntryLayoutBtn'),
    entryCloseButton: document.getElementById('tbbEntryCloseBtn'),
    entryCancelButton: document.getElementById('tbbEntryCancelBtn'),
    entrySaveButton: document.getElementById('tbbEntrySaveBtn'),
    entryViewActions: document.getElementById('tbbEntryViewActions'),
    attachmentPickButton: document.getElementById('tbbAttachmentPickBtn'),
    attachmentName: document.getElementById('tbbAttachmentName'),
    attachmentFile: document.getElementById('tbbAttachmentFile'),
    attachmentNote: document.getElementById('tbbAttachmentNote'),
    attachmentList: document.getElementById('tbbAttachmentList'),
    invoiceModal: document.getElementById('tbbInvoiceModal'),
    invoiceTitle: document.getElementById('tbbInvoiceTitle'),
    invoiceMeta: document.getElementById('tbbInvoiceMeta'),
    invoiceBody: document.getElementById('tbbInvoiceBody'),
    invoiceCloseButton: document.getElementById('tbbInvoiceCloseBtn'),
    invoiceCancelButton: document.getElementById('tbbInvoiceCancelBtn'),
    invoicePrintButton: document.getElementById('tbbInvoicePrintBtn'),
    journalModal: document.getElementById('tbbJournalModal'),
    journalTitle: document.getElementById('tbbJournalTitle'),
    journalMeta: document.getElementById('tbbJournalMeta'),
    journalBody: document.getElementById('tbbJournalBody'),
    journalCloseButton: document.getElementById('tbbJournalCloseBtn'),
    journalCancelButton: document.getElementById('tbbJournalCancelBtn'),
    adminOnly: Array.from(document.querySelectorAll('.admin-only'))
  };

  function text(value, fallback) {
    const clean = value == null ? '' : String(value).trim();
    return clean || (fallback == null ? '' : String(fallback));
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeMultiline(value) {
    return escapeHtml(value).replace(/\r?\n/g, '<br>');
  }

  function referenceLines(value) {
    const lines = referenceTextValue(value).split(/\r?\n/);
    while (lines.length < 3) lines.push('');
    return lines.slice(0, 5);
  }

  function referenceTextValue(value) {
    const clean = text(value, DEMO_DISTRIBUTION_DEFAULT_REFERENCE);
    return clean === DEMO_DISTRIBUTION_LEGACY_DEFAULT_REFERENCE ? '' : clean;
  }

  function parseAmount(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value).trim();
    const normalized = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  }

  function roundAmount(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  function roundRupiah(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? Math.round(amount) : 0;
  }

  function formatAmountZero(value) {
    return currency.format(Number(value || 0));
  }

  function formatInvoiceMoney(value) {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function formatDecimal(value) {
    const amount = Number(value || 0);
    return amount ? decimalFormat.format(amount) : '0';
  }

  function formatInputNumber(value) {
    const amount = Number(value || 0);
    return amount ? decimalFormat.format(amount) : '';
  }

  function formatInputMoney(value) {
    const amount = Number(value || 0);
    return amount ? moneyInputFormat.format(amount) : '';
  }

  function isCheckedValue(value, defaultValue) {
    if (value == null || value === '') return Boolean(defaultValue);
    if (typeof value === 'boolean') return value;
    const clean = text(value).toLowerCase();
    return !['false', '0', 'no', 'tidak', 'off'].includes(clean);
  }

  function formatDate(value) {
    const raw = text(value);
    if (!raw) return '';
    const parts = raw.slice(0, 10).split('-');
    if (parts.length !== 3) return raw;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function today() {
    const current = new Date();
    return [
      current.getFullYear(),
      String(current.getMonth() + 1).padStart(2, '0'),
      String(current.getDate()).padStart(2, '0')
    ].join('-');
  }

  function clientId() {
    const match = window.location.pathname.match(/\/clients\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientId()) + '/tbb-transaksi';
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options || {});
    const data = await response.json().catch(function () { return null; });
    if (!response.ok || !data || data.ok === false) {
      throw new Error((data && data.error) || 'Permintaan gagal diproses.');
    }
    return data;
  }

  function setAlert(message, type) {
    if (!elements.alert) return;
    if (state.alertTimer) {
      window.clearTimeout(state.alertTimer);
      state.alertTimer = null;
    }
    const clean = text(message);
    elements.alert.hidden = !clean;
    elements.alert.textContent = clean;
    elements.alert.classList.toggle('success', type === 'success');
    elements.alert.classList.toggle('error', type === 'error');
    elements.alert.classList.toggle('info', type === 'info' || (!type && Boolean(clean)));
    if (clean) {
      state.alertTimer = window.setTimeout(function () {
        elements.alert.hidden = true;
        elements.alert.textContent = '';
        elements.alert.classList.remove('success', 'error', 'info');
      }, type === 'error' ? 3200 : 1400);
    }
  }

  async function loadData() {
    setAlert('');
    const data = await requestJson(apiBase(), { headers: { Accept: 'application/json' } });
    applyData(data);
    render();
    maybeOpenActionFromQuery();
  }

  function applyData(data) {
    state.client = data.client || state.client;
    state.user = data.user || state.user;
    state.sales = Array.isArray(data.sales) ? data.sales : [];
    state.purchases = Array.isArray(data.purchases) ? data.purchases : [];
    state.settlements = Array.isArray(data.settlements) ? data.settlements : [];
    state.masters = data.masters || state.masters || { suppliers: [], fish: [] };
    state.next = data.next || {};
  }

  function render() {
    renderShell();
    renderTabs();
    renderRows();
  }

  function maybeOpenActionFromQuery() {
    if (state.autoOpenHandled) return;
    const action = new URLSearchParams(window.location.search).get('action');
    if (action !== 'settlement-receivable' && action !== 'settlement-payable') return;
    const type = action === 'settlement-payable' ? 'purchases' : 'sales';
    state.autoOpenHandled = true;
    state.activeTab = type;
    renderTabs();
    openSettlementModal(type);
  }

  function renderShell() {
    const client = state.client || {};
    const user = state.user || {};
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
    if (elements.clientMeta) elements.clientMeta.textContent = text(client.name, 'Perusahaan Distribusi Contoh');
    if (elements.subtitle) elements.subtitle.textContent = text(client.name, 'Klien') + ' | Penjualan dulu, pembelian call invoice';
    if (elements.userName) elements.userName.textContent = text(user.displayName || user.username, '-');
    if (elements.userEmail) elements.userEmail.textContent = text(user.email || user.contactName, '-');
    if (elements.backLink && client.id) elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
  }

  function renderTabs() {
    elements.tabs.forEach(function (button) {
      const active = button.getAttribute('data-tbb-tab') === state.activeTab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    elements.panels.forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-tbb-panel') !== state.activeTab;
    });
    if (elements.addButton) {
      elements.addButton.textContent = 'Tambah Data';
      elements.addButton.hidden = state.activeTab === 'control';
    }
    if (elements.importButton) {
      elements.importButton.hidden = state.activeTab === 'control';
    }
    if (elements.journalButton) {
      elements.journalButton.hidden = state.activeTab === 'control';
    }
    if (elements.searchInput) {
      elements.searchInput.placeholder = state.activeTab === 'sales'
        ? 'Cari no invoice / customer / supplier / ikan'
        : (state.activeTab === 'purchases'
          ? 'Cari no dokumen / invoice / supplier'
          : 'Cari invoice / customer / status');
    }
    syncFilterControls();
  }

  function activeFilterState() {
    return Array.isArray(state.filters[state.activeTab]) ? state.filters[state.activeTab] : [];
  }

  function syncFilterControls() {
    const canFilter = state.activeTab === 'sales' || state.activeTab === 'purchases';
    if (elements.filterControls) elements.filterControls.hidden = !canFilter;
    if (elements.filterToggle) elements.filterToggle.hidden = !canFilter;
    if (elements.filterDropdown && !canFilter) elements.filterDropdown.hidden = true;
    if (!canFilter) return;
    const selected = new Set(activeFilterState());
    elements.filterOptions.forEach(function (option) {
      option.checked = selected.has(option.value);
    });
    if (elements.filterToggle) {
      elements.filterToggle.textContent = selected.size ? 'Filter (' + selected.size + ')' : 'Filter';
      elements.filterToggle.classList.toggle('is-active', selected.size > 0);
      elements.filterToggle.setAttribute('aria-expanded', elements.filterDropdown && !elements.filterDropdown.hidden ? 'true' : 'false');
    }
  }

  function setActiveFilterValues(values) {
    if (!state.filters[state.activeTab]) return;
    state.filters[state.activeTab] = Array.from(new Set(values.filter(Boolean)));
    syncFilterControls();
    renderRows();
  }

  function closeTbbFilterDropdown() {
    if (elements.filterDropdown) elements.filterDropdown.hidden = true;
    if (elements.filterToggle) elements.filterToggle.setAttribute('aria-expanded', 'false');
  }

  function toggleTbbFilterDropdown() {
    if (!elements.filterDropdown || !elements.filterToggle) return;
    const open = elements.filterDropdown.hidden;
    elements.filterDropdown.hidden = !open;
    elements.filterToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function normalizedSearch(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function rowSearchText(row) {
    return normalizedSearch([
      row.invoiceNo,
      row.documentNo,
      row.salesInvoiceNo,
      row.customerCode,
      row.customerName,
      row.supplierName,
      row.supplierCode,
      row.status,
      row.receivableOutstandingStatus,
      row.payableOutstandingStatus,
      row.notes,
      (row.items || []).map(function (item) {
        return [item.supplierCode, item.supplierName, item.fishCode, item.fishName].join(' ');
      }).join(' ')
    ].join(' '));
  }

  function filteredRows(type) {
    const rows = type === 'sales' ? state.sales : (type === 'purchases' ? state.purchases : controlRows());
    const query = normalizedSearch(state.searchTerm);
    let filtered = query ? rows.filter(function (row) { return rowSearchText(row).indexOf(query) !== -1; }) : rows.slice();
    if (type === 'sales' || type === 'purchases') {
      const filters = Array.isArray(state.filters[type]) ? state.filters[type] : [];
      const wantsUploaded = filters.includes('uploaded');
      const wantsMissing = filters.includes('missing');
      const wantsPaid = filters.includes('paid');
      const wantsUnpaid = filters.includes('unpaid');
      if (wantsUploaded && !wantsMissing) {
        filtered = filtered.filter(function (row) { return hasUploadedDocument(row); });
      } else if (wantsMissing && !wantsUploaded) {
        filtered = filtered.filter(function (row) { return !hasUploadedDocument(row); });
      }
      if (wantsPaid && !wantsUnpaid) {
        filtered = filtered.filter(function (row) { return isInvoicePaid(type, row); });
      } else if (wantsUnpaid && !wantsPaid) {
        filtered = filtered.filter(function (row) { return !isInvoicePaid(type, row); });
      }
    }
    return sortRows(type, filtered);
  }

  function hasActiveTbbFilters(type) {
    const filters = state.filters[type] || [];
    return Array.isArray(filters) && filters.length > 0;
  }

  function hasUploadedDocument(row) {
    return Boolean(row && (row.hasAttachment || row.attachmentName));
  }

  function isInvoicePaid(type, row) {
    return outstandingByInvoice(type, row) <= 0.0001;
  }

  function dateRank(value) {
    const raw = text(value);
    if (!raw) return 0;
    const stamp = Date.parse(raw.slice(0, 10));
    return Number.isFinite(stamp) ? stamp : 0;
  }

  function compareValues(left, right, direction) {
    const multiplier = direction === 'desc' ? -1 : 1;
    if (typeof left === 'number' || typeof right === 'number') {
      return ((Number(left || 0) - Number(right || 0)) || 0) * multiplier;
    }
    return text(left).localeCompare(text(right), 'id', { numeric: true, sensitivity: 'base' }) * multiplier;
  }

  function defaultTbbSort(type, left, right) {
    if (type === 'sales' || type === 'purchases') {
      const leftDate = type === 'sales' ? left.invoiceDate : left.purchaseDate;
      const rightDate = type === 'sales' ? right.invoiceDate : right.purchaseDate;
      const dateResult = dateRank(rightDate) - dateRank(leftDate);
      if (dateResult) return dateResult;
      const leftNo = type === 'sales' ? left.invoiceNo : left.documentNo;
      const rightNo = type === 'sales' ? right.invoiceNo : right.documentNo;
      return text(rightNo).localeCompare(text(leftNo), 'id', { numeric: true, sensitivity: 'base' });
    }
    return dateRank(right.invoiceDate) - dateRank(left.invoiceDate);
  }

  function tbbSortValue(type, row, key) {
    const totals = type === 'sales' ? calculateSalesTotalsFromItems(row.items || []) : null;
    if (type === 'sales') {
      const outstanding = outstandingByInvoice('sales', row);
      const total = totals.totalTagihan;
      const paid = roundAmount(Math.max(0, total - outstanding));
      return {
        invoiceNo: row.invoiceNo,
        invoiceDate: dateRank(row.invoiceDate),
        customerName: row.customerName || 'PT CUSTOMER CONTOH',
        dpp: totals.dpp,
        ppn: totals.ppn,
        pph22: totals.pph22,
        totalTagihan: total,
        paid,
        outstanding,
        hasAttachment: hasUploadedDocument(row) ? 1 : 0
      }[key];
    }
    if (type === 'purchases') {
      const outstanding = outstandingByInvoice('purchases', row);
      const total = Number(row.totalTagihan || 0);
      return {
        salesInvoiceNo: purchaseSalesInvoiceLabel(row),
        documentNo: row.documentNo,
        purchaseDate: dateRank(row.purchaseDate),
        supplierName: row.supplierName || '-',
        totalTagihan: total,
        paid: roundAmount(Math.max(0, total - outstanding)),
        outstanding,
        hasAttachment: hasUploadedDocument(row) ? 1 : 0
      }[key];
    }
    return {
      invoiceNo: row.invoiceNo,
      invoiceDate: dateRank(row.invoiceDate),
      customerName: row.customerName,
      saleQty: row.saleQty,
      purchaseQty: row.purchaseQty,
      saleTotal: row.saleTotal,
      purchaseTotal: row.purchaseTotal,
      status: row.status,
      receivableOutstandingStatus: row.receivableOutstandingStatus === 'LUNAS' ? 0 : parseAmount(row.receivableOutstandingStatus),
      payableOutstandingStatus: row.payableOutstandingStatus === 'LUNAS' ? 0 : parseAmount(row.payableOutstandingStatus)
    }[key];
  }

  function sortRows(type, rows) {
    const sort = state.sorts[type];
    const output = rows.slice();
    if (!sort || !sort.key) {
      return output.sort(function (left, right) {
        return defaultTbbSort(type, left, right);
      });
    }
    return output.sort(function (left, right) {
      const result = compareValues(tbbSortValue(type, left, sort.key), tbbSortValue(type, right, sort.key), sort.direction);
      return result || defaultTbbSort(type, left, right);
    });
  }

  function renderRows() {
    renderSalesRows();
    renderPurchaseRows();
    renderControlRows();
    initTbbResizableTables();
    compactTbbDisplayTables();
    updateTbbSortHeaderState();
    const activeRows = filteredRows(state.activeTab);
    if (elements.count) elements.count.textContent = activeRows.length + ' data';
  }

  function initTbbResizableTables() {
    if (typeof window.clientPortalInitResizableTables === 'function') {
      window.clientPortalInitResizableTables(document);
    }
  }

  function compactTbbDisplayTables() {
    window.requestAnimationFrame(function () {
      ['tbbSalesTable', 'tbbPurchaseTable'].forEach(function (tableId) {
        compactTbbDisplayTable(document.getElementById(tableId));
      });
    });
  }

  function compactTbbDisplayTable(table) {
    if (!table) return;
    const wrap = table.closest('.cashbook-table-wrap');
    const wrapWidth = wrap ? Math.floor(wrap.clientWidth - 2) : 0;
    if (!wrapWidth || wrapWidth < 520) return;
    const headerRow = table.tHead && table.tHead.rows && table.tHead.rows[0];
    const headers = Array.from(headerRow ? headerRow.cells : []);
    if (!headers.length) return;
    const colgroup = table.querySelector(':scope > colgroup');
    const cols = Array.from(colgroup ? colgroup.children : []).slice(0, headers.length);
    if (cols.length !== headers.length) return;

    const minimums = table.id === 'tbbPurchaseTable'
      ? [106, 86, 62, 122, 96, 88, 78, 44]
      : [112, 62, 122, 74, 56, 62, 86, 86, 76, 44];
    const currentWidths = cols.map(function (col, index) {
      const styledWidth = parseFloat(col.style.width);
      const headerWidth = headers[index] ? headers[index].getBoundingClientRect().width : 0;
      return Math.max(minimums[index] || 42, styledWidth || headerWidth || (wrapWidth / cols.length));
    });
    const fitted = fitWidthsToTotal(currentWidths, minimums, wrapWidth);
    fitted.forEach(function (width, index) {
      cols[index].style.width = Math.max(minimums[index] || 42, Math.floor(width)) + 'px';
    });
    table.style.width = wrapWidth + 'px';
    table.style.minWidth = '0';
  }

  function fitWidthsToTotal(widths, minimums, totalWidth) {
    const safeTotal = Math.max(totalWidth, minimums.reduce(function (sum, width) { return sum + width; }, 0));
    const currentTotal = widths.reduce(function (sum, width) { return sum + Number(width || 0); }, 0) || safeTotal;
    let fitted = widths.map(function (width, index) {
      return Math.max(minimums[index] || 42, (Number(width) || 0) * safeTotal / currentTotal);
    });
    let guard = 0;
    while (guard < 8) {
      guard += 1;
      const fittedTotal = fitted.reduce(function (sum, width) { return sum + width; }, 0);
      const overflow = fittedTotal - safeTotal;
      if (overflow <= 0.5) break;
      const flexible = fitted.map(function (width, index) {
        return Math.max(0, width - (minimums[index] || 42));
      });
      const flexibleTotal = flexible.reduce(function (sum, width) { return sum + width; }, 0);
      if (flexibleTotal <= 0.5) break;
      fitted = fitted.map(function (width, index) {
        const reduction = overflow * (flexible[index] / flexibleTotal);
        return Math.max(minimums[index] || 42, width - reduction);
      });
    }
    return fitted;
  }

  function setupTbbSortHeaders() {
    [
      ['tbbSalesTable', 'sales', ['invoiceNo', 'invoiceDate', 'customerName', 'dpp', 'ppn', 'pph22', 'totalTagihan', 'paid', 'outstanding', 'hasAttachment']],
      ['tbbPurchaseTable', 'purchases', ['salesInvoiceNo', 'documentNo', 'purchaseDate', 'supplierName', 'totalTagihan', 'paid', 'outstanding', 'hasAttachment']],
      ['tbbControlTable', 'control', ['invoiceNo', 'invoiceDate', 'customerName', 'saleQty', 'purchaseQty', 'saleTotal', 'purchaseTotal', 'status', 'receivableOutstandingStatus', 'payableOutstandingStatus']]
    ].forEach(function (config) {
      const table = document.getElementById(config[0]);
      if (!table) return;
      Array.from(table.querySelectorAll('thead th')).forEach(function (header, index) {
        const key = config[2][index];
        if (!key) return;
        header.setAttribute('data-tbb-sort-type', config[1]);
        header.setAttribute('data-tbb-sort-key', key);
        header.setAttribute('tabindex', '0');
        header.classList.add('client-sortable-head');
        header.title = 'Klik untuk sort data';
      });
    });
    updateTbbSortHeaderState();
  }

  function updateTbbSortHeaderState() {
    document.querySelectorAll('[data-tbb-sort-key]').forEach(function (header) {
      const type = header.getAttribute('data-tbb-sort-type');
      const key = header.getAttribute('data-tbb-sort-key');
      const sort = state.sorts[type];
      const active = sort && sort.key === key;
      header.classList.toggle('is-sorted-asc', Boolean(active && sort.direction === 'asc'));
      header.classList.toggle('is-sorted-desc', Boolean(active && sort.direction === 'desc'));
      header.setAttribute('aria-sort', active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none');
    });
  }

  function setTbbSort(type, key) {
    const current = state.sorts[type];
    const defaultDirection = /date|total|dpp|ppn|pph|paid|outstanding|qty/i.test(key) ? 'desc' : 'asc';
    state.sorts[type] = current && current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: defaultDirection };
    renderRows();
  }

  function renderSalesRows() {
    clearNode(elements.salesRows);
    const rows = filteredRows('sales');
    if (!rows.length) {
      elements.salesRows.appendChild(emptyRow(10, (state.searchTerm || hasActiveTbbFilters('sales')) ? 'Tidak ada penjualan yang cocok.' : 'Belum ada penjualan.'));
      renderSelectedDetail('sales');
      return;
    }
    rows.forEach(function (entry) {
      const totals = calculateSalesTotalsFromItems(entry.items || []);
      const outstanding = outstandingByInvoice('sales', entry);
      const paid = roundAmount(Math.max(0, totals.totalTagihan - outstanding));
      const selected = state.selected.sales === entry.id;
      const row = document.createElement('tr');
      row.setAttribute('data-tbb-row-type', 'sales');
      row.setAttribute('data-tbb-row-id', entry.id);
      row.classList.toggle('is-selected', selected);
      row.title = 'Klik untuk melihat detail';
      row.appendChild(cell(entry.invoiceNo));
      row.appendChild(cell(formatDate(entry.invoiceDate)));
      row.appendChild(cell(entry.customerName || 'PT CUSTOMER CONTOH'));
      row.appendChild(cell(formatAmountZero(totals.dpp), 'money'));
      row.appendChild(cell(formatAmountZero(totals.ppn), 'money'));
      row.appendChild(cell(formatAmountZero(totals.pph22), 'money'));
      row.appendChild(cell(formatAmountZero(totals.totalTagihan), 'money total-money-col'));
      row.appendChild(cell(formatAmountZero(paid), paid >= totals.totalTagihan - 0.0001 ? 'money is-paid' : 'money'));
      row.appendChild(cell(formatOutstanding(outstanding), outstanding <= 0.0001 ? 'money is-paid' : 'money'));
      row.appendChild(documentStatusCell(entry));
      elements.salesRows.appendChild(row);
    });
    renderSelectedDetail('sales');
  }

  function renderPurchaseRows() {
    clearNode(elements.purchaseRows);
    const rows = filteredRows('purchases');
    if (!rows.length) {
      elements.purchaseRows.appendChild(emptyRow(8, (state.searchTerm || hasActiveTbbFilters('purchases')) ? 'Tidak ada pembelian yang cocok.' : 'Belum ada pembelian.'));
      renderSelectedDetail('purchases');
      return;
    }
    rows.forEach(function (entry) {
      const outstanding = outstandingByInvoice('purchases', entry);
      const paid = roundAmount(Math.max(0, Number(entry.totalTagihan || 0) - outstanding));
      const selected = state.selected.purchases === entry.id;
      const row = document.createElement('tr');
      row.setAttribute('data-tbb-row-type', 'purchases');
      row.setAttribute('data-tbb-row-id', entry.id);
      row.classList.toggle('is-selected', selected);
      row.title = 'Klik untuk melihat detail';
      row.appendChild(cell(purchaseSalesInvoiceLabel(entry)));
      row.appendChild(cell(entry.documentNo));
      row.appendChild(cell(formatDate(entry.purchaseDate)));
      row.appendChild(cell(entry.supplierName || '-'));
      row.appendChild(cell(formatAmountZero(entry.totalTagihan), 'money total-money-col'));
      row.appendChild(cell(formatAmountZero(paid), paid >= Number(entry.totalTagihan || 0) - 0.0001 ? 'money is-paid' : 'money'));
      row.appendChild(cell(formatOutstanding(outstanding), outstanding <= 0.0001 ? 'money is-paid' : 'money'));
      row.appendChild(documentStatusCell(entry));
      elements.purchaseRows.appendChild(row);
    });
    renderSelectedDetail('purchases');
  }

  function appendInlineDetailRow(type, entry, colspan, tbody) {
    const detailRow = document.createElement('tr');
    detailRow.className = 'tbb-inline-detail-row';
    const detailCell = document.createElement('td');
    detailCell.colSpan = colspan;
    detailCell.className = 'tbb-inline-detail-cell';
    detailCell.innerHTML = selectedDetailHtml(type, entry);
    detailRow.appendChild(detailCell);
    tbody.appendChild(detailRow);
  }

  function formatOutstanding(value) {
    return Number(value || 0) <= 0.0001 ? 'LUNAS' : formatAmountZero(value);
  }

  function saleItemKey(item) {
    const supplierKey = text(item.supplierCode).toLowerCase() || text(item.supplierName).toLowerCase();
    return [supplierKey, text(item.fishCode).toLowerCase(), text(item.fishName).toLowerCase(), text(item.unit || 'Kg').toLowerCase()].join('|');
  }

  function purchaseItemSalesInvoiceNo(purchase, item) {
    const itemInvoiceNo = text(item && item.sourceSalesNo);
    if (itemInvoiceNo && itemInvoiceNo !== 'Manual') return itemInvoiceNo;
    const purchaseInvoiceNo = text(purchase && purchase.salesInvoiceNo);
    return purchaseInvoiceNo && purchaseInvoiceNo !== 'Manual' ? purchaseInvoiceNo : '';
  }

  function purchaseSalesInvoiceLabel(purchase) {
    const invoiceNo = text(purchase && purchase.salesInvoiceNo);
    if (invoiceNo && invoiceNo !== 'Manual') return invoiceNo;
    const invoiceNos = Array.from(new Set((purchase.items || []).map(function (item) {
      return purchaseItemSalesInvoiceNo(purchase, item);
    }).filter(Boolean)));
    return invoiceNos.length ? 'Manual -> ' + invoiceNos.join(', ') : (invoiceNo || '-');
  }

  function lineMatchesSaleItem(line, saleItem) {
    const lineSupplierCode = text(line.supplierCode).toLowerCase();
    const saleSupplierCode = text(saleItem.supplierCode).toLowerCase();
    const lineSupplierName = text(line.supplierName).toLowerCase();
    const saleSupplierName = text(saleItem.supplierName).toLowerCase();
    const supplierMatches = lineSupplierCode && saleSupplierCode
      ? lineSupplierCode === saleSupplierCode
      : Boolean(lineSupplierName && saleSupplierName && lineSupplierName === saleSupplierName);
    const lineFishCode = text(line.fishCode).toLowerCase();
    const saleFishCode = text(saleItem.fishCode).toLowerCase();
    const lineFishName = text(line.fishName).toLowerCase();
    const saleFishName = text(saleItem.fishName).toLowerCase();
    const fishMatches = lineFishCode && saleFishCode
      ? lineFishCode === saleFishCode
      : Boolean(lineFishName && saleFishName && lineFishName === saleFishName);
    return supplierMatches && fishMatches && text(line.unit || 'Kg').toLowerCase() === text(saleItem.unit || 'Kg').toLowerCase();
  }

  function saleRemainingQty(sale, currentPurchaseId) {
    return roundAmount(remainingSaleItemsForPurchase(sale, currentPurchaseId).reduce(function (sum, item) {
      return sum + parseAmount(item.qty);
    }, 0));
  }

  function paidPurchaseAmountForSaleInvoice(invoiceNo) {
    const cleanInvoiceNo = text(invoiceNo);
    if (!cleanInvoiceNo) return 0;
    return roundAmount(state.purchases.reduce(function (sum, purchase) {
      const relevantAmount = roundAmount((purchase.items || []).reduce(function (itemSum, item) {
        return purchaseItemSalesInvoiceNo(purchase, item) === cleanInvoiceNo
          ? itemSum + parseAmount(item.amount)
          : itemSum;
      }, 0));
      if (relevantAmount <= 0) return sum;
      const purchaseTotal = roundAmount(parseAmount(purchase.totalTagihan) || (purchase.items || []).reduce(function (itemSum, item) {
        return itemSum + parseAmount(item.amount);
      }, 0));
      const purchasePaid = roundAmount(Math.max(0, purchaseTotal - outstandingByInvoice('purchases', purchase)));
      const allocatedPaid = purchaseTotal > 0
        ? roundAmount(purchasePaid * (relevantAmount / purchaseTotal))
        : purchasePaid;
      return sum + Math.min(relevantAmount, allocatedPaid);
    }, 0));
  }

  function controlRows() {
    const purchasedByInvoice = new Map();
    state.purchases.forEach(function (purchase) {
      (purchase.items || []).forEach(function (item) {
        const invoiceNo = purchaseItemSalesInvoiceNo(purchase, item);
        if (!invoiceNo) return;
        if (!purchasedByInvoice.has(invoiceNo)) {
          purchasedByInvoice.set(invoiceNo, { qty: 0, total: 0, itemQty: new Map() });
        }
        const bucket = purchasedByInvoice.get(invoiceNo);
        const qty = parseAmount(item.qty);
        const key = saleItemKey(item);
        bucket.qty += qty;
        bucket.total += parseAmount(item.amount);
        bucket.itemQty.set(key, (bucket.itemQty.get(key) || 0) + qty);
      });
    });
    return state.sales.map(function (sale) {
      const bucket = purchasedByInvoice.get(text(sale.invoiceNo)) || { qty: 0, total: 0, itemQty: new Map() };
      const saleQty = (sale.items || []).reduce(function (sum, item) { return sum + parseAmount(item.qty); }, 0);
      const saleTotal = calculateSalesTotalsFromItems(sale.items || []).totalTagihan;
      const closed = isSaleClosedForPurchase(sale, '');
      const outstanding = outstandingByInvoice('sales', sale);
      const payablePaid = paidPurchaseAmountForSaleInvoice(sale.invoiceNo);
      const payableOutstanding = roundAmount(Math.max(0, bucket.total - payablePaid));
      return {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        invoiceDate: sale.invoiceDate,
        customerName: sale.customerName || 'PT CUSTOMER CONTOH',
        saleQty: roundAmount(saleQty),
        purchaseQty: roundAmount(bucket.qty),
        saleTotal: roundAmount(saleTotal),
        purchaseTotal: roundAmount(bucket.total),
        grossProfit: roundAmount(saleTotal - bucket.total),
        status: closed ? 'Sesuai' : 'Belum sesuai',
        receivableOutstandingStatus: formatOutstanding(outstanding),
        payableOutstandingStatus: closed ? formatOutstanding(payableOutstanding) : '-'
      };
    });
  }

  function saleQtyByKey(items) {
    const result = new Map();
    (items || []).forEach(function (item) {
      const key = saleItemKey(item);
      result.set(key, (result.get(key) || 0) + parseAmount(item.qty));
    });
    return result;
  }

  function isSaleClosedForPurchase(sale, currentPurchaseId) {
    if (!sale) return false;
    const requiredQty = saleQtyByKey(sale.items || []);
    if (!requiredQty.size) return false;
    const purchasedQty = purchasedQtyByKey(sale.invoiceNo, currentPurchaseId);
    let closed = true;
    requiredQty.forEach(function (soldQty, key) {
      const boughtQty = purchasedQty.get(key) || 0;
      if (Math.abs(soldQty - boughtQty) > 0.0001) closed = false;
    });
    return closed;
  }

  function availableSalesForPurchase(selectedValue, currentPurchaseId) {
    const selected = text(selectedValue);
    return state.sales.filter(function (sale) {
      if (selected && text(sale.invoiceNo) === selected) return true;
      return !isSaleClosedForPurchase(sale, currentPurchaseId);
    });
  }

  function firstAvailableSalesInvoiceNo(currentPurchaseId) {
    const sale = state.sales.find(function (item) {
      return !isSaleClosedForPurchase(item, currentPurchaseId);
    });
    return sale ? sale.invoiceNo : '';
  }

  function renderControlRows() {
    clearNode(elements.controlRows);
    if (!elements.controlRows) return;
    const rows = filteredRows('control');
    if (!rows.length) {
      elements.controlRows.appendChild(emptyRow(10, state.searchTerm ? 'Tidak ada kontrol penjualan yang cocok.' : 'Belum ada data kontrol penjualan.'));
      return;
    }
    rows.forEach(function (entry) {
      const row = document.createElement('tr');
      row.appendChild(cell(entry.invoiceNo));
      row.appendChild(cell(formatDate(entry.invoiceDate)));
      row.appendChild(cell(entry.customerName));
      row.appendChild(cell(formatDecimal(entry.saleQty), 'money'));
      row.appendChild(cell(formatDecimal(entry.purchaseQty), 'money'));
      row.appendChild(cell(formatAmountZero(entry.saleTotal), 'money total-money-col'));
      row.appendChild(cell(formatAmountZero(entry.purchaseTotal), 'money'));
      const status = cell(entry.status);
      status.className = 'tbb-control-status ' + (entry.status === 'Sesuai' ? 'is-closed' : 'is-open');
      row.appendChild(status);
      const receivableStatus = cell(entry.receivableOutstandingStatus);
      receivableStatus.className = 'tbb-control-status ' + (entry.receivableOutstandingStatus === '-' ? 'is-muted' : (entry.receivableOutstandingStatus === 'LUNAS' ? 'is-closed' : 'is-open'));
      row.appendChild(receivableStatus);
      const payableStatus = cell(entry.payableOutstandingStatus);
      payableStatus.className = 'tbb-control-status ' + (entry.payableOutstandingStatus === '-' ? 'is-muted' : (entry.payableOutstandingStatus === 'LUNAS' ? 'is-closed' : 'is-open'));
      row.appendChild(payableStatus);
      elements.controlRows.appendChild(row);
    });
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function emptyRow(colspan, message) {
    const row = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colspan;
    td.textContent = message;
    row.appendChild(td);
    return row;
  }

  function cell(value, variant) {
    const td = document.createElement('td');
    if (variant) td.className = variant;
    td.textContent = text(value);
    return td;
  }

  function documentStatusCell(entry) {
    const td = document.createElement('td');
    const checked = hasUploadedDocument(entry);
    td.className = 'tbb-doc-status-cell' + (checked ? ' is-uploaded' : ' is-missing');
    td.title = checked ? 'Sudah ada dokumen ter-upload' : 'Belum ada dokumen ter-upload';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.disabled = true;
    input.setAttribute('aria-label', td.title);
    td.appendChild(input);
    return td;
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

  function tbbExportRows(type) {
    const rows = filteredRows(type);
    if (type === 'sales') {
      return [
        ['No Inv', 'Tanggal', 'Nama Customer', 'DPP', 'PPN', 'PPh 22', 'Jumlah Tagihan', 'Sudah Terbayar', 'Sisa Piutang', 'Dokumen']
      ].concat(rows.map(function (entry) {
        const totals = calculateSalesTotalsFromItems(entry.items || []);
        const outstanding = outstandingByInvoice('sales', entry);
        return [
          entry.invoiceNo,
          formatDate(entry.invoiceDate),
          entry.customerName || 'PT CUSTOMER CONTOH',
          totals.dpp,
          totals.ppn,
          totals.pph22,
          totals.totalTagihan,
          roundAmount(Math.max(0, totals.totalTagihan - outstanding)),
          outstanding <= 0.0001 ? 'LUNAS' : outstanding,
          hasUploadedDocument(entry) ? 'Sudah upload' : 'Belum upload'
        ];
      }));
    }
    if (type === 'purchases') {
      return [
        ['No Inv Penjualan', 'No Dok', 'Tanggal', 'Nama Supplier', 'Jumlah Tagihan', 'Sudah Terbayar', 'Sisa Hutang', 'Dokumen']
      ].concat(rows.map(function (entry) {
        const outstanding = outstandingByInvoice('purchases', entry);
        const total = Number(entry.totalTagihan || 0);
        return [
          purchaseSalesInvoiceLabel(entry),
          entry.documentNo,
          formatDate(entry.purchaseDate),
          entry.supplierName || '-',
          total,
          roundAmount(Math.max(0, total - outstanding)),
          outstanding <= 0.0001 ? 'LUNAS' : outstanding,
          hasUploadedDocument(entry) ? 'Sudah upload' : 'Belum upload'
        ];
      }));
    }
    return [
      ['No Inv', 'Tanggal', 'Customer', 'Qty Jual', 'Qty Beli', 'Nilai Jual', 'Nilai Beli', 'Status Qty', 'Sisa Piutang', 'Sisa Utang']
    ].concat(rows.map(function (entry) {
      return [
        entry.invoiceNo,
        formatDate(entry.invoiceDate),
        entry.customerName,
        entry.saleQty,
        entry.purchaseQty,
        entry.saleTotal,
        entry.purchaseTotal,
        entry.status,
        entry.receivableOutstandingStatus,
        entry.payableOutstandingStatus
      ];
    }));
  }

  function exportActiveTbbRows() {
    const label = state.activeTab === 'sales' ? 'penjualan' : (state.activeTab === 'purchases' ? 'pembelian' : 'kontrol-penjualan');
    const rows = tbbExportRows(state.activeTab);
    exportWorkbook(
      'tbb-' + label + '-' + slugFilePart(state.client?.name, 'client') + '-' + today(),
      label,
      rows
    );
  }

  function actionsCell(type, entry) {
    const wrap = document.createElement('div');
    wrap.className = 'cashbook-actions tbb-actions-cell';
    const actions = [
      ['Faktur', 'view'],
      ['Bayar', 'pay'],
      ['Ubah', 'edit'],
      ['Hapus', 'delete']
    ];
    actions.forEach(function (item) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cashbook-action-button' + (item[1] === 'delete' ? ' danger' : '');
      button.textContent = item[0];
      button.setAttribute('data-tbb-action', item[1]);
      button.setAttribute('data-tbb-type', type);
      button.setAttribute('data-tbb-id', entry.id);
      wrap.appendChild(button);
    });
    return wrap;
  }

  function detailContainer(type) {
    return type === 'sales' ? elements.salesDetail : elements.purchaseDetail;
  }

  function renderSelectedDetail(type) {
    const container = detailContainer(type);
    if (!container) return;
    container.hidden = true;
    container.innerHTML = '';
  }

  function clearRowClickTimer() {
    if (!state.rowClickTimer) return;
    window.clearTimeout(state.rowClickTimer);
    state.rowClickTimer = null;
  }

  function isSelectableRowType(type) {
    return type === 'sales' || type === 'purchases';
  }

  function scheduleRowSelection(type, id) {
    if (!isSelectableRowType(type)) return;
    clearRowClickTimer();
    state.rowClickTimer = window.setTimeout(function () {
      state.selected[type] = state.selected[type] === id ? '' : id;
      renderRows();
      state.rowClickTimer = null;
    }, 190);
  }

  function selectedDetailHtml(type, entry) {
    return '';
  }

  function detailMetricHtml(label, value, variant) {
    return '<div class="tbb-row-detail-metric ' + escapeHtml(variant || '') + '">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<strong>' + escapeHtml(value) + '</strong>' +
    '</div>';
  }

  function findEntry(type, id) {
    const rows = type === 'sales' ? state.sales : state.purchases;
    return rows.find(function (row) { return text(row.id) === text(id); }) || null;
  }

  function supplierOptions() {
    const map = new Map();
    function add(code, name) {
      const cleanCode = text(code);
      const cleanName = text(name);
      if (!cleanCode && !cleanName) return;
      const key = (cleanCode || cleanName).toLowerCase();
      if (!map.has(key)) map.set(key, { code: cleanCode, name: cleanName || cleanCode });
      else if (cleanName && !map.get(key).name) map.get(key).name = cleanName;
    }
    (state.masters.suppliers || []).forEach(function (item) { add(item.code, item.name); });
    state.purchases.forEach(function (entry) {
      add(entry.supplierCode, entry.supplierName);
      (entry.items || []).forEach(function (item) { add(item.supplierCode, item.supplierName); });
    });
    state.sales.forEach(function (entry) {
      (entry.items || []).forEach(function (item) { add(item.supplierCode, item.supplierName); });
    });
    return Array.from(map.values()).sort(function (a, b) {
      return (a.name || a.code).localeCompare(b.name || b.code);
    });
  }

  function fishOptions() {
    const map = new Map();
    function add(code, name) {
      const cleanCode = text(code);
      const cleanName = text(name);
      if (!cleanCode && !cleanName) return;
      const key = (cleanCode || cleanName).toLowerCase();
      if (!map.has(key)) map.set(key, { code: cleanCode, name: cleanName || cleanCode });
      else if (cleanName && !map.get(key).name) map.get(key).name = cleanName;
    }
    (state.masters.fish || []).forEach(function (item) { add(item.code, item.name); });
    state.purchases.forEach(function (entry) {
      (entry.items || []).forEach(function (item) { add(item.fishCode, item.fishName); });
    });
    state.sales.forEach(function (entry) {
      (entry.items || []).forEach(function (item) { add(item.fishCode, item.fishName); });
    });
    return Array.from(map.values()).sort(function (a, b) {
      return (a.name || a.code).localeCompare(b.name || b.code);
    });
  }

  function customerOptions() {
    const map = new Map();
    map.set('cnl', DEMO_DISTRIBUTION_DEFAULT_CUSTOMER);
    state.sales.forEach(function (entry) {
      const code = text(entry.customerCode, entry.customerName === 'PT CUSTOMER CONTOH' ? 'CUS' : '');
      const name = text(entry.customerName);
      if (!code && !name) return;
      if (isTbbCnlCustomer(code, name)) return;
      map.set((code || name).toLowerCase(), {
        code: code || generateEntityCode('CUS', []),
        name: name || code,
        address: text(entry.customerAddress),
        identityNo: text(entry.customerIdentityNo)
      });
    });
    return Array.from(map.values()).sort(function (a, b) {
      return (a.name || a.code).localeCompare(b.name || b.code);
    });
  }

  function isTbbCnlCustomer(code, name) {
    const cleanCode = text(code).toUpperCase();
    const cleanName = text(name).toUpperCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
    return cleanCode === 'CUS' || cleanName === 'PT CUSTOMER CONTOH' || cleanName === 'PT CUSTOMER CONTOH';
  }

  function resolveTbbInvoiceCustomer(entry) {
    if (isTbbCnlCustomer(entry?.customerCode, entry?.customerName)) return DEMO_DISTRIBUTION_DEFAULT_CUSTOMER;
    return {
      code: text(entry?.customerCode),
      name: text(entry?.customerName, DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.name),
      address: text(entry?.customerAddress, DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.address),
      identityNo: text(entry?.customerIdentityNo, DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.identityNo)
    };
  }

  function datalistHtml(id, values) {
    return '<datalist id="' + escapeHtml(id) + '">' + values.map(function (value) {
      return '<option value="' + escapeHtml(value) + '"></option>';
    }).join('') + '</datalist>';
  }

  function supplierDatalistsHtml() {
    const options = supplierOptions();
    return datalistHtml('tbbSupplierCodeOptions', options.map(function (item) { return item.code; }).filter(Boolean)) +
      datalistHtml('tbbSupplierNameOptions', options.map(function (item) { return item.name; }).filter(Boolean));
  }

  function fishDatalistsHtml() {
    const options = fishOptions();
    return datalistHtml('tbbFishCodeOptions', options.map(function (item) { return item.code; }).filter(Boolean)) +
      datalistHtml('tbbFishNameOptions', options.map(function (item) { return item.name; }).filter(Boolean));
  }

  function customerDatalistsHtml() {
    const options = customerOptions();
    return datalistHtml('tbbCustomerCodeOptions', options.map(function (item) { return item.code; }).filter(Boolean)) +
      datalistHtml('tbbCustomerNameOptions', options.map(function (item) { return item.name; }).filter(Boolean));
  }

  function defaultPaymentSourceKey() {
    return preferredPaymentSourceKey() || DEMO_DISTRIBUTION_PAYMENT_SOURCES[0].key;
  }

  function paymentSourceLabel(key) {
    const clean = text(key);
    const source = DEMO_DISTRIBUTION_PAYMENT_SOURCES.find(function (item) { return item.key === clean; });
    return source ? source.label : 'BANK BCA';
  }

  function paymentSourceSelectHtml(fieldName, selectedValue, disabled) {
    const selected = text(selectedValue, defaultPaymentSourceKey());
    return '<select data-' + fieldName + '="paymentSourceKey" class="tbb-payment-source"' + (disabled ? ' disabled' : '') + '>' +
      DEMO_DISTRIBUTION_PAYMENT_SOURCES.map(function (source) {
        return '<option value="' + escapeHtml(source.key) + '"' + (source.key === selected ? ' selected' : '') + '>' + escapeHtml(source.label) + '</option>';
      }).join('') +
    '</select>';
  }

  function openInputChoiceModal(type) {
    const isSales = type === 'sales';
    elements.choiceTitle.textContent = isSales ? 'Pilih Input Penjualan' : 'Pilih Input Pembelian';
    elements.choiceMeta.textContent = isSales ? 'Pilih jenis transaksi penjualan.' : 'Pilih jenis transaksi pembelian.';
    elements.choiceTransactionTitle.textContent = isSales ? 'Penjualan' : 'Pembelian';
    elements.choiceTransactionText.textContent = isSales ? 'Input penjualan baru.' : 'Input pembelian baru.';
    elements.choiceSettlementText.textContent = isSales ? 'Lunasi piutang dari faktur penjualan.' : 'Lunasi utang dari faktur pembelian.';
    elements.choiceModal.hidden = false;
  }

  function closeInputChoiceModal() {
    elements.choiceModal.hidden = true;
  }

  function openEntryModal(type, entry, options) {
    const isSales = type === 'sales';
    const readOnly = Boolean(options && options.readOnly);
    state.entryReadOnly = readOnly;
    elements.entryType.value = type;
    elements.entryId.value = entry ? entry.id : '';
    elements.entryTitle.textContent = (readOnly ? 'Detail ' : (entry ? 'Ubah ' : 'Tambah ')) + (isSales ? 'Penjualan' : 'Pembelian');
    elements.entryMeta.textContent = readOnly
      ? 'Tampilan terkunci untuk pengecekan data.'
      : (isSales
        ? 'Input penjualan manual. Pembelian akan memanggil invoice ini.'
        : 'Pilih invoice penjualan, lalu rincian pembelian akan terisi otomatis.');
    const formEntry = entry ? entryWithDisplayedPayments(type, entry) : null;
    elements.entryBody.innerHTML = isSales ? salesFormHtml(formEntry) : purchaseFormHtml(formEntry);
    resetAttachmentInput(type, entry);
    elements.entryModal.hidden = false;
    renderEntryViewActions(type, entry, readOnly);
    applyEntryLineLayout();
    bindEntryModalWindowControls();
    resetEntryModalWindow();
    bindModalInputFormatting();
    if (!entry && !isSales) fillPurchaseFromSelectedSale();
    recalculateModalTotals();
    applyEntryReadOnly(readOnly);
    const focusTarget = readOnly ? null : elements.entryBody.querySelector('input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
    if (focusTarget) focusTarget.focus();
  }

  function closeEntryModal() {
    state.entryReadOnly = false;
    elements.entryModal.hidden = true;
    stopEntryModalDrag();
    elements.entryForm.reset();
    elements.entryBody.innerHTML = '';
    elements.entrySaveButton.hidden = false;
    elements.entrySaveButton.disabled = false;
    elements.entryCancelButton.textContent = 'Batal';
    if (elements.entryViewActions) {
      elements.entryViewActions.hidden = true;
      elements.entryViewActions.innerHTML = '';
    }
    resetAttachmentInput('', null);
    updateEntryLineLayoutButton();
  }

  function setEntryLineLayout(layout) {
    state.entryLineLayout = 'table';
    try {
      window.localStorage.setItem('tbbEntryLineLayout', state.entryLineLayout);
    } catch {
      // Ignore private-mode storage failures; the current popup still switches layout.
    }
    applyEntryLineLayout();
  }

  function applyEntryLineLayout() {
    const isTable = state.entryLineLayout === 'table';
    elements.entryBody?.querySelectorAll('.tbb-lines-section').forEach(function (section) {
      section.classList.toggle('is-table-layout', isTable);
      section.classList.toggle('is-form-layout', !isTable);
    });
    updateEntryLineLayoutButton();
  }

  function updateEntryLineLayoutButton() {
    if (!elements.entryLayoutButton) return;
    elements.entryLayoutButton.hidden = true;
  }

  function activeAttachmentType() {
    const type = elements.entryType?.value || '';
    if (type === 'sales' || type === 'purchases') return type;
    return type === 'sales-settlement' || type === 'purchases-settlement' ? 'settlements' : '';
  }

  function attachmentEndpoint(type, id) {
    const prefix = type === 'settlements' ? '/settlements/' : (type === 'sales' ? '/sales/' : '/purchases/');
    return apiBase() + prefix + encodeURIComponent(id) + '/file';
  }

  function selectedUploadFiles() {
    if (!elements.attachmentFile) return [];
    return typeof window.clientPortalSelectedFiles === 'function'
      ? window.clientPortalSelectedFiles(elements.attachmentFile)
      : Array.from(elements.attachmentFile.files || []);
  }

  function formatAttachmentSize(value) {
    const size = Number(value || 0);
    if (!size) return '0 KB';
    if (size < 1024 * 1024) return Math.max(1, Math.round(size / 1024)) + ' KB';
    return (size / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB';
  }

  function attachmentFileKey(file, index) {
    return text(file && file.id) || [text(file && file.name), Number(file && file.size || 0), index].join('|');
  }

  function ensureAttachmentId(file) {
    if (!file) return file;
    if (file.id) return file;
    const id = 'file-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    return Object.assign({}, file, { id, isNew: true });
  }

  function queueSelectedAttachmentFiles() {
    if (!elements.attachmentFile) return;
    const selected = selectedUploadFiles().map(ensureAttachmentId);
    if (!selected.length) {
      renderAttachmentManager();
      return;
    }
    state.entryAttachmentFiles = (state.entryAttachmentFiles || []).concat(selected);
    state.entryAttachmentDirty = true;
    if (typeof window.clientPortalClearUploadSelection === 'function') {
      window.clientPortalClearUploadSelection(elements.attachmentFile);
    } else {
      elements.attachmentFile.value = '';
    }
    renderAttachmentManager();
  }

  function resetAttachmentInput(type, entry) {
    if (!elements.attachmentFile) return;
    if (typeof window.clientPortalClearUploadSelection === 'function') {
      window.clientPortalClearUploadSelection(elements.attachmentFile);
    } else {
      elements.attachmentFile.value = '';
    }
    elements.attachmentFile.disabled = false;
    elements.attachmentFile.dataset.currentName = entry && entry.hasAttachment ? text(entry.attachmentName, 'File sudah tersimpan') : '';
    if (elements.attachmentName) {
      elements.attachmentName.disabled = false;
      elements.attachmentName.value = entry && entry.hasAttachment ? text(entry.attachmentName) : '';
    }
    state.entryAttachmentFiles = [];
    state.entryAttachmentDirty = false;
    state.entryAttachmentLoading = false;
    state.entryAttachmentLoadFailed = false;
    state.entryAttachmentLoadPromise = null;
    const uploadWrap = elements.attachmentFile.closest('.tbb-footer-upload');
    if (uploadWrap) {
      uploadWrap.classList.toggle('is-readonly', state.entryReadOnly);
      uploadWrap.hidden = type !== 'sales' && type !== 'purchases' && type !== 'settlements';
    }
    renderAttachmentManager();
    if (entry && entry.hasAttachment && (type === 'sales' || type === 'purchases' || type === 'settlements')) {
      loadExistingAttachmentFiles(type, entry.id);
    }
  }

  function updateAttachmentNote() {
    if (!elements.attachmentNote || !elements.attachmentFile) return;
    if (state.entryAttachmentLoading) {
      elements.attachmentNote.textContent = 'Memuat file tersimpan...';
      return;
    }
    if (state.entryAttachmentLoadFailed) {
      elements.attachmentNote.textContent = 'File lama belum bisa dimuat. Refresh halaman sebelum mengubah lampiran.';
      return;
    }
    const files = state.entryAttachmentFiles || [];
    if (files.length) {
      elements.attachmentNote.textContent = typeof window.clientPortalFormatFilesNote === 'function'
        ? window.clientPortalFormatFilesNote(files, 'Lampiran transaksi')
        : (files.length === 1 ? files[0].name : files.length + ' file dipilih.');
      return;
    }
    if (state.entryAttachmentDirty && elements.attachmentFile.dataset.currentName) {
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
    const uploadWrap = elements.attachmentFile.closest('.tbb-footer-upload');
    if (uploadWrap && uploadWrap.hidden) {
      elements.attachmentList.hidden = true;
      return;
    }
    if (uploadWrap) {
      uploadWrap.classList.toggle('is-readonly', state.entryReadOnly);
      const title = uploadWrap.querySelector('.tbb-upload-title strong');
      const subtitle = uploadWrap.querySelector('.tbb-upload-title span');
      if (title) title.textContent = state.entryReadOnly ? 'Dokumen Terupload' : 'Upload Dokumen';
      if (subtitle) subtitle.textContent = state.entryReadOnly ? 'Klik file untuk melihat.' : 'Klik file di daftar untuk melihat, X untuk hapus.';
    }
    const stored = state.entryAttachmentFiles || [];
    const hasAnyAttachment = Boolean(stored.length || elements.attachmentFile.dataset.currentName);
    if (elements.attachmentPickButton) {
      elements.attachmentPickButton.textContent = hasAnyAttachment ? 'Tambahkan Dokumen' : 'Upload Dokumen';
    }
    const qrButton = elements.attachmentFile.parentElement?.querySelector('.client-upload-qr-button');
    if (qrButton) {
      qrButton.textContent = hasAnyAttachment ? 'Tambahkan Dokumen dari HP' : 'Upload dari HP';
    }
    const hasStoredName = Boolean(elements.attachmentFile.dataset.currentName);
    const hasRows = stored.length || state.entryAttachmentLoading || state.entryAttachmentLoadFailed || (state.entryAttachmentDirty && hasStoredName) || (state.entryReadOnly && hasStoredName);
    if (uploadWrap && state.entryReadOnly) uploadWrap.hidden = !hasRows;
    elements.attachmentList.hidden = !hasRows;
    if (!hasRows) return;
    if (state.entryAttachmentLoading) {
      const loading = document.createElement('div');
      loading.className = 'tbb-attachment-row is-loading';
      loading.textContent = 'Memuat daftar file tersimpan...';
      elements.attachmentList.appendChild(loading);
      return;
    }
    if (state.entryAttachmentLoadFailed) {
      const failed = document.createElement('div');
      failed.className = 'tbb-attachment-row is-loading';
      failed.textContent = 'File lama belum bisa dimuat. Refresh halaman sebelum mengubah lampiran.';
      elements.attachmentList.appendChild(failed);
      return;
    }
    stored.forEach(function (file, index) {
      const row = document.createElement('div');
      row.className = 'tbb-attachment-row' + (file.isNew || file.file ? ' is-new' : '');
      row.setAttribute('data-tbb-preview-attachment', attachmentFileKey(file, index));
      row.title = 'Klik untuk melihat file';
      row.innerHTML = '<span title="' + escapeHtml(file.name) + '">' + escapeHtml(file.name) + '</span><small>' + escapeHtml((file.isNew || file.file ? 'baru | ' : '') + formatAttachmentSize(file.size)) + '</small>';
      if (!state.entryReadOnly) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tbb-attachment-remove';
        button.textContent = 'X';
        button.setAttribute('data-tbb-remove-attachment', attachmentFileKey(file, index));
        row.appendChild(button);
      }
      elements.attachmentList.appendChild(row);
    });
    if (state.entryAttachmentDirty && !stored.length && elements.attachmentFile.dataset.currentName) {
      const empty = document.createElement('div');
      empty.className = 'tbb-attachment-row is-loading';
      empty.textContent = 'Semua lampiran lama akan dihapus ketika data disimpan.';
      elements.attachmentList.appendChild(empty);
    }
  }

  function loadExistingAttachmentFiles(type, id) {
    state.entryAttachmentLoading = true;
    renderAttachmentManager();
    const expectedType = type;
    const expectedId = text(id);
    const loadPromise = requestJson(attachmentEndpoint(type, id), { headers: { Accept: 'application/json' } })
      .then(function (data) {
        if (activeAttachmentType() !== expectedType || text(elements.entryId.value) !== expectedId) return;
        const files = typeof window.clientPortalFilesFromResponse === 'function'
          ? window.clientPortalFilesFromResponse(data)
          : [];
        state.entryAttachmentFiles = files;
        elements.attachmentFile.dataset.currentName = files.length
          ? (files.length === 1 ? files[0].name : files.length + ' file')
          : '';
      })
      .catch(function () {
        if (activeAttachmentType() !== expectedType || text(elements.entryId.value) !== expectedId) return;
        state.entryAttachmentFiles = [];
        state.entryAttachmentLoadFailed = true;
      })
      .finally(function () {
        if (activeAttachmentType() !== expectedType || text(elements.entryId.value) !== expectedId) return;
        state.entryAttachmentLoading = false;
        state.entryAttachmentLoadPromise = null;
        renderAttachmentManager();
      });
    state.entryAttachmentLoadPromise = loadPromise;
  }

  async function attachmentPayload() {
    if (!elements.attachmentFile || elements.attachmentFile.disabled || !activeAttachmentType()) return {};
    if (state.entryAttachmentLoadPromise) await state.entryAttachmentLoadPromise;
    const selected = selectedUploadFiles();
    if (selected.length) queueSelectedAttachmentFiles();
    if (state.entryAttachmentLoadFailed && elements.attachmentFile.dataset.currentName && (state.entryAttachmentFiles || []).some(function (file) { return file.isNew || file.file; })) {
      throw new Error('File lama belum berhasil dimuat. Refresh halaman dulu sebelum menambah lampiran.');
    }
    if (!state.entryAttachmentDirty) return {};
    const files = state.entryAttachmentFiles || [];
    if (!files.length) return { clearAttachment: true };
    const attachmentName = text(elements.attachmentName && elements.attachmentName.value);
    let payload = {};
    if (typeof window.clientPortalBuildAttachmentPayloadFromFiles === 'function') {
      payload = await window.clientPortalBuildAttachmentPayloadFromFiles(files);
      if (attachmentName && payload.attachmentDataUrl) payload.attachmentName = attachmentName;
      return payload;
    }
    if (typeof window.clientPortalBuildAttachmentPayload === 'function' && !state.entryAttachmentFiles.length) {
      payload = await window.clientPortalBuildAttachmentPayload(elements.attachmentFile);
      if (attachmentName && payload.attachmentDataUrl) payload.attachmentName = attachmentName;
      return payload;
    }
    throw new Error('Fitur lampiran belum siap. Silakan refresh halaman.');
  }

  function entryModalDialog() {
    return elements.entryModal?.querySelector('.tbb-entry-modal') || null;
  }

  function entryModalLimits() {
    const viewportWidth = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 1024);
    const viewportHeight = Math.max(320, window.innerHeight || document.documentElement.clientHeight || 768);
    return {
      margin: 16,
      minWidth: Math.min(DEMO_DISTRIBUTION_ENTRY_MODAL_MIN_WIDTH, viewportWidth - 32),
      minHeight: Math.min(DEMO_DISTRIBUTION_ENTRY_MODAL_MIN_HEIGHT, viewportHeight - 32),
      maxWidth: Math.max(320, viewportWidth - 32),
      maxHeight: Math.max(320, viewportHeight - 32)
    };
  }

  function clampNumber(value, min, max) {
    return Math.min(Math.max(Number(value) || 0, min), max);
  }

  function resetEntryModalWindow() {
    const dialog = entryModalDialog();
    if (!dialog) return;
    dialog.style.left = '';
    dialog.style.top = '';
    dialog.style.width = '';
    dialog.style.height = '';
    window.requestAnimationFrame(function () {
      if (!dialog || elements.entryModal.hidden) return;
      const limits = entryModalLimits();
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

  function bindEntryModalWindowControls() {
    const dialog = entryModalDialog();
    if (!dialog || state.entryModalWindowBound) return;
    state.entryModalWindowBound = true;
    const header = dialog.querySelector('.portal-modal-header');
    if (header) {
      header.addEventListener('pointerdown', startEntryModalDrag);
      header.addEventListener('dblclick', resetEntryModalWindow);
    }
    window.addEventListener('resize', keepEntryModalInBounds);
  }

  function startEntryModalDrag(event) {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest('button, input, select, textarea, a, [data-tbb-modal-no-drag]')) return;
    const dialog = entryModalDialog();
    if (!dialog || elements.entryModal.hidden) return;
    const rect = dialog.getBoundingClientRect();
    dialog.style.left = rect.left + 'px';
    dialog.style.top = rect.top + 'px';
    dialog.style.width = rect.width + 'px';
    dialog.style.height = rect.height + 'px';
    dialog.style.transform = 'none';
    state.entryModalDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top
    };
    dialog.classList.add('is-dragging');
    event.currentTarget.setPointerCapture?.(event.pointerId);
    window.addEventListener('pointermove', moveEntryModalDrag);
    window.addEventListener('pointerup', stopEntryModalDrag);
    window.addEventListener('pointercancel', stopEntryModalDrag);
    event.preventDefault();
  }

  function moveEntryModalDrag(event) {
    const drag = state.entryModalDrag;
    const dialog = entryModalDialog();
    if (!drag || !dialog) return;
    const limits = entryModalLimits();
    const width = dialog.offsetWidth || limits.minWidth;
    const height = dialog.offsetHeight || limits.minHeight;
    const maxLeft = Math.max(limits.margin, window.innerWidth - width - limits.margin);
    const maxTop = Math.max(limits.margin, window.innerHeight - Math.min(80, height) - limits.margin);
    dialog.style.left = clampNumber(drag.startLeft + event.clientX - drag.startX, limits.margin, maxLeft) + 'px';
    dialog.style.top = clampNumber(drag.startTop + event.clientY - drag.startY, limits.margin, maxTop) + 'px';
  }

  function stopEntryModalDrag() {
    const dialog = entryModalDialog();
    state.entryModalDrag = null;
    if (dialog) dialog.classList.remove('is-dragging');
    window.removeEventListener('pointermove', moveEntryModalDrag);
    window.removeEventListener('pointerup', stopEntryModalDrag);
    window.removeEventListener('pointercancel', stopEntryModalDrag);
    keepEntryModalInBounds();
  }

  function keepEntryModalInBounds() {
    const dialog = entryModalDialog();
    if (!dialog || elements.entryModal.hidden) return;
    const limits = entryModalLimits();
    const rect = dialog.getBoundingClientRect();
    const width = clampNumber(rect.width, limits.minWidth, limits.maxWidth);
    const height = clampNumber(rect.height, limits.minHeight, limits.maxHeight);
    dialog.style.width = width + 'px';
    dialog.style.height = height + 'px';
    dialog.style.left = clampNumber(rect.left, limits.margin, Math.max(limits.margin, window.innerWidth - width - limits.margin)) + 'px';
    dialog.style.top = clampNumber(rect.top, limits.margin, Math.max(limits.margin, window.innerHeight - Math.min(80, height) - limits.margin)) + 'px';
  }

  function applyEntryReadOnly(readOnly) {
    elements.entrySaveButton.hidden = readOnly;
    elements.entrySaveButton.disabled = readOnly;
    elements.entryCancelButton.textContent = readOnly ? 'Tutup' : 'Batal';
    if (elements.attachmentFile) elements.attachmentFile.disabled = readOnly;
    if (elements.attachmentName) elements.attachmentName.disabled = readOnly;
    const uploadWrap = elements.attachmentFile?.closest('.tbb-footer-upload');
    if (uploadWrap) {
      uploadWrap.classList.toggle('is-readonly', readOnly);
      if (!readOnly) {
        uploadWrap.hidden = activeAttachmentType() !== 'sales' && activeAttachmentType() !== 'purchases' && activeAttachmentType() !== 'settlements';
      } else {
        const hasRows = state.entryAttachmentFiles.length || state.entryAttachmentLoading || state.entryAttachmentLoadFailed || elements.attachmentFile.dataset.currentName;
        uploadWrap.hidden = !hasRows;
      }
    }
    elements.entryBody.classList.toggle('is-readonly', readOnly);
    updateEntryLineLayoutButton();
    elements.entryBody.querySelectorAll('input, select, textarea, button[data-tbb-add-line], button[data-tbb-remove-line], button[data-tbb-add-settlement-line], button[data-tbb-remove-settlement-line]').forEach(function (control) {
      control.disabled = readOnly;
    });
  }

  function renderEntryViewActions(type, entry, readOnly) {
    if (!elements.entryViewActions) return;
    if (!readOnly || !entry) {
      elements.entryViewActions.hidden = true;
      elements.entryViewActions.innerHTML = '';
      return;
    }
    elements.entryViewActions.hidden = false;
    elements.entryViewActions.innerHTML = actionsCell(type, entry).innerHTML;
  }

  function firstItem(entry) {
    return entry && Array.isArray(entry.items) && entry.items.length ? entry.items[0] : {};
  }

  function salesFormHtml(entry) {
    const invoiceNo = text(entry?.invoiceNo, state.next.salesInvoiceNo || '');
    const invoiceDate = text(entry?.invoiceDate, today());
    const customerCode = text(entry?.customerCode, DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.code);
    const customerName = text(entry?.customerName, DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.name);
    const customerAddress = text(entry?.customerAddress, DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.address);
    const customerIdentityNo = text(entry?.customerIdentityNo, DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.identityNo);
    const includePph22 = (entry?.items || []).some(function (item) {
      return isCheckedValue(item.includePph22 ?? item.include_pph22, true);
    }) || !(entry?.items || []).length;
    const referenceText = referenceTextValue(entry?.referenceText ?? entry?.reference_text);
    return [
      supplierDatalistsHtml(),
      fishDatalistsHtml(),
      customerDatalistsHtml(),
      '<div class="tbb-form-grid">',
        fieldHtml('No Invoice', '<input data-tbb-field="invoiceNo" value="' + escapeHtml(invoiceNo) + '" readonly>'),
        fieldHtml('Tanggal', '<input data-tbb-field="invoiceDate" type="date" value="' + escapeHtml(invoiceDate) + '" required>'),
        fieldHtml('Kode Customer', '<input data-tbb-field="customerCode" list="tbbCustomerCodeOptions" value="' + escapeHtml(customerCode) + '" required>'),
        fieldHtml('Nama Customer', '<input data-tbb-field="customerName" list="tbbCustomerNameOptions" value="' + escapeHtml(customerName) + '" required>'),
        fieldHtml('Alamat Customer', '<input data-tbb-field="customerAddress" value="' + escapeHtml(customerAddress) + '" placeholder="Alamat customer">', 'wide'),
        fieldHtml('No Identitas', '<input data-tbb-field="customerIdentityNo" value="' + escapeHtml(customerIdentityNo) + '" placeholder="NIK / NPWP">'),
        formCheckHtml('Gross Up', 'Gross Up PPh 22', '<input type="checkbox" data-tbb-field="includePph22All"' + (includePph22 ? ' checked' : '') + '>'),
        formCheckHtml('Pelunasan Semua', 'Lunasi semua baris', '<input type="checkbox" data-tbb-field="settleAll">'),
      '</div>',
      linesSectionHtml('sales', entry?.items || [], includePph22),
      salesSummaryHtml(referenceText),
      fieldHtml('Catatan', '<textarea data-tbb-field="notes" rows="3">' + escapeHtml(entry?.notes || '') + '</textarea>', 'full')
    ].join('');
  }

  function purchaseFormHtml(entry) {
    const documentNo = text(entry?.documentNo, state.next.purchaseDocumentNo || '');
    const purchaseDate = text(entry?.purchaseDate, today());
    const currentPurchaseId = text(entry?.id || elements.entryId?.value);
    const defaultSalesInvoiceNo = firstAvailableSalesInvoiceNo(currentPurchaseId) || 'Manual';
    const salesInvoiceNo = text(entry?.salesInvoiceNo, defaultSalesInvoiceNo);
    return [
      supplierDatalistsHtml(),
      fishDatalistsHtml(),
      '<div class="tbb-form-grid">',
        fieldHtml('No Dok', '<input data-tbb-field="documentNo" value="' + escapeHtml(documentNo) + '" readonly>'),
        fieldHtml('Tanggal', '<input data-tbb-field="purchaseDate" type="date" value="' + escapeHtml(purchaseDate) + '" required>'),
        fieldHtml('No Invoice Penjualan', salesInvoiceSelectHtml(salesInvoiceNo, currentPurchaseId)),
      '</div>',
      '<div class="tbb-inline-note">Harga beli otomatis mengikuti harga jual - 20 saat data ditarik dari penjualan. Nilainya tetap bisa diedit.</div>',
      linesSectionHtml('purchases', entry?.items || []),
      totalsHtml('purchases'),
      fieldHtml('Catatan', '<textarea data-tbb-field="notes" rows="3">' + escapeHtml(entry?.notes || '') + '</textarea>', 'full')
    ].join('');
  }

  function fieldHtml(label, control, variant) {
    return '<label class="form-field ' + (variant || '') + '"><span>' + escapeHtml(label) + '</span>' + control + '</label>';
  }

  function formCheckHtml(label, controlLabel, inputHtml, variant) {
    return '<div class="form-field ' + (variant || '') + '"><span>' + escapeHtml(label) + '</span><label class="tbb-checkline">' + inputHtml + '<span>' + escapeHtml(controlLabel) + '</span></label></div>';
  }

  function salesInvoiceSelectHtml(selectedValue, currentPurchaseId) {
    const selectedValueText = text(selectedValue);
    const options = [
      '<option value="Manual"' + (selectedValueText === 'Manual' ? ' selected' : '') + '>Manual</option>',
      '<option value=""' + (!selectedValueText ? ' selected' : '') + '>Pilih invoice penjualan</option>'
    ].concat(availableSalesForPurchase(selectedValueText, currentPurchaseId).map(function (sale) {
      const selected = text(sale.invoiceNo) === selectedValueText ? ' selected' : '';
      const remainingQty = saleRemainingQty(sale, currentPurchaseId);
      return '<option value="' + escapeHtml(sale.invoiceNo) + '"' + selected + '>' +
        escapeHtml([sale.invoiceNo, formatDate(sale.invoiceDate), sale.customerName || 'PT CUSTOMER CONTOH', 'sisa ' + formatDecimal(remainingQty)].filter(Boolean).join(' | ')) +
      '</option>';
    }));
    return '<select data-tbb-field="salesInvoiceNo" required>' + options.join('') + '</select>';
  }

  function openSettlementModal(type, options) {
    const isSales = type === 'sales';
    state.entryReadOnly = false;
    const lockedInvoiceNo = text(options && options.lockedInvoiceNo);
    elements.entryType.value = isSales ? 'sales-settlement' : 'purchases-settlement';
    elements.entryId.value = '';
    elements.entryTitle.textContent = 'Tambah Pelunasan ' + (isSales ? 'Penjualan' : 'Pembelian');
    elements.entryMeta.textContent = isSales
      ? 'Lunasi piutang dari faktur atau customer.'
      : 'Lunasi utang dari faktur atau supplier.';
    elements.entryBody.innerHTML = settlementFormHtml(type, lockedInvoiceNo);
    resetAttachmentInput('settlements', null);
    elements.entryModal.hidden = false;
    renderEntryViewActions(type, null, false);
    updateEntryLineLayoutButton();
    bindEntryModalWindowControls();
    resetEntryModalWindow();
    elements.entrySaveButton.hidden = false;
    elements.entrySaveButton.disabled = false;
    elements.entryCancelButton.textContent = 'Batal';
    bindModalInputFormatting();
    recalculateModalTotals();
    const focusTarget = elements.entryBody.querySelector('input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([disabled])');
    if (focusTarget) focusTarget.focus();
  }

  function openSettlementForEntry(type, entry) {
    if (!entry) return;
    const outstanding = outstandingByInvoice(type, entry);
    if (outstanding <= 0.0001) {
      setAlert((type === 'sales' ? 'Piutang' : 'Hutang') + ' invoice ini sudah LUNAS.', 'success');
      return;
    }
    openSettlementModal(type, { lockedInvoiceNo: settlementInvoiceNo(type, entry) });
  }

  function activeSettlementBaseType() {
    return elements.entryType.value === 'purchases-settlement' ? 'purchases' : 'sales';
  }

  function linePaymentBase(type, item) {
    const amount = parseAmount(item && item.amount);
    return type === 'sales'
      ? calculateSalesBillableAmount(amount, isCheckedValue(item && (item.includePph22 ?? item.include_pph22), true))
      : amount;
  }

  function entryWithDisplayedPayments(type, entry) {
    if (!entry) return null;
    const invoiceNo = type === 'sales' ? entry.invoiceNo : entry.documentNo;
    let remainingSettlement = settlementPaidByInvoice(type, invoiceNo);
    if (remainingSettlement <= 0.0001) return entry;
    const items = (entry.items || []).map(function (item) { return Object.assign({}, item); });
    items.forEach(function (item) {
      const base = linePaymentBase(type, item);
      const directPaid = parseAmount(item.paymentAmount ?? item.payment_amount ?? item.pelunasan);
      const remainingBase = Math.max(0, roundAmount(base - directPaid));
      const settlementLinePaid = Math.min(remainingBase, remainingSettlement);
      item.settlementPaid = Math.max(0, roundAmount(settlementLinePaid));
      item.paymentAmount = roundAmount(directPaid + item.settlementPaid);
      remainingSettlement = Math.max(0, roundAmount(remainingSettlement - settlementLinePaid));
    });
    return Object.assign({}, entry, { items });
  }

  function settlementFormHtml(type, lockedInvoiceNo) {
    const isSales = type === 'sales';
    const documentNo = isSales ? state.next.salesSettlementNo : state.next.purchaseSettlementNo;
    const locked = text(lockedInvoiceNo);
    return [
      customerDatalistsHtml(),
      supplierDatalistsHtml(),
      '<div class="tbb-form-grid">',
        fieldHtml('Tanggal', '<input data-tbb-field="settlementDate" type="date" value="' + escapeHtml(today()) + '" required>'),
        fieldHtml('No Dokumen', '<input data-tbb-field="settlementDocumentNo" value="' + escapeHtml(documentNo || '') + '" readonly>'),
        fieldHtml('Keterangan', '<input data-tbb-field="settlementNotes" value="">'),
      '</div>',
      '<div class="tbb-settlement-mode" role="radiogroup" aria-label="Mode pelunasan"' + (locked ? ' hidden' : '') + '>',
        '<label><input type="radio" name="tbbSettlementMode" data-tbb-field="settlementMode" value="invoice" checked><span>Faktur</span></label>',
        '<label><input type="radio" name="tbbSettlementMode" data-tbb-field="settlementMode" value="entity"><span>' + escapeHtml(isSales ? 'Customer' : 'Supplier') + '</span></label>',
      '</div>',
      settlementSectionHtml(type, 'invoice', [blankSettlementLine({ invoiceNo: locked, lockedInvoice: Boolean(locked) })])
    ].join('');
  }

  function blankSettlementLine(defaults) {
    return Object.assign({
      entityCode: '',
      entityName: '',
      invoiceNo: '',
      openAmount: '',
      amount: '',
      paymentSourceKey: defaultPaymentSourceKey(),
      settleAll: false,
      lockedInvoice: false
    }, defaults || {});
  }

  function settlementSectionHtml(type, mode, lines) {
    const isEntity = mode === 'entity';
    const labels = [
      type === 'sales' ? 'Kode Customer' : 'Kode Supplier',
      type === 'sales' ? 'Nama Customer' : 'Nama Supplier',
      type === 'sales' ? 'Inv Penjualan' : 'Inv Pembelian',
      type === 'sales' ? 'Total Piutang' : 'Total Utang',
      'Lunas',
      'Jumlah Pelunasan',
      'Jenis Bank',
      ''
    ];
    const rows = (lines && lines.length ? lines : [blankSettlementLine()]).map(function (line) {
      return settlementLineHtml(type, mode, line);
    }).join('');
    const locked = (lines || []).some(function (line) { return line.lockedInvoice; });
    return '<section class="tbb-settlement-section is-' + mode + '" data-tbb-settlement-section data-mode="' + escapeHtml(mode) + '">' +
      '<header><h3>Rincian Pelunasan</h3><button class="ghost-button" type="button" data-tbb-add-settlement-line' + (locked ? ' hidden' : '') + '>Tambah Baris</button></header>' +
      '<div class="tbb-settlement-head">' + labels.map(function (label) { return '<span>' + escapeHtml(label) + '</span>'; }).join('') + '</div>' +
      '<div class="tbb-settlement-list">' + rows + '</div>' +
      totalsHtml('settlement') +
    '</section>';
  }

  function settlementLineHtml(type, mode, line) {
    const isEntity = mode === 'entity';
    const entityReadOnly = isEntity ? '' : ' readonly';
    const entityControls = [
      '<input data-settlement-field="entityCode" list="' + (type === 'sales' ? 'tbbCustomerCodeOptions' : 'tbbSupplierCodeOptions') + '" value="' + escapeHtml(line.entityCode || '') + '" placeholder="' + (type === 'sales' ? 'CUS' : 'SUP-001') + '"' + entityReadOnly + '>',
      '<input data-settlement-field="entityName" list="' + (type === 'sales' ? 'tbbCustomerNameOptions' : 'tbbSupplierNameOptions') + '" value="' + escapeHtml(line.entityName || '') + '" placeholder="' + (type === 'sales' ? 'Nama customer' : 'Nama supplier') + '"' + entityReadOnly + '>'
    ];
    const invoiceSelect = settlementInvoiceSelectHtml(type, mode, line.invoiceNo, line.entityCode, line.entityName, line.lockedInvoice);
    const controls = entityControls.concat([
      invoiceSelect,
      '<input data-settlement-field="openAmount" data-rupiah="true" value="' + escapeHtml(formatInputMoney(line.openAmount)) + '" readonly>',
      '<label class="tbb-check-cell" title="Lunasi semua"><input type="checkbox" data-settlement-field="settleAll"' + (line.settleAll ? ' checked' : '') + '></label>',
      '<input data-settlement-field="amount" data-rupiah="true" inputmode="decimal" value="' + escapeHtml(formatInputMoney(line.amount)) + '" placeholder="Jumlah">',
      paymentSourceSelectHtml('settlement-field', line.paymentSourceKey || line.payment_source_key || line.jenisBank || line.jenis_bank, false),
      '<button class="icon-button tbb-line-remove" type="button" data-tbb-remove-settlement-line aria-label="Hapus baris"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>'
    ]);
    return '<div class="tbb-settlement-row' + (line.lockedInvoice ? ' is-locked-invoice' : '') + '">' + controls.join('') + '</div>';
  }

  function settlementInvoiceSelectHtml(type, mode, selectedValue, entityCode, entityName, locked) {
    const selected = text(selectedValue);
    const entries = settlementEntriesForType(type).filter(function (entry) {
      if (mode !== 'entity') return true;
      if (!entityCode && !entityName) return true;
      const entryCode = settlementEntityCode(type, entry).toLowerCase();
      const entryName = settlementEntityName(type, entry).toLowerCase();
      return (entityCode && entryCode === text(entityCode).toLowerCase())
        || (!entityCode && entityName && entryName === text(entityName).toLowerCase());
    });
    const options = ['<option value="">Pilih faktur</option>'];
    if (mode === 'entity') options.push('<option value="Manual"' + (selected === 'Manual' ? ' selected' : '') + '>Manual</option>');
    entries.forEach(function (entry) {
      const invoiceNo = settlementInvoiceNo(type, entry);
      const isSelected = invoiceNo === selected ? ' selected' : '';
      const outstanding = outstandingForSettlementInvoice(type, entry);
      if (outstanding <= 0.0001 && !isSelected) return;
      const label = [invoiceNo, formatDate(settlementInvoiceDate(type, entry)), settlementEntityName(type, entry), formatAmountZero(outstanding)].filter(Boolean).join(' | ');
      options.push('<option value="' + escapeHtml(invoiceNo) + '"' + isSelected + '>' + escapeHtml(label) + '</option>');
    });
    return '<select data-settlement-field="invoiceNo" required' + (locked ? ' disabled' : '') + '>' + options.join('') + '</select>' +
      (locked ? '<input type="hidden" data-settlement-field="invoiceNo" value="' + escapeHtml(selected) + '">' : '');
  }

  function linesSectionHtml(type, items, grossUp) {
    const mode = type === 'sales' ? 'sales' : 'purchases';
    const rows = (items && items.length ? items : [blankLine()]).map(function (item) {
      return lineRowHtml(mode, item);
    }).join('');
    const labels = mode === 'sales'
      ? ['Kode Supplier', 'Nama Supplier', 'Kode Ikan', 'Nama Ikan', 'Qty', 'Satuan', 'Harga Satuan', { label: 'Harga Gross Up', className: 'tbb-gross-field' }, 'Jumlah', 'Pelunasan', 'Lunas', 'Jenis Bank', '']
      : ['Kode Supplier', 'Nama Supplier', 'Kode Ikan', 'Nama Ikan', 'Qty', 'Satuan', 'Harga Satuan', 'Jumlah', 'Pelunasan', 'Lunas', 'Jenis Bank', ''];
    const layoutClass = state.entryLineLayout === 'table' ? 'is-table-layout' : 'is-form-layout';
    return '<section class="tbb-lines-section is-' + mode + ' ' + layoutClass + (mode === 'sales' && grossUp ? ' is-gross-up' : '') + '">' +
      '<header><h3>Rincian Ikan</h3><button class="ghost-button" type="button" data-tbb-add-line>Tambah Baris</button></header>' +
      '<div class="tbb-line-head">' +
        labels.map(function (item) {
          const label = typeof item === 'string' ? item : item.label;
          const className = typeof item === 'string' ? '' : ' class="' + escapeHtml(item.className || '') + '"';
          return '<span' + className + '>' + escapeHtml(label) + '</span>';
        }).join('') +
      '</div>' +
      '<div class="tbb-lines-list">' + rows + '</div>' +
    '</section>';
  }

  function blankLine(defaults) {
    return Object.assign({
      supplierCode: '',
      supplierName: '',
      fishCode: '',
      fishName: '',
      qty: '',
      unit: 'Kg',
      unitPrice: '',
      amount: '',
      paymentAmount: '',
      paymentSourceKey: defaultPaymentSourceKey(),
      paymentAuto: false,
      includePph22: true,
      priceMode: '',
      sourceSalesId: '',
      sourceSalesNo: ''
    }, defaults || {});
  }

  function resolveLinePriceMode(mode, item) {
    if (mode !== 'sales') return 'unit';
    if (item.priceMode === 'total') return 'total';
    if (item.priceMode === 'unit') return Number(item.unitPrice || 0) || Number(item.amount || 0) ? 'unit' : '';
    if (Number(item.unitPrice || 0)) return 'unit';
    if (Number(item.amount || 0)) return 'total';
    return '';
  }

  function lineFieldHtml(label, control, className) {
    return '<label class="tbb-line-field ' + (className || '') + '">' +
      '<span>' + escapeHtml(label) + '</span>' +
      control +
    '</label>';
  }

  function lineCheckFieldHtml(label, control, className) {
    return '<div class="tbb-line-field tbb-line-field-check ' + (className || '') + '">' +
      '<span>' + escapeHtml(label) + '</span>' +
      control +
    '</div>';
  }

  function lineRowHtml(mode, item) {
    const priceMode = resolveLinePriceMode(mode, item);
    const unitReadOnly = mode === 'sales' && priceMode === 'total' ? ' readonly' : '';
    const amountReadOnly = mode !== 'sales' || priceMode === 'unit' ? ' readonly' : '';
    const paymentAmount = parseAmount(item.paymentAmount ?? item.payment_amount ?? item.pelunasan);
    const paymentBase = linePaymentBase(mode, item);
    const paymentAuto = isCheckedValue(item.paymentAuto ?? item.payment_auto, false) ||
      (paymentBase > 0 && paymentAmount >= paymentBase - 0.0001);
    const paymentReadOnly = '';
    const sourceAttrs = [
      'data-source-sales-id="' + escapeHtml(item.sourceSalesId || '') + '"',
      'data-source-sales-no="' + escapeHtml(item.sourceSalesNo || '') + '"',
      'data-price-mode="' + escapeHtml(priceMode) + '"',
      'data-settlement-paid="' + escapeHtml(formatInputNumber(item.settlementPaid || item.settlement_paid || 0)) + '"',
      'data-settlement-replaced="false"'
    ].join(' ');
    const common = [
      lineFieldHtml('Kode Supplier', '<input data-line-field="supplierCode" list="tbbSupplierCodeOptions" value="' + escapeHtml(item.supplierCode || '') + '" placeholder="A123">', 'is-supplier-code'),
      lineFieldHtml('Nama Supplier', '<input data-line-field="supplierName" list="tbbSupplierNameOptions" value="' + escapeHtml(item.supplierName || '') + '" placeholder="Nama supplier">', 'is-wide is-supplier-name'),
      lineFieldHtml('Kode Ikan', '<input data-line-field="fishCode" list="tbbFishCodeOptions" value="' + escapeHtml(item.fishCode || '') + '" placeholder="IKN-001">', 'is-fish-code'),
      lineFieldHtml('Nama Ikan', '<input data-line-field="fishName" list="tbbFishNameOptions" value="' + escapeHtml(item.fishName || '') + '" placeholder="Nama ikan">', 'is-wide is-fish-name'),
      lineFieldHtml('Qty', '<input data-line-field="qty" inputmode="decimal" data-number-format="decimal" value="' + escapeHtml(formatInputNumber(item.qty)) + '">', 'is-short is-qty'),
      lineFieldHtml('Satuan', '<input data-line-field="unit" value="' + escapeHtml(item.unit || 'Kg') + '">', 'is-short is-unit')
    ];
    const salesControls = mode === 'sales'
      ? [
        lineFieldHtml('Harga Satuan', '<input data-line-field="unitPrice" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatInputMoney(item.unitPrice)) + '" placeholder="Harga jual"' + unitReadOnly + '>', 'is-money is-unit-price'),
        lineFieldHtml('Harga Gross Up', '<input data-line-field="grossUnitPrice" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatInputMoney(item.grossUnitPrice || item.gross_unit_price)) + '" placeholder="Otomatis" readonly>', 'is-money is-gross-unit-price tbb-gross-field'),
        lineFieldHtml('Jumlah', '<input data-line-field="amount" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatInputMoney(item.amount)) + '" placeholder="Total"' + amountReadOnly + '>', 'is-money is-amount'),
        lineFieldHtml('Pelunasan', '<input data-line-field="paymentAmount" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatInputMoney(paymentAmount)) + '" placeholder="Pelunasan"' + paymentReadOnly + '>', 'is-money is-payment'),
        lineCheckFieldHtml('Lunas', '<label class="tbb-check-cell" title="Lunasi baris"><input type="checkbox" data-line-field="paymentAuto"' + (paymentAuto ? ' checked' : '') + '></label>', 'is-short is-paid'),
        lineFieldHtml('Jenis Bank', paymentSourceSelectHtml('line-field', item.paymentSourceKey || item.payment_source_key || item.jenisBank || item.jenis_bank, false), 'is-bank')
      ]
      : [
        lineFieldHtml('Harga Satuan', '<input data-line-field="unitPrice" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatInputMoney(item.unitPrice)) + '" placeholder="Harga beli"' + unitReadOnly + '>', 'is-money is-unit-price'),
        lineFieldHtml('Jumlah', '<input data-line-field="amount" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatInputMoney(item.amount)) + '" placeholder="Total"' + amountReadOnly + '>', 'is-money is-amount'),
        lineFieldHtml('Pelunasan', '<input data-line-field="paymentAmount" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatInputMoney(paymentAmount)) + '" placeholder="Pelunasan"' + paymentReadOnly + '>', 'is-money is-payment'),
        lineCheckFieldHtml('Lunas', '<label class="tbb-check-cell" title="Lunasi baris"><input type="checkbox" data-line-field="paymentAuto"' + (paymentAuto ? ' checked' : '') + '></label>', 'is-short is-paid'),
        lineFieldHtml('Jenis Bank', paymentSourceSelectHtml('line-field', item.paymentSourceKey || item.payment_source_key || item.jenisBank || item.jenis_bank, false), 'is-bank')
      ];
    return '<div class="tbb-line-row" ' + sourceAttrs + '>' +
      common.concat(salesControls).join('') +
      '<button class="icon-button tbb-line-remove" type="button" data-tbb-remove-line aria-label="Hapus baris"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>' +
    '</div>';
  }

  function salesSummaryHtml(referenceText) {
    return '<section class="tbb-sales-summary">' +
      referenceEditorHtml(referenceText) +
      totalsHtml('sales') +
    '</section>';
  }

  function referenceEditorHtml(referenceText) {
    return fieldHtml('Referensi', '<textarea data-tbb-field="referenceText" rows="5">' + escapeHtml(referenceTextValue(referenceText)) + '</textarea>', 'tbb-reference-field');
  }

  function totalsHtml(type) {
    if (type === 'settlement') {
      return '<div class="tbb-total-grid compact">' +
        '<span>Total Pelunasan</span><strong data-tbb-total="settlementTotal">0</strong>' +
      '</div>';
    }
    if (type === 'sales') {
      return '<div class="tbb-total-grid">' +
        '<span>Jumlah</span><strong data-tbb-total="lineTotal">0</strong>' +
        '<span>DPP</span><strong data-tbb-total="dpp">0</strong>' +
        '<span>PPN</span><strong data-tbb-total="ppn">0</strong>' +
        '<span>PPh 22</span><strong data-tbb-total="pph22">0</strong>' +
        '<span>Nilai Yang Ditagih</span><strong data-tbb-total="totalTagihan">0</strong>' +
      '</div>';
    }
    return '<div class="tbb-total-grid compact">' +
      '<span>Total</span><strong data-tbb-total="totalTagihan">0</strong>' +
    '</div>';
  }

  function bindModalInputFormatting() {
    elements.entryBody.querySelectorAll('[data-rupiah="true"], [data-number-format="decimal"]').forEach(function (input) {
      input.addEventListener('blur', function () {
        const amount = parseAmount(input.value);
        input.value = amount ? (input.matches('[data-number-format="decimal"]') ? decimalFormat.format(amount) : formatInputMoney(amount)) : '';
      });
    });
  }

  function recalculateModalTotals(changedInput) {
    if (elements.entryType.value === 'sales-settlement' || elements.entryType.value === 'purchases-settlement') {
      recalculateSettlementTotals(changedInput);
      return;
    }
    const rows = Array.from(elements.entryBody.querySelectorAll('.tbb-line-row'));
    let lineTotal = 0;
    let dppTotal = 0;
    let pph22Total = 0;
    const type = elements.entryType.value;
    if (type === 'sales') updateGrossUpVisibility();
    rows.forEach(function (row) {
      const amount = recalculateLine(row, type, changedInput);
      lineTotal += amount;
      if (type === 'sales') {
        const taxes = calculateSalesLineTaxes(amount, globalIncludePph22());
        dppTotal += taxes.dpp;
        pph22Total += taxes.pph22;
      }
    });
    if (type === 'sales') {
      const dpp = roundAmount(dppTotal);
      const ppn = 0;
      const pph22 = roundAmount(pph22Total);
      const totalTagihan = Math.max(0, roundAmount(dpp - pph22));
      syncSettleAllControlFromRows(rows);
      setTotal('lineTotal', lineTotal);
      setTotal('dpp', dpp);
      setTotal('ppn', ppn);
      setTotal('pph22', pph22);
      setTotal('totalTagihan', totalTagihan);
      return;
    }
    setTotal('totalTagihan', lineTotal);
  }

  function syncSettleAllControlFromRows(rows) {
    const settleAllInput = elements.entryBody.querySelector('[data-tbb-field="settleAll"]');
    if (!settleAllInput) return;
    const rowChecks = (rows || []).map(function (row) {
      return row.querySelector('[data-line-field="paymentAuto"]');
    }).filter(Boolean);
    settleAllInput.checked = Boolean(rowChecks.length) && rowChecks.every(function (input) {
      return input.checked;
    });
  }

  function calculateSalesLineTaxes(amount, includePph22) {
    const lineAmount = roundRupiah(amount);
    if (lineAmount <= 0) return { dpp: 0, pph22: 0, totalTagihan: 0 };
    const dpp = lineAmount;
    const pph22 = roundRupiah(dpp * 0.0025);
    return { dpp, pph22, totalTagihan: Math.max(0, roundRupiah(dpp - pph22)) };
  }

  function calculateSalesBillableAmount(amount, includePph22) {
    return calculateSalesLineTaxes(amount, includePph22).totalTagihan;
  }

  function calculateGrossSalesAmountFromNet(qty, unitPrice) {
    const netAmount = roundAmount(Number(qty || 0) * Number(unitPrice || 0));
    return netAmount > 0 ? roundAmount(netAmount / 0.9975) : 0;
  }

  function calculateGrossUnitPriceFromAmount(amount, qty) {
    const cleanQty = Number(qty || 0);
    return cleanQty > 0 ? roundAmount(Number(amount || 0) / cleanQty) : 0;
  }

  function recalculateLine(row, type, changedInput) {
    const qtyInput = row.querySelector('[data-line-field="qty"]');
    const unitPriceInput = row.querySelector('[data-line-field="unitPrice"]');
    const grossUnitPriceInput = row.querySelector('[data-line-field="grossUnitPrice"]');
    const amountInput = row.querySelector('[data-line-field="amount"]');
    const qty = parseAmount(qtyInput?.value);
    const changedField = changedInput && row.contains(changedInput)
      ? changedInput.getAttribute('data-line-field')
      : '';
    if (type !== 'sales') {
      const unitPrice = parseAmount(unitPriceInput?.value);
      const amount = roundAmount(qty * unitPrice);
      if (amountInput) {
        amountInput.readOnly = true;
        amountInput.value = amount ? formatInputMoney(amount) : '';
      }
      if (unitPriceInput) unitPriceInput.readOnly = false;
      row.setAttribute('data-price-mode', 'unit');
      syncRowPayment(row, amount);
      return amount;
    }

    let priceMode = row.getAttribute('data-price-mode') || '';
    const grossUp = globalIncludePph22();
    if (changedField === 'unitPrice') priceMode = text(unitPriceInput?.value) ? 'unit' : '';
    else if (changedField === 'amount') priceMode = text(amountInput?.value) ? 'total' : '';
    else if (!priceMode) {
      if (parseAmount(unitPriceInput?.value) > 0) priceMode = 'unit';
      else if (parseAmount(amountInput?.value) > 0) priceMode = 'total';
    }

    let amount = parseAmount(amountInput?.value);
    if (priceMode === 'unit') {
      const unitPrice = parseAmount(unitPriceInput?.value);
      amount = grossUp ? calculateGrossSalesAmountFromNet(qty, unitPrice) : roundAmount(qty * unitPrice);
      const grossUnitPrice = grossUp ? calculateGrossUnitPriceFromAmount(amount, qty) : 0;
      if (amountInput) {
        amountInput.readOnly = true;
        amountInput.value = amount ? formatInputMoney(amount) : '';
      }
      if (grossUnitPriceInput) grossUnitPriceInput.value = grossUnitPrice ? formatInputMoney(grossUnitPrice) : '';
      if (unitPriceInput) unitPriceInput.readOnly = false;
    } else if (priceMode === 'total') {
      amount = roundAmount(parseAmount(amountInput?.value));
      const grossUnitPrice = qty > 0 ? roundAmount(amount / qty) : 0;
      const unitPrice = grossUp ? roundAmount(grossUnitPrice * 0.9975) : grossUnitPrice;
      if (unitPriceInput) {
        unitPriceInput.readOnly = true;
        unitPriceInput.value = unitPrice ? formatInputMoney(unitPrice) : '';
      }
      if (grossUnitPriceInput) grossUnitPriceInput.value = grossUp && grossUnitPrice ? formatInputMoney(grossUnitPrice) : '';
      if (amountInput) amountInput.readOnly = false;
    } else {
      if (unitPriceInput) unitPriceInput.readOnly = false;
      if (amountInput) amountInput.readOnly = false;
      if (grossUnitPriceInput) grossUnitPriceInput.value = '';
      amount = roundAmount(parseAmount(amountInput?.value));
    }
    row.setAttribute('data-price-mode', priceMode);
    row.classList.toggle('is-total-mode', priceMode === 'total');
    row.classList.toggle('is-unit-mode', priceMode === 'unit');
    row.classList.toggle('is-gross-up', grossUp);
    syncRowPayment(row, amount, type, changedField);
    return amount;
  }

  function syncRowPayment(row, amount, type, changedField) {
    const autoInput = row.querySelector('[data-line-field="paymentAuto"]');
    const paymentInput = row.querySelector('[data-line-field="paymentAmount"]');
    const sourceInput = row.querySelector('[data-line-field="paymentSourceKey"]');
    const billableAmount = type === 'sales'
      ? calculateSalesBillableAmount(amount, globalIncludePph22())
      : amount;
    if (!autoInput || !paymentInput) {
      if (sourceInput) sourceInput.disabled = false;
      return;
    }
    paymentInput.readOnly = false;
    if (changedField === 'paymentAmount') {
      const paymentAmount = parseAmount(paymentInput.value);
      autoInput.checked = billableAmount > 0 && paymentAmount >= billableAmount - 0.0001;
    }
    if (autoInput.checked && changedField !== 'paymentAmount') {
      paymentInput.value = billableAmount ? formatInputMoney(billableAmount) : '';
      if (sourceInput) {
        sourceInput.disabled = false;
        if (!sourceInput.value) sourceInput.value = defaultPaymentSourceKey();
      }
      return;
    }
    const paymentAmount = parseAmount(paymentInput.value);
    if (sourceInput) {
      sourceInput.disabled = false;
      if (paymentAmount > 0 && !sourceInput.value) sourceInput.value = defaultPaymentSourceKey();
    }
  }

  function updateGrossUpVisibility() {
    const grossUp = globalIncludePph22();
    elements.entryBody.querySelectorAll('.tbb-lines-section.is-sales').forEach(function (section) {
      section.classList.toggle('is-gross-up', grossUp);
    });
  }

  function applySettleAll(checked) {
    const isChecked = Boolean(checked);
    Array.from(elements.entryBody.querySelectorAll('.tbb-line-row')).forEach(function (row) {
      const autoInputs = Array.from(row.querySelectorAll('[data-line-field="paymentAuto"]'));
      const paymentInput = row.querySelector('[data-line-field="paymentAmount"]');
      const sourceInput = row.querySelector('[data-line-field="paymentSourceKey"]');
      if (parseAmount(row.getAttribute('data-settlement-paid')) > 0) {
        row.setAttribute('data-settlement-replaced', 'true');
      }
      autoInputs.forEach(function (autoInput) {
        autoInput.checked = isChecked;
        autoInput.defaultChecked = isChecked;
      });
      if (!isChecked && paymentInput) {
        paymentInput.readOnly = false;
        paymentInput.value = '';
      }
      if (!isChecked && sourceInput && parseAmount(paymentInput?.value) <= 0) {
        sourceInput.value = sourceInput.value || defaultPaymentSourceKey();
      }
    });
    recalculateModalTotals();
  }

  function recalculateSettlementTotals(changedInput) {
    const type = activeSettlementBaseType();
    let total = 0;
    Array.from(elements.entryBody.querySelectorAll('.tbb-settlement-row')).forEach(function (row) {
      total += recalculateSettlementRow(row, type, changedInput);
    });
    setTotal('settlementTotal', total);
  }

  function recalculateSettlementRow(row, type, changedInput) {
    const mode = settlementMode();
    const invoiceInput = row.querySelector('[data-settlement-field="invoiceNo"]');
    const openInput = row.querySelector('[data-settlement-field="openAmount"]');
    const amountInput = row.querySelector('[data-settlement-field="amount"]');
    const settleAllInput = row.querySelector('[data-settlement-field="settleAll"]');
    const entityCodeInput = row.querySelector('[data-settlement-field="entityCode"]');
    const entityNameInput = row.querySelector('[data-settlement-field="entityName"]');
    const entityCode = entityCodeInput?.value || '';
    const entityName = entityNameInput?.value || '';
    const invoiceNo = invoiceInput?.value || '';
    let openAmount = 0;
    if (invoiceNo === 'Manual') {
      openAmount = outstandingByEntity(type, entityCode, entityName);
    } else if (invoiceNo) {
      const entry = findSettlementEntry(type, invoiceNo);
      if (entry) {
        if (entityCodeInput) entityCodeInput.value = settlementEntityCode(type, entry);
        if (entityNameInput) entityNameInput.value = settlementEntityName(type, entry);
        openAmount = outstandingForSettlementInvoice(type, entry);
      }
    }
    if (openInput) openInput.value = openAmount ? formatInputMoney(openAmount) : '';
    if (settleAllInput?.checked) {
      if (amountInput) {
        amountInput.readOnly = true;
        amountInput.value = openAmount ? formatInputMoney(openAmount) : '';
      }
      return openAmount;
    }
    if (amountInput) amountInput.readOnly = false;
    return roundAmount(parseAmount(amountInput?.value));
  }

  function settlementMode() {
    return elements.entryBody.querySelector('[data-tbb-field="settlementMode"]:checked')?.value || 'invoice';
  }

  function settlementEntriesForType(type) {
    return type === 'purchases' ? state.purchases : state.sales;
  }

  function settlementInvoiceNo(type, entry) {
    return type === 'purchases' ? text(entry.documentNo) : text(entry.invoiceNo);
  }

  function settlementInvoiceDate(type, entry) {
    return type === 'purchases' ? text(entry.purchaseDate) : text(entry.invoiceDate);
  }

  function settlementEntityCode(type, entry) {
    return type === 'purchases' ? text(entry.supplierCode) : text(entry.customerCode, 'CUS');
  }

  function settlementEntityName(type, entry) {
    return type === 'purchases' ? text(entry.supplierName) : text(entry.customerName, 'PT CUSTOMER CONTOH');
  }

  function findSettlementEntry(type, invoiceNo) {
    const clean = text(invoiceNo).toLowerCase();
    return settlementEntriesForType(type).find(function (entry) {
      return settlementInvoiceNo(type, entry).toLowerCase() === clean;
    }) || null;
  }

  function settlementEntryTotal(type, entry) {
    return type === 'purchases'
      ? roundAmount(entry.totalTagihan)
      : roundAmount(entry.totalTagihan);
  }

  function directPaymentTotal(type, entry) {
    return paymentTotalForEntry(entry);
  }

  function settlementPaidByInvoice(type, invoiceNo) {
    const clean = text(invoiceNo).toLowerCase();
    return roundAmount(state.settlements.reduce(function (sum, settlement) {
      if (settlement.type !== type) return sum;
      return sum + (settlement.lines || []).reduce(function (lineSum, line) {
        return text(line.invoiceNo).toLowerCase() === clean ? lineSum + parseAmount(line.amount) : lineSum;
      }, 0);
    }, 0));
  }

  function settlementPaidByEntity(type, entityCode, entityName) {
    const cleanCode = text(entityCode).toLowerCase();
    const cleanName = text(entityName).toLowerCase();
    return roundAmount(state.settlements.reduce(function (sum, settlement) {
      if (settlement.type !== type) return sum;
      return sum + (settlement.lines || []).reduce(function (lineSum, line) {
        const code = text(line.entityCode).toLowerCase();
        const name = text(line.entityName).toLowerCase();
        if (cleanCode && code !== cleanCode) return lineSum;
        if (!cleanCode && cleanName && name !== cleanName) return lineSum;
        if (!cleanCode && !cleanName) return lineSum;
        return lineSum + parseAmount(line.amount);
      }, 0);
    }, 0));
  }

  function outstandingByInvoice(type, entry) {
    return Math.max(0, roundAmount(
      settlementEntryTotal(type, entry)
      - directPaymentTotal(type, entry)
      - settlementPaidByInvoice(type, settlementInvoiceNo(type, entry))
    ));
  }

  function outstandingForSettlementInvoice(type, entry) {
    return Math.min(
      outstandingByInvoice(type, entry),
      outstandingByEntity(type, settlementEntityCode(type, entry), settlementEntityName(type, entry))
    );
  }

  function outstandingByEntity(type, entityCode, entityName) {
    const cleanCode = text(entityCode).toLowerCase();
    const cleanName = text(entityName).toLowerCase();
    const entryTotal = settlementEntriesForType(type).reduce(function (sum, entry) {
      const code = settlementEntityCode(type, entry).toLowerCase();
      const name = settlementEntityName(type, entry).toLowerCase();
      if (cleanCode && code !== cleanCode) return sum;
      if (!cleanCode && cleanName && name !== cleanName) return sum;
      if (!cleanCode && !cleanName) return sum;
      return sum + settlementEntryTotal(type, entry) - directPaymentTotal(type, entry);
    }, 0);
    return Math.max(0, roundAmount(entryTotal - settlementPaidByEntity(type, entityCode, entityName)));
  }

  function refreshSettlementInvoiceOptions(row) {
    const type = activeSettlementBaseType();
    const mode = settlementMode();
    const select = row.querySelector('[data-settlement-field="invoiceNo"]');
    if (!select) return;
    const current = select.value;
    const entityCode = row.querySelector('[data-settlement-field="entityCode"]')?.value || '';
    const entityName = row.querySelector('[data-settlement-field="entityName"]')?.value || '';
    const template = document.createElement('template');
    template.innerHTML = settlementInvoiceSelectHtml(type, mode, current, entityCode, entityName);
    select.replaceWith(template.content.firstChild);
  }

  function setTotal(key, value) {
    const node = elements.entryBody.querySelector('[data-tbb-total="' + key + '"]');
    if (node) node.textContent = formatAmountZero(value);
  }

  function appendLine(item) {
    const list = elements.entryBody.querySelector('.tbb-lines-list');
    if (!list) return null;
    const template = document.createElement('template');
    template.innerHTML = lineRowHtml(elements.entryType.value, item || defaultLineFromHeader());
    const row = template.content.firstChild;
    list.appendChild(row);
    if (elements.entryType.value === 'sales' && fieldChecked('settleAll')) {
      const autoInput = row.querySelector('[data-line-field="paymentAuto"]');
      if (autoInput) autoInput.checked = true;
    }
    bindModalInputFormatting();
    applyEntryLineLayout();
    recalculateModalTotals();
    return row;
  }

  function defaultLineFromHeader() {
    const rows = Array.from(elements.entryBody.querySelectorAll('.tbb-line-row'));
    const previous = rows[rows.length - 1];
    if (previous) {
      return blankLine({
        supplierCode: '',
        supplierName: '',
        unit: previous.querySelector('[data-line-field="unit"]')?.value || 'Kg',
        includePph22: globalIncludePph22()
      });
    }
    return blankLine({
      paymentAuto: fieldChecked('settleAll')
    });
  }

  function collectLines() {
    ensureAutoCodes();
    return Array.from(elements.entryBody.querySelectorAll('.tbb-line-row')).map(function (row) {
      const line = {};
      ['supplierCode', 'supplierName', 'fishCode', 'fishName', 'qty', 'unit', 'unitPrice', 'amount', 'paymentAmount', 'paymentSourceKey'].forEach(function (key) {
        const input = row.querySelector('[data-line-field="' + key + '"]');
        line[key] = input ? input.value : '';
      });
      line.paymentAuto = Boolean(row.querySelector('[data-line-field="paymentAuto"]')?.checked);
      line.includePph22 = elements.entryType.value === 'sales' ? globalIncludePph22() : true;
      line.priceMode = row.getAttribute('data-price-mode') || '';
      line.sourceSalesId = row.getAttribute('data-source-sales-id') || '';
      line.sourceSalesNo = row.getAttribute('data-source-sales-no') || '';
      const settlementPaid = parseAmount(row.getAttribute('data-settlement-paid'));
      if (settlementPaid > 0) {
        const displayedPayment = parseAmount(line.paymentAmount);
        const settlementReplaced = row.getAttribute('data-settlement-replaced') === 'true';
        const directPayment = settlementReplaced
          ? Math.max(0, roundAmount(displayedPayment))
          : Math.max(0, roundAmount(displayedPayment - settlementPaid));
        line.settlementTargetAmount = settlementReplaced
          ? '0'
          : String(Math.max(0, Math.min(settlementPaid, displayedPayment)));
        line.hasSettlementTargetAmount = true;
        const baseAfterSettlement = Math.max(0, roundAmount(linePaymentBase(elements.entryType.value, line) - settlementPaid));
        line.paymentAmount = String(directPayment);
        line.paymentAuto = settlementReplaced
          ? directPayment > 0 && directPayment >= linePaymentBase(elements.entryType.value, line) - 0.0001
          : baseAfterSettlement > 0 && directPayment >= baseAfterSettlement - 0.0001;
      }
      return line;
    }).filter(function (line) {
      return text(line.fishName) || text(line.fishCode) || parseAmount(line.qty) || parseAmount(line.unitPrice) || parseAmount(line.amount);
    });
  }

  function existingSettlementTotalForEditing(type, invoiceNo) {
    if (!elements.entryId.value) return 0;
    return settlementPaidByInvoice(type, invoiceNo);
  }

  function settlementTargetAmountFromLines(lines) {
    return roundAmount((lines || []).reduce(function (sum, line) {
      return sum + parseAmount(line.settlementTargetAmount);
    }, 0));
  }

  function fieldValue(name) {
    if (name === 'referenceText') {
      const lines = Array.from(elements.entryBody.querySelectorAll('[data-tbb-reference-line]')).map(function (input) {
        return text(input.value);
      });
      if (lines.length) {
        while (lines.length && !lines[lines.length - 1]) lines.pop();
        return lines.length ? lines.join('\n') : '';
      }
    }
    return elements.entryBody.querySelector('[data-tbb-field="' + name + '"]')?.value || '';
  }

  function fieldChecked(name) {
    return Boolean(elements.entryBody.querySelector('[data-tbb-field="' + name + '"]')?.checked);
  }

  function globalIncludePph22() {
    const input = elements.entryBody.querySelector('[data-tbb-field="includePph22All"]');
    return input ? input.checked : true;
  }

  function findSupplierByCode(code) {
    const clean = text(code).toLowerCase();
    return supplierOptions().find(function (item) { return text(item.code).toLowerCase() === clean; }) || null;
  }

  function findSupplierByName(name) {
    const clean = text(name).toLowerCase();
    return supplierOptions().find(function (item) { return text(item.name).toLowerCase() === clean; }) || null;
  }

  function findFishByCode(code) {
    const clean = text(code).toLowerCase();
    return fishOptions().find(function (item) { return text(item.code).toLowerCase() === clean; }) || null;
  }

  function findFishByName(name) {
    const clean = text(name).toLowerCase();
    return fishOptions().find(function (item) { return text(item.name).toLowerCase() === clean; }) || null;
  }

  function findCustomerByCode(code) {
    const clean = text(code).toLowerCase();
    return customerOptions().find(function (item) { return text(item.code).toLowerCase() === clean; }) || null;
  }

  function findCustomerByName(name) {
    const clean = text(name).toLowerCase();
    return customerOptions().find(function (item) { return text(item.name).toLowerCase() === clean; }) || null;
  }

  function generateEntityCode(prefix, existingCodes) {
    const used = new Set((existingCodes || []).map(function (code) { return text(code).toUpperCase(); }).filter(Boolean));
    for (let index = 1; index <= 999; index += 1) {
      const code = prefix + '-' + String(index).padStart(3, '0');
      if (!used.has(code)) return code;
    }
    return prefix + '-' + Date.now();
  }

  function nextSupplierCode() {
    const codes = supplierOptions().map(function (item) { return item.code; });
    return generateEntityCode('SUP', codes);
  }

  function nextFishCode() {
    const codes = fishOptions().map(function (item) { return item.code; });
    return generateEntityCode('IKN', codes);
  }

  function nextCustomerCode() {
    const codes = customerOptions().map(function (item) { return item.code; });
    return generateEntityCode('CUS', codes);
  }

  function syncCustomer(source) {
    const codeInput = elements.entryBody.querySelector('[data-tbb-field="customerCode"]');
    const nameInput = elements.entryBody.querySelector('[data-tbb-field="customerName"]');
    const addressInput = elements.entryBody.querySelector('[data-tbb-field="customerAddress"]');
    const identityInput = elements.entryBody.querySelector('[data-tbb-field="customerIdentityNo"]');
    if (!codeInput || !nameInput) return;
    let match = null;
    if (source === 'code') {
      match = findCustomerByCode(codeInput.value);
      if (match) nameInput.value = match.name;
    } else {
      match = findCustomerByName(nameInput.value);
      if (match) codeInput.value = match.code;
      else if (text(nameInput.value) && !text(codeInput.value)) codeInput.value = nextCustomerCode();
    }
    if (match) {
      if (addressInput && (!text(addressInput.value) || source === 'code' || source === 'name')) addressInput.value = text(match.address);
      if (identityInput && (!text(identityInput.value) || source === 'code' || source === 'name')) identityInput.value = text(match.identityNo);
    }
  }

  function syncSupplierInputs(codeInput, nameInput, source) {
    if (!codeInput || !nameInput) return;
    if (source === 'code') {
      const match = findSupplierByCode(codeInput.value);
      if (match) nameInput.value = match.name;
    } else {
      const match = findSupplierByName(nameInput.value);
      if (match) codeInput.value = match.code;
      else if (text(nameInput.value) && !text(codeInput.value)) codeInput.value = nextSupplierCode();
    }
  }

  function syncHeaderSupplier(source) {
    const codeInput = elements.entryBody.querySelector('[data-tbb-field="supplierCode"]');
    const nameInput = elements.entryBody.querySelector('[data-tbb-field="supplierName"]');
    syncSupplierInputs(codeInput, nameInput, source);
    Array.from(elements.entryBody.querySelectorAll('.tbb-line-row')).forEach(function (row) {
      const lineCode = row.querySelector('[data-line-field="supplierCode"]');
      const lineName = row.querySelector('[data-line-field="supplierName"]');
      if (lineCode && !text(lineCode.value)) lineCode.value = codeInput?.value || '';
      if (lineName && !text(lineName.value)) lineName.value = nameInput?.value || '';
    });
  }

  function syncLineSupplier(input) {
    const row = input.closest('.tbb-line-row');
    if (!row) return;
    const codeInput = row.querySelector('[data-line-field="supplierCode"]');
    const nameInput = row.querySelector('[data-line-field="supplierName"]');
    syncSupplierInputs(codeInput, nameInput, input.getAttribute('data-line-field') === 'supplierCode' ? 'code' : 'name');
  }

  function syncFishInputs(codeInput, nameInput, source) {
    if (!codeInput || !nameInput) return;
    if (source === 'code') {
      const match = findFishByCode(codeInput.value);
      if (match) nameInput.value = match.name;
    } else {
      const match = findFishByName(nameInput.value);
      if (match) codeInput.value = match.code;
      else if (text(nameInput.value) && !text(codeInput.value)) codeInput.value = nextFishCode();
    }
  }

  function syncLineFish(input) {
    const row = input.closest('.tbb-line-row');
    if (!row) return;
    const codeInput = row.querySelector('[data-line-field="fishCode"]');
    const nameInput = row.querySelector('[data-line-field="fishName"]');
    syncFishInputs(codeInput, nameInput, input.getAttribute('data-line-field') === 'fishCode' ? 'code' : 'name');
  }

  function ensureAutoCodes() {
    syncCustomer('name');
    syncHeaderSupplier('name');
    Array.from(elements.entryBody.querySelectorAll('.tbb-line-row')).forEach(function (row) {
      const codeInput = row.querySelector('[data-line-field="supplierCode"]');
      const nameInput = row.querySelector('[data-line-field="supplierName"]');
      const fishCodeInput = row.querySelector('[data-line-field="fishCode"]');
      const fishNameInput = row.querySelector('[data-line-field="fishName"]');
      if (nameInput && text(nameInput.value) && codeInput && !text(codeInput.value)) codeInput.value = nextSupplierCode();
      if (codeInput && text(codeInput.value) && nameInput && !text(nameInput.value)) nameInput.value = text(codeInput.value);
      if (fishNameInput && text(fishNameInput.value) && fishCodeInput && !text(fishCodeInput.value)) fishCodeInput.value = nextFishCode();
      if (fishCodeInput && text(fishCodeInput.value) && fishNameInput && !text(fishNameInput.value)) fishNameInput.value = text(fishCodeInput.value);
    });
  }

  function selectedSale() {
    const invoiceNo = fieldValue('salesInvoiceNo');
    if (!invoiceNo || invoiceNo === 'Manual') return null;
    return state.sales.find(function (sale) { return text(sale.invoiceNo) === text(invoiceNo); }) || null;
  }

  function purchasedQtyByKey(salesInvoiceNo, currentPurchaseId) {
    const result = new Map();
    state.purchases.forEach(function (purchase) {
      if (text(purchase.id) === text(currentPurchaseId)) return;
      (purchase.items || []).forEach(function (item) {
        if (purchaseItemSalesInvoiceNo(purchase, item) !== text(salesInvoiceNo)) return;
        const key = saleItemKey(item);
        result.set(key, (result.get(key) || 0) + parseAmount(item.qty));
      });
    });
    return result;
  }

  function validateSaleCoversPurchases(lines, invoiceNo) {
    const purchased = purchasedQtyByKey(invoiceNo, '');
    if (!purchased.size) return;
    const saleQty = new Map();
    lines.forEach(function (line) {
      const key = saleItemKey(line);
      saleQty.set(key, (saleQty.get(key) || 0) + parseAmount(line.qty));
    });
    purchased.forEach(function (qty, key) {
      const saleLineQty = saleQty.get(key) || 0;
      if (qty > saleLineQty + 0.0001) {
        throw new Error('Penjualan ini sudah punya pembelian, jadi qty penjualan tidak boleh lebih kecil dari qty pembelian.');
      }
    });
  }

  function validatePurchaseAgainstSale(lines, sale, currentPurchaseId) {
    if (fieldValue('salesInvoiceNo') === 'Manual') return;
    if (!sale) throw new Error('Pilih No Invoice Penjualan terlebih dahulu.');
    const saleQty = new Map();
    (sale.items || []).forEach(function (line) {
      const key = saleItemKey(line);
      saleQty.set(key, (saleQty.get(key) || 0) + parseAmount(line.qty));
    });
    const alreadyPurchased = purchasedQtyByKey(sale.invoiceNo, currentPurchaseId);
    const requestQty = new Map();
    lines.forEach(function (line, index) {
      const saleLine = (sale.items || []).find(function (item) {
        return lineMatchesSaleItem(line, item);
      });
      if (!saleLine) throw new Error('Baris ' + (index + 1) + ': rincian tidak cocok dengan invoice penjualan.');
      const key = saleItemKey(saleLine);
      requestQty.set(key, (requestQty.get(key) || 0) + parseAmount(line.qty));
    });
    saleQty.forEach(function (soldQty, key) {
      const finalQty = roundAmount((alreadyPurchased.get(key) || 0) + (requestQty.get(key) || 0));
      if (Math.abs(finalQty - soldQty) > 0.0001) {
        throw new Error('Qty pembelian harus sama dengan qty terjual. Terjual ' + formatDecimal(soldQty) + ', sudah+input pembelian ' + formatDecimal(finalQty) + '.');
      }
    });
  }

  function remainingSaleItemsForPurchase(sale, currentPurchaseId) {
    const alreadyPurchased = purchasedQtyByKey(sale.invoiceNo, currentPurchaseId);
    const purchasedRemainingByKey = new Map(alreadyPurchased);
    const remainingItems = [];
    (sale.items || []).forEach(function (item) {
      const key = saleItemKey(item);
      const soldQty = parseAmount(item.qty);
      const alreadyForKey = purchasedRemainingByKey.get(key) || 0;
      const usedOnThisLine = Math.min(soldQty, alreadyForKey);
      purchasedRemainingByKey.set(key, roundAmount(Math.max(0, alreadyForKey - usedOnThisLine)));
      const remainingQty = roundAmount(soldQty - usedOnThisLine);
      if (remainingQty <= 0.0001) return;
      remainingItems.push(Object.assign({}, item, { qty: remainingQty }));
    });
    return remainingItems;
  }

  function fillPurchaseFromSelectedSale() {
    const sale = selectedSale();
    const list = elements.entryBody.querySelector('.tbb-lines-list');
    if (!list) return;
    if (!sale) {
      if (fieldValue('salesInvoiceNo') === 'Manual' && !list.querySelector('.tbb-line-row')) appendLine(blankLine());
      return;
    }
    clearNode(list);
    const remainingItems = remainingSaleItemsForPurchase(sale, elements.entryId.value);
    if (!remainingItems.length) {
      appendLine(blankLine());
      setAlert('Invoice penjualan ini sudah tertutup pembelian.', 'error');
      return;
    }
    remainingItems.forEach(function (item) {
      const buyPrice = Math.max(0, parseAmount(item.unitPrice) - 20);
      appendLine(blankLine({
        supplierCode: item.supplierCode,
        supplierName: item.supplierName || item.supplierCode,
        fishCode: item.fishCode,
        fishName: item.fishName,
        qty: item.qty,
        unit: item.unit || 'Kg',
        unitPrice: buyPrice,
        amount: roundAmount(parseAmount(item.qty) * buyPrice),
        priceMode: 'unit',
        sourceSalesId: sale.id,
        sourceSalesNo: sale.invoiceNo
      }));
    });
    recalculateModalTotals();
  }

  function syncSettlementEntity(input) {
    const type = activeSettlementBaseType();
    const row = input.closest('.tbb-settlement-row');
    if (!row) return;
    const codeInput = row.querySelector('[data-settlement-field="entityCode"]');
    const nameInput = row.querySelector('[data-settlement-field="entityName"]');
    if (!codeInput || !nameInput) return;
    if (type === 'sales') {
      if (input.getAttribute('data-settlement-field') === 'entityCode') {
        const match = findCustomerByCode(codeInput.value);
        if (match) nameInput.value = match.name;
      } else {
        const match = findCustomerByName(nameInput.value);
        if (match) codeInput.value = match.code;
        else if (text(nameInput.value) && !text(codeInput.value)) codeInput.value = nextCustomerCode();
      }
    } else {
      syncSupplierInputs(codeInput, nameInput, input.getAttribute('data-settlement-field') === 'entityCode' ? 'code' : 'name');
    }
    refreshSettlementInvoiceOptions(row);
  }

  function rerenderSettlementSection() {
    const type = activeSettlementBaseType();
    const mode = settlementMode();
    const section = elements.entryBody.querySelector('[data-tbb-settlement-section]');
    if (!section) return;
    const template = document.createElement('template');
    template.innerHTML = settlementSectionHtml(type, mode, [blankSettlementLine()]);
    section.replaceWith(template.content.firstChild);
    bindModalInputFormatting();
    recalculateModalTotals();
  }

  function appendSettlementLine() {
    const list = elements.entryBody.querySelector('.tbb-settlement-list');
    if (!list) return null;
    const type = activeSettlementBaseType();
    const mode = settlementMode();
    const template = document.createElement('template');
    template.innerHTML = settlementLineHtml(type, mode, blankSettlementLine());
    const row = template.content.firstChild;
    list.appendChild(row);
    bindModalInputFormatting();
    recalculateModalTotals();
    return row;
  }

  function collectSettlementLines() {
    const type = activeSettlementBaseType();
    const mode = settlementMode();
    const settlementDate = fieldValue('settlementDate');
    return Array.from(elements.entryBody.querySelectorAll('.tbb-settlement-row')).map(function (row, index) {
      const invoiceNo = row.querySelector('[data-settlement-field="invoiceNo"]')?.value || '';
      const amount = parseAmount(row.querySelector('[data-settlement-field="amount"]')?.value);
      const openAmount = parseAmount(row.querySelector('[data-settlement-field="openAmount"]')?.value);
      const paymentSourceKey = row.querySelector('[data-settlement-field="paymentSourceKey"]')?.value || defaultPaymentSourceKey();
      let entityCode = row.querySelector('[data-settlement-field="entityCode"]')?.value || '';
      let entityName = row.querySelector('[data-settlement-field="entityName"]')?.value || '';
      let invoiceDate = '';
      if (invoiceNo && invoiceNo !== 'Manual') {
        const entry = findSettlementEntry(type, invoiceNo);
        if (!entry) throw new Error('Baris ' + (index + 1) + ': faktur tidak ditemukan.');
        invoiceDate = settlementInvoiceDate(type, entry);
        if (settlementDate && invoiceDate && settlementDate < invoiceDate) {
          throw new Error('Baris ' + (index + 1) + ': tanggal pelunasan tidak boleh lebih awal dari tanggal faktur.');
        }
        entityCode = settlementEntityCode(type, entry);
        entityName = settlementEntityName(type, entry);
      }
      if (mode === 'invoice' && !invoiceNo) throw new Error('Baris ' + (index + 1) + ': pilih faktur yang dilunasi.');
      if (mode === 'entity' && (!entityCode && !entityName)) throw new Error('Baris ' + (index + 1) + ': pilih ' + (type === 'sales' ? 'customer' : 'supplier') + '.');
      if (amount <= 0) throw new Error('Baris ' + (index + 1) + ': jumlah pelunasan wajib lebih dari 0.');
      if (amount > openAmount + 0.0001) throw new Error('Baris ' + (index + 1) + ': jumlah pelunasan melebihi sisa ' + (type === 'sales' ? 'piutang' : 'utang') + '.');
      if (!paymentSourceKey) throw new Error('Baris ' + (index + 1) + ': jenis bank/kas wajib dipilih.');
      return {
        entityCode,
        entityName,
        invoiceNo,
        invoiceDate,
        openAmount,
        amount,
        paymentSourceKey,
        settleAll: Boolean(row.querySelector('[data-settlement-field="settleAll"]')?.checked)
      };
    }).filter(function (line) {
      return text(line.invoiceNo) || text(line.entityCode) || text(line.entityName) || line.amount;
    });
  }

  async function buildSettlementPayload() {
    const type = activeSettlementBaseType();
    const lines = collectSettlementLines();
    if (!lines.length) throw new Error('Minimal 1 baris pelunasan wajib diisi.');
    return Object.assign({
      type,
      mode: settlementMode(),
      settlementDate: fieldValue('settlementDate'),
      documentNo: fieldValue('settlementDocumentNo'),
      notes: fieldValue('settlementNotes'),
      lines
    }, await attachmentPayload());
  }

  async function buildPayload() {
    const type = elements.entryType.value;
    if (type === 'sales-settlement' || type === 'purchases-settlement') return buildSettlementPayload();
    const lines = collectLines();
    if (!lines.length) throw new Error('Minimal 1 baris rincian ikan wajib diisi.');
    lines.forEach(function (line, index) {
      const billableAmount = type === 'sales'
        ? calculateSalesBillableAmount(parseAmount(line.amount), isCheckedValue(line.includePph22, true))
        : parseAmount(line.amount);
      let paymentAmount = parseAmount(line.paymentAmount);
      if (line.paymentAuto) {
        paymentAmount = billableAmount;
        line.paymentAmount = String(billableAmount);
      }
      if (paymentAmount > billableAmount + 0.0001) {
        throw new Error('Baris ' + (index + 1) + ': pelunasan tidak boleh lebih besar dari nilai yang ditagih.');
      }
      if (paymentAmount > 0 && !text(line.paymentSourceKey)) {
        throw new Error('Baris ' + (index + 1) + ': jenis bank/kas wajib dipilih untuk pelunasan.');
      }
    });
    if (type === 'sales') {
      const invoiceNo = fieldValue('invoiceNo');
      validateSaleCoversPurchases(lines, invoiceNo);
      const hasExistingSettlement = existingSettlementTotalForEditing('sales', invoiceNo) > 0.0001;
      const hasSettlementTarget = hasExistingSettlement || lines.some(function (line) { return line.hasSettlementTargetAmount; });
      return Object.assign({
        invoiceNo,
        invoiceDate: fieldValue('invoiceDate'),
        customerCode: fieldValue('customerCode') || DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.code,
        customerName: fieldValue('customerName') || DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.name,
        customerAddress: fieldValue('customerAddress') || DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.address,
        customerIdentityNo: fieldValue('customerIdentityNo') || DEMO_DISTRIBUTION_DEFAULT_CUSTOMER.identityNo,
        items: lines,
        settlementTargetAmount: hasSettlementTarget ? String(settlementTargetAmountFromLines(lines)) : undefined,
        referenceText: fieldValue('referenceText'),
        notes: fieldValue('notes')
      }, await attachmentPayload());
    }
    const sale = selectedSale();
    validatePurchaseAgainstSale(lines, sale, elements.entryId.value);
    const documentNo = fieldValue('documentNo');
    const hasExistingSettlement = existingSettlementTotalForEditing('purchases', documentNo) > 0.0001;
    const hasSettlementTarget = hasExistingSettlement || lines.some(function (line) { return line.hasSettlementTargetAmount; });
    return Object.assign({
      salesInvoiceNo: fieldValue('salesInvoiceNo') || 'Manual',
      documentNo,
      purchaseDate: fieldValue('purchaseDate'),
      items: lines,
      settlementTargetAmount: hasSettlementTarget ? String(settlementTargetAmountFromLines(lines)) : undefined,
      notes: fieldValue('notes')
    }, await attachmentPayload());
  }

  async function submitEntry(event) {
    event.preventDefault();
    if (state.entryReadOnly) return;
    setAlert('');
    const type = elements.entryType.value;
    const id = elements.entryId.value;
    const isSettlement = type === 'sales-settlement' || type === 'purchases-settlement';
    const endpoint = isSettlement ? '/settlements' : (type === 'sales' ? '/sales' : '/purchases');
    const method = isSettlement ? 'POST' : (id ? 'PUT' : 'POST');
    const url = apiBase() + endpoint + (!isSettlement && id ? '/' + encodeURIComponent(id) : '');
    elements.entrySaveButton.disabled = true;
    try {
      const data = await requestJson(url, {
        method,
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(await buildPayload())
      });
      const splitCount = Array.isArray(data.entryIds) ? data.entryIds.length : 1;
      applyData(data);
      closeEntryModal();
      render();
      setAlert(isSettlement
        ? 'Pelunasan tersimpan.'
        : (type === 'purchases' && splitCount > 1
        ? 'Pembelian tersimpan menjadi ' + splitCount + ' baris supplier.'
        : (type === 'sales' ? 'Penjualan' : 'Pembelian') + ' tersimpan.'), 'success');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan data.', 'error');
    } finally {
      elements.entrySaveButton.disabled = false;
    }
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(new Error('Gagal membaca file.')); };
      reader.readAsDataURL(file);
    });
  }

  async function importWorkbook(file) {
    if (!file || !elements.importButton) return;
    if (!/\.xlsx?$/i.test(file.name)) {
      setAlert('File import harus Excel .xlsx atau .xls.', 'error');
      return;
    }
    elements.importButton.disabled = true;
    setAlert('Mengimpor file Excel DEMO_DISTRIBUTION...');
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const data = await requestJson(apiBase() + '/import', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, dataUrl })
      });
      applyData(data);
      render();
      const summary = data.importSummary || {};
      setAlert(
        'Import selesai: ' + (summary.salesRows || 0) + ' baris penjualan, ' +
        (summary.purchaseRows || 0) + ' baris pembelian, ' +
        (summary.purchaseDocuments || 0) + ' dokumen pembelian.',
        'info'
      );
    } catch (err) {
      setAlert(err.message || 'Import Excel gagal.', 'error');
    } finally {
      elements.importButton.disabled = false;
      if (elements.importInput) elements.importInput.value = '';
    }
  }

  async function deleteEntry(type, id) {
    const entry = findEntry(type, id);
    if (!entry) return;
    const label = type === 'sales' ? entry.invoiceNo : entry.documentNo;
    const ok = window.confirm('Hapus data ' + label + '?');
    if (!ok) return;
    try {
      const data = await requestJson(apiBase() + (type === 'sales' ? '/sales/' : '/purchases/') + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      applyData(data);
      render();
      setAlert('Data berhasil dihapus.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus data.', 'error');
    }
  }

  function openInvoice(type, id) {
    const entry = findEntry(type, id);
    if (!entry) return;
    state.invoicePreview = { type, id };
    elements.invoiceTitle.textContent = type === 'sales' ? 'Faktur Penjualan' : 'Faktur Pembelian';
    elements.invoiceMeta.textContent = type === 'sales'
      ? text(entry.invoiceNo, 'Penjualan')
      : text(entry.documentNo, 'Pembelian');
    elements.invoiceBody.innerHTML = type === 'sales' ? salesInvoiceHtml(entry) : purchaseInvoiceHtml(entry);
    elements.invoicePrintButton.hidden = false;
    elements.invoiceModal.hidden = false;
  }

  async function openAttachment(type, id) {
    const entry = findEntry(type, id);
    if (!entry) return;
    if (!entry.hasAttachment) {
      setAlert('Belum ada file yang di-upload untuk transaksi ini.', 'error');
      return;
    }
    const endpoint = type === 'sales' ? '/sales/' : '/purchases/';
    elements.invoiceTitle.textContent = text(entry.attachmentName, 'Lihat File');
    elements.invoiceMeta.textContent = type === 'sales'
      ? text(entry.invoiceNo, 'Penjualan')
      : text(entry.documentNo, 'Pembelian');
    elements.invoiceBody.innerHTML = '<div class="cashbook-file-fallback">Memuat file...</div>';
    elements.invoicePrintButton.hidden = true;
    elements.invoiceModal.hidden = false;
    try {
      const data = await requestJson(apiBase() + endpoint + encodeURIComponent(id) + '/file', { headers: { Accept: 'application/json' } });
      if (window.clientPortalRenderAttachmentViewer) {
        window.clientPortalRenderAttachmentViewer(elements.invoiceBody, data, {
          titleEl: elements.invoiceTitle,
          metaEl: elements.invoiceMeta,
          label: 'Lihat File'
        });
        return;
      }
      const file = data.file || data;
      elements.invoiceBody.innerHTML = '<a class="cashbook-file-fallback" href="' + escapeHtml(file.dataUrl || '#') + '" download="' + escapeHtml(file.name || 'lampiran') + '">Buka file</a>';
    } catch (err) {
      closeInvoice();
      setAlert(err.message || 'Gagal membuka file.', 'error');
    }
  }

  function attachmentFileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.file) {
        resolve(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = function () {
        resolve(Object.assign({}, file, { dataUrl: String(reader.result || '') }));
      };
      reader.onerror = function () {
        reject(new Error('Gagal membaca preview file.'));
      };
      reader.readAsDataURL(file.file);
    });
  }

  async function previewAttachmentFile(file) {
    if (!file) return;
    const previewFile = await attachmentFileToDataUrl(file);
    elements.invoiceTitle.textContent = text(previewFile.name, 'Lihat File');
    elements.invoiceMeta.textContent = 'Preview dokumen terupload.';
    clearNode(elements.invoiceBody);
    if (window.clientPortalRenderAttachmentViewer) {
      window.clientPortalRenderAttachmentViewer(elements.invoiceBody, { file: previewFile }, {
        titleEl: elements.invoiceTitle,
        metaEl: elements.invoiceMeta,
        label: 'Lihat File'
      });
    } else {
      elements.invoiceBody.textContent = 'Preview file belum tersedia.';
    }
    elements.invoiceModal.hidden = false;
  }

  function closeInvoice() {
    elements.invoiceModal.hidden = true;
    elements.invoiceBody.innerHTML = '';
    elements.invoicePrintButton.hidden = false;
    state.invoicePreview = null;
  }

  function calculateSalesTotalsFromItems(items) {
    return (items || []).reduce(function (totals, item) {
      const amount = roundAmount(parseAmount(item.amount));
      const taxes = calculateSalesLineTaxes(amount, isCheckedValue(item.includePph22 ?? item.include_pph22, true));
      totals.lineTotal = roundAmount(totals.lineTotal + amount);
      totals.dpp = roundAmount(totals.dpp + taxes.dpp);
      totals.pph22 = roundAmount(totals.pph22 + taxes.pph22);
      totals.totalTagihan = roundAmount(totals.totalTagihan + taxes.totalTagihan);
      return totals;
    }, { lineTotal: 0, dpp: 0, ppn: 0, pph22: 0, totalTagihan: 0 });
  }

  function paymentTotalForEntry(entry) {
    return roundAmount((entry.items || []).reduce(function (sum, item) {
      return sum + parseAmount(item.paymentAmount ?? item.payment_amount ?? item.pelunasan);
    }, 0));
  }

  function paymentBreakdownForItems(items) {
    const map = new Map();
    (items || []).forEach(function (item) {
      const amount = parseAmount(item.paymentAmount ?? item.payment_amount ?? item.pelunasan);
      if (amount <= 0) return;
      const key = text(item.paymentSourceKey || item.payment_source_key, defaultPaymentSourceKey());
      map.set(key, roundAmount((map.get(key) || 0) + amount));
    });
    return Array.from(map.entries()).map(function (entry) {
      return { key: entry[0], label: paymentSourceLabel(entry[0]), amount: entry[1] };
    });
  }

  function journalRowsForSales(entry) {
    const totals = calculateSalesTotalsFromItems(entry.items || []);
    const paid = Math.min(totals.totalTagihan, paymentTotalForEntry(entry));
    const receivable = roundAmount(totals.totalTagihan - paid);
    const rows = [];
    function add(account, debit, credit, note) {
      rows.push({
        date: entry.invoiceDate,
        ref: entry.invoiceNo,
        account,
        debit: roundAmount(debit),
        credit: roundAmount(credit),
        note
      });
    }
    paymentBreakdownForItems(entry.items || []).forEach(function (payment) {
      add(payment.label, payment.amount, 0, 'Pelunasan penjualan ' + text(entry.customerName, 'PT CUSTOMER CONTOH'));
    });
    if (receivable > 0) add('Piutang Usaha - ' + text(entry.customerName, 'PT CUSTOMER CONTOH'), receivable, 0, 'Tagihan penjualan');
    if (totals.pph22 > 0) add('PPh 22 Dibayar Dimuka', totals.pph22, 0, 'PPh 22 dipotong pembeli');
    add('Penjualan Ikan', 0, totals.dpp, 'Pengakuan penjualan');
    return rows;
  }

  function journalRowsForPurchase(entry) {
    const total = roundAmount(parseAmount(entry.totalTagihan) || (entry.items || []).reduce(function (sum, item) {
      return sum + parseAmount(item.amount);
    }, 0));
    const paid = Math.min(total, paymentTotalForEntry(entry));
    const payable = roundAmount(total - paid);
    const rows = [{
      date: entry.purchaseDate,
      ref: entry.documentNo,
      account: 'Pembelian',
      debit: total,
      credit: 0,
      note: 'Pembelian dari ' + text(entry.supplierName, 'supplier')
    }];
    if (payable > 0) {
      rows.push({
        date: entry.purchaseDate,
        ref: entry.documentNo,
        account: 'Hutang Bahan Baku - ' + text(entry.supplierName, 'Supplier'),
        debit: 0,
        credit: payable,
        note: 'Tagihan pembelian'
      });
    }
    paymentBreakdownForItems(entry.items || []).forEach(function (payment) {
      rows.push({
        date: entry.purchaseDate,
        ref: entry.documentNo,
        account: payment.label,
        debit: 0,
        credit: payment.amount,
        note: 'Pembayaran pembelian'
      });
    });
    return rows;
  }

  function journalRowsForSettlement(entry) {
    const type = entry.type === 'purchases' ? 'purchases' : 'sales';
    const rows = [];
    (entry.lines || []).forEach(function (line) {
      const amount = roundAmount(parseAmount(line.amount));
      if (!amount) return;
      if (type === 'sales') {
        rows.push({
          date: entry.settlementDate,
          ref: entry.documentNo,
          account: paymentSourceLabel(line.paymentSourceKey || line.payment_source_key),
          debit: amount,
          credit: 0,
          note: 'Pelunasan piutang ' + text(line.invoiceNo, 'Manual')
        });
        rows.push({
          date: entry.settlementDate,
          ref: entry.documentNo,
          account: 'Piutang Usaha - ' + text(line.entityName, 'Customer'),
          debit: 0,
          credit: amount,
          note: 'Pelunasan dari ' + text(line.entityName, 'customer')
        });
      } else {
        rows.push({
          date: entry.settlementDate,
          ref: entry.documentNo,
          account: 'Hutang Bahan Baku - ' + text(line.entityName, 'Supplier'),
          debit: amount,
          credit: 0,
          note: 'Pelunasan utang ' + text(line.invoiceNo, 'Manual')
        });
        rows.push({
          date: entry.settlementDate,
          ref: entry.documentNo,
          account: paymentSourceLabel(line.paymentSourceKey || line.payment_source_key),
          debit: 0,
          credit: amount,
          note: 'Pembayaran ke ' + text(line.entityName, 'supplier')
        });
      }
    });
    return rows;
  }

  function openJournal() {
    const type = state.activeTab;
    const entries = type === 'sales' ? state.sales : state.purchases;
    const settlements = state.settlements.filter(function (entry) { return entry.type === type; });
    const title = type === 'sales' ? 'Jurnal Penjualan' : 'Jurnal Pembelian';
    elements.journalTitle.textContent = title;
    elements.journalMeta.textContent = entries.length + ' transaksi, ' + settlements.length + ' pelunasan';
    elements.journalBody.innerHTML = journalHtml(type, entries, settlements);
    elements.journalModal.hidden = false;
  }

  function closeJournal() {
    elements.journalModal.hidden = true;
    elements.journalBody.innerHTML = '';
  }

  function journalHtml(type, entries, settlements) {
    if (!entries.length && !(settlements || []).length) {
      return '<div class="tbb-call-empty">Belum ada transaksi untuk dibuat jurnal.</div>';
    }
    const rows = [];
    entries.forEach(function (entry) {
      const journalRows = type === 'sales' ? journalRowsForSales(entry) : journalRowsForPurchase(entry);
      rows.push('<tr class="tbb-journal-ref"><td colspan="6">' +
        escapeHtml((type === 'sales' ? entry.invoiceNo : entry.documentNo) + ' | ' + formatDate(type === 'sales' ? entry.invoiceDate : entry.purchaseDate)) +
      '</td></tr>');
      journalRows.forEach(function (row) {
        rows.push('<tr>' +
          '<td>' + escapeHtml(formatDate(row.date)) + '</td>' +
          '<td>' + escapeHtml(row.ref) + '</td>' +
          '<td>' + escapeHtml(row.account) + '</td>' +
          '<td class="money">' + escapeHtml(row.debit ? formatAmountZero(row.debit) : '-') + '</td>' +
          '<td class="money">' + escapeHtml(row.credit ? formatAmountZero(row.credit) : '-') + '</td>' +
          '<td>' + escapeHtml(row.note) + '</td>' +
        '</tr>');
      });
    });
    (settlements || []).forEach(function (entry) {
      const journalRows = journalRowsForSettlement(entry);
      rows.push('<tr class="tbb-journal-ref"><td colspan="6">' +
        escapeHtml(entry.documentNo + ' | ' + formatDate(entry.settlementDate) + ' | Pelunasan') +
      '</td></tr>');
      journalRows.forEach(function (row) {
        rows.push('<tr>' +
          '<td>' + escapeHtml(formatDate(row.date)) + '</td>' +
          '<td>' + escapeHtml(row.ref) + '</td>' +
          '<td>' + escapeHtml(row.account) + '</td>' +
          '<td class="money">' + escapeHtml(row.debit ? formatAmountZero(row.debit) : '-') + '</td>' +
          '<td class="money">' + escapeHtml(row.credit ? formatAmountZero(row.credit) : '-') + '</td>' +
          '<td>' + escapeHtml(row.note) + '</td>' +
        '</tr>');
      });
    });
    return '<table class="tbb-journal-table"><thead><tr><th>Tanggal</th><th>Ref</th><th>Akun</th><th>Debit</th><th>Kredit</th><th>Keterangan</th></tr></thead><tbody>' +
      rows.join('') +
    '</tbody></table>';
  }

  function invoiceRp(value) {
    const amount = Number(value || 0);
    return amount ? 'Rp ' + formatInvoiceMoney(amount) : 'Rp -';
  }

  function invoiceUnitPrice(item) {
    const unitPrice = Number(item.unitPrice || 0);
    const grossUp = isCheckedValue(item.includePph22 ?? item.include_pph22, true);
    if (!grossUp) return unitPrice;
    const qty = Number(item.qty || item.quantity || 0);
    const amount = Number(item.amount || item.total || 0);
    return amount > 0 && qty > 0 ? calculateGrossUnitPriceFromAmount(amount, qty) : roundAmount(unitPrice / 0.9975);
  }

  function invoiceLineTotal(item) {
    const qty = Number(item.qty || item.quantity || 0);
    const unitPrice = Number(item.unitPrice || item.unit_price || 0);
    const amount = Number(item.amount || item.total || 0);
    if (qty <= 0 || unitPrice <= 0) return amount;
    const grossUp = isCheckedValue(item.includePph22 ?? item.include_pph22, true);
    const netAmount = qty * unitPrice;
    return grossUp ? roundAmount(netAmount / 0.9975) : roundAmount(netAmount);
  }

  function invoiceReferenceLinesHtml(referenceText, fixedText) {
    const source = fixedText ? text(referenceText) : referenceTextValue(referenceText);
    const lines = source.split(/\r?\n/);
    while (lines.length < 3) lines.push('');
    return lines.slice(0, 5).map(function (line) {
      return '<span>' + (line ? escapeHtml(line) : '&nbsp;') + '</span>';
    }).join('');
  }

  function salesInvoiceHtml(entry) {
    const totals = calculateSalesTotalsFromItems(entry.items || []);
    const rows = (entry.items || []).map(function (item) {
      return '<tr>' +
        '<td>' + escapeHtml(item.fishName || item.fishCode || '-') + '</td>' +
        '<td class="center">' + escapeHtml(item.unit || 'Kg') + '</td>' +
        '<td class="money">' + escapeHtml(invoiceRp(invoiceUnitPrice(item))) + '</td>' +
        '<td class="money">' + escapeHtml(formatDecimal(item.qty)) + '</td>' +
        '<td class="money">' + escapeHtml(invoiceRp(invoiceLineTotal(item))) + '</td>' +
      '</tr>';
    });
    while (rows.length < DEMO_DISTRIBUTION_INVOICE_MIN_ROWS) rows.push('<tr class="blank"><td></td><td></td><td></td><td></td><td></td></tr>');
    const customer = resolveTbbInvoiceCustomer(entry);
    const referenceText = referenceTextValue(entry.referenceText ?? entry.reference_text);
    return '<article class="tbb-invoice-paper tbb-sales-invoice-paper">' +
      '<header class="tbb-invoice-letterhead">' +
        '<img src="/app/assets/client/tbb-logo.png" alt="DEMO_DISTRIBUTION" class="tbb-invoice-logo">' +
        '<div class="tbb-invoice-company">' +
          '<h2>' + escapeHtml(DEMO_DISTRIBUTION_COMPANY.name) + '</h2>' +
          '<strong>NPWP : ' + escapeHtml(DEMO_DISTRIBUTION_COMPANY.npwp) + '</strong>' +
          '<span>' + escapeHtml(DEMO_DISTRIBUTION_COMPANY.address) + '</span>' +
          '<span>(' + escapeHtml(DEMO_DISTRIBUTION_COMPANY.contact) + ')</span>' +
        '</div>' +
        '<div class="tbb-invoice-stamp">INVOICE</div>' +
      '</header>' +
      '<div class="tbb-invoice-rule"></div>' +
      '<section class="tbb-invoice-top">' +
        '<div class="tbb-invoice-customer">' +
          '<span>Kepada Yth:</span>' +
          '<div class="tbb-invoice-box">' +
            '<strong>' + escapeHtml(customer.name) + '</strong>' +
            '<span>NPWP : ' + escapeHtml(customer.identityNo) + '</span>' +
            '<span>' + escapeHtml(customer.address) + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="tbb-invoice-docs">' +
          '<div><span>Tanggal :</span><strong>' + escapeHtml(formatDate(entry.invoiceDate)) + '</strong></div>' +
          '<div><span>Nomor Invoice :</span><strong>' + escapeHtml(entry.invoiceNo) + '</strong></div>' +
        '</div>' +
      '</section>' +
      '<table class="tbb-invoice-table tbb-sales-invoice-table"><thead><tr><th>Nama Barang</th><th>Satuan</th><th>Harga Satuan</th><th>Qty</th><th>Total</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' +
      '<section class="tbb-invoice-summary-area">' +
        '<div class="tbb-invoice-reference">' +
          '<span>Referensi:</span>' +
          '<div class="tbb-invoice-ref-row"><div class="tbb-invoice-ref-user">' + invoiceReferenceLinesHtml(referenceText) + '</div><div class="tbb-invoice-ref-tax">' + invoiceReferenceLinesHtml(DEMO_DISTRIBUTION_INVOICE_TAX_NOTE, true) + '</div></div>' +
          '<div class="tbb-invoice-bank"><span>Informasi Rekening Pembayaran :</span><strong>BCA 0000000000 a.n. PT.PERUSAHAAN DISTRIBUSI CONTOH</strong></div>' +
        '</div>' +
        '<table class="tbb-invoice-summary"><tbody>' +
          '<tr class="strong"><th>Jumlah Penjualan</th><td>' + escapeHtml(invoiceRp(totals.dpp)) + '</td></tr>' +
          '<tr><th>PPN</th><td>' + escapeHtml(invoiceRp(totals.ppn)) + '</td></tr>' +
          '<tr><th>PPH Ps.22</th><td>Rp ' + escapeHtml(totals.pph22 ? '(' + formatInvoiceMoney(totals.pph22) + ')' : '-') + '</td></tr>' +
          '<tr class="grand"><th>Jumlah Yang Harus<br>Dibayar</th><td>' + escapeHtml(invoiceRp(totals.totalTagihan)) + '</td></tr>' +
        '</tbody></table>' +
      '</section>' +
      '<footer class="tbb-invoice-signature"><span>Hormat Kami,</span><img src="/app/assets/client/tbb-signature.png" alt="Tanda tangan"><strong>PT. PERUSAHAAN DISTRIBUSI CONTOH</strong></footer>' +
    '</article>';
  }

  function purchaseInvoiceHtml(entry) {
    const rows = (entry.items || []).map(function (item) {
      return '<tr>' +
        '<td>' + escapeHtml(item.supplierCode || entry.supplierCode) + '</td>' +
        '<td>' + escapeHtml(item.supplierName || entry.supplierName) + '</td>' +
        '<td>' + escapeHtml(item.fishCode) + '</td>' +
        '<td>' + escapeHtml(item.fishName) + '</td>' +
        '<td class="money">' + escapeHtml(formatDecimal(item.qty)) + '</td>' +
        '<td>' + escapeHtml(item.unit || 'Kg') + '</td>' +
        '<td class="money">' + escapeHtml(formatAmountZero(item.unitPrice)) + '</td>' +
        '<td class="money">' + escapeHtml(formatAmountZero(item.amount)) + '</td>' +
      '</tr>';
    }).join('');
    return '<article class="tbb-invoice-paper">' +
      '<header class="tbb-invoice-head">' +
        '<div><h2>PT Perusahaan Distribusi Contoh</h2><strong>Pembelian</strong></div>' +
        '<dl><dt>No. Dokumen</dt><dd>' + escapeHtml(entry.documentNo) + '</dd><dt>No Inv Jual</dt><dd>' + escapeHtml(entry.salesInvoiceNo) + '</dd><dt>Tanggal</dt><dd>' + escapeHtml(formatDate(entry.purchaseDate)) + '</dd></dl>' +
      '</header>' +
      '<section class="tbb-invoice-recipient"><span>Kepada Yth</span><strong>' + escapeHtml(entry.supplierName) + '</strong><small>' + escapeHtml(entry.supplierAddress) + '</small></section>' +
      '<table class="tbb-invoice-table"><thead><tr><th>Kode Supplier</th><th>Nama Supplier</th><th>Kode Ikan</th><th>Nama Ikan</th><th>Qty</th><th>Satuan</th><th>Harga Sat</th><th>Jumlah</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="tbb-invoice-bottom">' +
        '<div><strong>Informasi No Rek</strong><p></p></div>' +
        '<table><tbody><tr class="total"><th>Total</th><td>' + escapeHtml(formatAmountZero(entry.totalTagihan)) + '</td></tr></tbody></table>' +
      '</div>' +
      '<footer class="tbb-purchase-sign"><span>Penerima</span><span>Yang Membayar<br><strong>PT. Perusahaan Distribusi Contoh</strong></span></footer>' +
    '</article>';
  }

  function printInvoice() {
    if (!state.invoicePreview) return;
    const popup = window.open('', '_blank');
    const body = elements.invoiceBody.innerHTML;
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>Faktur DEMO_DISTRIBUTION</title><style>' + printStyles() + '</style></head><body>' + body + '<script>window.addEventListener("load",function(){var images=Array.from(document.images||[]);Promise.all(images.map(function(img){return img.complete?Promise.resolve():new Promise(function(resolve){img.onload=resolve;img.onerror=resolve;});})).then(function(){setTimeout(function(){window.print();},120);});});<\/script></body></html>';
    if (!popup) {
      setAlert('Popup print diblokir browser.', 'error');
      return;
    }
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  function printStyles() {
    return [
      '@page{size:A4;margin:0}',
      '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      'body{margin:0;background:#fff;color:#111;font-family:Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.tbb-invoice-paper{width:210mm;min-height:297mm;margin:0 auto;padding:25mm 26mm 18mm;box-sizing:border-box;background:#fff;color:#111;overflow:hidden}',
      '.tbb-invoice-letterhead{display:grid;grid-template-columns:34mm 1fr 38mm;align-items:center;gap:8mm}',
      '.tbb-invoice-logo{width:30mm;height:auto}.tbb-invoice-company h2{margin:0 0 2mm;color:#003a83;font-size:15pt;font-weight:900}.tbb-invoice-company strong,.tbb-invoice-company span{display:block;font-size:7.5pt;line-height:1.35}.tbb-invoice-stamp{justify-self:end;border:1.5pt solid #999;padding:3mm 4mm;font-size:17pt;font-weight:900;font-style:italic;text-decoration:underline}',
      '.tbb-invoice-rule{height:1.2pt;background:#111;margin:5mm 0 7mm}.tbb-invoice-top{display:grid;grid-template-columns:78mm 1fr;gap:16mm;align-items:start;margin-bottom:6mm}.tbb-invoice-customer>span{display:block;margin:0 0 1mm;font-size:9pt}.tbb-invoice-box{min-height:21mm;border:1.2pt solid #111;padding:1.5mm;box-sizing:border-box;font-size:9pt;line-height:1.45}.tbb-invoice-box strong,.tbb-invoice-box span{display:block}.tbb-invoice-docs{display:grid;gap:6mm;padding-top:5mm}.tbb-invoice-docs div{display:grid;grid-template-columns:34mm 1fr;border:1.2pt solid #111;background:#eee;min-height:6mm;align-items:stretch;overflow:hidden}.tbb-invoice-docs span{height:100%;display:grid;place-items:center;border-right:1.2pt solid #111;text-align:center;font-size:9pt}.tbb-invoice-docs strong{height:100%;display:grid;place-items:center;text-align:center;font-size:9pt;font-weight:400;line-height:1.12;padding:.5mm}',
      '.tbb-invoice-table{width:100%;border-collapse:collapse;table-layout:fixed}.tbb-invoice-table th,.tbb-invoice-table td{border:1pt solid #111;padding:1.2mm;font-size:9pt;line-height:1.25}.tbb-invoice-table th{background:#c9c9c9;text-align:center;font-weight:900}.tbb-invoice-table .center{text-align:center}.money{text-align:right;font-variant-numeric:tabular-nums}.tbb-invoice-table .blank td{height:6mm}',
      '.tbb-invoice-summary-area{display:grid;grid-template-columns:minmax(0,1fr) 58mm;gap:7mm;align-items:start;width:100%;overflow:hidden;margin-top:1.5mm}.tbb-invoice-reference{min-width:0}.tbb-invoice-reference>span{display:block;font-size:8.5pt}.tbb-invoice-ref-row{display:grid;grid-template-columns:minmax(0,1fr) 38mm;gap:1.5mm;width:100%;max-width:100%}.tbb-invoice-ref-user,.tbb-invoice-ref-tax{height:18mm;display:flex;flex-direction:column;justify-content:center;text-align:center;font-size:8pt;line-height:1.25;padding:1mm;box-sizing:border-box;overflow:hidden}.tbb-invoice-ref-user{background:#d9d9d9;text-align:left;align-items:stretch}.tbb-invoice-ref-tax{background:#ffe28a}.tbb-invoice-bank{margin-top:2mm;border:1.2pt solid #111;padding:2mm 3mm;font-size:8.5pt}.tbb-invoice-bank span,.tbb-invoice-bank strong{display:block}',
      '.tbb-invoice-summary{width:100%;border-collapse:collapse;margin-top:7mm}.tbb-invoice-summary th,.tbb-invoice-summary td{border:0;padding:1.4mm 1mm;font-size:8.8pt}.tbb-invoice-summary th{text-align:left}.tbb-invoice-summary td{text-align:right;font-weight:900;white-space:nowrap}.tbb-invoice-summary .strong th,.tbb-invoice-summary .strong td,.tbb-invoice-summary .grand th,.tbb-invoice-summary .grand td{background:#c9c9c9;border-top:1.2pt solid #111;border-bottom:1.2pt solid #111;font-weight:900}.tbb-invoice-summary .grand th,.tbb-invoice-summary .grand td{border-bottom:2pt solid #111}',
      '.tbb-invoice-signature{width:78mm;margin:9mm 0 0 auto;text-align:center;font-size:10pt}.tbb-invoice-signature span,.tbb-invoice-signature strong{display:block}.tbb-invoice-signature img{display:block;width:28mm;height:22mm;object-fit:contain;margin:1mm auto .5mm}',
      '.tbb-invoice-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:18px}.tbb-invoice-head h2{margin:0;font-size:20px}.tbb-invoice-head strong{display:block;margin-top:18px;font-size:20px}.tbb-invoice-bottom{display:grid;grid-template-columns:1fr 260px;gap:20px;margin-top:20px}.tbb-purchase-sign{display:flex;justify-content:space-between;margin-top:70px;font-size:13px}.tbb-purchase-sign span{text-align:center;min-width:180px}'
    ].join('');
  }

  document.addEventListener('click', function (event) {
    const filterToggle = event.target.closest('#tbbFilterToggle');
    if (filterToggle) {
      toggleTbbFilterDropdown();
      return;
    }

    const filterOption = event.target.closest('[data-tbb-filter-option]');
    if (filterOption) {
      const values = elements.filterOptions.filter(function (option) {
        return option.checked;
      }).map(function (option) {
        return option.value;
      });
      setActiveFilterValues(values);
      return;
    }

    if (elements.filterControls && !event.target.closest('#tbbFilterControls')) {
      closeTbbFilterDropdown();
    }

    const sortHeader = event.target.closest('[data-tbb-sort-key]');
    if (sortHeader && !event.target.closest('.client-col-resize-handle')) {
      setTbbSort(sortHeader.getAttribute('data-tbb-sort-type'), sortHeader.getAttribute('data-tbb-sort-key'));
      return;
    }

    const tab = event.target.closest('[data-tbb-tab]');
    if (tab) {
      state.activeTab = tab.getAttribute('data-tbb-tab');
      const url = new URL(window.location.href);
      url.searchParams.set('tab', state.activeTab === 'sales' ? 'penjualan' : (state.activeTab === 'purchases' ? 'pembelian' : 'kontrol'));
      window.history.replaceState({}, '', url.toString());
      renderTabs();
      renderRows();
      return;
    }

    const action = event.target.closest('[data-tbb-action]');
    if (action) {
      const type = action.getAttribute('data-tbb-type');
      const id = action.getAttribute('data-tbb-id');
      const actionName = action.getAttribute('data-tbb-action');
      if (actionName === 'view') openInvoice(type, id);
      if (actionName === 'file') openAttachment(type, id);
      if (actionName === 'pay') openSettlementForEntry(type, findEntry(type, id));
      if (actionName === 'edit') openEntryModal(type, findEntry(type, id));
      if (actionName === 'delete') deleteEntry(type, id);
      return;
    }

    const dataRow = event.target.closest('[data-tbb-row-id]');
    if (dataRow && !event.target.closest('button, a, input, select, textarea')) {
      const type = dataRow.getAttribute('data-tbb-row-type');
      const id = dataRow.getAttribute('data-tbb-row-id');
      if (!isSelectableRowType(type)) return;
      clearRowClickTimer();
      openEntryModal(type, findEntry(type, id), { readOnly: true });
      return;
    }

    const inputChoice = event.target.closest('[data-tbb-input-choice]');
    if (inputChoice) {
      const choice = inputChoice.getAttribute('data-tbb-input-choice');
      const type = state.activeTab;
      closeInputChoiceModal();
      if (choice === 'settlement') openSettlementModal(type);
      else openEntryModal(type);
      return;
    }

    if (event.target.closest('[data-tbb-add-line]')) {
      appendLine(defaultLineFromHeader());
      return;
    }

    const removeAttachment = event.target.closest('[data-tbb-remove-attachment]');
    if (removeAttachment) {
      const key = removeAttachment.getAttribute('data-tbb-remove-attachment');
      state.entryAttachmentFiles = (state.entryAttachmentFiles || []).filter(function (file, index) {
        return attachmentFileKey(file, index) !== key;
      });
      state.entryAttachmentDirty = true;
      renderAttachmentManager();
      return;
    }

    const previewAttachment = event.target.closest('[data-tbb-preview-attachment]');
    if (previewAttachment && !event.target.closest('[data-tbb-remove-attachment]')) {
      const key = previewAttachment.getAttribute('data-tbb-preview-attachment');
      const file = (state.entryAttachmentFiles || []).find(function (item, index) {
        return attachmentFileKey(item, index) === key;
      }) || (key.indexOf('new-') === 0 ? selectedUploadFiles()[Number(key.slice(4))] : null);
      previewAttachmentFile(file);
      return;
    }

    if (event.target.closest('[data-tbb-clear-new-attachments]')) {
      if (typeof window.clientPortalClearUploadSelection === 'function') {
        window.clientPortalClearUploadSelection(elements.attachmentFile);
      } else if (elements.attachmentFile) {
        elements.attachmentFile.value = '';
      }
      renderAttachmentManager();
      return;
    }

    if (event.target.closest('[data-tbb-add-settlement-line]')) {
      appendSettlementLine();
      return;
    }

    const removeLine = event.target.closest('[data-tbb-remove-line]');
    if (removeLine) {
      const row = removeLine.closest('.tbb-line-row');
      if (row) row.remove();
      const list = elements.entryBody.querySelector('.tbb-lines-list');
      if (list && !list.querySelector('.tbb-line-row')) appendLine(defaultLineFromHeader());
      recalculateModalTotals();
      return;
    }

    const removeSettlementLine = event.target.closest('[data-tbb-remove-settlement-line]');
    if (removeSettlementLine) {
      const row = removeSettlementLine.closest('.tbb-settlement-row');
      if (row) row.remove();
      const list = elements.entryBody.querySelector('.tbb-settlement-list');
      if (list && !list.querySelector('.tbb-settlement-row')) appendSettlementLine();
      recalculateModalTotals();
      return;
    }

    if (event.target.closest('[data-tbb-fill-from-sale]')) {
      fillPurchaseFromSelectedSale();
    }
  });

  document.addEventListener('dblclick', function (event) {
    if (event.target.closest('button, a, input, select, textarea')) return;
    const row = event.target.closest('[data-tbb-row-id]');
    if (!row) return;
    const type = row.getAttribute('data-tbb-row-type');
    const id = row.getAttribute('data-tbb-row-id');
    if (!isSelectableRowType(type)) return;
    clearRowClickTimer();
    openEntryModal(type, findEntry(type, id), { readOnly: true });
  });

  document.addEventListener('keydown', function (event) {
    const sortHeader = event.target.closest('[data-tbb-sort-key]');
    if (!sortHeader || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    setTbbSort(sortHeader.getAttribute('data-tbb-sort-type'), sortHeader.getAttribute('data-tbb-sort-key'));
  });

  elements.entryBody.addEventListener('input', function (event) {
    if (event.target.matches('[data-line-field], [data-tbb-field]')) {
      if (event.target.matches('[data-tbb-field="settleAll"]')) return;
      if (event.target.matches('[data-line-field="paymentAmount"]')) {
        const row = event.target.closest('.tbb-line-row');
        if (row && parseAmount(row.getAttribute('data-settlement-paid')) > 0) {
          row.setAttribute('data-settlement-replaced', 'true');
        }
      }
      if (event.target.matches('[data-line-field="supplierCode"], [data-line-field="supplierName"]')) syncLineSupplier(event.target);
      if (event.target.matches('[data-line-field="fishCode"], [data-line-field="fishName"]')) syncLineFish(event.target);
      if (event.target.matches('[data-tbb-field="customerCode"]')) syncCustomer('code');
      if (event.target.matches('[data-tbb-field="customerName"]')) syncCustomer('name');
      if (event.target.matches('[data-tbb-field="supplierCode"]')) syncHeaderSupplier('code');
      if (event.target.matches('[data-tbb-field="supplierName"]')) syncHeaderSupplier('name');
      recalculateModalTotals(event.target);
    }
    if (event.target.matches('[data-settlement-field]')) {
      if (event.target.matches('[data-settlement-field="entityCode"], [data-settlement-field="entityName"]')) {
        syncSettlementEntity(event.target);
      }
      recalculateModalTotals(event.target);
    }
  });

  elements.entryBody.addEventListener('change', function (event) {
    if (event.target.matches('[data-tbb-field="settlementMode"]')) rerenderSettlementSection();
    if (event.target.matches('[data-settlement-field="entityCode"], [data-settlement-field="entityName"]')) syncSettlementEntity(event.target);
    if (event.target.matches('[data-settlement-field="invoiceNo"], [data-settlement-field="settleAll"]')) recalculateModalTotals(event.target);
    if (event.target.matches('[data-tbb-field="settleAll"]')) {
      applySettleAll(event.target.checked);
      return;
    }
    if (event.target.matches('[data-line-field="paymentAuto"]')) {
      const row = event.target.closest('.tbb-line-row');
      const paymentInput = row?.querySelector('[data-line-field="paymentAmount"]');
      if (row && parseAmount(row.getAttribute('data-settlement-paid')) > 0) {
        row.setAttribute('data-settlement-replaced', 'true');
      }
      if (!event.target.checked && paymentInput) paymentInput.value = '';
    }
    if (event.target.matches('[data-tbb-field="salesInvoiceNo"]')) fillPurchaseFromSelectedSale();
    if (event.target.matches('[data-line-field="supplierCode"], [data-line-field="supplierName"]')) syncLineSupplier(event.target);
    if (event.target.matches('[data-line-field="fishCode"], [data-line-field="fishName"]')) syncLineFish(event.target);
    recalculateModalTotals(event.target);
  });

  elements.entryBody.addEventListener('keydown', function (event) {
    if (state.entryReadOnly || event.key !== 'Enter') return;
    if (!event.target.matches('[data-line-field]')) return;
    event.preventDefault();
    const row = appendLine(defaultLineFromHeader());
    const focusTarget = row?.querySelector('[data-line-field="fishCode"]')
      || row?.querySelector('[data-line-field="supplierCode"]');
    if (focusTarget) focusTarget.focus();
  });

  if (elements.addButton) {
    elements.addButton.addEventListener('click', function () {
      openInputChoiceModal(state.activeTab);
    });
  }
  if (elements.choiceCloseButton) elements.choiceCloseButton.addEventListener('click', closeInputChoiceModal);
  if (elements.importButton && elements.importInput) {
    elements.importButton.addEventListener('click', function () {
      elements.importInput.click();
    });
    elements.importInput.addEventListener('change', function () {
      importWorkbook(elements.importInput.files && elements.importInput.files[0]);
    });
  }
    if (elements.attachmentFile) {
      elements.attachmentFile.addEventListener('change', queueSelectedAttachmentFiles);
      elements.attachmentFile.addEventListener('client-portal-upload-files', queueSelectedAttachmentFiles);
    }
  if (elements.attachmentPickButton) {
    elements.attachmentPickButton.addEventListener('click', function () {
      if (elements.attachmentFile && !elements.attachmentFile.disabled) elements.attachmentFile.click();
    });
  }
  if (elements.journalButton) elements.journalButton.addEventListener('click', openJournal);
  if (elements.exportButton) elements.exportButton.addEventListener('click', exportActiveTbbRows);
  if (elements.refreshButton) {
    elements.refreshButton.addEventListener('click', function () {
      loadData().catch(function (err) { setAlert(err.message, 'error'); });
    });
  }
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', function () {
      state.searchTerm = elements.searchInput.value;
      renderRows();
    });
  }
  if (elements.searchButton) {
    elements.searchButton.addEventListener('click', function () {
      state.searchTerm = elements.searchInput.value;
      renderRows();
    });
  }
  if (elements.entryForm) elements.entryForm.addEventListener('submit', submitEntry);
  if (elements.entryLayoutButton) {
    elements.entryLayoutButton.addEventListener('click', function () {
      setEntryLineLayout('table');
    });
  }
  if (elements.entryCloseButton) elements.entryCloseButton.addEventListener('click', closeEntryModal);
  if (elements.entryCancelButton) elements.entryCancelButton.addEventListener('click', closeEntryModal);
  if (elements.invoiceCloseButton) elements.invoiceCloseButton.addEventListener('click', closeInvoice);
  if (elements.invoiceCancelButton) elements.invoiceCancelButton.addEventListener('click', closeInvoice);
  if (elements.invoicePrintButton) elements.invoicePrintButton.addEventListener('click', printInvoice);
  if (elements.journalCloseButton) elements.journalCloseButton.addEventListener('click', closeJournal);
  if (elements.journalCancelButton) elements.journalCancelButton.addEventListener('click', closeJournal);
  document.addEventListener('client:table-widths-changed', function (event) {
    if (event.target && (event.target.id === 'tbbSalesTable' || event.target.id === 'tbbPurchaseTable')) {
      compactTbbDisplayTable(event.target);
    }
  });
  window.addEventListener('resize', compactTbbDisplayTables);
  setupTbbSortHeaders();
  window.addEventListener('load', function () {
    initTbbResizableTables();
    compactTbbDisplayTables();
  });

  loadData().catch(function (err) {
    setAlert(err.message || 'Gagal memuat transaksi DEMO_DISTRIBUTION.', 'error');
  });
})();
