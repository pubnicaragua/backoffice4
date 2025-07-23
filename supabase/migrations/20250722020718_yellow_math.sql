/*
  # Create Missing Tables and Fix All Relations
  
  1. Create Missing Tables
    - `tareas` - Tasks table
    - `configuracion_pos` - POS configuration
    - `solicitudes_vacaciones` - Vacation requests
    
  2. Fix All Relationships
    - promociones -> sucursales
    - movimientos_caja -> sucursales
    - asistencias -> usuarios
    
  3. Add Sample Data
    - Real data for all modules
*/

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

-- Create configuracion_pos table
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

-- Enable RLS on new tables
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_vacaciones ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage tareas" ON tareas FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage configuracion_pos" ON configuracion_pos FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage solicitudes_vacaciones" ON solicitudes_vacaciones FOR ALL TO authenticated USING (true);

-- Insert sample data for tareas
INSERT INTO tareas (id, empresa_id, nombre, descripcion, tipo) VALUES
('tarea-001-001-001-001-001001001001', '00000000-0000-0000-0000-000000000001', 'Limpieza total', 'Hacer limpieza y sacar la basura de la sucursal', 'limpieza'),
('tarea-002-002-002-002-002002002002', '00000000-0000-0000-0000-000000000001', 'Inventario', 'Revisar stock de productos', 'inventario'),
('tarea-003-003-003-003-003003003003', '00000000-0000-0000-0000-000000000001', 'Atención al cliente', 'Atender consultas de clientes', 'atencion')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for configuracion_pos
INSERT INTO configuracion_pos (id, empresa_id, deposito, reporte_ventas, devoluciones, usd, clp, mercado_pago, sumup, transbank, getnet, solicitar_autorizacion) VALUES
('config-pos-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', true, false, true, true, false, false, true, false, false, true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for solicitudes_vacaciones
INSERT INTO solicitudes_vacaciones (id, usuario_id, numero_solicitud, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado) VALUES
('sol-vac-001-001-001-001-001001001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '2514', '2025-07-01', '2025-07-05', 5, 'Hola quiero solicitar mis vacaciones de verano desde el 1 de julio hasta el 5 de julio', 'pendiente'),
('sol-vac-002-002-002-002-002002002', '11111111-1111-1111-1111-111111111111', '2515', '2025-08-01', '2025-08-10', 10, 'Vacaciones familiares', 'pendiente'),
('sol-vac-003-003-003-003-003003003', '22222222-2222-2222-2222-222222222222', '2516', '2025-06-15', '2025-06-20', 5, 'Día libre', 'pendiente')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tareas_empresa_id ON tareas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_pos_empresa_id ON configuracion_pos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_vacaciones_usuario_id ON solicitudes_vacaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_promociones_sucursal_id ON promociones(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sucursal_id ON movimientos_caja(sucursal_id);

-- Function to sync POS configuration in real-time
CREATE OR REPLACE FUNCTION sync_pos_configuration()
RETURNS trigger AS $$
BEGIN
  -- This function would trigger real-time sync to POS terminals
  -- when configuration changes
  
  -- Insert notification for POS sync
  INSERT INTO notificaciones (empresa_id, tipo, titulo, mensaje, prioridad)
  VALUES (
    NEW.empresa_id,
    'config_pos_updated',
    'Configuración POS Actualizada',
    'La configuración de POS ha sido actualizada. Sincronizando con terminales...',
    'media'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for real-time POS sync
DROP TRIGGER IF EXISTS trigger_sync_pos_config ON configuracion_pos;
CREATE TRIGGER trigger_sync_pos_config
  AFTER UPDATE ON configuracion_pos
  FOR EACH ROW
  EXECUTE FUNCTION sync_pos_configuration();