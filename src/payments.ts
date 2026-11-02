import { WaffoPancake, verifyWebhook } from '@waffo/pancake-ts';

export const MERCHANT_ID = 'MER_3f5KxcLvb6yUVmGyDiPnKj';
export const STORE_ID = 'STO_78VluhDfJ2oEXEhruTYlyD';
export const APP_ORIGIN = 'https://wupage.mrwuliu.top';
export const TIERS = { '5': '5.00', '15': '15.00' } as const;
export type Tier = keyof typeof TIERS;
export interface PaymentEnv {
  WAFFO_PRIVATE_KEY?: string;
  WAFFO_PRODUCT_5?: string;
  WAFFO_PRODUCT_15?: string;
}
export interface ProductList {
  onetimeProducts: Array<{
    id: string;
    status: string;
    hasProdVersion: boolean;
    prices: Array<{ currency: string; priceInfo: { amount: string; taxCategory: string } }>;
  }>;
}
export const PRODUCT_QUERY = `query ($storeId: String!) {
  onetimeProducts(storeId: $storeId) {
    id status hasProdVersion
    prices { currency priceInfo { amount taxCategory } }
  }
}`;

export function makeClient(env: PaymentEnv) {
  return new WaffoPancake({
    merchantId: MERCHANT_ID,
    privateKey: env.WAFFO_PRIVATE_KEY!,
    environment: 'prod',
    fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
  });
}

export function isConfigured(env: PaymentEnv) {
  return Boolean(env.WAFFO_PRIVATE_KEY?.trim()
    && /^PROD_[a-zA-Z0-9]{22}$/.test(env.WAFFO_PRODUCT_5 ?? '')
    && /^PROD_[a-zA-Z0-9]{22}$/.test(env.WAFFO_PRODUCT_15 ?? '')
    && env.WAFFO_PRODUCT_5 !== env.WAFFO_PRODUCT_15);
}

// The store-scoped query prevents accidentally using another store's product,
// a subscription, a test-only product, or a price different from the public page.
export async function validateProduct(client: Pick<WaffoPancake, 'graphql'>, id: string, tier: Tier) {
  const result = await client.graphql.query<ProductList>({
    query: PRODUCT_QUERY, variables: { storeId: STORE_ID },
  });
  const product = result.data?.onetimeProducts.find(product => product.id === id);
  const usd = product?.prices.find(price => price.currency === 'USD');
  if (result.errors?.length || !product || product.status !== 'active'
      || !product.hasProdVersion || !usd || Number(usd.priceInfo.amount) !== Number(TIERS[tier])) {
    throw new Error('Product configuration does not match the public tip tier');
  }
  return product;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  } });
}

type Dependencies = {
  client?: typeof makeClient;
  verify?: typeof verifyWebhook;
  origin?: string;
};

export function createPaymentHandler(dependencies: Dependencies = {}) {
  const clientFactory = dependencies.client ?? makeClient;
  const verify = dependencies.verify ?? verifyWebhook;
  const origin = dependencies.origin ?? APP_ORIGIN;
  return async function handlePayment(request: Request, env: PaymentEnv): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/api/payments/status') {
      if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
      let available = isConfigured(env);
      if (available) { try { clientFactory(env); } catch { available = false; } }
      return json({ available });
    }
    if (path === '/api/waffo/webhook') {
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
      const raw = await request.text();
      if (raw.length > 65536) return json({ error: 'Payload too large' }, 413);
      try {
        const event = verify(raw, request.headers.get('x-waffo-signature'), { environment: 'prod' });
        if (event.storeId !== STORE_ID || event.mode !== 'prod') {
          return json({ error: 'Unexpected store or environment' }, 400);
        }
        // Pure tips grant no service or credits. Acknowledge verified events with
        // no state mutation: retries and duplicate deliveries are idempotent.
        // Waffo remains the transaction/refund system of record; do not log PII.
        return json({ received: true });
      } catch {
        return json({ error: 'Invalid webhook signature' }, 401);
      }
    }
    if (path !== '/api/checkout') return json({ error: 'Not found' }, 404);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
    if (request.headers.get('origin') !== origin) return json({ error: '请求来源无效，请从官网重新发起打赏。' }, 403);
    if (!isConfigured(env)) return json({ error: '收款配置尚未完成，请稍后再试或联系开发者。' }, 503);
    const raw = await request.text();
    if (raw.length > 4096) return json({ error: '请求过大。' }, 413);
    let tier: unknown;
    let accepted: unknown;
    let attempt: unknown;
    try {
      if (request.headers.get('content-type')?.includes('application/json')) {
        ({ tier, accepted, attempt } = JSON.parse(raw));
      } else if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
        const body = new URLSearchParams(raw);
        tier = body.get('tier'); accepted = body.get('accepted'); attempt = body.get('attempt');
      } else return json({ error: '不支持的请求格式。' }, 415);
    } catch { return json({ error: '请求格式无效。' }, 400); }
    if ((tier !== '5' && tier !== '15') || accepted !== 'yes') {
      return json({ error: '请选择 US$5 或 US$15，并确认已阅读打赏说明。' }, 400);
    }
    if (attempt != null && (typeof attempt !== 'string' || !/^[a-zA-Z0-9-]{16,64}$/.test(attempt))) {
      return json({ error: '请求编号无效，请刷新后重试。' }, 400);
    }
    try {
      const client = clientFactory(env);
      const productId = tier === '5' ? env.WAFFO_PRODUCT_5! : env.WAFFO_PRODUCT_15!;
      await validateProduct(client, productId, tier);
      const session = await client.checkout.createSession({
        productId, currency: 'USD', language: 'zh-Hans',
        successUrl: `${origin}/thanks`, expiresInSeconds: 1800,
        metadata: { purpose: 'voluntary_tip', tier, termsVersion: '1.2' },
      }, { idempotencyKey: `wupage-tip-${attempt ?? crypto.randomUUID()}-${tier}` });
      const url = new URL(session.checkoutUrl);
      if (url.protocol !== 'https:' || url.hostname !== 'pancake.waffo.ai' || url.username || url.password) {
        throw new Error('Unexpected checkout host');
      }
      if (request.headers.get('accept')?.includes('application/json')) {
        return json({ checkoutUrl: session.checkoutUrl });
      }
      return new Response(null, { status: 303, headers: { Location: session.checkoutUrl, 'Cache-Control': 'no-store' } });
    } catch {
      // Do not return upstream errors, signed headers or private key details.
      return json({ error: '暂时无法打开收银台，请稍后重试。如已扣款，请先查收 Waffo 收据或联系开发者，避免重复付款。' }, 502);
    }
  };
}
