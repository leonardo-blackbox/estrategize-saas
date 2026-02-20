-- Migration 004: Credit System enhancements (Story 1.9)
-- Adds: UPDATE RLS policy, atomic balance function, reserve function

-- ============================================================================
-- Step 1: Add UPDATE policy for credit_transactions
-- Needed for status transitions (pending → confirmed | released)
-- ============================================================================
CREATE POLICY "credits_update_own" ON public.credit_transactions
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- Step 2: Add index on status for efficient balance queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_credit_transactions_status
  ON public.credit_transactions(status);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_type
  ON public.credit_transactions(type);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_status
  ON public.credit_transactions(user_id, status);

-- ============================================================================
-- Step 3: Function to calculate available balance atomically
-- Balance = confirmed credits (purchase + monthly_grant + release)
--         - confirmed debits (consume)
--         - pending reserves (reserved but not yet consumed/released)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_credit_balance(p_user_id UUID)
RETURNS TABLE (
  available INTEGER,
  reserved INTEGER,
  total_consumed INTEGER,
  consumed_this_month INTEGER,
  transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month_start TIMESTAMPTZ;
BEGIN
  v_month_start := date_trunc('month', CURRENT_TIMESTAMP);

  RETURN QUERY
  SELECT
    -- Available = total credits - total consumed - currently reserved
    COALESCE(SUM(
      CASE
        WHEN ct.type IN ('purchase', 'monthly_grant') AND ct.status = 'confirmed' THEN ct.amount
        WHEN ct.type = 'release' AND ct.status = 'confirmed' THEN ct.amount
        WHEN ct.type = 'consume' AND ct.status = 'confirmed' THEN -ct.amount
        WHEN ct.type = 'reserve' AND ct.status = 'pending' THEN -ct.amount
        ELSE 0
      END
    ), 0)::INTEGER AS available,

    -- Currently reserved (pending)
    COALESCE(SUM(
      CASE
        WHEN ct.type = 'reserve' AND ct.status = 'pending' THEN ct.amount
        ELSE 0
      END
    ), 0)::INTEGER AS reserved,

    -- Total consumed (all time)
    COALESCE(SUM(
      CASE
        WHEN ct.type = 'consume' AND ct.status = 'confirmed' THEN ct.amount
        ELSE 0
      END
    ), 0)::INTEGER AS total_consumed,

    -- Consumed this month
    COALESCE(SUM(
      CASE
        WHEN ct.type = 'consume' AND ct.status = 'confirmed'
             AND ct.created_at >= v_month_start THEN ct.amount
        ELSE 0
      END
    ), 0)::INTEGER AS consumed_this_month,

    -- Total transaction count
    COUNT(*)::BIGINT AS transaction_count

  FROM public.credit_transactions ct
  WHERE ct.user_id = p_user_id;
END;
$$;

-- ============================================================================
-- Step 4: Atomic reserve function with balance check
-- Returns the reservation row if successful, raises exception if insufficient
-- ============================================================================
CREATE OR REPLACE FUNCTION public.reserve_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_idempotency_key TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available INTEGER;
  v_existing_id UUID;
  v_new_id UUID;
BEGIN
  -- Idempotency check: if key already used, return existing transaction
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM public.credit_transactions
    WHERE idempotency_key = p_idempotency_key
      AND user_id = p_user_id;

    IF FOUND THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  -- Lock user's rows to prevent concurrent balance changes
  PERFORM 1
  FROM public.credit_transactions
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Calculate available balance
  SELECT
    COALESCE(SUM(
      CASE
        WHEN type IN ('purchase', 'monthly_grant') AND status = 'confirmed' THEN amount
        WHEN type = 'release' AND status = 'confirmed' THEN amount
        WHEN type = 'consume' AND status = 'confirmed' THEN -amount
        WHEN type = 'reserve' AND status = 'pending' THEN -amount
        ELSE 0
      END
    ), 0)
  INTO v_available
  FROM public.credit_transactions
  WHERE user_id = p_user_id;

  -- Check sufficient balance
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits: available=%, requested=%', v_available, p_amount
      USING ERRCODE = 'P0001';
  END IF;

  -- Insert reservation
  INSERT INTO public.credit_transactions (
    user_id, amount, type, status, idempotency_key, reference_id, description
  ) VALUES (
    p_user_id, p_amount, 'reserve', 'pending',
    p_idempotency_key, p_reference_id, p_description
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- ============================================================================
-- Step 5: Atomic consume function
-- Transitions a pending reserve → confirmed consume
-- ============================================================================
CREATE OR REPLACE FUNCTION public.consume_credits(
  p_user_id UUID,
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount INTEGER;
  v_status TEXT;
BEGIN
  -- Lock and fetch the reservation
  SELECT amount, status INTO v_amount, v_status
  FROM public.credit_transactions
  WHERE id = p_reservation_id
    AND user_id = p_user_id
    AND type = 'reserve'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found: %', p_reservation_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Prevent double consume
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Reservation already processed (status=%)', v_status
      USING ERRCODE = 'P0003';
  END IF;

  -- Mark original reservation as confirmed
  UPDATE public.credit_transactions
  SET status = 'confirmed'
  WHERE id = p_reservation_id;

  -- Insert consume transaction
  INSERT INTO public.credit_transactions (
    user_id, amount, type, status, reference_id, description
  ) VALUES (
    p_user_id, v_amount, 'consume', 'confirmed',
    p_reservation_id::TEXT, 'Credit consumption'
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- Step 6: Atomic release function
-- Transitions a pending reserve → released (refund)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.release_credits(
  p_user_id UUID,
  p_reservation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount INTEGER;
  v_status TEXT;
BEGIN
  -- Lock and fetch the reservation
  SELECT amount, status INTO v_amount, v_status
  FROM public.credit_transactions
  WHERE id = p_reservation_id
    AND user_id = p_user_id
    AND type = 'reserve'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found: %', p_reservation_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Prevent double release
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Reservation already processed (status=%)', v_status
      USING ERRCODE = 'P0003';
  END IF;

  -- Mark original reservation as released
  UPDATE public.credit_transactions
  SET status = 'released'
  WHERE id = p_reservation_id;

  -- Insert release transaction
  INSERT INTO public.credit_transactions (
    user_id, amount, type, status, reference_id, description
  ) VALUES (
    p_user_id, v_amount, 'release', 'confirmed',
    p_reservation_id::TEXT, 'Credit release (reservation cancelled)'
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- Step 7: Grant a function to seed credits for testing
-- ============================================================================
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT DEFAULT 'purchase',
  p_description TEXT DEFAULT 'Manual credit grant'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_id UUID;
BEGIN
  IF p_type NOT IN ('purchase', 'monthly_grant') THEN
    RAISE EXCEPTION 'Invalid grant type: %', p_type;
  END IF;

  INSERT INTO public.credit_transactions (
    user_id, amount, type, status, description
  ) VALUES (
    p_user_id, p_amount, p_type, 'confirmed', p_description
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
