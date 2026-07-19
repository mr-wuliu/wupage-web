/* ============================================================
   WuPage Translator — release-sync.js
   Auto-sync #install section with latest GitHub release:
   - Fetch api.github.com/repos/mr-wuliu/wupage/releases/latest
   - Update DOM elements tagged with data-release-slot / data-release-href
   - Silent fallback: if fetch fails, hardcoded HTML values stay
   Vanilla ES5+, no dependencies. Mirrors main.js / docs.js style.
   ============================================================ */
(function () {
  'use strict';

  var API = 'https://api.github.com/repos/mr-wuliu/wupage/releases/latest';

  document.addEventListener('DOMContentLoaded', function () {
    var nodes = document.querySelectorAll('[data-release-slot], [data-release-href]');
    if (!nodes.length) return;

    fetch(API).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (release) {
      var version = release.tag_name || '';
      var assets = release.assets || [];
      var zip = null;
      for (var i = 0; i < assets.length; i++) {
        var n = assets[i].name || '';
        if (/\.zip$/i.test(n) && !/\.sha256$/i.test(n)) { zip = assets[i]; break; }
      }
      var zipName = zip ? zip.name : '';
      var zipUrl = zip ? zip.browser_download_url : '';
      var zipSize = zip ? formatSize(zip.size) : '';
      var notesUrl = release.html_url || '';

      nodes.forEach(function (el) {
        var slot = el.getAttribute('data-release-slot');
        if (slot === 'version') el.textContent = version;
        else if (slot === 'zip-name') el.textContent = zipName;
        else if (slot === 'zip-size') el.textContent = zipSize;

        var hrefType = el.getAttribute('data-release-href');
        if (hrefType === 'zip' && zipUrl) el.setAttribute('href', zipUrl);
        else if (hrefType === 'notes' && notesUrl) el.setAttribute('href', notesUrl);
      });
    }).catch(function (err) {
      if (window.console) console.warn('[release-sync]', err.message);
    });
  });

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
})();
