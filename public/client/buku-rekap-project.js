(function () {
  const VERSION = 'v1';
  // Default non-luxury PKP PPN: 12% x 11/12 = 11% effective rate.
  const VAT_EFFECTIVE_RATE = 0.11;
  const TABS = {
    summary: 'Ringkasan Project',
    sales: 'Buku Penjualan Project',
    purchases: 'Buku Pembelian Project',
    expenses: 'Buku Biaya Project'
  };

  const FORM_LABELS = {
    sales: {
      title: 'Tambah Penjualan',
      editTitle: 'Ubah Penjualan',
      counterparty: 'Customer',
      amount: 'Nilai Penjualan',
      empty: 'Belum ada penjualan project.'
    },
    purchases: {
      title: 'Tambah Pembelian',
      editTitle: 'Ubah Pembelian',
      counterparty: 'Supplier',
      amount: 'Nilai Pembelian',
      empty: 'Belum ada pembelian project.'
    },
    expenses: {
      title: 'Tambah Biaya',
      editTitle: 'Ubah Biaya',
      counterparty: 'Penerima',
      amount: 'Nilai Biaya',
      empty: 'Belum ada biaya project.'
    }
  };

  const PROJECT_EXPENSE_COA_OPTIONS = [
    ['6-1001', 'BIAYA PENYUSUTAN'],
    ['6-1002', 'GAJI DEALER'],
    ['6-1003', 'GAJI BENGKEL'],
    ['6-1004', 'BIAYA LISTRIK AIR DEALER'],
    ['6-1005', 'BIAYA LISTRIK AIR BENGKEL'],
    ['6-1006', 'BIAYA TELEPON & INTERNET DEALER'],
    ['6-1007', 'BIAYA TELEPON & INTERNET BENGKEL'],
    ['6-1008', 'BIAYA JAKET, KAOS, TAS, STICKER'],
    ['6-1009', 'BIAYA KONSULTAN'],
    ['6-1010', 'BIAYA KANTOR'],
    ['6-1011', 'BIAYA PERAWATAN D-PACK'],
    ['6-1012', 'BIAYA ACT PROMOSI'],
    ['6-1013', 'BIAYA PERAWATAN'],
    ['6-1014', 'BIAYA TRANSPORT'],
    ['6-1015', 'BIAYA ATK & METERAI'],
    ['6-1016', 'BIAYA LAIN-LAIN'],
    ['6-1017', 'BIAYA BBN UNOTICE'],
    ['6-1018', 'BIAYA GOV CHARGE'],
    ['6-1019', 'BIAYA SEWA LARIS'],
    ['6-1020', 'BIAYA POS'],
    ['7-1001', 'BIAYA BONUS'],
    ['7-1002', 'BIAYA PAJAK TAHUN SEBELUMNYA'],
    ['7-1003', 'BIAYA PAJAK'],
    ['7-1004', 'BIAYA PAJAK TH BERJALAN'],
    ['7-1005', 'BIAYA SEWA'],
    ['7-1006', 'BEBAN ADMINISTRASI BANK'],
    ['7-1007', 'PAJAK BUNGA BANK'],
    ['7-1008', 'BIAYA PAJAK TAHUN BERJALAN']
  ].map(toCoaOption);

  const PROJECT_PAYMENT_COA_OPTIONS = [
    ['1-1001', 'KAS'],
    ['1-1003', 'KAS 2'],
    ['1-2001', 'BANK PEMILIK CONTOH'],
    ['1-2002', 'BANK BCA 0000000001'],
    ['1-2003', 'BANK BCA 0000000003'],
    ['1-2004', 'BANK BCA 0000000004'],
    ['1-2005', 'BANK MANDIRI'],
    ['1-2006', 'BANK JATENG'],
    ['1-2007', 'BANK BCA 0000000002'],
    ['2-2001', 'HUTANG BIAYA']
  ].map(toCoaOption);

  const state = {
    client: null,
    user: null,
    activeTab: 'summary',
    records: {
      sales: [],
      purchases: [],
      expenses: []
    },
    customers: [],
    suppliers: [],
    actionContext: null,
    loading: false
  };

  const elements = {
    alert: document.getElementById('projectBookAlert'),
    clientMeta: document.getElementById('projectBookClientMeta'),
    userName: document.getElementById('projectBookUserName'),
    userEmail: document.getElementById('projectBookUserEmail'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    refreshButton: document.getElementById('projectBookRefreshBtn'),
    backLink: document.getElementById('projectBookBackLink'),
    subtitle: document.getElementById('projectBookSubtitle'),
    search: document.getElementById('projectBookSearchInput'),
    panelTitle: document.getElementById('projectBookPanelTitle'),
    panelMeta: document.getElementById('projectBookPanelMeta'),
    tableHead: document.getElementById('projectBookTableHead'),
    tableBody: document.getElementById('projectBookTableBody'),
    salesTotal: document.getElementById('projectBookSalesTotal'),
    purchaseTotal: document.getElementById('projectBookPurchaseTotal'),
    expenseTotal: document.getElementById('projectBookExpenseTotal'),
    profitTotal: document.getElementById('projectBookProfitTotal'),
    formModal: document.getElementById('projectBookFormModal'),
    form: document.getElementById('projectBookForm'),
    formTitle: document.getElementById('projectBookFormTitle'),
    formMeta: document.getElementById('projectBookFormMeta'),
    formClose: document.getElementById('projectBookFormCloseBtn'),
    formCancel: document.getElementById('projectBookFormCancelBtn'),
    formSave: document.getElementById('projectBookFormSaveBtn'),
    type: document.getElementById('projectBookRecordType'),
    recordId: document.getElementById('projectBookRecordId'),
    projectSelectField: document.getElementById('projectBookProjectCodeSelectField'),
    projectInputField: document.getElementById('projectBookProjectCodeInputField'),
    projectSelect: document.getElementById('projectBookProjectCodeSelect'),
    projectInput: document.getElementById('projectBookProjectCodeInput'),
    dateInput: document.getElementById('projectBookDateInput'),
    taxModeField: document.getElementById('projectBookTaxModeField'),
    taxModeSelect: document.getElementById('projectBookTaxModeSelect'),
    counterpartyField: document.getElementById('projectBookCounterpartyField'),
    counterpartyLabel: document.getElementById('projectBookCounterpartyLabel'),
    counterpartyInput: document.getElementById('projectBookCounterpartyInput'),
    customerOptions: document.getElementById('projectBookCustomerOptions'),
    customerNikField: document.getElementById('projectBookCustomerNikField'),
    customerNikInput: document.getElementById('projectBookCustomerNikInput'),
    customerAddressField: document.getElementById('projectBookCustomerAddressField'),
    customerAddressInput: document.getElementById('projectBookCustomerAddressInput'),
    partyNikLabel: document.getElementById('projectBookPartyNikLabel'),
    partyAddressLabel: document.getElementById('projectBookPartyAddressLabel'),
    categoryField: document.getElementById('projectBookCategoryField'),
    categoryInput: document.getElementById('projectBookCategoryInput'),
    descriptionField: document.getElementById('projectBookDescriptionField'),
    descriptionInput: document.getElementById('projectBookDescriptionInput'),
    amountField: document.getElementById('projectBookAmountField'),
    amountLabel: document.getElementById('projectBookAmountLabel'),
    amountInput: document.getElementById('projectBookAmountInput'),
    salesItemsField: document.getElementById('projectBookSalesItemsField'),
    salesItemsMeta: document.getElementById('projectBookSalesItemsMeta'),
    salesItemsBody: document.getElementById('projectBookSalesItemsBody'),
    addSalesItemButton: document.getElementById('projectBookAddSalesItemBtn'),
    noteInput: document.getElementById('projectBookNoteInput'),
    attachmentFile: document.getElementById('projectBookAttachmentFile'),
    attachmentNote: document.getElementById('projectBookAttachmentNote'),
    detailModal: document.getElementById('projectBookDetailModal'),
    detailTitle: document.getElementById('projectBookDetailTitle'),
    detailMeta: document.getElementById('projectBookDetailMeta'),
    detailBody: document.getElementById('projectBookDetailBody'),
    detailClose: document.getElementById('projectBookDetailCloseBtn'),
    detailDone: document.getElementById('projectBookDetailDoneBtn'),
    fileModal: document.getElementById('projectBookFileModal'),
    fileTitle: document.getElementById('projectBookFileTitle'),
    fileMeta: document.getElementById('projectBookFileMeta'),
    fileBody: document.getElementById('projectBookFileBody'),
    fileClose: document.getElementById('projectBookFileCloseBtn'),
    fileDone: document.getElementById('projectBookFileDoneBtn'),
    actionModal: document.getElementById('projectBookActionModal'),
    actionTitle: document.getElementById('projectBookActionTitle'),
    actionMeta: document.getElementById('projectBookActionMeta'),
    actionBody: document.getElementById('projectBookActionBody'),
    actionClose: document.getElementById('projectBookActionCloseBtn'),
    actionDone: document.getElementById('projectBookActionDoneBtn'),
    paymentSourceField: document.getElementById('projectBookPaymentSourceField'),
    paymentSourceSelect: document.getElementById('projectBookPaymentSourceSelect')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));
  elements.tabs = Array.from(document.querySelectorAll('.project-book-tab'));
  elements.addButtons = Array.from(document.querySelectorAll('[data-open-form]'));

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function toCoaOption(item) {
    return {
      coa: text(item && item[0]).toUpperCase(),
      accountName: text(item && item[1]),
      label: text(item && item[0]).toUpperCase() + ' | ' + text(item && item[1])
    };
  }

  function coaLabel(coa, accountName) {
    const cleanCoa = text(coa).toUpperCase();
    const cleanAccount = text(accountName);
    if (cleanCoa && cleanAccount) return cleanCoa + ' | ' + cleanAccount;
    return cleanCoa || cleanAccount || '';
  }

  function findCoaOption(options, value) {
    const key = text(value).toUpperCase();
    if (!key) return null;
    return options.find(function (option) {
      return option.coa === key || option.accountName.toUpperCase() === key || option.label.toUpperCase() === key;
    }) || null;
  }

  function selectedCoaOption(select, options) {
    if (!select) return null;
    return findCoaOption(options, select.value);
  }

  function renderCoaOptions(select, options, selected, placeholder) {
    if (!select) return;
    clearNode(select);
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = placeholder || 'Pilih COA';
    select.appendChild(empty);
    options.forEach(function (option) {
      const item = document.createElement('option');
      item.value = option.coa;
      item.textContent = option.label;
      select.appendChild(item);
    });
    select.value = text(selected).toUpperCase();
  }

  function partyKey(name) {
    return text(name).toLowerCase();
  }

  function normalizeParty(party, prefix) {
    if (!party || typeof party !== 'object') return null;
    const name = text(party.name || party.customer || party.supplier || party.counterparty);
    if (!name) return null;
    return {
      id: text(party.id) || randomId(prefix || 'party'),
      name,
      nikNpwp: text(party.nikNpwp || party.nik || party.npwp),
      address: text(party.address || party.alamat),
      createdAt: text(party.createdAt) || new Date().toISOString(),
      updatedAt: text(party.updatedAt) || ''
    };
  }

  function normalizeParties(parties, prefix) {
    const map = new Map();
    (Array.isArray(parties) ? parties : []).forEach(function (party) {
      const normalized = normalizeParty(party, prefix);
      if (!normalized) return;
      map.set(partyKey(normalized.name), normalized);
    });
    return Array.from(map.values()).sort(function (a, b) {
      return text(a.name).localeCompare(text(b.name), 'id');
    });
  }

  function normalizeCustomers(customers) {
    return normalizeParties(customers, 'customer');
  }

  function normalizeSuppliers(suppliers) {
    return normalizeParties(suppliers, 'supplier');
  }

  function partyList(type) {
    return type === 'purchases' ? state.suppliers : state.customers;
  }

  function setPartyList(type, parties) {
    if (type === 'purchases') {
      state.suppliers = normalizeSuppliers(parties);
    } else {
      state.customers = normalizeCustomers(parties);
    }
  }

  function findPartyByName(type, name) {
    const key = partyKey(name);
    if (!key) return null;
    return partyList(type).find(function (party) {
      return partyKey(party.name) === key;
    }) || null;
  }

  function upsertParty(type, name, nikNpwp, address) {
    const cleanName = text(name);
    if (!cleanName) return;
    const existing = findPartyByName(type, cleanName);
    const now = new Date().toISOString();
    if (existing) {
      existing.name = cleanName;
      existing.nikNpwp = text(nikNpwp) || existing.nikNpwp;
      existing.address = text(address) || existing.address;
      existing.updatedAt = now;
    } else {
      const list = partyList(type);
      list.push({
        id: randomId(type === 'purchases' ? 'supplier' : 'customer'),
        name: cleanName,
        nikNpwp: text(nikNpwp),
        address: text(address),
        createdAt: now,
        updatedAt: now
      });
    }
    setPartyList(type, partyList(type));
  }

  function findCustomerByName(name) {
    return findPartyByName('sales', name);
  }

  function findSupplierByName(name) {
    return findPartyByName('purchases', name);
  }

  function upsertCustomer(name, nikNpwp, address) {
    upsertParty('sales', name, nikNpwp, address);
  }

  function upsertSupplier(name, nikNpwp, address) {
    upsertParty('purchases', name, nikNpwp, address);
  }

  function renderPartyOptions(type) {
    if (!elements.customerOptions) return;
    clearNode(elements.customerOptions);
    partyList(type).forEach(function (party) {
      const option = document.createElement('option');
      option.value = party.name;
      option.label = party.nikNpwp ? party.name + ' | ' + party.nikNpwp : party.name;
      elements.customerOptions.appendChild(option);
    });
  }

  function renderCustomerOptions() {
    renderPartyOptions('sales');
  }

  function applyPartySelection() {
    if (!elements.type || !['sales', 'purchases'].includes(elements.type.value)) return;
    const party = findPartyByName(elements.type.value, elements.counterpartyInput && elements.counterpartyInput.value);
    if (!party) return;
    if (elements.customerNikInput) elements.customerNikInput.value = party.nikNpwp || '';
    if (elements.customerAddressInput) elements.customerAddressInput.value = party.address || '';
  }

  function applyCustomerSelection() {
    applyPartySelection();
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/buku-rekap-project/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function storageKey() {
    return 'clientPortal:bukuRekapProject:' + clientIdFromPath() + ':' + VERSION;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function setAlert(message, kind) {
    if (!elements.alert) return;
    elements.alert.hidden = !message;
    elements.alert.textContent = message || '';
    elements.alert.className = 'portal-alert' + (kind ? ' ' + kind : '');
    if (message && kind !== 'error') {
      window.clearTimeout(setAlert.timer);
      setAlert.timer = window.setTimeout(function () {
        setAlert('');
      }, 3000);
    }
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function formatDate(value) {
    const raw = text(value);
    if (!raw) return '-';
    const parts = raw.split('-');
    if (parts.length === 3) return parts[2] + '-' + parts[1] + '-' + parts[0];
    return raw;
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function normalizeMoney(value) {
    if (value == null || value === '') return 0;
    const cleaned = String(value)
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatMoney(value) {
    const amount = Number(value || 0);
    if (!amount) return '0';
    return Math.round(amount).toLocaleString('id-ID');
  }

  function normalizeTaxMode(value) {
    const raw = text(value).toLowerCase().replace(/\s+/g, '-');
    if (raw === 'non-ppn' || raw === 'nonppn' || raw === 'no-ppn' || raw === 'tanpa-ppn') return 'non-ppn';
    return 'ppn';
  }

  function taxModeLabel(value) {
    return normalizeTaxMode(value) === 'ppn' ? 'PPN' : 'Non-PPN';
  }

  function currentItemTaxMode() {
    if (elements.type && elements.type.value === 'purchases') {
      return normalizeTaxMode(elements.taxModeSelect && elements.taxModeSelect.value);
    }
    return 'ppn';
  }

  function salesItemGross(item) {
    const qty = normalizeMoney(item && item.qty);
    const price = normalizeMoney(item && (item.price || item.unitPrice));
    return qty * price;
  }

  function salesItemDiscount(item) {
    return Math.max(0, normalizeMoney(item && item.discount));
  }

  function salesItemDpp(item) {
    if (item && item.dpp != null) return normalizeMoney(item.dpp);
    return Math.max(0, salesItemGross(item) - salesItemDiscount(item));
  }

  function salesItemVat(item) {
    if (normalizeTaxMode(item && item.taxMode) === 'non-ppn') return 0;
    if (item && item.ppn != null) return normalizeMoney(item.ppn);
    if (item && item.vat != null) return normalizeMoney(item.vat);
    if (item && (item.dpp != null || item.discount != null || item.ppn != null || item.vat != null)) {
      return Math.round(salesItemDpp(item) * VAT_EFFECTIVE_RATE);
    }
    return 0;
  }

  function salesItemAmount(item) {
    const amount = normalizeMoney(item && item.amount);
    if (amount && !(item && (item.dpp != null || item.discount != null || item.ppn != null || item.vat != null))) {
      return amount;
    }
    return salesItemDpp(item) + salesItemVat(item);
  }

  function normalizeTransactionItems(record, fallbackName, defaultTaxMode, itemPrefix) {
    const taxMode = normalizeTaxMode(defaultTaxMode || record?.taxMode);
    const rawItems = Array.isArray(record?.items) ? record.items : [];
    const migratedItems = rawItems.length ? rawItems : (
      normalizeMoney(record?.amount) || text(record?.description)
        ? [{
          name: text(record?.description) || fallbackName || 'Barang 1',
          qty: 1,
          price: normalizeMoney(record?.amount),
          discount: 0,
          dpp: normalizeMoney(record?.amount),
          ppn: normalizeMoney(record?.ppn),
          amount: normalizeMoney(record?.totalAmount || record?.amount),
          taxMode
        }]
        : []
    );
    return migratedItems.map(function (item, index) {
      const qty = normalizeMoney(item.qty) || 0;
      const price = normalizeMoney(item.price || item.unitPrice) || 0;
      const itemTaxMode = normalizeTaxMode(item.taxMode || taxMode);
      const hasTaxFields = item.dpp != null || item.discount != null || item.ppn != null || item.vat != null;
      const discount = hasTaxFields ? salesItemDiscount(item) : 0;
      const dpp = hasTaxFields ? salesItemDpp({ qty, price, discount, dpp: item.dpp }) : (normalizeMoney(item.amount) || Math.max(0, (qty * price) - discount));
      const ppn = itemTaxMode === 'ppn'
        ? (hasTaxFields ? salesItemVat({ dpp, ppn: item.ppn, vat: item.vat, taxMode: itemTaxMode }) : Math.round(dpp * VAT_EFFECTIVE_RATE))
        : 0;
      const amount = dpp + ppn;
      const name = text(item.name || item.itemName || item.description);
      if (!name && !qty && !price && !amount) return null;
      return {
        id: text(item.id) || randomId((itemPrefix || 'item') + '-' + index),
        name,
        qty,
        price,
        discount,
        dpp,
        ppn,
        amount,
        taxMode: itemTaxMode
      };
    }).filter(Boolean);
  }

  function normalizeSalesItems(record) {
    return normalizeTransactionItems(record, 'Barang 1', 'ppn', 'sales-item');
  }

  function normalizePurchaseItems(record) {
    const fallbackTaxMode = record?.taxMode || (normalizeMoney(record?.ppn) ? 'ppn' : 'non-ppn');
    return normalizeTransactionItems(record, 'Pembelian 1', fallbackTaxMode, 'purchase-item');
  }

  function salesItemsDpp(items) {
    return (Array.isArray(items) ? items : []).reduce(function (sum, item) {
      return sum + salesItemDpp(item);
    }, 0);
  }

  function salesItemsVat(items) {
    return (Array.isArray(items) ? items : []).reduce(function (sum, item) {
      return sum + salesItemVat(item);
    }, 0);
  }

  function salesItemsTotal(items) {
    return (Array.isArray(items) ? items : []).reduce(function (sum, item) {
      return sum + salesItemAmount(item);
    }, 0);
  }

  function salesItemsQty(items) {
    return (Array.isArray(items) ? items : []).reduce(function (sum, item) {
      return sum + normalizeMoney(item.qty);
    }, 0);
  }

  function salesItemsLabel(items) {
    const names = (Array.isArray(items) ? items : [])
      .map(function (item) { return text(item.name); })
      .filter(Boolean);
    if (!names.length) return '-';
    if (names.length <= 2) return names.join(', ');
    return names.slice(0, 2).join(', ') + ' +' + (names.length - 2) + ' barang';
  }

  function formatPercent(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) return '0%';
    return amount.toFixed(1).replace('.0', '') + '%';
  }

  function randomId(prefix) {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return (prefix || 'record') + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Buku Rekap Project.');
    return data;
  }

  async function loadPage() {
    const clientId = clientIdFromPath();
    if (!clientId || state.loading) return;
    state.loading = true;
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    setAlert('');
    try {
      const data = await requestJson('/app/api/client/clients/' + encodeURIComponent(clientId));
      if (!data) return;
      state.client = data.client || null;
      state.user = data.user || null;
      renderShell(data);
      loadLocalData();
      renderPage();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Buku Rekap Project.', 'error');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
    }
  }

  function renderShell(data) {
    const client = data.client || {};
    const user = data.user || {};
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    setText(elements.subtitle, text(client.name, 'Klien') + ' | Rekap project per Nomor Faktur Penjualan');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
  }

  function loadLocalData() {
    let saved = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(storageKey()) || 'null');
    } catch {
      saved = null;
    }
    state.records = {
      sales: normalizeRecords(saved?.records?.sales),
      purchases: normalizeRecords(saved?.records?.purchases),
      expenses: normalizeRecords(saved?.records?.expenses)
    };
    state.customers = normalizeCustomers(saved?.customers);
    state.suppliers = normalizeSuppliers(saved?.suppliers);
    state.records.sales.forEach(function (record) {
      upsertCustomer(record.counterparty, record.customerNikNpwp, record.customerAddress);
    });
    state.records.purchases.forEach(function (record) {
      upsertSupplier(record.counterparty, record.supplierNikNpwp, record.supplierAddress);
    });
  }

  function saveLocalData() {
    try {
      window.localStorage.setItem(storageKey(), JSON.stringify({
        records: state.records,
        customers: state.customers,
        suppliers: state.suppliers,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      setAlert('Data lokal tidak bisa disimpan. Storage browser mungkin penuh.', 'error');
    }
  }

  function normalizeRecords(records) {
    return Array.isArray(records) ? records.map(normalizeRecord).filter(Boolean) : [];
  }

  function normalizeRecord(record) {
    if (!record || typeof record !== 'object') return null;
    const type = ['sales', 'purchases', 'expenses'].includes(record.type) ? record.type : '';
    if (!type) return null;
    const projectCode = text(record.projectCode || record.invoiceNo).toUpperCase();
    if (!projectCode) return null;
    const purchaseTaxMode = type === 'purchases'
      ? normalizeTaxMode(record.taxMode || (normalizeMoney(record.ppn) ? 'ppn' : 'non-ppn'))
      : '';
    const items = type === 'sales'
      ? normalizeSalesItems(record)
      : (type === 'purchases' ? normalizePurchaseItems(Object.assign({}, record, { taxMode: purchaseTaxMode })) : []);
    const itemDpp = salesItemsDpp(items);
    const itemVat = salesItemsVat(items);
    const itemTotal = salesItemsTotal(items);
    const categoryOption = findCoaOption(PROJECT_EXPENSE_COA_OPTIONS, record.categoryCoa || record.category);
    const paymentOption = findCoaOption(PROJECT_PAYMENT_COA_OPTIONS, record.paymentCoa || record.paymentAccountName || record.paymentMethod);
    return {
      id: text(record.id) || randomId(type),
      type,
      projectCode,
      date: text(record.date) || today(),
      invoiceNo: text(record.invoiceNo || projectCode),
      counterparty: text(record.counterparty),
      customerNikNpwp: type === 'sales' ? text(record.customerNikNpwp || record.customerNik || record.nikNpwp) : '',
      customerAddress: type === 'sales' ? text(record.customerAddress || record.customerAlamat || record.address) : '',
      supplierNikNpwp: type === 'purchases' ? text(record.supplierNikNpwp || record.supplierNik || record.nikNpwp) : '',
      supplierAddress: type === 'purchases' ? text(record.supplierAddress || record.supplierAlamat || record.address) : '',
      taxMode: type === 'purchases' ? purchaseTaxMode : (type === 'sales' ? 'ppn' : ''),
      category: type === 'expenses' ? (categoryOption?.label || text(record.category)) : '',
      categoryCoa: type === 'expenses' ? (categoryOption?.coa || text(record.categoryCoa)) : '',
      categoryAccountName: type === 'expenses' ? (categoryOption?.accountName || text(record.categoryAccountName)) : '',
      description: text(record.description),
      items,
      amount: (type === 'sales' || type === 'purchases') ? itemDpp : normalizeMoney(record.amount),
      ppn: (type === 'sales' || type === 'purchases') ? itemVat : 0,
      totalAmount: (type === 'sales' || type === 'purchases') ? itemTotal : normalizeMoney(record.totalAmount || record.amount),
      paymentCoa: type === 'sales' ? '' : (paymentOption?.coa || text(record.paymentCoa)),
      paymentAccountName: type === 'sales' ? '' : (paymentOption?.accountName || text(record.paymentAccountName)),
      paymentMethod: type === 'sales' ? '' : (paymentOption?.label || coaLabel(record.paymentCoa, record.paymentAccountName) || text(record.paymentMethod)),
      note: text(record.note),
      attachment: record.attachment && typeof record.attachment === 'object' ? record.attachment : null,
      createdAt: text(record.createdAt) || new Date().toISOString(),
      updatedAt: text(record.updatedAt) || ''
    };
  }

  function allRecords() {
    return [].concat(state.records.sales, state.records.purchases, state.records.expenses);
  }

  function projectRows() {
    const map = new Map();
    allRecords().forEach(function (record) {
      const key = text(record.projectCode).toUpperCase();
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          projectCode: key,
          customer: '',
          description: '',
          firstDate: record.date,
          sales: 0,
          purchases: 0,
          expenses: 0,
          salesCount: 0,
          purchaseCount: 0,
          expenseCount: 0
        });
      }
      const row = map.get(key);
      if (record.date && (!row.firstDate || record.date < row.firstDate)) row.firstDate = record.date;
      if (record.type === 'sales') {
        row.sales += Number(record.amount || 0);
        row.salesCount += 1;
        if (!row.customer) row.customer = record.counterparty;
        if (!row.description) row.description = record.description || salesItemsLabel(record.items);
      } else if (record.type === 'purchases') {
        row.purchases += Number(record.amount || 0);
        row.purchaseCount += 1;
      } else if (record.type === 'expenses') {
        row.expenses += Number(record.amount || 0);
        row.expenseCount += 1;
      }
    });
    return Array.from(map.values()).map(function (row) {
      row.profit = row.sales - row.purchases - row.expenses;
      row.margin = row.sales ? (row.profit / row.sales) * 100 : 0;
      return row;
    }).sort(function (a, b) {
      return text(a.projectCode).localeCompare(text(b.projectCode), 'id');
    });
  }

  function totalRows() {
    return projectRows().reduce(function (acc, row) {
      acc.sales += row.sales;
      acc.purchases += row.purchases;
      acc.expenses += row.expenses;
      acc.profit += row.profit;
      return acc;
    }, { sales: 0, purchases: 0, expenses: 0, profit: 0 });
  }

  function renderPage() {
    const totals = totalRows();
    setText(elements.salesTotal, formatMoney(totals.sales));
    setText(elements.purchaseTotal, formatMoney(totals.purchases));
    setText(elements.expenseTotal, formatMoney(totals.expenses));
    setText(elements.profitTotal, formatMoney(totals.profit));
    if (elements.profitTotal) {
      elements.profitTotal.classList.toggle('negative', totals.profit < 0);
    }
    renderTabs();
    renderTable();
  }

  function renderTabs() {
    elements.tabs.forEach(function (button) {
      const active = button.dataset.tab === state.activeTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    renderActionButtons();
  }

  function renderActionButtons() {
    elements.addButtons.forEach(function (button) {
      const type = button.dataset.openForm || '';
      button.hidden = state.activeTab !== 'summary' && state.activeTab !== type;
    });
  }

  function filtered(records) {
    const keyword = text(elements.search && elements.search.value).toLowerCase();
    if (!keyword) return records;
    return records.filter(function (record) {
      return [
        record.projectCode,
        record.invoiceNo,
        record.customer,
        record.counterparty,
        record.customerNikNpwp,
        record.customerAddress,
        record.supplierNikNpwp,
        record.supplierAddress,
        taxModeLabel(record.taxMode),
        record.category,
        record.categoryCoa,
        record.categoryAccountName,
        record.paymentCoa,
        record.paymentAccountName,
        record.paymentMethod,
        record.description,
        salesItemsLabel(record.items),
        record.note
      ].map(text).join(' ').toLowerCase().includes(keyword);
    });
  }

  function renderTable() {
    clearNode(elements.tableHead);
    clearNode(elements.tableBody);
    setText(elements.panelTitle, TABS[state.activeTab] || TABS.summary);
    if (state.activeTab === 'summary') renderSummaryTable();
    if (state.activeTab === 'sales') renderRecordTable('sales');
    if (state.activeTab === 'purchases') renderRecordTable('purchases');
    if (state.activeTab === 'expenses') renderRecordTable('expenses');
  }

  function renderHead(labels) {
    const tr = document.createElement('tr');
    labels.forEach(function (label) {
      const th = document.createElement('th');
      th.textContent = label;
      tr.appendChild(th);
    });
    elements.tableHead.appendChild(tr);
  }

  function appendCell(row, value, className) {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.textContent = value == null || value === '' ? '-' : String(value);
    row.appendChild(td);
    return td;
  }

  function renderEmpty(message, colSpan) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colSpan;
    td.className = 'project-book-empty';
    td.textContent = message;
    tr.appendChild(td);
    elements.tableBody.appendChild(tr);
  }

  function renderSummaryTable() {
    const rows = filtered(projectRows());
    renderHead(['Kode Proyek', 'Customer', 'Project', 'Penjualan', 'Pembelian', 'Biaya', 'Laba/Rugi', 'Margin']);
    setText(elements.panelMeta, rows.length + ' project');
    if (!rows.length) {
      renderEmpty('Belum ada project.', 8);
      return;
    }
    rows.forEach(function (item) {
      const tr = document.createElement('tr');
      tr.className = 'project-book-clickable-row';
      tr.tabIndex = 0;
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', 'Buka aksi project ' + item.projectCode);
      bindRowAction(tr, function () {
        openActionMenu({ kind: 'summary', project: item });
      });
      appendCell(tr, item.projectCode, 'project-book-code');
      appendCell(tr, item.customer);
      appendCell(tr, item.description);
      appendCell(tr, formatMoney(item.sales), 'money');
      appendCell(tr, formatMoney(item.purchases), 'money');
      appendCell(tr, formatMoney(item.expenses), 'money');
      appendCell(tr, formatMoney(item.profit), item.profit < 0 ? 'money negative' : 'money positive');
      appendCell(tr, formatPercent(item.margin), item.margin < 0 ? 'negative' : 'positive');
      elements.tableBody.appendChild(tr);
    });
  }

  function renderRecordTable(type) {
    const rows = filtered(state.records[type] || []);
    if (type === 'sales') {
      renderHead(['Kode Proyek', 'Tanggal', 'Customer', 'NIK/NPWP', 'Project', 'Barang', 'Qty', 'DPP', 'PPN', 'Total Tagihan', 'File', 'Catatan']);
    } else if (type === 'purchases') {
      renderHead(['Kode Proyek', 'Tanggal', 'Supplier', 'NIK/NPWP', 'Alamat', 'PPN', 'Barang', 'Qty', 'DPP', 'PPN Masukan', 'Total Tagihan', 'Pembayaran', 'File', 'Catatan']);
    } else {
      renderHead(['Kode Proyek', 'Tanggal', 'Kategori', 'Uraian', 'Nilai Biaya', 'Pembayaran', 'File', 'Catatan']);
    }
    setText(elements.panelMeta, rows.length + ' data');
    if (!rows.length) {
      renderEmpty(FORM_LABELS[type].empty, type === 'sales' ? 12 : (type === 'purchases' ? 14 : 8));
      return;
    }
    rows.slice().sort(function (a, b) {
      return text(b.date).localeCompare(text(a.date)) || text(a.projectCode).localeCompare(text(b.projectCode), 'id');
    }).forEach(function (record) {
      const tr = document.createElement('tr');
      tr.className = 'project-book-clickable-row';
      tr.tabIndex = 0;
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', 'Buka aksi data ' + record.projectCode);
      bindRowAction(tr, function () {
        openActionMenu({ kind: 'record', record });
      });
      appendCell(tr, record.projectCode, 'project-book-code');
      appendCell(tr, formatDate(record.date));
      if (type === 'expenses') {
        appendCell(tr, record.category);
      } else {
        appendCell(tr, record.counterparty);
      }
      if (type === 'sales') {
        appendCell(tr, record.customerNikNpwp);
      } else if (type === 'purchases') {
        appendCell(tr, record.supplierNikNpwp);
        appendCell(tr, record.supplierAddress);
        appendCell(tr, taxModeLabel(record.taxMode));
      }
      if (type !== 'purchases') {
        appendCell(tr, record.description);
      }
      if (type === 'sales') {
        appendCell(tr, salesItemsLabel(record.items));
        appendCell(tr, formatMoney(salesItemsQty(record.items)), 'money');
        appendCell(tr, formatMoney(record.amount), 'money');
        appendCell(tr, formatMoney(record.ppn), 'money');
        appendCell(tr, formatMoney(record.totalAmount), 'money');
      } else if (type === 'purchases') {
        appendCell(tr, salesItemsLabel(record.items));
        appendCell(tr, formatMoney(salesItemsQty(record.items)), 'money');
        appendCell(tr, formatMoney(record.amount), 'money');
        appendCell(tr, formatMoney(record.ppn), 'money');
        appendCell(tr, formatMoney(record.totalAmount), 'money');
      } else {
        appendCell(tr, formatMoney(record.amount), 'money');
      }
      if (type !== 'sales') {
        appendCell(tr, record.paymentMethod || coaLabel(record.paymentCoa, record.paymentAccountName));
      }
      renderFileCell(tr, record);
      appendCell(tr, record.note);
      elements.tableBody.appendChild(tr);
    });
  }

  function attachmentViewerPayload(record) {
    const file = record && record.attachment ? record.attachment : null;
    if (!file || !file.attachmentDataUrl) return null;
    return {
      dataUrl: file.attachmentDataUrl,
      name: file.attachmentName || 'lampiran',
      mimeType: file.attachmentMimeType || '',
      size: file.attachmentSize || 0
    };
  }

  function attachmentCount(record) {
    const payload = attachmentViewerPayload(record);
    if (!payload) return 0;
    if (window.clientPortalFilesFromResponse) {
      return window.clientPortalFilesFromResponse(payload).length;
    }
    return 1;
  }

  function renderFileCell(row, record) {
    const td = document.createElement('td');
    const count = attachmentCount(record);
    if (!count) {
      td.textContent = '-';
      row.appendChild(td);
      return;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'mini-action';
    button.textContent = count + ' file';
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      openFileModal(record);
    });
    td.appendChild(button);
    row.appendChild(td);
  }

  function bindRowAction(row, handler) {
    row.addEventListener('click', function (event) {
      if (event.target && event.target.closest('button, a, input, select, textarea')) return;
      handler();
    });
    row.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      handler();
    });
  }

  function updateSalesItemNumbers() {
    if (!elements.salesItemsBody) return;
    Array.from(elements.salesItemsBody.querySelectorAll('[data-sales-item-row]')).forEach(function (row, index) {
      const no = row.querySelector('[data-sales-item-no]');
      if (no) no.textContent = String(index + 1);
    });
  }

  function salesItemRowsFromForm() {
    if (!elements.salesItemsBody) return [];
    const taxMode = currentItemTaxMode();
    return Array.from(elements.salesItemsBody.querySelectorAll('[data-sales-item-row]')).map(function (row) {
      const name = text(row.querySelector('[data-sales-item-field="name"]')?.value);
      const qty = normalizeMoney(row.querySelector('[data-sales-item-field="qty"]')?.value);
      const price = normalizeMoney(row.querySelector('[data-sales-item-field="price"]')?.value);
      const discount = normalizeMoney(row.querySelector('[data-sales-item-field="discount"]')?.value);
      const dpp = Math.max(0, (qty * price) - discount);
      const ppn = taxMode === 'ppn' ? Math.round(dpp * VAT_EFFECTIVE_RATE) : 0;
      const amount = dpp + ppn;
      return {
        id: text(row.dataset.itemId) || randomId('sales-item'),
        name,
        qty,
        price,
        discount,
        dpp,
        ppn,
        amount,
        taxMode
      };
    }).filter(function (item) {
      return item.name || item.qty || item.price || item.amount;
    });
  }

  function updateSalesItemsMeta() {
    const items = salesItemRowsFromForm();
    const qty = salesItemsQty(items);
    const dpp = salesItemsDpp(items);
    const ppn = salesItemsVat(items);
    const total = salesItemsTotal(items);
    if (currentItemTaxMode() === 'ppn') {
      setText(elements.salesItemsMeta, items.length + ' barang | Qty ' + formatMoney(qty) + ' | DPP ' + formatMoney(dpp) + ' | PPN ' + formatMoney(ppn) + ' | Total ' + formatMoney(total));
    } else {
      setText(elements.salesItemsMeta, items.length + ' barang | Qty ' + formatMoney(qty) + ' | Total ' + formatMoney(total));
    }
  }

  function updateSalesItemRow(row) {
    if (!row) return;
    const qtyInput = row.querySelector('[data-sales-item-field="qty"]');
    const priceInput = row.querySelector('[data-sales-item-field="price"]');
    const discountInput = row.querySelector('[data-sales-item-field="discount"]');
    const dppInput = row.querySelector('[data-sales-item-field="dpp"]');
    const ppnInput = row.querySelector('[data-sales-item-field="ppn"]');
    const amountInput = row.querySelector('[data-sales-item-field="amount"]');
    const discount = normalizeMoney(discountInput?.value);
    const dpp = Math.max(0, (normalizeMoney(qtyInput?.value) * normalizeMoney(priceInput?.value)) - discount);
    const ppn = currentItemTaxMode() === 'ppn' ? Math.round(dpp * VAT_EFFECTIVE_RATE) : 0;
    const amount = dpp + ppn;
    if (dppInput) dppInput.value = formatMoney(dpp);
    if (ppnInput) ppnInput.value = formatMoney(ppn);
    if (amountInput) amountInput.value = formatMoney(amount);
    updateSalesItemsMeta();
  }

  function syncItemTaxColumns() {
    if (!elements.salesItemsField) return;
    const showTaxColumns = currentItemTaxMode() === 'ppn';
    elements.salesItemsField.classList.toggle('tax-mode-non-ppn', !showTaxColumns);
    elements.salesItemsField.querySelectorAll('[data-tax-column]').forEach(function (cell) {
      cell.hidden = !showTaxColumns;
    });
  }

  function addSalesItemRow(item) {
    if (!elements.salesItemsBody) return;
    const tr = document.createElement('tr');
    tr.dataset.salesItemRow = '1';
    tr.dataset.itemId = text(item?.id) || randomId('sales-item');

    const no = document.createElement('td');
    no.className = 'sales-item-no';
    no.dataset.salesItemNo = '1';
    tr.appendChild(no);

    const nameCell = document.createElement('td');
    nameCell.className = 'sales-item-name';
    const nameInput = document.createElement('input');
    nameInput.dataset.salesItemField = 'name';
    nameInput.type = 'text';
    nameInput.value = text(item?.name);
    nameInput.placeholder = 'Nama barang';
    nameCell.appendChild(nameInput);
    tr.appendChild(nameCell);

    const qtyCell = document.createElement('td');
    qtyCell.className = 'sales-item-qty';
    const qtyInput = document.createElement('input');
    qtyInput.dataset.salesItemField = 'qty';
    qtyInput.type = 'text';
    qtyInput.inputMode = 'decimal';
    qtyInput.value = item?.qty ? formatMoney(item.qty) : '';
    qtyInput.placeholder = '0';
    qtyCell.appendChild(qtyInput);
    tr.appendChild(qtyCell);

    const priceCell = document.createElement('td');
    priceCell.className = 'sales-item-money';
    const priceInput = document.createElement('input');
    priceInput.dataset.salesItemField = 'price';
    priceInput.type = 'text';
    priceInput.inputMode = 'decimal';
    priceInput.value = item?.price ? formatMoney(item.price) : '';
    priceInput.placeholder = '0';
    priceCell.appendChild(priceInput);
    tr.appendChild(priceCell);

    const discountCell = document.createElement('td');
    discountCell.className = 'sales-item-money sales-item-discount';
    const discountInput = document.createElement('input');
    discountInput.dataset.salesItemField = 'discount';
    discountInput.type = 'text';
    discountInput.inputMode = 'decimal';
    discountInput.value = item?.discount ? formatMoney(item.discount) : '';
    discountInput.placeholder = '0';
    discountCell.appendChild(discountInput);
    tr.appendChild(discountCell);

    const dppCell = document.createElement('td');
    dppCell.className = 'sales-item-money';
    dppCell.dataset.taxColumn = 'dpp';
    const dppInput = document.createElement('input');
    dppInput.dataset.salesItemField = 'dpp';
    dppInput.type = 'text';
    dppInput.readOnly = true;
    dppInput.value = formatMoney(salesItemDpp(item || {}));
    dppCell.appendChild(dppInput);
    tr.appendChild(dppCell);

    const ppnCell = document.createElement('td');
    ppnCell.className = 'sales-item-money';
    ppnCell.dataset.taxColumn = 'ppn';
    const ppnInput = document.createElement('input');
    ppnInput.dataset.salesItemField = 'ppn';
    ppnInput.type = 'text';
    ppnInput.readOnly = true;
    ppnInput.value = formatMoney(salesItemVat(item || {}));
    ppnCell.appendChild(ppnInput);
    tr.appendChild(ppnCell);

    const amountCell = document.createElement('td');
    amountCell.className = 'sales-item-money';
    const amountInput = document.createElement('input');
    amountInput.dataset.salesItemField = 'amount';
    amountInput.type = 'text';
    amountInput.readOnly = true;
    amountInput.value = formatMoney(salesItemAmount(item || {}));
    amountCell.appendChild(amountInput);
    tr.appendChild(amountCell);

    const actionCell = document.createElement('td');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'mini-action danger';
    remove.dataset.salesItemRemove = '1';
    remove.textContent = 'Hapus';
    actionCell.appendChild(remove);
    tr.appendChild(actionCell);

    elements.salesItemsBody.appendChild(tr);
    syncItemTaxColumns();
    updateSalesItemNumbers();
    updateSalesItemRow(tr);
  }

  function renderSalesItems(items) {
    clearNode(elements.salesItemsBody);
    (Array.isArray(items) ? items : []).forEach(function (item) {
      addSalesItemRow(item);
    });
    updateSalesItemNumbers();
    syncItemTaxColumns();
    updateSalesItemsMeta();
  }

  function renderProjectOptions(selected) {
    const projects = projectRows();
    clearNode(elements.projectSelect);
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = projects.length ? 'Pilih kode proyek' : 'Belum ada faktur penjualan';
    elements.projectSelect.appendChild(empty);
    projects.forEach(function (project) {
      const option = document.createElement('option');
      option.value = project.projectCode;
      option.textContent = project.projectCode + (project.customer ? ' | ' + project.customer : '');
      elements.projectSelect.appendChild(option);
    });
    elements.projectSelect.value = selected || '';
  }

  function openForm(type, record) {
    const config = FORM_LABELS[type] || FORM_LABELS.sales;
    const editing = record && record.id;
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    setAttachmentNote(record || null);
    elements.type.value = type;
    elements.recordId.value = editing ? record.id : '';
    setText(elements.formTitle, editing ? config.editTitle : config.title);
    setText(elements.formMeta, state.client?.name || 'Buku Rekap Project');
    setText(elements.counterpartyLabel, config.counterparty);
    setText(elements.amountLabel, config.amount);
    setText(elements.partyNikLabel, 'NIK/NPWP ' + config.counterparty);
    setText(elements.partyAddressLabel, 'Alamat ' + config.counterparty);
    elements.projectInputField.hidden = type !== 'sales';
    elements.projectSelectField.hidden = type === 'sales';
    if (elements.taxModeField) elements.taxModeField.hidden = type !== 'purchases';
    elements.categoryField.hidden = type !== 'expenses';
    if (elements.customerNikField) elements.customerNikField.hidden = !['sales', 'purchases'].includes(type);
    if (elements.customerAddressField) elements.customerAddressField.hidden = !['sales', 'purchases'].includes(type);
    if (elements.paymentSourceField) elements.paymentSourceField.hidden = type === 'sales';
    if (elements.salesItemsField) elements.salesItemsField.hidden = !['sales', 'purchases'].includes(type);
    if (elements.amountField) elements.amountField.hidden = ['sales', 'purchases'].includes(type);
    elements.counterpartyField.hidden = type === 'expenses';
    renderPartyOptions(type);
    if (elements.counterpartyInput) {
      if (['sales', 'purchases'].includes(type)) {
        elements.counterpartyInput.setAttribute('list', 'projectBookCustomerOptions');
      } else {
        elements.counterpartyInput.removeAttribute('list');
      }
    }
    renderProjectOptions(record?.projectCode || '');
    renderCoaOptions(
      elements.categoryInput,
      PROJECT_EXPENSE_COA_OPTIONS,
      record?.categoryCoa || record?.category || '',
      'Pilih kategori biaya'
    );
    renderCoaOptions(
      elements.paymentSourceSelect,
      PROJECT_PAYMENT_COA_OPTIONS,
      record?.paymentCoa || record?.paymentMethod || '',
      'Pilih kas/bank/hutang biaya'
    );
    elements.projectInput.required = type === 'sales';
    elements.projectSelect.required = type !== 'sales';
    elements.categoryInput.required = type === 'expenses';
    if (elements.paymentSourceSelect) elements.paymentSourceSelect.required = type !== 'sales';
    elements.counterpartyInput.required = type !== 'expenses';
    if (elements.customerNikInput) elements.customerNikInput.required = type === 'sales';
    if (elements.customerAddressInput) elements.customerAddressInput.required = type === 'sales';
    elements.amountInput.required = type === 'expenses';
    elements.dateInput.value = record?.date || today();
    if (elements.taxModeSelect) elements.taxModeSelect.value = normalizeTaxMode(record?.taxMode || 'ppn');
    elements.projectInput.value = record?.projectCode || '';
    elements.counterpartyInput.value = record?.counterparty || '';
    if (elements.customerNikInput) {
      elements.customerNikInput.value = type === 'purchases' ? (record?.supplierNikNpwp || '') : (record?.customerNikNpwp || '');
    }
    if (elements.customerAddressInput) {
      elements.customerAddressInput.value = type === 'purchases' ? (record?.supplierAddress || '') : (record?.customerAddress || '');
    }
    if (['sales', 'purchases'].includes(type) && record?.counterparty && !(elements.customerNikInput?.value || elements.customerAddressInput?.value)) {
      applyPartySelection();
    }
    elements.categoryInput.value = text(record?.categoryCoa || record?.category).toUpperCase();
    elements.descriptionInput.value = record?.description || '';
    elements.amountInput.value = record?.amount ? formatMoney(record.amount) : '';
    renderSalesItems(type === 'sales'
      ? normalizeSalesItems(record || {})
      : (type === 'purchases' ? normalizePurchaseItems(record || {}) : []));
    if (elements.paymentSourceSelect) {
      elements.paymentSourceSelect.value = text(record?.paymentCoa || record?.paymentMethod).toUpperCase();
    }
    elements.noteInput.value = record?.note || '';
    if (elements.formSave) elements.formSave.textContent = editing ? 'Simpan Perubahan' : 'Simpan';
    elements.formModal.hidden = false;
  }

  function closeForm() {
    elements.formModal.hidden = true;
  }

  function selectedFileNote(prefix) {
    const files = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.attachmentFile) : [];
    if (files.length && window.clientPortalFormatFilesNote) return window.clientPortalFormatFilesNote(files, prefix || 'File dipilih');
    if (files.length) return files.length + ' file dipilih.';
    return '';
  }

  function setAttachmentNote(record) {
    if (!elements.attachmentNote) return;
    const selected = selectedFileNote('File dipilih');
    if (selected) {
      elements.attachmentNote.textContent = selected;
      return;
    }
    const count = record ? attachmentCount(record) : 0;
    elements.attachmentNote.textContent = count ? count + ' file tersimpan.' : 'Belum ada file dipilih.';
  }

  async function buildAttachment(record) {
    if (!window.clientPortalBuildAttachmentPayload) return record?.attachment || null;
    const payload = await window.clientPortalBuildAttachmentPayload(elements.attachmentFile);
    if (payload && payload.attachmentDataUrl) return payload;
    return record?.attachment || null;
  }

  async function submitForm(event) {
    event.preventDefault();
    const type = elements.type.value;
    const list = state.records[type] || [];
    const existing = list.find(function (item) { return item.id === elements.recordId.value; }) || null;
    const projectCode = type === 'sales' ? elements.projectInput.value : elements.projectSelect.value;
    const normalizedProjectCode = text(projectCode).toUpperCase();
    if (!normalizedProjectCode) {
      setAlert('Kode proyek wajib diisi.', 'error');
      return;
    }
    if (type !== 'sales' && !projectRows().some(function (row) { return row.projectCode === normalizedProjectCode; })) {
      setAlert('Kode proyek belum ada di penjualan.', 'error');
      return;
    }
    const categoryOption = type === 'expenses'
      ? selectedCoaOption(elements.categoryInput, PROJECT_EXPENSE_COA_OPTIONS)
      : null;
    if (type === 'expenses' && !categoryOption) {
      setAlert('Kategori biaya wajib dipilih dari COA.', 'error');
      return;
    }
    const paymentOption = type === 'sales'
      ? null
      : selectedCoaOption(elements.paymentSourceSelect, PROJECT_PAYMENT_COA_OPTIONS);
    if (type !== 'sales' && !paymentOption) {
      setAlert('Metode pembayaran wajib dipilih.', 'error');
      return;
    }
    const transactionItems = ['sales', 'purchases'].includes(type) ? salesItemRowsFromForm() : [];
    let amount = 0;
    let ppn = 0;
    let totalAmount = 0;
    if (['sales', 'purchases'].includes(type)) {
      if (!transactionItems.length) {
        setAlert('Minimal tambahkan 1 barang ' + (type === 'sales' ? 'penjualan' : 'pembelian') + '.', 'error');
        return;
      }
      const incomplete = transactionItems.some(function (item) {
        return !text(item.name) || normalizeMoney(item.qty) <= 0 || normalizeMoney(item.price) <= 0;
      });
      if (incomplete) {
        setAlert('Rincian barang ' + (type === 'sales' ? 'penjualan' : 'pembelian') + ' wajib diisi lengkap.', 'error');
        return;
      }
      amount = salesItemsDpp(transactionItems);
      ppn = salesItemsVat(transactionItems);
      totalAmount = salesItemsTotal(transactionItems);
    } else {
      amount = normalizeMoney(elements.amountInput.value);
      if (!amount) {
        setAlert('Nilai transaksi wajib diisi.', 'error');
        return;
      }
      totalAmount = amount;
    }
    if (type === 'sales') {
      upsertCustomer(elements.counterpartyInput.value, elements.customerNikInput && elements.customerNikInput.value, elements.customerAddressInput && elements.customerAddressInput.value);
      renderPartyOptions(type);
    }
    if (type === 'purchases') {
      upsertSupplier(elements.counterpartyInput.value, elements.customerNikInput && elements.customerNikInput.value, elements.customerAddressInput && elements.customerAddressInput.value);
      renderPartyOptions(type);
    }
    const record = {
      id: existing?.id || randomId(type),
      type,
      projectCode: normalizedProjectCode,
      invoiceNo: normalizedProjectCode,
      date: elements.dateInput.value || today(),
      counterparty: type === 'expenses' ? '' : text(elements.counterpartyInput.value),
      customerNikNpwp: type === 'sales' ? text(elements.customerNikInput && elements.customerNikInput.value) : '',
      customerAddress: type === 'sales' ? text(elements.customerAddressInput && elements.customerAddressInput.value) : '',
      supplierNikNpwp: type === 'purchases' ? text(elements.customerNikInput && elements.customerNikInput.value) : '',
      supplierAddress: type === 'purchases' ? text(elements.customerAddressInput && elements.customerAddressInput.value) : '',
      taxMode: type === 'purchases' ? normalizeTaxMode(elements.taxModeSelect && elements.taxModeSelect.value) : (type === 'sales' ? 'ppn' : ''),
      category: type === 'expenses' ? categoryOption.label : '',
      categoryCoa: type === 'expenses' ? categoryOption.coa : '',
      categoryAccountName: type === 'expenses' ? categoryOption.accountName : '',
      description: ['sales', 'purchases'].includes(type)
        ? (text(elements.descriptionInput.value) || salesItemsLabel(transactionItems))
        : text(elements.descriptionInput.value),
      items: ['sales', 'purchases'].includes(type) ? transactionItems : [],
      amount,
      ppn,
      totalAmount,
      paymentCoa: type === 'sales' ? '' : paymentOption.coa,
      paymentAccountName: type === 'sales' ? '' : paymentOption.accountName,
      paymentMethod: type === 'sales' ? '' : paymentOption.label,
      note: text(elements.noteInput.value),
      attachment: await buildAttachment(existing),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    if (existing) {
      const index = list.findIndex(function (item) { return item.id === existing.id; });
      list.splice(index, 1, record);
    } else {
      list.push(record);
    }
    state.records[type] = list;
    saveLocalData();
    closeForm();
    state.activeTab = type;
    renderPage();
    setAlert((existing ? 'Perubahan' : 'Data') + ' ' + (TABS[type] || 'project') + ' tersimpan.', 'info');
  }

  function deleteRecord(record) {
    if (!window.confirm('Hapus data ' + record.projectCode + '?')) return;
    state.records[record.type] = (state.records[record.type] || []).filter(function (item) {
      return item.id !== record.id;
    });
    saveLocalData();
    renderPage();
    setAlert('Data project dihapus.', 'info');
  }

  function openProjectDetail(projectCode) {
    const code = text(projectCode).toUpperCase();
    const row = projectRows().find(function (item) { return item.projectCode === code; });
    if (!row) return;
    setText(elements.detailTitle, code);
    setText(elements.detailMeta, (row.customer || 'Project') + ' | Laba/Rugi ' + formatMoney(row.profit));
    clearNode(elements.detailBody);
    const summary = document.createElement('div');
    summary.className = 'project-book-detail-kpis';
    [
      ['Penjualan', row.sales],
      ['Pembelian', row.purchases],
      ['Biaya', row.expenses],
      ['Laba/Rugi', row.profit]
    ].forEach(function (item) {
      const card = document.createElement('div');
      card.className = 'project-book-kpi';
      if (item[1] < 0) card.classList.add('negative');
      const label = document.createElement('span');
      label.textContent = item[0];
      const value = document.createElement('strong');
      value.textContent = formatMoney(item[1]);
      card.appendChild(label);
      card.appendChild(value);
      summary.appendChild(card);
    });
    elements.detailBody.appendChild(summary);
    renderDetailSection('Penjualan', state.records.sales.filter(byProject(code)), ['Tanggal', 'Customer', 'Nama Barang', 'Qty', 'Harga Satuan', 'Diskon', 'DPP', 'PPN', 'Jumlah']);
    renderDetailSection('Pembelian', state.records.purchases.filter(byProject(code)), ['Tanggal', 'Supplier', 'Nama Barang', 'Qty', 'Harga Satuan', 'Diskon', 'DPP', 'PPN', 'Jumlah', 'Pembayaran']);
    renderDetailSection('Biaya', state.records.expenses.filter(byProject(code)), ['Tanggal', 'Kategori', 'Uraian', 'Pembayaran', 'Nilai']);
    elements.detailModal.hidden = false;
  }

  function byProject(projectCode) {
    return function (record) {
      return text(record.projectCode).toUpperCase() === projectCode;
    };
  }

  function renderDetailSection(title, records, headers) {
    const section = document.createElement('section');
    section.className = 'project-book-detail-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    const table = document.createElement('table');
    table.className = 'project-book-detail-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    headers.forEach(function (label) {
      const th = document.createElement('th');
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    const isSalesSection = title === 'Penjualan';
    const isPurchaseSection = title === 'Pembelian';
    if (!records.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = headers.length;
      td.className = 'project-book-empty';
      td.textContent = 'Tidak ada data.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      records.forEach(function (record) {
        if (isSalesSection || isPurchaseSection) {
          const items = isSalesSection ? normalizeSalesItems(record) : normalizePurchaseItems(record);
          if (!items.length) {
            const tr = document.createElement('tr');
            appendDetailCell(tr, formatDate(record.date));
            appendDetailCell(tr, record.counterparty);
            appendDetailCell(tr, record.description || '-');
            appendDetailCell(tr, '0', 'money');
            appendDetailCell(tr, '0', 'money');
            appendDetailCell(tr, '0', 'money');
            appendDetailCell(tr, formatMoney(record.amount), 'money');
            appendDetailCell(tr, formatMoney(record.ppn), 'money');
            appendDetailCell(tr, formatMoney(record.totalAmount || record.amount), 'money');
            if (isPurchaseSection) {
              appendDetailCell(tr, record.paymentMethod || coaLabel(record.paymentCoa, record.paymentAccountName));
            }
            tbody.appendChild(tr);
            return;
          }
          items.forEach(function (item) {
            const tr = document.createElement('tr');
            appendDetailCell(tr, formatDate(record.date));
            appendDetailCell(tr, record.counterparty);
            appendDetailCell(tr, item.name);
            appendDetailCell(tr, formatMoney(item.qty), 'money');
            appendDetailCell(tr, formatMoney(item.price), 'money');
            appendDetailCell(tr, formatMoney(item.discount), 'money');
            appendDetailCell(tr, formatMoney(item.dpp), 'money');
            appendDetailCell(tr, formatMoney(item.ppn), 'money');
            appendDetailCell(tr, formatMoney(salesItemAmount(item)), 'money');
            if (isPurchaseSection) {
              appendDetailCell(tr, record.paymentMethod || coaLabel(record.paymentCoa, record.paymentAccountName));
            }
            tbody.appendChild(tr);
          });
          return;
        }
        const tr = document.createElement('tr');
        appendDetailCell(tr, formatDate(record.date));
        appendDetailCell(tr, record.type === 'expenses' ? record.category : record.counterparty);
        appendDetailCell(tr, record.description);
        if (headers.includes('Pembayaran')) {
          appendDetailCell(tr, record.paymentMethod || coaLabel(record.paymentCoa, record.paymentAccountName));
        }
        appendDetailCell(tr, formatMoney(record.amount), 'money');
        tbody.appendChild(tr);
      });
    }
    table.appendChild(tbody);
    section.appendChild(table);
    elements.detailBody.appendChild(section);
  }

  function appendDetailCell(row, value, className) {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.textContent = value || '-';
    row.appendChild(td);
  }

  function closeDetail() {
    elements.detailModal.hidden = true;
  }

  function openFileModal(record) {
    const payload = attachmentViewerPayload(record);
    if (!payload) return;
    setText(elements.fileTitle, record.projectCode);
    setText(elements.fileMeta, record.description || record.counterparty || record.category || '-');
    clearNode(elements.fileBody);
    if (window.clientPortalRenderAttachmentViewer) {
      window.clientPortalRenderAttachmentViewer(elements.fileBody, payload, {
        label: 'File Project',
        titleEl: elements.fileTitle,
        metaEl: elements.fileMeta
      });
    } else {
      elements.fileBody.textContent = attachmentCount(record) + ' file tersimpan.';
    }
    elements.fileModal.hidden = false;
  }

  function closeFileModal() {
    elements.fileModal.hidden = true;
  }

  function appendActionButton(label, className, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'project-book-action-choice' + (className ? ' ' + className : '');
    button.textContent = label;
    button.addEventListener('click', handler);
    elements.actionBody.appendChild(button);
  }

  function openActionMenu(context) {
    if (!elements.actionModal || !elements.actionBody) return;
    state.actionContext = context || null;
    clearNode(elements.actionBody);
    if (context?.kind === 'summary') {
      const project = context.project || {};
      setText(elements.actionTitle, project.projectCode || 'Aksi Project');
      setText(elements.actionMeta, (project.customer || 'Ringkasan project') + ' | Laba/Rugi ' + formatMoney(project.profit));
      appendActionButton('Lihat Detail', '', function () {
        closeActionMenu();
        openProjectDetail(project.projectCode);
      });
    } else if (context?.kind === 'record') {
      const record = context.record || {};
      setText(elements.actionTitle, record.projectCode || 'Aksi Data');
      setText(elements.actionMeta, (TABS[record.type] || 'Data project') + ' | ' + formatDate(record.date));
      appendActionButton('Ubah', '', function () {
        closeActionMenu();
        openForm(record.type, record);
      });
      if (attachmentCount(record)) {
        appendActionButton('Lihat File', '', function () {
          closeActionMenu();
          openFileModal(record);
        });
      }
      appendActionButton('Hapus', 'danger', function () {
        closeActionMenu();
        deleteRecord(record);
      });
    }
    elements.actionModal.hidden = false;
  }

  function closeActionMenu() {
    state.actionContext = null;
    if (elements.actionModal) elements.actionModal.hidden = true;
  }

  async function logout() {
    if (elements.logoutButton) elements.logoutButton.disabled = true;
    try {
      const response = await fetch('/app/api/client/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      const data = await response.json().catch(function () { return {}; });
      window.location.assign(data.redirectUrl || '/app/client/login');
    } catch {
      window.location.assign('/app/client/login');
    }
  }

  elements.tabs.forEach(function (button) {
    button.addEventListener('click', function () {
      state.activeTab = button.dataset.tab || 'summary';
      renderPage();
    });
  });
  elements.addButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      openForm(button.dataset.openForm || 'sales');
    });
  });
  if (elements.search) elements.search.addEventListener('input', renderTable);
  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadPage);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.form) elements.form.addEventListener('submit', submitForm);
  if (elements.formClose) elements.formClose.addEventListener('click', closeForm);
  if (elements.formCancel) elements.formCancel.addEventListener('click', closeForm);
  if (elements.counterpartyInput) {
    elements.counterpartyInput.addEventListener('change', applyPartySelection);
    elements.counterpartyInput.addEventListener('blur', applyPartySelection);
  }
  if (elements.taxModeSelect) {
    elements.taxModeSelect.addEventListener('change', function () {
      syncItemTaxColumns();
      Array.from(elements.salesItemsBody ? elements.salesItemsBody.querySelectorAll('[data-sales-item-row]') : []).forEach(updateSalesItemRow);
      updateSalesItemsMeta();
    });
  }
  if (elements.addSalesItemButton) {
    elements.addSalesItemButton.addEventListener('click', function () {
      addSalesItemRow();
    });
  }
  if (elements.salesItemsBody) {
    elements.salesItemsBody.addEventListener('input', function (event) {
      const field = event.target && event.target.closest('[data-sales-item-field]');
      if (!field) return;
      const row = field.closest('[data-sales-item-row]');
      updateSalesItemRow(row);
    });
    elements.salesItemsBody.addEventListener('blur', function (event) {
      const field = event.target && event.target.closest('[data-sales-item-field]');
      if (!field || field.dataset.salesItemField === 'name') return;
      const amount = normalizeMoney(field.value);
      field.value = amount ? formatMoney(amount) : '';
      updateSalesItemRow(field.closest('[data-sales-item-row]'));
    }, true);
    elements.salesItemsBody.addEventListener('click', function (event) {
      const button = event.target && event.target.closest('[data-sales-item-remove]');
      if (!button) return;
      const row = button.closest('[data-sales-item-row]');
      if (row) row.remove();
      updateSalesItemNumbers();
      syncItemTaxColumns();
      updateSalesItemsMeta();
    });
  }
  if (elements.detailClose) elements.detailClose.addEventListener('click', closeDetail);
  if (elements.detailDone) elements.detailDone.addEventListener('click', closeDetail);
  if (elements.fileClose) elements.fileClose.addEventListener('click', closeFileModal);
  if (elements.fileDone) elements.fileDone.addEventListener('click', closeFileModal);
  if (elements.actionClose) elements.actionClose.addEventListener('click', closeActionMenu);
  if (elements.actionDone) elements.actionDone.addEventListener('click', closeActionMenu);
  if (elements.attachmentFile) {
    elements.attachmentFile.addEventListener('change', function () {
      setAttachmentNote(null);
    });
    elements.attachmentFile.addEventListener('client-portal-upload-files', function () {
      setAttachmentNote(null);
    });
  }
  if (elements.amountInput) {
    elements.amountInput.addEventListener('blur', function () {
      const amount = normalizeMoney(elements.amountInput.value);
      elements.amountInput.value = amount ? formatMoney(amount) : '';
    });
  }
  if (window.clientPortalEnhanceUploadInputs) {
    window.clientPortalEnhanceUploadInputs();
  }
  loadPage();
})();
