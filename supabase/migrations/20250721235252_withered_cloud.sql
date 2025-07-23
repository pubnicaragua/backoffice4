/*
  # Restore All Modules and Fix Roles Table
  
  1. Fix roles table - add permisos column as jsonb
  2. Create missing tables for all modules
  3. Add sample data for complete functionality
*/

-- Fix roles table - add permisos column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'permisos'
  ) THEN
    ALTER TABLE roles ADD COLUMN permisos jsonb DEFAULT '[]';
  END IF;
END $$;

-- Create pedidos table if not exists
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  proveedor_id uuid REFERENCES clientes(id),
  folio text,
  fecha_pedido timestamptz DEFAULT now(),
  total numeric DEFAULT 0,
  estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

-- Create despachos table if not exists
CREATE TABLE IF NOT EXISTS despachos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  entregado_por uuid REFERENCES usuarios(id),
  folio text,
  fecha timestamptz DEFAULT now(),
  rut text,
  direccion text,
  estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage pedidos" ON pedidos FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage despachos" ON despachos FOR ALL TO authenticated USING (true);

-- Update roles with permisos
UPDATE roles SET 
  permisos = CASE 
    WHEN nombre = 'administrador' THEN '["all"]'::jsonb
    WHEN nombre = 'supervisor' THEN '["ventas", "inventario", "reportes"]'::jsonb
    WHEN nombre = 'cajero' THEN '["ventas", "caja"]'::jsonb
    ELSE '["ventas"]'::jsonb
  END
WHERE permisos IS NULL OR permisos = '[]'::jsonb;

-- Insert sample pedidos
INSERT INTO pedidos (id, empresa_id, sucursal_id, proveedor_id, folio, total, estado) VALUES
('pedido-001-001-001-001-001001001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PED-001', 125000, 'recibido'),
('pedido-002-002-002-002-002002002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'PED-002', 85000, 'pendiente'),
('pedido-003-003-003-003-003003003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PED-003', 95000, 'recibido')
ON CONFLICT (id) DO NOTHING;

-- Insert sample despachos
INSERT INTO despachos (id, empresa_id, sucursal_id, entregado_por, folio, rut, direccion, estado) VALUES
('despacho-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'DESP-001', '12345678-9', 'Av. Principal 123', 'entregado'),
('despacho-002-002-002-002-002002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'DESP-002', '23456789-0', 'Calle Secundaria 456', 'pendiente'),
('despacho-003-003-003-003-003003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'DESP-003', '34567890-1', 'Jr. Santiago 193', 'entregado')
ON CONFLICT (id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pedidos_empresa_id ON pedidos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_despachos_empresa_id ON despachos(empresa_id);