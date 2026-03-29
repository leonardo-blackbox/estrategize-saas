import Stripe from 'stripe';
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

// ============================================================================
// Stripe client
// ============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-01-28.clover',
});

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Helpers
// ============================================================================

function ensureAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Database service unavailable');
  }
  return supabaseAdmin;
}

// ============================================================================
// List
// ============================================================================

export async function listProducts(): Promise<StripeProduct[]> {
  const db = ensureAdmin();

  const { data, error } = await db
    .from('stripe_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list products: ${error.message}`);
  }

  return data as StripeProduct[];
}

// ============================================================================
// Create
// ============================================================================

export async function createProduct(input: CreateProductInput): Promise<StripeProduct> {
  const db = ensureAdmin();

  // Create product in Stripe
  const stripeProduct = await stripe.products.create({
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
  });

  // Create price in Stripe
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    unit_amount: input.price_cents,
    currency: 'brl',
    ...(input.billing_interval !== 'one_time'
      ? { recurring: { interval: input.billing_interval } }
      : {}),
  });

  // Persist to DB
  const { data, error } = await db
    .from('stripe_products')
    .insert({
      name: input.name,
      description: input.description ?? null,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
      price_cents: input.price_cents,
      credits: input.credits,
      billing_interval: input.billing_interval,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save product to database: ${error.message}`);
  }

  return data as StripeProduct;
}

// ============================================================================
// Update
// ============================================================================

export async function updateProduct(id: string, input: UpdateProductInput): Promise<StripeProduct> {
  const db = ensureAdmin();

  // Fetch current row to get stripe_product_id if name is changing
  if (input.name !== undefined) {
    const { data: existing, error: fetchError } = await db
      .from('stripe_products')
      .select('stripe_product_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      throw new Error(`Product not found: ${id}`);
    }

    if (existing.stripe_product_id) {
      await stripe.products.update(existing.stripe_product_id, { name: input.name });
    }
  }

  const { data, error } = await db
    .from('stripe_products')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data as StripeProduct;
}

// ============================================================================
// Archive
// ============================================================================

export async function archiveProduct(id: string): Promise<StripeProduct> {
  const db = ensureAdmin();

  const { data: existing, error: fetchError } = await db
    .from('stripe_products')
    .select('stripe_product_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    throw new Error(`Product not found: ${id}`);
  }

  if (existing.stripe_product_id) {
    await stripe.products.update(existing.stripe_product_id, { active: false });
  }

  const { data, error } = await db
    .from('stripe_products')
    .update({ status: 'archived' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to archive product: ${error.message}`);
  }

  return data as StripeProduct;
}
