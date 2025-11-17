const { createClient } = supabase;

const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);

// 🔽 Populate class dropdown
async function populateClassDropdown() {
  // Fetch both class and subclass so we can present combined class+subclass options
  const { data, error } = await supabaseClient
    .from('students')
    .select('class, subclass')
    .neq('class', '')
    .order('class');

  if (error) return console.error('Failed to load classes:', error.message);

  // Build combined options: prefer 'Class Subclass' when subclass exists, otherwise just 'Class'
  const opts = new Set();
  data.forEach(s => {
    const c = (s.class || '').toString().trim();
    const sc = (s.subclass || '').toString().trim();
    if (!c) return;
    if (sc) opts.add(`${c} ${sc}`);
    else opts.add(c);
  });
  const uniqueClasses = [...opts].sort();
  // Support multiple possible element IDs used across pages
  const select = document.getElementById('classFilter') || document.getElementById('classSelect');
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

// Wire up UI controls (supporting both ID variants) to trigger loading
document.addEventListener('DOMContentLoaded', function(){
  const classEl = getElementByIds('classFilter','classSelect');
  const termEl = getElementByIds('termFilter','term');
  if (classEl) classEl.addEventListener('change', loadProfiles);
  if (termEl) termEl.addEventListener('change', loadProfiles);
});

// Listen for attendance updates written by the teacher dashboard and refresh
window.addEventListener('storage', function(e){
  if (!e) return;
  if (e.key === 'attendanceUpdated') {
    try { loadProfiles(); } catch (err) { console.warn('Failed to refresh profiles after attendanceUpdated', err); }
  }
});

// Helper: read the first available element by a list of IDs
function getElementByIds(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

function getValueByIds(...ids) {
  const el = getElementByIds(...ids);
  return el ? (el.value || '').toString().trim() : '';
}

// 🔍 Load profiles by term/class
async function loadProfiles() {
  const term = getValueByIds('termFilter','term');
  const className = getValueByIds('classFilter','classSelect');
  const tbody = document.querySelector('#profileTable tbody');
  tbody.innerHTML = '';

  if (!term || !className) {
  try { notify('Please select both term and class.', 'warning'); } catch (e) { try { safeNotify('Please select both term and class.', 'warning'); } catch (ee) { console.error('safeNotify failed', ee); } }
    return;
  }

  // Determine whether a subclass token is present (e.g. 'JHS 2 A')
  let classOnly = className;
  let subclassOnly = null;
  const m = className.match(/^(.+?)\s+([A-Za-z0-9]+)$/);
  if (m) {
    classOnly = m[1].trim();
    subclassOnly = m[2].toString().trim();
  }

  // Query students by class and subclass (if provided). Always request subclass in the select.
  let studentsQuery = supabaseClient.from('students').select('id, first_name, surname, class, subclass').eq('class', classOnly);
  if (subclassOnly) studentsQuery = studentsQuery.eq('subclass', subclassOnly);
  const { data: students, error: studentError } = await studentsQuery;

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
  let attendanceQuery = supabaseClient
    .from('attendance')
    .select('id, student_id, present, term, class, date')
    .eq('term', term)
    .eq('class', classOnly);
  // if a subclass was selected, include it in the attendance filter so we match records
  if (subclassOnly) attendanceQuery = attendanceQuery.eq('subclass', subclassOnly);
  const { data: attendanceRecords, error: attendanceError } = await attendanceQuery;
  if (attendanceError) {
    console.error('Failed to load attendance:', attendanceError.message);
  }

  // Fetch profiles for interest/conduct
  const { data: profiles, error: profileError } = await supabaseClient
    .from('profiles')
    .select('student_id, term, interest, conduct, attendance_total, attendance_actual')
    .eq('term', term);
  if (profileError) {
    console.error('Failed to load profiles:', profileError.message);
    return;
  }

  // Build a quick lookup of profiles by student_id (these may be populated by teacher attendance sync)
  const profileMap = (profiles || []).reduce((m, p) => { if (p && p.student_id) m[p.student_id] = p; return m; }, {});

  students.forEach(student => {
    const profile = profileMap[student.id];
    // Prefer the attendance_total stored in profiles (synced by teacher submitAttendance). If missing, fall back to counting attendance records.
    let presentCount = null;
    if (profile && (profile.attendance_total !== null && profile.attendance_total !== undefined)) {
      presentCount = Number(profile.attendance_total) || 0;
    } else {
      // Count unique dates where the student was marked present. If attendance rows lack a date,
      // fall back to counting unique attendance record ids so we don't double-count.
      const presentDateSet = new Set();
      (attendanceRecords || []).forEach(a => {
        if (a.student_id !== student.id) return;
        const v = a.present;
        let isPresent = false;
        if (v === true) isPresent = true;
        else if (typeof v === 'string') {
          const s = v.trim().toLowerCase();
          if (s === 't' || s === 'true' || s === '1') isPresent = true;
        } else if (typeof v === 'number') {
          if (v === 1) isPresent = true;
        }
        if (!isPresent) return;
        if (a.date) presentDateSet.add(a.date.toString());
        else if (a.id) presentDateSet.add('rec-' + a.id);
        else presentDateSet.add(JSON.stringify(a));
      });
      presentCount = presentDateSet.size;
    }
    // For display of "out of", prefer profile.attendance_actual if present, otherwise use global attendanceTotalDays
    const attendanceActualDisplay = (profile && (profile.attendance_actual !== null && profile.attendance_actual !== undefined)) ? Number(profile.attendance_actual) : attendanceTotalDays;

    const row = document.createElement('tr');
    const classDisplay = `${student.class || ''} ${student.subclass || ''}`.trim();
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td>${classDisplay}</td>
      <td>${presentCount} out of ${attendanceActualDisplay}</td>
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
  const term = getValueByIds('termFilter','term');
  const year = getValueByIds('yearFilter','year');
  const inputs = document.querySelectorAll(`[data-student="${studentId}"]`);
  // Ensure we provide a non-null attendance_total to satisfy DB constraints.
  // Fetch latest attendance total days from school_dates as the canonical source.
  let attendanceTotalDays = 0;
  try {
    const { data: sd, error: sdErr } = await supabaseClient
      .from('school_dates')
      .select('attendance_total_days')
      .order('inserted_at', { ascending: false })
      .limit(1);
    if (!sdErr && sd && sd.length > 0) attendanceTotalDays = sd[0].attendance_total_days || 0;
  } catch (e) {
    attendanceTotalDays = 0;
  }

  // Compute actual present days for this student in the given term by counting unique dates
  // where present is truthy. This ensures absent marks are not counted.
  let presentCountForStudent = 0;
  try {
    const { data: attRows, error: attErr } = await supabaseClient
      .from('attendance')
      .select('id, date, present')
      .eq('student_id', studentId)
      .eq('term', term);
    if (!attErr && Array.isArray(attRows)) {
      const presentSet = new Set();
      attRows.forEach(a => {
        const v = a.present;
        let isPresent = false;
        if (v === true) isPresent = true;
        else if (typeof v === 'string') {
          const s = v.trim().toLowerCase();
          if (s === 't' || s === 'true' || s === '1') isPresent = true;
        } else if (typeof v === 'number') {
          if (v === 1) isPresent = true;
        }
        if (!isPresent) return;
        if (a.date) presentSet.add(a.date.toString());
        else if (a.id) presentSet.add('rec-' + a.id);
        else presentSet.add(JSON.stringify(a));
      });
      presentCountForStudent = presentSet.size;
    }
  } catch (e) {
    presentCountForStudent = 0;
  }

  const payload = {
    student_id: studentId,
    term,
    year,
    // attendance_total stores the count of dates the student was present (not total possible days)
    attendance_total: presentCountForStudent,
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

  // Provide attendance_actual as the canonical number of days in session (if known)
  if (attendanceTotalDays !== null && attendanceTotalDays !== undefined) payload.attendance_actual = attendanceTotalDays;

  const { error } = await supabaseClient
    .from('profiles')
    .upsert([payload], {
      onConflict: ['student_id', 'term', 'year']
    });

  if (error) {
  try { notify('Save failed: ' + error.message, 'error'); } catch (e) { try { safeNotify('Save failed: ' + error.message, 'error'); } catch (ee) { console.error('safeNotify failed', ee); } }
    console.error('Upsert error:', error.message);
  } else {
  try { notify('Profile saved successfully.', 'info'); } catch (e) { try { safeNotify('Profile saved successfully.', 'info'); } catch (ee) { console.error('safeNotify failed', ee); } }
    loadProfiles();
  }
}