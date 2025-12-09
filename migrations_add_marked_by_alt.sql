-- Alternative Migration: Add marked_by and use simple primary key for upsert
-- This approach creates a single unique constraint that works reliably

-- Add marked_by column to results table
ALTER TABLE results
ADD COLUMN marked_by TEXT;

COMMENT ON COLUMN results.marked_by IS 'Teacher name or ID who submitted this result';

-- Add marked_by column to promotion_exams table
ALTER TABLE promotion_exams
ADD COLUMN marked_by TEXT;

COMMENT ON COLUMN promotion_exams.marked_by IS 'Teacher name or ID who submitted this promotion exam record';

-- For results table: Create a composite unique constraint
-- This handles both regular subjects and Career Tech with area
-- Using COALESCE to treat NULL area as a placeholder for regular subjects
ALTER TABLE results
ADD CONSTRAINT uq_results_composite UNIQUE (student_id, subject, term, year, COALESCE(area, ''));

-- For promotion_exams table: Create a composite unique constraint
ALTER TABLE promotion_exams
ADD CONSTRAINT uq_promo_exams_composite UNIQUE (student_id, class, subject, term, year, COALESCE(area, ''));

-- Add indexes on marked_by for faster filtering
CREATE INDEX idx_results_marked_by ON results(marked_by);
CREATE INDEX idx_promotion_exams_marked_by ON promotion_exams(marked_by);
