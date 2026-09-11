ALTER TABLE trainings ADD COLUMN is_catalog_only INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_trainings_catalog_only ON trainings(is_catalog_only);
