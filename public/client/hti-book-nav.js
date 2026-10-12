(function () {
  'use strict';

  const books = [
    { slug: 'hti-buku-penjualan', label: 'Penjualan' },
    { slug: 'hti-buku-pembelian-fp', label: 'Pembelian' },
    { slug: 'hti-buku-pembelian-non-ppn', label: 'Pembelian Non PPN' },
    { slug: 'hti-biaya', label: 'Biaya' },
    { slug: 'hti-buku-kontrol', label: 'Kontrol' }
  ];

  function clientBookBasePath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const clientsIndex = parts.indexOf('clients');
    const clientId = clientsIndex >= 0 ? parts[clientsIndex + 1] : '';
    return clientId ? '/app/client/clients/' + encodeURIComponent(decodeURIComponent(clientId)) + '/' : '/app/client/';
  }

  function render() {
    const mount = document.querySelector('[data-hti-book-switcher]');
    if (!mount) return;

    const currentSlug = window.location.pathname.replace(/\/+$/, '').split('/').pop();
    if (!/^hti-(?:buku-|jurnal-umum)/.test(currentSlug)) return;
    const basePath = clientBookBasePath();
    mount.replaceChildren();

    books.forEach(function (book) {
      const link = document.createElement('a');
      const isActive = currentSlug === book.slug;
      link.className = 'hti-book-switcher-link' + (isActive ? ' is-active' : '');
      link.href = basePath + book.slug;
      link.textContent = book.label;
      if (isActive) link.setAttribute('aria-current', 'page');
      mount.appendChild(link);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
}());
