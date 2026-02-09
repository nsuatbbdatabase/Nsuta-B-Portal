-- Quick fix for jhs3_students table - Add missing svc column
-- Run this in your Career Tech Supabase project if the table already exists

-- Add the svc column if it doesn't exist
ALTER TABLE jhs3_students
ADD COLUMN IF NOT EXISTS svc VARCHAR(50);

-- Add index for the svc column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_jhs3_students_svc ON jhs3_students(svc);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'jhs3_students' AND column_name = 'svc';