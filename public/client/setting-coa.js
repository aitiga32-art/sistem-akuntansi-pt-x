(function () {
  const COA_CODE_PATTERN = /^(?:\d-\d{4}|\d{4})$/;
  const COA_FORMAT_MESSAGE = 'Format COA harus 4 digit angka (contoh: 1100) atau format lama 1-1001.';

  const state = {
    client: null,
    coaAccounts: [],
    openingBalanceStatus: null,
    searchQuery: '',
    editingAccount: null,
    loading: false
  };

  const elements = {
    alert: document.getElementById('settingCoaAlert'),
    clientMeta: document.getElementById('settingCoaClientMeta'),
    userName: document.getElementById('settingCoaUserName'),
    userEmail: document.getElementById('settingCoaUserEmail'),
    refreshButton: document.getElementById('settingCoaRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('settingCoaBackLink'),
    subtitle: document.getElementById('settingCoaSubtitle'),
    addButton: document.getElementById('settingCoaAddBtn'),
    searchInput: document.getElementById('settingCoaSearchInput'),
    count: document.getElementById('settingCoaCount'),
    debitTotal: document.getElementById('settingCoaDebitTotal'),
    creditTotal: document.getElementById('settingCoaCreditTotal'),
    differenceTotal: document.getElementById('settingCoaDifferenceTotal'),
    balanceStatus: document.getElementById('settingCoaBalanceStatus'),
    rows: document.getElementById('settingCoaRows'),
    modal: document.getElementById('settingCoaModal'),
    form: document.getElementById('settingCoaForm'),
    modalTitle: document.getElementById('settingCoaModalTitle'),
    modalMeta: document.getElementById('settingCoaModalMeta'),
    closeButton: document.getElementById('settingCoaCloseBtn'),
    cancelButton: document.getElementById('settingCoaCancelBtn'),
    saveButton: document.getElementById('settingCoaSaveBtn'),
    accountId: document.getElementById('settingCoaAccountId'),
    coaCode: document.getElementById('settingCoaCode'),
    accountName: document.getElementById('settingCoaAccountName'),
    sortOrder: document.getElementById('settingCoaSortOrder')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function normalizeCoaCode(value) {
    return text(value).toUpperCase().replace(/\s+/g, '');
  }

  function focusCoaCodeInput() {
    if (!elements.coaCode) return;
    elements.coaCode.focus();
    elements.coaCode.select();
  }

  function findDuplicateCoa(coaCode, accountId) {
    const normalized = normalizeCoaCode(coaCode);
    const currentId = text(accountId);
    return state.coaAccounts.find(function (account) {
      return normalizeCoaCode(account.coa) === normalized && text(account.id) !== currentId;
    });
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
      window.clearTimeout(elements.alert._timer);
      elements.alert._timer = window.setTimeout(function () {
        setAlert('');
      }, 3000);
    }
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/setting-coa/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/setting-coa';
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Setting COA.');
    return data;
  }

  function groupLabel(coaCode) {
    const first = text(coaCode).charAt(0);
    if (first === '1') return 'Aktiva';
    if (first === '2') return 'Kewajiban';
    if (first === '3') return 'Modal';
    if (first === '4') return 'Pendapatan';
    if (first === '5') return 'HPP';
    if (first === '6') return 'Biaya';
    if (first === '7') return 'Lainnya';
    if (first === '9') return 'Selisih';
    return 'Belum dikelompokkan';
  }

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  function formatAmount(value) {
    const number = Number(value || 0);
    return currency.format(number);
  }

  function formatInputAmount(value) {
    const number = Number(value || 0);
    return number ? formatAmount(number) : '';
  }

  function parseAmount(value) {
    const raw = value && value.value != null ? value.value : value;
    if (raw == null || raw === '') return 0;
    const cleaned = String(raw)
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : 0;
  }

  function formatDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '-' + match[2] + '-' + match[1] : raw || '-';
  }

  function filteredAccounts() {
    const query = state.searchQuery.toLowerCase();
    return state.coaAccounts.filter(function (account) {
      if (!query) return true;
      return text(account.coa).toLowerCase().includes(query) ||
        text(account.accountName).toLowerCase().includes(query) ||
        groupLabel(account.coa).toLowerCase().includes(query);
    });
  }

  async function loadSettingCoa() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      state.coaAccounts = Array.isArray(data.coaAccounts) ? data.coaAccounts : [];
      state.openingBalanceStatus = data.openingBalanceStatus || null;
      renderClient();
      renderSummary();
      renderRows();
      renderBalanceWarning();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Setting COA.', 'error');
      clearNode(elements.rows);
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 9;
      td.textContent = 'Saldo awal belum bisa dimuat.';
      tr.appendChild(td);
      elements.rows.appendChild(tr);
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

  function renderClient() {
    const client = state.client || {};
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.subtitle, text(client.name, 'Klien') + ' | Tambah akun dan isi saldo awal');
    setText(elements.count, filteredAccounts().length + ' akun');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function localOpeningStatus() {
    const status = state.openingBalanceStatus || {};
    const totals = state.coaAccounts.reduce(function (acc, account) {
      acc.debit += Number(account.openingDebit || 0);
      acc.credit += Number(account.openingCredit || 0);
      if (/^9-/.test(text(account.coa)) && (Number(account.openingDebit || 0) || Number(account.openingCredit || 0))) {
        acc.hasDifferenceAccount = true;
      }
      return acc;
    }, { debit: 0, credit: 0, hasDifferenceAccount: false });
    const difference = Number(status.difference != null ? status.difference : (totals.debit - totals.credit));
    const hasDifferenceAccount = Boolean(status.hasDifferenceAccount || totals.hasDifferenceAccount);
    const balanced = status.balanced != null ? Boolean(status.balanced) : Math.abs(difference) <= 0.009 && !hasDifferenceAccount;
    return {
      debit: Number(status.debit != null ? status.debit : totals.debit),
      credit: Number(status.credit != null ? status.credit : totals.credit),
      difference,
      hasDifferenceAccount,
      balanced,
      message: text(status.message) || (balanced
        ? 'Saldo awal sudah balance.'
        : hasDifferenceAccount
          ? 'Saldo awal tidak balance karena akun selisih nomor 9 terisi.'
          : 'Saldo awal belum balance.')
    };
  }

  function renderSummary() {
    const status = localOpeningStatus();
    setText(elements.debitTotal, formatAmount(status.debit));
    setText(elements.creditTotal, formatAmount(status.credit));
    setText(elements.differenceTotal, formatAmount(Math.abs(status.difference)));
    setText(elements.balanceStatus, status.balanced ? 'Balance' : 'Belum balance');
    if (elements.balanceStatus) {
      elements.balanceStatus.style.color = status.balanced ? '#0f766e' : '#b91c1c';
    }
  }

  function renderBalanceWarning() {
    const status = localOpeningStatus();
    if (status.balanced) {
      setAlert(status.message, 'info');
      return;
    }
    setAlert(status.message, 'error');
  }

  function createButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function canEditOpeningBalance(account) {
    const coaCode = text(account?.coa);
    return /^[1-3]-/.test(coaCode) || /^[1-3]\d{3}$/.test(coaCode) || /^9-/.test(coaCode) || /^9\d{3}$/.test(coaCode);
  }

  function openingLockReason() {
    return 'Saldo awal hanya untuk akun neraca. Akun 9 khusus untuk selisih saldo awal.';
  }

  function setRowOpeningDisabled(row, disabled) {
    if (!row) return;
    row.querySelectorAll('[data-opening-side], [data-opening-notes]').forEach(function (input) {
      if (!input.dataset.locked) input.disabled = disabled;
    });
  }

  function updateOpeningInputPair(input) {
    const row = input.closest('tr');
    if (!row || !input.dataset.openingSide) return;
    const side = input.dataset.openingSide;
    const other = row.querySelector('[data-opening-side="' + (side === 'debit' ? 'credit' : 'debit') + '"]');
    if (parseAmount(input.value) > 0 && other && !other.disabled) other.value = '';
  }

  function buildOpeningAmountInput(account, side) {
    const input = document.createElement('input');
    const editable = canEditOpeningBalance(account);
    const value = side === 'debit' ? account.openingDebit : account.openingCredit;
    input.type = 'text';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.className = 'setting-opening-input amount';
    input.dataset.accountId = text(account.id);
    input.dataset.openingSide = side;
    input.dataset.originalValue = String(Number(value || 0));
    input.value = formatInputAmount(value);
    input.placeholder = '0';
    input.disabled = !editable;
    if (!editable) {
      input.dataset.locked = '1';
      input.title = openingLockReason();
    }
    input.addEventListener('input', function () {
      input.value = input.value.replace(/[^\d.,-]/g, '');
      updateOpeningInputPair(input);
    });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      }
    });
    input.addEventListener('blur', function () {
      saveOpeningInline(account, input);
    });
    return input;
  }

  function buildOpeningNotesInput(account) {
    const input = document.createElement('input');
    const editable = canEditOpeningBalance(account);
    input.type = 'text';
    input.autocomplete = 'off';
    input.className = 'setting-opening-input notes';
    input.dataset.accountId = text(account.id);
    input.dataset.openingNotes = '1';
    input.dataset.originalValue = text(account.notes);
    input.value = text(account.notes);
    input.placeholder = '-';
    input.disabled = !editable;
    if (!editable) {
      input.dataset.locked = '1';
      input.title = openingLockReason();
    }
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      }
    });
    input.addEventListener('blur', function () {
      saveOpeningInline(account, input);
    });
    return input;
  }

  function applySettingCoaData(data) {
    state.client = data.client || state.client;
    state.coaAccounts = Array.isArray(data.coaAccounts) ? data.coaAccounts : [];
    state.openingBalanceStatus = data.openingBalanceStatus || state.openingBalanceStatus;
    renderClient();
    renderSummary();
    renderRows();
    renderBalanceWarning();
  }

  function resetOpeningInputs(row) {
    if (!row) return;
    const debitInput = row.querySelector('[data-opening-side="debit"]');
    const creditInput = row.querySelector('[data-opening-side="credit"]');
    const notesInput = row.querySelector('[data-opening-notes]');
    if (debitInput) debitInput.value = formatInputAmount(debitInput.dataset.originalValue);
    if (creditInput) creditInput.value = formatInputAmount(creditInput.dataset.originalValue);
    if (notesInput) notesInput.value = text(notesInput.dataset.originalValue);
  }

  async function saveOpeningInline(account, input) {
    if (!account || !input || input.disabled || !canEditOpeningBalance(account)) return;
    const row = input.closest('tr');
    const debitInput = row && row.querySelector('[data-opening-side="debit"]');
    const creditInput = row && row.querySelector('[data-opening-side="credit"]');
    const notesInput = row && row.querySelector('[data-opening-notes]');
    const openingDebit = parseAmount(debitInput && debitInput.value);
    const openingCredit = parseAmount(creditInput && creditInput.value);
    const notes = text(notesInput && notesInput.value);
    const previousDebit = Number(debitInput?.dataset.originalValue || 0);
    const previousCredit = Number(creditInput?.dataset.originalValue || 0);
    const previousNotes = text(notesInput?.dataset.originalValue);

    if (openingDebit < 0 || openingCredit < 0) {
      setAlert('Saldo awal debit/kredit tidak boleh minus.', 'error');
      resetOpeningInputs(row);
      return;
    }
    if (openingDebit && openingCredit) {
      setAlert('Isi salah satu saja antara saldo awal debit atau kredit.', 'error');
      resetOpeningInputs(row);
      return;
    }
    if (
      Math.abs(openingDebit - previousDebit) < 0.009 &&
      Math.abs(openingCredit - previousCredit) < 0.009 &&
      notes === previousNotes
    ) {
      if (debitInput) debitInput.value = formatInputAmount(openingDebit);
      if (creditInput) creditInput.value = formatInputAmount(openingCredit);
      return;
    }

    setRowOpeningDisabled(row, true);
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(account.id), {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coa: normalizeCoaCode(account.coa),
          accountName: text(account.accountName).toUpperCase(),
          sortOrder: Number(account.sortOrder || 0) || undefined,
          openingDebit,
          openingCredit,
          notes
        })
      });
      if (!data) return;
      applySettingCoaData(data);
    } catch (err) {
      resetOpeningInputs(row);
      setAlert(err.message || 'Saldo awal gagal disimpan.', 'error');
    } finally {
      setRowOpeningDisabled(row, false);
    }
  }

  function renderRows() {
    clearNode(elements.rows);
    const rows = filteredAccounts();
    setText(elements.count, rows.length + ' akun');
    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 9;
      td.textContent = state.searchQuery ? 'Akun tidak ditemukan.' : 'Belum ada akun aktif.';
      tr.appendChild(td);
      elements.rows.appendChild(tr);
      return;
    }
    rows.forEach(function (account, index) {
      const tr = document.createElement('tr');
      const no = document.createElement('td');
      const coa = document.createElement('td');
      const name = document.createElement('td');
      const group = document.createElement('td');
      const debit = document.createElement('td');
      const credit = document.createElement('td');
      const notes = document.createElement('td');
      const updated = document.createElement('td');
      const actions = document.createElement('td');

      no.className = 'number setting-coa-no';
      no.textContent = String(index + 1);
      coa.className = 'setting-coa-code-cell';
      coa.textContent = text(account.coa, '-');
      name.textContent = text(account.accountName, '-');
      const groupPill = document.createElement('span');
      groupPill.className = 'setting-coa-pill';
      groupPill.textContent = groupLabel(account.coa);
      group.appendChild(groupPill);
      debit.className = 'number setting-coa-editable-cell';
      debit.appendChild(buildOpeningAmountInput(account, 'debit'));
      credit.className = 'number setting-coa-editable-cell';
      credit.appendChild(buildOpeningAmountInput(account, 'credit'));
      notes.className = 'setting-coa-editable-cell';
      notes.appendChild(buildOpeningNotesInput(account));
      updated.textContent = formatDate(account.openingUpdatedAt || account.updatedAt);
      actions.className = 'cashbook-actions setting-coa-actions';
      actions.appendChild(createButton('Ubah', 'ghost-button mini-action', function () {
        openModal(account);
      }));
      actions.appendChild(createButton('Hapus', 'ghost-button mini-action danger', function () {
        deleteAccount(account);
      }));

      tr.appendChild(no);
      tr.appendChild(coa);
      tr.appendChild(name);
      tr.appendChild(group);
      tr.appendChild(debit);
      tr.appendChild(credit);
      tr.appendChild(notes);
      tr.appendChild(updated);
      tr.appendChild(actions);
      if (/^9-/.test(text(account.coa)) && (Number(account.openingDebit || 0) || Number(account.openingCredit || 0))) {
        tr.classList.add('danger-row');
        tr.title = 'Akun selisih terisi, saldo awal dianggap belum balance.';
      }
      elements.rows.appendChild(tr);
    });
  }

  function resetForm(account) {
    state.editingAccount = account || null;
    elements.form.reset();
    setText(elements.modalTitle, account ? 'Ubah Akun' : 'Tambah Akun');
    setText(elements.modalMeta, 'Tambah atau ubah akun. Saldo awal diisi langsung di tabel.');
    elements.accountId.value = text(account?.id);
    elements.coaCode.value = text(account?.coa);
    elements.accountName.value = text(account?.accountName);
    elements.sortOrder.value = account?.sortOrder ? String(account.sortOrder) : '';
  }

  function openModal(account) {
    resetForm(account);
    elements.modal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(function () {
      elements.coaCode.focus();
    }, 0);
  }

  function closeModal() {
    elements.modal.hidden = true;
    document.body.classList.remove('modal-open');
    state.editingAccount = null;
  }

  async function saveAccount(event) {
    event.preventDefault();
    const payload = {
      coa: normalizeCoaCode(elements.coaCode.value),
      accountName: text(elements.accountName.value).toUpperCase(),
      sortOrder: Number(elements.sortOrder.value || 0) || undefined
    };
    if (!payload.coa || !payload.accountName) {
      setAlert('Kode COA dan nama akun wajib diisi.', 'error');
      if (!payload.coa) focusCoaCodeInput();
      return;
    }
    elements.coaCode.value = payload.coa;
    const accountId = text(elements.accountId.value);
    if (!COA_CODE_PATTERN.test(payload.coa)) {
      setAlert(COA_FORMAT_MESSAGE, 'error');
      focusCoaCodeInput();
      return;
    }
    if (findDuplicateCoa(payload.coa, accountId)) {
      setAlert('Akun ' + payload.coa + ' sudah ada. Gunakan kode lain.', 'error');
      focusCoaCodeInput();
      return;
    }
    if (elements.saveButton) elements.saveButton.disabled = true;
    try {
      const data = await requestJson(accountId ? apiBase() + '/' + encodeURIComponent(accountId) : apiBase(), {
        method: accountId ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!data) return;
      closeModal();
      applySettingCoaData(data);
    } catch (err) {
      setAlert(err.message || 'Akun gagal disimpan.', 'error');
    } finally {
      if (elements.saveButton) elements.saveButton.disabled = false;
    }
  }

  async function deleteAccount(account) {
    const label = text(account.coa) + ' - ' + text(account.accountName);
    if (!window.confirm('Hapus akun ' + label + ' dari daftar aktif?')) return;
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(account.id), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!data) return;
      applySettingCoaData(data);
    } catch (err) {
      setAlert(err.message || 'Akun gagal dihapus.', 'error');
    }
  }

  function bindEvents() {
    if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadSettingCoa);
    if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
    if (elements.addButton) elements.addButton.addEventListener('click', function () {
      openModal(null);
    });
    if (elements.searchInput) elements.searchInput.addEventListener('input', function () {
      state.searchQuery = elements.searchInput.value.trim();
      renderRows();
    });
    if (elements.form) elements.form.addEventListener('submit', saveAccount);
    if (elements.coaCode) elements.coaCode.addEventListener('blur', function () {
      elements.coaCode.value = normalizeCoaCode(elements.coaCode.value);
    });
    if (elements.closeButton) elements.closeButton.addEventListener('click', closeModal);
    if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeModal);
    if (elements.modal) elements.modal.addEventListener('click', function (event) {
      if (event.target === elements.modal) closeModal();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && elements.modal && !elements.modal.hidden) closeModal();
    });
  }

  bindEvents();
  loadSettingCoa();
})();
