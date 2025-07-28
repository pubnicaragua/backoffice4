/*
  # Add razon_social column to pedidos table
  
  1. Add razon_social column to store provider name directly
  2. Make proveedor_id optional (nullable)
  3. Add estado cancelado to despachos
  4. Update existing data
*/

-- Add razon_social column to pedidos if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'razon_social'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN razon_social text;
  END IF;
END $$;

-- Make proveedor_id nullable
ALTER TABLE pedidos ALTER COLUMN proveedor_id DROP NOT NULL;

-- Update existing pedidos with razon_social from clientes
UPDATE pedidos 
SET razon_social = clientes.razon_social
FROM clientes 
WHERE pedidos.proveedor_id = clientes.id 
AND pedidos.razon_social IS NULL;

-- Set default razon_social for pedidos without proveedor_id
UPDATE pedidos 
SET razon_social = 'Proveedor Desconocido' 
WHERE razon_social IS NULL;

-- Add estado cancelado to despachos if not exists
DO $$
BEGIN
  -- No need to add column, just ensure the value can be used
  -- The estado column already exists as text, so 'cancelado' is valid
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pedidos_razon_social ON pedidos(razon_social);