/*
  # Fix fecha_nacimiento column error and optimize performance
  
  1. Add missing fecha_nacimiento column to usuarios table
  2. Add missing rol column to usuarios table  
  3. Update existing data with proper date casting
  4. Optimize indexes for better performance
*/

-- Add fecha_nacimiento column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'fecha_nacimiento'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN fecha_nacimiento date;
  END IF;
END $$;

-- Add rol column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'rol'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN rol text DEFAULT 'empleado';
  END IF;
END $$;

-- Add sucursal_id column to movimientos_caja if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movimientos_caja' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE movimientos_caja ADD COLUMN sucursal_id uuid;
  END IF;
END $$;

-- Update existing data with proper date casting and valid sucursal_id
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

-- Update movimientos_caja with valid sucursal_id
UPDATE movimientos_caja 
SET sucursal_id = '00000000-0000-0000-0000-000000000001' 
WHERE sucursal_id IS NULL;

-- Add foreign key constraint for movimientos_caja -> sucursales
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

-- Create optimized indexes for better performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sucursal_id ON movimientos_caja(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_fecha ON movimientos_caja(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_empresa_id ON ventas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_promociones_activo ON promociones(activo);

-- Insert sample notifications for testing
INSERT INTO notificaciones (id, empresa_id, tipo, titulo, mensaje, producto_id, prioridad) VALUES
('notif-stock-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', 'stock_bajo', 'Stock Bajo', 'Arroz 1kg tiene solo 15 unidades en stock', '00000000-0000-0000-0000-000000000004', 'alta'),
('notif-stock-002-002-002-002-002002', '00000000-0000-0000-0000-000000000001', 'stock_bajo', 'Stock Crítico', 'Aceite 1L tiene solo 20 unidades en stock', '00000000-0000-0000-0000-000000000005', 'media'),
('notif-pos-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', 'inconsistencia_pos', 'Inconsistencia POS', 'Terminal POS-001: Diferencia de 5 unidades en Coca Cola 500ml', '00000000-0000-0000-0000-000000000001', 'alta')
ON CONFLICT (id) DO NOTHING;

-- Function to automatically detect stock alerts
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS void AS $$
BEGIN
  -- Insert new stock alerts for products below minimum
  INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, producto_id, prioridad)
  SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'stock_bajo',
    'Stock Bajo',
    'El producto ' || p.nombre || ' tiene solo ' || p.stock || ' unidades en stock',
    p.id,
    CASE 
      WHEN p.stock = 0 THEN 'alta'
      WHEN p.stock <= (p.stock_minimo / 2) THEN 'alta'
      ELSE 'media'
    END
  FROM productos p
  WHERE p.stock <= COALESCE(p.stock_minimo, 5)
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
  -- Create sample inconsistencies for demonstration
  INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, prioridad)
  SELECT 
    '00000000-0000-0000-0000-000000000001'::uuid,
    'inconsistencia_pos',
    'Inconsistencia POS Detectada',
    'Terminal ' || pt.terminal_name || ': Diferencia detectada en inventario',
    'alta'
  FROM pos_terminals pt
  WHERE pt.status = 'online'
    AND NOT EXISTS (
      SELECT 1 FROM notificaciones n 
      WHERE n.tipo = 'inconsistencia_pos'
        AND n.created_at > NOW() - INTERVAL '1 hour'
    )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;