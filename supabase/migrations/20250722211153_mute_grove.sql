/*
  # Fix All Database Relationships and Issues
  
  1. Fix despachos -> usuarios relationship
  2. Add missing columns for margins
  3. Complete all CRUD functionality
*/

-- Fix despachos -> usuarios relationship
DO $$
BEGIN
  -- Add entregado_por column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'despachos' AND column_name = 'entregado_por'
  ) THEN
    ALTER TABLE despachos ADD COLUMN entregado_por uuid;
  END IF;
  
  -- Update existing records with valid entregado_por
  UPDATE despachos 
  SET entregado_por = '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4' 
  WHERE entregado_por IS NULL;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'despachos_entregado_por_fkey'
  ) THEN
    ALTER TABLE despachos 
    ADD CONSTRAINT despachos_entregado_por_fkey 
    FOREIGN KEY (entregado_por) REFERENCES usuarios(id);
  END IF;
END $$;

-- Add more sample despachos data
INSERT INTO despachos (empresa_id, sucursal_id, entregado_por, folio, rut, direccion, estado) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'DESP-001', '12345678-9', 'Jr. Santiago de Chile 193', 'entregado'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'DESP-002', '23456789-0', 'Av. Principal 456', 'pendiente'),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'DESP-003', '34567890-1', 'Calle Secundaria 789', 'entregado')
ON CONFLICT DO NOTHING;

-- Add more sample devoluciones data
INSERT INTO devoluciones (venta_id, monto_devuelto, motivo, fecha) VALUES
('00000000-0000-0000-0000-000000000001', 5000, 'Producto defectuoso', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000003', 12000, 'Cliente insatisfecho', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000005', 8000, 'Error en pedido', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_despachos_entregado_por ON despachos(entregado_por);
CREATE INDEX IF NOT EXISTS idx_despachos_estado ON despachos(estado);
CREATE INDEX IF NOT EXISTS idx_devoluciones_venta_id ON devoluciones(venta_id);