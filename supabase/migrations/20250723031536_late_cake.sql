/*
  # Fix Foreign Key Error in venta_items
  
  1. Fix the foreign key constraint error
  2. Ensure productos table has the required records
  3. Add missing productos if needed
*/

-- Insert missing productos that are referenced in venta_items
INSERT INTO productos (id, codigo, nombre, descripcion, precio, costo, tipo, unidad, activo) VALUES
('00000000-0000-0000-0000-000000000001', 'PROD001', 'Coca Cola 500ml', 'Bebida gaseosa', 1500, 1050, 'producto', 'UN', true),
('00000000-0000-0000-0000-000000000002', 'PROD002', 'Pan Hallulla', 'Pan fresco', 800, 560, 'producto', 'UN', true),
('00000000-0000-0000-0000-000000000003', 'PROD003', 'Leche 1L', 'Leche entera', 1200, 840, 'producto', 'UN', true),
('00000000-0000-0000-0000-000000000004', 'PROD004', 'Arroz 1kg', 'Arroz grado 1', 2500, 1750, 'producto', 'KG', true),
('00000000-0000-0000-0000-000000000005', 'PROD005', 'Aceite 1L', 'Aceite vegetal', 3200, 2240, 'producto', 'UN', true)
ON CONFLICT (id) DO UPDATE SET
  codigo = EXCLUDED.codigo,
  nombre = EXCLUDED.nombre,
  precio = EXCLUDED.precio,
  costo = EXCLUDED.costo,
  activo = EXCLUDED.activo;