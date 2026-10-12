(function () {
  const state = {
    client: null,
    coaAccounts: [],
    rows: [],
    totals: {},
    postedPeriods: null,
    draftFallbackApplied: false,
    reportYear: new Date().getFullYear(),
    searchQuery: '',
    loading: false,
    openingUnlocked: false,
    savingOpeningCoa: '',
    savingNotesCoa: ''
  };

  const elements = {
    alert: document.getElementById('neracaLajurAlert'),
    clientMeta: document.getElementById('neracaLajurClientMeta'),
    userName: document.getElementById('neracaLajurUserName'),
    userEmail: document.getElementById('neracaLajurUserEmail'),
    refreshButton: document.getElementById('neracaLajurRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('neracaLajurBackLink'),
    subtitle: document.getElementById('neracaLajurSubtitle'),
    openingDebitHead: document.getElementById('neracaLajurOpeningDebitHead'),
    openingCreditHead: document.getElementById('neracaLajurOpeningCreditHead'),
    mutationDebitHead: document.getElementById('neracaLajurMutationDebitHead'),
    mutationCreditHead: document.getElementById('neracaLajurMutationCreditHead'),
    endingDebitHead: document.getElementById('neracaLajurEndingDebitHead'),
    endingCreditHead: document.getElementById('neracaLajurEndingCreditHead'),
    openingDebitFoot: document.getElementById('neracaLajurOpeningDebitFoot'),
    openingCreditFoot: document.getElementById('neracaLajurOpeningCreditFoot'),
    mutationDebitFoot: document.getElementById('neracaLajurMutationDebitFoot'),
    mutationCreditFoot: document.getElementById('neracaLajurMutationCreditFoot'),
    endingDebitFoot: document.getElementById('neracaLajurEndingDebitFoot'),
    endingCreditFoot: document.getElementById('neracaLajurEndingCreditFoot'),
    searchInput: document.getElementById('neracaLajurSearchInput'),
    rows: document.getElementById('neracaLajurRows'),
    coaButton: document.getElementById('neracaLajurCoaBtn'),
    openingButton: document.getElementById('neracaLajurOpeningBtn'),
    coaModal: document.getElementById('neracaLajurCoaModal'),
    coaForm: document.getElementById('neracaLajurCoaForm'),
    oldCoa: document.getElementById('neracaLajurOldCoa'),
    newCoa: document.getElementById('neracaLajurNewCoa'),
    coaName: document.getElementById('neracaLajurCoaName'),
    coaCloseButton: document.getElementById('neracaLajurCoaCloseBtn'),
    coaCancelButton: document.getElementById('neracaLajurCoaCancelBtn'),
    coaSaveButton: document.getElementById('neracaLajurCoaSaveBtn')
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
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/neraca-lajur/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/neraca-lajur';
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Neraca Lajur.');
    return data;
  }

  async function loadNeracaLajur() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      if (!data) return;
      renderShell(data);
      applyPayload(data);
      renderClient();
      renderSelects();
      renderOpeningButton();
      renderSummary();
      renderRows();
      if (state.draftFallbackApplied) {
        setAlert('Mode draft: Neraca Lajur memakai data transaksi DEMO_DISTRIBUTION yang belum diposting.', 'info');
      }
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Neraca Lajur.', 'error');
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

  function applyPayload(data) {
    state.client = data.client || state.client || null;
    state.coaAccounts = Array.isArray(data.coaAccounts) ? data.coaAccounts : [];
    state.rows = Array.isArray(data.rows) ? data.rows : [];
    state.totals = data.totals || {};
    state.postedPeriods = data.postedPeriods || null;
    state.draftFallbackApplied = data.draftFallbackApplied === true;
    state.reportYear = Number(data.reportYear || state.reportYear || new Date().getFullYear());
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
    setText(elements.clientMeta, text(client.name, 'PT X'));
    const reportYear = Number(state.reportYear || window.ClientPortalPeriod?.currentYear?.()) || new Date().getFullYear();
    setText(elements.subtitle, text(client.name, 'Klien') + ' | Summary Buku Besar per COA | Tahun ' + reportYear + ' | ' + postedPeriodText());
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function postedPeriodText() {
    const periods = state.postedPeriods || {};
    const labels = Array.isArray(periods.monthLabels) ? periods.monthLabels.filter(Boolean) : [];
    if (!labels.length) return 'Belum ada periode diposting';
    if (state.draftFallbackApplied) return 'Draft belum diposting: ' + labels.join(', ');
    return 'Periode diposting: ' + labels.join(', ');
  }

  function renderSelects() {
    fillCoaSelect(elements.oldCoa, 'Pilih COA');
  }

  function renderOpeningButton() {
    if (!elements.openingButton) return;
    elements.openingButton.textContent = state.openingUnlocked ? 'Saldo/Ket: Terbuka' : 'Saldo/Ket: Terkunci';
    elements.openingButton.classList.toggle('trial-opening-unlocked-button', state.openingUnlocked);
    elements.openingButton.title = state.openingUnlocked
      ? 'Klik untuk mengunci kolom saldo awal dan keterangan.'
      : 'Klik untuk membuka input saldo awal dan keterangan langsung di tabel.';
  }

  function fillCoaSelect(select, placeholder, filter) {
    if (!select) return;
    const current = select.value;
    const accounts = typeof filter === 'function' ? state.coaAccounts.filter(filter) : state.coaAccounts;
    clearNode(select);
    select.appendChild(option('', placeholder || 'Pilih COA'));
    accounts.forEach(function (account) {
      select.appendChild(option(account.coa, account.coa + ' - ' + account.accountName));
    });
    if (current && accounts.some(function (account) { return account.coa === current; })) {
      select.value = current;
    }
  }

  function option(value, label) {
    const item = document.createElement('option');
    item.value = value;
    item.textContent = label;
    return item;
  }

  function visibleRows() {
    const query = state.searchQuery;
    if (!query) return state.rows;
    return state.rows.filter(function (row) {
      return [
        row.coa,
        row.accountName,
        row.notes
      ].map(function (value) {
        return text(value).toLowerCase();
      }).join(' ').indexOf(query) >= 0;
    });
  }

  function visibleTotals() {
    return visibleRows().reduce(function (totals, row) {
      totals.openingDebit += Number(row.openingDebit || 0);
      totals.openingCredit += Number(row.openingCredit || 0);
      totals.mutationDebit += Number(row.mutationDebit || 0);
      totals.mutationCredit += Number(row.mutationCredit || 0);
      totals.endingDebit += Number(row.endingDebit || 0);
      totals.endingCredit += Number(row.endingCredit || 0);
      return totals;
    }, {
      openingDebit: 0,
      openingCredit: 0,
      mutationDebit: 0,
      mutationCredit: 0,
      endingDebit: 0,
      endingCredit: 0
    });
  }

  function renderSummary() {
    const totals = visibleTotals();
    setText(elements.openingDebitHead, formatAmount(totals.openingDebit) || '0');
    setText(elements.openingCreditHead, formatAmount(totals.openingCredit) || '0');
    setText(elements.mutationDebitHead, formatAmount(totals.mutationDebit) || '0');
    setText(elements.mutationCreditHead, formatAmount(totals.mutationCredit) || '0');
    setText(elements.endingDebitHead, formatAmount(totals.endingDebit) || '0');
    setText(elements.endingCreditHead, formatAmount(totals.endingCredit) || '0');
    setText(elements.openingDebitFoot, formatAmount(totals.openingDebit) || '0');
    setText(elements.openingCreditFoot, formatAmount(totals.openingCredit) || '0');
    setText(elements.mutationDebitFoot, formatAmount(totals.mutationDebit) || '0');
    setText(elements.mutationCreditFoot, formatAmount(totals.mutationCredit) || '0');
    setText(elements.endingDebitFoot, formatAmount(totals.endingDebit) || '0');
    setText(elements.endingCreditFoot, formatAmount(totals.endingCredit) || '0');
  }

  function renderRows() {
    clearNode(elements.rows);
    const rows = visibleRows();
    rows.forEach(function (row) {
      elements.rows.appendChild(trialBalanceRow(row));
    });
    const blankCount = Math.max(8 - rows.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
  }

  function trialBalanceRow(row) {
    const tr = document.createElement('tr');
    tr.appendChild(cell(row.coa));
    tr.appendChild(cell(row.accountName));
    tr.appendChild(openingBalanceCell(row, 'debit'));
    tr.appendChild(openingBalanceCell(row, 'credit'));
    tr.appendChild(cell(formatAmount(row.mutationDebit), 'number'));
    tr.appendChild(cell(formatAmount(row.mutationCredit), 'number'));
    tr.appendChild(cell(formatAmount(row.endingDebit), 'number'));
    tr.appendChild(cell(formatAmount(row.endingCredit), 'number'));
    tr.appendChild(notesCell(row));
    return tr;
  }

  function openingBalanceCell(row, side) {
    const isCredit = side === 'credit';
    const opening = Math.max(0, Number(isCredit ? row.openingCredit : row.openingDebit) || 0);
    const sideLabel = isCredit ? 'kredit' : 'debit';
    if (!state.openingUnlocked || !canEditOpeningBalance(row)) {
      const td = cell(formatAmount(opening), 'number');
      if (!canEditOpeningBalance(row)) {
        td.classList.add('trial-opening-locked-cell');
        td.title = openingLockReason(row);
      }
      return td;
    }
    const td = document.createElement('td');
    td.className = 'number trial-opening-edit-cell';
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.dataset.rupiah = 'true';
    input.className = 'trial-opening-input';
    input.value = formatEditableAmount(opening);
    input.dataset.coa = row.coa;
    input.dataset.side = side;
    input.dataset.originalValue = String(opening || 0);
    input.disabled = state.savingOpeningCoa === row.coa;
    input.title = 'Isi saldo awal ' + sideLabel + '. Enter atau keluar dari sel untuk simpan.';
    input.setAttribute('aria-label', 'Saldo awal ' + sideLabel + ' ' + text(row.coa) + ' ' + text(row.accountName));
    input.addEventListener('focus', function () {
      input.select();
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        input.value = formatEditableAmount(Number(input.dataset.originalValue || 0));
        input.blur();
      }
    });
    input.addEventListener('blur', function () {
      saveOpeningInline(row, input, side);
    });
    td.appendChild(input);
    return td;
  }

  function notesCell(row) {
    if (!state.openingUnlocked || !row || !row.coa) {
      return cell(row && row.notes);
    }
    const td = document.createElement('td');
    td.className = 'trial-opening-edit-cell';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'trial-opening-input trial-notes-input';
    input.value = text(row.notes);
    input.dataset.coa = row.coa;
    input.dataset.originalValue = text(row.notes);
    input.disabled = state.savingNotesCoa === row.coa;
    input.title = 'Isi keterangan. Enter atau keluar dari sel untuk simpan.';
    input.setAttribute('aria-label', 'Keterangan ' + text(row.coa) + ' ' + text(row.accountName));
    input.addEventListener('focus', function () {
      input.select();
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        input.value = input.dataset.originalValue || '';
        input.blur();
      }
    });
    input.addEventListener('blur', function () {
      saveNotesInline(row, input);
    });
    td.appendChild(input);
    return td;
  }

  function blankRow() {
    const tr = document.createElement('tr');
    for (let index = 0; index < 9; index += 1) tr.appendChild(cell(''));
    return tr;
  }

  function cell(value, variant) {
    const td = document.createElement('td');
    if (variant) td.className = variant;
    const fullText = text(value);
    td.textContent = fullText;
    if (fullText) td.title = fullText;
    return td;
  }

  function canEditOpeningBalance(row) {
    const coa = text(row && row.coa);
    const accountName = text(row && row.accountName);
    if (!coa) return false;
    if (/^[4-9]/.test(coa)) return false;
    if (/^(?:1-500|15\d{2})/.test(coa) || /persediaan/i.test(accountName)) return false;
    return true;
  }

  function openingLockReason(row) {
    const coa = text(row && row.coa);
    const accountName = text(row && row.accountName);
    if (/^[4-9]/.test(coa)) return 'COA laba rugi tidak memakai saldo awal.';
    if (/^(?:1-500|15\d{2})/.test(coa) || /persediaan/i.test(accountName)) return 'Saldo awal persediaan mengikuti Buku Persediaan.';
    return 'Klik tombol Saldo Awal untuk membuka input.';
  }

  function formatAmount(value) {
    const number = Number(value || 0);
    return number ? currency.format(number) : '';
  }

  function formatSignedAmount(value) {
    const number = Number(value || 0);
    if (!number) return '';
    const formatted = currency.format(Math.abs(number));
    return number < 0 ? '(' + formatted + ')' : formatted;
  }

  function formatEditableAmount(value) {
    const number = Number(value || 0);
    if (!number) return '';
    return number < 0 ? '-' + currency.format(Math.abs(number)) : currency.format(number);
  }

  function parseEditableAmount(value) {
    const raw = text(value);
    if (!raw) return 0;
    const parenthesized = /^\(.*\)$/.test(raw);
    const cleaned = raw
      .replace(/[()]/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    if (!Number.isFinite(amount)) return 0;
    return parenthesized ? -Math.abs(amount) : amount;
  }

  function selectedAccount(select) {
    const coa = text(select && select.value);
    return state.coaAccounts.find(function (account) {
      return account.coa === coa;
    }) || null;
  }

  function rowByCoa(coa) {
    return state.rows.find(function (row) {
      return row.coa === coa;
    }) || null;
  }

  function openCoaModal() {
    elements.coaForm.reset();
    renderSelects();
    syncCoaFields();
    elements.coaModal.hidden = false;
    window.setTimeout(function () {
      elements.oldCoa.focus();
    }, 0);
  }

  function closeCoaModal() {
    elements.coaModal.hidden = true;
  }

  function syncCoaFields() {
    const account = selectedAccount(elements.oldCoa);
    elements.newCoa.value = account ? account.coa : '';
    elements.coaName.value = account ? account.accountName : '';
  }

  async function submitCoa(event) {
    event.preventDefault();
    elements.coaSaveButton.disabled = true;
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/coa', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          oldCoa: elements.oldCoa.value,
          newCoa: elements.newCoa.value,
          accountName: elements.coaName.value
        })
      });
      if (!data) return;
      applyPayload(data);
      state.savingOpeningCoa = '';
      renderClient();
      renderSelects();
      renderOpeningButton();
      renderSummary();
      renderRows();
      closeCoaModal();
      setAlert('COA berhasil diperbarui.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan COA.', 'error');
    } finally {
      elements.coaSaveButton.disabled = false;
    }
  }

  function toggleOpeningEdit() {
    state.openingUnlocked = !state.openingUnlocked;
    renderOpeningButton();
    renderRows();
    if (state.openingUnlocked) {
      setAlert('Kolom saldo awal dan keterangan terbuka. Isi langsung di tabel, lalu tekan Enter atau klik keluar dari sel untuk menyimpan.', 'info');
    } else {
      setAlert('Kolom saldo awal dan keterangan terkunci.', 'info');
    }
  }

  async function saveOpeningInline(row, input, side) {
    if (!row || !input || input.disabled) return;
    const amount = parseEditableAmount(input.value);
    const previous = Number(input.dataset.originalValue || 0);
    if (amount < 0) {
      input.value = formatEditableAmount(previous);
      setAlert('Saldo awal debit/kredit tidak boleh minus.', 'error');
      return;
    }
    if (Math.abs(amount - previous) < 0.01) {
      input.value = formatEditableAmount(previous);
      return;
    }
    const isCredit = side === 'credit';
    const openingDebit = isCredit
      ? (amount > 0 ? 0 : Number(row.openingDebit || 0))
      : amount;
    const openingCredit = isCredit
      ? amount
      : (amount > 0 ? 0 : Number(row.openingCredit || 0));
    input.disabled = true;
    state.savingOpeningCoa = row.coa;
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/opening-balance', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coa: row.coa,
          openingDebit,
          openingCredit,
          notes: row.notes || ''
        })
      });
      if (!data) return;
      applyPayload(data);
      state.savingOpeningCoa = '';
      renderClient();
      renderSelects();
      renderOpeningButton();
      renderSummary();
      renderRows();
      setAlert('Saldo awal ' + text(row.coa) + ' berhasil disimpan.', 'info');
    } catch (err) {
      input.disabled = false;
      input.value = formatEditableAmount(previous);
      setAlert(err.message || 'Gagal menyimpan saldo awal.', 'error');
    } finally {
      if (state.savingOpeningCoa === row.coa) state.savingOpeningCoa = '';
    }
  }

  async function saveNotesInline(row, input) {
    if (!row || !input || input.disabled) return;
    const notes = text(input.value).slice(0, 500);
    const previous = text(input.dataset.originalValue);
    if (notes === previous) {
      input.value = previous;
      return;
    }
    input.disabled = true;
    state.savingNotesCoa = row.coa;
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/opening-balance', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coa: row.coa,
          notes,
          notesOnly: true
        })
      });
      if (!data) return;
      applyPayload(data);
      state.savingNotesCoa = '';
      renderClient();
      renderSelects();
      renderOpeningButton();
      renderSummary();
      renderRows();
      setAlert('Keterangan ' + text(row.coa) + ' berhasil disimpan.', 'info');
    } catch (err) {
      input.disabled = false;
      input.value = previous;
      setAlert(err.message || 'Gagal menyimpan keterangan.', 'error');
    } finally {
      if (state.savingNotesCoa === row.coa) state.savingNotesCoa = '';
    }
  }

  function handleSearchInput() {
    state.searchQuery = text(elements.searchInput && elements.searchInput.value).toLowerCase();
    renderSummary();
    renderRows();
  }

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadNeracaLajur);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.searchInput) elements.searchInput.addEventListener('input', handleSearchInput);
  if (elements.coaButton) elements.coaButton.addEventListener('click', openCoaModal);
  if (elements.openingButton) elements.openingButton.addEventListener('click', toggleOpeningEdit);
  if (elements.coaCloseButton) elements.coaCloseButton.addEventListener('click', closeCoaModal);
  if (elements.coaCancelButton) elements.coaCancelButton.addEventListener('click', closeCoaModal);
  if (elements.coaForm) elements.coaForm.addEventListener('submit', submitCoa);
  if (elements.oldCoa) elements.oldCoa.addEventListener('change', syncCoaFields);
  if (elements.coaModal) {
    elements.coaModal.addEventListener('click', function (event) {
      if (event.target === elements.coaModal) closeCoaModal();
    });
  }

  loadNeracaLajur();
})();
