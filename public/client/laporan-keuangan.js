(function () {
  const REPORT_LABELS = {
    'laba-rugi': 'Laba Rugi',
    neraca: 'Neraca',
    'perhitungan-pajak': 'Perhitungan Pajak'
  };

  const elements = {
    alert: document.getElementById('financialReportAlert'),
    clientMeta: document.getElementById('financialReportClientMeta'),
    userName: document.getElementById('financialReportUserName'),
    userEmail: document.getElementById('financialReportUserEmail'),
    refreshButton: document.getElementById('financialReportRefreshBtn'),
    downloadButton: document.getElementById('financialReportDownloadBtn'),
    printButton: document.getElementById('financialReportPrintBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('financialReportBackLink'),
    title: document.getElementById('financialReportTitle'),
    subtitle: document.getElementById('financialReportSubtitle'),
    sheet: document.getElementById('financialReportSheet'),
    controls: document.getElementById('financialReportControls'),
    yearInput: document.getElementById('financialReportYearInput'),
    periodStartSelect: document.getElementById('financialReportPeriodStartSelect'),
    periodEndSelect: document.getElementById('financialReportPeriodEndSelect'),
    detailModal: document.getElementById('financialReportDetailModal'),
    detailTitle: document.getElementById('financialReportDetailTitle'),
    detailSubtitle: document.getElementById('financialReportDetailSubtitle'),
    detailBody: document.getElementById('financialReportDetailBody'),
    detailClose: document.getElementById('financialReportDetailClose'),
    detailDone: document.getElementById('financialReportDetailDone'),
    fiscalModal: document.getElementById('fiscalCorrectionModal'),
    fiscalForm: document.getElementById('fiscalCorrectionForm'),
    fiscalType: document.getElementById('fiscalCorrectionType'),
    fiscalDescription: document.getElementById('fiscalCorrectionDescription'),
    fiscalAmount: document.getElementById('fiscalCorrectionAmount'),
    fiscalClose: document.getElementById('fiscalCorrectionCloseBtn'),
    fiscalCancel: document.getElementById('fiscalCorrectionCancelBtn'),
    fiscalSave: document.getElementById('fiscalCorrectionSaveBtn')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  let loading = false;
  let currentData = null;
  let pendingReload = false;
  let reloadTimer = null;

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

  function reportTypeFromPath() {
    const slug = window.location.pathname.split('/').filter(Boolean).pop() || '';
    return REPORT_LABELS[slug] ? slug : 'laba-rugi';
  }

  function formatAmount(value, options) {
    const amount = Number(value || 0);
    if (!amount && !(options && options.showZero)) return '-';
    const rounded = Math.round(Math.abs(amount));
    const formatted = new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(rounded);
    return amount < 0 ? '(' + formatted + ')' : formatted;
  }

  function formatDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? [match[3], match[2], match[1]].join('-') : raw || '-';
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

  function formatInputAmount(value) {
    const amount = Number(value || 0);
    return amount ? new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount) : '';
  }

  function cleanFileNamePart(value) {
    return text(value, 'laporan')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'laporan';
  }

  function reportFileName() {
    const clientName = cleanFileNamePart(currentData?.client?.name || 'client');
    const reportName = cleanFileNamePart(REPORT_LABELS[reportTypeFromPath()] || 'laporan-keuangan');
    const year = cleanFileNamePart(currentData?.reportYear || currentData?.postedPeriods?.year || new Date().getFullYear());
    const period = cleanFileNamePart(text(currentData?.report?.headerLines?.[2], 'periode'));
    return [clientName, reportName, year, period].filter(Boolean).join('-') + '.xls';
  }

  function printableReportHtml() {
    if (!elements.sheet) return '';
    const clone = elements.sheet.cloneNode(true);
    clone.querySelectorAll('button, input, select, textarea, .financial-report-inline-actions').forEach(function (node) {
      node.remove();
    });
    return clone.innerHTML;
  }

  function downloadReport() {
    if (!currentData || !elements.sheet) {
      setAlert('Laporan belum siap untuk didownload.', 'warning');
      return;
    }
    const title = text(currentData.reportTitle || REPORT_LABELS[reportTypeFromPath()], 'Laporan Keuangan');
    const html = [
      '<!doctype html><html><head><meta charset="utf-8">',
      '<style>',
      'body{font-family:Arial,sans-serif;color:#020617;}',
      'h2{font-size:16px;text-align:center;margin:0 0 4px;}',
      '.financial-report-title-block{text-align:center;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #111827;}',
      'table{width:100%;border-collapse:collapse;font-size:12px;}',
      'td,th{padding:5px 7px;border-bottom:1px solid #d8dee9;}',
      'th{text-align:right;border-bottom:2px solid #111827;}',
      'th:first-child,td:first-child{text-align:left;}',
      'td:last-child{text-align:right;}',
      '.financial-report-section-title td,.financial-report-subsection-row td{font-weight:bold;text-transform:uppercase;padding-top:8px;}',
      '.financial-report-detail-row td:first-child{padding-left:14px;}',
      '.financial-report-total-row td,.financial-report-grand-total-row td{font-weight:bold;border-top:1px solid #111827;}',
      '.financial-report-grand-total-row td{border-bottom:2px solid #111827;}',
      '</style>',
      '<title>', title, '</title></head><body>',
      printableReportHtml(),
      '</body></html>'
    ].join('');
    const blob = new Blob(['\ufeff', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = reportFileName();
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  function printReport() {
    if (!currentData) {
      setAlert('Laporan belum siap untuk diprint.', 'warning');
      return;
    }
    window.print();
  }

  function amountCell(value, options) {
    const wrap = document.createElement('span');
    wrap.className = 'financial-report-amount';
    const currency = document.createElement('span');
    currency.textContent = 'Rp';
    const amount = document.createElement('strong');
    amount.textContent = formatAmount(value, options);
    wrap.appendChild(currency);
    wrap.appendChild(amount);
    return wrap;
  }

  function businessEntities(data) {
    return Array.isArray(data?.businessEntities)
      ? data.businessEntities.map(function (entity) {
        return {
          key: text(entity.key || entity.id || entity.name),
          name: text(entity.name || entity.label || entity.key)
        };
      }).filter(function (entity) {
        return entity.key && entity.name;
      })
      : [];
  }

  function useEntityColumns(data) {
    return ['laba-rugi', 'neraca'].includes(data?.reportType) && businessEntities(data).length >= 2;
  }

  function entityAmount(source, entity) {
    const amounts = source && source.entityAmounts && typeof source.entityAmounts === 'object' ? source.entityAmounts : null;
    if (!amounts || !entity?.key) return 0;
    return Number(amounts[entity.key] || amounts[entity.name] || 0);
  }

  function sumEntityAmounts(rows, entities) {
    const result = {};
    entities.forEach(function (entity) {
      result[entity.key] = (rows || []).reduce(function (sum, item) {
        return sum + entityAmount(item, entity);
      }, 0);
    });
    return result;
  }

  function profitLossTotalSource(section) {
    const explicitAmounts = section.totalEntityAmounts || section.entityTotalAmounts;
    const entityAmounts = explicitAmounts
      || (Number(section.total || 0) === Number(section.amount || 0) ? section.entityAmounts : {});
    return { amount: section.total, entityAmounts };
  }

  function balanceSectionTotalSource(section, entities) {
    return {
      amount: section.total,
      entityAmounts: section.totalEntityAmounts || section.entityTotalAmounts || sumEntityAmounts(section.lines || [], entities)
    };
  }

  function consolidatedAmount(source, fallbackKey) {
    if (!source || typeof source !== 'object') return 0;
    if (source.consolidatedAmount != null) return Number(source.consolidatedAmount || 0);
    if (source.totalAmount != null) return Number(source.totalAmount || 0);
    if (source[fallbackKey || 'amount'] != null) return Number(source[fallbackKey || 'amount'] || 0);
    return 0;
  }

  function entityAmountCell(source, entity) {
    return amountCell(entityAmount(source, entity));
  }

  function entityMatrixRow(label, source, className, entities, fallbackKey) {
    const tr = document.createElement('tr');
    if (className) tr.className = className;
    const labelCell = document.createElement('td');
    labelCell.textContent = label;
    tr.appendChild(labelCell);
    entities.forEach(function (entity) {
      const td = document.createElement('td');
      td.appendChild(entityAmountCell(source, entity));
      tr.appendChild(td);
    });
    const totalCell = document.createElement('td');
    totalCell.appendChild(amountCell(consolidatedAmount(source, fallbackKey)));
    tr.appendChild(totalCell);
    return tr;
  }

  function entityMatrixSectionTitle(title, source, entities, fallbackKey) {
    return entityMatrixRow(title, source, 'financial-report-section-title', entities, fallbackKey);
  }

  function entityMatrixSubsectionTitle(title, entities) {
    const tr = document.createElement('tr');
    tr.className = 'financial-report-subsection-row';
    const td = document.createElement('td');
    td.colSpan = entities.length + 2;
    td.textContent = title;
    tr.appendChild(td);
    return tr;
  }

  function entityMatrixHeader(entities) {
    const head = document.createElement('thead');
    const tr = document.createElement('tr');
    const label = document.createElement('th');
    label.textContent = 'Pos Laporan';
    tr.appendChild(label);
    entities.forEach(function (entity) {
      const th = document.createElement('th');
      th.textContent = entity.name;
      tr.appendChild(th);
    });
    const total = document.createElement('th');
    total.textContent = 'Konsolidasi / Total';
    tr.appendChild(total);
    head.appendChild(tr);
    return head;
  }

  function row(label, amount, className, source) {
    const tr = document.createElement('tr');
    if (className) tr.className = className;
    const details = Array.isArray(source?.details) ? source.details : [];
    if (details.length) {
      tr.classList.add('financial-report-clickable-row');
      tr.tabIndex = 0;
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', 'Lihat rincian ' + label);
      tr.addEventListener('click', function () {
        openDetailModal(label, amount, details);
      });
      tr.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetailModal(label, amount, details);
        }
      });
    }
    const labelCell = document.createElement('td');
    labelCell.textContent = label;
    const amountWrapper = document.createElement('td');
    amountWrapper.appendChild(amountCell(amount));
    tr.appendChild(labelCell);
    tr.appendChild(amountWrapper);
    return tr;
  }

  function sectionTitle(title, amount) {
    const tr = document.createElement('tr');
    tr.className = 'financial-report-section-title';
    const labelCell = document.createElement('td');
    labelCell.textContent = title;
    const amountWrapper = document.createElement('td');
    amountWrapper.appendChild(amountCell(amount, { showZero: true }));
    tr.appendChild(labelCell);
    tr.appendChild(amountWrapper);
    return tr;
  }

  function profitLossSectionTitle(title, section) {
    const tr = document.createElement('tr');
    tr.className = 'financial-report-section-title financial-report-profit-loss-section-title';
    const cell = document.createElement('td');
    cell.colSpan = 3;
    if (section && section.key === 'tax') {
      const wrap = document.createElement('span');
      wrap.className = 'financial-report-linked-section';
      const label = document.createElement('span');
      label.textContent = title;
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'financial-report-link-action';
      link.textContent = 'Buka Perhitungan Pajak';
      link.addEventListener('click', function () {
        window.location.assign(taxReportUrl());
      });
      wrap.appendChild(label);
      wrap.appendChild(link);
      cell.appendChild(wrap);
    } else {
      cell.textContent = title;
    }
    tr.appendChild(cell);
    return tr;
  }

  function profitLossRow(label, amount, className, source, options) {
    const tr = document.createElement('tr');
    if (className) tr.className = className;
    const details = Array.isArray(source?.details) ? source.details : [];
    if (details.length) {
      tr.classList.add('financial-report-clickable-row');
      tr.tabIndex = 0;
      tr.setAttribute('role', 'button');
      tr.setAttribute('aria-label', 'Lihat rincian ' + label);
      tr.addEventListener('click', function () {
        openDetailModal(label, amount, details);
      });
      tr.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetailModal(label, amount, details);
        }
      });
    }
    const labelCell = document.createElement('td');
    labelCell.textContent = label;
    const detailAmountCell = document.createElement('td');
    const totalAmountCell = document.createElement('td');
    const targetCell = options && options.totalColumn ? totalAmountCell : detailAmountCell;
    targetCell.appendChild(amountCell(amount, options));
    tr.appendChild(labelCell);
    tr.appendChild(detailAmountCell);
    tr.appendChild(totalAmountCell);
    return tr;
  }

  function titleCaseReportLabel(value) {
    return text(value).toLowerCase().replace(/\b\w/g, function (letter) {
      return letter.toUpperCase();
    });
  }

  function profitLossSubtotalLabel(section) {
    const explicit = text(section.subtotalLabel);
    if (explicit) return explicit;
    if (text(section.totalLabel).toLowerCase().startsWith('jumlah ')) return section.totalLabel;
    return 'Jumlah ' + titleCaseReportLabel(section.title);
  }

  function shouldShowProfitLossResult(section, subtotalLabel) {
    const resultLabel = text(section.resultLabel || section.totalLabel);
    if (!resultLabel) return false;
    return resultLabel.toLowerCase() !== text(subtotalLabel).toLowerCase();
  }

  function reportHeaderLines(report) {
    const lines = Array.isArray(report.headerLines)
      ? report.headerLines.map(function (line) { return text(line); }).filter(Boolean)
      : [];
    const clientName = text((report && report.companyName) || (currentData && currentData.client && currentData.client.name)).toUpperCase();
    const hasClientName = clientName && lines.some(function (line) {
      return line.toUpperCase() === clientName;
    });
    if (clientName && !hasClientName) lines.unshift(clientName);
    return lines;
  }

  function titleBlock(report) {
    const block = document.createElement('div');
    block.className = 'financial-report-title-block';
    reportHeaderLines(report || {}).forEach(function (line) {
      const item = document.createElement('h2');
      item.textContent = line;
      block.appendChild(item);
    });
    return block;
  }

  async function requestJson(url, options) {
    const response = await fetch(url, Object.assign({
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    }, options || {}));
    if (response.status === 401) {
      window.location.assign('/app/client/login?expired=' + Date.now());
      return null;
    }
    const data = await response.json().catch(function () {
      return {};
    });
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat laporan keuangan.');
    return data;
  }

  function urlSearchParams() {
    return new URLSearchParams(window.location.search);
  }

  function urlYearValue() {
    const params = urlSearchParams();
    return text(params.get('year') || params.get('tahun'));
  }

  function reportYearValue() {
    return text(elements.yearInput && elements.yearInput.value) || urlYearValue();
  }

  function currentReportQueryString() {
    const params = new URLSearchParams();
    const yearValue = reportYearValue();
    if (yearValue) params.set('year', yearValue);
    const selectedMonths = selectedPeriodRangeMonths();
    if (selectedMonths.length) params.set('months', selectedMonths.join(','));
    return params.toString();
  }

  function syncReportUrl(query) {
    try {
      const url = new URL(window.location.href);
      url.search = query ? '?' + query : '';
      window.history.replaceState({}, '', url.toString());
    } catch (err) {}
  }

  function resetInitialControlsFromUrl() {
    if (elements.yearInput) elements.yearInput.value = urlYearValue();
  }

  function scheduleLoadReport() {
    window.clearTimeout(reloadTimer);
    reloadTimer = window.setTimeout(loadReport, 180);
  }

  function taxReportUrl() {
    const clientId = clientIdFromPath();
    const query = currentReportQueryString();
    return '/app/client/clients/' + encodeURIComponent(clientId) + '/perhitungan-pajak' + (query ? '?' + query : '');
  }

  function initialReportMonthsFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const raw = text(params.get('months') || params.get('month') || params.get('bulan'));
    if (!raw || ['0', 'all', 'semua', 'posted'].includes(raw.toLowerCase())) return [];
    return Array.from(new Set(raw.split(',')
      .map(function (part) {
        return Number.parseInt(text(part), 10);
      })
      .filter(function (month) {
        return Number.isFinite(month) && month >= 1 && month <= 12;
      })))
      .sort(function (left, right) {
        return left - right;
      });
  }

  async function loadReport() {
    if (loading) {
      pendingReload = true;
      return;
    }
    const clientId = clientIdFromPath();
    const reportType = reportTypeFromPath();
    if (!clientId) {
      setAlert('Klien tidak valid.', 'error');
      return;
    }

    const query = currentReportQueryString();
    loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson('/app/api/client/clients/' + encodeURIComponent(clientId) + '/laporan-keuangan/' + encodeURIComponent(reportType) + (query ? '?' + query : ''));
      if (!data) return;
      if (currentReportQueryString() !== query) {
        pendingReload = true;
        return;
      }
      currentData = data;
      renderShell(data);
      renderControls(data);
      renderReport(data);
      syncReportUrl(query);
      if (data.draftFallbackApplied === true) {
        setAlert('Mode draft: laporan memakai data transaksi DEMO_DISTRIBUTION yang belum diposting. Setelah periode diposting, laporan final akan mengikuti data posting.', 'info');
      }
    } catch (err) {
      setAlert(err.message || 'Gagal memuat laporan keuangan.', 'error');
      clearNode(elements.sheet);
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Laporan belum bisa dimuat.';
      elements.sheet.appendChild(empty);
    } finally {
      loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
      if (pendingReload) {
        pendingReload = false;
        scheduleLoadReport();
      }
    }
  }

  function renderShell(data) {
    const user = data.user || {};
    const client = data.client || {};
    const title = data.reportTitle || REPORT_LABELS[reportTypeFromPath()] || 'Laporan Keuangan';
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    setText(elements.clientMeta, text(client.name, 'CV DEMO_MOTOR AMBARAWA'));
    setText(elements.title, title);
    const periodLine = text(data.report?.headerLines?.[2], postedPeriodText(data.postedPeriods, data));
    const postedText = postedPeriodText(data.postedPeriods, data);
    const subtitleParts = [text(client.name, 'CV DEMO_MOTOR AMBARAWA'), periodLine];
    if (postedText && postedText !== periodLine) subtitleParts.push(postedText);
    setText(elements.subtitle, subtitleParts.join(' | '));
    if (elements.backLink && client.id) elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
    document.title = title + ' - Client Portal';
  }

  function postedPeriodText(periods, data) {
    const labels = Array.isArray(periods?.monthLabels) ? periods.monthLabels.filter(Boolean) : [];
    if (data?.reportMode === 'live') {
      const year = text(data.reportYear || periods?.year, new Date().getFullYear());
      const months = Array.isArray(periods?.months)
        ? periods.months.map(Number).filter(function (month) {
          return month >= 1 && month <= 12;
        }).sort(function (left, right) {
          return left - right;
        })
        : [];
      const lastMonth = months[months.length - 1] || 12;
      const endDate = new Date(Number(year), lastMonth, 0);
      const endDay = Number.isFinite(endDate.getDate()) ? endDate.getDate() : 31;
      return 'Untuk Periode yang Berakhir pada ' + endDay + ' ' + monthName(lastMonth) + ' ' + year;
    }
    if (!labels.length) return 'Belum ada periode diposting';
    if (data?.draftFallbackApplied === true) return 'Draft belum diposting: ' + labels.join(', ');
    return 'Periode diposting: ' + labels.join(', ');
  }

  function hasPostedPeriods(data) {
    const months = Array.isArray(data?.postedPeriods?.months) ? data.postedPeriods.months : [];
    return months.some(function (month) {
      return Number(month) >= 1 && Number(month) <= 12;
    });
  }

  function monthName(month) {
    const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return names[Number(month) - 1] || 'Bulan ' + month;
  }

  function selectedPeriodRangeMonths() {
    const start = Number(elements.periodStartSelect?.value || 0);
    const end = Number(elements.periodEndSelect?.value || 0);
    if (!start && !end) return initialReportMonthsFromUrl();
    const first = Math.max(1, Math.min(start || end, end || start));
    const last = Math.min(12, Math.max(start || end, end || start));
    const result = [];
    for (let month = first; month <= last; month += 1) result.push(month);
    return result;
  }

  function fillPeriodSelect(select, months, labelsByMonth) {
    if (!select) return;
    clearNode(select);
    months.forEach(function (month) {
      const option = document.createElement('option');
      option.value = String(month);
      option.textContent = text(labelsByMonth.get(month), '') || monthName(month);
      select.appendChild(option);
    });
  }

  function selectPeriodValue(select, value, fallback) {
    if (!select) return;
    const target = String(value || fallback || '');
    select.value = Array.from(select.options).some(function (option) {
      return option.value === target;
    }) ? target : String(fallback || '');
  }

  function renderControls(data) {
    if (!elements.controls) return;
    const reportYear = Number(data.reportYear || data.postedPeriods?.year || new Date().getFullYear());
    const available = data.availablePostedPeriods || data.postedPeriods || {};
    const months = Array.isArray(available.months)
      ? available.months.map(Number).filter(function (month) {
        return month >= 1 && month <= 12;
      })
      : [];
    const labelsByMonth = new Map();
    months.forEach(function (month, index) {
      labelsByMonth.set(month, text((available.monthLabels || [])[index], ''));
    });
    const selectedMonths = Array.isArray(data.postedPeriods?.months)
      ? data.postedPeriods.months.map(Number).filter(function (month) {
        return month >= 1 && month <= 12;
      })
      : [];

    elements.controls.hidden = false;
    if (elements.yearInput && document.activeElement !== elements.yearInput) {
      elements.yearInput.value = String(reportYear);
    }

    if (!elements.periodStartSelect || !elements.periodEndSelect) return;
    const previousStart = Number(elements.periodStartSelect.value || 0);
    const previousEnd = Number(elements.periodEndSelect.value || 0);
    fillPeriodSelect(elements.periodStartSelect, months, labelsByMonth);
    fillPeriodSelect(elements.periodEndSelect, months, labelsByMonth);
    const firstMonth = months[0] || 0;
    const lastMonth = months[months.length - 1] || 0;
    const selectedStart = selectedMonths[0] || previousStart || firstMonth;
    const selectedEnd = selectedMonths[selectedMonths.length - 1] || previousEnd || lastMonth;
    selectPeriodValue(elements.periodStartSelect, selectedStart, firstMonth);
    selectPeriodValue(elements.periodEndSelect, selectedEnd, lastMonth);
  }

  function renderReport(data) {
    clearNode(elements.sheet);
    const report = data.report || {};
    elements.sheet.appendChild(titleBlock(report));

    if (data.postingFilterApplied === true && !hasPostedPeriods(data) && data.draftFallbackApplied !== true) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Belum ada periode diposting. Laporan keuangan akan terisi setelah periode diposting.';
      elements.sheet.appendChild(empty);
      return;
    }

    if (data.reportType === 'neraca') {
      if (useEntityColumns(data)) renderEntityBalanceSheet(report, businessEntities(data));
      else renderBalanceSheet(report);
    } else if (data.reportType === 'perhitungan-pajak') {
      renderTaxToolbar(report);
      renderTaxReport(report);
    } else {
      if (useEntityColumns(data)) renderEntityProfitLoss(report, businessEntities(data));
      else renderProfitLoss(report);
    }
  }

  function renderEntityProfitLoss(report, entities) {
    const table = document.createElement('table');
    table.className = 'financial-report-table financial-report-entity-matrix financial-report-profit-loss';
    table.appendChild(entityMatrixHeader(entities));
    const body = document.createElement('tbody');
    (report.sections || []).forEach(function (section) {
      body.appendChild(entityMatrixSectionTitle(section.title, section, entities, 'amount'));
      (section.lines || []).forEach(function (item) {
        body.appendChild(entityMatrixRow(item.label, item, 'financial-report-detail-row', entities, 'amount'));
      });
      body.appendChild(entityMatrixRow(section.totalLabel, profitLossTotalSource(section), 'financial-report-total-row', entities, 'amount'));
    });
    table.appendChild(body);
    elements.sheet.appendChild(table);
  }

  function renderProfitLoss(report) {
    const table = document.createElement('table');
    table.className = 'financial-report-table financial-report-profit-loss financial-report-profit-loss-standard';
    const body = document.createElement('tbody');
    (report.sections || []).forEach(function (section) {
      const subtotalLabel = profitLossSubtotalLabel(section);
      const resultLabel = text(section.resultLabel || section.totalLabel);
      body.appendChild(profitLossSectionTitle(section.title, section));
      (section.lines || []).forEach(function (item) {
        body.appendChild(profitLossRow(item.label, item.amount, 'financial-report-detail-row', item));
      });
      body.appendChild(profitLossRow(subtotalLabel, section.amount, 'financial-report-total-row financial-report-subtotal-row', null, { showZero: true, totalColumn: true }));
      if (shouldShowProfitLossResult(section, subtotalLabel)) {
        body.appendChild(profitLossRow(resultLabel, section.total, 'financial-report-grand-total-row financial-report-result-row', null, { showZero: true, totalColumn: true }));
      }
    });
    table.appendChild(body);
    elements.sheet.appendChild(table);
  }

  function renderBalanceSheet(report) {
    const table = document.createElement('table');
    table.className = 'financial-report-table financial-report-balance-paired';
    table.appendChild(balancePairedColgroup());
    const body = document.createElement('tbody');
    body.appendChild(balancePairedHeadingRow('AKTIVA', 'PASIVA'));
    const assetRows = balanceSideRows(report.assets || []);
    const pasivaRows = balanceSideRows(report.liabilities || []);
    const maxRows = Math.max(assetRows.length, pasivaRows.length);
    for (let index = 0; index < maxRows; index += 1) {
      body.appendChild(balancePairedRow(assetRows[index], pasivaRows[index]));
    }
    body.appendChild(balancePairedRow(
      { type: 'grand', label: 'TOTAL AKTIVA', amount: report.totals?.totalAssets },
      { type: 'grand', label: 'TOTAL PASIVA', amount: report.totals?.totalLiabilitiesAndEquity }
    ));
    table.appendChild(body);
    elements.sheet.appendChild(table);
    appendBalanceDifferenceTool(report);
  }

  function balancePairedColgroup() {
    const colgroup = document.createElement('colgroup');
    [
      'financial-report-balance-col-label',
      'financial-report-balance-col-amount',
      'financial-report-balance-col-label',
      'financial-report-balance-col-amount'
    ].forEach(function (className) {
      const col = document.createElement('col');
      col.className = className;
      colgroup.appendChild(col);
    });
    return colgroup;
  }

  function balanceSideRows(sections) {
    const rows = [];
    sections.forEach(function (section) {
      rows.push({ type: 'subsection', label: section.title });
      (section.lines || []).forEach(function (item) {
        rows.push(Object.assign({}, item, {
          type: 'detail',
          label: item.label,
          amount: item.amount
        }));
      });
      rows.push({ type: 'total', label: section.totalLabel, amount: section.total });
    });
    return rows;
  }

  function balancePairedHeadingRow(leftLabel, rightLabel) {
    const tr = document.createElement('tr');
    tr.className = 'financial-report-balance-heading-row';
    const left = document.createElement('td');
    left.colSpan = 2;
    left.textContent = leftLabel;
    const right = document.createElement('td');
    right.colSpan = 2;
    right.textContent = rightLabel;
    tr.appendChild(left);
    tr.appendChild(right);
    return tr;
  }

  function balancePairedRow(leftItem, rightItem) {
    const tr = document.createElement('tr');
    const rowType = [leftItem?.type, rightItem?.type].filter(Boolean).join(' ');
    if (rowType.includes('grand')) tr.classList.add('financial-report-grand-total-row');
    appendBalanceSideCells(tr, leftItem, 'left');
    appendBalanceSideCells(tr, rightItem, 'right');
    return tr;
  }

  function appendBalanceSideCells(tr, item, side) {
    if (!item) {
      const spacer = document.createElement('td');
      spacer.colSpan = 2;
      spacer.className = 'financial-report-balance-empty-cell financial-report-balance-empty-cell-' + side;
      tr.appendChild(spacer);
      return;
    }
    if (item.type === 'subsection') {
      const td = document.createElement('td');
      td.colSpan = 2;
      td.className = 'financial-report-subsection-row-cell financial-report-subsection-row-cell-' + side;
      td.textContent = item.label;
      tr.appendChild(td);
      return;
    }
    const labelCell = document.createElement('td');
    labelCell.textContent = item.label;
    labelCell.className = 'financial-report-balance-label-cell financial-report-balance-label-cell-' + side + ' financial-report-balance-side-' + item.type;
    const amountWrapper = document.createElement('td');
    amountWrapper.className = 'financial-report-balance-amount-cell financial-report-balance-amount-cell-' + side + ' financial-report-balance-side-' + item.type;
    amountWrapper.appendChild(amountCell(item.amount));
    attachBalanceSideDetailTrigger(labelCell, amountWrapper, item);
    tr.appendChild(labelCell);
    tr.appendChild(amountWrapper);
  }

  function attachBalanceSideDetailTrigger(labelCell, amountCellElement, item) {
    const details = Array.isArray(item?.details) ? item.details : [];
    if (!details.length || item.type !== 'detail') return;
    const label = item.label;
    const amount = item.amount;
    function openDetail() {
      openDetailModal(label, amount, details);
    }
    [labelCell, amountCellElement].forEach(function (cell) {
      cell.classList.add('financial-report-clickable-cell');
      cell.addEventListener('click', openDetail);
    });
    labelCell.tabIndex = 0;
    labelCell.setAttribute('role', 'button');
    labelCell.setAttribute('aria-label', 'Lihat rincian ' + label);
    labelCell.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDetail();
      }
    });
  }

  function renderEntityBalanceSheet(report, entities) {
    const table = document.createElement('table');
    table.className = 'financial-report-table financial-report-entity-matrix financial-report-balance-entity';
    table.appendChild(entityMatrixHeader(entities));
    const body = document.createElement('tbody');
    appendEntityBalanceGroup(body, 'AKTIVA', report.assets || [], 'TOTAL AKTIVA', report.totals?.totalAssets, entities);
    appendEntityBalanceGroup(body, 'PASIVA', report.liabilities || [], 'TOTAL PASIVA', report.totals?.totalLiabilitiesAndEquity, entities);
    table.appendChild(body);
    elements.sheet.appendChild(table);
    appendBalanceDifferenceTool(report);
  }

  function appendBalanceDifferenceTool(report) {
    const difference = Number(report?.totals?.difference || 0);
    if (Math.abs(difference) < 1) return;
    const diagnostics = report?.balanceDiagnostics || null;
    const diff = document.createElement('div');
    diff.className = 'financial-report-difference financial-report-difference-tool';

    const copy = document.createElement('div');
    copy.className = 'financial-report-difference-copy';
    const title = document.createElement('strong');
    title.textContent = 'Selisih Aktiva dan Pasiva: Rp ' + formatAmount(difference, { showZero: true });
    const helper = document.createElement('span');
    helper.textContent = diagnostics?.candidates?.length
      ? diagnostics.candidates.length + ' kandidat sumber selisih siap dicek.'
      : 'Belum ada kandidat otomatis dari data yang tersedia.';
    copy.appendChild(title);
    copy.appendChild(helper);
    diff.appendChild(copy);

    if (diagnostics) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'financial-report-difference-action';
      button.textContent = 'Analisa Selisih';
      button.addEventListener('click', function () {
        openBalanceDiagnosticsModal(diagnostics);
      });
      diff.appendChild(button);
    }

    elements.sheet.appendChild(diff);
  }

  function appendEntityBalanceGroup(body, groupTitle, sections, totalLabel, total, entities) {
    body.appendChild(entityMatrixSubsectionTitle(groupTitle, entities));
    sections.forEach(function (section) {
      body.appendChild(entityMatrixSubsectionTitle(section.title, entities));
      (section.lines || []).forEach(function (item) {
        body.appendChild(entityMatrixRow(item.label, item, 'financial-report-detail-row', entities, 'amount'));
      });
      body.appendChild(entityMatrixRow(section.totalLabel, balanceSectionTotalSource(section, entities), 'financial-report-total-row', entities, 'amount'));
    });
    body.appendChild(entityMatrixRow(totalLabel, {
      amount: total,
      entityAmounts: sumEntityAmounts(sections.map(function (section) {
        return balanceSectionTotalSource(section, entities);
      }), entities)
    }, 'financial-report-grand-total-row', entities, 'amount'));
  }

  function balanceColumn(title, sections, totalLabel, total) {
    const column = document.createElement('section');
    column.className = 'financial-report-balance-column';
    const heading = document.createElement('h3');
    heading.textContent = title;
    column.appendChild(heading);

    const table = document.createElement('table');
    table.className = 'financial-report-table';
    const body = document.createElement('tbody');
    sections.forEach(function (section) {
      const head = document.createElement('tr');
      head.className = 'financial-report-subsection-row';
      const headCell = document.createElement('td');
      headCell.colSpan = 2;
      headCell.textContent = section.title;
      head.appendChild(headCell);
      body.appendChild(head);
      (section.lines || []).forEach(function (item) {
        body.appendChild(row(item.label, item.amount, 'financial-report-detail-row'));
      });
      body.appendChild(row(section.totalLabel, section.total, 'financial-report-total-row'));
    });
    body.appendChild(row(totalLabel, total, 'financial-report-grand-total-row'));
    table.appendChild(body);
    column.appendChild(table);
    return column;
  }

  function renderTaxReport(report) {
    const table = document.createElement('table');
    table.className = 'financial-report-table financial-report-tax';
    const body = document.createElement('tbody');
    body.appendChild(row('Total Penghasilan', report.totalRevenue, 'financial-report-total-row'));
    body.appendChild(row('Laba Sebelum Pajak', report.profitBeforeTax, 'financial-report-grand-total-row'));
    body.appendChild(singleCellRow('Koreksi Fiskal', 'financial-report-subsection-row'));
    (report.fiscalCorrections || []).forEach(function (item) {
      body.appendChild(fiscalCorrectionRow(item));
    });
    body.appendChild(row('Penghasilan Kena Pajak', report.taxableIncome, 'financial-report-total-row'));
    body.appendChild(row('Penghasilan Kena Pajak Dibulatkan', report.taxableIncomeRounded, 'financial-report-grand-total-row'));
    body.appendChild(singleCellRow('Perhitungan Pajak', 'financial-report-subsection-row'));
    (report.taxCalculation || []).forEach(function (item) {
      body.appendChild(row(item.label + ' x Rp ' + formatAmount(item.base, { showZero: true }), item.amount, 'financial-report-detail-row'));
    });
    body.appendChild(row('Pajak Penghasilan', report.incomeTax, 'financial-report-grand-total-row'));
    body.appendChild(singleCellRow('Kredit Pajak', 'financial-report-subsection-row'));
    (report.credits || []).forEach(function (item) {
      body.appendChild(row(item.label, item.amount, 'financial-report-detail-row'));
    });
    body.appendChild(row('Jumlah Kredit Pajak', report.taxCredits, 'financial-report-total-row'));
    body.appendChild(row('Kurang (lebih) bayar', report.underOverPayment, 'financial-report-grand-total-row'));
    table.appendChild(body);
    elements.sheet.appendChild(table);
  }

  function renderTaxToolbar(report) {
    const wrap = document.createElement('section');
    wrap.className = 'financial-report-inline-actions';
    const copy = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = 'Koreksi Fiskal';
    const helper = document.createElement('span');
    const manualCount = (report.fiscalCorrections || []).filter(function (item) {
      return item && item.source === 'manual';
    }).length;
    helper.textContent = manualCount ? manualCount + ' koreksi manual tersimpan.' : 'Tambahkan koreksi manual bila ada beda fiskal.';
    copy.appendChild(title);
    copy.appendChild(helper);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'submit financial-report-add-correction';
    button.textContent = 'Tambah Koreksi Fiskal';
    button.addEventListener('click', openFiscalCorrectionModal);
    wrap.appendChild(copy);
    wrap.appendChild(button);
    elements.sheet.appendChild(wrap);
  }

  function fiscalCorrectionRow(item) {
    const tr = document.createElement('tr');
    tr.className = 'financial-report-detail-row';
    const labelCell = document.createElement('td');
    const line = document.createElement('span');
    line.textContent = text(item.label, '-');
    labelCell.appendChild(line);
    if (item && item.source === 'manual' && item.id) {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'financial-report-delete-correction';
      action.textContent = 'Hapus';
      action.addEventListener('click', function () {
        deleteFiscalCorrection(item);
      });
      labelCell.appendChild(action);
    }
    const amountWrapper = document.createElement('td');
    amountWrapper.appendChild(amountCell(item.amount));
    tr.appendChild(labelCell);
    tr.appendChild(amountWrapper);
    return tr;
  }

  function openFiscalCorrectionModal() {
    if (!elements.fiscalModal || !elements.fiscalForm) return;
    elements.fiscalForm.reset();
    if (elements.fiscalType) elements.fiscalType.value = 'positive';
    elements.fiscalModal.hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(function () {
      if (elements.fiscalDescription) elements.fiscalDescription.focus();
    }, 0);
  }

  function closeFiscalCorrectionModal() {
    if (!elements.fiscalModal) return;
    elements.fiscalModal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  async function saveFiscalCorrection(event) {
    event.preventDefault();
    const description = text(elements.fiscalDescription && elements.fiscalDescription.value);
    const amount = Math.abs(parseAmount(elements.fiscalAmount && elements.fiscalAmount.value));
    if (!description) {
      setAlert('Keterangan koreksi fiskal wajib diisi.', 'error');
      if (elements.fiscalDescription) elements.fiscalDescription.focus();
      return;
    }
    if (amount <= 0) {
      setAlert('Nominal koreksi fiskal wajib lebih dari 0.', 'error');
      if (elements.fiscalAmount) elements.fiscalAmount.focus();
      return;
    }
    if (elements.fiscalSave) elements.fiscalSave.disabled = true;
    try {
      const clientId = clientIdFromPath();
      await requestJson('/app/api/client/clients/' + encodeURIComponent(clientId) + '/laporan-keuangan/koreksi-fiskal', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          periodYear: currentData?.reportYear || elements.yearInput?.value || new Date().getFullYear(),
          correctionType: elements.fiscalType?.value || 'positive',
          description,
          amount
        })
      });
      closeFiscalCorrectionModal();
      await loadReport();
      setAlert('Koreksi fiskal tersimpan dan Perhitungan Pajak sudah diperbarui.', 'info');
    } catch (err) {
      setAlert(err.message || 'Koreksi fiskal gagal disimpan.', 'error');
    } finally {
      if (elements.fiscalSave) elements.fiscalSave.disabled = false;
    }
  }

  async function deleteFiscalCorrection(item) {
    if (!item || !item.id) return;
    if (!window.confirm('Hapus koreksi fiskal "' + text(item.description || item.label) + '"?')) return;
    try {
      const clientId = clientIdFromPath();
      await requestJson('/app/api/client/clients/' + encodeURIComponent(clientId) + '/laporan-keuangan/koreksi-fiskal/' + encodeURIComponent(item.id), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      await loadReport();
      setAlert('Koreksi fiskal dihapus dan Perhitungan Pajak sudah diperbarui.', 'info');
    } catch (err) {
      setAlert(err.message || 'Koreksi fiskal gagal dihapus.', 'error');
    }
  }

  function singleCellRow(label, className) {
    const tr = document.createElement('tr');
    tr.className = className || '';
    const td = document.createElement('td');
    td.colSpan = 2;
    td.textContent = label;
    tr.appendChild(td);
    return tr;
  }

  function openDetailModal(label, amount, details) {
    if (!elements.detailModal || !elements.detailBody) return;
    const totalDebit = details.reduce(function (sum, item) { return sum + Number(item.debit || 0); }, 0);
    const totalCredit = details.reduce(function (sum, item) { return sum + Number(item.credit || 0); }, 0);
    setText(elements.detailTitle, label);
    setText(elements.detailSubtitle, 'Jurnal sumber | Total laporan Rp ' + formatAmount(amount, { showZero: true }) + ' | ' + details.length + ' baris');
    clearNode(elements.detailBody);

    const summary = document.createElement('div');
    summary.className = 'financial-report-detail-summary';
    [
      ['Nilai laporan', amount],
      ['Total debet', totalDebit],
      ['Total kredit', totalCredit]
    ].forEach(function (item) {
      const card = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = item[0];
      const strong = document.createElement('strong');
      strong.textContent = 'Rp ' + formatAmount(item[1], { showZero: true });
      card.appendChild(span);
      card.appendChild(strong);
      summary.appendChild(card);
    });
    elements.detailBody.appendChild(summary);

    const table = document.createElement('table');
    table.className = 'financial-report-detail-table';
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Tanggal', 'Sumber', 'Ref', 'COA / Nama Akun', 'Keterangan', 'Debet', 'Kredit'].forEach(function (title) {
      const th = document.createElement('th');
      th.textContent = title;
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);

    const body = document.createElement('tbody');
    details.forEach(function (item) {
      const tr = document.createElement('tr');
      const accountLabel = [text(item.coa), text(item.accountName)].filter(Boolean).join(' - ') || '-';
      const refLabel = text(item.noBukti) || text(item.sourceId) || text(item.id) || '-';
      [
        formatDate(item.tanggal),
        text(item.sumber, '-'),
        refLabel,
        accountLabel,
        text(item.keterangan, '-')
      ].forEach(function (value, index) {
        const td = document.createElement('td');
        td.textContent = value;
        if (index === 1 && text(item.sourceKey)) {
          const small = document.createElement('small');
          small.className = 'financial-report-detail-source-key';
          small.textContent = text(item.sourceKey);
          td.appendChild(document.createElement('br'));
          td.appendChild(small);
        }
        tr.appendChild(td);
      });
      const debit = document.createElement('td');
      debit.textContent = formatAmount(item.debit);
      const credit = document.createElement('td');
      credit.textContent = formatAmount(item.credit);
      tr.appendChild(debit);
      tr.appendChild(credit);
      body.appendChild(tr);
    });
    table.appendChild(body);
    elements.detailBody.appendChild(table);
    elements.detailModal.hidden = false;
  }

  function openBalanceDiagnosticsModal(diagnostics) {
    if (!elements.detailModal || !elements.detailBody) return;
    const candidates = Array.isArray(diagnostics?.candidates) ? diagnostics.candidates : [];
    setText(elements.detailTitle, 'Analisa Selisih Neraca');
    setText(elements.detailSubtitle, 'Selisih Rp ' + formatAmount(diagnostics?.difference, { showZero: true }) + ' | ' + candidates.length + ' kandidat');
    clearNode(elements.detailBody);

    const summary = document.createElement('div');
    summary.className = 'financial-report-diagnostic-summary';
    (Array.isArray(diagnostics?.summary) ? diagnostics.summary : []).forEach(function (item) {
      const card = document.createElement('div');
      card.className = 'financial-report-diagnostic-card';
      const label = document.createElement('span');
      label.textContent = text(item.label, '-');
      const amount = document.createElement('strong');
      amount.textContent = 'Rp ' + formatAmount(item.amount, { showZero: true });
      card.appendChild(label);
      card.appendChild(amount);
      summary.appendChild(card);
    });
    elements.detailBody.appendChild(summary);

    if (!candidates.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Belum ada kandidat otomatis. Cek ulang mapping COA, posting periode, dan saldo awal.';
      elements.detailBody.appendChild(empty);
      elements.detailModal.hidden = false;
      return;
    }

    const table = document.createElement('table');
    table.className = 'financial-report-detail-table financial-report-diagnostic-table';
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Jenis', 'Kandidat', 'Nilai', 'Catatan', 'Rincian'].forEach(function (title) {
      const th = document.createElement('th');
      th.textContent = title;
      headRow.appendChild(th);
    });
    head.appendChild(headRow);
    table.appendChild(head);

    const body = document.createElement('tbody');
    candidates.forEach(function (item) {
      const tr = document.createElement('tr');
      const kind = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = 'financial-report-diagnostic-badge';
      badge.textContent = text(item.kind, 'Info');
      kind.appendChild(badge);

      const label = document.createElement('td');
      label.textContent = text(item.label, '-');

      const amount = document.createElement('td');
      amount.textContent = 'Rp ' + formatAmount(item.amount, { showZero: true });

      const note = document.createElement('td');
      note.textContent = text(item.note, '-');

      const detail = document.createElement('td');
      const details = Array.isArray(item.details) ? item.details : [];
      if (details.length) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mini-action-button';
        button.textContent = details.length + ' rincian';
        button.addEventListener('click', function () {
          openDetailModal(item.label, item.amount, details);
        });
        detail.appendChild(button);
      } else {
        detail.textContent = '-';
      }

      tr.appendChild(kind);
      tr.appendChild(label);
      tr.appendChild(amount);
      tr.appendChild(note);
      tr.appendChild(detail);
      body.appendChild(tr);
    });
    table.appendChild(body);
    elements.detailBody.appendChild(table);
    elements.detailModal.hidden = false;
  }

  function closeDetailModal() {
    if (elements.detailModal) elements.detailModal.hidden = true;
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

  resetInitialControlsFromUrl();

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadReport);
  if (elements.downloadButton) elements.downloadButton.addEventListener('click', downloadReport);
  if (elements.printButton) elements.printButton.addEventListener('click', printReport);
  if (elements.yearInput) {
    elements.yearInput.addEventListener('input', function () {
      const value = text(elements.yearInput.value);
      if (!value || value.length >= 4) scheduleLoadReport();
    });
    elements.yearInput.addEventListener('change', loadReport);
  }
  if (elements.periodStartSelect) elements.periodStartSelect.addEventListener('change', loadReport);
  if (elements.periodEndSelect) elements.periodEndSelect.addEventListener('change', loadReport);
  if (elements.detailClose) elements.detailClose.addEventListener('click', closeDetailModal);
  if (elements.detailDone) elements.detailDone.addEventListener('click', closeDetailModal);
  if (elements.detailModal) elements.detailModal.addEventListener('click', function (event) {
    if (event.target === elements.detailModal) closeDetailModal();
  });
  if (elements.fiscalForm) elements.fiscalForm.addEventListener('submit', saveFiscalCorrection);
  if (elements.fiscalClose) elements.fiscalClose.addEventListener('click', closeFiscalCorrectionModal);
  if (elements.fiscalCancel) elements.fiscalCancel.addEventListener('click', closeFiscalCorrectionModal);
  if (elements.fiscalModal) elements.fiscalModal.addEventListener('click', function (event) {
    if (event.target === elements.fiscalModal) closeFiscalCorrectionModal();
  });
  if (elements.fiscalAmount) {
    elements.fiscalAmount.addEventListener('input', function () {
      elements.fiscalAmount.value = elements.fiscalAmount.value.replace(/[^\d.,-]/g, '');
    });
    elements.fiscalAmount.addEventListener('blur', function () {
      elements.fiscalAmount.value = formatInputAmount(Math.abs(parseAmount(elements.fiscalAmount.value)));
    });
  }
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    if (elements.fiscalModal && !elements.fiscalModal.hidden) closeFiscalCorrectionModal();
    else if (elements.detailModal && !elements.detailModal.hidden) closeDetailModal();
  });
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);

  loadReport();
})();
