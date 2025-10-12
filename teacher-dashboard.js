// Logout function for teacher dashboard
function logout() {
  sessionStorage.clear();
  sessionStorage.removeItem('teacher_staff_id');
  localStorage.removeItem('teacherId');
  window.location.href = 'login.html';
}

window.addEventListener('DOMContentLoaded', function() {
  // Prevent access if not logged in as teacher
  const teacherId = localStorage.getItem('teacherId');
  if (!teacherId) {
    window.location.href = 'login.html';
    return;
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }
});
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
  let classVal = document.getElementById('attendanceClassSelect').value;
  classVal = classVal ? classVal.trim() : '';
  console.log('[Attendance] Normalized class value:', classVal);
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';
  if (!classVal) return;
  // Try to match class ignoring case and trimming spaces
  // DEBUG: Fetch all students regardless of class to inspect actual class values
  // Query students matching the selected class (case-insensitive, trimmed)
  const { data, error } = await supabaseClient
    .from('students')
    .select('id, first_name, surname, class')
    .or(`class.ilike.${classVal},class.eq.${classVal}`);
  if (error || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:red;">No students found for this class. If you are the class teacher, please check that students are registered for this class in the system.</td></tr>';
    return;
  }
  data.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td style="text-align:center;">
        <input type="checkbox" class="attendance-present" data-student-id="${student.id}" checked /> Present
      </td>
      <td>
        <select class="attendance-late" data-student-id="${student.id}">
          <option value="No">No</option>
          <option value="Yes">Yes</option>
        </select>
      </td>
    `;
    tbody.appendChild(row);
  });
  // Add check all logic
  const checkAll = document.getElementById('checkAllPresent');
  if (checkAll) {
    checkAll.checked = true;
    checkAll.onclick = function() {
      document.querySelectorAll('.attendance-present').forEach(cb => {
        cb.checked = checkAll.checked;
      });
    };
  }
}

// Submit attendance to Supabase
async function submitAttendance() {
  const classVal = document.getElementById('attendanceClassSelect').value;
  const dateVal = document.getElementById('attendanceDate').value;
  if (!classVal || !dateVal) {
    alert('Please select class and date.');
    return;
  }
  const presentCheckboxes = document.querySelectorAll('.attendance-present');
  const lateSelects = document.querySelectorAll('.attendance-late');
  const records = Array.from(presentCheckboxes).map(cb => {
    const student_id = cb.getAttribute('data-student-id');
    const isPresent = cb.checked;
    const lateSel = Array.from(lateSelects).find(sel => sel.getAttribute('data-student-id') === student_id);
    const isLate = lateSel && lateSel.value === 'Yes';
    let status = 'Absent';
    if (isPresent && isLate) status = 'Late';
    else if (isPresent) status = 'Present';
    else status = 'Absent';
    return {
      student_id,
      class: classVal,
      date: dateVal,
      status,
      marked_by: teacher.id
    };
  });
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
    .select('id, first_name, surname, class', { head: true })
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
    .select('id, student_id, resource, reason, response, created_at, students(first_name, surname)', { head: true })
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
  // Try to get staffId from all possible sources if not provided
  if (!staffId) {
    staffId = sessionStorage.getItem('teacher_staff_id') || localStorage.getItem('teacher_staff_id') || localStorage.getItem('teacherId') || sessionStorage.getItem('teacherId');
    if (!staffId && window.teacher && window.teacher.staff_id) {
      staffId = window.teacher.staff_id;
    }
  }
  // If still no staffId, show error and return
  if (!staffId) {
    document.getElementById('welcomeMessage').textContent = 'Access denied or teacher not found. Please log in with your Staff ID.';
    setTimeout(() => {
      window.location.href = 'login.html?role=teacher';
    }, 2000);
    return;
  }
  // Debug: Show staffId being used, type, and trimmed value
  const debugDiv = document.getElementById('debugStaffId');
  let originalStaffId = staffId;
  staffId = staffId.trim();
  if (debugDiv) debugDiv.textContent = `Querying teacher with staff ID: '${staffId}' (type: ${typeof staffId}, original: '${originalStaffId}')`;
  // Load teacher basic info
  const { data: teacherData, error: teacherError } = await supabaseClient
    .from('teachers')
    .select('id, name, staff_id, responsibility')
    .eq('staff_id', staffId)
    .single();
  if (teacherError || !teacherData) {
    document.getElementById('welcomeMessage').textContent = 'Teacher not found for staff ID: ' + staffId + '.\nError: ' + (teacherError ? teacherError.message : 'No data returned.');
    if (debugDiv) debugDiv.textContent += `\nSupabase error: ${teacherError ? teacherError.message : 'No data'}\nFetching all staff_id values for debug...`;
    // Fetch all staff_id values for debug
    const { data: allTeachers, error: allTeachersError } = await supabaseClient
      .from('teachers')
      .select('staff_id');
    if (debugDiv) {
      if (allTeachersError) {
        debugDiv.textContent += `\nError fetching all staff_id: ${allTeachersError.message}`;
      } else if (Array.isArray(allTeachers)) {
        debugDiv.textContent += `\nAll staff_id values in DB: [${allTeachers.map(t => `'${t.staff_id}' (${typeof t.staff_id})`).join(', ')}]`;
      }
    }
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
        const prevClass = classSelectExam.value;
        const allowedClasses = teacher.assignments.filter(a => a.subject === subjectVal).map(a => a.class);
        classSelectExam.innerHTML = `<option value="">-- Select Class --</option>`;
        [...new Set(allowedClasses)].forEach(cls => {
          const opt = document.createElement('option');
          opt.value = cls;
          opt.textContent = cls;
          classSelectExam.appendChild(opt);
        });
        // Restore previous selection if still valid
        if (allowedClasses.includes(prevClass)) {
          classSelectExam.value = prevClass;
        }
      });
      classSelectExam.addEventListener('change', function() {
        const classVal = classSelectExam.value;
        const prevSubject = subjectSelectExam.value;
        const allowedSubjects = teacher.assignments.filter(a => a.class === classVal).map(a => a.subject);
        subjectSelectExam.innerHTML = `<option value="">-- Select Subject --</option>`;
        [...new Set(allowedSubjects)].forEach(subj => {
          const opt = document.createElement('option');
          opt.value = subj;
          opt.textContent = subj;
          subjectSelectExam.appendChild(opt);
        });
        // Restore previous selection if still valid
        if (allowedSubjects.includes(prevSubject)) {
          subjectSelectExam.value = prevSubject;
        }
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
  if (!classVal) {
    tbody.innerHTML = '<tr><td colspan="2">No JHS 2 students found.</td></tr>';
    return;
  }
  const { data, error } = await supabaseClient
    .from('students')
    .select('id, first_name, surname')
    .eq('class', classVal);
  if (error || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2">No JHS 2 students found.</td></tr>';
    return;
  }
  // Only load marks if subject, term, and year are selected
  let promoMarksMap = {};
  const promoYear = document.getElementById('promotionYearInput').value;
  const promoTerm = document.getElementById('promotionTermInput').value;
  if (subjectVal && promoTerm && promoYear) {
    const { data: promoMarksData, error: promoMarksError } = await supabaseClient
      .from('promotion_exams')
      .select('student_id, score')
      .eq('class', classVal)
      .eq('subject', subjectVal)
      .eq('term', promoTerm)
      .eq('year', promoYear);
    if (!promoMarksError && Array.isArray(promoMarksData)) {
      promoMarksData.forEach(m => { promoMarksMap[m.student_id] = m.score; });
    }
  }
  data.forEach(student => {
    // Pre-fill score if available
    const scorePrefill = promoMarksMap[student.id] !== undefined ? promoMarksMap[student.id] : '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td><input type="number" min="0" max="100" class="promotion-score" data-student-id="${student.id}" value="${scorePrefill}" /></td>
    `;
    tbody.appendChild(row);
  });

  // After loading students, show pass/fail summary if year and term are selected
  if (promoYear && promoTerm === 'Promotion') {
    showPromotionPassFailSummary(promoYear);
  }
}

// Show number of students who passed and failed
async function showPromotionPassFailSummary(yearVal) {
  const classVal = document.getElementById('promotionClassSelect').value;
  const tbody = document.getElementById('promotionExamTableBody');
  // Get all promotion exam entries for JHS 2, selected year, and term 'Promotion'
  const { data, error } = await supabaseClient
    .from('promotion_exams')
    .select('student_id, score')
    .eq('class', classVal)
    .eq('term', 'Promotion')
    .eq('year', yearVal)
    .eq('submitted_to_admin', true);
  if (error || !Array.isArray(data)) return;
  // Calculate total scores per student
  const totalScores = {};
  data.forEach(entry => {
    if (!totalScores[entry.student_id]) totalScores[entry.student_id] = 0;
    totalScores[entry.student_id] += entry.score;
  });
  // Set pass mark (can be made configurable)
  const passMark = 300;
  let passed = 0, failed = 0;
  Object.values(totalScores).forEach(score => {
    if (score >= passMark) passed++;
    else failed++;
  });
  let summaryDiv = document.getElementById('promotionPassFailSummary');
  const table = tbody ? tbody.closest('table') : null;
  if (!summaryDiv && table) {
    summaryDiv = document.createElement('div');
    summaryDiv.id = 'promotionPassFailSummary';
    summaryDiv.style.margin = '1rem 0';
    summaryDiv.style.fontWeight = 'bold';
    table.parentElement.insertBefore(summaryDiv, table);
  }
  if (summaryDiv) {
    summaryDiv.innerHTML = `<span style="color:green;">Passed: ${passed}</span> &nbsp; <span style="color:red;">Failed: ${failed}</span>`;
  }
}

// Promotion Exam: Submit entries to Supabase
async function submitPromotionExam() {
  const classVal = document.getElementById('promotionClassSelect').value;
  const subjectVal = document.getElementById('promotionSubjectSelect').value;
  const termVal = document.getElementById('promotionTermInput').value;
  const yearVal = document.getElementById('promotionYearInput').value;
  if (!classVal || !subjectVal || !termVal || !yearVal) {
      alert('Please select class, subject, term, and year.');
    return;
  }
  // Ensure term is valid
  const allowedTerms = ['First', 'Second', 'Third', 'Promotion'];
  if (!allowedTerms.includes(termVal)) {
    alert('Invalid term value.');
    return;
  }
  const scoreInputs = document.querySelectorAll('.promotion-score');
  const records = Array.from(scoreInputs).map(input => ({
    student_id: input.getAttribute('data-student-id'),
    class: classVal,
    subject: subjectVal,
    term: termVal,
    year: yearVal, // year is TEXT in schema
    score: parseInt(input.value, 10) || 0,
    marked_by: teacher.id,
    submitted_to_admin: true
  }));
  if (records.length === 0) {
    alert('No students to mark.');
    return;
  }
  try {
    const { error, data } = await supabaseClient
      .from('promotion_exams')
      .upsert(records, { onConflict: ['student_id', 'class', 'subject', 'term', 'year'] });
    if (error) {
      console.error('Promotion exam upsert error:', error);
      alert('Failed to submit promotion exam: ' + (error.message || JSON.stringify(error)));
    } else {
      alert('Promotion exam submitted to admin!');
      document.getElementById('promotionExamTableBody').innerHTML = '';
      // Optionally reload students to repopulate form with latest marks
      loadPromotionExamStudents();
    }
  } catch (err) {
    console.error('Promotion exam upsert exception:', err);
    alert('Unexpected error: ' + err.message);
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
  // Restrict loading students for attendance to Class Teacher only
  if (!teacher || teacher.responsibility !== 'Class Teacher') {
    students = [];
    if (section === 'sba') {
      renderSBAForm({});
      const sbaTable = document.getElementById('sbaTableBody');
      if (sbaTable) {
        sbaTable.innerHTML = '<tr><td colspan="10" style="color:red;">Only Class Teachers can load students for attendance.</td></tr>';
      }
    } else if (section === 'exam') {
      renderExamForm({});
      const examTable = document.getElementById('examTableBody');
      if (examTable) {
        examTable.innerHTML = '<tr><td colspan="10" style="color:red;">Only Class Teachers can load students for attendance.</td></tr>';
      }
    }
    return;
  }
  let selectedClass, selectedSubject;
  if (section === 'exam') {
    selectedClass = document.getElementById('classSelectExam').value;
    selectedSubject = document.getElementById('subjectSelectExam').value;
  } else {
    selectedClass = document.getElementById('classSelect').value;
    selectedSubject = document.getElementById('subjectSelect').value;
  }
  // Load students as soon as class is selected
  if (!selectedClass) {
    students = [];
    if (section === 'sba') renderSBAForm({});
    else if (section === 'exam') renderExamForm({});
    return;
  }
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
  // Only load marks if subject, term, and year are selected
  let marksMap = {};
  if (section === 'sba') {
    const { term, year } = getTermYear();
    if (selectedSubject && term && year) {
      try {
        const result = await supabaseClient
          .from('results')
          .select('student_id, class_score')
          .eq('subject', selectedSubject)
          .eq('term', term)
          .eq('year', year);
        const marksData = result.data;
        if (Array.isArray(marksData)) {
          marksData.forEach(m => {
            if (m.class_score !== undefined && m.class_score !== null) {
              marksMap[m.student_id] = m.class_score;
            }
          });
        }
      } catch (err) {
        console.error('SBA marks query failed:', err);
        alert('Failed to load SBA marks. Please check your database columns.');
      }
    }
    renderSBAForm(marksMap);
  } else if (section === 'exam') {
    const term = document.getElementById('termInputExam')?.value || '';
    const year = document.getElementById('yearInputExam')?.value || '';
    if (selectedSubject && term && year) {
      const { data: examMarksData, error: examMarksError } = await supabaseClient
        .from('results')
        .select('student_id, exam_score')
        .eq('subject', selectedSubject)
        .eq('term', term)
        .eq('year', year);
      if (!examMarksError && Array.isArray(examMarksData)) {
        examMarksData.forEach(m => { marksMap[m.student_id] = m.exam_score; });
      }
    }
    renderExamForm(marksMap);
  }
}

// 📝 Render SBA form
function renderExamForm(examMarksMap = {}) {
  const tbody = document.getElementById('examTableBody');
  tbody.innerHTML = '';
  if (!students || students.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="3">No students found for this class.</td>';
    tbody.appendChild(row);
    return;
  }
  students.forEach(student => {
    // Pre-fill exam score if available
    const examPrefill = examMarksMap[student.id] !== undefined ? examMarksMap[student.id] : 0;
    const scaledPrefill = Math.round((examPrefill / 100) * 50);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td><input type="number" data-type="exam" data-id="${student.id}" max="100" min="0" value="${examPrefill}" /></td>
      <td><span id="examScaled-${student.id}">${scaledPrefill}</span></td>
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
      alert('Please select class, subject, term, and year.');
    return;
  }
    const classVal = document.getElementById('classSelect').value;
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
function renderSBAForm(marksMap = {}) {
  const tbody = document.getElementById('sbaTableBody');
  tbody.innerHTML = '';
  if (!students || students.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="7">No students found for this class.</td>';
    tbody.appendChild(row);
    return;
  }
  students.forEach(student => {
    // Pre-fill all SBA components if available
    let individual = 0, group = 0, classTest = 0, project = 0, scaledPrefill = 0, totalPrefill = 0;
    if (typeof marksMap[student.id] === 'number') {
      // Only class_score available
      scaledPrefill = marksMap[student.id];
      totalPrefill = Math.round((scaledPrefill / 50) * 60);
    }
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td><input type="number" data-type="individual" data-id="${student.id}" max="15" min="0" value="${individual}" /></td>
      <td><input type="number" data-type="group" data-id="${student.id}" max="15" min="0" value="${group}" /></td>
      <td><input type="number" data-type="classTest" data-id="${student.id}" max="15" min="0" value="${classTest}" /></td>
      <td><input type="number" data-type="project" data-id="${student.id}" max="15" min="0" value="${project}" /></td>
      <td><span id="total-${student.id}">${totalPrefill}</span></td>
      <td><span id="scaled-${student.id}">${scaledPrefill}</span></td>
    `;
    tbody.appendChild(row);
  });
  document.querySelectorAll('#sbaTableBody input').forEach(input => {
    input.addEventListener('input', () => calculateSBAScore(input.dataset.id));
  });
}

// ✅ Submit Exam scores
async function submitExams() {
  const subject = document.getElementById('subjectSelectExam').value;
  const term = document.getElementById('termInputExam').value;
  const year = document.getElementById('yearInputExam').value;
  if (!subject || !term || !year) {
      alert('Please select class, subject, term, and year.');
    return;
  }
    const classVal = document.getElementById('classSelectExam').value;
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
    // Clear Exam form fields after submit
    document.getElementById('examTableBody').innerHTML = '';
    // Optionally reload students to repopulate form with latest marks
    loadStudents('exam');
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
  // Prevent sending assignment to class/subject not assigned to teacher
  const isAssigned = teacher.assignments && teacher.assignments.some(a => a.class === className && a.subject === subject);
  if (!isAssigned) {
    alert('You are not assigned to this class and subject. You cannot compose an assignment for it.');
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
// Change PIN modal logic
window.addEventListener('DOMContentLoaded', function() {
  const changePinBtn = document.getElementById('changePinBtn');
  let changePinModal = document.getElementById('changePinModal');
  const changePinForm = document.getElementById('changePinForm');
  if (changePinBtn && changePinModal) {
    changePinBtn.onclick = function() {
      changePinModal.classList.remove('hidden');
    };
  }
  window.closeChangePinModal = function() {
    changePinModal.classList.add('hidden');
    changePinForm.reset();
  };
  if (changePinForm) {
    changePinForm.onsubmit = async function(e) {
      e.preventDefault();
      const currentPin = document.getElementById('currentPin').value.trim();
      const newPin = document.getElementById('newPin').value.trim();
      if (!teacher || !teacher.id) {
        alert('Teacher session not found.');
        return;
      }
      // Fetch teacher record to verify current PIN
      const { data, error } = await supabaseClient.from('teachers').select('pin').eq('id', teacher.id).single();
      if (error || !data) {
        alert('Failed to verify current PIN.');
        return;
      }
      if (data.pin !== currentPin) {
        alert('Current PIN is incorrect.');
        return;
      }
      // Update PIN
      const { error: updateError } = await supabaseClient.from('teachers').update({ pin: newPin }).eq('id', teacher.id);
      if (updateError) {
        alert('Failed to update PIN.');
        return;
      }
      alert('PIN changed successfully!');
      closeChangePinModal();
    };
  }
});
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

    // Add event listeners to term and year fields for Exam section
    const termInputExam = document.getElementById('termInputExam');
    const yearInputExam = document.getElementById('yearInputExam');
    if (termInputExam) termInputExam.addEventListener('change', () => loadStudents('exam'));
    if (yearInputExam) yearInputExam.addEventListener('input', () => loadStudents('exam'));
});

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.toggle('open');
    panel.style.display = panel.classList.contains('open') ? 'block' : 'none';
  }
}