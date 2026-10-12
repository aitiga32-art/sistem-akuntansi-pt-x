(function () {
  const state = {
    client: null,
    user: null,
    closings: [],
    loading: false
  };

  const elements = {
    alert: document.getElementById('periodAlert'),
    clientMeta: document.getElementById('periodClientMeta'),
    userName: document.getElementById('periodUserName'),
    userEmail: document.getElementById('periodUserEmail'),
    backLink: document.getElementById('periodBackLink'),
    subtitle: document.getElementById('periodSubtitle'),
    refreshButton: document.getElementById('periodRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    year: document.getElementById('periodYearInput'),
    showButton: document.getElementById('periodShowBtn'),
    closeBookButton: document.getElementById('periodCloseBookBtn'),
    count: document.getElementById('periodCount'),
    rows: document.getElementById('periodRows'),
    modal: document.getElementById('periodPostingModal'),
    modalForm: document.getElementById('periodPostingForm'),
    modalSubtitle: document.getElementById('periodPostingModalSubtitle'),
    closingDate: document.getElementById('periodClosingDate'),
    modalNotes: document.getElementById('periodPostingNotes'),
    modalCloseButton: document.getElementById('periodPostingCloseBtn'),
    modalCancelButton: document.getElementById('periodPostingCancelBtn'),
    modalSubmitButton: document.getElementById('periodPostingSubmitBtn')
  };

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
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function today() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  }

  function selectedYear() {
    const value = Number(elements.year?.value || new Date().getFullYear());
    return Number.isFinite(value) ? value : new Date().getFullYear();
  }

  function apiUrl() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/period-posting?year=' + encodeURIComponent(selectedYear());
  }

  async function requestJson(url, options) {
    const response = await fetch(url, Object.assign({
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    }, options || {}));
    if (response.status === 401) {
      window.location.assign('/app/client/login?expired=' + Date.now());
      return null;
    }
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Tutup Buku.');
    return data;
  }

  async function loadPage() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiUrl());
      if (!data) return;
      state.client = data.client || null;
      state.user = data.user || null;
      state.closings = Array.isArray(data.closings) ? data.closings : [];
      if (data.year && elements.year) elements.year.value = String(data.year);
      renderShell(data);
      renderRows();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Tutup Buku.', 'error');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
    }
  }

  function renderShell(data) {
    const user = data.user || {};
    const client = data.client || {};
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    setText(elements.clientMeta, text(client.name, 'Client Portal'));
    setText(elements.subtitle, text(client.name, 'Klien') + ' | Tutup akun nominal ke akun laba berjalan');
    if (elements.backLink && client.id) elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
  }

  function renderRows() {
    clearNode(elements.rows);
    if (!state.closings.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.textContent = 'Belum ada histori tutup buku.';
      row.appendChild(cell);
      elements.rows.appendChild(row);
      setText(elements.count, '0 histori');
      return;
    }
    state.closings.forEach(function (closing) {
      elements.rows.appendChild(closingRow(closing));
    });
    const activeCount = state.closings.filter(function (item) { return !item.isReversed; }).length;
    setText(elements.count, activeCount + ' aktif / ' + state.closings.length + ' histori');
  }

  function closingRow(closing) {
    const row = document.createElement('tr');
    row.appendChild(cell(formatDate(closing.closingDate)));
    const status = cell(closing.isReversed ? 'Dibatalkan' : 'Aktif');
    status.className = closing.isReversed ? 'period-status open' : 'period-status posted';
    row.appendChild(status);
    row.appendChild(cell(closing.createdBy || '-'));
    row.appendChild(cell(formatDateTime(closing.createdAt)));
    row.appendChild(cell(closing.notes || profitLabel(closing), 'period-note-cell'));
    row.appendChild(actionCell(closing));
    return row;
  }

  function cell(value, className) {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.textContent = text(value, '-');
    if (td.textContent) td.title = td.textContent;
    return td;
  }

  function actionCell(closing) {
    const td = document.createElement('td');
    td.className = 'cashbook-actions period-actions';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cashbook-action-button danger';
    button.textContent = 'Batalkan';
    button.disabled = !closing.canReverse;
    button.title = closing.canReverse
      ? 'Batalkan tutup buku terakhir.'
      : (closing.isReversed ? 'Histori ini sudah dibatalkan.' : 'Batalkan histori paling akhir dulu.');
    button.addEventListener('click', function () {
      reverseClosing(closing);
    });
    td.appendChild(button);
    return td;
  }

  function openClosingModal() {
    setAlert('');
    if (elements.modalForm) elements.modalForm.reset();
    if (elements.closingDate) elements.closingDate.value = today();
    setText(elements.modalSubtitle, 'Sistem akan membuat Jurnal Memorial penutup sampai tanggal yang dipilih.');
    elements.modal.hidden = false;
    window.setTimeout(function () {
      if (elements.closingDate) elements.closingDate.focus();
    }, 0);
  }

  function closeClosingModal() {
    if (elements.modal) elements.modal.hidden = true;
    if (elements.modalForm) elements.modalForm.reset();
  }

  async function submitClosing(event) {
    event.preventDefault();
    if (elements.modalSubmitButton) elements.modalSubmitButton.disabled = true;
    try {
      const data = await requestJson('/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/book-closing', {
        method: 'POST',
        body: JSON.stringify({
          closingDate: elements.closingDate ? elements.closingDate.value : '',
          notes: elements.modalNotes ? elements.modalNotes.value : ''
        })
      });
      if (!data) return;
      if (data.year && elements.year) elements.year.value = String(data.year);
      state.closings = Array.isArray(data.closings) ? data.closings : state.closings;
      renderRows();
      closeClosingModal();
      setAlert('Tutup buku berhasil dibuat dan Jurnal Memorial penutup sudah masuk.', 'success');
    } catch (err) {
      setAlert(err.message || 'Gagal melakukan tutup buku.', 'error');
    } finally {
      if (elements.modalSubmitButton) elements.modalSubmitButton.disabled = false;
    }
  }

  async function reverseClosing(closing) {
    if (!closing || !closing.canReverse) return;
    if (!window.confirm('Batalkan tutup buku tanggal ' + formatDate(closing.closingDate) + '?')) return;
    try {
      const data = await requestJson('/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/book-closing/' + encodeURIComponent(closing.id) + '/reverse', {
        method: 'POST',
        body: JSON.stringify({})
      });
      if (!data) return;
      state.closings = Array.isArray(data.closings) ? data.closings : state.closings;
      renderRows();
      setAlert('Tutup buku terakhir berhasil dibatalkan. Akun nominal kembali seperti sebelum penutupan.', 'success');
    } catch (err) {
      setAlert(err.message || 'Gagal membatalkan tutup buku.', 'error');
    }
  }

  function profitLabel(closing) {
    const amount = Number(closing.profitAmount || 0);
    if (amount > 0) return 'Laba ditutup ke akun laba berjalan.';
    if (amount < 0) return 'Rugi ditutup ke akun laba berjalan.';
    return 'Tutup buku tanpa laba/rugi.';
  }

  function formatDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '-' + match[2] + '-' + match[1] : raw || '-';
  }

  function formatDateTime(value) {
    const raw = text(value);
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function logout() {
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

  if (elements.year) elements.year.value = String(new Date().getFullYear());
  if (elements.showButton) elements.showButton.addEventListener('click', loadPage);
  if (elements.closeBookButton) elements.closeBookButton.addEventListener('click', openClosingModal);
  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadPage);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.modalForm) elements.modalForm.addEventListener('submit', submitClosing);
  if (elements.modalCloseButton) elements.modalCloseButton.addEventListener('click', closeClosingModal);
  if (elements.modalCancelButton) elements.modalCancelButton.addEventListener('click', closeClosingModal);
  if (elements.modal) {
    elements.modal.addEventListener('click', function (event) {
      if (event.target === elements.modal) closeClosingModal();
    });
  }
  loadPage();
})();
