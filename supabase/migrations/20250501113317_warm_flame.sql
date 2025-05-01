/*
  # Add customerid to stripe_payment_updates table
  
  1. Changes
    - Add customerid column to stripe_payment_updates table
    - Create index for efficient customer lookups
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add customerid column
ALTER TABLE stripe_payment_updates
ADD COLUMN customerid text;

-- Create index for customerid lookups
CREATE INDEX IF NOT EXISTS idx_stripe_updates_customerid ON stripe_payment_updates(customerid);

-- Add comment explaining the column
COMMENT ON COLUMN stripe_payment_updates.customerid IS 'Stripe customer ID associated with this payment method update';