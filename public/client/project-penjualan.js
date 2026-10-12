(function () {
  const INITIAL_ROWS = 40;
  const ADD_ROWS = 20;
  const INITIAL_COLS = 14;
  const ADD_COLS = 1;
  const ROW_HEADER_WIDTH = 34;
  const DEFAULT_COL_WIDTH = 112;
  const ACTION_COL_WIDTH = 126;
  const MIN_COL_WIDTH = 72;
  const MAX_COL_WIDTH = 360;
  const VERSION = 'v1';
  const FORMULA_FUNCTIONS = ['SUM', 'AVERAGE', 'AVG', 'MIN', 'MAX', 'COUNT'];
  let uploadModal = null;
  let gridActionMenu = null;

  const state = {
    client: null,
    rows: INITIAL_ROWS,
    cols: INITIAL_COLS,
    grid: [],
    headers: [],
    colWidths: [],
    rowFiles: {},
    uploadRow: null,
    compactHeader: false,
    editingHeaders: false,
    formulaTarget: null,
    pendingFormulaRange: null,
    saveTimer: null,
    loading: false
  };

  const elements = {
    alert: document.getElementById('projectSalesAlert'),
    clientMeta: document.getElementById('projectSalesClientMeta'),
    userName: document.getElementById('projectSalesUserName'),
    userEmail: document.getElementById('projectSalesUserEmail'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    refreshButton: document.getElementById('projectSalesRefreshBtn'),
    backLink: document.getElementById('projectSalesBackLink'),
    subtitle: document.getElementById('projectSalesSubtitle'),
    meta: document.getElementById('projectSalesSheetMeta'),
    compactButton: document.getElementById('projectSalesCompactBtn'),
    editHeadersButton: document.getElementById('projectSalesEditHeadersBtn'),
    clearButton: document.getElementById('projectSalesClearBtn'),
    sheetWrap: document.getElementById('projectSalesSheetWrap'),
    head: document.getElementById('projectSalesSheetHead'),
    body: document.getElementById('projectSalesSheetBody')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/project-penjualan/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function storageKey() {
    return 'clientPortal:projectPenjualan:' + clientIdFromPath() + ':rekapPembelian:' + VERSION;
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

  function rowFilePayload(row) {
    return state.rowFiles && state.rowFiles[String(row)] ? state.rowFiles[String(row)] : null;
  }

  function rowFiles(row) {
    const payload = rowFilePayload(row);
    if (!payload) return [];
    if (window.clientPortalFilesFromResponse) return window.clientPortalFilesFromResponse(payload);
    return payload.attachmentDataUrl ? [{ name: payload.attachmentName || 'lampiran', dataUrl: payload.attachmentDataUrl }] : [];
  }

  function rowFileCount(row) {
    return rowFiles(row).length;
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Project Penjualan.');
    return data;
  }

  async function loadPage() {
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
      renderClient();
      loadLocalSheet();
      renderSheet();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Project Penjualan.', 'error');
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
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.subtitle, text(client.name, 'Klien') + ' | Rekap pembelian project');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
  }

  function loadLocalSheet() {
    let saved = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(storageKey()) || 'null');
    } catch {
      saved = null;
    }
    const savedRows = Number(saved?.rows || 0);
    const savedGrid = Array.isArray(saved?.grid) ? saved.grid : [];
    const savedHeaders = Array.isArray(saved?.headers) ? saved.headers : [];
    const savedWidths = Array.isArray(saved?.colWidths) ? saved.colWidths : [];
    const savedCols = Number(saved?.cols || 0);
    const longestRow = savedGrid.reduce(function (max, row) {
      return Math.max(max, Array.isArray(row) ? row.length : 0);
    }, 0);
    state.rows = Math.max(INITIAL_ROWS, savedRows, savedGrid.length);
    state.cols = Math.max(INITIAL_COLS, savedCols, longestRow, savedHeaders.length, savedWidths.length);
    state.grid = normalizeGrid(savedGrid, state.rows);
    state.headers = normalizeHeaders(savedHeaders);
    state.colWidths = normalizeWidths(savedWidths);
    state.rowFiles = saved && saved.rowFiles && typeof saved.rowFiles === 'object' ? saved.rowFiles : {};
    state.compactHeader = saved?.compactHeader === true;
    renderCompactState();
  }

  function normalizeGrid(grid, rows) {
    const output = [];
    for (let row = 0; row < rows; row += 1) {
      const sourceRow = Array.isArray(grid[row]) ? grid[row] : [];
      const cells = [];
      for (let col = 0; col < state.cols; col += 1) {
        cells.push(text(sourceRow[col]));
      }
      output.push(cells);
    }
    return output;
  }

  function normalizeHeaders(headers) {
    const output = [];
    for (let col = 0; col < state.cols; col += 1) {
      output.push(text(headers[col], columnLabel(col)));
    }
    return output;
  }

  function normalizeWidths(widths) {
    const output = [];
    for (let col = 0; col < state.cols; col += 1) {
      const saved = Number(widths[col] || 0);
      output.push(clampWidth(saved || DEFAULT_COL_WIDTH));
    }
    return output;
  }

  function saveLocalSheet() {
    try {
      window.localStorage.setItem(storageKey(), JSON.stringify({
        rows: state.rows,
        cols: state.cols,
        grid: state.grid,
        headers: state.headers,
        colWidths: state.colWidths,
        rowFiles: state.rowFiles,
        compactHeader: state.compactHeader,
        updatedAt: new Date().toISOString()
      }));
    } catch (err) {
      setAlert('Data lokal belum bisa disimpan: ' + (err.message || 'storage penuh'), 'error');
    }
  }

  function scheduleSave() {
    if (state.saveTimer) window.clearTimeout(state.saveTimer);
    state.saveTimer = window.setTimeout(function () {
      state.saveTimer = null;
      saveLocalSheet();
      renderMeta();
    }, 250);
  }

  function renderSheet() {
    renderHead();
    renderBody();
    renderMeta();
  }

  function renderHead() {
    clearNode(elements.head);
    const tr = document.createElement('tr');
    const corner = document.createElement('th');
    corner.className = 'project-sales-row-head project-sales-corner';
    applyRowHeadWidth(corner);
    tr.appendChild(corner);
    for (let col = 0; col < state.cols; col += 1) {
      const th = document.createElement('th');
      th.className = 'project-sales-col-head';
      th.dataset.col = String(col);
      th.tabIndex = 0;
      th.title = 'Klik untuk tambah atau hapus kolom';
      applyColumnWidthToElement(th, col);
      th.addEventListener('click', handleColumnHeadClick);
      th.addEventListener('keydown', handleColumnHeadKeydown);

      const title = document.createElement('span');
      title.className = 'project-sales-col-title';
      title.contentEditable = state.editingHeaders ? 'true' : 'false';
      title.spellcheck = false;
      title.dataset.col = String(col);
      title.textContent = state.headers[col] || columnLabel(col);
      title.addEventListener('input', updateHeaderFromDom);
      title.addEventListener('blur', normalizeHeaderTitle);
      title.addEventListener('keydown', handleHeaderKeydown);
      title.addEventListener('paste', pasteHeaderTitle);
      th.appendChild(title);

      const resize = document.createElement('span');
      resize.className = 'project-sales-col-resize';
      resize.dataset.col = String(col);
      resize.setAttribute('aria-hidden', 'true');
      resize.addEventListener('pointerdown', startColumnResize);
      th.appendChild(resize);
      tr.appendChild(th);
    }
    const actionTh = document.createElement('th');
    actionTh.className = 'project-sales-action-head';
    actionTh.textContent = 'Aksi';
    applyActionWidth(actionTh);
    tr.appendChild(actionTh);
    elements.head.appendChild(tr);
    renderHeaderEditState();
  }

  function renderBody() {
    clearNode(elements.body);
    for (let row = 0; row < state.rows; row += 1) {
      const tr = document.createElement('tr');
      const head = document.createElement('th');
      head.className = 'project-sales-row-head';
      head.dataset.row = String(row);
      head.tabIndex = 0;
      head.title = 'Klik untuk tambah atau hapus baris';
      applyRowHeadWidth(head);
      head.textContent = String(row + 1);
      head.addEventListener('click', handleRowHeadClick);
      head.addEventListener('keydown', handleRowHeadKeydown);
      tr.appendChild(head);
      for (let col = 0; col < state.cols; col += 1) {
        tr.appendChild(cell(row, col));
      }
      tr.appendChild(actionCell(row));
      elements.body.appendChild(tr);
    }
    if (window.clientPortalEnhanceUploadInputs) window.clientPortalEnhanceUploadInputs();
  }

  function cell(row, col) {
    const td = document.createElement('td');
    td.className = 'project-sales-cell';
    if (isFormulaText(state.grid[row]?.[col])) td.classList.add('formula-cell');
    td.contentEditable = 'true';
    td.spellcheck = false;
    td.dataset.row = String(row);
    td.dataset.col = String(col);
    applyColumnWidthToElement(td, col);
    td.textContent = displayCellValue(row, col);
    td.title = isFormulaText(state.grid[row]?.[col]) ? state.grid[row][col] : '';
    td.addEventListener('pointerdown', maybeInsertFormulaReference);
    td.addEventListener('focus', selectCell);
    td.addEventListener('input', updateCellFromDom);
    td.addEventListener('blur', finalizeCellEdit);
    td.addEventListener('paste', pasteCells);
    td.addEventListener('keydown', handleCellKeydown);
    return td;
  }

  function actionCell(row) {
    const td = document.createElement('td');
    td.className = 'project-sales-action-cell';
    applyActionWidth(td);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'project-sales-row-upload-button';
    const count = rowFileCount(row);
    button.textContent = count ? 'File (' + count + ')' : 'Upload';
    button.title = count ? count + ' file tersimpan untuk baris ' + (row + 1) : 'Upload file untuk baris ' + (row + 1);
    button.addEventListener('click', function () {
      openRowUpload(row);
    });
    td.appendChild(button);
    return td;
  }

  function handleColumnHeadClick(event) {
    if (event.target.closest('.project-sales-col-resize')) return;
    if (state.editingHeaders && event.target.closest('.project-sales-col-title')) return;
    const col = Number(event.currentTarget.dataset.col);
    if (!Number.isFinite(col)) return;
    openGridActionMenu(event.currentTarget, 'column', col);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleColumnHeadKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const col = Number(event.currentTarget.dataset.col);
    if (!Number.isFinite(col)) return;
    openGridActionMenu(event.currentTarget, 'column', col);
    event.preventDefault();
  }

  function handleRowHeadClick(event) {
    if (event.currentTarget.classList.contains('project-sales-corner')) return;
    const row = Number(event.currentTarget.dataset.row);
    if (!Number.isFinite(row)) return;
    openGridActionMenu(event.currentTarget, 'row', row);
    event.preventDefault();
    event.stopPropagation();
  }

  function handleRowHeadKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = Number(event.currentTarget.dataset.row);
    if (!Number.isFinite(row)) return;
    openGridActionMenu(event.currentTarget, 'row', row);
    event.preventDefault();
  }

  function ensureGridActionMenu() {
    if (gridActionMenu) return gridActionMenu;
    const root = document.createElement('div');
    root.className = 'project-sales-structure-menu';
    root.hidden = true;
    root.innerHTML = [
      '<p class="project-sales-structure-title"></p>',
      '<button type="button" class="project-sales-structure-add"></button>',
      '<button type="button" class="project-sales-structure-delete"></button>'
    ].join('');
    document.body.appendChild(root);
    gridActionMenu = {
      root,
      title: root.querySelector('.project-sales-structure-title'),
      addButton: root.querySelector('.project-sales-structure-add'),
      deleteButton: root.querySelector('.project-sales-structure-delete'),
      context: null
    };
    gridActionMenu.addButton.addEventListener('click', addStructureFromMenu);
    gridActionMenu.deleteButton.addEventListener('click', deleteStructureFromMenu);
    return gridActionMenu;
  }

  function openGridActionMenu(anchor, type, index) {
    const menu = ensureGridActionMenu();
    const isColumn = type === 'column';
    const label = isColumn ? text(state.headers[index], columnLabel(index)) : String(index + 1);
    menu.context = { type, index };
    menu.title.textContent = (isColumn ? 'Kolom ' : 'Baris ') + label;
    menu.addButton.textContent = isColumn ? 'Tambah Kolom' : 'Tambah Baris';
    menu.deleteButton.textContent = isColumn ? 'Hapus Kolom' : 'Hapus Baris';
    menu.root.hidden = false;
    menu.root.style.visibility = 'hidden';
    const rect = anchor.getBoundingClientRect();
    const width = menu.root.offsetWidth || 172;
    const height = menu.root.offsetHeight || 116;
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const maxTop = Math.max(8, window.innerHeight - height - 8);
    const left = Math.min(Math.max(8, rect.left), maxLeft);
    let top = rect.bottom + 6;
    if (top > maxTop && rect.top - height - 6 > 8) top = rect.top - height - 6;
    top = Math.min(Math.max(8, top), maxTop);
    menu.root.style.left = left + 'px';
    menu.root.style.top = top + 'px';
    menu.root.style.visibility = '';
  }

  function closeGridActionMenu() {
    if (!gridActionMenu) return;
    gridActionMenu.root.hidden = true;
    gridActionMenu.context = null;
  }

  function addStructureFromMenu() {
    const context = gridActionMenu?.context;
    if (!context) return;
    closeGridActionMenu();
    if (context.type === 'column') {
      insertColumn(context.index + 1);
      return;
    }
    insertRow(context.index + 1);
  }

  function deleteStructureFromMenu() {
    const context = gridActionMenu?.context;
    if (!context) return;
    closeGridActionMenu();
    if (context.type === 'column') {
      deleteColumn(context.index);
      return;
    }
    deleteRow(context.index);
  }

  function handleDocumentPointerDown(event) {
    if (!gridActionMenu || gridActionMenu.root.hidden) return;
    if (gridActionMenu.root.contains(event.target)) return;
    if (event.target.closest('.project-sales-col-head, .project-sales-row-head')) return;
    closeGridActionMenu();
  }

  function handleDocumentKeydown(event) {
    if (event.key === 'Escape') closeGridActionMenu();
  }

  function ensureUploadModal() {
    if (uploadModal) return uploadModal;
    const backdrop = document.createElement('div');
    backdrop.className = 'project-sales-upload-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = [
      '<section class="project-sales-upload-modal" role="dialog" aria-modal="true" aria-labelledby="projectSalesUploadTitle">',
      '<header class="project-sales-upload-header">',
      '<div><h2 id="projectSalesUploadTitle">Upload File Baris</h2><span id="projectSalesUploadMeta">Bisa pilih banyak file atau upload via QR HP.</span></div>',
      '<button type="button" class="icon-button" data-project-sales-upload-close aria-label="Tutup upload file"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
      '</header>',
      '<div class="project-sales-upload-body">',
      '<label class="project-sales-upload-field"><span>Pilih File</span><input id="projectRowAttachmentFile" type="file" multiple></label>',
      '<small class="cashbook-file-note" id="projectSalesUploadNote">Belum ada file dipilih.</small>',
      '<div class="project-sales-upload-preview" id="projectSalesUploadPreview"></div>',
      '</div>',
      '<footer class="project-sales-upload-footer">',
      '<button type="button" class="ghost-button danger-lite" id="projectSalesRemoveFilesBtn">Hapus File Baris</button>',
      '<div class="project-sales-upload-footer-actions">',
      '<button type="button" class="ghost-button" data-project-sales-upload-close>Batal</button>',
      '<button type="button" class="danger-button" id="projectSalesSaveFilesBtn">Simpan File</button>',
      '</div>',
      '</footer>',
      '</section>'
    ].join('');
    document.body.appendChild(backdrop);
    uploadModal = {
      backdrop,
      title: backdrop.querySelector('#projectSalesUploadTitle'),
      meta: backdrop.querySelector('#projectSalesUploadMeta'),
      input: backdrop.querySelector('#projectRowAttachmentFile'),
      note: backdrop.querySelector('#projectSalesUploadNote'),
      preview: backdrop.querySelector('#projectSalesUploadPreview'),
      removeButton: backdrop.querySelector('#projectSalesRemoveFilesBtn'),
      saveButton: backdrop.querySelector('#projectSalesSaveFilesBtn')
    };
    Array.from(backdrop.querySelectorAll('[data-project-sales-upload-close]')).forEach(function (button) {
      button.addEventListener('click', closeRowUpload);
    });
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) closeRowUpload();
    });
    uploadModal.input.addEventListener('change', updateUploadNote);
    uploadModal.input.addEventListener('client-portal-upload-files', updateUploadNote);
    uploadModal.saveButton.addEventListener('click', saveRowUpload);
    uploadModal.removeButton.addEventListener('click', removeRowFiles);
    if (window.clientPortalEnhanceUploadInputs) window.clientPortalEnhanceUploadInputs();
    return uploadModal;
  }

  function openRowUpload(row) {
    const modal = ensureUploadModal();
    state.uploadRow = row;
    modal.title.textContent = 'Upload File Baris ' + (row + 1);
    modal.meta.textContent = 'Pilih banyak file dari komputer atau scan QR lewat HP.';
    modal.note.textContent = 'Belum ada file dipilih.';
    if (window.clientPortalClearUploadSelection) window.clientPortalClearUploadSelection(modal.input);
    renderUploadPreview(row);
    modal.backdrop.hidden = false;
  }

  function closeRowUpload() {
    if (uploadModal) uploadModal.backdrop.hidden = true;
    state.uploadRow = null;
  }

  function updateUploadNote() {
    const modal = ensureUploadModal();
    const files = window.clientPortalSelectedFiles ? window.clientPortalSelectedFiles(modal.input) : Array.from(modal.input.files || []);
    if (window.clientPortalFormatFilesNote) {
      modal.note.textContent = window.clientPortalFormatFilesNote(files, files.length ? 'File dipilih' : 'File dipilih');
      return;
    }
    modal.note.textContent = files.length ? files.length + ' file dipilih.' : 'Belum ada file dipilih.';
  }

  async function saveRowUpload() {
    const modal = ensureUploadModal();
    const row = state.uploadRow;
    if (row == null) return;
    if (!window.clientPortalBuildAttachmentPayload) {
      setAlert('Helper upload file belum siap. Coba refresh halaman.', 'error');
      return;
    }
    modal.saveButton.disabled = true;
    try {
      const payload = await window.clientPortalBuildAttachmentPayload(modal.input);
      if (!payload.attachmentDataUrl) {
        setAlert('Pilih file dulu sebelum menyimpan.', 'error');
        window.setTimeout(function () { setAlert(''); }, 2500);
        return;
      }
      state.rowFiles[String(row)] = payload;
      saveLocalSheet();
      renderBody();
      closeRowUpload();
      setAlert('File baris ' + (row + 1) + ' tersimpan.', 'info');
      window.setTimeout(function () { setAlert(''); }, 2500);
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan file baris.', 'error');
    } finally {
      modal.saveButton.disabled = false;
    }
  }

  function removeRowFiles() {
    const row = state.uploadRow;
    if (row == null || !state.rowFiles[String(row)]) return;
    if (!window.confirm('Hapus file pada baris ' + (row + 1) + '?')) return;
    delete state.rowFiles[String(row)];
    saveLocalSheet();
    renderBody();
    renderUploadPreview(row);
  }

  function renderUploadPreview(row) {
    const modal = ensureUploadModal();
    const payload = rowFilePayload(row);
    clearNode(modal.preview);
    modal.removeButton.disabled = !payload;
    if (!payload) {
      const empty = document.createElement('div');
      empty.className = 'project-sales-upload-empty';
      empty.textContent = 'Belum ada file tersimpan untuk baris ini.';
      modal.preview.appendChild(empty);
      return;
    }
    if (window.clientPortalRenderAttachmentViewer) {
      window.clientPortalRenderAttachmentViewer(modal.preview, payload, { label: 'File Baris ' + (row + 1) });
      return;
    }
    const fallback = document.createElement('div');
    fallback.className = 'project-sales-upload-empty';
    fallback.textContent = rowFileCount(row) + ' file tersimpan.';
    modal.preview.appendChild(fallback);
  }

  function selectCell(event) {
    document.querySelectorAll('.project-sales-cell.active').forEach(function (item) {
      item.classList.remove('active');
    });
    const target = event.currentTarget;
    target.classList.add('active');
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    const raw = state.grid[row]?.[col] || '';
    if (isFormulaText(raw) && target.textContent !== raw) {
      target.textContent = raw;
      placeCaretAtEnd(target);
    }
    updateFormulaTarget(target);
  }

  function updateCellFromDom(event) {
    const target = event.currentTarget;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    const value = target.textContent || '';
    setGridValue(row, col, value);
    target.classList.toggle('formula-cell', isFormulaText(value));
    target.title = isFormulaText(value) ? value : '';
    updateFormulaTarget(target);
    refreshFormulaDisplays(target);
    scheduleSave();
  }

  function finalizeCellEdit(event) {
    if (event.currentTarget.dataset.skipNextBlurCommit === '1') {
      delete event.currentTarget.dataset.skipNextBlurCommit;
      return;
    }
    commitCell(event.currentTarget);
  }

  function commitCell(target, options) {
    if (!target) return;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    const value = target.textContent || '';
    setGridValue(row, col, value);
    target.classList.toggle('formula-cell', isFormulaText(value));
    target.title = isFormulaText(value) ? value : '';
    target.textContent = displayCellValue(row, col);
    if (state.formulaTarget?.element === target) {
      clearFormulaTarget();
    }
    if (options?.skipNextBlur) {
      target.dataset.skipNextBlurCommit = '1';
    }
    refreshFormulaDisplays();
    scheduleSave();
  }

  function updateHeaderFromDom(event) {
    const target = event.currentTarget;
    const col = Number(target.dataset.col);
    if (col < 0 || col >= state.cols) return;
    state.headers[col] = text(target.textContent, columnLabel(col));
    scheduleSave();
  }

  function normalizeHeaderTitle(event) {
    const target = event.currentTarget;
    const col = Number(target.dataset.col);
    const value = text(target.textContent, columnLabel(col));
    target.textContent = value;
    state.headers[col] = value;
    scheduleSave();
  }

  function handleHeaderKeydown(event) {
    const target = event.currentTarget;
    const col = Number(target.dataset.col);
    if (event.key === 'Enter') {
      event.preventDefault();
      target.blur();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      focusHeader(col + (event.shiftKey ? -1 : 1));
    }
  }

  function pasteHeaderTitle(event) {
    const clipboard = event.clipboardData || window.clipboardData;
    const raw = clipboard ? clipboard.getData('text/plain') : '';
    if (!raw) return;
    event.preventDefault();
    const firstValue = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')[0].split('\t')[0];
    event.currentTarget.textContent = text(firstValue, columnLabel(Number(event.currentTarget.dataset.col)));
    updateHeaderFromDom(event);
  }

  function pasteCells(event) {
    const clipboard = event.clipboardData || window.clipboardData;
    const raw = clipboard ? clipboard.getData('text/plain') : '';
    if (!raw) return;
    event.preventDefault();
    const target = event.currentTarget;
    const startRow = Number(target.dataset.row);
    const startCol = Number(target.dataset.col);
    const rows = parseClipboardRows(raw);
    ensureRows(startRow + rows.length);
    rows.forEach(function (items, rowOffset) {
      items.forEach(function (value, colOffset) {
        const row = startRow + rowOffset;
        const col = startCol + colOffset;
        if (col >= state.cols) return;
        setGridValue(row, col, value);
      });
    });
    renderBody();
    focusCell(startRow, startCol);
    scheduleSave();
    renderMeta();
  }

  function parseClipboardRows(raw) {
    const cleaned = String(raw || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '');
    return cleaned.split('\n').map(function (line) {
      return line.split('\t').map(function (value) {
        return value.replace(/\u00a0/g, ' ').trim();
      });
    });
  }

  function handleCellKeydown(event) {
    const target = event.currentTarget;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    if (event.key === 'Enter') {
      event.preventDefault();
      commitCell(target, { skipNextBlur: true });
      focusCell(row + 1, col);
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      commitCell(target, { skipNextBlur: true });
      focusCell(row, col + (event.shiftKey ? -1 : 1));
    }
  }

  function focusCell(row, col) {
    if (col < 0) return;
    if (col >= state.cols) {
      col = 0;
      row += 1;
    }
    ensureRows(row + 1);
    const selector = '.project-sales-cell[data-row="' + row + '"][data-col="' + col + '"]';
    const target = document.querySelector(selector);
    if (target) {
      target.focus();
      placeCaretAtEnd(target);
    }
  }

  function ensureRows(minRows) {
    if (minRows <= state.rows) return;
    const nextRows = Math.max(minRows, state.rows + ADD_ROWS);
    state.rows = nextRows;
    state.grid = normalizeGrid(state.grid, state.rows);
    renderSheet();
  }

  function setGridValue(row, col, value) {
    if (row < 0 || col < 0 || col >= state.cols) return;
    if (!state.grid[row]) state.grid[row] = Array(state.cols).fill('');
    state.grid[row][col] = text(value);
  }

  function displayCellValue(row, col) {
    const value = state.grid[row]?.[col] || '';
    if (!isFormulaText(value)) return value;
    if (isIncompleteFormula(value)) return value;
    try {
      return formatFormulaResult(evaluateFormula(value, row, col, new Set()));
    } catch {
      return '#ERROR';
    }
  }

  function isFormulaText(value) {
    return String(value || '').trim().startsWith('=');
  }

  function isIncompleteFormula(value) {
    const expression = String(value || '').trim().slice(1).trim();
    if (!expression) return true;
    if (/^(sum|average|avg|min|max|count)\s*\(?\s*$/i.test(expression)) return true;
    if (/[+\-*/(:,]\s*$/.test(expression)) return true;
    return false;
  }

  function updateFormulaTarget(target) {
    const value = target?.textContent || '';
    if (!target || !isFormulaText(value)) {
      if (state.formulaTarget?.element === target) clearFormulaTarget();
      return;
    }
    if (state.formulaTarget?.element && state.formulaTarget.element !== target) {
      state.formulaTarget.element.classList.remove('formula-editing');
    }
    state.formulaTarget = {
      element: target,
      row: Number(target.dataset.row),
      col: Number(target.dataset.col)
    };
    target.classList.add('formula-editing');
  }

  function clearFormulaTarget() {
    if (state.formulaTarget?.element) {
      state.formulaTarget.element.classList.remove('formula-editing');
    }
    state.formulaTarget = null;
    state.pendingFormulaRange = null;
  }

  function maybeInsertFormulaReference(event) {
    let formulaTarget = state.formulaTarget;
    const activeElement = document.activeElement;
    if (!formulaTarget?.element && activeElement?.classList?.contains('project-sales-cell') && isFormulaText(activeElement.textContent || '')) {
      updateFormulaTarget(activeElement);
      formulaTarget = state.formulaTarget;
    }
    if (!formulaTarget?.element || event.button !== 0) return;
    const target = event.currentTarget;
    if (target === formulaTarget.element) return;
    const formula = formulaTarget.element.textContent || '';
    if (!isFormulaText(formula)) {
      clearFormulaTarget();
      return;
    }
    event.preventDefault();
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    const reference = cellReference(row, col);
    const nextFormula = insertFormulaReference(formula, reference, formulaTarget);
    formulaTarget.element.textContent = nextFormula;
    formulaTarget.element.title = nextFormula;
    formulaTarget.element.classList.add('formula-cell', 'formula-editing');
    setGridValue(formulaTarget.row, formulaTarget.col, nextFormula);
    formulaTarget.element.focus();
    placeCaretAtEnd(formulaTarget.element);
    scheduleSave();
  }

  function insertFormulaReference(formula, reference, formulaTarget) {
    const clean = String(formula || '').trim();
    const bareFunction = clean.match(/^=\s*(sum|average|avg|min|max|count)\s*\(?\s*$/i);
    if (bareFunction) {
      const fn = bareFunction[1].toUpperCase() === 'AVG' ? 'AVERAGE' : bareFunction[1].toUpperCase();
      state.pendingFormulaRange = {
        target: formulaTarget.element,
        functionName: fn,
        startRef: reference
      };
      return '=' + fn + '(' + reference + ':';
    }

    if (state.pendingFormulaRange?.target === formulaTarget.element) {
      const pending = state.pendingFormulaRange;
      state.pendingFormulaRange = null;
      const prefix = '=' + pending.functionName + '(' + pending.startRef + ':';
      if (clean.toUpperCase().startsWith(prefix.toUpperCase())) {
        return prefix + reference + ')';
      }
      return clean + reference + ')';
    }

    if (/^=\s*(sum|average|avg|min|max|count)\s*\([^)]*:\s*$/i.test(clean)) {
      return clean + reference + ')';
    }

    const appendWithoutOperator = /[=+\-*/(:,]\s*$/.test(clean);
    return clean + (appendWithoutOperator ? '' : '+') + reference;
  }

  function refreshFormulaDisplays(skipElement) {
    document.querySelectorAll('.project-sales-cell').forEach(function (item) {
      if (item === skipElement || item === document.activeElement) return;
      const row = Number(item.dataset.row);
      const col = Number(item.dataset.col);
      const raw = state.grid[row]?.[col] || '';
      item.classList.toggle('formula-cell', isFormulaText(raw));
      item.title = isFormulaText(raw) ? raw : '';
      item.textContent = displayCellValue(row, col);
    });
  }

  function evaluateFormula(value, row, col, stack) {
    const key = row + ':' + col;
    if (stack.has(key)) throw new Error('Circular formula');
    stack.add(key);
    const expression = String(value || '').trim().slice(1).trim();
    if (!expression) {
      stack.delete(key);
      return '';
    }
    try {
      return evaluateExpression(expression, stack);
    } finally {
      stack.delete(key);
    }
  }

  function evaluateExpression(expression, stack) {
    let output = String(expression || '').replace(/;/g, ',');
    let guard = 0;
    const fnPattern = /\b(SUM|AVERAGE|AVG|MIN|MAX|COUNT)\s*\(([^()]*)\)/i;
    while (fnPattern.test(output)) {
      guard += 1;
      if (guard > 40) throw new Error('Formula too complex');
      output = output.replace(fnPattern, function (_, fnName, argsText) {
        return String(evaluateFunction(fnName, argsText, stack));
      });
    }
    output = output.replace(/\b([A-Z]+)([1-9]\d*)\b/gi, function (_, letters, rowNumber) {
      const coords = cellReferenceToCoords(letters + rowNumber);
      return String(numericFromCell(coords.row, coords.col, stack));
    });
    if (!/^[0-9+\-*/().\s]+$/.test(output)) throw new Error('Unsupported formula');
    const result = Function('"use strict"; return (' + output + ');')();
    if (!Number.isFinite(Number(result))) throw new Error('Invalid formula result');
    return Number(result);
  }

  function evaluateFunction(fnName, argsText, stack) {
    const values = splitFormulaArgs(argsText).flatMap(function (arg) {
      return valuesFromFormulaArg(arg, stack);
    });
    const fn = String(fnName || '').toUpperCase() === 'AVG' ? 'AVERAGE' : String(fnName || '').toUpperCase();
    if (!FORMULA_FUNCTIONS.includes(fn)) throw new Error('Unsupported function');
    if (fn === 'COUNT') {
      return values.filter(function (value) { return Number.isFinite(value); }).length;
    }
    const numericValues = values.filter(function (value) { return Number.isFinite(value); });
    if (!numericValues.length) return 0;
    if (fn === 'SUM') {
      return numericValues.reduce(function (total, value) { return total + value; }, 0);
    }
    if (fn === 'AVERAGE') {
      return numericValues.reduce(function (total, value) { return total + value; }, 0) / numericValues.length;
    }
    if (fn === 'MIN') return Math.min.apply(Math, numericValues);
    if (fn === 'MAX') return Math.max.apply(Math, numericValues);
    return 0;
  }

  function splitFormulaArgs(argsText) {
    return String(argsText || '').split(',').map(function (arg) {
      return arg.trim();
    }).filter(Boolean);
  }

  function valuesFromFormulaArg(arg, stack) {
    const rangeMatch = String(arg || '').match(/^([A-Z]+[1-9]\d*)\s*:\s*([A-Z]+[1-9]\d*)$/i);
    if (rangeMatch) {
      return valuesFromRange(rangeMatch[1], rangeMatch[2], stack);
    }
    const cellMatch = String(arg || '').match(/^([A-Z]+[1-9]\d*)$/i);
    if (cellMatch) {
      const coords = cellReferenceToCoords(cellMatch[1]);
      return [numericFromCell(coords.row, coords.col, stack)];
    }
    return [evaluateExpression(arg, stack)];
  }

  function valuesFromRange(startRef, endRef, stack) {
    const start = cellReferenceToCoords(startRef);
    const end = cellReferenceToCoords(endRef);
    const rowStart = Math.min(start.row, end.row);
    const rowEnd = Math.max(start.row, end.row);
    const colStart = Math.min(start.col, end.col);
    const colEnd = Math.max(start.col, end.col);
    const values = [];
    for (let row = rowStart; row <= rowEnd; row += 1) {
      for (let col = colStart; col <= colEnd; col += 1) {
        values.push(numericFromCell(row, col, stack));
      }
    }
    return values;
  }

  function numericFromCell(row, col, stack) {
    if (row < 0 || col < 0 || col >= state.cols || row >= state.rows) return 0;
    const value = state.grid[row]?.[col] || '';
    if (isFormulaText(value)) return Number(evaluateFormula(value, row, col, stack)) || 0;
    return parseNumericValue(value);
  }

  function cellReference(row, col) {
    return columnLabel(col) + String(row + 1);
  }

  function cellReferenceToCoords(reference) {
    const match = String(reference || '').trim().match(/^([A-Z]+)([1-9]\d*)$/i);
    if (!match) throw new Error('Invalid cell reference');
    return {
      row: Number(match[2]) - 1,
      col: columnLabelToIndex(match[1])
    };
  }

  function columnLabelToIndex(label) {
    let value = 0;
    String(label || '').toUpperCase().split('').forEach(function (letter) {
      value = value * 26 + (letter.charCodeAt(0) - 64);
    });
    return value - 1;
  }

  function parseNumericValue(value) {
    let raw = String(value || '').replace(/\s/g, '').replace(/[^\d,.\-]/g, '');
    if (!raw || raw === '-' || raw === '.' || raw === ',') return 0;
    const hasComma = raw.includes(',');
    const hasDot = raw.includes('.');
    if (hasComma && hasDot) {
      if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
        raw = raw.replace(/\./g, '').replace(',', '.');
      } else {
        raw = raw.replace(/,/g, '');
      }
    } else if (hasComma) {
      raw = /,\d{1,2}$/.test(raw) ? raw.replace(',', '.') : raw.replace(/,/g, '');
    } else if (hasDot) {
      const parts = raw.split('.');
      if (parts.length > 1 && parts[parts.length - 1].length === 3) {
        raw = raw.replace(/\./g, '');
      }
    }
    const number = Number(raw);
    return Number.isFinite(number) ? number : 0;
  }

  function formatFormulaResult(value) {
    if (value === '') return '';
    const number = Number(value);
    if (!Number.isFinite(number)) return '#ERROR';
    return new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 2
    }).format(Math.round(number * 100) / 100);
  }

  function toggleHeaderEdit() {
    state.editingHeaders = !state.editingHeaders;
    renderHead();
    if (state.editingHeaders) {
      focusHeader(0);
    }
  }

  function focusHeader(col) {
    if (!state.editingHeaders || col < 0 || col >= state.cols) return;
    const target = document.querySelector('.project-sales-col-title[data-col="' + col + '"]');
    if (target) {
      target.focus();
      placeCaretAtEnd(target);
    }
  }

  function renderHeaderEditState() {
    const button = elements.editHeadersButton;
    if (!button) return;
    button.classList.toggle('active', state.editingHeaders);
    const label = button.querySelector('span');
    if (label) label.textContent = state.editingHeaders ? 'Selesai Edit Judul' : 'Edit Judul Cell';
  }

  function toggleCompactHeader() {
    state.compactHeader = !state.compactHeader;
    renderCompactState();
    saveLocalSheet();
  }

  function renderCompactState() {
    document.body.classList.toggle('project-sales-compact', state.compactHeader);
    const button = elements.compactButton;
    if (!button) return;
    button.classList.toggle('active', state.compactHeader);
    const label = button.querySelector('span');
    if (label) label.textContent = state.compactHeader ? 'Tampilkan Header' : 'Minimize';
  }

  function applyRowHeadWidth(element) {
    if (!element) return;
    element.style.width = ROW_HEADER_WIDTH + 'px';
    element.style.minWidth = ROW_HEADER_WIDTH + 'px';
    element.style.maxWidth = ROW_HEADER_WIDTH + 'px';
  }

  function applyColumnWidthToElement(element, col) {
    if (!element) return;
    const width = clampWidth(state.colWidths[col] || DEFAULT_COL_WIDTH);
    element.style.width = width + 'px';
    element.style.minWidth = width + 'px';
    element.style.maxWidth = width + 'px';
  }

  function applyActionWidth(element) {
    if (!element) return;
    element.style.width = ACTION_COL_WIDTH + 'px';
    element.style.minWidth = ACTION_COL_WIDTH + 'px';
    element.style.maxWidth = ACTION_COL_WIDTH + 'px';
  }

  function applyColumnWidth(col) {
    const selector = '[data-col="' + col + '"]';
    document.querySelectorAll('.project-sales-col-head' + selector + ', .project-sales-cell' + selector).forEach(function (element) {
      applyColumnWidthToElement(element, col);
    });
  }

  function clampWidth(width) {
    return Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, Math.round(Number(width) || DEFAULT_COL_WIDTH)));
  }

  function startColumnResize(event) {
    const col = Number(event.currentTarget.dataset.col);
    if (col < 0 || col >= state.cols) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startWidth = state.colWidths[col] || DEFAULT_COL_WIDTH;
    document.body.classList.add('project-sales-resizing');

    function move(moveEvent) {
      const nextWidth = clampWidth(startWidth + moveEvent.clientX - startX);
      state.colWidths[col] = nextWidth;
      applyColumnWidth(col);
    }

    function stop() {
      document.body.classList.remove('project-sales-resizing');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      saveLocalSheet();
    }

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  }

  function headerAfterMove(headers, oldIndex, newIndex) {
    const value = text(headers[oldIndex], columnLabel(oldIndex));
    return value === columnLabel(oldIndex) ? columnLabel(newIndex) : value;
  }

  function insertColumn(insertAt) {
    const oldCols = state.cols;
    const target = Math.max(0, Math.min(Number(insertAt) || 0, oldCols));
    const oldGrid = normalizeGrid(state.grid, state.rows);
    const oldHeaders = state.headers.slice(0, oldCols);
    const oldWidths = state.colWidths.slice(0, oldCols);
    state.cols = oldCols + 1;
    state.headers = [];
    state.colWidths = [];
    for (let col = 0; col < state.cols; col += 1) {
      if (col === target) {
        state.headers[col] = columnLabel(col);
        state.colWidths[col] = DEFAULT_COL_WIDTH;
        continue;
      }
      const oldIndex = col > target ? col - 1 : col;
      state.headers[col] = headerAfterMove(oldHeaders, oldIndex, col);
      state.colWidths[col] = clampWidth(Number(oldWidths[oldIndex] || 0) || DEFAULT_COL_WIDTH);
    }
    state.grid = oldGrid.map(function (row) {
      const nextRow = row.slice(0, oldCols);
      nextRow.splice(target, 0, '');
      return nextRow;
    });
    renderSheet();
    saveLocalSheet();
    focusCell(0, target);
    setAlert('Kolom ditambahkan.', 'info');
    window.setTimeout(function () { setAlert(''); }, 1800);
  }

  function deleteColumn(col) {
    const target = Number(col);
    if (!Number.isFinite(target) || target < 0 || target >= state.cols) return;
    if (state.cols <= 1) {
      setAlert('Minimal harus ada 1 kolom.', 'error');
      window.setTimeout(function () { setAlert(''); }, 2200);
      return;
    }
    const label = text(state.headers[target], columnLabel(target));
    if (!window.confirm('Hapus kolom ' + label + '? Isi kolom ini akan ikut terhapus.')) return;
    const oldCols = state.cols;
    const oldGrid = normalizeGrid(state.grid, state.rows);
    const oldHeaders = state.headers.slice(0, oldCols);
    const oldWidths = state.colWidths.slice(0, oldCols);
    state.cols = oldCols - 1;
    state.headers = [];
    state.colWidths = [];
    for (let colIndex = 0; colIndex < state.cols; colIndex += 1) {
      const oldIndex = colIndex >= target ? colIndex + 1 : colIndex;
      state.headers[colIndex] = headerAfterMove(oldHeaders, oldIndex, colIndex);
      state.colWidths[colIndex] = clampWidth(Number(oldWidths[oldIndex] || 0) || DEFAULT_COL_WIDTH);
    }
    state.grid = oldGrid.map(function (row) {
      const nextRow = row.slice(0, oldCols);
      nextRow.splice(target, 1);
      return nextRow;
    });
    renderSheet();
    saveLocalSheet();
    focusCell(0, Math.min(target, state.cols - 1));
    setAlert('Kolom ' + label + ' dihapus.', 'info');
    window.setTimeout(function () { setAlert(''); }, 1800);
  }

  function blankRow() {
    return Array.from({ length: state.cols }, function () { return ''; });
  }

  function shiftRowFilesFrom(startRow, offset) {
    const next = {};
    Object.keys(state.rowFiles || {}).forEach(function (key) {
      const row = Number(key);
      if (!Number.isFinite(row)) return;
      const nextRow = row >= startRow ? row + offset : row;
      if (nextRow >= 0) next[String(nextRow)] = state.rowFiles[key];
    });
    state.rowFiles = next;
  }

  function removeRowFilesAt(targetRow) {
    const next = {};
    Object.keys(state.rowFiles || {}).forEach(function (key) {
      const row = Number(key);
      if (!Number.isFinite(row) || row === targetRow) return;
      const nextRow = row > targetRow ? row - 1 : row;
      if (nextRow >= 0) next[String(nextRow)] = state.rowFiles[key];
    });
    state.rowFiles = next;
  }

  function insertRow(insertAt) {
    const target = Math.max(0, Math.min(Number(insertAt) || 0, state.rows));
    state.grid = normalizeGrid(state.grid, state.rows);
    state.grid.splice(target, 0, blankRow());
    shiftRowFilesFrom(target, 1);
    state.rows += 1;
    renderSheet();
    saveLocalSheet();
    focusCell(target, 0);
    setAlert('Baris ditambahkan.', 'info');
    window.setTimeout(function () { setAlert(''); }, 1800);
  }

  function deleteRow(row) {
    const target = Number(row);
    if (!Number.isFinite(target) || target < 0 || target >= state.rows) return;
    if (state.rows <= 1) {
      setAlert('Minimal harus ada 1 baris.', 'error');
      window.setTimeout(function () { setAlert(''); }, 2200);
      return;
    }
    if (!window.confirm('Hapus baris ' + (target + 1) + '? Isi baris ini akan ikut terhapus.')) return;
    state.grid = normalizeGrid(state.grid, state.rows);
    state.grid.splice(target, 1);
    removeRowFilesAt(target);
    state.rows -= 1;
    renderSheet();
    saveLocalSheet();
    focusCell(Math.min(target, state.rows - 1), 0);
    setAlert('Baris ' + (target + 1) + ' dihapus.', 'info');
    window.setTimeout(function () { setAlert(''); }, 1800);
  }

  function clearSheet() {
    if (!window.confirm('Hapus isi Rekap Pembelian?')) return;
    state.rows = INITIAL_ROWS;
    state.grid = normalizeGrid([], state.rows);
    state.rowFiles = {};
    saveLocalSheet();
    renderSheet();
    setAlert('Isi Rekap Pembelian dikosongkan.', 'info');
    window.setTimeout(function () { setAlert(''); }, 2500);
  }

  function renderMeta() {
    const filled = state.grid.reduce(function (total, row) {
      return total + row.filter(function (value) { return text(value); }).length;
    }, 0);
    setText(elements.meta, filled + ' cell terisi');
  }

  function columnLabel(index) {
    let value = index + 1;
    let label = '';
    while (value > 0) {
      const mod = (value - 1) % 26;
      label = String.fromCharCode(65 + mod) + label;
      value = Math.floor((value - mod) / 26);
    }
    return label;
  }

  function placeCaretAtEnd(element) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
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

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadPage);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.compactButton) elements.compactButton.addEventListener('click', toggleCompactHeader);
  if (elements.editHeadersButton) elements.editHeadersButton.addEventListener('click', toggleHeaderEdit);
  if (elements.clearButton) elements.clearButton.addEventListener('click', clearSheet);
  document.addEventListener('pointerdown', handleDocumentPointerDown);
  document.addEventListener('keydown', handleDocumentKeydown);
  window.addEventListener('resize', closeGridActionMenu);
  if (elements.sheetWrap) elements.sheetWrap.addEventListener('scroll', closeGridActionMenu);

  loadPage();
})();
