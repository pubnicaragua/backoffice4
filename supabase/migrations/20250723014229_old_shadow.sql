/*
  # Fix Missing Columns in Database Schema
  
  1. Add Missing Columns
    - productos.tipo (text)
    - promociones.costo (numeric)
    - pedidos.folio (text)
    
  2. Update Existing Data
    - Set default values for new columns
*/

-- Add missing columns to productos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE productos ADD COLUMN tipo text DEFAULT 'producto';
  END IF;
END $$;

-- Add missing columns to promociones table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promociones' AND column_name = 'costo'
  ) THEN
    ALTER TABLE promociones ADD COLUMN costo numeric DEFAULT 0;
  END IF;
END $$;

-- Add missing columns to pedidos table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'folio'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN folio text;
  END IF;
END $$;

-- Update existing data with default values
UPDATE productos SET tipo = 'producto' WHERE tipo IS NULL;
UPDATE promociones SET costo = precio_prom * 0.7 WHERE costo IS NULL OR costo = 0;
UPDATE pedidos SET folio = 'PED-' || id WHERE folio IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo);
CREATE INDEX IF NOT EXISTS idx_promociones_costo ON promociones(costo);
CREATE INDEX IF NOT EXISTS idx_pedidos_folio ON pedidos(folio);