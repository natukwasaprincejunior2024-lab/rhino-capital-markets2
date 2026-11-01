/*
# Create bureau rates and transactions

Adds the two tables the forex bureau needs: one holding each user's buying and selling rate per currency, and one holding every currency exchange recorded by the bureau.

1. New Tables
- `bureau_rates`: one row per user per currency pair, with the buying and selling rate. Rates are saved by the user from the bureau rates editor.
- `bureau_transactions`: one row per recorded exchange, with currency, direction (buy or sell), amount in USD, rate, total in local currency, customer name and timestamp.

2. Security
- Row level security is enabled on both tables.
- Each user can only read and write rows they own (`user_id` defaults to the signed-in user).
- Rates can be created, updated and deleted by their owner.
- Transactions can be read and added by their owner only. They cannot be edited or deleted, so the bureau's record stays intact.
- Access is granted to the `authenticated` role only.

3. Important notes
- Numeric columns use fixed decimal precision so money values are never rounded by floating point errors.
- Check constraints reject zero or negative rates and amounts, and unknown transaction directions.
- An index on (user_id, created_at) keeps the transaction history fast as it grows.
*/

CREATE TABLE IF NOT EXISTS bureau_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  buying numeric(18,6) NOT NULL CHECK (buying > 0),
  selling numeric(18,6) NOT NULL CHECK (selling > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, symbol)
);

CREATE TABLE IF NOT EXISTS bureau_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  amount numeric(18,2) NOT NULL CHECK (amount > 0),
  rate numeric(18,6) NOT NULL CHECK (rate > 0),
  total numeric(18,2) NOT NULL CHECK (total >= 0),
  customer text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bureau_transactions_user_created_idx
  ON bureau_transactions (user_id, created_at DESC);

ALTER TABLE bureau_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bureau_transactions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON bureau_rates TO authenticated;
GRANT SELECT, INSERT ON bureau_transactions TO authenticated;

DROP POLICY IF EXISTS "select_own_bureau_rates" ON bureau_rates;
CREATE POLICY "select_own_bureau_rates" ON bureau_rates FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bureau_rates" ON bureau_rates;
CREATE POLICY "insert_own_bureau_rates" ON bureau_rates FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bureau_rates" ON bureau_rates;
CREATE POLICY "update_own_bureau_rates" ON bureau_rates FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_bureau_rates" ON bureau_rates;
CREATE POLICY "delete_own_bureau_rates" ON bureau_rates FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "select_own_bureau_transactions" ON bureau_transactions;
CREATE POLICY "select_own_bureau_transactions" ON bureau_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bureau_transactions" ON bureau_transactions;
CREATE POLICY "insert_own_bureau_transactions" ON bureau_transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
