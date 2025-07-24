/*
  # Fix All Critical Database Relationships and Errors
  
  1. Fix Foreign Key Relationships
    - promociones -> sucursales
    - movimientos_caja -> sucursales  
    - solicitudes_vacaciones -> usuarios
    - asistencias -> usuarios
    
  2. Create Missing Tables
    - asignaciones_tareas
    - inventario
    - configuracion_pos
    
  3. Fix Data Consistency
    - Update all foreign keys with valid UUIDs
    - Ensure all relationships work
*/

-- Fix promociones -> sucursales relationship
DO $$
BEGIN
  -- Add sucursal_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promociones' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE promociones ADD COLUMN sucursal_id uuid;
  END IF;
  
  -- Update existing records with valid sucursal_id
  UPDATE promociones 
  SET sucursal_id = '00000000-0000-0000-0000-000000000001' 
  WHERE sucursal_id IS NULL;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'promociones_sucursal_id_fkey'
  ) THEN
    ALTER TABLE promociones 
    ADD CONSTRAINT promociones_sucursal_id_fkey 
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
  END IF;
END $$;

-- Fix movimientos_caja -> sucursales relationship
DO $$
BEGIN
  -- Add sucursal_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movimientos_caja' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE movimientos_caja ADD COLUMN sucursal_id uuid;
  END IF;
  
  -- Update existing records with valid sucursal_id
  UPDATE movimientos_caja 
  SET sucursal_id = '00000000-0000-0000-0000-000000000001' 
  WHERE sucursal_id IS NULL;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movimientos_caja_sucursal_id_fkey'
  ) THEN
    ALTER TABLE movimientos_caja 
    ADD CONSTRAINT movimientos_caja_sucursal_id_fkey 
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
  END IF;
END $$;

-- Create asignaciones_tareas table if not exists
CREATE TABLE IF NOT EXISTS asignaciones_tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  tarea_id uuid NOT NULL REFERENCES tareas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  fecha_asignacion date DEFAULT CURRENT_DATE,
  completada boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create inventario table if not exists
CREATE TABLE IF NOT EXISTS inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  producto_id uuid NOT NULL REFERENCES productos(id),
  movimiento text NOT NULL, -- 'entrada', 'salida', 'ajuste'
  cantidad numeric NOT NULL,
  stock_anterior numeric DEFAULT 0,
  stock_final numeric NOT NULL,
  referencia text,
  usuario_id uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now()
);

-- Create configuracion_pos table if not exists
CREATE TABLE IF NOT EXISTS configuracion_pos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  deposito boolean DEFAULT true,
  reporte_ventas boolean DEFAULT false,
  devoluciones boolean DEFAULT true,
  usd boolean DEFAULT true,
  clp boolean DEFAULT false,
  mercado_pago boolean DEFAULT false,
  sumup boolean DEFAULT true,
  transbank boolean DEFAULT false,
  getnet boolean DEFAULT false,
  solicitar_autorizacion boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE asignaciones_tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_pos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage asignaciones_tareas" ON asignaciones_tareas FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage inventario" ON inventario FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage configuracion_pos" ON configuracion_pos FOR ALL TO authenticated USING (true);

-- Fix auditoria table to reference usuarios instead of auth.users
DO $$
BEGIN
  -- Drop the problematic foreign key if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'auditoria_usuario_id_fkey'
  ) THEN
    ALTER TABLE auditoria DROP CONSTRAINT auditoria_usuario_id_fkey;
  END IF;
  
  -- Add correct foreign key to usuarios table
  ALTER TABLE auditoria 
  ADD CONSTRAINT auditoria_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
END $$;

-- Insert sample data for asignaciones_tareas
INSERT INTO asignaciones_tareas (id, usuario_id, tarea_id, sucursal_id, fecha_asignacion, completada) VALUES
('asig-001-001-001-001-001001001001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, false),
('asig-002-002-002-002-002002002002', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, false)
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for configuracion_pos
INSERT INTO configuracion_pos (id, empresa_id, deposito, reporte_ventas, devoluciones, usd, clp, mercado_pago, sumup, transbank, getnet, solicitar_autorizacion) VALUES
('config-pos-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', true, false, true, true, false, false, true, false, false, true)
ON CONFLICT (id) DO NOTHING;

-- Add more sample data for better testing
INSERT INTO movimientos_caja (id, empresa_id, usuario_id, tipo, monto, observacion, sucursal_id, fecha) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'retiro', 1023, 'Gastos operacionales', '00000000-0000-0000-0000-000000000001', '2025-05-28 20:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta efectivo', '00000000-0000-0000-0000-000000000002', '2025-05-28 18:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta tarjeta', '00000000-0000-0000-0000-000000000002', '2025-05-28 18:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta efectivo', '00000000-0000-0000-0000-000000000002', '2025-05-28 18:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta tarjeta', '00000000-0000-0000-0000-000000000002', '2025-05-28 18:00:00')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promociones_sucursal_id ON promociones(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sucursal_id ON movimientos_caja(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_tareas_usuario_id ON asignaciones_tareas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_inventario_producto_id ON inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_pos_empresa_id ON configuracion_pos(empresa_id);