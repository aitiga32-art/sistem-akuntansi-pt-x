(function () {
  'use strict';

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  const state = {
    client: null,
    entries: [],
    activeEntry: null,
    searchTerm: '',
    loading: false
  };

  const ALERT_INFO_TIMEOUT_MS = 3600;
  let alertHideTimer = 0;

  const elements = {
    alert: document.getElementById('poCustomerAlert'),
    clientMeta: document.getElementById('poCustomerClientMeta'),
    userName: document.getElementById('poCustomerUserName'),
    userEmail: document.getElementById('poCustomerUserEmail'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    refreshButton: document.getElementById('poCustomerRefreshBtn'),
    backLink: document.getElementById('poCustomerBackLink'),
    pageTitle: document.getElementById('poCustomerTitle'),
    subtitle: document.getElementById('poCustomerSubtitle'),
    detailTotals: document.getElementById('poCustomerDetailTotals'),
    totalPo: document.getElementById('poCustomerTotalPo'),
    totalPurchase: document.getElementById('poCustomerTotalPurchase'),
    totalMargin: document.getElementById('poCustomerTotalMargin'),
    addButton: document.getElementById('poCustomerAddBtn'),
    searchInput: document.getElementById('poCustomerSearchInput'),
    count: document.getElementById('poCustomerCount'),
    table: document.getElementById('poCustomerTable'),
    tableWrap: document.getElementById('poCustomerTable')?.closest('.cashbook-table-wrap'),
    tableHead: document.getElementById('poCustomerTableHead'),
    rows: document.getElementById('poCustomerRows'),

    formModal: document.getElementById('poCustomerFormModal'),
    form: document.getElementById('poCustomerForm'),
    formTitle: document.getElementById('poCustomerFormTitle'),
    formMeta: document.getElementById('poCustomerFormMeta'),
    formCloseButton: document.getElementById('poCustomerFormCloseBtn'),
    formCancelButton: document.getElementById('poCustomerFormCancelBtn'),
    formSaveButton: document.getElementById('poCustomerFormSaveBtn'),
    entryId: document.getElementById('poCustomerEntryId'),
    poNo: document.getElementById('poCustomerPoNo'),
    poDate: document.getElementById('poCustomerPoDate'),
    customerName: document.getElementById('poCustomerCustomerName'),
    itemRows: document.getElementById('poCustomerItemRows'),
    addItemButton: document.getElementById('poCustomerAddItemBtn'),
    addItemBottomButton: document.getElementById('poCustomerAddItemBottomBtn'),

    realizationModal: document.getElementById('poCustomerRealizationModal'),
    realizationDialog: document.querySelector('#poCustomerRealizationModal .po-customer-realization-modal'),
    realizationForm: document.getElementById('poCustomerRealizationForm'),
    realizationTitle: document.getElementById('poCustomerRealizationTitle'),
    realizationMeta: document.getElementById('poCustomerRealizationMeta'),
    realizationCloseButton: document.getElementById('poCustomerRealizationCloseBtn'),
    realizationCancelButton: document.getElementById('poCustomerRealizationCancelBtn'),
    realizationSaveButton: document.getElementById('poCustomerRealizationSaveBtn'),
    realizationEntryId: document.getElementById('poCustomerRealizationEntryId'),
    realizationProductName: document.getElementById('poCustomerRealizationProductName'),
    realizationRequestedQty: document.getElementById('poCustomerRealizationRequestedQty'),
    realizationUnitPrice: document.getElementById('poCustomerRealizationUnitPrice'),
    realizationRequestedTotal: document.getElementById('poCustomerRealizationRequestedTotal'),
    purchaseLineRows: document.getElementById('poCustomerPurchaseLineRows'),
    addPurchaseLineButton: document.getElementById('poCustomerAddPurchaseLineBtn'),
    purchaseDate: document.getElementById('poCustomerPurchaseDate'),
    qtyGapNote: document.getElementById('poCustomerQtyGapNote'),
    realizationNotes: document.getElementById('poCustomerRealizationNotes'),

    uploadModal: document.getElementById('poCustomerUploadModal'),
    uploadForm: document.getElementById('poCustomerUploadForm'),
    uploadTitle: document.getElementById('poCustomerUploadTitle'),
    uploadMeta: document.getElementById('poCustomerUploadMeta'),
    uploadCloseButton: document.getElementById('poCustomerUploadCloseBtn'),
    uploadCancelButton: document.getElementById('poCustomerUploadCancelBtn'),
    uploadSaveButton: document.getElementById('poCustomerUploadSaveBtn'),
    uploadEntryId: document.getElementById('poCustomerUploadEntryId'),
    attachmentFile: document.getElementById('poCustomerAttachmentFile'),
    attachmentNote: document.getElementById('poCustomerAttachmentNote'),

    actionModal: document.getElementById('poCustomerActionModal'),
    actionTitle: document.getElementById('poCustomerActionTitle'),
    actionMeta: document.getElementById('poCustomerActionMeta'),
    actionBody: document.getElementById('poCustomerActionBody'),
    actionCloseButton: document.getElementById('poCustomerActionCloseBtn'),
    actionDoneButton: document.getElementById('poCustomerActionDoneBtn'),

    fileModal: document.getElementById('poCustomerFileModal'),
    fileTitle: document.getElementById('poCustomerFileTitle'),
    fileMeta: document.getElementById('poCustomerFileMeta'),
    fileCloseButton: document.getElementById('poCustomerFileCloseBtn'),
    fileViewer: document.getElementById('poCustomerFileViewer')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/po-customer/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/po-customer';
  }

  function pageBaseUrl() {
    return window.location.pathname;
  }

  function currentPoKey() {
    return text(new URLSearchParams(window.location.search).get('po'));
  }

  function setPoUrl(key) {
    const url = key ? pageBaseUrl() + '?po=' + encodeURIComponent(key) : pageBaseUrl();
    window.history.pushState({ poKey: key || '' }, '', url);
    state.searchTerm = '';
    if (elements.searchInput) elements.searchInput.value = '';
    renderPage();
  }

  function entryPoKey(entry) {
    const parts = [text(entry && entry.poNo), text(entry && entry.poDate), text(entry && entry.customerName)];
    return parts.some(Boolean) ? parts.join('|') : text(entry && entry.id);
  }

  function poGroups() {
    const groups = new Map();
    state.entries.forEach(function (entry) {
      const key = entryPoKey(entry);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          poNo: text(entry.poNo),
          poDate: text(entry.poDate),
          customerName: text(entry.customerName),
          entries: []
        });
      }
      groups.get(key).entries.push(entry);
    });
    return Array.from(groups.values()).map(function (group) {
      group.requestedTotal = group.entries.reduce(function (sum, entry) {
        return sum + entryRequestedTotal(entry);
      }, 0);
      group.purchaseTotal = group.entries.reduce(function (sum, entry) {
        return sum + entryPurchaseTotal(entry);
      }, 0);
      group.hasAttachment = group.entries.some(function (entry) {
        return Boolean(entry.hasAttachment);
      });
      group.entries.sort(compareItemNo);
      group.status = groupStatusLabel(group);
      return group;
    });
  }

  function compareItemNo(a, b) {
    const aText = text(a && a.itemNo);
    const bText = text(b && b.itemNo);
    const aNumber = Number(aText.replace(',', '.'));
    const bNumber = Number(bText.replace(',', '.'));
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber) && aNumber !== bNumber) return aNumber - bNumber;
    if (Number.isFinite(aNumber) && !Number.isFinite(bNumber)) return -1;
    if (!Number.isFinite(aNumber) && Number.isFinite(bNumber)) return 1;
    return aText.localeCompare(bText, 'id', { numeric: true, sensitivity: 'base' });
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function setAlert(message, kind) {
    if (!elements.alert) return;
    if (alertHideTimer) {
      window.clearTimeout(alertHideTimer);
      alertHideTimer = 0;
    }
    elements.alert.hidden = !message;
    elements.alert.textContent = message || '';
    elements.alert.className = 'portal-alert' + (kind ? ' ' + kind : '');
    if (message && kind === 'info') {
      const expectedMessage = message;
      alertHideTimer = window.setTimeout(function () {
        if (!elements.alert || elements.alert.textContent !== expectedMessage) return;
        elements.alert.hidden = true;
        elements.alert.textContent = '';
        elements.alert.className = 'portal-alert';
        alertHideTimer = 0;
      }, ALERT_INFO_TIMEOUT_MS);
    }
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function todayIso() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function parseAmount(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
    const cleaned = String(value)
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
  }

  function roundAmount(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0;
  }

  function formatAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount === 0) return '0';
    return currency.format(amount);
  }

  function splitDppPpnFromInclusiveTotal(total) {
    const amount = Number(total || 0);
    if (!Number.isFinite(amount) || amount <= 0) return { dpp: 0, ppn: 0 };
    const dpp = Math.round((amount / 1.11) * 100) / 100;
    const ppn = Math.round((dpp * 0.11) * 100) / 100;
    return { dpp, ppn };
  }

  function purchaseTaxFromTotal(total, taxMode) {
    const amount = roundAmount(total);
    if (amount <= 0) return { dpp: 0, ppn: 0 };
    return text(taxMode).toLowerCase() === 'ppn'
      ? splitDppPpnFromInclusiveTotal(amount)
      : { dpp: amount, ppn: 0 };
  }

  function formatAmountInput(input) {
    if (!input) return;
    if (!text(input.value)) return;
    input.value = formatAmount(parseAmount(input.value));
  }

  function formatQty(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount === 0) return '0';
    return currency.format(amount);
  }

  function formatDate(value) {
    const date = text(value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
    return date.slice(8, 10) + '/' + date.slice(5, 7) + '/' + date.slice(0, 4);
  }

  function requestJson(url, options) {
    const merged = Object.assign({
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    }, options || {});
    if (merged.body && !merged.headers['Content-Type']) {
      merged.headers = Object.assign({}, merged.headers, { 'Content-Type': 'application/json' });
    }
    return fetch(url, merged).then(function (response) {
      if (response.status === 401) {
        window.location.assign('/app/client/login?expired=' + Date.now());
        return null;
      }
      return response.json().catch(function () {
        return {};
      }).then(function (data) {
        if (!response.ok || data.ok === false) throw new Error(data.error || 'Permintaan gagal diproses.');
        return data;
      });
    });
  }

  async function loadPage() {
    if (state.loading) return;
    const clientId = clientIdFromPath();
    if (!clientId) {
      setAlert('Klien tidak valid.', 'error');
      return;
    }
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      state.entries = normalizeEntriesForRender(data.entries);
      renderClient();
      renderPage();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat PO Customer.', 'error');
      renderEmpty('PO Customer belum bisa dimuat.');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
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
    setText(elements.clientMeta, text(client.name, 'Client Portal'));
    setText(elements.subtitle, text(client.name, 'Klien') + ' | PO customer dan realisasi pembelian');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function renderPage() {
    const group = activePoGroup();
    if (currentPoKey() && !group) {
      setPoUrl('');
      return;
    }
    renderModeShell(group);
    if (group) {
      renderPoDetail(group);
      return;
    }
    renderPoList();
  }

  function activePoGroup() {
    const key = currentPoKey();
    if (!key) return null;
    return poGroups().find(function (group) {
      return group.key === key;
    }) || null;
  }

  function renderModeShell(group) {
    const client = state.client || {};
    if (group) {
      document.title = 'Detail PO Customer - Client Portal';
      setText(elements.pageTitle, 'Detail PO Customer');
      setText(elements.subtitle, [
        text(client.name, 'Klien'),
        text(group.poNo, 'Tanpa No PO'),
        formatDate(group.poDate) || ''
      ].filter(Boolean).join(' | '));
      renderDetailTotals(group);
      if (elements.backLink) {
        elements.backLink.href = pageBaseUrl();
        const label = elements.backLink.querySelector('span');
        if (label) label.textContent = 'Daftar PO';
      }
      if (elements.addButton) elements.addButton.textContent = 'Tambah Barang';
      if (elements.searchInput) elements.searchInput.placeholder = 'Cari barang / supplier / invoice';
      return;
    }
    document.title = 'PO Customer - Client Portal';
    setText(elements.pageTitle, 'PO Customer');
    setText(elements.subtitle, text(client.name, 'Klien') + ' | daftar PO customer');
    renderDetailTotals(null);
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
      const label = elements.backLink.querySelector('span');
      if (label) label.textContent = 'Menu Klien';
    }
    if (elements.addButton) elements.addButton.textContent = 'Tambah PO';
    if (elements.searchInput) elements.searchInput.placeholder = 'Cari PO / customer';
  }

  function entryRequestedTotal(entry) {
    const stored = Number(entry && entry.requestedTotal);
    if (Number.isFinite(stored) && stored > 0) return stored;
    return parseAmount(entry && entry.unitPrice) * parseAmount(entry && entry.requestedQty);
  }

  function entryRequestedQty(entry) {
    return parseAmount(entry && entry.requestedQty);
  }

  function entryPurchaseQty(entry) {
    return parseAmount(entry && entry.purchaseQty);
  }

  function qtyGap(entry) {
    const requestedQty = entryRequestedQty(entry);
    const purchaseQty = entryPurchaseQty(entry);
    if (!(requestedQty > 0) || !(purchaseQty > 0) || purchaseQty >= requestedQty) return 0;
    return Math.round((requestedQty - purchaseQty) * 100) / 100;
  }

  function hasQtyGap(entry) {
    return qtyGap(entry) > 0;
  }

  function entryPurchaseTotal(entry) {
    const stored = Number(entry && entry.purchaseTotal);
    if (Number.isFinite(stored) && stored > 0) return stored;
    return parseAmount(entry && entry.purchaseUnitPrice) * parseAmount(entry && entry.purchaseQty);
  }

  function entryPurchaseTaxTotals(entry) {
    const lines = Array.isArray(entry && entry.purchaseLines)
      ? entry.purchaseLines.map(normalizePurchaseLineForForm).filter(purchaseLineHasSummaryContent)
      : [];
    if (lines.length) {
      return lines.reduce(function (totals, line) {
        const tax = purchaseTaxFromTotal(parseAmount(line.purchaseTotal), line.purchaseTaxMode);
        totals.dpp += tax.dpp;
        totals.ppn += tax.ppn;
        return totals;
      }, { dpp: 0, ppn: 0 });
    }
    return purchaseTaxFromTotal(entryPurchaseTotal(entry), entry && entry.purchaseTaxMode);
  }

  function entryPurchaseDppTotal(entry) {
    return roundAmount(entryPurchaseTaxTotals(entry).dpp);
  }

  function entryPurchasePpnTotal(entry) {
    return roundAmount(entryPurchaseTaxTotals(entry).ppn);
  }

  function filteredPoGroups() {
    const term = state.searchTerm.toLowerCase();
    const groups = poGroups();
    if (!term) return groups;
    return groups.filter(function (group) {
      return group.entries.some(function (entry) {
        return searchableEntryValues(entry).some(function (value) {
          return text(value).toLowerCase().indexOf(term) !== -1;
        });
      });
    });
  }

  function filteredDetailEntries(group) {
    const term = state.searchTerm.toLowerCase();
    const entries = group.entries.slice().sort(compareItemNo);
    if (!term) return entries;
    return entries.filter(function (entry) {
      return searchableEntryValues(entry).some(function (value) {
        return text(value).toLowerCase().indexOf(term) !== -1;
      });
    });
  }

  function searchableEntryValues(entry) {
    return [
      entry.poNo,
      entry.poDate,
      entry.customerName,
      entry.productName,
      entry.brandType,
      entry.specification,
      entry.illustration,
      entry.unit,
      entry.supplierName,
      entry.purchaseInvoiceNo,
      entry.notes,
      entry.realizationNotes,
      entry.attachmentName
    ].concat((Array.isArray(entry.purchaseLines) ? entry.purchaseLines : []).flatMap(function (line) {
      return [line.supplierName, line.purchaseInvoiceNo, line.productName];
    }));
  }

  function setTableHeaders(headers, modeClass, groups) {
    if (elements.table) {
      elements.table.classList.remove('po-customer-list-table', 'po-customer-detail-table', 'po-customer-resize-v4', 'po-customer-resize-v5');
      elements.table.classList.add(modeClass, 'po-customer-resize-v5');
      if (modeClass === 'po-customer-detail-table') {
        elements.table.dataset.clientDefaultAutofit = 'true';
      } else {
        delete elements.table.dataset.clientDefaultAutofit;
      }
      resetPoCustomerResizeState();
    }
    syncStickySalesHeaderMode(modeClass === 'po-customer-detail-table');
    const thead = elements.tableHead ? elements.tableHead.parentElement : null;
    if (thead) {
      Array.from(thead.querySelectorAll('.po-customer-group-head')).forEach(function (row) {
        row.remove();
      });
      if (Array.isArray(groups) && groups.length) {
        const groupRow = document.createElement('tr');
        groupRow.className = 'po-customer-group-head';
        groups.forEach(function (group) {
          const th = document.createElement('th');
          th.colSpan = group.colspan;
          th.textContent = group.label;
          if (group.className) th.className = group.className;
          groupRow.appendChild(th);
        });
        thead.insertBefore(groupRow, elements.tableHead);
      }
    }
    clearNode(elements.tableHead);
    headers.forEach(function (label) {
      const th = document.createElement('th');
      th.textContent = label;
      elements.tableHead.appendChild(th);
    });
  }

  function resetPoCustomerResizeState() {
    if (!elements.table) return;
    elements.table.dataset.clientResizableColumns = '';
    elements.table.style.width = '';
    elements.table.style.minWidth = '';
    elements.table.classList.remove('client-resizable-table', 'client-table-is-resizing');
    elements.table.querySelectorAll('.client-col-resize-handle').forEach(function (handle) {
      handle.remove();
    });
    elements.table.querySelectorAll('.client-resizable-column-head').forEach(function (header) {
      header.classList.remove('client-resizable-column-head');
    });
  }

  function scheduleTableEnhancements(forceReset) {
    if (forceReset) resetPoCustomerResizeState();
    [0, 80, 220].forEach(function (delay) {
      window.setTimeout(function () {
        if (window.clientPortalInitResizableTables && elements.table) {
          window.clientPortalInitResizableTables(elements.table);
        }
        syncStickySalesColumns();
      }, delay);
    });
  }

  function syncStickySalesColumns() {
    if (!elements.table || !elements.table.classList.contains('po-customer-detail-table')) return;
    const noWidth = detailColumnWidth(1, 48);
    const productWidth = detailColumnWidth(2, 156);
    const qtyWidth = detailColumnWidth(8, 76);
    const totalWidth = detailColumnWidth(9, 128);
    const stickyWidth = noWidth + productWidth + qtyWidth + totalWidth;
    elements.table.style.setProperty('--po-sticky-product-left', Math.round(noWidth) + 'px');
    elements.table.style.setProperty('--po-sticky-qty-left', Math.round(noWidth + productWidth) + 'px');
    elements.table.style.setProperty('--po-sticky-total-left', Math.round(noWidth + productWidth + qtyWidth) + 'px');
    elements.table.style.setProperty('--po-sticky-sales-width', Math.round(stickyWidth) + 'px');
    if (elements.tableWrap) {
      elements.tableWrap.style.setProperty('--po-sticky-sales-width', Math.round(stickyWidth) + 'px');
    }
    syncStickySalesHeaderActive();
  }

  function syncStickySalesHeaderMode(isDetail) {
    if (!elements.tableWrap) return;
    elements.tableWrap.classList.toggle('po-customer-detail-wrap', Boolean(isDetail));
    if (!isDetail) {
      elements.tableWrap.classList.remove('po-customer-sticky-sales-active');
      return;
    }
    syncStickySalesHeaderActive();
  }

  function syncStickySalesHeaderActive() {
    if (!elements.tableWrap || !elements.table || !elements.table.classList.contains('po-customer-detail-table')) return;
    elements.tableWrap.classList.toggle('po-customer-sticky-sales-active', elements.tableWrap.scrollLeft > 4);
  }

  function detailColumnWidth(index, fallback) {
    if (!elements.table) return fallback;
    const col = elements.table.querySelector(':scope > colgroup[data-client-resize-colgroup="true"] > col:nth-child(' + index + ')');
    const colWidth = col ? parseFloat(col.style.width) : 0;
    if (Number.isFinite(colWidth) && colWidth > 0) return colWidth;
    const header = elements.tableHead && elements.tableHead.cells ? elements.tableHead.cells[index - 1] : null;
    const headerWidth = header ? header.getBoundingClientRect().width : 0;
    return Number.isFinite(headerWidth) && headerWidth > 0 ? headerWidth : fallback;
  }

  function renderPoList() {
    setTableHeaders([
      'No',
      'No PO',
      'Tanggal PO',
      'Customer',
      'Jumlah Barang',
      'Total Price (Inc PPN)',
      'Total Realisasi',
      'Status',
      'File'
    ], 'po-customer-list-table');
    const groups = filteredPoGroups();
    clearNode(elements.rows);
    setText(elements.count, groups.length + ' PO');
    if (!groups.length) {
      renderEmpty(state.entries.length ? 'Data tidak ditemukan.' : 'Belum ada PO Customer.');
      scheduleTableEnhancements(true);
      return;
    }
    groups.forEach(function (group, index) {
      const row = document.createElement('tr');
      row.className = 'po-customer-row';
      if (group.entries.some(hasQtyGap)) row.classList.add('po-customer-row-incomplete');
      row.tabIndex = 0;
      row.dataset.poKey = group.key;
      row.title = 'Klik untuk membuka detail barang PO.';
      row.appendChild(cell(String(index + 1), 'number'));
      row.appendChild(cell(text(group.poNo, '-'), 'strong-cell'));
      row.appendChild(cell(formatDate(group.poDate) || '-'));
      row.appendChild(cell(text(group.customerName, '-')));
      row.appendChild(cell(formatQty(group.entries.length), 'number'));
      row.appendChild(cell(formatAmount(group.requestedTotal), 'number'));
      row.appendChild(cell(formatAmount(group.purchaseTotal), 'number'));
      row.appendChild(statusBadgeCell(group.status));
      row.appendChild(cell(group.hasAttachment ? 'Ada file' : '-', group.hasAttachment ? 'po-customer-file-cell' : ''));
      row.addEventListener('click', function () {
        setPoUrl(group.key);
      });
      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setPoUrl(group.key);
        }
      });
      elements.rows.appendChild(row);
    });
    scheduleTableEnhancements(true);
  }

  function renderPoDetail(group) {
    setTableHeaders([
      'No',
      'Product Name',
      'Klasifikasi',
      'Specification',
      'Illustration',
      'Unit',
      'Unit Price',
      'Qty',
      'Total Price (Inc PPN)',
      'DPP',
      'PPN',
      'Notes',
      'Status',
      'Supplier',
      'No Invoice Beli',
      'Tgl Beli',
      'Harga Beli',
      'Qty Beli',
      'Total Beli',
      'DPP Beli',
      'PPN Beli',
      'Catatan Realisasi',
      'File',
      'Margin'
    ], 'po-customer-detail-table', [
      { label: 'Penjualan / PO Customer', colspan: 13, className: 'po-customer-sales-group' },
      { label: 'Pembelian / Realisasi', colspan: 10, className: 'po-customer-purchase-group' },
      { label: 'Analisis Margin', colspan: 1, className: 'po-customer-margin-group' }
    ]);
    const entries = filteredDetailEntries(group);
    clearNode(elements.rows);
    setText(elements.count, entries.length + ' barang');
    if (!entries.length) {
      renderEmpty(group.entries.length ? 'Data barang tidak ditemukan.' : 'Belum ada barang dalam PO ini.');
      scheduleTableEnhancements(true);
      return;
    }
    entries.forEach(function (entry, index) {
      const row = document.createElement('tr');
      row.className = 'po-customer-row';
      if (hasQtyGap(entry)) row.classList.add('po-customer-row-incomplete');
      row.tabIndex = 0;
      row.dataset.entryId = entry.id;
      row.title = 'Klik baris barang untuk membuka menu aksi.';
      row.appendChild(cell(text(entry.itemNo, String(index + 1)), 'number'));
      row.appendChild(cell(text(entry.productName, '-'), 'strong-cell'));
      row.appendChild(cell(text(entry.brandType, '-')));
      row.appendChild(cell(text(entry.specification, '-'), 'po-customer-long-cell'));
      row.appendChild(cell(text(entry.illustration, '-')));
      row.appendChild(cell(text(entry.unit, '-')));
      row.appendChild(cell(formatAmount(entry.unitPrice), 'number'));
      row.appendChild(cell(formatQty(entry.requestedQty), 'number'));
      row.appendChild(cell(formatAmount(entryRequestedTotal(entry)), 'number'));
      row.appendChild(cell(formatAmount(entry.requestedDpp), 'number'));
      row.appendChild(cell(formatAmount(entry.requestedPpn), 'number'));
      row.appendChild(cell(text(entry.notes, '-'), 'po-customer-long-cell'));
      row.appendChild(statusCell(entry));
      row.appendChild(cell(text(entry.supplierName, '-')));
      row.appendChild(cell(text(entry.purchaseInvoiceNo, '-')));
      row.appendChild(cell(formatDate(entry.purchaseDate) || '-'));
      row.appendChild(cell(formatAmount(entry.purchaseUnitPrice), 'number'));
      row.appendChild(cell(formatQty(entry.purchaseQty), 'number'));
      row.appendChild(cell(formatAmount(entryPurchaseTotal(entry)), 'number'));
      row.appendChild(cell(formatAmount(entryPurchaseDppTotal(entry)), 'number'));
      row.appendChild(cell(formatAmount(entryPurchasePpnTotal(entry)), 'number'));
      row.appendChild(cell(text(entry.realizationNotes, '-'), 'po-customer-long-cell'));
      row.appendChild(fileCell(entry));
      row.appendChild(cell(formatAmount(entryMargin(entry)), entryMargin(entry) < 0 ? 'number po-customer-margin-cell negative' : 'number po-customer-margin-cell'));
      row.addEventListener('click', function () {
        openActionModal(entry);
      });
      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openActionModal(entry);
        }
      });
      elements.rows.appendChild(row);
    });
    scheduleTableEnhancements(true);
  }

  function renderEmpty(message) {
    clearNode(elements.rows);
    const row = document.createElement('tr');
    const empty = document.createElement('td');
    empty.colSpan = currentPoKey() ? 24 : 9;
    empty.className = 'po-customer-empty';
    empty.textContent = message;
    row.appendChild(empty);
    elements.rows.appendChild(row);
    setText(elements.count, currentPoKey() ? '0 barang' : '0 PO');
  }

  function cell(value, className) {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.textContent = value;
    return td;
  }

  function fileCell(entry) {
    const td = document.createElement('td');
    td.className = 'po-customer-file-cell';
    if (!entry || !entryHasAnyAttachment(entry)) {
      td.textContent = 'Belum upload';
      td.classList.add('is-empty');
      return td;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'po-customer-file-view-button';
    button.textContent = 'Lihat';
    button.title = 'Lihat dokumen pembelian';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openEntryDocument(entry);
    });
    td.appendChild(button);
    return td;
  }

  function entryHasAnyAttachment(entry) {
    return Boolean((entry && entry.hasAttachment) || entryPurchaseLineDocuments(entry).length);
  }

  function entryPurchaseLineDocuments(entry) {
    return (Array.isArray(entry && entry.purchaseLines) ? entry.purchaseLines : [])
      .map(normalizePurchaseLineForForm)
      .filter(purchaseLineHasAttachment)
      .map(function (line, index) {
        return {
          id: 'purchase-line-' + index,
          name: text(line.attachmentName, text(line.purchaseInvoiceNo, 'Dokumen pembelian ' + (index + 1))),
          mimeType: text(line.attachmentMimeType, 'application/octet-stream'),
          size: Number(line.attachmentSize || 0),
          dataUrl: text(line.attachmentDataUrl),
          detailsTitle: 'Data Pembelian yang Diinput',
          details: purchaseLineFileDetails(line, entry)
        };
      });
  }

  function purchaseLineFileDetails(line, entry) {
    const rows = [
      ['Supplier', text(line && line.supplierName, '-')],
      ['No Inv / Faktur Pajak', text(line && line.purchaseInvoiceNo, '-')],
      ['Tanggal Beli', formatDate(entry && entry.purchaseDate) || '-'],
      ['Nama Barang', text(line && line.productName, text(entry && entry.productName, '-'))],
      ['Qty Beli', formatQty(line && line.purchaseQty)],
      ['Hrg Satuan', formatAmount(line && line.purchaseUnitPrice)],
      ['Total Harga (Inc PPN)', formatAmount(line && line.purchaseTotal)],
      ['DPP', formatAmount(line && line.purchaseDpp)],
      ['PPN', formatAmount(line && line.purchasePpn)],
      ['Catatan', text(entry && entry.realizationNotes, '-')]
    ];
    return rows.map(function (row) {
      return { label: row[0], value: row[1] };
    });
  }

  function statusCell(entry) {
    const td = document.createElement('td');
    const label = statusLabel(entry);
    td.className = 'po-customer-status-cell';
    td.appendChild(statusBadge(label));
    const gap = qtyGap(entry);
    if (gap > 0) {
      const note = document.createElement('small');
      note.className = 'po-customer-status-note';
      note.textContent = 'Selisih qty ' + formatQty(gap);
      td.appendChild(note);
    }
    return td;
  }

  function entryMargin(entry) {
    return parseAmount(entry && entry.requestedDpp) - entryPurchaseDppTotal(entry);
  }

  function renderDetailTotals(group) {
    if (!elements.detailTotals) return;
    if (!group) {
      elements.detailTotals.hidden = true;
      return;
    }
    const entries = Array.isArray(group.entries) ? group.entries : [];
    const totalPo = entries.reduce(function (sum, entry) {
      return sum + entryRequestedTotal(entry);
    }, 0);
    const totalPurchase = entries.reduce(function (sum, entry) {
      return sum + entryPurchaseTotal(entry);
    }, 0);
    const totalMargin = entries.reduce(function (sum, entry) {
      return sum + entryMargin(entry);
    }, 0);
    setText(elements.totalPo, formatAmount(totalPo));
    setText(elements.totalPurchase, formatAmount(totalPurchase));
    setText(elements.totalMargin, formatAmount(totalMargin));
    elements.detailTotals.classList.toggle('negative', totalMargin < 0);
    elements.detailTotals.hidden = false;
  }

  function statusBadgeCell(label) {
    const td = document.createElement('td');
    td.appendChild(statusBadge(label));
    return td;
  }

  function statusBadge(label) {
    const badge = document.createElement('span');
    badge.className = 'po-customer-status ' + statusClass(label);
    badge.textContent = label;
    return badge;
  }

  function statusLabel(entry) {
    const requestedQty = entryRequestedQty(entry);
    const purchaseQty = entryPurchaseQty(entry);
    const requestedTotal = entryRequestedTotal(entry);
    const purchaseTotal = entryPurchaseTotal(entry);
    if (purchaseQty <= 0 && purchaseTotal <= 0) return 'Belum Realisasi';
    if (hasQtyGap(entry)) return 'Qty belum lengkap';
    if ((requestedQty > 0 && purchaseQty >= requestedQty) || (requestedTotal > 0 && purchaseTotal >= requestedTotal)) {
      return 'Selesai';
    }
    return 'Sebagian';
  }

  function groupStatusLabel(group) {
    const entries = group && Array.isArray(group.entries) ? group.entries : [];
    if (!entries.length) return 'Belum Realisasi';
    const labels = entries.map(statusLabel);
    if (labels.every(function (label) { return label === 'Selesai'; })) return 'Selesai';
    if (labels.some(function (label) { return label === 'Qty belum lengkap'; })) return 'Qty belum lengkap';
    if (labels.some(function (label) { return label === 'Selesai' || label === 'Sebagian'; })) return 'Sebagian';
    return 'Belum Realisasi';
  }

  function statusClass(label) {
    if (label === 'Selesai') return 'done';
    if (label === 'Qty belum lengkap') return 'incomplete';
    if (label === 'Sebagian') return 'partial';
    return 'pending';
  }

  function entryById(entryId) {
    const id = text(entryId);
    return state.entries.find(function (entry) {
      return text(entry.id) === id;
    }) || null;
  }

  function openCreateModal(group) {
    state.activeEntry = null;
    if (elements.form) elements.form.reset();
    clearNode(elements.itemRows);
    elements.entryId.value = '';
    setPoHeaderReadonly(Boolean(group));
    elements.poNo.value = group ? text(group.poNo) : '';
    elements.poDate.value = group ? text(group.poDate, todayIso()) : todayIso();
    elements.customerName.value = group ? text(group.customerName) : '';
    addItemRow({ itemNo: '1' });
    setItemAddButtonsVisible(true);
    setText(elements.formTitle, group ? 'Tambah Barang PO' : 'Tambah PO Customer');
    setText(elements.formMeta, group ? 'Tambah barang ke PO yang sedang dibuka.' : 'Input header PO dan daftar barang yang diminta customer.');
    elements.formModal.hidden = false;
    if (group && elements.itemRows) {
      const productInput = elements.itemRows.querySelector('[data-field="productName"]');
      if (productInput) productInput.focus();
      return;
    }
    if (elements.poNo) elements.poNo.focus();
  }

  function openEditModal(entry) {
    const current = entryById(entry && entry.id) || entry;
    if (!current) return;
    closeActionModal();
    state.activeEntry = current;
    if (elements.form) elements.form.reset();
    clearNode(elements.itemRows);
    setPoHeaderReadonly(false);
    elements.entryId.value = text(current.id);
    elements.poNo.value = text(current.poNo);
    elements.poDate.value = text(current.poDate, todayIso());
    elements.customerName.value = text(current.customerName);
    addItemRow(current);
    setItemAddButtonsVisible(false);
    setText(elements.formTitle, 'Ubah PO Customer');
    setText(elements.formMeta, text(current.productName, 'Data PO Customer'));
    elements.formModal.hidden = false;
    if (elements.poNo) elements.poNo.focus();
  }

  function closeFormModal() {
    elements.formModal.hidden = true;
    setPoHeaderReadonly(false);
  }

  function setPoHeaderReadonly(readonly) {
    [elements.poNo, elements.poDate, elements.customerName].forEach(function (input) {
      if (input) input.readOnly = readonly;
    });
  }

  function setItemAddButtonsVisible(visible) {
    if (elements.addItemButton) elements.addItemButton.hidden = !visible;
    if (elements.addItemBottomButton) elements.addItemBottomButton.hidden = !visible;
  }

  function addItemRow(entry) {
    const source = entry || {};
    const row = document.createElement('tr');
    row.className = 'po-customer-item-row';
    row.appendChild(itemCell(itemNumberInput(source)));
    row.appendChild(itemCell(itemInput('productName', text(source.productName), 'text', true)));
    row.appendChild(itemCell(itemInput('brandType', text(source.brandType), 'text')));
    row.appendChild(itemCell(itemTextarea('specification', text(source.specification))));
    row.appendChild(itemCell(itemInput('illustration', text(source.illustration), 'text')));
    row.appendChild(itemCell(itemInput('unit', text(source.unit), 'text')));
    row.appendChild(itemCell(itemInput('unitPrice', source.unitPrice ? formatAmount(source.unitPrice) : '', 'text')));
    row.appendChild(itemCell(itemInput('requestedQty', source.requestedQty || '', 'number')));
    row.appendChild(itemCell(itemInput('requestedTotal', entryRequestedTotal(source) ? formatAmount(entryRequestedTotal(source)) : '0', 'text', false, true)));
    row.appendChild(itemCell(itemInput('requestedDpp', source.requestedDpp ? formatAmount(source.requestedDpp) : '', 'text', false, true)));
    row.appendChild(itemCell(itemInput('requestedPpn', source.requestedPpn ? formatAmount(source.requestedPpn) : '', 'text', false, true)));
    row.appendChild(itemCell(itemInput('notes', text(source.notes), 'text')));
    elements.itemRows.appendChild(row);
    wireItemRow(row);
    updateItemRowTotal(row);
    return row;
  }

  function itemCell(child) {
    const td = document.createElement('td');
    td.appendChild(child);
    return td;
  }

  function itemNumberInput(entry) {
    const wrap = document.createElement('div');
    wrap.className = 'po-customer-item-number';
    const input = itemInput('itemNo', text(entry.itemNo), 'text');
    if (!input.value) input.value = String(elements.itemRows.children.length + 1);
    wrap.appendChild(input);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'po-customer-item-remove';
    remove.title = 'Hapus baris barang';
    remove.setAttribute('aria-label', 'Hapus baris barang');
    remove.textContent = 'x';
    remove.addEventListener('click', function () {
      const row = wrap.closest('tr');
      if (!row || elements.itemRows.children.length <= 1) return;
      row.remove();
      renumberEmptyItemRows();
    });
    wrap.appendChild(remove);
    return wrap;
  }

  function itemInput(name, value, type, required, readonly) {
    const input = document.createElement('input');
    input.className = 'po-customer-item-input';
    input.dataset.field = name;
    input.type = type || 'text';
    input.value = text(value);
    input.autocomplete = 'off';
    if (type === 'number') {
      input.min = '0';
      input.step = '0.01';
    }
    if (name === 'unitPrice' || name === 'requestedDpp' || name === 'requestedPpn') input.inputMode = 'decimal';
    if (required) input.required = true;
    if (readonly) input.readOnly = true;
    return input;
  }

  function itemTextarea(name, value) {
    const textarea = document.createElement('textarea');
    textarea.className = 'po-customer-item-input';
    textarea.dataset.field = name;
    textarea.rows = 2;
    textarea.value = text(value);
    return textarea;
  }

  function wireItemRow(row) {
    ['unitPrice', 'requestedQty'].forEach(function (field) {
      const input = row.querySelector('[data-field="' + field + '"]');
      if (input) input.addEventListener('input', function () {
        if (field === 'unitPrice') formatAmountInput(input);
        updateItemRowTotal(row);
      });
    });
  }

  function updateItemRowTotal(row) {
    if (!row) return;
    const unitPrice = parseAmount(fieldValue(row, 'unitPrice'));
    const qty = parseAmount(fieldValue(row, 'requestedQty'));
    const total = unitPrice * qty;
    const tax = splitDppPpnFromInclusiveTotal(total);
    const totalInput = row.querySelector('[data-field="requestedTotal"]');
    const dppInput = row.querySelector('[data-field="requestedDpp"]');
    const ppnInput = row.querySelector('[data-field="requestedPpn"]');
    if (totalInput) totalInput.value = formatAmount(total);
    if (dppInput) dppInput.value = formatAmount(tax.dpp);
    if (ppnInput) ppnInput.value = formatAmount(tax.ppn);
  }

  function renumberEmptyItemRows() {
    Array.from(elements.itemRows.children).forEach(function (row, index) {
      const input = row.querySelector('[data-field="itemNo"]');
      if (input && !text(input.value)) input.value = String(index + 1);
    });
  }

  function fieldValue(row, field) {
    const input = row.querySelector('[data-field="' + field + '"]');
    return input ? input.value : '';
  }

  function collectFormItems() {
    return Array.from(elements.itemRows.querySelectorAll('tr')).map(function (row) {
      const unitPrice = parseAmount(fieldValue(row, 'unitPrice'));
      const requestedQty = parseAmount(fieldValue(row, 'requestedQty'));
      const requestedTotal = unitPrice * requestedQty;
      const tax = splitDppPpnFromInclusiveTotal(requestedTotal);
      return {
        itemNo: fieldValue(row, 'itemNo'),
        productName: fieldValue(row, 'productName'),
        brandType: fieldValue(row, 'brandType'),
        specification: fieldValue(row, 'specification'),
        illustration: fieldValue(row, 'illustration'),
        unit: fieldValue(row, 'unit'),
        unitPrice,
        requestedQty,
        requestedTotal,
        requestedDpp: tax.dpp,
        requestedPpn: tax.ppn,
        notes: fieldValue(row, 'notes')
      };
    }).filter(function (item) {
      return text(item.productName) ||
        text(item.brandType) ||
        text(item.specification) ||
        text(item.illustration) ||
        text(item.unit) ||
        Number(item.unitPrice || 0) ||
        Number(item.requestedQty || 0) ||
        Number(item.requestedDpp || 0) ||
        Number(item.requestedPpn || 0) ||
        text(item.notes);
    });
  }

  function openRealizationModal(entry) {
    const current = entryById(entry && entry.id) || entry;
    if (!current) return;
    closeActionModal();
    state.activeEntry = current;
    if (elements.realizationForm) elements.realizationForm.reset();
    elements.realizationEntryId.value = text(current.id);
    elements.purchaseDate.value = text(current.purchaseDate);
    elements.realizationNotes.value = text(current.realizationNotes);
    syncRealizationSummary(current);
    renderPurchaseLineRows(entryPurchaseLines(current));
    setText(elements.realizationMeta, 'Lengkapi data pembelian/realisasi untuk barang ini.');
    syncQtyGapNote();
    elements.realizationModal.hidden = false;
    const firstInput = elements.purchaseLineRows && elements.purchaseLineRows.querySelector('input:not([readonly]):not([type="checkbox"])');
    if (firstInput) firstInput.focus();
  }

  function syncRealizationSummary(entry) {
    const current = entry || state.activeEntry;
    setText(elements.realizationProductName, text(current && current.productName, '-'));
    setText(elements.realizationRequestedQty, formatQty(current && current.requestedQty));
    setText(elements.realizationUnitPrice, formatAmount(current && current.unitPrice));
    setText(elements.realizationRequestedTotal, formatAmount(entryRequestedTotal(current)));
  }

  function closeRealizationModal() {
    elements.realizationModal.hidden = true;
  }

  function openUploadModal(entry) {
    const current = entryById(entry && entry.id) || entry;
    if (!current) return;
    closeActionModal();
    state.activeEntry = current;
    if (elements.uploadForm) elements.uploadForm.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.uploadEntryId.value = text(current.id);
    setText(elements.uploadTitle, 'Upload Dokumen');
    setText(elements.uploadMeta, text(current.productName, 'File PO, penawaran, invoice, atau bukti pendukung.'));
    setUploadNote(current);
    elements.uploadModal.hidden = false;
  }

  function closeUploadModal() {
    elements.uploadModal.hidden = true;
  }

  function setUploadNote(entry) {
    if (!elements.attachmentNote) return;
    const selected = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.attachmentFile) : [];
    if (selected.length) {
      elements.attachmentNote.textContent = window.clientPortalFormatFilesNote
        ? window.clientPortalFormatFilesNote(selected, 'File dipilih')
        : selected.length + ' file dipilih.';
      return;
    }
    if (entry && entry.hasAttachment) {
      elements.attachmentNote.textContent = 'File tersimpan: ' + text(entry.attachmentName, 'lampiran');
      return;
    }
    elements.attachmentNote.textContent = 'Belum ada file dipilih.';
  }

  function openActionModal(entry) {
    const current = entryById(entry && entry.id) || entry;
    if (!current) return;
    state.activeEntry = current;
    clearNode(elements.actionBody);
    setText(elements.actionTitle, 'Aksi PO');
    setText(elements.actionMeta, [text(current.poNo), text(current.productName)].filter(Boolean).join(' | ') || 'Pilih aksi data.');
    addActionChoice('Ubah PO', function () {
      openEditModal(current);
    });
    addActionChoice(current.purchaseQty || current.purchaseInvoiceNo ? 'Ubah Realisasi' : 'Input Realisasi', function () {
      openRealizationModal(current);
    });
    if (entryHasAnyAttachment(current)) {
      addActionChoice('Lihat Dokumen', function () {
        closeActionModal();
        openEntryDocument(current);
      });
    }
    if (current.hasAttachment) {
      addActionChoice('Hapus Dokumen', function () {
        closeActionModal();
        deleteDocument(current);
      }, true);
    }
    addActionChoice('Hapus', function () {
      closeActionModal();
      deleteEntry(current);
    }, true);
    elements.actionModal.hidden = false;
  }

  function addActionChoice(label, handler, danger) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'project-book-action-choice' + (danger ? ' danger' : '');
    button.textContent = label;
    button.addEventListener('click', handler);
    elements.actionBody.appendChild(button);
  }

  function closeActionModal() {
    elements.actionModal.hidden = true;
  }

  async function submitForm(event) {
    event.preventDefault();
    const entryId = text(elements.entryId.value);
    const items = collectFormItems();
    const payload = {
      poNo: elements.poNo.value,
      poDate: elements.poDate.value,
      customerName: elements.customerName.value,
      items
    };
    if (!payload.poDate) {
      setAlert('Tanggal PO wajib diisi.', 'error');
      return;
    }
    if (!items.length) {
      setAlert('Minimal satu barang wajib diisi.', 'error');
      return;
    }
    if (items.some(function (item) { return !text(item.productName); })) {
      setAlert('Nama barang wajib diisi di setiap baris.', 'error');
      return;
    }
    elements.formSaveButton.disabled = true;
    try {
      const data = await requestJson(apiBase() + (entryId ? '/' + encodeURIComponent(entryId) : ''), {
        method: entryId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      applyEntries(data);
      closeFormModal();
      setAlert('PO Customer tersimpan.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan PO Customer.', 'error');
    } finally {
      elements.formSaveButton.disabled = false;
    }
  }

  async function submitRealization(event) {
    event.preventDefault();
    const entryId = text(elements.realizationEntryId.value);
    if (!entryId) return;
    const purchaseLines = collectPurchaseLines();
    const purchaseSummary = summarizePurchaseLinesForRender(purchaseLines);
    const payload = {
      purchaseDate: elements.purchaseDate.value,
      purchaseLines,
      supplierName: purchaseSummary.supplierName,
      purchaseInvoiceNo: purchaseSummary.purchaseInvoiceNo,
      purchaseUnitPrice: purchaseSummary.purchaseUnitPrice,
      purchaseQty: purchaseSummary.purchaseQty,
      purchaseTotal: purchaseSummary.purchaseTotal,
      purchaseTaxMode: purchaseSummary.purchaseTaxMode,
      purchaseDpp: purchaseSummary.purchaseDpp,
      purchasePpn: purchaseSummary.purchasePpn,
      realizationNotes: elements.realizationNotes.value
    };
    elements.realizationSaveButton.disabled = true;
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entryId), {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      applyEntries(data);
      closeRealizationModal();
      setAlert('Realisasi pembelian tersimpan.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan realisasi.', 'error');
    } finally {
      elements.realizationSaveButton.disabled = false;
    }
  }

  async function submitUpload(event) {
    event.preventDefault();
    const entryId = text(elements.uploadEntryId.value);
    if (!entryId) return;
    const attachment = window.clientPortalBuildAttachmentPayload
      ? await window.clientPortalBuildAttachmentPayload(elements.attachmentFile)
      : {};
    if (!attachment.attachmentDataUrl) {
      setAlert('Pilih dokumen terlebih dahulu.', 'error');
      return;
    }
    elements.uploadSaveButton.disabled = true;
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entryId), {
        method: 'PUT',
        body: JSON.stringify(attachment)
      });
      applyEntries(data);
      closeUploadModal();
      setAlert('Dokumen PO tersimpan.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal upload dokumen.', 'error');
    } finally {
      elements.uploadSaveButton.disabled = false;
    }
  }

  async function deleteEntry(entry) {
    const current = entryById(entry && entry.id) || entry;
    if (!current) return;
    const label = text(current.poNo) || text(current.productName) || 'data ini';
    if (!window.confirm('Hapus ' + label + '?')) return;
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(current.id), {
        method: 'DELETE'
      });
      applyEntries(data);
      setAlert('PO Customer dihapus.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus data.', 'error');
    }
  }

  async function deleteDocument(entry) {
    const current = entryById(entry && entry.id) || entry;
    if (!current || !current.hasAttachment) return;
    const label = text(current.attachmentName, 'dokumen ini');
    if (!window.confirm('Hapus dokumen ' + label + '? Data PO tidak akan dihapus.')) return;
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(current.id) + '/file', {
        method: 'DELETE'
      });
      applyEntries(data);
      setAlert('Dokumen PO dihapus.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus dokumen.', 'error');
    }
  }

  function applyEntries(data) {
    if (data && Array.isArray(data.entries)) {
      state.entries = normalizeEntriesForRender(data.entries);
      renderPage();
    } else {
      loadPage();
    }
  }

  async function openFile(entry) {
    const current = entryById(entry && entry.id) || entry;
    if (!current || !current.hasAttachment) {
      setAlert('Belum ada dokumen untuk PO ini.', 'info');
      return;
    }
    clearNode(elements.fileViewer);
    setText(elements.fileTitle, text(current.attachmentName, 'Dokumen PO'));
    setText(elements.fileMeta, 'Memuat file...');
    const loading = document.createElement('div');
    loading.className = 'cashbook-file-fallback';
    loading.textContent = 'Memuat file...';
    elements.fileViewer.appendChild(loading);
    elements.fileModal.hidden = false;
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(current.id) + '/file');
      if (window.clientPortalRenderAttachmentViewer) {
        window.clientPortalRenderAttachmentViewer(elements.fileViewer, data, {
          titleEl: elements.fileTitle,
          metaEl: elements.fileMeta,
          label: 'Dokumen PO'
        });
      }
    } catch (err) {
      closeFileModal();
      setAlert(err.message || 'Gagal membuka dokumen.', 'error');
    }
  }

  function openEntryDocument(entry) {
    const current = entryById(entry && entry.id) || entry;
    const documents = entryPurchaseLineDocuments(current);
    if (documents.length) {
      openPurchaseLineDocuments(documents, text(current && current.productName, 'Dokumen pembelian'));
      return;
    }
    openFile(current);
  }

  function openPurchaseLineDocument(attachment) {
    if (!purchaseLineHasAttachment(attachment)) {
      setAlert('Belum ada dokumen pada baris pembelian ini.', 'info');
      return;
    }
    openPurchaseLineDocuments([{
      id: 'purchase-line-document',
      name: text(attachment.attachmentName, 'Dokumen pembelian'),
      mimeType: text(attachment.attachmentMimeType, 'application/octet-stream'),
      size: Number(attachment.attachmentSize || 0),
      dataUrl: text(attachment.attachmentDataUrl),
      detailsTitle: text(attachment.detailsTitle, 'Data Pembelian yang Diinput'),
      details: Array.isArray(attachment.details) ? attachment.details : []
    }], text(attachment.attachmentName, 'Dokumen pembelian'));
  }

  function openPurchaseLineDocuments(files, label) {
    const documents = Array.isArray(files) ? files.filter(function (file) {
      return text(file && file.dataUrl);
    }) : [];
    if (!documents.length) {
      setAlert('Belum ada dokumen pembelian untuk data ini.', 'info');
      return;
    }
    clearNode(elements.fileViewer);
    elements.fileModal.hidden = false;
    if (window.clientPortalRenderAttachmentViewer) {
      window.clientPortalRenderAttachmentViewer(elements.fileViewer, { files: documents }, {
        titleEl: elements.fileTitle,
        metaEl: elements.fileMeta,
        label: label || 'Dokumen pembelian'
      });
      return;
    }
    setText(elements.fileTitle, label || 'Dokumen pembelian');
    setText(elements.fileMeta, documents.length + ' dokumen');
    const fallback = document.createElement('div');
    fallback.className = 'cashbook-file-fallback';
    fallback.textContent = 'Viewer dokumen belum tersedia.';
    elements.fileViewer.appendChild(fallback);
  }

  function closeFileModal() {
    elements.fileModal.hidden = true;
    clearNode(elements.fileViewer);
  }

  function normalizeEntriesForRender(entries) {
    return Array.isArray(entries) ? entries.map(normalizeEntryForRender) : [];
  }

  function normalizeEntryForRender(entry) {
    const current = Object.assign({}, entry || {});
    const rawLines = Array.isArray(current.purchaseLines) ? current.purchaseLines : [];
    const normalizedLines = rawLines
      .map(normalizePurchaseLineForForm)
      .filter(function (line) {
        return purchaseLineHasSummaryContent(line) || purchaseLineHasAttachment(line);
      });
    current.purchaseLines = normalizedLines;
    if (!normalizedLines.length) return current;
    const summary = summarizePurchaseLinesForRender(normalizedLines);
    current.supplierName = summary.supplierName;
    current.purchaseInvoiceNo = summary.purchaseInvoiceNo;
    current.purchaseUnitPrice = summary.purchaseUnitPrice;
    current.purchaseQty = summary.purchaseQty;
    current.purchaseTotal = summary.purchaseTotal;
    current.purchaseTaxMode = summary.purchaseTaxMode;
    current.purchaseDpp = summary.purchaseDpp;
    current.purchasePpn = summary.purchasePpn;
    return current;
  }

  function purchaseLineHasSummaryContent(line) {
    return Boolean(text(line && line.supplierName) ||
      text(line && line.purchaseInvoiceNo) ||
      Number(line && line.purchaseUnitPrice) ||
      Number(line && line.purchaseQty) ||
      Number(line && line.purchaseTotal) ||
      Number(line && line.purchaseDpp) ||
      Number(line && line.purchasePpn));
  }

  function summarizePurchaseLinesForRender(lines) {
    const cleanLines = (Array.isArray(lines) ? lines : []).filter(purchaseLineHasSummaryContent);
    const firstLine = cleanLines[0] || {};
    const supplierNames = uniqueTextValues(cleanLines.map(function (line) { return line.supplierName; }));
    const invoiceNos = uniqueTextValues(cleanLines.map(function (line) { return line.purchaseInvoiceNo; }));
    return {
      supplierName: supplierNames.join(', '),
      purchaseInvoiceNo: invoiceNos.join(', '),
      purchaseUnitPrice: parseAmount(firstLine.purchaseUnitPrice),
      purchaseQty: roundAmount(cleanLines.reduce(function (sum, line) {
        return sum + parseAmount(line.purchaseQty);
      }, 0)),
      purchaseTotal: roundAmount(cleanLines.reduce(function (sum, line) {
        return sum + parseAmount(line.purchaseTotal);
      }, 0)),
      purchaseTaxMode: cleanLines.some(function (line) { return text(line.purchaseTaxMode).toLowerCase() === 'ppn'; }) ? 'ppn' : 'non_ppn',
      purchaseDpp: roundAmount(cleanLines.reduce(function (sum, line) {
        return sum + parseAmount(line.purchaseDpp);
      }, 0)),
      purchasePpn: roundAmount(cleanLines.reduce(function (sum, line) {
        return sum + parseAmount(line.purchasePpn);
      }, 0))
    };
  }

  function uniqueTextValues(values) {
    const seen = new Set();
    const result = [];
    (Array.isArray(values) ? values : []).forEach(function (value) {
      const clean = text(value);
      const key = clean.toLowerCase();
      if (!clean || seen.has(key)) return;
      seen.add(key);
      result.push(clean);
    });
    return result;
  }

  function entryPurchaseLines(entry) {
    const rawLines = Array.isArray(entry && entry.purchaseLines) ? entry.purchaseLines : [];
    const normalized = rawLines.map(normalizePurchaseLineForForm).filter(purchaseLineHasContent);
    if (normalized.length) return normalized;
    const hasLegacyPurchase = text(entry && entry.supplierName) ||
      text(entry && entry.purchaseInvoiceNo) ||
      text(entry && entry.purchaseDate) ||
      Number(entry && entry.purchaseUnitPrice) ||
      Number(entry && entry.purchaseQty) ||
      Number(entry && entry.purchaseTotal) ||
      Number(entry && entry.purchaseDpp) ||
      Number(entry && entry.purchasePpn);
    if (hasLegacyPurchase) {
      return [normalizePurchaseLineForForm({
        supplierName: entry.supplierName,
        purchaseInvoiceNo: entry.purchaseInvoiceNo,
        productName: text(entry.purchaseProductName || entry.productName),
        purchaseTaxMode: entry.purchaseTaxMode,
        purchaseUnitPrice: entry.purchaseUnitPrice,
        purchaseQty: entry.purchaseQty,
        purchaseTotal: entry.purchaseTotal,
        purchaseDpp: entry.purchaseDpp,
        purchasePpn: entry.purchasePpn
      })];
    }
    return [blankPurchaseLine(entry)];
  }

  function blankPurchaseLine(entry) {
    return {
      supplierName: '',
      purchaseInvoiceNo: '',
      productName: text(entry && entry.productName),
      purchaseTaxMode: 'non_ppn',
      purchaseUnitPrice: 0,
      purchaseQty: 0,
      purchaseTotal: 0,
      purchaseDpp: 0,
      purchasePpn: 0,
      attachmentName: '',
      attachmentMimeType: '',
      attachmentSize: 0,
      attachmentDataUrl: ''
    };
  }

  function normalizePurchaseLineForForm(line) {
    const source = line || {};
    const unitPrice = parseAmount(source.purchaseUnitPrice ?? source.purchase_unit_price ?? source.unitPrice ?? source.hargaBeli ?? 0);
    const qty = parseAmount(source.purchaseQty ?? source.purchase_qty ?? source.qty ?? source.qtyBeli ?? 0);
    const explicitTotal = parseAmount(source.purchaseTotal ?? source.purchase_total ?? source.total ?? source.totalBeli ?? 0);
    const total = explicitTotal || (unitPrice * qty);
    const taxMode = text(source.purchaseTaxMode ?? source.purchase_tax_mode ?? source.taxMode ?? source.tax_mode).toLowerCase() === 'ppn' ? 'ppn' : 'non_ppn';
    const tax = purchaseTaxFromTotal(total, taxMode);
    return {
      supplierName: text(source.supplierName ?? source.supplier_name ?? source.supplier),
      purchaseInvoiceNo: text(source.purchaseInvoiceNo ?? source.purchase_invoice_no ?? source.invoiceNo ?? source.invoice_no ?? source.fakturNo ?? source.faktur_no),
      productName: text(source.productName ?? source.product_name ?? source.namaBarang ?? source.nama_barang),
      purchaseTaxMode: taxMode,
      purchaseUnitPrice: unitPrice,
      purchaseQty: qty,
      purchaseTotal: total,
      purchaseDpp: parseAmount(source.purchaseDpp ?? source.purchase_dpp ?? source.dpp) || tax.dpp,
      purchasePpn: parseAmount(source.purchasePpn ?? source.purchase_ppn ?? source.ppn) || tax.ppn,
      attachmentName: text(source.attachmentName ?? source.attachment_name),
      attachmentMimeType: text(source.attachmentMimeType ?? source.attachment_mime_type),
      attachmentSize: parseAmount(source.attachmentSize ?? source.attachment_size ?? 0),
      attachmentDataUrl: text(source.attachmentDataUrl ?? source.attachment_data_url)
    };
  }

  function purchaseLineHasContent(line) {
    return Boolean(text(line && line.supplierName) ||
      text(line && line.purchaseInvoiceNo) ||
      Number(line && line.purchaseUnitPrice) ||
      Number(line && line.purchaseQty) ||
      Number(line && line.purchaseTotal) ||
      Number(line && line.purchaseDpp) ||
      Number(line && line.purchasePpn) ||
      purchaseLineHasAttachment(line) ||
      text(line && line.productName) && text(line.productName) !== text(state.activeEntry && state.activeEntry.productName));
  }

  function purchaseLineHasAttachment(line) {
    return Boolean(text(line && line.attachmentDataUrl));
  }

  function renderPurchaseLineRows(lines) {
    clearNode(elements.purchaseLineRows);
    const purchaseLines = Array.isArray(lines) && lines.length ? lines : [blankPurchaseLine(state.activeEntry)];
    purchaseLines.forEach(function (line) {
      addPurchaseLineRow(line);
    });
    updateAllPurchaseLineTotals();
  }

  function addPurchaseLineRow(line) {
    if (!elements.purchaseLineRows) return;
    const current = normalizePurchaseLineForForm(line || blankPurchaseLine(state.activeEntry));
    syncRealizationSummary();
    if (!text(current.productName)) current.productName = text(state.activeEntry && state.activeEntry.productName);
    const row = document.createElement('tr');
    row.className = 'po-customer-purchase-line';
    row.appendChild(purchaseTaxCell(current.purchaseTaxMode));
    row.appendChild(purchaseInputCell('supplierName', current.supplierName));
    row.appendChild(purchaseInputCell('purchaseInvoiceNo', current.purchaseInvoiceNo));
    row.appendChild(purchaseInputCell('productName', current.productName));
    row.appendChild(purchaseInputCell('purchaseQty', current.purchaseQty || '', 'number', false, 'po-customer-line-number'));
    row.appendChild(purchaseInputCell('purchaseUnitPrice', current.purchaseUnitPrice ? formatAmount(current.purchaseUnitPrice) : '', 'text', false, 'po-customer-line-number', true));
    row.appendChild(purchaseInputCell('purchaseTotal', formatAmount(current.purchaseTotal), 'text', true, 'po-customer-line-number'));
    row.appendChild(purchaseInputCell('purchaseDpp', formatAmount(current.purchaseDpp), 'text', true, 'po-customer-line-number'));
    row.appendChild(purchaseInputCell('purchasePpn', formatAmount(current.purchasePpn), 'text', true, 'po-customer-line-number'));
    row.appendChild(purchaseDocumentCell(current));
    row.appendChild(purchaseRemoveCell());
    elements.purchaseLineRows.appendChild(row);
    syncPurchaseLineTaxMode(row);
    updatePurchaseLineTotal(row);
  }

  function purchaseTaxCell(mode) {
    const td = document.createElement('td');
    td.className = 'po-customer-line-tax-cell';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.dataset.field = 'purchaseTaxMode';
    input.checked = text(mode).toLowerCase() === 'ppn';
    input.setAttribute('aria-label', 'PPN baris pembelian');
    td.appendChild(input);
    return td;
  }

  function purchaseInputCell(field, value, type, readonly, className, money) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.dataset.field = field;
    input.type = type || 'text';
    input.value = text(value);
    input.autocomplete = 'off';
    if (type === 'number') {
      input.min = '0';
      input.step = '0.01';
    }
    if (money) {
      input.inputMode = 'decimal';
      input.dataset.rupiah = 'true';
    }
    if (readonly) input.readOnly = true;
    if (className) input.className = className;
    td.appendChild(input);
    return td;
  }

  function purchaseDocumentCell(line) {
    const td = document.createElement('td');
    td.className = 'po-customer-line-document-cell';
    [
      ['attachmentName', line.attachmentName],
      ['attachmentMimeType', line.attachmentMimeType],
      ['attachmentSize', line.attachmentSize],
      ['attachmentDataUrl', line.attachmentDataUrl]
    ].forEach(function (item) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.dataset.field = item[0];
      input.value = text(item[1]);
      td.appendChild(input);
    });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.className = 'po-customer-line-file-input';
    td.appendChild(fileInput);

    const status = document.createElement('span');
    status.className = 'po-customer-line-document-name';
    td.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'po-customer-line-document-actions';
    td.appendChild(actions);

    function render() {
      const attachment = purchaseLineAttachmentFromRow(td.closest('tr'));
      const hasFile = purchaseLineHasAttachment(attachment);
      status.textContent = hasFile ? text(attachment.attachmentName, 'File tersimpan') : 'Belum upload';
      clearNode(actions);
      const uploadButton = purchaseLineDocumentButton(hasFile ? 'Ganti' : 'Upload');
      uploadButton.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        fileInput.click();
      });
      actions.appendChild(uploadButton);
      if (hasFile) {
        const viewButton = purchaseLineDocumentButton('Lihat');
        viewButton.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          openPurchaseLineDocument(purchaseLineDocumentFromRow(td.closest('tr')));
        });
        actions.appendChild(viewButton);

        const deleteButton = purchaseLineDocumentButton('Hapus', true);
        deleteButton.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (!window.confirm('Hapus dokumen pada baris pembelian ini?')) return;
          setPurchaseLineAttachment(td.closest('tr'), {});
          if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(fileInput);
          render();
        });
        actions.appendChild(deleteButton);
      }
    }

    fileInput.addEventListener('change', async function () {
      const attachment = window.clientPortalBuildAttachmentPayload
        ? await window.clientPortalBuildAttachmentPayload(fileInput)
        : {};
      if (!attachment.attachmentDataUrl) {
        setAlert('Pilih dokumen terlebih dahulu.', 'error');
        render();
        return;
      }
      setPurchaseLineAttachment(td.closest('tr'), attachment);
      setAlert('Dokumen baris pembelian siap disimpan.', 'info');
      render();
    });

    render();
    return td;
  }

  function purchaseLineDocumentButton(label, danger) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'po-customer-line-document-button' + (danger ? ' danger' : '');
    button.textContent = label;
    return button;
  }

  function purchaseLineAttachmentFromRow(row) {
    return {
      attachmentName: purchaseLineFieldValue(row, 'attachmentName'),
      attachmentMimeType: purchaseLineFieldValue(row, 'attachmentMimeType'),
      attachmentSize: parseAmount(purchaseLineFieldValue(row, 'attachmentSize')),
      attachmentDataUrl: purchaseLineFieldValue(row, 'attachmentDataUrl')
    };
  }

  function purchaseLineDocumentFromRow(row) {
    const attachment = purchaseLineAttachmentFromRow(row);
    return Object.assign({}, attachment, {
      detailsTitle: 'Data Pembelian yang Diinput',
      details: purchaseLineFileDetails({
        supplierName: purchaseLineFieldValue(row, 'supplierName'),
        purchaseInvoiceNo: purchaseLineFieldValue(row, 'purchaseInvoiceNo'),
        productName: purchaseLineFieldValue(row, 'productName'),
        purchaseUnitPrice: parseAmount(purchaseLineFieldValue(row, 'purchaseUnitPrice')),
        purchaseQty: parseAmount(purchaseLineFieldValue(row, 'purchaseQty')),
        purchaseTotal: parseAmount(purchaseLineFieldValue(row, 'purchaseTotal')),
        purchaseDpp: parseAmount(purchaseLineFieldValue(row, 'purchaseDpp')),
        purchasePpn: parseAmount(purchaseLineFieldValue(row, 'purchasePpn'))
      }, {
        productName: state.activeEntry && state.activeEntry.productName,
        purchaseDate: elements.purchaseDate && elements.purchaseDate.value,
        realizationNotes: elements.realizationNotes && elements.realizationNotes.value
      })
    });
  }

  function setPurchaseLineAttachment(row, attachment) {
    if (!row) return;
    [
      ['attachmentName', attachment.attachmentName],
      ['attachmentMimeType', attachment.attachmentMimeType],
      ['attachmentSize', attachment.attachmentSize],
      ['attachmentDataUrl', attachment.attachmentDataUrl]
    ].forEach(function (item) {
      const input = row.querySelector('[data-field="' + item[0] + '"]');
      if (input) input.value = text(item[1]);
    });
  }

  function purchaseRemoveCell() {
    const td = document.createElement('td');
    td.className = 'po-customer-line-action-cell';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'po-customer-purchase-line-remove';
    button.textContent = 'x';
    button.title = 'Hapus baris pembelian';
    button.setAttribute('aria-label', 'Hapus baris pembelian');
    td.appendChild(button);
    return td;
  }

  function updatePurchaseLineTotal(row) {
    if (!row) return;
    const unitPrice = parseAmount(purchaseLineFieldValue(row, 'purchaseUnitPrice'));
    const qty = parseAmount(purchaseLineFieldValue(row, 'purchaseQty'));
    const total = unitPrice * qty;
    const isPpn = purchaseLineTaxMode(row) === 'ppn';
    const tax = purchaseTaxFromTotal(total, isPpn ? 'ppn' : 'non_ppn');
    const totalInput = row.querySelector('[data-field="purchaseTotal"]');
    const dppInput = row.querySelector('[data-field="purchaseDpp"]');
    const ppnInput = row.querySelector('[data-field="purchasePpn"]');
    if (totalInput) totalInput.value = formatAmount(total);
    if (dppInput) dppInput.value = formatAmount(tax.dpp);
    if (ppnInput) ppnInput.value = formatAmount(tax.ppn);
    syncPurchaseLineTaxMode(row);
    syncQtyGapNote();
  }

  function updateAllPurchaseLineTotals() {
    if (!elements.purchaseLineRows) return;
    Array.from(elements.purchaseLineRows.querySelectorAll('tr')).forEach(updatePurchaseLineTotal);
  }

  function purchaseLineTaxMode(row) {
    const checkbox = row && row.querySelector('[data-field="purchaseTaxMode"]');
    return checkbox && checkbox.checked ? 'ppn' : 'non_ppn';
  }

  function syncPurchaseLineTaxMode(row) {
    const isPpn = purchaseLineTaxMode(row) === 'ppn';
    if (row) row.classList.toggle('is-ppn', isPpn);
    const invoice = row && row.querySelector('[data-field="purchaseInvoiceNo"]');
    if (invoice) {
      invoice.placeholder = isPpn ? 'No Faktur Pajak' : 'No Inv / Faktur Pajak';
      invoice.setAttribute('aria-label', invoice.placeholder);
    }
  }

  function purchaseLineFieldValue(row, field) {
    const input = row && row.querySelector('[data-field="' + field + '"]');
    return input ? input.value : '';
  }

  function collectPurchaseLines() {
    if (!elements.purchaseLineRows) return [];
    return Array.from(elements.purchaseLineRows.querySelectorAll('tr')).map(function (row) {
      const unitPrice = parseAmount(purchaseLineFieldValue(row, 'purchaseUnitPrice'));
      const qty = parseAmount(purchaseLineFieldValue(row, 'purchaseQty'));
      const total = unitPrice * qty;
      const taxMode = purchaseLineTaxMode(row);
      const tax = purchaseTaxFromTotal(total, taxMode);
      const attachment = purchaseLineAttachmentFromRow(row);
      return {
        supplierName: purchaseLineFieldValue(row, 'supplierName'),
        purchaseInvoiceNo: purchaseLineFieldValue(row, 'purchaseInvoiceNo'),
        productName: purchaseLineFieldValue(row, 'productName'),
        purchaseTaxMode: taxMode,
        purchaseUnitPrice: unitPrice,
        purchaseQty: qty,
        purchaseTotal: total,
        purchaseDpp: tax.dpp,
        purchasePpn: tax.ppn,
        attachmentName: attachment.attachmentName,
        attachmentMimeType: attachment.attachmentMimeType,
        attachmentSize: attachment.attachmentSize,
        attachmentDataUrl: attachment.attachmentDataUrl
      };
    }).filter(purchaseLineHasContent);
  }

  function purchaseLinesQtyTotal() {
    return collectPurchaseLines().reduce(function (sum, line) {
      return sum + Number(line.purchaseQty || 0);
    }, 0);
  }

  function syncQtyGapNote() {
    if (!elements.qtyGapNote) return;
    const requestedQty = entryRequestedQty(state.activeEntry);
    const purchaseQty = purchaseLinesQtyTotal();
    const gap = requestedQty > 0 && purchaseQty > 0 && purchaseQty < requestedQty
      ? Math.round((requestedQty - purchaseQty) * 100) / 100
      : 0;
    elements.qtyGapNote.classList.toggle('has-gap', gap > 0);
    elements.qtyGapNote.textContent = gap > 0
      ? 'Selisih Qty: ' + formatQty(gap) + ' dari PO. Qty belum lengkap.'
      : 'Selisih Qty: 0';
  }

  const guardedBackdropEvents = ['pointerdown', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'click', 'dblclick', 'contextmenu'];

  function guardedModals() {
    return [
      elements.formModal,
      elements.realizationModal,
      elements.uploadModal,
      elements.actionModal,
      elements.fileModal
    ].filter(Boolean);
  }

  function activeGuardedModal() {
    return guardedModals().find(function (modal) {
      return !modal.hidden;
    });
  }

  function eventIsInsideModalPanel(event, modal) {
    if (!modal) return false;
    const panel = modal.querySelector('.portal-modal');
    if (!panel) return false;
    if (typeof event.composedPath === 'function' && event.composedPath().includes(panel)) return true;
    const target = event.target;
    return Boolean(target && typeof target.closest === 'function' && target.closest('.portal-modal') === panel);
  }

  function blockOutsideModalEvent(event, modal) {
    if (!modal || modal.hidden || eventIsInsideModalPanel(event, modal)) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    modal.hidden = false;
  }

  function bindGuardedBackdrop(modal) {
    if (!modal || modal.dataset.backdropGuardBound === 'true') return;
    modal.dataset.backdropGuardBound = 'true';
    guardedBackdropEvents.forEach(function (eventName) {
      modal.addEventListener(eventName, function (event) {
        blockOutsideModalEvent(event, modal);
      }, true);
    });
  }

  function bindGlobalModalGuard() {
    guardedBackdropEvents.forEach(function (eventName) {
      document.addEventListener(eventName, function (event) {
        blockOutsideModalEvent(event, activeGuardedModal());
      }, true);
    });
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

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadPage);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.addButton) elements.addButton.addEventListener('click', function () {
    openCreateModal(activePoGroup());
  });
  if (elements.addItemButton) elements.addItemButton.addEventListener('click', function () {
    addItemRow({ itemNo: String(elements.itemRows.children.length + 1) });
  });
  if (elements.addItemBottomButton) elements.addItemBottomButton.addEventListener('click', function () {
    addItemRow({ itemNo: String(elements.itemRows.children.length + 1) });
  });
  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', function () {
      state.searchTerm = text(elements.searchInput.value);
      renderPage();
    });
  }
  if (elements.form) elements.form.addEventListener('submit', submitForm);
  if (elements.formCloseButton) elements.formCloseButton.addEventListener('click', closeFormModal);
  if (elements.formCancelButton) elements.formCancelButton.addEventListener('click', closeFormModal);
  bindGuardedBackdrop(elements.formModal);
  if (elements.realizationForm) elements.realizationForm.addEventListener('submit', submitRealization);
  if (elements.realizationCloseButton) elements.realizationCloseButton.addEventListener('click', closeRealizationModal);
  if (elements.realizationCancelButton) elements.realizationCancelButton.addEventListener('click', closeRealizationModal);
  bindGuardedBackdrop(elements.realizationModal);
  if (elements.uploadForm) elements.uploadForm.addEventListener('submit', submitUpload);
  if (elements.uploadCloseButton) elements.uploadCloseButton.addEventListener('click', closeUploadModal);
  if (elements.uploadCancelButton) elements.uploadCancelButton.addEventListener('click', closeUploadModal);
  bindGuardedBackdrop(elements.uploadModal);
  if (elements.actionCloseButton) elements.actionCloseButton.addEventListener('click', closeActionModal);
  if (elements.actionDoneButton) elements.actionDoneButton.addEventListener('click', closeActionModal);
  bindGuardedBackdrop(elements.actionModal);
  if (elements.fileCloseButton) elements.fileCloseButton.addEventListener('click', closeFileModal);
  bindGuardedBackdrop(elements.fileModal);
  bindGlobalModalGuard();
  if (elements.addPurchaseLineButton) {
    elements.addPurchaseLineButton.addEventListener('click', function () {
      addPurchaseLineRow(blankPurchaseLine(state.activeEntry));
      syncQtyGapNote();
    });
  }
  if (elements.purchaseLineRows) {
    elements.purchaseLineRows.addEventListener('input', function (event) {
      const input = event.target;
      if (!input || !input.dataset) return;
      const row = input.closest('tr');
      if (!row) return;
      if (input.dataset.field === 'purchaseUnitPrice') formatAmountInput(input);
      if (input.dataset.field === 'purchaseUnitPrice' || input.dataset.field === 'purchaseQty') {
        updatePurchaseLineTotal(row);
      } else {
        syncQtyGapNote();
      }
    });
    elements.purchaseLineRows.addEventListener('change', function (event) {
      const input = event.target;
      if (!input || !input.dataset) return;
      const row = input.closest('tr');
      if (!row) return;
      if (input.dataset.field === 'purchaseTaxMode') updatePurchaseLineTotal(row);
    });
    elements.purchaseLineRows.addEventListener('click', function (event) {
      const button = event.target.closest('.po-customer-purchase-line-remove');
      if (!button) return;
      const row = button.closest('tr');
      if (!row || elements.purchaseLineRows.children.length <= 1) return;
      row.remove();
      syncQtyGapNote();
    });
  }
  if (elements.attachmentFile) {
    elements.attachmentFile.addEventListener('change', function () {
      setUploadNote(state.activeEntry);
    });
    elements.attachmentFile.addEventListener('client-portal-upload-files', function () {
      setUploadNote(state.activeEntry);
    });
  }
  window.addEventListener('popstate', function () {
    state.searchTerm = '';
    if (elements.searchInput) elements.searchInput.value = '';
    renderPage();
  });
  document.addEventListener('pointermove', syncStickySalesColumns, true);
  document.addEventListener('pointerup', syncStickySalesColumns, true);
  if (elements.table) elements.table.addEventListener('client:table-widths-changed', syncStickySalesColumns);
  if (elements.tableWrap) elements.tableWrap.addEventListener('scroll', syncStickySalesHeaderActive, { passive: true });
  window.addEventListener('resize', syncStickySalesColumns);

  loadPage();
})();
