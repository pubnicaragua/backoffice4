/*
  # Fix UUID Format Error
  
  1. Fix invalid UUID format in solicitudes_vacaciones
  2. Use proper UUID generation
  3. Ensure all relationships work
*/

-- Create solicitudes_vacaciones table if not exists
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
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'asistencias_usuario_id_fkey'
  ) THEN
    ALTER TABLE asistencias 
    ADD CONSTRAINT asistencias_usuario_id_fkey 
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id);
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE solicitudes_vacaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_pos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage solicitudes_vacaciones" ON solicitudes_vacaciones FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage configuracion_pos" ON configuracion_pos FOR ALL TO authenticated USING (true);

-- Insert sample data with PROPER UUIDs using gen_random_uuid()
INSERT INTO solicitudes_vacaciones (usuario_id, numero_solicitud, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado) 
SELECT 
  '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4',
  '2514',
  '2025-07-01',
  '2025-07-05',
  5,
  'Hola quiero solicitar mis vacaciones de verano desde el 1 de julio hasta el 5 de julio',
  'pendiente'
WHERE NOT EXISTS (SELECT 1 FROM solicitudes_vacaciones LIMIT 1);

-- Insert sample data for configuracion_pos
INSERT INTO configuracion_pos (empresa_id, deposito, reporte_ventas, devoluciones, usd, clp, mercado_pago, sumup, transbank, getnet, solicitar_autorizacion) 
SELECT 
  '00000000-0000-0000-0000-000000000001',
  true,
  false,
  true,
  true,
  false,
  false,
  true,
  false,
  false,
  true
WHERE NOT EXISTS (SELECT 1 FROM configuracion_pos LIMIT 1);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promociones_sucursal_id ON promociones(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_usuario_id ON asistencias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_vacaciones_usuario_id ON solicitudes_vacaciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_pos_empresa_id ON configuracion_pos(empresa_id);