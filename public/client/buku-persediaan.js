(function () {
  const state = {
    client: null,
    entries: [],
    showAvailableOnly: false,
    loading: false,
    syncingScroll: false
  };

  const elements = {
    alert: document.getElementById('inventoryAlert'),
    clientMeta: document.getElementById('inventoryClientMeta'),
    userName: document.getElementById('inventoryUserName'),
    userEmail: document.getElementById('inventoryUserEmail'),
    refreshButton: document.getElementById('inventoryRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('inventoryBackLink'),
    subtitle: document.getElementById('inventorySubtitle'),
    total: document.getElementById('inventoryTotal'),
    available: document.getElementById('inventoryAvailable'),
    sold: document.getElementById('inventorySold'),
    dpp: document.getElementById('inventoryDpp'),
    totalMasukHeader: document.getElementById('inventoryTotalMasuk'),
    totalKeluarHeader: document.getElementById('inventoryTotalKeluar'),
    totalSisaHeader: document.getElementById('inventoryTotalSisa'),
    totalDppHeader: document.getElementById('inventoryTotalDppHeader'),
    availableFilterButton: document.getElementById('inventoryAvailableFilterBtn'),
    rows: document.getElementById('inventoryRows'),
    tableWrap: document.querySelector('.cashbook-table-wrap'),
    scrollProxy: document.getElementById('inventoryScrollProxy'),
    scrollProxyInner: document.getElementById('inventoryScrollProxyInner')
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

  function formatDisplayDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '-' + match[2] + '-' + match[1] : raw;
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
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/buku-persediaan/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/buku-persediaan';
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Buku Persediaan.');
    return data;
  }

  async function loadInventory() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      renderClient();
      renderRows();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Buku Persediaan.', 'error');
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
    const available = state.entries.filter(function (entry) {
      return entry.status === 'Tersedia';
    });
    const sold = state.entries.filter(function (entry) {
      return entry.status === 'Terjual';
    });
    const dppAvailable = available.reduce(function (total, entry) {
      return total + Number(entry.dpp || 0);
    }, 0);
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.subtitle, text(client.name, 'Klien') + ' | Persediaan unit kendaraan');
    setText(elements.total, formatAmount(state.entries.length));
    setText(elements.available, formatAmount(available.length));
    setText(elements.sold, formatAmount(sold.length));
    setText(elements.dpp, formatAmount(dppAvailable));
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function renderRows() {
    clearNode(elements.rows);
    const rows = visibleEntries();
    rows.forEach(function (entry) {
      elements.rows.appendChild(entryRow(entry));
    });
    const blankCount = Math.max(10 - rows.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
    renderHeaderTotals();
    renderFilterButton();
    syncInventoryScrollbar();
  }

  function visibleEntries() {
    if (!state.showAvailableOnly) return state.entries;
    return state.entries.filter(function (entry) {
      return entry.status === 'Tersedia';
    });
  }

  function entryRow(entry) {
    const row = document.createElement('tr');
    row.appendChild(businessEntityCell(entry));
    row.appendChild(cell(formatDisplayDate(entry.tanggal)));
    row.appendChild(cell(entry.sumber));
    row.appendChild(cell(entry.noInvoice));
    row.appendChild(cell(entry.namaBarang));
    row.appendChild(cell(entry.warna));
    row.appendChild(cell(entry.noRangka));
    row.appendChild(cell(entry.noMesin));
    row.appendChild(cell(formatAmount(entry.jumlahMasuk), 'number'));
    row.appendChild(cell(formatAmount(entry.jumlahKeluar), 'number'));
    row.appendChild(cell(formatAmount(entry.sisa), 'number'));
    row.appendChild(cell(formatAmount(entry.dpp), 'number'));
    row.appendChild(statusCell(entry.status));
    row.appendChild(cell(entry.noInvoicePenjualan || entry.noKwitansiPenjualan));
    return row;
  }

  function blankRow() {
    const row = document.createElement('tr');
    for (let index = 0; index < 14; index += 1) {
      row.appendChild(cell(''));
    }
    return row;
  }

  function businessEntityCell(entry) {
    return cellWithTitle(entry?.businessEntityName || entry?.businessEntityKey || '', 'client-entity-column');
  }

  function cell(value, variant) {
    const td = document.createElement('td');
    if (variant) td.className = variant;
    td.textContent = text(value);
    return td;
  }

  function cellWithTitle(value, variant) {
    const td = cell(value, variant);
    td.title = text(value);
    return td;
  }

  function statusCell(status) {
    const td = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'sales-status-badge ' + (status === 'Terjual' ? 'settled' : 'complete');
    badge.textContent = status || '';
    td.appendChild(badge);
    return td;
  }

  function formatAmount(value) {
    const amount = Number(value || 0);
    return amount ? currency.format(amount) : '0';
  }

  function sumField(field) {
    return visibleEntries().reduce(function (total, entry) {
      return total + Number(entry[field] || 0);
    }, 0);
  }

  function renderHeaderTotals() {
    setText(elements.totalMasukHeader, formatAmount(sumField('jumlahMasuk')));
    setText(elements.totalKeluarHeader, formatAmount(sumField('jumlahKeluar')));
    setText(elements.totalSisaHeader, formatAmount(sumField('sisa')));
    setText(elements.totalDppHeader, formatAmount(sumField('dpp')));
  }

  function renderFilterButton() {
    if (!elements.availableFilterButton) return;
    elements.availableFilterButton.setAttribute('aria-pressed', state.showAvailableOnly ? 'true' : 'false');
    elements.availableFilterButton.classList.toggle('active', state.showAvailableOnly);
    elements.availableFilterButton.textContent = state.showAvailableOnly ? 'Tampilkan Semua Stock' : 'Stock Tersedia';
  }

  function toggleAvailableFilter() {
    state.showAvailableOnly = !state.showAvailableOnly;
    renderRows();
  }

  function tableScrollWidth() {
    if (!elements.tableWrap) return 0;
    const table = elements.tableWrap.querySelector('table');
    return table ? table.scrollWidth : elements.tableWrap.scrollWidth;
  }

  function syncInventoryScrollbar() {
    if (!elements.tableWrap || !elements.scrollProxy || !elements.scrollProxyInner) return;
    window.requestAnimationFrame(function () {
      elements.scrollProxyInner.style.width = Math.max(tableScrollWidth(), elements.tableWrap.clientWidth) + 'px';
      elements.scrollProxy.scrollLeft = elements.tableWrap.scrollLeft;
    });
  }

  function bindInventoryScrollbars() {
    if (!elements.tableWrap || !elements.scrollProxy) return;
    elements.tableWrap.addEventListener('scroll', function () {
      if (state.syncingScroll) return;
      state.syncingScroll = true;
      elements.scrollProxy.scrollLeft = elements.tableWrap.scrollLeft;
      state.syncingScroll = false;
    });
    elements.scrollProxy.addEventListener('scroll', function () {
      if (state.syncingScroll) return;
      state.syncingScroll = true;
      elements.tableWrap.scrollLeft = elements.scrollProxy.scrollLeft;
      state.syncingScroll = false;
    });
    window.addEventListener('resize', syncInventoryScrollbar);
  }

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadInventory);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.availableFilterButton) elements.availableFilterButton.addEventListener('click', toggleAvailableFilter);

  bindInventoryScrollbars();
  loadInventory();
})();
