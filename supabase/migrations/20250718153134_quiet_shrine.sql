/*
  # Create missing tables for complete functionality

  1. New Tables
    - `pedidos` - Orders management
    - `movimientos_caja` - Cash movements
    - `aperturas_caja` - Cash register openings
    - `cajas` - Cash registers
    - `devoluciones` - Returns
    - `venta_items` - Sale items for detailed calculations

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users

  3. Sample Data
    - Add realistic sample data for testing
*/

-- Create cajas table
CREATE TABLE IF NOT EXISTS cajas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  nombre text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create aperturas_caja table
CREATE TABLE IF NOT EXISTS aperturas_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id uuid NOT NULL REFERENCES cajas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  usuario_id uuid REFERENCES usuarios(id),
  fecha_apertura timestamptz DEFAULT now(),
  monto_inicial numeric DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create movimientos_caja table
CREATE TABLE IF NOT EXISTS movimientos_caja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apertura_caja_id uuid REFERENCES aperturas_caja(id),
  empresa_id uuid REFERENCES empresas(id),
  usuario_id uuid REFERENCES usuarios(id),
  tipo text NOT NULL CHECK (tipo IN ('ingreso', 'retiro')),
  monto numeric NOT NULL,
  observacion text,
  sucursal_id uuid REFERENCES sucursales(id),
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create pedidos table
CREATE TABLE IF NOT EXISTS pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  proveedor_id uuid REFERENCES clientes(id),
  folio text,
  fecha timestamptz DEFAULT now(),
  monto_total numeric DEFAULT 0,
  estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

-- Create devoluciones table
CREATE TABLE IF NOT EXISTS devoluciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES ventas(id),
  monto_devuelto numeric NOT NULL,
  motivo text,
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create venta_items table for detailed calculations
CREATE TABLE IF NOT EXISTS venta_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES ventas(id),
  producto_id uuid NOT NULL REFERENCES productos(id),
  cantidad numeric NOT NULL,
  precio_unitario numeric NOT NULL,
  subtotal numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aperturas_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE devoluciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read cajas" ON cajas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage cajas" ON cajas FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read aperturas_caja" ON aperturas_caja FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage aperturas_caja" ON aperturas_caja FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read movimientos_caja" ON movimientos_caja FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage movimientos_caja" ON movimientos_caja FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read pedidos" ON pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage pedidos" ON pedidos FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read devoluciones" ON devoluciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage devoluciones" ON devoluciones FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read venta_items" ON venta_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage venta_items" ON venta_items FOR ALL TO authenticated USING (true);

-- Insert sample cajas
INSERT INTO cajas (id, empresa_id, sucursal_id, nombre, descripcion) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Caja N°1', 'Caja principal sucursal 1'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Caja N°2', 'Caja secundaria sucursal 1'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Caja N°1', 'Caja principal sucursal 2'),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Caja N°2', 'Caja secundaria sucursal 2')
ON CONFLICT (id) DO NOTHING;

-- Insert sample aperturas_caja
INSERT INTO aperturas_caja (id, caja_id, sucursal_id, usuario_id, monto_inicial) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 50000),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 30000)
ON CONFLICT (id) DO NOTHING;

-- Insert sample movimientos_caja
INSERT INTO movimientos_caja (id, apertura_caja_id, empresa_id, usuario_id, tipo, monto, observacion, sucursal_id, fecha) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 15000, 'Venta del día', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'retiro', 5000, 'Gastos operacionales', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 8500, 'Venta tarjeta', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Insert sample pedidos
INSERT INTO pedidos (id, empresa_id, sucursal_id, proveedor_id, folio, fecha, monto_total, estado) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PED-001', NOW() - INTERVAL '1 day', 125000, 'recibido'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'PED-002', NOW() - INTERVAL '2 days', 85000, 'pendiente'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PED-003', NOW() - INTERVAL '3 days', 95000, 'recibido')
ON CONFLICT (id) DO NOTHING;

-- Insert sample devoluciones
INSERT INTO devoluciones (id, venta_id, monto_devuelto, motivo, fecha) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 5000, 'Producto defectuoso', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 12000, 'Cliente insatisfecho', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Insert sample venta_items for detailed calculations
INSERT INTO venta_items (id, venta_id, producto_id, cantidad, precio_unitario, subtotal) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 10, 1500, 15000),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 5, 800, 4000),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 3, 1200, 3600),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 8, 2500, 20000),
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000005', 2, 3200, 6400)
ON CONFLICT (id) DO NOTHING;

-- Add stock column to productos if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'stock'
  ) THEN
    ALTER TABLE productos ADD COLUMN stock numeric DEFAULT 0;
  END IF;
END $$;

-- Update productos with stock data
UPDATE productos SET stock = 50 WHERE codigo = 'PROD001';
UPDATE productos SET stock = 25 WHERE codigo = 'PROD002';
UPDATE productos SET stock = 30 WHERE codigo = 'PROD003';
UPDATE productos SET stock = 15 WHERE codigo = 'PROD004';
UPDATE productos SET stock = 20 WHERE codigo = 'PROD005';

-- Add costo column to productos if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'costo'
  ) THEN
    ALTER TABLE productos ADD COLUMN costo numeric DEFAULT 0;
  END IF;
END $$;

-- Update productos with cost data (70% of price)
UPDATE productos SET costo = precio * 0.7;