import { client } from './client.ts';

export interface StripeProduct {
  id: string;
  name: string;
  description: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  price_cents: number;
  credits: number;
  billing_interval: 'month' | 'year' | 'one_time';
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price_cents: number;
  credits: number;
  billing_interval: 'month' | 'year' | 'one_time';
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  credits?: number;
  status?: 'active' | 'archived';
}

export function adminListProducts() {
  return client.get('/api/admin/stripe/products').json<{ data: StripeProduct[] }>();
}

export function adminCreateProduct(input: CreateProductInput) {
  return client.post('/api/admin/stripe/products', { json: input }).json<{ data: StripeProduct }>();
}

export function adminUpdateProduct(id: string, input: UpdateProductInput) {
  return client.patch(`/api/admin/stripe/products/${id}`, { json: input }).json<{ data: StripeProduct }>();
}

export function adminArchiveProduct(id: string) {
  return client.delete(`/api/admin/stripe/products/${id}`).json<{ data: StripeProduct }>();
}
