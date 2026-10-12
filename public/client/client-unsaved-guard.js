(function () {
  const GUARD_CONFIGS = [
    {
      modal: '#htiEntryModal',
      form: '#htiEntryForm',
      close: '#htiEntryCloseBtn, #htiEntryCancelBtn',
      back: '#htiBackLink',
      title: 'Data belum disimpan',
      message: 'Data yang sudah diinput di form ini belum tersimpan. Jika dilanjutkan, perubahan akan hilang.'
    },
    {
      modal: '#htiPaymentModal',
      form: '#htiPaymentForm',
      close: '#htiPaymentCloseBtn, #htiPaymentCancelBtn',
      back: '#htiBackLink',
      title: 'Pembayaran belum disimpan',
      message: 'Data pembayaran belum tersimpan. Jika dilanjutkan, perubahan akan hilang.'
    },
    {
      modal: '#htiControlPaymentModal',
      form: '#htiControlPaymentForm',
      close: '#htiControlPaymentCloseBtn, #htiControlPaymentCancelBtn',
      back: '#htiBackLink',
      title: 'Pembayaran belum disimpan',
      message: 'Data pembayaran dari Buku Kontrol belum tersimpan. Jika dilanjutkan, perubahan akan hilang.'
    },
    {
      modal: '#bukuBankModal',
      form: '#bukuBankForm',
      close: '#bukuBankCloseBtn, #bukuBankCancelBtn',
      back: '#bukuBankBackLink',
      title: 'Data belum disimpan',
      message: 'Data Buku Bank yang sudah diinput belum tersimpan. Jika dilanjutkan, perubahan akan hilang.'
    },
    {
      modal: '#bukuBankAdvanceModal',
      form: '#bukuBankAdvanceForm',
      close: '#bukuBankAdvanceCloseBtn, #bukuBankAdvanceCancelBtn',
      back: '#bukuBankBackLink',
      title: 'Uang muka belum disimpan',
      message: 'Data uang muka belum tersimpan. Jika dilanjutkan, perubahan akan hilang.'
    },
    {
      modal: '#bukuKasModal',
      form: '#bukuKasForm',
      close: '#bukuKasCloseBtn, #bukuKasCancelBtn',
      back: '#bukuKasBackLink',
      title: 'Data belum disimpan',
      message: 'Data Buku Kas yang sudah diinput belum tersimpan. Jika dilanjutkan, perubahan akan hilang.'
    },
    {
      modal: '#assetModal',
      form: '#assetForm',
      close: '#assetCloseBtn, #assetCancelBtn',
      back: '#assetBackLink',
      title: 'Aktiva belum disimpan',
      message: 'Data Buku Aktiva yang sudah diinput belum tersimpan. Jika dilanjutkan, perubahan akan hilang.'
    },
    {
      modal: '#htiExpenseModal',
      form: '#htiExpenseForm',
      close: '#htiExpenseCloseBtn, #htiExpenseCancelBtn',
      back: '#htiExpenseBackLink',
      title: 'Biaya belum disimpan',
      message: 'Data biaya yang sudah diinput belum tersimpan. Jika dilanjutkan, perubahan akan hilang.'
    }
  ];

  const state = {
    guards: [],
    confirmOpen: false
  };

  function visible(element) {
    return Boolean(element && !element.hidden);
  }

  function closestElement(target, selector) {
    const element = target && target.nodeType === 1 ? target : target?.parentElement;
    return element?.closest(selector) || null;
  }

  function controlValue(control, index) {
    const type = String(control.type || '').toLowerCase();
    const key = control.id || control.name || control.getAttribute('data-hti-line-field') || control.getAttribute('data-bank-detail-field') || control.getAttribute('data-cash-detail-field') || String(index);
    if (['button', 'submit', 'reset', 'image'].includes(type)) return null;
    if (type === 'file') {
      const files = window.clientPortalSelectedFiles
        ? window.clientPortalSelectedFiles(control)
        : Array.from(control.files || []);
      return [key, files.map(function (file) {
        return [file.name || '', file.size || 0, file.lastModified || 0].join(':');
      }).join('|')];
    }
    if (type === 'checkbox' || type === 'radio') return [key, control.checked ? '1' : '0'];
    return [key, control.value == null ? '' : String(control.value)];
  }

  function snapshotForm(form) {
    if (!form) return '';
    return JSON.stringify(Array.from(form.elements || [])
      .map(controlValue)
      .filter(Boolean));
  }

  function captureSnapshot(guard) {
    window.setTimeout(function () {
      if (!visible(guard.modal)) return;
      guard.snapshot = snapshotForm(guard.form);
      guard.ready = true;
    }, 0);
  }

  function isDirty(guard) {
    if (!guard || !guard.ready || !visible(guard.modal)) return false;
    if (guard.form && guard.form.querySelector('[data-bankbook-view-only], [data-cashbook-view-only]')) return false;
    return snapshotForm(guard.form) !== guard.snapshot;
  }

  function createConfirmModal() {
    let modal = document.getElementById('clientUnsavedConfirm');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'clientUnsavedConfirm';
    modal.className = 'portal-modal-backdrop client-unsaved-confirm-backdrop';
    modal.hidden = true;
    modal.innerHTML = [
      '<section class="portal-modal client-unsaved-confirm" role="dialog" aria-modal="true" aria-labelledby="clientUnsavedConfirmTitle">',
        '<header class="portal-modal-header">',
          '<div>',
            '<h2 id="clientUnsavedConfirmTitle">Data belum disimpan</h2>',
            '<span data-unsaved-meta>Konfirmasi sebelum keluar dari form.</span>',
          '</div>',
        '</header>',
        '<div class="client-unsaved-confirm-body">',
          '<p id="clientUnsavedConfirmMessage">Data yang sudah diinput belum tersimpan.</p>',
        '</div>',
        '<footer class="portal-modal-footer client-unsaved-confirm-actions">',
          '<button class="ghost-button" type="button" data-unsaved-stay>Tetap isi form</button>',
          '<button class="danger-button" type="button" data-unsaved-leave>Keluar tanpa simpan</button>',
        '</footer>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);
    return modal;
  }

  function showDecision(config) {
    if (state.confirmOpen) return Promise.resolve(false);
    const options = typeof config === 'string' ? { message: config } : Object.assign({}, config || {});
    const modal = createConfirmModal();
    const title = modal.querySelector('#clientUnsavedConfirmTitle');
    const meta = modal.querySelector('[data-unsaved-meta]');
    const message = modal.querySelector('#clientUnsavedConfirmMessage');
    const stayButton = modal.querySelector('[data-unsaved-stay]');
    const leaveButton = modal.querySelector('[data-unsaved-leave]');
    if (title) title.textContent = options.title || 'Konfirmasi';
    if (meta) meta.textContent = options.meta || 'Mohon pastikan sebelum melanjutkan.';
    if (message) message.textContent = options.message || 'Apakah kamu yakin ingin melanjutkan?';
    if (stayButton) stayButton.textContent = options.cancelText || 'Batal';
    if (leaveButton) leaveButton.textContent = options.confirmText || 'Ya, lanjutkan';
    const enterConfirms = options.enterConfirms !== false && options.confirmOnEnter !== false;
    modal.hidden = false;
    state.confirmOpen = true;
    return new Promise(function (resolve) {
      let settled = false;
      function cleanup(result) {
        if (settled) return;
        settled = true;
        modal.hidden = true;
        state.confirmOpen = false;
        stayButton.removeEventListener('click', stay);
        leaveButton.removeEventListener('click', leave);
        document.removeEventListener('keydown', handleConfirmKeydown, true);
        resolve(result);
      }
      function stay() {
        cleanup(false);
      }
      function leave() {
        cleanup(true);
      }
      function handleConfirmKeydown(event) {
        if (modal.hidden || event.isComposing) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopImmediatePropagation();
          stay();
          return;
        }
        if (!enterConfirms || event.key !== 'Enter') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        leave();
      }
      stayButton.addEventListener('click', stay);
      leaveButton.addEventListener('click', leave);
      document.addEventListener('keydown', handleConfirmKeydown, true);
      window.setTimeout(function () {
        (enterConfirms ? leaveButton : stayButton).focus();
      }, 0);
    });
  }

  function confirmDiscard(guard) {
    return showDecision({
      title: guard.title || 'Data belum disimpan',
      meta: 'Konfirmasi sebelum keluar dari form.',
      message: guard.message || 'Data yang sudah diinput belum tersimpan. Jika dilanjutkan, perubahan akan hilang.',
      cancelText: 'Tetap isi form',
      confirmText: 'Keluar tanpa simpan',
      enterConfirms: true
    });
  }

  function topVisibleBackdrop() {
    const backdrops = Array.from(document.querySelectorAll('.portal-modal-backdrop')).filter(function (modal) {
      return !modal.hidden;
    });
    return backdrops[backdrops.length - 1] || null;
  }

  function dirtyGuardForTarget(target, selectorKey) {
    return state.guards.find(function (guard) {
      if (!visible(guard.modal) || !isDirty(guard)) return false;
      return Boolean(closestElement(target, guard[selectorKey]));
    }) || null;
  }

  function dirtyGuardForEscape() {
    const top = topVisibleBackdrop();
    return state.guards.find(function (guard) {
      return top === guard.modal && isDirty(guard);
    }) || null;
  }

  function proceedClose(guard, target) {
    const button = closestElement(target, guard.closeSelector) || document.querySelector(guard.closeSelector);
    if (!button) return;
    guard.allowNextClose = true;
    button.click();
  }

  function bindGuard(config) {
    const modal = document.querySelector(config.modal);
    const form = document.querySelector(config.form);
    if (!modal || !form) return null;
    const guard = {
      modal,
      form,
      closeSelector: config.close,
      backSelector: config.back,
      close: config.close,
      back: config.back,
      title: config.title,
      message: config.message,
      snapshot: '',
      ready: false,
      allowNextClose: false
    };
    const observer = new MutationObserver(function () {
      if (visible(modal)) {
        guard.ready = false;
        captureSnapshot(guard);
      }
    });
    observer.observe(modal, { attributes: true, attributeFilter: ['hidden'] });
    if (visible(modal)) captureSnapshot(guard);
    return guard;
  }

  function bindGlobalEvents() {
    document.addEventListener('click', function (event) {
      if (closestElement(event.target, '#clientUnsavedConfirm')) return;

      const closeGuard = dirtyGuardForTarget(event.target, 'close');
      if (closeGuard) {
        if (closeGuard.allowNextClose) {
          closeGuard.allowNextClose = false;
          return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        confirmDiscard(closeGuard).then(function (confirmed) {
          if (confirmed) proceedClose(closeGuard, event.target);
        });
        return;
      }

      const backGuard = dirtyGuardForTarget(event.target, 'back');
      if (backGuard) {
        const link = closestElement(event.target, backGuard.backSelector);
        if (!link) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        confirmDiscard(backGuard).then(function (confirmed) {
          if (confirmed) window.location.assign(link.href);
        });
      }
    }, true);

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || state.confirmOpen) return;
      const guard = dirtyGuardForEscape();
      if (!guard) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      confirmDiscard(guard).then(function (confirmed) {
        if (confirmed) proceedClose(guard, document.querySelector(guard.closeSelector));
      });
    }, true);
  }

  state.guards = GUARD_CONFIGS.map(bindGuard).filter(Boolean);
  if (state.guards.length) bindGlobalEvents();
  window.clientPortalConfirm = showDecision;
})();
