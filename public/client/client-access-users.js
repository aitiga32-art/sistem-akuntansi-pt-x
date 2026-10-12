(function () {
  const state = {
    clients: [],
    accounts: [],
    loading: false
  };

  const elements = {
    alert: document.getElementById('accessAlert'),
    userName: document.getElementById('accessUserName'),
    userEmail: document.getElementById('accessUserEmail'),
    refreshButton: document.getElementById('accessRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    form: document.getElementById('accessUserForm'),
    clientSelect: document.getElementById('accessClientSelect'),
    clientSummary: document.getElementById('accessClientSummary'),
    username: document.getElementById('accessUsername'),
    email: document.getElementById('accessEmail'),
    password: document.getElementById('accessPassword'),
    displayName: document.getElementById('accessDisplayName'),
    role: document.getElementById('accessRole'),
    businessEntity: document.getElementById('accessBusinessEntity'),
    isActive: document.getElementById('accessIsActive'),
    submitButton: document.getElementById('accessSubmitBtn'),
    accountCount: document.getElementById('accessAccountCount'),
    accountList: document.getElementById('accessAccountList')
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

  function emptyState(message) {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.textContent = message;
    return div;
  }

  function slugUsername(value) {
    return text(value)
      .toLowerCase()
      .replace(/^(pt|cv|toko|bapak|ibu|yayasan)\s+/i, '')
      .replace(/[^a-z0-9]+/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .slice(0, 48);
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Request client portal gagal.');
    return data;
  }

  async function loadAccessUsers() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson('/app/api/client/access-users');
      if (!data) return;
      const user = data.user || {};
      setText(elements.userName, text(user.displayName || user.username, '-'));
      setText(elements.userEmail, text(user.email || user.contactName, '-'));
      state.clients = Array.isArray(data.clients) ? data.clients : [];
      state.accounts = Array.isArray(data.accounts) ? data.accounts : [];
      renderClientOptions();
      renderClientSummary();
      renderAccounts();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat akses user.', 'error');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
    }
  }

  async function saveAccessUser(event) {
    event.preventDefault();
    const client = selectedClient();
    const payload = {
      clientId: elements.clientSelect.value,
      username: elements.username.value,
      email: elements.email.value,
      password: elements.password.value,
      displayName: elements.displayName.value,
      role: elements.role.value,
      businessEntityKey: elements.businessEntity ? elements.businessEntity.value : '',
      businessEntityName: selectedBusinessEntity()?.name || '',
      isActive: elements.isActive.checked
    };
    if (!client) {
      setAlert('Pilih klien terlebih dahulu.', 'error');
      return;
    }
    if (!text(payload.username)) {
      setAlert('Username wajib diisi.', 'error');
      return;
    }
    if (!state.accounts.some(account => account.username.toLowerCase() === text(payload.username).toLowerCase()) && !text(payload.password)) {
      setAlert('Password wajib diisi untuk akun baru.', 'error');
      return;
    }

    if (elements.submitButton) elements.submitButton.disabled = true;
    try {
      const data = await requestJson('/app/api/client/access-users', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      setAlert('Akses client portal tersimpan untuk ' + (data.clientName || client.name) + '.', 'info');
      if (elements.password) elements.password.value = '';
      await loadAccessUsers();
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan akses user.', 'error');
    } finally {
      if (elements.submitButton) elements.submitButton.disabled = false;
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

  function renderClientOptions() {
    clearNode(elements.clientSelect);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = state.clients.length ? 'Pilih klien dari Data Klien' : 'Belum ada data klien';
    elements.clientSelect.appendChild(placeholder);
    state.clients.forEach(function (client) {
      const option = document.createElement('option');
      option.value = client.id;
      option.textContent = client.name + (client.nikNpwp ? ' - ' + client.nikNpwp : '');
      elements.clientSelect.appendChild(option);
    });
  }

  function selectedClient() {
    const clientId = elements.clientSelect ? elements.clientSelect.value : '';
    return state.clients.find(client => client.id === clientId) || null;
  }

  function renderClientSummary() {
    const client = selectedClient();
    clearNode(elements.clientSummary);
    if (!client) {
      elements.clientSummary.appendChild(emptyState('Pilih klien dari Data Klien untuk mengisi profil akses.'));
      renderBusinessEntityOptions(null);
      return;
    }
    if (!text(elements.username.value)) elements.username.value = text(client.email) || slugUsername(client.name);
    if (!text(elements.email.value)) elements.email.value = text(client.email);
    if (!text(elements.displayName.value)) elements.displayName.value = text(client.name);

    const wrap = document.createElement('div');
    wrap.className = 'client-picked-grid';
    [
      ['Jenis WP', client.jenisWp],
      ['Nama Klien', client.name],
      ['NIK/NPWP', client.nikNpwp],
      ['Email', client.email],
      ['KPP', client.kpp],
      ['Entitas', businessEntitySummary(client)],
      ['Dokumen', String(Number(client.documentCount || 0)) + ' file']
    ].forEach(function (item) {
      wrap.appendChild(summaryItem(item[0], item[1]));
    });
    elements.clientSummary.appendChild(wrap);
    renderBusinessEntityOptions(client);
  }

  function businessEntitySummary(client) {
    const entities = Array.isArray(client?.businessEntities) ? client.businessEntities : [];
    return entities.length ? entities.map(entity => entity.name || entity.key).join(', ') : 'Semua entitas';
  }

  function renderBusinessEntityOptions(client) {
    if (!elements.businessEntity) return;
    const entities = Array.isArray(client?.businessEntities) ? client.businessEntities : [];
    const current = elements.businessEntity.value;
    clearNode(elements.businessEntity);
    const master = document.createElement('option');
    master.value = '';
    master.textContent = entities.length ? 'Semua entitas / master' : 'Semua entitas';
    elements.businessEntity.appendChild(master);
    entities.forEach(function (entity) {
      const option = document.createElement('option');
      option.value = entity.key || entity.id || entity.name || '';
      option.textContent = entity.name || entity.label || entity.key || '';
      elements.businessEntity.appendChild(option);
    });
    elements.businessEntity.disabled = entities.length === 0;
    elements.businessEntity.value = entities.some(entity => (entity.key || entity.id || entity.name || '') === current) ? current : '';
  }

  function selectedBusinessEntity() {
    const client = selectedClient();
    const key = elements.businessEntity ? elements.businessEntity.value : '';
    return (Array.isArray(client?.businessEntities) ? client.businessEntities : []).find(function (entity) {
      return (entity.key || entity.id || entity.name || '') === key;
    }) || null;
  }

  function summaryItem(label, value) {
    const row = document.createElement('div');
    const labelNode = document.createElement('span');
    labelNode.textContent = label;
    const valueNode = document.createElement('strong');
    valueNode.textContent = text(value, '-');
    row.appendChild(labelNode);
    row.appendChild(valueNode);
    return row;
  }

  function renderAccounts() {
    clearNode(elements.accountList);
    setText(elements.accountCount, state.accounts.length + ' akun');
    if (!state.accounts.length) {
      elements.accountList.appendChild(emptyState('Belum ada akun client portal.'));
      return;
    }
    state.accounts.forEach(function (account) {
      elements.accountList.appendChild(accountCard(account));
    });
  }

  function accountCard(account) {
    const card = document.createElement('article');
    card.className = 'access-account-card';

    const title = document.createElement('div');
    title.className = 'row-title';
    const name = document.createElement('strong');
    name.textContent = text(account.clientName || account.username, 'Akun portal');
    const badge = document.createElement('span');
    badge.className = account.isActive ? 'badge' : 'badge warn';
    badge.textContent = account.isActive ? 'Aktif' : 'Nonaktif';
    title.appendChild(name);
    title.appendChild(badge);

    const meta = document.createElement('p');
    meta.className = 'row-meta';
    meta.textContent = [
      'Username: ' + text(account.username, '-'),
      'Role: ' + text(account.role, 'client'),
      account.businessEntityKey ? 'Entitas: ' + text(account.businessEntityName, account.businessEntityKey) : 'Entitas: Semua/master',
      account.email ? 'Email: ' + account.email : '',
      account.lastLoginAt ? 'Login: ' + account.lastLoginAt.slice(0, 10) : ''
    ].filter(Boolean).join(' | ');

    card.appendChild(title);
    card.appendChild(meta);
    return card;
  }

  if (elements.clientSelect) elements.clientSelect.addEventListener('change', renderClientSummary);
  if (elements.businessEntity) elements.businessEntity.addEventListener('change', function () {
    const entity = selectedBusinessEntity();
    if (entity && !text(elements.displayName.value)) elements.displayName.value = entity.name || entity.key || '';
  });
  if (elements.form) elements.form.addEventListener('submit', saveAccessUser);
  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadAccessUsers);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);

  loadAccessUsers();
})();
