# Career Tech Supabase Setup Guide

## Overview
This application now uses **two separate Supabase projects**:
- **Main Supabase**: Contains students, teachers, results, and other core data
- **Career Tech Supabase**: Contains Career Tech results only (new, separate project)

This separation prevents data conflicts and allows independent management of Career Tech marks.

---

## Step 1: Create a New Supabase Project for Career Tech

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Click **New Project**
4. Fill in:
   - **Project Name**: `nsuta-career-tech` (or any name you prefer)
   - **Database Password**: Create a strong password
   - **Region**: Select the same region as your main project (for consistency)
5. Click **Create New Project** and wait for it to be created (5-10 minutes)

---

## Step 2: Create the Career Tech Results Table

Once your new Career Tech project is created:

1. Go to the **SQL Editor** in your new Career Tech Supabase project
2. Click **New Query**
3. Copy and paste the entire SQL script from `create_career_tech_results_table.sql`
4. Click **Run** to create the table

The table will have:
- `id` (UUID primary key)
- `student_id` (References students in your main Supabase)
- `area` (Pre-Tech, Home Economics, etc.)
- `class_score` (0-50)
- `exam_score` (0-50)
- `individual`, `group`, `class_test`, `project` (SBA components)
- `term`, `year`
- Unique constraint on `(student_id, area, term, year)` to prevent duplicates

---

## Step 3: Get Your Career Tech Supabase Credentials

In your new Career Tech Supabase project:

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **Anon Public Key** (the public API key)

---

## Step 4: Update Your Application Code

You need to update the placeholders in two files:

### File 1: `teacher-dashboard.js` (around line 646)
Find this section:
```javascript
// ✅ Supabase client setup - Career Tech project (career_tech_results table only)
// Replace with your Career Tech Supabase URL and ANON key
const supabaseCareerTech = createClient(
  'YOUR_CAREER_TECH_SUPABASE_URL', // Replace with your Career Tech Supabase URL
  'YOUR_CAREER_TECH_ANON_KEY' // Replace with your Career Tech Supabase ANON key
);
```

Replace:
- `YOUR_CAREER_TECH_SUPABASE_URL` → Paste your Career Tech Project URL
- `YOUR_CAREER_TECH_ANON_KEY` → Paste your Career Tech Anon Public Key

### File 2: `report.js` (around line 53)
Find this section:
```javascript
// ✅ Supabase client setup - Career Tech project
const supabaseCareerTech = createClient(
  'YOUR_CAREER_TECH_SUPABASE_URL', // Replace with your Career Tech Supabase URL
  'YOUR_CAREER_TECH_ANON_KEY' // Replace with your Career Tech Supabase ANON key
);
```

Replace with the same credentials from Step 3.

---

## Step 5: Test the Setup

1. Open your application in a web browser
2. Log in as a teacher who teaches Career Tech
3. Navigate to **Teacher Dashboard** → **SBA** or **Exam**
4. Select **Career Tech** and an **Area** (Pre-Tech, Home Economics)
5. Enter some marks for a few students
6. Click **Submit**
7. Verify that:
   - The marks are saved (no errors)
   - The marks appear when you reload the page
   - Different areas can have independent marks for the same student

---

## Important Notes

⚠️ **Do NOT modify your main Supabase schema** - All existing tables remain there
✅ **Career Tech data is isolated** - Only Career Tech results go to the separate project
✅ **Regular subjects unaffected** - English, Maths, Science, etc. continue to work from main Supabase
✅ **Report cards work correctly** - The app automatically merges data from both projects when generating reports

---

## Troubleshooting

### Issue: "Network error" when submitting Career Tech marks
- **Cause**: Career Tech Supabase credentials are incorrect or missing
- **Fix**: Double-check that you've correctly copied the URL and Anon Key from Career Tech Supabase

### Issue: Career Tech marks not showing up
- **Cause**: The table may not exist in Career Tech Supabase
- **Fix**: Run the SQL script from Step 2 again

### Issue: Can submit but can't retrieve marks
- **Cause**: Different student IDs between projects
- **Note**: This is expected - the student ID should match the one in your main Supabase students table

---

## Data Structure

### Main Supabase (`results` table)
```
student_id, subject, class_score, exam_score, individual, group, class_test, project, term, year
```

### Career Tech Supabase (`career_tech_results` table)
```
student_id, area, class_score, exam_score, individual, group, class_test, project, term, year
```

The unique constraint on `(student_id, area, term, year)` in Career Tech Supabase allows:
- Multiple areas per student (Pre-Tech and Home Economics)
- Different marks for each area
- No conflicts between area teachers

---

## Support

If you encounter any issues:
1. Check the browser console (F12 → Console tab) for error messages
2. Verify your Supabase credentials are correct
3. Ensure the Career Tech Supabase table was created successfully
4. Check that both projects are in the same region (optional but recommended)
