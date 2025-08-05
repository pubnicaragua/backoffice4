/*
  # Fix auditoria foreign key constraint
  
  1. Drop problematic constraint
  2. Make usuario_id nullable to avoid conflicts
*/

-- Drop the problematic foreign key constraint
ALTER TABLE auditoria DROP CONSTRAINT IF EXISTS auditoria_usuario_id_fkey;

-- Make usuario_id nullable to avoid insertion conflicts
ALTER TABLE auditoria ALTER COLUMN usuario_id DROP NOT NULL;

-- Add a simpler constraint that allows nulls
ALTER TABLE auditoria 
ADD CONSTRAINT auditoria_usuario_id_fkey 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;