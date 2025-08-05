/*
  # Create missing tables for complete CRUD functionality

  1. New Tables
    - `turnos` - Employee shifts/schedules
    - `tareas` - Employee tasks
    - `permisos` - Employee permissions
    - `solicitudes_vacaciones` - Vacation requests
    - `asignaciones_tareas` - Task assignments
    - `horarios` - Work schedules

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create turnos table
CREATE TABLE IF NOT EXISTS turnos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  fecha date NOT NULL,
  hora_ingreso time,
  hora_salida time,
  created_at timestamptz DEFAULT now()
);

-- Create tareas table
CREATE TABLE IF NOT EXISTS tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'limpieza',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create permisos table
CREATE TABLE IF NOT EXISTS permisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  modulo text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create usuario_permisos table
CREATE TABLE IF NOT EXISTS usuario_permisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  permiso_id uuid NOT NULL REFERENCES permisos(id),
  otorgado boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(usuario_id, permiso_id)
);

-- Create solicitudes_vacaciones table
CREATE TABLE IF NOT EXISTS solicitudes_vacaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  numero_solicitud text NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  dias_solicitados integer NOT NULL,
  motivo text,
  estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

-- Create asignaciones_tareas table
CREATE TABLE IF NOT EXISTS asignaciones_tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuarios(id),
  tarea_id uuid NOT NULL REFERENCES tareas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  fecha_asignacion date DEFAULT CURRENT_DATE,
  completada boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_vacaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE asignaciones_tareas ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read turnos" ON turnos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage turnos" ON turnos FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read tareas" ON tareas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage tareas" ON tareas FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read permisos" ON permisos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage permisos" ON permisos FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read usuario_permisos" ON usuario_permisos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage usuario_permisos" ON usuario_permisos FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read solicitudes_vacaciones" ON solicitudes_vacaciones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage solicitudes_vacaciones" ON solicitudes_vacaciones FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read asignaciones_tareas" ON asignaciones_tareas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage asignaciones_tareas" ON asignaciones_tareas FOR ALL TO authenticated USING (true);

-- Insert sample data
INSERT INTO permisos (id, nombre, descripcion, modulo) VALUES
('00000000-0000-0000-0000-000000000001', 'Permiso de caja', 'Acceso a operaciones de caja', 'caja'),
('00000000-0000-0000-0000-000000000002', 'Permiso de hacer despacho', 'Realizar despachos de productos', 'despacho'),
('00000000-0000-0000-0000-000000000003', 'Permiso de hacer despacho', 'Realizar despachos de productos', 'despacho'),
('00000000-0000-0000-0000-000000000004', 'Permiso de hacer despacho', 'Realizar despachos de productos', 'despacho'),
('00000000-0000-0000-0000-000000000005', 'Permiso de hacer despacho', 'Realizar despachos de productos', 'despacho')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tareas (id, empresa_id, nombre, descripcion, tipo) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Limpieza total', 'Hacer limpieza y sacar la basura de la sucursal', 'limpieza'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Limpieza total', 'Hacer limpieza y sacar la basura de la sucursal', 'limpieza')
ON CONFLICT (id) DO NOTHING;

INSERT INTO solicitudes_vacaciones (id, usuario_id, numero_solicitud, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '2514', '2025-07-01', '2025-07-05', 5, 'Vacaciones familiares', 'pendiente')
ON CONFLICT (id) DO NOTHING;

INSERT INTO turnos (id, empresa_id, sucursal_id, usuario_id, fecha, hora_ingreso, hora_salida) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', CURRENT_DATE, '10:00', '18:00')
ON CONFLICT (id) DO NOTHING;