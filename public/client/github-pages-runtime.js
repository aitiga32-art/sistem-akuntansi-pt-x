(function () {
  'use strict';

  const siteBase = '/sistem-akuntansi-pt-x';
  const apiBase = 'https://xrwbkbnacexxzrdcxbev.supabase.co/functions/v1/api';
  const nativeFetch = window.fetch.bind(window);

  function resolvePageUrl(value) {
    const url = String(value || '');
    if (!url || !url.startsWith('/app/client')) return url;
    return siteBase + url;
  }

  function resolveApiUrl(value) {
    const url = new URL(String(value || ''), window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/app/api/')) {
      return null;
    }
    return apiBase + url.pathname + url.search + url.hash;
  }

  window.ptxResolvePageUrl = resolvePageUrl;
  window.ptxSiteBase = siteBase;
  window.ptxApiBase = apiBase;

  window.fetch = function (input, init) {
    const sourceUrl = typeof input === 'string' || input instanceof URL
      ? String(input)
      : input && input.url;
    const apiUrl = resolveApiUrl(sourceUrl);
    if (!apiUrl) return nativeFetch(input, init);

    const options = Object.assign({ credentials: 'omit' }, init || {});
    if (input instanceof Request) {
      return nativeFetch(new Request(apiUrl, input), options);
    }
    return nativeFetch(apiUrl, options);
  };
})();
