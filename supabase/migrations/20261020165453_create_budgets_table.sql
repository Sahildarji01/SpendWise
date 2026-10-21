/*
# Create budgets table with RLS policies

## Purpose
Stores per-user monthly spending budgets for SpendWise.
Supports an overall monthly budget (category = NULL) and optional
category-specific budgets (category = 'food', 'transport', etc.).

## New Tables
- `budgets`
  - `id` (uuid, primary key, auto-generated)
  - `user_id` (uuid, not null, defaults to auth.uid(), references auth.users cascade)
  - `month` (date, not null — first day of the budget month, e.g. 2026-10-01)
  - `amount` (numeric(12,2), not null, CHECK > 0 — the budget limit)
  - `category` (text, nullable — NULL = overall budget, non-null = category budget)
  - `created_at` / `updated_at` (timestamptz, auto-managed)

## Constraints
- Unique (user_id, month, category) — prevents duplicate overall budgets
  for the same user+month, and duplicate category budgets for the same
  user+month+category. The partial indexes enforce both cases.

## Security — RLS
4 owner-scoped policies (SELECT/INSERT/UPDATE/DELETE), TO authenticated,
auth.uid() = user_id. user_id has DEFAULT auth.uid() so inserts omitting
it still pass WITH CHECK.

## Notes
1. Amounts stored as numeric(12,2) for exact decimals.
2. month is always the 1st of the month; queries filter by month = 'YYYY-MM-01'.
3. category references existing transaction categories (text match) — no FK
   to avoid coupling budget categories to a hardcoded list.
4. updated_at trigger reused from the transactions migration.
*/

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  month date NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "budgets_select_own" ON budgets;
CREATE POLICY "budgets_select_own"
  ON budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_insert_own" ON budgets;
CREATE POLICY "budgets_insert_own"
  ON budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_update_own" ON budgets;
CREATE POLICY "budgets_update_own"
  ON budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "budgets_delete_own" ON budgets;
CREATE POLICY "budgets_delete_own"
  ON budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Prevent duplicate overall budgets (category IS NULL) per user+month
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_user_month_overall
  ON budgets (user_id, month)
  WHERE category IS NULL;

-- Prevent duplicate category budgets per user+month+category
CREATE UNIQUE INDEX IF NOT EXISTS idx_budgets_user_month_category
  ON budgets (user_id, month, category)
  WHERE category IS NOT NULL;

-- Index for fetching all budgets for a user+month
CREATE INDEX IF NOT EXISTS idx_budgets_user_month
  ON budgets (user_id, month DESC);

-- updated_at trigger
DROP TRIGGER IF EXISTS budgets_updated_at ON budgets;
CREATE TRIGGER budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();