(function () {
  const state = {
    client: null,
    menus: [],
    financialReports: [],
    businessEntities: [],
    entityPerformance: null,
    performanceDashboard: null,
    performanceLoading: false,
    performanceFiltersTouched: false,
    performanceRefreshTimer: null,
    htiMenuGroup: '',
    loading: false
  };

  const elements = {
    alert: document.getElementById('clientMenuAlert'),
    clientMeta: document.getElementById('clientMenuMeta'),
    userName: document.getElementById('clientMenuUserName'),
    userEmail: document.getElementById('clientMenuUserEmail'),
    refreshButton: document.getElementById('clientMenuRefreshBtn'),
    postingAction: document.getElementById('clientMenuPostingAction'),
    settingCoaAction: document.getElementById('clientMenuSettingCoaAction'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    title: document.getElementById('clientMenuTitle'),
    subtitle: document.getElementById('clientMenuSubtitle'),
    jenisWp: document.getElementById('clientMenuJenisWp'),
    nikNpwp: document.getElementById('clientMenuNikNpwp'),
    email: document.getElementById('clientMenuEmail'),
    kpp: document.getElementById('clientMenuKpp'),
    count: document.getElementById('clientMenuCount'),
    list: document.getElementById('clientMenuList'),
    reportCount: document.getElementById('clientReportCount'),
    reportList: document.getElementById('clientReportList'),
    entityPerformance: document.getElementById('clientEntityPerformance'),
    entityPerformanceMeta: document.getElementById('clientEntityPerformanceMeta'),
    entityTotalSales: document.getElementById('clientEntityTotalSales'),
    entityPerformanceList: document.getElementById('clientEntityPerformanceList'),
    homePerformance: document.getElementById('clientHomePerformance'),
    homePerformanceMeta: document.getElementById('clientHomePerformanceMeta'),
    homePerformanceUpdatedAt: document.getElementById('clientHomePerformanceUpdatedAt'),
    homePerformanceYear: document.getElementById('clientHomePerformanceYear'),
    homePerformanceStartMonth: document.getElementById('clientHomePerformanceStartMonth'),
    homePerformanceEndMonth: document.getElementById('clientHomePerformanceEndMonth'),
    homePerformanceCashSource: document.getElementById('clientHomePerformanceCashSource'),
    homeProfitBeforeTax: document.getElementById('clientHomeProfitBeforeTax'),
    homeIncomeTax: document.getElementById('clientHomeIncomeTax'),
    homeProfitAfterTax: document.getElementById('clientHomeProfitAfterTax'),
    homeNetCash: document.getElementById('clientHomeNetCash'),
    homeProfitMeta: document.getElementById('clientHomeProfitMeta'),
    homeCashMeta: document.getElementById('clientHomeCashMeta'),
    homeProfitChart: document.getElementById('clientHomeProfitChart'),
    homeCashChart: document.getElementById('clientHomeCashChart')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));
  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  const wholeCurrency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const percentFormatter = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  const compactCurrency = new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  });
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function menuIconLabel(label) {
    const key = text(label).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (key.includes('KAS KECIL')) return 'KAS';
    if (key.includes('KAS BESAR')) return 'KAS2';
    if (key.includes('DASHBOARD') || key.includes('KINERJA')) return 'KPI';
    if (key.includes('INVOICE')) return 'INV';
    if (key.includes('PO CUSTOMER') || key === 'PO') return 'PO';
    if (key.includes('PROJECT')) return 'PRJ';
    if (key.includes('BIAYA')) return 'BYA';
    if (key.includes('BANK')) return 'BNK';
    if (key.includes('COA') || key.includes('AKUN')) return 'COA';
    if (key.includes('PENJUALAN')) return 'JUAL';
    if (key.includes('PENDAPATAN')) return 'PDPT';
    if (key.includes('PEMBELIAN')) return 'BELI';
    if (key.includes('PERSEDIAAN')) return 'STOK';
    if (key.includes('BUKTI POTONG')) return 'BPT';
    if (key.includes('BENGKEL')) return 'BKL';
    if (key.includes('LAIN')) return 'LAIN';
    if (key.includes('JURNAL')) return 'ADJ';
    if (key === 'BUKU BESAR') return 'BB';
    if (key.includes('NERACA LAJUR')) return 'NL';
    if (key.includes('AKTIVA') || key.includes('PENYUSUTAN')) return 'AKT';
    if (key.includes('TUTUP BUKU')) return 'TB';
    if (key.includes('POSTING')) return 'PST';
    if (key === 'NERACA') return 'NRC';
    if (key.includes('LABA RUGI')) return 'LR';
    if (key.includes('PAJAK')) return 'PJK';
    return 'DOC';
  }

  function slugifyLabel(value) {
    return text(value)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function isHtiClient() {
    const clientName = text(state.client?.name).toUpperCase();
    return clientName === 'PT X' || /PT\s*X/.test(clientName);
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

  function formatAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount === 0) return '0';
    return currency.format(amount);
  }

  function formatDashboardAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || Math.abs(amount) < 0.005) return 'Rp0';
    const prefix = amount < 0 ? 'Rp(' : 'Rp';
    const suffix = amount < 0 ? ')' : '';
    return prefix + wholeCurrency.format(Math.abs(amount)) + suffix;
  }

  function formatCompactAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || Math.abs(amount) < 0.005) return '0';
    const label = compactCurrency.format(Math.abs(amount));
    return amount < 0 ? '(' + label + ')' : label;
  }

  function formatDateTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return 'Baru saja';
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatPercent(value, total) {
    const amount = Number(value || 0);
    const base = Number(total || 0);
    if (!Number.isFinite(amount) || !Number.isFinite(base) || base === 0) return '0%';
    return percentFormatter.format((amount / base) * 100) + '%';
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

  function isPostingMenu(menu) {
    const label = text(menu && menu.label).toLowerCase();
    return label === 'posting periode' ||
      label === 'tutup buku' ||
      label.includes('tutup buku') ||
      (label.includes('posting') && label.includes('periode')) ||
      text(menu && menu.url).includes('/period-posting');
  }

  function isSettingCoaMenu(menu) {
    const label = text(menu && menu.label).toLowerCase();
    return label === 'setting coa' ||
      (label.includes('setting') && label.includes('coa')) ||
      text(menu && menu.url).includes('/setting-coa');
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function isTbbClient() {
    const name = text(state.client && state.client.name).toUpperCase();
    return name.includes('PERUSAHAAN DISTRIBUSI CONTOH') ||
      name.includes('DISTRIBUSI CONTOH') ||
      name.includes('DISTRIBUSI CONTOH');
  }

  function populateHomePerformanceMonths() {
    [elements.homePerformanceStartMonth, elements.homePerformanceEndMonth].forEach(function (select) {
      if (!select || select.options.length) return;
      monthNames.forEach(function (name, index) {
        const option = document.createElement('option');
        option.value = String(index + 1);
        option.textContent = name;
        select.appendChild(option);
      });
    });
  }

  function homePerformanceQueryString() {
    let startMonth = Number(elements.homePerformanceStartMonth?.value || 1);
    let endMonth = Number(elements.homePerformanceEndMonth?.value || startMonth);
    if (startMonth > endMonth) {
      const tmp = startMonth;
      startMonth = endMonth;
      endMonth = tmp;
      if (elements.homePerformanceStartMonth) elements.homePerformanceStartMonth.value = String(startMonth);
      if (elements.homePerformanceEndMonth) elements.homePerformanceEndMonth.value = String(endMonth);
    }
    return new URLSearchParams({
      year: String(Number(elements.homePerformanceYear?.value || new Date().getFullYear())),
      startMonth: String(startMonth),
      endMonth: String(endMonth),
      cashSource: text(elements.homePerformanceCashSource?.value, 'all')
    }).toString();
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat menu klien.');
    return data;
  }

  async function loadClientMenu() {
    if (state.loading) return;
    const clientId = clientIdFromPath();
    if (!clientId) {
      setAlert('Klien tidak valid.', 'error');
      return;
    }

    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson('/app/api/client/clients/' + encodeURIComponent(clientId));
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      state.businessEntities = Array.isArray(data.businessEntities) ? data.businessEntities : [];
      state.menus = Array.isArray(data.menus) ? data.menus : [];
      state.financialReports = Array.isArray(data.financialReports) ? data.financialReports : [];
      renderClient();
      renderPostingAction();
      renderSettingCoaAction();
      renderEntityPerformance(null);
      renderMenus();
      renderFinancialReports();
      renderHomePerformance(null);
      loadEntityPerformance(clientId);
      loadHomePerformance(clientId, false);
      startHomePerformanceRefresh(clientId);
    } catch (err) {
      setAlert(err.message || 'Gagal memuat menu klien.', 'error');
      clearNode(elements.list);
      elements.list.appendChild(emptyState('Menu klien belum bisa dimuat.'));
      clearNode(elements.reportList);
      elements.reportList.appendChild(emptyState('Laporan keuangan belum bisa dimuat.'));
      renderHomePerformance(null);
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
    }
  }

  async function loadEntityPerformance(clientId) {
    if (!state.businessEntities.length) {
      renderEntityPerformance(null);
      return;
    }
    try {
      const data = await requestJson('/app/api/client/clients/' + encodeURIComponent(clientId) + '/entity-performance');
      state.entityPerformance = data || null;
      renderEntityPerformance(data);
    } catch (err) {
      renderEntityPerformance({
        error: err.message || 'Diagram entitas belum bisa dimuat.',
        entities: []
      });
    }
  }

  async function loadHomePerformance(clientId, silent) {
    if (!elements.homePerformance || !isTbbClient()) {
      if (elements.homePerformance) elements.homePerformance.hidden = true;
      stopHomePerformanceRefresh();
      return;
    }
    if (state.performanceLoading) return;
    state.performanceLoading = true;
    try {
      const firstServerDefaultLoad = !state.performanceDashboard && !state.performanceFiltersTouched;
      const query = firstServerDefaultLoad ? '' : '?' + homePerformanceQueryString();
      const data = await requestJson('/app/api/client/clients/' + encodeURIComponent(clientId) + '/dashboard-kinerja' + query);
      state.performanceDashboard = data || null;
      renderHomePerformance(data);
    } catch (err) {
      if (!silent) {
        renderHomePerformance({
          error: err.message || 'Dashboard kinerja belum bisa dimuat.'
        });
      }
    } finally {
      state.performanceLoading = false;
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
    const meta = [text(client.jenisWp), text(client.kpp)].filter(Boolean).join(' | ');
    document.body.classList.toggle('hti-client-menu-page', isHtiClient());
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.title, text(client.name, 'Menu Klien'));
    setText(elements.subtitle, meta || 'Menu client portal');
    setText(elements.jenisWp, text(client.jenisWp, '-'));
    setText(elements.nikNpwp, text(client.nikNpwp, '-'));
    setText(elements.email, text(client.email, '-'));
    setText(elements.kpp, text(client.kpp, '-'));
  }

  function renderMenus() {
    const menus = state.menus.filter(function (menu) {
      return !isPostingMenu(menu) && !isSettingCoaMenu(menu);
    });
    renderMenuGroup({
      list: elements.list,
      count: elements.count,
      menus,
      emptyMessage: 'Menu khusus untuk klien ini belum dikonfigurasi.',
      variant: 'book'
    });
  }

  function renderFinancialReports() {
    renderMenuGroup({
      list: elements.reportList,
      count: elements.reportCount,
      menus: state.financialReports,
      emptyMessage: 'Laporan keuangan untuk klien ini belum dikonfigurasi.',
      variant: 'report'
    });
  }

  function renderHomePerformance(data) {
    if (!elements.homePerformance) return;
    const shouldShow = isTbbClient();
    elements.homePerformance.hidden = !shouldShow;
    if (!shouldShow) return;

    if (!data) {
      setText(elements.homePerformanceMeta, 'Memuat dashboard kinerja...');
      return;
    }
    if (data.error) {
      setText(elements.homePerformanceMeta, data.error);
      return;
    }

    syncHomePerformanceFilters(data);
    renderHomePerformanceCashOptions(data);
    setText(elements.homePerformanceMeta, text(data.periodLabel, 'Tahun berjalan') + ' | ' + text(data.activeCashSourceLabel, 'Gabungan Semua'));
    setText(elements.homePerformanceUpdatedAt, 'Update ' + formatDateTime(data.generatedAt));

    const totals = data.totals || {};
    setText(elements.homeProfitBeforeTax, formatDashboardAmount(totals.profitBeforeTax));
    setText(elements.homeIncomeTax, formatDashboardAmount(totals.incomeTax));
    setText(elements.homeProfitAfterTax, formatDashboardAmount(totals.profitAfterTax));
    setText(elements.homeNetCash, formatDashboardAmount(totals.netCash));
    [elements.homeProfitAfterTax, elements.homeNetCash].forEach(function (element) {
      if (!element) return;
      const value = element === elements.homeProfitAfterTax ? totals.profitAfterTax : totals.netCash;
      element.classList.toggle('is-negative', Number(value || 0) < 0);
    });

    setText(elements.homeProfitMeta, text(data.periodLabel, 'Periode') + ' | Laba vs kurang (lebih) bayar');
    setText(elements.homeCashMeta, text(data.activeCashSourceLabel, 'Gabungan Semua') + ' | ' + text(data.periodLabel, 'Periode'));
    drawHomePerformanceChart(elements.homeProfitChart, data.financialSeries || [], {
      barKeys: [{ key: 'profitBeforeTax', color: '#0f766e' }],
      lineKey: 'incomeTax',
      lineColor: '#c81e1e'
    });
    drawHomePerformanceChart(elements.homeCashChart, data.cashFlow?.series || [], {
      barKeys: [
        { key: 'cashIn', color: '#0f766e' },
        { key: 'cashOut', color: '#f59e0b' }
      ],
      lineKey: 'netCash',
      lineColor: '#1d4ed8'
    });
  }

  function syncHomePerformanceFilters(data) {
    if (state.performanceFiltersTouched) return;
    if (elements.homePerformanceYear) elements.homePerformanceYear.value = String(data.year || new Date().getFullYear());
    if (elements.homePerformanceStartMonth) elements.homePerformanceStartMonth.value = String(data.startMonth || 1);
    if (elements.homePerformanceEndMonth) elements.homePerformanceEndMonth.value = String(data.endMonth || data.startMonth || 1);
  }

  function renderHomePerformanceCashOptions(data) {
    if (!elements.homePerformanceCashSource) return;
    const current = text(data.activeCashSource || elements.homePerformanceCashSource.value, 'all');
    clearNode(elements.homePerformanceCashSource);
    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'Gabungan Semua';
    elements.homePerformanceCashSource.appendChild(all);
    (data.cashSources || []).forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value;
      option.textContent = source.label;
      elements.homePerformanceCashSource.appendChild(option);
    });
    elements.homePerformanceCashSource.value = current;
    if (!elements.homePerformanceCashSource.value) elements.homePerformanceCashSource.value = 'all';
  }

  function drawHomePerformanceChart(canvas, rows, options) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(420, Math.round(rect.width || 640));
    const height = Math.max(260, Math.round(rect.height || 300));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const plot = { left: 62, top: 20, right: width - 18, bottom: height - 42 };
    const values = [0];
    rows.forEach(function (row) {
      (options.barKeys || []).forEach(function (bar) {
        values.push(Number(row[bar.key] || 0));
      });
      values.push(Number(row[options.lineKey] || 0));
    });
    let minValue = Math.min.apply(null, values);
    let maxValue = Math.max.apply(null, values);
    if (minValue === maxValue) {
      maxValue += 1;
      minValue -= 1;
    }
    const padding = Math.max(1, (maxValue - minValue) * 0.14);
    minValue -= padding;
    maxValue += padding;
    const yFor = function (value) {
      return plot.top + ((maxValue - value) / (maxValue - minValue)) * (plot.bottom - plot.top);
    };
    const zeroY = yFor(0);
    drawHomePerformanceGrid(ctx, plot, minValue, maxValue, yFor);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(plot.left, zeroY);
    ctx.lineTo(plot.right, zeroY);
    ctx.stroke();

    if (!rows.length) {
      ctx.fillStyle = '#64748b';
      ctx.font = '700 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Belum ada data untuk periode ini.', width / 2, height / 2);
      return;
    }

    const groupWidth = (plot.right - plot.left) / rows.length;
    const barKeys = options.barKeys || [];
    const barWidth = Math.min(26, Math.max(9, groupWidth / (barKeys.length + 1.8)));
    rows.forEach(function (row, index) {
      const center = plot.left + groupWidth * index + groupWidth / 2;
      barKeys.forEach(function (bar, barIndex) {
        const offset = (barIndex - (barKeys.length - 1) / 2) * (barWidth + 4);
        drawHomePerformanceBar(ctx, center + offset, zeroY, yFor(Number(row[bar.key] || 0)), barWidth, bar.color);
      });
      ctx.fillStyle = '#475569';
      ctx.font = '750 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text(row.shortName, row.monthName), center, height - 20);
    });

    drawHomePerformanceLine(ctx, rows.map(function (row, index) {
      return {
        x: plot.left + groupWidth * index + groupWidth / 2,
        y: yFor(Number(row[options.lineKey] || 0))
      };
    }), options.lineColor || '#c81e1e');
  }

  function drawHomePerformanceGrid(ctx, plot, minValue, maxValue, yFor) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#64748b';
    ctx.font = '700 10px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let index = 0; index <= 4; index += 1) {
      const value = minValue + ((maxValue - minValue) / 4) * index;
      const y = yFor(value);
      ctx.beginPath();
      ctx.moveTo(plot.left, y);
      ctx.lineTo(plot.right, y);
      ctx.stroke();
      ctx.fillText(formatCompactAmount(value), plot.left - 8, y);
    }
  }

  function drawHomePerformanceBar(ctx, centerX, zeroY, valueY, width, color) {
    const top = Math.min(zeroY, valueY);
    const height = Math.max(2, Math.abs(valueY - zeroY));
    ctx.fillStyle = color;
    homePerformanceRoundedRect(ctx, centerX - width / 2, top, width, height, 4);
    ctx.fill();
  }

  function drawHomePerformanceLine(ctx, points, color) {
    if (!points.length) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    points.forEach(function (point, index) {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    points.forEach(function (point) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  function homePerformanceRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function startHomePerformanceRefresh(clientId) {
    stopHomePerformanceRefresh();
    if (!isTbbClient()) return;
    state.performanceRefreshTimer = window.setInterval(function () {
      loadHomePerformance(clientId, true);
    }, 15000);
  }

  function stopHomePerformanceRefresh() {
    if (!state.performanceRefreshTimer) return;
    window.clearInterval(state.performanceRefreshTimer);
    state.performanceRefreshTimer = null;
  }

  function renderPostingAction() {
    if (!elements.postingAction) return;
    const postingMenu = state.menus.find(isPostingMenu);
    const url = text(postingMenu && postingMenu.url);
    if (!postingMenu || !url || postingMenu.enabled === false) {
      elements.postingAction.hidden = true;
      elements.postingAction.removeAttribute('href');
      return;
    }
    elements.postingAction.hidden = false;
    elements.postingAction.href = url;
  }

  function renderSettingCoaAction() {
    if (!elements.settingCoaAction) return;
    const settingMenu = state.menus.find(isSettingCoaMenu);
    const fallbackUrl = '/app/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/setting-coa';
    const url = text(settingMenu && settingMenu.url, fallbackUrl);
    if (settingMenu && settingMenu.enabled === false) {
      elements.settingCoaAction.hidden = true;
      elements.settingCoaAction.removeAttribute('href');
      return;
    }
    elements.settingCoaAction.hidden = false;
    elements.settingCoaAction.href = url;
  }

  function renderEntityPerformance(data) {
    if (!elements.entityPerformance || !elements.entityPerformanceList) return;
    const hasEntities = state.businessEntities.length > 0 || (Array.isArray(data?.entities) && data.entities.length > 0);
    elements.entityPerformance.hidden = !hasEntities;
    if (!hasEntities) return;

    const rows = Array.isArray(data?.entities) ? data.entities : [];
    const year = Number(data?.year) || new Date().getFullYear();
    const totalSales = Number(data?.totals?.penjualan || 0);
    const maxSales = Math.max(0, Number(data?.maxPenjualan || 0), ...rows.map(function (row) {
      return Number(row.penjualan || 0);
    }));
    setText(elements.entityPerformanceMeta, 'Tahun berjalan ' + year + ' | realtime');
    setText(elements.entityTotalSales, formatAmount(totalSales));
    clearNode(elements.entityPerformanceList);

    if (!data) {
      elements.entityPerformanceList.appendChild(emptyState('Memuat diagram entitas...'));
      return;
    }
    if (data?.error) {
      elements.entityPerformanceList.appendChild(emptyState(data.error));
      return;
    }
    if (!rows.length) {
      elements.entityPerformanceList.appendChild(emptyState('Belum ada entitas untuk diagram tahun berjalan.'));
      return;
    }

    rows.forEach(function (row) {
      elements.entityPerformanceList.appendChild(entityPerformanceCard(row, maxSales, totalSales));
    });
  }

  function entityPerformanceCard(row, maxSales, totalSales) {
    const card = document.createElement('article');
    card.className = 'client-performance-card';
    const labaRugi = Number(row.labaRugi || 0);
    if (labaRugi < 0) card.classList.add('is-loss');

    const header = document.createElement('header');
    header.className = 'client-performance-card-header';
    const badge = document.createElement('span');
    badge.className = 'client-performance-code';
    badge.textContent = text(row.code, text(row.name, 'E').slice(0, 2));
    const title = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = text(row.name, 'Entitas');
    const status = document.createElement('span');
    status.textContent = labaRugi > 0 ? 'Laba tahun berjalan' : labaRugi < 0 ? 'Rugi tahun berjalan' : 'Impas tahun berjalan';
    title.appendChild(name);
    title.appendChild(status);
    header.appendChild(badge);
    header.appendChild(title);
    card.appendChild(header);

    const metrics = document.createElement('div');
    metrics.className = 'client-performance-bars';
    [
      { key: 'penjualan', label: 'Penjualan', value: row.penjualan, count: row.counts?.penjualan },
      { key: 'pembelian', label: 'Pembelian', value: row.pembelian, count: row.counts?.pembelian },
      { key: 'biaya', label: 'Biaya', value: row.biaya, count: row.counts?.biaya },
      { key: 'labaRugi', label: 'Laba/Rugi', value: row.labaRugi, count: null }
    ].forEach(function (metric) {
      metrics.appendChild(entityPerformanceBar(metric, maxSales, totalSales));
    });
    card.appendChild(metrics);
    return card;
  }

  function entityPerformanceBar(metric, maxSales, totalSales) {
    const amount = Number(metric.value || 0);
    const row = document.createElement('div');
    row.className = 'client-performance-bar-row';
    if (metric.key === 'labaRugi') row.classList.add(amount < 0 ? 'is-loss' : 'is-profit');

    const label = document.createElement('div');
    label.className = 'client-performance-bar-label';
    const name = document.createElement('span');
    name.textContent = metric.label;
    const valueWrap = document.createElement('div');
    valueWrap.className = 'client-performance-value';
    const value = document.createElement('strong');
    value.textContent = formatAmount(amount);
    const percent = document.createElement('em');
    percent.textContent = formatPercent(amount, totalSales);
    valueWrap.appendChild(value);
    valueWrap.appendChild(percent);
    label.appendChild(name);
    label.appendChild(valueWrap);

    const track = document.createElement('div');
    track.className = 'client-performance-bar-track';
    const fill = document.createElement('span');
    const ratio = maxSales > 0 ? Math.min(100, Math.round((Math.abs(amount) / maxSales) * 100)) : 0;
    fill.style.width = ratio + '%';
    track.appendChild(fill);

    const foot = document.createElement('small');
    foot.textContent = metric.count == null ? 'Patokan total penjualan' : String(Number(metric.count || 0)) + ' data';

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(foot);
    return row;
  }

  function renderMenuGroup({ list, count, menus, emptyMessage, variant }) {
    clearNode(list);
    setText(count, menus.length + ' menu');

    if (!menus.length) {
      list.appendChild(emptyState(emptyMessage));
      return;
    }

    if (variant === 'book' && isHtiClient()) {
      renderHtiAccurateMenu(list, count, menus);
      return;
    }

    menus.forEach(function (menu) {
      list.appendChild(menuCard(menu, variant));
    });
  }

  function htiMenuBySlug(menus, slug) {
    return menus.find(function (menu) {
      return slugifyLabel(menu.label) === slug;
    }) || null;
  }

  function htiMenuUrl(menus, slug) {
    return text(htiMenuBySlug(menus, slug)?.url);
  }

  function htiMenuUrlWithQuery(url, params) {
    const cleanUrl = text(url);
    if (!cleanUrl) return '';
    const query = new URLSearchParams();
    Object.keys(params || {}).forEach(function (key) {
      if (params[key] != null && text(params[key])) query.set(key, text(params[key]));
    });
    const queryText = query.toString();
    if (!queryText) return cleanUrl;
    return cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + queryText;
  }

  function htiMenuUrlWithMode(url, mode) {
    return htiMenuUrlWithQuery(url, { mode });
  }

  function htiNavigate(menu) {
    const url = text(menu?.url);
    if (!url) {
      setAlert(text(menu?.label, 'Menu') + ' belum dikonfigurasi.', 'info');
      return;
    }
    window.location.assign(resolvePageUrl(url));
  }

  function resolvePageUrl(url) {
    if (typeof window.ptxResolvePageUrl === 'function') {
      return window.ptxResolvePageUrl(url);
    }
    return url;
  }

  function renderHtiAccurateMenu(list, count, menus) {
    clearNode(list);
    const clientId = text(state.client?.id);
    const salesUrl = htiMenuUrl(menus, 'buku-penjualan');
    const bankUrl = htiMenuUrl(menus, 'buku-bank');
    const cashUrl = htiMenuUrl(menus, 'buku-kas-kecil') || htiMenuUrl(menus, 'buku-kas');
    const assetUrl = htiMenuUrl(menus, 'buku-aktiva');
    const expenseUrl = htiMenuUrl(menus, 'biaya');
    const direct = function (slug, fallbackLabel) {
      const menu = htiMenuBySlug(menus, slug);
      return {
        key: slug,
        label: text(menu?.label, fallbackLabel),
        menu
      };
    };
    const groups = [
      {
        key: 'buku-penjualan',
        label: text(htiMenuBySlug(menus, 'buku-penjualan')?.label, 'Buku Penjualan'),
        children: [
          { label: 'Daftar Penjualan', description: 'Lihat faktur dan Pre Order', url: htiMenuUrlWithMode(salesUrl, 'daftar-penjualan') },
          { label: 'Input Faktur Penjualan', description: 'Faktur final dan piutang', url: htiMenuUrlWithMode(salesUrl, 'faktur-penjualan') },
          { label: 'Input Pre Order', description: 'Penawaran/DP sebelum faktur final', url: htiMenuUrlWithMode(salesUrl, 'proforma') },
          { label: 'Input Uang Muka', description: 'Uang muka penjualan', url: htiMenuUrlWithQuery(bankUrl, { openAdvance: '1', advanceType: 'sales', entryDoor: 'hti-buku-penjualan' }) }
        ]
      },
      {
        key: 'pembelian',
        label: 'Pembelian',
        children: [
          { label: 'Pembelian FP', description: 'Faktur pajak dan PPN', url: htiMenuUrl(menus, 'buku-pembelian-fp') },
          { label: 'Pembelian Non PPN', description: 'Pembelian tanpa PPN', url: htiMenuUrl(menus, 'buku-pembelian-non-ppn') },
          { label: 'Input Uang Muka', description: 'Uang muka pembelian', url: htiMenuUrlWithQuery(bankUrl, { openAdvance: '1', advanceType: 'purchase', entryDoor: 'hti-buku-pembelian-fp' }) }
        ]
      },
      {
        key: 'buku-bank',
        label: 'Buku Bank dan Kas Kecil',
        children: [
          { label: 'Tarik Tunai', description: 'Bank ke Kas Kecil', url: bankUrl ? bankUrl + '?mode=tarik-tunai' : '' },
          { label: 'Transfer Antar Bank', description: 'Pindah saldo antar bank', url: bankUrl ? bankUrl + '?mode=transfer-antar-bank' : '' },
          { label: 'Bunga & Biaya Bank', description: 'Jasa giro, admin, dan pajak bank', url: bankUrl ? bankUrl + '?mode=bunga-biaya-bank' : '' },
          { label: 'Cek Mutasi Bank', description: 'Mutasi bank hanya lihat', url: bankUrl ? bankUrl + '?mode=cek-mutasi' : '' },
          { label: 'Cek Mutasi Kas Kecil', description: 'Mutasi kas kecil hanya lihat', url: cashUrl ? cashUrl + '?mode=cek-mutasi' : '' }
        ]
      },
      {
        key: 'buku-aktiva',
        label: text(htiMenuBySlug(menus, 'buku-aktiva')?.label, 'Buku Aktiva'),
        children: [
          { label: 'Saldo Awal', description: 'Aktiva lama tanpa mutasi bank/kas', url: htiMenuUrlWithMode(assetUrl, 'saldo-awal') },
          { label: 'Beli Aktiva Baru', description: 'Tambah aktiva dan sumber pembayaran', url: htiMenuUrlWithMode(assetUrl, 'beli-aktiva') },
          { label: 'Jual Aktiva', description: 'Tutup aktiva dan hitung laba/rugi', url: htiMenuUrlWithMode(assetUrl, 'jual-aktiva') },
          { label: 'Daftar Aktiva', description: 'Lihat aktiva aktif dan dokumen', url: htiMenuUrlWithMode(assetUrl, 'daftar-aktiva') }
        ]
      },
      direct('jurnal-umum', 'Jurnal Umum'),
      {
        key: 'biaya',
        label: text(htiMenuBySlug(menus, 'biaya')?.label, 'Biaya'),
        children: [
          { label: 'Biaya Rutin', description: 'Operasional umum non-HPP', url: htiMenuUrlWithMode(expenseUrl, 'rutin') },
          { label: 'Biaya Proyek', description: 'Biaya yang bisa dikaitkan ke proyek', url: htiMenuUrlWithMode(expenseUrl, 'proyek') }
        ]
      },
      direct('buku-kontrol', 'Buku Kontrol')
    ].filter(function (item) {
      return item.children || item.menu || item.key === 'biaya';
    });
    setText(count, groups.length + ' menu');
    if (!groups.some(function (item) { return item.key === state.htiMenuGroup && item.children; })) {
      state.htiMenuGroup = '';
    }

    const shell = document.createElement('div');
    shell.className = 'hti-accurate-menu';
    const rail = document.createElement('div');
    rail.className = 'hti-accurate-menu-list';
    const detail = document.createElement('div');
    detail.className = 'hti-accurate-menu-detail';

    groups.forEach(function (item, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hti-accurate-menu-item';
      button.classList.toggle('is-active', item.key === state.htiMenuGroup && Boolean(item.children));
      button.textContent = text(item.label, 'Menu');
      button.addEventListener('click', function () {
        if (item.children) {
          state.htiMenuGroup = item.key;
          renderHtiAccurateMenu(list, count, menus);
          return;
        }
        htiNavigate(item.menu || { label: item.label, url: '' });
      });
      button.setAttribute('aria-label', 'Buka ' + text(item.label, 'menu'));
      rail.appendChild(button);
      if (index === 0 && clientId) button.dataset.clientId = clientId;
    });

    const selected = groups.find(function (item) {
      return item.key === state.htiMenuGroup && item.children;
    }) || null;
    if (selected) {
      const heading = document.createElement('div');
      heading.className = 'hti-accurate-detail-heading';
      const title = document.createElement('strong');
      title.textContent = selected.label;
      const meta = document.createElement('span');
      meta.textContent = selected.key === 'buku-bank'
        ? 'Pilih workflow resmi. Input manual bank dan kas kecil dikunci.'
        : 'Pilih jenis buku yang akan dibuka.';
      heading.appendChild(title);
      heading.appendChild(meta);
      detail.appendChild(heading);

      const actions = document.createElement('div');
      actions.className = 'hti-accurate-detail-actions';
      selected.children.forEach(function (child) {
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'hti-accurate-detail-action';
        action.innerHTML = '<strong>' + text(child.label, 'Menu') + '</strong><span>' + text(child.description) + '</span>';
        action.addEventListener('click', function () {
          if (text(child.url)) window.location.assign(resolvePageUrl(child.url));
          else setAlert(text(child.label, 'Menu') + ' belum dikonfigurasi.', 'info');
        });
        actions.appendChild(action);
      });
      detail.appendChild(actions);
    } else {
      detail.appendChild(emptyState('Pilih menu di sebelah kiri.'));
    }

    shell.appendChild(rail);
    shell.appendChild(detail);
    list.appendChild(shell);
  }

  function menuCard(menu, variant) {
    const menuUrl = text(menu.url);
    const hasUrl = Boolean(menuUrl);
    const enabled = menu.enabled !== false;
    const card = document.createElement(enabled && hasUrl ? 'a' : 'button');
    card.className = 'client-menu-card';
    if (variant === 'report') card.classList.add('client-menu-card-report');
    if (enabled && hasUrl) {
      card.href = resolvePageUrl(menuUrl);
    } else {
      card.type = 'button';
      if (!enabled) {
        card.disabled = true;
        card.setAttribute('aria-disabled', 'true');
      }
    }

    const icon = document.createElement('span');
    icon.className = 'client-menu-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = menuIconLabel(menu.label);

    const body = document.createElement('span');
    body.className = 'client-menu-body';

    const order = document.createElement('span');
    order.className = 'client-menu-order';
    order.textContent = String(menu.order || '');
    body.appendChild(order);

    const label = document.createElement('strong');
    label.textContent = text(menu.label, 'Menu');
    body.appendChild(label);

    if (text(menu.status)) {
      const status = document.createElement('span');
      status.textContent = text(menu.status);
      body.appendChild(status);
    }

    card.appendChild(icon);
    card.appendChild(body);
    if (enabled && !hasUrl) {
      card.addEventListener('click', function () {
        setAlert(text(menu.label, 'Menu') + ' belum dikonfigurasi untuk ' + text(state.client?.name, 'klien') + '.', 'info');
      });
    }
    return card;
  }

  if (elements.refreshButton) {
    elements.refreshButton.addEventListener('click', loadClientMenu);
  }

  if (elements.logoutButton) {
    elements.logoutButton.addEventListener('click', logout);
  }

  [
    elements.homePerformanceYear,
    elements.homePerformanceStartMonth,
    elements.homePerformanceEndMonth,
    elements.homePerformanceCashSource
  ].forEach(function (element) {
    if (!element) return;
    element.addEventListener('change', function () {
      state.performanceFiltersTouched = true;
      loadHomePerformance(clientIdFromPath(), false);
    });
  });

  window.addEventListener('resize', function () {
    if (state.performanceDashboard && isTbbClient()) {
      renderHomePerformance(state.performanceDashboard);
    }
  });

  populateHomePerformanceMonths();
  loadClientMenu();
})();
