/*
  # Fix productos table - Add missing unidad column
  
  1. Add missing unidad column to productos table
  2. Update existing records with default values
*/

-- Add unidad column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'productos' AND column_name = 'unidad'
  ) THEN
    ALTER TABLE productos ADD COLUMN unidad text DEFAULT 'UN';
  END IF;
END $$;

-- Update existing records with default values
UPDATE productos SET unidad = 'UN' WHERE unidad IS NULL;