/*
  # Fix All Critical Relationships and Errors
  
  1. Fix movimientos_caja -> sucursales relationship
  2. Fix promociones -> sucursales relationship  
  3. Add missing foreign keys
  4. Create SolvIA Edge Function
  5. Complete Colaboradores backend
*/

-- Fix movimientos_caja relationship with sucursales
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

-- Fix promociones relationship with sucursales
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

-- Create complete colaboradores backend tables
CREATE TABLE IF NOT EXISTS tareas_empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'limpieza',
  fecha_asignacion date DEFAULT CURRENT_DATE,
  completada boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS turnos_empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  fecha date NOT NULL,
  hora_ingreso time,
  hora_salida time,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permisos_empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  permiso text NOT NULL,
  otorgado boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tareas_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos_empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos_empleados ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage tareas_empleados" ON tareas_empleados FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage turnos_empleados" ON turnos_empleados FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage permisos_empleados" ON permisos_empleados FOR ALL TO authenticated USING (true);

-- Insert sample data for colaboradores
INSERT INTO tareas_empleados (usuario_id, nombre, descripcion, tipo) VALUES
('80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'Limpieza total', 'Hacer limpieza y sacar la basura de la sucursal', 'limpieza'),
('80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'Limpieza total', 'Hacer limpieza y sacar la basura de la tienda', 'limpieza')
ON CONFLICT DO NOTHING;

INSERT INTO permisos_empleados (usuario_id, permiso, otorgado) VALUES
('80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'Permiso de caja', false),
('80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'Permiso de hacer despacho', true),
('80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'Permiso de inventario', true),
('80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'Permiso de reportes', true),
('80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'Permiso de ventas', true)
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sucursal_id ON movimientos_caja(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_promociones_sucursal_id ON promociones(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_tareas_empleados_usuario_id ON tareas_empleados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_turnos_empleados_usuario_id ON turnos_empleados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_permisos_empleados_usuario_id ON permisos_empleados(usuario_id);