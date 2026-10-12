(function () {
  const CACHE_PREFIX = 'clientBookNav:v20260612-sales-mbarep-grid:';
  const CACHE_TTL_MS = 10 * 60 * 1000;

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function parseMoneyInputValue(value) {
    if (value == null || value === '') return 0;
    const raw = String(value).trim();
    if (!raw) return 0;
    const cleaned = raw
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatMoneyInputValue(value) {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    const isNegative = raw.startsWith('-');
    const hasDecimalComma = raw.includes(',');
    const [integerRaw, decimalRaw] = raw.split(',');
    const digits = integerRaw.replace(/[^0-9]/g, '');
    const integer = digits ? digits.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
    const decimal = hasDecimalComma ? ',' + String(decimalRaw || '').replace(/[^0-9]/g, '').slice(0, 2) : '';
    return (isNegative && integer !== '0' ? '-' : '') + integer + decimal;
  }

  function isMoneyInput(input) {
    if (!input || input.nodeType !== 1 || input.tagName !== 'INPUT') return false;
    const type = text(input.getAttribute('type'), 'text').toLowerCase();
    if (!['text', 'search', 'tel'].includes(type)) return false;
    if (input.matches('[data-rupiah="true"], [data-money="true"]')) return true;
    if (input.readOnly || input.disabled) return false;
    const marker = [
      input.id,
      input.name,
      input.className,
      input.getAttribute('aria-label'),
      input.getAttribute('placeholder')
    ].map(text).join(' ').toLowerCase();
    if (!marker) return false;
    if (/\b(no|nomor|nik|npwp|invoice|faktur|kwitansi|tanggal|date|email|phone|password|search|cari|coa)\b/.test(marker)) return false;
    return /(nominal|amount|jumlah|dpp|ppn|pph|saldo|pelunasan|harga|price|discount|disc|debit|credit|debet|kredit|masuk|keluar|perolehan|nilai|tagihan|piutang|hutang|tarif|cost)/.test(marker);
  }

  function formatMoneyInput(input) {
    if (!isMoneyInput(input) || input.value == null || input.value === '') return;
    input.value = formatMoneyInputValue(input.value);
  }

  function initMoneyFormatting() {
    window.clientParseMoneyInput = parseMoneyInputValue;
    window.clientFormatMoneyInput = formatMoneyInput;
    window.clientFormatMoneyValue = formatMoneyInputValue;
    document.addEventListener('input', function (event) {
      const input = event.target;
      if (!isMoneyInput(input) || input.dataset.moneyFormatting === '1') return;
      input.dataset.moneyFormatting = '1';
      formatMoneyInput(input);
      input.dataset.moneyFormatting = '';
    }, true);
    document.addEventListener('blur', function (event) {
      formatMoneyInput(event.target);
    }, true);
  }

  function menuIconLabel(label) {
    const key = text(label).toUpperCase().replace(/[^A-Z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (key.includes('KAS KECIL')) return 'KAS';
    if (key.includes('KAS BESAR')) return 'KAS2';
    if (key.includes('INVOICE')) return 'INV';
    if (key.includes('PROJECT')) return 'PRJ';
    if (key.includes('BIAYA')) return 'BYA';
    if (key.includes('BANK')) return 'BNK';
    if (key.includes('PENJUALAN')) return 'JUAL';
    if (key.includes('PENDAPATAN')) return 'PDPT';
    if (key.includes('PEMBELIAN')) return 'BELI';
    if (key.includes('PERSEDIAAN')) return 'STOK';
    if (key.includes('BUKTI POTONG')) return 'BPT';
    if (key.includes('BENGKEL')) return 'BKL';
    if (key.includes('LAIN')) return 'LAIN';
    if (key.includes('JURNAL')) return 'ADJ';
    if (key === 'BUKU BESAR') return 'BB';
    if (key.includes('NERACA LAJUR')) return 'NL';
    if (key.includes('AKTIVA') || key.includes('PENYUSUTAN')) return 'AKT';
    if (key.includes('POSTING')) return 'PST';
    if (key === 'NERACA') return 'NRC';
    if (key.includes('LABA RUGI')) return 'LR';
    if (key.includes('PAJAK')) return 'PJK';
    return 'DOC';
  }

  function entityStorageKey(clientId) {
    return 'clientPortal:selectedEntity:' + clientId;
  }

  function normalizeBusinessEntities(payload) {
    return Array.isArray(payload?.businessEntities)
      ? payload.businessEntities.map(function (entity) {
        return {
          key: text(entity.key || entity.id || entity.name),
          name: text(entity.name || entity.label || entity.key)
        };
      }).filter(function (entity) {
        return entity.key && entity.name;
      })
      : [];
  }

  function isMbarepPayload(payload) {
    const name = text(payload?.client?.name).toUpperCase();
    return name.includes('DEMO_MULTIENTITY') || name.includes('MULTIENTITAS CONTOH') || name.includes('MULTIENTITAS CONTOH');
  }

  function selectedBusinessEntity(clientId, entities) {
    if (!entities.length) return null;
    let stored = '';
    try {
      stored = window.sessionStorage.getItem(entityStorageKey(clientId)) || '';
    } catch {
      stored = '';
    }
    return entities.find(function (entity) { return entity.key === stored; }) || entities[0];
  }

  function setSelectedBusinessEntity(clientId, entities, key) {
    const selected = entities.find(function (entity) { return entity.key === key; }) || entities[0] || null;
    if (!selected) return null;
    try {
      window.sessionStorage.setItem(entityStorageKey(clientId), selected.key);
    } catch {
      // Persisting the UI selection is convenience-only.
    }
    window.clientPortalSelectedBusinessEntity = { ...selected };
    syncBusinessEntityFormControls(selected);
    const pageSelect = document.getElementById('clientBusinessEntitySelect');
    if (pageSelect && pageSelect.value !== selected.key) pageSelect.value = selected.key;
    window.dispatchEvent(new CustomEvent('client-portal-entity-change', { detail: { entity: { ...selected } } }));
    return selected;
  }

  function syncBusinessEntityFormControls(entity) {
    const entities = Array.isArray(window.clientPortalBusinessEntities) ? window.clientPortalBusinessEntities : [];
    document.querySelectorAll('form').forEach(function (form) {
      if (!shouldSyncBusinessEntityForm(form)) return;
      if (entities.length > 1) ensureBusinessEntityFormField(form, entities, entity);
      const select = form.querySelector('select[name="businessEntityKey"]');
      if (select && entity?.key && select.value !== entity.key) select.value = entity.key;
      if (!select) ensureHiddenInput(form, 'businessEntityKey', entity?.key || '');
      ensureHiddenInput(form, 'businessEntityName', entity?.name || '');
    });
  }

  function shouldSyncBusinessEntityForm(form) {
    const id = text(form?.id);
    return [
      'bukuKasForm',
      'bukuBankForm',
      'adjustmentForm',
      'assetForm',
      'incomeForm'
    ].includes(id);
  }

  function ensureBusinessEntityFormField(form, entities, entity) {
    if (form.querySelector('.client-entity-form-field, select[name="businessEntityKey"]')) return;
    const field = document.createElement('label');
    field.className = 'form-field client-entity-form-field';
    field.setAttribute('data-client-entity-field', 'true');

    const label = document.createElement('span');
    label.textContent = 'Entitas';

    const select = document.createElement('select');
    select.name = 'businessEntityKey';
    select.required = true;
    entities.forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.key;
      option.textContent = item.name;
      select.appendChild(option);
    });
    if (entity?.key) select.value = entity.key;
    select.addEventListener('change', function () {
      setSelectedBusinessEntity(clientIdFromPath(), entities, select.value);
    });

    field.appendChild(label);
    field.appendChild(select);

    const firstGrid = form.querySelector('.cashbook-form-grid, .purchase-form-grid, .sales-form-grid, .adjustment-form-grid, .asset-form-grid, .income-form-grid, .period-form-grid, .form-grid');
    if (firstGrid && firstGrid.parentNode === form) {
      firstGrid.insertBefore(field, firstGrid.firstChild);
    } else {
      const header = form.querySelector('.portal-modal-header');
      if (header && header.nextSibling) form.insertBefore(field, header.nextSibling);
      else form.insertBefore(field, form.firstChild);
    }
  }

  function ensureHiddenInput(form, name, value) {
    let input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      form.appendChild(input);
    }
    input.value = value;
  }

  function currentBusinessEntitySelection() {
    const current = window.clientPortalSelectedBusinessEntity;
    if (current && current.key && current.name) return current;
    const select = document.querySelector('#clientBusinessEntitySelect, select[name="businessEntityKey"]');
    if (!select || !select.value) return null;
    const option = select.options[select.selectedIndex];
    return {
      key: select.value,
      name: text(option?.textContent, select.value)
    };
  }

  const RESIZABLE_TABLE_SELECTOR = [
    'table.cashbook-table',
    'table.project-book-table',
    'table.project-book-sales-items-table',
    'table.project-book-detail-table'
  ].join(', ');
  const TABLE_WIDTH_STORAGE_PREFIX = 'clientPortal:tableWidths:v1:';
  const TABLE_MIN_COLUMN_WIDTH = 42;
  const TABLE_AUTOFIT_EXTRA_WIDTH = 18;
  const TABLE_AUTOFIT_MAX_COLUMN_WIDTH = 520;
  const TABLE_AUTOFIT_SAMPLE_LIMIT = 120;
  let tableMeasureCanvas = null;

  function tableResizeStorageKey(table) {
    const path = window.location.pathname.replace(/\/+/g, '/');
    const tableIndex = Array.from(document.querySelectorAll(RESIZABLE_TABLE_SELECTOR)).indexOf(table);
    const tableName = [
      table.getAttribute('aria-label'),
      table.id,
      Array.from(table.classList || []).join('.'),
      tableIndex
    ].map(text).filter(Boolean).join('|');
    return TABLE_WIDTH_STORAGE_PREFIX + path + ':' + tableName;
  }

  function readTableWidths(table) {
    try {
      const raw = window.localStorage.getItem(tableResizeStorageKey(table));
      if (!raw) return [];
      const widths = JSON.parse(raw);
      return Array.isArray(widths) ? widths.map(Number).filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  }

  function writeTableWidths(table, widths) {
    try {
      window.localStorage.setItem(tableResizeStorageKey(table), JSON.stringify(widths.map(function (width) {
        return Math.max(TABLE_MIN_COLUMN_WIDTH, Math.round(Number(width) || TABLE_MIN_COLUMN_WIDTH));
      })));
    } catch {
      // Column widths are a local display preference only.
    }
  }

  function headerCellsForResize(table) {
    const rows = Array.from(table.tHead?.rows || []);
    const headerRow = rows.find(function (row) {
      const cells = Array.from(row.cells || []);
      return cells.length && cells.every(function (cell) { return Number(cell.colSpan || 1) === 1; });
    });
    if (!headerRow) return [];
    const cells = Array.from(headerRow.cells || []);
    if (!cells.length) return [];
    if (cells.some(function (cell) { return Number(cell.colSpan || 1) > 1; })) return [];
    return cells;
  }

  function visibleColumnCount(table) {
    const headers = headerCellsForResize(table);
    return headers.length || (table.rows?.[0]?.cells?.length || 0);
  }

  function tableColumnWidths(table, headers) {
    if (tableUsesDefaultAutoFit(table)) {
      const autoWidths = autoFitTableWidths(table, headers);
      if (autoWidths.length) return autoWidths;
    }
    const stored = readTableWidths(table);
    return headers.map(function (header, index) {
      const storedWidth = stored[index];
      if (storedWidth) return Math.max(TABLE_MIN_COLUMN_WIDTH, Math.round(storedWidth));
      const rect = header.getBoundingClientRect();
      const cssWidth = parseFloat(window.getComputedStyle(header).width);
      return Math.max(TABLE_MIN_COLUMN_WIDTH, Math.round(rect.width || cssWidth || 120));
    });
  }

  function tableUsesDefaultAutoFit(table) {
    return Boolean(table && table.dataset && table.dataset.clientDefaultAutofit === 'true');
  }

  function autoFitTableWidths(table, headers) {
    if (!table || !headers || !headers.length) return [];
    return headers.map(function (_header, index) {
      return autoFitTableColumnWidth(table, headers, index);
    });
  }

  function tableRowsForAutoFit(table) {
    const rows = Array.from(table.tBodies || []).flatMap(function (tbody) {
      return Array.from(tbody.rows || []);
    }).filter(function (row) {
      return !row.hidden && window.getComputedStyle(row).display !== 'none';
    }).slice(0, TABLE_AUTOFIT_SAMPLE_LIMIT);
    return rows;
  }

  function autoFitTableColumnWidth(table, headers, index) {
    if (!table || !headers || !headers[index]) return 0;
    const rows = tableRowsForAutoFit(table);
    const maxWidth = tableAutoFitMaxWidth(table);
    const cells = [headers[index]].concat(rows.map(function (row) {
      return tableCellAtColumnIndex(row, index);
    }).filter(Boolean));
    const contentWidth = cells.reduce(function (width, cell) {
      return Math.max(width, measureTableCellWidth(cell));
    }, 0);
    return Math.max(
      TABLE_MIN_COLUMN_WIDTH,
      Math.min(maxWidth, Math.ceil(contentWidth + TABLE_AUTOFIT_EXTRA_WIDTH))
    );
  }

  function tableCellAtColumnIndex(row, targetIndex) {
    if (!row || !row.cells) return null;
    let columnIndex = 0;
    const cells = Array.from(row.cells || []);
    for (const cell of cells) {
      const span = Math.max(1, Number(cell.colSpan || 1));
      if (targetIndex >= columnIndex && targetIndex < columnIndex + span) {
        return span === 1 ? cell : null;
      }
      columnIndex += span;
    }
    return null;
  }

  function syncResizeWidthsLength(table, headers, widths) {
    if (!headers || !headers.length) return widths;
    if (widths.length === headers.length) return widths;
    const currentWidths = tableColumnWidths(table, headers);
    widths.splice(0, widths.length, ...currentWidths);
    return widths;
  }

  function applyAutoFitColumn(table, headers, widths, index) {
    if (!table || !headers || !headers[index]) return;
    syncResizeWidthsLength(table, headers, widths);
    const width = autoFitTableColumnWidth(table, headers, index);
    if (!width) return;
    widths[index] = width;
    applyTableWidths(table, widths);
    writeTableWidths(table, widths);
  }

  function tableAutoFitMaxWidth(table) {
    if (table.classList.contains('po-customer-detail-table')) return 420;
    if (table.classList.contains('sales-table') || table.classList.contains('purchase-table')) return 460;
    return TABLE_AUTOFIT_MAX_COLUMN_WIDTH;
  }

  function measureTableCellWidth(cell) {
    if (!cell) return 0;
    return measureTableCellTextWidth(cell);
  }

  function measureTableCellTextWidth(cell) {
    const value = tableCellMeasureText(cell);
    if (!value) return 0;
    if (!tableMeasureCanvas) tableMeasureCanvas = document.createElement('canvas');
    const context = tableMeasureCanvas.getContext('2d');
    if (!context) return 0;
    const style = window.getComputedStyle(cell);
    context.font = style.font || [style.fontWeight, style.fontSize, style.fontFamily].filter(Boolean).join(' ');
    const horizontalSpace = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'].reduce(function (total, prop) {
      const amount = parseFloat(style[prop]);
      return total + (Number.isFinite(amount) ? amount : 0);
    }, 0);
    return context.measureText(value).width + horizontalSpace;
  }

  function tableCellMeasureText(cell) {
    const controls = Array.from(cell.querySelectorAll('input, textarea, select')).map(function (control) {
      if (control.tagName === 'SELECT') {
        return text(control.options?.[control.selectedIndex]?.textContent, control.value);
      }
      return text(control.value, control.getAttribute('placeholder'));
    });
    const value = controls.find(Boolean) || text(cell.textContent);
    return value.replace(/\s+/g, ' ');
  }

  function ensureTableColgroup(table, count) {
    let colgroup = table.querySelector(':scope > colgroup[data-client-resize-colgroup="true"]') ||
      table.querySelector(':scope > colgroup');
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      table.insertBefore(colgroup, table.firstChild);
    }
    colgroup.setAttribute('data-client-resize-colgroup', 'true');
    while (colgroup.children.length < count) colgroup.appendChild(document.createElement('col'));
    while (colgroup.children.length > count) colgroup.removeChild(colgroup.lastElementChild);
    return colgroup;
  }

  function applyTableWidths(table, widths) {
    const colgroup = ensureTableColgroup(table, widths.length);
    widths.forEach(function (width, index) {
      colgroup.children[index].style.width = Math.max(TABLE_MIN_COLUMN_WIDTH, Math.round(width)) + 'px';
    });
    const totalWidth = widths.reduce(function (total, width) { return total + Number(width || 0); }, 0);
    if (totalWidth) {
      table.style.width = totalWidth + 'px';
      table.style.minWidth = totalWidth + 'px';
    }
    table.dispatchEvent(new CustomEvent('client:table-widths-changed', { bubbles: true }));
  }

  function setTableResizing(table, isResizing) {
    table.classList.toggle('client-table-is-resizing', Boolean(isResizing));
    document.body.classList.toggle('client-column-resizing', Boolean(isResizing));
  }

  function resetTableWidths(table) {
    try { window.localStorage.removeItem(tableResizeStorageKey(table)); } catch {}
    table.style.width = '';
    table.style.minWidth = '';
    table.dataset.clientResizableColumns = '';
    table.classList.remove('client-resizable-table', 'client-table-is-resizing');
    table.querySelectorAll(':scope > colgroup[data-client-resize-colgroup="true"] > col').forEach(function (col) {
      col.style.width = '';
    });
    table.querySelectorAll('.client-col-resize-handle').forEach(function (handle) {
      handle.remove();
    });
    table.querySelectorAll('.client-resizable-column-head').forEach(function (header) {
      header.classList.remove('client-resizable-column-head');
      if (header.dataset.clientResizePositionWasStatic === '1') {
        header.style.position = '';
        delete header.dataset.clientResizePositionWasStatic;
      }
    });
    window.setTimeout(function () {
      initResizableTable(table);
    }, 0);
  }

  function addColumnResizeHandle(table, header, index, widths) {
    if (header.querySelector(':scope > .client-col-resize-handle')) return;
    if (window.getComputedStyle(header).position === 'static') {
      header.style.position = 'relative';
      header.dataset.clientResizePositionWasStatic = '1';
    }
    header.classList.add('client-resizable-column-head');

    const handle = document.createElement('span');
    handle.className = 'client-col-resize-handle';
    handle.setAttribute('aria-hidden', 'true');
    handle.title = 'Geser untuk ubah lebar kolom. Klik dua kali untuk sesuaikan lebar dengan isi.';
    header.appendChild(handle);

    handle.addEventListener('dblclick', function (event) {
      event.preventDefault();
      event.stopPropagation();
      applyAutoFitColumn(table, headerCellsForResize(table), widths, index);
    });

    handle.addEventListener('pointerdown', function (event) {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = widths[index] || header.getBoundingClientRect().width || TABLE_MIN_COLUMN_WIDTH;
      setTableResizing(table, true);

      function move(pointerEvent) {
        const delta = pointerEvent.clientX - startX;
        widths[index] = Math.max(TABLE_MIN_COLUMN_WIDTH, Math.round(startWidth + delta));
        applyTableWidths(table, widths);
      }

      function stop() {
        setTableResizing(table, false);
        writeTableWidths(table, widths);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', stop);
        window.removeEventListener('pointercancel', stop);
      }

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', stop);
      window.addEventListener('pointercancel', stop);
    });
  }

  function initResizableTable(table) {
    if (!table || table.dataset.clientResizableColumns === '1') return;
    if (table.dataset.clientResizableDisabled === 'true') return;
    if (table.classList.contains('hti-sales-table')) return;
    if (table.classList.contains('hti-asset-table')) return;
    if (table.classList.contains('hti-payment-entry-table')) return;
    const headers = headerCellsForResize(table);
    if (!headers.length) return;
    const count = visibleColumnCount(table);
    if (!count || count !== headers.length) return;
    table.dataset.clientResizableColumns = '1';
    table.classList.add('client-resizable-table');
    const widths = tableColumnWidths(table, headers);
    applyTableWidths(table, widths);
    headers.forEach(function (header, index) {
      addColumnResizeHandle(table, header, index, widths);
    });
  }

  function initResizableTables(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const tables = [];
    if (scope.matches && scope.matches(RESIZABLE_TABLE_SELECTOR)) tables.push(scope);
    scope.querySelectorAll(RESIZABLE_TABLE_SELECTOR).forEach(function (table) {
      tables.push(table);
    });
    tables.forEach(initResizableTable);
  }

  window.clientPortalInitResizableTables = initResizableTables;

  function watchResizableTables() {
    initResizableTables(document);
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) initResizableTables(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function patchFetchForBusinessEntity() {
    if (window.clientPortalEntityFetchPatched) return;
    window.clientPortalEntityFetchPatched = true;
    const originalFetch = window.fetch;
    window.fetch = function patchedFetch(input, init) {
      const selected = currentBusinessEntitySelection();
      const options = init ? Object.assign({}, init) : {};
      const method = text(options.method || (input && input.method), 'GET').toUpperCase();
      const url = text(typeof input === 'string' ? input : input?.url);
      const shouldAttach = selected &&
        ['POST', 'PUT', 'PATCH'].includes(method) &&
        url.includes('/app/api/client/clients/') &&
        !url.includes('/auth/');
      if (shouldAttach && typeof options.body === 'string') {
        try {
          const body = JSON.parse(options.body);
          if (body && typeof body === 'object' && !Array.isArray(body)) {
            options.body = JSON.stringify(Object.assign({}, body, {
              businessEntityKey: body.businessEntityKey || selected.key,
              businessEntityName: body.businessEntityName || selected.name
            }));
          }
        } catch {
          // Non-JSON bodies are left untouched.
        }
      }
      return originalFetch.call(this, input, options);
    };
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function samePath(url) {
    if (!url) return false;
    const link = document.createElement('a');
    link.href = url;
    return link.pathname === window.location.pathname && link.search === window.location.search;
  }

  function itemButton(menu) {
    const link = document.createElement('a');
    link.className = 'client-book-nav-item';
    link.href = text(menu.url);
    link.innerHTML = '<span class="client-book-nav-icon" aria-hidden="true">' + escapeHtml(menuIconLabel(menu.label)) + '</span><span>' + escapeHtml(text(menu.label, 'Menu')) + '</span>';
    if (samePath(menu.url)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
    return link;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function divider(label) {
    const item = document.createElement('div');
    item.className = 'client-book-nav-divider';
    item.textContent = label;
    return item;
  }

  function buildDropdown(payload) {
    const nav = document.querySelector('.portal-nav');
    if (!nav || document.querySelector('.client-book-nav')) return;

    function shouldShowBookNavItem(menu) {
      const label = text(menu && menu.label).toUpperCase();
      return text(menu && menu.url) && label !== 'BUKU AKTIVA';
    }

    const menus = Array.isArray(payload.menus) ? payload.menus.filter(shouldShowBookNavItem) : [];
    const reports = Array.isArray(payload.financialReports) ? payload.financialReports.filter(function (menu) { return text(menu.url); }) : [];
    if (!menus.length && !reports.length) return;

    const wrap = document.createElement('div');
    wrap.className = 'client-book-nav';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'client-book-nav-toggle';
    toggle.setAttribute('aria-haspopup', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span>Buku</span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

    const panel = document.createElement('div');
    panel.className = 'client-book-nav-panel';
    panel.hidden = true;

    if (menus.length) {
      panel.appendChild(divider('Buku Klien'));
      const grid = document.createElement('div');
      grid.className = 'client-book-nav-grid';
      menus.forEach(function (menu) { grid.appendChild(itemButton(menu)); });
      panel.appendChild(grid);
    }
    if (reports.length) {
      panel.appendChild(divider('Laporan'));
      const grid = document.createElement('div');
      grid.className = 'client-book-nav-grid';
      reports.forEach(function (menu) { grid.appendChild(itemButton(menu)); });
      panel.appendChild(grid);
    }

    function positionPanel() {
      const sidebar = document.querySelector('.portal-sidebar');
      const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { bottom: 66 };
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const width = Math.min(860, Math.max(320, viewportWidth - 56));
      const left = Math.max(20, Math.min((viewportWidth - width) / 2, viewportWidth - width - 20));
      panel.style.top = Math.max(58, sidebarRect.bottom + 8) + 'px';
      panel.style.left = left + 'px';
      panel.style.width = width + 'px';
    }

    function close() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      const open = panel.hidden;
      if (open) positionPanel();
      panel.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', function (event) {
      if (!wrap.contains(event.target) && !panel.contains(event.target)) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });

    window.addEventListener('resize', function () {
      if (!panel.hidden) positionPanel();
    });

    window.addEventListener('scroll', function () {
      if (!panel.hidden) positionPanel();
    }, true);

    wrap.appendChild(toggle);
    document.body.appendChild(panel);
    nav.insertBefore(wrap, nav.children[1] || null);
  }

  function buildBusinessEntitySelector(clientId, payload) {
    const entities = normalizeBusinessEntities(payload);
    window.clientPortalBusinessEntities = entities.map(function (entity) { return { ...entity }; });
    document.body.classList.toggle('client-has-business-entities', entities.length > 0);
    document.body.classList.toggle('client-mbarep-layout', isMbarepPayload(payload));
    if (!entities.length) {
      window.clientPortalSelectedBusinessEntity = null;
      return;
    }
    patchFetchForBusinessEntity();
    const selected = selectedBusinessEntity(clientId, entities);
    if (selected) setSelectedBusinessEntity(clientId, entities, selected.key);
  }

  function cacheKey(clientId) {
    return CACHE_PREFIX + clientId;
  }

  function readCachedPayload(clientId) {
    try {
      const raw = window.sessionStorage.getItem(cacheKey(clientId));
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (!cached || Date.now() - Number(cached.savedAt || 0) > CACHE_TTL_MS) return null;
      return cached.payload || null;
    } catch {
      return null;
    }
  }

  function writeCachedPayload(clientId, payload) {
    try {
      window.sessionStorage.setItem(cacheKey(clientId), JSON.stringify({
        savedAt: Date.now(),
        payload
      }));
    } catch {
      // Menu cache is a speed hint only.
    }
  }

  async function init() {
    const clientId = clientIdFromPath();
    if (!clientId) return;
    const cachedPayload = readCachedPayload(clientId);
    if (cachedPayload) {
      buildDropdown(cachedPayload);
      buildBusinessEntitySelector(clientId, cachedPayload);
      return;
    }
    try {
      const response = await fetch('/app/api/client/clients/' + encodeURIComponent(clientId), {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });
      if (response.status === 401) return;
      const data = await response.json().catch(function () { return {}; });
      if (response.ok && data.ok) {
        writeCachedPayload(clientId, data);
        buildDropdown(data);
        buildBusinessEntitySelector(clientId, data);
      }
    } catch {
      // Navigation is convenience-only; page data should still load if it fails.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initMoneyFormatting();
      watchResizableTables();
      init();
    });
  } else {
    initMoneyFormatting();
    watchResizableTables();
    init();
  }
})();
