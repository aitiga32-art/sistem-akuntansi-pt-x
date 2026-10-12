(function () {
  const MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const BOOK_PATHS = [
    'buku-kas',
    'buku-bank',
    'buku-penjualan',
    'buku-pembelian',
    'buku-persediaan',
    'pendapatan-lainnya',
    'jurnal-adjustment',
    'aktiva-penyusutan'
  ];
  const REPORT_PATHS = ['buku-besar', 'neraca-lajur', 'laba-rugi', 'neraca', 'perhitungan-pajak'];
  const API_BOOK_MARKERS = [
    '/buku-kas',
    '/buku-bank',
    '/buku-penjualan',
    '/buku-pembelian',
    '/buku-persediaan',
    '/jurnal-adjustment',
    '/aktiva-penyusutan'
  ];
  const API_REPORT_MARKERS = ['/buku-besar', '/neraca-lajur', '/laporan-keuangan/'];

  const state = {
    monthEl: null,
    yearEl: null,
    badgeEl: null,
    mode: '',
    posting: null
  };

  const nativeFetch = window.fetch.bind(window);
  const now = new Date();
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();
  const LOCKED_ACTION_TITLE = 'Periode ini sudah diposting. De-posting dulu untuk mengubah data.';

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function pageSlug() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function queryNumber(name, fallback, options) {
    const raw = new URLSearchParams(window.location.search).get(name);
    const value = Number(raw);
    const allowZero = Boolean(options && options.allowZero);
    const minimum = allowZero ? 0 : 1;
    return Number.isFinite(value) && value >= minimum ? value : fallback;
  }

  function currentPeriod() {
    const monthValue = Number(state.monthEl?.value || queryNumber('month', defaultMonth, { allowZero: true }));
    return {
      month: Math.min(12, Math.max(0, monthValue)),
      year: Math.min(9999, Math.max(1900, Number(state.yearEl?.value || queryNumber('year', defaultYear))))
    };
  }

  function currentYear() {
    return Math.min(9999, Math.max(1900, Number(state.yearEl?.value || queryNumber('year', defaultYear))));
  }

  function syncUrl() {
    const params = new URLSearchParams(window.location.search);
    if (state.mode === 'book') {
      const period = currentPeriod();
      params.set('month', String(period.month));
      params.set('year', String(period.year));
    } else if (state.mode === 'report') {
      params.set('year', String(currentYear()));
    }
    const next = window.location.pathname + '?' + params.toString();
    window.history.replaceState({}, '', next);
  }

  function appendQuery(url) {
    const parsed = new URL(url, window.location.origin);
    const path = parsed.pathname;
    const slug = pageSlug();
    const mode = state.mode || (BOOK_PATHS.includes(slug) ? 'book' : REPORT_PATHS.includes(slug) ? 'report' : '');
    if (mode === 'book' && API_BOOK_MARKERS.some(marker => path.includes(marker))) {
      const period = currentPeriod();
      parsed.searchParams.set('month', String(period.month));
      parsed.searchParams.set('year', String(period.year));
    } else if (mode === 'report' && API_REPORT_MARKERS.some(marker => path.includes(marker))) {
      parsed.searchParams.set('year', String(currentYear()));
    }
    return parsed.pathname + parsed.search + parsed.hash;
  }

  function fillMonths(select) {
    const allOption = document.createElement('option');
    allOption.value = '0';
    allOption.textContent = 'Semua Bulan';
    select.appendChild(allOption);
    MONTHS.forEach(function (label, index) {
      const option = document.createElement('option');
      option.value = String(index + 1);
      option.textContent = label;
      select.appendChild(option);
    });
  }

  function createYearInput(value) {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '2020';
    input.max = '2099';
    input.step = '1';
    input.value = String(value);
    input.className = 'client-period-year';
    input.setAttribute('aria-label', 'Tahun');
    return input;
  }

  function mountControls() {
    const slug = pageSlug();
    const isBook = BOOK_PATHS.includes(slug);
    const isReport = REPORT_PATHS.includes(slug);
    if (!isBook && !isReport) return;
    if (document.querySelector('.client-period-filter')) return;

    state.mode = isBook ? 'book' : 'report';
    const main = document.querySelector('.client-main');
    const toolbar = document.querySelector('.cashbook-toolbar-actions')
      || document.querySelector('.cashbook-toolbar')
      || document.querySelector('.ledger-filterbar');
    const reportSheet = document.querySelector('.financial-report-sheet');
    if (!toolbar && !main) return;

    const wrap = document.createElement('div');
    wrap.className = 'client-period-filter';

    const label = document.createElement('span');
    label.className = 'client-period-label';
    label.textContent = isBook ? 'Periode' : 'Tahun';
    wrap.appendChild(label);

    if (isBook) {
      const month = document.createElement('select');
      month.className = 'client-period-month';
      month.setAttribute('aria-label', 'Bulan');
      fillMonths(month);
      month.value = String(queryNumber('month', defaultMonth, { allowZero: true }));
      state.monthEl = month;
      wrap.appendChild(month);
    }

    state.yearEl = createYearInput(queryNumber('year', defaultYear));
    wrap.appendChild(state.yearEl);

    if (isBook) {
      const badge = document.createElement('span');
      badge.className = 'client-period-posting-badge';
      badge.textContent = 'Belum diposting';
      state.badgeEl = badge;
      wrap.appendChild(badge);
    }

    const reload = function () {
      syncUrl();
      window.dispatchEvent(new CustomEvent('client-period:change'));
      const refresh = document.querySelector('.portal-refresh');
      if (refresh && !refresh.disabled) {
        refresh.click();
      } else {
        window.location.reload();
      }
    };

    if (state.monthEl) state.monthEl.addEventListener('change', reload);
    if (state.yearEl) state.yearEl.addEventListener('change', reload);

    if (toolbar) {
      toolbar.appendChild(wrap);
    } else if (isReport && main && reportSheet && reportSheet.parentNode === main) {
      wrap.classList.add('client-period-filter-block');
      main.insertBefore(wrap, reportSheet);
    } else if (main) {
      wrap.classList.add('client-period-filter-block');
      main.appendChild(wrap);
    }
    syncUrl();
  }

  function renderPosting(posting) {
    state.posting = posting || null;
    const allMonths = Boolean(posting && Number(posting.month) === 0);
    const locked = Boolean(posting && posting.isPosted && !allMonths);
    if (state.badgeEl) {
      if (allMonths) {
        state.badgeEl.textContent = 'Semua bulan dalam tahun ini';
      } else {
        state.badgeEl.textContent = locked ? 'Diposting dan terkunci' : 'Belum diposting';
      }
      state.badgeEl.classList.toggle('posted', locked);
    }
    document.body.classList.toggle('client-period-posted', locked);
    lockButtons(locked);
  }

  function lockButtons(locked) {
    if (state.mode !== 'book') return;
    const selector = [
      '.cashbook-add-button',
      '.sales-delete-selected-button',
      '.cashbook-action-button:not([data-readonly-action="true"])',
      '.sales-action-button:not([data-readonly-action="true"])'
    ].join(',');
    document.querySelectorAll(selector).forEach(function (button) {
      if (!button.dataset.periodLockedOriginalDisabled) {
        button.dataset.periodLockedOriginalDisabled = button.disabled ? '1' : '0';
      }
      const readonlyAction = /lihat|invoice|kwitansi|file/i.test(text(button.textContent));
      if (readonlyAction) {
        button.disabled = false;
        button.classList.remove('period-locked-action');
        if (button.title === LOCKED_ACTION_TITLE) button.title = '';
        return;
      }
      button.disabled = locked || button.dataset.periodLockedOriginalDisabled === '1';
      button.classList.toggle('period-locked-action', locked);
      if (locked) {
        button.title = LOCKED_ACTION_TITLE;
      } else if (button.title === LOCKED_ACTION_TITLE) {
        button.title = '';
      }
    });
    document.querySelectorAll('input.sales-row-checkbox').forEach(function (input) {
      input.disabled = locked;
      if (locked) input.checked = false;
    });
  }

  function patchFetch() {
    window.fetch = function (input, init) {
      const method = text(init && init.method, 'GET').toUpperCase();
      let nextInput = input;
      if (method === 'GET' && typeof input === 'string' && input.startsWith('/app/api/client/clients/')) {
        nextInput = appendQuery(input);
      }
      return nativeFetch(nextInput, init).then(function (response) {
        if (method === 'GET' && response && response.ok) {
          response.clone().json().then(function (data) {
            if (data && data.period && data.posting) {
              renderPosting(data.posting);
            }
            if (data && data.reportYear && state.yearEl && Number(state.yearEl.value) !== Number(data.reportYear)) {
              state.yearEl.value = String(data.reportYear);
            }
          }).catch(function () {});
        }
        return response;
      });
    };
  }

  function observeLocks() {
    const observer = new MutationObserver(function () {
      if (state.posting) lockButtons(Boolean(state.posting.isPosted));
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function shouldShowPopupAlert(message) {
    return /^belum ada file\b/i.test(text(message));
  }

  function ensureMessageModal() {
    let backdrop = document.getElementById('clientMessageModal');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.className = 'portal-modal-backdrop client-message-modal-backdrop';
    backdrop.id = 'clientMessageModal';
    backdrop.hidden = true;
    backdrop.innerHTML = [
      '<section class="portal-modal client-message-modal" role="dialog" aria-modal="true" aria-labelledby="clientMessageModalTitle">',
      '  <header class="portal-modal-header">',
      '    <div>',
      '      <h2 id="clientMessageModalTitle">Informasi</h2>',
      '      <span id="clientMessageModalMeta">Client Portal</span>',
      '    </div>',
      '    <button class="icon-button" type="button" data-client-message-close aria-label="Tutup popup">',
      '      <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
      '    </button>',
      '  </header>',
      '  <div class="client-message-modal-body">',
      '    <span class="client-message-modal-icon" aria-hidden="true">i</span>',
      '    <p id="clientMessageModalText"></p>',
      '  </div>',
      '  <footer class="portal-modal-footer">',
      '    <button class="submit modal-submit" type="button" data-client-message-close>Mengerti</button>',
      '  </footer>',
      '</section>'
    ].join('');
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop || event.target.closest('[data-client-message-close]')) {
        backdrop.hidden = true;
      }
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !backdrop.hidden) backdrop.hidden = true;
    });
    document.body.appendChild(backdrop);
    return backdrop;
  }

  function showMessageModal(message, options) {
    const cleanMessage = text(message);
    if (!cleanMessage) return;
    const backdrop = ensureMessageModal();
    const title = backdrop.querySelector('#clientMessageModalTitle');
    const meta = backdrop.querySelector('#clientMessageModalMeta');
    const body = backdrop.querySelector('#clientMessageModalText');
    if (title) title.textContent = text(options && options.title, 'Informasi');
    if (meta) meta.textContent = text(options && options.meta, 'Client Portal');
    if (body) body.textContent = cleanMessage;
    backdrop.hidden = false;
    const closeButton = backdrop.querySelector('[data-client-message-close]');
    if (closeButton) closeButton.focus();
  }

  function promoteAlertToPopup(alertEl) {
    if (!alertEl || alertEl.hidden) return;
    const message = text(alertEl.textContent);
    if (!shouldShowPopupAlert(message)) return;
    alertEl.hidden = true;
    showMessageModal(message, {
      title: 'File Belum Tersedia',
      meta: 'Lampiran data belum di-upload'
    });
  }

  function observePopupAlerts() {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        const target = mutation.target && mutation.target.nodeType === 1
          ? mutation.target
          : mutation.target && mutation.target.parentElement;
        const alertEl = target && target.closest ? target.closest('.portal-alert') : null;
        if (alertEl) promoteAlertToPopup(alertEl);
      });
    });
    document.querySelectorAll('.portal-alert').forEach(function (alertEl) {
      promoteAlertToPopup(alertEl);
      observer.observe(alertEl, {
        attributes: true,
        attributeFilter: ['hidden', 'class'],
        childList: true,
        characterData: true,
        subtree: true
      });
    });
  }

  window.clientPortalShowMessage = showMessageModal;

  window.ClientPortalPeriod = {
    currentPeriod,
    currentYear,
    renderPosting
  };

  patchFetch();
  document.addEventListener('DOMContentLoaded', function () {
    mountControls();
    observeLocks();
    observePopupAlerts();
  });
})();
