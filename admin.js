document.addEventListener('DOMContentLoaded', function() {
  const classSelect = document.getElementById('promotionAdminClassSelect');
  const subjectSelect = document.getElementById('promotionAdminSubjectSelect');
  const termSelect = document.getElementById('promotionAdminTermSelect');
  const yearInput = document.getElementById('promotionAdminYearInput');
  if (classSelect && subjectSelect && termSelect && yearInput) {
    classSelect.addEventListener('change', () => {
      populatePromotionAdminSubjects();
      setTimeout(() => {
  loadPromotionExamEntries();
      }, 50);
    });
  subjectSelect.addEventListener('change', loadPromotionExamEntries);
  termSelect.addEventListener('change', loadPromotionExamEntries);
  yearInput.addEventListener('input', loadPromotionExamEntries);
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
      if (tabSection) {
        tabSection.style.display = '';
        tabSection.classList.remove('tab-section');
        tabSection.hidden = false;
      }
      if (classSelect) classSelect.value = 'JHS 2';
      if (termSelect) termSelect.value = 'Promotion';
      populatePromotionAdminSubjects();
      setTimeout(() => {
  loadPromotionExamEntries();
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