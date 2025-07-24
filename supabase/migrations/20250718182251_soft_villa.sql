/*
  # Fix Schema Dependencies and Relationships

  1. Create Missing Tables
    - `empresas` - Companies table
    - `sucursales` - Branches table  
    - `clientes` - Clients table
    - `asistencias` - Attendance table
    - `usuario_empresa` - User-company relationship
    - `categorias` - Product categories

  2. Fix Foreign Key Relationships
    - Add proper foreign keys for all tables
    - Ensure relationships work with Supabase PostgREST

  3. Insert Sample Data
    - Add realistic sample data for all tables
    - Ensure data consistency across relationships
*/

-- Create empresas table
CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rut text UNIQUE NOT NULL,
  razon_social text NOT NULL,
  giro text,
  direccion text,
  comuna text,
  ciudad text,
  region text,
  telefono text,
  email text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create sucursales table
CREATE TABLE IF NOT EXISTS sucursales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  nombre text NOT NULL,
  direccion text,
  comuna text,
  ciudad text,
  region text,
  telefono text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create clientes table
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rut text UNIQUE,
  razon_social text NOT NULL,
  giro text,
  direccion text,
  comuna text,
  ciudad text,
  region text,
  telefono text,
  email text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create categorias table
CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create asistencias table
CREATE TABLE IF NOT EXISTS asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  fecha date NOT NULL,
  hora_ingreso time,
  hora_salida time,
  estado text DEFAULT 'presente',
  created_at timestamptz DEFAULT now()
);

-- Create usuario_empresa table
CREATE TABLE IF NOT EXISTS usuario_empresa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid REFERENCES sucursales(id),
  rol text DEFAULT 'empleado',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id, empresa_id)
);

-- Add foreign key to productos if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'categoria_id'
  ) THEN
    ALTER TABLE productos ADD COLUMN categoria_id uuid REFERENCES categorias(id);
  END IF;
END $$;

-- Add foreign keys to existing tables
DO $$
BEGIN
  -- Add empresa_id to despachos if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'despachos' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE despachos ADD COLUMN empresa_id uuid REFERENCES empresas(id);
  END IF;

  -- Add usuario_id to despachos if not exists  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'despachos' AND column_name = 'entregado_por'
  ) THEN
    ALTER TABLE despachos ADD COLUMN entregado_por uuid REFERENCES usuarios(id);
  END IF;

  -- Add empresa_id to pedidos if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN empresa_id uuid REFERENCES empresas(id);
  END IF;

  -- Add proveedor_id to pedidos if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'proveedor_id'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN proveedor_id uuid REFERENCES clientes(id);
  END IF;

  -- Add empresa_id to promociones if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promociones' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE promociones ADD COLUMN empresa_id uuid REFERENCES empresas(id);
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_empresa ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can read empresas" ON empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage empresas" ON empresas FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read sucursales" ON sucursales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage sucursales" ON sucursales FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read clientes" ON clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage clientes" ON clientes FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read categorias" ON categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage categorias" ON categorias FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read asistencias" ON asistencias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage asistencias" ON asistencias FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read usuario_empresa" ON usuario_empresa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage usuario_empresa" ON usuario_empresa FOR ALL TO authenticated USING (true);

-- Insert sample data
INSERT INTO empresas (id, rut, razon_social, giro, activo) VALUES
('00000000-0000-0000-0000-000000000001', '12345678-9', 'Solvendo Demo', 'Retail', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO sucursales (id, empresa_id, nombre, direccion, activo) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Sucursal N°1', 'Av. Principal 123', true),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Sucursal N°2', 'Calle Secundaria 456', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clientes (id, rut, razon_social, giro, activo) VALUES
('00000000-0000-0000-0000-000000000001', '87654321-0', 'Pola - cola', 'Bebidas', true),
('00000000-0000-0000-0000-000000000002', '11111111-1', 'Proveedor Demo', 'Alimentos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categorias (id, nombre, descripcion, activo) VALUES
('00000000-0000-0000-0000-000000000001', 'Bebidas', 'Bebidas y refrescos', true),
('00000000-0000-0000-0000-000000000002', 'Alimentos', 'Productos alimenticios', true),
('00000000-0000-0000-0000-000000000003', 'Snacks', 'Snacks y golosinas', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample asistencias
INSERT INTO asistencias (id, usuario_id, empresa_id, sucursal_id, fecha, hora_ingreso, hora_salida, estado) VALUES
('00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '08:00', '18:00', 'presente'),
('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '08:15', '18:00', 'tarde'),
('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', CURRENT_DATE, NULL, NULL, 'ausente'),
('00000000-0000-0000-0000-000000000004', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE - 1, '08:00', '18:00', 'presente'),
('00000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', CURRENT_DATE - 1, NULL, NULL, 'ausente')
ON CONFLICT (id) DO NOTHING;

-- Insert sample usuario_empresa relationships
INSERT INTO usuario_empresa (id, usuario_id, empresa_id, sucursal_id, rol, activo) VALUES
('00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'administrador', true),
('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'supervisor', true),
('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'empleado', true)
ON CONFLICT (usuario_id, empresa_id) DO NOTHING;

-- Update existing tables with foreign keys
UPDATE despachos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE despachos SET entregado_por = '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4' WHERE entregado_por IS NULL;

UPDATE pedidos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;
UPDATE pedidos SET proveedor_id = '00000000-0000-0000-0000-000000000001' WHERE proveedor_id IS NULL;

UPDATE promociones SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

UPDATE productos SET categoria_id = '00000000-0000-0000-0000-000000000001' WHERE categoria_id IS NULL AND nombre LIKE '%cola%';
UPDATE productos SET categoria_id = '00000000-0000-0000-0000-000000000002' WHERE categoria_id IS NULL AND (nombre LIKE '%pan%' OR nombre LIKE '%leche%' OR nombre LIKE '%arroz%' OR nombre LIKE '%aceite%');

-- Insert more sample data for ventas with real relationships
INSERT INTO ventas (id, empresa_id, sucursal_id, folio, tipo_dte, metodo_pago, total, fecha) VALUES
('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '001007', 'boleta', 'efectivo', 22000, NOW() - INTERVAL '11 days'),
('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '002005', 'factura', 'tarjeta', 35000, NOW() - INTERVAL '12 days'),
('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '001008', 'boleta', 'efectivo', 18500, NOW() - INTERVAL '13 days'),
('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '002006', 'boleta', 'tarjeta', 27000, NOW() - INTERVAL '14 days'),
('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '001009', 'factura', 'efectivo', 41000, NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

-- Insert more venta_items for better calculations
INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 12, 1500, 18000),
('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 20, 800, 16000),
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 8, 1200, 9600),
('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', 6, 2500, 15000),
('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000005', 4, 3200, 12800)
ON CONFLICT (id) DO NOTHING;