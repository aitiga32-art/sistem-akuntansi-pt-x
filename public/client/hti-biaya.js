(function () {
  'use strict';

  const ATTACHMENT_BUNDLE_MIME = 'application/json';
  const state = {
    client: null,
    entries: [],
    summary: null,
    sourceBooks: [],
    expenseAccounts: [],
    projectCostAccount: null,
    projectOptions: [],
    activeMode: 'routine',
    selectedEntry: null,
    loading: false
  };

  const elements = {
    alert: document.getElementById('htiExpenseAlert'),
    clientMeta: document.getElementById('htiExpenseClientMeta'),
    userName: document.getElementById('htiExpenseUserName'),
    userEmail: document.getElementById('htiExpenseUserEmail'),
    backLink: document.getElementById('htiExpenseBackLink'),
    subtitle: document.getElementById('htiExpenseSubtitle'),
    refreshButton: document.getElementById('htiExpenseRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    addButton: document.getElementById('htiExpenseAddBtn'),
    workflowButtons: Array.from(document.querySelectorAll('[data-expense-mode]')),
    typeFilter: document.getElementById('htiExpenseTypeFilter'),
    searchInput: document.getElementById('htiExpenseSearchInput'),
    rows: document.getElementById('htiExpenseRows'),
    total: document.getElementById('htiExpenseTotal'),
    routineTotal: document.getElementById('htiExpenseRoutineTotal'),
    projectTotal: document.getElementById('htiExpenseProjectTotal'),
    unallocatedCount: document.getElementById('htiExpenseUnallocatedCount'),
    modal: document.getElementById('htiExpenseModal'),
    form: document.getElementById('htiExpenseForm'),
    modalTitle: document.getElementById('htiExpenseModalTitle'),
    modalMeta: document.getElementById('htiExpenseModalMeta'),
    closeButton: document.getElementById('htiExpenseCloseBtn'),
    cancelButton: document.getElementById('htiExpenseCancelBtn'),
    saveButton: document.getElementById('htiExpenseSaveBtn'),
    entryId: document.getElementById('htiExpenseEntryId'),
    expenseType: document.getElementById('htiExpenseType'),
    expenseDate: document.getElementById('htiExpenseDate'),
    expenseSource: document.getElementById('htiExpenseSource'),
    expenseAmount: document.getElementById('htiExpenseAmount'),
    expenseProject: document.getElementById('htiExpenseProject'),
    expenseAccount: document.getElementById('htiExpenseAccount'),
    expenseAccountLock: document.getElementById('htiExpenseProjectAccountLock'),
    expenseDescription: document.getElementById('htiExpenseDescription'),
    attachmentFile: document.getElementById('htiExpenseAttachmentFile'),
    attachmentNote: document.getElementById('htiExpenseAttachmentNote'),
    projectOptions: document.getElementById('htiExpenseProjectOptions'),
    viewModal: document.getElementById('htiExpenseViewModal'),
    viewTitle: document.getElementById('htiExpenseViewTitle'),
    viewMeta: document.getElementById('htiExpenseViewMeta'),
    viewBody: document.getElementById('htiExpenseViewBody'),
    viewCloseButton: document.getElementById('htiExpenseViewCloseBtn'),
    viewCancelButton: document.getElementById('htiExpenseViewCancelBtn'),
    viewEditButton: document.getElementById('htiExpenseViewEditBtn'),
    viewDeleteButton: document.getElementById('htiExpenseViewDeleteBtn'),
    fileModal: document.getElementById('htiExpenseFileModal'),
    fileTitle: document.getElementById('htiExpenseFileTitle'),
    fileMeta: document.getElementById('htiExpenseFileMeta'),
    fileViewer: document.getElementById('htiExpenseFileViewer'),
    fileCloseButton: document.getElementById('htiExpenseFileCloseBtn'),
    adminOnly: Array.from(document.querySelectorAll('.admin-only'))
  };

  const currency = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  let alertTimer = null;

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
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
    if (element) element.textContent = text(value);
  }

  function clearNode(node) {
    if (node) node.replaceChildren();
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/pt-x-biaya/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/pt-x-biaya';
  }

  function setAlert(message, kind) {
    if (!elements.alert) return;
    if (alertTimer) window.clearTimeout(alertTimer);
    elements.alert.hidden = !message;
    elements.alert.textContent = message || '';
    elements.alert.className = 'portal-alert' + (kind ? ' ' + kind : '');
    if (message && kind !== 'error') {
      const expected = message;
      alertTimer = window.setTimeout(function () {
        if (elements.alert.textContent === expected) {
          elements.alert.hidden = true;
          elements.alert.textContent = '';
        }
      }, 4200);
    }
  }

  function todayIso() {
    const date = new Date();
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');
  }

  function formatDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '/' + match[2] + '/' + match[1] : (raw || '-');
  }

  function parseAmount(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = text(value);
    if (!raw) return 0;
    const normalized = raw.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount) || Math.abs(amount) < 0.005) return '0';
    return currency.format(amount);
  }

  function formatCurrency(value) {
    return 'Rp' + formatAmount(value);
  }

  function formatMoneyInput(input) {
    if (!input) return;
    const amount = parseAmount(input.value);
    input.value = amount ? formatAmount(amount) : '';
  }

  function formatFileSize(size) {
    const bytes = Number(size || 0);
    if (!bytes) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
  }

  async function requestJson(url, options) {
    const response = await fetch(url, Object.assign({
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    }, options || {}));
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Permintaan belum berhasil.');
    return data;
  }

  async function logout() {
    try {
      const response = await fetch('/app/api/client/logout', {
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

  function syncShell(data) {
    const user = data.user || {};
    setText(elements.userName, user.displayName || user.username || '-');
    setText(elements.userEmail, user.email || user.contactName || '-');
    elements.adminOnly.forEach(function (item) { item.hidden = !user.isAdmin; });
    const client = state.client || {};
    setText(elements.clientMeta, client.name || 'PT X');
    setText(elements.subtitle, text(client.name, 'PT X') + ' | Biaya rutin dan biaya proyek');
    if (elements.backLink && client.id) elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
  }

  function fillSelect(select, rows, valueKey, labelBuilder, selectedValue) {
    clearNode(select);
    rows.forEach(function (row) {
      const option = document.createElement('option');
      option.value = text(row[valueKey]);
      option.textContent = labelBuilder(row);
      select.appendChild(option);
    });
    if (selectedValue) select.value = selectedValue;
  }

  function expenseAccountOptionsForDisplay() {
    const rows = state.expenseAccounts.slice();
    const projectCost = state.projectCostAccount;
    if (projectCost && !rows.some(function (account) { return text(account.coa) === text(projectCost.coa); })) {
      rows.push(projectCost);
    }
    return rows.sort(function (left, right) {
      return text(left.coa).localeCompare(text(right.coa), 'id', { numeric: true });
    });
  }

  function renderOptions() {
    fillSelect(elements.expenseSource, state.sourceBooks, 'value', function (source) {
      return text(source.label, source.key);
    });
    fillSelect(elements.expenseAccount, expenseAccountOptionsForDisplay(), 'coa', function (account) {
      return text(account.coa) + ' - ' + text(account.accountName);
    });
    if (elements.expenseAccountLock) {
      elements.expenseAccountLock.value = selectedProjectCostLabel();
    }
    clearNode(elements.projectOptions);
    state.projectOptions.forEach(function (project) {
      const option = document.createElement('option');
      option.value = text(project.projectNo);
      option.label = text(project.label, project.projectNo);
      elements.projectOptions.appendChild(option);
    });
  }

  function defaultAccountForType(type) {
    if (type === 'project') {
      return text(state.projectCostAccount?.coa, '5201');
    }
    const routine = state.expenseAccounts.find(function (account) { return text(account.coa) !== '5201'; });
    return text(routine?.coa || state.expenseAccounts[0]?.coa);
  }

  function selectedProjectCostLabel() {
    const account = state.projectCostAccount || { coa: '5201', accountName: 'BIAYA PROYEK' };
    return [account.coa, account.accountName].filter(Boolean).join(' - ');
  }

  function setMode(mode) {
    state.activeMode = mode === 'project' || mode === 'proyek' ? 'project' : 'routine';
    elements.workflowButtons.forEach(function (button) {
      button.classList.toggle('is-active', text(button.dataset.expenseMode) === state.activeMode);
    });
    if (elements.expenseType) elements.expenseType.value = state.activeMode;
    syncProjectFields();
  }

  function syncProjectFields() {
    const isProject = text(elements.expenseType?.value, state.activeMode) === 'project';
    if (elements.expenseProject) {
      elements.expenseProject.closest('.form-field')?.classList.toggle('is-muted', !isProject);
      elements.expenseProject.disabled = false;
    }
    if (elements.expenseAccount) {
      elements.expenseAccount.disabled = isProject;
      elements.expenseAccount.hidden = isProject;
      if (isProject) {
        elements.expenseAccount.value = defaultAccountForType('project');
      } else if (!elements.entryId?.value || text(elements.expenseAccount.value) === text(state.projectCostAccount?.coa, '5201')) {
        elements.expenseAccount.value = defaultAccountForType('routine');
      }
    }
    if (elements.expenseAccountLock) {
      elements.expenseAccountLock.hidden = !isProject;
      elements.expenseAccountLock.value = selectedProjectCostLabel();
    }
  }

  function renderSummary() {
    const summary = state.summary || {};
    setText(elements.total, formatCurrency(summary.totalAmount));
    setText(elements.routineTotal, formatCurrency(summary.routineTotal));
    setText(elements.projectTotal, formatCurrency(summary.projectTotal));
    setText(elements.unallocatedCount, formatAmount(summary.unallocatedProjectCount || 0));
  }

  function visibleEntries() {
    const typeFilter = text(elements.typeFilter?.value);
    const query = text(elements.searchInput?.value).toLowerCase();
    return state.entries.filter(function (entry) {
      if (typeFilter && entry.expenseType !== typeFilter) return false;
      if (!query) return true;
      return [
        entry.typeLabel,
        entry.projectNo,
        entry.expenseCoa,
        entry.expenseAccountName,
        entry.description,
        entry.sourceLabel
      ].join(' ').toLowerCase().includes(query);
    });
  }

  function badge(label, className) {
    const span = document.createElement('span');
    span.className = 'hti-expense-badge' + (className ? ' ' + className : '');
    span.textContent = label;
    return span;
  }

  function documentCell(entry) {
    const td = document.createElement('td');
    td.className = 'hti-expense-document-cell';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.disabled = true;
    checkbox.checked = Boolean(entry.hasAttachment);
    checkbox.title = entry.hasAttachment ? 'Dokumen terupload' : 'Belum ada dokumen';
    td.appendChild(checkbox);
    return td;
  }

  function actionButton(label, onClick, variant) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cashbook-action-button' + (variant ? ' ' + variant : '');
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function cell(value, className) {
    const td = document.createElement('td');
    if (className) td.className = className;
    td.textContent = text(value, '-');
    return td;
  }

  function renderRows() {
    clearNode(elements.rows);
    const rows = visibleEntries();
    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 9;
      td.className = 'hti-empty-cell';
      td.textContent = state.entries.length ? 'Tidak ada data yang sesuai filter.' : 'Belum ada data biaya.';
      tr.appendChild(td);
      elements.rows.appendChild(tr);
      return;
    }
    rows.forEach(function (entry) {
      const tr = document.createElement('tr');
      tr.className = entry.expenseType === 'project' ? 'hti-expense-project-row' : '';
      tr.tabIndex = 0;
      tr.addEventListener('click', function () { openView(entry); });
      tr.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openView(entry);
        }
      });
      const typeTd = document.createElement('td');
      typeTd.appendChild(badge(entry.typeLabel, entry.expenseType === 'project' ? 'is-project' : 'is-routine'));
      tr.appendChild(typeTd);
      tr.appendChild(cell(formatDate(entry.tanggal)));
      tr.appendChild(cell(entry.projectNo || '-'));
      tr.appendChild(cell([entry.expenseCoa, entry.expenseAccountName].filter(Boolean).join(' - '), 'hti-expense-account-cell'));
      tr.appendChild(cell(entry.description, 'hti-expense-description-cell'));
      tr.appendChild(cell(entry.sourceLabel || entry.sourceAccountName));
      tr.appendChild(cell(formatCurrency(entry.amount), 'number'));
      tr.appendChild(documentCell(entry));
      const actions = document.createElement('td');
      actions.className = 'cashbook-actions hti-expense-actions';
      actions.appendChild(actionButton('Lihat', function (event) {
        event.stopPropagation();
        openView(entry);
      }));
      actions.appendChild(actionButton('Ubah', function (event) {
        event.stopPropagation();
        openEntryModal(entry.expenseType, entry);
      }));
      actions.appendChild(actionButton('Hapus', function (event) {
        event.stopPropagation();
        deleteEntry(entry);
      }, 'danger'));
      tr.appendChild(actions);
      elements.rows.appendChild(tr);
    });
  }

  async function loadBook() {
    if (state.loading) return;
    state.loading = true;
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      state.client = data.client || null;
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.summary = data.summary || {};
      state.sourceBooks = Array.isArray(data.sourceBooks) ? data.sourceBooks : [];
      state.expenseAccounts = Array.isArray(data.expenseAccounts) ? data.expenseAccounts : [];
      state.projectCostAccount = data.projectCostAccount || null;
      state.projectOptions = Array.isArray(data.projectOptions) ? data.projectOptions : [];
      syncShell(data);
      renderOptions();
      renderSummary();
      renderRows();
    } catch (err) {
      setAlert(err.message || 'Data biaya belum bisa dimuat.', 'error');
    } finally {
      state.loading = false;
      if (elements.refreshButton) elements.refreshButton.disabled = false;
    }
  }

  function showModal(show) {
    if (!elements.modal) return;
    elements.modal.hidden = !show;
    document.body.classList.toggle('modal-open', show || !elements.viewModal.hidden || !elements.fileModal.hidden);
  }

  function showViewModal(show) {
    if (!elements.viewModal) return;
    elements.viewModal.hidden = !show;
    document.body.classList.toggle('modal-open', show || !elements.modal.hidden || !elements.fileModal.hidden);
  }

  function showFileModal(show) {
    if (!elements.fileModal) return;
    elements.fileModal.hidden = !show;
    document.body.classList.toggle('modal-open', show || !elements.modal.hidden || !elements.viewModal.hidden);
  }

  function closeEntryModal() {
    showModal(false);
    if (elements.form) elements.form.reset();
    if (elements.entryId) elements.entryId.value = '';
  }

  function stripGeneratedDescription(entry) {
    const description = text(entry.description);
    const parts = [
      entry.expenseType === 'project' ? 'Biaya Proyek PT X' : 'Biaya Rutin PT X',
      entry.projectNo ? 'Proyek ' + entry.projectNo : '',
      entry.expenseAccountName
    ].filter(Boolean);
    const prefix = parts.join(' | ');
    return description.startsWith(prefix + ' | ') ? description.slice(prefix.length + 3) : '';
  }

  function setAttachmentNote(entry) {
    const files = Array.from(elements.attachmentFile?.files || []);
    if (files.length) {
      setText(elements.attachmentNote, files.length + ' file dipilih.');
      return;
    }
    if (entry && entry.hasAttachment) {
      const count = Array.isArray(entry.files) && entry.files.length ? entry.files.length : 1;
      setText(elements.attachmentNote, count + ' file tersimpan.');
      return;
    }
    setText(elements.attachmentNote, 'Belum ada file tersimpan.');
  }

  function openEntryModal(mode, entry) {
    renderOptions();
    const isEdit = Boolean(entry);
    state.selectedEntry = entry || null;
    const type = entry ? entry.expenseType : (mode === 'project' ? 'project' : state.activeMode);
    if (elements.form) elements.form.reset();
    if (elements.entryId) elements.entryId.value = isEdit ? text(entry.id) : '';
    if (elements.expenseType) elements.expenseType.value = type;
    if (elements.expenseDate) elements.expenseDate.value = isEdit ? text(entry.tanggal) : todayIso();
    if (elements.expenseSource) elements.expenseSource.value = isEdit ? [entry.sourceType, entry.sourceKey].filter(Boolean).join(':') : (state.sourceBooks[0]?.value || '');
    if (elements.expenseAmount) elements.expenseAmount.value = isEdit ? formatAmount(entry.amount) : '';
    if (elements.expenseProject) elements.expenseProject.value = isEdit ? text(entry.projectNo) : '';
    if (elements.expenseAccount) elements.expenseAccount.value = type === 'project' ? defaultAccountForType('project') : (isEdit ? text(entry.expenseCoa) : defaultAccountForType(type));
    if (elements.expenseDescription) elements.expenseDescription.value = isEdit ? stripGeneratedDescription(entry) : '';
    setMode(type);
    setAttachmentNote(entry);
    setText(elements.modalTitle, isEdit ? 'Ubah Biaya' : (type === 'project' ? 'Tambah Biaya Proyek' : 'Tambah Biaya Rutin'));
    setText(elements.modalMeta, type === 'project'
      ? 'Biaya proyek masuk HPP dan tampil di Buku Kontrol.'
      : 'Biaya rutin otomatis masuk mutasi kas/bank dan laporan.');
    showModal(true);
    window.setTimeout(function () { elements.expenseDate?.focus(); }, 0);
  }

  function selectedSourceLabel() {
    const selected = state.sourceBooks.find(function (source) {
      return text(source.value) === text(elements.expenseSource?.value);
    });
    return text(selected?.label);
  }

  function selectedAccountLabel() {
    if (text(elements.expenseType?.value, state.activeMode) === 'project') return selectedProjectCostLabel();
    const selected = expenseAccountOptionsForDisplay().find(function (account) {
      return text(account.coa) === text(elements.expenseAccount?.value);
    });
    return [selected?.coa, selected?.accountName].filter(Boolean).join(' - ');
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.onerror = function () { reject(new Error('File ' + text(file?.name, 'lampiran') + ' gagal dibaca.')); };
      reader.readAsDataURL(file);
    });
  }

  function encodeBase64(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }

  async function readAttachmentPayload() {
    const files = Array.from(elements.attachmentFile?.files || []);
    if (!files.length) return {};
    const mapped = [];
    for (const file of files) {
      mapped.push({
        id: String(Date.now()) + '-' + mapped.length,
        name: file.name || 'lampiran',
        mimeType: file.type || 'application/octet-stream',
        size: file.size || 0,
        dataUrl: await fileToDataUrl(file),
        uploadedAt: new Date().toISOString()
      });
    }
    if (mapped.length === 1) {
      return {
        attachmentName: mapped[0].name,
        attachmentMimeType: mapped[0].mimeType,
        attachmentSize: mapped[0].size,
        attachmentDataUrl: mapped[0].dataUrl
      };
    }
    return {
      attachmentName: mapped.length + ' file',
      attachmentMimeType: ATTACHMENT_BUNDLE_MIME,
      attachmentSize: mapped.reduce(function (sum, file) { return sum + Number(file.size || 0); }, 0),
      attachmentDataUrl: 'data:' + ATTACHMENT_BUNDLE_MIME + ';base64,' + encodeBase64(JSON.stringify({ files: mapped }))
    };
  }

  async function saveEntry(event) {
    event.preventDefault();
    const entryId = text(elements.entryId?.value);
    const payload = Object.assign({
      expenseType: text(elements.expenseType?.value, state.activeMode),
      tanggal: text(elements.expenseDate?.value),
      sourceKey: text(elements.expenseSource?.value),
      amount: parseAmount(elements.expenseAmount?.value),
      projectNo: text(elements.expenseProject?.value),
      expenseCoa: text(elements.expenseType?.value, state.activeMode) === 'project' ? defaultAccountForType('project') : text(elements.expenseAccount?.value),
      description: text(elements.expenseDescription?.value)
    }, await readAttachmentPayload());
    try {
      elements.saveButton.disabled = true;
      const url = entryId ? apiBase() + '/entries/' + encodeURIComponent(entryId) : apiBase() + '/entries';
      const method = entryId ? 'PUT' : 'POST';
      const data = await requestJson(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.summary = data.summary || state.summary;
      state.projectOptions = Array.isArray(data.projectOptions) ? data.projectOptions : state.projectOptions;
      renderOptions();
      renderSummary();
      renderRows();
      closeEntryModal();
      await loadBook();
      setAlert('Biaya tersimpan dan mutasi kas/bank ikut diperbarui.', 'success');
      notifyEmbeddedSourceClose(true);
    } catch (err) {
      setAlert(err.message || 'Biaya belum bisa disimpan.', 'error');
    } finally {
      elements.saveButton.disabled = false;
    }
  }

  async function confirmDecision(options) {
    if (window.clientPortalConfirm) return window.clientPortalConfirm(options);
    return Promise.resolve(window.confirm(options.message || 'Lanjutkan?'));
  }

  async function deleteEntry(entry) {
    const ok = await confirmDecision({
      title: 'Hapus Biaya',
      meta: 'Mutasi kas/bank terkait juga akan dihapus.',
      message: 'Hapus data biaya ini?',
      cancelText: 'Batal',
      confirmText: 'Hapus',
      enterConfirms: true
    });
    if (!ok) return;
    try {
      const data = await requestJson(apiBase() + '/entries/' + encodeURIComponent(entry.id), { method: 'DELETE' });
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.summary = data.summary || state.summary;
      renderSummary();
      renderRows();
      closeView();
      setAlert('Biaya dan mutasi kas/bank terkait sudah dihapus.', 'success');
      notifyEmbeddedSourceClose(true);
    } catch (err) {
      setAlert(err.message || 'Data biaya belum bisa dihapus.', 'error');
    }
  }

  function closeView() {
    showViewModal(false);
    state.selectedEntry = null;
    if (elements.viewBody) elements.viewBody.replaceChildren();
  }

  function openView(entry) {
    state.selectedEntry = entry;
    setText(elements.viewTitle, entry.typeLabel);
    setText(elements.viewMeta, [formatDate(entry.tanggal), entry.sourceLabel, formatCurrency(entry.amount)].filter(Boolean).join(' | '));
    const files = Array.isArray(entry.files) ? entry.files : [];
    const docsHtml = entry.hasAttachment
      ? files.map(function (file) {
        return '<button class="hti-expense-doc-chip" type="button" data-file-id="' + escapeHtml(file.id || file.name) + '"><strong>' + escapeHtml(file.name) + '</strong><span>' + escapeHtml(formatFileSize(file.size)) + '</span></button>';
      }).join('')
      : '<p class="hti-control-detail-empty">Belum ada dokumen terupload.</p>';
    elements.viewBody.innerHTML = [
      '<div class="hti-expense-view-summary">',
        '<div><span>Tanggal</span><strong>' + escapeHtml(formatDate(entry.tanggal)) + '</strong></div>',
        '<div><span>Kode Proyek</span><strong>' + escapeHtml(entry.projectNo || '-') + '</strong></div>',
        '<div><span>Akun Biaya</span><strong>' + escapeHtml(selectedAccountText(entry)) + '</strong></div>',
        '<div><span>Sumber Dana</span><strong>' + escapeHtml(entry.sourceLabel || entry.sourceAccountName || '-') + '</strong></div>',
        '<div><span>Nominal</span><strong>' + escapeHtml(formatCurrency(entry.amount)) + '</strong></div>',
      '</div>',
      '<section class="hti-expense-view-section"><h3>Keterangan</h3><p>' + escapeHtml(entry.description || '-') + '</p></section>',
      '<section class="hti-expense-view-section"><h3>Dokumen Terupload</h3><div class="hti-expense-doc-list">' + docsHtml + '</div></section>'
    ].join('');
    elements.viewBody.querySelectorAll('[data-file-id]').forEach(function (button) {
      button.addEventListener('click', function () { openFileViewer(entry, button.dataset.fileId); });
    });
    showViewModal(true);
  }

  function selectedAccountText(entry) {
    return [entry.expenseCoa, entry.expenseAccountName].filter(Boolean).join(' - ') || '-';
  }

  async function openFileViewer(entry, fileId) {
    try {
      setText(elements.fileTitle, 'Dokumen Biaya');
      setText(elements.fileMeta, 'Memuat dokumen...');
      clearNode(elements.fileViewer);
      showFileModal(true);
      const data = await requestJson(apiBase() + '/entries/' + encodeURIComponent(entry.id) + '/file');
      const files = Array.isArray(data.files) && data.files.length ? data.files : (data.file ? [data.file] : []);
      const target = files.find(function (file) {
        return text(file.id || file.name) === text(fileId);
      }) || files[0];
      if (!target) throw new Error('Dokumen tidak ditemukan.');
      setText(elements.fileMeta, text(target.name, 'lampiran') + ' | ' + formatFileSize(target.size));
      if (/^image\//i.test(text(target.mimeType)) && text(target.dataUrl)) {
        const img = document.createElement('img');
        img.src = target.dataUrl;
        img.alt = target.name || 'Dokumen biaya';
        elements.fileViewer.appendChild(img);
        return;
      }
      const panel = document.createElement('div');
      panel.className = 'cashbook-file-fallback';
      panel.innerHTML = '<p>File tersimpan, tetapi format ini tidak dapat ditampilkan langsung di browser.</p><a class="ghost-button" download="' + escapeHtml(target.name || 'lampiran') + '" href="' + escapeHtml(target.dataUrl) + '">Buka File</a>';
      elements.fileViewer.appendChild(panel);
    } catch (err) {
      setAlert(err.message || 'Dokumen belum bisa dibuka.', 'error');
      showFileModal(false);
    }
  }

  function clearOpenExpenseQuery() {
    const url = new URL(window.location.href);
    url.searchParams.delete('openExpense');
    url.searchParams.delete('focusProject');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }

  function focusExpenseProject() {
    window.setTimeout(function () {
      if (!elements.expenseProject) return;
      elements.expenseProject.focus();
      if (typeof elements.expenseProject.select === 'function') elements.expenseProject.select();
    }, 40);
  }

  function applyQueryMode() {
    const params = new URLSearchParams(window.location.search);
    const openExpense = text(params.get('openExpense'));
    if (openExpense) {
      const entry = state.entries.find(function (item) { return text(item.id) === openExpense; });
      clearOpenExpenseQuery();
      if (entry) {
        openEntryModal(entry.expenseType, entry);
        if (params.get('focusProject') === '1') focusExpenseProject();
      }
      else setAlert('Data biaya sumber mutasi tidak ditemukan.', 'error');
      return;
    }
    const mode = text(params.get('mode')).toLowerCase();
    if (mode === 'proyek' || mode === 'project') setMode('project');
    else setMode('routine');
    if (mode === 'rutin' || mode === 'routine' || mode === 'proyek' || mode === 'project') {
      openEntryModal(state.activeMode);
      const url = new URL(window.location.href);
      url.searchParams.delete('mode');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }

  function notifyEmbeddedSourceClose(refresh) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('embeddedExpense') !== '1') return;
    if (!window.parent || window.parent === window) return;
    window.parent.postMessage({
      type: 'client-portal-hti-source-payment-closed',
      refresh: Boolean(refresh)
    }, window.location.origin);
  }

  function bindEvents() {
    elements.workflowButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setMode(button.dataset.expenseMode);
        openEntryModal(state.activeMode);
      });
    });
    elements.addButton?.addEventListener('click', function () { openEntryModal(state.activeMode); });
    elements.refreshButton?.addEventListener('click', loadBook);
    elements.logoutButton?.addEventListener('click', logout);
    elements.typeFilter?.addEventListener('change', renderRows);
    elements.searchInput?.addEventListener('input', renderRows);
    elements.expenseType?.addEventListener('change', function () { setMode(elements.expenseType.value); });
    elements.expenseAmount?.addEventListener('blur', function () { formatMoneyInput(elements.expenseAmount); });
    elements.attachmentFile?.addEventListener('change', function () { setAttachmentNote(state.selectedEntry); });
    elements.form?.addEventListener('submit', saveEntry);
    elements.closeButton?.addEventListener('click', closeEntryModal);
    elements.cancelButton?.addEventListener('click', closeEntryModal);
    elements.viewCloseButton?.addEventListener('click', closeView);
    elements.viewCancelButton?.addEventListener('click', closeView);
    elements.viewEditButton?.addEventListener('click', function () {
      const entry = state.selectedEntry;
      closeView();
      if (entry) openEntryModal(entry.expenseType, entry);
    });
    elements.viewDeleteButton?.addEventListener('click', function () {
      if (state.selectedEntry) deleteEntry(state.selectedEntry);
    });
    elements.fileCloseButton?.addEventListener('click', function () { showFileModal(false); });
  }

  async function init() {
    bindEvents();
    await loadBook();
    applyQueryMode();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
