ALTER TABLE trainings ADD COLUMN start_date TEXT;
ALTER TABLE trainings ADD COLUMN end_date TEXT;
ALTER TABLE trainings ADD COLUMN color TEXT NOT NULL DEFAULT '#9f58cc';

UPDATE trainings SET start_date = event_date, end_date = event_date WHERE start_date IS NULL;
