/* One-time voluntary tips. The SDK and private key remain in the Worker. */
(function () {
  'use strict';
  const form = document.getElementById('tipForm');
  const status = document.getElementById('tipStatus');
  if (!form || !status) return;
  const i18n = window.WuPageI18n;
  const buttons = Array.from(form.querySelectorAll('button[type="submit"]'));
  let available = false;
  let submitting = false;
  let attempt = crypto.randomUUID();
  fetch('/api/payments/status', { cache: 'no-store', headers: { Accept: 'application/json' } })
    .then(function (response) { if (!response.ok) throw new Error(); return response.json(); })
    .then(function (data) {
      available = data.available === true;
      buttons.forEach(function (button) { button.disabled = !available; });
      i18n.text(status, available ? 'payments.ready' : 'payments.unavailable');
    })
    .catch(function () { i18n.text(status, 'payments.connectionError'); });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!available || submitting || !event.submitter) return;
    if (!form.reportValidity()) return;
    submitting = true;
    buttons.forEach(function (button) { button.disabled = true; });
    i18n.text(status, 'payments.opening');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Accept-Language': i18n.locale },
        body: JSON.stringify({ tier: event.submitter.value, accepted: 'yes', attempt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.code || 'payments.checkoutError');
      const url = new URL(data.checkoutUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'pancake.waffo.ai' || url.username || url.password) throw new Error('payments.invalidUrl');
      // Same-tab navigation avoids popup blockers after an async request.
      window.location.assign(url.href);
    } catch (error) {
      const key = /^payments\./.test(error.message) && i18n.t(error.message) !== error.message
        ? error.message : 'payments.checkoutError';
      i18n.text(status, key);
      submitting = false;
      buttons.forEach(function (button) { button.disabled = false; });
    }
  });
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    submitting = false;
    attempt = crypto.randomUUID();
    buttons.forEach(function (button) { button.disabled = !available; });
    i18n.text(status, 'payments.returned');
  });
})();
