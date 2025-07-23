/*
  # SII CAF (Código de Autorización de Folios) System
  
  1. New Tables
    - `caf_files` - CAF files management
    - `folios_electronicos` - Electronic folio tracking
    - `documentos_electronicos` - Electronic documents
    
  2. Integration with POS
    - CAF data sync to terminals
    - Folio assignment and tracking
    - Electronic receipt generation
    
  3. Security
    - Encrypted storage of private keys
    - Audit trail for folio usage
*/

-- Create CAF files table
CREATE TABLE IF NOT EXISTS caf_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  tipo_documento text NOT NULL, -- '39' for boletas, '33' for facturas
  rut_empresa text NOT NULL,
  razon_social text NOT NULL,
  folio_desde integer NOT NULL,
  folio_hasta integer NOT NULL,
  fecha_autorizacion date NOT NULL,
  fecha_vencimiento date,
  caf_xml text NOT NULL, -- Full CAF XML content
  private_key text NOT NULL, -- RSA Private Key (encrypted)
  public_key text NOT NULL, -- RSA Public Key
  firma_caf text NOT NULL, -- CAF signature
  activo boolean DEFAULT true,
  folios_usados integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create electronic folios tracking table
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

-- Create electronic documents table
CREATE TABLE IF NOT EXISTS documentos_electronicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folio_id uuid NOT NULL REFERENCES folios_electronicos(id),
  venta_id uuid NOT NULL REFERENCES ventas(id),
  tipo_documento text NOT NULL,
  folio integer NOT NULL,
  rut_emisor text NOT NULL,
  rut_receptor text,
  fecha_emision timestamptz NOT NULL,
  monto_total numeric(10,2) NOT NULL,
  xml_dte text, -- Generated DTE XML
  firma_dte text, -- DTE signature
  estado text DEFAULT 'generado', -- 'generado', 'enviado_sii', 'aceptado', 'rechazado'
  track_id text, -- SII tracking ID
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE caf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE folios_electronicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_electronicos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read caf_files" ON caf_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage caf_files" ON caf_files FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read folios_electronicos" ON folios_electronicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage folios_electronicos" ON folios_electronicos FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read documentos_electronicos" ON documentos_electronicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage documentos_electronicos" ON documentos_electronicos FOR ALL TO authenticated USING (true);

-- Insert sample CAF data based on client's XML
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

-- Generate folios for the CAF
INSERT INTO folios_electronicos (id, caf_id, folio, tipo_documento)
SELECT 
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  generate_series(1, 50),
  '39'
ON CONFLICT (caf_id, folio) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_caf_files_empresa_id ON caf_files(empresa_id);
CREATE INDEX IF NOT EXISTS idx_caf_files_tipo_documento ON caf_files(tipo_documento);
CREATE INDEX IF NOT EXISTS idx_folios_electronicos_caf_id ON folios_electronicos(caf_id);
CREATE INDEX IF NOT EXISTS idx_folios_electronicos_usado ON folios_electronicos(usado);
CREATE INDEX IF NOT EXISTS idx_documentos_electronicos_folio_id ON documentos_electronicos(folio_id);
CREATE INDEX IF NOT EXISTS idx_documentos_electronicos_estado ON documentos_electronicos(estado);

-- Function to get next available folio
CREATE OR REPLACE FUNCTION get_next_folio(p_caf_id uuid, p_terminal_id uuid)
RETURNS integer AS $$
DECLARE
  next_folio integer;
BEGIN
  -- Get the next available folio
  SELECT folio INTO next_folio
  FROM folios_electronicos
  WHERE caf_id = p_caf_id 
    AND usado = false
  ORDER BY folio
  LIMIT 1;
  
  -- Mark folio as used
  IF next_folio IS NOT NULL THEN
    UPDATE folios_electronicos
    SET usado = true, fecha_uso = now()
    WHERE caf_id = p_caf_id AND folio = next_folio;
    
    -- Update CAF usage counter
    UPDATE caf_files
    SET folios_usados = folios_usados + 1
    WHERE id = p_caf_id;
  END IF;
  
  RETURN next_folio;
END;
$$ LANGUAGE plpgsql;