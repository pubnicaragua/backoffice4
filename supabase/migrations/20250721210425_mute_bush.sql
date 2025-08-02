/*
  # Quick Notifications System - Minimal Setup
  
  1. Create notifications table
  2. Add sample notifications
  3. No complex functions - just basic data
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  producto_id uuid,
  terminal_id uuid,
  prioridad text DEFAULT 'media',
  leida boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Users can manage notificaciones" ON notificaciones FOR ALL TO authenticated USING (true);

-- Insert sample notifications
INSERT INTO notificaciones (tipo, titulo, mensaje, prioridad) VALUES
('stock_bajo', 'Stock Bajo', 'Arroz 1kg tiene solo 15 unidades en stock', 'alta'),
('stock_bajo', 'Stock Crítico', 'Aceite 1L tiene solo 20 unidades en stock', 'media'),
('inconsistencia_pos', 'Inconsistencia POS', 'Terminal POS-001: Diferencia de 5 unidades detectada', 'alta')
ON CONFLICT DO NOTHING;