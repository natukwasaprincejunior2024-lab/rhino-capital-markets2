/*
# Create billing accounts and paid-access functions

Stores each user's plan, print credits and display time, and provides the server-side checks the app uses before letting someone print a report or open the display board. Trial access is calculated from the account's sign-up date.

1. New Tables
- `billing_accounts`: one row per user (created on first use).
  - `user_id` (primary key, linked to the user)
  - `plan` (free, daily, weekly, monthly or yearly)
  - `plan_status` (none, active, past_due or canceled)
  - `plan_period_end` (when the current paid period ends)
  - `stripe_customer_id` (the payment provider's customer reference)
  - `print_credits` (prints bought and not yet used)
  - `free_print_used` (whether the one free print has been used)
  - `display_paid_until` (end of purchased display time)
  - `display_free_started_at` (start of today's free 30-minute display window)
- `stripe_events`: log of payment provider webhook events already processed, so repeated deliveries are ignored.

2. Functions
- `get_billing_status()`: returns the signed-in user's plan, trial end, credits and display times.
- `consume_print_credit()`: lets a print or export through. Paid plans and trials are unlimited, then the first print is free, then one credit is used per print. Returns allowed or not.
- `open_display_session()`: returns unlimited access for paid plans and trials, purchased display time, or the free 30-minute window (once per day), otherwise denied.
- `grant_billing_units(user, kind, units)`: used only by the payment webhook to add print credits or display hours after a successful payment.

3. Security
- Row level security is enabled on both tables.
- Users can read only their own billing account. They cannot change it directly.
- All changes to plans, credits and display time happen through the functions above or the payment webhook, which uses the server role.
- The functions are callable only by signed-in users (or the server role for the grant function).

4. Important notes
- Time windows use the Kampala time zone, so the daily display allowance resets at local midnight.
- Every statement is safe to run again.
*/

CREATE TABLE IF NOT EXISTS billing_accounts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'daily', 'weekly', 'monthly', 'yearly')),
  plan_status text NOT NULL DEFAULT 'none' CHECK (plan_status IN ('none', 'active', 'past_due', 'canceled')),
  plan_period_end timestamptz,
  stripe_customer_id text UNIQUE,
  print_credits integer NOT NULL DEFAULT 0 CHECK (print_credits >= 0),
  free_print_used boolean NOT NULL DEFAULT false,
  display_paid_until timestamptz,
  display_free_started_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON billing_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON billing_accounts TO service_role;

DROP POLICY IF EXISTS "select_own_billing_account" ON billing_accounts;
CREATE POLICY "select_own_billing_account" ON billing_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON stripe_events TO service_role;

CREATE OR REPLACE FUNCTION public.billing_plan_active(p_account public.billing_accounts)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    p_account.plan <> 'free'
    AND p_account.plan_status = 'active'
    AND (p_account.plan_period_end IS NULL OR p_account.plan_period_end > now()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.billing_display_free_until(p_account public.billing_accounts)
RETURNS timestamptz
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_account.display_free_started_at >= (date_trunc('day', now() AT TIME ZONE 'Africa/Kampala') AT TIME ZONE 'Africa/Kampala')
      THEN p_account.display_free_started_at + interval '30 minutes'
  END;
$$;

REVOKE ALL ON FUNCTION public.billing_plan_active(public.billing_accounts) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.billing_display_free_until(public.billing_accounts) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_billing_status()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_signup timestamptz;
  v_acc public.billing_accounts%ROWTYPE;
  v_trial_ends timestamptz;
  v_pro boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '42501';
  END IF;

  SELECT u.created_at INTO v_signup FROM auth.users u WHERE u.id = v_uid;
  SELECT * INTO v_acc FROM public.billing_accounts WHERE user_id = v_uid;

  v_trial_ends := v_signup + interval '7 days';
  v_pro := public.billing_plan_active(v_acc);

  RETURN jsonb_build_object(
    'plan', COALESCE(v_acc.plan, 'free'),
    'isPro', v_pro,
    'isElite', v_pro AND COALESCE(v_acc.plan, 'free') = 'yearly',
    'planPeriodEnd', v_acc.plan_period_end,
    'trialEndsAt', v_trial_ends,
    'isTrialActive', COALESCE(v_trial_ends > now(), false),
    'printCredits', COALESCE(v_acc.print_credits, 0),
    'freePrintAvailable', NOT COALESCE(v_acc.free_print_used, false),
    'displayPaidUntil', v_acc.display_paid_until,
    'displayFreeUntil', public.billing_display_free_until(v_acc)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_print_credit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_signup timestamptz;
  v_acc public.billing_accounts%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.billing_accounts (user_id) VALUES (v_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT u.created_at INTO v_signup FROM auth.users u WHERE u.id = v_uid;
  SELECT * INTO v_acc FROM public.billing_accounts WHERE user_id = v_uid FOR UPDATE;

  IF COALESCE(v_signup + interval '7 days' > now(), false) OR public.billing_plan_active(v_acc) THEN
    RETURN jsonb_build_object('allowed', true, 'source', 'plan');
  END IF;

  IF NOT v_acc.free_print_used THEN
    UPDATE public.billing_accounts SET free_print_used = true, updated_at = now() WHERE user_id = v_uid;
    RETURN jsonb_build_object('allowed', true, 'source', 'free');
  END IF;

  IF v_acc.print_credits > 0 THEN
    UPDATE public.billing_accounts SET print_credits = print_credits - 1, updated_at = now() WHERE user_id = v_uid;
    RETURN jsonb_build_object('allowed', true, 'source', 'credit', 'remaining', v_acc.print_credits - 1);
  END IF;

  RETURN jsonb_build_object('allowed', false, 'source', 'none', 'remaining', 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.open_display_session()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_signup timestamptz;
  v_acc public.billing_accounts%ROWTYPE;
  v_day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'Africa/Kampala') AT TIME ZONE 'Africa/Kampala';
  v_started timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.billing_accounts (user_id) VALUES (v_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT u.created_at INTO v_signup FROM auth.users u WHERE u.id = v_uid;
  SELECT * INTO v_acc FROM public.billing_accounts WHERE user_id = v_uid FOR UPDATE;

  IF COALESCE(v_signup + interval '7 days' > now(), false) OR public.billing_plan_active(v_acc) THEN
    RETURN jsonb_build_object('access', 'unlimited', 'expiresAt', NULL);
  END IF;

  IF COALESCE(v_acc.display_paid_until > now(), false) THEN
    RETURN jsonb_build_object('access', 'paid', 'expiresAt', v_acc.display_paid_until);
  END IF;

  v_started := v_acc.display_free_started_at;
  IF v_started IS NULL OR v_started < v_day_start THEN
    v_started := now();
    UPDATE public.billing_accounts SET display_free_started_at = v_started, updated_at = now() WHERE user_id = v_uid;
  END IF;

  IF now() < v_started + interval '30 minutes' THEN
    RETURN jsonb_build_object('access', 'free', 'expiresAt', v_started + interval '30 minutes');
  END IF;

  RETURN jsonb_build_object('access', 'denied', 'expiresAt', NULL);
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_billing_units(p_user uuid, p_kind text, p_units integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_units IS NULL OR p_units <= 0 OR p_units > 1000 THEN
    RAISE EXCEPTION 'Invalid unit count';
  END IF;

  INSERT INTO public.billing_accounts (user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;

  IF p_kind = 'credits' THEN
    UPDATE public.billing_accounts SET print_credits = print_credits + p_units, updated_at = now() WHERE user_id = p_user;
  ELSIF p_kind = 'display' THEN
    UPDATE public.billing_accounts
      SET display_paid_until = GREATEST(COALESCE(display_paid_until, now()), now()) + make_interval(hours => p_units),
          updated_at = now()
      WHERE user_id = p_user;
  ELSE
    RAISE EXCEPTION 'Unknown grant kind';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_billing_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_print_credit() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.open_display_session() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.grant_billing_units(uuid, text, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_billing_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_print_credit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.open_display_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_billing_units(uuid, text, integer) TO service_role;
