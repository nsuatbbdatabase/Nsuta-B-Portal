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

// Track whether profile inputs have unsaved changes
let profilesDirty = false;
function setProfilesDirty(val) {
  profilesDirty = !!val;
  const btn = document.getElementById('saveAllProfilesBtn');
  if (btn) btn.disabled = !profilesDirty;
}

// Show a modern floating confirmation dialog. Returns a Promise<boolean>.
function showFloatingConfirm(message, opts = {}) {
  return new Promise(resolve => {
    try {
      // If a dialog already exists, do not stack
      if (document.getElementById('floatingConfirmOverlay')) {
        // fallback to native confirm
        try { resolve(window.confirm(message)); } catch (e) { resolve(false); }
        return;
      }

      const title = opts.title || '';

      const overlay = document.createElement('div');
      overlay.id = 'floatingConfirmOverlay';
      overlay.style.position = 'fixed';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.background = 'rgba(0,0,0,0.35)';
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.zIndex = 100000;

      const card = document.createElement('div');
      card.style.width = 'min(560px, 92%)';
      card.style.background = '#fff';
      card.style.borderRadius = '10px';
      card.style.boxShadow = '0 16px 40px rgba(2,6,23,0.3)';
      card.style.padding = '18px 20px';
      card.style.fontFamily = 'Segoe UI, Roboto, Arial, sans-serif';
      card.style.color = '#0b2540';

      if (title) {
        const h = document.createElement('div');
        h.textContent = title;
        h.style.fontSize = '18px';
        h.style.fontWeight = '700';
        h.style.marginBottom = '8px';
        card.appendChild(h);
      }

      const txt = document.createElement('div');
      txt.innerHTML = `<div style="font-size:14px;line-height:1.45;color:#123;">${String(message).replace(/\n/g,'<br/>')}</div>`;
      card.appendChild(txt);

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.justifyContent = 'flex-end';
      actions.style.gap = '10px';
      actions.style.marginTop = '18px';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.padding = '8px 12px';
      cancelBtn.style.border = '1px solid #cbd5e1';
      cancelBtn.style.background = '#fff';
      cancelBtn.style.borderRadius = '8px';
      cancelBtn.style.cursor = 'pointer';

      const okBtn = document.createElement('button');
      okBtn.textContent = 'Confirm';
      okBtn.style.padding = '8px 12px';
      okBtn.style.border = 'none';
      okBtn.style.background = '#004080';
      okBtn.style.color = '#fff';
      okBtn.style.borderRadius = '8px';
      okBtn.style.cursor = 'pointer';

      actions.appendChild(cancelBtn);
      actions.appendChild(okBtn);
      card.appendChild(actions);

      overlay.appendChild(card);
      document.body.appendChild(overlay);

      // Prevent background scrolling
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      function cleanup() {
        try { document.body.removeChild(overlay); } catch (e) {}
        try { document.body.style.overflow = prevOverflow || ''; } catch (e) {}
        window.removeEventListener('keydown', onKey);
      }

      function onKey(e) {
        if (e.key === 'Escape') { cleanup(); resolve(false); }
        if (e.key === 'Enter') { cleanup(); resolve(true); }
      }

      window.addEventListener('keydown', onKey);

      cancelBtn.addEventListener('click', function() { cleanup(); resolve(false); });
      okBtn.addEventListener('click', function() { cleanup(); resolve(true); });

      // Focus confirm button for quick keyboard access
      setTimeout(() => { try { okBtn.focus(); } catch (e) {} }, 10);
    } catch (e) {
      try { resolve(window.confirm(message)); } catch (err) { resolve(false); }
    }
  });
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

  // Query students by class and subclass (if provided). Always request subclass and register_id in the select.
  // register_id is the assigned student ID (used for sorting/filtering).
  let studentsQuery = supabaseClient.from('students').select('id, register_id, first_name, surname, class, subclass').eq('class', classOnly);
  if (subclassOnly) studentsQuery = studentsQuery.eq('subclass', subclassOnly);
  const { data: students, error: studentError } = await studentsQuery;

  if (studentError) {
    console.error('Failed to load students:', studentError.message);
    return;
  }

  // Sorting: allow sorting by name or assigned id. Read `#sortBy` select (added in the filters).
  try {
    const sortBy = (document.getElementById('sortBy') && document.getElementById('sortBy').value) ? document.getElementById('sortBy').value : 'name';
    // Natural compare for assigned IDs (handles numeric parts like FM1_2 vs FM1_10)
    function naturalCompare(a, b) {
      if (a === b) return 0;
      const A = String(a || '').match(/(\d+|\D+)/g) || [String(a || '')];
      const B = String(b || '').match(/(\d+|\D+)/g) || [String(b || '')];
      const n = Math.min(A.length, B.length);
      for (let i = 0; i < n; i++) {
        if (A[i] === B[i]) continue;
        const ad = /^\d+$/.test(A[i]);
        const bd = /^\d+$/.test(B[i]);
        if (ad && bd) {
          const diff = parseInt(A[i], 10) - parseInt(B[i], 10);
          if (diff !== 0) return diff;
        } else {
          return A[i].localeCompare(B[i]);
        }
      }
      return A.length - B.length;
    }

    if (sortBy === 'assigned_id') {
      students.sort((a, b) => naturalCompare(a.register_id || a.id || '', b.register_id || b.id || ''));
    } else {
      // Default: sort by surname then first name
      students.sort((a, b) => {
        const sa = ((a.surname || '') + ' ' + (a.first_name || '')).toLowerCase();
        const sb = ((b.surname || '') + ' ' + (b.first_name || '')).toLowerCase();
        if (sa < sb) return -1;
        if (sa > sb) return 1;
        return 0;
      });
    }
  } catch (e) { /* ignore sorting errors */ }

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
      <td>
        <input type="number" data-student="${student.id}" data-field="attendance_total" value="${presentCount}" min="0" style="width:86px" />
        &nbsp;out of&nbsp;${attendanceActualDisplay}
      </td>
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
  // Reset dirty flag since freshly loaded values match persisted data
  try { setProfilesDirty(false); } catch (e) {}
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
  if (!term) {
    try { notify('Please select a term before saving.', 'warning'); } catch (e) {}
    return;
  }
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
    // Allow manual override of attendance_total (and attendance_actual) only when a
    // non-empty numeric value is provided. Otherwise keep the computed presentCountForStudent.
    if (field === 'attendance_total' || field === 'attendance_actual') {
      if (input.tagName === 'INPUT') {
        const raw = (input.value || '').toString().trim();
        if (raw !== '') {
          let num = parseInt(raw, 10);
          if (isNaN(num)) num = 0;
          payload[field] = num;
        } else {
          // leave payload[field] as computed above
        }
      } else {
        let num = parseInt(input.value, 10);
        if (isNaN(num)) num = 0;
        payload[field] = num;
      }
    } else {
      // For selects (interest/conduct) and other inputs, take the provided value
      if (input.tagName === 'SELECT') payload[field] = input.value;
      else payload[field] = input.value;
    }
  });

  // Provide attendance_actual as the canonical number of days in session (if known)
  if (attendanceTotalDays !== null && attendanceTotalDays !== undefined) payload.attendance_actual = attendanceTotalDays;

  const { error } = await supabaseClient
    .from('profiles')
    .upsert([payload], {
      onConflict: ['student_id', 'term']
    });

  if (error) {
  try { notify('Save failed: ' + error.message, 'error'); } catch (e) { try { safeNotify('Save failed: ' + error.message, 'error'); } catch (ee) { console.error('safeNotify failed', ee); } }
    console.error('Upsert error:', error.message);
  } else {
  try { notify('Profile saved successfully.', 'info'); } catch (e) { try { safeNotify('Profile saved successfully.', 'info'); } catch (ee) { console.error('safeNotify failed', ee); } }
    loadProfiles();
  }
}

// Bulk save: collect all editable profile rows and upsert in one request
async function saveAllProfiles() {
  const term = getValueByIds('termFilter','term');
  const year = getValueByIds('yearFilter','year');
  if (!term) { try { notify('Please select a term before saving all.', 'warning'); } catch (e) {} return; }
  if (!year) { try { notify('Please select a year before saving all.', 'warning'); } catch (e) {} return; }
  const tbody = document.querySelector('#profileTable tbody');
  if (!tbody) { try { notify('Profiles table not found.', 'error'); } catch (e) {} return; }

  // Read global attendance_actual (attendance_total_days) to store as attendance_actual
  let attendanceTotalDays = 0;
  try {
    const { data: sd, error: sdErr } = await supabaseClient
      .from('school_dates')
      .select('attendance_total_days')
      .order('inserted_at', { ascending: false })
      .limit(1);
    if (!sdErr && sd && sd.length > 0) attendanceTotalDays = sd[0].attendance_total_days || 0;
  } catch (e) { attendanceTotalDays = 0; }

  const rows = Array.from(tbody.querySelectorAll('tr'));
  const payloads = [];
  rows.forEach(row => {
    // find any input/select with data-student attribute inside this row
    const inputs = row.querySelectorAll('[data-student]');
    const pdata = { interest: null, conduct: null, attendance_total: null, student_id: null };
    inputs.forEach(inp => {
      const field = inp.dataset.field;
      const sid = inp.dataset.student;
      if (sid) pdata.student_id = sid;
      if (field === 'attendance_total') {
        const raw = inp.value || '';
        pdata.attendance_total = raw.toString().trim() === '' ? null : (parseInt(raw,10) || 0);
      } else if (field === 'interest') pdata.interest = inp.value;
      else if (field === 'conduct') pdata.conduct = inp.value;
    });
    if (pdata.student_id) {
      const p = {
        student_id: pdata.student_id,
        term,
        year,
        updated_at: new Date().toISOString()
      };
      // If teacher provided a value for attendance_total, use it; otherwise do not include it so DB computed value (via existing logic) remains authoritative when using per-row save.
      if (pdata.attendance_total !== null) p.attendance_total = pdata.attendance_total;
      // Always set attendance_actual to the global attendance days (this mirrors per-row behavior)
      if (attendanceTotalDays !== null && attendanceTotalDays !== undefined) p.attendance_actual = attendanceTotalDays;
      if (pdata.interest !== null) p.interest = pdata.interest;
      if (pdata.conduct !== null) p.conduct = pdata.conduct;
      payloads.push(p);
    }
  });

  if (payloads.length === 0) {
    try { notify('No profile updates found to save.', 'warning'); } catch (e) {}
    return;
  }

  // Confirm bulk save with a modern floating dialog
  try {
    const confirmMsg = `Save ${payloads.length} profile update${payloads.length === 1 ? '' : 's'}? This will overwrite saved interest, conduct and any manually-entered attendance totals.`;
    const confirmed = await showFloatingConfirm(confirmMsg, { title: 'Confirm Save All' });
    if (!confirmed) return;
  } catch (e) {}

  let loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Saving all profiles...') : null;
  try {
    if (loader) loader.update(10);
    const { error } = await supabaseClient
      .from('profiles')
      .upsert(payloads, { onConflict: ['student_id', 'term'] });
    if (error) {
      try { notify('Failed to save profiles: ' + error.message, 'error'); } catch (e) {}
    } else {
      try { notify('All profiles saved successfully.', 'info'); } catch (e) {}
      // Refresh the list to show persisted values
      await loadProfiles();
      // Clear dirty flag after successful save
      try { setProfilesDirty(false); } catch (e) {}
    }
  } catch (e) {
    try { notify('Unexpected error saving profiles.', 'error'); } catch (err) {}
  } finally {
    try { if (loader) loader.close(); } catch (e) {}
  }
}
window.saveAllProfiles = saveAllProfiles;

// Inject a "Save All" button above the profile table for convenience
document.addEventListener('DOMContentLoaded', function() {
  try {
    const table = document.getElementById('profileTable');
    if (!table) return;
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'flex-end';
    wrapper.style.margin = '0 0 8px 0';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'saveAllProfilesBtn';
    btn.textContent = 'Save All';
      // Disabled by default until a change is detected
      btn.disabled = true;
    btn.style.padding = '8px 12px';
    btn.style.background = '#004080';
    btn.style.color = '#fff';
    btn.style.border = 'none';
    btn.style.borderRadius = '6px';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', saveAllProfiles);
    wrapper.appendChild(btn);
    table.parentNode.insertBefore(wrapper, table);

    // Attach delegated change listeners to mark the table as dirty when inputs/selects change
    try {
      const tbody = table.querySelector('tbody');
      if (tbody) {
        tbody.addEventListener('input', function(e) {
          const target = e.target;
          if (target && target.dataset && target.dataset.student) setProfilesDirty(true);
        }, { passive: true });
        tbody.addEventListener('change', function(e) {
          const target = e.target;
          if (target && target.dataset && target.dataset.student) setProfilesDirty(true);
        });
      }
    } catch (e) {}
  } catch (e) { /* ignore injection errors */ }
});
