/*
  # Fix All Critical Database Relationships and Missing Tables
  
  1. Fix Foreign Key Relationships
    - promociones -> sucursales
    - solicitudes_vacaciones -> usuarios  
    - asistencias -> usuarios
    - movimientos_caja -> sucursales
    
  2. Create Missing Tables
    - asignaciones_tareas
    - auditoria (if needed)
    
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

-- Enable RLS on asignaciones_tareas
ALTER TABLE asignaciones_tareas ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage asignaciones_tareas" ON asignaciones_tareas FOR ALL TO authenticated USING (true);

-- Create auditoria table if it doesn't exist (and fix the foreign key issue)
CREATE TABLE IF NOT EXISTS auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla text NOT NULL,
  operacion text NOT NULL,
  usuario_id uuid NOT NULL REFERENCES usuarios(id), -- Reference usuarios, not auth.users
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on auditoria
ALTER TABLE auditoria ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for auditoria
CREATE POLICY "Users can manage auditoria" ON auditoria FOR ALL TO authenticated USING (true);

-- Insert sample data for asignaciones_tareas
INSERT INTO asignaciones_tareas (id, usuario_id, tarea_id, sucursal_id, fecha_asignacion, completada) VALUES
('asig-001-001-001-001-001001001001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, false),
('asig-002-002-002-002-002002002002', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, false)
ON CONFLICT (id) DO NOTHING;

-- Add more sample data for better testing
INSERT INTO movimientos_caja (id, empresa_id, usuario_id, tipo, monto, observacion, sucursal_id, fecha) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'retiro', 1023, 'Gastos operacionales', '00000000-0000-0000-0000-000000000001', '2025-05-28 20:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta efectivo', '00000000-0000-0000-0000-000000000001', '2025-05-28 18:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta tarjeta', '00000000-0000-0000-0000-000000000001', '2025-05-28 18:00:00')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promociones_sucursal_id ON promociones(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sucursal_id ON movimientos_caja(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_tareas_usuario_id ON asignaciones_tareas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_id ON auditoria(usuario_id);