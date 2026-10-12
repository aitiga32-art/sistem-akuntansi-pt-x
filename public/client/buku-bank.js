(function () {
  const state = {
    client: null,
    banks: [],
    activeBank: null,
    coaAccounts: [],
    entries: [],
    advances: [],
    advanceParties: { suppliers: [], customers: [] },
    advanceEntryDoor: '',
    htiTransferMode: 'transfer-antar-bank',
    htiBankInterestId: '',
    htiBankInterestSnapshot: '',
    taxOptions: [],
    posting: null,
    selectedIds: new Set(),
    searchQuery: '',
    loading: false,
    modalWindowBound: false,
    modalDrag: null,
    sort: null
  };

  const elements = {
    alert: document.getElementById('bukuBankAlert'),
    clientMeta: document.getElementById('bukuBankClientMeta'),
    userName: document.getElementById('bukuBankUserName'),
    userEmail: document.getElementById('bukuBankUserEmail'),
    refreshButton: document.getElementById('bukuBankRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('bukuBankBackLink'),
    subtitle: document.getElementById('bukuBankSubtitle'),
    tabs: document.getElementById('bukuBankTabs'),
    addButton: document.getElementById('bukuBankAddBtn'),
    withdrawButton: document.getElementById('bukuBankWithdrawBtn'),
    transferButton: document.getElementById('bukuBankTransferBtn'),
    interestButton: document.getElementById('bukuBankInterestBtn'),
    mutationButton: document.getElementById('bukuBankMutationBtn'),
    advanceButton: document.getElementById('bukuBankAdvanceBtn'),
    exportButton: document.getElementById('bukuBankExportBtn'),
    templateButton: document.getElementById('bukuBankTemplateBtn'),
    importButton: document.getElementById('bukuBankImportBtn'),
    importFile: document.getElementById('bukuBankImportFile'),
    deleteSelectedButton: document.getElementById('bukuBankDeleteSelectedBtn'),
    searchInput: document.getElementById('bukuBankSearchInput'),
    selectAll: document.getElementById('bukuBankSelectAll'),
    totalMasuk: document.getElementById('bukuBankTotalMasuk'),
    totalKeluar: document.getElementById('bukuBankTotalKeluar'),
    totalSaldo: document.getElementById('bukuBankTotalSaldo'),
    rows: document.getElementById('bukuBankRows'),
    modal: document.getElementById('bukuBankModal'),
    form: document.getElementById('bukuBankForm'),
    modalTitle: document.getElementById('bukuBankModalTitle'),
    modalMeta: document.getElementById('bukuBankModalMeta'),
    closeButton: document.getElementById('bukuBankCloseBtn'),
    cancelButton: document.getElementById('bukuBankCancelBtn'),
    saveButton: document.getElementById('bukuBankSaveBtn'),
    entryId: document.getElementById('bukuBankEntryId'),
    detailRows: document.getElementById('bukuBankDetailRows'),
    addDetailRowButton: document.getElementById('bukuBankAddRowBtn'),
    attachmentFile: document.getElementById('bukuBankAttachmentFile'),
    attachmentNote: document.getElementById('bukuBankAttachmentNote'),
    fileModal: document.getElementById('bukuBankFileModal'),
    fileTitle: document.getElementById('bukuBankFileTitle'),
    fileMeta: document.getElementById('bukuBankFileMeta'),
    fileViewer: document.getElementById('bukuBankFileViewer'),
    fileCloseButton: document.getElementById('bukuBankFileCloseBtn')
  };
  elements.advanceModal = document.getElementById('bukuBankAdvanceModal');
  elements.advanceForm = document.getElementById('bukuBankAdvanceForm');
  elements.advanceTitle = document.getElementById('bukuBankAdvanceTitle');
  elements.advanceMeta = document.getElementById('bukuBankAdvanceMeta');
  elements.advanceCloseButton = document.getElementById('bukuBankAdvanceCloseBtn');
  elements.advanceCancelButton = document.getElementById('bukuBankAdvanceCancelBtn');
  elements.advanceSaveButton = document.getElementById('bukuBankAdvanceSaveBtn');
  elements.advanceSource = document.getElementById('htiAdvanceSource');
  elements.advanceType = document.getElementById('htiAdvanceType');
  elements.advanceDate = document.getElementById('htiAdvanceDate');
  elements.advanceProject = document.getElementById('htiAdvanceProject');
  elements.advancePartyCode = document.getElementById('htiAdvancePartyCode');
  elements.advanceParty = document.getElementById('htiAdvanceParty');
  elements.advanceAmount = document.getElementById('htiAdvanceAmount');
  elements.advanceDescription = document.getElementById('htiAdvanceDescription');
  elements.advanceFile = document.getElementById('htiAdvanceFile');
  elements.advanceAttachmentNote = document.getElementById('htiAdvanceAttachmentNote');
  elements.advancePartyCodeLabel = document.getElementById('htiAdvancePartyCodeLabel');
  elements.advancePartyLabel = document.getElementById('htiAdvancePartyLabel');
  elements.transferModal = document.getElementById('bukuBankTransferModal');
  elements.transferForm = document.getElementById('bukuBankTransferForm');
  elements.transferTitle = document.getElementById('bukuBankTransferTitle');
  elements.transferMeta = document.getElementById('bukuBankTransferMeta');
  elements.transferCloseButton = document.getElementById('bukuBankTransferCloseBtn');
  elements.transferCancelButton = document.getElementById('bukuBankTransferCancelBtn');
  elements.transferSaveButton = document.getElementById('bukuBankTransferSaveBtn');
  elements.transferDate = document.getElementById('htiBankTransferDate');
  elements.transferFrom = document.getElementById('htiBankTransferFrom');
  elements.transferTo = document.getElementById('htiBankTransferTo');
  elements.transferAmount = document.getElementById('htiBankTransferAmount');
  elements.transferFee = document.getElementById('htiBankTransferFee');
  elements.transferFeeAccount = document.getElementById('htiBankTransferFeeAccount');
  elements.transferFile = document.getElementById('htiBankTransferFile');
  elements.transferAttachmentNote = document.getElementById('htiBankTransferAttachmentNote');
  elements.interestModal = document.getElementById('bukuBankInterestModal');
  elements.interestForm = document.getElementById('bukuBankInterestForm');
  elements.interestTitle = document.getElementById('bukuBankInterestTitle');
  elements.interestMeta = document.getElementById('bukuBankInterestMeta');
  elements.interestCloseButton = document.getElementById('bukuBankInterestCloseBtn');
  elements.interestCancelButton = document.getElementById('bukuBankInterestCancelBtn');
  elements.interestSaveButton = document.getElementById('bukuBankInterestSaveBtn');
  elements.interestDeleteButton = document.getElementById('bukuBankInterestDeleteBtn');
  elements.interestDate = document.getElementById('htiBankInterestDate');
  elements.interestBank = document.getElementById('htiBankInterestBank');
  elements.interestIncomeAccount = document.getElementById('htiBankInterestIncomeAccount');
  elements.interestIncomeAmount = document.getElementById('htiBankInterestIncomeAmount');
  elements.interestAdminAccount = document.getElementById('htiBankInterestAdminAccount');
  elements.interestAdminAmount = document.getElementById('htiBankInterestAdminAmount');
  elements.interestFeeRows = document.getElementById('htiBankInterestFeeRows');
  elements.interestFile = document.getElementById('htiBankInterestAttachmentFile');
  elements.interestAttachmentPickButton = document.getElementById('htiBankInterestAttachmentPickBtn');
  elements.interestAttachmentNote = document.getElementById('htiBankInterestAttachmentNote');
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
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/buku-bank/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/buku-bank';
  }

  function activeBankKey() {
    return text(state.activeBank?.key) || text(new URLSearchParams(window.location.search).get('bank'));
  }

  function isTbbClient() {
    return /tiga\s+belas\s+bersaudara/i.test(text(state.client?.name)) || activeBankKey().indexOf('tbb-') === 0;
  }

  function isHtiClient() {
    const clientName = text(state.client?.name).toUpperCase();
    return clientName === 'PT X' || /PT\s*X/.test(clientName) || activeBankKey().indexOf('hti-') === 0;
  }

  function isAllowedHtiAdvanceEntryDoor(value) {
    return [
      'hti-buku-penjualan',
      'hti-buku-pembelian-fp',
      'hti-buku-pembelian-non-ppn'
    ].includes(text(value).toLowerCase());
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

  function isHtiAdvance(entry) {
    return Boolean(entry && entry.isHtiAdvance && entry.advanceId);
  }

  function isHtiExpense(entry) {
    return Boolean(entry && entry.isHtiExpense && entry.htiExpenseId);
  }

  function isHtiBankInterest(entry) {
    return Boolean(entry && entry.isHtiBankInterest && text(entry.htiBankInterestId));
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

  function isHtiTfGabMirror(entry) {
    return isHtiPaymentMirror(entry) && /(?:^|\|)\s*TF\s*GAB\s*:/i.test(entryDescription(entry));
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
    if (text(entry.bankKey || activeBankKey())) url.searchParams.set('paymentSourceKey', text(entry.bankKey || activeBankKey()));
    if (text(state.activeBank && state.activeBank.label)) url.searchParams.set('paymentSource', text(state.activeBank.label));
    if (text(entry && entry.mirrorSourceDetailKey)) {
      url.searchParams.set('paymentRow', text(entry.mirrorSourceDetailKey));
    }
    return url.pathname + url.search;
  }

  function tbbBookOptionsHtml(selectedValue) {
    const selected = text(selectedValue, activeBankKey());
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
    let wrapper = document.getElementById('bukuBankTbbBookSwitchField');
    if (!isTbbClient()) {
      if (wrapper) wrapper.remove();
      return;
    }
    if (!wrapper) {
      wrapper = document.createElement('label');
      wrapper.className = 'form-field full';
      wrapper.id = 'bukuBankTbbBookSwitchField';
      wrapper.innerHTML = '<span>Jenis Bank</span><select id="bukuBankTbbBookSwitch"></select>';
      grid.insertBefore(wrapper, grid.firstChild);
      wrapper.querySelector('select').addEventListener('change', function (event) {
        const value = event.target.value;
        if (value === activeBankKey()) return;
        if (!state.client?.id) return;
        if (value === 'tbb-kas') {
          window.location.assign('/app/client/clients/' + encodeURIComponent(state.client.id) + '/buku-kas?cash=tbb-kas');
          return;
        }
        window.location.assign('/app/client/clients/' + encodeURIComponent(state.client.id) + '/buku-bank?bank=' + encodeURIComponent(value));
      });
    }
    wrapper.querySelector('select').innerHTML = tbbBookOptionsHtml(activeBankKey());
  }

  function removeTbbBookSwitch() {
    const wrapper = document.getElementById('bukuBankTbbBookSwitchField');
    if (wrapper) wrapper.remove();
  }

  function tbbBankSourceAccount() {
    return {
      coa: text(state.activeBank?.sourceCoa, activeBankKey() === 'tbb-bank-bca-fetty' ? '1-0202' : '1-0201'),
      accountName: text(state.activeBank?.sourceAccountName, activeBankKey() === 'tbb-bank-bca-fetty' ? 'BANK BCA CabangContoh' : 'BANK BCA')
    };
  }

  function tbbBankBookLabel() {
    return text(state.activeBank?.label, activeBankKey() === 'tbb-bank-bca-fetty' ? 'BANK BCA CabangContoh' : 'BANK BCA');
  }

  function tbbBankBookCode() {
    const source = tbbBankSourceAccount();
    return text(source.coa) + ' - ' + text(source.accountName);
  }

  function apiListUrl() {
    const key = activeBankKey();
    return apiBase() + (key ? '?bank=' + encodeURIComponent(key) : '');
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Buku Bank.');
    return data;
  }

  async function loadBukuBank(bankKey) {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (bankKey) state.activeBank = { key: bankKey };
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiListUrl());
      if (!data) return;
      if (shouldAutoOpenLatestHtiPeriod(data)) {
        const url = new URL(window.location.href);
        const latestYear = Math.max.apply(null, data.availableYears.map(function (year) {
          return Number(year);
        }));
        url.searchParams.set('year', String(latestYear));
        url.searchParams.set('month', '0');
        window.location.replace(url.pathname + url.search);
        return;
      }
      renderShell(data);
      state.client = data.client || null;
      state.banks = Array.isArray(data.banks) ? data.banks : [];
      state.activeBank = data.activeBank || state.banks[0] || null;
      state.coaAccounts = Array.isArray(data.coaAccounts) ? data.coaAccounts : [];
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.advances = Array.isArray(data.advances) ? data.advances : [];
      state.advanceParties = data.advanceParties || { suppliers: [], customers: [] };
      state.taxOptions = Array.isArray(data.taxOptions) ? data.taxOptions : [];
      state.posting = data.posting || null;
      state.selectedIds.clear();
      renderClient();
      renderTabs();
      renderSelects();
      renderAdvanceSourceOptions(new URLSearchParams(window.location.search).get('source') || activeBankKey());
      syncSearchInput();
      renderRows();
      const params = new URLSearchParams(window.location.search);
      const openAdvance = params.get('openAdvance') === '1';
      const htiMode = params.get('mode');
      state.advanceEntryDoor = text(params.get('entryDoor') || params.get('advanceDoor'));
      if (openAdvance && isHtiClient()) {
        const url = new URL(window.location.href);
        url.searchParams.delete('openAdvance');
        url.searchParams.delete('entryDoor');
        url.searchParams.delete('advanceDoor');
        window.history.replaceState({}, '', url.pathname + url.search);
        if (isAllowedHtiAdvanceEntryDoor(state.advanceEntryDoor)) {
          openAdvanceCreateModal();
        } else {
          setAlert('Input uang muka dibuka dari Buku Penjualan atau Buku Pembelian agar jalurnya tetap satu pintu.', 'error');
        }
      }
      if (isHtiClient() && (htiMode === 'tarik-tunai' || htiMode === 'transfer-antar-bank' || htiMode === 'bunga-biaya-bank')) {
        const url = new URL(window.location.href);
        url.searchParams.delete('mode');
        window.history.replaceState({}, '', url.pathname + url.search);
        if (htiMode === 'bunga-biaya-bank') openHtiBankInterestModal();
        else openHtiBankTransferModal(htiMode);
      }
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Buku Bank.', 'error');
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

  function shouldAutoOpenLatestHtiPeriod(data) {
    const params = new URLSearchParams(window.location.search);
    if (params.has('year') || params.has('month')) return false;
    const activeKey = text(data.activeBank?.key, activeBankKey());
    if (activeKey.indexOf('hti-') !== 0) return false;
    if (!Array.isArray(data.availableYears) || !data.availableYears.length) return false;
    return data.availableYears.some(function (year) {
      return Number.isInteger(Number(year)) && Number(year) >= 1900;
    });
  }

  function resetHtiBankTableSizing() {
    if (isTbbClient()) return;
    document.querySelectorAll('table.bankbook-table').forEach(function (table) {
      table.style.width = '';
      table.style.minWidth = '';
      table.removeAttribute('data-client-resizable-columns');
      table.classList.remove('client-resizable-table', 'client-table-is-resizing');
      table.querySelectorAll(':scope > colgroup[data-client-resize-colgroup="true"]').forEach(function (colgroup) {
        colgroup.remove();
      });
      table.querySelectorAll('.client-col-resize-handle').forEach(function (handle) {
        handle.remove();
      });
      table.querySelectorAll('.client-resizable-column-head').forEach(function (header) {
        header.classList.remove('client-resizable-column-head');
        if (header.dataset.clientResizePositionWasStatic === '1') {
          header.style.position = '';
          delete header.dataset.clientResizePositionWasStatic;
        }
      });
    });
  }

  function renderClient() {
    const client = state.client || {};
    const bankName = text(state.activeBank?.label, 'Bank');
    document.body.classList.toggle('is-tbb-cashbook', isTbbClient());
    document.body.classList.toggle('is-hti-bankbook', isHtiClient());
    if (elements.addButton) elements.addButton.hidden = isHtiClient();
    if (elements.withdrawButton) elements.withdrawButton.hidden = !isHtiClient();
    if (elements.transferButton) elements.transferButton.hidden = !isHtiClient();
    if (elements.interestButton) elements.interestButton.hidden = !isHtiClient();
    if (elements.mutationButton) elements.mutationButton.hidden = !isHtiClient();
    if (elements.deleteSelectedButton) elements.deleteSelectedButton.hidden = isHtiClient();
    if (elements.advanceButton) elements.advanceButton.hidden = true;
    resetHtiBankTableSizing();
    applyAmountLabels();
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.subtitle, isHtiClient()
      ? text(client.name, 'Klien') + ' | ' + bankName + ' | Cek mutasi dan workflow kas/bank terkontrol'
      : text(client.name, 'Klien') + ' | ' + bankName + ' | Database COA dan Buku Bank client portal');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function renderTabs() {
    clearNode(elements.tabs);
    state.banks.forEach(function (bank) {
      const link = document.createElement('a');
      const url = new URL(window.location.href);
      url.searchParams.set('bank', bank.key);
      link.href = url.pathname + url.search;
      link.className = 'bankbook-tab';
      link.dataset.tone = bank.tone || 'green';
      link.textContent = bank.label;
      link.setAttribute('aria-pressed', bank.key === state.activeBank?.key ? 'true' : 'false');
      if (bank.key === state.activeBank?.key) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      link.addEventListener('click', function (event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        window.history.replaceState({}, '', link.href);
        state.selectedIds.clear();
        loadBukuBank(bank.key);
      });
      elements.tabs.appendChild(link);
    });
  }

  function renderSelects() {
    // Pajak pada Buku Bank ditampilkan per baris, jadi tidak lagi memakai
    // satu select global seperti form lama.
  }

  function bankAccountByValue(value) {
    const normalized = text(value).toLowerCase();
    return state.coaAccounts.find(function (account) {
      return text(account.coa).toLowerCase() === normalized ||
        text(account.accountName).toLowerCase() === normalized;
    }) || null;
  }

  function bankAccountOptions(selectedValue, mode) {
    const selectedAccount = bankAccountByValue(selectedValue);
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

  function bankTaxOptions(selectedValue) {
    const selected = text(selectedValue);
    return ['<option value="">-</option>'].concat(state.taxOptions.map(function (tax) {
      return '<option value="' + escapeHtml(tax) + '"' +
        (tax === selected ? ' selected' : '') + '>' + escapeHtml(tax) + '</option>';
    })).join('');
  }

  function bankDetailDateValue(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : raw;
  }

  function bankDetailRowHtml(entry) {
    const row = entry || {};
    const account = bankAccountByValue(row.coa || row.accountName);
    const coa = text(account?.coa, row.coa);
    return '<tr class="bankbook-detail-row">' +
      '<td><input data-bank-detail-field="tanggal" type="date" value="' + escapeHtml(bankDetailDateValue(row.tanggal)) + '" aria-label="Tanggal"></td>' +
      '<td><select data-bank-detail-field="coa" aria-label="Nomor akun">' + bankAccountOptions(coa, 'coa') + '</select></td>' +
      '<td><select data-bank-detail-field="accountName" aria-label="Nama akun">' + bankAccountOptions(coa, 'name') + '</select></td>' +
      '<td><input data-bank-detail-field="keterangan" type="text" value="' + escapeHtml(row.keterangan || row.description || '') + '" autocomplete="off" aria-label="Keterangan"></td>' +
      '<td><input data-bank-detail-field="uangMasuk" type="text" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatAmount(row.uangMasuk)) + '" autocomplete="off" aria-label="Uang masuk"></td>' +
      '<td><input data-bank-detail-field="uangKeluar" type="text" inputmode="decimal" data-rupiah="true" value="' + escapeHtml(formatAmount(row.uangKeluar)) + '" autocomplete="off" aria-label="Uang keluar"></td>' +
      '<td><select data-bank-detail-field="pajak" aria-label="Pajak">' + bankTaxOptions(row.pajak) + '</select></td>' +
      '<td class="bankbook-detail-action"><button class="icon-button" type="button" data-bank-detail-remove aria-label="Hapus baris" title="Hapus baris">' +
        '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
      '</button></td>' +
      '</tr>';
  }

  function appendBankDetailRow(values) {
    if (!elements.detailRows) return null;
    const template = document.createElement('template');
    template.innerHTML = bankDetailRowHtml(values || { tanggal: today() });
    const row = template.content.firstElementChild;
    elements.detailRows.appendChild(row);
    row.querySelectorAll('[data-bank-detail-field="coa"], [data-bank-detail-field="accountName"]').forEach(function (control) {
      control.addEventListener('change', function () {
        syncBankDetailAccount(row, control.value);
      });
    });
    return row;
  }

  function resetBankDetailRows(entry) {
    clearNode(elements.detailRows);
    appendBankDetailRow(entry || { tanggal: today() });
  }

  function syncBankDetailAccount(row, value, source) {
    if (!row) return;
    const account = bankAccountByValue(value);
    const coaSelect = row.querySelector('[data-bank-detail-field="coa"]');
    const nameSelect = row.querySelector('[data-bank-detail-field="accountName"]');
    const selectedCoa = text(account?.coa, value);
    if (coaSelect) coaSelect.value = selectedCoa;
    if (nameSelect) nameSelect.value = selectedCoa;
  }

  function collectBankDetailRows() {
    return Array.from(elements.detailRows?.querySelectorAll('.bankbook-detail-row') || [])
      .map(function (row, index) {
        const field = function (name) {
          return row.querySelector('[data-bank-detail-field="' + name + '"]');
        };
        const coa = text(field('coa')?.value);
        const account = bankAccountByValue(coa || field('accountName')?.value);
        const uangMasuk = parseAmountInput(field('uangMasuk'));
        const uangKeluar = parseAmountInput(field('uangKeluar'));
        return {
          rowNumber: index + 1,
          tanggal: text(field('tanggal')?.value),
          coa: text(account?.coa, coa),
          accountName: text(account?.accountName),
          keterangan: text(field('keterangan')?.value),
          uangMasuk,
          uangKeluar,
          pajak: text(field('pajak')?.value)
        };
      })
      .filter(function (row) {
        return text(row.coa) || text(row.keterangan) || row.uangMasuk || row.uangKeluar || text(row.pajak);
      });
  }

  function renderRows() {
    clearNode(elements.rows);
    const entries = sortedEntries(visibleEntries());
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
      keterangan: entryDescription(entry),
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
      header.setAttribute('data-bank-sort-key', key);
      header.setAttribute('tabindex', '0');
      header.classList.add('client-sortable-head');
      header.title = 'Klik untuk sort data';
    });
    updateSortHeaderState();
  }

  function updateSortHeaderState() {
    document.querySelectorAll('[data-bank-sort-key]').forEach(function (header) {
      const active = state.sort && state.sort.key === header.getAttribute('data-bank-sort-key');
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
    row.appendChild(cellWithTitle(entryDescription(entry)));
    row.appendChild(cell(formatAmount(entry.uangMasuk), 'number'));
    row.appendChild(cell(formatAmount(entry.uangKeluar), 'number'));
    row.appendChild(cell(formatAmount(entry.saldo), 'number'));
    row.appendChild(taxCell(entry));
    row.appendChild(documentStatusCell(entry));

    const actionCell = document.createElement('td');
    actionCell.className = 'cashbook-actions';
    const canDeleteMirror = canDeleteTbbMirrorSource(entry);
    const canEditMirror = isHtiPaymentMirror(entry) || isHtiAdvance(entry);
    const autoMirrorReason = isHtiAdvance(entry)
      ? 'Uang muka dikelola dari data uang muka agar jurnal dan detailnya tetap terhubung.'
      : canDeleteMirror
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
      if (guardPostedEntry(entry, 'mengubah')) return;
      if (isHtiAdvance(entry)) openAdvanceEditModal(entry);
      else openEditModal(entry);
    }, entry.isAutoMirror && !canEditMirror, '', autoMirrorReason, isEntryPosted(entry)));
    if (entry.hasAttachment) {
      actionCell.appendChild(actionButton('Lihat', function () {
        openFileViewer(entry);
      }));
    }
    actionCell.appendChild(actionButton('Hapus', function () {
      if (guardPostedEntry(entry, 'menghapus')) return;
      deleteEntry(entry);
    }, entry.isAutoMirror && !canDeleteMirror, 'danger', autoMirrorReason, isEntryPosted(entry)));
    row.appendChild(actionCell);
    return row;
  }

  function blankRow() {
    const row = document.createElement('tr');
    row.appendChild(cell('', 'sales-select-cell'));
    row.appendChild(cell('', 'client-entity-column'));
    for (let index = 0; index < 7; index += 1) {
      row.appendChild(cell(''));
    }
    row.appendChild(taxCell(null, true));
    row.appendChild(cell('', 'bankbook-document-cell'));
    row.appendChild(cell('', 'cashbook-actions'));
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
    if (isHtiClient()) checkbox.title = 'Mutasi PT X hanya lihat. Koreksi dilakukan dari transaksi sumber.';
    else if (entry.isAutoMirror) checkbox.title = 'Data otomatis dari lawan jurnal. Ubah atau hapus data sumbernya.';
    checkbox.checked = state.selectedIds.has(text(entry.id));
    checkbox.setAttribute('aria-label', 'Pilih data Buku Bank ' + text(entry.tanggal, entry.coa));
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

  function actionButton(label, onClick, disabled, variant, disabledReason, periodLocked) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cashbook-action-button' + (variant ? ' ' + variant : '');
    button.textContent = label;
    button.disabled = Boolean(disabled);
    if (disabled) button.title = disabledReason || 'Aksi tidak tersedia.';
    if (!disabled && periodLocked) {
      button.classList.add('period-locked-action');
      button.title = postedEntryMessage(null, label.toLowerCase());
    }
    if (onClick) button.addEventListener('click', onClick);
    return button;
  }

  function renderHeaderTotals() {
    const entries = visibleEntries();
    const totalMasuk = entries.reduce(function (total, entry) {
      return total + Number(entry.uangMasuk || 0);
    }, 0);
    const totalKeluar = entries.reduce(function (total, entry) {
      return total + Number(entry.uangKeluar || 0);
    }, 0);
    const lastEntry = entries[entries.length - 1] || {};
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
      const visibleIds = visibleEntryIds();
      const selectedVisibleCount = visibleIds.filter(function (id) {
        return state.selectedIds.has(id);
      }).length;
      const selectableCount = visibleIds.length;
      elements.selectAll.checked = selectableCount > 0 && selectedVisibleCount === selectableCount;
      elements.selectAll.indeterminate = selectedVisibleCount > 0 && selectedVisibleCount < selectableCount;
      elements.selectAll.disabled = selectableCount === 0;
    }
  }

  function toggleSelectAll() {
    if (!elements.selectAll) return;
    visibleEntryIds().forEach(function (id) {
      state.selectedIds.delete(id);
    });
    if (elements.selectAll.checked) {
      visibleEntryIds().forEach(function (id) {
        state.selectedIds.add(id);
      });
    }
    renderRows();
  }

  function syncSearchInput() {
    if (elements.searchInput && elements.searchInput.value !== state.searchQuery) {
      elements.searchInput.value = state.searchQuery;
    }
  }

  function visibleEntries() {
    if (!state.searchQuery) return state.entries;
    return state.entries.filter(matchesSearch);
  }

  function visibleEntryIds() {
    if (isHtiClient()) return [];
    return visibleEntries().filter(function (entry) {
      return !entry.isAutoMirror;
    }).map(function (entry) {
      return text(entry.id);
    }).filter(Boolean);
  }

  function matchesSearch(entry) {
    const query = state.searchQuery;
    if (!query) return true;
    const haystack = [
      entry.tanggal,
      entry.coa,
      entry.accountName,
      entry.keterangan,
      entryDescription(entry),
      entry.uangMasuk,
      formatAmount(entry.uangMasuk),
      entry.uangKeluar,
      formatAmount(entry.uangKeluar),
      entry.saldo,
      formatAmount(entry.saldo),
      entry.pajak,
      entry.advanceProjectNo,
      entry.advancePartyCode,
      entry.advancePartyName,
      entry.advanceType
    ].map(function (value) {
      return text(value).toLowerCase();
    }).join(' ');
    return haystack.indexOf(query) >= 0;
  }

  function handleSearchInput() {
    state.searchQuery = text(elements.searchInput && elements.searchInput.value).toLowerCase();
    state.selectedIds.clear();
    renderRows();
  }

  function taxCell(entry, disabled) {
    const td = document.createElement('td');
    const select = document.createElement('select');
    select.className = 'cashbook-tax-select';
    select.disabled = Boolean(disabled || !entry || entry.isAutoMirror || isHtiAdvance(entry) || isHtiClient());
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
        if (guardPostedEntry(entry, 'mengubah pilihan pajak')) {
          select.value = entry.pajak || '';
          return;
        }
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

  function parseAmountInput(input) {
    const value = input && input.value != null ? input.value : input;
    if (window.clientParseMoneyInput) return window.clientParseMoneyInput(value);
    if (value == null || value === '') return 0;
    const cleaned = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : 0;
  }

  function debitCreditLabelForAmounts(uangMasuk, uangKeluar) {
    const moneyIn = parseAmountInput(uangMasuk);
    const moneyOut = parseAmountInput(uangKeluar);
    if (moneyIn > 0 && moneyOut <= 0) return 'DEBET';
    if (moneyOut > 0 && moneyIn <= 0) return 'KREDIT';
    return '';
  }

  function normalizeDebitCreditDescription(description, uangMasuk, uangKeluar) {
    const label = debitCreditLabelForAmounts(uangMasuk, uangKeluar);
    const value = text(description);
    if (!label || !/^(debet|kredit)\b/i.test(value)) return value;
    return value.replace(/^(debet|kredit)(\s*[-:|]\s*|\s+)?/i, function (match, _oldLabel, separator) {
      if (separator) return label + separator;
      return label + '-';
    });
  }

  function entryDescription(entry) {
    return normalizeDebitCreditDescription(entry?.keterangan, entry?.uangMasuk, entry?.uangKeluar);
  }

  function entryPeriodParts(entry) {
    const raw = text(entry?.tanggal);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (!match) return null;
    return {
      year: Number(match[1]),
      month: Number(match[2])
    };
  }

  function postedMonthsForCurrentYear() {
    return Array.isArray(state.posting?.postedMonths)
      ? state.posting.postedMonths.map(Number).filter(function (month) {
        return month >= 1 && month <= 12;
      })
      : [];
  }

  function isEntryPosted(entry) {
    const parts = entryPeriodParts(entry);
    if (!parts) return false;
    const postingYear = Number(state.posting?.year || parts.year);
    if (postingYear && parts.year !== postingYear) return false;
    if (state.posting?.isPosted && Number(state.posting.month) === parts.month) return true;
    return postedMonthsForCurrentYear().includes(parts.month);
  }

  function formatPostedPeriodLabel(parts) {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthName = monthNames[Math.max(0, Math.min(11, Number(parts?.month || 1) - 1))] || 'Periode';
    return monthName + ' ' + (parts?.year || '');
  }

  function postedEntryMessage(entry, action) {
    const parts = entryPeriodParts(entry);
    const periodText = parts ? formatPostedPeriodLabel(parts) : 'Periode ini';
    return periodText + ' sudah diposting. De-posting dulu sebelum ' + (action || 'mengubah') + ' data.';
  }

  function guardPostedEntry(entry, action) {
    if (!isEntryPosted(entry)) return false;
    const message = postedEntryMessage(entry, action);
    setAlert(message, 'error');
    if (window.clientPortalShowMessage) {
      window.clientPortalShowMessage(message, {
        title: 'Periode Sudah Diposting',
        meta: 'Posting Periode'
      });
    }
    return true;
  }

  function formatFileSize(value) {
    const size = Number(value || 0);
    if (!size) return '0 KB';
    if (size < 1024 * 1024) return Math.max(1, Math.round(size / 1024)) + ' KB';
    return (size / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB';
  }

  function csvEscape(value) {
    const output = value == null ? '' : String(value);
    return /[",\r\n;]/.test(output) ? '"' + output.replace(/"/g, '""') + '"' : output;
  }

  function slugFilePart(value) {
    return text(value, 'buku-bank').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'buku-bank';
  }

  function downloadTextFile(fileName, contents, mimeType) {
    const blob = new Blob([contents], { type: mimeType || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
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
    downloadTextFile(fileName + '.xls', '\ufeff<table>' + htmlRows + '</table>', 'application/vnd.ms-excel;charset=utf-8');
  }

  function exportRows() {
    const rows = [
      ['Tanggal', 'COA', 'Nama Akun', 'Keterangan', moneyInLabel(), moneyOutLabel(), 'Saldo', 'Pajak']
    ].concat(sortedEntries(visibleEntries()).map(function (entry) {
      return [
        formatDisplayDate(entry.tanggal),
        entry.coa,
        entry.accountName,
        entryDescription(entry),
        Number(entry.uangMasuk || 0),
        Number(entry.uangKeluar || 0),
        Number(entry.saldo || 0),
        entry.pajak || ''
      ];
    }));
    exportWorkbook(
      'buku-bank-' + slugFilePart(state.client?.name || 'client') + '-' + slugFilePart(state.activeBank?.label || 'bank') + '-' + today(),
      'buku_bank',
      rows
    );
  }

  function downloadImportTemplate() {
    const firstCoa = state.coaAccounts[0] || { coa: '1-1001', accountName: 'Akun contoh' };
    const secondCoa = state.coaAccounts[1] || firstCoa;
    const headers = ['Tanggal', 'COA', 'Keterangan', moneyInLabel(), moneyOutLabel(), 'Pajak'];
    const rows = [
      headers,
      ['2026-06-01', firstCoa.coa, 'Contoh debit ' + text(firstCoa.accountName), '1500000', '', 'KF'],
      ['2026-06-02', secondCoa.coa, 'Contoh kredit ' + text(secondCoa.accountName), '', '250000', '']
    ];
    const contents = '\ufeff' + rows.map(function (row) {
      return row.map(csvEscape).join(',');
    }).join('\r\n') + '\r\n';
    downloadTextFile(
      'format-impor-buku-bank-' + slugFilePart(state.activeBank?.label) + '.csv',
      contents,
      'text/csv;charset=utf-8'
    );
  }

  function detectCsvDelimiter(line) {
    const commaCount = (line.match(/,/g) || []).length;
    const semicolonCount = (line.match(/;/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  }

  function parseCsvLine(line, delimiter) {
    const cells = [];
    let value = '';
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        cells.push(value);
        value = '';
      } else {
        value += char;
      }
    }
    cells.push(value);
    return cells.map(function (cell) {
      return cell.trim();
    });
  }

  function normalizeHeader(value) {
    return text(value).toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').trim();
  }

  function headerIndex(headers, aliases) {
    const normalized = headers.map(normalizeHeader);
    for (let index = 0; index < aliases.length; index += 1) {
      const matchIndex = normalized.indexOf(normalizeHeader(aliases[index]));
      if (matchIndex >= 0) return matchIndex;
    }
    return -1;
  }

  function parseImportCsv(contents) {
    const lines = String(contents || '').replace(/^\ufeff/, '').split(/\r?\n/).filter(function (line) {
      return line.trim();
    });
    if (lines.length < 2) throw new Error('File CSV belum berisi data transaksi.');
    const delimiter = detectCsvDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter);
    const columns = {
      tanggal: headerIndex(headers, ['Tanggal', 'Entry Date', 'Date']),
      coa: headerIndex(headers, ['COA', 'Kode COA', 'COA Code']),
      keterangan: headerIndex(headers, ['Keterangan', 'Deskripsi', 'Description', 'Mutasi']),
      uangMasuk: headerIndex(headers, ['Debit', 'Debet', 'Uang Masuk', 'Masuk', 'Money In']),
      uangKeluar: headerIndex(headers, ['Kredit', 'Credit', 'Uang Keluar', 'Keluar', 'Money Out']),
      pajak: headerIndex(headers, ['Pajak', 'Tax'])
    };
    if (columns.tanggal < 0 || columns.coa < 0 || columns.keterangan < 0 || columns.uangMasuk < 0 || columns.uangKeluar < 0) {
      throw new Error('Header wajib: Tanggal, COA, Keterangan, ' + moneyInLabel() + ', ' + moneyOutLabel() + ', Pajak.');
    }
    return lines.slice(1).map(function (line, index) {
      const cells = parseCsvLine(line, delimiter);
      const uangMasuk = text(cells[columns.uangMasuk]);
      const uangKeluar = text(cells[columns.uangKeluar]);
      return {
        rowNumber: index + 2,
        tanggal: text(cells[columns.tanggal]),
        coa: text(cells[columns.coa]),
        keterangan: normalizeDebitCreditDescription(cells[columns.keterangan], uangMasuk, uangKeluar),
        uangMasuk,
        uangKeluar,
        pajak: columns.pajak >= 0 ? text(cells[columns.pajak]) : ''
      };
    }).filter(function (row) {
      return row.tanggal || row.coa || row.keterangan || row.uangMasuk || row.uangKeluar || row.pajak;
    });
  }

  function readFileAsText(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(new Error('Gagal membaca file impor.'));
      };
      reader.readAsText(file);
    });
  }

  async function importCsvFile(file) {
    if (!file) return;
    if (elements.importButton) elements.importButton.disabled = true;
    setAlert('');
    try {
      const rows = parseImportCsv(await readFileAsText(file));
      if (!rows.length) throw new Error('Tidak ada baris transaksi yang bisa diimpor.');
      const ok = await window.clientPortalConfirm({
        title: 'Impor Buku Bank',
        meta: 'Data akan ditambahkan ke buku aktif.',
        message: 'Impor ' + rows.length + ' baris ke ' + text(state.activeBank?.label, 'Buku Bank') + '?',
        cancelText: 'Batal',
        confirmText: 'Impor'
      });
      if (!ok) return;
      const data = await requestJson(apiBase() + '/import', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bankKey: activeBankKey(),
          rows
        })
      });
      if (!data) return;
      state.activeBank = data.activeBank || state.activeBank;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.selectedIds.clear();
      renderTabs();
      renderRows();
      setAlert((data.importedCount || rows.length) + ' baris Buku Bank berhasil diimpor.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal impor Buku Bank.', 'error');
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

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function selectedCoaAccount() {
    const coa = text(elements.coa.value);
    return state.coaAccounts.find(function (account) {
      return account.coa === coa;
    }) || null;
  }

  function syncSelectedAccountName() {
    const account = selectedCoaAccount();
    elements.accountName.value = account ? account.accountName : '';
  }

  function tbbBankNoBuktiPrefix() {
    const source = tbbBankSourceAccount();
    return text(source.accountName, 'BANK').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'BANK';
  }

  function tbbBankExistingNoBukti(entry) {
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

  function tbbBankNoBuktiIndex(noBukti, base) {
    const value = text(noBukti).toUpperCase();
    if (value === base) return 1;
    if (value.indexOf(base + '-') !== 0) return 0;
    const suffix = value.slice(base.length + 1);
    return /^\d+$/.test(suffix) ? Number(suffix) : 0;
  }

  function tbbBankNoBukti(dateValue, currentEntryId) {
    const date = text(dateValue, today()).replace(/-/g, '');
    const base = 'DEMO_DISTRIBUTION-' + tbbBankNoBuktiPrefix() + '-' + date;
    const currentId = text(currentEntryId);
    const maxIndex = (state.entries || []).reduce(function (max, entry) {
      if (currentId && text(entry.id) === currentId) return max;
      return Math.max(max, tbbBankNoBuktiIndex(tbbBankExistingNoBukti(entry), base));
    }, 0);
    return base + '-' + String(maxIndex + 1).padStart(3, '0');
  }

  function tbbBankNoBuktiForEntry(entry, dateValue) {
    return tbbBankExistingNoBukti(entry) || tbbBankNoBukti(dateValue, entry?.id);
  }

  function setNativeBankFormVisible(visible) {
    const grid = elements.form?.querySelector('.cashbook-form-grid');
    if (!grid) return;
    elements.form.classList.toggle('is-tbb-kas-custom-form', !visible);
    grid.hidden = !visible;
    grid.style.display = visible ? '' : 'none';
    if (visible) grid.removeAttribute('aria-hidden');
    else grid.setAttribute('aria-hidden', 'true');
    grid.querySelectorAll('input, select, textarea').forEach(function (control) {
      control.disabled = !visible;
    });
    if (visible) {
      elements.form.querySelectorAll('[data-tbb-bank-form], [data-tbb-bank-journal]').forEach(function (panel) {
        panel.remove();
      });
    }
  }

  function tbbBankCoaOptions(selectedValue) {
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

  function tbbBankRowHtml(entry) {
    const row = entry || {};
    return '<div class="tbb-kas-input-row">' +
      '<select data-tbb-bank-field="coa" required>' + tbbBankCoaOptions(row.coa) + '</select>' +
      '<input data-tbb-bank-field="keterangan" value="' + escapeHtml(row.keterangan || '') + '" autocomplete="off">' +
      '<input data-tbb-bank-field="uangMasuk" data-rupiah="true" inputmode="decimal" value="' + escapeHtml(formatAmount(row.uangMasuk)) + '">' +
      '<input data-tbb-bank-field="uangKeluar" data-rupiah="true" inputmode="decimal" value="' + escapeHtml(formatAmount(row.uangKeluar)) + '">' +
      '<button class="icon-button tbb-kas-remove-row" type="button" data-tbb-bank-remove-row aria-label="Hapus baris"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>' +
    '</div>';
  }

  function setTbbBankReadOnly(panel, readOnly) {
    panel.classList.toggle('is-readonly', Boolean(readOnly));
    panel.setAttribute('data-readonly', readOnly ? 'true' : 'false');
    panel.querySelectorAll('input, textarea').forEach(function (control) {
      if (control.type === 'checkbox') control.disabled = Boolean(readOnly);
      else control.readOnly = Boolean(readOnly);
    });
    panel.querySelectorAll('select').forEach(function (control) {
      control.disabled = Boolean(readOnly);
    });
    panel.querySelectorAll('[data-tbb-bank-add-row], [data-tbb-bank-remove-row], [data-tbb-bank-select-file], [data-tbb-bank-upload-qr], [data-tbb-bank-clear-file]').forEach(function (button) {
      button.hidden = Boolean(readOnly);
      button.disabled = Boolean(readOnly);
    });
    elements.saveButton.hidden = Boolean(readOnly);
    elements.cancelButton.textContent = readOnly ? 'Tutup' : 'Batal';
  }

  function renderTbbBankInputForm(entry, readOnly) {
    setNativeBankFormVisible(false);
    let panel = elements.form.querySelector('[data-tbb-bank-form]');
    if (panel) panel.remove();
    const dateValue = text(entry?.tanggal, today());
    const footer = elements.form.querySelector('.portal-modal-footer');
    panel = document.createElement('section');
    panel.className = 'tbb-kas-entry-form';
    panel.setAttribute('data-tbb-bank-form', 'true');
    panel.innerHTML = [
      '<div class="tbb-kas-input-top">',
        '<label><span>Tanggal</span><input data-tbb-bank-header="tanggal" type="date" value="' + escapeHtml(dateValue) + '" required></label>',
        '<label><span>No. Bukti</span><input data-tbb-bank-header="noBukti" value="' + escapeHtml(tbbBankNoBuktiForEntry(entry, dateValue)) + '" readonly></label>',
        '<label><span>Jenis Buku</span><select data-tbb-bank-header="book">' + tbbBookOptionsHtml(activeBankKey()) + '</select></label>',
        '<div class="tbb-kas-source-pill"><span>Akun Buku</span><strong>' + escapeHtml(tbbBankBookLabel()) + '</strong><small>' + escapeHtml(tbbBankBookCode()) + '</small></div>',
      '</div>',
      '<div class="tbb-kas-input-detail">',
        '<div class="tbb-kas-input-toolbar">',
          '<div><strong>Rincian Operasional</strong><small>Akun lawan dipilih per baris.</small></div>',
          '<button class="ghost-button" type="button" data-tbb-bank-add-row>Tambah baris</button>',
        '</div>',
        '<div class="tbb-kas-input-head">',
          '<span>Akun Lawan</span><span>Keterangan</span><span>Uang Masuk</span><span>Uang Keluar</span><span></span>',
        '</div>',
        '<div class="tbb-kas-input-list">' + tbbBankRowHtml(entry) + '</div>',
      '</div>',
      '<div class="tbb-kas-input-attachment">',
        '<div><strong>Lampiran</strong><small data-tbb-bank-attachment-note>Belum ada file tersimpan.</small></div>',
        '<div class="tbb-kas-attachment-actions">',
          '<button class="ghost-button" type="button" data-tbb-bank-select-file>Pilih File</button>',
          '<button class="ghost-button" type="button" data-tbb-bank-upload-qr>Upload via QR</button>',
          '<button class="ghost-button" type="button" data-tbb-bank-clear-file>Batalkan File Baru</button>',
        '</div>',
      '</div>'
    ].join('');
    elements.form.insertBefore(panel, footer);
    if (elements.attachmentFile) elements.attachmentFile.disabled = Boolean(readOnly);
    setAttachmentNote(entry || null);
    setText(elements.modalTitle, readOnly ? 'Lihat ' + tbbBankBookLabel() : (entry ? 'Ubah ' + tbbBankBookLabel() : 'Tambah ' + tbbBankBookLabel()));
    setText(elements.modalMeta, readOnly ? tbbBankBookLabel() + ' | Tampilan terkunci.' : 'Format input BUKU KAS DEMO_DISTRIBUTION.');
    setTbbBankReadOnly(panel, Boolean(readOnly));
  }

  function resetTbbBankInputForm() {
    elements.entryId.value = '';
    renderTbbBankInputForm(null, false);
    window.setTimeout(function () {
      elements.form.querySelector('[data-tbb-bank-header="tanggal"]')?.focus();
    }, 0);
  }

  function appendTbbBankInputRow(defaults) {
    const list = elements.form.querySelector('.tbb-kas-input-list');
    if (!list) return null;
    const template = document.createElement('template');
    template.innerHTML = tbbBankRowHtml(defaults || {});
    const row = template.content.firstChild;
    list.appendChild(row);
    return row;
  }

  function collectTbbBankRows() {
    const panel = elements.form.querySelector('[data-tbb-bank-form]');
    if (!panel) return [];
    return Array.from(panel.querySelectorAll('.tbb-kas-input-row')).map(function (row, index) {
      const coa = row.querySelector('[data-tbb-bank-field="coa"]')?.value || '';
      const keterangan = row.querySelector('[data-tbb-bank-field="keterangan"]')?.value || '';
      const uangMasuk = parseAmountInput(row.querySelector('[data-tbb-bank-field="uangMasuk"]'));
      const uangKeluar = parseAmountInput(row.querySelector('[data-tbb-bank-field="uangKeluar"]'));
      return { rowNumber: index + 1, coa, keterangan, uangMasuk, uangKeluar };
    }).filter(function (row) {
      return text(row.coa) || text(row.keterangan) || row.uangMasuk || row.uangKeluar;
    });
  }

  async function submitTbbBankForm() {
    const panel = elements.form.querySelector('[data-tbb-bank-form]');
    const entryId = text(elements.entryId.value);
    const tanggal = panel.querySelector('[data-tbb-bank-header="tanggal"]')?.value || today();
    const noBukti = panel.querySelector('[data-tbb-bank-header="noBukti"]')?.value || tbbBankNoBukti(tanggal, entryId);
    const rows = collectTbbBankRows();
    if (!rows.length) throw new Error('Minimal 1 baris rincian wajib diisi.');
    if (entryId && rows.length > 1) throw new Error('Ubah data hanya untuk 1 baris. Hapus baris tambahan dulu.');

    let latestData = null;
    const attachment = window.clientPortalBuildAttachmentPayload
      ? await window.clientPortalBuildAttachmentPayload(elements.attachmentFile)
      : await legacyAttachmentPayload(elements.attachmentFile);
    for (const row of rows) {
      if (!text(row.coa)) throw new Error('Baris ' + row.rowNumber + ': akun lawan wajib dipilih.');
      assertNotTbbFixedAssetRow(row);
      if (row.uangMasuk <= 0 && row.uangKeluar <= 0) throw new Error('Baris ' + row.rowNumber + ': isi ' + amountSideHint() + '.');
      if (row.uangMasuk > 0 && row.uangKeluar > 0) throw new Error('Baris ' + row.rowNumber + ': isi salah satu saja antara ' + moneyInLabel() + ' dan ' + moneyOutLabel() + '.');
      latestData = await requestJson(entryId ? apiBase() + '/' + encodeURIComponent(entryId) : apiBase(), {
        method: entryId ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bankKey: activeBankKey(),
          tanggal,
          noBukti,
          coa: row.coa,
          keterangan: normalizeDebitCreditDescription([noBukti, row.keterangan].filter(Boolean).join(' | '), row.uangMasuk, row.uangKeluar),
          uangMasuk: String(row.uangMasuk),
          uangKeluar: String(row.uangKeluar),
          pajak: '',
          ...attachment
        })
      });
    }
    if (!latestData) return;
    state.activeBank = latestData.activeBank || state.activeBank;
    state.entries = Array.isArray(latestData.entries) ? latestData.entries : state.entries;
    renderTabs();
    renderRows();
    if (entryId) {
      closeModal();
      setAlert('Data ' + tbbBankBookLabel() + ' tersimpan.', 'info');
      return;
    }
    resetTbbBankInputForm();
    showSavedToast();
    setAlert('Data Tersimpan.', 'info');
  }

  function tbbBankSettlementUrl(type) {
    const tab = type === 'purchases' ? 'pembelian' : 'penjualan';
    const action = type === 'purchases' ? 'settlement-payable' : 'settlement-receivable';
    return '/app/client/clients/' + encodeURIComponent(state.client?.id || clientIdFromPath()) +
      '/tbb-transaksi?tab=' + encodeURIComponent(tab) +
      '&action=' + encodeURIComponent(action) +
      '&source=' + encodeURIComponent(activeBankKey());
  }

  function tbbBankChoiceCard(value, title, description) {
    return '<button class="tbb-choice-card" type="button" data-tbb-bank-choice="' + escapeHtml(value) + '">' +
      '<span class="tbb-choice-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg></span>' +
      '<span class="tbb-choice-copy"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(description) + '</small></span>' +
      '<span class="tbb-choice-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></span>' +
    '</button>';
  }

  function ensureTbbBankChoiceModal() {
    let modal = document.getElementById('tbbBankChoiceModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'tbbBankChoiceModal';
    modal.className = 'portal-modal-backdrop';
    modal.hidden = true;
    modal.innerHTML = [
      '<section class="portal-modal tbb-choice-modal tbb-cash-choice-modal" role="dialog" aria-modal="true" aria-labelledby="tbbBankChoiceTitle">',
        '<header class="portal-modal-header">',
          '<div><h2 id="tbbBankChoiceTitle">Pilih Input Buku KAS</h2><span>Pilih jenis transaksi untuk ' + escapeHtml(tbbBankBookLabel()) + '.</span></div>',
          '<button class="icon-button" type="button" data-tbb-bank-choice-close aria-label="Tutup popup"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
        '</header>',
        '<div class="tbb-choice-grid tbb-cash-choice-grid">',
          tbbBankChoiceCard('operational', 'Pencatatan Operasional', 'Input transaksi kas/bank harian.'),
          tbbBankChoiceCard('receivable', 'Pelunasan Piutang Dagang', 'Lunasi invoice penjualan DEMO_DISTRIBUTION.'),
          tbbBankChoiceCard('payable', 'Pembayaran Utang Dagang', 'Bayar invoice pembelian DEMO_DISTRIBUTION.'),
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
      if (event.target.closest('[data-tbb-bank-choice-close]')) {
        closeTbbBankChoiceModal();
        return;
      }
      const button = event.target.closest('[data-tbb-bank-choice]');
      if (!button) return;
      const choice = button.getAttribute('data-tbb-bank-choice');
      closeTbbBankChoiceModal();
      if (choice === 'operational') {
        openTbbBankOperationalModal();
        return;
      }
      window.location.assign(tbbBankSettlementUrl(choice === 'payable' ? 'purchases' : 'sales'));
    });
    return modal;
  }

  function openTbbBankChoiceModal() {
    const modal = ensureTbbBankChoiceModal();
    const title = modal.querySelector('#tbbBankChoiceTitle');
    const meta = modal.querySelector('.portal-modal-header span');
    if (title) title.textContent = 'Pilih Input Buku KAS';
    if (meta) meta.textContent = 'Pilih jenis transaksi untuk ' + tbbBankBookLabel() + '.';
    modal.hidden = false;
  }

  function closeTbbBankChoiceModal() {
    const modal = document.getElementById('tbbBankChoiceModal');
    if (modal) modal.hidden = true;
  }

  function openTbbBankOperationalModal() {
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = '';
    renderTbbBankInputForm(null, false);
    showModal();
  }

  function openCreateModal() {
    if (isTbbClient()) {
      openTbbBankChoiceModal();
      return;
    }
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = '';
    resetBankDetailRows();
    setAttachmentNote(null);
    setText(elements.modalTitle, 'Tambah Buku Bank');
    setText(elements.modalMeta, text(state.activeBank?.label, 'Bank') + ' | Input transaksi baru.');
    ensureTbbBookSwitch();
    showModal();
  }

  function resetCreateModalAfterSave() {
    if (isTbbClient() && elements.form.querySelector('[data-tbb-bank-form]')) {
      resetTbbBankInputForm();
      return;
    }
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = '';
    resetBankDetailRows();
    setAttachmentNote(null);
    setText(elements.modalTitle, 'Tambah Buku Bank');
    setText(elements.modalMeta, text(state.activeBank?.label, 'Bank') + ' | Input transaksi baru.');
    ensureTbbBookSwitch();
    window.setTimeout(function () {
      elements.detailRows?.querySelector('[data-bank-detail-field="tanggal"]')?.focus();
    }, 0);
  }

  function advanceApiBase() {
    return apiBase() + '/advances';
  }

  function advanceSourceOptions() {
    const options = [{ key: 'kas-kecil', label: 'KAS KECIL' }];
    (state.banks || []).filter(function (bank) {
      return text(bank?.key).indexOf('hti-') === 0;
    }).forEach(function (bank) {
      options.push({ key: text(bank.key), label: text(bank.label, bank.key) });
    });
    return options;
  }

  function renderAdvanceSourceOptions(selectedValue) {
    if (!elements.advanceSource) return;
    const selected = text(selectedValue, text(elements.advanceSource.value, activeBankKey()));
    clearNode(elements.advanceSource);
    advanceSourceOptions().forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.key;
      option.textContent = source.label;
      option.selected = source.key === selected;
      elements.advanceSource.appendChild(option);
    });
  }

  function advanceSourceLabelByKey(key) {
    const source = advanceSourceOptions().find(function (item) { return item.key === text(key); });
    return text(source?.label, key === 'kas-kecil' ? 'KAS KECIL' : 'Bank');
  }

  function setAdvanceAttachmentNote(entry, file) {
    if (!elements.advanceAttachmentNote) return;
    const selected = elements.advanceFile?.files && elements.advanceFile.files[0];
    if (selected) {
      elements.advanceAttachmentNote.textContent = 'File baru: ' + selected.name + ' (' + formatFileSize(selected.size) + ')';
      return;
    }
    if (file) {
      elements.advanceAttachmentNote.textContent = 'File baru: ' + file.name + ' (' + formatFileSize(file.size) + ')';
      return;
    }
    if (entry && entry.hasAttachment) {
      elements.advanceAttachmentNote.textContent = 'File tersimpan: ' + text(entry.attachmentName, 'lampiran') + ' (' + formatFileSize(entry.attachmentSize) + ')';
      return;
    }
    elements.advanceAttachmentNote.textContent = 'Belum ada file tersimpan.';
  }

  function advancePartyType() {
    return text(elements.advanceType?.value, 'purchase') === 'sales' ? 'customer' : 'supplier';
  }

  function advancePartyList(type) {
    const list = state.advanceParties && Array.isArray(state.advanceParties[type + 's'])
      ? state.advanceParties[type + 's']
      : [];
    return list;
  }

  function findAdvanceParty(value, field, type) {
    const normalized = text(value).toLowerCase();
    if (!normalized) return null;
    return advancePartyList(type).find(function (party) {
      return text(party?.[field]).toLowerCase() === normalized;
    }) || null;
  }

  function renderAdvancePartyOptions() {
    const type = advancePartyType();
    const codeList = document.getElementById('htiAdvance' + (type === 'customer' ? 'Customer' : 'Supplier') + 'CodeOptions');
    const nameList = document.getElementById('htiAdvance' + (type === 'customer' ? 'Customer' : 'Supplier') + 'NameOptions');
    if (!codeList || !nameList) return;
    clearNode(codeList);
    clearNode(nameList);
    advancePartyList(type).forEach(function (party) {
      const code = text(party?.code);
      const name = text(party?.name);
      if (code) {
        const option = document.createElement('option');
        option.value = code;
        option.label = name;
        codeList.appendChild(option);
      }
      if (name) {
        const option = document.createElement('option');
        option.value = name;
        option.label = code;
        nameList.appendChild(option);
      }
    });
    if (elements.advancePartyCode) {
      elements.advancePartyCode.setAttribute('list', codeList.id);
      elements.advancePartyCode.placeholder = type === 'customer' ? 'Kode customer' : 'Kode supplier';
    }
    if (elements.advanceParty) {
      elements.advanceParty.setAttribute('list', nameList.id);
      elements.advanceParty.placeholder = type === 'customer' ? 'Nama customer' : 'Nama supplier';
    }
  }

  function syncAdvanceParty(source) {
    const type = advancePartyType();
    const codeValue = text(elements.advancePartyCode?.value);
    const nameValue = text(elements.advanceParty?.value);
    const party = source === 'code'
      ? findAdvanceParty(codeValue, 'code', type)
      : findAdvanceParty(nameValue, 'name', type);
    if (!party) return;
    if (elements.advancePartyCode) elements.advancePartyCode.value = text(party.code);
    if (elements.advanceParty) elements.advanceParty.value = text(party.name);
  }

  function syncAdvancePartyMode() {
    const type = advancePartyType();
    const customer = type === 'customer';
    if (elements.advancePartyCodeLabel) elements.advancePartyCodeLabel.textContent = customer ? 'Kode Customer' : 'Kode Supplier';
    if (elements.advancePartyLabel) elements.advancePartyLabel.textContent = customer ? 'Nama Customer' : 'Nama Supplier';
    renderAdvancePartyOptions();
    syncAdvanceParty('code');
    syncAdvanceParty('name');
  }

  function resetAdvanceForm(entry) {
    if (!elements.advanceForm) return;
    elements.advanceForm.reset();
    elements.advanceForm.dataset.advanceId = entry?.advanceId || '';
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.advanceFile);
    renderAdvanceSourceOptions(text(entry?.bankKey, new URLSearchParams(window.location.search).get('source') || activeBankKey()));
    if (elements.advanceType) elements.advanceType.value = text(entry?.advanceType, 'purchase');
    if (elements.advanceDate) elements.advanceDate.value = bankDetailDateValue(entry?.tanggal || today());
    if (elements.advanceProject) elements.advanceProject.value = text(entry?.advanceProjectNo);
    if (elements.advancePartyCode) elements.advancePartyCode.value = text(entry?.advancePartyCode);
    if (elements.advanceParty) elements.advanceParty.value = text(entry?.advancePartyName);
    if (elements.advanceAmount) elements.advanceAmount.value = formatAmount(Math.max(Number(entry?.uangMasuk || 0), Number(entry?.uangKeluar || 0)));
    if (elements.advanceDescription) elements.advanceDescription.value = text(entry?.keterangan);
    syncAdvancePartyMode();
    setAdvanceAttachmentNote(entry || null);
  }

  function openAdvanceCreateModal() {
    if (!isHtiClient()) return;
    if (!isAllowedHtiAdvanceEntryDoor(state.advanceEntryDoor)) {
      setAlert('Input uang muka dibuka dari Buku Penjualan atau Buku Pembelian agar jalurnya tetap satu pintu.', 'error');
      return;
    }
    resetAdvanceForm(null);
    const params = new URLSearchParams(window.location.search);
    if (elements.advanceType && ['purchase', 'sales'].includes(text(params.get('advanceType')))) {
      elements.advanceType.value = text(params.get('advanceType'));
      syncAdvancePartyMode();
    }
    setText(elements.advanceTitle, 'Input Uang Muka');
    setText(elements.advanceMeta, advanceSourceLabelByKey(elements.advanceSource?.value) + ' | Pembayaran sebelum invoice/faktur.');
    elements.advanceModal.hidden = false;
    window.setTimeout(function () { elements.advanceType?.focus(); }, 0);
  }

  function openAdvanceEditModal(entry) {
    if (!isHtiAdvance(entry)) return;
    resetAdvanceForm(entry);
    setText(elements.advanceTitle, 'Ubah Uang Muka');
    setText(elements.advanceMeta, advanceSourceLabelByKey(entry?.bankKey) + ' | Jurnal tetap terhubung.');
    elements.advanceModal.hidden = false;
    window.setTimeout(function () { elements.advanceType?.focus(); }, 0);
  }

  function closeAdvanceModal() {
    if (!elements.advanceModal) return;
    elements.advanceModal.hidden = true;
    elements.advanceForm?.reset();
    if (elements.advanceForm) delete elements.advanceForm.dataset.advanceId;
  }

  async function submitAdvanceForm(event) {
    event.preventDefault();
    if (!isHtiClient()) return;
    if (elements.advanceSaveButton) elements.advanceSaveButton.disabled = true;
    setAlert('');
    try {
      syncAdvanceParty('code');
      syncAdvanceParty('name');
      const advanceId = text(elements.advanceForm?.dataset.advanceId);
      const amount = parseAmountInput(elements.advanceAmount);
      if (!text(elements.advanceDate?.value)) throw new Error('Tanggal uang muka wajib diisi.');
      if (!text(elements.advanceParty?.value)) throw new Error('Nama supplier/customer wajib diisi.');
      if (amount <= 0) throw new Error('Nominal uang muka harus lebih besar dari 0.');
      const attachment = window.clientPortalBuildAttachmentPayload
        ? await window.clientPortalBuildAttachmentPayload(elements.advanceFile)
        : await legacyAttachmentPayload(elements.advanceFile);
      const data = await requestJson(advanceId ? advanceApiBase() + '/' + encodeURIComponent(advanceId) : advanceApiBase(), {
        method: advanceId ? 'PUT' : 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankKey: text(elements.advanceSource?.value, activeBankKey()),
          sourceKey: text(elements.advanceSource?.value, activeBankKey()),
          sourceType: text(elements.advanceSource?.value) === 'kas-kecil' ? 'kas' : 'bank',
          advanceType: text(elements.advanceType?.value, 'purchase'),
          tanggal: text(elements.advanceDate?.value),
          projectNo: text(elements.advanceProject?.value),
          partyCode: text(elements.advancePartyCode?.value),
          partyName: text(elements.advanceParty?.value),
          amount: String(amount),
          keterangan: text(elements.advanceDescription?.value),
          entryDoor: text(state.advanceEntryDoor),
          ...attachment
        })
      });
      if (!data) return;
      state.activeBank = data.activeBank || state.activeBank;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.advances = Array.isArray(data.advances) ? data.advances : state.advances;
      state.advanceParties = data.advanceParties || state.advanceParties;
      renderAdvancePartyOptions();
      renderTabs();
      renderRows();
      closeAdvanceModal();
      setAlert(advanceId ? 'Uang muka diperbarui dan jurnal sumber ikut berubah.' : 'Uang muka tersimpan sebagai jurnal sumber dana.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan uang muka.', 'error');
    } finally {
      if (elements.advanceSaveButton) elements.advanceSaveButton.disabled = false;
    }
  }

  function tfGabApiBase() {
    return apiBase() + '/tf-gab';
  }

  function formatRupiah(value) {
    return 'Rp' + (formatAmount(Number(value || 0)) || '0');
  }

  function renderTfGabBankOptions(selectedValue) {
    if (!elements.tfGabBank) return;
    const selected = text(selectedValue, text(elements.tfGabBank.value, activeBankKey()));
    clearNode(elements.tfGabBank);
    (state.banks || []).filter(function (bank) {
      return text(bank?.key).indexOf('hti-') === 0;
    }).forEach(function (bank) {
      const option = document.createElement('option');
      option.value = text(bank.key);
      option.textContent = text(bank.label, bank.key);
      option.selected = text(bank.key) === selected;
      elements.tfGabBank.appendChild(option);
    });
  }

  function tfGabPartyLabel(item) {
    return text(item?.partyName, text(item?.partyCode, '-'));
  }

  function tfGabPartySearchText(item) {
    return [item?.partyName, item?.partyCode].map(text).filter(Boolean).join(' ').toLowerCase();
  }

  function tfGabPartyOptions() {
    const seen = new Set();
    const options = [];
    state.tfGabItems.forEach(function (item) {
      const label = tfGabPartyLabel(item);
      const key = [text(item.partyCode).toLowerCase(), label.toLowerCase()].filter(Boolean).join('|') || label.toLowerCase();
      if (!label || seen.has(key)) return;
      seen.add(key);
      options.push({
        label,
        code: text(item.partyCode),
        search: tfGabPartySearchText(item)
      });
    });
    return options.sort(function (left, right) {
      return left.label.localeCompare(right.label, 'id', { numeric: true });
    });
  }

  function renderTfGabPartyOptions() {
    if (!elements.tfGabPartyOptions) return;
    clearNode(elements.tfGabPartyOptions);
    tfGabPartyOptions().forEach(function (party) {
      const option = document.createElement('option');
      option.value = party.label;
      if (party.code) option.label = party.code;
      elements.tfGabPartyOptions.appendChild(option);
    });
  }

  function closestTfGabParty(value) {
    const query = text(value).toLowerCase();
    if (!query) return null;
    const options = tfGabPartyOptions();
    return options.find(function (party) { return party.label.toLowerCase() === query || party.code.toLowerCase() === query; })
      || options.find(function (party) { return party.label.toLowerCase().startsWith(query) || party.code.toLowerCase().startsWith(query); })
      || options.find(function (party) { return party.search.includes(query); })
      || null;
  }

  function normalizeTfGabPartyInput() {
    if (!elements.tfGabParty) return null;
    const match = closestTfGabParty(elements.tfGabParty.value);
    if (match) elements.tfGabParty.value = match.label;
    return match;
  }

  function tfGabCurrentPartyQuery() {
    return text(elements.tfGabParty?.value).toLowerCase();
  }

  function tfGabItemsForParty() {
    const query = tfGabCurrentPartyQuery();
    if (!query) return state.tfGabItems.slice();
    return state.tfGabItems.filter(function (item) {
      return tfGabPartySearchText(item).includes(query);
    });
  }

  function tfGabProjectGroups() {
    const groups = new Map();
    tfGabItemsForParty().forEach(function (item) {
      const projectNo = text(item.projectNo, '-');
      const key = projectNo || '-';
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          projectNo,
          partyName: tfGabPartyLabel(item),
          items: [],
          outstandingAmount: 0
        });
      }
      const group = groups.get(key);
      group.items.push(item);
      group.outstandingAmount = Math.round((group.outstandingAmount + Number(item.outstandingAmount || 0)) * 100) / 100;
    });
    return Array.from(groups.values()).sort(function (left, right) {
      return left.projectNo.localeCompare(right.projectNo, 'id', { numeric: true });
    });
  }

  function tfGabProjectGroupMap() {
    return new Map(tfGabProjectGroups().map(function (group) { return [group.key, group]; }));
  }

  function tfGabLineRows() {
    return elements.tfGabRows ? Array.from(elements.tfGabRows.querySelectorAll('tr.hti-tf-gab-line-row')) : [];
  }

  function renderTfGabProjectSelect(select, selectedValue) {
    if (!select) return;
    const previous = text(selectedValue, select.value);
    clearNode(select);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pilih proyek';
    select.appendChild(placeholder);
    tfGabProjectGroups().forEach(function (group) {
      const option = document.createElement('option');
      option.value = group.key;
      option.textContent = text(group.projectNo, '-') + ' | ' + formatRupiah(group.outstandingAmount);
      select.appendChild(option);
    });
    select.value = Array.from(select.options).some(function (option) { return option.value === previous; }) ? previous : '';
  }

  function syncTfGabLine(row, keepPayment) {
    if (!row) return;
    const projectSelect = row.querySelector('[data-tf-gab-field="project"]');
    const outstandingInput = row.querySelector('[data-tf-gab-field="outstanding"]');
    const paymentInput = row.querySelector('[data-tf-gab-field="payment"]');
    const group = tfGabProjectGroupMap().get(text(projectSelect?.value));
    const outstanding = group ? Number(group.outstandingAmount || 0) : 0;
    if (outstandingInput) outstandingInput.value = group ? formatRupiah(outstanding) : '';
    if (paymentInput && (!keepPayment || !text(paymentInput.value))) {
      paymentInput.value = outstanding > 0 ? formatAmount(outstanding) : '';
    }
    updateTfGabSummary();
  }

  function refreshTfGabLineOptions() {
    const rows = tfGabLineRows();
    rows.forEach(function (row) {
      const projectSelect = row.querySelector('[data-tf-gab-field="project"]');
      const selected = text(projectSelect?.value);
      renderTfGabProjectSelect(projectSelect, selected);
      syncTfGabLine(row, true);
    });
    updateTfGabCount();
  }

  function addTfGabLine(projectKey, focus) {
    if (!elements.tfGabRows) return null;
    const empty = elements.tfGabRows.querySelector('.hti-tf-gab-empty');
    if (empty) elements.tfGabRows.replaceChildren();
    const row = document.createElement('tr');
    row.className = 'hti-tf-gab-line-row';

    const projectCell = document.createElement('td');
    const projectSelect = document.createElement('select');
    projectSelect.setAttribute('data-tf-gab-field', 'project');
    projectSelect.setAttribute('aria-label', 'Kode proyek');
    renderTfGabProjectSelect(projectSelect, projectKey || '');
    projectCell.appendChild(projectSelect);

    const outstandingCell = document.createElement('td');
    const outstandingInput = document.createElement('input');
    outstandingInput.type = 'text';
    outstandingInput.readOnly = true;
    outstandingInput.tabIndex = -1;
    outstandingInput.setAttribute('data-tf-gab-field', 'outstanding');
    outstandingInput.setAttribute('aria-label', 'Sisa tagihan');
    outstandingCell.appendChild(outstandingInput);

    const paymentCell = document.createElement('td');
    const paymentInput = document.createElement('input');
    paymentInput.type = 'text';
    paymentInput.inputMode = 'decimal';
    paymentInput.setAttribute('data-rupiah', 'true');
    paymentInput.setAttribute('data-tf-gab-field', 'payment');
    paymentInput.placeholder = '0';
    paymentInput.autocomplete = 'off';
    paymentInput.setAttribute('aria-label', 'Pelunasan');
    paymentCell.appendChild(paymentInput);

    const removeCell = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'hti-tf-gab-remove-button';
    removeButton.textContent = 'X';
    removeButton.setAttribute('aria-label', 'Hapus baris pelunasan');
    removeCell.appendChild(removeButton);

    row.appendChild(projectCell);
    row.appendChild(outstandingCell);
    row.appendChild(paymentCell);
    row.appendChild(removeCell);
    elements.tfGabRows.appendChild(row);

    projectSelect.addEventListener('change', function () {
      syncTfGabLine(row, false);
    });
    [projectSelect, paymentInput].forEach(function (control) {
      control.addEventListener('keydown', function (event) {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const nextRow = addTfGabLine('', true);
        nextRow?.querySelector('[data-tf-gab-field="project"]')?.focus();
      });
    });
    paymentInput.addEventListener('input', updateTfGabSummary);
    paymentInput.addEventListener('blur', function () {
      const amount = parseAmountInput(paymentInput);
      paymentInput.value = amount > 0 ? formatAmount(amount) : '';
      updateTfGabSummary();
    });
    removeButton.addEventListener('click', function () {
      row.remove();
      if (!tfGabLineRows().length) addTfGabLine('', false);
      updateTfGabSummary();
      updateTfGabCount();
    });
    syncTfGabLine(row, false);
    updateTfGabCount();
    if (focus) window.setTimeout(function () { projectSelect.focus(); }, 0);
    return row;
  }

  function updateTfGabCount() {
    const groupCount = tfGabProjectGroups().length;
    const lineCount = tfGabLineRows().filter(function (row) {
      return text(row.querySelector('[data-tf-gab-field="project"]')?.value);
    }).length;
    setText(elements.tfGabCount, groupCount
      ? groupCount + ' proyek/tagihan terbuka' + (lineCount ? ' | ' + lineCount + ' baris dipilih' : '')
      : 'Belum ada proyek terbuka untuk nama ini.');
  }

  function updateTfGabSummary() {
    let paidTotal = 0;
    let outstandingTotal = 0;
    let lineCount = 0;
    const groupMap = tfGabProjectGroupMap();
    tfGabLineRows().forEach(function (row) {
      const key = text(row.querySelector('[data-tf-gab-field="project"]')?.value);
      const group = groupMap.get(key);
      if (!group) return;
      lineCount += 1;
      outstandingTotal += Number(group.outstandingAmount || 0);
      paidTotal += parseAmountInput(row.querySelector('[data-tf-gab-field="payment"]'));
    });
    const remaining = Math.max(0, Math.round((outstandingTotal - paidTotal) * 100) / 100);
    setText(elements.tfGabTransferTotal, formatRupiah(paidTotal));
    setText(elements.tfGabAllocatedTotal, String(lineCount));
    setText(elements.tfGabDifference, formatRupiah(remaining));
    const summary = elements.tfGabTransferTotal?.closest('.hti-tf-gab-summary');
    if (summary) {
      summary.classList.toggle('is-balanced', paidTotal > 0 && remaining <= 0.5);
      summary.classList.toggle('has-difference', paidTotal > 0 && remaining > 0.5);
    }
    updateTfGabCount();
  }

  function resetTfGabLines() {
    if (!elements.tfGabRows) return;
    elements.tfGabRows.replaceChildren();
    addTfGabLine('', false);
  }

  function renderTfGabRows() {
    renderTfGabPartyOptions();
    refreshTfGabLineOptions();
    if (!tfGabLineRows().length) resetTfGabLines();
    updateTfGabSummary();
  }

  async function fetchTfGabOptions() {
    if (!isHtiClient()) return;
    setText(elements.tfGabCount, 'Memuat data...');
    if (elements.tfGabRows) {
      clearNode(elements.tfGabRows);
      const row = document.createElement('tr');
      const empty = document.createElement('td');
      empty.className = 'hti-tf-gab-empty';
      empty.colSpan = 4;
      empty.textContent = 'Memuat proyek terbuka...';
      row.appendChild(empty);
      elements.tfGabRows.appendChild(row);
    }
    const params = new URLSearchParams();
    params.set('type', text(elements.tfGabType?.value, 'sales'));
    params.set('bank', text(elements.tfGabBank?.value, activeBankKey()));
    const data = await requestJson(tfGabApiBase() + '/options?' + params.toString());
    if (!data) return;
    state.tfGabItems = Array.isArray(data.items) ? data.items : [];
    renderTfGabRows();
  }

  function resetTfGabForm() {
    if (!elements.tfGabForm) return;
    elements.tfGabForm.reset();
    state.tfGabItems = [];
    state.tfGabAllocations = new Map();
    renderTfGabBankOptions(activeBankKey());
    if (elements.tfGabDate) elements.tfGabDate.value = today();
    if (elements.tfGabType) elements.tfGabType.value = 'sales';
    if (elements.tfGabParty) elements.tfGabParty.value = '';
    if (elements.tfGabDescription) elements.tfGabDescription.value = '';
    resetTfGabLines();
    updateTfGabSummary();
  }

  async function openTfGabModal() {
    if (!isHtiClient()) return;
    resetTfGabForm();
    setText(elements.tfGabTitle, 'Pembayaran gabungan lama');
    setText(elements.tfGabMeta, text(state.activeBank?.label, 'Buku Bank') + ' | Bayar gabungan per proyek.');
    elements.tfGabModal.hidden = false;
    try {
      await fetchTfGabOptions();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat data TF Gab.', 'error');
      renderTfGabRows();
    }
    window.setTimeout(function () { elements.tfGabDate?.focus(); }, 0);
  }

  function closeTfGabModal() {
    if (!elements.tfGabModal) return;
    elements.tfGabModal.hidden = true;
    elements.tfGabForm?.reset();
    state.tfGabItems = [];
    state.tfGabAllocations = new Map();
  }

  function htiCashSourceBook() {
    return {
      type: 'kas',
      key: 'kas-kecil',
      value: 'kas:kas-kecil',
      label: 'KAS KECIL',
      sourceCoa: '1100',
      sourceAccountName: 'KAS SETARA KAS'
    };
  }

  function htiBankSourceBooks() {
    return (state.banks || []).filter(function (bank) {
      return text(bank?.key).indexOf('hti-') === 0;
    }).map(function (bank) {
      return {
        type: 'bank',
        key: text(bank.key),
        value: 'bank:' + text(bank.key),
        label: text(bank.label, bank.key),
        sourceCoa: text(bank.sourceCoa),
        sourceAccountName: text(bank.sourceAccountName, bank.label)
      };
    });
  }

  function htiTransferSourceByValue(value) {
    const clean = text(value);
    return [htiCashSourceBook()].concat(htiBankSourceBooks()).find(function (source) {
      return source.value === clean || source.key === clean;
    }) || null;
  }

  function renderHtiTransferFromOptions(selectedValue) {
    if (!elements.transferFrom) return;
    const selected = text(selectedValue, activeBankKey());
    clearNode(elements.transferFrom);
    htiBankSourceBooks().forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value;
      option.textContent = source.label;
      option.selected = source.key === selected || source.value === selected;
      elements.transferFrom.appendChild(option);
    });
  }

  function renderHtiTransferToOptions(selectedValue) {
    if (!elements.transferTo) return;
    const mode = state.htiTransferMode;
    const fromSource = htiTransferSourceByValue(elements.transferFrom?.value);
    const selected = text(selectedValue, elements.transferTo.value);
    clearNode(elements.transferTo);
    if (mode === 'tarik-tunai') {
      const cash = htiCashSourceBook();
      const option = document.createElement('option');
      option.value = cash.value;
      option.textContent = cash.label;
      option.selected = true;
      elements.transferTo.appendChild(option);
      elements.transferTo.disabled = true;
      return;
    }
    elements.transferTo.disabled = false;
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pilih bank tujuan';
    elements.transferTo.appendChild(placeholder);
    htiBankSourceBooks().filter(function (source) {
      return source.key !== fromSource?.key;
    }).forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value;
      option.textContent = source.label;
      option.selected = source.value === selected;
      elements.transferTo.appendChild(option);
    });
  }

  function htiExpenseAccountOptions() {
    return (state.coaAccounts || []).filter(function (account) {
      const coa = text(account.coa);
      const name = text(account.accountName).toUpperCase();
      return /^6/.test(coa) || name.includes('BIAYA') || name.includes(' BY ') || name.startsWith('BY ');
    });
  }

  function renderHtiTransferFeeAccountOptions(selectedValue) {
    if (!elements.transferFeeAccount) return;
    const selected = text(selectedValue, elements.transferFeeAccount.value || '6126');
    clearNode(elements.transferFeeAccount);
    const empty = document.createElement('option');
    empty.value = '';
    empty.textContent = 'Pilih akun biaya jika ada biaya';
    elements.transferFeeAccount.appendChild(empty);
    htiExpenseAccountOptions().forEach(function (account) {
      const option = document.createElement('option');
      option.value = text(account.coa);
      option.textContent = text(account.coa) + ' - ' + text(account.accountName);
      option.selected = text(account.coa) === selected;
      elements.transferFeeAccount.appendChild(option);
    });
  }

  function setHtiTransferAttachmentNote() {
    if (!elements.transferAttachmentNote) return;
    const selected = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.transferFile) : [];
    if (selected.length) {
      elements.transferAttachmentNote.textContent = window.clientPortalFormatFilesNote
        ? window.clientPortalFormatFilesNote(selected, 'File baru')
        : 'File baru: ' + selected.length + ' file';
      return;
    }
    const file = elements.transferFile?.files?.[0];
    elements.transferAttachmentNote.textContent = file
      ? 'File baru: ' + file.name + ' (' + formatFileSize(file.size) + ')'
      : 'Belum ada file dipilih.';
  }

  function resetHtiTransferForm(mode) {
    state.htiTransferMode = mode === 'tarik-tunai' ? 'tarik-tunai' : 'transfer-antar-bank';
    elements.transferForm?.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.transferFile);
    else if (elements.transferFile) elements.transferFile.value = '';
    if (elements.transferDate) elements.transferDate.value = today();
    renderHtiTransferFromOptions(activeBankKey());
    renderHtiTransferToOptions('');
    renderHtiTransferFeeAccountOptions('6126');
    if (elements.transferAmount) elements.transferAmount.value = '';
    if (elements.transferFee) elements.transferFee.value = '';
    setHtiTransferAttachmentNote();
  }

  function openHtiBankTransferModal(mode) {
    if (!isHtiClient() || !elements.transferModal) return;
    resetHtiTransferForm(mode);
    const withdraw = state.htiTransferMode === 'tarik-tunai';
    setText(elements.transferTitle, withdraw ? 'Tarik Tunai' : 'Transfer Antar Bank');
    setText(elements.transferMeta, withdraw
      ? 'Dari bank ke akun Kas. Jika ada biaya, catat di baris biaya.'
      : 'Pindah saldo antar bank. Kas dan bank sumber tidak muncul di tujuan.');
    setText(elements.transferSaveButton, withdraw ? 'Simpan Tarik Tunai' : 'Simpan Transfer');
    elements.transferModal.hidden = false;
    window.setTimeout(function () { elements.transferDate?.focus(); }, 0);
  }

  function closeHtiBankTransferModal() {
    if (!elements.transferModal) return;
    elements.transferModal.hidden = true;
    elements.transferForm?.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.transferFile);
    else if (elements.transferFile) elements.transferFile.value = '';
    setHtiTransferAttachmentNote();
  }

  async function postHtiBankWorkflowRow(options) {
    const payload = {
      htiWorkflow: text(options.workflow),
      bankKey: text(options.bankKey),
      tanggal: text(options.tanggal),
      coa: text(options.coa),
      keterangan: text(options.keterangan),
      uangMasuk: String(Number(options.uangMasuk || 0)),
      uangKeluar: String(Number(options.uangKeluar || 0)),
      pajak: '',
      ...(options.attachment || {})
    };
    return await requestJson(apiBase(), {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  async function submitHtiBankTransferForm(event) {
    event.preventDefault();
    if (!isHtiClient()) return;
    const from = htiTransferSourceByValue(elements.transferFrom?.value);
    const to = htiTransferSourceByValue(elements.transferTo?.value);
    const tanggal = text(elements.transferDate?.value);
    const amount = parseAmountInput(elements.transferAmount);
    const fee = parseAmountInput(elements.transferFee);
    const feeCoa = text(elements.transferFeeAccount?.value);
    if (!tanggal) {
      setAlert('Tanggal wajib diisi.', 'error');
      return;
    }
    if (!from || from.type !== 'bank') {
      setAlert('Dari bank wajib dipilih.', 'error');
      return;
    }
    if (!to) {
      setAlert('Tujuan kas/bank wajib dipilih.', 'error');
      return;
    }
    if (from.value === to.value) {
      setAlert('Bank sumber dan tujuan tidak boleh sama.', 'error');
      return;
    }
    if (amount <= 0) {
      setAlert('Nominal harus lebih besar dari 0.', 'error');
      return;
    }
    if (fee > 0 && !feeCoa) {
      setAlert('Akun biaya wajib dipilih jika ada biaya.', 'error');
      return;
    }
    if (elements.transferSaveButton) elements.transferSaveButton.disabled = true;
    setAlert('');
    try {
      const attachment = window.clientPortalBuildAttachmentPayload
        ? await window.clientPortalBuildAttachmentPayload(elements.transferFile)
        : await legacyAttachmentPayload(elements.transferFile);
      const baseDescription = (
        state.htiTransferMode === 'tarik-tunai'
          ? 'Tarik tunai dari ' + from.label + ' ke ' + to.label
          : 'Transfer antar bank dari ' + from.label + ' ke ' + to.label
      );
      let data = await postHtiBankWorkflowRow({
        workflow: state.htiTransferMode,
        bankKey: from.key,
        tanggal,
        coa: to.sourceCoa,
        keterangan: baseDescription,
        uangKeluar: amount,
        attachment
      });
      if (fee > 0) {
        data = await postHtiBankWorkflowRow({
          workflow: 'biaya-transfer',
          bankKey: from.key,
          tanggal,
          coa: feeCoa,
          keterangan: 'Biaya ' + baseDescription,
          uangKeluar: fee
        });
      }
      if (!data) return;
      state.activeBank = data.activeBank || state.activeBank;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      renderTabs();
      renderRows();
      closeHtiBankTransferModal();
      setAlert(state.htiTransferMode === 'tarik-tunai'
        ? 'Tarik tunai tersimpan dan Kas Kecil otomatis terhubung.'
        : 'Transfer antar bank tersimpan dan mutasi bank tujuan otomatis terhubung.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan transaksi kas/bank.', 'error');
    } finally {
      if (elements.transferSaveButton) elements.transferSaveButton.disabled = false;
    }
  }

  function htiBankInterestApi(entryId) {
    const suffix = entryId ? '/' + encodeURIComponent(entryId) : '';
    return apiBase() + '/interest-fees' + suffix;
  }

  function htiBankAdditionalExpenseAccounts() {
    return (state.coaAccounts || []).filter(function (account) {
      const coa = text(account.coa);
      const name = text(account.accountName).toUpperCase();
      if (['6121', '6122', '6123', '6125', '6126'].includes(coa)) return false;
      return /^61\d{2}$/.test(coa) && (
        name.startsWith('BIAYA ') ||
        name.startsWith('BY ') ||
        name.startsWith('BEBAN ') ||
        name.startsWith('PAJAK ') ||
        name.includes(' BIAYA ') ||
        name.includes(' BY ')
      );
    });
  }

  function htiBankInterestAccountLabel(coa, fallback) {
    const account = bankAccountByValue(coa);
    return text(account?.coa, coa) + ' - ' + text(account?.accountName, fallback);
  }

  function htiBankInterestFeeAccountOptions(selectedValue) {
    const selected = text(selectedValue, '6124');
    return htiBankAdditionalExpenseAccounts().map(function (account) {
      const coa = text(account.coa);
      return '<option value="' + escapeHtml(coa) + '"' + (coa === selected ? ' selected' : '') + '>' +
        escapeHtml(coa + ' - ' + text(account.accountName)) + '</option>';
    }).join('');
  }

  function htiBankInterestFeeRows() {
    return Array.from(elements.interestFeeRows?.querySelectorAll('[data-hti-bank-interest-fee-row]') || []);
  }

  function readHtiBankInterestFeeRows() {
    return htiBankInterestFeeRows().map(function (row) {
      return {
        description: '',
        coa: text(row.querySelector('[data-interest-fee-field="coa"]')?.value),
        amount: parseAmountInput(row.querySelector('[data-interest-fee-field="amount"]'))
      };
    }).filter(function (row) {
      return row.description || row.amount > 0;
    });
  }

  function appendHtiBankInterestFeeRow(values) {
    if (!elements.interestFeeRows) return null;
    const rowValues = values || {};
    const row = document.createElement('div');
    row.className = 'hti-bank-interest-fee-row';
    row.setAttribute('data-hti-bank-interest-fee-row', 'true');
    row.innerHTML = [
      '<label class="form-field"><span>Nama Akun Biaya Lainnya</span><select data-interest-fee-field="coa" aria-label="Nomor akun biaya">' + htiBankInterestFeeAccountOptions(rowValues.coa || '6124') + '</select></label>',
      '<label class="form-field"><span>Nominal Biaya Lainnya</span><input type="text" inputmode="decimal" data-rupiah="true" data-interest-fee-field="amount" autocomplete="off" placeholder="0" aria-label="Nominal pajak atau biaya" value="' + escapeHtml(rowValues.amount > 0 ? formatAmount(rowValues.amount) : '') + '"></label>',
      '<button class="icon-button hti-bank-interest-fee-remove" type="button" aria-label="Hapus baris biaya" title="Hapus baris">',
        '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
      '</button>'
    ].join('');
    row.querySelector('.hti-bank-interest-fee-remove')?.addEventListener('click', function () {
      if (htiBankInterestFeeRows().length <= 1) {
        row.querySelector('[data-interest-fee-field="coa"]').value = '6124';
        row.querySelector('[data-interest-fee-field="amount"]').value = '';
        return;
      }
      row.remove();
      syncHtiBankInterestFeeRemoveButtons();
    });
    const amountInput = row.querySelector('[data-interest-fee-field="amount"]');
    amountInput?.addEventListener('blur', function () {
      const amount = parseAmountInput(amountInput);
      amountInput.value = amount > 0 ? formatAmount(amount) : '';
    });
    amountInput?.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      const nextRow = appendHtiBankInterestFeeRow({ coa: '6124' });
      nextRow?.querySelector('[data-interest-fee-field="coa"]')?.focus();
    });
    elements.interestFeeRows.appendChild(row);
    syncHtiBankInterestFeeRemoveButtons();
    return row;
  }

  function syncHtiBankInterestFeeRemoveButtons() {
    const rows = htiBankInterestFeeRows();
    rows.forEach(function (row) {
      const button = row.querySelector('.hti-bank-interest-fee-remove');
      if (button) button.hidden = rows.length <= 1;
    });
  }

  function renderHtiBankInterestBankOptions(selectedValue) {
    if (!elements.interestBank) return;
    const selected = text(selectedValue, activeBankKey());
    clearNode(elements.interestBank);
    (state.banks || []).forEach(function (bank) {
      const option = document.createElement('option');
      option.value = text(bank.key);
      option.textContent = text(bank.label, bank.key);
      option.selected = text(bank.key) === selected;
      elements.interestBank.appendChild(option);
    });
  }

  function setHtiBankInterestAttachmentNote(entry) {
    if (!elements.interestAttachmentNote) return;
    const selected = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.interestFile) : [];
    if (selected.length) {
      elements.interestAttachmentNote.textContent = window.clientPortalFormatFilesNote
        ? window.clientPortalFormatFilesNote(selected, 'File baru')
        : 'File baru: ' + selected.length + ' file';
      return;
    }
    if (entry?.hasAttachment) {
      elements.interestAttachmentNote.textContent = text(entry.attachmentName, 'Dokumen tersimpan') +
        (Number(entry.attachmentSize || 0) > 0 ? ' (' + formatFileSize(entry.attachmentSize) + ')' : '');
      return;
    }
    elements.interestAttachmentNote.textContent = 'Belum ada file dipilih.';
  }

  function prepareHtiBankInterestUpload() {
    if (window.clientPortalEnhanceUploadInputs) window.clientPortalEnhanceUploadInputs();
    const qrButton = elements.interestFile?.parentElement?.querySelector('.client-upload-qr-button');
    if (qrButton) qrButton.textContent = 'Upload dari HP';
  }

  function htiBankInterestSnapshot() {
    const files = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.interestFile) : [];
    return JSON.stringify({
      date: text(elements.interestDate?.value),
      bank: text(elements.interestBank?.value),
      income: parseAmountInput(elements.interestIncomeAmount),
      admin: parseAmountInput(elements.interestAdminAmount),
      fees: readHtiBankInterestFeeRows(),
      files: files.map(function (file) { return [file.name, file.size, file.lastModified]; })
    });
  }

  function resetHtiBankInterestForm(entry) {
    const current = entry || {};
    state.htiBankInterestId = text(current.id);
    state.htiBankInterestEntry = current;
    elements.interestForm?.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.interestFile);
    else if (elements.interestFile) elements.interestFile.value = '';
    if (elements.interestDate) elements.interestDate.value = text(current.tanggal, today());
    renderHtiBankInterestBankOptions(current.bankKey || activeBankKey());
    if (elements.interestIncomeAccount) elements.interestIncomeAccount.value = htiBankInterestAccountLabel('6121', 'PENDAPATAN JASA GIRO');
    if (elements.interestAdminAccount) elements.interestAdminAccount.value = htiBankInterestAccountLabel('6126', 'BIAYA ADM BANK');
    if (elements.interestIncomeAmount) elements.interestIncomeAmount.value = Number(current.incomeAmount || 0) > 0 ? formatAmount(current.incomeAmount) : '';
    if (elements.interestAdminAmount) elements.interestAdminAmount.value = Number(current.adminAmount || 0) > 0 ? formatAmount(current.adminAmount) : '';
    clearNode(elements.interestFeeRows);
    const feeRows = Array.isArray(current.feeRows) && current.feeRows.length ? current.feeRows : [{ coa: '6124' }];
    feeRows.forEach(appendHtiBankInterestFeeRow);
    setHtiBankInterestAttachmentNote(current);
    if (elements.interestDeleteButton) elements.interestDeleteButton.hidden = !state.htiBankInterestId;
    setText(elements.interestTitle, state.htiBankInterestId ? 'Ubah Bunga & Biaya Bank' : 'Bunga & Biaya Bank');
    setText(elements.interestMeta, state.htiBankInterestId
      ? 'Koreksi dari sumber ini akan memperbarui seluruh baris mutasi dan jurnal terkait.'
      : 'Catat jasa giro, administrasi, pajak, dan biaya bank dalam satu proses.');
    state.htiBankInterestSnapshot = htiBankInterestSnapshot();
  }

  async function openHtiBankInterestModal(entryId) {
    if (!isHtiClient() || !elements.interestModal) return;
    let entry = null;
    if (entryId) {
      try {
        const data = await requestJson(htiBankInterestApi(entryId));
        entry = data?.entry || null;
      } catch (err) {
        setAlert(err.message || 'Gagal memuat transaksi bunga dan biaya bank.', 'error');
        return;
      }
    }
    resetHtiBankInterestForm(entry);
    prepareHtiBankInterestUpload();
    elements.interestModal.hidden = false;
    document.body.classList.add('modal-open');
    window.setTimeout(function () { elements.interestDate?.focus(); }, 0);
  }

  async function closeHtiBankInterestModal(force) {
    if (!elements.interestModal || elements.interestModal.hidden) return;
    if (!force && state.htiBankInterestSnapshot && htiBankInterestSnapshot() !== state.htiBankInterestSnapshot) {
      const ok = await window.clientPortalConfirm({
        title: 'Keluar Tanpa Menyimpan?',
        meta: 'Perubahan pada bunga dan biaya bank belum tersimpan.',
        message: 'Data yang sudah diisi akan hilang.',
        cancelText: 'Kembali',
        confirmText: 'Keluar Tanpa Simpan'
      });
      if (!ok) return;
    }
    elements.interestModal.hidden = true;
    elements.interestForm?.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.interestFile);
    else if (elements.interestFile) elements.interestFile.value = '';
    state.htiBankInterestId = '';
    state.htiBankInterestSnapshot = '';
    state.htiBankInterestEntry = null;
    document.body.classList.toggle('modal-open', Boolean(!elements.modal.hidden) || Boolean(elements.transferModal && !elements.transferModal.hidden));
  }

  async function submitHtiBankInterestForm(event) {
    event.preventDefault();
    if (!isHtiClient()) return;
    const tanggal = text(elements.interestDate?.value);
    const bankKey = text(elements.interestBank?.value);
    const incomeAmount = parseAmountInput(elements.interestIncomeAmount);
    const adminAmount = parseAmountInput(elements.interestAdminAmount);
    const feeRows = readHtiBankInterestFeeRows();
    if (!tanggal) {
      setAlert('Tanggal wajib diisi.', 'error');
      return;
    }
    if (!bankKey) {
      setAlert('Bank wajib dipilih.', 'error');
      return;
    }
    if (incomeAmount <= 0 && adminAmount <= 0 && !feeRows.some(function (row) { return row.amount > 0; })) {
      setAlert('Isi minimal satu nominal penghasilan atau biaya.', 'error');
      return;
    }
    const invalidFee = feeRows.find(function (row) { return !row.coa || row.amount <= 0; });
    if (invalidFee) {
      setAlert('Setiap baris biaya wajib memiliki akun dan nominal lebih dari 0.', 'error');
      return;
    }
    if (elements.interestSaveButton) elements.interestSaveButton.disabled = true;
    setAlert('');
    try {
      const attachment = window.clientPortalBuildAttachmentPayload
        ? await window.clientPortalBuildAttachmentPayload(elements.interestFile)
        : await legacyAttachmentPayload(elements.interestFile);
      const entryId = state.htiBankInterestId;
      const data = await requestJson(htiBankInterestApi(entryId), {
        method: entryId ? 'PUT' : 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankKey, tanggal, incomeAmount, adminAmount, feeRows, ...attachment })
      });
      if (!data) return;
      state.activeBank = data.activeBank || state.activeBank;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      renderTabs();
      renderRows();
      await closeHtiBankInterestModal(true);
      setAlert(entryId ? 'Bunga dan biaya bank diperbarui.' : 'Bunga dan biaya bank tersimpan dan jurnal otomatis terbentuk.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan bunga dan biaya bank.', 'error');
    } finally {
      if (elements.interestSaveButton) elements.interestSaveButton.disabled = false;
    }
  }

  async function deleteHtiBankInterestEntry() {
    const entryId = state.htiBankInterestId;
    if (!entryId) return;
    const ok = await window.clientPortalConfirm({
      title: 'Hapus Bunga & Biaya Bank?',
      meta: 'Seluruh mutasi dan jurnal yang berasal dari input ini ikut dihapus.',
      message: 'Tindakan ini tidak dapat dibatalkan.',
      cancelText: 'Batal',
      confirmText: 'Hapus'
    });
    if (!ok) return;
    if (elements.interestDeleteButton) elements.interestDeleteButton.disabled = true;
    try {
      const data = await requestJson(htiBankInterestApi(entryId), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      state.activeBank = data.activeBank || state.activeBank;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      renderTabs();
      renderRows();
      await closeHtiBankInterestModal(true);
      setAlert('Bunga dan biaya bank beserta jurnalnya dihapus.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus bunga dan biaya bank.', 'error');
    } finally {
      if (elements.interestDeleteButton) elements.interestDeleteButton.disabled = false;
    }
  }

  function buildTfGabAllocationsFromLines() {
    const groupMap = tfGabProjectGroupMap();
    const usedProjects = new Set();
    const allocations = [];
    let total = 0;
    tfGabLineRows().forEach(function (row) {
      const key = text(row.querySelector('[data-tf-gab-field="project"]')?.value);
      const amount = roundClientPortalLikeAmount(parseAmountInput(row.querySelector('[data-tf-gab-field="payment"]')));
      if (!key && amount <= 0) return;
      const group = groupMap.get(key);
      if (!group) throw new Error('Pilih kode proyek dari daftar proyek terbuka.');
      if (usedProjects.has(key)) throw new Error('Kode proyek ' + text(group.projectNo, '-') + ' dipilih lebih dari satu kali.');
      usedProjects.add(key);
      if (amount <= 0) throw new Error('Pelunasan proyek ' + text(group.projectNo, '-') + ' harus lebih dari Rp0.');
      if (amount > Number(group.outstandingAmount || 0) + 0.5) {
        throw new Error('Pelunasan proyek ' + text(group.projectNo, '-') + ' melebihi sisa tagihan.');
      }
      total = roundClientPortalLikeAmount(total + amount);
      let remaining = amount;
      group.items.forEach(function (item) {
        if (remaining <= 0.5) return;
        const itemOutstanding = Number(item.outstandingAmount || 0);
        const itemAmount = roundClientPortalLikeAmount(Math.min(itemOutstanding, remaining));
        if (itemAmount <= 0) return;
        allocations.push({
          sourceTable: item.sourceTable || item.sourceType,
          entryId: item.id,
          amount: itemAmount
        });
        remaining = roundClientPortalLikeAmount(remaining - itemAmount);
      });
      if (remaining > 0.5) {
        throw new Error('Alokasi proyek ' + text(group.projectNo, '-') + ' belum bisa dibagi ke tagihan terbuka.');
      }
    });
    return { allocations, total };
  }

  function roundClientPortalLikeAmount(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  async function submitTfGabForm(event) {
    event.preventDefault();
    if (!isHtiClient()) return;
    if (elements.tfGabSaveButton) elements.tfGabSaveButton.disabled = true;
    setAlert('');
    try {
      if (!text(elements.tfGabDate?.value)) throw new Error('Tanggal TF Gab wajib diisi.');
      const party = normalizeTfGabPartyInput();
      if (!party) throw new Error('Pilih nama customer/supplier dari daftar tagihan terbuka.');
      const built = buildTfGabAllocationsFromLines();
      const allocations = built.allocations;
      const transferAmount = built.total;
      if (transferAmount <= 0) throw new Error('Pelunasan harus lebih besar dari Rp0.');
      if (!allocations.length) throw new Error('Alokasi pembayaran gabungan belum valid.');
      const data = await requestJson(tfGabApiBase(), {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKind: text(elements.tfGabType?.value, 'sales'),
          bankKey: text(elements.tfGabBank?.value, activeBankKey()),
          tanggal: text(elements.tfGabDate?.value),
          amount: transferAmount,
          keterangan: text(elements.tfGabDescription?.value, 'Bayar gabungan ' + party.label),
          allocations
        })
      });
      if (!data) return;
      const nextBankKey = text(data.activeBank?.key, text(elements.tfGabBank?.value, activeBankKey()));
      if (data.activeBank?.key) {
        const url = new URL(window.location.href);
        url.searchParams.set('bank', data.activeBank.key);
        window.history.replaceState({}, '', url.pathname + url.search);
      }
      closeTfGabModal();
      await loadBukuBank(nextBankKey);
      setAlert('TF Gab tersimpan dan alokasi pembayaran sudah masuk ke invoice/faktur terkait.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan TF Gab.', 'error');
    } finally {
      if (elements.tfGabSaveButton) elements.tfGabSaveButton.disabled = false;
    }
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
    if (guardPostedEntry(entry, 'mengubah')) return;
    if (isTbbClient()) {
      elements.form.reset();
      if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
      elements.entryId.value = entry.id || '';
      renderTbbBankInputForm(entry, false);
      showModal();
      return;
    }
    const htiPaymentCorrection = isHtiClient() && isHtiPaymentMirror(entry);
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = entry.id || '';
    resetBankDetailRows({
      tanggal: entry.tanggal || today(),
      coa: entry.coa,
      accountName: entry.accountName,
      keterangan: entryDescription(entry),
      uangMasuk: entry.uangMasuk,
      uangKeluar: entry.uangKeluar,
      pajak: entry.pajak
    });
    if (htiPaymentCorrection) {
      elements.detailRows?.querySelectorAll('[data-bank-detail-field="coa"], [data-bank-detail-field="accountName"], [data-bank-detail-field="keterangan"], [data-bank-detail-field="pajak"]').forEach(function (control) {
        control.disabled = true;
        control.setAttribute('aria-readonly', 'true');
      });
      elements.detailRows?.querySelectorAll('[data-bank-detail-remove]').forEach(function (button) {
        button.hidden = true;
      });
    }
    setAttachmentNote(entry);
    setText(elements.modalTitle, htiPaymentCorrection ? 'Ubah Pembayaran' : (isHtiExpense(entry) ? 'Ubah Biaya' : 'Ubah Buku Bank'));
    setText(elements.modalMeta, htiPaymentCorrection
      ? text(state.activeBank?.label, 'Bank') + ' | Koreksi pelunasan dari transaksi sumber.'
      : text(state.activeBank?.label, 'Bank') + ' | ' + text(entry.coa) + ' - ' + text(entry.accountName, 'Data Buku Bank'));
    removeTbbBookSwitch();
    showModal();
  }

  function showModal() {
    elements.modal.hidden = false;
    bindModalWindowControls();
    resetModalWindow();
    window.setTimeout(function () {
      const customFocus = elements.form.querySelector('[data-tbb-bank-header="tanggal"]');
      if (customFocus) customFocus.focus();
      else elements.detailRows?.querySelector('[data-bank-detail-field="tanggal"]')?.focus();
    }, 0);
  }

  function closeModal() {
    elements.modal.hidden = true;
    stopModalDrag();
    elements.form.querySelectorAll('[data-bankbook-view-only]').forEach(function (panel) {
      panel.remove();
    });
    elements.form.querySelectorAll('[data-bankbook-view-action]').forEach(function (button) {
      button.remove();
    });
    elements.saveButton.hidden = false;
    elements.cancelButton.textContent = 'Batal';
    setNativeBankFormVisible(true);
  }

  function canOpenHtiMutationSource(entry) {
    if (!isHtiClient()) return false;
    if (isHtiAdvance(entry)) return true;
    if (isHtiBankInterest(entry)) return true;
    if (isHtiExpense(entry)) return Boolean(htiPaymentSourceUrl(entry));
    return isHtiPaymentMirror(entry) && !isHtiTfGabMirror(entry) && Boolean(htiPaymentSourceUrl(entry));
  }

  function openHtiMutationSource(entry) {
    if (!canOpenHtiMutationSource(entry)) {
      setAlert(isHtiTfGabMirror(entry)
        ? 'Pembayaran gabungan lama tidak bisa diubah dari mutasi. Batalkan pembayaran dari transaksi sumber jika perlu koreksi.'
        : 'Mutasi ini belum punya transaksi sumber yang bisa diubah dari sini.', 'info');
      return;
    }
    if (isHtiAdvance(entry)) {
      closeModal();
      openAdvanceEditModal(entry);
    } else if (isHtiBankInterest(entry)) {
      closeModal();
      openHtiBankInterestModal(entry.htiBankInterestId);
    } else {
      openHtiSourcePaymentFrame(entry);
    }
  }

  function closeHtiSourcePaymentFrame(refreshAfterClose) {
    const backdrop = document.getElementById('htiSourcePaymentFrameModal');
    if (backdrop) backdrop.remove();
    document.body.classList.toggle('modal-open',
      Boolean(!elements.modal.hidden)
      || Boolean(elements.advanceModal && !elements.advanceModal.hidden)
      || Boolean(elements.transferModal && !elements.transferModal.hidden));
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
            '<span>' + escapeHtml(text(entryDescription(entry), 'Transaksi sumber')) + '</span>',
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

  function renderBankViewOnlyForm(entry) {
    setNativeBankFormVisible(false);
    elements.form.querySelectorAll('[data-bankbook-view-only]').forEach(function (panel) {
      panel.remove();
    });
    elements.form.querySelectorAll('[data-bankbook-view-action]').forEach(function (button) {
      button.remove();
    });

    const footer = elements.form.querySelector('.portal-modal-footer');
    const panel = document.createElement('section');
    panel.className = 'bankbook-view-only';
    panel.setAttribute('data-bankbook-view-only', 'true');
    const hasDocument = Boolean(entry && entry.hasAttachment);
    const documentName = text(entry?.attachmentName, 'Lampiran transaksi');
    panel.innerHTML = [
      '<div class="bankbook-view-summary">',
        '<div><span>Tanggal</span><strong>' + escapeHtml(formatDisplayDate(entry?.tanggal)) + '</strong></div>',
        '<div><span>Bank</span><strong>' + escapeHtml(text(state.activeBank?.label, 'Buku Bank')) + '</strong></div>',
        '<div><span>No. Akun</span><strong>' + escapeHtml(text(entry?.coa, '-')) + '</strong></div>',
        '<div><span>Nama Akun</span><strong>' + escapeHtml(text(entry?.accountName, '-')) + '</strong></div>',
      '</div>',
      '<div class="bankbook-view-section">',
        '<div class="bankbook-view-section-header"><strong>Rincian Transaksi</strong><small>Tampilan hanya baca.</small></div>',
        '<div class="bankbook-view-table-wrap">',
          '<table class="bankbook-view-table">',
            '<thead><tr><th>Keterangan</th><th>' + escapeHtml(moneyInLabel()) + '</th><th>' + escapeHtml(moneyOutLabel()) + '</th><th>Saldo</th><th>Pajak</th></tr></thead>',
            '<tbody><tr>' +
              '<td>' + escapeHtml(entryDescription(entry) || '-') + '</td>' +
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
            (hasDocument ? '<button class="ghost-button" type="button" data-bankbook-view-file>Lihat Dokumen</button>' : '<em>Belum ada</em>'),
          '</label>',
        '</div>',
      '</div>'
    ].join('');
    if (footer) elements.form.insertBefore(panel, footer);
    else elements.form.appendChild(panel);
    const viewFileButton = panel.querySelector('[data-bankbook-view-file]');
    if (viewFileButton) viewFileButton.addEventListener('click', function () {
      openFileViewer(entry);
    });
    elements.saveButton.hidden = true;
    if (footer && canOpenHtiMutationSource(entry)) {
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'ghost-button';
      editButton.textContent = 'Ubah';
      editButton.setAttribute('data-bankbook-view-action', 'edit-source');
      editButton.addEventListener('click', function () {
        openHtiMutationSource(entry);
      });
      footer.insertBefore(editButton, elements.cancelButton);
    }
    elements.cancelButton.textContent = 'Tutup';
    setText(elements.modalTitle, 'Lihat Buku Bank');
    setText(elements.modalMeta, text(state.activeBank?.label, 'Buku Bank') + ' | Tampilan terkunci.');
  }

  function openViewOnlyModal(entry) {
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = entry.id || '';
    if (isTbbClient()) renderTbbBankInputForm(entry, true);
    else renderBankViewOnlyForm(entry);
    showModal();
  }

  function tbbBankJournalLines(entry) {
    const source = tbbBankSourceAccount();
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
        { coa: source.coa, accountName: source.accountName, description: entryDescription(entry), debit: amount, credit: 0 },
        { coa: contra.coa, accountName: contra.accountName, description: entryDescription(entry), debit: 0, credit: amount }
      ];
    }
    return [
      { coa: contra.coa, accountName: contra.accountName, description: entryDescription(entry), debit: amount, credit: 0 },
      { coa: source.coa, accountName: source.accountName, description: entryDescription(entry), debit: 0, credit: amount }
    ];
  }

  function tbbBankJournalRowHtml(line) {
    return '<tr>' +
      '<td>' + escapeHtml(line.coa) + '</td>' +
      '<td>' + escapeHtml(line.accountName) + '</td>' +
      '<td>' + escapeHtml(line.description || '-') + '</td>' +
      '<td class="number">' + escapeHtml(line.debit ? formatAmount(line.debit) : '-') + '</td>' +
      '<td class="number">' + escapeHtml(line.credit ? formatAmount(line.credit) : '-') + '</td>' +
    '</tr>';
  }

  function openJournalModal(entry) {
    const lines = tbbBankJournalLines(entry);
    const totalDebit = lines.reduce(function (sum, line) { return sum + Number(line.debit || 0); }, 0);
    const totalCredit = lines.reduce(function (sum, line) { return sum + Number(line.credit || 0); }, 0);
    elements.form.reset();
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.entryId.value = entry.id || '';
    setNativeBankFormVisible(false);
    const oldPanel = elements.form.querySelector('[data-tbb-bank-journal]');
    if (oldPanel) oldPanel.remove();
    const footer = elements.form.querySelector('.portal-modal-footer');
    const panel = document.createElement('div');
    panel.setAttribute('data-tbb-bank-journal', 'true');
    panel.className = 'ledger-journal-body tbb-cash-journal-view';
    panel.innerHTML = [
      '<div class="ledger-journal-summary">',
        '<div><span>Tanggal</span><strong>' + escapeHtml(formatDisplayDate(entry.tanggal)) + '</strong></div>',
        '<div><span>Buku</span><strong>' + escapeHtml(tbbBankBookLabel()) + '</strong></div>',
        '<div><span>No. Bukti</span><strong>' + escapeHtml(tbbBankExistingNoBukti(entry) || '-') + '</strong></div>',
      '</div>',
      '<div class="adjustment-journal-view">',
        '<table class="cashbook-table ledger-journal-table adjustment-journal-view-table">',
          '<thead><tr><th>No Akun</th><th>Nama Akun</th><th>Keterangan</th><th>Debet</th><th>Kredit</th></tr></thead>',
          '<tbody>',
            (lines.length ? lines.map(tbbBankJournalRowHtml).join('') : '<tr><td colspan="5">Belum ada nilai jurnal.</td></tr>'),
            '<tr class="adjustment-journal-total-row"><td colspan="3">Total</td><td class="number">' + escapeHtml(formatAmount(totalDebit) || '0') + '</td><td class="number">' + escapeHtml(formatAmount(totalCredit) || '0') + '</td></tr>',
          '</tbody>',
        '</table>',
      '</div>'
    ].join('');
    elements.form.insertBefore(panel, footer);
    elements.saveButton.hidden = true;
    elements.cancelButton.textContent = 'Tutup';
    setText(elements.modalTitle, 'Jurnal ' + tbbBankBookLabel());
    setText(elements.modalMeta, formatDisplayDate(entry.tanggal) + ' | ' + text(entryDescription(entry), 'Transaksi Buku Bank'));
    showModal();
  }

  function setAttachmentNote(entry, file) {
    if (!elements.attachmentNote) return;
    const customNote = elements.form?.querySelector('[data-tbb-bank-attachment-note]');
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

  async function submitBankDetailForm() {
    const entryId = text(elements.entryId.value);
    const rows = collectBankDetailRows();
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
        throw new Error('Baris ' + row.rowNumber + ': isi salah satu saja antara ' + moneyInLabel() + ' dan ' + moneyOutLabel() + '.');
      }
      const url = entryId ? apiBase() + '/' + encodeURIComponent(entryId) : apiBase();
      latestData = await requestJson(url, {
        method: entryId ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bankKey: activeBankKey(),
          tanggal: row.tanggal,
          coa: row.coa,
          keterangan: normalizeDebitCreditDescription(row.keterangan, row.uangMasuk, row.uangKeluar),
          uangMasuk: String(row.uangMasuk),
          uangKeluar: String(row.uangKeluar),
          pajak: row.pajak,
          ...(index === 0 ? attachment : {})
        })
      });
    }

    if (!latestData) return;
    state.activeBank = latestData.activeBank || state.activeBank;
    state.entries = Array.isArray(latestData.entries) ? latestData.entries : state.entries;
    renderTabs();
    renderRows();
    closeModal();
    setAlert(rows.length + ' baris Buku Bank tersimpan.', 'info');
  }

  async function submitForm(event) {
    event.preventDefault();
    const tbbPanel = elements.form.querySelector('[data-tbb-bank-form]');
    if (tbbPanel) {
      if (tbbPanel.getAttribute('data-readonly') === 'true') return;
      elements.saveButton.disabled = true;
      setAlert('');
      try {
        await submitTbbBankForm();
      } catch (err) {
        setAlert(err.message || 'Gagal menyimpan BUKU KAS.', 'error');
      } finally {
        elements.saveButton.disabled = false;
      }
      return;
    }
    elements.saveButton.disabled = true;
    setAlert('');
    try {
      await submitBankDetailForm();
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan Buku Bank.', 'error');
    } finally {
      elements.saveButton.disabled = false;
    }
  }

  async function updateEntryTax(entry, pajak, select) {
    if (guardPostedEntry(entry, 'mengubah pilihan pajak')) {
      if (select) select.value = entry?.pajak || '';
      return;
    }
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
          bankKey: activeBankKey(),
          tanggal: entry.tanggal,
          coa: entry.coa,
          keterangan: entryDescription(entry),
          uangMasuk: entry.uangMasuk,
          uangKeluar: entry.uangKeluar,
          pajak
        })
      });
      if (!data) return;
      state.activeBank = data.activeBank || state.activeBank;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      renderTabs();
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
    if (guardPostedEntry(entry, 'menghapus')) return false;
    if (!silent) {
      const ok = await window.clientPortalConfirm({
        title: 'Hapus Buku Bank',
        meta: 'Data yang dihapus tidak masuk laporan.',
        message: 'Hapus data Buku Bank ini?',
        cancelText: 'Batal',
        confirmText: 'Hapus'
      });
      if (!ok) return false;
    }
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entry.id), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!data) return false;
      state.activeBank = data.activeBank || state.activeBank;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.selectedIds.delete(text(entry.id));
      renderTabs();
      renderRows();
      if (!silent) setAlert('Data Buku Bank dihapus.', 'info');
      return true;
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus Buku Bank.', 'error');
      return false;
    }
  }

  async function deleteSelectedEntries() {
    const ids = Array.from(state.selectedIds);
    if (!ids.length) return;
    const ok = await window.clientPortalConfirm({
      title: 'Hapus Data Terpilih',
      meta: 'Data yang dihapus tidak masuk laporan.',
      message: 'Hapus ' + ids.length + ' data Buku Bank yang dipilih?',
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
    setAlert(deletedCount + ' data Buku Bank dihapus.', 'info');
  }

  async function openFileViewer(entry) {
    if (!entry || !entry.hasAttachment) {
      setAlert('Belum ada file ter-upload untuk data Buku Bank ini.', 'info');
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

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', function () { loadBukuBank(); });
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.addButton) elements.addButton.addEventListener('click', openCreateModal);
  if (elements.withdrawButton) elements.withdrawButton.addEventListener('click', function () { openHtiBankTransferModal('tarik-tunai'); });
  if (elements.transferButton) elements.transferButton.addEventListener('click', function () { openHtiBankTransferModal('transfer-antar-bank'); });
  if (elements.interestButton) elements.interestButton.addEventListener('click', function () { openHtiBankInterestModal(); });
  if (elements.mutationButton) elements.mutationButton.addEventListener('click', function () {
    setAlert('Cek Mutasi aktif. Klik satu baris untuk melihat rincian transaksi.', 'info');
  });
  if (elements.advanceButton) elements.advanceButton.addEventListener('click', openAdvanceCreateModal);
  if (elements.exportButton) elements.exportButton.addEventListener('click', exportRows);
  if (elements.deleteSelectedButton) elements.deleteSelectedButton.addEventListener('click', deleteSelectedEntries);
  if (elements.searchInput) elements.searchInput.addEventListener('input', handleSearchInput);
  if (elements.selectAll) elements.selectAll.addEventListener('change', toggleSelectAll);
  if (elements.templateButton) elements.templateButton.addEventListener('click', downloadImportTemplate);
  if (elements.importButton) {
    elements.importButton.addEventListener('click', function () {
      if (elements.importFile) elements.importFile.click();
    });
  }
  if (elements.importFile) {
    elements.importFile.addEventListener('change', function () {
      const file = elements.importFile.files && elements.importFile.files[0];
      importCsvFile(file);
    });
  }
  if (elements.closeButton) elements.closeButton.addEventListener('click', closeModal);
  if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeModal);
  if (elements.advanceCloseButton) elements.advanceCloseButton.addEventListener('click', closeAdvanceModal);
  if (elements.advanceCancelButton) elements.advanceCancelButton.addEventListener('click', closeAdvanceModal);
  if (elements.transferCloseButton) elements.transferCloseButton.addEventListener('click', closeHtiBankTransferModal);
  if (elements.transferCancelButton) elements.transferCancelButton.addEventListener('click', closeHtiBankTransferModal);
  if (elements.interestCloseButton) elements.interestCloseButton.addEventListener('click', function () { closeHtiBankInterestModal(false); });
  if (elements.interestCancelButton) elements.interestCancelButton.addEventListener('click', function () { closeHtiBankInterestModal(false); });
  if (elements.interestDeleteButton) elements.interestDeleteButton.addEventListener('click', deleteHtiBankInterestEntry);
  if (elements.advanceModal) {
    elements.advanceModal.addEventListener('click', function (event) {
      if (event.target === elements.advanceModal) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }
  if (elements.transferModal) {
    elements.transferModal.addEventListener('click', function (event) {
      if (event.target === elements.transferModal) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }
  if (elements.interestModal) {
    elements.interestModal.addEventListener('click', function (event) {
      if (event.target === elements.interestModal) {
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }
  if (elements.advanceType) elements.advanceType.addEventListener('change', syncAdvancePartyMode);
  if (elements.advancePartyCode) {
    ['change', 'blur'].forEach(function (eventName) {
      elements.advancePartyCode.addEventListener(eventName, function () { syncAdvanceParty('code'); });
    });
  }
  if (elements.advanceParty) {
    ['change', 'blur'].forEach(function (eventName) {
      elements.advanceParty.addEventListener(eventName, function () { syncAdvanceParty('name'); });
    });
  }
  if (elements.advanceForm) elements.advanceForm.addEventListener('submit', submitAdvanceForm);
  if (elements.transferForm) elements.transferForm.addEventListener('submit', submitHtiBankTransferForm);
  if (elements.interestForm) elements.interestForm.addEventListener('submit', submitHtiBankInterestForm);
  if (elements.transferFrom) elements.transferFrom.addEventListener('change', function () {
    renderHtiTransferToOptions('');
  });
  if (elements.transferFee) {
    elements.transferFee.addEventListener('blur', function () {
      const fee = parseAmountInput(elements.transferFee);
      elements.transferFee.value = fee > 0 ? formatAmount(fee) : '';
    });
  }
  if (elements.transferAmount) {
    elements.transferAmount.addEventListener('blur', function () {
      const amount = parseAmountInput(elements.transferAmount);
      elements.transferAmount.value = amount > 0 ? formatAmount(amount) : '';
    });
  }
  [elements.interestIncomeAmount, elements.interestAdminAmount].forEach(function (input) {
    if (!input) return;
    input.addEventListener('blur', function () {
      const amount = parseAmountInput(input);
      input.value = amount > 0 ? formatAmount(amount) : '';
    });
  });
  if (elements.advanceFile) {
    elements.advanceFile.addEventListener('change', function () {
      const file = elements.advanceFile.files && elements.advanceFile.files[0];
      setAdvanceAttachmentNote(null, file || null);
    });
  }
  if (elements.transferFile) {
    elements.transferFile.addEventListener('change', setHtiTransferAttachmentNote);
    elements.transferFile.addEventListener('client-portal-upload-files', setHtiTransferAttachmentNote);
  }
  if (elements.interestFile) {
    elements.interestFile.addEventListener('change', function () { setHtiBankInterestAttachmentNote(state.htiBankInterestEntry); });
    elements.interestFile.addEventListener('client-portal-upload-files', function () { setHtiBankInterestAttachmentNote(state.htiBankInterestEntry); });
  }
  if (elements.interestAttachmentPickButton) {
    elements.interestAttachmentPickButton.addEventListener('click', function () {
      elements.interestFile?.click();
    });
  }
  if (elements.addDetailRowButton) {
    elements.addDetailRowButton.addEventListener('click', function () {
      const row = appendBankDetailRow({ tanggal: today() });
      row?.querySelector('[data-bank-detail-field="tanggal"]')?.focus();
    });
  }
  if (elements.form) elements.form.addEventListener('submit', submitForm);
  if (elements.form) {
    elements.form.addEventListener('click', function (event) {
      if (event.target.closest('[data-tbb-bank-add-row]')) {
        appendTbbBankInputRow();
        return;
      }
      if (event.target.closest('[data-tbb-bank-select-file]')) {
        event.preventDefault();
        if (elements.attachmentFile) elements.attachmentFile.click();
        return;
      }
      if (event.target.closest('[data-tbb-bank-upload-qr]')) {
        event.preventDefault();
        const qrButton = elements.attachmentFile?.parentElement?.querySelector('.client-upload-qr-button');
        if (qrButton) qrButton.click();
        return;
      }
      if (event.target.closest('[data-tbb-bank-clear-file]')) {
        event.preventDefault();
        if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
        else if (elements.attachmentFile) elements.attachmentFile.value = '';
        setAttachmentNote(null);
        return;
      }
      const detailRemoveButton = event.target.closest('[data-bank-detail-remove]');
      if (detailRemoveButton) {
        const row = detailRemoveButton.closest('.bankbook-detail-row');
        if (row) row.remove();
        if (elements.detailRows && !elements.detailRows.querySelector('.bankbook-detail-row')) {
          appendBankDetailRow({ tanggal: today() });
        }
        return;
      }
      const removeButton = event.target.closest('[data-tbb-bank-remove-row]');
      if (removeButton) {
        const row = removeButton.closest('.tbb-kas-input-row');
        const list = elements.form.querySelector('.tbb-kas-input-list');
        if (row) row.remove();
        if (list && !list.querySelector('.tbb-kas-input-row')) appendTbbBankInputRow();
      }
    });
    elements.form.addEventListener('change', function (event) {
      if (event.target.matches('[data-tbb-bank-header="tanggal"]')) {
        const noBukti = elements.form.querySelector('[data-tbb-bank-header="noBukti"]');
        if (noBukti) noBukti.value = tbbBankNoBukti(event.target.value, elements.entryId?.value);
      }
      if (event.target.matches('[data-tbb-bank-header="book"]')) {
        const value = event.target.value;
        if (!state.client?.id || value === activeBankKey()) return;
        if (value === 'tbb-kas') {
          window.location.assign('/app/client/clients/' + encodeURIComponent(state.client.id) + '/buku-kas?cash=tbb-kas');
          return;
        }
        window.location.assign('/app/client/clients/' + encodeURIComponent(state.client.id) + '/buku-bank?bank=' + encodeURIComponent(value));
      }
      if (event.target.matches('[data-bank-detail-field="coa"], [data-bank-detail-field="accountName"]')) {
        syncBankDetailAccount(event.target.closest('.bankbook-detail-row'), event.target.value, event.target.getAttribute('data-bank-detail-field'));
      }
    });
    elements.form.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      if (event.target.matches('[data-tbb-bank-field]')) {
        const row = event.target.closest('.tbb-kas-input-row');
        const list = elements.form.querySelector('.tbb-kas-input-list');
        if (!row || !list || row !== list.lastElementChild) return;
        event.preventDefault();
        const nextRow = appendTbbBankInputRow();
        nextRow?.querySelector('[data-tbb-bank-field="coa"]')?.focus();
        return;
      }
      if (!event.target.matches('[data-bank-detail-field]')) return;
      const row = event.target.closest('.bankbook-detail-row');
      if (!row || row !== elements.detailRows?.lastElementChild) return;
      event.preventDefault();
      const nextRow = appendBankDetailRow({ tanggal: today() });
      nextRow?.querySelector('[data-bank-detail-field="tanggal"]')?.focus();
    });
  }
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
    const header = event.target.closest('[data-bank-sort-key]');
    if (!header || event.target.closest('.client-col-resize-handle')) return;
    setSort(header.getAttribute('data-bank-sort-key'));
  });
  document.addEventListener('keydown', function (event) {
    const header = event.target.closest('[data-bank-sort-key]');
    if (!header || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault();
    setSort(header.getAttribute('data-bank-sort-key'));
  });

  setupSortHeaders();
  loadBukuBank(activeBankKey());
})();
