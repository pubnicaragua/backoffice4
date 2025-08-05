/*
  # Create Notifications System for Stock Alerts and POS Inconsistencies
  
  1. New Tables
    - `notificaciones` - System notifications
    - `alertas_stock` - Stock alerts tracking
    - `inconsistencias_pos` - POS inconsistencies detection
    
  2. Functions
    - Auto-detect stock alerts
    - POS inconsistency detection
    
  3. Sample Data
    - Real notifications for testing
*/

-- Create notificaciones table
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
  datos_adicionales jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create alertas_stock table
CREATE TABLE IF NOT EXISTS alertas_stock (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id uuid NOT NULL REFERENCES productos(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  stock_actual numeric NOT NULL,
  stock_minimo numeric NOT NULL,
  estado text DEFAULT 'activa', -- 'activa', 'resuelta'
  created_at timestamptz DEFAULT now()
);

-- Create inconsistencias_pos table
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

-- Create RLS policies
CREATE POLICY "Users can read notificaciones" ON notificaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage notificaciones" ON notificaciones FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read alertas_stock" ON alertas_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage alertas_stock" ON alertas_stock FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read inconsistencias_pos" ON inconsistencias_pos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage inconsistencias_pos" ON inconsistencias_pos FOR ALL TO authenticated USING (true);

-- Add missing columns to productos for notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'stock_minimo'
  ) THEN
    ALTER TABLE productos ADD COLUMN stock_minimo numeric DEFAULT 5;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'codigo_barras'
  ) THEN
    ALTER TABLE productos ADD COLUMN codigo_barras text;
  END IF;
END $$;

-- Update productos with stock_minimo and codigo_barras
UPDATE productos SET 
  stock_minimo = CASE 
    WHEN codigo = 'PROD001' THEN 10
    WHEN codigo = 'PROD002' THEN 5
    WHEN codigo = 'PROD003' THEN 8
    WHEN codigo = 'PROD004' THEN 3
    WHEN codigo = 'PROD005' THEN 5
    ELSE 5
  END,
  codigo_barras = CASE 
    WHEN codigo = 'PROD001' THEN '7891234567890'
    WHEN codigo = 'PROD002' THEN '7891234567891'
    WHEN codigo = 'PROD003' THEN '7891234567892'
    WHEN codigo = 'PROD004' THEN '7891234567893'
    WHEN codigo = 'PROD005' THEN '7891234567894'
    ELSE '7891234567899'
  END
WHERE stock_minimo IS NULL OR codigo_barras IS NULL;

-- Insert sample notifications for testing
INSERT INTO notificaciones (id, empresa_id, tipo, titulo, mensaje, producto_id, prioridad) VALUES
('notif-stock-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', 'stock_bajo', 'Stock Crítico', 'Arroz 1kg tiene solo 15 unidades (mínimo: 20)', '00000000-0000-0000-0000-000000000004', 'alta'),
('notif-stock-002-002-002-002-002002', '00000000-0000-0000-0000-000000000001', 'stock_bajo', 'Stock Bajo', 'Aceite 1L tiene solo 20 unidades (mínimo: 25)', '00000000-0000-0000-0000-000000000005', 'media'),
('notif-pos-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', 'inconsistencia_pos', 'Inconsistencia POS', 'Terminal POS-001: Diferencia de 5 unidades en Coca Cola 500ml', '00000000-0000-0000-0000-000000000001', 'alta')
ON CONFLICT (id) DO NOTHING;

-- Insert sample stock alerts
INSERT INTO alertas_stock (id, producto_id, sucursal_id, stock_actual, stock_minimo) VALUES
('alert-001-001-001-001-001001001001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 15, 20),
('alert-002-002-002-002-002002002002', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 20, 25)
ON CONFLICT (id) DO NOTHING;

-- Insert sample POS inconsistencies
INSERT INTO inconsistencias_pos (id, terminal_id, producto_id, stock_esperado, stock_real, diferencia, observaciones) VALUES
('incons-001-001-001-001-001001001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000001', 50, 45, 5, 'Diferencia detectada: ingresaron 100, vendieron 40, sistema registró 20'),
('incons-002-002-002-002-002002002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000002', 25, 22, 3, 'Posible merma no registrada o venta no sincronizada')
ON CONFLICT (id) DO NOTHING;

-- Function to automatically detect stock alerts
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
    'Stock Crítico',
    'El producto ' || p.nombre || ' tiene solo ' || p.stock || ' unidades (mínimo: ' || p.stock_minimo || ')',
    p.id,
    CASE 
      WHEN p.stock = 0 THEN 'alta'
      WHEN p.stock <= (p.stock_minimo / 2) THEN 'alta'
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
CREATE OR REPLACE FUNCTION detect_pos_inconsistencies(
  p_terminal_id uuid,
  p_producto_id uuid,
  p_stock_esperado numeric,
  p_stock_real numeric
)
RETURNS void AS $$
DECLARE
  diferencia_calc numeric;
BEGIN
  diferencia_calc := p_stock_esperado - p_stock_real;
  
  -- Only create inconsistency if difference is significant (> 2 units)
  IF ABS(diferencia_calc) > 2 THEN
    -- Insert inconsistency record
    INSERT INTO inconsistencias_pos (terminal_id, producto_id, stock_esperado, stock_real, diferencia, observaciones)
    VALUES (
      p_terminal_id,
      p_producto_id,
      p_stock_esperado,
      p_stock_real,
      diferencia_calc,
      'Inconsistencia detectada: diferencia de ' || ABS(diferencia_calc) || ' unidades'
    );
    
    -- Create notification
    INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, producto_id, terminal_id, prioridad)
    SELECT 
      '00000000-0000-0000-0000-000000000001'::uuid,
      'inconsistencia_pos',
      'Inconsistencia POS Detectada',
      'Terminal ' || pt.terminal_name || ': Diferencia de ' || ABS(diferencia_calc) || ' unidades en ' || pr.nombre,
      p_producto_id,
      p_terminal_id,
      'alta'
    FROM pos_terminals pt, productos pr
    WHERE pt.id = p_terminal_id AND pr.id = p_producto_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notificaciones_empresa_id ON notificaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_leida ON notificaciones(leida);
CREATE INDEX IF NOT EXISTS idx_notificaciones_created_at ON notificaciones(created_at);
CREATE INDEX IF NOT EXISTS idx_alertas_stock_producto_id ON alertas_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_alertas_stock_estado ON alertas_stock(estado);
CREATE INDEX IF NOT EXISTS idx_inconsistencias_pos_terminal_id ON inconsistencias_pos(terminal_id);
CREATE INDEX IF NOT EXISTS idx_inconsistencias_pos_estado ON inconsistencias_pos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_stock_minimo ON productos(stock_minimo);
CREATE INDEX IF NOT EXISTS idx_productos_codigo_barras ON productos(codigo_barras);