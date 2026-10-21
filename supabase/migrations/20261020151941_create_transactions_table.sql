/*
# Create transactions table with RLS + updated_at helper

## Purpose
Stores per-user financial transactions (income and expenses) for SpendWise.
Also creates the handle_updated_at() trigger function (reusable across tables).

## New Tables
- `transactions`
  - `id` (uuid, primary key, auto-generated)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users cascade)
  - `type` (text, not null, CHECK: 'income' or 'expense')
  - `amount` (numeric(12,2), not null, CHECK > 0 — always positive)
  - `description` (text, not null)
  - `category` (text, not null)
  - `transaction_date` (date, not null)
  - `payment_method` (text, nullable)
  - `notes` (text, nullable)
  - `created_at` / `updated_at` (timestamptz, auto-managed)

## Security — RLS
4 owner-scoped policies (SELECT/INSERT/UPDATE/DELETE), TO authenticated, auth.uid() = user_id.
user_id has DEFAULT auth.uid() so inserts omitting it still pass WITH CHECK.

## Notes
1. Amounts stored positive; type determines direction.
2. numeric(12,2) for exact decimals.
3. handle_updated_at() is created if not exists — reusable for profiles and future tables.
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category text NOT NULL,
  transaction_date date NOT NULL,
  payment_method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;
CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions (user_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_user_category
  ON transactions (user_id, category);

CREATE INDEX IF NOT EXISTS idx_transactions_user_type
  ON transactions (user_id, type);

-- Reusable updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;
CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();