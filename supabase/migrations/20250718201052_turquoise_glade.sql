/*
  # POS Integration System
  
  1. New Tables
    - `pos_terminals` - POS terminal management
    - `payment_providers` - Payment provider configurations
    - `pos_transactions` - Real-time transaction tracking
    - `pos_sync_log` - Synchronization logs
    - `terminal_sessions` - POS session management
    
  2. Integration Architecture
    - Real-time sync between back office and POS
    - Payment provider webhooks handling
    - Transaction reconciliation
    
  3. Security
    - API keys management
    - Terminal authentication
    - Transaction validation
*/

-- Create payment providers table
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_type text NOT NULL, -- 'mercado_pago', 'sumup', 'transbank', 'getnet'
  api_key_encrypted text,
  webhook_url text,
  is_active boolean DEFAULT true,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create POS terminals table
CREATE TABLE IF NOT EXISTS pos_terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  terminal_code text UNIQUE NOT NULL,
  terminal_name text NOT NULL,
  ip_address inet,
  mac_address text,
  status text DEFAULT 'offline', -- 'online', 'offline', 'maintenance'
  last_sync timestamptz,
  payment_providers uuid[] DEFAULT '{}', -- Array of payment provider IDs
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create POS transactions table for real-time tracking
CREATE TABLE IF NOT EXISTS pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES pos_terminals(id),
  venta_id uuid REFERENCES ventas(id),
  transaction_type text NOT NULL, -- 'sale', 'refund', 'void'
  payment_provider_id uuid REFERENCES payment_providers(id),
  external_transaction_id text, -- ID from payment provider
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'CLP',
  payment_method text, -- 'card', 'cash', 'digital_wallet'
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  provider_response jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create POS sync log for tracking data synchronization
CREATE TABLE IF NOT EXISTS pos_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES pos_terminals(id),
  sync_type text NOT NULL, -- 'products', 'prices', 'promotions', 'transactions'
  direction text NOT NULL, -- 'to_pos', 'from_pos'
  status text DEFAULT 'pending', -- 'pending', 'success', 'failed'
  records_count integer DEFAULT 0,
  error_message text,
  sync_data jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create terminal sessions for user management
CREATE TABLE IF NOT EXISTS terminal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES pos_terminals(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  cash_opening numeric(10,2),
  cash_closing numeric(10,2),
  total_sales numeric(10,2) DEFAULT 0,
  total_transactions integer DEFAULT 0,
  status text DEFAULT 'active' -- 'active', 'closed'
);

-- Enable RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read payment_providers" ON payment_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage payment_providers" ON payment_providers FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read pos_terminals" ON pos_terminals FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage pos_terminals" ON pos_terminals FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read pos_transactions" ON pos_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage pos_transactions" ON pos_transactions FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read pos_sync_log" ON pos_sync_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage pos_sync_log" ON pos_sync_log FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read terminal_sessions" ON terminal_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage terminal_sessions" ON terminal_sessions FOR ALL TO authenticated USING (true);

-- Insert sample payment providers
INSERT INTO payment_providers (id, name, provider_type, is_active, configuration) VALUES
('11111111-1111-1111-1111-111111111111', 'Mercado Pago', 'mercado_pago', false, '{"sandbox": true, "webhook_events": ["payment.created", "payment.updated"]}'),
('22222222-2222-2222-2222-222222222222', 'SumUp', 'sumup', true, '{"environment": "sandbox", "currency": "CLP"}'),
('33333333-3333-3333-3333-333333333333', 'Transbank', 'transbank', false, '{"environment": "integration", "commerce_code": "597055555532"}'),
('44444444-4444-4444-4444-444444444444', 'GetNet', 'getnet', false, '{"environment": "sandbox", "merchant_id": "test_merchant"}}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample POS terminals
INSERT INTO pos_terminals (id, empresa_id, sucursal_id, terminal_code, terminal_name, status, payment_providers, configuration) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'POS-001', 'Terminal Caja N°1', 'online', 
 ARRAY['22222222-2222-2222-2222-222222222222'], '{"auto_sync": true, "sync_interval": 300}'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'POS-002', 'Terminal Caja N°2', 'online',
 ARRAY['22222222-2222-2222-2222-222222222222'], '{"auto_sync": true, "sync_interval": 300}'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'POS-003', 'Terminal Sucursal N°2', 'offline',
 ARRAY['22222222-2222-2222-2222-222222222222'], '{"auto_sync": true, "sync_interval": 300}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO pos_transactions (id, terminal_id, transaction_type, payment_provider_id, external_transaction_id, amount, payment_method, status, provider_response) VALUES
('tx-111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sale', '22222222-2222-2222-2222-222222222222', 'sumup_tx_12345', 15000.00, 'card', 'approved', '{"card_type": "credit", "last_4": "1234", "authorization_code": "ABC123"}'),
('tx-222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sale', '22222222-2222-2222-2222-222222222222', 'sumup_tx_12346', 8500.00, 'card', 'approved', '{"card_type": "debit", "last_4": "5678", "authorization_code": "DEF456"}'),
('tx-333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sale', '22222222-2222-2222-2222-222222222222', 'sumup_tx_12347', 25000.00, 'card', 'approved', '{"card_type": "credit", "last_4": "9012", "authorization_code": "GHI789"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample sync logs
INSERT INTO pos_sync_log (id, terminal_id, sync_type, direction, status, records_count, sync_data) VALUES
('sync-11111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'products', 'to_pos', 'success', 5, '{"products_synced": ["PROD001", "PROD002", "PROD003", "PROD004", "PROD005"]}'),
('sync-22222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'transactions', 'from_pos', 'success', 3, '{"transactions_received": 3, "total_amount": 48500}'),
('sync-33333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'promotions', 'to_pos', 'success', 2, '{"promotions_synced": ["PROMO001", "PROMO002"]}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample terminal sessions
INSERT INTO terminal_sessions (id, terminal_id, usuario_id, cash_opening, total_sales, total_transactions, status) VALUES
('sess-1111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 50000.00, 48500.00, 3, 'active'),
('sess-2222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 30000.00, 25000.00, 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pos_transactions_terminal_id ON pos_transactions(terminal_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_status ON pos_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_created_at ON pos_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_pos_sync_log_terminal_id ON pos_sync_log(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_terminal_id ON terminal_sessions(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_usuario_id ON terminal_sessions(usuario_id);