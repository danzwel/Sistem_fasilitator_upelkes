ALTER TABLE facilitator_educations ADD COLUMN start_date TEXT;
ALTER TABLE facilitator_educations ADD COLUMN end_date TEXT;

UPDATE facilitator_educations
SET end_date = printf('%04d-01', graduation_year)
WHERE end_date IS NULL AND graduation_year IS NOT NULL;
