import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { WaffoPancake, verifyWebhook } from '@waffo/pancake-ts';
import { createPaymentHandler, MERCHANT_ID, STORE_ID, APP_ORIGIN, type PaymentEnv } from '../src/payments.ts';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});
const env: PaymentEnv = {
  WAFFO_PRIVATE_KEY: privateKey,
  WAFFO_PRODUCT_5: 'PROD_aaaaaaaaaaaaaaaaaaaaaa',
  WAFFO_PRODUCT_15: 'PROD_bbbbbbbbbbbbbbbbbbbbbb',
};
const product = (id: string, amount: string) => ({
  id, status: 'active', hasProdVersion: true,
  prices: [{ currency: 'USD', priceInfo: { amount, taxCategory: 'software' } }],
});
function fixture(options: { wrongPrice?: boolean; upstreamFailure?: boolean; checkoutUrl?: string } = {}) {
  const calls: Array<{ url: string; body: Record<string, any>; headers: Headers }> = [];
  const client = new WaffoPancake({ merchantId: MERCHANT_ID, privateKey, environment: 'prod', fetch: async (input, init) => {
    const url = String(input); const body = JSON.parse(String(init?.body));
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('x-merchant-id'), MERCHANT_ID);
    assert.ok(headers.get('x-signature'), 'Real SDK must sign every request');
    calls.push({ url, body, headers });
    if (options.upstreamFailure) return Response.json({ errors: [{ message: 'sensitive upstream detail', layer: 'test' }] }, { status: 500 });
    if (url.endsWith('/v1/graphql')) {
      assert.equal(body.variables.storeId, STORE_ID);
      return Response.json({ data: { onetimeProducts: [
        product(env.WAFFO_PRODUCT_5!, options.wrongPrice ? '50.00' : '5.00'),
        product(env.WAFFO_PRODUCT_15!, '15.00'),
      ] } });
    }
    return Response.json({ data: {
      sessionId: 'cs_test', checkoutUrl: options.checkoutUrl ?? 'https://pancake.waffo.ai/checkout/cs_test#token=test', expiresAt: '2030-01-01',
    } });
  } });
  return { calls, handler: createPaymentHandler({ client: () => client }) };
}
const request = (body: unknown = { tier: '5', accepted: 'yes', attempt: '12345678-1234-1234-1234-123456789012' }, origin = APP_ORIGIN) => new Request(`${APP_ORIGIN}/api/checkout`, {
  method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body),
});

test('missing secrets disable checkout without contacting Waffo', async () => {
  const { handler, calls } = fixture();
  const status = await handler(new Request(`${APP_ORIGIN}/api/payments/status`), {});
  assert.deepEqual(await status.json(), { available: false });
  assert.equal((await handler(request(), {})).status, 503);
  assert.equal(calls.length, 0);
});

test('fixed tiers use configured production products and SDK signing, never browser prices', async () => {
  const { handler, calls } = fixture();
  for (const tier of ['5', '15']) {
    const response = await handler(request({ tier, accepted: 'yes', amount: '0.01', productId: 'attacker-product' }), env);
    assert.equal(response.status, 200);
    const session = calls.at(-1)!;
    assert.equal(session.body.productId, tier === '5' ? env.WAFFO_PRODUCT_5 : env.WAFFO_PRODUCT_15);
    assert.equal(session.body.currency, 'USD');
    assert.equal(session.body.successUrl, `${APP_ORIGIN}/thanks`);
    assert.equal(session.body.priceSnapshot, undefined);
    assert.ok(session.headers.get('x-idempotency-key'));
    assert.equal((await response.json() as any).checkoutUrl.startsWith('https://pancake.waffo.ai/'), true);
  }
});

test('untrusted origins, unapproved tiers and missing consent cannot create sessions', async () => {
  const { handler, calls } = fixture();
  assert.equal((await handler(request(undefined, 'https://attacker.example'), env)).status, 403);
  for (const body of [{ tier: '1', accepted: 'yes' }, { tier: '5' }, { tier: 5, accepted: 'yes' }, null]) {
    assert.equal((await handler(request(body), env)).status, 400);
  }
  assert.equal(calls.length, 0);
});

test('checkout uses the selected language and preserves it on the return page', async () => {
  for (const [locale, cashierLanguage] of [['en', 'en'], ['zh-CN', 'zh-Hans'], ['en-US', 'en']]) {
    const { handler, calls } = fixture();
    const checkoutRequest = request();
    checkoutRequest.headers.set('Accept-Language', locale);
    assert.equal((await handler(checkoutRequest, env)).status, 200);
    const session = calls.at(-1)!;
    assert.equal(session.body.language, cashierLanguage);
    assert.equal(session.body.successUrl, `${APP_ORIGIN}/thanks?lang=${cashierLanguage === 'en' ? 'en' : 'zh-CN'}`);
    assert.equal(session.body.currency, 'USD');
  }
});

test('checkout errors expose stable codes for frontend translation', async () => {
  const { handler } = fixture();
  const unavailable = await handler(request(), {});
  assert.equal((await unavailable.json() as any).code, 'payments.notConfigured');
  const invalidConsent = await handler(request({ tier: '5' }), env);
  assert.equal((await invalidConsent.json() as any).code, 'payments.invalidConsent');
});

test('changed product price fails closed before a checkout is created', async () => {
  const { handler, calls } = fixture({ wrongPrice: true });
  assert.equal((await handler(request(), env)).status, 502);
  assert.equal(calls.length, 1);
});

test('untrusted checkout redirect and upstream errors never leak details', async () => {
  for (const options of [{ checkoutUrl: 'https://attacker.example' }, { upstreamFailure: true }]) {
    const { handler } = fixture(options);
    const response = await handler(request(), env);
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /sensitive upstream|PRIVATE KEY/);
  }
});

test('native form receives a same-tab 303 to Waffo', async () => {
  const { handler } = fixture();
  const response = await handler(new Request(`${APP_ORIGIN}/api/checkout`, {
    method: 'POST', headers: { Origin: APP_ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'tier=15&accepted=yes',
  }), env);
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), 'https://pancake.waffo.ai/checkout/cs_test#token=test');
});

function webhookRequest(event: Record<string, unknown>, timestamp = Date.now(), tamper = false) {
  // Signed fixtures exercise SDK verification; production uses embedded Waffo keys.
  const body = JSON.stringify(event, null, 2);
  const signer = createSign('RSA-SHA256'); signer.update(`${timestamp}.${body}`);
  const signature = signer.sign(privateKey, 'base64');
  return new Request(`${APP_ORIGIN}/api/waffo/webhook`, {
    method: 'POST', headers: { 'x-waffo-signature': `t=${timestamp},v1=${signature}` }, body: tamper ? body + ' ' : body,
  });
}
const validEvent = { id: 'delivery-1', eventType: 'order.completed', eventId: 'order-1', storeId: STORE_ID, mode: 'prod', data: {} };
const webhookHandler = createPaymentHandler({ verify: (raw, sig, opts) => verifyWebhook(raw, sig, { ...opts, publicKey }) });

test('raw signed production webhook is acknowledged; duplicates have no side effects', async () => {
  for (let n = 0; n < 2; n++) assert.equal((await webhookHandler(webhookRequest(validEvent), env)).status, 200);
});

test('invalid, tampered, expired, future, test-mode and foreign-store webhooks are rejected', async () => {
  assert.equal((await webhookHandler(webhookRequest(validEvent, Date.now(), true), env)).status, 401);
  assert.equal((await webhookHandler(webhookRequest(validEvent, Date.now() - 3600000), env)).status, 401);
  assert.equal((await webhookHandler(webhookRequest(validEvent, Date.now() + 120000), env)).status, 401);
  assert.equal((await webhookHandler(webhookRequest({ ...validEvent, mode: 'test' }), env)).status, 400);
  assert.equal((await webhookHandler(webhookRequest({ ...validEvent, storeId: 'other' }), env)).status, 400);
  assert.equal((await createPaymentHandler()(webhookRequest(validEvent), env)).status, 401, 'Production must not trust a fixture key');
});
