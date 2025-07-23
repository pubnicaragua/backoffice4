/*
  # Fix All Missing Tables and Columns
  
  1. Fix usuarios table - add fecha_nacimiento column
  2. Create missing tables for colaboradores
  3. Fix all relationships
*/

-- Add fecha_nacimiento column to usuarios if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'usuarios' AND column_name = 'fecha_nacimiento'
  ) THEN
    ALTER TABLE usuarios ADD COLUMN fecha_nacimiento date;
  END IF;
END $$;

-- Update existing users with valid birth dates (15+ years old)
UPDATE usuarios SET 
  fecha_nacimiento = CASE 
    WHEN email = 'emilio@solvendo.com' THEN '1985-05-15'::date
    WHEN email = 'admin@solvendo.com' THEN '1980-03-10'::date
    WHEN email = 'supervisor@solvendo.com' THEN '1990-07-22'::date
    ELSE '2008-01-01'::date -- 16+ years old
  END
WHERE fecha_nacimiento IS NULL;

-- Create usuario_permisos table if not exists
CREATE TABLE IF NOT EXISTS usuario_permisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  permiso_id uuid NOT NULL REFERENCES permisos(id),
  otorgado boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id, permiso_id)
);

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

-- Add missing columns to turnos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'turnos' AND column_name = 'empresa_id'
  ) THEN
    ALTER TABLE turnos ADD COLUMN empresa_id uuid REFERENCES empresas(id);
  END IF;
END $$;

-- Update existing turnos with empresa_id
UPDATE turnos SET empresa_id = '00000000-0000-0000-0000-000000000001' WHERE empresa_id IS NULL;

-- Enable RLS
ALTER TABLE usuario_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_tareas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage usuario_permisos" ON usuario_permisos FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage asignaciones_tareas" ON asignaciones_tareas FOR ALL TO authenticated USING (true);

-- Insert more sample data for colaboradores
INSERT INTO usuarios (id, email, nombres, apellidos, rut, telefono, fecha_nacimiento, rol, activo) VALUES
('user-gabriel-001-001-001-001-001001', 'gabriel.silva@anroltec.com', 'Gabriel', 'Silva', '51323513-1', '+56 9 7777 7777', '2008-03-15', 'empleado', true),
('user-sofia-002-002-002-002-002002', 'sofia.morales@anroltec.com', 'Sofia', 'Morales', '42341254-3', '+56 9 8888 8888', '2007-06-20', 'empleado', true),
('user-diego-003-003-003-003-003003', 'diego.torres@anroltec.com', 'Diego', 'Torres', '38765432-1', '+56 9 9999 9999', '2006-09-10', 'supervisor', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample usuario_permisos
INSERT INTO usuario_permisos (usuario_id, permiso_id, otorgado) VALUES
('user-gabriel-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', false),
('user-gabriel-001-001-001-001-001001', '00000000-0000-0000-0000-000000000002', true),
('user-sofia-002-002-002-002-002002', '00000000-0000-0000-0000-000000000001', true),
('user-sofia-002-002-002-002-002002', '00000000-0000-0000-0000-000000000002', true)
ON CONFLICT (usuario_id, permiso_id) DO NOTHING;

-- Insert sample asignaciones_tareas
INSERT INTO asignaciones_tareas (usuario_id, tarea_id, sucursal_id, fecha_asignacion, completada) VALUES
('user-gabriel-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, false),
('user-sofia-002-002-002-002-002002', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, false)
ON CONFLICT (id) DO NOTHING;