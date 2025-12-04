/*
  # Add Missing Customer and Tracking Columns

  1. New Columns
    - `customer_ip` (text) - Customer IP address for geolocation tracking
    - `sck` (text) - Secondary tracking parameter (commonly used for campaign keys)

  2. Notes
    - All columns are nullable for backward compatibility
    - No RLS changes needed (inherits existing policies)
*/

-- Add customer_ip column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'customer_ip') THEN
    ALTER TABLE transactions ADD COLUMN customer_ip text;
  END IF;
END $$;

-- Add sck column (secondary tracking key)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'sck') THEN
    ALTER TABLE transactions ADD COLUMN sck text;
  END IF;
END $$;

-- Add index for customer_ip for analytics
CREATE INDEX IF NOT EXISTS idx_transactions_customer_ip ON transactions(customer_ip) WHERE customer_ip IS NOT NULL;

-- Add index for sck for tracking queries
CREATE INDEX IF NOT EXISTS idx_transactions_sck ON transactions(sck) WHERE sck IS NOT NULL;
