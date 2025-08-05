/*
  # Add Missing Columns - Final Fix
  
  1. Add missing columns to pedidos and promociones
  2. Ensure all CRUD operations work
*/

-- Add sucursal_id column to pedidos if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN sucursal_id uuid REFERENCES sucursales(id);
  END IF;
END $$;

-- Add precio_prom column to promociones if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'promociones' AND column_name = 'precio_prom'
  ) THEN
    ALTER TABLE promociones ADD COLUMN precio_prom numeric DEFAULT 0;
  END IF;
END $$;

-- Update existing data
UPDATE pedidos SET sucursal_id = '00000000-0000-0000-0000-000000000001' WHERE sucursal_id IS NULL;
UPDATE promociones SET precio_prom = 1000 WHERE precio_prom IS NULL OR precio_prom = 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pedidos_sucursal_id ON pedidos(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_promociones_precio_prom ON promociones(precio_prom);