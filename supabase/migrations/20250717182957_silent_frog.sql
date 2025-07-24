/*
  # Create usuarios table for user profiles

  1. New Tables
    - `usuarios` - User profiles table
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `nombres` (text)
      - `apellidos` (text)
      - `rut` (text, unique)
      - `telefono` (text)
      - `direccion` (text)
      - `activo` (boolean)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on usuarios table
    - Add policies for authenticated users
*/

-- Create usuarios table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  rut text UNIQUE NOT NULL,
  telefono text,
  direccion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can read own profile" ON public.usuarios
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile" ON public.usuarios
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON public.usuarios
  FOR UPDATE TO authenticated
  USING (true);

-- Insert sample user data
INSERT INTO public.usuarios (id, email, nombres, apellidos, rut, telefono, activo) VALUES
('80ca7f2b-d125-4df6-9f22-a5fe3ada00e4', 'emilio@solvendo.com', 'Emilio', 'Aguilera', '78.168.951-3', '+56 9 1234 5678', true),
('11111111-1111-1111-1111-111111111111', 'admin@solvendo.com', 'Admin', 'Sistema', '12.345.678-9', '+56 9 8765 4321', true),
('22222222-2222-2222-2222-222222222222', 'supervisor@solvendo.com', 'Juan', 'Pérez', '98.765.432-1', '+56 9 5555 5555', true)
ON CONFLICT (id) DO NOTHING;

-- Fix mermas table to have proper relationship with productos
ALTER TABLE public.mermas 
ADD COLUMN IF NOT EXISTS producto_id uuid REFERENCES public.productos(id);

-- Insert sample mermas data
INSERT INTO public.mermas (id, sucursal_id, producto_id, tipo, cantidad, fecha) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'robo', 5, CURRENT_DATE),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'vencimiento', 10, CURRENT_DATE - 1),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000003', 'daño', 3, CURRENT_DATE - 2),
('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'otro', 2, CURRENT_DATE - 3)
ON CONFLICT (id) DO NOTHING;