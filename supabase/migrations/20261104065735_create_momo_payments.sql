/*
# Create MTN MoMo manual payments

Lets customers pay by MTN Mobile Money and submit their transaction ID for review.

1. New Table
- `momo_payments`: one row per submitted MoMo payment.
  - `product` (print_1, print_10, print_50, display_hour, daily, weekly, monthly or yearly)
  - `quantity` (how many of the product; subscriptions are always 1)
  - `amount_ugx` (amount the customer was asked to pay)
  - `transaction_id` (the MoMo transaction reference, unique so it cannot be reused)
  - `status` (pending, confirmed or rejected)

2. Functions
- `confirm_momo_payment(payment_id)`: applies the purchase (credits, display time or plan) and marks the payment confirmed. Callable only by the server role, run from the database dashboard after checking the MoMo transaction.

3. Security
- Row level security is enabled.
- Signed-in users can create a pending payment for themselves and read their own payments. They cannot change status or review fields.

4. Important notes
- Every statement is safe to run again.
*/

CREATE TABLE IF NOT EXISTS momo_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product text NOT NULL CHECK (product IN ('print_1', 'print_10', 'print_50', 'display_hour', 'daily', 'weekly', 'monthly', 'yearly')),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 20),
  amount_ugx integer NOT NULL CHECK (amount_ugx > 0),
  transaction_id text NOT NULL CHECK (char_length(transaction_id) BETWEEN 4 AND 64),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  CONSTRAINT momo_subscription_single CHECK (product NOT IN ('daily', 'weekly', 'monthly', 'yearly') OR quantity = 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS momo_payments_transaction_id_key ON momo_payments (upper(transaction_id));
CREATE INDEX IF NOT EXISTS momo_payments_user_id_idx ON momo_payments (user_id);

ALTER TABLE momo_payments ENABLE ROW LEVEL SECURITY;

GRANT INSERT (user_id, product, quantity, amount_ugx, transaction_id) ON momo_payments TO authenticated;
GRANT SELECT ON momo_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON momo_payments TO service_role;

DROP POLICY IF EXISTS "select_own_momo_payments" ON momo_payments;
CREATE POLICY "select_own_momo_payments" ON momo_payments FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_pending_momo_payment" ON momo_payments;
CREATE POLICY "insert_own_pending_momo_payment" ON momo_payments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE OR REPLACE FUNCTION public.confirm_momo_payment(p_payment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pay public.momo_payments%ROWTYPE;
  v_units integer;
BEGIN
  SELECT * INTO v_pay FROM public.momo_payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  IF v_pay.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment is already %', v_pay.status;
  END IF;

  IF v_pay.product IN ('print_1', 'print_10', 'print_50') THEN
    v_units := (CASE v_pay.product WHEN 'print_1' THEN 1 WHEN 'print_10' THEN 10 ELSE 50 END) * v_pay.quantity;
    PERFORM public.grant_billing_units(v_pay.user_id, 'credits', v_units);
  ELSIF v_pay.product = 'display_hour' THEN
    PERFORM public.grant_billing_units(v_pay.user_id, 'display', v_pay.quantity);
  ELSE
    INSERT INTO public.billing_accounts (user_id) VALUES (v_pay.user_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.billing_accounts
      SET plan = v_pay.product,
          plan_status = 'active',
          plan_period_end = GREATEST(
            COALESCE(CASE WHEN plan_status = 'active' THEN plan_period_end END, now()),
            now()
          ) + CASE v_pay.product
            WHEN 'daily' THEN interval '1 day'
            WHEN 'weekly' THEN interval '7 days'
            WHEN 'monthly' THEN interval '1 month'
            ELSE interval '1 year'
          END,
          updated_at = now()
      WHERE user_id = v_pay.user_id;
  END IF;

  UPDATE public.momo_payments SET status = 'confirmed', reviewed_at = now() WHERE id = p_payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_momo_payment(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_momo_payment(uuid) TO service_role;
