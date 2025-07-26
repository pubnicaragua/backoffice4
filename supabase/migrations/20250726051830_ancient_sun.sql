/*
  # Agregar razon_social directamente a tabla pedidos
  
  1. Agregar columna razon_social a pedidos
  2. Hacer proveedor_id opcional
  3. Permitir almacenar razon_social directamente en pedidos
*/

-- Agregar columna razon_social a la tabla pedidos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedidos' AND column_name = 'razon_social'
  ) THEN
    ALTER TABLE pedidos ADD COLUMN razon_social text;
  END IF;
END $$;

-- Hacer proveedor_id opcional (nullable)
ALTER TABLE pedidos ALTER COLUMN proveedor_id DROP NOT NULL;

-- Actualizar pedidos existentes con razon_social de clientes
UPDATE pedidos 
SET razon_social = clientes.razon_social
FROM clientes 
WHERE pedidos.proveedor_id = clientes.id 
AND pedidos.razon_social IS NULL;

-- Crear índice para búsquedas por razon_social
CREATE INDEX IF NOT EXISTS idx_pedidos_razon_social ON pedidos(razon_social);