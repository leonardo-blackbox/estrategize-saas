import { client } from './client.ts';

export interface CheckoutSessionResponse {
  url: string;
}

export function createCheckoutSession(priceId: string) {
  return client
    .post('/api/stripe/checkout-session', { json: { price_id: priceId } })
    .json<CheckoutSessionResponse>();
}
