// Filter student dropdown by search box
window.filterStudentDropdown = function filterStudentDropdown() {
  const search = document.getElementById('studentSearch').value.trim().toLowerCase();
  const classValue = document.getElementById('classFilter').value.trim().toUpperCase();
  let filtered = classValue
    ? allStudents.filter(s => (s.class || '').trim().toUpperCase() === classValue)
    : allStudents;
  if (search) {
    filtered = filtered.filter(s => {
      const name = ((s.first_name || '') + ' ' + (s.surname || '')).toLowerCase();
      return name.includes(search);
    });
  }
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
};
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
  // Always show dashboard overview after closing key modals
  if (modalId === 'promotionPassMarkModal' || modalId === 'eventsModal') {
    const overview = document.getElementById('dashboardOverview');
    if (overview) {
      overview.classList.remove('hidden');
      overview.style.display = '';
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // --- Promotion Pass Mark UI Logic ---
  // --- Promotion Pass Mark Modal Logic ---
  const promotionPassMarkInput = document.getElementById('promotionPassMarkInput');
  const promotionPassMarkForm = document.getElementById('promotionPassMarkForm');
  const promotionPassMarkStatus = document.getElementById('promotionPassMarkStatus');
  if (promotionPassMarkInput && promotionPassMarkForm) {
    // Load current value from Supabase settings
    (async function() {
      try {
        const { data, error } = await supabaseClient
          .from('settings')
          .select('id, promotion_pass_mark')
          .order('id', { ascending: true })
          .limit(1);
        if (!error && data && data.length && data[0].promotion_pass_mark) {
          promotionPassMarkInput.value = data[0].promotion_pass_mark;
        } else {
          promotionPassMarkInput.value = 300;
        }
      } catch (e) {
        promotionPassMarkInput.value = 300;
      }
    })();
    // Save handler
    promotionPassMarkForm.onsubmit = async function(e) {
      e.preventDefault();
      const value = parseInt(promotionPassMarkInput.value, 10);
      if (isNaN(value) || value < 0) {
        promotionPassMarkStatus.textContent = 'Enter a valid number.';
        promotionPassMarkStatus.style.color = 'red';
        return;
      }
      // Get the first row's id if exists, else insert new
      const { data, error: fetchError } = await supabaseClient
        .from('settings')
        .select('id')
        .order('id', { ascending: true })
        .limit(1);
      let upsertData;
      if (!fetchError && data && data.length) {
        upsertData = { id: data[0].id, promotion_pass_mark: value };
      } else {
        upsertData = { promotion_pass_mark: value };
      }
      const { error } = await supabaseClient
        .from('settings')
        .upsert([upsertData]);
      if (!error) {
        promotionPassMarkStatus.textContent = 'Saved!';
        promotionPassMarkStatus.style.color = 'green';
      } else {
        promotionPassMarkStatus.textContent = 'Error saving.';
        promotionPassMarkStatus.style.color = 'red';
      }
      setTimeout(() => { promotionPassMarkStatus.textContent = ''; }, 2000);
    };
  }
  // Prevent access if not logged in as admin
  const adminId = localStorage.getItem('adminId');
  if (!adminId) {
    window.location.href = 'login.html';
    return;
  }
  // CSV Import Handler (schema-aligned)
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
        // Define allowed schema fields for Supabase students table
        // Match new schema: no full_name, require first_name and surname, include area, dob, nhis_number
        const allowedFields = [
          'first_name', 'surname', 'area', 'dob', 'nhis_number',
          'gender', 'class', 'parent_name', 'parent_contact', 'username', 'pin', 'picture_url'
        ];
        // Map CSV headers to schema fields (case-insensitive)
        const headers = lines[0].split(/\t|,/).map(h => h.trim());
        const normalizedHeaders = headers.map(h => h.toLowerCase());
        // Build a mapping from CSV header to schema field
        const headerToField = {};
        headers.forEach((h, idx) => {
          const norm = h.toLowerCase();
          // Map common variations to schema fields
          if (norm === 'full name') headerToField[h] = 'full_name';
          else if (norm === 'parent') headerToField[h] = 'parent_name';
          else if (norm === 'contact') headerToField[h] = 'parent_contact';
          else if (norm === 'nhis number') headerToField[h] = 'nhis_number';
          else if (norm === 'class') headerToField[h] = 'class';
          else if (norm === 'gender') headerToField[h] = 'gender';
          else if (norm === 'area') headerToField[h] = 'area';
          else if (norm === 'dob') headerToField[h] = 'dob';
          else if (norm === 'username') headerToField[h] = 'username';
          else if (norm === 'pin') headerToField[h] = 'pin';
          else if (norm === 'picture url') headerToField[h] = 'picture_url';
          else if (norm === 'surname') headerToField[h] = 'surname';
          else if (norm === 'first name') headerToField[h] = 'first_name';
          else headerToField[h] = null; // ignore unknown columns
        });
  let successCount = 0, failCount = 0, duplicateRows = [], invalidRows = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(/\t|,/);
          if (row.length < 5) continue;
          // Build studentData with only allowed fields
          const studentData = {};
          let hasAllRequired = true;
          // Required fields for import (username and pin are always generated)
          const requiredFields = ['first_name', 'surname', 'gender', 'class', 'parent_name', 'parent_contact'];
          // Fill studentData from CSV row (CSV uses Full Name, split to first_name/surname)
          headers.forEach((h, idx) => {
            const field = headerToField[h];
            if (field === 'full_name') {
              const { first_name, surname } = splitFullName(row[idx] ? row[idx].trim() : '');
              studentData['first_name'] = first_name;
              studentData['surname'] = surname;
            } else if (field && allowedFields.includes(field)) {
              studentData[field] = row[idx] ? row[idx].trim() : '';
            }
          });
          // Always auto-generate username and pin
          studentData['username'] = generateUsername(studentData['first_name'], studentData['surname']);
          studentData['pin'] = generatePin();
          // Check for required fields
          for (const req of requiredFields) {
            if (!studentData[req] || studentData[req].length === 0) {
              hasAllRequired = false;
              break;
            }
          }
          if (!hasAllRequired) {
            failCount++;
            invalidRows.push(i+1);
            continue;
          }
          // Prevent duplicate by username/class
          const { data: existing, error: existErr } = await supabaseClient.from('students').select('id').eq('username', studentData.username).eq('class', studentData.class);
          if (existing && existing.length) {
            failCount++;
            duplicateRows.push(i+1);
            continue;
          }
          // Only insert allowed fields
          const insertData = {};
          allowedFields.forEach(f => {
            if (studentData[f] !== undefined) insertData[f] = studentData[f];
          });
          const { error } = await supabaseClient.from('students').insert([insertData]);
          if (error) {
            failCount++;
            invalidRows.push(i+1);
          } else {
            successCount++;
          }
        }
        let msg = `Import complete. Success: ${successCount}, Failed: ${failCount}`;
        if (duplicateRows.length) msg += `\nDuplicate students (already exist in this class): ${duplicateRows.join(', ')}`;
        if (invalidRows.length) msg += `\nRows with missing/invalid fields or other errors: ${invalidRows.join(', ')}`;
        alert(msg);
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
  // Match new schema: export as Full Name, Area, DOB, NHIS Number, Gender, Class, Parent, Contact
  const headers = [
    'Full Name', 'Area', 'DOB', 'NHIS Number', 'Gender', 'Class', 'Parent', 'Contact'
  ];
  const rows = allStudents.map(s => [
    ((s.first_name || '') + ' ' + (s.surname || '')).trim(),
    s.area || '',
    s.dob || '',
    s.nhis_number || '',
    s.gender || '',
    s.class || '',
    s.parent_name || '',
    s.parent_contact || ''
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
    <td>
      <button class="edit-btn" onclick="editStudent('${student.id}')">Edit</button>
      <button class="delete-btn" onclick="deleteStudent('${student.id}')">Delete</button>
    </td>
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
      }, { headers: { Accept: 'application/json' } });
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
  window.filterStudentDropdown();
  // Clear student table and show message
  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';
  const row = document.createElement('tr');
  row.innerHTML = '<td colspan="12" style="text-align:center;">No student selected</td>';
  tbody.appendChild(row);
}