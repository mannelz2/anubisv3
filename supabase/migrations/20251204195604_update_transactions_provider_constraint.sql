/*
  # Update Provider Constraint to Allow Test Transactions

  1. Changes Made
    - Update CHECK constraint on `provider` column to include 'test' value
    - Allows test transactions to be created for integration testing
  
  2. Allowed Values
    - 'genesys' - Genesys Finance provider
    - 'mangofy' - Mangofy payment provider  
    - 'aureo' - Aureo payment provider
    - 'test' - Test transactions for validation
  
  3. Notes
    - Test transactions are useful for validating integrations (like Utmify)
    - No RLS changes needed (inherits existing policies)
*/

-- Drop existing constraint
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_provider_check;

-- Add updated constraint with 'test' value
ALTER TABLE transactions ADD CONSTRAINT transactions_provider_check
  CHECK (provider IN ('genesys', 'mangofy', 'aureo', 'test'));
