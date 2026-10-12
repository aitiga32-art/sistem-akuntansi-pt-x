(function () {
  const PPN_RATE = 11;

  function isEmbeddedPaymentSource() {
    return new URLSearchParams(window.location.search).get('embeddedPayment') === '1';
  }

  function notifyEmbeddedPaymentClosed(refreshAfterClose) {
    if (!isEmbeddedPaymentSource() || window.parent === window) return;
    window.parent.postMessage({
      type: 'client-portal-hti-source-payment-closed',
      refresh: refreshAfterClose !== false
    }, window.location.origin);
  }

  if (isEmbeddedPaymentSource()) {
    document.body.classList.add('hti-embedded-payment-source');
  }

  const state = {
    client: null,
    entries: [],
    projects: [],
    projectOptions: [],
    paymentSources: [],
    suppliers: [],
    advanceBalances: [],
    loading: false,
    sort: { key: '', direction: '' },
    editingEntry: null,
    transactionGroupId: '',
    viewEntry: null,
    viewEntries: [],
    viewAttachmentFiles: [],
    viewPreviewFileId: '',
    viewAttachmentLoading: false,
    invoicePreview: null,
    paymentEditingExisting: false,
    paymentEntry: null,
    paymentTargets: [],
    paymentTarget: null,
    sourcePaymentRowIndex: -1,
    initialModeApplied: false,
    entryOpenApplied: false,
    purchaseEntry: null,
    sourcePaymentOpenApplied: false,
    projectPrefillApplied: false,
    editingEntries: []
  };

  const elements = {
    alert: document.getElementById('htiAlert'),
    clientMeta: document.getElementById('htiClientMeta'),
    userName: document.getElementById('htiUserName'),
    userEmail: document.getElementById('htiUserEmail'),
    backLink: document.getElementById('htiBackLink'),
    subtitle: document.getElementById('htiSubtitle'),
    refreshButton: document.getElementById('htiRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    projectFilter: document.getElementById('htiProjectFilter'),
    statusFilter: document.getElementById('htiStatusFilter'),
    documentFilter: document.getElementById('htiDocumentFilter'),
    searchInput: document.getElementById('htiSearchInput'),
    rows: document.getElementById('htiRows'),
    addButton: document.getElementById('htiAddBtn'),
    exportButton: document.getElementById('htiExportBtn'),
    bookJournalButton: document.getElementById('htiBookJournalBtn'),
    advanceButton: document.getElementById('htiAdvanceBtn'),
    modal: document.getElementById('htiEntryModal'),
    form: document.getElementById('htiEntryForm'),
    modalTitle: document.getElementById('htiEntryModalTitle'),
    modalMeta: document.getElementById('htiEntryModalMeta'),
    entryId: document.getElementById('htiEntryId'),
    closeButton: document.getElementById('htiEntryCloseBtn'),
    entrySizeDecreaseButton: document.getElementById('htiEntrySizeDecreaseBtn'),
    entrySizeIncreaseButton: document.getElementById('htiEntrySizeIncreaseBtn'),
    cancelButton: document.getElementById('htiEntryCancelBtn'),
    saveButton: document.getElementById('htiEntrySaveBtn'),
    supplierNpwp: document.getElementById('htiSupplierNpwp'),
    supplierName: document.getElementById('htiSupplierName'),
    advanceBalance: document.getElementById('htiAdvanceBalance'),
    advanceBalanceValue: document.getElementById('htiAdvanceBalanceValue'),
    advanceBalanceMeta: document.getElementById('htiAdvanceBalanceMeta'),
    customerNpwp: document.getElementById('htiCustomerNpwp'),
    customerAddress: document.getElementById('htiCustomerAddress'),
    documentType: document.getElementById('htiDocumentType'),
    fakturNo: document.getElementById('htiFakturNo'),
    fakturDate: document.getElementById('htiFakturDate'),
    fakturDatePicker: document.getElementById('htiFakturDatePicker'),
    invoiceNo: document.getElementById('htiInvoiceNo'),
    invoiceDate: document.getElementById('htiInvoiceDate'),
    invoiceDatePicker: document.getElementById('htiInvoiceDatePicker'),
    fpPurchaseNo: document.getElementById('htiFpPurchaseNo'),
    notesInput: document.getElementById('htiSalesNotes'),
    entryLines: document.getElementById('htiEntryLines'),
    addLineButton: document.getElementById('htiAddLineBtn'),
    attachmentName: document.getElementById('htiAttachmentName'),
    attachmentPickButton: document.getElementById('htiAttachmentPickBtn'),
    attachmentFile: document.getElementById('htiAttachmentFile'),
    attachmentNote: document.getElementById('htiAttachmentNote'),
    viewModal: document.getElementById('htiViewModal'),
    viewUpload: document.querySelector('.hti-view-upload'),
    viewTitle: document.getElementById('htiViewModalTitle'),
    viewMeta: document.getElementById('htiViewModalMeta'),
    viewBody: document.getElementById('htiViewBody'),
    viewCloseButton: document.getElementById('htiViewCloseBtn'),
    viewCancelButton: document.getElementById('htiViewCancelBtn'),
    viewInvoiceButton: document.getElementById('htiViewInvoiceBtn'),
    viewConvertButton: document.getElementById('htiViewConvertBtn'),
    viewEditButton: document.getElementById('htiViewEditBtn'),
    viewPurchaseInputButton: document.getElementById('htiViewPurchaseInputBtn'),
    viewPayButton: document.getElementById('htiViewPayBtn'),
    viewDeleteButton: document.getElementById('htiViewDeleteBtn'),
    viewAttachmentName: document.getElementById('htiViewAttachmentName'),
    viewAttachmentPickButton: document.getElementById('htiViewAttachmentPickBtn'),
    viewAttachmentFile: document.getElementById('htiViewAttachmentFile'),
    viewAttachmentNote: document.getElementById('htiViewAttachmentNote'),
    viewDocuments: document.getElementById('htiViewDocuments'),
    paymentSourceOptions: document.getElementById('htiPaymentSourceOptions'),
    projectOptions: document.getElementById('htiProjectOptions'),
    supplierCodeOptions: document.getElementById('htiSupplierCodeOptions'),
    supplierNameOptions: document.getElementById('htiSupplierNameOptions'),
    fileModal: document.getElementById('htiFileModal'),
    fileTitle: document.getElementById('htiFileModalTitle'),
    fileMeta: document.getElementById('htiFileModalMeta'),
    fileBody: document.getElementById('htiFileBody'),
    fileCloseButton: document.getElementById('htiFileCloseBtn'),
    fileCancelButton: document.getElementById('htiFileCancelBtn'),
    invoiceModal: document.getElementById('htiInvoiceModal'),
    invoiceTitle: document.getElementById('htiInvoiceTitle'),
    invoiceMeta: document.getElementById('htiInvoiceMeta'),
    invoiceType: document.getElementById('htiInvoiceType'),
    invoiceBank: document.getElementById('htiInvoiceBank'),
    invoiceBody: document.getElementById('htiInvoiceBody'),
    invoiceCloseButton: document.getElementById('htiInvoiceCloseBtn'),
    invoiceCancelButton: document.getElementById('htiInvoiceCancelBtn'),
    invoicePrintButton: document.getElementById('htiInvoicePrintBtn'),
    purchaseChoiceModal: document.getElementById('htiPurchaseChoiceModal'),
    purchaseChoiceCloseButton: document.getElementById('htiPurchaseChoiceCloseBtn'),
    purchaseChoiceCancelButton: document.getElementById('htiPurchaseChoiceCancelBtn'),
    purchaseChoiceFpButton: document.getElementById('htiPurchaseChoiceFpBtn'),
    purchaseChoiceNonPpnButton: document.getElementById('htiPurchaseChoiceNonPpnBtn'),
    paymentModal: document.getElementById('htiPaymentModal'),
    paymentForm: document.getElementById('htiPaymentForm'),
    paymentEntryId: document.getElementById('htiPaymentEntryId'),
    paymentModalTitle: document.getElementById('htiPaymentModalTitle'),
    paymentModalMeta: document.getElementById('htiPaymentModalMeta'),
    paymentOutstanding: document.getElementById('htiPaymentOutstanding'),
    paymentAdvanceHint: document.getElementById('htiPaymentAdvanceHint'),
    paymentAdvanceAvailable: document.getElementById('htiPaymentAdvanceAvailable'),
    paymentCloseButton: document.getElementById('htiPaymentCloseBtn'),
    paymentCancelButton: document.getElementById('htiPaymentCancelBtn'),
    paymentEditButton: document.getElementById('htiPaymentEditBtn'),
    paymentReverseButton: document.getElementById('htiPaymentReverseBtn'),
    paymentSaveButton: document.getElementById('htiPaymentSaveBtn'),
    paymentAttachmentName: document.getElementById('htiPaymentAttachmentName'),
    paymentAttachmentPickButton: document.getElementById('htiPaymentAttachmentPickBtn'),
    paymentAttachmentFile: document.getElementById('htiPaymentAttachmentFile'),
    paymentAttachmentNote: document.getElementById('htiPaymentAttachmentNote'),
    paymentRows: document.getElementById('htiPaymentRows'),
    paymentAddRowButton: document.getElementById('htiPaymentAddRowBtn'),
    quickPaymentEntry: document.getElementById('htiQuickPaymentEntry'),
    quickPaymentDate: document.getElementById('htiQuickPaymentDate'),
    quickPaymentDatePicker: document.getElementById('htiQuickPaymentDatePicker'),
    quickPaymentAdvanceAmount: document.getElementById('htiQuickPaymentAdvanceAmount'),
    quickPaymentUseAllAdvance: document.getElementById('htiQuickPaymentUseAllAdvance'),
    quickPaymentAmount: document.getElementById('htiQuickPaymentAmount'),
    quickPaymentSource: document.getElementById('htiQuickPaymentSource'),
    quickPaymentNotes: document.getElementById('htiQuickPaymentNotes')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  const moneyFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  const quantityFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 });
  const PTX_PAYMENT_SOURCE_LABELS = [
    'KAS KECIL',
    'BANK MANDIRI',
    'BANK BTN',
    'BANK JATENG',
    'BANK BCA',
    'BCA OPERASIONAL'
  ];
  const PTX_INVOICE_BANKS = [
    { key: 'BANK BCA', label: 'TRANSFER BCA : 8165.824.888' },
    { key: 'BANK MANDIRI', label: 'TRANSFER Mandiri : 135.0020.2218.08' },
    { key: 'BANK BTN', label: 'TRANSFER BTN' },
    { key: 'BANK JATENG', label: 'TRANSFER Bank Jateng' }
  ];
  let alertTimer = null;

  function text(value, fallback) {
    const valueText = value == null ? '' : String(value).trim();
    return valueText || fallback || '';
  }

  function documentTypeOf(value) {
    const raw = value && typeof value === 'object'
      ? text(value.documentType || value.document_type || value.document)
      : text(value);
    const clean = raw.toLowerCase();
    return clean.includes('proforma') ? 'proforma' : 'faktur';
  }

  function documentTypeLabel(value) {
    return documentTypeOf(value) === 'proforma' ? 'Pre Order' : 'Faktur';
  }

  function isProformaEntry(entry) {
    return documentTypeOf(entry) === 'proforma';
  }

  function isFormProforma() {
    return documentTypeOf(elements.documentType && elements.documentType.value) === 'proforma';
  }

  function normalizedMatchText(value) {
    return text(value).toLowerCase().replace(/\s+/g, ' ');
  }

  function conversionQuantity(entry) {
    const quantity = parseAmount(entry && entry.quantity);
    if (quantity > 0) return quantity;
    return Number(entry && entry.totalAmount || 0) > 0 ? 1 : 0;
  }

  function proformaSourceFileKey(entry) {
    const id = text(entry && entry.id);
    return id ? 'proforma:' + id : '';
  }

  function finalSalesEntriesForProforma(entry) {
    if (!entry || !isProformaEntry(entry)) return [];
    const sourceKey = proformaSourceFileKey(entry);
    const projectNo = text(entry.projectNo);
    const itemName = normalizedMatchText(entry.itemName);
    const customerCode = normalizedMatchText(entry.customerCode || entry.supplierNpwp);
    const customerName = normalizedMatchText(entry.customerName || entry.supplierName);
    const invoiceNo = normalizedMatchText(entry.invoiceNo);
    return state.entries.filter(function (candidate) {
      if (!candidate || isProformaEntry(candidate)) return false;
      if (sourceKey && text(candidate.sourceFile) === sourceKey) return true;
      if (text(candidate.sourceFile).startsWith('proforma:')) return false;
      if (!projectNo || text(candidate.projectNo) !== projectNo) return false;
      if (itemName && normalizedMatchText(candidate.itemName) !== itemName) return false;
      const candidateCode = normalizedMatchText(candidate.customerCode || candidate.supplierNpwp);
      const candidateName = normalizedMatchText(candidate.customerName || candidate.supplierName);
      if (customerCode && candidateCode && customerCode !== candidateCode) return false;
      if (!customerCode && customerName && candidateName && customerName !== candidateName) return false;
      const candidateInvoice = normalizedMatchText(candidate.invoiceNo);
      if (invoiceNo && candidateInvoice && invoiceNo !== candidateInvoice) return false;
      return true;
    });
  }

  function convertedQuantityForProforma(entry) {
    return finalSalesEntriesForProforma(entry).reduce(function (sum, candidate) {
      return sum + conversionQuantity(candidate);
    }, 0);
  }

  function remainingQuantityForProforma(entry) {
    const required = conversionQuantity(entry);
    if (required <= 0) return 0;
    return Math.max(0, required - convertedQuantityForProforma(entry));
  }

  function proformaConversionInfo(entries) {
    const lines = (Array.isArray(entries) ? entries : [entries]).filter(isProformaEntry);
    const summary = lines.reduce(function (result, entry) {
      const required = conversionQuantity(entry);
      const converted = Math.min(required, convertedQuantityForProforma(entry));
      result.required += required;
      result.converted += converted;
      result.remaining += Math.max(0, required - converted);
      return result;
    }, { required: 0, converted: 0, remaining: 0 });
    summary.isComplete = Boolean(summary.required > 0 && summary.remaining <= 0.0001);
    summary.hasProgress = Boolean(summary.converted > 0.0001);
    return summary;
  }

  function finalSalesEntriesForProformaGroup(entries) {
    const seen = new Set();
    return (Array.isArray(entries) ? entries : [entries])
      .filter(isProformaEntry)
      .flatMap(finalSalesEntriesForProforma)
      .filter(function (entry) {
        const id = text(entry && entry.id);
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
  }

  function escapeHtml(value) {
    return text(value).replace(/[&<>"']/g, function (char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char] || char;
    });
  }

  function newTransactionGroupId() {
    return window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : 'hti-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function setAlert(message, kind) {
    if (!elements.alert) return;
    if (alertTimer) window.clearTimeout(alertTimer);
    elements.alert.hidden = !message;
    elements.alert.textContent = message || '';
    elements.alert.className = 'portal-alert' + (kind ? ' ' + kind : '');
    if (message && kind !== 'error') {
      const expected = message;
      alertTimer = window.setTimeout(function () {
        if (elements.alert.textContent === expected) {
          elements.alert.hidden = true;
          elements.alert.textContent = '';
        }
      }, 4500);
    }
  }

  function clearNode(element) {
    while (element && element.firstChild) element.removeChild(element.firstChild);
  }

  function parseAmount(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value).trim();
    if (!raw) return 0;
    const normalized = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  }

  function roundRupiah(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? Math.round(amount) : 0;
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return 'Rp' + moneyFormatter.format(Number.isFinite(amount) ? amount : 0);
  }

  function formatInputMoney(value) {
    const amount = parseAmount(value);
    return amount ? moneyFormatter.format(amount) : '';
  }

  function formatQuantity(value) {
    const amount = parseAmount(value);
    return amount ? quantityFormatter.format(amount) : '';
  }

  function formatMoneyTyping(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const amount = parseAmount(raw);
    if (!amount && /^0+$/.test(raw.replace(/\D/g, ''))) return '0';
    return amount ? moneyFormatter.format(amount) : '';
  }

  function formatQuantityTyping(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const amount = parseAmount(raw);
    if (!amount && /^0+$/.test(raw.replace(/\D/g, ''))) return '0';
    return amount ? quantityFormatter.format(amount) : '';
  }

  function setCaretToEnd(input) {
    try {
      input.setSelectionRange(input.value.length, input.value.length);
    } catch {
      // Some input modes do not expose a text selection API.
    }
  }

  function formatTypingValue(input, formatter) {
    if (!input || !input.value) return;
    const formatted = formatter(input.value);
    if (input.value !== formatted) {
      input.value = formatted;
      setCaretToEnd(input);
    }
  }

  function pad2(value) {
    return String(Number(value || 0)).padStart(2, '0');
  }

  function fullYear(value) {
    const year = Number(value || 0);
    if (!Number.isFinite(year)) return 0;
    return year < 100 ? 2000 + year : year;
  }

  function validDateParts(day, month, year) {
    return year >= 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
  }

  function formatDate(value) {
    const raw = text(value);
    if (!raw || raw === '-') return raw;
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(raw);
    if (iso) return pad2(iso[3]) + '/' + pad2(iso[2]) + '/' + iso[1];

    const digits = raw.replace(/\D/g, '');
    if (/^\d{6}$/.test(digits) || /^\d{8}$/.test(digits)) {
      const day = Number(digits.slice(0, 2));
      const month = Number(digits.slice(2, 4));
      const year = fullYear(digits.slice(4));
      if (validDateParts(day, month, year)) return pad2(day) + '/' + pad2(month) + '/' + year;
    }

    const slash = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/.exec(raw);
    if (slash) {
      const first = Number(slash[1]);
      const second = Number(slash[2]);
      const year = fullYear(slash[3]);
      let day = first;
      let month = second;
      if (second > 12 && first <= 12) {
        day = second;
        month = first;
      }
      if (validDateParts(day, month, year)) return pad2(day) + '/' + pad2(month) + '/' + year;
    }

    return raw;
  }

  function formatDateTyping(value) {
    const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
  }

  function formattedDateToIso(value) {
    const formatted = formatDate(value);
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatted);
    if (!match) return '';
    return match[3] + '-' + match[2] + '-' + match[1];
  }

  function dateControls() {
    return [
      [elements.fakturDate, elements.fakturDatePicker],
      [elements.invoiceDate, elements.invoiceDatePicker],
      [elements.quickPaymentDate, elements.quickPaymentDatePicker]
    ].filter(function (pair) { return pair[0] && pair[1]; });
  }

  function syncDatePicker(input, picker) {
    if (!input || !picker) return;
    picker.value = formattedDateToIso(input.value);
  }

  function syncAllDatePickers() {
    dateControls().forEach(function (pair) {
      syncDatePicker(pair[0], pair[1]);
    });
  }

  function entryMainDate(entry) {
    return formatDate(entry.fakturDate || entry.fakturDateText || entry.invoiceDate || entry.invoiceDateText || entry.paymentDate || entry.createdAt || '-');
  }

  function normalizeDateInput(input, picker) {
    if (!input) return;
    const formatted = formatDate(input.value);
    if (formatted) input.value = formatted;
    syncDatePicker(input, picker);
  }

  function normalizeAllDateInputs() {
    dateControls().forEach(function (pair) {
      normalizeDateInput(pair[0], pair[1]);
    });
    applyInvoiceFakturDateDefaults();
  }

  function syncInvoiceFakturDateDefault(sourceInput) {
    const invoiceInput = elements.invoiceDate;
    const fakturInput = elements.fakturDate;
    if (!invoiceInput || !fakturInput || !sourceInput) return;
    if (sourceInput !== invoiceInput && sourceInput !== fakturInput) return;
    const targetInput = sourceInput === invoiceInput ? fakturInput : invoiceInput;
    const targetPicker = sourceInput === invoiceInput ? elements.fakturDatePicker : elements.invoiceDatePicker;
    const sourceName = sourceInput === invoiceInput ? 'invoice' : 'faktur';
    const sourceValue = text(sourceInput.value);
    delete sourceInput.dataset.htiSyncedFrom;
    if (!sourceValue) {
      if (targetInput.dataset.htiSyncedFrom === sourceName) {
        targetInput.value = '';
        delete targetInput.dataset.htiSyncedFrom;
        syncDatePicker(targetInput, targetPicker);
      }
      return;
    }
    if (text(targetInput.value) && targetInput.dataset.htiSyncedFrom !== sourceName) return;
    targetInput.value = sourceValue;
    targetInput.dataset.htiSyncedFrom = sourceName;
    syncDatePicker(targetInput, targetPicker);
  }

  function applyInvoiceFakturDateDefaults() {
    if (!elements.invoiceDate || !elements.fakturDate) return;
    const invoiceDate = text(elements.invoiceDate.value);
    const fakturDate = text(elements.fakturDate.value);
    if (invoiceDate && !fakturDate) {
      elements.fakturDate.value = invoiceDate;
      elements.fakturDate.dataset.htiSyncedFrom = 'invoice';
      syncDatePicker(elements.fakturDate, elements.fakturDatePicker);
    } else if (fakturDate && !invoiceDate) {
      elements.invoiceDate.value = fakturDate;
      elements.invoiceDate.dataset.htiSyncedFrom = 'faktur';
      syncDatePicker(elements.invoiceDate, elements.invoiceDatePicker);
    }
  }

  function applyNativeDatePicker(input, picker) {
    if (!input || !picker || !picker.value) return;
    input.value = formatDate(picker.value);
  }

  function bindDateControl(input, picker) {
    if (!input || !picker) return;
    input.addEventListener('input', function () {
      const formatted = formatDateTyping(input.value);
      if (input.value !== formatted) {
        input.value = formatted;
        input.setSelectionRange(input.value.length, input.value.length);
      }
      syncDatePicker(input, picker);
      syncInvoiceFakturDateDefault(input);
    });
    input.addEventListener('blur', function () {
      normalizeDateInput(input, picker);
      syncInvoiceFakturDateDefault(input);
    });
    input.addEventListener('change', function () {
      normalizeDateInput(input, picker);
      syncInvoiceFakturDateDefault(input);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      normalizeDateInput(input, picker);
      syncInvoiceFakturDateDefault(input);
    });
    picker.addEventListener('change', function () {
      applyNativeDatePicker(input, picker);
      normalizeDateInput(input, picker);
      syncInvoiceFakturDateDefault(input);
      input.focus();
    });
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/pt-x-buku-penjualan/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/pt-x-buku-penjualan';
  }

  function openAdvanceInput() {
    const clientId = clientIdFromPath();
    if (!clientId) return;
    window.location.assign('/app/client/clients/' + encodeURIComponent(clientId) + '/buku-bank?openAdvance=1&advanceType=sales&entryDoor=hti-buku-penjualan');
  }

  function clearInitialModeQuery() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch {
      // Query cleanup is only for display.
    }
  }

  function isEntryModalOpen() {
    return Boolean(elements.modal && !elements.modal.hidden);
  }

  function applyInitialModeFromQuery() {
    if (state.initialModeApplied) return;
    const params = new URLSearchParams(window.location.search);
    const mode = text(params.get('mode')).toLowerCase();
    if (!mode || params.get('openPayment') || params.get('fromProject') === '1' || params.get('fromControlSales') === '1') return;
    state.initialModeApplied = true;
    clearInitialModeQuery();
    if (mode === 'uang-muka' || mode === 'uang-muka-penjualan' || mode === 'advance') {
      openAdvanceInput();
      return;
    }
    if (mode === 'daftar-penjualan' || mode === 'daftar' || mode === 'list') return;
    if (isEntryModalOpen()) return;
    openNewModal();
    if (mode === 'proforma' || mode === 'input-proforma') {
      if (elements.documentType) elements.documentType.value = 'proforma';
      syncDocumentTypeUi();
      setText(elements.modalTitle, 'Input Pre Order');
      setText(elements.modalMeta, 'Pre Order belum menjadi faktur final. Jika ada pelunasan di rincian, sistem mencatatnya sebagai uang muka.');
      return;
    }
    if (mode === 'faktur-penjualan' || mode === 'input-faktur' || mode === 'faktur') {
      if (elements.documentType) elements.documentType.value = 'faktur';
      syncDocumentTypeUi();
      setText(elements.modalTitle, 'Input Faktur Penjualan');
      setText(elements.modalMeta, 'Faktur final akan masuk penjualan, piutang, kontrol, dan laporan.');
    }
  }

  async function requestJson(url, options) {
    const response = await fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    }, options || {}));
    if (response.status === 401) {
      window.location.assign('/app/client/login?expired=' + Date.now());
      return null;
    }
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok || !data.ok) throw new Error(data.error || 'Buku Penjualan belum bisa dimuat.');
    return data;
  }

  async function loadBook() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      if (!data) return;
      applyBookData(data);
      renderShell(data);
      applyPaymentOpenFromQuery();
      applyEntryOpenFromQuery();
      applyInitialModeFromQuery();
    } catch (err) {
      setAlert(err.message || 'Buku Penjualan belum bisa dimuat.', 'error');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
    }
  }

  function applyBookData(data) {
    state.client = data.client || state.client;
    state.entries = Array.isArray(data.entries) ? data.entries : [];
    state.projects = Array.isArray(data.projects) ? data.projects : [];
    state.projectOptions = Array.isArray(data.projectOptions) ? data.projectOptions : [];
    state.paymentSources = Array.isArray(data.paymentSources) ? data.paymentSources : [];
    state.suppliers = Array.isArray(data.suppliers) ? data.suppliers : [];
    state.advanceBalances = Array.isArray(data.advanceBalances) ? data.advanceBalances : [];
    renderClient();
    renderPaymentSourceOptions();
    renderSupplierOptions();
    renderProjectOptions();
    renderAdvanceBalanceFromForm();
    renderProjectFilter();
    renderRows();
    applyProjectPrefillFromQuery();
    if (state.viewEntry) {
      const fresh = findEntry(state.viewEntry.id);
      if (fresh) {
        state.viewEntry = fresh;
        state.viewEntries = entriesForView(fresh);
        renderView(fresh, state.viewEntries);
      }
    }
  }

  function clearPaymentOpenQuery() {
    const url = new URL(window.location.href);
    ['openPayment', 'paymentMode', 'fromMutation', 'paymentRow', 'paymentDate', 'paymentAmount', 'paymentSource', 'paymentSourceKey'].forEach(function (key) {
      url.searchParams.delete(key);
    });
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }

  function clearEntryOpenQuery() {
    const url = new URL(window.location.href);
    ['openEntry', 'fromControl'].forEach(function (key) {
      url.searchParams.delete(key);
    });
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }

  function applyEntryOpenFromQuery() {
    if (state.entryOpenApplied) return;
    const params = new URLSearchParams(window.location.search);
    const entryId = text(params.get('openEntry'));
    if (!entryId) return;
    state.entryOpenApplied = true;
    clearEntryOpenQuery();
    const entry = findEntry(entryId);
    if (!entry) {
      setAlert('Transaksi penjualan tidak ditemukan. Refresh Buku Penjualan lalu coba lagi.', 'error');
      return;
    }
    openViewModal(entry);
  }

  function normalizePaymentLookupText(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function paymentRowIndexFromQuery(entry, params) {
    const rows = Array.isArray(entry && entry.paymentRows) ? entry.paymentRows : [];
    if (!rows.length) return -1;
    const lookupAmount = roundRupiah(parseAmount(params.get('paymentAmount')));
    const lookupDate = formatDate(params.get('paymentDate'));
    const lookupSource = normalizePaymentLookupText(params.get('paymentSource'));
    const lookupSourceKey = normalizePaymentLookupText(params.get('paymentSourceKey'));
    if (!lookupAmount && !lookupDate && !lookupSource && !lookupSourceKey) return -1;
    return rows.findIndex(function (row) {
      const rowAmount = roundRupiah(parseAmount(row && (row.paymentAmount ?? row.payment_amount)));
      const rowDate = formatDate(row && (row.paymentDate || row.payment_date));
      const rowSource = normalizePaymentLookupText(row && (row.paymentSource || row.payment_source));
      const rowSourceKey = normalizePaymentLookupText(row && (row.paymentSourceKey || row.payment_source_key));
      if (lookupAmount && rowAmount !== lookupAmount) return false;
      if (lookupDate && rowDate && rowDate !== lookupDate) return false;
      if (lookupSourceKey && rowSourceKey && rowSourceKey !== lookupSourceKey) return false;
      if (lookupSource && rowSource && !rowSource.includes(lookupSource) && !lookupSource.includes(rowSource)) return false;
      return true;
    });
  }

  function applyPaymentOpenFromQuery() {
    if (state.sourcePaymentOpenApplied) return;
    const params = new URLSearchParams(window.location.search);
    const entryId = text(params.get('openPayment'));
    const explicitPaymentRowIndex = Number.parseInt(text(params.get('paymentRow')), 10);
    if (!entryId) return;
    state.sourcePaymentOpenApplied = true;
    clearPaymentOpenQuery();
    const entry = findEntry(entryId);
    if (!entry) {
      setAlert('Transaksi sumber pembayaran tidak ditemukan. Refresh Buku Bank/Kas lalu coba lagi.', 'error');
      notifyEmbeddedPaymentClosed(false);
      return;
    }
    const paymentRowIndex = Number.isInteger(explicitPaymentRowIndex) && explicitPaymentRowIndex >= 0
      ? explicitPaymentRowIndex
      : paymentRowIndexFromQuery(entry, params);
    state.sourcePaymentRowIndex = Number.isInteger(paymentRowIndex) && paymentRowIndex >= 0 ? paymentRowIndex : -1;
    const editExistingPayment = params.get('paymentMode') === 'edit' && hasEntryPayments(entry);
    openPaymentModal(entry, { editExisting: editExistingPayment });
    if (editExistingPayment) {
      window.setTimeout(enablePaymentEditMode, 0);
    }
  }

  function renderShell(data) {
    const user = data.user || {};
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    elements.adminOnly.forEach(function (item) { item.hidden = !user.isAdmin; });
  }

  function renderClient() {
    const client = state.client || {};
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.subtitle, text(client.name, 'PT X') + ' | Penjualan dan piutang per proyek');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function renderProjectFilter() {
    const previous = text(elements.projectFilter.value);
    clearNode(elements.projectFilter);
    addOption(elements.projectFilter, '', 'Semua proyek');
    addOption(elements.projectFilter, '__missing__', 'Belum ada nomor proyek');
    state.projects.filter(function (project) { return project.projectNo; }).forEach(function (project) {
      addOption(elements.projectFilter, project.projectNo, project.projectNo + ' (' + project.entryCount + ')');
    });
    elements.projectFilter.value = Array.from(elements.projectFilter.options).some(function (option) {
      return option.value === previous;
    }) ? previous : '';
  }

  function renderProjectOptions(extraProjectNos) {
    if (!elements.projectOptions) return;
    const values = new Map();
    state.projectOptions.forEach(function (project) {
      if (!project || !text(project.projectNo)) return;
      values.set(text(project.projectNo), text(project.label || project.projectNo));
    });
    state.projects.forEach(function (project) {
      if (!project || !text(project.projectNo) || values.has(text(project.projectNo))) return;
      values.set(text(project.projectNo), text(project.label || project.projectNo));
    });
    state.entries.filter(function (entry) {
      return isProformaEntry(entry) && !proformaConversionInfo(entriesForView(entry)).isComplete;
    }).forEach(function (entry) {
      const projectNo = text(entry.projectNo);
      if (!projectNo || values.has(projectNo)) return;
      values.set(projectNo, [projectNo, 'Pre Order', entry.customerName || entry.supplierName].filter(Boolean).join(' | '));
    });
    (extraProjectNos || []).forEach(function (projectNo) {
      if (text(projectNo) && !values.has(text(projectNo))) values.set(text(projectNo), text(projectNo));
    });
    clearNode(elements.projectOptions);
    Array.from(values.entries()).sort(function (left, right) {
      return left[0].localeCompare(right[0], 'id', { numeric: true, sensitivity: 'base' });
    }).forEach(function (item) {
      const option = document.createElement('option');
      option.value = item[0];
      option.label = item[1];
      elements.projectOptions.appendChild(option);
    });
  }

  function proformaEntriesForProject(projectNo) {
    const cleanProjectNo = text(projectNo);
    if (!cleanProjectNo) return [];
    return state.entries.filter(function (entry) {
      return isProformaEntry(entry)
        && text(entry.projectNo) === cleanProjectNo
        && remainingQuantityForProforma(entry) > 0;
    }).sort(function (left, right) {
      const leftTime = Date.parse(left.createdAt || left.updatedAt || '') || 0;
      const rightTime = Date.parse(right.createdAt || right.updatedAt || '') || 0;
      if (leftTime !== rightTime) return leftTime - rightTime;
      return text(left.id).localeCompare(text(right.id));
    });
  }

  function canCallProformaFromProject() {
    return !state.editingEntry && !isFormProforma();
  }

  function lineFromProformaForFaktur(entry) {
    const line = lineFromEntry(entry);
    const converted = convertedQuantityForProforma(entry);
    const remaining = remainingQuantityForProforma(entry);
    delete line.entryId;
    line.documentsUploaded = false;
    line.sourceProformaId = entry.id;
    if (remaining > 0) line.quantity = remaining;
    if (converted > 0.0001) {
      line.paymentAmount = 0;
      line.paymentSource = '';
      line.paymentRows = [];
    }
    return line;
  }

  function fillSalesFormFromProformaEntries(entries, projectNo) {
    const proformaEntries = (Array.isArray(entries) ? entries : [])
      .filter(isProformaEntry)
      .filter(function (entry) { return remainingQuantityForProforma(entry) > 0; });
    if (!proformaEntries.length) return false;
    const firstEntry = proformaEntries[0];
    const cleanProjectNo = text(projectNo) || text(firstEntry.projectNo);
    state.editingEntry = null;
    state.editingEntries = [];
    state.transactionGroupId = newTransactionGroupId();
    elements.entryId.value = '';
    if (elements.documentType) elements.documentType.value = 'faktur';
    elements.supplierNpwp.value = customerCodeForEntry(firstEntry);
    elements.supplierName.value = firstEntry.customerName || firstEntry.supplierName || '';
    if (!elements.supplierNpwp.value && elements.supplierName.value) syncSupplier('name');
    if (elements.customerNpwp) elements.customerNpwp.value = firstEntry.customerNpwp || '';
    if (elements.customerAddress) elements.customerAddress.value = firstEntry.customerAddress || '';
    elements.invoiceNo.value = firstEntry.invoiceNo || '';
    elements.invoiceDate.value = formatDate(firstEntry.invoiceDate || firstEntry.invoiceDateText || '');
    elements.fakturNo.value = firstEntry.fakturNo || '';
    elements.fakturDate.value = formatDate(firstEntry.fakturDate || firstEntry.fakturDateText || '');
    if (elements.fpPurchaseNo) elements.fpPurchaseNo.value = firstEntry.fpPurchaseNo || '';
    if (elements.notesInput) elements.notesInput.value = firstEntry.notes || '';
    renderAdvanceBalanceFromForm();
    syncAllDatePickers();
    clearNode(elements.entryLines);
    renderProjectOptions(cleanProjectNo ? [cleanProjectNo] : []);
    proformaEntries.forEach(function (entry) { appendLine(lineFromProformaForFaktur(entry)); });
    syncDocumentTypeUi();
    setText(elements.modalTitle, 'Input Penjualan dari Pre Order');
    setText(elements.modalMeta, 'Data Pre Order dipanggil ke faktur baru. DP Pre Order yang sudah tercatat akan dipakai sebagai uang muka saat disimpan.');
    setAlert('Pre Order proyek ' + text(cleanProjectNo, '-') + ' dipanggil ke form penjualan.', 'success');
    return true;
  }

  function callProformaFromProject(projectNo) {
    if (!canCallProformaFromProject()) return false;
    return fillSalesFormFromProformaEntries(proformaEntriesForProject(projectNo), projectNo);
  }

  function openSalesInputFromProformaEntry(entry) {
    const source = findEntry(entry && entry.id) || entry;
    if (!source || !isProformaEntry(source)) return false;
    const entries = entriesForView(source).filter(isProformaEntry);
    const conversion = proformaConversionInfo(entries);
    if (conversion.isComplete) {
      setAlert('Pre Order ini sudah dibuat menjadi penjualan untuk seluruh qty. Data hanya bisa dilihat sebagai arsip.', 'error');
      return false;
    }
    openNewModal();
    if (!fillSalesFormFromProformaEntries(entries, source.projectNo)) {
      setAlert('Tidak ada sisa qty Pre Order yang bisa ditarik ke penjualan.', 'error');
      return false;
    }
    return true;
  }

  function addOption(select, value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  function paymentSourceList() {
    return state.paymentSources.length
      ? state.paymentSources
      : PTX_PAYMENT_SOURCE_LABELS.map(function (label) { return { label: label }; });
  }

  function paymentSourceLabel(source) {
    return text(source && (source.label || source.sourceAccountName || source.key));
  }

  function advancesForParty(partyCode, partyName) {
    const code = text(partyCode).toLowerCase();
    const name = text(partyName).toLowerCase();
    return state.advanceBalances.filter(function (advance) {
      if (advance.advanceType !== 'sales' || Number(advance.availableAmount || 0) <= 0.5) return false;
      const advanceCode = text(advance.partyCode).toLowerCase();
      const advanceName = text(advance.partyName).toLowerCase();
      return (code && advanceCode === code) || (name && advanceName === name);
    });
  }

  function advancesForEntry(entry) {
    return advancesForParty(entry?.customerCode || entry?.supplierNpwp, entry?.customerName || entry?.supplierName);
  }

  function advanceTotalForEntry(entry) {
    return advancesForEntry(entry).reduce(function (sum, advance) {
      return sum + Number(advance.availableAmount || 0);
    }, 0);
  }

  function advanceTotalForInvoice(entry) {
    const advances = advancesForEntry(entry);
    const projectNo = text(entry && entry.projectNo);
    const projectAdvances = projectNo
      ? advances.filter(function (advance) { return text(advance.projectNo) === projectNo; })
      : [];
    const source = projectAdvances.length ? projectAdvances : advances;
    return source.reduce(function (sum, advance) {
      return sum + Number(advance.availableAmount || 0);
    }, 0);
  }

  function isAdvancePaymentRow(row) {
    return Boolean(row && (
      text(row.advanceId)
      || text(row.paymentSourceType).toLowerCase() === 'advance'
      || /^advance:/i.test(text(row.paymentSource))
      || /^hti-advance:/i.test(text(row.paymentSource))
    ));
  }

  function paymentBreakdown(entry) {
    const rows = Array.isArray(entry?.paymentRows) ? entry.paymentRows : [];
    return rows.reduce(function (summary, row) {
      const amount = Number(row.paymentAmount || 0);
      if (amount <= 0) return summary;
      summary.total += amount;
      summary.latestDate = row.paymentDate || summary.latestDate;
      summary.latestNotes = row.paymentNotes || summary.latestNotes;
      if (isAdvancePaymentRow(row)) {
        summary.advance += amount;
        return summary;
      }
      summary.cash += amount;
      if (row.paymentSource && !summary.cashSources.includes(row.paymentSource)) summary.cashSources.push(row.paymentSource);
      return summary;
    }, { total: 0, advance: 0, cash: 0, cashSources: [], latestDate: '', latestNotes: '' });
  }

  function normalizedPartyValue(value) {
    return text(value).toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function paymentPartyKeys(entry) {
    return [
      normalizedPartyValue(entry?.customerCode || entry?.supplierNpwp),
      normalizedPartyValue(entry?.customerName || entry?.supplierName)
    ].filter(Boolean);
  }

  function samePaymentParty(left, right) {
    const leftKeys = paymentPartyKeys(left);
    const rightKeys = paymentPartyKeys(right);
    return leftKeys.some(function (key) { return rightKeys.includes(key); });
  }

  function paymentTargetsForEntry(entry) {
    if (!entry) return [];
    if (isEntryPaid(entry)) return [entry];
    const seen = new Set();
    const targets = [];
    state.entries.forEach(function (item) {
      if (!item || Number(item.totalAmount || 0) <= 0) return;
      if (isProformaEntry(item)) return;
      if (Number(item.outstanding || 0) <= 0.5) return;
      if (!samePaymentParty(entry, item)) return;
      const id = text(item.id);
      if (!id || seen.has(id)) return;
      seen.add(id);
      targets.push(item);
    });
    targets.sort(function (left, right) {
      if (text(left.id) === text(entry.id)) return -1;
      if (text(right.id) === text(entry.id)) return 1;
      return text(left.projectNo).localeCompare(text(right.projectNo), 'id', { numeric: true });
    });
    return targets.length ? targets : [entry];
  }

  function paymentTargetsTotal(targets) {
    return (Array.isArray(targets) ? targets : []).reduce(function (sum, item) {
      return sum + Number(item.outstanding || 0);
    }, 0);
  }

  function allPaymentTarget() {
    return {
      id: '__all__',
      isAll: true,
      supplierName: 'Semua transaksi customer',
      outstanding: paymentTargetsTotal(state.paymentTargets),
      totalAmount: paymentTargetsTotal(state.paymentTargets)
    };
  }

  function paymentTargetLabel(entry) {
    return (entry.projectNo ? 'Proyek ' + entry.projectNo + ' | ' : '') +
      text(entry.itemName, 'Transaksi') + ' | Sisa ' + formatCurrency(entry.outstanding);
  }

  function paymentTargetMinDateIso(target) {
    const targets = target && target.isAll ? state.paymentTargets : [target];
    return targets.reduce(function (latest, item) {
      const iso = formattedDateToIso(item && (item.invoiceDate || item.invoiceDateText));
      return iso && iso > latest ? iso : latest;
    }, '');
  }

  function renderQuickPaymentEntryOptions(entry) {
    if (!elements.quickPaymentEntry) return;
    clearNode(elements.quickPaymentEntry);
    state.paymentTargets = paymentTargetsForEntry(entry);
    const paid = isEntryPaid(entry);
    if (!paid && state.paymentTargets.length > 1) {
      addOption(elements.quickPaymentEntry, '__all__', 'Semua | Total sisa ' + formatCurrency(paymentTargetsTotal(state.paymentTargets)));
    }
    state.paymentTargets.forEach(function (target) {
      addOption(elements.quickPaymentEntry, target.id, paymentTargetLabel(target));
    });
    elements.quickPaymentEntry.value = text(entry && entry.id);
    elements.quickPaymentEntry.disabled = paid || state.paymentTargets.length <= 1;
  }

  function syncQuickPaymentEntryFields() {
    if (!elements.quickPaymentEntry) return;
    const key = text(elements.quickPaymentEntry.value);
    const selected = key === '__all__'
      ? allPaymentTarget()
      : state.paymentTargets.find(function (target) { return text(target.id) === key; }) || state.paymentTargets[0] || state.paymentEntry;
    if (!selected) return;
    state.paymentTarget = selected;
    state.paymentEntry = selected;
    const isAll = Boolean(selected.isAll);
    const paid = !isAll && isEntryPaid(selected);
    const breakdown = isAll ? { cash: 0, advance: 0, cashSources: [], latestDate: '', latestNotes: '' } : paymentBreakdown(selected);
    const availableAdvances = isAll ? [] : advancesForEntry(selected);
    const availableAdvanceTotal = isAll ? 0 : advanceTotalForEntry(selected);
    elements.paymentEntryId.value = isAll ? '__all__' : selected.id;
    elements.quickPaymentDatePicker.min = paymentTargetMinDateIso(selected);
    syncDatePicker(elements.quickPaymentDate, elements.quickPaymentDatePicker);
    if (elements.quickPaymentAdvanceAmount) {
      elements.quickPaymentAdvanceAmount.value = paid && breakdown.advance > 0 ? formatInputMoney(breakdown.advance) : '';
      elements.quickPaymentAdvanceAmount.disabled = isAll || (!paid && availableAdvanceTotal <= 0.5);
      elements.quickPaymentAdvanceAmount.readOnly = isAll || paid;
    }
    if (elements.quickPaymentUseAllAdvance) {
      elements.quickPaymentUseAllAdvance.checked = false;
      elements.quickPaymentUseAllAdvance.disabled = isAll || paid || availableAdvanceTotal <= 0.5;
    }
    elements.quickPaymentAmount.value = formatInputMoney(paid ? breakdown.cash : selected.outstanding);
    elements.quickPaymentSource.value = paid ? (breakdown.cashSources.join(' + ') || '') : '';
    elements.quickPaymentNotes.value = paid ? (breakdown.latestNotes || selected.paymentNotes || '') : '';
    if (elements.paymentModalTitle) setText(elements.paymentModalTitle, paid ? 'Detail Pembayaran' : 'Catat Pembayaran');
    setText(elements.paymentModalMeta, isAll
      ? 'Semua transaksi terbuka | ' + text(selected.supplierName, 'Customer')
      : ((selected.projectNo ? 'Proyek ' + selected.projectNo + ' | ' : '') + (selected.supplierName || 'Customer belum diisi') + (paid ? ' | Pembayaran sudah lunas' : '')));
    setText(elements.paymentOutstanding, formatCurrency(selected.outstanding));
    if (elements.paymentAdvanceAvailable) {
      setText(elements.paymentAdvanceAvailable, isAll
        ? 'Uang muka dipakai dari pembayaran satu transaksi, bukan opsi Semua.'
        : (paid && breakdown.advance > 0
          ? 'Uang muka dipakai: ' + formatCurrency(breakdown.advance)
          : (availableAdvanceTotal > 0.5 ? 'Tersedia ' + formatCurrency(availableAdvanceTotal) + '. Isi nominal jika ingin dipakai.' : 'Tidak ada uang muka tersedia.')));
    }
    if (elements.paymentAdvanceHint) {
      elements.paymentAdvanceHint.hidden = isAll || (paid ? breakdown.advance <= 0.5 : !availableAdvances.length);
      elements.paymentAdvanceHint.textContent = availableAdvances.length
        ? 'Uang muka dipakai dari saldo customer ini. Sumber Bank/Kas hanya untuk sisa yang benar-benar dibayar lewat bank atau kas.'
        : (paid && breakdown.advance > 0 ? 'Pembayaran ini memakai uang muka.' : '');
    }
    setPaymentFieldsReadOnly(paid);
    if (elements.quickPaymentAdvanceAmount) {
      elements.quickPaymentAdvanceAmount.disabled = isAll || (!paid && availableAdvanceTotal <= 0.5);
      elements.quickPaymentAdvanceAmount.readOnly = isAll || paid;
    }
    if (elements.quickPaymentUseAllAdvance) {
      elements.quickPaymentUseAllAdvance.disabled = isAll || paid || availableAdvanceTotal <= 0.5;
    }
    if (elements.quickPaymentEntry) elements.quickPaymentEntry.disabled = paid || state.paymentTargets.length <= 1;
    if (!paid) syncPaymentSplit({ adjustCash: true });
    if (elements.paymentEditButton) elements.paymentEditButton.hidden = isAll || !paid || state.paymentEditingExisting;
    elements.paymentReverseButton.hidden = isAll || !paid || state.paymentEditingExisting;
    elements.paymentSaveButton.hidden = paid && !state.paymentEditingExisting;
    elements.paymentSaveButton.textContent = state.paymentEditingExisting ? 'Simpan Perubahan' : 'Simpan Pembayaran';
  }

  function buildAdvancePaymentRows(entry, amount, paymentDate, notes) {
    let remaining = Math.max(0, Number(amount || 0));
    const rows = [];
    advancesForEntry(entry).forEach(function (advance) {
      if (remaining <= 0.5) return;
      const used = Math.min(remaining, Number(advance.availableAmount || 0));
      if (used <= 0.5) return;
      rows.push({
        paymentDate,
        paymentAmount: used,
        paymentSource: 'advance:' + advance.id,
        paymentSourceType: 'advance',
        paymentSourceKey: advance.id,
        advanceId: advance.id,
        advanceType: 'sales',
        paymentNotes: notes
      });
      remaining = Math.max(0, remaining - used);
    });
    if (remaining > 0.5) throw new Error('Nominal uang muka melebihi saldo uang muka yang tersedia.');
    return rows;
  }

  function renderAdvanceBalanceFromForm() {
    if (!elements.advanceBalance) return;
    const matches = advancesForParty(elements.supplierNpwp?.value, elements.supplierName?.value);
    if (!matches.length) {
      elements.advanceBalance.hidden = true;
      return;
    }
    const total = matches.reduce(function (sum, advance) { return sum + Number(advance.availableAmount || 0); }, 0);
    elements.advanceBalance.hidden = false;
    setText(elements.advanceBalanceValue, formatCurrency(total));
    setText(elements.advanceBalanceMeta, matches.length + ' uang muka tersedia');
  }

  function renderPaymentSourceOptions(entry) {
    if (!elements.paymentSourceOptions) return;
    clearNode(elements.paymentSourceOptions);
    paymentSourceList().forEach(function (source) {
      const label = paymentSourceLabel(source);
      if (!label) return;
      const option = document.createElement('option');
      option.value = label;
      elements.paymentSourceOptions.appendChild(option);
    });
  }

  function cleanSupplierCode(value) {
    return text(value).replace(/^"+/, '').trim();
  }

  function cleanSupplierName(value) {
    return text(value).replace(/^"+/, '').trim();
  }

  function supplierOptions() {
    const map = new Map();
    function add(code, name, npwp, address) {
      const cleanCode = cleanSupplierCode(code);
      const cleanName = cleanSupplierName(name);
      const cleanNpwp = cleanSupplierCode(npwp);
      const cleanAddress = text(address);
      if (!cleanCode && !cleanName) return;
      const key = (cleanCode || cleanName).toLowerCase();
      if (!map.has(key)) {
        map.set(key, { code: cleanCode, name: cleanName || cleanCode, npwp: cleanNpwp, address: cleanAddress });
        return;
      }
      const item = map.get(key);
      if (cleanCode && !item.code) item.code = cleanCode;
      if (cleanNpwp && !item.npwp) item.npwp = cleanNpwp;
      if (cleanAddress && !item.address) item.address = cleanAddress;
      if (cleanName && (!item.name || item.name === item.code)) item.name = cleanName;
    }
    state.suppliers.forEach(function (supplier) { add(supplier.code, supplier.name, supplier.npwp, supplier.address); });
    state.entries.forEach(function (entry) { add(entry.customerCode || entry.supplierNpwp, entry.supplierName, entry.customerNpwp, entry.customerAddress); });
    return Array.from(map.values()).sort(function (left, right) {
      return (left.name || left.code).localeCompare(right.name || right.code, 'id');
    });
  }

  function addSupplierOption(list, value, label) {
    if (!list || !value) return;
    const option = document.createElement('option');
    option.value = value;
    if (label && label !== value) option.label = label;
    list.appendChild(option);
  }

  function renderSupplierOptions() {
    clearNode(elements.supplierCodeOptions);
    clearNode(elements.supplierNameOptions);
    supplierOptions().forEach(function (supplier) {
      addSupplierOption(elements.supplierCodeOptions, supplier.code, supplier.name);
      addSupplierOption(elements.supplierNameOptions, supplier.name, supplier.code);
    });
  }

  function findSupplierByCode(code) {
    const clean = cleanSupplierCode(code).toLowerCase();
    if (!clean) return null;
    return supplierOptions().find(function (supplier) {
      return cleanSupplierCode(supplier.code).toLowerCase() === clean;
    }) || null;
  }

  function findSupplierByName(name) {
    const clean = cleanSupplierName(name).toLowerCase();
    if (!clean) return null;
    return supplierOptions().find(function (supplier) {
      return text(supplier.name).toLowerCase() === clean;
    }) || null;
  }

  function nextSupplierCode() {
    const used = new Set(supplierOptions().map(function (supplier) {
      return cleanSupplierCode(supplier.code).toUpperCase();
    }).filter(Boolean));
    for (let index = 1; index <= 999; index += 1) {
      const code = 'CUS-' + String(index).padStart(3, '0');
      if (!used.has(code)) return code;
    }
    return 'CUS-' + Date.now();
  }

  function customerCodeForEntry(entry) {
    const explicitCode = cleanSupplierCode(entry && (entry.customerCode || entry.supplierNpwp));
    if (explicitCode) return explicitCode;
    const customerName = cleanSupplierName(entry && (entry.customerName || entry.supplierName));
    const match = findSupplierByName(customerName);
    if (match && match.code) return match.code;
    return customerName ? nextSupplierCode() : '';
  }

  function syncSupplier(source) {
    if (!elements.supplierNpwp || !elements.supplierName) return;
    elements.supplierNpwp.value = cleanSupplierCode(elements.supplierNpwp.value);
    if (source === 'code') {
      const match = findSupplierByCode(elements.supplierNpwp.value);
      if (match) {
        elements.supplierName.value = match.name;
        if (elements.customerNpwp) elements.customerNpwp.value = match.npwp || '';
        if (elements.customerAddress) elements.customerAddress.value = match.address || '';
      }
      renderAdvanceBalanceFromForm();
      return;
    }
    const supplierName = text(elements.supplierName.value);
    const match = findSupplierByName(supplierName);
    if (match) {
      elements.supplierNpwp.value = match.code;
      if (elements.customerNpwp) elements.customerNpwp.value = match.npwp || '';
      if (elements.customerAddress) elements.customerAddress.value = match.address || '';
      renderAdvanceBalanceFromForm();
      return;
    }
    const currentCode = cleanSupplierCode(elements.supplierNpwp.value);
    const currentCodeMatch = findSupplierByCode(currentCode);
    const codeBelongsToAnotherSupplier = currentCodeMatch
      && cleanSupplierName(currentCodeMatch.name).toLowerCase() !== cleanSupplierName(supplierName).toLowerCase();
    if (cleanSupplierName(supplierName) && (!currentCode || codeBelongsToAnotherSupplier)) {
      elements.supplierNpwp.value = nextSupplierCode();
    }
    renderAdvanceBalanceFromForm();
  }

  function resetAdvanceBalance() {
    if (!elements.advanceBalance) return;
    elements.advanceBalance.hidden = true;
    setText(elements.advanceBalanceValue, 'Rp0');
    setText(elements.advanceBalanceMeta, '');
    [elements.supplierNpwp, elements.supplierName].forEach(function (input) {
      if (input) delete input.dataset.pickerPreviousValue;
    });
  }

  function bindSupplierPicker(input) {
    if (!input) return;
    input.addEventListener('focus', function () {
      if (input.value) input.select();
    });
    input.addEventListener('pointerdown', function () {
      if (input.value) {
        input.dataset.pickerPreviousValue = input.value;
        input.value = '';
      }
      if (typeof input.showPicker !== 'function') return;
      try { input.showPicker(); } catch {}
    });
    input.addEventListener('input', function () {
      if (input.value) delete input.dataset.pickerPreviousValue;
    });
    input.addEventListener('change', function () {
      delete input.dataset.pickerPreviousValue;
    });
    input.addEventListener('blur', function () {
      const previousValue = input.dataset.pickerPreviousValue;
      if (previousValue && !input.value) {
        input.value = previousValue;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      delete input.dataset.pickerPreviousValue;
    });
  }

  function sortTextValue(value) {
    return text(value).toLowerCase().replace(/\d+/g, function (part) {
      return part.padStart(12, '0');
    });
  }

  function sortDateValue(value) {
    const raw = text(value);
    if (!raw || raw === '-') return 0;
    let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) return Number(match[1] + match[2].padStart(2, '0') + match[3].padStart(2, '0'));
    match = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (match) {
      const year = match[3].length === 2 ? '20' + match[3] : match[3];
      return Number(year + match[2].padStart(2, '0') + match[1].padStart(2, '0'));
    }
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function entrySortValue(entry, key) {
    if (key === 'projectNo') return sortTextValue(entry.projectNo);
    if (key === 'date') return sortDateValue(entryMainDate(entry));
    if (key === 'customerName') return sortTextValue(entry.customerName || entry.supplierName);
    if (key === 'dpp') return Number(entry.dpp || 0);
    if (key === 'ppn') return Number(entry.ppn || 0);
    if (key === 'totalAmount') return Number(entry.totalAmount || 0);
    if (key === 'paymentAmount') return Number(entry.paymentAmount || 0);
    if (key === 'outstanding' || key === 'payAction') return Number(entry.outstanding || 0);
    if (key === 'documents') return (entry.documentsUploaded || entry.hasAttachment) ? 1 : 0;
    return sortTextValue(entry[key]);
  }

  function compareSortValues(left, right) {
    if (typeof left === 'number' && typeof right === 'number') return left - right;
    return String(left).localeCompare(String(right), 'id', { numeric: true, sensitivity: 'base' });
  }

  function sortedEntries(entries) {
    const sort = state.sort || {};
    if (!sort.key || !sort.direction) return entries;
    const multiplier = sort.direction === 'desc' ? -1 : 1;
    return entries.slice().sort(function (left, right) {
      const primary = compareSortValues(entrySortValue(left, sort.key), entrySortValue(right, sort.key));
      if (primary) return primary * multiplier;
      const projectCompare = compareSortValues(entrySortValue(left, 'projectNo'), entrySortValue(right, 'projectNo'));
      if (projectCompare) return projectCompare;
      const dateCompare = compareSortValues(entrySortValue(left, 'date'), entrySortValue(right, 'date'));
      if (dateCompare) return dateCompare;
      return text(left.id).localeCompare(text(right.id), 'id', { numeric: true, sensitivity: 'base' });
    });
  }

  function sortDefaultDirection(key) {
    return ['date', 'dpp', 'ppn', 'totalAmount', 'paymentAmount', 'outstanding', 'payAction', 'documents'].includes(key) ? 'desc' : 'asc';
  }

  function setTableSort(key) {
    if (!key) return;
    const current = state.sort || {};
    state.sort = current.key === key
      ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { key, direction: sortDefaultDirection(key) };
    renderRows();
  }

  function updateSortHeaders() {
    document.querySelectorAll('[data-hti-sort-key]').forEach(function (header) {
      const active = state.sort && state.sort.key === header.dataset.htiSortKey;
      header.classList.toggle('is-sorted-asc', Boolean(active && state.sort.direction === 'asc'));
      header.classList.toggle('is-sorted-desc', Boolean(active && state.sort.direction === 'desc'));
      header.setAttribute('aria-sort', active ? (state.sort.direction === 'asc' ? 'ascending' : 'descending') : 'none');
    });
  }

  function bindSortableHeaders() {
    document.querySelectorAll('[data-hti-sort-key]').forEach(function (header) {
      if (header.dataset.htiSortBound) return;
      header.dataset.htiSortBound = '1';
      header.classList.add('client-sortable-head');
      header.tabIndex = 0;
      header.title = 'Klik untuk urutkan data';
      header.addEventListener('click', function () {
        setTableSort(header.dataset.htiSortKey);
      });
      header.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        setTableSort(header.dataset.htiSortKey);
      });
    });
    updateSortHeaders();
  }

  function filteredEntries() {
    const project = text(elements.projectFilter.value);
    const status = text(elements.statusFilter.value);
    const documentType = text(elements.documentFilter && elements.documentFilter.value);
    const query = text(elements.searchInput.value).toLowerCase();
    const entries = state.entries.filter(function (entry) {
      if (project === '__missing__' && entry.projectNo) return false;
      if (project && project !== '__missing__' && entry.projectNo !== project) return false;
      if (documentType && documentTypeOf(entry) !== documentType) return false;
      if (status === 'incomplete' && !entry.isIncomplete) return false;
      if (status === 'unpaid' && entry.paymentStatus !== 'Belum bayar') return false;
      if (status === 'partial' && entry.paymentStatus !== 'Sebagian') return false;
      if (status === 'paid' && entry.paymentStatus !== 'Lunas') return false;
      if (!query) return true;
      const haystack = [
        entry.projectNo, entry.customerCode, entry.supplierNpwp, entry.supplierName, entry.customerNpwp, entry.customerName,
        entry.customerAddress, entry.itemName, entry.fpPurchaseNo, entry.fakturNo, entry.invoiceNo, entry.notes,
        entry.paymentSource, entry.attachmentName, documentTypeLabel(entry)
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });
    return sortedEntries(entries);
  }

  function renderRows() {
    updateSortHeaders();
    clearNode(elements.rows);
    const entries = filteredEntries();
    if (!entries.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 10;
      cell.className = 'hti-empty-cell';
      cell.textContent = state.entries.length ? 'Tidak ada data yang sesuai filter.' : 'Belum ada data penjualan.';
      row.appendChild(cell);
      elements.rows.appendChild(row);
      return;
    }
    entries.forEach(function (entry) {
      elements.rows.appendChild(entryRow(entry));
    });
  }

  function cell(value, className) {
    const element = document.createElement('td');
    if (className) element.className = className;
    element.textContent = text(value);
    return element;
  }

  function dateDocumentCell(entry) {
    const element = document.createElement('td');
    element.className = 'hti-date-cell hti-date-document-cell';
    const date = document.createElement('span');
    date.textContent = entryMainDate(entry);
    element.appendChild(date);
    if (isProformaEntry(entry)) {
      const badge = document.createElement('small');
      badge.className = 'hti-document-type-badge is-proforma';
      badge.textContent = 'Pre Order';
      element.appendChild(badge);
    }
    return element;
  }

  function entryRow(entry) {
    const row = document.createElement('tr');
    row.className = 'hti-clickable-row';
    row.tabIndex = 0;
    row.setAttribute('data-hti-row-id', entry.id);
    row.title = 'Klik untuk melihat detail';
    row.addEventListener('click', function () { openViewModal(entry); });
    row.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openViewModal(entry);
      }
    });

    const isProforma = isProformaEntry(entry);
    const proformaConversion = isProforma ? proformaConversionInfo(entriesForView(entry)) : { isComplete: false };
    row.appendChild(cell(entry.projectNo || '-', entry.projectNo ? 'hti-project-cell' : 'hti-project-cell missing'));
    row.appendChild(dateDocumentCell(entry));
    const supplierCell = cell(entry.supplierName || '-', 'hti-supplier-grid-cell');
    supplierCell.title = entry.supplierName || '';
    row.appendChild(supplierCell);
    row.appendChild(cell(formatCurrency(entry.dpp), 'number'));
    row.appendChild(cell(formatCurrency(entry.ppn), 'number'));
    row.appendChild(cell(formatCurrency(entry.totalAmount), 'number'));
    row.appendChild(cell(isProforma && !entry.paymentAmount ? '-' : formatCurrency(entry.paymentAmount), 'number'));
    row.appendChild(cell(isProforma ? '-' : formatCurrency(entry.outstanding), 'number hti-outstanding-cell'));

    const paymentCell = document.createElement('td');
    paymentCell.className = 'hti-payment-action-cell';
    const paymentButton = document.createElement('button');
    const isPaid = isEntryPaid(entry);
    paymentButton.type = 'button';
    paymentButton.className = 'hti-pay-button' + (isPaid ? ' is-paid' : '') + (isProforma ? ' is-proforma' : '');
    paymentButton.textContent = isProforma
      ? (proformaConversion.isComplete ? 'Sudah Faktur' : 'Input Penjualan')
      : (isPaid ? 'Lunas' : 'Bayar');
    paymentButton.disabled = isProforma ? false : entry.totalAmount <= 0;
    paymentButton.title = isProforma
      ? (proformaConversion.isComplete
        ? 'Klik untuk buka faktur final terkait'
        : 'Klik untuk input penjualan/faktur dari Pre Order ini')
      : entry.totalAmount <= 0
      ? 'Belum ada tagihan'
      : (isPaid ? 'Lihat atau batalkan pembayaran' : 'Catat pembayaran');
    paymentButton.addEventListener('click', function (event) {
      event.stopPropagation();
      if (isProforma) {
        if (proformaConversion.isComplete) {
          promptLockedProforma(entry);
          return;
        }
        openSalesInputFromProformaEntry(entry);
        return;
      }
      openPaymentModal(entry);
    });
    paymentCell.appendChild(paymentButton);
    row.appendChild(paymentCell);

    const documentCell = document.createElement('td');
    documentCell.className = 'hti-document-check-cell';
    const documentCheckbox = document.createElement('input');
    documentCheckbox.type = 'checkbox';
    documentCheckbox.checked = Boolean(entry.documentsUploaded || entry.hasAttachment);
    documentCheckbox.tabIndex = -1;
    documentCheckbox.setAttribute('aria-disabled', 'true');
    documentCheckbox.style.pointerEvents = 'none';
    documentCheckbox.setAttribute('aria-label', 'Status dokumen terupload');
    documentCell.appendChild(documentCheckbox);
    row.appendChild(documentCell);
    return row;
  }

  function isEntryPaid(entry) {
    return Boolean(entry && entry.totalAmount > 0 && entry.outstanding <= 0.5);
  }

  function hasEntryPayments(entry) {
    return Boolean(entry && (Number(entry.paymentAmount || 0) > 0.5
      || (Array.isArray(entry.paymentRows) && entry.paymentRows.some(function (row) {
        return Number(row && row.paymentAmount || 0) > 0.5;
      }))));
  }

  function findEntry(id) {
    const cleanId = text(id);
    return state.entries.find(function (entry) { return entry.id === cleanId; }) || null;
  }

  function syncModalBodyState() {
    const anyOpen = !elements.modal.hidden || !elements.viewModal.hidden || !elements.paymentModal.hidden || !elements.fileModal.hidden || !elements.invoiceModal.hidden || !elements.purchaseChoiceModal.hidden;
    document.body.classList.toggle('modal-open', anyOpen);
  }

  function entryModalElement() {
    return elements.modal?.querySelector('.hti-entry-modal') || null;
  }

  function resetEntryModalSize() {
    const modal = entryModalElement();
    if (!modal) return;
    modal.style.width = '';
    modal.style.height = '';
  }

  function changeEntryModalSize(direction) {
    const modal = entryModalElement();
    if (!modal) return;
    const viewportWidth = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 1024);
    const viewportHeight = Math.max(320, window.innerHeight || document.documentElement.clientHeight || 768);
    const rect = modal.getBoundingClientRect();
    const minWidth = Math.min(720, viewportWidth - 36);
    const maxWidth = Math.max(minWidth, viewportWidth - 36);
    const minHeight = Math.min(420, viewportHeight - 36);
    const maxHeight = Math.max(minHeight, viewportHeight - 36);
    const nextWidth = Math.min(maxWidth, Math.max(minWidth, Math.round(rect.width + direction * 96)));
    const nextHeight = Math.min(maxHeight, Math.max(minHeight, Math.round(rect.height + direction * 64)));
    modal.style.width = nextWidth + 'px';
    modal.style.height = nextHeight + 'px';
  }

  function showModal(show) {
    elements.modal.hidden = !show;
    syncModalBodyState();
  }

  function showViewModal(show) {
    if (elements.viewUpload) {
      elements.viewUpload.hidden = true;
      elements.viewUpload.setAttribute('aria-hidden', 'true');
    }
    elements.viewModal.hidden = !show;
    syncModalBodyState();
  }

  function showPaymentModal(show) {
    elements.paymentModal.hidden = !show;
    syncModalBodyState();
  }

  function showFileModal(show) {
    elements.fileModal.hidden = !show;
    syncModalBodyState();
  }

  function showInvoiceModal(show) {
    if (!elements.invoiceModal) return;
    elements.invoiceModal.hidden = !show;
    syncModalBodyState();
  }

  function showPurchaseChoice(show) {
    if (!elements.purchaseChoiceModal) return;
    elements.purchaseChoiceModal.hidden = !show;
    syncModalBodyState();
  }

  function closePurchaseChoice() {
    state.purchaseEntry = null;
    showPurchaseChoice(false);
  }

  function openPurchaseChoice(entry) {
    state.purchaseEntry = findEntry(entry && entry.id) || entry || null;
    if (!state.purchaseEntry) return;
    if (isProformaEntry(state.purchaseEntry)) {
      setAlert('Pre Order belum bisa dipakai untuk input pembelian. Input Penjualan/Faktur dulu, lalu lanjutkan pembelian dari faktur final.', 'error');
      return;
    }
    showPurchaseChoice(true);
  }

  function navigateToPurchasePage(type, entry) {
    const source = entry || state.purchaseEntry;
    if (!source) return;
    if (isProformaEntry(source)) {
      setAlert('Pre Order belum bisa dipakai untuk input pembelian. Input Penjualan/Faktur dulu.', 'error');
      closePurchaseChoice();
      return;
    }
    const sourceEntries = (state.viewEntry && text(state.viewEntry.id) === text(source.id) && state.viewEntries.length
      ? state.viewEntries
      : entriesForView(source)).filter(function (item) {
        return item && !isProformaEntry(item);
      });
    if (!sourceEntries.length) {
      setAlert('Belum ada faktur penjualan final untuk proyek ini. Input Penjualan/Faktur dulu sebelum input pembelian.', 'error');
      closePurchaseChoice();
      return;
    }
    const lines = (sourceEntries.length ? sourceEntries : [source]).map(function (item) {
      return {
        projectNo: text(item.projectNo),
        itemName: text(item.itemName),
        quantity: item.quantity == null ? '' : text(item.quantity)
      };
    }).filter(function (line) {
      return line.projectNo || line.itemName || line.quantity;
    });
    const query = new URLSearchParams();
    query.set('fromSales', '1');
    query.set('salesLines', JSON.stringify(lines.length ? lines : [{ projectNo: text(source.projectNo), itemName: '', quantity: '' }]));
    query.set('salesCustomer', text(source.customerName || source.supplierName));
    query.set('salesInvoice', text(source.invoiceNo));
    const book = type === 'fp' ? 'hti-buku-pembelian-fp' : 'hti-buku-pembelian-non-ppn';
    window.location.assign('/app/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/' + book + '?' + query.toString());
  }

  function resetFileInput(input, note, nameInput) {
    if (typeof window.clientPortalClearUploadSelection === 'function') {
      window.clientPortalClearUploadSelection(input);
    } else if (input) {
      input.value = '';
    }
    if (nameInput) nameInput.value = '';
    if (note) note.textContent = 'Belum ada file dipilih.';
    renameQrButtons();
  }

  function renameQrButtons() {
    Array.from(document.querySelectorAll('.hti-footer-upload .client-upload-qr-button')).forEach(function (button) {
      button.textContent = 'Upload dari HP';
    });
  }

  function resetForm() {
    elements.form.reset();
    resetEntryModalSize();
    resetAdvanceBalance();
    [elements.invoiceDate, elements.fakturDate].forEach(function (input) {
      if (input) delete input.dataset.htiSyncedFrom;
    });
    elements.entryId.value = '';
    if (elements.documentType) elements.documentType.value = 'faktur';
    state.editingEntry = null;
    state.editingEntries = [];
    state.transactionGroupId = newTransactionGroupId();
    syncAllDatePickers();
    clearNode(elements.entryLines);
    renderProjectOptions();
    appendLine({});
    syncDocumentTypeUi();
    resetFileInput(elements.attachmentFile, elements.attachmentNote, elements.attachmentName);
  }

  function openNewModal() {
    resetForm();
    setText(elements.modalTitle, 'Tambah Penjualan');
    setText(elements.modalMeta, 'Input header sekali, lalu isi rincian di bawah.');
    renameQrButtons();
    showModal(true);
    window.setTimeout(function () { elements.supplierNpwp.focus(); }, 0);
  }

  function applyProjectPrefillFromQuery() {
    if (state.projectPrefillApplied) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('fromProject') !== '1' && params.get('fromControlSales') !== '1') return;
    state.projectPrefillApplied = true;
    const projectNo = text(params.get('projectNo'));
    if (!projectNo) return;
    openNewModal();
    if (params.get('fromProforma') === '1') {
      if (callProformaFromProject(projectNo)) return;
      closeModal();
      setAlert('Pre Order proyek ' + projectNo + ' sudah tertutup atau tidak memiliki sisa qty untuk dibuat penjualan.', 'error');
      return;
    }
    clearNode(elements.entryLines);
    renderProjectOptions([projectNo]);
    appendLine({
      projectNo,
      itemName: text(params.get('itemName')),
      quantity: text(params.get('quantity'))
    });
    if (params.get('customerName')) elements.supplierName.value = text(params.get('customerName'));
    renderAdvanceBalanceFromForm();
    setText(elements.modalMeta, 'Kode proyek ' + projectNo + ' dipanggil dari Kontrol. Isi invoice penjualan, customer, dan nilai tagihan ketika faktur penjualan diterima.');
  }

  function openEditModal(entry) {
    if (!entry) return;
    const groupedEntries = (state.viewEntry && text(state.viewEntry.id) === text(entry.id) && state.viewEntries.length
      ? state.viewEntries
      : entriesForView(entry)).filter(Boolean);
    const entriesToEdit = groupedEntries.length ? groupedEntries : [entry];
    const firstEntry = entriesToEdit[0];
    resetForm();
    state.editingEntry = firstEntry;
    state.editingEntries = entriesToEdit;
    state.transactionGroupId = text(firstEntry.transactionGroupId) || newTransactionGroupId();
    elements.entryId.value = firstEntry.id;
    elements.supplierNpwp.value = customerCodeForEntry(firstEntry);
    elements.supplierName.value = firstEntry.customerName || firstEntry.supplierName || '';
    if (!elements.supplierNpwp.value && elements.supplierName.value) syncSupplier('name');
    if (elements.customerNpwp) elements.customerNpwp.value = firstEntry.customerNpwp || '';
    if (elements.customerAddress) elements.customerAddress.value = firstEntry.customerAddress || '';
    if (elements.documentType) elements.documentType.value = documentTypeOf(firstEntry);
    elements.fakturNo.value = firstEntry.fakturNo || '';
    elements.fakturDate.value = formatDate(firstEntry.fakturDate || firstEntry.fakturDateText || '');
    elements.invoiceNo.value = firstEntry.invoiceNo || '';
    elements.invoiceDate.value = formatDate(firstEntry.invoiceDate || firstEntry.invoiceDateText || '');
    if (elements.fpPurchaseNo) elements.fpPurchaseNo.value = firstEntry.fpPurchaseNo || '';
    if (elements.notesInput) elements.notesInput.value = firstEntry.notes || '';
    renderAdvanceBalanceFromForm();
    syncAllDatePickers();
    clearNode(elements.entryLines);
    entriesToEdit.forEach(function (item) { appendLine(lineFromEntry(item)); });
    syncDocumentTypeUi();
    setText(elements.modalTitle, 'Ubah Penjualan');
    setText(elements.modalMeta, (entriesToEdit.length > 1 ? 'Ubah ' + entriesToEdit.length + ' rincian sekaligus. ' : '') + (isProformaEntry(firstEntry) ? 'Pre Order belum masuk laporan sampai dijadikan faktur.' : 'Pelunasan dicatat lewat tombol Bayar.'));
    renameQrButtons();
    showViewModal(false);
    showModal(true);
    window.setTimeout(function () {
      const target = elements.entryLines.querySelector('[data-hti-line-field="itemName"]');
      if (target) target.focus();
    }, 0);
  }

  function closeModal() {
    showModal(false);
    resetForm();
  }

  function lineFromEntry(entry) {
    return {
      entryId: entry.id,
      documentsUploaded: Boolean(entry.documentsUploaded || entry.hasAttachment),
      projectNo: entry.projectNo || '',
      itemName: entry.itemName || '',
      quantity: entry.quantity == null ? '' : entry.quantity,
      unitPrice: entry.unitPrice || 0,
      discountAmount: entry.discountAmount || 0,
      dpp: entry.dpp || 0,
      ppn: entry.ppn || 0,
      totalAmount: entry.totalAmount || 0,
      paymentAmount: entry.paymentAmount || 0,
      paymentSource: entry.paymentSource || '',
      paymentRows: Array.isArray(entry.paymentRows) ? entry.paymentRows : []
    };
  }

  function appendLine(source) {
    const line = Object.assign({}, source || {});
    const hasSavedPayment = Boolean(line.entryId && parseAmount(line.paymentAmount) > 0);
    const hasAdvancePaymentRows = Boolean(Array.isArray(line.paymentRows) && line.paymentRows.length);
    const paymentReadOnly = Boolean((state.editingEntry && !isFormProforma()) || hasSavedPayment || hasAdvancePaymentRows);
    const paymentSourceLocked = Boolean(hasSavedPayment || hasAdvancePaymentRows);
    const row = document.createElement('tr');
    row.className = 'hti-entry-line-row';
    if (line.entryId) row.dataset.htiEntryId = text(line.entryId);
    row.dataset.htiDocumentsUploaded = line.documentsUploaded ? 'true' : 'false';
    row.dataset.htiPaymentLocked = paymentSourceLocked ? 'true' : 'false';
    if (line.sourceProformaId) row.dataset.htiSourceProformaId = text(line.sourceProformaId);
    if (hasAdvancePaymentRows) row.dataset.htiPaymentRows = JSON.stringify(line.paymentRows);
    row.appendChild(lineInputCell('projectNo', line.projectNo, 'text', 'hti-line-project', null, false, 'htiProjectOptions'));
    row.appendChild(lineInputCell('itemName', line.itemName, 'text', 'hti-line-item'));
    row.appendChild(lineInputCell('quantity', formatQuantity(line.quantity), 'text', 'hti-line-qty', 'decimal'));
    row.appendChild(lineInputCell('unitPrice', formatInputMoney(line.unitPrice), 'text', 'hti-line-money', 'decimal'));
    row.appendChild(lineInputCell('discountAmount', formatInputMoney(line.discountAmount), 'text', 'hti-line-money', 'decimal'));
    row.appendChild(lineInputCell('dpp', formatInputMoney(line.dpp), 'text', 'hti-line-money', 'decimal'));
    row.appendChild(lineInputCell('ppn', formatInputMoney(line.ppn), 'text', 'hti-line-money', 'decimal'));
    row.appendChild(lineInputCell('totalAmount', formatInputMoney(line.totalAmount), 'text', 'hti-line-money', 'decimal'));
    row.appendChild(lineInputCell('paymentAmount', formatInputMoney(line.paymentAmount), 'text', 'hti-line-money', 'decimal', paymentReadOnly));
    row.appendChild(paymentSourceCell(line.paymentSource, paymentSourceLocked));

    const actionCell = document.createElement('td');
    actionCell.className = 'hti-line-remove-cell';
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'hti-line-remove-button';
    removeButton.textContent = 'X';
    removeButton.setAttribute('aria-label', 'Hapus baris rincian');
    removeButton.disabled = Boolean(line.entryId && state.editingEntry);
    if (removeButton.disabled) removeButton.title = 'Baris transaksi lama tidak dihapus saat ubah';
    removeButton.addEventListener('click', function () {
      row.remove();
      if (!elements.entryLines.querySelector('tr')) appendLine({});
    });
    actionCell.appendChild(removeButton);
    row.appendChild(actionCell);
    elements.entryLines.appendChild(row);
    if ((line.entryId || line.sourceProformaId || !line.unitPrice) && (line.totalAmount || line.ppn || line.dpp)) {
      row.dataset.htiCalcSource = line.totalAmount ? 'totalAmount' : (line.ppn ? 'ppn' : 'dpp');
    }
    calculateLine(row);
    syncPaymentSourceAvailability(row);
    return row;
  }

  function lineInputCell(name, value, type, className, inputMode, readOnly, listId) {
    const cellElement = document.createElement('td');
    const input = document.createElement('input');
    input.type = type || 'text';
    input.value = value || '';
    input.dataset.htiLineField = name;
    input.autocomplete = 'off';
    input.className = className || '';
    if (inputMode) input.inputMode = inputMode;
    if (readOnly) input.readOnly = true;
    if (listId) input.setAttribute('list', listId);
    if (name === 'projectNo') input.placeholder = 'Pilih / ketik manual';
    cellElement.appendChild(input);
    return cellElement;
  }

  function paymentSourceCell(value, disabled) {
    const cellElement = document.createElement('td');
    const select = document.createElement('select');
    select.dataset.htiLineField = 'paymentSource';
    select.className = 'hti-line-bank';
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-';
    select.appendChild(emptyOption);
    paymentSourceList().forEach(function (source) {
      const label = paymentSourceLabel(source);
      if (!label) return;
      const option = document.createElement('option');
      option.value = label;
      option.textContent = label;
      select.appendChild(option);
    });
    select.value = text(value);
    if (select.value !== text(value)) {
      const customOption = document.createElement('option');
      customOption.value = text(value);
      customOption.textContent = text(value);
      select.appendChild(customOption);
      select.value = text(value);
    }
    if (disabled) select.disabled = true;
    cellElement.appendChild(select);
    return cellElement;
  }

  function syncPaymentSourceAvailability(row) {
    if (!row) return;
    const select = row.querySelector('[data-hti-line-field="paymentSource"]');
    if (!select) return;
    const locked = row.dataset.htiPaymentLocked === 'true';
    select.disabled = locked;
    select.title = locked
      ? 'Sumber pembayaran terkunci karena pembayaran sudah tercatat. Ubah lewat tombol Bayar/Batal Bayar atau Buku Bank.'
      : (isFormProforma()
        ? 'Jika diisi di Pre Order, nominal ini dicatat sebagai Uang Muka Penjualan.'
        : 'Boleh diisi sebagai rencana bank/kas. Jurnal kas/bank baru terbentuk saat pembayaran dicatat.');
  }

  function linePaymentRows(row) {
    const raw = text(row && row.dataset && row.dataset.htiPaymentRows);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function syncDocumentTypeUi() {
    const proforma = isFormProforma();
    Array.from(elements.entryLines.querySelectorAll('tr')).forEach(function (row) {
      const paymentInput = row.querySelector('[data-hti-line-field="paymentAmount"]');
      const hasSavedPayment = row.dataset.htiPaymentLocked === 'true';
      if (paymentInput && (!state.editingEntry || proforma) && !hasSavedPayment) {
        paymentInput.readOnly = false;
      }
      syncPaymentSourceAvailability(row);
    });
    if (elements.modalMeta && !state.editingEntry) {
      setText(elements.modalMeta, proforma
        ? 'Pre Order belum masuk laporan. Pelunasan di rincian akan dicatat sebagai Uang Muka Penjualan.'
        : 'Input header sekali, lalu isi rincian di bawah.');
    }
  }

  function lineValue(row, field) {
    const input = row.querySelector('[data-hti-line-field="' + field + '"]');
    return input ? input.value : '';
  }

  function setLineValue(row, field, value) {
    const input = row.querySelector('[data-hti-line-field="' + field + '"]');
    if (input) input.value = value;
  }

  function setCalculatedLineValue(row, field, value) {
    const active = document.activeElement;
    if (active && active.closest('tr') === row && active.dataset.htiLineField === field) return;
    setLineValue(row, field, value);
  }

  function formatLineTypingInput(input) {
    if (!input) return;
    const field = input.dataset.htiLineField;
    if (field === 'quantity') {
      formatTypingValue(input, formatQuantityTyping);
      return;
    }
    if (['unitPrice', 'discountAmount', 'dpp', 'ppn', 'totalAmount', 'paymentAmount'].includes(field)) {
      formatTypingValue(input, formatMoneyTyping);
    }
  }

  function updateLineCalcSource(row, field) {
    if (!row) return;
    const currentSource = row.dataset.htiCalcSource || '';
    if (['dpp', 'ppn', 'totalAmount'].includes(field)) {
      row.dataset.htiCalcSource = field;
      return;
    }
    if (field === 'discountAmount' && ['dpp', 'ppn', 'totalAmount'].includes(currentSource)) return;
    if (['unitPrice', 'discountAmount'].includes(field)) {
      row.dataset.htiCalcSource = 'unitPrice';
      return;
    }
    if (field === 'quantity' && !['dpp', 'ppn', 'totalAmount'].includes(currentSource)) {
      row.dataset.htiCalcSource = 'unitPrice';
    }
  }

  function calculateLine(row) {
    const quantity = Math.max(0, parseAmount(lineValue(row, 'quantity')));
    let unitPrice = Math.max(0, parseAmount(lineValue(row, 'unitPrice')));
    const discountAmount = Math.max(0, parseAmount(lineValue(row, 'discountAmount')));
    const source = row.dataset.htiCalcSource || 'unitPrice';
    let dpp = 0;
    let ppn = 0;
    let totalAmount = 0;
    if (source === 'totalAmount') {
      totalAmount = Math.max(0, roundRupiah(parseAmount(lineValue(row, 'totalAmount'))));
      dpp = Math.max(0, roundRupiah(totalAmount / (1 + (PPN_RATE / 100))));
      ppn = Math.max(0, totalAmount - dpp);
      if (quantity > 0) unitPrice = Math.max(0, roundRupiah((dpp + discountAmount) / quantity));
      setCalculatedLineValue(row, 'unitPrice', formatInputMoney(unitPrice));
    } else if (source === 'ppn') {
      ppn = Math.max(0, roundRupiah(parseAmount(lineValue(row, 'ppn'))));
      dpp = PPN_RATE ? Math.max(0, roundRupiah(ppn * 100 / PPN_RATE)) : 0;
      totalAmount = dpp + ppn;
      if (quantity > 0) unitPrice = Math.max(0, roundRupiah((dpp + discountAmount) / quantity));
      setCalculatedLineValue(row, 'unitPrice', formatInputMoney(unitPrice));
    } else if (source === 'dpp') {
      dpp = Math.max(0, roundRupiah(parseAmount(lineValue(row, 'dpp'))));
      ppn = roundRupiah(dpp * PPN_RATE / 100);
      totalAmount = dpp + ppn;
      if (quantity > 0) unitPrice = Math.max(0, roundRupiah((dpp + discountAmount) / quantity));
      setCalculatedLineValue(row, 'unitPrice', formatInputMoney(unitPrice));
    } else {
      dpp = Math.max(0, roundRupiah((quantity * unitPrice) - discountAmount));
      ppn = roundRupiah(dpp * PPN_RATE / 100);
      totalAmount = dpp + ppn;
    }
    setCalculatedLineValue(row, 'dpp', formatInputMoney(dpp));
    setCalculatedLineValue(row, 'ppn', formatInputMoney(ppn));
    setCalculatedLineValue(row, 'totalAmount', formatInputMoney(totalAmount));
    return { quantity, unitPrice, discountAmount, dpp, ppn, totalAmount };
  }

  function linePayload(row) {
    const values = calculateLine(row);
    const paymentAmount = Math.max(0, parseAmount(lineValue(row, 'paymentAmount')));
    const paymentRows = linePaymentRows(row);
    syncPaymentSourceAvailability(row);
    const payload = Object.assign({}, commonEntryPayload(), {
      entryId: text(row.dataset.htiEntryId),
      projectNo: text(lineValue(row, 'projectNo')),
      itemName: text(lineValue(row, 'itemName')),
      quantity: values.quantity,
      unitPrice: values.unitPrice,
      discountAmount: values.discountAmount,
      discountMode: 'dpp',
      ppnRate: PPN_RATE,
      dpp: values.dpp,
      ppn: values.ppn,
      totalAmount: values.totalAmount,
      preserveAmounts: true,
      paymentAmount,
      paymentSource: text(lineValue(row, 'paymentSource')),
      documentsUploaded: row.dataset.htiDocumentsUploaded === 'true'
    });
    if (paymentRows.length) {
      payload.paymentRows = paymentRows;
      payload.paymentAmount = 0;
      payload.paymentSource = '';
    }
    if (text(row.dataset.htiSourceProformaId)) {
      payload.sourceFile = 'proforma:' + text(row.dataset.htiSourceProformaId);
    }
    return payload;
  }

  function lineHasContent(payload) {
    return Boolean(payload.itemName || payload.unitPrice || payload.discountAmount || payload.totalAmount || payload.paymentAmount);
  }

  function commonEntryPayload() {
    const customerCode = cleanSupplierCode(elements.supplierNpwp.value);
    const fakturNo = text(elements.fakturNo.value);
    const fakturDate = fakturNo ? text(elements.fakturDate.value) : '';
    return {
      transactionGroupId: state.transactionGroupId,
      documentType: documentTypeOf(elements.documentType && elements.documentType.value),
      supplierNpwp: customerCode,
      supplierName: cleanSupplierName(elements.supplierName.value),
      customerCode,
      customerNpwp: cleanSupplierCode(elements.customerNpwp && elements.customerNpwp.value),
      customerName: cleanSupplierName(elements.supplierName.value),
      customerAddress: text(elements.customerAddress && elements.customerAddress.value),
      fpPurchaseNo: text(elements.fpPurchaseNo && elements.fpPurchaseNo.value),
      fakturNo,
      fakturDate,
      fakturDateText: fakturDate,
      invoiceNo: text(elements.invoiceNo.value),
      invoiceDate: text(elements.invoiceDate.value),
      invoiceDateText: text(elements.invoiceDate.value),
      paymentDate: '',
      paymentNotes: '',
      notes: text(elements.notesInput && elements.notesInput.value)
    };
  }

  function lastProjectNo() {
    const rows = Array.from(elements.entryLines.querySelectorAll('tr'));
    const source = rows[rows.length - 1];
    return source ? text(lineValue(source, 'projectNo')) : '';
  }

  function addLineFromCurrent(row) {
    const nextRow = appendLine({ projectNo: text(lineValue(row, 'projectNo')) || lastProjectNo() });
    const target = nextRow.querySelector('[data-hti-line-field="itemName"]') || nextRow.querySelector('[data-hti-line-field="projectNo"]');
    if (target) target.focus();
  }

  async function buildAttachmentPayload(input, nameInput) {
    const selectedFiles = typeof window.clientPortalSelectedFiles === 'function'
      ? window.clientPortalSelectedFiles(input)
      : Array.from(input?.files || []);
    if (!selectedFiles.length) return {};
    if (typeof window.clientPortalBuildAttachmentPayload !== 'function') {
      throw new Error('Fitur upload dokumen belum siap. Refresh halaman lalu coba lagi.');
    }
    const payload = await window.clientPortalBuildAttachmentPayload(input);
    if (payload.attachmentDataUrl && text(nameInput && nameInput.value)) {
      payload.attachmentName = text(nameInput.value);
    }
    return payload;
  }

  function selectedUploadFiles(input) {
    if (!input) return [];
    return typeof window.clientPortalSelectedFiles === 'function'
      ? window.clientPortalSelectedFiles(input)
      : Array.from(input.files || []);
  }

  function formatAttachmentSize(value) {
    const size = Number(value || 0);
    if (!size) return '0 KB';
    if (size < 1024 * 1024) return Math.max(1, Math.round(size / 1024)) + ' KB';
    return (size / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB';
  }

  function resetViewDocumentState() {
    state.viewAttachmentFiles = [];
    state.viewAttachmentLoading = false;
    clearNode(elements.viewDocuments);
  }

  function resetPaymentAttachmentInput(message) {
    resetFileInput(elements.paymentAttachmentFile, elements.paymentAttachmentNote, elements.paymentAttachmentName);
    if (elements.paymentAttachmentNote && message) elements.paymentAttachmentNote.textContent = message;
  }

  function uniquePaymentTargets(targets) {
    const seen = new Set();
    return (Array.isArray(targets) ? targets : []).map(function (target) {
      return findEntry(target && target.id) || target;
    }).filter(function (target) {
      const id = text(target && target.id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }

  async function savePaymentAttachmentForTargets(targets, options) {
    const settings = options || {};
    const selectedFiles = selectedUploadFiles(elements.paymentAttachmentFile);
    const cleanTargets = uniquePaymentTargets(targets);
    if (!selectedFiles.length || !cleanTargets.length) return null;
    if (elements.paymentAttachmentPickButton) elements.paymentAttachmentPickButton.disabled = true;
    if (elements.paymentAttachmentNote) elements.paymentAttachmentNote.textContent = 'Mengupload dokumen...';
    let latest = null;
    try {
      for (const target of cleanTargets) {
        const freshTarget = findEntry(target.id) || target;
        let existingFiles = [];
        if (freshTarget.hasAttachment) existingFiles = await fetchViewAttachmentFiles(freshTarget.id);
        if (existingFiles.length && typeof window.clientPortalBuildAttachmentPayloadFromFiles !== 'function') {
          throw new Error('Fitur tambah dokumen belum siap. Refresh halaman lalu coba lagi.');
        }
        const attachment = existingFiles.length
          ? await window.clientPortalBuildAttachmentPayloadFromFiles(existingFiles.concat(selectedFiles))
          : await buildAttachmentPayload(elements.paymentAttachmentFile, elements.paymentAttachmentName);
        if (attachment.attachmentDataUrl && text(elements.paymentAttachmentName && elements.paymentAttachmentName.value)) {
          attachment.attachmentName = text(elements.paymentAttachmentName.value);
        }
        if (!attachment.attachmentDataUrl) throw new Error('Pilih dokumen dari device atau QR dulu.');
        latest = await requestJson(apiBase() + '/entries/' + encodeURIComponent(freshTarget.id) + '/attachment', {
          method: 'PATCH',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(attachment)
        });
        if (latest) applyBookData(latest);
      }
      resetPaymentAttachmentInput(settings.doneMessage || 'Dokumen pembayaran tersimpan.');
      return latest;
    } finally {
      if (elements.paymentAttachmentPickButton) elements.paymentAttachmentPickButton.disabled = false;
    }
  }

  async function savePaymentAttachmentOnly() {
    if (!state.paymentEntry || !isEntryPaid(state.paymentEntry) || state.paymentEditingExisting) return;
    try {
      const data = await savePaymentAttachmentForTargets([state.paymentEntry], {
        doneMessage: 'Bukti bayar ditambahkan ke transaksi lunas.'
      });
      if (data) {
        const fresh = findEntry(state.paymentEntry.id);
        if (fresh) state.paymentEntry = fresh;
        setAlert('Bukti bayar ditambahkan.', 'success');
      }
    } catch (err) {
      setAlert(err.message || 'Bukti bayar gagal disimpan.', 'error');
    }
  }

  function ensureEntryJournalPreviewButton() {
    if (elements.journalPreviewButton) return elements.journalPreviewButton;
    if (!elements.saveButton || !elements.saveButton.parentElement) return null;
    const button = document.createElement('button');
    button.className = 'ghost-button hti-journal-preview-button';
    button.type = 'button';
    button.id = 'htiEntryJournalPreviewBtn';
    button.textContent = 'Lihat Jurnal';
    elements.saveButton.parentElement.insertBefore(button, elements.saveButton);
    elements.journalPreviewButton = button;
    return button;
  }

  function currentEntryPayloads() {
    return Array.from(elements.entryLines.querySelectorAll('tr'))
      .map(linePayload)
      .filter(lineHasContent);
  }

  function validateEntryPayloads(payloads) {
    if (!payloads.length) {
      setAlert('Minimal isi 1 baris rincian penjualan.', 'error');
      return false;
    }
    if (!formattedDateToIso(elements.invoiceDate && elements.invoiceDate.value)) {
      setAlert('Tanggal dokumen penjualan wajib diisi agar nomor invoice/Pre Order bisa dibuat otomatis.', 'error');
      return false;
    }
    const overpaid = payloads.find(function (payload) {
      return payload.paymentAmount > payload.totalAmount + 0.5;
    });
    if (overpaid) {
      setAlert('Pelunasan tidak boleh lebih besar dari total tagihan.', 'error');
      return false;
    }
    const incompletePayment = payloads.find(function (payload) {
      return payload.paymentAmount > 0 && (!payload.paymentSource || !(payload.invoiceDate || payload.fakturDate));
    });
    if (incompletePayment) {
      setAlert(isFormProforma()
        ? 'DP Pre Order wajib punya tanggal dokumen dan sumber kas/bank.'
        : 'Pelunasan pada rincian memakai tanggal invoice/faktur dan sumber kas/bank. Isi keduanya, atau gunakan tombol Bayar untuk tanggal berbeda.', 'error');
      return false;
    }
    return true;
  }

  async function previewEntryJournal() {
    if (!window.clientPortalHtiJournalPreview) {
      setAlert('Fitur preview jurnal belum siap. Refresh halaman lalu coba lagi.', 'error');
      return;
    }
    syncSupplier('name');
    normalizeAllDateInputs();
    if (!elements.form.reportValidity()) return;
    const payloads = currentEntryPayloads();
    if (!validateEntryPayloads(payloads)) return;
    const isProforma = documentTypeOf(elements.documentType && elements.documentType.value) === 'proforma';
    try {
      await window.clientPortalHtiJournalPreview.open({
        type: isProforma ? 'sales-proforma-advance' : 'sales',
        entries: payloads,
        title: isProforma ? 'Preview Jurnal Uang Muka Pre Order' : 'Preview Jurnal Penjualan',
        meta: isProforma
          ? payloads.length + ' baris Pre Order | hanya jurnal uang muka'
          : payloads.length + ' baris penjualan | belum tersimpan',
        emptyMessage: isProforma
          ? 'Belum ada uang muka Pre Order pada rincian ini.'
          : 'Belum ada jurnal penjualan pada rincian ini.'
      });
    } catch (err) {
      setAlert(err.message || 'Preview jurnal gagal dibuka.', 'error');
    }
  }

  async function saveEntry(event) {
    event.preventDefault();
    syncSupplier('name');
    normalizeAllDateInputs();
    if (!elements.form.reportValidity()) return;
    const entryId = text(elements.entryId.value);
    const payloads = currentEntryPayloads();
    if (!validateEntryPayloads(payloads)) return;

    elements.saveButton.disabled = true;
    try {
      const attachment = await buildAttachmentPayload(elements.attachmentFile, elements.attachmentName);
      let latest = null;
      for (const payload of payloads) {
        const targetEntryId = entryId ? text(payload.entryId) : '';
        latest = await requestJson(targetEntryId ? apiBase() + '/entries/' + encodeURIComponent(targetEntryId) : apiBase() + '/entries', {
          method: targetEntryId ? 'PUT' : 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(Object.assign({}, payload, attachment, {
            documentsUploaded: Boolean(attachment.attachmentDataUrl) || Boolean(payload.documentsUploaded)
          }))
        });
      }
      if (latest) applyBookData(latest);
      closeModal();
      await loadBook();
      setAlert(entryId ? 'Penjualan diperbarui.' : payloads.length + ' baris Penjualan disimpan.', 'success');
    } catch (err) {
      setAlert(err.message || 'Penjualan gagal disimpan.', 'error');
    } finally {
      elements.saveButton.disabled = false;
    }
  }

  function openViewModal(entry) {
    state.viewEntry = findEntry(entry.id) || entry;
    state.viewEntries = entriesForView(state.viewEntry);
    resetViewDocumentState();
    renderView(state.viewEntry, state.viewEntries);
    resetFileInput(elements.viewAttachmentFile, elements.viewAttachmentNote, elements.viewAttachmentName);
    elements.viewAttachmentName.value = state.viewEntry.attachmentName || '';
    elements.viewAttachmentNote.textContent = state.viewEntry.hasAttachment
      ? 'File saat ini: ' + text(state.viewEntry.attachmentName, 'dokumen tersimpan')
      : 'Belum ada dokumen tersimpan.';
    renameQrButtons();
    showViewModal(true);
  }

  function closeViewModal() {
    showViewModal(false);
    closeInvoiceModal();
    closePurchaseChoice();
    state.viewEntry = null;
    state.viewEntries = [];
    clearNode(elements.viewBody);
    resetViewDocumentState();
    resetFileInput(elements.viewAttachmentFile, elements.viewAttachmentNote, elements.viewAttachmentName);
  }

  async function promptLockedProforma(entry) {
    const proformaEntries = entriesForView(entry).filter(isProformaEntry);
    const finalEntries = finalSalesEntriesForProformaGroup(proformaEntries.length ? proformaEntries : [entry]);
    const target = finalEntries[0] ? (findEntry(finalEntries[0].id) || finalEntries[0]) : null;
    const confirmed = await window.clientPortalConfirm({
      title: 'Pre Order Sudah Jadi Faktur',
      meta: 'Pre Order dikunci agar tidak dobel pencatatan.',
      message: target
        ? 'Pre Order ini tidak bisa diubah atau dihapus karena sudah dibuat menjadi faktur penjualan. Ubah faktur finalnya, atau hapus faktur tersebut jika Pre Order ingin dibuka lagi.'
        : 'Pre Order ini terbaca sudah menjadi faktur, tetapi faktur terkait belum ditemukan di data yang sedang tampil. Refresh halaman lalu coba lagi.',
      cancelText: 'Batal',
      confirmText: target ? 'Ubah Faktur' : 'Tutup',
      enterConfirms: false
    });
    if (!confirmed || !target) return;
    closeViewModal();
    openEditModal(target);
  }

  function createViewHeader(fields) {
    const header = document.createElement('section');
    header.className = 'hti-office-header-grid hti-view-header-grid';
    header.setAttribute('aria-label', 'Header detail penjualan');
    fields.forEach(function (item) {
      const field = document.createElement('label');
      field.className = 'form-field' + (item[2] ? ' ' + item[2] : '');
      const label = document.createElement('span');
      label.textContent = item[0];
      const input = document.createElement('input');
      input.type = 'text';
      input.value = text(item[1], '-');
      input.readOnly = true;
      input.tabIndex = -1;
      input.title = input.value;
      input.setAttribute('aria-label', item[0]);
      field.appendChild(label);
      field.appendChild(input);
      header.appendChild(field);
    });
    return header;
  }

  function entriesForView(entry) {
    const groupId = text(entry && entry.transactionGroupId);
    if (!groupId) {
      const key = legacyEntryGroupKey(entry);
      const createdAt = Date.parse(entry && entry.createdAt);
      if (!key || !Number.isFinite(createdAt)) return entry ? [entry] : [];
      return state.entries.filter(function (item) {
        const itemCreatedAt = Date.parse(item && item.createdAt);
        return !text(item.transactionGroupId)
          && legacyEntryGroupKey(item) === key
          && Number.isFinite(itemCreatedAt)
          && Math.abs(itemCreatedAt - createdAt) <= 1000;
      });
    }
    return state.entries.filter(function (item) {
      return text(item.transactionGroupId) === groupId;
    });
  }

  function legacyEntryGroupKey(entry) {
    if (!entry) return '';
    return [
      entry.projectNo,
      entry.customerCode || entry.supplierNpwp,
      entry.customerNpwp,
      entry.customerName || entry.supplierName,
      entry.customerAddress,
      entry.invoiceNo,
      entry.invoiceDate || entry.invoiceDateText,
      entry.fakturNo,
      entry.fakturDate || entry.fakturDateText,
      entry.fpPurchaseNo,
      entry.notes
    ].map(function (value) { return text(value); }).join('|');
  }

  function renderView(entry, entries) {
    clearNode(elements.viewBody);
    const viewLines = Array.isArray(entries) && entries.length ? entries : [entry];
    const isProforma = isProformaEntry(entry);
    const proformaConversion = isProforma ? proformaConversionInfo(viewLines) : { isComplete: false, hasProgress: false, remaining: 0 };
    setText(elements.viewTitle, 'Detail Penjualan');
    setText(elements.viewMeta, (entry.projectNo ? 'Proyek ' + entry.projectNo + ' | ' : '') + text(entry.supplierName, 'Customer belum diisi') + ' | ' + documentTypeLabel(entry) + (viewLines.length > 1 ? ' | ' + viewLines.length + ' barang' : ''));

    elements.viewBody.appendChild(createViewHeader([
      ['Kode Customer', entry.customerCode || entry.supplierNpwp],
      ['Nama Customer', entry.customerName || entry.supplierName],
      ['NPWP/NIK', entry.customerNpwp],
      ['Alamat', entry.customerAddress],
      ['Jenis Dokumen', documentTypeLabel(entry)],
      ['No Invoice', entry.invoiceNo],
      ['Tanggal Invoice', formatDate(entry.invoiceDate || entry.invoiceDateText)],
      ['No Faktur', entry.fakturNo],
      ['Tanggal Faktur', formatDate(entry.fakturDate || entry.fakturDateText)],
      ['FP Pembelian', entry.fpPurchaseNo, 'supplier-wide'],
      ['Keterangan', entry.notes, 'supplier-wide']
    ]));

    const wrap = document.createElement('div');
    wrap.className = 'hti-view-detail-wrap';
    const table = document.createElement('table');
    table.className = 'hti-view-detail-table';
    table.innerHTML = '<thead><tr><th>Kode Projek</th><th>Nama Barang</th><th>Qty</th><th>Harga Satuan DPP</th><th>Diskon</th><th>DPP</th><th>PPN</th><th>Total</th><th>Pelunasan</th><th>Jenis Bank</th></tr></thead>';
    const body = document.createElement('tbody');
    viewLines.forEach(function (line) {
      const row = document.createElement('tr');
      [
        line.projectNo || '-',
        line.itemName || '-',
        formatQuantity(line.quantity || 0) || '0',
        formatCurrency(line.unitPrice),
        formatCurrency(line.discountAmount),
        formatCurrency(line.dpp),
        formatCurrency(line.ppn),
        formatCurrency(line.totalAmount),
        formatCurrency(line.paymentAmount),
        line.paymentSource || '-'
      ].forEach(function (value, index) {
        const td = document.createElement('td');
        td.textContent = value;
        if (index >= 3 && index <= 8) td.className = 'number';
        row.appendChild(td);
      });
      body.appendChild(row);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    elements.viewBody.appendChild(wrap);

    const paid = isEntryPaid(entry);
    if (elements.viewInvoiceButton) elements.viewInvoiceButton.textContent = isProforma ? 'Invoice Proforma' : 'Faktur';
    if (elements.viewConvertButton) {
      elements.viewConvertButton.hidden = !isProforma;
      elements.viewConvertButton.disabled = false;
      elements.viewConvertButton.textContent = proformaConversion.isComplete ? 'Sudah Faktur' : 'Input Penjualan';
      elements.viewConvertButton.title = proformaConversion.isComplete
        ? 'Klik untuk buka faktur final terkait'
        : 'Panggil data Pre Order ke form faktur penjualan final';
    }
    if (elements.viewPurchaseInputButton) {
      elements.viewPurchaseInputButton.hidden = isProforma;
      elements.viewPurchaseInputButton.disabled = isProforma;
      elements.viewPurchaseInputButton.title = isProforma
        ? 'Pre Order harus diinput menjadi penjualan/faktur dulu'
        : 'Input pembelian dari rincian penjualan ini';
    }
    if (elements.viewPayButton) {
      elements.viewPayButton.hidden = isProforma;
      elements.viewPayButton.disabled = isProforma || entry.totalAmount <= 0;
      elements.viewPayButton.textContent = paid ? 'Lunas' : 'Bayar';
    }
    if (elements.viewEditButton) {
      elements.viewEditButton.disabled = false;
      elements.viewEditButton.title = proformaConversion.isComplete
        ? 'Pre Order sudah tertutup oleh faktur final. Klik untuk ubah faktur terkait.'
        : '';
    }
    if (elements.viewDeleteButton) {
      elements.viewDeleteButton.disabled = false;
      elements.viewDeleteButton.title = proformaConversion.isComplete
        ? 'Pre Order sudah tertutup oleh faktur final. Klik untuk ubah faktur terkait.'
        : '';
    }
    loadViewDocuments(entry);
  }

  function viewDocumentFileKey(file, index) {
    return text(file && file.id) || [text(file && file.name, 'dokumen'), index].join('|');
  }

  function renderViewDocuments(entry) {
    if (!elements.viewDocuments) return;
    clearNode(elements.viewDocuments);

    const title = document.createElement('div');
    title.className = 'hti-view-document-title';
    const strong = document.createElement('strong');
    const meta = document.createElement('span');
    strong.textContent = 'Dokumen Terupload';
    title.appendChild(strong);
    title.appendChild(meta);
    elements.viewDocuments.appendChild(title);

    if (state.viewAttachmentLoading) {
      meta.textContent = 'Memuat dokumen...';
      const loading = document.createElement('div');
      loading.className = 'hti-view-document-empty';
      loading.textContent = 'Memuat daftar dokumen tersimpan...';
      elements.viewDocuments.appendChild(loading);
      return;
    }

    const files = state.viewAttachmentFiles || [];
    if (!entry || !entry.hasAttachment || !files.length) {
      meta.textContent = '';
      const empty = document.createElement('div');
      empty.className = 'hti-view-document-empty';
      empty.textContent = 'Belum ada dokumen tersimpan.';
      elements.viewDocuments.appendChild(empty);
      return;
    }

    meta.textContent = files.length === 1 ? '1 file tersimpan.' : files.length + ' file tersimpan.';
    const list = document.createElement('div');
    list.className = 'hti-view-document-list';
    const preview = document.createElement('div');
    preview.className = 'hti-view-document-preview';
    preview.addEventListener('click', function (event) {
      if (!state.viewPreviewFileId || event.target.closest('a, button')) return;
      state.viewPreviewFileId = '';
      clearNode(preview);
      list.querySelectorAll('.hti-view-document-row').forEach(function (row) {
        row.classList.remove('is-active');
      });
    });

    files.forEach(function (file, index) {
      const row = document.createElement('div');
      row.className = 'hti-view-document-row';
      const fileKey = viewDocumentFileKey(file, index);
      row.dataset.fileKey = fileKey;
      row.classList.toggle('is-active', state.viewPreviewFileId === fileKey);
      row.tabIndex = 0;
      row.setAttribute('role', 'button');
      row.title = 'Klik untuk preview dokumen';
      function togglePreview() {
        if (state.viewPreviewFileId === fileKey) {
          state.viewPreviewFileId = '';
          clearNode(preview);
          row.classList.remove('is-active');
          return;
        }
        state.viewPreviewFileId = fileKey;
        list.querySelectorAll('.hti-view-document-row').forEach(function (item) {
          item.classList.toggle('is-active', item === row);
        });
        renderInlineAttachmentPreview(preview, file);
      }
      row.addEventListener('click', togglePreview);
      row.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          togglePreview();
        }
      });

      const name = document.createElement('span');
      name.textContent = text(file && file.name, 'dokumen');
      const size = document.createElement('small');
      size.textContent = formatAttachmentSize(file && file.size);

      row.appendChild(name);
      row.appendChild(size);
      list.appendChild(row);
    });

    elements.viewDocuments.appendChild(list);
    elements.viewDocuments.appendChild(preview);
  }

  function renderInlineAttachmentPreview(container, file) {
    clearNode(container);
    if (!file) return;
    if (typeof window.clientPortalRenderAttachmentViewer === 'function') {
      window.clientPortalRenderAttachmentViewer(container, { file }, { label: text(file.name, 'Dokumen Penjualan') });
      return;
    }
    const fallback = document.createElement('div');
    fallback.className = 'cashbook-file-fallback';
    fallback.textContent = text(file.name, 'Dokumen') + ' siap dibuka setelah halaman di-refresh.';
    container.appendChild(fallback);
  }

  async function fetchViewAttachmentFiles(entryId) {
    const data = await requestJson(apiBase() + '/entries/' + encodeURIComponent(entryId) + '/file');
    return typeof window.clientPortalFilesFromResponse === 'function'
      ? window.clientPortalFilesFromResponse(data)
      : (Array.isArray(data.files) ? data.files : []);
  }

  async function loadViewDocuments(entry) {
    const currentId = text(entry && entry.id);
    if (!elements.viewDocuments || !currentId) return;
    state.viewAttachmentFiles = [];
    state.viewPreviewFileId = '';
    if (!entry.hasAttachment) {
      state.viewAttachmentLoading = false;
      renderViewDocuments(entry);
      return;
    }
    state.viewAttachmentLoading = true;
    renderViewDocuments(entry);
    try {
      const files = await fetchViewAttachmentFiles(currentId);
      if (!state.viewEntry || text(state.viewEntry.id) !== currentId) return;
      state.viewAttachmentFiles = files;
      state.viewAttachmentLoading = false;
      renderViewDocuments(state.viewEntry);
    } catch (err) {
      if (!state.viewEntry || text(state.viewEntry.id) !== currentId) return;
      state.viewAttachmentFiles = [];
      state.viewAttachmentLoading = false;
      renderViewDocuments(state.viewEntry);
      setAlert(err.message || 'Dokumen belum bisa dimuat.', 'error');
    }
  }

  async function saveViewAttachment() {
    const entry = state.viewEntry;
    if (!entry) return;
    if (!selectedUploadFiles(elements.viewAttachmentFile).length) return;
    if (elements.viewAttachmentPickButton) elements.viewAttachmentPickButton.disabled = true;
    if (elements.viewAttachmentNote) elements.viewAttachmentNote.textContent = 'Mengupload dokumen...';
    try {
      const selectedFiles = selectedUploadFiles(elements.viewAttachmentFile);
      let existingFiles = state.viewAttachmentFiles || [];
      if (entry.hasAttachment && !existingFiles.length) {
        existingFiles = await fetchViewAttachmentFiles(entry.id);
      }
      let attachment = await buildAttachmentPayload(elements.viewAttachmentFile, elements.viewAttachmentName);
      if (existingFiles.length) {
        if (typeof window.clientPortalBuildAttachmentPayloadFromFiles !== 'function') {
          throw new Error('Fitur tambah dokumen belum siap. Refresh halaman lalu coba lagi.');
        }
        attachment = await window.clientPortalBuildAttachmentPayloadFromFiles(existingFiles.concat(selectedFiles));
      }
      if (!attachment.attachmentDataUrl) {
        setAlert('Pilih dokumen dari device atau QR dulu.', 'error');
        return;
      }
      const data = await requestJson(apiBase() + '/entries/' + encodeURIComponent(entry.id) + '/attachment', {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(attachment)
      });
      applyBookData(data);
      const fresh = findEntry(entry.id);
      if (fresh) {
        state.viewEntry = fresh;
        state.viewEntries = entriesForView(fresh);
        renderView(fresh, state.viewEntries);
        resetFileInput(elements.viewAttachmentFile, elements.viewAttachmentNote, elements.viewAttachmentName);
        elements.viewAttachmentName.value = fresh.attachmentName || '';
        elements.viewAttachmentNote.textContent = fresh.hasAttachment
          ? 'File saat ini: ' + text(fresh.attachmentName, 'dokumen tersimpan') + '. Upload berikutnya akan menambahkan file.'
          : 'Belum ada dokumen tersimpan.';
      }
      setAlert('Dokumen penjualan ditambahkan.', 'success');
    } catch (err) {
      setAlert(err.message || 'Dokumen gagal disimpan.', 'error');
    } finally {
      if (elements.viewAttachmentPickButton) elements.viewAttachmentPickButton.disabled = false;
    }
  }

  async function deleteViewEntry() {
    const entry = state.viewEntry;
    if (!entry) return;
    const label = [entry.projectNo ? 'Proyek ' + entry.projectNo : '', entry.supplierName || 'customer belum diisi'].filter(Boolean).join(' | ');
    const confirmed = await window.clientPortalConfirm({
      title: 'Hapus Penjualan',
      meta: 'Data yang dihapus tidak masuk laporan.',
      message: 'Hapus data Penjualan ini? ' + label,
      cancelText: 'Batal',
      confirmText: 'Hapus'
    });
    if (!confirmed) return;
    if (elements.viewDeleteButton) elements.viewDeleteButton.disabled = true;
    try {
      const data = await requestJson(apiBase() + '/entries/' + encodeURIComponent(entry.id), {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      closeViewModal();
      applyBookData(data);
      setAlert('Data Penjualan dihapus.', 'success');
    } catch (err) {
      setAlert(err.message || 'Data Penjualan gagal dihapus.', 'error');
    } finally {
      if (elements.viewDeleteButton) elements.viewDeleteButton.disabled = false;
    }
  }

  function storedEntryPayload(entry, overrides) {
    const customerCode = customerCodeForEntry(entry);
    const base = {
      transactionGroupId: entry.transactionGroupId,
      documentType: documentTypeOf(entry),
      projectNo: entry.projectNo,
      supplierNpwp: customerCode,
      supplierName: entry.customerName || entry.supplierName,
      customerCode,
      customerNpwp: entry.customerNpwp,
      customerName: entry.customerName || entry.supplierName,
      customerAddress: entry.customerAddress,
      itemName: entry.itemName,
      fpPurchaseNo: entry.fpPurchaseNo,
      fakturNo: entry.fakturNo,
      fakturDate: entry.fakturDate || entry.fakturDateText,
      fakturDateText: entry.fakturDateText || entry.fakturDate,
      invoiceNo: entry.invoiceNo,
      invoiceDate: entry.invoiceDate || entry.invoiceDateText,
      invoiceDateText: entry.invoiceDateText || entry.invoiceDate,
      quantity: entry.quantity,
      unitPrice: entry.unitPrice,
      discountAmount: entry.discountAmount,
      ppnRate: entry.ppnRate,
      dpp: entry.dpp,
      ppn: entry.ppn,
      totalAmount: entry.totalAmount,
      paymentAmount: entry.paymentAmount,
      paymentSource: entry.paymentSource,
      paymentRows: Array.isArray(entry.paymentRows) ? entry.paymentRows : [],
      paymentNotes: entry.paymentNotes,
      notes: entry.notes,
      documentsUploaded: Boolean(entry.documentsUploaded || entry.hasAttachment),
      sourceFile: entry.sourceFile,
      preserveAmounts: true
    };
    return Object.assign(base, overrides || {});
  }

  function convertViewProformaToFaktur() {
    const entry = state.viewEntry;
    if (!entry || !isProformaEntry(entry)) return;
    const entries = (state.viewEntries && state.viewEntries.length ? state.viewEntries : [entry]).filter(isProformaEntry);
    if (!entries.length) return;
    if (proformaConversionInfo(entries).isComplete) {
      promptLockedProforma(entry);
      return;
    }
    closeViewModal();
    if (!openSalesInputFromProformaEntry(entry)) {
      setAlert('Data Pre Order belum bisa dipanggil ke form penjualan.', 'error');
    }
  }

  async function previewStoredAttachment(entry) {
    if (!entry || !entry.hasAttachment) {
      setAlert('Belum ada dokumen yang di-upload untuk baris ini.', 'error');
      return;
    }
    showFileModal(true);
    clearNode(elements.fileBody);
    setText(elements.fileTitle, text(entry.attachmentName, 'Dokumen Penjualan'));
    setText(elements.fileMeta, 'Memuat dokumen...');
    try {
      const data = await requestJson(apiBase() + '/entries/' + encodeURIComponent(entry.id) + '/file');
      if (typeof window.clientPortalRenderAttachmentViewer === 'function') {
        window.clientPortalRenderAttachmentViewer(elements.fileBody, data, {
          titleEl: elements.fileTitle,
          metaEl: elements.fileMeta,
          label: 'Dokumen Penjualan'
        });
      } else {
        throw new Error('Preview dokumen belum siap. Refresh halaman lalu coba lagi.');
      }
    } catch (err) {
      clearNode(elements.fileBody);
      const failed = document.createElement('div');
      failed.className = 'cashbook-file-fallback';
      failed.textContent = err.message || 'Dokumen belum bisa dibuka.';
      elements.fileBody.appendChild(failed);
      setText(elements.fileMeta, 'Gagal memuat dokumen.');
    }
  }

  function closeFileModal() {
    showFileModal(false);
    clearNode(elements.fileBody);
  }

  function populateInvoiceBankOptions() {
    if (!elements.invoiceBank || elements.invoiceBank.options.length) return;
    PTX_INVOICE_BANKS.forEach(function (bank) {
      const option = document.createElement('option');
      option.value = bank.key;
      option.textContent = bank.label;
      elements.invoiceBank.appendChild(option);
    });
  }

  function selectedInvoiceBank() {
    const key = text(elements.invoiceBank && elements.invoiceBank.value, 'BANK BCA');
    return PTX_INVOICE_BANKS.find(function (bank) { return bank.key === key; }) || PTX_INVOICE_BANKS[0];
  }

  function defaultInvoiceBankKey(entry, lines) {
    const sourceText = [entry && entry.paymentSource].concat((lines || []).map(function (line) {
      return line.paymentSource;
    })).join(' ').toUpperCase();
    const match = PTX_INVOICE_BANKS.find(function (bank) {
      return sourceText.includes(bank.key.replace(/^BANK\s+/, ''));
    });
    return (match && match.key) || 'BANK BCA';
  }

  function romanMonth(month) {
    return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][Number(month || 0)] || '';
  }

  function htiInvoiceNoPreview(entry) {
    const existing = text(entry && entry.invoiceNo);
    if (existing) return existing;
    const iso = formattedDateToIso((entry && (entry.invoiceDate || entry.invoiceDateText)) || todayIso());
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!parts) return '-';
    return parts[1].slice(2) + romanMonth(Number(parts[2])) + '001';
  }

  function invoiceLinesForEntry(entry) {
    const lines = Array.isArray(state.viewEntries) && state.viewEntries.length
      ? state.viewEntries
      : entriesForView(entry);
    return lines.length ? lines : (entry ? [entry] : []);
  }

  function invoiceMoney(value) {
    return moneyFormatter.format(roundRupiah(value));
  }

  function invoiceRp(value, withSpace) {
    return 'Rp' + (withSpace ? ' ' : '') + invoiceMoney(value);
  }

  function invoiceLineTotal(line) {
    const total = parseAmount(line && line.totalAmount);
    if (total > 0) return roundRupiah(total);
    return roundRupiah(parseAmount(line && line.dpp) + parseAmount(line && line.ppn));
  }

  function invoiceLineUnitPrice(line) {
    const qty = parseAmount(line && line.quantity);
    const total = invoiceLineTotal(line);
    return qty > 0 ? roundRupiah(total / qty) : total;
  }

  function invoiceLineUnit(line, lines) {
    const unit = text(line && (line.unit || line.satuan));
    if (unit) return unit;
    const item = text(line && line.itemName).toLowerCase();
    if (item.includes('jasa')) return 'Set';
    return (lines || []).length > 1 ? 'Unit' : 'Paket';
  }

  function invoiceTotals(lines) {
    return (lines || []).reduce(function (summary, line) {
      summary.total += invoiceLineTotal(line);
      summary.paid += parseAmount(line && line.paymentAmount);
      return summary;
    }, { total: 0, paid: 0 });
  }

  function invoiceProjectLine(entry, lines) {
    const note = text(entry && entry.notes);
    if (note) return note.toUpperCase();
    const firstItem = text(lines && lines[0] && lines[0].itemName);
    return firstItem ? firstItem.toUpperCase() : 'PENGADAAN';
  }

  function wordRemainder(value) {
    return value ? ' ' + numberToWords(value) : '';
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

  function titleCaseWords(value) {
    return text(value).toLowerCase().replace(/\b[a-z]/g, function (char) { return char.toUpperCase(); });
  }

  function terbilangInvoice(value) {
    const amount = roundRupiah(value);
    return amount ? titleCaseWords(numberToWords(amount)) + ' Rupiah' : 'Nol Rupiah';
  }

  function htiInvoiceHtml(entry, lines) {
    const type = elements.invoiceType && elements.invoiceType.value === 'proforma' ? 'proforma' : 'sales';
    const documentTitle = type === 'proforma' ? 'PROFORMA INVOICE' : 'FAKTUR PENJUALAN';
    const bank = selectedInvoiceBank();
    const totals = invoiceTotals(lines);
    const dpAmount = type === 'proforma' ? Math.min(advanceTotalForInvoice(entry), totals.total) : 0;
    const rows = (lines || []).map(function (line, index) {
      const qty = parseAmount(line.quantity);
      return '<tr>' +
        '<td class="center">' + escapeHtml(index + 1) + '</td>' +
        '<td class="description">' + escapeHtml(text(line.itemName, '-')) + '</td>' +
        '<td class="center">' + escapeHtml(formatQuantity(qty) || '0') + '</td>' +
        '<td class="center">' + escapeHtml(invoiceLineUnit(line, lines)) + '</td>' +
        '<td class="money"><span>Rp</span><strong>' + escapeHtml(invoiceMoney(invoiceLineUnitPrice(line))) + '</strong></td>' +
        '<td class="money"><span>Rp</span><strong>' + escapeHtml(invoiceMoney(invoiceLineTotal(line))) + '</strong></td>' +
      '</tr>';
    });
    while (rows.length < 8) {
      rows.push('<tr class="blank"><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
    }
    const summaryRows = [
      '<tr class="hti-invoice-total-row">' +
        '<td class="summary-spacer" colspan="4"></td>' +
        '<th class="summary-label">Total</th>' +
        '<td class="summary-amount">' + escapeHtml(invoiceRp(totals.total, true)) + '</td>' +
      '</tr>'
    ];
    if (dpAmount > 0) {
      summaryRows.push(
        '<tr class="hti-invoice-total-row hti-invoice-dp-row">' +
          '<td class="summary-spacer" colspan="4"></td>' +
          '<th class="summary-label">DP 1</th>' +
          '<td class="summary-amount">' + escapeHtml(invoiceRp(dpAmount, true)) + '</td>' +
        '</tr>'
      );
    }
    const topLines = [
      text(entry.customerName || entry.supplierName, 'CUSTOMER'),
      text(entry.customerAddress),
      invoiceProjectLine(entry, lines)
    ].filter(Boolean);
    return '<article class="hti-invoice-paper">' +
      '<h1>' + escapeHtml(documentTitle) + '</h1>' +
      '<section class="hti-invoice-top">' +
        '<div class="hti-invoice-recipient">' + topLines.map(function (line) {
          return '<strong>' + escapeHtml(line) + '</strong>';
        }).join('') + '</div>' +
        '<div class="hti-invoice-no">' + escapeHtml(htiInvoiceNoPreview(entry)) + '</div>' +
        '<div class="hti-invoice-date">Tgl : ' + escapeHtml(formatDate(entry.invoiceDate || entry.invoiceDateText || todayIso())) + '</div>' +
      '</section>' +
      '<table class="hti-invoice-table"><thead><tr><th>No</th><th>DESKRIPSI</th><th>QTY</th><th>SAT</th><th>HARGA</th><th>TOTAL</th></tr></thead><tbody>' + rows.join('') + '</tbody><tfoot>' + summaryRows.join('') + '</tfoot></table>' +
      '<p class="hti-invoice-note"><strong>NOTE : "harga sudah termasuk pajak"</strong></p>' +
      '<section class="hti-invoice-payment">' +
        '<p>( ' + escapeHtml(terbilangInvoice(totals.total)) + ' )</p>' +
        '<strong>' + escapeHtml(bank.label) + '</strong>' +
        '<strong>A/N : PT X</strong>' +
      '</section>' +
      '<footer class="hti-invoice-signatures"><span>Diterima Oleh :</span><span>Dikirim oleh :</span><span>Disetujui Oleh :</span></footer>' +
    '</article>';
  }

  function renderInvoicePreview() {
    if (!state.invoicePreview) return;
    const entry = state.invoicePreview.entry;
    const lines = state.invoicePreview.lines || invoiceLinesForEntry(entry);
    const type = elements.invoiceType && elements.invoiceType.value === 'proforma' ? 'Proforma Invoice' : 'Faktur Penjualan';
    setText(elements.invoiceTitle, type);
    setText(elements.invoiceMeta, [htiInvoiceNoPreview(entry), text(entry.customerName || entry.supplierName, 'Customer')].filter(Boolean).join(' | '));
    elements.invoiceBody.innerHTML = htiInvoiceHtml(entry, lines);
  }

  function openInvoiceModal(entry) {
    const fresh = findEntry(entry && entry.id) || entry;
    if (!fresh) return;
    const lines = invoiceLinesForEntry(fresh);
    state.invoicePreview = { entry: fresh, lines };
    populateInvoiceBankOptions();
    if (elements.invoiceType) {
      elements.invoiceType.value = isProformaEntry(fresh) ? 'proforma' : 'sales';
      elements.invoiceType.disabled = true;
    }
    if (elements.invoiceBank) elements.invoiceBank.value = defaultInvoiceBankKey(fresh, lines);
    renderInvoicePreview();
    showInvoiceModal(true);
  }

  function closeInvoiceModal() {
    showInvoiceModal(false);
    if (elements.invoiceBody) elements.invoiceBody.innerHTML = '';
    if (elements.invoiceType) elements.invoiceType.disabled = false;
    state.invoicePreview = null;
  }

  function htiInvoicePrintStyles() {
    return [
      '@page{size:A4 portrait;margin:0}',
      '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      'body{margin:0;background:#fff;color:#111;font-family:Arial,serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      '.hti-invoice-paper{position:relative;width:210mm;min-height:297mm;margin:0 auto;padding:10mm 10mm 13mm;background:#fff;color:#111;overflow:hidden;font-family:Arial,serif}',
      '.hti-invoice-paper h1{margin:0 0 12mm;text-align:center;font-family:Arial,sans-serif;font-size:17pt;font-weight:900;letter-spacing:.2pt}',
      '.hti-invoice-top{display:grid;grid-template-columns:minmax(0,1fr) 28mm 34mm;min-height:31mm;align-items:start;margin-bottom:7mm;font-size:10pt;font-weight:800}',
      '.hti-invoice-recipient{display:grid;gap:1.6mm;padding-top:2mm}.hti-invoice-recipient strong{display:block;line-height:1.22}.hti-invoice-no,.hti-invoice-date{padding-top:8mm;text-align:left;font-size:9pt;font-weight:600}.hti-invoice-date{text-align:center}',
      '.hti-invoice-table{width:100%;border-collapse:collapse;table-layout:fixed;background:#fff}.hti-invoice-table th,.hti-invoice-table td{border:1pt solid #111;padding:1.7mm 1.8mm;font-size:9pt;line-height:1.25;vertical-align:middle}.hti-invoice-table th{background:#bfbfbf;text-align:center;font-weight:900}.hti-invoice-table th:nth-child(1){width:8mm}.hti-invoice-table th:nth-child(2){width:auto}.hti-invoice-table th:nth-child(3){width:12mm}.hti-invoice-table th:nth-child(4){width:13mm}.hti-invoice-table th:nth-child(5){width:32mm}.hti-invoice-table th:nth-child(6){width:34mm}.hti-invoice-table .center{text-align:center}.hti-invoice-table .description{text-align:center}.hti-invoice-table .money{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}.hti-invoice-table .money span{float:left;font-weight:400}.hti-invoice-table .money strong{font-weight:800}.hti-invoice-table .blank td{height:8mm}.hti-invoice-table tfoot .summary-spacer{border:0;background:#fff}.hti-invoice-table tfoot .summary-label,.hti-invoice-table tfoot .summary-amount{border:1pt solid #111;background:#fff;font-size:11pt;font-weight:900}.hti-invoice-table tfoot .summary-label{text-align:center}.hti-invoice-table tfoot .summary-amount{text-align:right;white-space:nowrap}',
      '.hti-invoice-note{margin:14mm 0 15mm 36mm;font-family:Georgia,serif;font-size:10pt;font-style:italic}.hti-invoice-payment{display:grid;gap:1.5mm;margin-top:0;font-size:9.5pt;font-family:Georgia,serif}.hti-invoice-payment p{margin:0}.hti-invoice-payment strong{display:block;font-family:Arial,sans-serif;font-weight:900}.hti-invoice-signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:12mm;margin-top:20mm;font-size:9pt;text-align:center}.hti-invoice-signatures span{min-height:12mm}'
    ].join('');
  }

  function printInvoice() {
    if (!state.invoicePreview) return;
    const popup = window.open('', '_blank');
    if (!popup) {
      setAlert('Popup print diblokir browser.', 'error');
      return;
    }
    const body = elements.invoiceBody.innerHTML;
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>Faktur PT X</title><style>' + htiInvoicePrintStyles() + '</style></head><body>' + body + '<script>window.addEventListener("load",function(){setTimeout(function(){window.print();},120);});<\/script></body></html>';
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
  }

  function todayIso() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  }

  function setPaymentFieldsReadOnly(readOnly) {
    elements.quickPaymentDate.readOnly = readOnly;
    elements.quickPaymentDatePicker.disabled = readOnly;
    if (elements.quickPaymentAdvanceAmount) elements.quickPaymentAdvanceAmount.readOnly = readOnly;
    if (elements.quickPaymentUseAllAdvance) elements.quickPaymentUseAllAdvance.disabled = readOnly;
    elements.quickPaymentAmount.readOnly = readOnly;
    elements.quickPaymentSource.readOnly = readOnly;
    elements.quickPaymentNotes.readOnly = readOnly;
  }

  function syncPaymentSplit(options) {
    if (!state.paymentEntry) return;
    const settings = options || {};
    const outstanding = Math.max(0, Number(state.paymentEntry.outstanding || 0));
    const advanceAvailable = advanceTotalForEntry(state.paymentEntry);
    const maxAdvance = Math.min(outstanding, advanceAvailable);
    const useAllAdvance = Boolean(elements.quickPaymentUseAllAdvance?.checked);
    if (elements.quickPaymentAdvanceAmount) {
      elements.quickPaymentAdvanceAmount.readOnly = useAllAdvance;
      if (useAllAdvance) elements.quickPaymentAdvanceAmount.value = formatInputMoney(maxAdvance);
    }
    const advanceAmount = elements.quickPaymentAdvanceAmount ? parseAmount(elements.quickPaymentAdvanceAmount.value) : 0;
    if (elements.quickPaymentAdvanceAmount) {
      elements.quickPaymentAdvanceAmount.setCustomValidity(advanceAmount > maxAdvance + 0.5
        ? 'Nominal uang muka melebihi saldo yang bisa dipakai.'
        : '');
    }
    if (settings.adjustCash && !elements.quickPaymentAmount.readOnly) {
      elements.quickPaymentAmount.value = formatInputMoney(Math.max(0, outstanding - advanceAmount));
    }
    const cashAmount = parseAmount(elements.quickPaymentAmount.value);
    const totalPaid = advanceAmount + cashAmount;
    elements.quickPaymentAmount.required = false;
    elements.quickPaymentAmount.setCustomValidity(totalPaid > outstanding + 0.5
      ? 'Total pembayaran melebihi sisa piutang.'
      : '');
    elements.quickPaymentSource.required = cashAmount > 0.5;
    if (cashAmount <= 0.5 && !elements.quickPaymentSource.readOnly) elements.quickPaymentSource.value = '';
  }

  function paymentSourceSelectOptions() {
    return paymentSourceList().map(paymentSourceLabel).filter(Boolean);
  }

  function normalizeChoiceText(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function closestPaymentTableSource(value) {
    const query = normalizeChoiceText(value);
    if (!query) return '';
    const normalized = paymentSourceSelectOptions().map(function (label) {
      return { label, value: normalizeChoiceText(label) };
    });
    const exact = normalized.find(function (item) { return item.value === query; });
    if (exact) return exact.label;
    const wordExact = normalized.find(function (item) {
      return item.value.split(' ').includes(query);
    });
    if (wordExact) return wordExact.label;
    const starts = normalized.find(function (item) { return item.value.startsWith(query); });
    if (starts) return starts.label;
    const wordStarts = normalized.find(function (item) {
      return item.value.split(' ').some(function (word) { return word.startsWith(query); });
    });
    if (wordStarts) return wordStarts.label;
    const contains = normalized.find(function (item) { return item.value.includes(query); });
    return contains ? contains.label : '';
  }

  function applyPaymentTableSourceChoice(input) {
    if (!input) return '';
    const selected = closestPaymentTableSource(input.value);
    input.value = selected;
    input.toggleAttribute('aria-invalid', !selected && Boolean(text(input.value)));
    return selected;
  }

  function paymentTargetForKey(key) {
    return key === '__all__'
      ? allPaymentTarget()
      : state.paymentTargets.find(function (target) { return text(target.id) === text(key); }) || null;
  }

  function paymentTableTargetKey(target) {
    return target && target.isAll ? '__all__' : text(target && target.id);
  }

  function renderPaymentTableTransactionOptions(select) {
    if (!select) return;
    clearNode(select);
    if (state.paymentTargets.length > 1) {
      addOption(select, '__all__', 'Semua | Total sisa ' + formatCurrency(paymentTargetsTotal(state.paymentTargets)));
    }
    state.paymentTargets.forEach(function (target) {
      addOption(select, target.id, paymentTargetLabel(target));
    });
  }

  function renderPaymentTableSourceOptions(select, selectedValue) {
    if (!select) return;
    clearNode(select);
    addOption(select, '', '-');
    paymentSourceSelectOptions().forEach(function (source) {
      addOption(select, source, source);
    });
    if (selectedValue && !Array.from(select.options).some(function (option) { return option.value === selectedValue; })) {
      addOption(select, selectedValue, selectedValue);
    }
    if (selectedValue) select.value = selectedValue;
  }

  function paymentTableRowsLocked() {
    return Boolean(state.paymentEntry && isEntryPaid(state.paymentEntry) && !state.paymentEditingExisting);
  }

  function paymentTableUsedTargetKeys() {
    if (!elements.paymentRows) return new Set();
    return new Set(Array.from(elements.paymentRows.querySelectorAll('[data-hti-payment-field="entry"]'))
      .map(function (select) { return text(select.value); })
      .filter(function (value) { return value && value !== '__all__'; }));
  }

  function nextPaymentTableTarget() {
    const used = paymentTableUsedTargetKeys();
    return state.paymentTargets.find(function (target) { return !used.has(text(target.id)); }) || state.paymentTargets[0] || state.paymentEntry;
  }

  function syncPaymentTableSummary() {
    if (!elements.paymentRows || !elements.paymentOutstanding) return;
    const keys = Array.from(elements.paymentRows.querySelectorAll('[data-hti-payment-field="entry"]'))
      .map(function (select) { return text(select.value); })
      .filter(Boolean);
    const total = keys.reduce(function (sum, key) {
      const target = paymentTargetForKey(key);
      return sum + paymentTargetLimit(target);
    }, 0);
    setText(elements.paymentOutstanding, formatCurrency(total || Number(state.paymentTarget?.outstanding || state.paymentEntry?.outstanding || 0)));
  }

  function paymentTargetLimit(target) {
    if (state.paymentEditingExisting && target && !target.isAll && hasEntryPayments(target)) {
      return Math.max(0, Number(target.totalAmount || 0));
    }
    return Math.max(0, Number(target && target.outstanding || 0));
  }

  function syncPaymentTableRow(row, options) {
    if (!row) return;
    const settings = options || {};
    const entrySelect = row.querySelector('[data-hti-payment-field="entry"]');
    const projectInput = row.querySelector('[data-hti-payment-field="project"]');
    const dateInput = row.querySelector('[data-hti-payment-field="date"]');
    const datePicker = row.querySelector('[data-hti-payment-field="datePicker"]');
    const amountInput = row.querySelector('[data-hti-payment-field="amount"]');
    const remainingInput = row.querySelector('[data-hti-payment-field="remaining"]');
    const target = paymentTargetForKey(entrySelect && entrySelect.value) || nextPaymentTableTarget();
    const outstanding = paymentTargetLimit(target);
    if (entrySelect && target) entrySelect.value = paymentTableTargetKey(target);
    if (projectInput) projectInput.value = target && target.isAll ? 'Semua' : text(target && target.projectNo, '-');
    if (dateInput && !text(dateInput.value)) dateInput.value = formatDate(todayIso());
    if (datePicker) {
      datePicker.min = paymentTargetMinDateIso(target);
      syncDatePicker(dateInput, datePicker);
    }
    if (amountInput && settings.resetAmount) amountInput.value = formatInputMoney(outstanding);
    const amount = parseAmount(amountInput && amountInput.value);
    if (remainingInput) remainingInput.value = formatCurrency(Math.max(0, outstanding - amount));
    syncPaymentTableSummary();
  }

  function createPaymentTableRow(target, options) {
    if (!elements.paymentRows) return null;
    const settings = options || {};
    const paid = Boolean(settings.paid);
    const paymentRow = settings.paymentRow || null;
    const breakdown = paid && target ? paymentBreakdown(target) : null;
    const row = document.createElement('tr');
    row.className = 'hti-payment-input-row';
    if (Number.isInteger(settings.paymentRowIndex)) row.dataset.htiPaymentRowIndex = String(settings.paymentRowIndex);
    if (settings.sourceFocused) row.classList.add('is-source-payment-row');
    if (paymentRow) {
      row.dataset.htiPaymentSourceType = text(paymentRow.paymentSourceType || paymentRow.payment_source_type);
      row.dataset.htiPaymentSourceKey = text(paymentRow.paymentSourceKey || paymentRow.payment_source_key || paymentRow.advanceId || paymentRow.advance_id);
      row.dataset.htiAdvanceType = text(paymentRow.advanceType || paymentRow.advance_type);
    }

    const dateCell = document.createElement('td');
    const dateWrap = document.createElement('div');
    dateWrap.className = 'hti-date-field hti-payment-date-field';
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.placeholder = 'DD/MM/YYYY';
    dateInput.autocomplete = 'off';
    dateInput.dataset.htiPaymentField = 'date';
    dateInput.value = formatDate(paid ? (paymentRow?.paymentDate || paymentRow?.payment_date || breakdown.latestDate || target.paymentDate || todayIso()) : todayIso());
    const datePicker = document.createElement('input');
    datePicker.type = 'date';
    datePicker.className = 'hti-date-picker-native';
    datePicker.dataset.htiPaymentField = 'datePicker';
    datePicker.setAttribute('aria-label', 'Pilih tanggal bayar');
    dateWrap.append(dateInput, datePicker);
    dateCell.appendChild(dateWrap);

    const projectCell = document.createElement('td');
    const projectInput = document.createElement('input');
    projectInput.type = 'text';
    projectInput.readOnly = true;
    projectInput.dataset.htiPaymentField = 'project';
    projectCell.appendChild(projectInput);

    const transactionCell = document.createElement('td');
    const transactionSelect = document.createElement('select');
    transactionSelect.dataset.htiPaymentField = 'entry';
    renderPaymentTableTransactionOptions(transactionSelect);
    transactionSelect.value = paymentTableTargetKey(target || nextPaymentTableTarget());
    transactionCell.appendChild(transactionSelect);

    const sourceCell = document.createElement('td');
    const sourceSelect = document.createElement('input');
    sourceSelect.type = 'text';
    sourceSelect.setAttribute('list', 'htiPaymentSourceOptions');
    sourceSelect.placeholder = 'Pilih bank/kas';
    sourceSelect.autocomplete = 'off';
    sourceSelect.dataset.htiPaymentField = 'source';
    sourceSelect.value = paid ? (text(paymentRow?.paymentSource || paymentRow?.payment_source) || breakdown.cashSources[0] || '') : '';
    sourceCell.appendChild(sourceSelect);

    const amountCell = document.createElement('td');
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.inputMode = 'decimal';
    amountInput.autocomplete = 'off';
    amountInput.dataset.htiPaymentField = 'amount';
    amountInput.value = formatInputMoney(paid ? Number(paymentRow?.paymentAmount ?? paymentRow?.payment_amount ?? breakdown.cash) : Number((target || {}).outstanding || 0));
    amountCell.appendChild(amountInput);

    const remainingCell = document.createElement('td');
    const remainingInput = document.createElement('input');
    remainingInput.type = 'text';
    remainingInput.readOnly = true;
    remainingInput.dataset.htiPaymentField = 'remaining';
    remainingCell.appendChild(remainingInput);

    const actionCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'hti-payment-remove-row';
    removeButton.textContent = 'X';
    removeButton.setAttribute('aria-label', 'Hapus baris pembayaran');
    actionCell.appendChild(removeButton);

    row.append(dateCell, projectCell, transactionCell, sourceCell, amountCell, remainingCell, actionCell);
    elements.paymentRows.appendChild(row);
    bindDateControl(dateInput, datePicker);

    if (paid) {
      [dateInput, transactionSelect, sourceSelect, amountInput, removeButton].forEach(function (input) {
        input.disabled = true;
      });
    }

    transactionSelect.addEventListener('change', function () {
      syncPaymentTableRow(row, { resetAmount: true });
      amountInput.focus();
    });
    sourceSelect.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') applyPaymentTableSourceChoice(sourceSelect);
      addPaymentRowOnEnter(event);
    });
    sourceSelect.addEventListener('change', function () { applyPaymentTableSourceChoice(sourceSelect); });
    sourceSelect.addEventListener('blur', function () { applyPaymentTableSourceChoice(sourceSelect); });
    dateInput.addEventListener('keydown', addPaymentRowOnEnter);
    transactionSelect.addEventListener('keydown', addPaymentRowOnEnter);
    amountInput.addEventListener('input', function () {
      formatTypingValue(amountInput, formatMoneyTyping);
      syncPaymentTableRow(row);
    });
    amountInput.addEventListener('blur', function () {
      amountInput.value = formatInputMoney(amountInput.value);
      syncPaymentTableRow(row);
    });
    amountInput.addEventListener('keydown', addPaymentRowOnEnter);
    removeButton.addEventListener('click', function () {
      removePaymentTableRow(row);
    });
    syncPaymentTableRow(row, { resetAmount: !paid });
    return row;
  }

  function addPaymentRowOnEnter(event) {
    if (event.key !== 'Enter' || !elements.paymentRows || state.paymentEditingExisting || paymentTableRowsLocked()) return;
    event.preventDefault();
    const row = createPaymentTableRow(nextPaymentTableTarget(), { focus: true });
    window.setTimeout(function () {
      const input = row && row.querySelector('[data-hti-payment-field="entry"]');
      if (input) input.focus();
    }, 0);
  }

  async function removePaymentTableRow(row) {
    if (!row || paymentTableRowsLocked()) return;
    const confirmed = await window.clientPortalConfirm({
      title: 'Hapus Baris Pembayaran',
      meta: 'Baris ini belum disimpan.',
      message: 'Hapus baris pembayaran ini?',
      cancelText: 'Batal',
      confirmText: 'Hapus'
    });
    if (!confirmed) return;
    row.remove();
    if (elements.paymentRows && !elements.paymentRows.children.length && !state.paymentEditingExisting) {
      createPaymentTableRow(nextPaymentTableTarget());
    }
    syncPaymentTableSummary();
  }

  function renderPaymentTableRows(entry, options) {
    if (!elements.paymentRows) return;
    clearNode(elements.paymentRows);
    const settings = options || {};
    const paid = isEntryPaid(entry);
    const showExistingRows = paid || settings.showExisting;
    if (showExistingRows) {
      const paymentRows = Array.isArray(entry && entry.paymentRows) && entry.paymentRows.length
        ? entry.paymentRows
        : [{
          paymentDate: entry.paymentDate,
          paymentAmount: entry.paymentAmount,
          paymentSource: entry.paymentSource,
          paymentNotes: entry.paymentNotes
        }];
      paymentRows.forEach(function (paymentRow, index) {
        createPaymentTableRow(entry, {
          paid: true,
          paymentRow,
          paymentRowIndex: index,
          sourceFocused: index === state.sourcePaymentRowIndex
        });
      });
      if (elements.paymentAddRowButton) elements.paymentAddRowButton.hidden = true;
      return;
    }
    const target = state.paymentTarget && !state.paymentTarget.isAll ? state.paymentTarget : entry;
    createPaymentTableRow(target, { paid: false });
    if (elements.paymentAddRowButton) elements.paymentAddRowButton.hidden = true;
  }

  function enablePaymentEditMode() {
    if (!state.paymentEntry || !hasEntryPayments(state.paymentEntry)) return;
    state.paymentEditingExisting = true;
    if (elements.paymentModalTitle) setText(elements.paymentModalTitle, 'Ubah Pembayaran');
    if (elements.paymentModalMeta) setText(elements.paymentModalMeta, 'Perubahan akan mengganti pembayaran lama, bukan menambah pembayaran baru.');
    if (elements.paymentEditButton) elements.paymentEditButton.hidden = true;
    if (elements.paymentReverseButton) elements.paymentReverseButton.hidden = true;
    if (elements.paymentSaveButton) {
      elements.paymentSaveButton.hidden = false;
      elements.paymentSaveButton.textContent = 'Simpan Perubahan';
    }
    if (elements.paymentAddRowButton) elements.paymentAddRowButton.hidden = false;
    Array.from(elements.paymentRows ? elements.paymentRows.querySelectorAll('tr') : []).forEach(function (row) {
      const dateInput = row.querySelector('[data-hti-payment-field="date"]');
      const datePicker = row.querySelector('[data-hti-payment-field="datePicker"]');
      const sourceInput = row.querySelector('[data-hti-payment-field="source"]');
      const amountInput = row.querySelector('[data-hti-payment-field="amount"]');
      const removeButton = row.querySelector('.hti-payment-remove-row');
      const isAdvanceRow = text(row.dataset.htiPaymentSourceType).toLowerCase() === 'advance' && text(row.dataset.htiPaymentSourceKey);
      [dateInput, datePicker, amountInput, removeButton].forEach(function (input) {
        if (input) input.disabled = false;
      });
      if (sourceInput && !isAdvanceRow) sourceInput.disabled = false;
      syncPaymentTableRow(row);
    });
    const focusedRow = elements.paymentRows && elements.paymentRows.querySelector('.is-source-payment-row');
    const firstAmount = (focusedRow || elements.paymentRows)?.querySelector('[data-hti-payment-field="amount"]');
    if (firstAmount) firstAmount.focus();
  }

  function paymentTableAllocations(target, amount) {
    if (!target) return [];
    if (!target.isAll) return [{ target, amount }];
    let remaining = amount;
    const rows = [];
    state.paymentTargets.forEach(function (item) {
      if (remaining <= 0.5) return;
      const allocated = Math.min(Number(item.outstanding || 0), remaining);
      if (allocated <= 0.5) return;
      rows.push({ target: item, amount: allocated });
      remaining = Math.max(0, remaining - allocated);
    });
    return rows;
  }

  function collectPaymentTableRows() {
    const rows = Array.from(elements.paymentRows ? elements.paymentRows.querySelectorAll('tr') : []);
    const notes = text(elements.quickPaymentNotes && elements.quickPaymentNotes.value);
    const allocations = [];
    const totals = new Map();
    for (const row of rows) {
      const entrySelect = row.querySelector('[data-hti-payment-field="entry"]');
      const dateInput = row.querySelector('[data-hti-payment-field="date"]');
      const datePicker = row.querySelector('[data-hti-payment-field="datePicker"]');
      const sourceSelect = row.querySelector('[data-hti-payment-field="source"]');
      const amountInput = row.querySelector('[data-hti-payment-field="amount"]');
      const sourceType = text(row.dataset.htiPaymentSourceType).toLowerCase();
      const sourceKey = text(row.dataset.htiPaymentSourceKey);
      const isAdvanceRow = sourceType === 'advance' && sourceKey;
      normalizeDateInput(dateInput, datePicker);
      const target = paymentTargetForKey(entrySelect && entrySelect.value);
      const amount = parseAmount(amountInput && amountInput.value);
      const source = isAdvanceRow ? text(sourceSelect && sourceSelect.value, 'UANG MUKA PENJUALAN') : applyPaymentTableSourceChoice(sourceSelect);
      const paymentDate = text(dateInput && dateInput.value);
      const paymentDateIso = formattedDateToIso(paymentDate);
      const minDateIso = paymentTargetMinDateIso(target);
      if (!target && amount > 0.5) throw new Error('Pilih transaksi pembayaran.');
      if (!target || amount <= 0.5) continue;
      if (!paymentDateIso) {
        if (dateInput) dateInput.focus();
        throw new Error('Tanggal pembayaran wajib diisi dengan format DD/MM/YYYY.');
      }
      if (paymentDateIso && minDateIso && paymentDateIso < minDateIso) {
        if (dateInput) dateInput.focus();
        throw new Error('Tanggal pembayaran tidak boleh lebih awal dari tanggal invoice.');
      }
      if (!source) {
        if (sourceSelect) sourceSelect.focus();
        throw new Error('Pilih jenis bank/kas untuk pembayaran.');
      }
      const limit = paymentTargetLimit(target);
      if (amount > limit + 0.5) {
        if (amountInput) amountInput.focus();
        throw new Error('Pembayaran tidak boleh melebihi sisa piutang.');
      }
      paymentTableAllocations(target, amount).forEach(function (allocation) {
        const key = text(allocation.target.id);
        const nextTotal = (totals.get(key) || 0) + allocation.amount;
        totals.set(key, nextTotal);
        if (nextTotal > paymentTargetLimit(allocation.target) + 0.5) {
          throw new Error('Total pembayaran untuk proyek ' + text(allocation.target.projectNo, '-') + ' melebihi sisa piutang.');
        }
        allocations.push({
          target: allocation.target,
          amount: allocation.amount,
          paymentDate,
          paymentSource: source,
          paymentSourceType: isAdvanceRow ? 'advance' : '',
          paymentSourceKey: isAdvanceRow ? sourceKey : '',
          advanceId: isAdvanceRow ? sourceKey : '',
          advanceType: isAdvanceRow ? text(row.dataset.htiAdvanceType, 'sales') : '',
          paymentNotes: notes
        });
      });
    }
    return allocations;
  }

  function openPaymentModal(entry, options) {
    if (!entry || entry.totalAmount <= 0) return;
    if (isProformaEntry(entry)) {
      setAlert('Pre Order belum masuk piutang, jadi belum bisa dibayar. Catat DP lewat Input Uang Muka atau jadikan faktur dulu.', 'error');
      return;
    }
    state.paymentEditingExisting = false;
    state.paymentEntry = entry;
    state.paymentTarget = entry;
    const settings = options || {};
    renderPaymentSourceOptions(entry);
    const paid = isEntryPaid(entry);
    elements.quickPaymentDate.value = formatDate(paid
      ? (paymentBreakdown(entry).latestDate || entry.paymentDate || todayIso())
      : todayIso());
    renderQuickPaymentEntryOptions(entry);
    syncQuickPaymentEntryFields();
    renderPaymentTableRows(entry, { showExisting: Boolean(settings.editExisting) });
    resetPaymentAttachmentInput(paid
      ? 'Belum ada file dipilih. Jika upload di detail lunas, file langsung tersimpan.'
      : 'Belum ada file dipilih.');
    showPaymentModal(true);
    window.setTimeout(function () {
      const focusTarget = paid ? (elements.paymentEditButton || elements.paymentReverseButton) : elements.paymentRows?.querySelector('[data-hti-payment-field="amount"]');
      if (focusTarget) focusTarget.focus();
    }, 0);
  }

  function closePaymentModal() {
    showPaymentModal(false);
    elements.paymentForm.reset();
    elements.paymentEntryId.value = '';
    state.paymentEditingExisting = false;
    state.paymentEntry = null;
    state.paymentTarget = null;
    state.paymentTargets = [];
    state.sourcePaymentRowIndex = -1;
    if (elements.quickPaymentEntry) {
      clearNode(elements.quickPaymentEntry);
      elements.quickPaymentEntry.disabled = false;
    }
    if (elements.paymentRows) clearNode(elements.paymentRows);
    if (elements.paymentAddRowButton) elements.paymentAddRowButton.hidden = false;
    if (elements.paymentAdvanceHint) {
      elements.paymentAdvanceHint.hidden = true;
      elements.paymentAdvanceHint.textContent = '';
    }
    if (elements.paymentModalTitle) setText(elements.paymentModalTitle, 'Catat Pembayaran');
    elements.paymentReverseButton.hidden = true;
    if (elements.paymentEditButton) elements.paymentEditButton.hidden = true;
    elements.paymentSaveButton.hidden = false;
    elements.paymentSaveButton.textContent = 'Simpan Pembayaran';
    resetPaymentAttachmentInput();
    setPaymentFieldsReadOnly(false);
    elements.quickPaymentDatePicker.min = '';
    if (elements.quickPaymentAdvanceAmount) {
      elements.quickPaymentAdvanceAmount.disabled = false;
      elements.quickPaymentAdvanceAmount.readOnly = false;
      elements.quickPaymentAdvanceAmount.setCustomValidity('');
    }
    if (elements.quickPaymentUseAllAdvance) {
      elements.quickPaymentUseAllAdvance.checked = false;
      elements.quickPaymentUseAllAdvance.disabled = false;
    }
    elements.quickPaymentAmount.required = true;
    elements.quickPaymentAmount.setCustomValidity('');
    elements.quickPaymentSource.required = false;
    elements.quickPaymentAmount.readOnly = false;
    elements.quickPaymentSource.readOnly = false;
    elements.quickPaymentNotes.readOnly = false;
    syncDatePicker(elements.quickPaymentDate, elements.quickPaymentDatePicker);
    notifyEmbeddedPaymentClosed(true);
  }

  async function savePayment(event) {
    event.preventDefault();
    let paymentLines = [];
    try {
      paymentLines = collectPaymentTableRows();
    } catch (err) {
      setAlert(err.message || 'Data pembayaran belum lengkap.', 'error');
      return;
    }
    if (!paymentLines.length) {
      setAlert('Isi minimal satu baris pembayaran.', 'error');
      return;
    }
    elements.paymentSaveButton.disabled = true;
    try {
      const wasEditingPayment = Boolean(state.paymentEditingExisting);
      let latestData = null;
      const replacingEntryId = wasEditingPayment && state.paymentEntry && hasEntryPayments(state.paymentEntry)
        ? text(state.paymentEntry.id)
        : '';
      if (replacingEntryId) {
        latestData = await requestJson(apiBase() + '/entries/' + encodeURIComponent(replacingEntryId) + '/payments', {
          method: 'DELETE',
          headers: { Accept: 'application/json' }
        });
        if (latestData) applyBookData(latestData);
      }
      for (const line of paymentLines) {
        latestData = await requestJson(apiBase() + '/entries/' + encodeURIComponent(line.target.id) + '/payments', {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentDate: line.paymentDate,
            paymentAmount: line.amount,
            paymentSource: line.paymentSource,
            paymentSourceType: line.paymentSourceType,
            paymentSourceKey: line.paymentSourceKey,
            advanceId: line.advanceId,
            advanceType: line.advanceType,
            paymentNotes: line.paymentNotes,
            paymentRows: [{
              paymentDate: line.paymentDate,
              paymentAmount: line.amount,
              paymentSource: line.paymentSource,
              paymentSourceType: line.paymentSourceType,
              paymentSourceKey: line.paymentSourceKey,
              advanceId: line.advanceId,
              advanceType: line.advanceType,
              paymentNotes: line.paymentNotes
            }]
          })
        });
      }
      if (selectedUploadFiles(elements.paymentAttachmentFile).length) {
        latestData = await savePaymentAttachmentForTargets(paymentLines.map(function (line) { return line.target; }), {
          doneMessage: 'Bukti bayar tersimpan.'
        }) || latestData;
      }
      if (latestData) applyBookData(latestData);
      closePaymentModal();
      setAlert(wasEditingPayment
        ? 'Pembayaran berhasil diperbarui.'
        : (paymentLines.length > 1 ? 'Pembayaran berhasil dicatat untuk ' + paymentLines.length + ' transaksi.' : 'Pembayaran berhasil dicatat.'), 'success');
    } catch (err) {
      setAlert(err.message || 'Pembayaran gagal dicatat.', 'error');
    } finally {
      elements.paymentSaveButton.disabled = false;
    }
  }

  async function cancelPayment() {
    const entryId = text(elements.paymentEntryId.value);
    if (!entryId || !state.paymentEntry || !isEntryPaid(state.paymentEntry)) return;
    const confirmed = await window.clientPortalConfirm({
      title: 'Batalkan Pembayaran',
      meta: 'Jurnal terkait ikut dikembalikan.',
      message: 'Batalkan pembayaran ini? Jurnal pembayaran di Buku Bank/Kas juga akan dihapus.',
      cancelText: 'Batal',
      confirmText: 'Batalkan'
    });
    if (!confirmed) return;
    elements.paymentReverseButton.disabled = true;
    try {
      const data = await requestJson(apiBase() + '/entries/' + encodeURIComponent(entryId) + '/payments', {
        method: 'DELETE',
        headers: { Accept: 'application/json' }
      });
      applyBookData(data);
      closePaymentModal();
      setAlert('Pembayaran dibatalkan. Tagihan dan jurnal sudah dikembalikan.', 'success');
    } catch (err) {
      setAlert(err.message || 'Pembayaran belum bisa dibatalkan.', 'error');
    } finally {
      elements.paymentReverseButton.disabled = false;
    }
  }

  function exportRows() {
    if (!window.XLSX) {
      setAlert('Library Excel belum siap. Refresh halaman lalu coba lagi.', 'error');
      return;
    }
    const rows = filteredEntries().map(function (entry) {
      return {
        'Kode Project': entry.projectNo,
        Tanggal: entryMainDate(entry),
        'Jenis Dokumen': documentTypeLabel(entry),
        'Nama Pembeli': entry.customerName || entry.supplierName,
        DPP: entry.dpp,
        PPN: entry.ppn,
        'Jumlah Tagihan': entry.totalAmount,
        'Jumlah Terbayar': entry.paymentAmount,
        'Sisa Tagihan': entry.outstanding,
        Dokumen: entry.documentsUploaded || entry.hasAttachment ? 'Ya' : 'Belum',
        'No Invoice': entry.invoiceNo,
        'Tanggal Invoice': formatDate(entry.invoiceDate || entry.invoiceDateText),
        'No Faktur': entry.fakturNo,
        'Tanggal Faktur': formatDate(entry.fakturDate || entry.fakturDateText),
        'Kode Customer': entry.customerCode || entry.supplierNpwp,
        'NPWP/NIK': entry.customerNpwp,
        Alamat: entry.customerAddress,
        'FP Pembelian': entry.fpPurchaseNo,
        'Nama Barang': entry.itemName,
        Qty: entry.quantity,
        'Harga Satuan DPP': entry.unitPrice,
        Diskon: entry.discountAmount,
        DPP: entry.dpp,
        PPN: entry.ppn,
        Total: entry.totalAmount,
        Pelunasan: entry.paymentAmount,
        'Jenis Bank': entry.paymentSource,
        Keterangan: entry.notes
      };
    });
    const workbook = window.XLSX.utils.book_new();
    const sheet = window.XLSX.utils.json_to_sheet(rows);
    sheet['!cols'] = Object.keys(rows[0] || { Data: '' }).map(function (key) { return { wch: Math.max(14, key.length + 2) }; });
    window.XLSX.utils.book_append_sheet(workbook, sheet, 'Buku Penjualan');
    window.XLSX.writeFile(workbook, 'buku-penjualan-hti.xlsx');
  }

  async function logout() {
    if (elements.logoutButton) elements.logoutButton.disabled = true;
    try {
      const response = await fetch('/app/api/client/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      const data = await response.json().catch(function () { return {}; });
      window.location.assign(data.redirectUrl || '/app/client/login');
    } catch {
      window.location.assign('/app/client/login');
    }
  }

  async function openBookJournal() {
    if (!window.clientPortalHtiJournalPreview) {
      setAlert('Fitur lihat jurnal belum siap. Refresh halaman lalu coba lagi.', 'error');
      return;
    }
    const entries = filteredEntries();
    if (elements.bookJournalButton) elements.bookJournalButton.disabled = true;
    try {
      await window.clientPortalHtiJournalPreview.open({
        type: 'sales-book',
        entries,
        title: 'Jurnal Penjualan PT X',
        meta: entries.length + ' transaksi sesuai filter aktif. Pre Order hanya tampil sebagai jurnal uang muka.',
        emptyMessage: 'Belum ada jurnal penjualan atau uang muka Pre Order pada data yang tampil.'
      });
    } catch (err) {
      setAlert(err.message || 'Jurnal penjualan belum bisa dibuka.', 'error');
    } finally {
      if (elements.bookJournalButton) elements.bookJournalButton.disabled = false;
    }
  }

  function bindEvents() {
    elements.refreshButton.addEventListener('click', loadBook);
    elements.logoutButton.addEventListener('click', logout);
    elements.addButton.addEventListener('click', openNewModal);
    elements.exportButton.addEventListener('click', exportRows);
    if (elements.bookJournalButton) elements.bookJournalButton.addEventListener('click', openBookJournal);
    elements.advanceButton?.addEventListener('click', openAdvanceInput);
    elements.closeButton.addEventListener('click', closeModal);
    elements.entrySizeDecreaseButton.addEventListener('click', function () { changeEntryModalSize(-1); });
    elements.entrySizeIncreaseButton.addEventListener('click', function () { changeEntryModalSize(1); });
    elements.cancelButton.addEventListener('click', closeModal);
    elements.form.addEventListener('submit', saveEntry);
    if (elements.documentType) elements.documentType.addEventListener('change', syncDocumentTypeUi);
    ensureEntryJournalPreviewButton()?.addEventListener('click', previewEntryJournal);
    elements.addLineButton.addEventListener('click', function () {
      appendLine({ projectNo: lastProjectNo() });
    });
    elements.entryLines.addEventListener('input', function (event) {
      if (!event.target.matches('[data-hti-line-field]')) return;
      formatLineTypingInput(event.target);
      const row = event.target.closest('tr');
      if (row) {
        updateLineCalcSource(row, event.target.dataset.htiLineField || '');
        calculateLine(row);
        syncPaymentSourceAvailability(row);
      }
    });
    elements.entryLines.addEventListener('change', function (event) {
      if (!event.target.matches('[data-hti-line-field="projectNo"]')) return;
      callProformaFromProject(event.target.value);
    });
    elements.entryLines.addEventListener('blur', function (event) {
      if (event.target.matches('[data-hti-line-field="projectNo"]')) {
        callProformaFromProject(event.target.value);
        return;
      }
      if (!event.target.matches('[data-hti-line-field="quantity"], [data-hti-line-field="unitPrice"], [data-hti-line-field="discountAmount"], [data-hti-line-field="dpp"], [data-hti-line-field="ppn"], [data-hti-line-field="totalAmount"], [data-hti-line-field="paymentAmount"]')) return;
      if (event.target.matches('[data-hti-line-field="quantity"]')) {
        event.target.value = formatQuantity(event.target.value);
      } else {
        event.target.value = formatInputMoney(event.target.value);
      }
      const row = event.target.closest('tr');
      if (row) {
        calculateLine(row);
        syncPaymentSourceAvailability(row);
      }
    }, true);
    elements.entryLines.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' || !event.target.matches('[data-hti-line-field]')) return;
      event.preventDefault();
      const row = event.target.closest('tr');
      if (row) addLineFromCurrent(row);
    });
    elements.attachmentPickButton.addEventListener('click', function () {
      if (elements.attachmentFile) elements.attachmentFile.click();
    });
    elements.supplierNpwp.addEventListener('input', function () { syncSupplier('code'); });
    elements.supplierNpwp.addEventListener('change', function () { syncSupplier('code'); });
    elements.supplierNpwp.addEventListener('blur', function () { syncSupplier('code'); });
    elements.supplierName.addEventListener('input', function () { syncSupplier('name'); });
    elements.supplierName.addEventListener('change', function () { syncSupplier('name'); });
    elements.supplierName.addEventListener('blur', function () { syncSupplier('name'); });
    bindSupplierPicker(elements.supplierNpwp);
    bindSupplierPicker(elements.supplierName);
    elements.viewCloseButton.addEventListener('click', closeViewModal);
    elements.viewCancelButton.addEventListener('click', closeViewModal);
    if (elements.viewInvoiceButton) {
      elements.viewInvoiceButton.addEventListener('click', function () {
        openInvoiceModal(state.viewEntry);
      });
    }
    if (elements.viewConvertButton) elements.viewConvertButton.addEventListener('click', convertViewProformaToFaktur);
    elements.viewEditButton.addEventListener('click', function () {
      if (state.viewEntry && isProformaEntry(state.viewEntry) && proformaConversionInfo(state.viewEntries).isComplete) {
        promptLockedProforma(state.viewEntry);
        return;
      }
      openEditModal(state.viewEntry);
    });
    elements.viewPurchaseInputButton.addEventListener('click', function () {
      openPurchaseChoice(state.viewEntry);
    });
    elements.purchaseChoiceCloseButton.addEventListener('click', closePurchaseChoice);
    elements.purchaseChoiceCancelButton.addEventListener('click', closePurchaseChoice);
    elements.purchaseChoiceFpButton.addEventListener('click', function () {
      navigateToPurchasePage('fp');
    });
    elements.purchaseChoiceNonPpnButton.addEventListener('click', function () {
      navigateToPurchasePage('non-ppn');
    });
    elements.viewPayButton.addEventListener('click', function () {
      const entry = state.viewEntry;
      closeViewModal();
      openPaymentModal(entry);
    });
    elements.viewDeleteButton.addEventListener('click', function () {
      if (state.viewEntry && isProformaEntry(state.viewEntry) && proformaConversionInfo(state.viewEntries).isComplete) {
        promptLockedProforma(state.viewEntry);
        return;
      }
      deleteViewEntry();
    });
    elements.viewAttachmentPickButton.addEventListener('click', function () {
      if (elements.viewAttachmentFile) elements.viewAttachmentFile.click();
    });
    elements.viewAttachmentFile.addEventListener('change', saveViewAttachment);
    elements.viewAttachmentFile.addEventListener('client-portal-upload-files', saveViewAttachment);
    elements.fileCloseButton.addEventListener('click', closeFileModal);
    elements.fileCancelButton.addEventListener('click', closeFileModal);
    if (elements.invoiceCloseButton) elements.invoiceCloseButton.addEventListener('click', closeInvoiceModal);
    if (elements.invoiceCancelButton) elements.invoiceCancelButton.addEventListener('click', closeInvoiceModal);
    if (elements.invoicePrintButton) elements.invoicePrintButton.addEventListener('click', printInvoice);
    if (elements.invoiceType) elements.invoiceType.addEventListener('change', renderInvoicePreview);
    if (elements.invoiceBank) elements.invoiceBank.addEventListener('change', renderInvoicePreview);
    elements.paymentCloseButton.addEventListener('click', closePaymentModal);
    elements.paymentCancelButton.addEventListener('click', closePaymentModal);
    if (elements.paymentEditButton) elements.paymentEditButton.addEventListener('click', enablePaymentEditMode);
    elements.paymentReverseButton.addEventListener('click', cancelPayment);
    elements.paymentForm.addEventListener('submit', savePayment);
    if (elements.paymentAttachmentPickButton) {
      elements.paymentAttachmentPickButton.addEventListener('click', function () {
        if (elements.paymentAttachmentFile) elements.paymentAttachmentFile.click();
      });
    }
    if (elements.paymentAttachmentFile) {
      elements.paymentAttachmentFile.addEventListener('change', savePaymentAttachmentOnly);
      elements.paymentAttachmentFile.addEventListener('client-portal-upload-files', savePaymentAttachmentOnly);
    }
    if (elements.paymentAddRowButton) {
      elements.paymentAddRowButton.addEventListener('click', function () {
        const row = createPaymentTableRow(nextPaymentTableTarget());
        window.setTimeout(function () {
          const input = row && row.querySelector('[data-hti-payment-field="entry"]');
          if (input) input.focus();
        }, 0);
      });
    }
    if (elements.quickPaymentEntry) elements.quickPaymentEntry.addEventListener('change', syncQuickPaymentEntryFields);
    [elements.projectFilter, elements.statusFilter, elements.documentFilter].forEach(function (input) {
      if (!input) return;
      input.addEventListener('change', renderRows);
    });
    elements.searchInput.addEventListener('input', renderRows);
    bindSortableHeaders();
    if (elements.quickPaymentAdvanceAmount) {
      elements.quickPaymentUseAllAdvance?.addEventListener('change', function () {
        if (!elements.quickPaymentUseAllAdvance.checked) {
          elements.quickPaymentAdvanceAmount.readOnly = false;
          elements.quickPaymentAdvanceAmount.value = '';
        }
        syncPaymentSplit({ adjustCash: true });
        if (elements.quickPaymentUseAllAdvance.checked) elements.quickPaymentAmount.focus();
      });
      elements.quickPaymentAdvanceAmount.addEventListener('input', function () {
        formatTypingValue(elements.quickPaymentAdvanceAmount, formatMoneyTyping);
        syncPaymentSplit({ adjustCash: true });
      });
      elements.quickPaymentAdvanceAmount.addEventListener('blur', function () {
        elements.quickPaymentAdvanceAmount.value = formatInputMoney(elements.quickPaymentAdvanceAmount.value);
        syncPaymentSplit({ adjustCash: true });
      });
    }
    elements.quickPaymentAmount.addEventListener('input', function () {
      formatTypingValue(elements.quickPaymentAmount, formatMoneyTyping);
      syncPaymentSplit();
    });
    elements.quickPaymentAmount.addEventListener('blur', function () {
      elements.quickPaymentAmount.value = formatInputMoney(elements.quickPaymentAmount.value);
      syncPaymentSplit();
    });
    dateControls().forEach(function (pair) {
      bindDateControl(pair[0], pair[1]);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (elements.invoiceModal && !elements.invoiceModal.hidden) closeInvoiceModal();
      else if (!elements.fileModal.hidden) closeFileModal();
      else if (!elements.paymentModal.hidden) closePaymentModal();
      else if (elements.purchaseChoiceModal && !elements.purchaseChoiceModal.hidden) closePurchaseChoice();
      else if (!elements.viewModal.hidden) closeViewModal();
      else if (!elements.modal.hidden) closeModal();
    });
  }

  bindEvents();
  renameQrButtons();
  window.setTimeout(renameQrButtons, 0);
  loadBook();
})();
