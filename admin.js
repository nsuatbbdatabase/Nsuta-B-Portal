
// Use the supabaseClient already declared in dashboard.js

// Show only the selected student's details in the table
function showSelectedStudent() {
  const studentId = document.getElementById('studentSelect').value;
  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';

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