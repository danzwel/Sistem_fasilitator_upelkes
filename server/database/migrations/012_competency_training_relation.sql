ALTER TABLE facilitator_competencies ADD COLUMN training_name TEXT;

CREATE INDEX IF NOT EXISTS idx_competencies_training_name ON facilitator_competencies(training_name);
