/*
  # Final Clean Fix - Only Add Missing Parts
  
  1. Fix only what's missing without duplicating
  2. Add permisos column to roles if not exists
  3. Clean deployment ready
*/

-- Add permisos column to roles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'roles' AND column_name = 'permisos'
  ) THEN
    ALTER TABLE roles ADD COLUMN permisos jsonb DEFAULT '[]';
  END IF;
END $$;

-- Update roles with permisos only if they are empty
UPDATE roles SET 
  permisos = CASE 
    WHEN nombre = 'administrador' THEN '["all"]'::jsonb
    WHEN nombre = 'supervisor' THEN '["ventas", "inventario", "reportes"]'::jsonb
    WHEN nombre = 'cajero' THEN '["ventas", "caja"]'::jsonb
    ELSE '["ventas"]'::jsonb
  END
WHERE permisos IS NULL OR permisos = '[]'::jsonb;

-- Create descuentos table only if it doesn't exist
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

-- Create cupones table only if it doesn't exist
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'descuentos'
  ) THEN
    ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage descuentos" ON descuentos FOR ALL TO authenticated USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cupones'
  ) THEN
    ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage cupones" ON cupones FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- Insert sample data only if tables are empty
INSERT INTO descuentos (id, empresa_id, sucursal_id, nombre, descripcion, tipo, valor, activo) 
SELECT 
  'desc-001-001-001-001-001001001001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Descuento 10%',
  'Descuento general del 10%',
  'porcentaje',
  10,
  true
WHERE NOT EXISTS (SELECT 1 FROM descuentos);

INSERT INTO cupones (id, empresa_id, sucursal_id, codigo, nombre, descripcion, tipo, valor, usos_maximos, activo)
SELECT 
  'cupon-001-001-001-001-001001001001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'VERANO2025',
  'Cupón Verano',
  'Descuento especial de verano',
  'descuento',
  20,
  100,
  true
WHERE NOT EXISTS (SELECT 1 FROM cupones);