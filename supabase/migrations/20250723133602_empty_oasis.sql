/*
  # Fix Missing Columns - Final Fix
  
  1. Add missing columns to promociones and pedidos
  2. Ensure all CRUD operations work
*/

-- Add missing columns to promociones table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promociones' AND column_name = 'numero_limite'
  ) THEN
    ALTER TABLE promociones ADD COLUMN numero_limite integer DEFAULT 50;
  END IF;
END $$;

-- Add missing columns to pedidos table  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'fecha'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN fecha timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing data
UPDATE promociones SET numero_limite = 50 WHERE numero_limite IS NULL;
UPDATE pedidos SET fecha = created_at WHERE fecha IS NULL;