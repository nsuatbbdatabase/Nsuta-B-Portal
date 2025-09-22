// Dashboard Overview Back Button Logic
window.addEventListener('DOMContentLoaded', () => {
  const backBtn = document.getElementById('backToDashboardBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
  const backToAdminBtn = document.getElementById('backToAdminBtn');
  if (backToAdminBtn) {
    backToAdminBtn.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });
  }
});
// ------------------- Attendance Feature -------------------
function setupAttendanceSection() {
  const attendanceClassSelect = document.getElementById('attendanceClassSelect');
  if (attendanceClassSelect && teacher && teacher.classes) {
    attendanceClassSelect.innerHTML = '<option value="">-- Select Class --</option>';
    teacher.classes.forEach(cls => {
      const opt = document.createElement('option');
      opt.value = cls;
      opt.textContent = cls;
      attendanceClassSelect.appendChild(opt);
    });
    attendanceClassSelect.addEventListener('change', loadAttendanceStudents);
  }
  const attendanceDate = document.getElementById('attendanceDate');
  if (attendanceDate) {
    attendanceDate.valueAsDate = new Date();
    attendanceDate.addEventListener('change', loadAttendanceStudents);
  }
  // Optionally, load students for the first class if desired
}

// Load students for selected class and date
async function loadAttendanceStudents() {
  const classVal = document.getElementById('attendanceClassSelect').value;
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';
  if (!classVal) return;
  const { data, error } = await supabaseClient
    .from('students')
    .select('id, first_name, surname')
    .eq('class', classVal);
  if (error || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No students found for this class.</td></tr>';
    return;
  }
  data.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td>
        <select class="attendance-status" data-student-id="${student.id}">
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
          <option value="Late">Late</option>
        </select>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Submit attendance to Supabase
async function submitAttendance() {
  const classVal = document.getElementById('attendanceClassSelect').value;
  const dateVal = document.getElementById('attendanceDate').value;
  if (!classVal || !dateVal) {
    alert('Please select class and date.');
    return;
  }
  const statusSelects = document.querySelectorAll('.attendance-status');
  const records = Array.from(statusSelects).map(sel => ({
    student_id: sel.getAttribute('data-student-id'),
    class: classVal,
    date: dateVal,
    status: sel.value,
    marked_by: teacher.id
  }));
  if (records.length === 0) {
    alert('No students to mark.');
    return;
  }
  // Upsert attendance records (one per student per date)
  const { error } = await supabaseClient
    .from('attendance')
    .upsert(records, { onConflict: ['student_id', 'date'] });
  if (error) {
    alert('Failed to submit attendance: ' + error.message);
  } else {
    alert('Attendance submitted successfully!');
  }
}
// ----------------------------------------------------------
// Send motivational message to selected student
async function sendMotivationalMessage() {
  const studentId = document.getElementById('motivationStudentSelect')?.value;
  const message = document.getElementById('motivationText')?.value.trim();
  if (!teacher || !teacher.id) {
    alert('Teacher session not found.');
    return;
  }
  if (!studentId || !message) {
    alert('Please select a student and enter a message.');
    return;
  }
  // Basic UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(studentId) || !uuidRegex.test(teacher.id)) {
    alert('Invalid student or teacher ID format.');
    return;
  }
  const { error } = await supabaseClient.from('motivations').insert([
    {
      teacher_id: teacher.id,
      student_id: studentId,
      message
    }
  ]);
  if (error) {
    alert('Failed to send motivation: ' + error.message);
  } else {
    alert('Motivational message sent!');
    document.getElementById('motivationText').value = '';
    // Optionally reload sent messages here if you have a loader
  }
}
// Make function accessible from HTML
window.sendMotivationalMessage = sendMotivationalMessage;
// Populate motivation student dropdown with students from teacher's classes
async function populateMotivationStudentDropdown() {
  const select = document.getElementById('motivationStudentSelect');
  if (!teacher || !teacher.classes || teacher.classes.length === 0) {
    select.innerHTML = '<option value="">-- Select Student --</option>';
    return;
  }
  // Fetch students in any of the teacher's classes
  const { data, error } = await supabaseClient
    .from('students')
    .select('id, first_name, surname, class')
    .in('class', teacher.classes);
  select.innerHTML = '<option value="">-- Select Student --</option>';
  if (!error && Array.isArray(data)) {
    data.forEach(student => {
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = `${student.first_name || ''} ${student.surname || ''} (${student.class})`;
      select.appendChild(option);
    });
  }
}
// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);

let teacher = {};
// � Load resource requests sent to this teacher
async function loadResourceRequests() {
  const tbody = document.getElementById('resourceRequestsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const { data, error } = await supabaseClient
    .from('resource_requests')
    .select('id, student_id, resource, reason, response, created_at, students(first_name, surname)')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false });
  if (error || !Array.isArray(data)) {
    tbody.innerHTML = '<tr><td colspan="5">Error loading resource requests.</td></tr>';
    return;
  }
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No resource requests found.</td></tr>';
    return;
  }
  data.forEach(msg => {
    const row = document.createElement('tr');
    let studentName = msg.students ? `${msg.students.first_name || ''} ${msg.students.surname || ''}`.trim() : msg.student_id;
    row.innerHTML = `
      <td>${studentName}</td>
      <td>${msg.message}</td>
      <td>${new Date(msg.created_at).toLocaleString()}</td>
      <td>
        <input type="text" id="reply-${msg.id}" placeholder="Reply..." value="${msg.response || ''}" style="width:120px;" />
        <button onclick="replyMotivation('${msg.id}')">Reply</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// Update reply for a motivational message
async function replyMotivation(motivationId) {
  const input = document.getElementById(`reply-${motivationId}`);
  const response = input.value.trim();
  if (!response) {
    input.style.borderColor = 'red';
    return;
  }
  const { error } = await supabaseClient
    .from('motivations')
    .update({ response })
    .eq('id', motivationId);
  if (error) {
    input.style.borderColor = 'red';
    input.title = error.message;
  } else {
    input.style.borderColor = 'green';
    input.title = 'Reply saved!';
  }
}

// ��� Load messages sent by students to this teacher
async function loadStudentMessages() {
  const tbody = document.getElementById('studentMessagesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const { data, error } = await supabaseClient
    .from('teacher_messages')
  .select('id, student_id, message, response, created_at, students(first_name, surname)')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false });
  if (error || !Array.isArray(data)) {
    tbody.innerHTML = '<tr><td colspan="4">Error loading messages.</td></tr>';
    return;
  }
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4">No messages from students.</td></tr>';
    return;
  }
  data.forEach(msg => {
    const row = document.createElement('tr');
    row.innerHTML = `
  <td>${msg.students ? `${msg.students.first_name || ''} ${msg.students.surname || ''}`.trim() : msg.student_id}</td>
      <td>${msg.message}</td>
      <td>${msg.response || ''}</td>
      <td>${new Date(msg.created_at).toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });
}
let students = [];

// 🔐 Load teacher profile and dashboard
async function loadTeacherDashboard(staffId) {
  // Load teacher basic info
  const { data: teacherData, error: teacherError } = await supabaseClient
    .from('teachers')
    .select('id, name, staff_id, responsibility')
    .eq('staff_id', staffId)
    .single();
  if (teacherError || !teacherData) {
    document.getElementById('welcomeMessage').textContent = 'Access denied or teacher not found.';
    return;
  }
  teacher = teacherData;
  // Load assignments
  const { data: assignments, error: assignError } = await supabaseClient
    .from('teaching_assignments')
    .select('class, subject, area')
    .eq('teacher_id', teacher.id);
  if (assignError) {
    document.getElementById('welcomeMessage').textContent = 'Error loading assignments.';
    return;
  }
  // Build assigned classes/subjects/areas
  teacher.assignments = assignments || [];
  teacher.classes = [...new Set(assignments.map(a => a.class))];
  teacher.subjects = [...new Set(assignments.map(a => a.subject))];
  teacher.areas = [...new Set(assignments.filter(a => a.subject === 'Career Tech').map(a => a.area).filter(Boolean))];

  document.getElementById('welcomeMessage').textContent = `Welcome, ${teacher.name} (${teacher.staff_id})`;
  const rolesDiv = document.getElementById('assignedRoles');
  let rolesHtml = `<strong>Assigned Classes:</strong> ${teacher.classes.join(', ')}<br/><strong>Assigned Subjects:</strong> ${teacher.subjects.join(', ')}`;
  if (teacher.areas.length) {
    rolesHtml += `<br/><strong>Career Tech Areas:</strong> ${teacher.areas.join(', ')}`;
  }
  rolesDiv.innerHTML = rolesHtml;

  // Populate dropdowns for mark entry
  populateDropdown('classSelect', teacher.classes);
  populateDropdown('subjectSelect', teacher.subjects);
  populateDropdown('classSelectExam', teacher.classes);
  populateDropdown('subjectSelectExam', teacher.subjects);
  populateDropdown('assignClass', teacher.classes);
  populateDropdown('assignSubject', teacher.subjects);
  // Restrict dropdowns to assigned pairs
  function setupRestrictedDropdowns() {
    // SBA Section
    const classSelect = document.getElementById('classSelect');
    const subjectSelect = document.getElementById('subjectSelect');
    if (classSelect && subjectSelect && teacher.assignments) {
      subjectSelect.addEventListener('change', function() {
        const subjectVal = subjectSelect.value;
        const allowedClasses = teacher.assignments.filter(a => a.subject === subjectVal).map(a => a.class);
        const prevClass = classSelect.value;
        classSelect.innerHTML = `<option value="">-- Select Class --</option>`;
        [...new Set(allowedClasses)].forEach(cls => {
          const opt = document.createElement('option');
          opt.value = cls;
          opt.textContent = cls;
          classSelect.appendChild(opt);
        });
        // Restore previous selection if still valid
        if (allowedClasses.includes(prevClass)) {
          classSelect.value = prevClass;
        }
      });
      classSelect.addEventListener('change', function() {
        const classVal = classSelect.value;
        const allowedSubjects = teacher.assignments.filter(a => a.class === classVal).map(a => a.subject);
        const prevSubject = subjectSelect.value;
        subjectSelect.innerHTML = `<option value="">-- Select Subject --</option>`;
        [...new Set(allowedSubjects)].forEach(subj => {
          const opt = document.createElement('option');
          opt.value = subj;
          opt.textContent = subj;
          subjectSelect.appendChild(opt);
        });
        // Restore previous selection if still valid
        if (allowedSubjects.includes(prevSubject)) {
          subjectSelect.value = prevSubject;
        }
      });
    }
    // Exam Section
    const classSelectExam = document.getElementById('classSelectExam');
    const subjectSelectExam = document.getElementById('subjectSelectExam');
    if (classSelectExam && subjectSelectExam && teacher.assignments) {
      subjectSelectExam.addEventListener('change', function() {
        const subjectVal = subjectSelectExam.value;
        const allowedClasses = teacher.assignments.filter(a => a.subject === subjectVal).map(a => a.class);
        classSelectExam.innerHTML = `<option value="">-- Select Class --</option>`;
        [...new Set(allowedClasses)].forEach(cls => {
          const opt = document.createElement('option');
          opt.value = cls;
          opt.textContent = cls;
          classSelectExam.appendChild(opt);
        });
      });
      classSelectExam.addEventListener('change', function() {
        const classVal = classSelectExam.value;
        const allowedSubjects = teacher.assignments.filter(a => a.class === classVal).map(a => a.subject);
        subjectSelectExam.innerHTML = `<option value="">-- Select Subject --</option>`;
        [...new Set(allowedSubjects)].forEach(subj => {
          const opt = document.createElement('option');
          opt.value = subj;
          opt.textContent = subj;
          subjectSelectExam.appendChild(opt);
        });
      });
    }
  }
  setupRestrictedDropdowns();
  // For Career Tech, show area dropdown if needed
  const subjectSelect = document.getElementById('subjectSelect');
  const areaSelect = document.getElementById('careerTechAreaSelect');
  if (subjectSelect && areaSelect) {
    subjectSelect.addEventListener('change', function() {
      if (subjectSelect.value === 'Career Tech') {
        areaSelect.style.display = '';
        // Only show areas assigned to this teacher
        areaSelect.innerHTML = '<option value="">Select Area</option>' + teacher.areas.map(a => `<option value="${a}">${a}</option>`).join('');
      } else {
        areaSelect.style.display = 'none';
        areaSelect.innerHTML = '';
      }
    });
    // Hide area dropdown by default
    areaSelect.style.display = 'none';
  }
  // Show/hide attendance section based on responsibility
  const attendanceSection = document.getElementById('attendanceSection');
  if (teacher && teacher.responsibility === 'Class Teacher') {
    if (attendanceSection) attendanceSection.style.display = '';
    setupAttendanceSection();
  } else {
    if (attendanceSection) attendanceSection.style.display = 'none';
  }
  await loadAssignments();
  await loadStudentSubmissions();
  await loadStudentMessages();
  await loadResourceRequests();
  await populateMotivationStudentDropdown();

  // Always refresh student list dropdown after assignments are loaded
  if (document.getElementById('studentClassFilter')) {
    // Only refresh the dropdown, do not switch tab
    const classFilter = document.getElementById('studentClassFilter');
    if (classFilter) {
      classFilter.innerHTML = '<option value="">-- All Assigned Classes --</option>';
      if (teacher && teacher.classes && teacher.classes.length > 0) {
        teacher.classes.forEach(cls => {
          const opt = document.createElement('option');
          opt.value = cls;
          opt.textContent = cls;
          classFilter.appendChild(opt);
        });
      }
    }
    // Show dashboard overview by default
    if (typeof showDashboardOverview === 'function') {
      showDashboardOverview();
    }
  }
}

// 🔽 Populate dropdown
function populateDropdown(id, items) {
  const select = document.getElementById(id);
  select.innerHTML = `<option value="">-- Select --</option>`;
  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}

// 📋 Load students by selected class (handles both SBA and Exam sections)
// Promotion Exam: Load JHS 2 students and subjects
async function loadPromotionExamStudents() {
  const classVal = document.getElementById('promotionClassSelect').value;
  const subjectVal = document.getElementById('promotionSubjectSelect').value;
  const tbody = document.getElementById('promotionExamTableBody');
  tbody.innerHTML = '';
  if (!classVal || !subjectVal) return;
  const { data, error } = await supabaseClient
    .from('students')
    .select('id, first_name, surname')
    .eq('class', classVal);
  if (error || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No JHS 2 students found.</td></tr>';
    return;
  }
  data.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td><input type="number" min="0" max="100" class="promotion-score" data-student-id="${student.id}" /></td>
    `;
    tbody.appendChild(row);
  });
}

// Promotion Exam: Submit entries to Supabase
async function submitPromotionExam() {
  const classVal = document.getElementById('promotionClassSelect').value;
  const subjectVal = document.getElementById('promotionSubjectSelect').value;
  const termVal = document.getElementById('promotionTermInput').value;
  const yearVal = document.getElementById('promotionYearInput').value;
  if (!classVal || !subjectVal || !termVal || !yearVal) {
    alert('Please fill all fields.');
    return;
  }
  const scoreInputs = document.querySelectorAll('.promotion-score');
  const records = Array.from(scoreInputs).map(input => ({
    student_id: input.getAttribute('data-student-id'),
    class: classVal,
    subject: subjectVal,
    term: termVal,
    year: yearVal,
    score: parseInt(input.value, 10) || 0,
    marked_by: teacher.id,
    submitted_to_admin: true
  }));
  if (records.length === 0) {
    alert('No students to mark.');
    return;
  }
  const { error } = await supabaseClient
    .from('promotion_exams')
    .upsert(records, { onConflict: ['student_id', 'subject', 'term', 'year'] });
  if (error) {
    alert('Failed to submit promotion exam: ' + error.message);
  } else {
    alert('Promotion exam submitted to admin!');
    document.getElementById('promotionExamTableBody').innerHTML = '';
  }
}

// Populate promotion subjects dropdown (JHS 2 assigned subjects)
function populatePromotionSubjects() {
  const select = document.getElementById('promotionSubjectSelect');
  select.innerHTML = '<option value="">-- Select Subject --</option>';
  if (teacher && teacher.assignments) {
    const jhs2Subjects = teacher.assignments.filter(a => a.class === 'JHS 2').map(a => a.subject);
    [...new Set(jhs2Subjects)].forEach(subj => {
      const opt = document.createElement('option');
      opt.value = subj;
      opt.textContent = subj;
      select.appendChild(opt);
    });
  }
}

// Add event listeners for promotion exam tab
document.addEventListener('DOMContentLoaded', function() {
  const classSelect = document.getElementById('promotionClassSelect');
  const subjectSelect = document.getElementById('promotionSubjectSelect');
  if (classSelect && subjectSelect) {
    classSelect.addEventListener('change', () => {
      populatePromotionSubjects();
      // Wait for subjects to populate, then load students if subject is selected
      setTimeout(() => {
        if (subjectSelect.value) loadPromotionExamStudents();
      }, 50);
    });
    subjectSelect.addEventListener('change', loadPromotionExamStudents);
  }
  // If tab is opened, always reset and reload
  const promoCard = document.querySelector('.dashboard-card[data-section="promotionExamSection"]');
  if (promoCard) {
    promoCard.addEventListener('click', () => {
      // Reset filters
      if (classSelect) classSelect.value = 'JHS 2';
      populatePromotionSubjects();
      setTimeout(() => {
        if (subjectSelect && subjectSelect.value) {
          loadPromotionExamStudents();
        } else {
          document.getElementById('promotionExamTableBody').innerHTML = '';
        }
      }, 50);
    });
  }
});

window.submitPromotionExam = submitPromotionExam;
async function loadStudents(section = 'sba') {
  let selectedClass, selectedSubject;
  if (section === 'exam') {
    selectedClass = document.getElementById('classSelectExam').value;
    selectedSubject = document.getElementById('subjectSelectExam').value;
  } else {
    selectedClass = document.getElementById('classSelect').value;
    selectedSubject = document.getElementById('subjectSelect').value;
  }
  if (!selectedClass || !selectedSubject) return;
  const { data, error } = await supabaseClient
    .from('students')
  .select('id, first_name, surname')
    .eq('class', selectedClass);
  if (error) {
    console.error('Failed to load students:', error.message);
    students = [];
  } else {
    students = data;
  }
  if (section === 'exam') {
    renderExamForm();
  } else {
    renderSBAForm();
  }
}

// 📝 Render SBA form
function renderSBAForm() {
  const tbody = document.getElementById('sbaTableBody');
  tbody.innerHTML = '';
  if (!students || students.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7">No students found for this class.</td>';
    tbody.appendChild(row);
    return;
  }
  students.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
  <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td><input type="number" data-type="individual" data-id="${student.id}" max="15" min="0" /></td>
      <td><input type="number" data-type="group" data-id="${student.id}" max="15" min="0" /></td>
      <td><input type="number" data-type="classTest" data-id="${student.id}" max="15" min="0" /></td>
      <td><input type="number" data-type="project" data-id="${student.id}" max="15" min="0" /></td>
      <td><span id="total-${student.id}">0</span></td>
      <td><span id="scaled-${student.id}">0</span></td>
    `;
    tbody.appendChild(row);
  });
  document.querySelectorAll('#sbaTableBody input').forEach(input => {
    input.addEventListener('input', () => calculateSBAScore(input.dataset.id));
  });
}

// 🧮 Calculate SBA scaled score
function calculateSBAScore(studentId) {
  const individual = Math.min(parseInt(document.querySelector(`input[data-id="${studentId}"][data-type="individual"]`)?.value) || 0, 15);
  const group = Math.min(parseInt(document.querySelector(`input[data-id="${studentId}"][data-type="group"]`)?.value) || 0, 15);
  const classTest = Math.min(parseInt(document.querySelector(`input[data-id="${studentId}"][data-type="classTest"]`)?.value) || 0, 15);
  const project = Math.min(parseInt(document.querySelector(`input[data-id="${studentId}"][data-type="project"]`)?.value) || 0, 15);
  const total = Math.min(individual + group + classTest + project, 60);
  const scaled = Math.round((total / 60) * 50);
  document.getElementById(`total-${studentId}`).textContent = total;
  document.getElementById(`scaled-${studentId}`).textContent = scaled;
}

// Get term and year from input fields when submitting SBA/exam/assignment
function getTermYear() {
  const term = document.getElementById('termInput')?.value || '';
  const year = document.getElementById('yearInput')?.value || '';
  return { term, year };
}

// Validation for SBA and Exam entry
function validateMarks(sba, exam) {
  if (sba > 15) {
    alert('SBA marks cannot exceed 15.');
    return false;
  }
  if (exam > 100) {
    alert('Exam marks cannot exceed 100.');
    return false;
  }
  return true;
}

// Helper to reload report if available
function tryReloadReport(studentId) {
  if (typeof loadReportForStudent === 'function') {
    // If report.js is loaded in the same page, reload for this student
    document.getElementById('studentSelect').value = studentId;
    loadReportForStudent();
  } else {
    // Otherwise, show a message to prompt user to refresh/reselect
    alert('Scores submitted! Please refresh or reselect the student in the report dashboard to see updated results.');
  }
}

// ✅ Submit SBA scores
async function submitSBA() {
  const subject = document.getElementById('subjectSelect').value;
  const { term, year } = getTermYear();
  if (!subject || !term || !year) {
    alert('Please select subject, term, and year.');
    return;
  }
  const submissions = [];
  for (const student of students) {
    const scaled = parseInt(document.getElementById(`scaled-${student.id}`).textContent);
    if (isNaN(scaled) || scaled < 0 || scaled > 50) {
  alert(`Invalid SBA score for ${student.first_name || ''} ${student.surname || ''}. Must be between 0 and 50.`);
      continue;
    }
    // Fetch existing exam score for this student/subject/term/year
    let exam_score = 0;
    try {
      const { data: existing } = await supabaseClient
        .from('results')
        .select('exam_score')
        .eq('student_id', student.id)
        .eq('subject', subject)
        .eq('term', term)
        .eq('year', year)
        .single();
      if (existing && typeof existing.exam_score === 'number') {
        exam_score = existing.exam_score;
      }
    } catch (e) {}
    submissions.push({
      student_id: student.id,
      subject,
      term,
      year,
      class_score: scaled,
      exam_score
    });
  }
  if (submissions.length === 0) {
    alert('No valid SBA scores to submit.');
    return;
  }
  const { data, error } = await supabaseClient
    .from('results')
    .upsert(submissions, {
      onConflict: ['student_id', 'subject', 'term', 'year']
    })
    .select();
  if (error) {
    console.error('SBA upsert error:', error.message);
    alert('Failed to submit SBA scores.');
  } else {
    console.log('SBA upserted:', data);
    alert('SBA scores submitted successfully.');
  }
}

// 🧪 Render Exam form
function renderExamForm() {
  const tbody = document.getElementById('examTableBody');
  tbody.innerHTML = '';
  if (!students || students.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="3">No students found for this class.</td>';
    tbody.appendChild(row);
    return;
  }
  students.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
  <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td><input type="number" data-type="exam" data-id="${student.id}" max="100" min="0" /></td>
      <td><span id="examScaled-${student.id}">0</span></td>
    `;
    tbody.appendChild(row);
  });
  document.querySelectorAll('#examTableBody input').forEach(input => {
    input.addEventListener('input', () => {
      const raw = Math.min(parseInt(input.value) || 0, 100);
      const scaled = Math.round((raw / 100) * 50);
      document.getElementById(`examScaled-${input.dataset.id}`).textContent = scaled;
    });
  });
}

// ✅ Submit Exam scores
async function submitExams() {
  const subject = document.getElementById('subjectSelect').value;
  const { term, year } = getTermYear();
  if (!subject || !term || !year) {
    alert('Please select subject, term, and year.');
    return;
  }
  const submissions = [];
  for (const student of students) {
    const scaled = parseInt(document.getElementById(`examScaled-${student.id}`).textContent);
    if (isNaN(scaled) || scaled < 0 || scaled > 50) {
  alert(`Invalid exam score for ${student.first_name || ''} ${student.surname || ''}. Must be between 0 and 50.`);
      continue;
    }
    // Fetch existing SBA score for this student/subject/term/year
    let class_score = 0;
    try {
      const { data: existing } = await supabaseClient
        .from('results')
        .select('class_score')
        .eq('student_id', student.id)
        .eq('subject', subject)
        .eq('term', term)
        .eq('year', year)
        .single();
      if (existing && typeof existing.class_score === 'number') {
        class_score = existing.class_score;
      }
    } catch (e) {}
    submissions.push({
      student_id: student.id,
      subject,
      term,
      year,
      class_score,
      exam_score: scaled
    });
  }
  if (submissions.length === 0) {
    alert('No valid exam scores to submit.');
    return;
  }
  const { data, error } = await supabaseClient
    .from('results')
    .upsert(submissions, {
      onConflict: ['student_id', 'subject', 'term', 'year']
    })
    .select();
  if (error) {
    console.error('Exam upsert error:', error.message);
    alert('Failed to submit exam scores.');
  } else {
    console.log('Exam upserted:', data);
    alert('Exam scores submitted successfully.');
  }
}
// 📤 Send assignment to students
async function sendAssignment() {
  const className = document.getElementById('assignClass')?.value?.trim();
  const subject = document.getElementById('assignSubject')?.value?.trim();
  const term = document.getElementById('assignTerm')?.value?.trim();
  const year = document.getElementById('assignYear')?.value?.trim();
  const title = document.getElementById('assignTitle')?.value?.trim();
  const instructions = document.getElementById('assignText')?.value?.trim();
  const fileInput = document.getElementById('assignFile');
  const file = fileInput && fileInput.files[0];
  if (!teacher || !teacher.id || !className || !subject || !term || !year || !title || !instructions) {
    alert('Please fill in all required fields.');
    return;
  }
  let fileUrl = null;
  if (file) {
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `teacher/${Date.now()}_${safeFileName}`;
    const { data, error } = await supabaseClient.storage
      .from('assignments')
      .upload(filePath, file);
    console.log('Upload response:', data, error);
    if (error) {
      alert('File upload failed: ' + error.message);
      return;
    }
    // Try to extract the file path from the response
    let uploadedPath = null;
    if (data) {
      if (data.path) uploadedPath = data.path;
      else if (data.Key) uploadedPath = data.Key;
      else if (data.id) uploadedPath = data.id;
      else if (typeof data === 'string') uploadedPath = data;
    }
    console.log('Extracted uploadedPath:', uploadedPath);
    if (uploadedPath) {
      const publicUrlResult = supabaseClient.storage
        .from('assignments')
        .getPublicUrl(uploadedPath);
      try {
        console.log('getPublicUrl result:', JSON.stringify(publicUrlResult));
      } catch (e) {
        console.log('getPublicUrl result (raw):', publicUrlResult);
      }
      fileUrl = publicUrlResult && publicUrlResult.data && publicUrlResult.data.publicUrl ? publicUrlResult.data.publicUrl : null;
      if (!fileUrl) {
        alert('File uploaded but public URL could not be generated.');
        return;
      }
    } else {
      alert('File uploaded but no path returned.');
      return;
    }
  }
  const payload = {
    teacher_id: teacher.id,
    class: className,
    subject,
    term,
    year,
    title,
    instructions,
    file_url: fileUrl || null
  };
  const { error } = await supabaseClient.from('assignments').insert([payload]);
  if (error) {
    alert('Assignment submission failed: ' + error.message);
  } else {
    alert('Assignment sent successfully.');
    try {
      document.getElementById('assignTitle').value = '';
      document.getElementById('assignText').value = '';
      document.getElementById('assignFile').value = '';
      document.getElementById('assignClass').value = '';
      document.getElementById('assignSubject').value = '';
      document.getElementById('assignTerm').value = '';
      document.getElementById('assignYear').value = '';
    } catch (e) {}
    await loadAssignments();
    await loadStudentSubmissions();
  }
}

// 📥 Load assignments sent by this teacher (for download by students)
async function loadAssignments() {
  const tbody = document.getElementById('teacherAssignmentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const { data, error } = await supabaseClient
    .from('assignments')
    .select('id, class, subject, term, year, title, instructions, file_url, created_at')
    .eq('teacher_id', teacher.id)
    .order('created_at', { ascending: false });
  if (error || !Array.isArray(data)) {
    tbody.innerHTML = '<tr><td colspan="8">Error loading assignments.</td></tr>';
    return;
  }
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No assignments sent yet.</td></tr>';
    return;
  }
  data.forEach(item => {
    const downloadCell = item.file_url
      ? `<a href="${item.file_url}" target="_blank">Download</a>`
      : '<span style="color:gray;">No file</span>';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.class}</td>
      <td>${item.subject}</td>
      <td>${item.title}</td>
      <td>${item.term}</td>
      <td>${item.year}</td>
      <td>${item.instructions}</td>
      <td>${downloadCell}</td>
      <td>${new Date(item.created_at).toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });
}

// 📬 Load student submissions for assignments sent by this teacher
async function loadStudentSubmissions() {
  const tbody = document.getElementById('studentSubmissionTableBody');
  console.log('DEBUG: loadStudentSubmissions called. Teacher:', teacher);
  if (!tbody) return;
  tbody.innerHTML = '';
  const { data: assignments, error: aErr } = await supabaseClient
    .from('assignments')
    .select('id, title, class')
    .eq('teacher_id', teacher.id);
  console.log('DEBUG: Assignments query result:', assignments, aErr);
  if (aErr || !Array.isArray(assignments) || assignments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No student submissions yet.</td></tr>';
    return;
  }
  const assignmentIds = assignments.map(a => a.id);
  console.log('DEBUG: Teacher assignments IDs:', assignmentIds);
  if (assignmentIds.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No student submissions yet.</td></tr>';
    return;
  }
  const { data: submissions, error: sErr } = await supabaseClient
    .from('student_submissions')
  .select('id, student_id, assignment_id, file_url, submitted_at, students(first_name, surname), assignments(title)')
    .in('assignment_id', assignmentIds);
  console.log('DEBUG: Submissions fetched for these assignment IDs:', submissions, sErr);
  if (sErr || !Array.isArray(submissions) || submissions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No student submissions yet.</td></tr>';
    return;
  }
  submissions.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
  <td>${item.students ? `${item.students.first_name || ''} ${item.students.surname || ''}`.trim() : item.student_id}</td>
      <td>${item.assignments?.title || item.assignment_id}</td>
      <td>${new Date(item.submitted_at).toLocaleString()}</td>
      <td>${item.file_url ? `<a href="${item.file_url}" target="_blank">Download</a>` : 'No file'}</td>
      <td>${item.id}</td>
    `;
    tbody.appendChild(row);
  });
}

// Load students for Student List tab (read-only)
async function loadStudentList() {
  const classFilter = document.getElementById('studentClassFilter');
  const tbody = document.getElementById('studentListTableBody');
  if (!teacher || !teacher.classes || teacher.classes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No assigned classes.</td></tr>';
    return;
  }
  // Get selected class
  const selectedClass = classFilter ? classFilter.value : '';
  let studentsData = [];
  let error = null;
  if (selectedClass) {
    // Only fetch students for the selected class
    const { data, error: err } = await supabaseClient.from('students').select('first_name, surname, class, gender, dob, parent_name, parent_contact, nhis_number').eq('class', selectedClass);
    studentsData = data || [];
    error = err;
  } else {
    // Fetch students for all assigned classes
    const { data, error: err } = await supabaseClient.from('students').select('first_name, surname, class, gender, dob, parent_name, parent_contact, nhis_number').in('class', teacher.classes);
    studentsData = data || [];
    error = err;
  }
  tbody.innerHTML = '';
  if (error || !Array.isArray(studentsData) || studentsData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">${selectedClass ? 'No students found in this class.' : 'No students found.'}</td></tr>`;
    return;
  }
  studentsData.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td>${student.class || ''}</td>
      <td>${student.gender || ''}</td>
      <td>${student.dob || ''}</td>
      <td>${student.parent_name || ''}</td>
      <td>${student.parent_contact || ''}</td>
      <td>${student.nhis_number || ''}</td>
    `;
    tbody.appendChild(row);
  });
}

// Show Student List tab and load students
window.showStudentListSection = function() {
  showTabSection('studentListSection');
  // Always repopulate class filter with assigned classes
  const classFilter = document.getElementById('studentClassFilter');
  if (classFilter) {
    classFilter.innerHTML = '<option value="">-- All Assigned Classes --</option>';
    if (teacher && teacher.classes && teacher.classes.length > 0) {
      teacher.classes.forEach(cls => {
        const opt = document.createElement('option');
        opt.value = cls;
        opt.textContent = cls;
        classFilter.appendChild(opt);
      });
    } else {
      // If no assigned classes, show a disabled option
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No assigned classes';
      opt.disabled = true;
      classFilter.appendChild(opt);
    }
  }
  loadStudentList();
}

// Add event listener for class filter
window.addEventListener('DOMContentLoaded', () => {
  const classFilter = document.getElementById('studentClassFilter');
  if (classFilter) {
    classFilter.addEventListener('change', loadStudentList);
  }
});
// On page load, load teacher dashboard if session exists
window.addEventListener('DOMContentLoaded', function() {
  let staffId = sessionStorage.getItem('teacher_staff_id');
  if (!staffId) {
    const teacherId = localStorage.getItem('teacherId');
    if (teacherId) {
      supabaseClient.from('teachers').select('staff_id').eq('id', teacherId).single().then(({ data, error }) => {
        if (data && data.staff_id) {
          sessionStorage.setItem('teacher_staff_id', data.staff_id);
          loadTeacherDashboard(data.staff_id);
        } else {
          document.getElementById('welcomeMessage').textContent = 'No teacher session found. Please log in again.';
        }
      });
      return;
    }
  }
  if (staffId) {
    loadTeacherDashboard(staffId);
    // Also set up tab event for motivation
    const motivationTab = document.querySelector(".tab-btn[onclick*='motivationSection']");
    if (motivationTab) {
      motivationTab.addEventListener('click', () => {
        setTimeout(() => populateMotivationStudentDropdown(), 100); // reload motivation dropdown when tab is shown
      });
    }
      // Also set up tab event for resource requests
      const resourceTab = document.querySelector(".tab-btn[onclick*='resourceRequestsSection']");
      if (resourceTab) {
        resourceTab.addEventListener('click', () => {
          setTimeout(() => loadResourceRequests(), 100); // reload resource requests when tab is shown
        });
      }
    // Also set up tab event for messages
    const messagesTab = document.querySelector(".tab-btn[onclick*='messagesSection']");
    if (messagesTab) {
      messagesTab.addEventListener('click', () => {
        setTimeout(() => loadStudentMessages(), 100); // reload messages when tab is shown
      });
    }
  } else {
    document.getElementById('welcomeMessage').textContent = 'No teacher session found. Please log in again.';
  }

  // Add event listeners to class and subject dropdowns for SBA
  const classSelect = document.getElementById('classSelect');
  const subjectSelect = document.getElementById('subjectSelect');
  if (classSelect) classSelect.addEventListener('change', () => loadStudents('sba'));
  if (subjectSelect) subjectSelect.addEventListener('change', () => loadStudents('sba'));
  // Add event listeners to class and subject dropdowns for Exam
  const classSelectExam = document.getElementById('classSelectExam');
  const subjectSelectExam = document.getElementById('subjectSelectExam');
  if (classSelectExam) classSelectExam.addEventListener('change', () => loadStudents('exam'));
  if (subjectSelectExam) subjectSelectExam.addEventListener('change', () => loadStudents('exam'));
});

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.toggle('open');
    panel.style.display = panel.classList.contains('open') ? 'block' : 'none';
  }
}