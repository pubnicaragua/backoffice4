/*
  # Fix POS Integration System - Correct Types and Tables
  
  1. Fix UUID array type error
  2. Create all POS tables with correct types
  3. Add sample data with proper UUID casting
  4. Create SII CAF integration tables
*/

-- Create payment providers table
CREATE TABLE IF NOT EXISTS payment_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider_type text NOT NULL,
  api_key_encrypted text,
  webhook_url text,
  is_active boolean DEFAULT true,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create POS terminals table with correct UUID array type
CREATE TABLE IF NOT EXISTS pos_terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  terminal_code text UNIQUE NOT NULL,
  terminal_name text NOT NULL,
  ip_address inet,
  mac_address text,
  status text DEFAULT 'offline',
  last_sync timestamptz,
  payment_providers uuid[] DEFAULT ARRAY[]::uuid[],
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create POS transactions table
CREATE TABLE IF NOT EXISTS pos_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES pos_terminals(id),
  venta_id uuid REFERENCES ventas(id),
  transaction_type text NOT NULL,
  payment_provider_id uuid REFERENCES payment_providers(id),
  external_transaction_id text,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'CLP',
  payment_method text,
  status text DEFAULT 'pending',
  provider_response jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create POS sync log
CREATE TABLE IF NOT EXISTS pos_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES pos_terminals(id),
  sync_type text NOT NULL,
  direction text NOT NULL,
  status text DEFAULT 'pending',
  records_count integer DEFAULT 0,
  error_message text,
  sync_data jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create terminal sessions
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
  status text DEFAULT 'active'
);

-- Create SII CAF tables
CREATE TABLE IF NOT EXISTS caf_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  tipo_documento text NOT NULL,
  rut_empresa text NOT NULL,
  razon_social text NOT NULL,
  folio_desde integer NOT NULL,
  folio_hasta integer NOT NULL,
  fecha_autorizacion date NOT NULL,
  fecha_vencimiento date,
  caf_xml text NOT NULL,
  private_key text NOT NULL,
  public_key text NOT NULL,
  firma_caf text NOT NULL,
  activo boolean DEFAULT true,
  folios_usados integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create electronic folios tracking
CREATE TABLE IF NOT EXISTS folios_electronicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caf_id uuid NOT NULL REFERENCES caf_files(id),
  folio integer NOT NULL,
  tipo_documento text NOT NULL,
  usado boolean DEFAULT false,
  venta_id uuid REFERENCES ventas(id),
  fecha_uso timestamptz,
  terminal_id uuid REFERENCES pos_terminals(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(caf_id, folio)
);

-- Enable RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE caf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios_electronicos ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can read caf_files" ON caf_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage caf_files" ON caf_files FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read folios_electronicos" ON folios_electronicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage folios_electronicos" ON folios_electronicos FOR ALL TO authenticated USING (true);

-- Insert payment providers with correct JSON
INSERT INTO payment_providers (id, name, provider_type, is_active, configuration) VALUES
('11111111-1111-1111-1111-111111111111', 'Mercado Pago', 'mercado_pago', false, '{"sandbox": true, "webhook_events": ["payment.created", "payment.updated"]}'),
('22222222-2222-2222-2222-222222222222', 'SumUp', 'sumup', true, '{"environment": "sandbox", "currency": "CLP"}'),
('33333333-3333-3333-3333-333333333333', 'Transbank', 'transbank', false, '{"environment": "integration", "commerce_code": "597055555532"}'),
('44444444-4444-4444-4444-444444444444', 'GetNet', 'getnet', false, '{"environment": "sandbox", "merchant_id": "test_merchant"}')
ON CONFLICT (id) DO NOTHING;

-- Insert POS terminals with correct UUID array casting
INSERT INTO pos_terminals (id, empresa_id, sucursal_id, terminal_code, terminal_name, status, payment_providers, configuration) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'POS-001', 'Terminal Caja N°1', 'online', 
 ARRAY['22222222-2222-2222-2222-222222222222']::uuid[], '{"auto_sync": true, "sync_interval": 300}'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'POS-002', 'Terminal Caja N°2', 'online',
 ARRAY['22222222-2222-2222-2222-222222222222']::uuid[], '{"auto_sync": true, "sync_interval": 300}'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'POS-003', 'Terminal Sucursal N°2', 'offline',
 ARRAY['22222222-2222-2222-2222-222222222222']::uuid[], '{"auto_sync": true, "sync_interval": 300}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO pos_transactions (id, terminal_id, transaction_type, payment_provider_id, external_transaction_id, amount, payment_method, status, provider_response) VALUES
('tx-111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sale', '22222222-2222-2222-2222-222222222222', 'sumup_tx_12345', 15000.00, 'card', 'approved', '{"card_type": "credit", "last_4": "1234", "authorization_code": "ABC123"}'),
('tx-222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'sale', '22222222-2222-2222-2222-222222222222', 'sumup_tx_12346', 8500.00, 'card', 'approved', '{"card_type": "debit", "last_4": "5678", "authorization_code": "DEF456"}'),
('tx-333333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sale', '22222222-2222-2222-2222-222222222222', 'sumup_tx_12347', 25000.00, 'card', 'approved', '{"card_type": "credit", "last_4": "9012", "authorization_code": "GHI789"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sync logs
INSERT INTO pos_sync_log (id, terminal_id, sync_type, direction, status, records_count, sync_data) VALUES
('sync-11111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'products', 'to_pos', 'success', 5, '{"products_synced": ["PROD001", "PROD002", "PROD003", "PROD004", "PROD005"]}'),
('sync-22222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'transactions', 'from_pos', 'success', 3, '{"transactions_received": 3, "total_amount": 48500}'),
('sync-33333-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'promotions', 'to_pos', 'success', 2, '{"promotions_synced": ["PROMO001", "PROMO002"]}')
ON CONFLICT (id) DO NOTHING;

-- Insert terminal sessions
INSERT INTO terminal_sessions (id, terminal_id, usuario_id, cash_opening, total_sales, total_transactions, status) VALUES
('sess-1111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 50000.00, 48500.00, 3, 'active'),
('sess-2222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 30000.00, 25000.00, 1, 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert CAF file from client (ANROLTEC SPA)
INSERT INTO caf_files (
  id,
  empresa_id,
  tipo_documento,
  rut_empresa,
  razon_social,
  folio_desde,
  folio_hasta,
  fecha_autorizacion,
  fecha_vencimiento,
  caf_xml,
  private_key,
  public_key,
  firma_caf
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  '39',
  '78168951-3',
  'ANROLTEC SPA',
  1,
  50,
  '2025-07-03',
  '2025-12-31',
  '<AUTORIZACION><CAF version="1.0"><DA><RE>78168951-3</RE><RS>ANROLTEC SPA</RS><TD>39</TD><RNG><D>1</D><H>50</H></RNG><FA>2025-07-03</FA><RSAPK><M>sdZydkK2g95uUVgLMkuOTtAiDEx3eA6SSzQQs0TEE54RJjQj4INCbmQWCERb9m+ktT3VLfxHku6UKaSK4Ptdaw==</M><E>Aw==</E></RSAPK><IDK>100</IDK></DA><FRMA algoritmo="SHA1withRSA">G87Ff7HKaQKE8OoY29s5mbdtJoIATS+m7JylATha1xHyWXbYc+dTjHH1YV9Iop3m6EvOJwaQZauh3WgnQVlFow==</FRMA></CAF></AUTORIZACION>',
  '-----BEGIN RSA PRIVATE KEY----- MIIBOQIBAAJBALHWcnZCtoPeblFYCzJLjk7QIgxMd3gOkks0ELNExBOeESY0I+CD Qm5kFghEW/ZvpLU91S38R5LulCmkiuD7XWsCAQMCQHaO9vmBzwKUSYuQB3bdCYng FrLdpPq0YYd4CyIt2A0S7lag+zrkoqMY4YykfOYuEHOcIAZ1Qne8aOzDX07BO+sC IQDjtaQ7Z5FA4Pr691YD14wHPs6YBugPSa1jkaSG3+6qsQIhAMfunm+gmw2Yw8i9 95zFnoTJBQ0dZFSVppM02vUK6tjbAiEAl85tfO+2K0CnUfo5V+UIBNSJuq9FX4Zz l7Ztrz/0ccsCIQCFSb71Fbyzuy0wfqUTLmmt21izaO2NuRm3eJH4sfHl5wIgIVsc 8DXK0j76pEUbnLcUITyFcW3sm1k265Ar8u9usoc= -----END RSA PRIVATE KEY-----',
  '-----BEGIN PUBLIC KEY----- MFowDQYJKoZIhvcNAQEBBQADSQAwRgJBALHWcnZCtoPeblFYCzJLjk7QIgxMd3gO kks0ELNExBOeESY0I+CDQm5kFghEW/ZvpLU91S38R5LulCmkiuD7XWsCAQM= -----END PUBLIC KEY-----',
  'G87Ff7HKaQKE8OoY29s5mbdtJoIATS+m7JylATha1xHyWXbYc+dTjHH1YV9Iop3m6EvOJwaQZauh3WgnQVlFow=='
) ON CONFLICT (id) DO NOTHING;

-- Generate folios for the CAF (1 to 50)
INSERT INTO folios_electronicos (id, caf_id, folio, tipo_documento)
SELECT 
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  generate_series(1, 50),
  '39'
ON CONFLICT (caf_id, folio) DO NOTHING;

-- Add more sample data for better testing
INSERT INTO movimientos_caja (id, empresa_id, usuario_id, tipo, monto, observacion, sucursal_id, fecha) VALUES
('mov-1111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 15000, 'Venta del día', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour'),
('mov-2222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'retiro', 5000, 'Gastos operacionales', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
('mov-3333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'ingreso', 8500, 'Venta tarjeta', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours'),
('mov-4444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'ingreso', 12000, 'Venta efectivo', '00000000-0000-0000-0000-000000000002', NOW() - INTERVAL '4 hours'),
('mov-5555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'retiro', 3000, 'Cambio para caja', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pos_transactions_terminal_id ON pos_transactions(terminal_id);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_status ON pos_transactions(status);
CREATE INDEX IF NOT EXISTS idx_pos_sync_log_terminal_id ON pos_sync_log(terminal_id);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_terminal_id ON terminal_sessions(terminal_id);
CREATE INDEX IF NOT EXISTS idx_caf_files_empresa_id ON caf_files(empresa_id);
CREATE INDEX IF NOT EXISTS idx_folios_electronicos_caf_id ON folios_electronicos(caf_id);
CREATE INDEX IF NOT EXISTS idx_folios_electronicos_usado ON folios_electronicos(usado);

-- Function to get next available folio for POS
CREATE OR REPLACE FUNCTION get_next_folio(p_terminal_id uuid)
RETURNS integer AS $$
DECLARE
  next_folio integer;
  caf_id_var uuid;
BEGIN
  -- Get active CAF
  SELECT id INTO caf_id_var
  FROM caf_files
  WHERE activo = true 
    AND tipo_documento = '39'
    AND folios_usados < (folio_hasta - folio_desde + 1)
  ORDER BY fecha_autorizacion DESC
  LIMIT 1;
  
  IF caf_id_var IS NULL THEN
    RAISE EXCEPTION 'No hay CAF activo disponible';
  END IF;
  
  -- Get next available folio
  SELECT folio INTO next_folio
  FROM folios_electronicos
  WHERE caf_id = caf_id_var 
    AND usado = false
  ORDER BY folio
  LIMIT 1;
  
  -- Mark folio as used
  IF next_folio IS NOT NULL THEN
    UPDATE folios_electronicos
    SET usado = true, 
        fecha_uso = now(),
        terminal_id = p_terminal_id
    WHERE caf_id = caf_id_var AND folio = next_folio;
    
    -- Update CAF usage counter
    UPDATE caf_files
    SET folios_usados = folios_usados + 1
    WHERE id = caf_id_var;
  END IF;
  
  RETURN next_folio;
END;
$$ LANGUAGE plpgsql;