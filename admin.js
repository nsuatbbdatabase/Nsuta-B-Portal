// Promotion Exam Admin: Load submitted promotion exam entries
async function loadPromotionExamAdminEntries() {
  const classVal = document.getElementById('promotionAdminClassSelect').value;
  const subjectVal = document.getElementById('promotionAdminSubjectSelect').value;
  const yearVal = document.getElementById('promotionAdminYearInput').value;
  const tbody = document.getElementById('promotionExamAdminTableBody');
  tbody.innerHTML = '';
  let query = supabaseClient.from('promotion_exams').select('student_id, class, subject, term, year, score, marked_by, students(first_name, surname), teachers(name)');
  query = query.eq('class', classVal);
  if (subjectVal) query = query.eq('subject', subjectVal);
  if (yearVal) query = query.eq('year', yearVal);
  query = query.eq('submitted_to_admin', true);
  const { data, error } = await query;
  if (error) {
    console.error('Promotion exam query error:', error);
    tbody.innerHTML = '<tr><td colspan="6" style="color:red;">Error loading promotion exam entries.</td></tr>';
    return;
  }
  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No promotion exam entries found.</td></tr>';
    return;
  }
  data.forEach(entry => {
    const studentName = entry.students ? `${entry.students.first_name || ''} ${entry.students.surname || ''}`.trim() : entry.student_id;
    const teacherName = entry.teachers ? entry.teachers.name : entry.marked_by;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${studentName}</td>
      <td>${entry.subject}</td>
      <td>${entry.score}</td>
      <td>${entry.term}</td>
      <td>${entry.year}</td>
      <td>${teacherName}</td>
    `;
    tbody.appendChild(row);
  });
}

// Populate promotion subjects dropdown (all JHS 2 subjects submitted)
async function populatePromotionAdminSubjects() {
  const select = document.getElementById('promotionAdminSubjectSelect');
  select.innerHTML = '<option value="">-- All Subjects --</option>';
  const { data, error } = await supabaseClient
    .from('promotion_exams')
    .select('subject')
    .eq('class', 'JHS 2');
  if (!error && Array.isArray(data)) {
    const subjects = [...new Set(data.map(e => e.subject))];
    subjects.forEach(subj => {
      const opt = document.createElement('option');
      opt.value = subj;
      opt.textContent = subj;
      select.appendChild(opt);
    });
  }
}

// Add event listeners for admin promotion exam tab
document.addEventListener('DOMContentLoaded', function() {
  const classSelect = document.getElementById('promotionAdminClassSelect');
  const subjectSelect = document.getElementById('promotionAdminSubjectSelect');
  const yearInput = document.getElementById('promotionAdminYearInput');
  if (classSelect && subjectSelect && yearInput) {
    classSelect.addEventListener('change', () => {
      populatePromotionAdminSubjects();
      setTimeout(() => {
        loadPromotionExamAdminEntries();
      }, 50);
    });
    subjectSelect.addEventListener('change', loadPromotionExamAdminEntries);
    yearInput.addEventListener('input', loadPromotionExamAdminEntries);
  }
  // If tab is opened, always reset and reload
  const promoCard = document.querySelector('.dashboard-card[data-section="promotionExamAdminSection"]');
  if (promoCard) {
    promoCard.addEventListener('click', () => {
      // Show the tab-section explicitly
      document.getElementById('dashboardOverview').style.display = 'none';
      document.querySelectorAll('.tab-section').forEach(section => {
        section.style.display = 'none';
      });
      var tabSection = document.getElementById('promotionExamAdminSection');
      if (tabSection) tabSection.style.display = 'block';
      if (classSelect) classSelect.value = 'JHS 2';
      populatePromotionAdminSubjects();
      setTimeout(() => {
        loadPromotionExamAdminEntries();
      }, 50);
    });
  }
});
// Export students as CSV
function exportStudentsCSV() {
  if (!allStudents || allStudents.length === 0) {
    alert('No student data to export.');
    return;
  }
  const headers = [
    'Name', 'Area', 'DOB', 'NHIS Number', 'Gender', 'Class', 'Parent', 'Contact', 'Username', 'PIN'
  ];
  const rows = allStudents.map(s => [
    ((s.first_name || '') + ' ' + (s.surname || '')).trim(),
    s.area || '',
    s.dob || '',
    s.nhis_number || '',
    s.gender || '',
    s.class || '',
    s.parent_name || '',
    s.parent_contact || '',
    s.username || '',
    s.pin || ''
  ]);
  let csvContent = '';
  csvContent += headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(val => '"' + val.replace(/"/g, '""') + '"').join(',') + '\n';
  });
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students_export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// Show attendance note if Class Teacher is selected in teacher modal
document.addEventListener('DOMContentLoaded', function() {
  var responsibilitySelect = document.getElementById('responsibility');
  var attendanceNote = document.getElementById('attendanceNote');
  if (responsibilitySelect && attendanceNote) {
    responsibilitySelect.addEventListener('change', function() {
      if (responsibilitySelect.value === 'Class Teacher') {
        attendanceNote.style.display = '';
      } else {
        attendanceNote.style.display = 'none';
      }
    });
  }
});

// Use the supabaseClient already declared in dashboard.js

// Show only the selected student's details in the table
function showSelectedStudent() {
  const studentId = document.getElementById('studentSelect').value;
  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';
  if (!studentId) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="12" style="text-align:center;">No student selected</td>';
    tbody.appendChild(row);
    return;
  }
  const student = allStudents.find(s => s.id == studentId);
  if (!student) return;
  const name = (student.first_name && student.surname)
    ? student.first_name + ' ' + student.surname
    : (student.first_name || student.surname || '[No Name]');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${student.picture_url ? `<img src="${student.picture_url}" alt="pic" width="40">` : ''}</td>
    <td>${name}</td>
    <td>${student.area || ''}</td>
    <td>${student.dob || ''}</td>
    <td>${student.nhis_number || ''}</td>
    <td>${student.gender || ''}</td>
    <td>${student.class || ''}</td>
    <td>${student.parent_name || ''}</td>
    <td>${student.parent_contact || ''}</td>
    <td>${student.username || ''}</td>
    <td>${student.pin || ''}</td>
    <td><!-- Actions here --></td>
  `;
  tbody.appendChild(row);
}

let allStudents = [];

// --- School Dates Logic ---
async function fetchAndDisplaySchoolDates() {
  const { data, error } = await supabaseClient
    .from('school_dates')
    .select('*')
    .order('inserted_at', { ascending: false })
    .limit(1);
  if (error) {
    document.getElementById('vacationDateDisplay').textContent = '—';
    document.getElementById('reopenDateDisplay').textContent = '—';
    return;
  }
  const latest = data && data.length > 0 ? data[0] : null;
  document.getElementById('vacationDateDisplay').textContent = latest && latest.vacation_date ? new Date(latest.vacation_date).toLocaleDateString() : '—';
  document.getElementById('reopenDateDisplay').textContent = latest && latest.reopen_date ? new Date(latest.reopen_date).toLocaleDateString() : '—';
  // Pre-fill modal form if editing
  if (latest) {
    document.getElementById('vacation_date').value = latest.vacation_date || '';
    document.getElementById('reopen_date').value = latest.reopen_date || '';
  } else {
    document.getElementById('vacation_date').value = '';
    document.getElementById('reopen_date').value = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplaySchoolDates();
  const schoolDatesForm = document.getElementById('schoolDatesForm');
  if (schoolDatesForm) {
    schoolDatesForm.onsubmit = async function(e) {
      e.preventDefault();
      const vacation_date = document.getElementById('vacation_date').value;
      const reopen_date = document.getElementById('reopen_date').value;
      // Upsert (insert or update latest row)
      const { data, error } = await supabaseClient.rpc('upsert_school_dates', {
        vacation_date,
        reopen_date
      });
      if (error) {
        alert('Failed to save dates');
        return;
      }
      closeModal('schoolDatesModal');
      fetchAndDisplaySchoolDates();
    };
  }
});

// Fetch all students on page load
window.addEventListener('DOMContentLoaded', async () => {
  await fetchAndRenderStudents();
  document.getElementById('classFilter').addEventListener('change', filterStudentsByClass);
});

async function fetchAndRenderStudents() {
  const { data, error } = await supabaseClient.from('students').select('*');
  if (error) {
    alert('Failed to fetch students');
    return;
  }
  allStudents = data || [];
  filterStudentsByClass();
}

function filterStudentsByClass() {
  const classValue = document.getElementById('classFilter').value.trim().toUpperCase();
  // Only show students in dropdown that match the selected class
  const filtered = classValue
    ? allStudents.filter(s => (s.class || '').trim().toUpperCase() === classValue)
    : allStudents;
  // Update student dropdown
  const studentSelect = document.getElementById('studentSelect');
  studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
  filtered.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    let name = '';
    if (s.first_name && s.surname) {
      name = s.first_name + ' ' + s.surname;
    } else if (s.first_name) {
      name = s.first_name;
    } else if (s.surname) {
      name = s.surname;
    } else {
      name = '[No Name]';
    }
    opt.textContent = name + (s.class ? ` (${s.class})` : '');
    opt.dataset.class = s.class || '';
    opt.dataset.picture = s.picture_url || '';
    studentSelect.appendChild(opt);
  });
  // Clear student table and show message
  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';
  const row = document.createElement('tr');
  row.innerHTML = '<td colspan="12" style="text-align:center;">No student selected</td>';
  tbody.appendChild(row);
}