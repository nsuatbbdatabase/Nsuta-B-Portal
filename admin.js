// Use the supabaseClient already declared in dashboard.js

// Show only the selected student's details in the table
function showSelectedStudent() {
  const studentId = document.getElementById('studentSelect').value;
  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';
  if (!studentId) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="9" style="text-align:center;">No student selected</td>';
    tbody.appendChild(row);
    return;
  }
  const student = allStudents.find(s => s.id == studentId);
  if (!student) return;
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${student.picture ? `<img src="${student.picture}" alt="pic" width="40">` : ''}</td>
    <td>${student.full_name || ''}</td>
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

// --- Populate Teacher Dropdown for Timetable Modal ---

// Fetch all students on page load
window.addEventListener('DOMContentLoaded', async () => {
  // Removed timetable subject/teacher dropdown population on load; handled in modal logic
  await populateExtraClassTeacherDropdowns();
// --- Populate Teacher Dropdowns for Extra Class Modal ---
async function populateExtraClassTeacherDropdowns() {
  const morningSelect = document.getElementById('teacherMorningClass');
  const extraSelect = document.getElementById('teacherExtraClass');
  const extraExtraSelect = document.getElementById('teacherExtraExtraClass');
  const selects = [morningSelect, extraSelect, extraExtraSelect];
  const { data: teachers, error } = await supabaseClient.from('teachers').select('id, name');
  if (error || !Array.isArray(teachers)) return;
  selects.forEach(select => {
    if (!select) return;
    select.innerHTML = '<option value="">Select Teacher</option>';
    teachers.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      select.appendChild(opt);
    });
  });
}
// --- Classes Management Table Logic ---
async function populateClassesManagementTable() {
  const classes = ['JHS 1 A', 'JHS 1 B', 'JHS 2 A', 'JHS 2 B', 'JHS 3'];
  const table = document.getElementById('classesManagementTable');
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  // Fetch extra classes data only
  const { data: extraClasses } = await supabaseClient.from('extra_classes').select('*');
  // Optionally fetch teachers if you want to show names
  const { data: teachers } = await supabaseClient.from('teachers').select('*');
  tbody.innerHTML = '';
  classes.forEach(cls => {
    // Extra class: first extra class for this class
    const extra = extraClasses?.filter(x => x.class === cls)[0] || {};
    // Extra extra class: second extra class for this class
    const extraExtra = extraClasses?.filter(x => x.class === cls)[1] || {};
    // Teacher: from extra class (assume teacher_id field exists)
    let teacherName = '';
    if (extra.teacher_id && teachers) {
      const t = teachers.find(tch => tch.id === extra.teacher_id);
      teacherName = t ? t.name : '';
    }
    tbody.innerHTML += `<tr>
      <td>${cls}</td>
      <td>${teacherName}</td>
      <td>${extra.subject || ''}</td>
      <td>${extraExtra.subject || ''}</td>
    </tr>`;
  });
}
  await fetchAndRenderStudents();
  document.getElementById('classFilter').addEventListener('change', filterStudentsByClass);

  // Events/Timetable/Extra Classes Management
  await loadEventsManagementTables();
  setupEventModals();
});

// --- Events/Timetable/Extra Classes Management Logic ---
async function loadEventsManagementTables() {
  // Events
  const eventsTable = document.querySelector('#eventsTable tbody');
  if (eventsTable) {
    eventsTable.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    const { data: events, error } = await supabaseClient.from('events').select('*').order('date', { ascending: true });
    if (error || !Array.isArray(events)) {
      eventsTable.innerHTML = '<tr><td colspan="5">Error loading events.</td></tr>';
    } else if (events.length === 0) {
      eventsTable.innerHTML = '<tr><td colspan="5">No events found.</td></tr>';
    } else {
      eventsTable.innerHTML = '';
      events.forEach(ev => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${ev.title}</td><td>${ev.date ? new Date(ev.date).toLocaleDateString() : ''}</td><td>${ev.class}</td><td>${ev.details || ''}</td><td>
          <button onclick="editEvent('${ev.id}')">Edit</button>
          <button onclick="deleteEvent('${ev.id}')">Delete</button>
        </td>`;
        eventsTable.appendChild(tr);
      });
    }
  }
  // Timetable
  const timetableTable = document.querySelector('#timetableTable tbody');
  if (timetableTable) {
    timetableTable.innerHTML = '<tr><td colspan="8">Loading...</td></tr>';
    const { data: timetable, error } = await supabaseClient.from('timetable').select('*, teachers(name)').order('day', { ascending: true }).order('start_time', { ascending: true });
    if (error || !Array.isArray(timetable)) {
      timetableTable.innerHTML = '<tr><td colspan="8">Error loading timetable.</td></tr>';
    } else if (timetable.length === 0) {
      timetableTable.innerHTML = '<tr><td colspan="8">No timetable entries found.</td></tr>';
    } else {
      timetableTable.innerHTML = '';
      timetable.forEach(tt => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${tt.class}</td>
          <td>${tt.subject}</td>
          <td>${tt.day}</td>
          <td>${tt.start_time ? tt.start_time.slice(0,5) : ''}</td>
          <td>${tt.end_time ? tt.end_time.slice(0,5) : ''}</td>
          <td>${tt.details || ''}</td>
          <td>${tt.teachers ? tt.teachers.name : ''}</td>
          <td>
            <button onclick="editTimetable('${tt.id}')">Edit</button>
            <button onclick="deleteTimetable('${tt.id}')">Delete</button>
          </td>
        `;
        timetableTable.appendChild(tr);
      });
    }
  }
  // Extra Classes
  const extraClassesTable = document.querySelector('#extraClassesTable tbody');
  if (extraClassesTable) {
    extraClassesTable.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    const { data: teachers } = await supabaseClient.from('teachers').select('id, name');
    const { data: extraClasses, error } = await supabaseClient.from('extra_classes').select('*').order('created_at', { ascending: true });
    function getTeacherName(id) {
      if (!id || !teachers) return '';
      const t = teachers.find(tch => tch.id === id);
      return t ? t.name : '';
    }
    if (error || !Array.isArray(extraClasses)) {
      extraClassesTable.innerHTML = '<tr><td colspan="6">Error loading extra classes.</td></tr>';
    } else if (extraClasses.length === 0) {
      extraClassesTable.innerHTML = '<tr><td colspan="6">No extra classes found.</td></tr>';
    } else {
      extraClassesTable.innerHTML = '';
      extraClasses.forEach(xc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${xc.day}</td>
          <td>${xc.class}</td>
          <td>${getTeacherName(xc.teacher_morning_class)}</td>
          <td>${getTeacherName(xc.teacher_extra_class)}</td>
          <td>${getTeacherName(xc.teacher_extra_extra_class)}</td>
          <td>
            <button onclick="editExtraClass('${xc.id}')">Edit</button>
            <button onclick="deleteExtraClass('${xc.id}')">Delete</button>
          </td>
        `;
        extraClassesTable.appendChild(tr);
      });
// --- Edit/Delete Handlers ---
window.editEvent = async function(id) {
  const { data, error } = await supabaseClient.from('events').select('*').eq('id', id).single();
  if (error || !data) return alert('Failed to load event');
  const form = document.getElementById('eventForm');
  form.event_id.value = data.id;
  form.title.value = data.title;
  form.date.value = data.date;
  form.class.value = data.class;
  form.details.value = data.details || '';
  openModal('eventModal');
};
window.deleteEvent = async function(id) {
  if (!confirm('Delete this event?')) return;
  await supabaseClient.from('events').delete().eq('id', id);
  await loadEventsManagementTables();
};

window.editTimetable = async function(id) {
  const { data, error } = await supabaseClient.from('timetable').select('*').eq('id', id).single();
  if (error || !data) return alert('Failed to load timetable item');
  const form = document.getElementById('timetableForm');
  form.timetable_id.value = data.id;
  form.subject.value = data.subject || data.title;
  form.date.value = data.date;
  form.class.value = data.class;
  form.details.value = data.details || '';
  openModal('timetableModal');
};
window.deleteTimetable = async function(id) {
  if (!confirm('Delete this timetable item?')) return;
  await supabaseClient.from('timetable').delete().eq('id', id);
  await loadEventsManagementTables();
};

window.editExtraClass = async function(id) {
  const { data, error } = await supabaseClient.from('extra_classes').select('*').eq('id', id).single();
  if (error || !data) return alert('Failed to load extra class');
  const form = document.getElementById('extraClassForm');
  form.extra_class_id.value = data.id;
  form.subject.value = data.subject || data.title;
  form.date.value = data.date;
  form.class.value = data.class;
  form.details.value = data.details || '';
  openModal('extraClassModal');
};
window.deleteExtraClass = async function(id) {
  if (!confirm('Delete this extra class?')) return;
  await supabaseClient.from('extra_classes').delete().eq('id', id);
  await loadEventsManagementTables();
};
    }
  }
}

function setupEventModals() {
  // Populate timetable teacher dropdown
  window.populateTimetableTeacherDropdown = async function() {
    const teacherSelect = document.getElementById('timetableTeacher');
    if (!teacherSelect) return;
    const { data: teachers, error } = await supabaseClient.from('teachers').select('id, name');
    if (error || !Array.isArray(teachers)) return;
    teacherSelect.innerHTML = '<option value="">Select Teacher</option>';
    teachers.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.name;
      teacherSelect.appendChild(opt);
    });
  }
  // Populate timetable subject dropdown
  function populateTimetableSubjectDropdown() {
    const subjectSelect = document.getElementById('timetableSubject');
    if (!subjectSelect) return;
    const subjects = [
      'Maths', 'English', 'Science', 'Computing', 'Social Studies', 'RME', 'Creative Arts', 'Career Tech', 'Twi'
    ];
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      subjectSelect.appendChild(opt);
    });
  }
  // Populate timetable class dropdown
  function populateTimetableClassDropdown() {
    const classSelect = document.getElementById('timetableClass');
    if (!classSelect) return;
    const classes = [
      'JHS 1 A', 'JHS 1 B', 'JHS 2 A', 'JHS 2 B', 'JHS 3'
    ];
    classSelect.innerHTML = '<option value="">Select Class</option>';
    classes.forEach(cls => {
      const opt = document.createElement('option');
      opt.value = cls;
      opt.textContent = cls;
      classSelect.appendChild(opt);
    });
  }
  // Populate timetable day dropdown
  function populateTimetableDayDropdown() {
    const daySelect = document.getElementById('timetableDay');
    if (!daySelect) return;
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    daySelect.innerHTML = '<option value="">Select Day</option>';
    days.forEach(day => {
      const opt = document.createElement('option');
      opt.value = day;
      opt.textContent = day;
      daySelect.appendChild(opt);
    });
  }
  // When opening timetable modal, populate dropdowns
  const origOpenModal = window.openModal;
  window.openModal = function(id) {
    if (id === 'timetableModal') {
      window.populateTimetableTeacherDropdown();
      populateTimetableSubjectDropdown();
      populateTimetableClassDropdown();
      populateTimetableDayDropdown();
      // Reset form
      const form = document.getElementById('timetableForm');
      if (form) {
        form.reset();
        form.timetable_id.value = '';
      }
    }
    if (typeof origOpenModal === 'function') origOpenModal(id);
    else document.getElementById(id)?.classList.remove('hidden');
  };
  // Timetable form submit
  document.getElementById('timetableForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      class: form.class.value,
      subject: form.subject.value,
      day: form.day.value,
      start_time: form.start_time.value,
      end_time: form.end_time.value
    };
    // Validate required fields
    if (!payload.class || !payload.subject || !payload.day || !payload.start_time || !payload.end_time) {
      alert('Please fill in all required fields.');
      return;
    }
    if (form.timetable_id.value) {
      await supabaseClient.from('timetable').update(payload).eq('id', form.timetable_id.value);
    } else {
      await supabaseClient.from('timetable').insert([payload]);
    }
    closeModal('timetableModal');
    await loadEventsManagementTables();
    form.reset();
    form.timetable_id.value = '';
  });
  // Timetable edit/delete handlers
  window.editTimetable = async function(id) {
    const { data, error } = await supabaseClient.from('timetable').select('*').eq('id', id).single();
    if (error || !data) return alert('Failed to load timetable entry');
    const form = document.getElementById('timetableForm');
    if (!form) return;
    // Populate dropdowns
  document.getElementById('timetableClass').value = data.class;
  document.getElementById('timetableSubject').value = data.subject;
  document.getElementById('timetableDay').value = data.day;
  document.getElementById('timetableStartTime').value = data.start_time;
  document.getElementById('timetableEndTime').value = data.end_time;
    form.timetable_id.value = data.id;
    openModal('timetableModal');
  };
  window.deleteTimetable = async function(id) {
    if (!confirm('Delete this timetable entry?')) return;
    await supabaseClient.from('timetable').delete().eq('id', id);
    await loadEventsManagementTables();
  };
  // Open/close modal helpers
  window.openModal = function(id) {
    document.getElementById(id)?.classList.remove('hidden');
  };
  window.closeModal = function(id) {
    document.getElementById(id)?.classList.add('hidden');
  };

  // Event form submit
  document.getElementById('eventForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      title: form.title.value,
      date: form.date.value,
      class: form.class.value,
      details: form.details.value
    };
    if (form.event_id.value) {
      await supabaseClient.from('events').update(payload).eq('id', form.event_id.value);
    } else {
      await supabaseClient.from('events').insert([payload]);
    }
    closeModal('eventModal');
    await loadEventsManagementTables();
    form.reset();
    form.event_id.value = '';
  });
  // Timetable form submit
  document.getElementById('timetableForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      subject: form.subject.value,
      class: form.class.value,
      start_time: form.start_time.value,
      end_time: form.end_time.value,
      details: form.details.value
    };
    // Validate required fields
    if (!payload.subject || !payload.class || !payload.start_time || !payload.end_time) {
      alert('Please fill in all required fields.');
      return;
    }
    if (form.timetable_id.value) {
      await supabaseClient.from('timetable').update(payload).eq('id', form.timetable_id.value);
    } else {
      await supabaseClient.from('timetable').insert([payload]);
    }
    closeModal('timetableModal');
    await loadEventsManagementTables();
    form.reset();
    form.timetable_id.value = '';
  });
  // Extra class form submit
  document.getElementById('extraClassForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      day: form.day.value,
      class: form.class.value,
      teacher_morning_class: form.teacher_morning_class.value,
      teacher_extra_class: form.teacher_extra_class.value,
      teacher_extra_extra_class: form.teacher_extra_extra_class.value
    };
    if (form.extra_class_id.value) {
      await supabaseClient.from('extra_classes').update(payload).eq('id', form.extra_class_id.value);
    } else {
      await supabaseClient.from('extra_classes').insert([payload]);
    }
    closeModal('extraClassModal');
    await loadEventsManagementTables();
    form.reset();
    form.extra_class_id.value = '';
  });
}

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
  const classValue = document.getElementById('classFilter').value.trim();
  // Only show students in dropdown that match the selected class (case-insensitive)
  const filtered = classValue
    ? allStudents.filter(s => (s.class || '').trim().toLowerCase() === classValue.toLowerCase())
    : allStudents;
  // Update student dropdown
  const studentSelect = document.getElementById('studentSelect');
  if (studentSelect) {
    studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
    filtered.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.full_name;
      studentSelect.appendChild(opt);
    });
    // Clear selection if class changes
    studentSelect.value = '';
  }
  // Clear student table and show message
  const tbody = document.querySelector('#studentTable tbody');
  if (tbody) {
    tbody.innerHTML = '';
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="9" style="text-align:center;">No student selected</td>';
    tbody.appendChild(row);
  }
}

function toggleDropdown(id) {
  var dropdown = document.getElementById(id);
  if (!dropdown) return;
  var parent = dropdown.parentElement;
  if (parent.classList.contains('open')) {
    parent.classList.remove('open');
  } else {
    // Close any other open dropdowns
    document.querySelectorAll('.dropdown-checkbox.open').forEach(function(el) {
      el.classList.remove('open');
    });
    parent.classList.add('open');
  }
}
// Optional: Close dropdowns when clicking outside
window.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown-checkbox')) {
    document.querySelectorAll('.dropdown-checkbox.open').forEach(function(el) {
      el.classList.remove('open');
    });
  }
});
// Add missing closing brace to terminate file