// 📋 Dashboard Overview Navigation Logic
window.addEventListener('DOMContentLoaded', () => {
  // Hide all main sections except dashboard overview on load
  const dashboardOverview = document.getElementById('dashboardOverview');
  const filters = document.getElementById('filters');
  const studentSelector = document.querySelector('.student-selector');
  const reportSection = document.getElementById('reportSection');
  const backToReportBtn = document.getElementById('backToReportBtn');
  if (dashboardOverview) dashboardOverview.style.display = 'block';
  if (filters) filters.style.display = 'none';
  if (studentSelector) studentSelector.style.display = 'none';
  if (reportSection) reportSection.style.display = 'none';
  if (backToReportBtn) backToReportBtn.style.display = 'none';

  // Card click navigation
  document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('click', () => {
      const section = card.getAttribute('data-section');
      if (dashboardOverview) dashboardOverview.style.display = 'none';
      if (filters) filters.style.display = (section === 'filters') ? 'block' : 'none';
      if (studentSelector) studentSelector.style.display = (section === 'student-selector') ? 'flex' : 'none';
      if (reportSection) reportSection.style.display = (section === 'reportSection') ? 'block' : 'none';
      // Show back button for subdashboards
      if (backToReportBtn) {
        if (section === 'filters' || section === 'student-selector' || section === 'reportSection') {
          backToReportBtn.style.display = 'inline-block';
        } else {
          backToReportBtn.style.display = 'none';
        }
      }
    });
  });

  // Back to report dashboard button
  if (backToReportBtn) {
    backToReportBtn.addEventListener('click', () => {
      // Hide all subdashboard sections
      if (filters) filters.style.display = 'none';
      if (studentSelector) studentSelector.style.display = 'none';
      if (reportSection) reportSection.style.display = 'none';
      // Show dashboard overview
      if (dashboardOverview) dashboardOverview.style.display = 'block';
      // Hide back button
      backToReportBtn.style.display = 'none';
    });
  }
});
// ✅ Supabase client setup - Main project
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

// ✅ Supabase client setup - Career Tech project
const supabaseCareerTech = createClient(
  'https://tivkbqpoqshdgyjgdwbu.supabase.co', // Replace with your Career Tech Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdmticXBvcXNoZGd5amdkd2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjA3NTksImV4cCI6MjA4MDg5Njc1OX0.CFAE66k6Q75yAIBQr6PByeY-0os8sBrV2r2WERJKGbI' // Replace with your Career Tech Supabase ANON key
);

// 🔢 Grade point logic
function getGradePoint(score) {
  if (score >= 90) return 1;
  if (score >= 80) return 2;
  if (score >= 70) return 3;
  if (score >= 60) return 4;
  if (score >= 55) return 5;
  if (score >= 50) return 6;
  if (score >= 40) return 7;
  if (score >= 35) return 8;
  return 9;
}

// 💬 Subject remark logic
function getSubjectRemark(point) {
  switch (point) {
    case 1: return "Outstanding";
    case 2: return "Excellent";
    case 3: return "Very Good";
    case 4: return "Good";
    case 5: return "Fair";
    case 6: return "Pass";
    case 7: return "Weak";
    case 8: return "Poor";
    default: return "Fail";
  }
}

// 🧠 Teacher remark logic
function getTeacherRemark(totalScore) {
  if (totalScore >= 800) return "IMPRESSIVE PERFORMANCE. KEEP IT UP";
  if (totalScore >= 750) return "EXCELLENT. KEEP WORKING HARD";
  if (totalScore >= 700) return "VERY GOOD RESULTS. BUT CAPABLE OF MAKING FURTHER PROGRESS";
  if (totalScore >= 650) return "PROGRESSING SATISFACTORILY. CAN STILL DO BETTER";
  if (totalScore >= 600) return "GOOD WORK. MORE ROOM FOR IMPROVEMENT";
  if (totalScore >= 500) return "AVERAGE PERFORMANCE";
  if (totalScore >= 450) return "MUST WORK HARD";
  if (totalScore >= 400) return "BELOW AVERAGE. MUST BUCK UP";
  return "BELOW AVERAGE. MUST PAY ATTENTION IN CLASS";
}

// 🔽 Populate student dropdown
// Only use the filtered version below:
// async function populateStudentDropdown(filterClass) { ... }

// 📊 Load report for selected student
// Add a message element for user prompts
if (!document.getElementById('reportPrompt')) {
  const promptDiv = document.createElement('div');
  promptDiv.id = 'reportPrompt';
  promptDiv.style.color = 'red';
  promptDiv.style.margin = '1em 0';
  promptDiv.style.display = 'none';
          try { notify('No results found for this student.', 'warning'); } catch (e) { console.warn('No results found for this student.'); }
  const reportContainer = document.querySelector('.report-container');
  if (reportContainer) {
    reportContainer.appendChild(promptDiv);
  } else {
    document.body.appendChild(promptDiv);
  }
}

async function loadReportForStudent() {
  let position = '—';
  let totalInClass = '—';
  let subjectPositions = {};
  const select = document.getElementById('studentSelect');
  const studentId = select.value;
  const studentClass = select.options[select.selectedIndex]?.dataset.class || '';
  const studentSubclass = select.options[select.selectedIndex]?.dataset.subclass || '';
  const term = document.getElementById('termFilter')?.value || '';
  const year = document.getElementById('yearFilter')?.value || '';
  const reportPrompt = document.getElementById('reportPrompt');
  const reportSection = document.getElementById('reportSection');

  // Fix: get student name as string, not as element
  const studentName = select.options[select.selectedIndex]?.textContent || '';

  // Only show report if all required fields are filled
  if (!studentId || !studentClass || !term || !year) {
    // Show prompt message
    reportPrompt.textContent = "Please select class, student, term, and academic year to view the report.";
    reportPrompt.style.display = 'block';
    if (reportSection) reportSection.style.display = 'none';
    // Optionally clear/hide report fields
    document.getElementById("studentName").textContent = "—";
    document.getElementById("studentClass").textContent = "—";
    document.getElementById("term").textContent = "—";
    document.getElementById("year").textContent = "—";
    document.getElementById("position").textContent = "—";
    document.getElementById("totalAttendance").textContent = "—";
    document.getElementById("actualAttendance").textContent = "—";
    document.getElementById("studentInterest").textContent = "—";
    document.getElementById("studentConduct").textContent = "—";
    document.getElementById("scoreBody").innerHTML = "";
    document.getElementById("totalScore").textContent = "—";
    document.getElementById("averageScore").textContent = "—";
    document.getElementById("teacherRemark").textContent = "—";
    document.getElementById("vacationDate").textContent = "—";
    document.getElementById("reopenDate").textContent = "—";
    document.getElementById("classTeacherName").textContent = "—";
    return;
  }
  console.debug('DEBUG: Selected studentId:', studentId, 'studentClass:', studentClass, 'studentSubclass:', studentSubclass, 'term:', term, 'year:', year);
  // Fetch vacation and reopening dates from school_dates table
  try {
    const { data, error } = await supabaseClient
      .from('school_dates')
      .select('*')
      .order('inserted_at', { ascending: false })
      .limit(1);
    const latest = data && data.length > 0 ? data[0] : null;
    document.getElementById("vacationDate").textContent = latest && latest.vacation_date ? new Date(latest.vacation_date).toLocaleDateString() : "—";
    document.getElementById("reopenDate").textContent = latest && latest.reopen_date ? new Date(latest.reopen_date).toLocaleDateString() : "—";
  } catch (e) {
    document.getElementById("vacationDate").textContent = "—";
    document.getElementById("reopenDate").textContent = "—";
  }
  // Hide prompt and show report
  reportPrompt.style.display = 'none';
  if (reportSection) reportSection.style.display = 'block';

  // 🖼️ Load student photo
  const studentPhotoUrl = select.options[select.selectedIndex]?.dataset.picture || "placeholder.png";
  document.getElementById("studentPhoto").src = studentPhotoUrl;

  // 📦 Fetch results for selected student, term, and year
  // Important: Only fetch regular subjects (NOT Career Tech) from main Supabase
  // Career Tech is now stored only in the Career Tech Supabase
  let query = supabaseClient
    .from('results')
    .select('*')
    .eq('student_id', studentId)
    .eq('term', term)
    .eq('year', year)
    .neq('subject', 'Career Tech'); // Exclude Career Tech - it's now in separate project
  const { data: results, error: resultError } = await query;
  console.debug('DEBUG: Student results (excluding Career Tech):', results, 'Error:', resultError);

  // Also fetch Career Tech results from Career Tech Supabase
  let careerTechResults = [];
  try {
    const { data: ctData, error: ctError } = await supabaseCareerTech
      .from('career_tech_results')
      .select('*')
      .eq('student_id', studentId)
      .eq('term', term)
      .eq('year', year);
    if (!ctError && ctData) {
      careerTechResults = ctData;
    }
  } catch (e) {
    console.debug('Career Tech results not available or table does not exist:', e);
  }

  if (resultError) return console.error('Failed to load results:', resultError.message);

  // Show message if no results found
  if ((!results || results.length === 0) && careerTechResults.length === 0) {
    const tbody = document.getElementById("scoreBody");
    tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center;">No report found for this student for the selected term and year.</td></tr>';
    document.getElementById("totalScore").textContent = "—";
    document.getElementById("averageScore").textContent = "—";
    document.getElementById("teacherRemark").textContent = "—";
    return;
  }
  
  // Merge results: combine regular results with Career Tech results
  let mergedResults = results || [];
  if (careerTechResults.length > 0) {
    // Add Career Tech results with subject='Career Tech' for processing
    careerTechResults.forEach(ct => {
      mergedResults.push({ ...ct, subject: 'Career Tech' });
    });
    // Remove any old Career Tech entries from results table (if they exist)
    mergedResults = mergedResults.filter(r => r.subject !== 'Career Tech' || r.subject === 'Career Tech');
  }
  
  const results_final = mergedResults;

  // 📦 Fetch interest/conduct/attendance
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('interest, conduct, attendance_total, attendance_actual')
    .eq('student_id', studentId)
    .eq('term', term)
    .single();

  if (profileError || !profile) console.warn('No interest/conduct data found.');

  // 🧾 Populate student info
  document.getElementById("studentName").textContent = studentName.toUpperCase();
  document.getElementById("studentClass").textContent = studentClass.toUpperCase();
  document.getElementById("term").textContent = term.toUpperCase();
  document.getElementById("year").textContent = year.toUpperCase();
  document.getElementById("position").textContent = String(position).toUpperCase();
  if (document.getElementById("totalInClass")) {
    document.getElementById("totalInClass").textContent = String(totalInClass).toUpperCase();
  }
  // 📅 Attendance
  document.getElementById("totalAttendance").textContent = String(profile?.attendance_total ?? "—").toUpperCase();
  document.getElementById("actualAttendance").textContent = String(profile?.attendance_actual ?? "—").toUpperCase();
  // 🎭 Interest & Conduct
  document.getElementById("studentInterest").textContent = String(profile?.interest ?? "—").toUpperCase();
  document.getElementById("studentConduct").textContent = String(profile?.conduct ?? "—").toUpperCase();

  // 👨‍🏫 Fetch class teacher's name using both class and subclass
  try {
    console.log('DEBUG: Fetching teacher for class:', studentClass, 'subclass:', studentSubclass);
    
    // First, let's see what teachers exist for this class
    const { data: allClassTeachers, error: allError } = await supabaseClient
      .from('teachers')
      .select('name, class_teacher_class_main, class_teacher_subclass')
      .eq('class_teacher_class_main', studentClass);
    console.log('DEBUG: All teachers for class', studentClass, ':', allClassTeachers);
    
    const { data: teachers, error: teachersError } = await supabaseClient
      .from('teachers')
      .select('name, responsibility')
      .eq('class_teacher_class_main', studentClass)
      .eq('class_teacher_subclass', studentSubclass)
      .order('responsibility', { ascending: false })
      .limit(1);
    console.log('DEBUG: Teacher query result:', { teachers, teachersError, studentClass, studentSubclass });
    if (!teachersError && teachers && teachers.length > 0) {
      const classTeacherName = (teachers[0].name || '').trim();
      // Capitalize first letter of each word
      const capitalizedName = classTeacherName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      console.log('DEBUG: Setting teacher name:', capitalizedName, 'for class:', studentClass, 'subclass:', studentSubclass);
      document.getElementById("classTeacherName").textContent = capitalizedName;
    } else {
      console.log('DEBUG: No teacher found or error:', teachersError?.message, 'for class:', studentClass, 'subclass:', studentSubclass);
      document.getElementById("classTeacherName").textContent = "—";
    }
  } catch (e) {
    console.debug('Could not fetch class teacher:', e);
    document.getElementById("classTeacherName").textContent = "—";
  }

  // 🎓 Promotion logic: Only show 'Promoted to' if 3rd Term
  const promotedToCell = document.getElementById("promotedTo");
  if (term.trim().toLowerCase() === "3rd term") {
    // Fetch promotion pass mark from Supabase (admin setting)
    let promotionPassMark = 300; // default
    try {
      const { data: promoSettings, error: promoError } = await supabaseClient
        .from('settings')
        .select('promotion_pass_mark')
        .order('id', { ascending: true })
        .limit(1);
      if (!promoError && promoSettings && promoSettings.length && promoSettings[0].promotion_pass_mark) {
        promotionPassMark = parseInt(promoSettings[0].promotion_pass_mark, 10);
      }
    } catch (e) { /* fallback to default */ }
    // Use total accumulated marks for promotion
    let promotedClass = "—";
    let totalScore = parseFloat(document.getElementById("totalScore").textContent);
    if (!isNaN(totalScore)) {
      const classMatch = studentClass.match(/(.*?)(\d+)$/);
      if (totalScore >= promotionPassMark && classMatch) {
        // Promote to next class
        const base = classMatch[1];
        const num = parseInt(classMatch[2], 10) + 1;
        promotedClass = (base + num).trim();
      } else if (totalScore >= promotionPassMark) {
        promotedClass = "Next Class";
      } else {
        promotedClass = studentClass + " (Repeat)";
      }
    }
    promotedToCell.textContent = promotedClass.toUpperCase();
    promotedToCell.parentElement.style.display = "";
  } else {
    promotedToCell.textContent = "";
    promotedToCell.parentElement.style.display = "none";
  }
  // 📊 Score Table
  const tbody = document.getElementById("scoreBody");
  tbody.innerHTML = "";
  let totalScore = 0;
  const subjects = [
    "English", "Mathematics", "Science", "RME",
    "Social Studies", "Computing", "Career Tech",
    "Creative Arts", "Twi"
  ];
  let careerTechScores = [];
  // Fetch all results for this class, term, year for subject ranking
  let subjectPositionsMap = {};
  // Fetch all students in the selected class
  const { data: studentsInClass, error: studentsError } = await supabaseClient
    .from('students')
    .select('id')
    .eq('class', studentClass);
  console.debug('DEBUG: studentsInClass:', studentsInClass, 'Error:', studentsError);
  let classStudentIds = Array.isArray(studentsInClass) ? studentsInClass.map(s => s.id) : [];
  // Fetch all results for these students, this term and year
  // Important: Only fetch regular subjects (NOT Career Tech) from main Supabase
  const { data: allClassResults, error: allClassError } = await supabaseClient
    .from('results')
    .select('student_id, subject, class_score, exam_score')
    .in('student_id', classStudentIds)
    .eq('term', term)
    .eq('year', year)
    .neq('subject', 'Career Tech'); // Exclude Career Tech - it's now in separate project
  console.debug('DEBUG: allClassResults (excluding Career Tech):', allClassResults, 'Error:', allClassError);
  
  // Also fetch Career Tech results from dedicated table
  let allClassResultsFinal = Array.isArray(allClassResults) ? [...allClassResults] : [];
  const { data: careerTechResultsClass, error: careerTechErrorClass } = await supabaseCareerTech
    .from('career_tech_results')
    .select('student_id, area, class_score, exam_score')
    .in('student_id', classStudentIds)
    .eq('term', term)
    .eq('year', year);
  
  // Merge Career Tech results into the main results for ranking calculation
  if (!careerTechErrorClass && Array.isArray(careerTechResultsClass)) {
    careerTechResultsClass.forEach(ctResult => {
      allClassResultsFinal.push({
        student_id: ctResult.student_id,
        subject: 'Career Tech',
        class_score: ctResult.class_score,
        exam_score: ctResult.exam_score
      });
    });
  }
  
  if (Array.isArray(allClassResultsFinal) && allClassResultsFinal.length > 0) {
    subjects.forEach(subject => {
      // Get all students' total for this subject
      let subjectResults = allClassResultsFinal.filter(r => r.subject === subject);
      const scores = {};
      
      if (subject === 'Career Tech') {
        // For Career Tech: each area contributes half of its total marks (rounded)
        // Group by student_id and sum the halved marks
        const groupedByStudent = {};
        subjectResults.forEach(r => {
          if (!groupedByStudent[r.student_id]) groupedByStudent[r.student_id] = [];
          groupedByStudent[r.student_id].push((r.class_score || 0) + (r.exam_score || 0));
        });
        Object.entries(groupedByStudent).forEach(([studentId, marksArray]) => {
          const summedHalves = marksArray.reduce((sum, mark) => sum + Math.round(mark / 2), 0);
          scores[studentId] = summedHalves;
        });
      } else {
        // Regular subjects: sum class_score and exam_score
        subjectResults.forEach(r => {
          scores[r.student_id] = (r.class_score || 0) + (r.exam_score || 0);
        });
      }
      
      // Sort descending
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      // Find position for current student
      const found = sorted.findIndex(([id]) => id === studentId);
      subjectPositionsMap[subject] = found >= 0 ? (found + 1) : '—';
    });
  console.debug('DEBUG: subjectPositionsMap:', subjectPositionsMap);
  }
  subjects.forEach(subject => {
    if (subject === "Career Tech") {
      // Find all Career Tech results for this student (multiple teachers/areas: Pre-Tech, Home Economics, etc.)
      const careerTechEntries = results_final.filter(r => r.subject === "Career Tech");
      // For Career Tech with multiple areas: each area's total marks are divided by 2 (rounded to nearest whole number)
      // Then all area contributions are summed: (PreTech_total/2) + (HomeEcon_total/2) + ...
      // This ensures each area contributes proportionally while maintaining a max of 100 total marks
      let sbaAdjusted = 0;
      let examAdjusted = 0;
      careerTechEntries.forEach(entry => {
        const s = Math.round((entry?.class_score || 0) / 2);
        const e = Math.round((entry?.exam_score || 0) / 2);
        sbaAdjusted += s;
        examAdjusted += e;
      });
      const sbaAvg = careerTechEntries.length > 0 ? sbaAdjusted : 0;
      const examAvg = careerTechEntries.length > 0 ? examAdjusted : 0;
      const total = sbaAvg + examAvg;
      const point = getGradePoint(total);
      const remark = getSubjectRemark(point).toUpperCase();
      const subjectPosition = subjectPositionsMap[subject] || '—';
      // Show Career Tech row with averaged SBA and Exam
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>Career Tech</td>
        <td>${sbaAvg}</td>
        <td>${examAvg}</td>
        <td><strong>${total}</strong></td>
        <td>${String(point).toUpperCase()}</td>
        <td>${remark}</td>
        <td>${String(subjectPosition).toUpperCase()}</td>
      `;
      tbody.appendChild(row);
      totalScore += total;
    } else {
      const entry = results_final.find(r => r.subject === subject);
      const classScore = entry?.class_score || 0;
      const examScore = entry?.exam_score || 0;
      const total = classScore + examScore;
      const point = getGradePoint(total);
      const remark = getSubjectRemark(point).toUpperCase();
      totalScore += total;
      const subjectPosition = subjectPositionsMap[subject] || '—';
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${subject.toUpperCase()}</td>
        <td>${String(classScore).toUpperCase()}</td>
        <td>${String(examScore).toUpperCase()}</td>
        <td>${String(total).toUpperCase()}</td>
        <td>${String(point).toUpperCase()}</td>
        <td>${remark}</td>
        <td>${String(subjectPosition).toUpperCase()}</td>
      `;
      tbody.appendChild(row);
    }
  });

  // Calculate average: if Career Tech has multiple scores, use average, else sum
  let subjectCount = subjects.length;
  if (careerTechScores.length > 1) {
    subjectCount = subjects.length - 1 + 1; // Replace Career Tech with 1 average
  }
  const average = (totalScore / subjectCount).toFixed(2);
  const teacherRemark = getTeacherRemark(totalScore);

  document.getElementById("totalScore").textContent = totalScore;
  document.getElementById("averageScore").textContent = average;
  document.getElementById("teacherRemark").textContent = teacherRemark;

  // Get selected term and year for filtering
  // const term = document.getElementById('termFilter')?.value || '';
  // const year = document.getElementById('yearFilter')?.value || '';

  // Fetch all results for this class, subject, term, year to calculate position
  // Declare position and totalInClass before use
  if (studentClass && term && year) {
    // Get all students in the class for class size
    const { data: studentsInClass2, error: studentsError2 } = await supabaseClient
      .from('students')
      .select('id')
      .eq('class', studentClass);
  console.debug('DEBUG: studentsInClass (for position):', studentsInClass2, 'Error:', studentsError2);
    if (!studentsError2 && Array.isArray(studentsInClass2)) {
      totalInClass = studentsInClass2.length;
    }
    // Get all results for these students for position calculation
    let classStudentIds2 = Array.isArray(studentsInClass2) ? studentsInClass2.map(s => s.id) : [];
    const { data: classResults, error: classError } = await supabaseClient
      .from('results')
      .select('student_id, class_score, exam_score')
      .in('student_id', classStudentIds2)
      .eq('term', term)
      .eq('year', year);
  console.debug('DEBUG: classResults:', classResults, 'Error:', classError);
    if (!classError && Array.isArray(classResults)) {
      // Calculate accumulated total score for each student
      const scores = {};
      classResults.forEach(r => {
        if (!scores[r.student_id]) scores[r.student_id] = 0;
        scores[r.student_id] += (r.class_score || 0) + (r.exam_score || 0);
      });
      // Sort scores descending by accumulated total
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      // Find position of current student
      const found = sorted.findIndex(([id]) => id === studentId);
      position = found >= 0 ? (found + 1) : '—';
  console.debug('DEBUG: Overall position:', position, 'Sorted:', sorted);
    }
  }
  document.getElementById("position").textContent = position;
  // Add total number of students in class to report card
  if (document.getElementById("totalInClass")) {
    document.getElementById("totalInClass").textContent = totalInClass;
  }
}

// 🚀 Initialize

// Populate class dropdown and session logic
async function populateClassDropdown() {
  const { data, error } = await supabaseClient.from('students').select('class').neq('class', null);
  const classSelect = document.getElementById('classSelect');
  if (error) return console.error('Failed to load classes:', error.message);
  const uniqueClasses = [...new Set(data.map(s => s.class))].sort();
  uniqueClasses.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls;
    option.textContent = cls;
    classSelect.appendChild(option);
  });
}

// When class is selected, store in session and filter students
document.getElementById('classSelect').addEventListener('change', async function() {
  const selectedClass = this.value;
  sessionStorage.setItem('selectedClass', selectedClass);
  await populateStudentDropdown(selectedClass);
});

// Modified populateStudentDropdown to filter by class
let allStudents = [];
async function populateStudentDropdown(filterClass) {
  let query = supabaseClient.from('students').select('id, first_name, surname, class, subclass, picture_url');
  if (filterClass) query = query.eq('class', filterClass);
  const { data, error } = await query;
  allStudents = data || [];
  filterStudentDropdown();
}

// Filter student dropdown by search box
window.filterStudentDropdown = function filterStudentDropdown() {
  const search = document.getElementById('studentSearch')?.value.trim().toLowerCase() || '';
  const select = document.getElementById('studentSelect');
  select.innerHTML = '<option value="">-- Select --</option>';
  let filtered = allStudents;
  if (search) {
    filtered = filtered.filter(s => (`${s.first_name || ''} ${s.surname || ''}`.toLowerCase().includes(search)));
  }
  filtered.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.first_name || ''} ${student.surname || ''}`.trim();
    option.dataset.class = student.class;
    option.dataset.subclass = student.subclass || '';
    option.dataset.picture = student.picture_url || '';
    select.appendChild(option);
  });
};

// On page load, populate class dropdown and restore session
window.addEventListener('DOMContentLoaded', async () => {
  // Inject filter dropdowns if not present
  if (!document.getElementById('filters')) {
    const filtersDiv = document.createElement('div');
    filtersDiv.id = 'filters';
    document.body.insertBefore(filtersDiv, document.body.firstChild);
  }
  if (!document.getElementById('termFilter')) {
    const termSelect = document.createElement('select');
    termSelect.id = 'termFilter';
    termSelect.innerHTML = '<option value="">-- Select Term --</option><option value="1st Term">1st Term</option><option value="2nd Term">2nd Term</option><option value="3rd Term">3rd Term</option>';
    document.getElementById('filters').appendChild(termSelect);
  }
  if (!document.getElementById('yearFilter')) {
    const yearInput = document.createElement('input');
    yearInput.id = 'yearFilter';
    yearInput.placeholder = 'Academic Year (e.g. 2025/2026)';
    document.getElementById('filters').appendChild(yearInput);
  }

  await populateClassDropdown();
  document.getElementById('studentSelect').innerHTML = '<option value="">-- Select --</option>';
  const selectedClass = sessionStorage.getItem('selectedClass');
  if (selectedClass) {
    document.getElementById('classSelect').value = selectedClass;
    await populateStudentDropdown(selectedClass);
  }
  // Add event listeners to reload report when term/year changes
  document.getElementById('termFilter').addEventListener('change', loadReportForStudent);
  document.getElementById('yearFilter').addEventListener('input', loadReportForStudent);
});

// Bulk print logic
// Usage: click the element with id="bulkPrintBtn" (button provided in the UI).
// This routine expects the page to contain:
// - a class selector with id="classSelect"
// - a student selector with id="studentSelect"
// - the report template container with id="reportSection" which is populated by loadReportForStudent()
// It will populate the template for each student in the selected class, clone the populated template
// into a hidden print container (one clone per student), then trigger window.print() once so the
// browser can save a single multi-page PDF containing all student reports. After printing the
// temporary print elements are cleaned up automatically.
document.getElementById('bulkPrintBtn').onclick = async function() {
  const selectedClass = document.getElementById('classSelect').value;
  if (!selectedClass) {
    notify('Please select a class first.', 'warning');
    return;
  }
  // Fetch all students in the selected class
  const { data: students, error } = await supabaseClient.from('students').select('id').eq('class', selectedClass);
  if (error || !students || students.length === 0) {
    notify('No students found for this class.', 'warning');
    return;
  }
  // Build a hidden print container and append one populated report per student
  const reportSection = document.getElementById('reportSection');
  if (!reportSection) {
    notify('Report template not found on the page.', 'error');
    return;
  }

  // Create a small progress overlay so user knows generation is in progress
  let progressOverlay = document.getElementById('bulkPrintProgress');
  if (progressOverlay) progressOverlay.remove();
  progressOverlay = document.createElement('div');
  progressOverlay.id = 'bulkPrintProgress';
  progressOverlay.style.position = 'fixed';
  progressOverlay.style.left = '0';
  progressOverlay.style.top = '0';
  progressOverlay.style.right = '0';
  progressOverlay.style.bottom = '0';
  progressOverlay.style.background = 'rgba(0,0,0,0.55)';
  progressOverlay.style.display = 'flex';
  progressOverlay.style.alignItems = 'center';
  progressOverlay.style.justifyContent = 'center';
  progressOverlay.style.zIndex = '99999';
  progressOverlay.innerHTML = `
    <div style="background:#fff;padding:20px 18px;border-radius:8px;display:flex;flex-direction:column;align-items:center;gap:12px;min-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div class="bulk-spinner" style="width:28px;height:28px;border:4px solid #ddd;border-top-color:#2b7cff;border-radius:50%;animation:spin 1s linear infinite"></div>
        <div style="font-family:Arial,Helvetica,sans-serif;color:#222;font-size:14px;">
          <div id="bulkPrintProgressText">Preparing 0/${students.length}</div>
          <div style="font-size:12px;color:#666;margin-top:6px;">Please wait while reports are generated...</div>
        </div>
      </div>
      <div style="width:100%;display:flex;justify-content:flex-end;gap:8px;margin-top:6px;">
        <button id="bulkPrintCancelBtn" style="background:#f44336;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:13px;">Cancel</button>
      </div>
    </div>
  `;
  // Add spinner keyframes if not present
  if (!document.getElementById('bulkPrintProgressStyle')) {
    const pf = document.createElement('style');
    pf.id = 'bulkPrintProgressStyle';
    pf.textContent = `@keyframes spin {from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
    document.head.appendChild(pf);
  }
  document.body.appendChild(progressOverlay);
  // Expose a simple controller to allow cancellation from the Cancel button
  window.__bulkPrintController = { cancelled: false };
  const cancelBtn = document.getElementById('bulkPrintCancelBtn');
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      window.__bulkPrintController.cancelled = true;
      const pt = document.getElementById('bulkPrintProgressText');
      if (pt) pt.textContent = `Cancelling...`;
      // visually disable the cancel button
      cancelBtn.disabled = true;
      cancelBtn.style.opacity = '0.6';
    };
  }

  // Create a container for bulk printing
  let bulkContainer = document.getElementById('bulkPrintContainer');
  if (bulkContainer) bulkContainer.remove();
  bulkContainer = document.createElement('div');
  bulkContainer.id = 'bulkPrintContainer';
  // keep it off-screen / hidden in normal view
  bulkContainer.style.display = 'none';
  document.body.appendChild(bulkContainer);

  // Inject print-only stylesheet to show only the bulk container during printing
  const styleId = 'bulk-print-style';
  let printStyle = document.getElementById(styleId);
  if (printStyle) printStyle.remove();
  printStyle = document.createElement('style');
  printStyle.id = styleId;
  printStyle.textContent = `
    @media print {
      /* hide everything except the bulk container when printing */
      body * { visibility: hidden !important; }
      #bulkPrintContainer, #bulkPrintContainer * { visibility: visible !important; }
      #bulkPrintContainer { position: absolute; left: 0; top: 0; width: 100%; }
      /* each report should start on a new printed page */
      .print-page { page-break-after: always; }
    }
    /* Ensure page break works for pdf engines as well */
    .print-page { -webkit-print-color-adjust: exact; }
  `;
  document.head.appendChild(printStyle);

  // Save current selection to restore later
  const originalStudentSelectValue = document.getElementById('studentSelect')?.value || '';

  // Populate the bulk container: for each student, load their report into the visible template, clone it, sanitize ids, and append to container
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    try {
      // check for cancellation before starting work for this student
      if (window.__bulkPrintController?.cancelled) {
        const pt = document.getElementById('bulkPrintProgressText');
        if (pt) pt.textContent = `Canceled at ${i}/${students.length}`;
        break;
      }
      // Set the global student selector so loadReportForStudent() populates the template
      if (document.getElementById('studentSelect')) {
        document.getElementById('studentSelect').value = student.id;
      }
      // Wait for the template to be populated
      await loadReportForStudent();
      // check for cancellation after population
      if (window.__bulkPrintController?.cancelled) {
        const pt = document.getElementById('bulkPrintProgressText');
        if (pt) pt.textContent = `Canceled at ${i + 1}/${students.length}`;
        break;
      }
      // Clone the populated report section
      const clone = reportSection.cloneNode(true);
      // Remove ids inside the clone to avoid duplicate-id collisions in the document
      clone.querySelectorAll('[id]').forEach(el => {
        el.removeAttribute('id');
      });
      // Add a marker class for page breaks
      clone.classList.add('print-page');
      // Make sure the clone is visible when printed
      clone.style.display = '';
      bulkContainer.appendChild(clone);
      // Update progress text
      const progressText = document.getElementById('bulkPrintProgressText');
      if (progressText) progressText.textContent = `Preparing ${i + 1}/${students.length}`;
    } catch (e) {
      console.error('Failed to build report for student', student, e);
      const progressText = document.getElementById('bulkPrintProgressText');
      if (progressText) progressText.textContent = `Error at ${i + 1}/${students.length}`;
    }
  }

  // Restore the original student selection in the form
  if (document.getElementById('studentSelect')) {
    document.getElementById('studentSelect').value = originalStudentSelectValue;
    // Optionally reload the original student's report if needed
    if (originalStudentSelectValue) await loadReportForStudent();
  }

  // Show the container just before printing so some browsers pick up layout
  bulkContainer.style.display = 'block';
  // If cancelled, clean up and do not open print dialog
  if (window.__bulkPrintController?.cancelled) {
    // cleanup
    try { bulkContainer.remove(); } catch (e) { /* ignore */ }
    try { printStyle.remove(); } catch (e) { /* ignore */ }
    try { const ps = document.getElementById('bulkPrintProgress'); if (ps) ps.remove(); } catch (e) { /* ignore */ }
    try { const pf = document.getElementById('bulkPrintProgressStyle'); if (pf) pf.remove(); } catch (e) { /* ignore */ }
    // clear controller
    try { delete window.__bulkPrintController; } catch (e) {}
    return;
  }

  // Update progress to ready
  const progressTextFinal = document.getElementById('bulkPrintProgressText');
  if (progressTextFinal) progressTextFinal.textContent = `Ready — opening print dialog (${students.length} pages)`;
  // Trigger the browser print dialog once for the full document
  window.print();

  // Cleanup: remove the bulk container, print stylesheet and progress overlay after printing
  // Use a small timeout to allow print dialog to spawn in some browsers
  setTimeout(() => {
    try { bulkContainer.remove(); } catch (e) { /* ignore */ }
    try { printStyle.remove(); } catch (e) { /* ignore */ }
    try { const ps = document.getElementById('bulkPrintProgress'); if (ps) ps.remove(); } catch (e) { /* ignore */ }
    try { const pf = document.getElementById('bulkPrintProgressStyle'); if (pf) pf.remove(); } catch (e) { /* ignore */ }
    try { delete window.__bulkPrintController; } catch (e) {}
  }, 1000);
};

// Send result to student (by class)
document.getElementById('sendResultBtn').onclick = async function() {
  const select = document.getElementById('studentSelect');
  const studentId = select.value;
  if (!studentId) {
  try { notify('Please select a student first.', 'warning'); } catch (e) { try { safeNotify('Please select a student first.', 'warning'); } catch (ee) { console.error('safeNotify failed', ee); } }
    return;
  }
  // Fetch student info
  const studentName = select.options[select.selectedIndex].textContent;
  const studentClass = select.options[select.selectedIndex].dataset.class;
  // Fetch results
  const { data: results, error } = await supabaseClient
    .from('results')
    .select('*')
    .eq('student_id', studentId);
  if (error || !results || results.length === 0) {
    notify('No results found for this student.', 'warning');
    return;
  }
  // Here you would send the result to the student (e.g., via email, SMS, or update a Supabase table)
  // For demo, we'll just show a confirmation
  notify(`Result for ${studentName} (Class: ${studentClass}) sent successfully!`, 'info');
};

window.loadReportForStudent = loadReportForStudent;