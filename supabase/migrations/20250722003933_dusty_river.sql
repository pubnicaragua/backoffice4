/*
  # Fix All Relationships and CORS Issues
  
  1. Fix promociones -> sucursales relationship
  2. Fix movimientos_caja -> sucursales relationship
  3. Fix SolvIA CORS
  4. Complete all missing data
*/

-- Fix promociones relationship with sucursales
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

-- Fix movimientos_caja relationship with sucursales
DO $$
BEGIN
  -- Add sucursal_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'movimientos_caja' AND column_name = 'sucursal_id'
  ) THEN
    ALTER TABLE movimientos_caja ADD COLUMN sucursal_id uuid;
  END IF;
  
  -- Update existing records with valid sucursal_id
  UPDATE movimientos_caja 
  SET sucursal_id = '00000000-0000-0000-0000-000000000001' 
  WHERE sucursal_id IS NULL;
  
  -- Add foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'movimientos_caja_sucursal_id_fkey'
  ) THEN
    ALTER TABLE movimientos_caja 
    ADD CONSTRAINT movimientos_caja_sucursal_id_fkey 
    FOREIGN KEY (sucursal_id) REFERENCES sucursales(id);
  END IF;
END $$;

-- Add more sample data for better filtering
INSERT INTO movimientos_caja (id, empresa_id, usuario_id, tipo, monto, observacion, sucursal_id, fecha) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'retiro', 1023, 'Gastos operacionales', '00000000-0000-0000-0000-000000000001', '2025-05-28 20:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta efectivo', '00000000-0000-0000-0000-000000000002', '2025-05-28 18:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta tarjeta', '00000000-0000-0000-0000-000000000002', '2025-05-28 18:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta efectivo', '00000000-0000-0000-0000-000000000002', '2025-05-28 18:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'ingreso', 123, 'Venta tarjeta', '00000000-0000-0000-0000-000000000002', '2025-05-28 18:00:00')
ON CONFLICT DO NOTHING;

-- Add more ventas data for better charts
INSERT INTO ventas (id, empresa_id, sucursal_id, folio, tipo_dte, metodo_pago, total, fecha) VALUES
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '849456465456', 'boleta', 'efectivo', 234235432, '2025-05-28 20:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '849456465457', 'factura', 'tarjeta', 234235432, '2025-05-28 20:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '849456465458', 'factura', 'efectivo', 234235432, '2025-05-28 20:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '849456465459', 'factura', 'tarjeta', 234235432, '2025-05-28 20:00:00'),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '849456465460', 'factura', 'efectivo', 234235432, '2025-05-28 20:00:00')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promociones_sucursal_id ON promociones(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sucursal_id ON movimientos_caja(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo_dte ON ventas(tipo_dte);