-- Migration: Add marked_by column (simplified - no constraint recreation)
-- Description: Tracks which teacher submitted each result record
-- Date: December 9, 2025
-- Note: This migration avoids dropping/recreating constraints

-- Add marked_by column to results table (if it doesn't exist)
ALTER TABLE results
ADD COLUMN IF NOT EXISTS marked_by TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN results.marked_by IS 'Teacher name or ID who submitted this result';

-- Add marked_by column to promotion_exams table (if it doesn't exist)
ALTER TABLE promotion_exams
ADD COLUMN IF NOT EXISTS marked_by TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN promotion_exams.marked_by IS 'Teacher name or ID who submitted this promotion exam record';

-- Add indexes on marked_by for faster filtering (these are safe to add)
CREATE INDEX IF NOT EXISTS idx_results_marked_by ON results(marked_by);
CREATE INDEX IF NOT EXISTS idx_promotion_exams_marked_by ON promotion_exams(marked_by);

-- NOTE: For upsert to work, we rely on the existing primary key or id column
-- The application code should use the primary key for conflict resolution
-- rather than specifying explicit onConflict column names
