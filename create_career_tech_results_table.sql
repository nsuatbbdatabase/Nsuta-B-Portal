-- Create career_tech_results table for storing Career Tech marks separately by area
-- This table isolates Career Tech marks from the main results table to avoid conflicts
-- between different area teachers (Pre-Tech, Home Economics, etc.)

CREATE TABLE IF NOT EXISTS career_tech_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  area VARCHAR(255) NOT NULL, -- e.g., 'Pre-Tech', 'Home Economics'
  class_score INTEGER DEFAULT 0, -- SBA/Continuous Assessment score (0-50)
  exam_score INTEGER DEFAULT 0, -- Exam score (0-50)
  individual INTEGER DEFAULT 0, -- Individual component for SBA
  "group" INTEGER DEFAULT 0, -- Group component for SBA
  class_test INTEGER DEFAULT 0, -- Class test component for SBA
  project INTEGER DEFAULT 0, -- Project component for SBA
  term VARCHAR(100), -- e.g., '1st Term', '2nd Term'
  year INTEGER, -- e.g., 2024, 2025
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Note: No foreign key constraint because students table is in the main Supabase project
  -- student_id values will be UUIDs that reference students in the main project
  
  -- Unique constraint: one record per student/area/term/year
  CONSTRAINT unique_career_tech_entry UNIQUE (student_id, area, term, year)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_career_tech_student_id ON career_tech_results(student_id);
CREATE INDEX IF NOT EXISTS idx_career_tech_term_year ON career_tech_results(term, year);
CREATE INDEX IF NOT EXISTS idx_career_tech_area ON career_tech_results(area);

-- Create updated_at trigger to automatically update the timestamp
CREATE OR REPLACE FUNCTION update_career_tech_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_career_tech_results_updated_at ON career_tech_results;
CREATE TRIGGER trigger_career_tech_results_updated_at
  BEFORE UPDATE ON career_tech_results
  FOR EACH ROW
  EXECUTE FUNCTION update_career_tech_results_updated_at();

-- Grant permissions if needed (adjust roles as necessary)
GRANT SELECT, INSERT, UPDATE, DELETE ON career_tech_results TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
