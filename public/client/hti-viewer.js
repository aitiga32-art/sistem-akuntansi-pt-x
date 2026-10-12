(function () {
  function text(value, fallback) {
    const clean = value == null ? '' : String(value).trim();
    return clean || (fallback == null ? '' : String(fallback));
  }

  function parseAmount(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const clean = text(value).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number(clean);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatAmount(value) {
    const amount = Math.round(parseAmount(value));
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(amount);
  }

  function formatDate(value) {
    const clean = text(value);
    if (!clean) return '-';
    const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return match[3] + '/' + match[2] + '/' + match[1];
    return clean;
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/clients\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function ensureModal() {
    let modal = document.getElementById('htiJournalPreviewModal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'htiJournalPreviewModal';
    modal.className = 'portal-modal-backdrop hti-journal-preview-modal';
    modal.hidden = true;
    modal.innerHTML = [
      '<section class="portal-modal portal-modal-wide" role="dialog" aria-modal="true" aria-labelledby="htiJournalPreviewTitle">',
        '<header class="portal-modal-header">',
          '<div>',
            '<h2 id="htiJournalPreviewTitle">Preview Jurnal</h2>',
            '<span id="htiJournalPreviewMeta">Baris jurnal yang akan terbentuk saat data disimpan.</span>',
          '</div>',
          '<button class="icon-button" type="button" data-hti-journal-preview-close aria-label="Tutup">',
            '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
          '</button>',
        '</header>',
        '<div class="hti-journal-preview-body" id="htiJournalPreviewBody"></div>',
        '<footer class="portal-modal-footer">',
          '<button class="ghost-button" type="button" data-hti-journal-preview-close>Tutup</button>',
        '</footer>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.closest('[data-hti-journal-preview-close]')) {
        modal.hidden = true;
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) modal.hidden = true;
    });
    return modal;
  }

  function renderRows(modal, payload) {
    const title = modal.querySelector('#htiJournalPreviewTitle');
    const meta = modal.querySelector('#htiJournalPreviewMeta');
    const body = modal.querySelector('#htiJournalPreviewBody');
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    const totals = payload.totals || {};
    title.textContent = text(payload.title, 'Preview Jurnal');
    meta.textContent = text(payload.meta, 'Baris jurnal yang akan terbentuk saat data disimpan.');
    clearNode(body);

    const summary = document.createElement('div');
    summary.className = 'hti-journal-preview-summary';
    [
      ['Total Debet', totals.debit],
      ['Total Kredit', totals.credit],
      ['Selisih', totals.balanceDifference]
    ].forEach(function (item) {
      const card = document.createElement('div');
      const span = document.createElement('span');
      span.textContent = item[0];
      const strong = document.createElement('strong');
      strong.textContent = 'Rp ' + formatAmount(item[1]);
      card.appendChild(span);
      card.appendChild(strong);
      summary.appendChild(card);
    });
    body.appendChild(summary);

    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = text(payload.emptyMessage, 'Belum ada jurnal yang terbentuk. Isi minimal nominal transaksi terlebih dahulu.');
      body.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'cashbook-table hti-journal-preview-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Tanggal', 'Sumber', 'COA', 'Nama Akun', 'Keterangan', 'Debet', 'Kredit'].forEach(function (label) {
      const th = document.createElement('th');
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    rows.forEach(function (row) {
      const tr = document.createElement('tr');
      [
        formatDate(row.tanggal),
        text(row.sumber, '-'),
        text(row.coa, '-'),
        text(row.accountName, '-'),
        text(row.keterangan, '-')
      ].forEach(function (value) {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      const debit = document.createElement('td');
      debit.className = 'number';
      debit.textContent = formatAmount(row.debit);
      const credit = document.createElement('td');
      credit.className = 'number';
      credit.textContent = formatAmount(row.credit);
      tr.appendChild(debit);
      tr.appendChild(credit);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    body.appendChild(table);
  }

  async function open(options) {
    const clientId = text(options && options.clientId) || clientIdFromPath();
    if (!clientId) throw new Error('Client ID tidak ditemukan.');
    const response = await window.fetch('/app/api/client/clients/' + encodeURIComponent(clientId) + '/pt-x-journal-preview', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: options.type,
        entries: options.entries || [],
        entry: options.entry || null
      })
    });
    const data = await response.json().catch(function () { return {}; });
    if (!response.ok || data.ok === false) throw new Error(data.error || 'Preview jurnal gagal dibuka.');
    const modal = ensureModal();
    renderRows(modal, {
      title: options.title,
      meta: options.meta,
      rows: data.rows,
      totals: data.totals,
      emptyMessage: options.emptyMessage
    });
    modal.hidden = false;
  }

  window.clientPortalHtiJournalPreview = { open };
})();
