ALTER TABLE facilitators ADD COLUMN rank TEXT;
ALTER TABLE facilitators ADD COLUMN office_address TEXT;
ALTER TABLE facilitators ADD COLUMN home_address TEXT;

ALTER TABLE facilitator_competencies ADD COLUMN started_teaching_year INTEGER;

UPDATE facilitators
SET office_address = address
WHERE office_address IS NULL AND address IS NOT NULL;
