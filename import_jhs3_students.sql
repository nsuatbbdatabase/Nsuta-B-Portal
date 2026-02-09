-- Import JHS 3 students from Main Supabase to Career Tech Supabase
-- This script copies JHS 3 student data with only compulsory fields
-- Compulsory fields: student name (first_name, surname), class, gender, index_number
-- Note: When importing from CSV, use "Full Name" field which will be split into first_name and surname
-- RUN THIS SQL IN YOUR CAREER TECH SUPABASE PROJECT

-- Note: This script assumes you have access to query the main Supabase
-- You may need to run this manually or set up a data migration process

-- First, clear existing JHS 3 students (optional - remove if you want to keep existing data)
-- DELETE FROM jhs3_students WHERE class = 'JHS 3';

-- Insert JHS 3 students with compulsory information only
-- Only student name, class, gender, and index number are required
-- Replace the INSERT statements below with actual student data or use a migration script

-- Example data structure (replace with actual student data):
/*
INSERT INTO jhs3_students (
    id, first_name, surname, gender, class, index_number
) VALUES
('JHS3_001', 'John', 'Doe', 'Male', 'JHS 3', '1234567890'),
('JHS3_002', 'Jane', 'Smith', 'Female', 'JHS 3', '1234567891')
ON CONFLICT (id) DO UPDATE SET
    index_number = EXCLUDED.index_number,
    updated_at = NOW();
*/

-- Alternative: If you have a way to query the main Supabase, you can use:
-- Note: This requires cross-database access which may not be available
-- You might need to export from main Supabase and import here manually

-- SELECT 'Copy and adapt this data from your main Supabase students table' as instruction;

-- After importing, you can update index numbers individually:
-- UPDATE jhs3_students SET index_number = '1234567890' WHERE id = 'JHS3_001';
-- UPDATE jhs3_students SET house = 'Red House' WHERE id = 'JHS3_001';