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
