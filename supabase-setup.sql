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

-- ============================================
-- Keep Buildings and Job-linked Logs Synced
-- ============================================
-- When a building is deleted, remove related job-linked logs so Jobs pages stay in sync.
-- This complements app-side cleanup and protects integrity for direct DB deletes.

CREATE OR REPLACE FUNCTION cleanup_logs_on_building_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM inventory_logs
  WHERE LOWER(TRIM(COALESCE(job_name, ''))) = LOWER(TRIM(OLD.name))
    AND action = 'out'
    AND quantity < 0;

  DELETE FROM waste_logs
  WHERE LOWER(TRIM(COALESCE(job_name, ''))) = LOWER(TRIM(OLD.name));

  DELETE FROM used_materials_logs
  WHERE LOWER(TRIM(COALESCE(job_name, ''))) = LOWER(TRIM(OLD.name));

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cleanup_logs_on_building_delete ON buildings;

CREATE TRIGGER trg_cleanup_logs_on_building_delete
AFTER DELETE ON buildings
FOR EACH ROW
EXECUTE FUNCTION cleanup_logs_on_building_delete();
