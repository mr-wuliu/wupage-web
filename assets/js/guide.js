(function () {
  'use strict';
  const steps = Array.from(document.querySelectorAll('[data-guide-step]'));
  const links = Array.from(document.querySelectorAll('[data-guide-go]'));
  const controls = document.querySelector('.guide-controls');
  const prev = document.getElementById('guidePrev');
  const next = document.getElementById('guideNext');
  let current = 0;
  function show(index, focus) {
    current = index;
    steps.forEach((step, i) => { step.hidden = i !== index; });
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
    prev.disabled = index === 0;
    next.textContent = index === steps.length - 1 ? '完成，开始阅读 ↗' : '下一步 →';
    document.getElementById('guideCount').textContent = '第 ' + (index + 1) + ' / ' + steps.length + ' 步';
    if (focus) steps[index].querySelector('h2').focus({ preventScroll: true });
  }
  function fromHash(focus) {
    const match = /^#step-([1-4])$/.exec(location.hash);
    show(match ? Number(match[1]) - 1 : 0, focus);
  }
  links.forEach(link => link.addEventListener('click', function (event) {
    event.preventDefault();
    history.pushState(null, '', this.getAttribute('href'));
    fromHash(true);
  }));
  function move(index) {
    history.pushState(null, '', '#step-' + (index + 1));
    show(index, true);
  }
  prev.addEventListener('click', () => move(Math.max(0, current - 1)));
  next.addEventListener('click', () => {
    if (current === steps.length - 1) location.href = 'index.html#demo';
    else move(current + 1);
  });
  window.addEventListener('popstate', () => fromHash(false));
  window.addEventListener('hashchange', () => fromHash(false));
  controls.hidden = false;
  fromHash(false);
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
    const mode = button.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const sample = document.getElementById('modeSample');
    sample.querySelector('[data-original]').hidden = mode === 'replace';
    sample.classList.toggle('is-color', mode === 'color');
  }));
})();
