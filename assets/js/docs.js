/* ============================================================
   WuPage Translator — docs.js
   Docs page (api.html) sidebar interaction:
   - Click nav link -> smooth scroll to section (reduced-motion aware)
   - IntersectionObserver scroll-spy -> sync .is-active on nav links
   - URL hash sync (initial state + history update on click)
   Vanilla ES6+, no dependencies. Mirrors main.js style.
   ============================================================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var links = document.querySelectorAll('.docs-nav-link');
    var articles = document.querySelectorAll('.docs-article');
    if (!links.length || !articles.length) return;

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var HEADER_OFFSET = 90; // sticky header height + breathing room

    /* ---------- Click -> smooth scroll ---------- */
    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return;
        var id = href.slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
        window.scrollTo({
          top: top,
          behavior: prefersReduced ? 'auto' : 'smooth'
        });
        // Update URL hash without jump
        if (history.replaceState) {
          history.replaceState(null, '', '#' + id);
        }
        // Focus target for a11y without re-triggering scroll
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        // Immediately mark active (observer will confirm on scroll)
        setActive('#' + id);
      });
    });

    /* ---------- Scroll-spy via IntersectionObserver ---------- */
    function setActive(hash) {
      links.forEach(function (l) {
        l.classList.toggle('is-active', l.getAttribute('href') === hash);
      });
    }

    if ('IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (entries) {
        // Find the topmost intersecting entry near the viewport top
        var intersecting = entries.filter(function (en) { return en.isIntersecting; });
        if (!intersecting.length) return;
        // Pick the one with the smallest top (closest to header)
        intersecting.sort(function (a, b) {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });
        var id = intersecting[0].target.id;
        setActive('#' + id);
      }, {
        // Trigger when article top is ~100px below header,
        // and stop once it scrolls past 60% of viewport.
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0
      });

      articles.forEach(function (a) { spy.observe(a); });
    }

    /* ---------- Initial active state from URL hash ---------- */
    if (location.hash) {
      var initialLink = document.querySelector('.docs-nav-link[href="' + location.hash + '"]');
      if (initialLink) {
        links.forEach(function (l) { l.classList.remove('is-active'); });
        initialLink.classList.add('is-active');
      }
    }
  });
})();
