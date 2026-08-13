ALTER TABLE trainings ADD COLUMN role TEXT;
ALTER TABLE trainings ADD COLUMN category TEXT NOT NULL DEFAULT 'teaching_experience';
