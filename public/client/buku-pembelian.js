(function () {
  const state = {
    client: null,
    entries: [],
    inventoryEntries: [],
    settlementSources: [],
    businessEntities: [],
    selectedIds: new Set(),
    purchaseEntityPending: false,
    purchaseStep: 'idle',
    loading: false
  };

  const elements = {
    alert: document.getElementById('purchaseAlert'),
    clientMeta: document.getElementById('purchaseClientMeta'),
    userName: document.getElementById('purchaseUserName'),
    userEmail: document.getElementById('purchaseUserEmail'),
    refreshButton: document.getElementById('purchaseRefreshBtn'),
    logoutButton: document.getElementById('clientLogoutBtn'),
    backLink: document.getElementById('purchaseBackLink'),
    subtitle: document.getElementById('purchaseSubtitle'),
    addButton: document.getElementById('purchaseAddBtn'),
    importWrap: document.getElementById('purchaseImportWrap'),
    importMenuButton: document.getElementById('purchaseImportMenuBtn'),
    importMenu: document.getElementById('purchaseImportMenu'),
    templateButton: document.getElementById('purchaseTemplateBtn'),
    importPickButton: document.getElementById('purchaseImportPickBtn'),
    importFile: document.getElementById('purchaseImportFile'),
    exportButton: document.getElementById('purchaseExportBtn'),
    deleteSelectedButton: document.getElementById('purchaseDeleteSelectedBtn'),
    selectAll: document.getElementById('purchaseSelectAll'),
    totalQty: document.getElementById('purchaseTotalQty'),
    totalHarga: document.getElementById('purchaseTotalHarga'),
    totalDiskon: document.getElementById('purchaseTotalDiskon'),
    totalDpp: document.getElementById('purchaseTotalDpp'),
    totalPpn: document.getElementById('purchaseTotalPpn'),
    totalPph22: document.getElementById('purchaseTotalPph22'),
    totalJumlah: document.getElementById('purchaseTotalJumlah'),
    totalPelunasan: document.getElementById('purchaseTotalPelunasan'),
    totalSisaHutang: document.getElementById('purchaseTotalSisaHutang'),
    count: document.getElementById('purchaseCount'),
    rows: document.getElementById('purchaseRows'),
    modal: document.getElementById('purchaseModal'),
    form: document.getElementById('purchaseForm'),
    modalTitle: document.getElementById('purchaseModalTitle'),
    modalMeta: document.getElementById('purchaseModalMeta'),
    closeButton: document.getElementById('purchaseCloseBtn'),
    cancelButton: document.getElementById('purchaseCancelBtn'),
    saveButton: document.getElementById('purchaseSaveBtn'),
    entryId: document.getElementById('purchaseEntryId'),
    entityGateField: document.getElementById('purchaseEntityGateField'),
    entityGateSelect: document.getElementById('purchaseEntityGateSelect'),
    tanggalInvoice: document.getElementById('purchaseTanggalInvoice'),
    tanggalFaktur: document.getElementById('purchaseTanggalFaktur'),
    taxModeField: document.getElementById('purchaseTaxModeField'),
    taxMode: document.getElementById('purchaseTaxMode'),
    documentGrid: document.getElementById('purchaseDocumentGrid'),
    noFaktur: document.getElementById('purchaseNoFaktur'),
    noInvoice: document.getElementById('purchaseNoInvoice'),
    noDo: document.getElementById('purchaseNoDo'),
    saleNo: document.getElementById('purchaseSaleNo'),
    itemsTable: document.getElementById('purchaseItemsTable'),
    itemsList: document.getElementById('purchaseItemsList'),
    itemsSection: document.querySelector('.purchase-items-section'),
    addItemButton: document.getElementById('purchaseAddItemBtn'),
    itemsSummary: document.getElementById('purchaseItemsSummary'),
    outlet: document.getElementById('purchaseOutlet'),
    keterangan: document.getElementById('purchaseKeterangan'),
    documentFooter: document.querySelector('.purchase-document-footer-grid'),
    paymentGrid: document.getElementById('purchasePaymentGrid'),
    paymentType: document.getElementById('purchasePaymentType'),
    paymentSourceField: document.getElementById('purchasePaymentSourceField'),
    paymentSource: document.getElementById('purchasePaymentSource'),
    settlementModal: document.getElementById('purchaseSettlementModal'),
    settlementForm: document.getElementById('purchaseSettlementForm'),
    settlementTitle: document.getElementById('purchaseSettlementTitle'),
    settlementMeta: document.getElementById('purchaseSettlementMeta'),
    settlementCloseButton: document.getElementById('purchaseSettlementCloseBtn'),
    settlementCancelButton: document.getElementById('purchaseSettlementCancelBtn'),
    settlementSaveButton: document.getElementById('purchaseSettlementSaveBtn'),
    settlementEntryId: document.getElementById('purchaseSettlementEntryId'),
    settlementDate: document.getElementById('purchaseSettlementDate'),
    settlementAmount: document.getElementById('purchaseSettlementAmount'),
    settlementSource: document.getElementById('purchaseSettlementSource'),
    settlementNotes: document.getElementById('purchaseSettlementNotes')
  };
  elements.adminOnly = Array.from(document.querySelectorAll('.admin-only'));

  const currency = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  let alertTimer = null;

  function text(value, fallback) {
    const result = value == null ? '' : String(value).trim();
    return result || fallback || '';
  }

  function formatDisplayDate(value) {
    const raw = text(value);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    return match ? match[3] + '-' + match[2] + '-' + match[1] : raw;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function setAlert(message, kind) {
    if (!elements.alert) return;
    if (alertTimer) {
      window.clearTimeout(alertTimer);
      alertTimer = null;
    }
    elements.alert.hidden = !message;
    elements.alert.textContent = message || '';
    elements.alert.className = 'portal-alert' + (kind ? ' ' + kind : '');
    if (message && kind !== 'error') {
      const expectedMessage = String(message);
      alertTimer = window.setTimeout(function () {
        if (elements.alert.textContent === expectedMessage) {
          elements.alert.hidden = true;
          elements.alert.textContent = '';
        }
        alertTimer = null;
      }, 3000);
    }
  }

  function clearNode(node) {
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clientIdFromPath() {
    const match = window.location.pathname.match(/\/app\/client\/clients\/([^/]+)\/buku-pembelian/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function apiBase() {
    return '/app/api/client/clients/' + encodeURIComponent(clientIdFromPath()) + '/buku-pembelian';
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
    if (!response.ok || !data.ok) throw new Error(data.error || 'Gagal memuat Pembelian.');
    return data;
  }

  async function loadPurchase() {
    if (state.loading) return;
    state.loading = true;
    setAlert('');
    if (elements.refreshButton) elements.refreshButton.disabled = true;
    try {
      const data = await requestJson(apiBase());
      if (!data) return;
      renderShell(data);
      state.client = data.client || null;
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.inventoryEntries = Array.isArray(data.inventoryEntries) ? data.inventoryEntries : [];
      state.settlementSources = Array.isArray(data.settlementSources) ? data.settlementSources : [];
      state.businessEntities = Array.isArray(data.businessEntities) ? data.businessEntities : [];
      window.clientPortalBusinessEntities = state.businessEntities.map(function (entity) { return { ...entity }; });
      state.selectedIds.clear();
      renderClient();
      renderSettlementSources();
      renderRows();
    } catch (err) {
      setAlert(err.message || 'Gagal memuat Pembelian.', 'error');
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

  function renderShell(data) {
    const user = data.user || {};
    setText(elements.userName, text(user.displayName || user.username, '-'));
    setText(elements.userEmail, text(user.email || user.contactName, '-'));
    elements.adminOnly.forEach(function (item) {
      item.hidden = !user.isAdmin;
    });
  }

  function normalizedClientName() {
    return text(state.client?.name || elements.clientMeta?.textContent).toUpperCase();
  }

  function isMbarepClient() {
    return normalizedClientName().indexOf('DEMO_MULTIENTITY') !== -1;
  }

  function isDemoMotorClient() {
    return normalizedClientName().indexOf('DEMO_MOTOR') !== -1;
  }

  function isTigaBelasClient() {
    const name = normalizedClientName();
    return name.indexOf('PERUSAHAAN DISTRIBUSI CONTOH') !== -1 ||
      name.indexOf('DISTRIBUSI CONTOH') !== -1 ||
      name.indexOf('DISTRIBUSI CONTOH') !== -1;
  }

  function requiresPurchaseEntity() {
    return isMbarepClient() && purchaseBusinessEntities().length > 0;
  }

  function syncClientLayoutClass() {
    document.body.classList.toggle('client-mbarep-layout', isMbarepClient());
    document.body.classList.toggle('client-mbarep-purchase-layout', isMbarepClient());
    document.body.classList.toggle('client-persada-purchase-layout', isDemoMotorClient());
    document.body.classList.toggle('client-tiga-belas-purchase-layout', isTigaBelasClient());
  }

  function renderClient() {
    const client = state.client || {};
    const stockCount = state.inventoryEntries.filter(function (entry) {
      return entry.status === 'Tersedia';
    }).length;
    setText(elements.clientMeta, text(client.name, 'PT X'));
    setText(elements.subtitle, isTigaBelasClient()
      ? text(client.name, 'Klien') + ' | Input pembelian ikan'
      : text(client.name, 'Klien') + ' | Pembelian dan stock otomatis');
    setText(elements.count, state.entries.length + ' unit | ' + stockCount + ' tersedia');
    if (elements.backLink && client.id) {
      elements.backLink.href = '/app/client/clients/' + encodeURIComponent(client.id);
    }
    syncClientLayoutClass();
    if (elements.importWrap) elements.importWrap.hidden = !isDemoMotorClient();
    if (elements.exportButton) elements.exportButton.hidden = !isDemoMotorClient();
    if (!isDemoMotorClient()) closeImportMenu();
    syncTigaBelasPanel();
  }

  function renderRows() {
    clearNode(elements.rows);
    const validIds = new Set(state.entries.map(function (entry) {
      return text(entry.id);
    }));
    state.selectedIds.forEach(function (id) {
      if (!validIds.has(id)) state.selectedIds.delete(id);
    });
    state.entries.forEach(function (entry) {
      elements.rows.appendChild(entryRow(entry));
    });

    const blankCount = Math.max(10 - state.entries.length, 3);
    for (let index = 0; index < blankCount; index += 1) {
      elements.rows.appendChild(blankRow());
    }
    renderHeaderTotals();
    syncSelectionControls();
    if (elements.exportButton) elements.exportButton.disabled = state.entries.length === 0;
  }

  function entryRow(entry) {
    const row = document.createElement('tr');
    row.appendChild(selectCell(entry));
    row.appendChild(businessEntityCell(entry));
    row.appendChild(cell(entry.noInvoice));
    row.appendChild(cell(entry.noFaktur));
    row.appendChild(cell(formatDisplayDate(entry.tanggalFaktur)));
    row.appendChild(cell(formatDisplayDate(entry.tanggalInvoice)));
    row.appendChild(cell(entry.noDo));
    row.appendChild(cell(formatAmount(entry.jumlah), 'number'));
    row.appendChild(cell(entry.namaBarang));
    row.appendChild(cell(entry.warna));
    row.appendChild(cell(entry.noRangka));
    row.appendChild(cell(entry.noMesin));
    row.appendChild(cell(formatAmount(entry.harga), 'number'));
    row.appendChild(cell(formatAmount(entry.diskon), 'number'));
    row.appendChild(cell(formatAmount(entry.dpp), 'number'));
    row.appendChild(cell(formatAmount(entry.ppn), 'number'));
    row.appendChild(cell(formatAmount(entry.pph22), 'number'));
    row.appendChild(cell(formatAmount(entry.total), 'number'));
    row.appendChild(pelunasanCell(entry));
    row.appendChild(cell(formatAmount(entrySisaHutang(entry)), 'number'));

    const actionCell = document.createElement('td');
    actionCell.className = 'cashbook-actions';
    const settlementButton = document.createElement('button');
    settlementButton.type = 'button';
    settlementButton.className = 'cashbook-action-button purchase-settlement-button';
    settlementButton.textContent = 'Pelunasan';
    settlementButton.addEventListener('click', function () {
      openSettlementModal(entry);
    });
    actionCell.appendChild(settlementButton);
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'cashbook-action-button';
    editButton.textContent = 'Ubah';
    editButton.addEventListener('click', function () {
      openEditModal(entry);
    });
    actionCell.appendChild(editButton);
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'cashbook-action-button danger';
    deleteButton.textContent = 'Hapus';
    deleteButton.addEventListener('click', function () {
      deleteEntry(entry);
    });
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);
    return row;
  }

  function blankRow() {
    const row = document.createElement('tr');
    for (let index = 0; index < 21; index += 1) {
      row.appendChild(cell(''));
    }
    return row;
  }

  function businessEntityCell(entry) {
    return cell(entry?.businessEntityName || entry?.businessEntityKey || '', 'client-entity-column');
  }

  function selectCell(entry) {
    const td = document.createElement('td');
    td.className = 'sales-select-cell';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'sales-row-checkbox';
    checkbox.checked = state.selectedIds.has(text(entry.id));
    checkbox.setAttribute('aria-label', 'Pilih data pembelian ' + text(entry.noInvoice, entry.noRangka));
    checkbox.addEventListener('change', function () {
      const id = text(entry.id);
      if (checkbox.checked) state.selectedIds.add(id);
      else state.selectedIds.delete(id);
      syncSelectionControls();
    });
    td.appendChild(checkbox);
    return td;
  }

  function pelunasanCell(entry) {
    const td = cell(formatAmount(entry.pelunasan), 'number');
    if (Number(entry.pelunasan || 0) > 0) {
      td.classList.add('purchase-paid-cell');
      td.title = [
        entry.tanggalPelunasan ? 'Tanggal: ' + entry.tanggalPelunasan : '',
        entry.namaAkunPelunasan ? 'Sumber: ' + entry.namaAkunPelunasan : '',
        entry.keteranganPelunasan ? 'Catatan: ' + entry.keteranganPelunasan : ''
      ].filter(Boolean).join(' | ');
    }
    return td;
  }

  function cell(value, variant) {
    const td = document.createElement('td');
    if (variant) td.className = variant;
    td.textContent = text(value);
    return td;
  }

  function parseAmount(value) {
    if (value == null || value === '') return 0;
    const cleaned = String(value).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    const amount = Number(cleaned);
    return Number.isFinite(amount) ? amount : 0;
  }

  function formatAmount(value) {
    const amount = Number(value || 0);
    return amount ? currency.format(amount) : '';
  }

  function slugFilePart(value) {
    return text(value, 'persada').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'persada';
  }

  function normalizeImportHeader(value) {
    return text(value).toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/_+/g, '_').replace(/^_|_$/g, '');
  }

  function excelSerialToDate(value) {
    const serial = Number(value);
    if (!Number.isFinite(serial) || serial < 1) return '';
    const epoch = Date.UTC(1899, 11, 30);
    return new Date(epoch + serial * 86400000);
  }

  function importDateValue(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === 'number') {
      const date = excelSerialToDate(value);
      return date ? date.toISOString().slice(0, 10) : '';
    }
    const raw = text(value);
    if (!raw) return '';
    const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return iso[1] + '-' + iso[2].padStart(2, '0') + '-' + iso[3].padStart(2, '0');
    const slash = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (slash) {
      const year = slash[3].length === 2 ? '20' + slash[3] : slash[3];
      return year + '-' + slash[2].padStart(2, '0') + '-' + slash[1].padStart(2, '0');
    }
    return raw;
  }

  function purchaseImportHeaders() {
    return [
      'periode',
      'tanggal_invoice',
      'tanggal_faktur_pajak',
      'no_faktur_pajak',
      'no_invoice',
      'no_do',
      'sale_no',
      'jumlah',
      'nama_barang',
      'warna',
      'nomor_rangka',
      'nomor_mesin',
      'kode_variant',
      'harga',
      'diskon',
      'dpp',
      'ppn',
      'total',
      'outlet',
      'keterangan'
    ];
  }

  function downloadPurchaseImportTemplate() {
    closeImportMenu();
    if (!window.XLSX) {
      setAlert('Library pembuat Excel belum termuat. Refresh halaman lalu coba lagi.', 'error');
      return;
    }
    const workbook = window.XLSX.utils.book_new();
    const guideRows = [
      ['Panduan Impor Pembelian DemoMotor'],
      ['Isi data pada sheet pembelian_unit.'],
      ['Tanggal boleh format YYYY-MM-DD atau DD/MM/YYYY.'],
      ['Satu nomor rangka dihitung sebagai 1 unit stok.'],
      ['Kolom total mengikuti nilai dari file; PPh 22 otomatis 0 jika tidak ada kolom pph22.']
    ];
    const sampleRows = [
      purchaseImportHeaders(),
      [
        '',
        '2026-04-01',
        '2026-04-01',
        '04002600000000000',
        'NO INV : 0001/SMG/04/2026',
        'NO DO : 000/SMG/04/2026',
        '',
        1,
        'NMAX NEO S',
        'HITAM',
        'MH3CONTOH000001',
        'G3V5E-CONTOH',
        '',
        24821000,
        0,
        24821000,
        2730310,
        27551310,
        '',
        ''
      ]
    ];
    const guideSheet = window.XLSX.utils.aoa_to_sheet(guideRows);
    const purchaseSheet = window.XLSX.utils.aoa_to_sheet(sampleRows);
    purchaseSheet['!cols'] = purchaseImportHeaders().map(function (header) {
      return { wch: Math.max(12, header.length + 2) };
    });
    window.XLSX.utils.book_append_sheet(workbook, guideSheet, 'panduan');
    window.XLSX.utils.book_append_sheet(workbook, purchaseSheet, 'pembelian_unit');
    window.XLSX.writeFile(workbook, 'format-impor-pembelian-' + slugFilePart(state.client?.name || 'persada') + '.xlsx');
  }

  function exportNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = text(value);
    if (!raw) return 0;
    const normalized = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(',', '.').replace(/[^0-9.-]/g, '');
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }

  function fitWorksheetColumns(worksheet, rows) {
    if (!worksheet || !rows.length) return;
    const headers = Object.keys(rows[0]);
    worksheet['!cols'] = headers.map(function (header) {
      const maxContent = rows.reduce(function (width, row) {
        return Math.max(width, String(row[header] == null ? '' : row[header]).length);
      }, header.length);
      return { wch: Math.min(42, Math.max(12, maxContent + 2)) };
    });
  }

  function purchaseExportRows() {
    return state.entries.map(function (entry, index) {
      return {
        'No': index + 1,
        'Entitas': text(entry.businessEntityName || entry.businessEntityKey),
        'No Invoice': text(entry.noInvoice),
        'No Faktur Pajak': text(entry.noFaktur),
        'Tgl Faktur Pajak': text(entry.tanggalFaktur),
        'Tgl Invoice': text(entry.tanggalInvoice),
        'No DO': text(entry.noDo),
        'Qty': exportNumber(entry.jumlah),
        'Nama Barang': text(entry.namaBarang),
        'Warna': text(entry.warna),
        'Nomor Rangka': text(entry.noRangka),
        'Nomor Mesin': text(entry.noMesin),
        'Kode Variant': text(entry.kodeVariant),
        'Harga': exportNumber(entry.harga),
        'Diskon': exportNumber(entry.diskon),
        'DPP': exportNumber(entry.dpp),
        'PPN': exportNumber(entry.ppn),
        'PPH 22': exportNumber(entry.pph22),
        'Jumlah': exportNumber(entry.total),
        'Pelunasan': exportNumber(entry.pelunasan),
        'Sisa Saldo Hutang': exportNumber(entrySisaHutang(entry)),
        'Tanggal Pelunasan': text(entry.tanggalPelunasan),
        'Sumber Pelunasan': text(entry.namaAkunPelunasan || entry.sumberPelunasan),
        'Keterangan Pelunasan': text(entry.keteranganPelunasan),
        'Outlet': text(entry.outlet),
        'Keterangan': text(entry.keterangan)
      };
    });
  }

  function exportPurchaseWorkbook() {
    closeImportMenu();
    if (!isDemoMotorClient()) {
      setAlert('Ekspor data hanya tersedia untuk Buku Pembelian DemoMotor.', 'error');
      return;
    }
    if (!window.XLSX) {
      setAlert('Library pembuat Excel belum termuat. Refresh halaman lalu coba lagi.', 'error');
      return;
    }
    const rows = purchaseExportRows();
    if (!rows.length) {
      setAlert('Tidak ada data Buku Pembelian untuk diekspor.', 'error');
      return;
    }
    try {
      const workbook = window.XLSX.utils.book_new();
      const sheet = window.XLSX.utils.json_to_sheet(rows);
      fitWorksheetColumns(sheet, rows);
      window.XLSX.utils.book_append_sheet(workbook, sheet, 'buku_pembelian');
      window.XLSX.writeFile(workbook, 'buku-pembelian-persada-' + slugFilePart(state.client?.name || 'client') + '-' + today() + '.xlsx');
      setAlert(rows.length + ' baris Buku Pembelian berhasil diekspor.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal mengekspor Buku Pembelian.', 'error');
    }
  }

  function readFileAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(new Error('Gagal membaca file Excel.'));
      };
      reader.readAsArrayBuffer(file);
    });
  }

  function parsePurchaseImportWorkbook(arrayBuffer) {
    if (!window.XLSX) throw new Error('Library pembaca Excel belum termuat. Refresh halaman lalu coba lagi.');
    const workbook = window.XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const sheet = workbook.Sheets.pembelian_unit || workbook.Sheets.Pembelian_Unit || workbook.Sheets['Pembelian Unit'];
    if (!sheet) throw new Error('Sheet "pembelian_unit" tidak ditemukan.');
    const grid = window.XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true });
    if (!grid.length) throw new Error('Sheet pembelian_unit kosong.');
    const headers = (grid[0] || []).map(normalizeImportHeader);
    const required = ['tanggal_invoice', 'no_invoice', 'nama_barang', 'nomor_rangka', 'nomor_mesin'];
    const missing = required.filter(function (key) {
      return !headers.includes(key);
    });
    if (missing.length) throw new Error('Header pembelian_unit tidak lengkap: ' + missing.join(', '));
    return grid.slice(1).map(function (line, index) {
      const row = { rowNumber: index + 2 };
      headers.forEach(function (header, columnIndex) {
        if (!header) return;
        row[header] = line[columnIndex];
      });
      ['tanggal_invoice', 'tanggal_faktur_pajak'].forEach(function (key) {
        row[key] = importDateValue(row[key]);
      });
      return row;
    }).filter(function (row) {
      return Object.keys(row).some(function (key) {
        return key !== 'rowNumber' && text(row[key]);
      });
    });
  }

  function setImportBusy(busy) {
    [elements.importMenuButton, elements.templateButton, elements.importPickButton].forEach(function (button) {
      if (button) button.disabled = busy;
    });
  }

  function applyPurchaseImportData(data) {
    state.client = data.client || state.client;
    state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
    state.inventoryEntries = Array.isArray(data.inventoryEntries) ? data.inventoryEntries : state.inventoryEntries;
    state.settlementSources = Array.isArray(data.settlementSources) ? data.settlementSources : state.settlementSources;
    state.businessEntities = Array.isArray(data.businessEntities) ? data.businessEntities : state.businessEntities;
    window.clientPortalBusinessEntities = state.businessEntities.map(function (entity) { return { ...entity }; });
    state.selectedIds.clear();
    renderClient();
    renderSettlementSources();
    renderRows();
  }

  async function importPurchaseWorkbook(file) {
    if (!file) return;
    closeImportMenu();
    setImportBusy(true);
    setAlert('');
    try {
      const rows = parsePurchaseImportWorkbook(await readFileAsArrayBuffer(file));
      if (!rows.length) throw new Error('Tidak ada baris pembelian yang dapat diimpor.');
      const ok = window.confirm('Impor ' + rows.length + ' baris dari sheet pembelian_unit ke Pembelian DemoMotor?');
      if (!ok) return;
      const data = await requestJson(apiBase() + '/import', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rows })
      });
      if (!data) return;
      applyPurchaseImportData(data);
      setAlert('Impor pembelian selesai: ' + (data.importedCount || rows.length) + ' baris tersimpan dan Persediaan diperbarui.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal impor Pembelian.', 'error');
    } finally {
      setImportBusy(false);
      if (elements.importFile) elements.importFile.value = '';
    }
  }

  function closeImportMenu() {
    if (elements.importMenu) elements.importMenu.hidden = true;
    if (elements.importMenuButton) elements.importMenuButton.setAttribute('aria-expanded', 'false');
  }

  function toggleImportMenu() {
    if (!elements.importMenu) return;
    const nextOpen = elements.importMenu.hidden;
    elements.importMenu.hidden = !nextOpen;
    if (elements.importMenuButton) elements.importMenuButton.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
  }

  function entrySisaHutang(entry) {
    return Math.max(0, Number(entry.total || 0) - Number(entry.pelunasan || 0));
  }

  function sumField(field) {
    return state.entries.reduce(function (total, entry) {
      return total + Number(entry[field] || 0);
    }, 0);
  }

  function sumSisaHutang() {
    return state.entries.reduce(function (total, entry) {
      return total + entrySisaHutang(entry);
    }, 0);
  }

  function renderHeaderTotals() {
    setText(elements.totalQty, formatAmount(sumField('jumlah')) || '0');
    setText(elements.totalHarga, formatAmount(sumField('harga')) || '0');
    setText(elements.totalDiskon, formatAmount(sumField('diskon')) || '0');
    setText(elements.totalDpp, formatAmount(sumField('dpp')) || '0');
    setText(elements.totalPpn, formatAmount(sumField('ppn')) || '0');
    setText(elements.totalPph22, formatAmount(sumField('pph22')) || '0');
    setText(elements.totalJumlah, formatAmount(sumField('total')) || '0');
    setText(elements.totalPelunasan, formatAmount(sumField('pelunasan')) || '0');
    setText(elements.totalSisaHutang, formatAmount(sumSisaHutang()) || '0');
  }

  function renderPaymentSourceOptions(select) {
    if (!select) return;
    const current = select.value;
    clearNode(select);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pilih kas/bank';
    select.appendChild(placeholder);
    state.settlementSources.forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value;
      option.textContent = text(source.label) + ' | ' + text(source.coa) + ' - ' + text(source.accountName);
      select.appendChild(option);
    });
    if (current && state.settlementSources.some(function (source) { return source.value === current; })) {
      select.value = current;
    }
  }

  function renderSettlementSources() {
    renderPaymentSourceOptions(elements.settlementSource);
    renderPaymentSourceOptions(elements.paymentSource);
    syncPurchasePaymentControls();
  }

  function syncSelectionControls() {
    const selectedCount = state.selectedIds.size;
    if (elements.deleteSelectedButton) {
      elements.deleteSelectedButton.disabled = selectedCount === 0;
      elements.deleteSelectedButton.textContent = selectedCount ? 'Hapus Terpilih (' + selectedCount + ')' : 'Hapus Terpilih';
    }
    if (elements.selectAll) {
      const selectableCount = state.entries.length;
      elements.selectAll.checked = selectableCount > 0 && selectedCount === selectableCount;
      elements.selectAll.indeterminate = selectedCount > 0 && selectedCount < selectableCount;
      elements.selectAll.disabled = selectableCount === 0;
    }
  }

  function toggleSelectAll() {
    if (!elements.selectAll) return;
    state.selectedIds.clear();
    if (elements.selectAll.checked) {
      state.entries.forEach(function (entry) {
        state.selectedIds.add(text(entry.id));
      });
    }
    renderRows();
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function field(row, name) {
    return row ? row.querySelector('[data-field="' + name + '"]') : null;
  }

  function itemRows() {
    return Array.from(elements.itemsList ? elements.itemsList.querySelectorAll('.purchase-item-row') : []);
  }

  function purchaseEntitySelect() {
    return elements.form ? elements.form.querySelector('select[name="businessEntityKey"]') : null;
  }

  function purchaseBusinessEntities() {
    const source = state.businessEntities.length
      ? state.businessEntities
      : (Array.isArray(window.clientPortalBusinessEntities) ? window.clientPortalBusinessEntities : []);
    return source
      .map(function (entity) {
        return {
          key: text(entity.key || entity.id || entity.name),
          name: text(entity.name || entity.label || entity.key)
        };
      }).filter(function (entity) {
        return entity.key && entity.name;
      });
  }

  function selectedPurchaseEntity() {
    const key = text(elements.entityGateSelect?.value || purchaseEntitySelect()?.value);
    if (!key) return null;
    const entity = purchaseBusinessEntities().find(function (item) { return item.key === key; });
    return {
      key,
      name: text(entity?.name, key)
    };
  }

  function populatePurchaseEntityGate(forceBlank) {
    if (!elements.entityGateSelect) return;
    const actualSelect = purchaseEntitySelect();
    const current = forceBlank ? '' : elements.entityGateSelect.value;
    clearNode(elements.entityGateSelect);
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Pilih entitas';
    elements.entityGateSelect.appendChild(placeholder);

    const sourceOptions = actualSelect
      ? Array.from(actualSelect.options).filter(function (option) { return option.value; })
      : purchaseBusinessEntities().map(function (entity) {
        return { value: entity.key, textContent: entity.name };
      });
    sourceOptions.forEach(function (source) {
      const option = document.createElement('option');
      option.value = source.value;
      option.textContent = source.textContent;
      elements.entityGateSelect.appendChild(option);
    });
    elements.entityGateSelect.value = current && sourceOptions.some(function (option) {
      return option.value === current;
    }) ? current : '';
  }

  function syncTechnicalEntitySelect() {
    const actualSelect = purchaseEntitySelect();
    if (!actualSelect || !elements.entityGateSelect) return;
    const actualField = actualSelect.closest('.client-entity-form-field');
    if (actualField) actualField.hidden = true;
    if (elements.entityGateSelect.value) {
      actualSelect.dataset.purchaseUserIntent = 'true';
      actualSelect.value = elements.entityGateSelect.value;
      actualSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function preparePurchaseEntitySelect(forceBlank) {
    const select = purchaseEntitySelect();
    if (!select) return null;
    if (!select.querySelector('option[value=""]')) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Pilih entitas';
      select.insertBefore(placeholder, select.firstChild);
    }
    select.required = true;
    if (!select.dataset.purchaseStepBound) {
      select.dataset.purchaseStepBound = 'true';
      select.addEventListener('pointerdown', function () {
        select.dataset.purchaseUserIntent = 'true';
      });
      select.addEventListener('keydown', function () {
        select.dataset.purchaseUserIntent = 'true';
      });
      select.addEventListener('change', function (event) {
        if (state.purchaseStep === 'entity' && !select.dataset.purchaseUserIntent) {
          select.value = '';
          syncPurchaseFormSteps();
          return;
        }
        select.dataset.purchaseUserSelected = select.value ? 'true' : '';
        state.purchaseEntityPending = false;
        if (select.value && state.purchaseStep === 'entity') state.purchaseStep = 'tax';
        syncPurchaseFormSteps();
      });
    }
    if (forceBlank) {
      select.dataset.purchaseUserSelected = '';
      select.dataset.purchaseUserIntent = '';
      state.purchaseEntityPending = true;
      select.value = '';
    }
    return select;
  }

  function hasSelectedPurchaseEntity() {
    if (elements.entityGateSelect && state.purchaseStep !== 'idle') return Boolean(elements.entityGateSelect.value);
    const select = purchaseEntitySelect();
    return Boolean(select && select.value);
  }

  function isPpnMode() {
    return !elements.taxMode || elements.taxMode.value !== 'non-ppn';
  }

  function togglePurchaseTaxDocumentFields() {
    const showTaxFields = isPpnMode();
    document.querySelectorAll('.purchase-tax-document-field').forEach(function (field) {
      field.hidden = !showTaxFields;
    });
    if (!showTaxFields) {
      if (elements.tanggalFaktur) elements.tanggalFaktur.value = '';
      if (elements.noFaktur) elements.noFaktur.value = '';
    }
  }

  function syncPurchaseItemsTableMode() {
    const ppnMode = isPpnMode();
    const persada = isDemoMotorClient();
    if (elements.itemsTable) {
      elements.itemsTable.classList.toggle('is-ppn', ppnMode);
      elements.itemsTable.classList.toggle('is-non-ppn', !ppnMode);
      elements.itemsTable.classList.toggle('is-persada', persada);
    }
    elements.itemsTable?.querySelectorAll('.purchase-ppn-only').forEach(function (fieldWrap) {
      fieldWrap.hidden = !ppnMode;
    });
    elements.itemsTable?.querySelectorAll('.purchase-persada-only').forEach(function (fieldWrap) {
      fieldWrap.hidden = !persada || (fieldWrap.classList.contains('purchase-ppn-only') && !ppnMode);
    });
    const totalHeading = elements.itemsTable?.querySelector('[data-purchase-total-heading]');
    if (totalHeading) totalHeading.textContent = persada || !ppnMode ? 'Jumlah' : 'Jumlah DPP+PPN';
  }

  function isCashPurchasePayment() {
    return elements.paymentType && elements.paymentType.value === 'cash';
  }

  function syncPurchasePaymentControls() {
    const showSource = isCashPurchasePayment();
    if (elements.paymentSourceField) elements.paymentSourceField.hidden = !showSource;
    if (elements.paymentSource) {
      elements.paymentSource.required = showSource;
      if (!showSource) elements.paymentSource.value = '';
    }
  }

  function syncPurchaseFormSteps() {
    const entryId = text(elements.entryId?.value);
    const isEdit = Boolean(entryId);
    const requiresEntity = requiresPurchaseEntity();
    const persada = isDemoMotorClient();
    if (isTigaBelasClient()) {
      syncTigaBelasPanel();
      return;
    }
    const entitySelect = purchaseEntitySelect();
    if (!requiresEntity && elements.entityGateSelect) {
      elements.entityGateSelect.value = '';
    }
    if (!isEdit && requiresEntity && state.purchaseStep === 'entity' && entitySelect) {
      entitySelect.value = '';
    }
    const hasEntity = !requiresEntity || isEdit || hasSelectedPurchaseEntity();
    if (persada && elements.taxMode && !elements.taxMode.value) elements.taxMode.value = 'ppn';
    const hasTaxMode = persada || isEdit || Boolean(elements.taxMode && elements.taxMode.value);

    if (elements.entityGateField) elements.entityGateField.hidden = !requiresEntity;
    if (elements.entityGateSelect) elements.entityGateSelect.required = requiresEntity && !isEdit;
    if (elements.taxModeField) elements.taxModeField.hidden = persada || !hasEntity;
    if (elements.documentGrid) elements.documentGrid.hidden = !hasEntity || !hasTaxMode;
    if (elements.itemsSection) elements.itemsSection.hidden = !hasEntity || !hasTaxMode;
    if (elements.paymentGrid) elements.paymentGrid.hidden = !hasEntity || !hasTaxMode;
    if (elements.documentFooter) elements.documentFooter.hidden = !(persada || isEdit);
    document.querySelectorAll('.purchase-persada-document-field').forEach(function (field) {
      field.hidden = !persada;
    });

    if (!hasEntity && elements.taxMode) elements.taxMode.value = '';
    if (!isEdit && hasEntity && (persada || elements.taxMode?.value) && state.purchaseStep !== 'details') state.purchaseStep = 'details';
    togglePurchaseTaxDocumentFields();
    syncPurchasePaymentControls();
    recalculateAllItems();
  }

  function preparePurchaseProgressiveSteps(forceBlankEntity) {
    const requiresEntity = requiresPurchaseEntity();
    if (!requiresEntity) {
      if (elements.entityGateField) elements.entityGateField.hidden = true;
      if (elements.entityGateSelect) {
        elements.entityGateSelect.required = false;
        elements.entityGateSelect.value = '';
      }
      const entitySelect = purchaseEntitySelect();
      if (entitySelect) {
        entitySelect.required = false;
        entitySelect.value = '';
      }
      syncPurchaseFormSteps();
      return;
    }
    if (forceBlankEntity) {
      if (elements.taxModeField) elements.taxModeField.hidden = true;
      if (elements.documentGrid) elements.documentGrid.hidden = true;
      if (elements.itemsSection) elements.itemsSection.hidden = true;
      if (elements.paymentGrid) elements.paymentGrid.hidden = true;
      if (elements.documentFooter) elements.documentFooter.hidden = true;
      if (elements.taxMode) elements.taxMode.value = '';
    }
    preparePurchaseEntitySelect(forceBlankEntity);
    populatePurchaseEntityGate(forceBlankEntity);
    syncTechnicalEntitySelect();
    syncPurchaseFormSteps();
    window.setTimeout(function () {
      preparePurchaseEntitySelect(forceBlankEntity && !hasSelectedPurchaseEntity());
      populatePurchaseEntityGate(forceBlankEntity && !hasSelectedPurchaseEntity());
      syncTechnicalEntitySelect();
      syncPurchaseFormSteps();
    }, 0);
    window.setTimeout(function () {
      preparePurchaseEntitySelect(forceBlankEntity && !hasSelectedPurchaseEntity());
      populatePurchaseEntityGate(forceBlankEntity && !hasSelectedPurchaseEntity());
      syncTechnicalEntitySelect();
      syncPurchaseFormSteps();
    }, 80);
    window.setTimeout(function () {
      preparePurchaseEntitySelect(forceBlankEntity && !hasSelectedPurchaseEntity());
      populatePurchaseEntityGate(forceBlankEntity && !hasSelectedPurchaseEntity());
      syncTechnicalEntitySelect();
      syncPurchaseFormSteps();
    }, 250);
    window.setTimeout(function () {
      preparePurchaseEntitySelect(forceBlankEntity && !hasSelectedPurchaseEntity());
      syncPurchaseFormSteps();
    }, 600);
    if (forceBlankEntity) {
      let guardTicks = 0;
      const guard = window.setInterval(function () {
        guardTicks += 1;
        if (elements.modal?.hidden || state.purchaseStep !== 'entity' || guardTicks > 80) {
          window.clearInterval(guard);
          return;
        }
        preparePurchaseEntitySelect(true);
        populatePurchaseEntityGate(true);
        syncPurchaseFormSteps();
      }, 100);
    }
  }

  function calculateItemTotals(row) {
    const qtyInput = field(row, 'jumlah');
    const priceInput = field(row, 'harga');
    const discountInput = field(row, 'diskon');
    const dppInput = field(row, 'dpp');
    const ppnInput = field(row, 'ppn');
    const pph22Input = field(row, 'pph22');
    const totalInput = field(row, 'total');
    const totalLabel = row ? row.querySelector('[data-total-label]') : null;
    const persadaRow = Boolean(field(row, 'noRangka') || field(row, 'noMesin') || discountInput || pph22Input);
    const qty = Math.max(1, parseAmount(qtyInput && qtyInput.value) || 1);
    const price = parseAmount(priceInput && priceInput.value);
    const discount = persadaRow ? parseAmount(discountInput && discountInput.value) : 0;
    const dpp = Math.max(0, (qty * price) - discount);
    const ppn = isPpnMode() ? Math.round(dpp * 0.11) : 0;
    const pph22 = persadaRow && isPpnMode() ? Math.round(dpp * 0.0045) : 0;
    const total = dpp + ppn + pph22;
    if (qtyInput && Number(qtyInput.value || 0) < 1) qtyInput.value = '1';
    if (dppInput) dppInput.value = formatAmount(dpp);
    if (ppnInput) ppnInput.value = formatAmount(ppn);
    if (pph22Input) pph22Input.value = formatAmount(pph22);
    if (totalInput) totalInput.value = formatAmount(total);
    if (totalLabel) totalLabel.textContent = persadaRow || !isPpnMode() ? 'Jumlah' : 'Jumlah DPP+PPN';
    syncPurchaseItemsTableMode();
    row?.querySelector('.purchase-item-grid')?.classList.toggle('is-non-ppn', !isPpnMode());
    row?.querySelector('.purchase-item-grid')?.classList.toggle('is-ppn', isPpnMode());
    row?.querySelectorAll('.purchase-ppn-only').forEach(function (fieldWrap) {
      fieldWrap.hidden = !isPpnMode();
    });
    renderItemsSummary();
  }

  function recalculateAllItems() {
    syncPurchaseItemsTableMode();
    itemRows().forEach(calculateItemTotals);
    renderItemsSummary();
  }

  function renderItemsSummary() {
    if (!elements.itemsSummary) return;
    const rows = itemRows();
    const totals = rows.reduce(function (acc, row) {
      acc.qty += parseAmount(field(row, 'jumlah')?.value || 0);
      acc.amount += parseAmount(field(row, 'total')?.value || 0);
      return acc;
    }, { qty: 0, amount: 0 });
    clearNode(elements.itemsSummary);
    const stats = [
      { label: rows.length + ' barang' },
      { label: 'Qty ' + (formatAmount(totals.qty) || '0') },
      { label: 'Total Rupiah', value: formatAmount(totals.amount) || '0', highlight: true }
    ];
    stats.forEach(function (stat) {
      const item = document.createElement('span');
      item.className = 'purchase-items-summary-item' + (stat.highlight ? ' highlight' : '');
      if (stat.value) {
        const label = document.createElement('span');
        label.textContent = stat.label;
        const value = document.createElement('strong');
        value.textContent = stat.value;
        item.appendChild(label);
        item.appendChild(value);
      } else {
        item.textContent = stat.label;
      }
      elements.itemsSummary.appendChild(item);
    });
  }

  function createInput(name, label, value, options) {
    const wrap = document.createElement('label');
    wrap.className = 'form-field';
    if (options && options.wide) wrap.classList.add('wide');
    if (options && options.className) wrap.classList.add(options.className);
    const span = document.createElement('span');
    span.textContent = label;
    if (options && options.labelMarker) span.setAttribute(options.labelMarker, 'true');
    const input = document.createElement('input');
    input.dataset.field = name;
    input.value = value == null ? '' : String(value);
    input.autocomplete = 'off';
    input.type = options && options.type ? options.type : 'text';
    if (options && options.inputMode) input.inputMode = options.inputMode;
    if (options && options.readOnly) input.readOnly = true;
    if (options && options.required) input.required = true;
    if (options && options.min != null) input.min = String(options.min);
    if (options && options.step != null) input.step = String(options.step);
    if (options && options.noVisibleLabel) {
      input.setAttribute('aria-label', label);
    } else {
      wrap.appendChild(span);
    }
    wrap.appendChild(input);
    return wrap;
  }

  function tigaBelasPurchaseCode() {
    const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return 'TB-PB-' + ymd + '-' + String(state.entries.length + 1).padStart(4, '0');
  }

  function ensureTigaBelasPanel() {
    if (!elements.form || elements.form.querySelector('[data-tiga-belas-purchase-panel]')) return;
    const panel = document.createElement('section');
    panel.className = 'tiga-belas-purchase-panel';
    panel.setAttribute('data-tiga-belas-purchase-panel', 'true');
    panel.innerHTML = [
      '<div class="tiga-belas-sheet-title">INPUT</div>',
      '<div class="tiga-belas-purchase-grid">',
      '<label class="form-field"><span>No Faktur</span><input data-tbb-field="noFaktur" readonly></label>',
      '<label class="form-field"><span>Tanggal</span><input data-tbb-field="tanggal" type="date" required></label>',
      '<label class="form-field"><span>Kode Supplier</span><input data-tbb-field="kodeSupplier" list="tbbSupplierCodes" autocomplete="off"></label>',
      '<label class="form-field"><span>Nama Supplier</span><input data-tbb-field="namaSupplier" list="tbbSupplierNames" autocomplete="off"></label>',
      '<label class="form-field"><span>Kode Ikan</span><input data-tbb-field="kodeIkan" list="tbbFishCodes" autocomplete="off"></label>',
      '<label class="form-field"><span>Nama Ikan</span><input data-tbb-field="namaIkan" list="tbbFishNames" autocomplete="off" required></label>',
      '<label class="form-field"><span>Quantity</span><input data-tbb-field="quantity" type="number" min="0" step="0.01" inputmode="decimal" required></label>',
      '<label class="form-field"><span>Satuan</span><select data-tbb-field="satuan"><option value="Kg">Kg</option><option value="Ekor">Ekor</option><option value="Box">Box</option><option value="Pcs">Pcs</option></select></label>',
      '<label class="form-field"><span>Harga Satuan</span><input data-tbb-field="hargaSatuan" inputmode="decimal" required></label>',
      '<label class="form-field"><span>Total</span><input data-tbb-field="total" readonly></label>',
      '</div>',
      '<div class="tiga-belas-hints"><span>No faktur diisi otomatis.</span><span>Tanggal diisi manual.</span><span>Supplier dan ikan bisa dipilih atau diketik manual.</span><span>Total otomatis dari Quantity x Harga Satuan.</span></div>',
      '<datalist id="tbbSupplierCodes"><option value="SUP-001"></option><option value="SUP-002"></option></datalist>',
      '<datalist id="tbbSupplierNames"><option value="Supplier Utama"></option><option value="Supplier Tambak"></option></datalist>',
      '<datalist id="tbbFishCodes"><option value="IKN-001"></option><option value="IKN-002"></option><option value="IKN-003"></option></datalist>',
      '<datalist id="tbbFishNames"><option value="Bandeng"></option><option value="Lele"></option><option value="Nila"></option><option value="Gurame"></option></datalist>'
    ].join('');
    const footer = elements.form.querySelector('.portal-modal-footer');
    elements.form.insertBefore(panel, footer);
    panel.querySelectorAll('[data-tbb-field="quantity"], [data-tbb-field="hargaSatuan"]').forEach(function (input) {
      input.addEventListener('input', syncTigaBelasTotal);
      input.addEventListener('blur', function () {
        if (input.getAttribute('data-tbb-field') === 'hargaSatuan') input.value = formatAmount(parseAmount(input.value));
        syncTigaBelasTotal();
      });
    });
  }

  function tigaBelasField(name) {
    return elements.form ? elements.form.querySelector('[data-tbb-field="' + name + '"]') : null;
  }

  function syncTigaBelasPanel() {
    ensureTigaBelasPanel();
    const panel = elements.form?.querySelector('[data-tiga-belas-purchase-panel]');
    if (panel) panel.hidden = !isTigaBelasClient();
    if (!isTigaBelasClient()) return;
    if (elements.entityGateField) elements.entityGateField.hidden = true;
    if (elements.taxModeField) elements.taxModeField.hidden = true;
    if (elements.documentGrid) elements.documentGrid.hidden = true;
    if (elements.itemsSection) elements.itemsSection.hidden = true;
    if (elements.paymentGrid) elements.paymentGrid.hidden = true;
    if (elements.documentFooter) elements.documentFooter.hidden = true;
  }

  function syncTigaBelasTotal() {
    const total = parseAmount(tigaBelasField('quantity')?.value || 0) * parseAmount(tigaBelasField('hargaSatuan')?.value || 0);
    const input = tigaBelasField('total');
    if (input) input.value = formatAmount(total);
  }

  function fillTigaBelasForm(entry) {
    if (!isTigaBelasClient()) return;
    syncTigaBelasPanel();
    const notes = text(entry?.keterangan);
    const values = {
      noFaktur: entry?.noFaktur || entry?.noInvoice || tigaBelasPurchaseCode(),
      tanggal: entry?.tanggalInvoice || today(),
      kodeSupplier: text((notes.match(/Kode Supplier:\s*([^|]+)/i) || [])[1] || entry?.noDo),
      namaSupplier: text((notes.match(/Nama Supplier:\s*([^|]+)/i) || [])[1] || entry?.outlet),
      kodeIkan: entry?.kodeVariant || '',
      namaIkan: entry?.namaBarang || '',
      quantity: entry?.jumlah || '',
      satuan: text((notes.match(/Satuan:\s*([^|]+)/i) || [])[1] || entry?.warna, 'Kg'),
      hargaSatuan: formatAmount(entry?.harga),
      total: formatAmount(entry?.total)
    };
    Object.keys(values).forEach(function (key) {
      const input = tigaBelasField(key);
      if (input) input.value = values[key];
    });
    syncTigaBelasTotal();
  }

  function tigaBelasPayload() {
    const noFaktur = text(tigaBelasField('noFaktur')?.value) || tigaBelasPurchaseCode();
    const kodeSupplier = text(tigaBelasField('kodeSupplier')?.value);
    const namaSupplier = text(tigaBelasField('namaSupplier')?.value);
    const kodeIkan = text(tigaBelasField('kodeIkan')?.value);
    const satuan = text(tigaBelasField('satuan')?.value, 'Kg');
    return {
      tanggalInvoice: tigaBelasField('tanggal')?.value || today(),
      tanggalFaktur: '',
      taxMode: 'non-ppn',
      noFaktur,
      noInvoice: noFaktur,
      noDo: kodeSupplier,
      outlet: namaSupplier,
      keterangan: [
        kodeSupplier ? 'Kode Supplier: ' + kodeSupplier : '',
        namaSupplier ? 'Nama Supplier: ' + namaSupplier : '',
        kodeIkan ? 'Kode Ikan: ' + kodeIkan : '',
        'Satuan: ' + satuan
      ].filter(Boolean).join(' | '),
      paymentType: 'hutang',
      items: [{
        jumlah: tigaBelasField('quantity')?.value || '0',
        namaBarang: tigaBelasField('namaIkan')?.value || '',
        warna: satuan,
        kodeVariant: kodeIkan,
        harga: tigaBelasField('hargaSatuan')?.value || '',
        diskon: '0',
        dpp: tigaBelasField('total')?.value || '',
        ppn: '0',
        pph22: '0',
        total: tigaBelasField('total')?.value || ''
      }]
    };
  }

  function renumberItemRows() {
    itemRows().forEach(function (row, index) {
      const numberInput = field(row, 'nomor');
      if (numberInput) numberInput.value = String(index + 1);
      const removeButton = row.querySelector('[data-action="remove-purchase-item"]');
      if (removeButton) removeButton.disabled = false;
    });
    renderItemsSummary();
  }

  function addPurchaseItemRow(entry) {
    if (!elements.itemsList) return null;
    const persada = isDemoMotorClient();
    const row = document.createElement('section');
    row.className = 'purchase-item-row purchase-table-item-row';

    const grid = document.createElement('div');
    grid.className = 'purchase-item-grid purchase-table-item-grid';
    grid.appendChild(createInput('nomor', 'No', '', { readOnly: true, className: 'purchase-item-number-field', noVisibleLabel: true }));
    grid.appendChild(createInput('namaBarang', 'Nama Barang', entry?.namaBarang || '', { required: true, wide: true, noVisibleLabel: true }));
    if (persada) {
      grid.appendChild(createInput('warna', 'Warna', entry?.warna || '', { required: true, noVisibleLabel: true }));
      grid.appendChild(createInput('noRangka', 'Nomor Rangka', entry?.noRangka || '', { required: true, noVisibleLabel: true }));
      grid.appendChild(createInput('noMesin', 'Nomor Mesin', entry?.noMesin || '', { required: true, noVisibleLabel: true }));
    }
    grid.appendChild(createInput('jumlah', 'Qty', entry?.jumlah || 1, { type: 'number', min: 1, step: 1, required: true, noVisibleLabel: true }));
    grid.appendChild(createInput('harga', 'Harga Satuan', formatAmount(entry?.harga), { inputMode: 'decimal', noVisibleLabel: true }));
    if (persada) {
      grid.appendChild(createInput('diskon', 'Diskon', formatAmount(entry?.diskon), { inputMode: 'decimal', noVisibleLabel: true }));
    }
    grid.appendChild(createInput('dpp', 'DPP', formatAmount(entry?.dpp), { inputMode: 'decimal', readOnly: true, className: 'purchase-ppn-only', noVisibleLabel: true }));
    grid.appendChild(createInput('ppn', 'PPN', formatAmount(entry?.ppn), { inputMode: 'decimal', readOnly: true, className: 'purchase-ppn-only', noVisibleLabel: true }));
    if (persada) {
      grid.appendChild(createInput('pph22', 'PPH 22', formatAmount(entry?.pph22), { inputMode: 'decimal', readOnly: true, className: 'purchase-ppn-only', noVisibleLabel: true }));
    }
    grid.appendChild(createInput('total', persada || !isPpnMode() ? 'Jumlah' : 'Jumlah DPP+PPN', formatAmount(entry?.total), { inputMode: 'decimal', readOnly: true, labelMarker: 'data-total-label', noVisibleLabel: true }));
    const action = document.createElement('div');
    action.className = 'purchase-item-actions';
    const removeButton = document.createElement('button');
    removeButton.className = 'cashbook-action-button danger purchase-item-remove-button';
    removeButton.type = 'button';
    removeButton.dataset.action = 'remove-purchase-item';
    removeButton.textContent = 'Hapus';
    action.appendChild(removeButton);
    grid.appendChild(action);
    row.appendChild(grid);

    removeButton.addEventListener('click', function () {
      row.remove();
      renumberItemRows();
    });

    ['harga', 'jumlah', 'diskon'].forEach(function (name) {
      const input = field(row, name);
      if (input) input.addEventListener('input', function () {
        calculateItemTotals(row);
      });
    });
    ['harga', 'diskon'].forEach(function (name) {
      const input = field(row, name);
      if (input) input.addEventListener('blur', function () {
        input.value = formatAmount(parseAmount(input.value));
        calculateItemTotals(row);
      });
    });
    ['noRangka', 'noMesin'].forEach(function (name) {
      const input = field(row, name);
      if (input) input.addEventListener('input', function () {
        input.value = input.value.toUpperCase();
      });
    });
    const qtyInput = field(row, 'jumlah');
    if (qtyInput) qtyInput.addEventListener('blur', function () {
      if (parseAmount(qtyInput.value) < 1) qtyInput.value = '1';
      calculateItemTotals(row);
    });

    elements.itemsList.appendChild(row);
    calculateItemTotals(row);
    renumberItemRows();
    return row;
  }

  function resetPurchaseItems(entry) {
    clearNode(elements.itemsList);
    if (entry) addPurchaseItemRow(entry);
    renumberItemRows();
  }

  function collectPurchaseItems() {
    return itemRows().map(function (row) {
      const persada = isDemoMotorClient();
      return {
        jumlah: field(row, 'jumlah')?.value || '1',
        namaBarang: field(row, 'namaBarang')?.value || '',
        warna: field(row, 'warna')?.value || '',
        noRangka: field(row, 'noRangka')?.value || '',
        noMesin: field(row, 'noMesin')?.value || '',
        kodeVariant: field(row, 'kodeVariant')?.value || '',
        harga: field(row, 'harga')?.value || '',
        diskon: persada ? field(row, 'diskon')?.value || '0' : '0',
        dpp: field(row, 'dpp')?.value || '',
        ppn: isPpnMode() ? field(row, 'ppn')?.value || '' : '0',
        pph22: persada ? field(row, 'pph22')?.value || '' : '0',
        total: field(row, 'total')?.value || ''
      };
    });
  }

  function openCreateModal() {
    elements.form.reset();
    const needsEntity = requiresPurchaseEntity();
    const persada = isDemoMotorClient();
    const tigaBelas = isTigaBelasClient();
    state.purchaseStep = tigaBelas ? 'details' : (needsEntity ? 'entity' : (persada ? 'details' : 'tax'));
    state.purchaseEntityPending = needsEntity;
    elements.entryId.value = '';
    elements.modalTitle.textContent = tigaBelas ? 'Input Buku Pembelian' : 'Tambah Pembelian';
    elements.modalMeta.textContent = tigaBelas
      ? 'Format pembelian ikan Perusahaan Distribusi Contoh.'
      : persada
      ? 'Isi data pembelian unit DemoMotor. Data tersimpan otomatis ke Buku Persediaan.'
      : 'Isi header dokumen sekali, lalu tambahkan semua barang dalam invoice/faktur yang sama.';
    elements.tanggalInvoice.value = today();
    elements.tanggalFaktur.value = today();
    if (elements.taxMode) elements.taxMode.value = persada ? 'ppn' : '';
    if (elements.paymentType) elements.paymentType.value = 'hutang';
    if (elements.paymentSource) elements.paymentSource.value = '';
    if (elements.addItemButton) elements.addItemButton.hidden = tigaBelas;
    resetPurchaseItems(null);
    if (persada) addPurchaseItemRow({});
    if (tigaBelas) fillTigaBelasForm(null);
    elements.modal.hidden = false;
    preparePurchaseProgressiveSteps(needsEntity);
    const firstItemName = itemRows()[0] ? field(itemRows()[0], 'namaBarang') : null;
    if (needsEntity) {
      const entitySelect = purchaseEntitySelect();
      if (entitySelect) entitySelect.focus();
      else if (elements.entityGateSelect) elements.entityGateSelect.focus();
    } else if (tigaBelas && tigaBelasField('tanggal')) {
      tigaBelasField('tanggal').focus();
    } else if (!persada && elements.taxMode) {
      elements.taxMode.focus();
    } else if (elements.noInvoice) {
      elements.noInvoice.focus();
    } else if (firstItemName) {
      firstItemName.focus();
    }
  }

  function openEditModal(entry) {
    elements.form.reset();
    state.purchaseStep = 'details';
    state.purchaseEntityPending = false;
    elements.entryId.value = entry.id;
    elements.modalTitle.textContent = isTigaBelasClient() ? 'Ubah Buku Pembelian' : 'Ubah Pembelian';
    elements.modalMeta.textContent = isTigaBelasClient() ? 'Format pembelian ikan Perusahaan Distribusi Contoh.' : (entry.noRangka || 'Data pembelian unit');
    elements.tanggalInvoice.value = entry.tanggalInvoice || today();
    elements.tanggalFaktur.value = entry.tanggalFaktur || '';
    if (elements.taxMode) elements.taxMode.value = Number(entry.ppn || 0) > 0 ? 'ppn' : 'non-ppn';
    elements.noFaktur.value = entry.noFaktur || '';
    elements.noInvoice.value = entry.noInvoice || '';
    elements.noDo.value = entry.noDo || '';
    elements.saleNo.value = entry.saleNo || '';
    if (elements.paymentType) elements.paymentType.value = entry.sumberPelunasan && Number(entry.pelunasan || 0) > 0 ? 'cash' : 'hutang';
    if (elements.paymentSource) elements.paymentSource.value = entry.sumberPelunasan || '';
    if (elements.addItemButton) elements.addItemButton.hidden = isTigaBelasClient();
    resetPurchaseItems(entry);
    elements.outlet.value = entry.outlet || '';
    elements.keterangan.value = entry.keterangan || '';
    elements.modal.hidden = false;
    preparePurchaseProgressiveSteps(false);
    if (isTigaBelasClient()) {
      fillTigaBelasForm(entry);
      if (tigaBelasField('tanggal')) tigaBelasField('tanggal').focus();
    } else {
      elements.noInvoice.focus();
    }
  }

  function closeModal() {
    elements.modal.hidden = true;
    state.purchaseStep = 'idle';
    state.purchaseEntityPending = false;
  }

  function openSettlementModal(entry) {
    if (!elements.settlementModal || !elements.settlementForm) return;
    elements.settlementForm.reset();
    elements.settlementEntryId.value = entry.id;
    elements.settlementTitle.textContent = 'Pelunasan Pembelian';
    elements.settlementMeta.textContent = text(entry.noInvoice || entry.noFaktur || entry.noRangka, 'Data pembelian unit');
    elements.settlementDate.value = entry.tanggalPelunasan || today();
    elements.settlementAmount.value = formatAmount(entry.pelunasan || entry.total || 0);
    renderSettlementSources();
    if (elements.settlementSource) elements.settlementSource.value = entry.sumberPelunasan || '';
    elements.settlementNotes.value = entry.keteranganPelunasan || '';
    elements.settlementModal.hidden = false;
    elements.settlementAmount.focus();
  }

  function closeSettlementModal() {
    if (elements.settlementModal) elements.settlementModal.hidden = true;
  }

  function purchaseCommonPayload() {
    const entity = requiresPurchaseEntity() ? selectedPurchaseEntity() : null;
    return {
      businessEntityKey: entity?.key || '',
      businessEntityName: entity?.name || '',
      tanggalInvoice: elements.tanggalInvoice.value,
      tanggalFaktur: elements.tanggalFaktur.value,
      taxMode: elements.taxMode ? elements.taxMode.value || 'ppn' : 'ppn',
      noFaktur: elements.noFaktur.value,
      noInvoice: elements.noInvoice.value,
      noDo: elements.noDo.value,
      saleNo: elements.saleNo.value,
      outlet: elements.outlet.value,
      keterangan: elements.keterangan.value,
      paymentType: elements.paymentType ? elements.paymentType.value : 'hutang',
      paymentSource: isCashPurchasePayment() && elements.paymentSource ? elements.paymentSource.value : ''
    };
  }

  function payload() {
    if (isTigaBelasClient()) {
      const result = tigaBelasPayload();
      if (text(elements.entryId.value)) return Object.assign({}, result, result.items[0] || {});
      return result;
    }
    const common = purchaseCommonPayload();
    const items = collectPurchaseItems();
    if (text(elements.entryId.value)) {
      return Object.assign(common, items[0] || {});
    }
    return Object.assign(common, { items });
  }

  function settlementPayload() {
    return {
      tanggalPelunasan: elements.settlementDate.value,
      pelunasan: elements.settlementAmount.value,
      sumberPelunasan: elements.settlementSource ? elements.settlementSource.value : '',
      keteranganPelunasan: elements.settlementNotes.value
    };
  }

  async function submitForm(event) {
    event.preventDefault();
    const items = isTigaBelasClient() ? (tigaBelasPayload().items || []) : collectPurchaseItems();
    const needsEntity = requiresPurchaseEntity();
    const persada = isDemoMotorClient();
    if (isTigaBelasClient()) {
      if (!text(tigaBelasField('tanggal')?.value)) {
        setAlert('Tanggal pembelian wajib diisi.', 'error');
        tigaBelasField('tanggal')?.focus();
        return;
      }
      if (!text(tigaBelasField('namaIkan')?.value)) {
        setAlert('Nama ikan wajib diisi.', 'error');
        tigaBelasField('namaIkan')?.focus();
        return;
      }
      if (parseAmount(tigaBelasField('quantity')?.value || 0) <= 0) {
        setAlert('Quantity wajib lebih dari 0.', 'error');
        tigaBelasField('quantity')?.focus();
        return;
      }
    }
    if (!text(elements.entryId.value) && needsEntity && !hasSelectedPurchaseEntity()) {
      setAlert('Pilih entitas sebelum menyimpan Pembelian.', 'error');
      const entitySelect = purchaseEntitySelect();
      if (entitySelect) entitySelect.focus();
      return;
    }
    if (!text(elements.entryId.value) && !persada && elements.taxMode && !elements.taxMode.value) {
      setAlert('Pilih PPN atau Non-PPN sebelum menyimpan Pembelian.', 'error');
      elements.taxMode.focus();
      return;
    }
    if (!items.length) {
      setAlert('Tambahkan minimal 1 barang sebelum menyimpan Pembelian.', 'error');
      if (elements.addItemButton) elements.addItemButton.focus();
      return;
    }
    if (persada) {
      const invalidIndex = items.findIndex(function (item) {
        return !text(item.namaBarang) || !text(item.warna) || !text(item.noRangka) || !text(item.noMesin);
      });
      if (invalidIndex !== -1) {
        setAlert('Lengkapi Nama Barang, Warna, Nomor Rangka, dan Nomor Mesin pada baris ' + (invalidIndex + 1) + '.', 'error');
        const row = itemRows()[invalidIndex];
        const target = field(row, !text(items[invalidIndex].namaBarang) ? 'namaBarang' : (!text(items[invalidIndex].warna) ? 'warna' : (!text(items[invalidIndex].noRangka) ? 'noRangka' : 'noMesin')));
        if (target) target.focus();
        return;
      }
    }
    if (isCashPurchasePayment() && !text(elements.paymentSource?.value)) {
      setAlert('Pilih sumber kas/bank untuk pembayaran cash.', 'error');
      if (elements.paymentSource) elements.paymentSource.focus();
      return;
    }
    elements.saveButton.disabled = true;
    setAlert('');
    try {
      const entryId = text(elements.entryId.value);
      let data = await requestJson(apiBase() + (entryId ? '/' + encodeURIComponent(entryId) : ''), {
        method: entryId ? 'PUT' : 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload())
      });
      if (!data) return;
      if (entryId && items.length > 1) {
        const extraData = await requestJson(apiBase(), {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(Object.assign(purchaseCommonPayload(), { items: items.slice(1) }))
        });
        if (!extraData) return;
        data = extraData;
      }
      const savedCount = entryId ? items.length : (data.createdCount || items.length || 1);
      state.client = data.client || state.client;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.inventoryEntries = Array.isArray(data.inventoryEntries) ? data.inventoryEntries : state.inventoryEntries;
      state.settlementSources = Array.isArray(data.settlementSources) ? data.settlementSources : state.settlementSources;
      renderClient();
      renderRows();
      closeModal();
      setAlert(savedCount + ' barang Pembelian tersimpan dan Buku Persediaan sudah diperbarui.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan Pembelian.', 'error');
    } finally {
      elements.saveButton.disabled = false;
    }
  }

  async function submitSettlement(event) {
    event.preventDefault();
    const entryId = text(elements.settlementEntryId.value);
    if (!entryId) {
      setAlert('Data pembelian tidak ditemukan.', 'error');
      return;
    }
    elements.settlementSaveButton.disabled = true;
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entryId) + '/pelunasan', {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settlementPayload())
      });
      if (!data) return;
      state.client = data.client || state.client;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.inventoryEntries = Array.isArray(data.inventoryEntries) ? data.inventoryEntries : state.inventoryEntries;
      state.settlementSources = Array.isArray(data.settlementSources) ? data.settlementSources : state.settlementSources;
      renderClient();
      renderRows();
      closeSettlementModal();
      setAlert('Pelunasan pembelian tersimpan.', 'info');
    } catch (err) {
      setAlert(err.message || 'Gagal menyimpan pelunasan pembelian.', 'error');
    } finally {
      elements.settlementSaveButton.disabled = false;
    }
  }

  async function deleteEntry(entry, silent) {
    if (!entry || !entry.id) return false;
    if (!silent) {
      const ok = window.confirm('Hapus data pembelian ini? Stok terkait ikut terhapus bila belum dipakai penjualan.');
      if (!ok) return false;
    }
    setAlert('');
    try {
      const data = await requestJson(apiBase() + '/' + encodeURIComponent(entry.id), {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' }
      });
      if (!data) return false;
      state.client = data.client || state.client;
      state.entries = Array.isArray(data.entries) ? data.entries : state.entries;
      state.inventoryEntries = Array.isArray(data.inventoryEntries) ? data.inventoryEntries : state.inventoryEntries;
      state.selectedIds.delete(text(entry.id));
      renderClient();
      renderRows();
      if (!silent) setAlert('Data pembelian dihapus.', 'info');
      return true;
    } catch (err) {
      setAlert(err.message || 'Gagal menghapus Pembelian.', 'error');
      return false;
    }
  }

  async function deleteSelectedEntries() {
    const ids = Array.from(state.selectedIds);
    if (!ids.length) return;
    const ok = window.confirm('Hapus ' + ids.length + ' data pembelian yang dipilih? Stok terkait ikut terhapus bila belum dipakai penjualan.');
    if (!ok) return;
    if (elements.deleteSelectedButton) elements.deleteSelectedButton.disabled = true;
    let deletedCount = 0;
    for (const id of ids) {
      const entry = state.entries.find(function (item) {
        return text(item.id) === id;
      });
      if (entry && await deleteEntry(entry, true)) deletedCount += 1;
    }
    state.selectedIds.clear();
    renderClient();
    renderRows();
    setAlert(deletedCount + ' data pembelian dihapus.', 'info');
  }

  if (elements.refreshButton) elements.refreshButton.addEventListener('click', loadPurchase);
  if (elements.logoutButton) elements.logoutButton.addEventListener('click', logout);
  if (elements.addButton) elements.addButton.addEventListener('click', openCreateModal);
  if (elements.importMenuButton) elements.importMenuButton.addEventListener('click', function (event) {
    event.stopPropagation();
    toggleImportMenu();
  });
  if (elements.templateButton) elements.templateButton.addEventListener('click', downloadPurchaseImportTemplate);
  if (elements.importPickButton) {
    elements.importPickButton.addEventListener('click', function () {
      closeImportMenu();
      if (elements.importFile) elements.importFile.click();
    });
  }
  if (elements.exportButton) elements.exportButton.addEventListener('click', exportPurchaseWorkbook);
  if (elements.importFile) {
    elements.importFile.addEventListener('change', function () {
      const file = elements.importFile.files && elements.importFile.files[0];
      importPurchaseWorkbook(file);
    });
  }
  if (elements.addItemButton) elements.addItemButton.addEventListener('click', function () {
    addPurchaseItemRow({});
    const rows = itemRows();
    const last = rows[rows.length - 1];
    const firstInput = field(last, 'namaBarang');
    if (firstInput) firstInput.focus();
  });
  if (elements.deleteSelectedButton) elements.deleteSelectedButton.addEventListener('click', deleteSelectedEntries);
  if (elements.selectAll) elements.selectAll.addEventListener('change', toggleSelectAll);
  if (elements.closeButton) elements.closeButton.addEventListener('click', closeModal);
  if (elements.cancelButton) elements.cancelButton.addEventListener('click', closeModal);
  if (elements.form) elements.form.addEventListener('submit', submitForm);
  if (elements.entityGateSelect) {
    elements.entityGateSelect.addEventListener('change', function () {
      state.purchaseEntityPending = false;
      state.purchaseStep = elements.entityGateSelect.value ? 'tax' : 'entity';
      syncTechnicalEntitySelect();
      syncPurchaseFormSteps();
    });
  }
  if (elements.taxMode) elements.taxMode.addEventListener('change', syncPurchaseFormSteps);
  if (elements.paymentType) elements.paymentType.addEventListener('change', syncPurchasePaymentControls);
  if (elements.settlementCloseButton) elements.settlementCloseButton.addEventListener('click', closeSettlementModal);
  if (elements.settlementCancelButton) elements.settlementCancelButton.addEventListener('click', closeSettlementModal);
  if (elements.settlementForm) elements.settlementForm.addEventListener('submit', submitSettlement);
  if (elements.settlementAmount) {
    elements.settlementAmount.addEventListener('blur', function () {
      elements.settlementAmount.value = formatAmount(parseAmount(elements.settlementAmount.value));
    });
  }
  if (elements.modal) {
    elements.modal.addEventListener('click', function (event) {
      if (event.target === elements.modal) closeModal();
    });
  }
  if (elements.settlementModal) {
    elements.settlementModal.addEventListener('click', function (event) {
      if (event.target === elements.settlementModal) closeSettlementModal();
    });
  }
  document.addEventListener('click', function (event) {
    if (!elements.importWrap || elements.importWrap.contains(event.target)) return;
    closeImportMenu();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeImportMenu();
  });

  loadPurchase();
})();
