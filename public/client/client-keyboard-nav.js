(function () {
  const ARROW_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);
  const SKIP_INPUT_TYPES = new Set([
    'button',
    'checkbox',
    'color',
    'file',
    'hidden',
    'image',
    'radio',
    'range',
    'reset',
    'submit'
  ]);
  const ROW_TOLERANCE = 14;

  function isEditableControl(element) {
    if (!element || element.nodeType !== 1) return false;
    const tag = String(element.tagName || '').toLowerCase();
    if (!['input', 'select', 'textarea'].includes(tag)) return false;
    if (element.disabled || element.readOnly) return false;
    if (tag === 'input' && SKIP_INPUT_TYPES.has(String(element.type || '').toLowerCase())) return false;
    return true;
  }

  function isEmptyControl(element) {
    if (!isEditableControl(element)) return false;
    if (element.tagName && String(element.tagName).toLowerCase() === 'select') {
      return String(element.value || '').trim() === '';
    }
    return String(element.value == null ? '' : element.value).trim() === '';
  }

  function isVisible(element) {
    if (!element || element.hidden) return false;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    return Boolean(element.offsetParent || getComputedStyle(element).position === 'fixed');
  }

  function activeScope(element) {
    return element.closest('[data-keyboard-nav-scope]')
      || element.closest('form')
      || element.closest('.portal-modal')
      || document;
  }

  function controlRect(control) {
    const rect = control.getBoundingClientRect();
    return {
      control,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2
    };
  }

  function controlsInScope(scope, current) {
    const root = scope && scope.querySelectorAll ? scope : document;
    return Array.from(root.querySelectorAll('input, select, textarea'))
      .filter(function (control) {
        return control !== current && isEditableControl(control) && isVisible(control);
      })
      .map(controlRect)
      .sort(function (left, right) {
        return left.top - right.top || left.left - right.left;
      });
  }

  function sameVisualRow(item, current) {
    return Math.abs(item.centerY - current.centerY) <= ROW_TOLERANCE;
  }

  function previousInOrder(items, current) {
    const before = items.filter(function (item) {
      return item.top < current.top - ROW_TOLERANCE ||
        (Math.abs(item.top - current.top) <= ROW_TOLERANCE && item.left < current.left);
    });
    return before[before.length - 1] || null;
  }

  function nextInOrder(items, current) {
    return items.find(function (item) {
      return item.top > current.top + ROW_TOLERANCE ||
        (Math.abs(item.top - current.top) <= ROW_TOLERANCE && item.left > current.left);
    }) || null;
  }

  function horizontalTarget(items, current, direction) {
    const sameRow = items.filter(function (item) {
      return sameVisualRow(item, current);
    });
    if (direction < 0) {
      return sameRow
        .filter(function (item) { return item.centerX < current.centerX; })
        .sort(function (left, right) { return right.centerX - left.centerX; })[0]
        || previousInOrder(items, current);
    }
    return sameRow
      .filter(function (item) { return item.centerX > current.centerX; })
      .sort(function (left, right) { return left.centerX - right.centerX; })[0]
      || nextInOrder(items, current);
  }

  function verticalTarget(items, current, direction) {
    const candidates = items.filter(function (item) {
      return direction < 0
        ? item.centerY < current.centerY - ROW_TOLERANCE
        : item.centerY > current.centerY + ROW_TOLERANCE;
    });
    return candidates
      .sort(function (left, right) {
        const leftDy = Math.abs(left.centerY - current.centerY);
        const rightDy = Math.abs(right.centerY - current.centerY);
        const leftDx = Math.abs(left.centerX - current.centerX);
        const rightDx = Math.abs(right.centerX - current.centerX);
        return leftDy - rightDy || leftDx - rightDx || left.left - right.left;
      })[0] || null;
  }

  function focusControl(control) {
    if (!control) return;
    control.focus();
    if (typeof control.select === 'function' && String(control.tagName || '').toLowerCase() === 'input') {
      try { control.select(); } catch (err) {}
    }
  }

  function handleKeydown(event) {
    if (!ARROW_KEYS.has(event.key)) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
    const currentControl = event.target;
    if (!isEmptyControl(currentControl)) return;

    const current = controlRect(currentControl);
    const items = controlsInScope(activeScope(currentControl), currentControl);
    if (!items.length) return;

    const target = event.key === 'ArrowLeft'
      ? horizontalTarget(items, current, -1)
      : event.key === 'ArrowRight'
        ? horizontalTarget(items, current, 1)
        : event.key === 'ArrowUp'
          ? verticalTarget(items, current, -1)
          : verticalTarget(items, current, 1);

    if (!target || !target.control) return;
    event.preventDefault();
    event.stopPropagation();
    focusControl(target.control);
  }

  document.addEventListener('keydown', handleKeydown, true);
  window.clientPortalEmptyArrowNavigation = {
    isEditableControl,
    isEmptyControl
  };
})();
