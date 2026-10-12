(function () {
  'use strict';

  const state = {
    client: null,
    projects: [],
    summary: null,
    loading: false,
    sort: { key: '', direction: '' },
    selectedProject: null,
    paymentSources: [],
    paymentTargets: [],
    paymentTarget: null,
    paymentSide: '',
    assigningExpense: false
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
    rows: document.getElementById('htiRows'),
    exportButton: document.getElementById('htiExportBtn'),
    statusFilter: document.getElementById('htiStatusFilter'),
    paymentFilter: document.getElementById('htiPaymentFilter'),
    searchInput: document.getElementById('htiSearchInput'),
    adminOnly: Array.from(document.querySelectorAll('.admin-only')),
    modal: document.getElementById('htiControlModal'),
    modalTitle: document.getElementById('htiControlModalTitle'),
    modalMeta: document.getElementById('htiControlModalMeta'),
    modalBody: document.getElementById('htiControlBody'),
    modalClose: document.getElementById('htiControlCloseBtn'),
    modalCancel: document.getElementById('htiControlCancelBtn'),
    closeProjectButton: document.getElementById('htiControlCloseProjectBtn'),
    payButton: document.getElementById('htiControlPayBtn'),
    salesButton: document.getElementById('htiControlSalesBtn'),
    purchaseButton: document.getElementById('htiControlPurchaseBtn'),
    paymentModal: document.getElementById('htiControlPaymentModal'),
    paymentForm: document.getElementById('htiControlPaymentForm'),
    paymentMeta: document.getElementById('htiControlPaymentMeta'),
    paymentEntry: document.getElementById('htiControlPaymentEntry'),
    paymentOutstanding: document.getElementById('htiControlPaymentOutstanding'),
    paymentDate: document.getElementById('htiControlPaymentDate'),
    paymentDatePicker: document.getElementById('htiControlPaymentDatePicker'),
    paymentAmount: document.getElementById('htiControlPaymentAmount'),
    paymentSource: document.getElementById('htiControlPaymentSource'),
    paymentSources: document.getElementById('htiControlPaymentSources'),
    paymentNotes: document.getElementById('htiControlPaymentNotes'),
    paymentCloseButton: document.getElementById('htiControlPaymentCloseBtn'),
    paymentCancelButton: document.getElementById('htiControlPaymentCancelBtn'),
    paymentSaveButton: document.getElementById('htiControlPaymentSaveBtn'),
    paymentRows: document.getElementById('htiControlPaymentRows'),
    paymentAddRowButton: document.getElementById('htiControlPaymentAddRowBtn'),
    paymentChoiceModal: document.getElementById('htiPaymentChoiceModal'),
    paymentChoiceCloseButton: document.getElementById('htiPaymentChoiceCloseBtn'),
    paymentChoiceCancelButton: document.getElementById('htiPaymentChoiceCancelBtn'),
    paymentChoiceReceivableButton: document.getElementById('htiPaymentChoiceReceivableBtn'),
    paymentChoicePayableButton: document.getElementById('htiPaymentChoicePayableBtn'),
    purchaseChoiceModal: document.getElementById('htiPurchaseChoiceModal'),
    purchaseChoiceCloseButton: document.getElementById('htiPurchaseChoiceCloseBtn'),
    purchaseChoiceCancelButton: document.getElementById('htiPurchaseChoiceCancelBtn'),
    purchaseChoiceNote: document.getElementById('htiPurchaseChoiceNote'),
    purchaseChoiceFpButton: document.getElementById('htiPurchaseChoiceFpBtn'),
    purchaseChoiceNonPpnButton: document.getElementById('htiPurchaseChoiceNonPpnBtn')
  };

  const moneyFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
  let alertTimer = null;

  function text(value, fallback) {
    const valueText = value == null ? '' : String(value).trim();
    return valueText || fallback || '';
  }

  function setText(element, value) {
    if (element) element.textContent = text(value);
  }

  function formatCurrency(value) {
    return 'Rp' + moneyFormatter.format(Math.round(Number(value || 0)));
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

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/pt-x-buku-kontrol/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/pt-x-buku-kontrol';
  }

  function clearNode(element) {
    if (element) element.replaceChildren();
  }

  function todayDisplay() {
    const now = new Date();
    return String(now.getDate()).padStart(2, '0') + '/' +
      String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function fullYear(value) {
    const numeric = Number(value);
    if (String(value).length === 2) return numeric >= 70 ? 1900 + numeric : 2000 + numeric;
    return numeric;
  }

  function validDateParts(day, month, year) {
    if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
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
      const day = Number(slash[1]);
      const month = Number(slash[2]);
      const year = fullYear(slash[3]);
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

  function syncDatePicker(input, picker) {
    if (!input || !picker) return;
    picker.value = formattedDateToIso(input.value);
  }

  function normalizeDateInput(input, picker) {
    if (!input) return;
    const formatted = formatDate(input.value);
    if (formatted) input.value = formatted;
    syncDatePicker(input, picker);
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
    });
    input.addEventListener('blur', function () { normalizeDateInput(input, picker); });
    input.addEventListener('change', function () { normalizeDateInput(input, picker); });
    input.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      normalizeDateInput(input, picker);
    });
    picker.addEventListener('change', function () {
      applyNativeDatePicker(input, picker);
      normalizeDateInput(input, picker);
      input.focus();
    });
  }

  function parseAmount(value) {
    if (value == null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value).trim();
    const normalized = /^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatInputMoney(value) {
    const amount = parseAmount(value);
    return amount ? moneyFormatter.format(amount) : '';
  }

  function paymentApiBook(book) {
    if (book === 'sales') return 'hti-buku-penjualan';
    if (book === 'non-ppn') return 'hti-buku-pembelian-non-ppn';
    return 'hti-buku-pembelian-fp';
  }

  function showControlPaymentModal(show) {
    if (!elements.paymentModal) return;
    elements.paymentModal.hidden = !show;
    document.body.classList.toggle('modal-open', show || !elements.modal.hidden || !elements.paymentChoiceModal.hidden || !elements.purchaseChoiceModal.hidden);
  }

  function showPaymentChoice(show) {
    if (!elements.paymentChoiceModal) return;
    elements.paymentChoiceModal.hidden = !show;
    document.body.classList.toggle('modal-open', show || !elements.modal.hidden || !elements.paymentModal.hidden || !elements.purchaseChoiceModal.hidden);
  }

  function closePaymentChoice() {
    showPaymentChoice(false);
  }

  function renderPaymentSourceOptions() {
    clearNode(elements.paymentSources);
    state.paymentSources.forEach(function (source) {
      const label = text(source && (source.label || source.sourceAccountName || source.key));
      if (!label) return;
      const option = document.createElement('option');
      option.value = label;
      elements.paymentSources.appendChild(option);
    });
  }

  function normalizeChoiceText(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function paymentSourceLabels() {
    return Array.from(elements.paymentSources ? elements.paymentSources.options : [])
      .map(function (option) { return text(option.value); })
      .filter(Boolean);
  }

  function closestPaymentSource(value) {
    const query = normalizeChoiceText(value);
    if (!query) return '';
    const labels = paymentSourceLabels();
    const normalized = labels.map(function (label) {
      return { label: label, value: normalizeChoiceText(label) };
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

  function applyPaymentSourceChoice(showError) {
    const selected = closestPaymentSource(elements.paymentSource && elements.paymentSource.value);
    if (selected) {
      elements.paymentSource.value = selected;
      elements.paymentSource.removeAttribute('aria-invalid');
      return selected;
    }
    if (elements.paymentSource) {
      elements.paymentSource.value = '';
      elements.paymentSource.setAttribute('aria-invalid', 'true');
    }
    if (showError) setAlert('Pilih sumber pembayaran dari daftar akun Bank/Kas PT X.', 'error');
    return '';
  }

  function paymentTargetsForProject(project, side) {
    const sales = side === 'payable' ? [] : (Array.isArray(project.sales) ? project.sales : [])
      .filter(function (entry) { return !entry.isProforma && Number(entry.outstanding || 0) > 0.5; })
      .map(function (entry) {
        return {
          id: entry.id,
          book: 'sales',
          label: 'Penjualan | ' + text(entry.itemName, 'Transaksi'),
          outstanding: Number(entry.outstanding || 0),
          invoiceDate: entry.invoiceDate || entry.invoiceDateText
        };
      });
    const purchases = side === 'receivable' ? [] : (Array.isArray(project.purchases) ? project.purchases : [])
      .filter(function (entry) { return Number(entry.outstanding || 0) > 0.5; })
      .map(function (entry) {
        return {
          id: entry.id,
          book: entry.book === 'non-ppn' ? 'non-ppn' : 'fp',
          label: 'Pembelian ' + (entry.book === 'non-ppn' ? 'Non PPN' : 'FP') + ' | ' + text(entry.itemName, 'Transaksi'),
          outstanding: Number(entry.outstanding || 0),
          invoiceDate: entry.invoiceDate || entry.invoiceDateText
        };
      });
    return sales.concat(purchases);
  }

  function paymentTargetKey(target) {
    return target ? target.book + ':' + target.id : '';
  }

  function paymentTargetsTotal(targets) {
    return (Array.isArray(targets) ? targets : []).reduce(function (sum, target) {
      return sum + Number(target.outstanding || 0);
    }, 0);
  }

  function allPaymentTarget() {
    return {
      id: 'all',
      book: 'all',
      label: 'Semua transaksi terbuka',
      outstanding: paymentTargetsTotal(state.paymentTargets)
    };
  }

  function paymentTargetMinDateIso(target) {
    const targets = target && target.book === 'all' ? state.paymentTargets : [target];
    return targets.reduce(function (latest, item) {
      const iso = formattedDateToIso(item && item.invoiceDate);
      return iso && iso > latest ? iso : latest;
    }, '');
  }

  function syncPaymentDateMinimum() {
    if (!elements.paymentDatePicker) return;
    elements.paymentDatePicker.min = paymentTargetMinDateIso(state.paymentTarget);
    syncDatePicker(elements.paymentDate, elements.paymentDatePicker);
  }

  function syncPaymentTargetFields() {
    const selectedKey = text(elements.paymentEntry && elements.paymentEntry.value);
    state.paymentTarget = selectedKey === 'all'
      ? allPaymentTarget()
      : state.paymentTargets.find(function (target) {
        return paymentTargetKey(target) === selectedKey;
      }) || state.paymentTargets[0] || null;
    if (!state.paymentTarget) return;
    elements.paymentOutstanding.textContent = formatCurrency(state.paymentTarget.outstanding);
    elements.paymentAmount.value = formatInputMoney(state.paymentTarget.outstanding);
    syncPaymentDateMinimum();
  }

  function renderPaymentTargetOptions() {
    clearNode(elements.paymentEntry);
    if (state.paymentTargets.length > 1) {
      const allOption = document.createElement('option');
      allOption.value = 'all';
      allOption.textContent = 'Semua | Total sisa ' + formatCurrency(paymentTargetsTotal(state.paymentTargets));
      elements.paymentEntry.appendChild(allOption);
    }
    state.paymentTargets.forEach(function (target) {
      const option = document.createElement('option');
      option.value = paymentTargetKey(target);
      option.textContent = target.label + ' | Sisa ' + formatCurrency(target.outstanding);
      elements.paymentEntry.appendChild(option);
    });
    if (state.paymentTargets.length) {
      elements.paymentEntry.value = paymentTargetKey(state.paymentTargets[0]);
      syncPaymentTargetFields();
    }
  }

  function addPaymentOption(select, value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  function controlPaymentTargetForKey(key) {
    return key === 'all'
      ? allPaymentTarget()
      : state.paymentTargets.find(function (target) {
        return paymentTargetKey(target) === key;
      }) || null;
  }

  function renderControlPaymentTransactionOptions(select) {
    clearNode(select);
    if (state.paymentTargets.length > 1) {
      addPaymentOption(select, 'all', 'Semua | Total sisa ' + formatCurrency(paymentTargetsTotal(state.paymentTargets)));
    }
    state.paymentTargets.forEach(function (target) {
      addPaymentOption(select, paymentTargetKey(target), target.label + ' | Sisa ' + formatCurrency(target.outstanding));
    });
  }

  function renderControlPaymentSourceOptions(select, selectedValue) {
    clearNode(select);
    addPaymentOption(select, '', '-');
    paymentSourceLabels().forEach(function (label) {
      addPaymentOption(select, label, label);
    });
    if (selectedValue && !Array.from(select.options).some(function (option) { return option.value === selectedValue; })) {
      addPaymentOption(select, selectedValue, selectedValue);
    }
    if (selectedValue) select.value = selectedValue;
  }

  function syncControlPaymentTableSummary() {
    if (!elements.paymentRows || !elements.paymentOutstanding) return;
    const total = Array.from(elements.paymentRows.querySelectorAll('[data-hti-payment-field="entry"]'))
      .reduce(function (sum, select) {
        const target = controlPaymentTargetForKey(select.value);
        return sum + Number(target && target.outstanding || 0);
      }, 0);
    elements.paymentOutstanding.textContent = formatCurrency(total || Number(state.paymentTarget?.outstanding || 0));
  }

  function nextControlPaymentTarget() {
    const used = new Set(Array.from(elements.paymentRows ? elements.paymentRows.querySelectorAll('[data-hti-payment-field="entry"]') : [])
      .map(function (select) { return text(select.value); })
      .filter(function (value) { return value && value !== 'all'; }));
    return state.paymentTargets.find(function (target) { return !used.has(paymentTargetKey(target)); }) || state.paymentTargets[0] || state.paymentTarget;
  }

  function syncControlPaymentRow(row, options) {
    const settings = options || {};
    const entrySelect = row.querySelector('[data-hti-payment-field="entry"]');
    const projectInput = row.querySelector('[data-hti-payment-field="project"]');
    const dateInput = row.querySelector('[data-hti-payment-field="date"]');
    const datePicker = row.querySelector('[data-hti-payment-field="datePicker"]');
    const amountInput = row.querySelector('[data-hti-payment-field="amount"]');
    const remainingInput = row.querySelector('[data-hti-payment-field="remaining"]');
    const target = controlPaymentTargetForKey(entrySelect && entrySelect.value) || nextControlPaymentTarget();
    const outstanding = Math.max(0, Number(target && target.outstanding || 0));
    if (entrySelect && target) entrySelect.value = target.book === 'all' ? 'all' : paymentTargetKey(target);
    if (projectInput) projectInput.value = target && target.book === 'all' ? 'Semua' : text(state.selectedProject && state.selectedProject.projectNo, '-');
    if (dateInput && !text(dateInput.value)) dateInput.value = todayDisplay();
    if (datePicker) {
      datePicker.min = paymentTargetMinDateIso(target);
      syncDatePicker(dateInput, datePicker);
    }
    if (amountInput && settings.resetAmount) amountInput.value = formatInputMoney(outstanding);
    const amount = parseAmount(amountInput && amountInput.value);
    if (remainingInput) remainingInput.value = formatCurrency(Math.max(0, outstanding - amount));
    syncControlPaymentTableSummary();
  }

  function addControlPaymentRow(target) {
    if (!elements.paymentRows) return null;
    const row = document.createElement('tr');
    row.className = 'hti-payment-input-row';

    const dateCell = document.createElement('td');
    const dateWrap = document.createElement('div');
    dateWrap.className = 'hti-date-field hti-payment-date-field';
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.placeholder = 'DD/MM/YYYY';
    dateInput.autocomplete = 'off';
    dateInput.dataset.htiPaymentField = 'date';
    dateInput.value = todayDisplay();
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
    renderControlPaymentTransactionOptions(transactionSelect);
    transactionSelect.value = target && target.book === 'all' ? 'all' : paymentTargetKey(target || nextControlPaymentTarget());
    transactionCell.appendChild(transactionSelect);

    const sourceCell = document.createElement('td');
    const sourceSelect = document.createElement('input');
    sourceSelect.type = 'text';
    sourceSelect.setAttribute('list', 'htiControlPaymentSources');
    sourceSelect.placeholder = 'Pilih bank/kas';
    sourceSelect.autocomplete = 'off';
    sourceSelect.dataset.htiPaymentField = 'source';
    sourceCell.appendChild(sourceSelect);

    const amountCell = document.createElement('td');
    const amountInput = document.createElement('input');
    amountInput.type = 'text';
    amountInput.inputMode = 'decimal';
    amountInput.autocomplete = 'off';
    amountInput.dataset.htiPaymentField = 'amount';
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

    transactionSelect.addEventListener('change', function () {
      syncControlPaymentRow(row, { resetAmount: true });
      amountInput.focus();
    });
    [dateInput, transactionSelect, amountInput].forEach(function (input) {
      input.addEventListener('keydown', addControlPaymentRowOnEnter);
    });
    sourceSelect.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        const selected = closestPaymentSource(sourceSelect.value);
        if (selected) sourceSelect.value = selected;
      }
      addControlPaymentRowOnEnter(event);
    });
    sourceSelect.addEventListener('change', function () {
      const selected = closestPaymentSource(sourceSelect.value);
      if (selected) sourceSelect.value = selected;
    });
    sourceSelect.addEventListener('blur', function () {
      const selected = closestPaymentSource(sourceSelect.value);
      if (selected) sourceSelect.value = selected;
    });
    amountInput.addEventListener('blur', function () {
      amountInput.value = formatInputMoney(amountInput.value);
      syncControlPaymentRow(row);
    });
    amountInput.addEventListener('input', function () {
      amountInput.value = formatInputMoney(amountInput.value);
      syncControlPaymentRow(row);
    });
    removeButton.addEventListener('click', function () {
      removeControlPaymentRow(row);
    });
    syncControlPaymentRow(row, { resetAmount: true });
    return row;
  }

  function addControlPaymentRowOnEnter(event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const row = addControlPaymentRow(nextControlPaymentTarget());
    window.setTimeout(function () {
      const input = row && row.querySelector('[data-hti-payment-field="entry"]');
      if (input) input.focus();
    }, 0);
  }

  async function removeControlPaymentRow(row) {
    const confirmed = await window.clientPortalConfirm({
      title: 'Hapus Baris Pembayaran',
      meta: 'Baris ini belum disimpan.',
      message: 'Hapus baris pembayaran ini?',
      cancelText: 'Batal',
      confirmText: 'Hapus'
    });
    if (!confirmed) return;
    row.remove();
    if (elements.paymentRows && !elements.paymentRows.children.length) {
      addControlPaymentRow(nextControlPaymentTarget());
    }
    syncControlPaymentTableSummary();
  }

  function renderControlPaymentRows() {
    if (!elements.paymentRows) return;
    clearNode(elements.paymentRows);
    addControlPaymentRow(state.paymentTargets[0] || state.paymentTarget);
  }

  function collectControlPaymentRows() {
    const rows = Array.from(elements.paymentRows ? elements.paymentRows.querySelectorAll('tr') : []);
    const notes = text(elements.paymentNotes && elements.paymentNotes.value);
    const allocations = [];
    for (const row of rows) {
      const entrySelect = row.querySelector('[data-hti-payment-field="entry"]');
      const dateInput = row.querySelector('[data-hti-payment-field="date"]');
      const datePicker = row.querySelector('[data-hti-payment-field="datePicker"]');
      const sourceSelect = row.querySelector('[data-hti-payment-field="source"]');
      const amountInput = row.querySelector('[data-hti-payment-field="amount"]');
      normalizeDateInput(dateInput, datePicker);
      const target = controlPaymentTargetForKey(entrySelect && entrySelect.value);
      const amount = parseAmount(amountInput && amountInput.value);
      const paymentSource = closestPaymentSource(sourceSelect && sourceSelect.value);
      if (sourceSelect) sourceSelect.value = paymentSource;
      const paymentDate = text(dateInput && dateInput.value);
      const paymentDateIso = formattedDateToIso(paymentDate);
      const minPaymentDateIso = paymentTargetMinDateIso(target);
      if (!target && amount > 0.5) throw new Error('Pilih transaksi pembayaran.');
      if (!target || amount <= 0.5) continue;
      if (!paymentDateIso) throw new Error('Tanggal pembayaran wajib diisi dengan format DD/MM/YYYY.');
      if (paymentDateIso && minPaymentDateIso && paymentDateIso < minPaymentDateIso) {
        throw new Error('Tanggal pembayaran tidak boleh lebih awal dari tanggal invoice transaksi yang dipilih.');
      }
      if (!paymentSource) throw new Error('Pilih jenis bank/kas untuk pembayaran.');
      if (amount > Number(target.outstanding || 0) + 0.5) throw new Error('Pembayaran tidak boleh melebihi sisa tagihan.');
      paymentAllocations(target, amount).forEach(function (allocation) {
        allocations.push({
          target: allocation.target,
          amount: allocation.amount,
          paymentSource,
          paymentDate,
          paymentNotes: notes
        });
      });
    }
    return allocations;
  }

  function openPaymentChoice(project) {
    if (project) state.selectedProject = project;
    const targetProject = state.selectedProject;
    if (!targetProject) return;
    const hasReceivable = Number(targetProject.salesOutstanding || 0) > 0.5;
    const hasPayable = Number(targetProject.purchaseOutstanding || 0) > 0.5;
    if (hasReceivable && !hasPayable) {
      navigateToSourcePayment(targetProject, 'receivable');
      return;
    }
    if (hasPayable && !hasReceivable) {
      navigateToSourcePayment(targetProject, 'payable');
      return;
    }
    elements.paymentChoiceReceivableButton.disabled = !hasReceivable;
    elements.paymentChoicePayableButton.disabled = !hasPayable;
    elements.paymentChoiceReceivableButton.title = hasReceivable ? 'Bayar sisa piutang customer' : 'Tidak ada sisa piutang';
    elements.paymentChoicePayableButton.title = hasPayable ? 'Bayar sisa utang supplier' : 'Tidak ada sisa utang';
    showPaymentChoice(true);
  }

  function navigateToSourcePayment(project, side) {
    const targetProject = project || state.selectedProject;
    if (!targetProject) return;
    const targets = paymentTargetsForProject(targetProject, side);
    const target = targets[0];
    if (!target || !text(target.id)) {
      setAlert('Tidak ada sisa tagihan pada transaksi sumber proyek ini.', 'error');
      closePaymentChoice();
      return;
    }
    const book = target.book === 'sales'
      ? 'hti-buku-penjualan'
      : (target.book === 'non-ppn' ? 'hti-buku-pembelian-non-ppn' : 'hti-buku-pembelian-fp');
    const query = new URLSearchParams();
    query.set('openPayment', text(target.id));
    query.set('fromControl', '1');
    closePaymentChoice();
    window.location.assign('/app/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/' + book + '?' + query.toString());
  }

  function openPaymentModal(project, side) {
    const targetProject = project || state.selectedProject;
    if (!targetProject) return;
    state.paymentSide = side || '';
    state.paymentTargets = paymentTargetsForProject(targetProject, state.paymentSide);
    if (!state.paymentTargets.length) {
      setAlert('Tidak ada sisa tagihan pada proyek ini.', 'error');
      return;
    }
    elements.paymentMeta.textContent = 'Proyek ' + text(targetProject.projectNo, '-') + ' | ' + (state.paymentSide === 'receivable' ? 'Piutang' : 'Utang') + ' | ' + text(targetProject.customerName, 'Customer belum diisi');
    elements.paymentDate.value = todayDisplay();
    syncDatePicker(elements.paymentDate, elements.paymentDatePicker);
    elements.paymentSource.value = '';
    elements.paymentNotes.value = '';
    renderPaymentTargetOptions();
    renderControlPaymentRows();
    showControlPaymentModal(true);
    window.setTimeout(function () {
      const focusTarget = elements.paymentRows?.querySelector('[data-hti-payment-field="amount"]');
      if (focusTarget) focusTarget.focus();
    }, 0);
  }

  function closePaymentModal() {
    if (!elements.paymentModal) return;
    showControlPaymentModal(false);
    elements.paymentForm.reset();
    if (elements.paymentRows) clearNode(elements.paymentRows);
    state.paymentTargets = [];
    state.paymentTarget = null;
    state.paymentSide = '';
  }

  function paymentAllocations(target, amount) {
    if (!target) return [];
    if (target.book !== 'all') {
      return [{ target, amount }];
    }
    let remaining = amount;
    const allocations = [];
    state.paymentTargets.forEach(function (item) {
      if (remaining <= 0.5) return;
      const allocationAmount = Math.min(Number(item.outstanding || 0), remaining);
      if (allocationAmount <= 0.5) return;
      allocations.push({ target: item, amount: allocationAmount });
      remaining -= allocationAmount;
    });
    return allocations;
  }

  async function saveTargetPayment(target, amount, paymentSource, paymentDate, paymentNotes) {
    return requestJson('/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/' + paymentApiBook(target.book) + '/entries/' + encodeURIComponent(target.id) + '/payments', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentDate: text(paymentDate || elements.paymentDate.value),
        paymentAmount: amount,
        paymentSource: paymentSource,
        paymentNotes: text(paymentNotes || elements.paymentNotes.value)
      })
    });
  }

  async function savePayment(event) {
    event.preventDefault();
    let allocations = [];
    try {
      allocations = collectControlPaymentRows();
    } catch (err) {
      setAlert(err.message || 'Data pembayaran belum lengkap.', 'error');
      return;
    }
    if (!allocations.length) {
      setAlert('Isi minimal satu baris pembayaran.', 'error');
      return;
    }
    elements.paymentSaveButton.disabled = true;
    try {
      for (const allocation of allocations) {
        await saveTargetPayment(allocation.target, allocation.amount, allocation.paymentSource, allocation.paymentDate, allocation.paymentNotes);
      }
      closePaymentModal();
      await loadBook();
      setAlert(allocations.length > 1 ? 'Pembayaran berhasil dicatat untuk ' + allocations.length + ' transaksi.' : 'Pembayaran berhasil dicatat.', 'success');
    } catch (err) {
      setAlert(err.message || 'Pembayaran gagal dicatat.', 'error');
    } finally {
      elements.paymentSaveButton.disabled = false;
    }
  }

  function showPurchaseChoice(show) {
    if (!elements.purchaseChoiceModal) return;
    elements.purchaseChoiceModal.hidden = !show;
    document.body.classList.toggle('modal-open', show || !elements.modal.hidden || !elements.paymentModal.hidden || !elements.paymentChoiceModal.hidden);
  }

  function closePurchaseChoice() {
    showPurchaseChoice(false);
  }

  function projectHasFinalSales(project) {
    return Number(project && project.salesEntryCount || 0) > 0
      || (Array.isArray(project && project.sales) && project.sales.some(function (entry) { return entry && !entry.isProforma; }));
  }

  function projectIsProformaOnly(project) {
    return Boolean(project && project.hasProforma && !projectHasFinalSales(project));
  }

  function openPurchaseChoice(project) {
    if (project) state.selectedProject = project;
    if (!state.selectedProject) return;
    if (state.selectedProject.isClosed) {
      setAlert('Proyek sudah ditutup. Klik Buka Proyek di Buku Kontrol sebelum input pembelian.', 'error');
      return;
    }
    if (projectIsProformaOnly(state.selectedProject)) {
      setAlert('Proyek ini masih Pre Order. Input Penjualan/Faktur dulu sebelum input pembelian.', 'error');
      return;
    }
    setText(elements.purchaseChoiceNote,
      'Kode proyek, rincian produk, dan qty dari penjualan akan dibawa sebagai acuan pembelian. Jika supplier/vendor berbeda, simpan terpisah per supplier.');
    showPurchaseChoice(true);
  }

  function navigateToPurchasePage(type) {
    const project = state.selectedProject;
    if (!project) return;
    if (project.isClosed) {
      setAlert('Proyek sudah ditutup. Klik Buka Proyek di Buku Kontrol sebelum input pembelian.', 'error');
      closePurchaseChoice();
      return;
    }
    if (projectIsProformaOnly(project)) {
      setAlert('Proyek ini masih Pre Order. Input Penjualan/Faktur dulu sebelum input pembelian.', 'error');
      closePurchaseChoice();
      return;
    }
    const projectNo = text(project.projectNo);
    const projectSales = (Array.isArray(project.sales) ? project.sales : []).filter(function (entry) {
      return !entry.isProforma;
    });
    if (!projectSales.length) {
      setAlert('Belum ada faktur penjualan final untuk proyek ini. Input Penjualan dulu sebelum input pembelian.', 'error');
      closePurchaseChoice();
      return;
    }
    const salesLines = (projectSales.length ? projectSales : [{}]).map(function (entry) {
      return {
        projectNo,
        itemName: text(entry.itemName),
        quantity: entry.quantity == null ? '' : text(entry.quantity)
      };
    }).filter(function (line) {
      return line.projectNo || line.itemName || line.quantity;
    });
    const query = new URLSearchParams();
    query.set('fromSales', '1');
    query.set('salesLines', JSON.stringify(salesLines.length ? salesLines : [{ projectNo, itemName: '', quantity: '' }]));
    query.set('salesCustomer', text(project.customerName));
    const book = type === 'fp' ? 'hti-buku-pembelian-fp' : 'hti-buku-pembelian-non-ppn';
    window.location.assign('/app/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/' + book + '?' + query.toString());
  }

  function navigateToSalesPage() {
    const project = state.selectedProject;
    if (!project || !text(project.projectNo)) return;
    if (project.isClosed) {
      setAlert('Proyek sudah ditutup. Klik Buka Proyek di Buku Kontrol sebelum input penjualan.', 'error');
      return;
    }
    const query = new URLSearchParams();
    query.set('fromProject', '1');
    query.set('fromControlSales', '1');
    query.set('projectNo', text(project.projectNo));
    if (projectIsProformaOnly(project)) query.set('fromProforma', '1');
    if (project.customerName) query.set('customerName', text(project.customerName));
    window.location.assign('/app/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/pt-x-buku-penjualan?' + query.toString());
  }

  function navigateToExpenseEntry(entry) {
    const entryId = text(entry && entry.id);
    if (!entryId) {
      setAlert('Data biaya belum punya ID. Refresh Buku Kontrol lalu coba lagi.', 'error');
      return;
    }
    const query = new URLSearchParams();
    query.set('openExpense', entryId);
    query.set('focusProject', '1');
    window.location.assign('/app/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/pt-x-biaya?' + query.toString());
  }

  function navigateToSourceEntry(entry, type) {
    const entryId = text(entry && entry.id);
    if (!entryId) {
      setAlert('Transaksi sumber belum punya ID. Refresh Buku Kontrol lalu coba lagi.', 'error');
      return;
    }
    const book = type === 'sales'
      ? 'hti-buku-penjualan'
      : (text(entry && entry.book).toLowerCase() === 'non-ppn'
        ? 'hti-buku-pembelian-non-ppn'
        : 'hti-buku-pembelian-fp');
    const query = new URLSearchParams();
    query.set('openEntry', entryId);
    query.set('fromControl', '1');
    window.location.assign('/app/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/' + book + '?' + query.toString());
  }

  function projectCodeOptions() {
    return state.projects.filter(function (project) { return !project.isClosed; })
      .map(function (project) { return text(project.projectNo); })
      .filter(Boolean)
      .filter(function (value, index, rows) { return rows.indexOf(value) === index; })
      .sort(function (left, right) { return left.localeCompare(right, 'id', { numeric: true }); });
  }

  function refreshProjectCodeDatalist() {
    let datalist = document.getElementById('htiControlProjectCodeOptions');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'htiControlProjectCodeOptions';
      document.body.appendChild(datalist);
    }
    datalist.replaceChildren();
    projectCodeOptions().forEach(function (projectNo) {
      const option = document.createElement('option');
      option.value = projectNo;
      datalist.appendChild(option);
    });
  }

  function stripGeneratedExpenseDescription(entry) {
    const description = text(entry && entry.description);
    const accountName = text(entry && entry.expenseAccountName);
    const projectNo = text(entry && entry.projectNo);
    const prefixes = [
      ['Biaya Proyek PT X', projectNo ? 'Proyek ' + projectNo : '', accountName].filter(Boolean).join(' | '),
      ['Biaya Proyek PT X', accountName].filter(Boolean).join(' | '),
      'Biaya Proyek PT X'
    ].filter(Boolean);
    for (const prefix of prefixes) {
      if (description === prefix) return '';
      if (description.startsWith(prefix + ' | ')) return description.slice(prefix.length + 3);
    }
    return description;
  }

  async function assignProjectExpenses(entries, projectNo, trigger, options) {
    const settings = options || {};
    const cleanProjectNo = text(projectNo);
    const targets = (Array.isArray(entries) ? entries : [entries]).filter(function (entry) { return text(entry && entry.id); });
    if (!cleanProjectNo && !settings.allowBlank) {
      setAlert('Isi kode proyek terlebih dahulu.', 'error');
      return;
    }
    if (!targets.length) {
      setAlert('Data biaya belum ditemukan. Refresh Buku Kontrol lalu coba lagi.', 'error');
      return;
    }
    if (state.assigningExpense) return;
    state.assigningExpense = true;
    if (trigger) trigger.disabled = true;
    try {
      for (const entry of targets) {
        await requestJson('/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/pt-x-biaya/entries/' + encodeURIComponent(entry.id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            projectNo: cleanProjectNo,
            description: stripGeneratedExpenseDescription(entry) || ' '
          })
        });
      }
      if (elements.modal && !elements.modal.hidden) closeModal();
      await loadBook();
      if (!cleanProjectNo) {
        setAlert(targets.length > 1
          ? targets.length + ' biaya proyek dikembalikan ke Belum ada kode.'
          : 'Biaya proyek dikembalikan ke Belum ada kode.', 'success');
      } else {
        setAlert(targets.length > 1
          ? targets.length + ' biaya proyek dialokasikan ke proyek ' + cleanProjectNo + '.'
          : 'Biaya proyek dialokasikan ke proyek ' + cleanProjectNo + '.', 'success');
      }
    } catch (err) {
      setAlert(err.message || 'Kode proyek biaya belum bisa disimpan.', 'error');
    } finally {
      state.assigningExpense = false;
      if (trigger) trigger.disabled = false;
    }
  }

  async function toggleProjectClosed() {
    const project = state.selectedProject;
    if (!project) return;
    const nextClosed = !project.isClosed;
    if (nextClosed && Number(project.purchaseEntryCount || 0) === 0) {
      setAlert('Proyek belum memiliki pembelian yang terhubung. Input pembelian terlebih dahulu.', 'error');
      return;
    }
    const confirmation = nextClosed
      ? 'Tandai proyek ini sebagai ditutup? Setelah ditutup, proyek tidak akan muncul di dropdown pembelian baru.'
      : 'Buka proyek ini agar dapat dipilih lagi pada pembelian baru?';
    const confirmed = await window.clientPortalConfirm({
      title: nextClosed ? 'Tutup Proyek' : 'Buka Proyek',
      meta: 'Status ini mengatur pilihan proyek di input pembelian.',
      message: confirmation,
      cancelText: 'Batal',
      confirmText: nextClosed ? 'Tutup Proyek' : 'Buka Proyek'
    });
    if (!confirmed) return;
    elements.closeProjectButton.disabled = true;
    try {
      await requestJson('/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/pt-x-buku-kontrol/projects/' + encodeURIComponent(project.projectNo) + '/status', {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed: nextClosed })
      });
      closeModal();
      await loadBook();
      setAlert(nextClosed ? 'Proyek ditutup dan tidak lagi muncul di dropdown pembelian baru.' : 'Proyek dibuka.', 'success');
    } catch (err) {
      setAlert(err.message || 'Status proyek belum bisa diperbarui.', 'error');
    } finally {
      elements.closeProjectButton.disabled = false;
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Buku Kontrol belum bisa dimuat.');
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
      state.client = data.client || state.client;
      state.projects = Array.isArray(data.projects) ? data.projects : [];
      state.summary = data.summary || {};
      state.paymentSources = Array.isArray(data.paymentSources) ? data.paymentSources : [];
      renderPaymentSourceOptions();
      renderShell(data);
      renderRows();
    } catch (err) {
      setAlert(err.message || 'Buku Kontrol belum bisa dimuat.', 'error');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
    }
  }

  function renderShell(data) {
    const user = data.user || {};
    setText(elements.userName, user.displayName || user.username || '-');
    setText(elements.userEmail, user.email || user.contactName || '-');
    elements.adminOnly.forEach(function (item) { item.hidden = !user.isAdmin; });
    const client = state.client || {};
    setText(elements.clientMeta, client.name || 'PT X');
    setText(elements.subtitle, (client.name || 'PT X') + ' | Penjualan, pembelian, dan pembayaran per proyek');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function statusFilterMatches(project, status) {
    if (!status) return true;
    if (status === 'proforma') return project.matchStatus === 'Proforma';
    if (status === 'closed') return project.isClosed;
    if (status === 'partial') return project.matchStatus === 'Menunggu konfirmasi' || project.matchStatus === 'Proforma';
    if (status === 'missing-sales') return project.matchStatus === 'Belum ada penjualan';
    if (status === 'unmatched') return project.matchStatus === 'Belum ada pembelian';
    if (status === 'allocation') return project.matchStatus === 'Perlu review alokasi';
    return true;
  }

  function paymentFilterMatches(project, filter) {
    if (!filter) return true;
    if (filter === 'receivable') return Number(project.salesOutstanding || 0) > 0.5;
    if (filter === 'payable') return Number(project.purchaseOutstanding || 0) > 0.5;
    if (filter === 'settled') return project.matchStatus !== 'Proforma' && Number(project.salesOutstanding || 0) <= 0.5 && Number(project.purchaseOutstanding || 0) <= 0.5;
    return true;
  }

  function sortTextValue(value) {
    return text(value).toLowerCase().replace(/\d+/g, function (part) {
      return part.padStart(12, '0');
    });
  }

  function projectSortValue(project, key) {
    if (key === 'projectNo') return sortTextValue(project.projectNo);
    if (key === 'customerName') return sortTextValue(project.customerName);
    if (key === 'salesTotal') return Number(project.salesTotal || 0);
    if (key === 'purchaseTotal') return Number(project.purchaseTotal || 0);
    if (key === 'projectExpenseTotal') return Number(project.projectExpenseTotal || 0);
    if (key === 'matchStatus') return sortTextValue(project.matchStatus);
    if (key === 'salesOutstanding' || key === 'receivable') return Number(project.salesOutstanding || 0);
    if (key === 'purchaseOutstanding' || key === 'payable') return Number(project.purchaseOutstanding || 0);
    if (key === 'payAction') return Number(project.salesOutstanding || 0) + Number(project.purchaseOutstanding || 0);
    if (key === 'purchaseAction') return Number(project.purchaseEntryCount || 0);
    return sortTextValue(project[key]);
  }

  function compareSortValues(left, right) {
    if (typeof left === 'number' && typeof right === 'number') return left - right;
    return String(left).localeCompare(String(right), 'id', { numeric: true, sensitivity: 'base' });
  }

  function sortedProjects(projects) {
    const sort = state.sort || {};
    if (!sort.key || !sort.direction) return projects;
    const multiplier = sort.direction === 'desc' ? -1 : 1;
    return projects.slice().sort(function (left, right) {
      const primary = compareSortValues(projectSortValue(left, sort.key), projectSortValue(right, sort.key));
      if (primary) return primary * multiplier;
      return compareSortValues(projectSortValue(left, 'projectNo'), projectSortValue(right, 'projectNo'));
    });
  }

  function sortDefaultDirection(key) {
    return ['salesTotal', 'purchaseTotal', 'projectExpenseTotal', 'salesOutstanding', 'purchaseOutstanding', 'payAction', 'purchaseAction'].includes(key) ? 'desc' : 'asc';
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

  function filteredProjects() {
    const status = text(elements.statusFilter && elements.statusFilter.value);
    const payment = text(elements.paymentFilter && elements.paymentFilter.value);
    const query = text(elements.searchInput && elements.searchInput.value).toLowerCase();
    const projects = state.projects.filter(function (project) {
      if (!statusFilterMatches(project, status) || !paymentFilterMatches(project, payment)) return false;
      if (!query) return true;
      return [project.projectNo, project.customerName, project.matchStatus].join(' ').toLowerCase().includes(query);
    });
    return sortedProjects(projects);
  }

  function badge(value, kind) {
    const span = document.createElement('span');
    span.className = 'hti-control-badge' + (kind ? ' ' + kind : '');
    span.textContent = text(value, '-');
    return span;
  }

  function statusKind(status) {
    if (status === 'Tertutup') return 'closed';
    if (status === 'Proforma') return 'proforma';
    if (status === 'Menunggu konfirmasi' || status === 'Belum ada penjualan' || status === 'Perlu review alokasi' || status === 'Biaya belum ada kode proyek') return 'partial';
    if (status === 'Ada pembelian') return 'purchase';
    return 'missing';
  }

  function statusLabel(status) {
    return status === 'Proforma' ? 'Pre Order' : status;
  }

  function cell(value, className) {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.textContent = text(value);
    return td;
  }

  function outstandingLabel(amount, hasEntries) {
    if (!hasEntries) return '-';
    return Number(amount || 0) > 0.5 ? formatCurrency(amount) : 'Lunas';
  }

  function outstandingCell(amount, hasEntries) {
    const td = document.createElement('td');
    td.className = 'number hti-outstanding-cell';
    const label = outstandingLabel(amount, hasEntries);
    if (label === 'Lunas') {
      const strong = document.createElement('strong');
      strong.className = 'hti-paid-label';
      strong.textContent = label;
      td.appendChild(strong);
    } else {
      td.textContent = label;
    }
    return td;
  }

  function inlineProjectCodeControl(project) {
    const form = document.createElement('form');
    form.className = 'hti-project-code-inline';
    form.title = 'Isi kode proyek lalu Enter atau OK';
    form.addEventListener('click', function (event) { event.stopPropagation(); });
    form.addEventListener('keydown', function (event) { event.stopPropagation(); });

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Kode';
    input.autocomplete = 'off';
    input.setAttribute('list', 'htiControlProjectCodeOptions');
    input.setAttribute('aria-label', 'Kode proyek biaya');
    input.addEventListener('focus', function () { input.select(); });

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'OK';
    button.title = (project.expenses || []).length > 1
      ? 'Simpan kode untuk ' + project.expenses.length + ' biaya proyek'
      : 'Simpan kode proyek biaya';

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();
      assignProjectExpenses(project.expenses, input.value, button);
    });

    form.appendChild(input);
    form.appendChild(button);
    return form;
  }

  function inlineExpenseProjectCodeControl(entry) {
    const form = document.createElement('form');
    form.className = 'hti-project-code-inline hti-expense-project-code-inline';
    form.title = 'Ubah kode proyek biaya ini. Kosongkan untuk kembali ke Belum ada kode.';
    const selectedProjectClosed = Boolean(state.selectedProject && state.selectedProject.isClosed);
    form.addEventListener('click', function (event) { event.stopPropagation(); });
    form.addEventListener('keydown', function (event) { event.stopPropagation(); });

    const input = document.createElement('input');
    input.type = 'text';
    input.value = text(entry.projectNo);
    input.placeholder = 'Kode';
    input.autocomplete = 'off';
    input.setAttribute('list', 'htiControlProjectCodeOptions');
    input.setAttribute('aria-label', 'Kode proyek biaya');
    input.addEventListener('focus', function () { input.select(); });

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'OK';
    button.title = 'Simpan koreksi kode proyek biaya';
    if (selectedProjectClosed) {
      form.title = 'Proyek sudah ditutup. Klik Buka Proyek sebelum mengubah biaya proyek.';
      input.disabled = true;
      button.disabled = true;
      button.title = 'Buka Proyek dulu.';
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (selectedProjectClosed) {
        setAlert('Proyek sudah ditutup. Klik Buka Proyek di Buku Kontrol sebelum mengubah biaya proyek.', 'error');
        return;
      }
      assignProjectExpenses([entry], input.value, button, { allowBlank: true });
    });

    form.appendChild(input);
    form.appendChild(button);
    return form;
  }

  function projectRow(project) {
    const row = document.createElement('tr');
    row.className = 'hti-clickable-row';
    row.tabIndex = 0;
    row.title = 'Klik untuk melihat kontrol proyek';
    row.addEventListener('click', function () { openProject(project); });
    row.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProject(project);
      }
    });

    const projectCell = document.createElement('td');
    projectCell.className = 'hti-project-cell';
    if (project.isExpenseUnassigned) {
      projectCell.appendChild(inlineProjectCodeControl(project));
    } else {
      projectCell.textContent = text(project.projectNo, '-');
    }
    row.appendChild(projectCell);
    row.appendChild(cell(project.customerName || '-', 'hti-control-customer-cell'));
    row.appendChild(cell(formatCurrency(project.salesTotal), 'number'));
    row.appendChild(cell(formatCurrency(project.purchaseTotal), 'number'));

    const expenseCell = document.createElement('td');
    expenseCell.className = 'number hti-control-expense-cell';
    const expenseAmount = Number(project.projectExpenseTotal || 0);
    expenseCell.appendChild(document.createTextNode(expenseAmount ? formatCurrency(expenseAmount) : '-'));
    row.appendChild(expenseCell);

    const matchCell = document.createElement('td');
    matchCell.className = 'hti-control-status-cell';
    matchCell.appendChild(badge(statusLabel(project.matchStatus), statusKind(project.matchStatus)));
    const matchMeta = document.createElement('small');
    matchMeta.textContent = project.isClosed
      ? 'Dikonfirmasi manual'
      : project.hasProforma && !project.salesEntryCount
        ? (project.proformaEntryCount || 0) + ' Pre Order tersimpan'
        : (project.purchaseEntryCount || 0) + ' transaksi pembelian terhubung';
    matchCell.appendChild(matchMeta);
    row.appendChild(matchCell);
    row.appendChild(outstandingCell(project.salesOutstanding, Number(project.salesEntryCount || 0) > 0));
    row.appendChild(outstandingCell(project.purchaseOutstanding, Number(project.purchaseEntryCount || 0) > 0));

    const paymentCell = document.createElement('td');
    paymentCell.className = 'hti-control-action-cell';
    const paymentButton = document.createElement('button');
    paymentButton.type = 'button';
    paymentButton.className = 'hti-control-row-button';
    paymentButton.textContent = 'Bayar';
    const hasPayable = Number(project.salesOutstanding || 0) > 0.5 || Number(project.purchaseOutstanding || 0) > 0.5;
    paymentButton.disabled = !hasPayable;
    paymentButton.title = hasPayable ? 'Buka pembayaran pada transaksi sumber' : 'Proyek ini tidak memiliki sisa tagihan';
    paymentButton.addEventListener('click', function (event) {
      event.stopPropagation();
      state.selectedProject = project;
      openPaymentChoice(project);
    });
    paymentCell.appendChild(paymentButton);
    row.appendChild(paymentCell);

    const purchaseCell = document.createElement('td');
    purchaseCell.className = 'hti-control-action-cell';
    const purchaseButton = document.createElement('button');
    purchaseButton.type = 'button';
    purchaseButton.className = 'hti-control-row-button';
    const purchaseOnlyProject = !projectHasFinalSales(project) && (
      Number(project.purchaseEntryCount || 0) > 0 ||
      (Array.isArray(project.purchases) && project.purchases.length > 0)
    );
    purchaseButton.textContent = purchaseOnlyProject ? 'Input Penjualan' : 'Input Pembelian';
    purchaseButton.title = purchaseOnlyProject
      ? 'Input penjualan untuk proyek yang diawali dari pembelian ini'
      : 'Input pembelian untuk proyek ini';
    purchaseButton.disabled = !text(project.projectNo) || project.isClosed || (!purchaseOnlyProject && projectIsProformaOnly(project));
    if (!text(project.projectNo)) {
      purchaseButton.title = 'Isi kode proyek dari modul Biaya dulu.';
    } else if (project.isClosed) {
      purchaseButton.title = 'Proyek sudah ditutup. Buka Proyek dulu.';
    } else if (!purchaseOnlyProject && projectIsProformaOnly(project)) {
      purchaseButton.title = 'Pre Order harus diinput menjadi penjualan/faktur dulu.';
    }
    purchaseButton.addEventListener('click', function (event) {
      event.stopPropagation();
      state.selectedProject = project;
      if (purchaseOnlyProject) navigateToSalesPage();
      else openPurchaseChoice(project);
    });
    purchaseCell.appendChild(purchaseButton);
    row.appendChild(purchaseCell);
    return row;
  }

  function renderRows() {
    if (!elements.rows) return;
    updateSortHeaders();
    refreshProjectCodeDatalist();
    elements.rows.replaceChildren();
    const projects = filteredProjects();
    if (!projects.length) {
      const row = document.createElement('tr');
      const empty = document.createElement('td');
      empty.colSpan = 10;
      empty.className = 'hti-empty-cell';
      empty.textContent = state.projects.length ? 'Tidak ada data yang sesuai filter.' : 'Belum ada proyek penjualan/pembelian.';
      row.appendChild(empty);
      elements.rows.appendChild(row);
      return;
    }
    projects.forEach(function (project) { elements.rows.appendChild(projectRow(project)); });
  }

  function detailTable(title, rows, type) {
    const section = document.createElement('section');
    section.className = 'hti-control-detail-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    if (!rows || !rows.length) {
      const empty = document.createElement('p');
      empty.className = 'hti-control-detail-empty';
      empty.textContent = 'Belum ada data.';
      section.appendChild(empty);
      return section;
    }
    const table = document.createElement('table');
    table.className = 'hti-control-detail-table';
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    const labels = type === 'expense'
      ? ['Tanggal', 'Kode Project', 'Akun', 'Keterangan', 'Nominal']
      : ['Nama/Keterangan', 'Qty', 'Total', 'Terbayar', type === 'sales' ? 'Sisa Piutang' : 'Sisa Utang'];
    labels.forEach(function (label) {
      const th = document.createElement('th');
      th.textContent = label;
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);
    const body = document.createElement('tbody');
    rows.forEach(function (entry) {
      const tr = document.createElement('tr');
      if (type === 'expense') {
        tr.className = 'hti-control-expense-edit-row';
        tr.tabIndex = 0;
        tr.title = 'Klik baris untuk buka form biaya lengkap, atau ubah kode proyek langsung di kolom Kode Project.';
        tr.addEventListener('click', function () { navigateToExpenseEntry(entry); });
        tr.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigateToExpenseEntry(entry);
          }
        });
        tr.appendChild(cell(formatDate(entry.tanggal)));
        const projectCodeCell = document.createElement('td');
        projectCodeCell.className = 'hti-expense-project-code-cell';
        projectCodeCell.appendChild(inlineExpenseProjectCodeControl(entry));
        tr.appendChild(projectCodeCell);
        tr.appendChild(cell([entry.expenseCoa, entry.expenseAccountName].filter(Boolean).join(' - ') || '-'));
        tr.appendChild(cell(entry.description || '-'));
        tr.appendChild(cell(formatCurrency(entry.amount), 'number'));
        body.appendChild(tr);
        return;
      }
      if ((type === 'sales' || type === 'purchase') && text(entry && entry.id)) {
        tr.className = 'hti-control-source-edit-row';
        tr.tabIndex = 0;
        tr.title = type === 'sales'
          ? 'Klik baris untuk buka detail penjualan.'
          : 'Klik baris untuk buka detail pembelian.';
        tr.addEventListener('click', function () { navigateToSourceEntry(entry, type); });
        tr.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigateToSourceEntry(entry, type);
          }
        });
      }
      const itemLabel = entry.isProforma
        ? 'Pre Order | ' + text(entry.itemName, '-')
        : text(entry.itemName, '-');
      const paidLabel = entry.isProforma && !entry.paymentAmount ? '-' : formatCurrency(entry.paymentAmount);
      const outstanding = type === 'sales' && entry.isProforma ? 'Belum faktur' : formatCurrency(entry.outstanding);
      [itemLabel, entry.quantity || 0, formatCurrency(entry.totalAmount), paidLabel, outstanding].forEach(function (value, index) {
        tr.appendChild(cell(value, index > 1 ? 'number' : ''));
      });
      body.appendChild(tr);
    });
    table.appendChild(body);
    section.appendChild(table);
    return section;
  }

  function openProject(project) {
    state.selectedProject = project;
    elements.modalBody.replaceChildren();
    setText(elements.modalTitle, project.isExpenseUnassigned ? 'Biaya Proyek Belum Ada Kode' : 'Kontrol Proyek ' + text(project.projectNo, '-'));
    setText(elements.modalMeta, [project.customerName, statusLabel(project.matchStatus)].filter(Boolean).join(' | '));

    const summary = document.createElement('div');
    summary.className = 'hti-control-detail-summary';
    [
      ['Penjualan', formatCurrency(project.salesTotal)],
      ['Pre Order', project.hasProforma ? formatCurrency(project.proformaTotal) : '-'],
      ['Pembelian', formatCurrency(project.purchaseTotal)],
      ['Biaya Proyek', project.projectExpenseTotal ? formatCurrency(project.projectExpenseTotal) : '-'],
      ['Piutang', formatCurrency(project.salesOutstanding)],
      ['Utang', formatCurrency(project.purchaseOutstanding)],
      ['Status Pengadaan', statusLabel(project.matchStatus)]
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
    elements.modalBody.appendChild(summary);
    elements.modalBody.appendChild(detailTable('Rincian Penjualan', project.sales, 'sales'));
    elements.modalBody.appendChild(detailTable('Rincian Pembelian', project.purchases, 'purchase'));
    elements.modalBody.appendChild(detailTable('Biaya Proyek', project.expenses, 'expense'));

    const note = document.createElement('p');
    note.className = 'hti-control-detail-note';
    note.textContent = project.sharedPurchase
      ? 'Kode proyek adalah penghubung utama. Ada pembelian dengan kode gabungan, jadi alokasinya perlu diperiksa manual sebelum proyek ditutup.'
      : 'Nama penjualan dapat berupa nama proyek atau produk akhir. Sistem tidak mencocokkan nama barang secara otomatis; status ditutup setelah pembelian diperiksa dan dikonfirmasi manual.';
    if (elements.closeProjectButton) {
      elements.closeProjectButton.textContent = project.isClosed ? 'Buka Proyek' : 'Tutup Proyek';
      elements.closeProjectButton.classList.toggle('hti-project-reopen-button', project.isClosed);
      elements.closeProjectButton.disabled = !text(project.projectNo);
      elements.closeProjectButton.title = !text(project.projectNo)
        ? 'Isi kode proyek dari modul Biaya dulu.'
        : project.isClosed ? 'Buka Proyek untuk input pembelian baru' : 'Konfirmasi pengadaan proyek sudah selesai';
    }
    if (elements.salesButton) {
      elements.salesButton.disabled = !text(project.projectNo) || project.isClosed;
      elements.salesButton.title = project.isClosed
        ? 'Proyek sudah ditutup. Buka Proyek dulu.'
        : (project.salesDocumentCount
          ? 'Tambah penjualan lain untuk kode proyek ini'
          : (projectIsProformaOnly(project)
            ? 'Input faktur penjualan dari data Pre Order'
            : 'Input faktur/invoice penjualan untuk proyek dari pembelian ini'));
    }
    if (elements.purchaseButton) {
      elements.purchaseButton.disabled = !text(project.projectNo) || projectIsProformaOnly(project) || project.isClosed;
      elements.purchaseButton.title = !text(project.projectNo)
        ? 'Isi kode proyek dari modul Biaya dulu.'
        : (project.isClosed
          ? 'Proyek sudah ditutup. Buka Proyek dulu.'
          : (projectIsProformaOnly(project)
          ? 'Pre Order harus diinput menjadi penjualan/faktur dulu.'
          : 'Input pembelian untuk proyek ini'));
    }
    if (elements.payButton) {
      const hasOutstanding = Number(project.salesOutstanding || 0) > 0.5 || Number(project.purchaseOutstanding || 0) > 0.5;
      elements.payButton.disabled = !hasOutstanding;
      elements.payButton.title = hasOutstanding
        ? 'Buka pembayaran pada transaksi Penjualan/Pembelian sumber'
        : 'Proyek ini tidak memiliki sisa tagihan';
    }
    elements.modalBody.appendChild(note);
    elements.modal.hidden = false;
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    closePaymentChoice();
    closePurchaseChoice();
    closePaymentModal();
    elements.modal.hidden = true;
    elements.modalBody.replaceChildren();
    state.selectedProject = null;
    document.body.classList.remove('modal-open');
  }

  function sortProjectsForExport(projects) {
    return projects.slice().sort(function (left, right) {
      const leftNo = text(left && left.projectNo);
      const rightNo = text(right && right.projectNo);
      if (!leftNo && !rightNo) return 0;
      if (!leftNo) return 1;
      if (!rightNo) return -1;
      return leftNo.localeCompare(rightNo, 'id', { numeric: true });
    });
  }

  function exportTransactionDate(entry) {
    return formatDate(entry && (entry.invoiceDate || entry.fakturDate || entry.tanggal || entry.entryDate)) || '-';
  }

  function exportNumber(value) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount : 0;
  }

  function roundExportAmount(value) {
    return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
  }

  function exportMoneyBreakdown(entry, hasPpn) {
    if (!entry) return { unitPrice: 0, dpp: 0, ppn: 0 };
    const quantity = exportNumber(entry.quantity);
    let dpp = exportNumber(entry.dpp);
    let ppn = exportNumber(entry.ppn);
    const total = exportNumber(entry.totalAmount);
    const rate = exportNumber(entry.ppnRate) || 11;
    if (total > 0 && dpp <= 0 && ppn <= 0) {
      if (hasPpn) {
        dpp = roundExportAmount(total / (1 + (rate / 100)));
        ppn = roundExportAmount(total - dpp);
      } else {
        dpp = total;
        ppn = 0;
      }
    }
    let unitPrice = exportNumber(entry.unitPrice);
    if (unitPrice <= 0 && quantity > 0 && dpp > 0) {
      unitPrice = roundExportAmount(dpp / quantity);
    }
    return { unitPrice, dpp, ppn };
  }

  function exportDashLine(length) {
    return Array.from({ length }, function () { return '-'; });
  }

  function salesExportColumns(entry) {
    if (!entry) return exportDashLine(7);
    const money = exportMoneyBreakdown(entry, true);
    return [
      exportTransactionDate(entry),
      text(entry.itemName, '-'),
      text(entry.customerName || entry.supplierName, '-'),
      exportNumber(entry.quantity),
      money.unitPrice,
      money.dpp,
      money.ppn
    ];
  }

  function purchaseExportColumns(entry) {
    if (!entry) return exportDashLine(7);
    const money = exportMoneyBreakdown(entry, text(entry.book) !== 'non-ppn');
    return [
      exportTransactionDate(entry),
      text(entry.itemName, '-'),
      text(entry.supplierName, '-'),
      exportNumber(entry.quantity),
      money.unitPrice,
      money.dpp,
      money.ppn
    ];
  }

  function expenseExportColumns(entry) {
    if (!entry) return exportDashLine(3);
    const cleanDescription = stripGeneratedExpenseDescription(entry);
    return [
      formatDate(entry.tanggal) || '-',
      text(cleanDescription || entry.expenseAccountName || entry.description, '-'),
      exportNumber(entry.amount)
    ];
  }

  function buildControlExportRows() {
    const headerTop = [
      'Kode Project',
      'Penjualan', '', '', '', '', '', '',
      'Pembelian', '', '', '', '', '', '',
      'Biaya Proyek', '', '',
      'Proforma / Pre Order', '', '', '', '', '', ''
    ];
    const headerSub = [
      '',
      'Tanggal', 'Nama Barang', 'Customer', 'Qty', 'Harga Satuan', 'DPP', 'PPN',
      'Tanggal', 'Nama Barang', 'Supplier', 'Qty', 'Harga Satuan', 'DPP', 'PPN',
      'Tanggal', 'Nama Biaya', 'Nominal',
      'Tanggal', 'Nama Barang', 'Customer', 'Qty', 'Harga Satuan', 'DPP', 'PPN'
    ];
    const rows = [headerTop, headerSub];
    sortProjectsForExport(filteredProjects()).forEach(function (project) {
      const allSales = Array.isArray(project.sales) ? project.sales : [];
      const sales = allSales.filter(function (entry) { return !entry.isProforma; });
      const proformas = allSales.filter(function (entry) { return entry.isProforma; });
      const purchases = Array.isArray(project.purchases) ? project.purchases : [];
      const expenses = Array.isArray(project.expenses) ? project.expenses : [];
      const rowCount = Math.max(sales.length, purchases.length, expenses.length, proformas.length, 1);
      for (let index = 0; index < rowCount; index += 1) {
        rows.push([
          text(project.projectNo, '-'),
          ...salesExportColumns(sales[index]),
          ...purchaseExportColumns(purchases[index]),
          ...expenseExportColumns(expenses[index]),
          ...salesExportColumns(proformas[index])
        ]);
      }
    });
    return rows;
  }

  function applyControlExportSheetLayout(sheet) {
    sheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
      { s: { r: 0, c: 1 }, e: { r: 0, c: 7 } },
      { s: { r: 0, c: 8 }, e: { r: 0, c: 14 } },
      { s: { r: 0, c: 15 }, e: { r: 0, c: 17 } },
      { s: { r: 0, c: 18 }, e: { r: 0, c: 24 } }
    ];
    sheet['!cols'] = [
      { wch: 14 },
      { wch: 12 }, { wch: 28 }, { wch: 24 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 28 }, { wch: 24 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 34 }, { wch: 15 },
      { wch: 12 }, { wch: 28 }, { wch: 24 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    sheet['!rows'] = [{ hpt: 22 }, { hpt: 20 }];
    const headerStyle = {
      font: { bold: true },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
    };
    for (let row = 0; row <= 1; row += 1) {
      for (let column = 0; column <= 24; column += 1) {
        const address = window.XLSX.utils.encode_cell({ r: row, c: column });
        if (!sheet[address]) sheet[address] = { t: 's', v: '' };
        sheet[address].s = headerStyle;
      }
    }
  }

  function exportRows() {
    if (!window.XLSX) {
      setAlert('Library Excel belum siap. Refresh halaman lalu coba lagi.', 'error');
      return;
    }
    const workbook = window.XLSX.utils.book_new();
    const sheet = window.XLSX.utils.aoa_to_sheet(buildControlExportRows());
    applyControlExportSheetLayout(sheet);
    window.XLSX.utils.book_append_sheet(workbook, sheet, 'Buku Kontrol');
    window.XLSX.writeFile(workbook, 'buku-kontrol-hti.xlsx');
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

  elements.refreshButton.addEventListener('click', loadBook);
  elements.logoutButton.addEventListener('click', logout);
  elements.exportButton.addEventListener('click', exportRows);
  elements.statusFilter.addEventListener('change', renderRows);
  elements.paymentFilter.addEventListener('change', renderRows);
  elements.searchInput.addEventListener('input', renderRows);
  elements.modalClose.addEventListener('click', closeModal);
  elements.modalCancel.addEventListener('click', closeModal);
  elements.closeProjectButton.addEventListener('click', toggleProjectClosed);
  elements.payButton.addEventListener('click', function () { openPaymentChoice(); });
  if (elements.salesButton) elements.salesButton.addEventListener('click', navigateToSalesPage);
  elements.purchaseButton.addEventListener('click', function () { openPurchaseChoice(); });
  elements.paymentCloseButton.addEventListener('click', closePaymentModal);
  elements.paymentCancelButton.addEventListener('click', closePaymentModal);
  elements.paymentForm.addEventListener('submit', savePayment);
  if (elements.paymentAddRowButton) {
    elements.paymentAddRowButton.addEventListener('click', function () {
      const row = addControlPaymentRow(nextControlPaymentTarget());
      window.setTimeout(function () {
        const input = row && row.querySelector('[data-hti-payment-field="entry"]');
        if (input) input.focus();
      }, 0);
    });
  }
  elements.paymentEntry.addEventListener('change', syncPaymentTargetFields);
  elements.paymentSource.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    applyPaymentSourceChoice(true);
  });
  elements.paymentSource.addEventListener('change', function () { applyPaymentSourceChoice(false); });
  elements.paymentSource.addEventListener('blur', function () { applyPaymentSourceChoice(false); });
  elements.paymentAmount.addEventListener('blur', function () {
    elements.paymentAmount.value = formatInputMoney(elements.paymentAmount.value);
  });
  bindDateControl(elements.paymentDate, elements.paymentDatePicker);
  elements.purchaseChoiceCloseButton.addEventListener('click', closePurchaseChoice);
  elements.purchaseChoiceCancelButton.addEventListener('click', closePurchaseChoice);
  elements.purchaseChoiceFpButton.addEventListener('click', function () { navigateToPurchasePage('fp'); });
  elements.purchaseChoiceNonPpnButton.addEventListener('click', function () { navigateToPurchasePage('non-ppn'); });
  elements.paymentChoiceCloseButton.addEventListener('click', closePaymentChoice);
  elements.paymentChoiceCancelButton.addEventListener('click', closePaymentChoice);
  elements.paymentChoiceReceivableButton.addEventListener('click', function () {
    navigateToSourcePayment(state.selectedProject, 'receivable');
  });
  elements.paymentChoicePayableButton.addEventListener('click', function () {
    navigateToSourcePayment(state.selectedProject, 'payable');
  });
  bindSortableHeaders();
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (elements.paymentModal && !elements.paymentModal.hidden) closePaymentModal();
    else if (elements.paymentChoiceModal && !elements.paymentChoiceModal.hidden) closePaymentChoice();
    else if (elements.purchaseChoiceModal && !elements.purchaseChoiceModal.hidden) closePurchaseChoice();
    else if (!elements.modal.hidden) closeModal();
  });
  loadBook();
})();
