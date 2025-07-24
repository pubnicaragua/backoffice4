/*
  # Create missing tables for Solvendo Back Office

  1. New Tables
    - `cajas` - Cash registers/boxes for each branch
    - `promociones` - Promotions management (already exists but needs verification)
    - `solicitudes` - Employee requests (already exists)
    - `despachos` - Dispatch/delivery management
    - `comunicados` - Company communications/announcements

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create cajas table if not exists
CREATE TABLE IF NOT EXISTS cajas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  nombre text NOT NULL,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create despachos table
CREATE TABLE IF NOT EXISTS despachos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  sucursal_id uuid NOT NULL REFERENCES sucursales(id),
  entregado_por uuid REFERENCES usuarios(id),
  folio text,
  fecha timestamptz DEFAULT now(),
  rut text,
  direccion text,
  estado text DEFAULT 'pendiente',
  created_at timestamptz DEFAULT now()
);

-- Create despacho_detalle table
CREATE TABLE IF NOT EXISTS despacho_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  despacho_id uuid NOT NULL REFERENCES despachos(id),
  producto_id uuid NOT NULL REFERENCES productos(id),
  cantidad numeric NOT NULL,
  costo_unitario numeric NOT NULL
);

-- Create comunicados table
CREATE TABLE IF NOT EXISTS comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id),
  titulo text NOT NULL,
  comunicado text NOT NULL,
  programar_envio timestamptz,
  destinatario text DEFAULT 'todos',
  usuario_id uuid REFERENCES usuarios(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cajas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE despacho_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read cajas" ON cajas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage cajas" ON cajas FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read despachos" ON despachos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage despachos" ON despachos FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read despacho_detalle" ON despacho_detalle FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage despacho_detalle" ON despacho_detalle FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can read comunicados" ON comunicados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage comunicados" ON comunicados FOR ALL TO authenticated USING (true);