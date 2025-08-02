/*
  # Fix despachos -> usuarios relationship
  
  1. Add missing foreign key relationship
  2. Update existing data with valid usuario_id
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

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_despachos_entregado_por ON despachos(entregado_por);