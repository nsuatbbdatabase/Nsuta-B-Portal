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
// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
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
  // Fix: append to report-container instead of insertBefore
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
    return;
  }
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
  let query = supabaseClient
    .from('results')
    .select('*')
    .eq('student_id', studentId)
    .eq('term', term)
    .eq('year', year);
  const { data: results, error: resultError } = await query;

  if (resultError) return console.error('Failed to load results:', resultError.message);

  // Show message if no results found
  if (!results || results.length === 0) {
    const tbody = document.getElementById("scoreBody");
    tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center;">No report found for this student for the selected term and year.</td></tr>';
    document.getElementById("totalScore").textContent = "—";
    document.getElementById("averageScore").textContent = "—";
    document.getElementById("teacherRemark").textContent = "—";
    return;
  }

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
  // 📊 Score Table
  const tbody = document.getElementById("scoreBody");
  tbody.innerHTML = "";
  let totalScore = 0;
  const subjects = [
    "English", "Mathematics", "Science", "RME",
    "Social Studies", "Computing", "Career Tech",
    "Creative Arts", "Twi"
  ];
  subjects.forEach(subject => {
    const entry = results.find(r => r.subject === subject);
    const classScore = entry?.class_score || 0;
    const examScore = entry?.exam_score || 0;
    const total = classScore + examScore;
    const point = getGradePoint(total);
    const remark = getSubjectRemark(point).toUpperCase();
    totalScore += total;
    const subjectPosition = subjectPositions[subject] || '—';
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
  });

  const average = (totalScore / subjects.length).toFixed(2);
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
    const { data: classResults, error: classError } = await supabaseClient
      .from('results')
      .select('student_id, class_score, exam_score')
      .eq('class', studentClass)
      .eq('term', term)
      .eq('year', year);
    if (!classError && Array.isArray(classResults)) {
      // Calculate total score for each student
      const scores = {};
      classResults.forEach(r => {
        const total = (r.class_score || 0) + (r.exam_score || 0);
        scores[r.student_id] = total;
      });
      // Sort scores descending
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      totalInClass = sorted.length;
      // Find position of current student
      position = sorted.findIndex(([id]) => id === studentId) + 1;
      if (position === 0) position = '—';
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
async function populateStudentDropdown(filterClass) {
  let query = supabaseClient.from('students').select('id, first_name, surname, class, picture_url');
  if (filterClass) query = query.eq('class', filterClass);
  const { data, error } = await query;
  const select = document.getElementById('studentSelect');
  select.innerHTML = '<option value="">-- Select --</option>';
  if (error) return console.error('Failed to load students:', error.message);
  data.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.first_name || ''} ${student.surname || ''}`.trim();
    option.dataset.class = student.class;
    option.dataset.picture = student.picture_url || '';
    select.appendChild(option);
  });
}

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
document.getElementById('bulkPrintBtn').onclick = async function() {
  const selectedClass = document.getElementById('classSelect').value;
  if (!selectedClass) {
    alert('Please select a class first.');
    return;
  }
  // Fetch all students in the selected class
  const { data: students, error } = await supabaseClient.from('students').select('id').eq('class', selectedClass);
  if (error || !students || students.length === 0) {
    alert('No students found for this class.');
    return;
  }
  // Print each student's report in sequence
  for (const student of students) {
    document.getElementById('studentSelect').value = student.id;
    await loadReportForStudent();
    window.print();
  }
};

// Send result to student (by class)
document.getElementById('sendResultBtn').onclick = async function() {
  const select = document.getElementById('studentSelect');
  const studentId = select.value;
  if (!studentId) {
    alert('Please select a student first.');
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
    alert('No results found for this student.');
    return;
  }
  // Here you would send the result to the student (e.g., via email, SMS, or update a Supabase table)
  // For demo, we'll just show a confirmation
  alert(`Result for ${studentName} (Class: ${studentClass}) sent successfully!`);
};

window.loadReportForStudent = loadReportForStudent;