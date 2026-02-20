-- Migration 005: Additional indexes for credit system performance (Story 1.9)
-- Supports: stale reservation cleanup, type+status queries

-- ============================================================================
-- Index for stale reservation cleanup query
-- Used by: expireStaleReservations() — finds pending reserves older than N minutes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_credit_transactions_stale_reservations
  ON public.credit_transactions(type, status, created_at)
  WHERE type = 'reserve' AND status = 'pending';

-- ============================================================================
-- Index for reference_id lookups (e.g., find all transactions for a consultancy)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference_id
  ON public.credit_transactions(reference_id)
  WHERE reference_id IS NOT NULL;
