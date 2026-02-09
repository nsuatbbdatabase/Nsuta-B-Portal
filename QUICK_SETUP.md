# Career Tech Supabase - Quick Setup Card

## 🚀 Quick Setup (5 Minutes)

### 1. Create New Supabase Project
```
supabase.com → New Project
Name: nsuta-career-tech (or similar)
Region: [Same as your main project]
```

### 2. Get Credentials from Career Tech Project
Go to **Settings → API**
- Copy **Project URL** → `YOUR_CAREER_TECH_SUPABASE_URL`
- Copy **Anon Public Key** → `YOUR_CAREER_TECH_ANON_KEY`

### 3. Run SQL Script
In **SQL Editor → New Query**
```
[Paste entire content of create_career_tech_results_table.sql]
Click RUN
```

### 4. Update Code
**File 1: teacher-dashboard.js (line 650)**
```javascript
const supabaseCareerTech = createClient(
  'https://xxxxx.supabase.co',     // ← YOUR_CAREER_TECH_SUPABASE_URL
  'eyJhbGciOi...'                    // ← YOUR_CAREER_TECH_ANON_KEY
);
```

**File 2: report.js (line 57)**
```javascript
const supabaseCareerTech = createClient(
  'https://xxxxx.supabase.co',     // ← YOUR_CAREER_TECH_SUPABASE_URL
  'eyJhbGciOi...'                    // ← YOUR_CAREER_TECH_ANON_KEY
);
```

### 5. Test
- Log in as Career Tech teacher
- Submit marks for different areas
- Verify they save ✓

---

## 📋 What's Different Now

| Component | Before | After |
|-----------|--------|-------|
| **Supabase Projects** | 1 (Main) | 2 (Main + Career Tech) |
| **Results Table** | Main Supabase | Main Supabase |
| **Career Tech Results** | Main Supabase | Career Tech Supabase |
| **Area Conflicts** | Could happen | Prevented |
| **Data Isolation** | Mixed | Separated |

---

## 🔑 Credentials Format

**Career Tech Supabase Project URL** (from Settings → API)
```
https://[random-string].supabase.co
Example: https://zvkwyqznbpqrmlvbnqvi.supabase.co
```

**Career Tech Anon Public Key** (from Settings → API)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
(Long string starting with "eyJhbGci")
```

---

## ✅ Verification Checklist

- [ ] New Supabase project created
- [ ] SQL script executed in Career Tech project
- [ ] Career Tech Project URL copied
- [ ] Career Tech Anon Key copied
- [ ] teacher-dashboard.js updated (lines 650-651)
- [ ] report.js updated (lines 57-58)
- [ ] Marks can be submitted for Career Tech
- [ ] Marks persist after page reload
- [ ] Different areas have independent marks
- [ ] Report card shows all areas correctly

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| "Network error" when submitting | Check credentials are correct |
| Career Tech marks not showing | Ensure SQL script was executed |
| Only main Supabase working | Verify both client initializations exist |
| Can't access Career Tech Supabase | Check project URL and API key |

---

## 📞 Need Help?

1. Check **CAREER_TECH_SETUP.md** for detailed guide
2. Check **DUAL_SUPABASE_IMPLEMENTATION.md** for architecture overview
3. Look at browser console (F12) for error messages
4. Verify SQL script created the table successfully

---

## 🎯 End Result

✓ Main Supabase: All original data intact (students, teachers, results, etc.)
✓ Career Tech Supabase: Career Tech marks isolated and protected
✓ JHS 3 Mock Exams: Admin-entered marks separate from teacher marks
✓ No more conflicts between area teachers
✓ Report cards work correctly
✓ Everything backwards compatible

---

## 📝 JHS 3 Mock Exams Setup

### Database Setup
Run the SQL script in your **Career Tech Supabase project** (not the main project):
```
[Paste entire content of create_mock_exam_marks_table.sql]
Click RUN
```

Run the JHS 3 students schema script in your **Career Tech Supabase project**:
```
[Paste entire content of create_jhs3_students_table.sql]
Click RUN
```

Import JHS 3 students from main database (optional - can be done via admin interface):
```
[Paste entire content of import_jhs3_students.sql]
Click RUN
```

### Features
- **Admin Entry**: Mock marks entered by admin, not teachers
- **Separate Storage**: Uses `mock_exam_marks` table, not regular `results` table
- **Report Integration**: Mock reports use admin-entered marks
- **Best Six Calculation**: Aggregates grade points from top 6 subjects
- **Compulsory Fields**: Only student name, class, gender, and index number required for import
- **CSV Import**: Use "Full Name" field which automatically splits into first_name and surname
- **Template Download**: Download pre-formatted CSV template for JHS 3 student import

### Usage
1. Admin clicks "JHS 3 Mock Exams" tile
2. Select term and academic year
3. Click "Load Students" to see JHS 3 students
4. Enter marks for each subject (0-100)
5. Click "Save All Marks"
6. Generate reports with "Mock" exam type selected
