/* Shared i18n for static pages. Catalogs load before this deferred script. */
(function () {
  'use strict';
  const fallback = 'zh-CN';
  const storageKey = 'wupage.locale';
  const messages = window.WUPAGE_MESSAGES;
  const parameters = new WeakMap();
  const attributes = ['aria-label', 'alt', 'title', 'placeholder', 'content'];
  let locale = fallback;

  function normalize(value) {
    if (typeof value !== 'string') return null;
    const language = value.toLowerCase().replace(/_/g, '-');
    if (/^en(?:-|$)/.test(language)) return 'en';
    if (/^zh(?:-|$)/.test(language)) return 'zh-CN';
    return null;
  }

  function initialLocale() {
    const requested = normalize(new URL(window.location.href).searchParams.get('lang'));
    if (requested) return requested;
    try {
      const saved = normalize(window.localStorage.getItem(storageKey));
      if (saved) return saved;
    } catch { /* Local storage may be disabled. URL links still retain the language. */ }
    for (const language of navigator.languages || [navigator.language]) {
      const supported = normalize(language);
      if (supported) return supported;
    }
    return fallback;
  }

  function t(key, params = {}) {
    const catalog = messages[locale];
    const value = Object.hasOwn(catalog, key) ? catalog[key]
      : Object.hasOwn(messages[fallback], key) ? messages[fallback][key] : key;
    return (value ?? key).replace(/\{(\w+)\}/g, (match, name) =>
      Object.hasOwn(params, name) ? String(params[name]) : match);
  }

  function text(element, key, params = {}) {
    element.dataset.i18n = key;
    parameters.set(element, params);
    element.textContent = t(key, params);
  }

  function localizedUrl(href) {
    const url = new URL(href, window.location.href);
    // Keep hash-only links intact for the guide, scroll-spy and tab controls.
    if (href.startsWith('#') || url.origin !== window.location.origin ||
        !/^\/(?:index|guide|api|privacy|terms|thanks)?(?:\.html)?\/?$/.test(url.pathname)) return href;
    url.searchParams.set('lang', locale);
    return url.pathname + url.search + url.hash;
  }

  function render() {
    document.documentElement.lang = locale;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.dataset.i18n, parameters.get(element));
    });
    for (const attribute of attributes) {
      document.querySelectorAll('[data-i18n-' + attribute + ']').forEach(element => {
        element.setAttribute(attribute, t(element.getAttribute('data-i18n-' + attribute)));
      });
    }
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = locale === 'en' ? 'en_US' : 'zh_CN';
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      const translated = localizedUrl(href);
      if (translated !== href) link.setAttribute('href', translated);
    });
    document.querySelectorAll('.language-select').forEach(select => { select.value = locale; });
  }

  function setLocale(value, persist = true) {
    const supported = normalize(value);
    if (!supported) return;
    locale = supported;
    if (persist) {
      try { window.localStorage.setItem(storageKey, locale); } catch { /* Optional preference storage. */ }
    }
    // Preserve query parameters, the current guide step and fragment links.
    const url = new URL(window.location.href);
    url.searchParams.set('lang', locale);
    try { window.history.replaceState(window.history.state, '', url.href); } catch { /* file:// preview */ }
    render();
    document.dispatchEvent(new CustomEvent('localechange', { detail: { locale } }));
  }

  window.WuPageI18n = { t, text, setLocale, localizedUrl, get locale() { return locale; } };
  const requested = normalize(new URL(window.location.href).searchParams.get('lang'));
  setLocale(initialLocale(), Boolean(requested));
  document.querySelectorAll('.language-select').forEach(select => {
    select.hidden = false;
    select.addEventListener('change', () => setLocale(select.value));
  });
  window.addEventListener('popstate', () => setLocale(initialLocale(), false));
})();
