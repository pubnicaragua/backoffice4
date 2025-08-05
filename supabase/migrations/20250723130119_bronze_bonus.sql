/*
  # Create missing tareas table
  
  1. Create tareas table that is referenced but missing
  2. Add sample data
*/

-- Create tareas table
CREATE TABLE IF NOT EXISTS tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  nombre text NOT NULL,
  descripcion text,
  tipo text DEFAULT 'limpieza',
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage tareas" ON tareas FOR ALL TO authenticated USING (true);

-- Insert sample tareas
INSERT INTO tareas (id, empresa_id, nombre, descripcion, tipo) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Limpieza total', 'Hacer limpieza y sacar la basura de la sucursal', 'limpieza'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Inventario', 'Revisar stock de productos', 'inventario'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Atención al cliente', 'Atender consultas de clientes', 'atencion')
ON CONFLICT (id) DO NOTHING;