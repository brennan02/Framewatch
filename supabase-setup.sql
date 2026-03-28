-- ============================================
-- CRITICAL: Add unit_name column to categories
-- ============================================
-- This is the ONLY new column needed
ALTER TABLE categories
ADD COLUMN unit_name TEXT REFERENCES units(name) ON DELETE SET NULL;

-- ============================================
-- If categories.unit_name already exists:
-- Just run this to re-enable the FK constraint
-- ============================================
-- ALTER TABLE categories
-- ADD CONSTRAINT categories_unit_fk FOREIGN KEY (unit_name) REFERENCES units(name) ON DELETE SET NULL;

-- ============================================
-- Unit Conversions Table
-- ============================================
-- Stores conversion factors between units for searching/comparison
-- Example: 1 foot = 12 inches (source_unit='feet', target_unit='inches', factor=12)
-- Conversions are company-specific (single company MVP = Tuckertown)

CREATE TABLE IF NOT EXISTS unit_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_unit TEXT NOT NULL REFERENCES units(name) ON DELETE CASCADE,
  target_unit TEXT NOT NULL REFERENCES units(name) ON DELETE CASCADE,
  conversion_factor DECIMAL(10, 4) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_unit, target_unit)
);
