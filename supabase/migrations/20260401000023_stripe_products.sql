-- Migration 023: stripe_products table
-- Stores Stripe product/price metadata mirrored from Stripe API for admin plan management

CREATE TABLE IF NOT EXISTS public.stripe_products (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text        NOT NULL,
  description      text,
  stripe_product_id text       UNIQUE,
  stripe_price_id  text        UNIQUE,
  price_cents      integer     NOT NULL CHECK (price_cents >= 0),
  credits          integer     NOT NULL DEFAULT 0 CHECK (credits >= 0),
  billing_interval text        NOT NULL CHECK (billing_interval IN ('month', 'year', 'one_time')),
  status           text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Index for filtering by status (most common admin query)
CREATE INDEX IF NOT EXISTS idx_stripe_products_status ON public.stripe_products (status);

-- Enable RLS — all access goes through backend admin routes using service_role key
ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;

-- No user-level policies needed: service_role bypasses RLS by default.
-- Anon and authenticated users have no direct access.
REVOKE ALL ON public.stripe_products FROM anon, authenticated;

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.update_stripe_products_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stripe_products_updated_at
  BEFORE UPDATE ON public.stripe_products
  FOR EACH ROW EXECUTE FUNCTION public.update_stripe_products_updated_at();
