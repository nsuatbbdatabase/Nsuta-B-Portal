const { createClient } = supabase;

const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);

// 🔽 Populate class dropdown
async function populateClassDropdown() {
  const { data, error } = await supabaseClient
    .from('students')
    .select('class')
    .neq('class', '')
    .order('class');

  if (error) return console.error('Failed to load classes:', error.message);

  const uniqueClasses = [...new Set(data.map(s => s.class))];
  const select = document.getElementById('classFilter');
  select.innerHTML = '<option value="">-- Select Class --</option>';
  uniqueClasses.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls;
    option.textContent = cls;
    select.appendChild(option);
  });
}

// 🚀 Initialize class dropdown on page load
window.addEventListener('DOMContentLoaded', populateClassDropdown);

// 🔍 Load profiles by term/class
async function loadProfiles() {
  const term = document.getElementById('termFilter').value.trim();
  const className = document.getElementById('classFilter').value.trim();
  const tbody = document.querySelector('#profileTable tbody');
  tbody.innerHTML = '';

  if (!term || !className) {
  try { notify('Please select both term and class.', 'warning'); } catch (e) { alert('Please select both term and class.'); }
    return;
  }

  const { data: students, error: studentError } = await supabaseClient
    .from('students')
    .select('id, first_name, surname, class')
    .eq('class', className);

  if (studentError) {
    console.error('Failed to load students:', studentError.message);
    return;
  }

  // Fetch global attendance total (Y) from school_dates
  let attendanceTotalDays = 0;
  try {
    const { data: schoolDatesData, error: schoolDatesError } = await supabaseClient
      .from('school_dates')
      .select('attendance_total_days')
      .order('inserted_at', { ascending: false })
      .limit(1);
    if (schoolDatesError) throw schoolDatesError;
    attendanceTotalDays = (schoolDatesData && schoolDatesData.length > 0 && schoolDatesData[0].attendance_total_days) ? schoolDatesData[0].attendance_total_days : 0;
  } catch (e) {
    attendanceTotalDays = 0;
  }

  // Fetch all attendance records for this class and term
  const { data: attendanceRecords, error: attendanceError } = await supabaseClient
    .from('attendance')
    .select('student_id, present, term, class')
    .eq('term', term)
    .eq('class', className);
  if (attendanceError) {
    console.error('Failed to load attendance:', attendanceError.message);
  }

  // Fetch profiles for interest/conduct
  const { data: profiles, error: profileError } = await supabaseClient
    .from('profiles')
    .select('student_id, term, interest, conduct')
    .eq('term', term);
  if (profileError) {
    console.error('Failed to load profiles:', profileError.message);
    return;
  }

  students.forEach(student => {
    // Count present days for this student (X)
    const presentCount = (attendanceRecords || []).filter(a => {
      if (a.student_id !== student.id) return false;
      const v = a.present;
      // Accept different representations: boolean true, 't', 'true', 1, '1'
      if (v === true) return true;
      if (typeof v === 'string') {
        const s = v.trim().toLowerCase();
        return s === 't' || s === 'true' || s === '1';
      }
      if (typeof v === 'number') return v === 1;
      return false;
    }).length;
    const profile = profiles.find(p => p.student_id === student.id);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td>${student.class}</td>
      <td>${presentCount} out of ${attendanceTotalDays}</td>
      <td>
        <select data-student="${student.id}" data-field="interest">
          ${generateInterestOptions(profile?.interest ?? '')}
        </select>
      </td>
      <td>
        <select data-student="${student.id}" data-field="conduct">
          ${generateConductOptions(profile?.conduct ?? '')}
        </select>
      </td>
      <td>
        <button onclick="upsertProfile('${student.id}')">Save</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 🎭 Generate interest options
function generateInterestOptions(selected) {
  const interests = [
    "Sports", "Reading", "Creative Writing", "Computing",
    "Creative Arts and Design", "Problem solving and Mathematics",
    "Problem Solving", "Learning new language", "Dancing",
    "Volunteering", "Competition", "Cooking", "Science and Exploration"
  ];
  return interests.map(i => `<option ${i === selected ? 'selected' : ''}>${i}</option>`).join('');
}

// 🧠 Generate conduct options
function generateConductOptions(selected) {
  const conducts = [
    "Conduct is excellent", "Conduct is above average", "Conduct is average",
    "Classroom work is excellent", "Classroom work is satisfactory",
    "High level of classroom participation", "Well prepared on daily basis",
    "Dresses out as directed", "Gives consistent effort to assignments",
    "Shows respect for teachers and peers", "Responds appropriately when corrected",
    "Seeks new challenges.", "Conduct is below average", "Conduct is unsatisfactory",
    "Low performance on tests", "Easily distracted from task",
    "Does low percentage of homework", "Quality of work is poor",
    "Makes poor use of class time", "Does not take class notes", "Sleeps in class"
  ];
  return conducts.map(c => `<option ${c === selected ? 'selected' : ''}>${c}</option>`).join('');
}

// ✏️ Upsert profile (create or update)
async function upsertProfile(studentId) {
  const term = document.getElementById('termFilter').value.trim();
  const year = document.getElementById('yearFilter')?.value?.trim() || '';
  const inputs = document.querySelectorAll(`[data-student="${studentId}"]`);
  const payload = {
    student_id: studentId,
    term,
    year,
    updated_at: new Date().toISOString()
  };

  inputs.forEach(input => {
    const field = input.dataset.field;
    let value = input.tagName === 'SELECT' ? input.value : parseInt(input.value);
    if ((field === 'attendance_total' || field === 'attendance_actual') && (isNaN(value) || value === null)) {
      value = 0;
    }
    payload[field] = value;
  });

  const { error } = await supabaseClient
    .from('profiles')
    .upsert([payload], {
      onConflict: ['student_id', 'term', 'year']
    });

  if (error) {
  try { notify('Save failed: ' + error.message, 'error'); } catch (e) { alert('Save failed: ' + error.message); }
    console.error('Upsert error:', error.message);
  } else {
  try { notify('Profile saved successfully.', 'info'); } catch (e) { alert('Profile saved successfully.'); }
    loadProfiles();
  }
}