import { createPaymentHandler, type PaymentEnv } from './payments.ts';
interface Env extends PaymentEnv { ASSETS: Fetcher }
const handlePayment = createPaymentHandler();
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname.startsWith('/api/')) return handlePayment(request, env);
    return env.ASSETS.fetch(request);
  },
};
