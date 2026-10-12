(function () {
  const state = {
    loading: false
  };

  const elements = {
    alert: document.getElementById('portalAlert'),
    clientName: document.getElementById('portalClientName'),
    clientMeta: document.getElementById('portalClientMeta'),
    subtitle: document.getElementById('portalSubtitle'),
    userName: document.getElementById('portalUserName'),
    userEmail: document.getElementById('portalUserEmail'),
    refreshButton: document.getElementById('clientRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    metricDocuments: document.getElementById('metricDocuments'),
    metricWorks: document.getElementById('metricWorks'),
    metricFollowUps: document.getElementById('metricFollowUps'),
    metricLastLogin: document.getElementById('metricLastLogin'),
    documentsCount: document.getElementById('documentsCount'),
    documentsList: document.getElementById('documentsList'),
    workCount: document.getElementById('workCount'),
    workList: document.getElementById('workList'),
    followCount: document.getElementById('followCount'),
    followList: document.getElementById('followList'),
    profileList: document.getElementById('profileList')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

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

  function formatDate(value) {
    const raw = text(value);
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw.slice(0, 10);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  function formatDateTime(value) {
    const raw = text(value);
    if (!raw) return '-';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function countFiles(sections) {
    return (Array.isArray(sections) ? sections : []).reduce(function (total, section) {
      return total + (Array.isArray(section.files) ? section.files.length : 0);
    }, 0);
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat client portal.');
    return data;
  }

  async function loadPortal() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson('/app/api/client/session');
      if (!data) return;
      renderPortal(data);
    } catch (err) {
      setAlert(err.message || 'Gagal memuat client portal.', 'error');
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

  function renderPortal(data) {
    const client = data.client || {};
    const user = data.user || {};
    const documents = Array.isArray(data.documents) ? data.documents : [];
    const workItems = Array.isArray(data.workItems) ? data.workItems : [];
    const followUps = Array.isArray(data.followUps) ? data.followUps : [];
    const summary = data.summary || {};
    const documentCount = Number(summary.documentCount || countFiles(documents) || 0);

    setText(elements.clientName, text(client.name, 'Client Portal'));
    setText(elements.clientMeta, [text(client.jenisWp), text(client.kpp)].filter(Boolean).join(' | ') || 'PT X');
    setText(elements.subtitle, text(client.name) ? 'Dokumen dan monitoring pekerjaan untuk ' + client.name + '.' : 'Dokumen dan monitoring pekerjaan klien.');
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
    setText(elements.metricDocuments, String(documentCount));
    setText(elements.metricWorks, String(Number(summary.workCount || workItems.length || 0)));
    setText(elements.metricFollowUps, String(Number(summary.followUpCount || followUps.length || 0)));
    setText(elements.metricLastLogin, summary.lastLoginAt ? formatDate(summary.lastLoginAt) : '-');
    setText(elements.documentsCount, documentCount + ' file');
    setText(elements.workCount, workItems.length + ' item');
    setText(elements.followCount, followUps.length + ' catatan');

    renderDocuments(documents);
    renderWorkItems(workItems);
    renderFollowUps(followUps);
    renderProfile(client, user);
  }

  function renderDocuments(sections) {
    clearNode(elements.documentsList);
    if (!sections.length) {
      elements.documentsList.appendChild(emptyState('Belum ada dokumen yang tersedia di portal.'));
      return;
    }
    sections.forEach(function (section) {
      const card = document.createElement('article');
      card.className = 'document-section';

      const title = document.createElement('h3');
      title.textContent = text(section.label, 'Dokumen');
      card.appendChild(title);

      const list = document.createElement('div');
      list.className = 'file-list';
      (Array.isArray(section.files) ? section.files : []).forEach(function (file) {
        list.appendChild(renderFileItem(file));
      });
      card.appendChild(list);
      elements.documentsList.appendChild(card);
    });
  }

  function renderFileItem(file) {
    const row = document.createElement('div');
    row.className = 'file-item';

    const detail = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = text(file.name, 'Dokumen');
    const meta = document.createElement('span');
    meta.textContent = [text(file.mimeType), file.uploadedAt ? formatDate(file.uploadedAt) : ''].filter(Boolean).join(' | ') || 'File portal';
    detail.appendChild(name);
    detail.appendChild(meta);

    const link = document.createElement('a');
    link.href = text(file.viewUrl, '#');
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Buka';

    row.appendChild(detail);
    row.appendChild(link);
    return row;
  }

  function renderWorkItems(items) {
    clearNode(elements.workList);
    if (!items.length) {
      elements.workList.appendChild(emptyState('Belum ada status pekerjaan yang dibuka untuk portal ini.'));
      return;
    }
    items.forEach(function (item) {
      const row = document.createElement('article');
      row.className = 'work-row';

      const title = document.createElement('div');
      title.className = 'row-title';
      const name = document.createElement('strong');
      name.textContent = [item.taxYear, item.returnType, item.sptStatus].map(text).filter(Boolean).join(' / ') || 'Pekerjaan Pajak';
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = text(item.status, 'Status');
      title.appendChild(name);
      title.appendChild(badge);

      const meta = document.createElement('p');
      meta.className = 'row-meta';
      meta.textContent = [
        item.assignedStaff ? 'PIC: ' + item.assignedStaff : '',
        item.deadlineDate ? 'Deadline: ' + formatDate(item.deadlineDate) : '',
        item.updatedAt ? 'Update: ' + formatDateTime(item.updatedAt) : ''
      ].filter(Boolean).join(' | ') || 'Belum ada detail tambahan.';

      row.appendChild(title);
      row.appendChild(meta);
      elements.workList.appendChild(row);
    });
  }

  function renderFollowUps(items) {
    clearNode(elements.followList);
    if (!items.length) {
      elements.followList.appendChild(emptyState('Belum ada tindak lanjut terbaru.'));
      return;
    }
    items.forEach(function (item) {
      const row = document.createElement('article');
      row.className = 'follow-row';

      const title = document.createElement('div');
      title.className = 'row-title';
      const name = document.createElement('strong');
      name.textContent = text(item.title, 'Tindak lanjut');
      const badge = document.createElement('span');
      badge.className = item.status && item.status.toLowerCase() !== 'selesai' ? 'badge warn' : 'badge';
      badge.textContent = text(item.status, 'Open');
      title.appendChild(name);
      title.appendChild(badge);

      const meta = document.createElement('p');
      meta.className = 'row-meta';
      meta.textContent = [
        item.nextFollowUpDate ? 'Follow up: ' + formatDate(item.nextFollowUpDate) : '',
        item.meetingDate ? 'Meeting: ' + formatDate(item.meetingDate) : '',
        item.requestedDocuments ? 'Dokumen: ' + item.requestedDocuments : '',
        item.actionCount ? item.actionCount + ' action item' : ''
      ].filter(Boolean).join(' | ') || 'Tidak ada detail tambahan.';

      row.appendChild(title);
      row.appendChild(meta);
      elements.followList.appendChild(row);
    });
  }

  function renderProfile(client, user) {
    clearNode(elements.profileList);
    [
      ['Nama Klien', client.name],
      ['Jenis WP', client.jenisWp],
      ['NIK/NPWP', client.nikNpwp],
      ['Email Klien', client.email],
      ['KPP', client.kpp],
      ['Kontak Portal', user.contactName || user.displayName],
      ['Update Data', client.updatedAt ? formatDateTime(client.updatedAt) : '']
    ].forEach(function (item) {
      elements.profileList.appendChild(profileItem(item[0], item[1]));
    });
  }

  function profileItem(label, value) {
    const row = document.createElement('div');
    row.className = 'profile-item';
    const labelNode = document.createElement('span');
    labelNode.textContent = label;
    const valueNode = document.createElement('strong');
    valueNode.textContent = text(value, '-');
    row.appendChild(labelNode);
    row.appendChild(valueNode);
    return row;
  }

  if (elements.refreshButton) {
    elements.refreshButton.addEventListener('click', loadPortal);
  }
  if (elements.logoutButton) {
    elements.logoutButton.addEventListener('click', logout);
  }

  loadPortal();
})();
