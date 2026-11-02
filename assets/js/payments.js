/* One-time voluntary tips. The SDK and private key remain in the Worker. */
(function () {
  'use strict';
  const form = document.getElementById('tipForm');
  const status = document.getElementById('tipStatus');
  if (!form || !status) return;
  const buttons = Array.from(form.querySelectorAll('button[type="submit"]'));
  let available = false;
  let submitting = false;
  let attempt = crypto.randomUUID();
  fetch('/api/payments/status', { cache: 'no-store', headers: { Accept: 'application/json' } })
    .then(function (response) { if (!response.ok) throw new Error(); return response.json(); })
    .then(function (data) {
      available = data.available === true;
      buttons.forEach(function (button) { button.disabled = !available; });
      status.textContent = available
        ? '选择金额后前往 Waffo 安全收银台。付款为一次性支持，不提供额外服务或权益。'
        : '收款配置尚未完成，暂不能在线打赏。免费功能照常使用。';
    })
    .catch(function () { status.textContent = '暂时无法连接收银台，请稍后重试。免费功能照常使用。'; });
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!available || submitting || !event.submitter) return;
    if (!form.reportValidity()) return;
    submitting = true;
    buttons.forEach(function (button) { button.disabled = true; });
    status.textContent = '正在打开 Waffo 收银台…';
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ tier: event.submitter.value, accepted: 'yes', attempt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '暂时无法打开收银台，请稍后再试。');
      const url = new URL(data.checkoutUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'pancake.waffo.ai') throw new Error('收银台地址无效，请联系开发者。');
      // Same-tab navigation avoids popup blockers after an async request.
      window.location.assign(url.href);
    } catch (error) {
      status.textContent = error.message || '连接失败，请重试；如已扣款，请先核对收据。';
      submitting = false;
      buttons.forEach(function (button) { button.disabled = false; });
    }
  });
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    submitting = false;
    attempt = crypto.randomUUID();
    buttons.forEach(function (button) { button.disabled = !available; });
    status.textContent = '如已完成付款，请查收 Waffo 收据；再次点击将发起新的打赏。';
  });
})();
