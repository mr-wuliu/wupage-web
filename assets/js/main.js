/* ============================================================
   WuPage Translator — main.js
   Vanilla JS: nav, smooth scroll, tabs, scroll reveal
   ============================================================ */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');

  function closeMobileNav() {
    if (!navToggle || !mobileNav) return;
    navToggle.classList.remove('is-open');
    mobileNav.classList.remove('is-open');
    mobileNav.hidden = true;
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', '打开菜单');
  }

  function openMobileNav() {
    if (!navToggle || !mobileNav) return;
    navToggle.classList.add('is-open');
    mobileNav.classList.add('is-open');
    mobileNav.hidden = false;
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', '关闭菜单');
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      const isOpen = navToggle.classList.contains('is-open');
      if (isOpen) closeMobileNav();
      else openMobileNav();
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMobileNav);
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!mobileNav.classList.contains('is-open')) return;
      if (mobileNav.contains(e.target) || navToggle.contains(e.target)) return;
      closeMobileNav();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileNav();
    });

    // Reset on resize to desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth > 920) closeMobileNav();
    });
  }

  /* ---------- Sticky header shadow on scroll ---------- */
  const header = document.getElementById('siteHeader');
  let ticking = false;

  function updateHeader() {
    if (!header) return;
    if (window.scrollY > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  }, { passive: true });
  updateHeader();

  /* ---------- Smooth scroll for anchor links ---------- */
  // Native CSS scroll-behavior handles most; add offset handling for keyboard a11y
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
      // Move focus for a11y without re-triggering scroll jump
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    const io = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    });

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Tab group switcher ---------- */
  function bindTabGroup(tabSelector, panelSelector, tabAttr, panelAttr) {
    const tabs = document.querySelectorAll(tabSelector);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const section = tab.closest('.section');
        if (!section) return;
        const key = tab.getAttribute(tabAttr);

        section.querySelectorAll(tabSelector).forEach(function (t) {
          const isActive = t === tab;
          t.classList.toggle('is-active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        section.querySelectorAll(panelSelector).forEach(function (panel) {
          const isActive = panel.getAttribute(panelAttr) === key;
          panel.classList.toggle('is-active', isActive);
          if (isActive) panel.classList.add('is-visible');
        });
      });

      tab.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const section = tab.closest('.section');
        if (!section) return;
        const groupTabs = Array.from(section.querySelectorAll(tabSelector));
        const idx = groupTabs.indexOf(tab);
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % groupTabs.length
          : (idx - 1 + groupTabs.length) % groupTabs.length;
        groupTabs[next].focus();
        groupTabs[next].click();
      });
    });
  }

  bindTabGroup(
    '[data-showcase-tab]', '[data-showcase-panel]',
    'data-showcase-tab', 'data-showcase-panel'
  );
  bindTabGroup(
    '[data-api-tab]', '[data-api-panel]',
    'data-api-tab', 'data-api-panel'
  );

  /* ---------- Set current year (if needed) ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

})();
