/*
  # Add Description Column to Transactions

  1. New Columns
    - `description` (text) - Optional description or note about the transaction

  2. Notes
    - Column is nullable for backward compatibility
    - No RLS changes needed (inherits existing policies)
    - Useful for tracking transaction purpose or additional context
*/

-- Add description column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'description') THEN
    ALTER TABLE transactions ADD COLUMN description text;
  END IF;
END $$;

-- Add index for description searches
CREATE INDEX IF NOT EXISTS idx_transactions_description ON transactions USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;
