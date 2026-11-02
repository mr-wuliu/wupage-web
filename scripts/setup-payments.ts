/** Run locally with WAFFO_PRIVATE_KEY_FILE pointing outside the repository. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { TaxCategory, WaffoPancake, WaffoPancakeError } from '@waffo/pancake-ts';
import { APP_ORIGIN, MERCHANT_ID, STORE_ID, TIERS, validateProduct, type ProductList } from '../src/payments.ts';

async function main() {
  const privateKey = process.env.WAFFO_PRIVATE_KEY_FILE
    ? readFileSync(process.env.WAFFO_PRIVATE_KEY_FILE, 'utf8')
    : process.env.WAFFO_PRIVATE_KEY;
  if (!privateKey) throw new Error('Set WAFFO_PRIVATE_KEY_FILE to your production RSA private key file.');
  const client = new WaffoPancake({ merchantId: MERCHANT_ID, privateKey, environment: 'prod' });
  const state: Record<string, string> = existsSync('.payment-setup.json')
    ? JSON.parse(readFileSync('.payment-setup.json', 'utf8')) : {};
  const save = () => writeFileSync('.payment-setup.json', JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
  const result = await client.graphql.query<{
    onetimeProducts: Array<ProductList['onetimeProducts'][number] & { name: string }>;
  }>({ query: `query ($storeId: String!) {
    onetimeProducts(storeId: $storeId) {
      id name status hasProdVersion prices { currency priceInfo { amount taxCategory } }
    }
  }`, variables: { storeId: STORE_ID } });
  if (result.errors?.length || !result.data) throw new Error('Cannot read products in the selected production store.');
  for (const tier of ['5', '15'] as const) {
    const name = `WuPage 打赏 US$${tier}`;
    const key = `WAFFO_PRODUCT_${tier}`;
    let id = process.env[key] || state[key];
    if (!id) {
      const matches = result.data.onetimeProducts.filter(product => product.name === name);
      if (matches.length > 1) throw new Error(`Multiple ${name} products exist; set ${key} explicitly.`);
      id = matches[0]?.id;
    }
    if (!id) {
      // The owner identified the product as the WuPage browser extension.
      // Category remains explicit so other uses are not silently misclassified.
      const category = process.env.WAFFO_TAX_CATEGORY;
      if (!Object.values(TaxCategory).includes(category as TaxCategory)) {
        throw new Error('Set WAFFO_TAX_CATEGORY to the category matching the actual product, or provide existing approved Product IDs.');
      }
      const { product } = await client.onetimeProducts.create({
        storeId: STORE_ID, name,
        description: 'WuPage 浏览器插件的一次性支持。当前插件功能免费，付款不附带额外服务、专属功能、翻译额度或积分，不自动续费。',
        prices: { USD: { amount: TIERS[tier], taxCategory: category as TaxCategory } },
        successUrl: `${APP_ORIGIN}/thanks`, metadata: { purpose: 'voluntary_tip', tier },
      }, { idempotencyKey: `wupage-tip-product-${STORE_ID}-${tier}-v1` });
      id = product.id;
      state[key] = id; save();
      // With a production API key, the API creates the live version directly.
      // Publish only an existing test-only version (checked below).
    }
    const current = result.data.onetimeProducts.find(product => product.id === id);
    if (current && !current.hasProdVersion) {
      await client.onetimeProducts.publish({ id }, { idempotencyKey: `wupage-tip-publish-${id}-v1` });
    }
    await validateProduct(client, id, tier);
    state[key] = id; save();
    console.log(`${key}=${id}`);
  }
  // Store no transaction data locally; the verified webhook is a no-op ACK.
  if (!state.webhookId) {
    const { webhook } = await client.webhooks.add({
      storeId: STORE_ID, channel: 'http', url: `${APP_ORIGIN}/api/waffo/webhook`,
      events: ['order.completed', 'refund.succeeded', 'refund.failed'], testMode: false,
    }, { idempotencyKey: `wupage-tip-webhook-${STORE_ID}-v1` });
    state.webhookId = webhook.id; save();
  }
  // Only non-secret product IDs go into the deployment config.
  const configPath = 'wrangler.jsonc';
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  config.vars.WAFFO_PRODUCT_5 = state.WAFFO_PRODUCT_5;
  config.vars.WAFFO_PRODUCT_15 = state.WAFFO_PRODUCT_15;
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log('Production products verified; wrangler.jsonc updated. Upload WAFFO_PRIVATE_KEY as a Worker secret before enabling checkout.');
}
main().catch((error: unknown) => {
  // Avoid dumping SDK errors that might include upstream request details.
  if (error instanceof WaffoPancakeError) console.error(`Waffo request failed (HTTP ${error.status}): ${error.errors.map(item => item.message).join("; ")}`);
  else if (error instanceof Error) console.error(error.message);
  console.error('Payment setup did not complete. Check the production key, approved product IDs/tax category and Waffo dashboard. Existing progress is saved in .payment-setup.json.');
  process.exitCode = 1;
});
