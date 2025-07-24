/*
  # Fix Pedidos Table - Add Missing Columns
  
  1. Add Missing Columns to pedidos table
    - sucursal_id (uuid, foreign key to sucursales)
    - folio (text)
    - Update existing records
    
  2. Ensure all relationships work
*/

-- Add missing columns to pedidos table
DO $$
BEGIN
  -- Add sucursal_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN sucursal_id uuid;
  END IF;
  
  -- Add folio column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'folio'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN folio text;
  END IF;
END $$;

-- Update existing records with valid data
UPDATE pedidos SET 
  sucursal_id = '00000000-0000-0000-0000-000000000001',
  folio = 'PED-' || EXTRACT(EPOCH FROM created_at)::text
WHERE sucursal_id IS NULL OR folio IS NULL;

-- Add foreign key constraint for sucursal_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pedidos_sucursal_id_fkey'
  ) THEN
    ALTER TABLE pedidos 
    ADD CONSTRAINT pedidos_sucursal_id_fkey 
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pedidos_sucursal_id ON pedidos(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_folio ON pedidos(folio);