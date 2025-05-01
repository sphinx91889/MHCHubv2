/*
  # Stripe Payment Method Updates Table
  
  1. New Table
    - stripe_payment_updates: Stores Stripe payment method update webhook data
      - All relevant fields for payment method data
      - JSONB fields for complex nested data
      - Timestamps for tracking
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create stripe_payment_updates table
CREATE TABLE IF NOT EXISTS stripe_payment_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  body_data_object TEXT,
  address JSONB,
  email TEXT,
  name TEXT,
  phone TEXT,
  tax_id TEXT,
  brand TEXT,
  checks JSONB,
  country TEXT,
  display_brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  fingerprint TEXT,
  funding TEXT,
  generated_from JSONB,
  last4 TEXT,
  networks JSONB,
  regulated_status TEXT,
  three_d_secure_usage JSONB,
  wallet JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for commonly queried fields
CREATE INDEX idx_stripe_updates_email ON stripe_payment_updates(email);
CREATE INDEX idx_stripe_updates_brand ON stripe_payment_updates(brand);
CREATE INDEX idx_stripe_updates_created ON stripe_payment_updates(created_at);

-- Enable RLS
ALTER TABLE stripe_payment_updates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read payment updates"
  ON stripe_payment_updates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify payment updates"
  ON stripe_payment_updates
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

-- Add comments
COMMENT ON TABLE stripe_payment_updates IS 'Stores Stripe payment method update webhook data';
COMMENT ON COLUMN stripe_payment_updates.body_data_object IS 'Raw webhook payload data';
COMMENT ON COLUMN stripe_payment_updates.address IS 'Customer billing address';
COMMENT ON COLUMN stripe_payment_updates.checks IS 'Payment method verification checks';
COMMENT ON COLUMN stripe_payment_updates.networks IS 'Available payment networks';
COMMENT ON COLUMN stripe_payment_updates.three_d_secure_usage IS '3D Secure capability information';
COMMENT ON COLUMN stripe_payment_updates.wallet IS 'Digital wallet information';