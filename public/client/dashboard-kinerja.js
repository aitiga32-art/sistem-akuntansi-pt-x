(function () {
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

  const state = {
    data: null,
    loading: false,
    filtersTouched: false,
    refreshTimer: null
  };

  const elements = {
    alert: document.getElementById('performanceAlert'),
    clientMeta: document.getElementById('performanceClientMeta'),
    userName: document.getElementById('performanceUserName'),
    userEmail: document.getElementById('performanceUserEmail'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    refreshButton: document.getElementById('performanceRefreshBtn'),
    subtitle: document.getElementById('performanceSubtitle'),
    backLink: document.getElementById('performanceBackLink'),
    yearInput: document.getElementById('performanceYearInput'),
    startMonth: document.getElementById('performanceStartMonthSelect'),
    endMonth: document.getElementById('performanceEndMonthSelect'),
    cashSource: document.getElementById('performanceCashSourceSelect'),
    updatedAt: document.getElementById('performanceUpdatedAt'),
    profitBeforeTax: document.getElementById('performanceProfitBeforeTax'),
    incomeTax: document.getElementById('performanceIncomeTax'),
    profitAfterTax: document.getElementById('performanceProfitAfterTax'),
    netCash: document.getElementById('performanceNetCash'),
    profitMeta: document.getElementById('performanceProfitMeta'),
    cashMeta: document.getElementById('performanceCashMeta'),
    taxLink: document.getElementById('performanceTaxLink'),
    cashLink: document.getElementById('performanceCashLink'),
    profitChart: document.getElementById('performanceProfitChart'),
    cashChart: document.getElementById('performanceCashChart'),
    breakdownMeta: document.getElementById('performanceBreakdownMeta'),
    breakdownRows: document.getElementById('performanceBreakdownRows')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  const compactCurrency = new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1
  });

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
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

  function formatAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || Math.abs(amount) < 0.005) return 'Rp0';
    const prefix = amount < 0 ? 'Rp(' : 'Rp';
    const suffix = amount < 0 ? ')' : '';
    return prefix + currency.format(Math.abs(amount)) + suffix;
  }

  function formatCompact(value) {
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

  function populateMonths() {
    [elements.startMonth, elements.endMonth].forEach(function (select) {
      if (!select || select.options.length) return;
      monthNames.forEach(function (name, index) {
        const option = document.createElement('option');
        option.value = String(index + 1);
        option.textContent = name;
        select.appendChild(option);
      });
    });
  }

  function defaultPeriod() {
    if (elements.startMonth && !elements.startMonth.value) elements.startMonth.value = '1';
  }

  function queryParams() {
    let startMonth = Number(elements.startMonth?.value || 1);
    let endMonth = Number(elements.endMonth?.value || startMonth);
    if (startMonth > endMonth) {
      const tmp = startMonth;
      startMonth = endMonth;
      endMonth = tmp;
      if (elements.startMonth) elements.startMonth.value = String(startMonth);
      if (elements.endMonth) elements.endMonth.value = String(endMonth);
    }
    return new URLSearchParams({
      year: String(Number(elements.yearInput?.value || new Date().getFullYear())),
      startMonth: String(startMonth),
      endMonth: String(endMonth),
      cashSource: text(elements.cashSource?.value, 'all')
    });
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Dashboard kinerja belum bisa dimuat.');
    return data;
  }

  async function loadDashboard(silent) {
    if (state.loading) return;
    const clientId = clientIdFromPath();
    if (!clientId) {
      setAlert('Klien tidak valid.', 'error');
      return;
    }

    state.loading = true;
    if (!silent) setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const firstServerDefaultLoad = !state.data && !state.filtersTouched;
      const query = firstServerDefaultLoad ? '' : '?' + queryParams().toString();
      const data = await requestJson('/app/api/client/clients/' + encodeURIComponent(clientId) + '/dashboard-kinerja' + query);
      if (!data) return;
      state.data = data;
      renderDashboard(data);
    } catch (err) {
      if (!silent) setAlert(err.message || 'Dashboard kinerja belum bisa dimuat.', 'error');
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

  function renderDashboard(data) {
    const client = data.client || {};
    const user = data.user || {};
    const clientId = clientIdFromPath();
    setText(elements.clientMeta, text(client.name, 'Client Portal'));
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
    if (elements.backLink) elements.backLink.href = '/app/client/clients/' + encodeURIComponent(clientId);
    setText(elements.subtitle, text(client.name, 'Klien') + ' | ' + text(data.periodLabel, 'Periode berjalan'));
    setText(elements.updatedAt, 'Update ' + formatDateTime(data.generatedAt));
    syncFiltersFromData(data);
    renderCashSourceOptions(data);
    renderKpis(data);
    renderLinks(data);
    renderCharts(data);
    renderBreakdown(data);
  }

  function syncFiltersFromData(data) {
    if (state.filtersTouched) return;
    if (elements.yearInput) elements.yearInput.value = String(data.year || new Date().getFullYear());
    if (elements.startMonth) elements.startMonth.value = String(data.startMonth || 1);
    if (elements.endMonth) elements.endMonth.value = String(data.endMonth || data.startMonth || 1);
  }

  function renderCashSourceOptions(data) {
    if (!elements.cashSource) return;
    const current = text(data.activeCashSource || elements.cashSource.value, 'all');
    clearNode(elements.cashSource);
    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'Gabungan Semua';
    elements.cashSource.appendChild(all);
    (data.cashSources || []).forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value;
      option.textContent = source.label;
      elements.cashSource.appendChild(option);
    });
    elements.cashSource.value = current;
    if (!elements.cashSource.value) elements.cashSource.value = 'all';
  }

  function renderKpis(data) {
    const totals = data.totals || {};
    setText(elements.profitBeforeTax, formatAmount(totals.profitBeforeTax));
    setText(elements.incomeTax, formatAmount(totals.incomeTax));
    setText(elements.profitAfterTax, formatAmount(totals.profitAfterTax));
    setText(elements.netCash, formatAmount(totals.netCash));
    if (elements.profitAfterTax) {
      elements.profitAfterTax.classList.toggle('is-negative', Number(totals.profitAfterTax || 0) < 0);
    }
    if (elements.netCash) {
      elements.netCash.classList.toggle('is-negative', Number(totals.netCash || 0) < 0);
    }
  }

  function renderLinks(data) {
    const clientId = clientIdFromPath();
    const monthValues = (data.months || []).map(function (row) {
      return row.month;
    }).join(',');
    if (elements.taxLink) {
      elements.taxLink.href = '/app/client/clients/' + encodeURIComponent(clientId) + '/perhitungan-pajak?year=' + encodeURIComponent(data.year) + '&months=' + encodeURIComponent(monthValues);
    }
    if (elements.cashLink) {
      const source = (data.cashSources || []).find(function (item) {
        return item.value === data.activeCashSource;
      });
      if (!source) {
        elements.cashLink.href = '/app/client/clients/' + encodeURIComponent(clientId);
        elements.cashLink.textContent = 'Menu Klien';
      } else if (source.type === 'bank') {
        elements.cashLink.href = '/app/client/clients/' + encodeURIComponent(clientId) + '/buku-bank?bank=' + encodeURIComponent(source.key);
        elements.cashLink.textContent = 'Buka Buku';
      } else {
        elements.cashLink.href = '/app/client/clients/' + encodeURIComponent(clientId) + '/buku-kas?cash=' + encodeURIComponent(source.key);
        elements.cashLink.textContent = 'Buka Buku';
      }
    }
  }

  function renderCharts(data) {
    setText(elements.profitMeta, text(data.periodLabel, 'Periode') + ' | Laba vs kurang (lebih) bayar');
    setText(elements.cashMeta, text(data.activeCashSourceLabel, 'Gabungan Semua') + ' | ' + text(data.periodLabel, 'Periode'));
    drawComboChart(elements.profitChart, data.financialSeries || [], {
      barKeys: [{ key: 'profitBeforeTax', label: 'Laba', color: '#0f766e' }],
      lineKey: 'incomeTax',
      lineLabel: 'Kurang (lebih) bayar',
      lineColor: '#c81e1e'
    });
    drawComboChart(elements.cashChart, data.cashFlow?.series || [], {
      barKeys: [
        { key: 'cashIn', label: 'Masuk', color: '#0f766e' },
        { key: 'cashOut', label: 'Keluar', color: '#f59e0b' }
      ],
      lineKey: 'netCash',
      lineLabel: 'Net',
      lineColor: '#1d4ed8'
    });
  }

  function renderBreakdown(data) {
    const rows = data.cashFlow?.sourceBreakdown || [];
    setText(elements.breakdownMeta, text(data.activeCashSourceLabel, 'Gabungan Semua') + ' | ' + rows.length + ' sumber');
    clearNode(elements.breakdownRows);
    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 5;
      td.textContent = 'Belum ada rincian arus kas untuk periode ini.';
      tr.appendChild(td);
      elements.breakdownRows.appendChild(tr);
      return;
    }
    rows.forEach(function (row) {
      const tr = document.createElement('tr');
      tr.appendChild(cell(row.label));
      tr.appendChild(cell(formatAmount(row.cashIn), 'number'));
      tr.appendChild(cell(formatAmount(row.cashOut), 'number'));
      tr.appendChild(cell(formatAmount(row.netCash), 'number ' + (Number(row.netCash || 0) < 0 ? 'is-negative' : 'is-positive')));
      tr.appendChild(cell(String(Number(row.entryCount || 0)), 'number'));
      elements.breakdownRows.appendChild(tr);
    });
  }

  function cell(value, className) {
    const td = document.createElement('td');
    td.textContent = value;
    if (className) td.className = className;
    return td;
  }

  function drawComboChart(canvas, rows, options) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(520, Math.round(rect.width || 640));
    const height = Math.max(300, Math.round(rect.height || 320));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const plot = { left: 66, top: 24, right: width - 22, bottom: height - 48 };
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

    drawGrid(ctx, plot, minValue, maxValue, yFor);
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
    const barWidth = Math.min(30, Math.max(10, groupWidth / (barKeys.length + 1.8)));
    rows.forEach(function (row, index) {
      const center = plot.left + groupWidth * index + groupWidth / 2;
      barKeys.forEach(function (bar, barIndex) {
        const offset = (barIndex - (barKeys.length - 1) / 2) * (barWidth + 4);
        drawBar(ctx, center + offset, zeroY, yFor(Number(row[bar.key] || 0)), barWidth, bar.color);
      });
      ctx.fillStyle = '#475569';
      ctx.font = '750 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text(row.shortName, row.monthName), center, height - 22);
    });

    drawLine(ctx, rows.map(function (row, index) {
      return {
        x: plot.left + groupWidth * index + groupWidth / 2,
        y: yFor(Number(row[options.lineKey] || 0))
      };
    }), options.lineColor || '#c81e1e');
  }

  function drawGrid(ctx, plot, minValue, maxValue, yFor) {
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
      ctx.fillText(formatCompact(value), plot.left - 8, y);
    }
  }

  function drawBar(ctx, centerX, zeroY, valueY, width, color) {
    const top = Math.min(zeroY, valueY);
    const height = Math.max(2, Math.abs(valueY - zeroY));
    ctx.fillStyle = color;
    roundedRect(ctx, centerX - width / 2, top, width, height, 4);
    ctx.fill();
  }

  function drawLine(ctx, points, color) {
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

  function roundedRect(ctx, x, y, width, height, radius) {
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

  function startRealtimeRefresh() {
    if (state.refreshTimer) window.clearInterval(state.refreshTimer);
    state.refreshTimer = window.setInterval(function () {
      loadDashboard(true);
    }, 15000);
  }

  function bindEvents() {
    if (elements.refreshButton) elements.refreshButton.addEventListener('click', function () {
      loadDashboard(false);
    });
    [elements.yearInput, elements.startMonth, elements.endMonth, elements.cashSource].forEach(function (element) {
      if (element) element.addEventListener('change', function () {
        state.filtersTouched = true;
        loadDashboard(false);
      });
    });
    if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
    window.addEventListener('resize', function () {
      if (state.data) renderCharts(state.data);
    });
  }

  populateMonths();
  defaultPeriod();
  bindEvents();
  loadDashboard(false);
  startRealtimeRefresh();
})();
