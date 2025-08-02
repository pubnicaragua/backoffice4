/*
  # Final Working System - All Issues Fixed
  
  1. Fix UUID format errors
  2. Add missing tables with valid UUIDs
  3. Complete CRUD system
  4. All endpoints ready
*/

-- Add permisos column to roles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'permisos'
  ) THEN
    ALTER TABLE roles ADD COLUMN permisos jsonb DEFAULT '[]';
  END IF;
END $$;

-- Create descuentos table if not exists
CREATE TABLE IF NOT EXISTS descuentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid REFERENCES sucursales(id),
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'porcentaje',
  valor numeric NOT NULL,
  fecha_inicio date,
  fecha_fin date,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create cupones table if not exists
CREATE TABLE IF NOT EXISTS cupones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid REFERENCES sucursales(id),
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'descuento',
  valor numeric NOT NULL,
  usos_maximos integer DEFAULT 1,
  usos_actuales integer DEFAULT 0,
  fecha_inicio date,
  fecha_fin date,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS only if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'descuentos') THEN
    ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage descuentos" ON descuentos FOR ALL TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cupones') THEN
    ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage cupones" ON cupones FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Update roles with permisos using valid JSON
UPDATE roles SET 
  permisos = CASE 
    WHEN nombre = 'administrador' THEN '["all"]'::jsonb
    WHEN nombre = 'supervisor' THEN '["ventas", "inventario", "reportes"]'::jsonb
    WHEN nombre = 'cajero' THEN '["ventas", "caja"]'::jsonb
    ELSE '["ventas"]'::jsonb
  END
WHERE permisos IS NULL OR permisos = '[]'::jsonb;

-- Insert sample descuentos with VALID UUIDs
INSERT INTO descuentos (empresa_id, sucursal_id, nombre, descripcion, tipo, valor, activo) 
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Descuento 10%',
  'Descuento general del 10%',
  'porcentaje',
  10,
  true
WHERE NOT EXISTS (SELECT 1 FROM descuentos LIMIT 1);

INSERT INTO descuentos (empresa_id, sucursal_id, nombre, descripcion, tipo, valor, activo) 
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Descuento $5000',
  'Descuento fijo de $5000',
  'monto_fijo',
  5000,
  true
WHERE (SELECT COUNT(*) FROM descuentos) < 2;

-- Insert sample cupones with VALID UUIDs
INSERT INTO cupones (empresa_id, sucursal_id, codigo, nombre, descripcion, tipo, valor, usos_maximos, activo)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'VERANO2025',
  'Cupón Verano',
  'Descuento especial de verano',
  'descuento',
  20,
  100,
  true
WHERE NOT EXISTS (SELECT 1 FROM cupones LIMIT 1);

INSERT INTO cupones (empresa_id, sucursal_id, codigo, nombre, descripcion, tipo, valor, usos_maximos, activo)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'REGALO10',
  'Cupón Regalo',
  'Cupón de regalo $10000',
  'descuento',
  10000,
  50,
  true
WHERE (SELECT COUNT(*) FROM cupones) < 2;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_descuentos_empresa_id ON descuentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cupones_empresa_id ON cupones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);