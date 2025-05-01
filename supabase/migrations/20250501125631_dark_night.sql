/*
  # Add Payment History Tracking
  
  1. New Table
    - stripe_payment_history: Stores payment history and status updates
      - Payment details
      - Invoice reference
      - Status tracking
      - Customer information
      
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS stripe_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT,
  payment_id TEXT,
  invoice_id INTEGER,
  amount NUMERIC,
  currency TEXT DEFAULT 'usd',
  status TEXT,
  payment_method_id TEXT,
  payment_method_type TEXT,
  last4 TEXT,
  brand TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  customer_email TEXT,
  customer_name TEXT,
  payment_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_payment_history_customer ON stripe_payment_history(customer_id);
CREATE INDEX idx_payment_history_invoice ON stripe_payment_history(invoice_id);
CREATE INDEX idx_payment_history_status ON stripe_payment_history(status);
CREATE INDEX idx_payment_history_date ON stripe_payment_history(payment_date);

-- Enable RLS
ALTER TABLE stripe_payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All authenticated users can read payment history"
  ON stripe_payment_history
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify payment history"
  ON stripe_payment_history
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  ));

-- Add comments
COMMENT ON TABLE stripe_payment_history IS 'Stores payment history from Stripe';
COMMENT ON COLUMN stripe_payment_history.status IS 'Payment status (succeeded, failed, pending)';
COMMENT ON COLUMN stripe_payment_history.metadata IS 'Additional payment metadata';