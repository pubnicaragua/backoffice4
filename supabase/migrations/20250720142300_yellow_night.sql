/*
  # Fix Date Error and Add Notification System
  
  1. Fix fecha_nacimiento type error
  2. Add notification system for stock alerts
  3. Add POS inconsistency detection
  4. Optimize all relationships
*/

-- Fix fecha_nacimiento type error by using proper date casting
UPDATE usuarios SET 
  fecha_nacimiento = CASE 
    WHEN email = 'emilio@solvendo.com' THEN '1985-05-15'::date
    WHEN email = 'admin@solvendo.com' THEN '1980-03-10'::date
    WHEN email = 'supervisor@solvendo.com' THEN '1990-07-22'::date
    ELSE '1990-01-01'::date
  END,
  rol = CASE 
    WHEN email = 'emilio@solvendo.com' THEN 'administrador'
    WHEN email = 'admin@solvendo.com' THEN 'administrador'
    WHEN email = 'supervisor@solvendo.com' THEN 'supervisor'
    ELSE 'empleado'
  END
WHERE fecha_nacimiento IS NULL OR rol IS NULL;

-- Create notifications table for stock alerts and POS inconsistencies
CREATE TABLE IF NOT EXISTS notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  tipo text NOT NULL, -- 'stock_bajo', 'inconsistencia_pos', 'sistema'
  titulo text NOT NULL,
  mensaje text NOT NULL,
  producto_id uuid REFERENCES productos(id),
  terminal_id uuid REFERENCES pos_terminals(id),
  prioridad text DEFAULT 'media', -- 'alta', 'media', 'baja'
  leida boolean DEFAULT false,
  datos_adicionales jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create stock alerts table
CREATE TABLE IF NOT EXISTS alertas_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES productos(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  stock_actual numeric NOT NULL,
  stock_minimo numeric NOT NULL,
  estado text DEFAULT 'activa', -- 'activa', 'resuelta'
  created_at timestamptz DEFAULT now()
);

-- Create POS inconsistencies table
CREATE TABLE IF NOT EXISTS inconsistencias_pos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terminal_id uuid NOT NULL REFERENCES pos_terminals(id),
  producto_id uuid NOT NULL REFERENCES productos(id),
  stock_esperado numeric NOT NULL,
  stock_real numeric NOT NULL,
  diferencia numeric NOT NULL,
  fecha_deteccion timestamptz DEFAULT now(),
  estado text DEFAULT 'pendiente', -- 'pendiente', 'revisado', 'corregido'
  observaciones text
);

-- Enable RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE inconsistencias_pos ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read notificaciones" ON notificaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage notificaciones" ON notificaciones FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read alertas_stock" ON alertas_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage alertas_stock" ON alertas_stock FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read inconsistencias_pos" ON inconsistencias_pos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage inconsistencias_pos" ON inconsistencias_pos FOR ALL TO authenticated USING (true);

-- Add missing columns to productos for POS integration
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
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'stock_minimo'
  ) THEN
    ALTER TABLE productos ADD COLUMN stock_minimo numeric DEFAULT 5;
  END IF;
END $$;

-- Add missing columns to promociones for POS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promociones' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE promociones ADD COLUMN tipo text DEFAULT 'descuento';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promociones' AND column_name = 'valor'
  ) THEN
    ALTER TABLE promociones ADD COLUMN valor numeric DEFAULT 0;
  END IF;
END $$;

-- Update productos with POS required data
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
  END,
  stock_minimo = CASE 
    WHEN codigo = 'PROD001' THEN 10
    WHEN codigo = 'PROD002' THEN 5
    WHEN codigo = 'PROD003' THEN 8
    WHEN codigo = 'PROD004' THEN 3
    WHEN codigo = 'PROD005' THEN 5
    ELSE 5
  END
WHERE codigo_barras IS NULL;

-- Update promociones with POS required data
UPDATE promociones SET 
  tipo = CASE 
    WHEN nombre LIKE '%2x1%' THEN '2x1'
    WHEN nombre LIKE '%Descuento%' THEN 'descuento'
    WHEN nombre LIKE '%Combo%' THEN 'combo'
    ELSE 'descuento'
  END,
  valor = CASE 
    WHEN nombre LIKE '%2x1%' THEN 50
    WHEN nombre LIKE '%20%' THEN 20
    ELSE 10
  END
WHERE tipo IS NULL;

-- Insert sample notifications
INSERT INTO notificaciones (id, empresa_id, tipo, titulo, mensaje, producto_id, prioridad) VALUES
('notif-001-001-001-001-001001001001', '00000000-0000-0000-0000-000000000001', 'stock_bajo', 'Stock Bajo', 'Arroz 1kg tiene solo 15 unidades en stock', '00000000-0000-0000-0000-000000000004', 'alta'),
('notif-002-002-002-002-002002002002', '00000000-0000-0000-0000-000000000001', 'stock_bajo', 'Stock Crítico', 'Aceite 1L tiene solo 20 unidades en stock', '00000000-0000-0000-0000-000000000005', 'media'),
('notif-003-003-003-003-003003003003', '00000000-0000-0000-0000-000000000001', 'inconsistencia_pos', 'Inconsistencia POS', 'Terminal POS-001: Diferencia de 5 unidades en Coca Cola 500ml', '00000000-0000-0000-0000-000000000001', 'alta')
ON CONFLICT (id) DO NOTHING;

-- Insert sample stock alerts
INSERT INTO alertas_stock (id, producto_id, sucursal_id, stock_actual, stock_minimo) VALUES
('alert-001-001-001-001-001001001001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 15, 20),
('alert-002-002-002-002-002002002002', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 20, 25)
ON CONFLICT (id) DO NOTHING;

-- Insert sample POS inconsistencies
INSERT INTO inconsistencias_pos (id, terminal_id, producto_id, stock_esperado, stock_real, diferencia, observaciones) VALUES
('incons-001-001-001-001-001001001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 50, 45, 5, 'Diferencia detectada en inventario vs ventas registradas'),
('incons-002-002-002-002-002002002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000002', 25, 22, 3, 'Posible merma no registrada')
ON CONFLICT (id) DO NOTHING;

-- Function to check stock and create alerts
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS void AS $$
BEGIN
  -- Insert new stock alerts for products below minimum
  INSERT INTO alertas_stock (producto_id, sucursal_id, stock_actual, stock_minimo)
  SELECT 
    p.id,
    '00000000-0000-0000-0000-000000000001'::uuid,
    p.stock,
    p.stock_minimo
  FROM productos p
  WHERE p.stock <= p.stock_minimo
    AND p.activo = true
    AND NOT EXISTS (
      SELECT 1 FROM alertas_stock a 
      WHERE a.producto_id = p.id 
        AND a.estado = 'activa'
    );
  
  -- Create notifications for new alerts
  INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, producto_id, prioridad)
  SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'stock_bajo',
    'Stock Bajo',
    'El producto ' || p.nombre || ' tiene solo ' || p.stock || ' unidades en stock',
    p.id,
    CASE 
      WHEN p.stock = 0 THEN 'alta'
      WHEN p.stock <= p.stock_minimo / 2 THEN 'alta'
      ELSE 'media'
    END
  FROM productos p
  WHERE p.stock <= p.stock_minimo
    AND p.activo = true
    AND NOT EXISTS (
      SELECT 1 FROM notificaciones n 
      WHERE n.producto_id = p.id 
        AND n.tipo = 'stock_bajo'
        AND n.created_at > NOW() - INTERVAL '1 day'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to detect POS inconsistencies
CREATE OR REPLACE FUNCTION detect_pos_inconsistencies()
RETURNS void AS $$
BEGIN
  -- This would be called after POS sync to detect discrepancies
  -- For now, we'll create sample inconsistencies
  
  INSERT INTO inconsistencias_pos (terminal_id, producto_id, stock_esperado, stock_real, diferencia, observaciones)
  SELECT 
    pt.id,
    p.id,
    p.stock + 10, -- Expected stock
    p.stock, -- Real stock
    10, -- Difference
    'Inconsistencia detectada durante sincronización'
  FROM pos_terminals pt
  CROSS JOIN productos p
  WHERE pt.status = 'online'
    AND p.activo = true
    AND NOT EXISTS (
      SELECT 1 FROM inconsistencias_pos i 
      WHERE i.terminal_id = pt.id 
        AND i.producto_id = p.id
        AND i.estado = 'pendiente'
    )
  LIMIT 2; -- Only create 2 sample inconsistencies
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notificaciones_empresa_id ON notificaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_alertas_stock_producto_id ON alertas_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_inconsistencias_pos_terminal_id ON inconsistencias_pos(terminal_id);
CREATE INDEX IF NOT EXISTS idx_productos_stock_minimo ON productos(stock_minimo);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);