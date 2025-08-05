/*
  # Complete System Fix - All Issues Resolved
  
  1. Fix movimientos_caja relationship
  2. Create missing tables for POS integration
  3. Add all required endpoints data
  4. Fix all relationships
  5. Add descuentos and cupones tables
*/

-- First, add the missing sucursal_id column to movimientos_caja
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movimientos_caja' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE movimientos_caja ADD COLUMN sucursal_id uuid;
  END IF;
END $$;

-- Update existing movimientos_caja records with valid sucursal_id
UPDATE movimientos_caja 
SET sucursal_id = '00000000-0000-0000-0000-000000000001' 
WHERE sucursal_id IS NULL;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movimientos_caja_sucursal_id_fkey'
  ) THEN
    ALTER TABLE movimientos_caja 
    ADD CONSTRAINT movimientos_caja_sucursal_id_fkey 
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
  END IF;
END $$;

-- Create descuentos table
CREATE TABLE IF NOT EXISTS descuentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid REFERENCES sucursales(id),
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'porcentaje', -- 'porcentaje', 'monto_fijo'
  valor numeric NOT NULL,
  fecha_inicio date,
  fecha_fin date,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create cupones table
CREATE TABLE IF NOT EXISTS cupones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid REFERENCES sucursales(id),
  codigo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'descuento', -- 'descuento', 'regalo', 'envio_gratis'
  valor numeric NOT NULL,
  usos_maximos integer DEFAULT 1,
  usos_actuales integer DEFAULT 0,
  fecha_inicio date,
  fecha_fin date,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create roles table for user roles
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text UNIQUE NOT NULL,
  descripcion text,
  permisos jsonb DEFAULT '[]',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create configuracion_impresion table
CREATE TABLE IF NOT EXISTS configuracion_impresion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  logo_url text,
  datos_empresa jsonb DEFAULT '{}',
  formato_boleta jsonb DEFAULT '{}',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE descuentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_impresion ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage descuentos" ON descuentos FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage cupones" ON cupones FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage roles" ON roles FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage configuracion_impresion" ON configuracion_impresion FOR ALL TO authenticated USING (true);

-- Insert sample roles
INSERT INTO roles (id, nombre, descripcion, permisos) VALUES
('role-admin-001-001-001-001-001001', 'administrador', 'Administrador del sistema', '["all"]'),
('role-super-002-002-002-002-002002', 'supervisor', 'Supervisor de sucursal', '["ventas", "inventario", "reportes"]'),
('role-cajero-003-003-003-003-003003', 'cajero', 'Cajero de ventas', '["ventas", "caja"]'),
('role-empleado-004-004-004-004-004', 'empleado', 'Empleado general', '["ventas"]')
ON CONFLICT (id) DO NOTHING;

-- Update usuarios with rol_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'rol_id'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN rol_id uuid REFERENCES roles(id);
  END IF;
END $$;

-- Update existing users with roles
UPDATE usuarios SET 
  rol_id = CASE 
    WHEN email LIKE '%admin%' OR email = 'emilio@solvendo.com' THEN 'role-admin-001-001-001-001-001001'
    WHEN rol = 'supervisor' THEN 'role-super-002-002-002-002-002002'
    WHEN rol = 'cajero' THEN 'role-cajero-003-003-003-003-003003'
    ELSE 'role-empleado-004-004-004-004-004'
  END
WHERE rol_id IS NULL;

-- Insert sample descuentos
INSERT INTO descuentos (id, empresa_id, sucursal_id, nombre, descripcion, tipo, valor, activo) VALUES
('desc-001-001-001-001-001001001001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Descuento 10%', 'Descuento general del 10%', 'porcentaje', 10, true),
('desc-002-002-002-002-002002002002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Descuento $5000', 'Descuento fijo de $5000', 'monto_fijo', 5000, true),
('desc-003-003-003-003-003003003003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Descuento 15%', 'Descuento especial del 15%', 'porcentaje', 15, true),
('desc-004-004-004-004-004004004004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Descuento $3000', 'Descuento fijo de $3000', 'monto_fijo', 3000, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample cupones
INSERT INTO cupones (id, empresa_id, sucursal_id, codigo, nombre, descripcion, tipo, valor, usos_maximos, activo) VALUES
('cupon-001-001-001-001-001001001001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'VERANO2025', 'Cupón Verano', 'Descuento especial de verano', 'descuento', 20, 100, true),
('cupon-002-002-002-002-002002002002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'REGALO10', 'Cupón Regalo', 'Cupón de regalo $10000', 'descuento', 10000, 50, true),
('cupon-003-003-003-003-003003003003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'ENVIOGRATIS', 'Envío Gratis', 'Cupón de envío gratis', 'envio_gratis', 0, 25, true),
('cupon-004-004-004-004-004004004004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PRIMERA15', 'Primera Compra', 'Descuento primera compra 15%', 'descuento', 15, 200, true)
ON CONFLICT (id) DO NOTHING;

-- Insert configuracion_impresion
INSERT INTO configuracion_impresion (id, empresa_id, logo_url, datos_empresa, formato_boleta) VALUES
('config-print-001-001-001-001-001', '00000000-0000-0000-0000-000000000001', '/logo_negro.svg', 
'{"razon_social": "ANROLTEC SPA", "rut": "78168951-3", "direccion": "Av. Principal 123", "telefono": "+56 9 1234 5678"}',
'{"ancho_papel": 80, "fuente": "Arial", "tamano_fuente": 12, "incluir_logo": true}')
ON CONFLICT (id) DO NOTHING;

-- Add missing columns to productos for POS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'codigo_barras'
  ) THEN
    ALTER TABLE productos ADD COLUMN codigo_barras text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'destacado'
  ) THEN
    ALTER TABLE productos ADD COLUMN destacado boolean DEFAULT false;
  END IF;
END $$;

-- Update productos with codigo_barras and destacado
UPDATE productos SET 
  codigo_barras = CASE 
    WHEN codigo = 'PROD001' THEN '7891234567890'
    WHEN codigo = 'PROD002' THEN '7891234567891'
    WHEN codigo = 'PROD003' THEN '7891234567892'
    WHEN codigo = 'PROD004' THEN '7891234567893'
    WHEN codigo = 'PROD005' THEN '7891234567894'
    ELSE '7891234567899'
  END,
  destacado = CASE 
    WHEN codigo IN ('PROD001', 'PROD003') THEN true
    ELSE false
  END
WHERE codigo_barras IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sucursal_id ON movimientos_caja(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_descuentos_empresa_id ON descuentos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cupones_empresa_id ON cupones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);