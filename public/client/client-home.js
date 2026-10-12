(function () {
  const state = {
    clients: [],
    loading: false,
    query: ''
  };

  const elements = {
    alert: document.getElementById('homeAlert'),
    clientMeta: document.getElementById('homeClientMeta'),
    userName: document.getElementById('homeUserName'),
    userEmail: document.getElementById('homeUserEmail'),
    refreshButton: document.getElementById('homeRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    searchInput: document.getElementById('clientSearchInput'),
    count: document.getElementById('clientDirectoryCount'),
    list: document.getElementById('clientDirectoryList')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function homeClientMeta(user, client) {
    if (user && user.isAdmin) return 'Akses semua klien';
    if (user && user.isEntityScoped) return text(user.businessEntityName, text(client.name, 'PT X'));
    return text(client && client.name, 'PT X');
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

  function initials(name) {
    const parts = text(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2);
    return (parts.map(part => part.charAt(0)).join('') || 'K').toUpperCase();
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat daftar klien.');
    return data;
  }

  async function loadHome() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson('/app/api/client/home');
      if (!data) return;
      renderShell(data);
      state.clients = Array.isArray(data.clients) ? data.clients : [];
      renderDirectory();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat daftar klien.', 'error');
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
    const client = data.client || {};
    setText(elements.clientMeta, homeClientMeta(user, client));
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
  }

  function renderDirectory() {
    const query = state.query.toLowerCase();
    const visible = state.clients.filter(function (client) {
      return !query || [
        client.name,
        client.jenisWp,
        client.nikNpwp,
        client.alamat,
        client.email,
        client.kpp
      ].map(text).join(' ').toLowerCase().includes(query);
    });

    setText(elements.count, visible.length + ' dari ' + state.clients.length + ' klien');
    clearNode(elements.list);
    if (!visible.length) {
      elements.list.appendChild(emptyState(state.clients.length ? 'Tidak ada nama klien yang cocok dengan pencarian.' : 'Belum ada nama klien di database utama.'));
      return;
    }

    visible.forEach(function (client) {
      elements.list.appendChild(clientCard(client));
    });
  }

  function clientCard(client) {
    const card = document.createElement('a');
    card.className = 'client-directory-card';
    card.href = '/app/client/clients/' + encodeURIComponent(text(client.id || client.key));
    card.setAttribute('aria-label', 'Buka menu ' + text(client.name, 'klien'));

    const avatar = document.createElement('div');
    avatar.className = 'client-directory-avatar';
    avatar.textContent = initials(client.name);

    const body = document.createElement('div');
    body.className = 'client-directory-body';

    const name = document.createElement('strong');
    name.textContent = text(client.name, 'Nama klien');
    body.appendChild(name);

    const meta = document.createElement('span');
    meta.textContent = [text(client.jenisWp), text(client.kpp)].filter(Boolean).join(' | ') || 'Klien';
    body.appendChild(meta);

    const details = document.createElement('dl');
    details.className = 'client-directory-details';
    [
      ['NIK/NPWP', client.nikNpwp],
      ['Email', client.email],
      ['Dokumen', String(Number(client.documentCount || 0)) + ' file'],
      ['Alamat', client.alamat]
    ].forEach(function (item) {
      details.appendChild(detailItem(item[0], item[1]));
    });
    body.appendChild(details);

    const action = document.createElement('span');
    action.className = 'client-directory-action';
    action.textContent = 'Buka menu';
    body.appendChild(action);

    card.appendChild(avatar);
    card.appendChild(body);
    return card;
  }

  function detailItem(label, value) {
    const wrap = document.createElement('div');
    const term = document.createElement('dt');
    term.textContent = label;
    const description = document.createElement('dd');
    description.textContent = text(value, '-');
    wrap.appendChild(term);
    wrap.appendChild(description);
    return wrap;
  }

  if (elements.refreshButton) {
    elements.refreshButton.addEventListener('click', loadHome);
  }

  if (elements.logoutButton) {
    elements.logoutButton.addEventListener('click', logout);
  }

  if (elements.searchInput) {
    elements.searchInput.addEventListener('input', function () {
      state.query = elements.searchInput.value || '';
      renderDirectory();
    });
  }

  loadHome();
})();
