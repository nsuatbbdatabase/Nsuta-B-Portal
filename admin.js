// Modal open/close logic
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = '';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // CSV Import Handler
  const importInput = document.getElementById('csvInput');
  if (importInput) {
    importInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function(evt) {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          alert('CSV file is empty or missing data.');
          return;
        }
  const headers = lines[0].split(/\t|,/).map(h => h.trim());
  // Normalize headers for case-insensitive matching
  const normalizedHeaders = headers.map(h => h.toLowerCase());
        let successCount = 0, failCount = 0, failRows = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(/\t|,/);
          if (row.length < 5) continue;
          const rowObj = {};
          headers.forEach((h, idx) => rowObj[h] = row[idx] ? row[idx].trim() : '');
          // Support uppercase 'FULL NAME' header
          const fullNameValue = rowObj['Full Name'] || rowObj['FULL NAME'] || rowObj['full name'] || '';
          const { first_name, surname } = splitFullName(fullNameValue);
          // Split full name (case-insensitive)
          // Prepare student data
          const studentData = {
            first_name,
            surname,
            full_name: rowObj['Full Name'] || '',
            area: rowObj['Area'] || '',
            dob: rowObj['DOB'] || '',
            nhis_number: rowObj['NHIS Number'] || '',
            gender: rowObj['Gender'] || '',
            class: rowObj['Class'] || '',
            parent_name: rowObj['Parent'] || '',
            parent_contact: rowObj['Contact'] || '',
            username: rowObj['Username'] || generateUsername(first_name, surname),
            pin: rowObj['PIN'] || generatePin(),
          };
          // Prevent duplicate by username/class
          const { data: existing, error: existErr } = await supabaseClient.from('students').select('id').eq('username', studentData.username).eq('class', studentData.class);
          if (existing && existing.length) {
            failCount++;
            failRows.push(i+1);
            continue;
          }
          const { error } = await supabaseClient.from('students').insert([studentData]);
          if (error) {
            failCount++;
            failRows.push(i+1);
          } else {
            successCount++;
          }
        }
        alert(`Import complete. Success: ${successCount}, Failed: ${failCount}${failRows.length ? '\nFailed rows: ' + failRows.join(', ') : ''}`);
      };
      reader.readAsText(file);
    });
  }
});
// Export students as CSV
// Split full name into first name and surname
// Generate username and pin
function splitFullName(fullName) {
  const parts = fullName.trim().split(' ');
  const surname = parts.length > 1 ? parts.pop() : '';
  const firstName = parts.join(' ');
  return { first_name: firstName, surname: surname };
}
  // Intercept student form submission to support full name splitting
  const studentForm = document.getElementById('studentForm');
  if (studentForm) {
    studentForm.addEventListener('submit', function(e) {
      const fullNameInput = studentForm.querySelector('[name="full_name"]');
      if (fullNameInput) {
        e.preventDefault();
        const { first_name, surname } = splitFullName(fullNameInput.value);
        studentForm.querySelector('[name="first_name"]').value = first_name;
        studentForm.querySelector('[name="surname"]').value = surname;
        // Auto-generate username and pin if missing
        const usernameInput = studentForm.querySelector('[name="username"]');
        const pinInput = studentForm.querySelector('[name="pin"]');
        if (usernameInput && !usernameInput.value) {
          usernameInput.value = generateUsername(first_name, surname);
        }
        if (pinInput && !pinInput.value) {
          pinInput.value = generatePin();
        }
        // Prevent duplicate student by name and class
        const classInput = studentForm.querySelector('[name="class"]');
        const nameClass = (first_name + ' ' + surname + '|' + (classInput ? classInput.value : ''));
        window._studentNameClassSet = window._studentNameClassSet || new Set();
        if (window._studentNameClassSet.has(nameClass)) {
          alert('Duplicate student detected: ' + first_name + ' ' + surname + ' in class ' + (classInput ? classInput.value : ''));
          return;
        }
        window._studentNameClassSet.add(nameClass);
        studentForm.submit();
      }
    });
  }
function exportStudentsCSV() {
  if (!allStudents || allStudents.length === 0) {
    alert('No student data to export.');
    return;
  }
  const headers = [
    'Full Name', 'Area', 'DOB', 'NHIS Number', 'Gender', 'Class', 'Parent', 'Contact', 'Username', 'PIN'
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
// (Do not redeclare supabaseClient or createClient here)

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

  // Events modal logic
  fetchAndRenderEvents();
  const eventsForm = document.getElementById('eventsForm');
  if (eventsForm) {
    eventsForm.onsubmit = async function(e) {
      e.preventDefault();
      const title = document.getElementById('event_title').value;
      const date = document.getElementById('event_date').value;
      const details = document.getElementById('event_desc').value;
      const type = 'event';
      const { error } = await supabaseClient.from('events').insert([
        { title, date, details, type }
      ]);
      if (error) {
        alert('Failed to save event');
        return;
      }
      closeModal('eventsModal');
      eventsForm.reset();
      fetchAndRenderEvents();
    };
  }
});
// Fetch and render events for admin
async function fetchAndRenderEvents() {
  const { data, error } = await supabaseClient
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  const eventsSection = document.getElementById('eventsSection');
  if (!eventsSection) return;
  eventsSection.innerHTML = '';
  if (error || !data || data.length === 0) {
    eventsSection.innerHTML = '<p>No events found.</p>';
    return;
  }
  data.forEach(event => {
    const div = document.createElement('div');
    div.className = 'event-item';
    div.innerHTML = `
      <div class="event-date">${new Date(event.date).toLocaleDateString()}</div>
      <div class="event-title">${event.title}</div>
      <div class="event-desc">${event.details}</div>
      <button class="delete-event-btn" onclick="deleteEvent('${event.id}')">Delete</button>
    `;
    eventsSection.appendChild(div);
  });
}

// Delete event by id
async function deleteEvent(eventId) {
  if (!confirm('Delete this event?')) return;
  const { error } = await supabaseClient.from('events').delete().eq('id', eventId);
  if (error) {
    alert('Failed to delete event');
    return;
  }
  fetchAndRenderEvents();
}

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