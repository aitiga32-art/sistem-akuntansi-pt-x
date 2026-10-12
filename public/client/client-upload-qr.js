(function () {
  'use strict';

  const BUNDLE_MIME = 'application/vnd.ataxco.client-upload-bundle+json';
  const PDFJS_SCRIPT_URL = '/app/assets/vendor/pdfjs/pdf.mjs?v=client-upload-pdfjs-1';
  const PDFJS_WORKER_URL = '/app/assets/vendor/pdfjs/pdf.worker.mjs?v=client-upload-pdfjs-1';
  const qrFilesByInput = new WeakMap();
  const fileSelectionsByInput = new WeakMap();
  let pdfJsLoader = null;
  let qrModal = null;
  let qrPollTimer = null;

  function text(value, fallback) {
    const raw = value == null ? '' : String(value).trim();
    return raw || (fallback == null ? '' : String(fallback));
  }

  function formatFileSize(value) {
    const size = Number(value || 0);
    if (!size) return '0 KB';
    if (size < 1024 * 1024) return Math.max(1, Math.round(size / 1024)) + ' KB';
    return (size / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB';
  }

  function formatFilesNote(files, prefix) {
    const list = Array.isArray(files) ? files : [];
    if (!list.length) return 'Belum ada file dipilih.';
    const totalSize = list.reduce(function (sum, file) {
      return sum + Number(file.size || 0);
    }, 0);
    if (list.length === 1) {
      return (prefix || 'File dipilih') + ': ' + text(list[0].name, 'lampiran') + ' (' + formatFileSize(totalSize) + ')';
    }
    return (prefix || 'File dipilih') + ': ' + list.length + ' file (' + formatFileSize(totalSize) + ')';
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ''));
      };
      reader.onerror = function () {
        reject(new Error('Gagal membaca file.'));
      };
      reader.readAsDataURL(file);
    });
  }

  function encodeBase64Utf8(value) {
    const bytes = new TextEncoder().encode(String(value || ''));
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function decodeBase64Utf8(value) {
    const binary = atob(String(value || ''));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function nativeFileRecord(file) {
    return {
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size || 0,
      lastModified: file.lastModified || 0,
      file
    };
  }

  function fileSelectionKey(file) {
    const nativeFile = file && file.file;
    return [
      text(file && file.name).toLowerCase(),
      Number(file && file.size || nativeFile && nativeFile.size || 0),
      Number(file && file.lastModified || nativeFile && nativeFile.lastModified || 0)
    ].join('|');
  }

  function mergeFileSelections(input, files) {
    if (!input) return [];
    const savedFiles = fileSelectionsByInput.get(input);
    const current = Array.isArray(savedFiles) ? savedFiles.slice() : [];
    const keys = new Set(current.map(fileSelectionKey));
    (Array.isArray(files) ? files : []).forEach(function (file) {
      if (!file) return;
      const record = file.file || file.dataUrl ? file : nativeFileRecord(file);
      const key = fileSelectionKey(record);
      if (keys.has(key)) return;
      keys.add(key);
      current.push(record);
    });
    fileSelectionsByInput.set(input, current);
    return current.slice();
  }

  function selectedFiles(input) {
    if (!input) return [];
    const savedFiles = fileSelectionsByInput.get(input);
    if (Array.isArray(savedFiles)) return savedFiles.slice();
    const qrFiles = qrFilesByInput.get(input);
    if (Array.isArray(qrFiles) && qrFiles.length) return qrFiles.slice();
    return Array.from(input.files || []).map(nativeFileRecord);
  }

  function clearUploadSelection(input) {
    if (!input) return;
    qrFilesByInput.delete(input);
    fileSelectionsByInput.delete(input);
    renderUploadFileCards(input, []);
    try {
      input.value = '';
    } catch {
      // Some browsers block assigning file inputs; clearing QR state is enough.
    }
  }

  async function normalizeAttachmentFiles(files) {
    const list = Array.isArray(files) ? files : [];
    const output = [];
    for (const file of list) {
      const dataUrl = file.dataUrl || (file.file ? await fileToDataUrl(file.file) : '');
      if (!dataUrl) continue;
      output.push({
        id: text(file.id) || randomId(),
        name: text(file.name, 'lampiran'),
        mimeType: text(file.mimeType || file.type, 'application/octet-stream'),
        size: Number(file.size || 0),
        dataUrl,
        uploadedAt: text(file.uploadedAt) || new Date().toISOString()
      });
    }
    return output;
  }

  async function readSelectedFiles(input) {
    return normalizeAttachmentFiles(selectedFiles(input));
  }

  async function buildAttachmentPayloadFromFiles(files) {
    const normalizedFiles = await normalizeAttachmentFiles(files);
    if (!normalizedFiles.length) return {};
    return attachmentPayloadFromFiles(normalizedFiles);
  }

  function attachmentPayloadFromFiles(files) {
    if (!files.length) return {};
    const totalSize = files.reduce(function (sum, file) {
      return sum + Number(file.size || 0);
    }, 0);
    const bundle = {
      version: 1,
      files
    };
    return {
      attachmentName: files.length === 1 ? files[0].name : files.length + ' file',
      attachmentMimeType: BUNDLE_MIME,
      attachmentSize: totalSize,
      attachmentDataUrl: 'data:' + BUNDLE_MIME + ';base64,' + encodeBase64Utf8(JSON.stringify(bundle))
    };
  }

  async function buildAttachmentPayload(input) {
    const files = await readSelectedFiles(input);
    return attachmentPayloadFromFiles(files);
  }

  function buildNamedFilePayload(input, prefix) {
    return buildAttachmentPayload(input).then(function (payload) {
      if (!payload.attachmentDataUrl) return {};
      const output = {};
      output[prefix + 'Name'] = payload.attachmentName;
      output[prefix + 'MimeType'] = payload.attachmentMimeType;
      output[prefix + 'Size'] = payload.attachmentSize;
      output[prefix + 'DataUrl'] = payload.attachmentDataUrl;
      return output;
    });
  }

  function randomId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'file-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function parseDataUrl(dataUrl) {
    const match = /^data:([^;,]+)?((?:;[^,]+)*),(.*)$/i.exec(text(dataUrl));
    if (!match) return null;
    return {
      mimeType: text(match[1], 'application/octet-stream'),
      meta: text(match[2]),
      payload: match[3] || ''
    };
  }

  function decodeAttachmentBundle(dataUrl) {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return null;
    if (parsed.mimeType !== BUNDLE_MIME && parsed.mimeType !== 'application/json') return null;
    try {
      const json = parsed.meta.indexOf(';base64') >= 0
        ? decodeBase64Utf8(parsed.payload)
        : decodeURIComponent(parsed.payload);
      const bundle = JSON.parse(json);
      const files = Array.isArray(bundle.files) ? bundle.files : [];
      return files.filter(function (file) {
        return text(file.dataUrl);
      }).map(function (file) {
        return {
          id: text(file.id) || randomId(),
          name: text(file.name, 'lampiran'),
          mimeType: text(file.mimeType || file.type, 'application/octet-stream'),
          size: Number(file.size || 0),
          dataUrl: text(file.dataUrl),
          uploadedAt: text(file.uploadedAt)
        };
      });
    } catch {
      return null;
    }
  }

  function filesFromResponse(payload) {
    const rawFiles = Array.isArray(payload && payload.files) ? payload.files : [];
    if (rawFiles.length) return rawFiles.flatMap(expandFileRecordForViewer).filter(Boolean);
    const file = payload && payload.file ? payload.file : payload;
    if (!file) return [];
    const bundle = decodeAttachmentBundle(file.dataUrl);
    if (bundle && bundle.length) return inheritFileDetails(bundle, file);
    const normalized = normalizeFileRecord(file);
    return normalized ? [normalized] : [];
  }

  function expandFileRecordForViewer(file) {
    if (!file) return [];
    const bundle = decodeAttachmentBundle(file.dataUrl);
    if (bundle && bundle.length) return inheritFileDetails(bundle, file);
    const normalized = normalizeFileRecord(file);
    return normalized ? [normalized] : [];
  }

  function inheritFileDetails(files, source) {
    const details = Array.isArray(source && source.details) ? source.details : [];
    const detailsTitle = text(source && source.detailsTitle);
    return (Array.isArray(files) ? files : []).map(function (file) {
      return Object.assign({}, file, {
        detailsTitle: text(file.detailsTitle) || detailsTitle,
        details: Array.isArray(file.details) && file.details.length ? file.details : details
      });
    });
  }

  function normalizeFileRecord(file) {
    if (!file || !text(file.dataUrl)) return null;
    return {
      id: text(file.id || file.entryId) || randomId(),
      name: text(file.name, 'lampiran'),
      mimeType: text(file.mimeType || file.type) || mimeTypeFromDataUrl(file.dataUrl) || 'application/octet-stream',
      size: Number(file.size || 0),
      dataUrl: text(file.dataUrl),
      uploadedAt: text(file.uploadedAt),
      detailsTitle: text(file.detailsTitle),
      details: Array.isArray(file.details) ? file.details : []
    };
  }

  function mimeTypeFromDataUrl(dataUrl) {
    const parsed = parseDataUrl(dataUrl);
    return parsed ? parsed.mimeType.toLowerCase() : '';
  }

  function dataUrlToBlobUrl(dataUrl, fallbackType) {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return '';
    try {
      const mimeType = text(parsed.mimeType, fallbackType || 'application/octet-stream');
      const parts = [];
      if (parsed.meta.indexOf(';base64') >= 0) {
        const binary = atob(parsed.payload);
        const chunkSize = 0x8000;
        for (let i = 0; i < binary.length; i += chunkSize) {
          const slice = binary.slice(i, i + chunkSize);
          const bytes = new Uint8Array(slice.length);
          for (let j = 0; j < slice.length; j += 1) bytes[j] = slice.charCodeAt(j);
          parts.push(bytes);
        }
      } else {
        parts.push(new TextEncoder().encode(decodeURIComponent(parsed.payload)));
      }
      return URL.createObjectURL(new Blob(parts, { type: mimeType }));
    } catch {
      return '';
    }
  }

  function dataUrlToBytes(dataUrl) {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) return null;
    try {
      if (parsed.meta.indexOf(';base64') >= 0) {
        const binary = atob(parsed.payload);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        return bytes;
      }
      return new TextEncoder().encode(decodeURIComponent(parsed.payload));
    } catch {
      return null;
    }
  }

  function loadPdfJs() {
    if (!pdfJsLoader) {
      pdfJsLoader = import(PDFJS_SCRIPT_URL).then(function (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        return pdfjsLib;
      });
    }
    return pdfJsLoader;
  }

  function renderAttachmentViewer(container, payload, options) {
    const files = filesFromResponse(payload);
    const titleEl = options && options.titleEl;
    const metaEl = options && options.metaEl;
    const label = text(options && options.label, 'Lihat File');
    clearNode(container);
    if (!files.length) {
      if (titleEl) titleEl.textContent = label;
      if (metaEl) metaEl.textContent = 'File belum tersedia.';
      renderFallback(container, 'File belum tersedia.');
      return;
    }
    if (files.length === 1) {
      if (titleEl) titleEl.textContent = text(files[0].name, label);
      if (metaEl) metaEl.textContent = [files[0].mimeType || 'file', formatFileSize(files[0].size)].filter(Boolean).join(' | ');
      renderFileWithDetails(container, files[0]);
      return;
    }

    if (titleEl) titleEl.textContent = label;
    if (metaEl) {
      const totalSize = files.reduce(function (sum, file) {
        return sum + Number(file.size || 0);
      }, 0);
      metaEl.textContent = files.length + ' file | ' + formatFileSize(totalSize);
    }

    const wrap = document.createElement('div');
    wrap.className = 'client-upload-file-browser';
    const list = document.createElement('div');
    list.className = 'client-upload-file-list';
    const preview = document.createElement('div');
    preview.className = 'client-upload-file-preview';
    wrap.appendChild(list);
    wrap.appendChild(preview);
    container.appendChild(wrap);

    files.forEach(function (file, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'client-upload-file-list-item';
      button.textContent = (index + 1) + '. ' + text(file.name, 'lampiran');
      button.addEventListener('click', function () {
        Array.from(list.children).forEach(function (item) {
          item.classList.remove('active');
        });
        button.classList.add('active');
        clearNode(preview);
        renderFileWithDetails(preview, file);
      });
      list.appendChild(button);
      if (index === 0) button.click();
    });
  }

  function renderFileWithDetails(container, file) {
    const details = normalizeDetailRows(file && file.details);
    if (!details.length) {
      renderSingleFile(container, file);
      return;
    }
    const wrap = document.createElement('div');
    wrap.className = 'client-upload-file-preview-stack';
    wrap.appendChild(renderFileDetailsPanel(file, details));
    const body = document.createElement('div');
    body.className = 'client-upload-file-preview-body';
    wrap.appendChild(body);
    container.appendChild(wrap);
    renderSingleFile(body, file);
  }

  function normalizeDetailRows(rows) {
    return (Array.isArray(rows) ? rows : []).map(function (row) {
      if (Array.isArray(row)) return { label: text(row[0]), value: text(row[1], '-') };
      return { label: text(row && row.label), value: text(row && row.value, '-') };
    }).filter(function (row) {
      return row.label;
    });
  }

  function renderFileDetailsPanel(file, rows) {
    const panel = document.createElement('section');
    panel.className = 'client-upload-file-details';
    const title = document.createElement('h3');
    title.textContent = text(file && file.detailsTitle, 'Data Pembelian yang Diinput');
    panel.appendChild(title);
    const grid = document.createElement('dl');
    rows.forEach(function (row) {
      const item = document.createElement('div');
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = row.label;
      value.textContent = row.value || '-';
      item.appendChild(term);
      item.appendChild(value);
      grid.appendChild(item);
    });
    panel.appendChild(grid);
    return panel;
  }

  function renderSingleFile(container, file) {
    const dataUrl = text(file.dataUrl);
    const mimeType = text(file.mimeType) || mimeTypeFromDataUrl(dataUrl);
    const fileName = text(file.name, 'lampiran');
    if (!dataUrl) {
      renderFallback(container, 'File belum tersedia.');
      return;
    }
    if (mimeType.startsWith('image/')) {
      const image = document.createElement('img');
      image.className = 'cashbook-file-image';
      image.src = dataUrl;
      image.alt = fileName;
      container.appendChild(image);
      return;
    }
    if (mimeType === 'application/pdf') {
      renderPdfFile(container, dataUrl, fileName);
      return;
    }
    renderDownloadFallback(container, dataUrl, fileName);
  }

  function renderPdfFile(container, dataUrl, fileName) {
    const bytes = dataUrlToBytes(dataUrl);
    const objectUrl = dataUrlToBlobUrl(dataUrl, 'application/pdf');
    if (!bytes && !objectUrl) {
      renderDownloadFallback(container, dataUrl, fileName);
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'cashbook-file-pdf-viewer';

    const actions = document.createElement('div');
    actions.className = 'cashbook-file-pdf-actions';
    if (objectUrl) {
      const openLink = document.createElement('a');
      openLink.className = 'ghost-button cashbook-file-download';
      openLink.href = objectUrl;
      openLink.target = '_blank';
      openLink.rel = 'noopener';
      openLink.textContent = 'Buka PDF';
      openLink.dataset.objectUrl = objectUrl;
      actions.appendChild(openLink);
    }

    const stage = document.createElement('div');
    stage.className = 'cashbook-file-pdf-stage';
    const loading = document.createElement('div');
    loading.className = 'cashbook-file-pdf-loading';
    loading.textContent = 'Memuat preview PDF...';
    stage.appendChild(loading);

    wrap.appendChild(actions);
    wrap.appendChild(stage);
    container.appendChild(wrap);

    if (!bytes) {
      loading.textContent = 'Preview PDF belum bisa dimuat. Gunakan tombol Buka PDF.';
      return;
    }

    loadPdfJs().then(async function (pdfjsLib) {
      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const pdfDoc = await loadingTask.promise;
      if (!stage.isConnected) return;
      clearNode(stage);

      for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
        if (!stage.isConnected) return;
        const page = await pdfDoc.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(320, (stage.clientWidth || container.clientWidth || baseViewport.width) - 24);
        const scale = Math.min(1.6, Math.max(0.65, availableWidth / baseViewport.width));
        const viewport = page.getViewport({ scale });
        const ratio = window.devicePixelRatio || 1;
        const pageWrap = document.createElement('div');
        pageWrap.className = 'cashbook-file-pdf-page';
        pageWrap.setAttribute('aria-label', fileName + ' halaman ' + pageNumber);
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';
        pageWrap.appendChild(canvas);
        stage.appendChild(pageWrap);
        const context = canvas.getContext('2d');
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        await page.render({ canvasContext: context, viewport }).promise;
      }
    }).catch(function () {
      clearNode(stage);
      const failed = document.createElement('div');
      failed.className = 'cashbook-file-pdf-loading';
      failed.textContent = 'Preview PDF belum bisa dimuat. Gunakan tombol Buka PDF.';
      stage.appendChild(failed);
    });
  }

  function renderDownloadFallback(container, dataUrl, fileName) {
    const fallback = document.createElement('div');
    fallback.className = 'cashbook-file-fallback';
    const textNode = document.createElement('p');
    textNode.textContent = 'File tersimpan, tetapi format ini tidak dapat ditampilkan langsung di browser.';
    const link = document.createElement('a');
    link.className = 'ghost-button cashbook-file-download';
    link.href = dataUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Buka File';
    fallback.appendChild(textNode);
    fallback.appendChild(link);
    container.appendChild(fallback);
  }

  function renderFallback(container, message) {
    const empty = document.createElement('div');
    empty.className = 'cashbook-file-fallback';
    empty.textContent = message;
    container.appendChild(empty);
  }

  function clearNode(node) {
    if (!node) return;
    const objectUrls = new Set();
    node.querySelectorAll('[data-object-url]').forEach(function (item) {
      const url = text(item.dataset.objectUrl);
      if (url) objectUrls.add(url);
    });
    objectUrls.forEach(function (url) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Browser may already have released it.
      }
    });
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function clientIdFromPath() {
    const match = /\/app\/client\/clients\/([^/]+)/.exec(window.location.pathname);
    return match ? decodeURIComponent(match[1]) : '';
  }

  function shouldEnhance(input) {
    if (!input || input.dataset.qrEnhanced === 'true') return false;
    const id = input.id || '';
    if (/import/i.test(id)) return false;
    return /(AttachmentFile|FakturFile|assetAttachmentFile|bukuKasAttachmentFile|bukuBankAttachmentFile|adjustmentAttachmentFile)$/i.test(id);
  }

  function enhanceFileInput(input) {
    if (!shouldEnhance(input)) return;
    input.dataset.qrEnhanced = 'true';
    input.multiple = true;
    input.addEventListener('change', function () {
      qrFilesByInput.delete(input);
      const newlySelectedFiles = Array.from(input.files || []).map(nativeFileRecord);
      const files = mergeFileSelections(input, newlySelectedFiles);
      updateNearbyNote(input, files, 'Lampiran transaksi');
      renderUploadFileCards(input, files);
    });
    input.addEventListener('client-portal-upload-files', function (event) {
      const files = event.detail && Array.isArray(event.detail.files) ? event.detail.files : selectedFiles(input);
      const mergedFiles = mergeFileSelections(input, files);
      updateNearbyNote(input, mergedFiles, 'Lampiran transaksi');
      renderUploadFileCards(input, mergedFiles);
    });

    const action = document.createElement('div');
    action.className = 'client-upload-actions';
    const qrButton = document.createElement('button');
    qrButton.type = 'button';
    qrButton.className = 'client-upload-qr-button';
    qrButton.textContent = 'Upload via QR';
    qrButton.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openQrUpload(input);
    });
    action.appendChild(qrButton);

    if (input.parentNode) {
      if (input.nextSibling) {
        input.parentNode.insertBefore(action, input.nextSibling);
      } else {
        input.parentNode.appendChild(action);
      }
    }
  }

  function updateNearbyNote(input, files, prefix) {
    const parent = input.closest('label, .sales-form-section, .field-group, .sales-line') || input.parentElement;
    let note = null;
    if (parent) {
      note = parent.querySelector('.cashbook-file-note, .adjustment-file-note, small');
      if (!note && parent.nextElementSibling && parent.nextElementSibling.matches('small, .cashbook-file-note, .adjustment-file-note')) {
        note = parent.nextElementSibling;
      }
    }
    if (note) note.textContent = formatFilesNote(files, prefix);
  }

  function renderUploadFileCards(input, files) {
    const section = input && input.closest('.hti-footer-upload, .hti-bank-transfer-attachment');
    const list = section && section.querySelector('.hti-upload-file-list');
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);
    (Array.isArray(files) ? files : []).forEach(function (file) {
      const card = document.createElement('div');
      card.className = 'hti-upload-file-card';

      const name = document.createElement('strong');
      name.className = 'hti-upload-file-name';
      name.textContent = text(file && file.name, 'lampiran');
      name.title = name.textContent;

      const meta = document.createElement('span');
      meta.className = 'hti-upload-file-meta';
      meta.textContent = 'baru | ' + formatFileSize(file && file.size);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'hti-upload-file-remove';
      remove.textContent = 'X';
      remove.setAttribute('aria-label', 'Hapus file ' + name.textContent);
      remove.title = 'Hapus file ini dari upload';
      remove.addEventListener('click', function () {
        const savedFiles = fileSelectionsByInput.get(input) || [];
        const key = fileSelectionKey(file);
        const remaining = savedFiles.filter(function (candidate) {
          return fileSelectionKey(candidate) !== key;
        });
        fileSelectionsByInput.set(input, remaining);
        qrFilesByInput.delete(input);
        try {
          input.value = '';
        } catch {
          // File input may reject value assignment in some browsers.
        }
        updateNearbyNote(input, remaining, 'Lampiran transaksi');
        renderUploadFileCards(input, remaining);
      });

      card.appendChild(name);
      card.appendChild(meta);
      card.appendChild(remove);
      list.appendChild(card);
    });
  }

  async function openQrUpload(input) {
    const clientId = clientIdFromPath();
    if (!clientId) {
      window.alert('QR upload hanya tersedia di halaman detail klien.');
      return;
    }
    const modal = ensureQrModal();
    const label = uploadLabel(input);
    setQrModalState('loading', 'Membuat QR upload...', '');
    modal.backdrop.hidden = false;
    try {
      const response = await fetch('/app/api/client/mobile-uploads/qr', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId, label })
      });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok || data.ok === false) throw new Error(data.error || 'Gagal membuat QR upload.');
      modal.qr.innerHTML = data.svg || '';
      modal.link.href = data.url || '#';
      modal.link.textContent = data.url || '';
      setQrModalState('ready', 'Scan QR lewat HP untuk upload banyak file.', 'Menunggu file dari HP...');
      startQrPolling(data.token, input);
    } catch (err) {
      setQrModalState('error', err.message || 'Gagal membuat QR upload.', '');
    }
  }

  function uploadLabel(input) {
    const label = input.closest('label');
    const span = label ? label.querySelector('span') : null;
    return text(span && span.textContent, 'Upload File');
  }

  function ensureQrModal() {
    if (qrModal) return qrModal;
    const backdrop = document.createElement('div');
    backdrop.className = 'client-upload-qr-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = [
      '<section class="client-upload-qr-modal" role="dialog" aria-modal="true" aria-labelledby="clientUploadQrTitle">',
      '<header class="client-upload-qr-header">',
      '<div><h2 id="clientUploadQrTitle">Upload via QR</h2><span id="clientUploadQrMessage">Membuat QR upload...</span></div>',
      '<button type="button" class="icon-button" data-client-upload-qr-close aria-label="Tutup popup QR"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>',
      '</header>',
      '<div class="client-upload-qr-body">',
      '<div class="client-upload-qr-code" data-client-upload-qr-code></div>',
      '<p id="clientUploadQrStatus">Menunggu file dari HP...</p>',
      '<a data-client-upload-qr-link href="#" target="_blank" rel="noopener"></a>',
      '</div>',
      '</section>'
    ].join('');
    document.body.appendChild(backdrop);
    qrModal = {
      backdrop,
      message: backdrop.querySelector('#clientUploadQrMessage'),
      status: backdrop.querySelector('#clientUploadQrStatus'),
      qr: backdrop.querySelector('[data-client-upload-qr-code]'),
      link: backdrop.querySelector('[data-client-upload-qr-link]')
    };
    backdrop.querySelector('[data-client-upload-qr-close]').addEventListener('click', closeQrModal);
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) closeQrModal();
    });
    return qrModal;
  }

  function closeQrModal() {
    if (qrPollTimer) {
      window.clearInterval(qrPollTimer);
      qrPollTimer = null;
    }
    if (qrModal) qrModal.backdrop.hidden = true;
  }

  function setQrModalState(type, message, status) {
    const modal = ensureQrModal();
    modal.backdrop.dataset.state = type;
    modal.message.textContent = message || '';
    modal.status.textContent = status || '';
    if (type !== 'ready') modal.link.textContent = '';
    if (type !== 'ready') modal.qr.innerHTML = '';
  }

  function startQrPolling(token, input) {
    if (qrPollTimer) window.clearInterval(qrPollTimer);
    qrPollTimer = window.setInterval(async function () {
      try {
        const response = await fetch('/app/api/client/mobile-uploads/' + encodeURIComponent(token) + '/status', {
          credentials: 'same-origin',
          headers: { 'Accept': 'application/json' }
        });
        const data = await response.json().catch(function () { return {}; });
        if (!response.ok || data.ok === false) throw new Error(data.error || 'Gagal membaca status upload.');
        const files = Array.isArray(data.files) ? data.files : [];
        if (!files.length) return;
        qrFilesByInput.set(input, files);
        input.dispatchEvent(new CustomEvent('client-portal-upload-files', { detail: { files } }));
        ensureQrModal().status.textContent = files.length + ' file diterima. File sudah masuk ke form.';
        if (qrPollTimer) {
          window.clearInterval(qrPollTimer);
          qrPollTimer = null;
        }
      } catch (err) {
        ensureQrModal().status.textContent = err.message || 'Gagal membaca status upload.';
      }
    }, 1800);
  }

  function enhanceAllUploadInputs() {
    Array.from(document.querySelectorAll('input[type="file"]')).forEach(enhanceFileInput);
  }

  window.clientPortalSelectedFiles = selectedFiles;
  window.clientPortalFormatFilesNote = formatFilesNote;
  window.clientPortalBuildAttachmentPayload = buildAttachmentPayload;
  window.clientPortalBuildAttachmentPayloadFromFiles = buildAttachmentPayloadFromFiles;
  window.clientPortalBuildNamedFilePayload = buildNamedFilePayload;
  window.clientPortalFilesFromResponse = filesFromResponse;
  window.clientPortalRenderAttachmentViewer = renderAttachmentViewer;
  window.clientPortalEnhanceUploadInputs = enhanceAllUploadInputs;
  window.clientPortalClearUploadSelection = clearUploadSelection;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enhanceAllUploadInputs);
  } else {
    enhanceAllUploadInputs();
  }
})();
