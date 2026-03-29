-- Migration 024: Link courses to Stripe products
-- Associates a course with a Stripe product/plan for access control.
-- Relation: one stripe_product can grant access to N courses;
--           each course has at most one associated plan (1:N, FK on courses side).

ALTER TABLE public.courses
  ADD COLUMN stripe_product_id uuid
    REFERENCES public.stripe_products(id)
    ON DELETE SET NULL;

-- Index for fast lookups by plan (e.g. "which courses are included in plan X?")
CREATE INDEX idx_courses_stripe_product_id
  ON public.courses(stripe_product_id);
