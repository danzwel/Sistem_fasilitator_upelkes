ALTER TABLE reviews ADD COLUMN training_id INTEGER REFERENCES trainings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_training ON reviews(training_id);
