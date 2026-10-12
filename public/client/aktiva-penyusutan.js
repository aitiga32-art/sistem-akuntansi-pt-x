(function () {
  const state = {
    client: null,
    coaAccounts: [],
    depreciationGroups: [],
    paymentSources: [],
    openingAssetStatus: null,
    isTbbClient: false,
    isHtiClient: false,
    reportYear: '',
    reportEndDate: '',
    openingBalanceDate: '2026-01-01',
    initialAssetModeHandled: false,
    entries: [],
    filteredEntries: [],
    loading: false,
    activeFormMode: 'purchase',
    openingAccumulatedManual: false
  };

  const elements = {
    alert: document.getElementById('assetAlert'),
    title: document.querySelector('.portal-title'),
    clientMeta: document.getElementById('assetClientMeta'),
    userName: document.getElementById('assetUserName'),
    userEmail: document.getElementById('assetUserEmail'),
    refreshButton: document.getElementById('assetRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('assetBackLink'),
    subtitle: document.getElementById('assetSubtitle'),
    addButton: document.getElementById('assetAddBtn'),
    openingButton: document.getElementById('assetOpeningBtn'),
    purchaseButton: document.getElementById('assetPurchaseBtn'),
    saleButton: document.getElementById('assetSaleBtn'),
    listButton: document.getElementById('assetListBtn'),
    listPanel: document.getElementById('assetListPanel'),
    depreciationButton: document.getElementById('assetDepreciationBtn'),
    searchInput: document.getElementById('assetSearchInput'),
    count: document.getElementById('assetCount'),
    totalCost: document.getElementById('assetTotalCost'),
    totalDepreciation: document.getElementById('assetTotalDepreciation'),
    totalAccumulated: document.getElementById('assetTotalAccumulated'),
    totalBookValue: document.getElementById('assetTotalBookValue'),
    headCost: document.getElementById('assetHeadCost'),
    headDepreciation: document.getElementById('assetHeadDepreciation'),
    headAccumulated: document.getElementById('assetHeadAccumulated'),
    headBookValue: document.getElementById('assetHeadBookValue'),
    rows: document.getElementById('assetRows'),
    modal: document.getElementById('assetModal'),
    form: document.getElementById('assetForm'),
    modalTitle: document.getElementById('assetModalTitle'),
    modalMeta: document.getElementById('assetModalMeta'),
    closeButton: document.getElementById('assetCloseBtn'),
    cancelButton: document.getElementById('assetCancelBtn'),
    saveButton: document.getElementById('assetSaveBtn'),
    entryId: document.getElementById('assetEntryId'),
    openingSummary: document.getElementById('assetOpeningSummary'),
    assetType: document.getElementById('assetType'),
    description: document.getElementById('assetDescription'),
    acquisitionDate: document.getElementById('assetAcquisitionDate'),
    cost: document.getElementById('assetCost'),
    openingAccumulatedLine: document.getElementById('assetOpeningAccumulatedLine'),
    openingAccumulated: document.getElementById('assetOpeningAccumulated'),
    openingAccumulatedAutoButton: document.getElementById('assetOpeningAccumulatedAutoBtn'),
    openingAccumulatedHint: document.getElementById('assetOpeningAccumulatedHint'),
    group: document.getElementById('assetGroup'),
    paymentSource: document.getElementById('assetPaymentSource'),
    paymentSourceLine: document.getElementById('assetPaymentSourceLine'),
    assetCoa: document.getElementById('assetCoa'),
    accumulatedCoa: document.getElementById('assetAccumulatedCoa'),
    expenseCoa: document.getElementById('assetExpenseCoa'),
    notes: document.getElementById('assetNotes'),
    attachmentFile: document.getElementById('assetAttachmentFile'),
    attachmentPickButton: document.getElementById('assetAttachmentPickBtn'),
    attachmentNote: document.getElementById('assetAttachmentNote'),
    preview: document.getElementById('assetPreview'),
    fileModal: document.getElementById('assetFileModal'),
    fileTitle: document.getElementById('assetFileTitle'),
    fileMeta: document.getElementById('assetFileMeta'),
    fileViewer: document.getElementById('assetFileViewer'),
    fileCloseButton: document.getElementById('assetFileCloseBtn'),
    detailModal: document.getElementById('assetDetailModal'),
    detailTitle: document.getElementById('assetDetailTitle'),
    detailMeta: document.getElementById('assetDetailMeta'),
    detailBody: document.getElementById('assetDetailBody'),
    detailCloseButton: document.getElementById('assetDetailCloseBtn'),
    detailCancelButton: document.getElementById('assetDetailCancelBtn'),
    detailFileButton: document.getElementById('assetDetailFileBtn'),
    detailSellButton: document.getElementById('assetDetailSellBtn'),
    detailEditButton: document.getElementById('assetDetailEditBtn'),
    detailDeleteButton: document.getElementById('assetDetailDeleteBtn')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));
  elements.workflowButtons = Array.from(document.querySelectorAll('[data-asset-workflow-action]'));

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function today() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/(?:aktiva-penyusutan|hti-buku-aktiva)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/aktiva-penyusutan';
  }

  function journalApiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/jurnal-adjustment';
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Aktiva dan Penyusutan.');
    return data;
  }

  async function loadAssets() {
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
      state.depreciationGroups = Array.isArray(data.depreciationGroups) ? data.depreciationGroups : [];
      state.paymentSources = Array.isArray(data.paymentSources) ? data.paymentSources : [];
      state.openingAssetStatus = data.openingAssetStatus || null;
      state.isTbbClient = Boolean(data.isTbbClient);
      state.isHtiClient = Boolean(data.isHtiClient);
      state.reportYear = text(data.reportYear);
      state.reportEndDate = text(data.reportEndDate);
      state.openingBalanceDate = text(data.openingBalanceDate, '2026-01-01');
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      renderClient();
      renderOptions();
      applySearch();
      handleInitialAssetMode();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Aktiva dan Penyusutan.', 'error');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
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
    if (isHtiAssetClient()) document.body.classList.add('hti-asset-page');
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.title, isHtiAssetClient() ? 'Buku Aktiva' : 'Aktiva dan Penyusutan');
    setText(elements.subtitle, text(client.name, 'Klien') + ' | ' + (isHtiAssetClient() ? 'Aktiva tetap dan penyusutan otomatis' : 'Penyusutan otomatis tahun 2026'));
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function activateAssetWorkflow(action) {
    const cleanAction = text(action, 'list');
    elements.workflowButtons.forEach(function (button) {
      const isActive = button.getAttribute('data-asset-workflow-action') === cleanAction;
      button.classList.toggle('is-active', isActive);
      if (isActive) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    if (elements.listPanel) elements.listPanel.hidden = false;
  }

  function showAssetList(options) {
    const settings = options || {};
    activateAssetWorkflow('list');
    if (settings.scroll && elements.listPanel) {
      elements.listPanel.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
    if (settings.focusSearch && elements.searchInput) {
      elements.searchInput.focus();
    }
  }

  function assetModeFromUrl() {
    try {
      return text(new URLSearchParams(window.location.search).get('mode')).toLowerCase();
    } catch {
      return '';
    }
  }

  function clearAssetModeFromUrl() {
    try {
      const url = new URL(window.location.href);
      if (!url.searchParams.has('mode')) return;
      url.searchParams.delete('mode');
      const query = url.searchParams.toString();
      window.history.replaceState({}, '', url.pathname + (query ? '?' + query : '') + url.hash);
    } catch {
      // URL cleanup is only for display; the workflow can continue without it.
    }
  }

  function handleInitialAssetMode() {
    if (state.initialAssetModeHandled || !isHtiAssetClient()) return;
    state.initialAssetModeHandled = true;
    const mode = assetModeFromUrl();
    clearAssetModeFromUrl();
    if (mode === 'saldo-awal' || mode === 'opening') {
      openOpeningAssetModal();
      return;
    }
    if (mode === 'beli-aktiva' || mode === 'purchase') {
      openAddModal();
      return;
    }
    if (mode === 'jual-aktiva' || mode === 'sale') {
      openSellAssetModal();
      return;
    }
    showAssetList(mode === 'daftar-aktiva' || mode === 'list' ? { scroll: true } : {});
  }

  function renderOptions() {
    renderGroupOptions();
    renderCoaOptions(elements.assetCoa, defaultAssetCoa());
    renderCoaOptions(elements.accumulatedCoa, defaultAccumulatedCoa(defaultAssetCoa()));
    renderCoaOptions(elements.expenseCoa, defaultExpenseCoa(defaultAssetCoa()));
    renderPaymentSourceOptions(elements.paymentSource, defaultPaymentSourceKey());
    configureAssetFormMode();
  }

  function renderGroupOptions() {
    clearNode(elements.group);
    state.depreciationGroups.forEach(function (group) {
      const option = document.createElement('option');
      option.value = group.key;
      option.textContent = group.label + ' - ' + group.usefulLifeYears + ' tahun (' + group.annualRate + '%)';
      elements.group.appendChild(option);
    });
  }

  function renderCoaOptions(select, defaultCoa) {
    clearNode(select);
    const htiAllowed = {
      assetCoa: new Set(['1810', '1820']),
      assetAccumulatedCoa: new Set(['1811', '1821']),
      assetExpenseCoa: new Set(['6110'])
    };
    const allowed = isHtiAssetClient() && select ? htiAllowed[select.id] : null;
    const accounts = allowed
      ? state.coaAccounts.filter(function (account) { return allowed.has(text(account.coa)); })
      : state.coaAccounts;
    accounts.forEach(function (account) {
      const option = document.createElement('option');
      option.value = account.coa;
      option.textContent = account.coa + ' - ' + account.accountName;
      select.appendChild(option);
    });
    select.value = defaultCoa;
  }

  function renderPaymentSourceOptions(select, defaultValue) {
    if (!select) return;
    clearNode(select);
    state.paymentSources.forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value || source.key || '';
      option.textContent = source.label || option.value;
      select.appendChild(option);
    });
    select.value = defaultValue || (state.paymentSources[0] && (state.paymentSources[0].value || state.paymentSources[0].key)) || '';
  }

  function openingAssetRowsHtml(rows, title) {
    const safeRows = Array.isArray(rows) ? rows : [];
    const visibleRows = safeRows.filter(function (row) {
      return Number(row.target || 0) || Number(row.used || 0);
    });
    if (!visibleRows.length) {
      return '<div class="asset-opening-card"><strong>' + escapeHtml(title) + '</strong><span>Belum ada saldo awal pada kelompok ini.</span></div>';
    }
    return '<div class="asset-opening-card"><strong>' + escapeHtml(title) + '</strong><table><thead><tr><th>Akun</th><th>Saldo Awal</th><th>Sudah Diinput</th><th>Sisa</th></tr></thead><tbody>' +
      visibleRows.map(function (row) {
        const remaining = Number(row.remaining || 0);
        return '<tr class="' + (Math.abs(remaining) <= 0.009 ? 'is-ok' : 'is-open') + '">' +
          '<td>' + escapeHtml(row.coa + ' - ' + text(row.accountName)) + '</td>' +
          '<td>' + escapeHtml(formatAmount(row.target)) + '</td>' +
          '<td>' + escapeHtml(formatAmount(row.used)) + '</td>' +
          '<td>' + escapeHtml(formatAmount(remaining)) + '</td>' +
        '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function renderOpeningAssetSummary() {
    if (!elements.openingSummary) return;
    const isOpening = state.activeFormMode === 'opening';
    elements.openingSummary.hidden = !isOpening;
    if (!isOpening) {
      elements.openingSummary.innerHTML = '';
      return;
    }
    const status = state.openingAssetStatus || {};
    const totals = status.totals || {};
    elements.openingSummary.innerHTML = [
      '<div class="asset-opening-head">',
        '<strong>Saldo Awal Aktiva Tetap</strong>',
        '<span>Input aset lama di sini. Buku Aktiva akan menjadi rincian saldo awal aset tetap di laporan.</span>',
      '</div>',
      '<div class="asset-opening-total">',
        '<span>Aktiva Tetap: ' + escapeHtml(formatAmount(totals.assetUsed || 0)) + ' / ' + escapeHtml(formatAmount(totals.assetTarget || 0)) + '</span>',
        '<span>Akumulasi: ' + escapeHtml(formatAmount(totals.accumulatedUsed || 0)) + ' / ' + escapeHtml(formatAmount(totals.accumulatedTarget || 0)) + '</span>',
      '</div>',
      '<div class="asset-opening-grid">',
        openingAssetRowsHtml(status.assetRows, 'Akun Aktiva Tetap'),
        openingAssetRowsHtml(status.accumulatedRows, 'Akun Akumulasi Penyusutan'),
      '</div>'
    ].join('');
  }

  function configureAssetFormMode() {
    const isOpening = state.activeFormMode === 'opening';
    if (elements.openingAccumulatedLine) elements.openingAccumulatedLine.hidden = !isOpening;
    if (elements.paymentSourceLine) elements.paymentSourceLine.hidden = isOpening || !isManagedAssetClient();
    renderOpeningAssetSummary();
  }

  function defaultPaymentSourceKey() {
    const source = state.paymentSources[0] || {};
    return source.value || source.key || '';
  }

  function isTbbAssetClient() {
    const clientName = text(state.client && state.client.name).toLowerCase();
    return Boolean(state.isTbbClient) ||
      clientName.includes('perusahaan distribusi contoh') ||
      clientName.includes('13 bersaudara') ||
      clientName.includes('tbb') ||
      window.location.pathname.includes('765935d8-0c1a-46c3-b8c5-0442d4f9d1b1');
  }

  function isHtiAssetClient() {
    const clientName = text(state.client && state.client.name).toLowerCase();
    return Boolean(state.isHtiClient) ||
      clientName === 'pt x' ||
      window.location.pathname.includes('/pt-x-buku-aktiva');
  }

  function isManagedAssetClient() {
    return isTbbAssetClient() || isHtiAssetClient();
  }

  function isSoldAsset(entry) {
    return text(entry && entry.status).toLowerCase() === 'terjual';
  }

  function usesAssetChoiceModal() {
    return isManagedAssetClient();
  }

  function defaultAssetCoa() {
    if (isHtiAssetClient()) return '1810';
    return isTbbAssetClient() ? '1-1103' : '1-6004';
  }

  function defaultAccumulatedCoa(assetCoa) {
    if (isHtiAssetClient()) return assetCoa === '1820' ? '1821' : '1811';
    if (!isTbbAssetClient()) return '1-7001';
    if (assetCoa === '1-1102') return '1-1202';
    if (assetCoa === '1-1103') return '1-1203';
    if (assetCoa === '1-1106') return '1-1206';
    return '1-1203';
  }

  function defaultExpenseCoa(assetCoa) {
    if (isHtiAssetClient()) return '6110';
    if (!isTbbAssetClient()) return '6-1001';
    if (assetCoa === '1-1106') return '6-0122';
    if (assetCoa === '1-1102') return '6-0124';
    return '5-0215';
  }

  function applySearch() {
    const query = text(elements.searchInput && elements.searchInput.value).toLowerCase();
    state.filteredEntries = state.entries.filter(function (entry) {
      if (isHtiAssetClient() && isSoldAsset(entry)) return false;
      if (!query) return true;
      return [
        entry.noAktiva,
        entry.jenisAktiva,
        entry.keterangan,
        entry.kelompokLabel,
        entry.coaAktiva,
        entry.namaAkunAktiva,
        entry.coaBiaya,
        entry.namaAkunBiaya,
        entry.status
      ].some(function (value) {
        return text(value).toLowerCase().includes(query);
      });
    });
    renderRows();
  }

  function renderRows() {
    clearHtiAssetStoredTableWidths();
    clearNode(elements.rows);
    state.filteredEntries.forEach(function (entry) {
      elements.rows.appendChild(entryRow(entry));
    });
    const blankCount = Math.max(8 - state.filteredEntries.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
    renderTotals();
  }

  function clearHtiAssetStoredTableWidths() {
    if (!isHtiAssetClient()) return;
    try {
      const prefix = 'clientPortal:tableWidths:v1:' + window.location.pathname.replace(/\/+/g, '/') + ':';
      Object.keys(window.localStorage || {}).forEach(function (key) {
        if (key.startsWith(prefix) && key.includes('hti-asset-table')) {
          window.localStorage.removeItem(key);
        }
      });
    } catch {
      // Stored table widths are only local display preferences.
    }
  }

  function entryRow(entry) {
    if (isHtiAssetClient()) return htiAssetEntryRow(entry);
    const row = document.createElement('tr');
    if (elements.detailModal) {
      row.className = 'asset-clickable-row';
      bindAssetRowPreview(row, entry);
    }
    row.appendChild(businessEntityCell(entry));
    row.appendChild(cell(entry.noAktiva));
    row.appendChild(cellWithTitle(entry.jenisAktiva));
    row.appendChild(cellWithTitle(entry.keterangan));
    row.appendChild(cell(formatDisplayDate(entry.tanggalPerolehan)));
    row.appendChild(cell(entry.golongan));
    row.appendChild(cell(formatRate(entry.tarif)));
    row.appendChild(cell(formatAmount(entry.hargaPerolehan), 'number'));
    row.appendChild(cell(formatAmount(entry.depreciationThisYear), 'number'));
    row.appendChild(cell(formatAmount(entry.accumulatedDepreciation), 'number'));
    row.appendChild(cell(formatAmount(entry.bookValue), 'number'));
    row.appendChild(cell(entry.status));
    row.appendChild(cell(String(entry.scheduleRows ? entry.scheduleRows.length : 0) + ' bulan'));

    const actionTd = document.createElement('td');
    actionTd.className = 'cashbook-actions asset-actions';
    actionTd.appendChild(actionButton('Lihat', function () {
      if (elements.detailModal) openAssetDetailModal(entry);
      else openFileViewer(entry);
    }));
    actionTd.appendChild(actionButton('Jual', function () {
      openSellAssetModal(entry);
    }, text(entry.status) === 'Terjual', '', 'Aset sudah dijual.'));
    actionTd.appendChild(actionButton('Ubah', function () {
      openEditModal(entry);
    }));
    actionTd.appendChild(actionButton('Hapus', function () {
      deleteEntry(entry);
    }, false, 'danger'));
    row.appendChild(actionTd);
    return row;
  }

  function htiAssetEntryRow(entry) {
    const row = document.createElement('tr');
    row.className = 'hti-asset-clickable-row';
    bindAssetRowPreview(row, entry);
    row.appendChild(cell(entry.noAktiva));
    row.appendChild(cell(formatDisplayDate(entry.tanggalPerolehan), 'hti-date-cell'));
    row.appendChild(cellWithTitle(entry.jenisAktiva));
    row.appendChild(cellWithTitle(entry.keterangan));
    row.appendChild(cell(entry.golongan));
    row.appendChild(cell(formatAmount(entry.hargaPerolehan), 'number'));
    row.appendChild(cell(formatAmount(entry.depreciationThisYear), 'number'));
    row.appendChild(cell(formatAmount(entry.accumulatedDepreciation), 'number'));
    row.appendChild(cell(formatAmount(entry.bookValue), 'number hti-outstanding-cell'));
    row.appendChild(assetDocumentCell(entry));

    const actionTd = document.createElement('td');
    actionTd.className = 'cashbook-actions asset-actions hti-asset-actions';
    actionTd.appendChild(actionButton('Hapus', function () {
      deleteEntry(entry);
    }, false, 'danger'));
    actionTd.appendChild(actionButton('Jual', function () {
      openSellAssetModal(entry);
    }, isSoldAsset(entry), '', 'Aset sudah dijual.'));
    actionTd.appendChild(actionButton('Ubah', function () {
      openEditModal(entry);
    }));
    row.appendChild(actionTd);
    return row;
  }

  function assetStatusCell(entry) {
    const td = cell('');
    const badge = document.createElement('span');
    badge.className = 'hti-asset-status-badge';
    if (text(entry.status) === 'Terjual') badge.classList.add('is-sold');
    badge.textContent = text(entry.status, 'Aktif');
    td.appendChild(badge);
    return td;
  }

  function assetDocumentCell(entry) {
    const td = cell('');
    td.className = 'hti-document-check-cell hti-asset-document-cell';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(entry.hasAttachment);
    input.disabled = true;
    td.appendChild(input);
    return td;
  }

  function blankRow() {
    const row = document.createElement('tr');
    const count = isHtiAssetClient() ? 11 : 14;
    for (let index = 0; index < count; index += 1) {
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
    const fullText = text(value);
    if (fullText) td.title = fullText;
    return td;
  }

  function actionButton(label, onClick, disabled, variant, disabledReason) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cashbook-action-button' + (variant ? ' ' + variant : '');
    button.textContent = label;
    button.disabled = Boolean(disabled);
    if (disabled) button.title = disabledReason || 'Aksi tidak tersedia.';
    if (onClick) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        onClick(event);
      });
    }
    return button;
  }

  function bindAssetRowPreview(row, entry) {
    row.tabIndex = 0;
    row.addEventListener('click', function (event) {
      if (event.target.closest('button, a, input, select, textarea, label')) return;
      openAssetDetailModal(entry);
    });
    row.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (event.target !== row) return;
      event.preventDefault();
      openAssetDetailModal(entry);
    });
  }

  function assetDetailItem(label, value, variant) {
    return '<div class="asset-detail-item' + (variant ? ' ' + variant : '') + '">' +
      '<span>' + escapeHtml(label) + '</span>' +
      '<strong>' + escapeHtml(text(value, '-')) + '</strong>' +
    '</div>';
  }

  function openAssetDetailModal(entry) {
    if (!entry || !ensureAssetDetailModal()) return;
    elements.detailModal.setAttribute('data-entry-id', entry.id);
    setText(elements.detailTitle, 'Detail Aktiva');
    setText(elements.detailMeta, [text(entry.noAktiva), text(entry.jenisAktiva)].filter(Boolean).join(' | '));
    const sourceLabel = text(entry.entrySource) === 'opening_balance'
      ? 'Saldo awal'
      : [text(entry.purchaseSourceType).toUpperCase(), text(entry.purchaseSourceKey || entry.purchaseSourceAccountName)].filter(Boolean).join(' | ');
    const saleLabel = text(entry.status) === 'Terjual'
      ? [formatDisplayDate(entry.tanggalJual), 'Rp' + formatAmount(entry.nilaiJual), text(entry.saleSourceKey || entry.saleSourceAccountName)].filter(Boolean).join(' | ')
      : '-';
    elements.detailBody.innerHTML = [
      '<section class="asset-detail-grid">',
        assetDetailItem('No Aktiva', entry.noAktiva),
        assetDetailItem('Tanggal Perolehan', formatDisplayDate(entry.tanggalPerolehan)),
        assetDetailItem('Jenis Aktiva', entry.jenisAktiva),
        assetDetailItem('Keterangan', entry.keterangan),
        assetDetailItem('Golongan', entry.golongan),
        assetDetailItem('Kelompok', entry.kelompokLabel),
        assetDetailItem('Harga Perolehan', 'Rp' + formatAmount(entry.hargaPerolehan), 'number'),
        assetDetailItem('Penyusutan Tahun Ini', 'Rp' + formatAmount(entry.depreciationThisYear), 'number'),
        assetDetailItem('Akumulasi', 'Rp' + formatAmount(entry.accumulatedDepreciation), 'number'),
        assetDetailItem('Nilai Buku', 'Rp' + formatAmount(entry.bookValue), 'number'),
        assetDetailItem('Sumber Dana', sourceLabel),
        isSoldAsset(entry) ? assetDetailItem('Status Penjualan', saleLabel) : '',
      '</section>',
      '<section class="asset-detail-ledger">',
        '<table class="cashbook-table asset-detail-table">',
          '<thead><tr><th>COA</th><th>Nama Akun</th><th>Fungsi</th></tr></thead>',
          '<tbody>',
            '<tr><td>' + escapeHtml(text(entry.coaAktiva, '-')) + '</td><td>' + escapeHtml(text(entry.namaAkunAktiva, '-')) + '</td><td>Aktiva tetap</td></tr>',
            '<tr><td>' + escapeHtml(text(entry.coaAkumulasi, '-')) + '</td><td>' + escapeHtml(text(entry.namaAkunAkumulasi, '-')) + '</td><td>Akumulasi penyusutan</td></tr>',
            '<tr><td>' + escapeHtml(text(entry.coaBiaya, '-')) + '</td><td>' + escapeHtml(text(entry.namaAkunBiaya, '-')) + '</td><td>Biaya penyusutan</td></tr>',
          '</tbody>',
        '</table>',
      '</section>',
      '<section class="asset-detail-document">',
        '<div><strong>Dokumen Terupload</strong><span>' + escapeHtml(entry.hasAttachment ? text(entry.attachmentName, 'Ada dokumen tersimpan.') : 'Belum ada dokumen tersimpan.') + '</span></div>',
      '</section>'
    ].join('');
    if (elements.detailFileButton) {
      elements.detailFileButton.disabled = !entry.hasAttachment;
      elements.detailFileButton.title = entry.hasAttachment ? '' : 'Belum ada dokumen ter-upload.';
    }
    if (elements.detailSellButton) {
      elements.detailSellButton.disabled = isSoldAsset(entry);
      elements.detailSellButton.title = isSoldAsset(entry) ? 'Aset sudah dijual.' : '';
    }
    elements.detailModal.hidden = false;
  }

  function ensureAssetDetailModal() {
    if (elements.detailModal) return elements.detailModal;
    if (!isHtiAssetClient()) return null;
    const modal = document.createElement('div');
    modal.className = 'portal-modal-backdrop';
    modal.id = 'assetDetailModal';
    modal.hidden = true;
    modal.innerHTML = [
      '<section class="portal-modal portal-modal-wide asset-detail-modal" role="dialog" aria-modal="true" aria-labelledby="assetDetailTitle">',
        '<header class="portal-modal-header">',
          '<div>',
            '<h2 id="assetDetailTitle">Detail Aktiva</h2>',
            '<span id="assetDetailMeta">Preview data aktiva tetap.</span>',
          '</div>',
          '<button class="icon-button" type="button" id="assetDetailCloseBtn" aria-label="Tutup popup detail">',
            '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
          '</button>',
        '</header>',
        '<div class="asset-detail-body" id="assetDetailBody"></div>',
        '<footer class="portal-modal-footer asset-detail-footer">',
          '<button class="ghost-button danger" type="button" id="assetDetailDeleteBtn">Hapus</button>',
          '<div class="cashbook-actions">',
            '<button class="ghost-button" type="button" id="assetDetailFileBtn">Lihat Dokumen</button>',
            '<button class="ghost-button" type="button" id="assetDetailSellBtn">Jual</button>',
            '<button class="ghost-button" type="button" id="assetDetailEditBtn">Ubah</button>',
            '<button class="ghost-button" type="button" id="assetDetailCancelBtn">Tutup</button>',
          '</div>',
        '</footer>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);
    elements.detailModal = modal;
    elements.detailTitle = document.getElementById('assetDetailTitle');
    elements.detailMeta = document.getElementById('assetDetailMeta');
    elements.detailBody = document.getElementById('assetDetailBody');
    elements.detailCloseButton = document.getElementById('assetDetailCloseBtn');
    elements.detailCancelButton = document.getElementById('assetDetailCancelBtn');
    elements.detailFileButton = document.getElementById('assetDetailFileBtn');
    elements.detailSellButton = document.getElementById('assetDetailSellBtn');
    elements.detailEditButton = document.getElementById('assetDetailEditBtn');
    elements.detailDeleteButton = document.getElementById('assetDetailDeleteBtn');
    bindAssetDetailModalEvents();
    return modal;
  }

  function closeAssetDetailModal() {
    if (elements.detailModal) elements.detailModal.hidden = true;
    if (elements.detailBody) elements.detailBody.innerHTML = '';
  }

  function selectedDetailEntry() {
    const id = elements.detailModal ? elements.detailModal.getAttribute('data-entry-id') : '';
    return state.entries.find(function (entry) { return entry.id === id; }) || null;
  }

  function withDetailEntry(action) {
    return function () {
      const entry = selectedDetailEntry();
      if (!entry) return;
      action(entry);
    };
  }

  function bindAssetDetailModalEvents() {
    if (elements.detailModal?.dataset.assetDetailBound === '1') return;
    if (elements.detailModal) elements.detailModal.dataset.assetDetailBound = '1';
    if (elements.detailCloseButton) elements.detailCloseButton.addEventListener('click', closeAssetDetailModal);
    if (elements.detailCancelButton) elements.detailCancelButton.addEventListener('click', closeAssetDetailModal);
    if (elements.detailFileButton) {
      elements.detailFileButton.addEventListener('click', withDetailEntry(function (entry) {
        closeAssetDetailModal();
        openFileViewer(entry);
      }));
    }
    if (elements.detailSellButton) {
      elements.detailSellButton.addEventListener('click', withDetailEntry(function (entry) {
        closeAssetDetailModal();
        openSellAssetModal(entry);
      }));
    }
    if (elements.detailEditButton) {
      elements.detailEditButton.addEventListener('click', withDetailEntry(function (entry) {
        closeAssetDetailModal();
        openEditModal(entry);
      }));
    }
    if (elements.detailDeleteButton) {
      elements.detailDeleteButton.addEventListener('click', withDetailEntry(async function (entry) {
        const deleted = await deleteEntry(entry);
        if (deleted) closeAssetDetailModal();
      }));
    }
  }

  function renderTotals() {
    const totals = state.filteredEntries.reduce(function (acc, entry) {
      acc.cost += Number(entry.hargaPerolehan || 0);
      acc.depreciation += Number(entry.depreciationThisYear || 0);
      acc.accumulated += Number(entry.accumulatedDepreciation || 0);
      acc.bookValue += Number(entry.bookValue || 0);
      return acc;
    }, { cost: 0, depreciation: 0, accumulated: 0, bookValue: 0 });
    setText(elements.count, state.filteredEntries.length + ' aktiva');
    setText(elements.totalCost, formatAmount(totals.cost));
    setText(elements.totalDepreciation, formatAmount(totals.depreciation));
    setText(elements.totalAccumulated, formatAmount(totals.accumulated));
    setText(elements.totalBookValue, formatAmount(totals.bookValue));
    setText(elements.headCost, formatAmount(totals.cost));
    setText(elements.headDepreciation, formatAmount(totals.depreciation));
    setText(elements.headAccumulated, formatAmount(totals.accumulated));
    setText(elements.headBookValue, formatAmount(totals.bookValue));
  }

  function openAddModal() {
    activateAssetWorkflow('purchase');
    state.activeFormMode = 'purchase';
    elements.form.reset();
    elements.entryId.value = '';
    elements.modalTitle.textContent = isManagedAssetClient() ? 'Beli Aktiva Baru' : 'Tambah Aktiva';
    elements.modalMeta.textContent = isHtiAssetClient()
      ? 'Pilih sumber bank/kas. Mutasi akan ikut masuk Buku Bank/Kas.'
      : 'Penyusutan dihitung otomatis metode garis lurus bulanan.';
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.attachmentNote.textContent = 'Belum ada file tersimpan.';
    renderOptions();
    configureAssetFormMode();
    elements.group.value = 'kelompok-1';
    elements.assetCoa.value = defaultAssetCoa();
    elements.accumulatedCoa.value = defaultAccumulatedCoa(elements.assetCoa.value);
    elements.expenseCoa.value = defaultExpenseCoa(elements.assetCoa.value);
    if (elements.paymentSource) elements.paymentSource.value = defaultPaymentSourceKey();
    updatePreview();
    elements.modal.hidden = false;
    elements.assetType.focus();
  }

  function openOpeningAssetModal() {
    activateAssetWorkflow('opening');
    state.activeFormMode = 'opening';
    elements.form.reset();
    elements.entryId.value = '';
    elements.modalTitle.textContent = 'Saldo Awal Aset Tetap';
    elements.modalMeta.textContent = isHtiAssetClient()
      ? 'Tidak mengurangi bank/kas. Nilainya masuk sebagai saldo awal aktiva tetap.'
      : 'Input rincian aset lama sesuai saldo awal aktiva tetap dan akumulasi penyusutan.';
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.attachmentNote.textContent = 'Belum ada file tersimpan.';
    renderOptions();
    configureAssetFormMode();
    elements.group.value = 'kelompok-1';
    elements.assetCoa.value = defaultAssetCoa();
    elements.accumulatedCoa.value = defaultAccumulatedCoa(elements.assetCoa.value);
    elements.expenseCoa.value = defaultExpenseCoa(elements.assetCoa.value);
    if (elements.openingAccumulated) elements.openingAccumulated.value = '';
    state.openingAccumulatedManual = false;
    refreshOpeningAccumulatedDefault();
    updatePreview();
    elements.modal.hidden = false;
    elements.assetType.focus();
  }

  function openEditModal(entry) {
    state.activeFormMode = entry && entry.entrySource === 'opening_balance' ? 'opening' : 'purchase';
    elements.form.reset();
    elements.entryId.value = entry.id;
    elements.modalTitle.textContent = state.activeFormMode === 'opening' ? 'Ubah Saldo Awal Aset Tetap' : 'Ubah Aktiva';
    elements.modalMeta.textContent = entry.noAktiva;
    elements.assetType.value = text(entry.jenisAktiva);
    elements.description.value = text(entry.keterangan);
    elements.acquisitionDate.value = text(entry.tanggalPerolehan);
    elements.cost.value = formatAmount(entry.hargaPerolehan);
    renderOptions();
    configureAssetFormMode();
    elements.group.value = text(entry.kelompok, 'kelompok-1');
    elements.assetCoa.value = text(entry.coaAktiva, defaultAssetCoa());
    elements.accumulatedCoa.value = text(entry.coaAkumulasi, defaultAccumulatedCoa(elements.assetCoa.value));
    elements.expenseCoa.value = text(entry.coaBiaya, defaultExpenseCoa(elements.assetCoa.value));
    if (elements.paymentSource) {
      const htiSourceValue = isHtiAssetClient() && entry.purchaseSourceType && entry.purchaseSourceKey
        ? entry.purchaseSourceType + ':' + entry.purchaseSourceKey
        : '';
      elements.paymentSource.value = text(htiSourceValue || entry.purchaseSourceKey, defaultPaymentSourceKey());
      if (!elements.paymentSource.value) elements.paymentSource.value = defaultPaymentSourceKey();
    }
    if (elements.openingAccumulated) elements.openingAccumulated.value = formatAmount(entry.openingAccumulatedDepreciation || 0);
    state.openingAccumulatedManual = state.activeFormMode === 'opening';
    elements.notes.value = text(entry.catatan);
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(elements.attachmentFile);
    elements.attachmentNote.textContent = entry.hasAttachment
      ? 'File tersimpan: ' + text(entry.attachmentName, 'lampiran')
      : 'Belum ada file tersimpan.';
    updatePreview();
    elements.modal.hidden = false;
    elements.assetType.focus();
  }

  function closeModal() {
    elements.modal.hidden = true;
    if (isHtiAssetClient()) showAssetList();
  }

  async function submitForm(event) {
    event.preventDefault();
    if (elements.saveButton) elements.saveButton.disabled = true;
    try {
      const payload = {
        jenisAktiva: elements.assetType.value,
        keterangan: elements.description.value,
        tanggalPerolehan: elements.acquisitionDate.value,
        hargaPerolehan: elements.cost.value,
        kelompok: elements.group.value,
        coaAktiva: elements.assetCoa.value,
        coaAkumulasi: elements.accumulatedCoa.value,
        coaBiaya: elements.expenseCoa.value,
        entrySource: state.activeFormMode === 'opening' ? 'opening_balance' : 'purchase',
        openingAccumulatedDepreciation: state.activeFormMode === 'opening' && elements.openingAccumulated ? elements.openingAccumulated.value : '',
        paymentSourceKey: state.activeFormMode !== 'opening' && isManagedAssetClient() && elements.paymentSource ? elements.paymentSource.value : '',
        catatan: elements.notes.value
      };
      const filePayload = await selectedFilePayload(elements.attachmentFile);
      Object.assign(payload, filePayload);
      const entryId = text(elements.entryId.value);
      const method = entryId ? 'PUT' : 'POST';
      const url = entryId ? apiBase() + '/' + encodeURIComponent(entryId) : apiBase();
      const data = await requestJson(url, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!data) return;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      await loadAssets();
      closeModal();
      showAssetList();
      setAlert(state.activeFormMode === 'opening' ? 'Saldo awal aset tetap berhasil disimpan.' : 'Data aktiva berhasil disimpan.', 'success');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan data aktiva.', 'error');
    } finally {
      if (elements.saveButton) elements.saveButton.disabled = false;
    }
  }

  async function deleteEntry(entry) {
    const confirmed = window.clientPortalConfirm
      ? await window.clientPortalConfirm({
        title: 'Hapus aktiva?',
        meta: text(entry.noAktiva, 'Buku Aktiva'),
        message: 'Data aktiva dan mutasi bank/kas otomatisnya akan dihapus.',
        cancelText: 'Batal',
        confirmText: 'Hapus'
      })
      : window.confirm('Hapus data aktiva ' + text(entry.noAktiva) + '?');
    if (!confirmed) return false;
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entry.id), { method: 'DELETE' });
      if (!data) return false;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries.filter(function (item) {
        return item.id !== entry.id;
      });
      await loadAssets();
      setAlert('Data aktiva berhasil dihapus.', 'success');
      return true;
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus data aktiva.', 'error');
      return false;
    }
  }

  function assetChoiceCard(value, title, description) {
    return '<button class="tbb-choice-card" type="button" data-asset-choice="' + escapeHtml(value) + '">' +
      '<span class="tbb-choice-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/></svg></span>' +
      '<span class="tbb-choice-copy"><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(description) + '</small></span>' +
      '<span class="tbb-choice-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></span>' +
    '</button>';
  }

  function ensureAssetChoiceModal() {
    let modal = document.getElementById('assetChoiceModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'assetChoiceModal';
    modal.className = 'portal-modal-backdrop';
    modal.hidden = true;
    const choiceSubtitle = isHtiAssetClient()
      ? 'Penyusutan dihitung otomatis di Buku Besar dan laporan.'
      : 'Pilih transaksi aset tetap.';
    const choiceCards = [
      assetChoiceCard('opening', 'Saldo Awal', 'Input aset lama tanpa mutasi bank/kas.'),
      assetChoiceCard('purchase', 'Beli Aset Baru', 'Tambah aset dan pilih bank/kas pembayaran.'),
      isHtiAssetClient()
        ? ''
        : assetChoiceCard('depreciation', 'Posting Penyusutan', 'Buat jurnal penyusutan sampai tanggal tertentu.'),
      assetChoiceCard('sale', 'Jual Aset Tetap', 'Tutup aset, hitung laba/rugi, dan pilih bank/kas.')
    ].join('');
    modal.innerHTML = [
      '<section class="portal-modal tbb-choice-modal" role="dialog" aria-modal="true" aria-labelledby="assetChoiceTitle">',
        '<header class="portal-modal-header">',
          '<div><h2 id="assetChoiceTitle">Pilih Input Buku Aktiva</h2><span>' + escapeHtml(choiceSubtitle) + '</span></div>',
          '<button class="icon-button" type="button" data-asset-choice-close aria-label="Tutup popup"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
        '</header>',
        '<div class="tbb-choice-grid">',
          choiceCards,
        '</div>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.closest('[data-asset-choice-close]')) {
        closeAssetChoiceModal();
        return;
      }
      const button = event.target.closest('[data-asset-choice]');
      if (!button) return;
      const choice = button.getAttribute('data-asset-choice');
      closeAssetChoiceModal();
      if (choice === 'opening') openOpeningAssetModal();
      if (choice === 'purchase') openAddModal();
      if (choice === 'depreciation') openDepreciationAdjustmentModal();
      if (choice === 'sale') openSellAssetModal();
    });
    return modal;
  }

  function openAssetChoiceModal() {
    ensureAssetChoiceModal().hidden = false;
  }

  function closeAssetChoiceModal() {
    const modal = document.getElementById('assetChoiceModal');
    if (modal) modal.hidden = true;
  }

  function availableAssetEntries() {
    return state.entries.filter(function (entry) {
      return !isSoldAsset(entry);
    });
  }

  function automaticDepreciationEntries() {
    return state.entries.filter(function (entry) {
      return Number(entry.depreciationThisYear || 0) > 0;
    });
  }

  function automaticDepreciationTotal() {
    return automaticDepreciationEntries().reduce(function (sum, entry) {
      return sum + Number(entry.depreciationThisYear || 0);
    }, 0);
  }

  function automaticDepreciationDescription() {
    return 'Penyesuaian penyusutan aktiva ' + (state.reportYear || new Date().getFullYear()) +
      ' sampai ' + formatDisplayDate(state.reportEndDate || today());
  }

  function assetOptionHtml(selectedId) {
    const selected = text(selectedId);
    return availableAssetEntries().map(function (entry) {
      const value = text(entry.id);
      return '<option value="' + escapeHtml(value) + '"' + (value === selected ? ' selected' : '') + '>' +
        escapeHtml([entry.noAktiva, entry.jenisAktiva, entry.keterangan].filter(Boolean).join(' | ')) +
      '</option>';
    }).join('');
  }

  function paymentSourceOptionsHtml(selectedValue) {
    const selected = text(selectedValue, defaultPaymentSourceKey());
    return state.paymentSources.map(function (source) {
      const value = source.value || source.key || '';
      return '<option value="' + escapeHtml(value) + '"' + (value === selected ? ' selected' : '') + '>' +
        escapeHtml(source.label || value) +
      '</option>';
    }).join('');
  }

  function coaOptionsHtml(selectedValue) {
    const selected = text(selectedValue);
    return state.coaAccounts.map(function (account) {
      const value = text(account.coa);
      return '<option value="' + escapeHtml(value) + '"' + (value === selected ? ' selected' : '') + '>' +
        escapeHtml(value + ' - ' + text(account.accountName)) +
      '</option>';
    }).join('');
  }

  function ensureAssetActionModal() {
    let modal = document.getElementById('assetActionModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'assetActionModal';
    modal.className = 'portal-modal-backdrop';
    modal.hidden = true;
    modal.innerHTML = [
      '<section class="portal-modal portal-modal-wide" role="dialog" aria-modal="true" aria-labelledby="assetActionTitle">',
        '<form id="assetActionForm">',
          '<header class="portal-modal-header">',
            '<div><h2 id="assetActionTitle">Buku Aktiva</h2><span id="assetActionMeta">Input transaksi aset tetap.</span></div>',
            '<button class="icon-button" type="button" data-asset-action-close aria-label="Tutup popup"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
          '</header>',
          '<div id="assetActionBody" class="sales-form asset-form"></div>',
          '<footer class="portal-modal-footer">',
            '<button class="ghost-button" type="button" data-asset-action-cancel>Batal</button>',
            '<button class="submit modal-submit" type="submit">Simpan</button>',
          '</footer>',
        '</form>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);
    modal.addEventListener('click', function (event) {
      if (event.target.closest('[data-asset-action-purchase]')) {
        closeAssetActionModal();
        openAddModal();
        return;
      }
      if (event.target === modal || event.target.closest('[data-asset-action-close], [data-asset-action-cancel]')) {
        closeAssetActionModal();
      }
    });
    modal.querySelector('#assetActionForm').addEventListener('submit', submitAssetActionForm);
    modal.addEventListener('input', function (event) {
      if (event.target.matches('[data-asset-sale-amount], [data-asset-sale-id], [data-asset-sale-date]')) updateSaleAssetPreview();
      if (event.target.matches('[data-asset-depreciation-date]')) updateDepreciationPostingPreview();
      if (event.target.matches('[data-rupiah="true"]')) {
        event.target.value = event.target.value.replace(/[^\d.,-]/g, '');
      }
    });
    modal.addEventListener('change', function (event) {
      if (event.target.matches('[data-asset-sale-id], [data-asset-sale-date]')) updateSaleAssetPreview();
      if (event.target.matches('[data-asset-adjust-id]')) syncAdjustmentAssetDefaults();
      if (event.target.matches('[data-asset-depreciation-date]')) updateDepreciationPostingPreview();
    });
    return modal;
  }

  function closeAssetActionModal() {
    const modal = document.getElementById('assetActionModal');
    if (modal) modal.hidden = true;
    if (isHtiAssetClient()) showAssetList();
  }

  function openSellAssetModal(entry) {
    activateAssetWorkflow('sale');
    const rows = availableAssetEntries();
    const modal = ensureAssetActionModal();
    const submitButton = modal.querySelector('button[type="submit"]');
    if (!rows.length) {
      modal.setAttribute('data-action-mode', 'sale-empty');
      modal.querySelector('#assetActionTitle').textContent = 'Jual Aktiva';
      modal.querySelector('#assetActionMeta').textContent = 'Belum ada aktiva aktif yang bisa dijual.';
      modal.querySelector('#assetActionBody').innerHTML = [
        '<div class="sales-form-section compact">',
          '<div class="asset-form-preview">Belum ada aktiva aktif di Buku Aktiva. Tambahkan pembelian aktiva baru dulu, setelah itu aktiva tersebut bisa dipilih untuk dijual.</div>',
          '<button class="submit" type="button" data-asset-action-purchase>Beli Aktiva Baru</button>',
        '</div>'
      ].join('');
      if (submitButton) submitButton.hidden = true;
      modal.hidden = false;
      return;
    }
    const selected = entry && !isSoldAsset(entry) ? entry : rows[0];
    modal.setAttribute('data-action-mode', 'sale');
    if (submitButton) {
      submitButton.hidden = false;
      submitButton.textContent = 'Simpan';
    }
    modal.querySelector('#assetActionTitle').textContent = 'Jual Aktiva';
    modal.querySelector('#assetActionMeta').textContent = 'Kas/bank, akumulasi penyusutan, aktiva, dan laba/rugi akan dibuat otomatis.';
    modal.querySelector('#assetActionBody').innerHTML = [
      '<div class="sales-form-section">',
        '<label class="sales-line"><span>Aset Tetap</span><select data-asset-sale-id required>' + assetOptionHtml(selected.id) + '</select></label>',
        '<label class="sales-line"><span>Tanggal Jual</span><input data-asset-sale-date type="date" value="' + escapeHtml(today()) + '" required></label>',
        '<label class="sales-line"><span>Harga Jual</span><input data-asset-sale-amount data-rupiah="true" inputmode="decimal" required></label>',
        '<label class="sales-line"><span>Jenis Bank/Kas</span><select data-asset-sale-source required>' + paymentSourceOptionsHtml(defaultPaymentSourceKey()) + '</select></label>',
        '<label class="sales-line"><span>Catatan</span><input data-asset-sale-notes autocomplete="off"></label>',
      '</div>',
      '<div class="sales-form-section"><div class="asset-form-preview" data-asset-sale-preview>Isi harga jual untuk melihat estimasi laba/rugi.</div></div>'
    ].join('');
    modal.hidden = false;
    updateSaleAssetPreview();
  }

  function openDepreciationAdjustmentModal(entry) {
    const rows = automaticDepreciationEntries();
    const total = automaticDepreciationTotal();
    const modal = ensureAssetActionModal();
    const submitButton = modal.querySelector('button[type="submit"]');
    const postingDate = state.reportEndDate || today();
    modal.querySelector('#assetActionTitle').textContent = 'Posting Penyusutan';
    if (!rows.length || total <= 0) {
      modal.setAttribute('data-action-mode', 'depreciation-empty');
      modal.querySelector('#assetActionMeta').textContent = 'Belum ada nilai penyusutan yang bisa dijurnal.';
      modal.querySelector('#assetActionBody').innerHTML = [
        '<div class="sales-form-section compact">',
          '<div class="asset-form-preview">Tidak ada aset dengan penyusutan tahun berjalan. Jurnal penyusutan belum perlu dibuat.</div>',
        '</div>'
      ].join('');
      if (submitButton) submitButton.hidden = true;
      modal.hidden = false;
      return;
    }
    modal.setAttribute('data-action-mode', 'depreciation-auto');
    if (submitButton) {
      submitButton.hidden = false;
      submitButton.textContent = isHtiAssetClient() ? 'Posting Penyusutan' : 'Posting ke Memorial';
    }
    modal.querySelector('#assetActionMeta').textContent = 'Sistem menghitung penyusutan periode pada tanggal posting.';
    modal.querySelector('#assetActionBody').innerHTML = [
      '<div class="sales-form-section compact">',
        '<label class="sales-line"><span>Tanggal Posting</span><input data-asset-depreciation-date type="date" value="' + escapeHtml(postingDate) + '" required></label>',
        '<div class="asset-form-preview">',
          'Sistem akan menghitung penyusutan periode tanggal posting, lalu dikurangi penyusutan periode itu yang sudah pernah diposting. ',
          'Jurnal: Dr Beban Penyusutan, Cr Akumulasi Penyusutan.',
        '</div>',
        '<div class="asset-form-preview" data-asset-depreciation-preview></div>',
      '</div>'
    ].join('');
    modal.hidden = false;
    updateDepreciationPostingPreview();
  }

  function updateDepreciationPostingPreview() {
    const modal = document.getElementById('assetActionModal');
    if (!modal || modal.getAttribute('data-action-mode') !== 'depreciation-auto') return;
    const date = modal.querySelector('[data-asset-depreciation-date]')?.value || state.reportEndDate || today();
    const preview = modal.querySelector('[data-asset-depreciation-preview]');
    if (!preview) return;
    preview.textContent = 'Tanggal posting: ' + formatDisplayDate(date) +
      '. Angka final dihitung untuk periode tanggal tersebut, jadi aman untuk posting tengah bulan.';
  }

  function selectedSaleAsset() {
    const modal = document.getElementById('assetActionModal');
    const id = modal && modal.querySelector('[data-asset-sale-id]')?.value;
    return state.entries.find(function (entry) { return entry.id === id; }) || null;
  }

  function roundAmount(value) {
    return Math.round((Number(value || 0)) * 100) / 100;
  }

  function parseIsoDateParts(value) {
    const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (!match) return null;
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3])
    };
  }

  function monthIndex(parts) {
    return Number(parts.year || 0) * 12 + Number(parts.month || 1) - 1;
  }

  function estimatedAssetAccumulatedAt(asset, targetDate) {
    const targetParts = parseIsoDateParts(targetDate);
    const acquisitionParts = parseIsoDateParts(asset && asset.tanggalPerolehan);
    if (!asset || !targetParts || !acquisitionParts) return Number(asset && asset.accumulatedDepreciation || 0);
    const cost = roundAmount(asset.hargaPerolehan);
    if (cost <= 0) return 0;
    const group = state.depreciationGroups.find(function (item) {
      return item.key === asset.kelompok;
    }) || {};
    const usefulLifeMonths = Math.max(1, Number(asset.masaManfaatBulan || group.usefulLifeMonths || 1));
    const monthly = roundAmount(cost / usefulLifeMonths);
    const isOpening = text(asset.entrySource) === 'opening_balance' || asset.isOpeningAsset === true;
    let accumulated = isOpening
      ? Math.max(0, Math.min(cost, roundAmount(asset.openingAccumulatedDepreciation || 0)))
      : 0;
    const openingParts = parseIsoDateParts(state.openingBalanceDate) || { year: 2026, month: 1 };
    const openingStartIndex = monthIndex(openingParts);
    const startIndex = monthIndex(acquisitionParts);
    const depreciationStartIndex = isOpening ? Math.max(startIndex, openingStartIndex) : startIndex;
    const endIndex = monthIndex(targetParts);
    const elapsedBeforeOpening = isOpening
      ? Math.max(0, Math.min(usefulLifeMonths, openingStartIndex - startIndex))
      : 0;
    let remainingMonths = isOpening ? Math.max(0, usefulLifeMonths - elapsedBeforeOpening) : usefulLifeMonths;
    if (isOpening && cost > accumulated && remainingMonths === 0) remainingMonths = 1;
    const remainingAmount = Math.max(0, roundAmount(cost - accumulated));
    const futureMonthly = isOpening && remainingMonths > 0
      ? roundAmount(remainingAmount / remainingMonths)
      : monthly;

    for (let offset = 0; offset < remainingMonths; offset += 1) {
      const currentIndex = isOpening
        ? depreciationStartIndex + offset
        : startIndex + offset;
      if (currentIndex > endIndex) break;
      const isLastMonth = offset === remainingMonths - 1;
      let amount = isLastMonth
        ? roundAmount(cost - accumulated)
        : futureMonthly;
      amount = Math.max(0, Math.min(amount, roundAmount(cost - accumulated)));
      accumulated = roundAmount(accumulated + amount);
      if (accumulated >= cost) break;
    }
    return accumulated;
  }

  function updateSaleAssetPreview() {
    const modal = document.getElementById('assetActionModal');
    if (!modal || modal.getAttribute('data-action-mode') !== 'sale') return;
    const asset = selectedSaleAsset();
    const amount = parseAmount(modal.querySelector('[data-asset-sale-amount]')?.value || '');
    const saleDate = modal.querySelector('[data-asset-sale-date]')?.value || today();
    const preview = modal.querySelector('[data-asset-sale-preview]');
    if (!preview || !asset) return;
    const acquisitionDate = text(asset.tanggalPerolehan);
    if (saleDate && acquisitionDate && saleDate < acquisitionDate) {
      preview.textContent = 'Tanggal jual tidak boleh lebih awal dari tanggal perolehan aset.';
      return;
    }
    const accumulated = estimatedAssetAccumulatedAt(asset, saleDate);
    const cost = Number(asset.hargaPerolehan || 0);
    const diff = Math.round((amount + accumulated - cost) * 100) / 100;
    const label = diff >= 0 ? 'Laba penjualan aktiva' : 'Rugi penjualan aktiva';
    preview.textContent = 'Harga perolehan Rp ' + formatAmount(cost) +
      ' | Akumulasi Rp ' + formatAmount(accumulated) +
      ' | Nilai buku Rp ' + formatAmount(Math.max(0, cost - accumulated)) +
      ' | ' + label + ' Rp ' + formatAmount(Math.abs(diff));
  }

  function syncAdjustmentAssetDefaults() {
    const modal = document.getElementById('assetActionModal');
    if (!modal) return;
    const id = modal.querySelector('[data-asset-adjust-id]')?.value || '';
    const asset = state.entries.find(function (entry) { return entry.id === id; });
    if (!asset) return;
    modal.querySelector('[data-asset-adjust-old-accumulated]').value = asset.coaAkumulasi || defaultAccumulatedCoa(asset.coaAktiva);
    modal.querySelector('[data-asset-adjust-old-expense]').value = asset.coaBiaya || defaultExpenseCoa(asset.coaAktiva);
    modal.querySelector('[data-asset-adjust-new-expense]').value = asset.coaBiaya || defaultExpenseCoa(asset.coaAktiva);
    modal.querySelector('[data-asset-adjust-new-accumulated]').value = asset.coaAkumulasi || defaultAccumulatedCoa(asset.coaAktiva);
    modal.querySelector('[data-asset-adjust-notes]').value = ['Sesuaikan penyusutan', asset.jenisAktiva, asset.keterangan].filter(Boolean).join(' | ');
  }

  async function submitAssetActionForm(event) {
    event.preventDefault();
    const modal = ensureAssetActionModal();
    const mode = modal.getAttribute('data-action-mode');
    const submitButton = modal.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;
    setAlert('');
    try {
      if (mode === 'sale-empty') return;
      if (mode === 'depreciation-empty') return;
      if (mode === 'sale') await submitSellAsset(modal);
      if (mode === 'depreciation-auto') await submitDepreciationAdjustment(modal);
      closeAssetActionModal();
      applySearch();
    } catch (err) {
      setAlert(err.message || 'Transaksi aktiva gagal disimpan.', 'error');
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }

  async function submitSellAsset(modal) {
    const assetId = modal.querySelector('[data-asset-sale-id]')?.value || '';
    const data = await requestJson(apiBase() + '/' + encodeURIComponent(assetId) + '/sell', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tanggalJual: modal.querySelector('[data-asset-sale-date]')?.value || '',
        nilaiJual: modal.querySelector('[data-asset-sale-amount]')?.value || '',
        paymentSourceKey: modal.querySelector('[data-asset-sale-source]')?.value || '',
        catatanJual: modal.querySelector('[data-asset-sale-notes]')?.value || ''
      })
    });
    state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
    showAssetList();
    setAlert('Penjualan aset tetap tersimpan.', 'success');
  }

  async function submitDepreciationAdjustment(modal) {
    const data = await requestJson(apiBase() + '/adjust-depreciation', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        otomatis: true,
        tanggal: modal.querySelector('[data-asset-depreciation-date]')?.value || state.reportEndDate || today()
      })
    });
    state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
    const posting = data.depreciationPosting || {};
    setAlert(
      'Jurnal Memorial penyusutan dibuat: Rp ' + formatAmount(posting.total || 0) +
      ' untuk ' + (posting.lineCount || 0) + ' aset.',
      'success'
    );
  }

  async function openFileViewer(entry) {
    if (!entry || !entry.hasAttachment) {
      setAlert('Belum ada file ter-upload untuk aktiva ini.', 'info');
      return;
    }
    elements.fileModal.hidden = false;
    setText(elements.fileTitle, text(entry.attachmentName, 'Lihat File'));
    setText(elements.fileMeta, 'Memuat file...');
    clearNode(elements.fileViewer);
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entry.id) + '/file');
      if (!data || !data.file) return;
      renderFile(data);
    } catch (err) {
      setText(elements.fileMeta, err.message || 'Gagal memuat file.');
    }
  }

  function renderFile(file) {
    if (window.clientPortalRenderAttachmentViewer) {
      window.clientPortalRenderAttachmentViewer(elements.fileViewer, file, {
        titleEl: elements.fileTitle,
        metaEl: elements.fileMeta,
        label: 'Lihat File'
      });
      return;
    }
    clearNode(elements.fileViewer);
    const dataUrl = text(file.dataUrl);
    const mimeType = text(file.mimeType);
    if (mimeType.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.alt = text(file.name, 'Lampiran aktiva');
      elements.fileViewer.appendChild(img);
      return;
    }
    const frame = document.createElement('iframe');
    frame.src = dataUrl;
    frame.title = text(file.name, 'Lampiran aktiva');
    elements.fileViewer.appendChild(frame);
  }

  function closeFileModal() {
    elements.fileModal.hidden = true;
    clearNode(elements.fileViewer);
  }

  function selectedFilePayload(input) {
    if (window.clientPortalBuildAttachmentPayload) {
      return window.clientPortalBuildAttachmentPayload(input);
    }
    const file = input && input.files && input.files[0];
    if (!file) return Promise.resolve({});
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve({
          attachmentName: file.name,
          attachmentMimeType: file.type || 'application/octet-stream',
          attachmentSize: file.size || 0,
          attachmentDataUrl: reader.result
        });
      };
      reader.onerror = function () {
        reject(new Error('File tidak bisa dibaca.'));
      };
      reader.readAsDataURL(file);
    });
  }

  function updatePreview() {
    const group = state.depreciationGroups.find(function (item) {
      return item.key === elements.group.value;
    });
    const cost = parseAmount(elements.cost.value);
    if (!group || !cost) {
      elements.preview.textContent = 'Tarif dan jurnal akan dihitung otomatis setelah data diisi.';
      return;
    }
    const monthly = cost / Number(group.usefulLifeMonths || 1);
    if (state.activeFormMode === 'opening') {
      const openingAccumulated = parseAmount(elements.openingAccumulated && elements.openingAccumulated.value);
      const bookValue = Math.max(0, cost - openingAccumulated);
      const openingDate = formatDisplayDate(state.openingBalanceDate || '2026-01-01');
      const acquisitionParts = parseIsoDateParts(elements.acquisitionDate && elements.acquisitionDate.value);
      const openingParts = parseIsoDateParts(state.openingBalanceDate);
      const elapsedMonths = acquisitionParts && openingParts
        ? Math.max(0, Math.min(Number(group.usefulLifeMonths || 1), monthIndex(openingParts) - monthIndex(acquisitionParts)))
        : 0;
      let remainingMonths = Math.max(0, Number(group.usefulLifeMonths || 1) - elapsedMonths);
      if (bookValue > 0 && remainingMonths === 0) remainingMonths = 1;
      const futureMonthly = remainingMonths > 0 ? bookValue / remainingMonths : 0;
      elements.preview.textContent = 'Nilai buku awal Rp ' + formatAmount(bookValue) +
        ' per ' + openingDate + ' | Penyusutan berikutnya sekitar Rp ' + formatAmount(futureMonthly) +
        ' per bulan selama ' + remainingMonths + ' bulan' +
        ' | Cocokkan totalnya dengan ringkasan saldo awal di atas.';
      return;
    }
    elements.preview.textContent = 'Golongan ' + group.code + ' | Masa manfaat ' + group.usefulLifeYears + ' tahun | Tarif ' + group.annualRate + '% | Penyusutan bulanan sekitar Rp ' + formatAmount(monthly) + '.';
  }

  function calculateOpeningAccumulatedDefault() {
    if (state.activeFormMode !== 'opening') return 0;
    const group = state.depreciationGroups.find(function (item) {
      return item.key === elements.group.value;
    });
    const acquisitionParts = parseIsoDateParts(elements.acquisitionDate && elements.acquisitionDate.value);
    const openingParts = parseIsoDateParts(state.openingBalanceDate);
    const cost = parseAmount(elements.cost && elements.cost.value);
    if (!group || !acquisitionParts || !openingParts || cost <= 0) return 0;
    const usefulLifeMonths = Math.max(1, Number(group.usefulLifeMonths || 1));
    const elapsedMonths = Math.max(0, Math.min(
      usefulLifeMonths,
      monthIndex(openingParts) - monthIndex(acquisitionParts)
    ));
    if (elapsedMonths <= 0) return 0;
    if (elapsedMonths >= usefulLifeMonths) return roundAmount(cost);
    return roundAmount(cost * (elapsedMonths / usefulLifeMonths));
  }

  function refreshOpeningAccumulatedDefault(force) {
    if (state.activeFormMode !== 'opening' || !elements.openingAccumulated) return;
    if (!force && state.openingAccumulatedManual) return;
    const amount = calculateOpeningAccumulatedDefault();
    elements.openingAccumulated.value = amount > 0 ? formatAmount(amount) : '';
    state.openingAccumulatedManual = false;
    if (elements.openingAccumulatedHint) {
      const openingDate = formatDisplayDate(state.openingBalanceDate || '2026-01-01');
      elements.openingAccumulatedHint.textContent = 'Otomatis sampai ' + openingDate + '. Nilai tetap bisa dikoreksi manual.';
    }
    updatePreview();
  }

  function formatDisplayDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '-' + match[2] + '-' + match[1] : raw;
  }

  function formatAmount(value) {
    const number = Number(value || 0);
    return currency.format(number);
  }

  function formatRate(value) {
    const number = Number(value || 0);
    return number ? String(number).replace('.', ',') + '%' : '';
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

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadAssets);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.addButton) {
    elements.addButton.addEventListener('click', function () {
      if (usesAssetChoiceModal()) openAssetChoiceModal();
      else openAddModal();
    });
  }
  if (elements.openingButton) elements.openingButton.addEventListener('click', openOpeningAssetModal);
  if (elements.purchaseButton) elements.purchaseButton.addEventListener('click', openAddModal);
  if (elements.saleButton) elements.saleButton.addEventListener('click', function () {
    openSellAssetModal();
  });
  if (elements.listButton) {
    elements.listButton.addEventListener('click', function () {
      showAssetList({ scroll: true, focusSearch: true });
    });
  }
  if (elements.depreciationButton) elements.depreciationButton.addEventListener('click', function () {
    openDepreciationAdjustmentModal();
  });
  if (elements.closeButton) elements.closeButton.addEventListener('click', closeModal);
  if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeModal);
  if (elements.form) elements.form.addEventListener('submit', submitForm);
  if (elements.searchInput) elements.searchInput.addEventListener('input', applySearch);
  if (elements.group) elements.group.addEventListener('change', function () {
    refreshOpeningAccumulatedDefault();
    updatePreview();
  });
  if (elements.acquisitionDate) elements.acquisitionDate.addEventListener('change', function () {
    refreshOpeningAccumulatedDefault();
    updatePreview();
  });
  if (elements.cost) elements.cost.addEventListener('input', function () {
    refreshOpeningAccumulatedDefault();
    updatePreview();
  });
  if (elements.openingAccumulated) elements.openingAccumulated.addEventListener('input', function () {
    state.openingAccumulatedManual = text(elements.openingAccumulated.value) !== '';
    updatePreview();
  });
  if (elements.openingAccumulatedAutoButton) elements.openingAccumulatedAutoButton.addEventListener('click', function () {
    refreshOpeningAccumulatedDefault(true);
  });
  if (elements.assetCoa) {
    elements.assetCoa.addEventListener('change', function () {
      if (!elements.accumulatedCoa.value || isManagedAssetClient()) elements.accumulatedCoa.value = defaultAccumulatedCoa(elements.assetCoa.value);
      if (!elements.expenseCoa.value || isManagedAssetClient()) elements.expenseCoa.value = defaultExpenseCoa(elements.assetCoa.value);
      renderOpeningAssetSummary();
    });
  }
  if (elements.fileCloseButton) elements.fileCloseButton.addEventListener('click', closeFileModal);
  if (elements.detailCloseButton) elements.detailCloseButton.addEventListener('click', closeAssetDetailModal);
  if (elements.detailCancelButton) elements.detailCancelButton.addEventListener('click', closeAssetDetailModal);
  if (elements.detailFileButton) {
    elements.detailFileButton.addEventListener('click', withDetailEntry(function (entry) {
      closeAssetDetailModal();
      openFileViewer(entry);
    }));
  }
  if (elements.detailSellButton) {
    elements.detailSellButton.addEventListener('click', withDetailEntry(function (entry) {
      closeAssetDetailModal();
      openSellAssetModal(entry);
    }));
  }
  if (elements.detailEditButton) {
    elements.detailEditButton.addEventListener('click', withDetailEntry(function (entry) {
      closeAssetDetailModal();
      openEditModal(entry);
    }));
  }
  if (elements.detailDeleteButton) {
    elements.detailDeleteButton.addEventListener('click', withDetailEntry(async function (entry) {
      const deleted = await deleteEntry(entry);
      if (deleted) closeAssetDetailModal();
    }));
  }
  if (elements.attachmentPickButton && elements.attachmentFile) {
    elements.attachmentPickButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      elements.attachmentFile.click();
    });
  }
  if (elements.attachmentFile) {
    elements.attachmentFile.addEventListener('change', function () {
      const files = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.attachmentFile) : [];
      elements.attachmentNote.textContent = window.clientPortalFormatFilesNote
        ? window.clientPortalFormatFilesNote(files, 'File baru')
        : (files.length ? 'File baru: ' + files.length + ' file' : 'Belum ada file tersimpan.');
    });
    elements.attachmentFile.addEventListener('client-portal-upload-files', function () {
      const files = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(elements.attachmentFile) : [];
      elements.attachmentNote.textContent = window.clientPortalFormatFilesNote
        ? window.clientPortalFormatFilesNote(files, 'File dari HP')
        : (files.length ? 'File dari HP: ' + files.length + ' file' : 'Belum ada file tersimpan.');
    });
  }

  loadAssets();
})();
