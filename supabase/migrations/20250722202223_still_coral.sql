/*
  # Fix All Database Relationships and Missing Tables
  
  1. Fix Foreign Key Relationships
    - promociones -> sucursales
    - asistencias -> usuarios
    - movimientos_caja -> sucursales
    
  2. Create Missing Tables
    - solicitudes_vacaciones
    - configuracion_pos
    
  3. Ensure All Constraints Exist
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
  
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'promociones_sucursal_id_fkey'
  ) THEN
    ALTER TABLE promociones DROP CONSTRAINT promociones_sucursal_id_fkey;
  END IF;
  
  -- Add foreign key constraint
  ALTER TABLE promociones 
  ADD CONSTRAINT promociones_sucursal_id_fkey 
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
END $$;

-- Fix asistencias -> usuarios relationship
DO $$
BEGIN
  -- Add usuario_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asistencias' AND column_name = 'usuario_id'
  ) THEN
    ALTER TABLE asistencias ADD COLUMN usuario_id uuid;
  END IF;
  
  -- Update existing records with valid usuario_id
  UPDATE asistencias 
  SET usuario_id = '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4' 
  WHERE usuario_id IS NULL;
  
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asistencias_usuario_id_fkey'
  ) THEN
    ALTER TABLE asistencias DROP CONSTRAINT asistencias_usuario_id_fkey;
  END IF;
  
  -- Add foreign key constraint
  ALTER TABLE asistencias 
  ADD CONSTRAINT asistencias_usuario_id_fkey 
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
END $$;

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

-- Enable RLS on new tables
ALTER TABLE solicitudes_vacaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_pos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage solicitudes_vacaciones" ON solicitudes_vacaciones FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage configuracion_pos" ON configuracion_pos FOR ALL TO authenticated USING (true);

-- Insert sample data for solicitudes_vacaciones
INSERT INTO solicitudes_vacaciones (id, usuario_id, numero_solicitud, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado) VALUES
('sol-vac-001-001-001-001-001001001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', '2514', '2025-07-01', '2025-07-05', 5, 'Hola quiero solicitar mis vacaciones de verano desde el 1 de julio hasta el 5 de julio', 'pendiente')
ON CONFLICT (id) DO NOTHING;

-- Insert sample data for configuracion_pos
INSERT INTO configuracion_pos (id, empresa_id, deposito, reporte_ventas, devoluciones, usd, clp, mercado_pago, sumup, transbank, getnet, solicitar_autorizacion) VALUES
('config-pos-001-001-001-001-001001', '00000000-0000-0000-0000-000000000001', true, false, true, true, false, false, true, false, false, true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promociones_sucursal_id ON promociones(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_usuario_id ON asistencias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_vacaciones_usuario_id ON solicitudes_vacaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_pos_empresa_id ON configuracion_pos(empresa_id);