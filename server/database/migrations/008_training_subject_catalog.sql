CREATE TABLE IF NOT EXISTS training_subject_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO training_subject_catalog (name)
SELECT DISTINCT TRIM(name) FROM facilitator_competencies WHERE TRIM(name) <> '';

INSERT OR IGNORE INTO training_subject_catalog (name)
SELECT DISTINCT TRIM(material) FROM trainings WHERE TRIM(COALESCE(material, '')) <> '';
