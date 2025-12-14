// Logout function for teacher dashboard
function logout() {
  sessionStorage.clear();
  sessionStorage.removeItem('teacher_staff_id');
  localStorage.removeItem('teacherId');
  window.location.href = 'index.html';
}

// Alert shim: prefer in-page toast/dialog when available, keep original as fallback
try {
  if (!window._originalAlert) window._originalAlert = window.alert.bind(window);
  window.alert = function(msg) {
    try {
      if (typeof window.showToast === 'function') return window.showToast(String(msg), 'info');
      if (typeof window.safeNotify === 'function') return window.safeNotify(String(msg), 'info');
      if (window._originalAlert) return window._originalAlert(String(msg));
      // last resort
      console.debug('alert fallback:', msg);
    } catch (e) {
      try { if (window._originalAlert) return window._originalAlert(String(msg)); } catch (ee) { console.debug('alert fallback error', ee); }
    }
  };
} catch (e) { /* ignore shim errors */ }

// Notification helper: prefer in-page toast if available
const notify = (msg, type='info') => {
  try {
    if (window.showToast) return window.showToast(msg, type);
    if (window.safeNotify) return window.safeNotify(msg, type);
    if (window._originalAlert) return window._originalAlert(String(msg));
    console.debug('Notify fallback (no toast available):', msg);
  } catch (e) { console.debug('Notify exception fallback:', msg); }
};

window.addEventListener('DOMContentLoaded', function() {
  // Prevent access if not logged in as teacher
  const teacherId = localStorage.getItem('teacherId');
  if (!teacherId) {
    // Send user to homepage where inline login modal will guide them
  try { localStorage.setItem('openLoginRole', 'teacher'); } catch (e) {}
  window.location.href = 'index.html';
    return;
  }
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }
  // Load the teacher dashboard data (will read staffId/teacherId from storage if needed)
  try { loadTeacherDashboard(); } catch (e) { console.warn('loadTeacherDashboard call failed on init', e); }
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
// Global helpers to persist last attendance dates per class+term in localStorage
function _attendanceStorage() {
  try { return JSON.parse(localStorage.getItem('attendanceLastDates') || '{}'); } catch (e) { return {}; }
}
function getLastAttendanceDate(classVal, termVal) {
  try {
    const store = _attendanceStorage();
    const key = `${classVal || ''}::${termVal || ''}`;
    return store[key] || null;
  } catch (e) { return null; }
}
function setLastAttendanceDate(classVal, termVal, dateStr) {
  try {
    const store = _attendanceStorage();
    const key = `${classVal || ''}::${termVal || ''}`;
    store[key] = dateStr;
    localStorage.setItem('attendanceLastDates', JSON.stringify(store));
  } catch (e) { /* ignore */ }
}
function _nextDateISO(dateStr) {
  try {
    // parse as UTC date to avoid timezone shifts
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0,10);
  } catch (e) { return null; }
}
function setupAttendanceSection() {
  // Helpers: store last attendance dates per class+term in localStorage
  function _attendanceStorage() {
    try { return JSON.parse(localStorage.getItem('attendanceLastDates') || '{}'); } catch (e) { return {}; }
  }
  function getLastAttendanceDate(classVal, termVal) {
    try {
      const store = _attendanceStorage();
      const key = `${classVal || ''}::${termVal || ''}`;
      return store[key] || null;
    } catch (e) { return null; }
  }
  function setLastAttendanceDate(classVal, termVal, dateStr) {
    try {
      const store = _attendanceStorage();
      const key = `${classVal || ''}::${termVal || ''}`;
      store[key] = dateStr;
      localStorage.setItem('attendanceLastDates', JSON.stringify(store));
    } catch (e) { /* ignore storage errors */ }
  }

  const attendanceClassSelect = document.getElementById('attendanceClassSelect');
  // If teacher is a Class Teacher with a single class (class_teacher_class), prefer that
  // and lock the attendance selector to that class (including subclass if present).
  try {
    const assigned = getAssignedClass();
    if (teacher && teacher.responsibility === 'Class Teacher' && assigned) {
      // If the teacher has an explicit subclass (e.g. 'JHS 2 A'), lock to that subclass.
      // If the teacher has only a base class (e.g. 'JHS 2'), populate the select with
      // an "All" option and one option per subclass found for that class so the teacher
      // can choose to mark for All or a specific subclass.
  const tt = assigned;
      // Parse class and optional subclass token
      const tm = tt.match(/^(.+?)\s+([A-Za-z0-9]+)$/);
      if (attendanceClassSelect) {
        attendanceClassSelect.innerHTML = '';
        if (tm) {
          // Assigned with subclass -> single locked option
          const opt = document.createElement('option');
          opt.value = tt;
          opt.textContent = tt;
          attendanceClassSelect.appendChild(opt);
          attendanceClassSelect.value = tt;
          attendanceClassSelect.disabled = true;
          // Load students immediately for the locked subclass
          setTimeout(loadAttendanceStudents, 30);
          return;
        } else {
          // Assigned to base class only: show All + per-subclass options discovered from students table
          const classOnly = tt;
          // Add 'All' option (value = classOnly) to show all subclasses
          const allOpt = document.createElement('option');
          allOpt.value = classOnly;
          allOpt.textContent = `${classOnly} (All)`;
          attendanceClassSelect.appendChild(allOpt);
          // Fetch available subclasses for this class and populate options
          (async () => {
            try {
              const { data: subs, error } = await supabaseClient
                .from('students')
                .select('subclass')
                .eq('class', classOnly);
              if (!error && Array.isArray(subs)) {
                // Deduplicate and append
                const unique = [...new Set(subs.map(s => (s.subclass || '').toString().trim()).filter(Boolean))];
                unique.forEach(sc => {
                  const o = document.createElement('option');
                  o.value = `${classOnly} ${sc}`;
                  o.textContent = `${classOnly} ${sc}`;
                  attendanceClassSelect.appendChild(o);
                });
              }
            } catch (e) { console.debug('Failed to load subclasses for class teacher:', e); }
            // Allow teacher to change subclass selection (All by default)
            attendanceClassSelect.disabled = false;
            attendanceClassSelect.addEventListener('change', loadAttendanceStudents);
            // Trigger initial load (All)
            setTimeout(loadAttendanceStudents, 50);
          })();
          // Return now — the async function will call loadAttendanceStudents after population
          return;
        }
      }
    }
  } catch (e) { console.warn('setupAttendanceSection class teacher lock failed', e); }
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
    // Do not auto-set to today here. The date will be initialized to the last submitted
    // date for the selected class/term inside `loadAttendanceStudents()` so teachers
    // always see the most recent submitted date by default.
    attendanceDate.addEventListener('change', loadAttendanceStudents);
    // Wire up filter select change handler if present
    const filterEl = document.getElementById('attendanceFilter');
    if (filterEl) {
      filterEl.addEventListener('change', function() { try { applyAttendanceFilter(); } catch (e) {} });
    }
  }
  // Ensure we initialize the attendance view once if a class is already selected.
  // This will set the date field to the last submitted date (if present) so teachers
  // can continue marking from where they left off without manually changing the date.
  try {
    const classSelectEl = document.getElementById('attendanceClassSelect');
    if (classSelectEl && classSelectEl.value) {
      setTimeout(loadAttendanceStudents, 50);
    }
  } catch (e) { /* ignore */ }
}

// Load students for selected class and date
async function loadAttendanceStudents() {
  const classSelectEl = document.getElementById('attendanceClassSelect');
  const rawClassVal = classSelectEl ? (classSelectEl.value || '') : '';
  let classVal = rawClassVal ? rawClassVal.trim() : '';
  console.debug('[Attendance] Normalized class value:', classVal);
  const tbody = document.getElementById('attendanceTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // If teacher is a Class Teacher and has an assigned class, override and strictly use that
  let assignedClass = null;
  try { if (teacher && teacher.responsibility === 'Class Teacher') assignedClass = getAssignedClass(); } catch (e) { assignedClass = null; }
  if (assignedClass) {
    // override the selection so even if the DOM value differs we always use the teacher's assigned class
    classVal = assignedClass;
  }

  if (!classVal) {
    tbody.innerHTML = '<tr><td colspan="2">No class selected.</td></tr>';
    return;
  }

  // Parse class and optional subclass (e.g. 'JHS 2 A' -> classOnly='JHS 2', subclassOnly='A')
  let classOnly = classVal;
  let subclassOnly = null;
  const m = classVal.match(/^(.+?)\s+([A-Za-z0-9]+)$/);
  if (m) {
    classOnly = m[1].trim();
    subclassOnly = m[2].toString().trim().toUpperCase();
  }

  // If teacher is Class Teacher but their assigned class is different from the selected class, disallow
  if (teacher && teacher.responsibility === 'Class Teacher') {
    const assignedNormalized = getAssignedClass();
    if (assignedNormalized && assignedNormalized !== classVal) {
      tbody.innerHTML = '<tr><td colspan="2" style="color:red;">You are only allowed to mark attendance for your assigned class (' + assignedNormalized + ').</td></tr>';
      return;
    }
  } else {
    // For non-class-teachers, ensure they only load students for classes they are assigned to
    if (teacher && Array.isArray(teacher.classes) && teacher.classes.length > 0) {
      if (!teacher.classes.includes(classOnly) && !teacher.classes.includes(classVal)) {
        tbody.innerHTML = '<tr><td colspan="2" style="color:red;">You are not assigned to this class. Please select one of your assigned classes.</td></tr>';
        return;
      }
    }
  }

  // Fetch students for the class, then do subclass filtering in JS to avoid case/collation issues
  let q = supabaseClient.from('students').select('id, register_id, first_name, surname, class, subclass').eq('class', classOnly);
  let { data, error } = await q;
  // Some installations store the subclass concatenated into the `class` column (e.g. 'JHS 2 A').
  // If we didn't find any rows by the base class, try querying the full class value including subclass.
  if ((!data || data.length === 0) && classVal && classVal !== classOnly) {
    try {
      const alt = await supabaseClient.from('students').select('id, register_id, first_name, surname, class, subclass').eq('class', classVal);
      if (alt && alt.data && Array.isArray(alt.data) && alt.data.length > 0) {
        data = alt.data;
        error = alt.error || null;
      }
    } catch (e) {
      console.debug('Alternate student query failed', e);
    }
  }

  if (error || !Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" style="color:red;">No students found for this class. If you are the class teacher, please check that students are registered for this class in the system.</td></tr>';
    return;
  }

  // Initialize attendance date to last submitted date for this class+term if present
  try {
    const dateEl = document.getElementById('attendanceDate');
    const termVal = document.getElementById('attendanceTerm') ? document.getElementById('attendanceTerm').value : '';
    if (dateEl) {
      // getLastAttendanceDate is defined in setupAttendanceSection scope; if not available, fallback to localStorage read
      let last = null;
      try { if (typeof getLastAttendanceDate === 'function') last = getLastAttendanceDate(classVal, termVal); } catch(e) { last = null; }
      try {
        if (!last) {
          const store = JSON.parse(localStorage.getItem('attendanceLastDates') || '{}');
          const key = `${classVal || ''}::${termVal || ''}`;
          last = store[key] || null;
        }
      } catch (e) { last = null; }
      const badge = document.getElementById('attendanceLastSubmitted');
      if (last) {
        dateEl.value = last;
        if (badge) { badge.textContent = 'Last submitted: ' + last; badge.style.display = ''; }
      } else {
        if (!dateEl.value) dateEl.valueAsDate = new Date();
        if (badge) { badge.style.display = 'none'; }
      }
    }
  } catch (e) { /* ignore date init errors */ }

  // If a subclass is specified (either selected or assigned), filter results to that subclass only
  let rowsToShow = data;
  if (subclassOnly) {
    rowsToShow = data.filter(s => {
      const sc = (s.subclass || '').toString().trim().toUpperCase();
      const classField = (s.class || '').toString().trim().toUpperCase();
      // Treat either a matching subclass column OR a class field that equals the full selected class as a match
      return sc === subclassOnly || classField === classVal.toString().trim().toUpperCase();
    });
  }
  // If teacher is Class Teacher and assigned a subclass but no students match, show helpful message

  // Natural sort comparator for student IDs (handles numeric parts)
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

  // Sort by register_id (assigned student ID) using natural comparison so FM1_1, FM1_2, FM1_10 order correctly
  rowsToShow.sort((s1, s2) => naturalCompare(s1.register_id || s1.id, s2.register_id || s2.id));

  // If teacher is Class Teacher and assigned a subclass but no students match, show helpful message
  const assignedForCheck = getAssignedClass();
  if (teacher && teacher.responsibility === 'Class Teacher' && assignedForCheck) {
    if (rowsToShow.length === 0) {
      tbody.innerHTML = '<tr><td colspan="2" style="color:red;">No students found in your assigned subclass. Please confirm students have the correct subclass set in their profiles.</td></tr>';
      return;
    }
  }

  // Populate filter select with student options using register_id (assigned ID) (preserve previous selection when possible)
  const filterSelect = document.getElementById('attendanceFilter');
  let prevFilterVal = '';
  if (filterSelect) prevFilterVal = filterSelect.value || '';
  if (filterSelect) {
    filterSelect.innerHTML = '<option value="">All students</option>';
    rowsToShow.forEach(s => {
      const opt = document.createElement('option');
      const regId = s.register_id || s.id || '';
      opt.value = regId;
      const fname = (s.first_name || '').toString().trim();
      const sname = (s.surname || '').toString().trim();
      opt.textContent = `${regId}${(fname || sname) ? ' — ' : ''}${fname} ${sname}`.trim();
      filterSelect.appendChild(opt);
    });
    if (prevFilterVal) try { filterSelect.value = prevFilterVal; } catch(e) {}
  }

  rowsToShow.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td style="text-align:center;">
        <input type="checkbox" class="attendance-present" data-student-id="${student.id}" checked /> Present
      </td>
    `;
    // Attach identifiers for filtering (use register_id for display, fallback to system id)
    row.dataset.studentId = (student.register_id || student.id) || '';
    row.dataset.studentName = `${(student.first_name || '').toString().trim()} ${(student.surname || '').toString().trim()}`.trim();
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

  // Apply any active filter after rendering
  try { applyAttendanceFilter(); } catch (e) { /* ignore if function not present */ }
}

// Apply filter input to attendance table (hides rows that don't match id or name)
function applyAttendanceFilter() {
  const qEl = document.getElementById('attendanceFilter');
  const tbody = document.getElementById('attendanceTableBody');
  if (!tbody) return;
  const q = qEl && qEl.value ? qEl.value.toString().trim() : '';
  if (!q) {
    // show all
    Array.from(tbody.children).forEach(r => { r.style.display = ''; });
    return;
  }
  // For select-based filter, match exact student id (case sensitive preserved), but compare lowercase for safety
  const ql = q.toString().toLowerCase();
  Array.from(tbody.children).forEach(r => {
    const sid = (r.dataset.studentId || '').toString().toLowerCase();
    const sname = (r.dataset.studentName || '').toString().toLowerCase();
    if (sid === ql || sid.includes(ql) || sname.includes(ql)) r.style.display = '';
    else r.style.display = 'none';
  });
}

// Submit attendance to Supabase
async function submitAttendance() {
  const classVal = document.getElementById('attendanceClassSelect').value;
  const dateVal = document.getElementById('attendanceDate').value;
  const termVal = document.getElementById('attendanceTerm') ? document.getElementById('attendanceTerm').value : '';
  if (!classVal || !dateVal || !termVal) {
    notify('Please select class, term and date.', 'warning');
    return;
  }
  // Normalize class and subclass: classVal may be 'JHS 2 A' or 'JHS 2'.
  let classOnly = classVal;
  let subclassOnly = null;
  const classMatch = classVal.match(/^(.+?)\s+([A-Za-z0-9]+)$/);
  if (classMatch) {
    classOnly = classMatch[1].trim();
    subclassOnly = classMatch[2].toString().trim().toUpperCase();
  }
  const presentCheckboxes = document.querySelectorAll('.attendance-present');
  const records = Array.from(presentCheckboxes).map(cb => {
    const student_id = cb.getAttribute('data-student-id');
    const isPresent = !!cb.checked;
    return {
      student_id,
      class: classOnly,
      subclass: subclassOnly,
      date: dateVal,
      term: termVal,
      present: isPresent,
      marked_by: teacher.id
    };
  });
  if (records.length === 0) {
    notify('No students to mark.', 'warning');
    return;
  }
  // Upsert attendance records (one per student per date). Use onConflict to avoid duplicates.
  let loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Submitting attendance...') : null;
  try {
    if (loader) loader.update(8);
    // Deduplicate records by student_id + date to avoid "ON CONFLICT DO UPDATE command cannot affect row a second time"
    const keyed = {};
    records.forEach(r => {
      const key = `${r.student_id}::${r.date}`;
      keyed[key] = r; // last write wins for duplicates
    });
    const dedupedRecords = Object.values(keyed);

    const { error } = await supabaseClient
      .from('attendance')
      .upsert(dedupedRecords, { onConflict: ['student_id', 'date'] });
    if (error) {
    // Detect commonly encountered schema-cache / missing column error and show actionable guidance
    const msg = error && error.message ? error.message : String(error);
    if (/present/i.test(msg) && /schema cache|could not find/i.test(msg.toLowerCase())) {
      notify('Failed to submit attendance: attendance.present column not found in DB schema. Please run the migration scripts in scripts/migrations (002_add_attendance_columns.sql) or add the column present:boolean and term:text to the attendance table.', 'error');
      const warnDiv = document.getElementById('attendanceSchemaWarning');
      if (warnDiv) {
        warnDiv.style.display = '';
        warnDiv.style.background = '#fff4f4';
        warnDiv.style.color = '#8a1f11';
        warnDiv.style.border = '1px solid #f5c6cb';
        warnDiv.innerHTML = `<strong>Database error:</strong> ${msg}. Run <code>scripts/migrations/002_add_attendance_columns.sql</code> in your database or add the missing columns.`;
      }
    } else {
      notify('Failed to submit attendance: ' + msg, 'error');
    }
    } else {
      if (loader) loader.update(20);
      notify('Attendance submitted successfully!', 'info');
      try {
        // Persist the last submitted date for this class+term and advance the date field
        try { setLastAttendanceDate(classVal, termVal, dateVal); } catch (e) {}
        // Update badge to show the last submitted date
        try { const badge = document.getElementById('attendanceLastSubmitted'); if (badge) { badge.textContent = 'Last submitted: ' + dateVal; badge.style.display = ''; } } catch (e) {}
        const next = _nextDateISO(dateVal);
        if (next) {
          const dateEl = document.getElementById('attendanceDate');
          if (dateEl) dateEl.value = next;
          // Refresh students view for the new date so teacher can continue marking
          setTimeout(() => { try { loadAttendanceStudents(); } catch (e) {} }, 120);
        }
      } catch (e) { /* ignore persistence errors */ }
    }
  } finally { try { if (loader) loader.close(); } catch(e) {} }
  // After attendance is saved, recompute attendance totals per student for this term and upsert into profiles
  try {
    const studentIds = [...new Set(records.map(r => r.student_id))];
    // Get the school's attendance_actual (total days) from school_dates
    let attendanceActual = null;
    try {
      const { data: sd, error: sdErr } = await supabaseClient
        .from('school_dates')
        .select('attendance_total_days')
        .order('inserted_at', { ascending: false })
        .limit(1);
      if (!sdErr && sd && sd.length) attendanceActual = sd[0].attendance_total_days || null;
    } catch (e) { attendanceActual = null; }

  for (const [i, sid] of studentIds.entries()) {
      // Count unique dates where this student was marked present for the selected term
      let presentCount = 0;
      try {
        const { data: attRows, error: attErr } = await supabaseClient
          .from('attendance')
          .select('id, date, present')
          .eq('student_id', sid)
          .eq('term', termVal);
        if (!attErr && Array.isArray(attRows)) {
          const presentSet = new Set();
          attRows.forEach(a => {
            const v = a.present;
            let isPresent = false;
            if (v === true) isPresent = true;
            else if (typeof v === 'string') {
              const s = v.toString().trim().toLowerCase();
              if (s === 't' || s === 'true' || s === '1') isPresent = true;
            } else if (typeof v === 'number') {
              if (v === 1) isPresent = true;
            }
            if (!isPresent) return;
            if (a.date) presentSet.add(a.date.toString());
            else if (a.id) presentSet.add('rec-' + a.id);
            else presentSet.add(JSON.stringify(a));
          });
          presentCount = presentSet.size;
        }
      } catch (e) {
        presentCount = 0;
      }

      // Try to update existing profile for student+term (do not require year)
      const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('student_id', sid)
        .eq('term', termVal)
        .maybeSingle();

      const payload = {
        student_id: sid,
        term: termVal,
        attendance_total: presentCount,
        updated_at: new Date().toISOString()
      };
      if (attendanceActual !== null) payload.attendance_actual = attendanceActual;

      if (existingProfile && existingProfile.id) {
        await supabaseClient.from('profiles').update(payload).eq('id', existingProfile.id);
      } else {
        // Insert minimal profile row so the UI can display attendance_total (year omitted)
        await supabaseClient.from('profiles').insert([payload]);
      }
      try { if (typeof window.showLoadingToast === 'function') { /* update visual progress if loader still exists */ if (loader) loader.update(20 + Math.round(((i+1)/studentIds.length) * 70)); } } catch(e) {}
    }
    // Notify other open pages (interest/conduct, etc.) that attendance changed so they can refresh
    try {
      // Include date in the payload so admin checks can use the exact attendance date
      localStorage.setItem('attendanceUpdated', JSON.stringify({ ts: Date.now(), studentIds, term: termVal, date: dateVal }));
    } catch (e) { /* ignore storage errors */ }
  } catch (e) {
    console.warn('Failed to sync attendance totals to profiles:', e);
  }
}
// ----------------------------------------------------------
// Send motivational message to selected student
async function sendMotivationalMessage() {
  const studentId = document.getElementById('motivationStudentSelect')?.value;
  const message = document.getElementById('motivationText')?.value.trim();
    if (!teacher || !teacher.id) {
      notify('Teacher session not found.', 'error');
      return;
    }
  if (!studentId || !message) {
    notify('Please select a student and enter a message.', 'warning');
    return;
  }
  // Basic UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(studentId) || !uuidRegex.test(teacher.id)) {
    notify('Invalid student or teacher ID format.', 'error');
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
    notify('Failed to send motivation: ' + error.message, 'error');
  } else {
    notify('Motivational message sent!', 'info');
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
// ✅ Supabase client setup - Main project (students, teachers, results, etc.)
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);

// ✅ Supabase client setup - Career Tech project (career_tech_results table only)
// Replace with your Career Tech Supabase URL and ANON key
const supabaseCareerTech = createClient(
  'https://tivkbqpoqshdgyjgdwbu.supabase.co', // Replace with your Career Tech Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpdmticXBvcXNoZGd5amdkd2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjA3NTksImV4cCI6MjA4MDg5Njc1OX0.CFAE66k6Q75yAIBQr6PByeY-0os8sBrV2r2WERJKGbI' // Replace with your Career Tech Supabase ANON key
);

let teacher = {};

// Helper: return teacher assigned class (prefer split columns if present)
function getAssignedClass() {
  try {
    if (!teacher) return null;
    const main = (teacher.class_teacher_class_main || '').toString().trim();
    const sub = (teacher.class_teacher_subclass || '').toString().trim();
    if (main && sub) return (main + ' ' + sub).trim();
    if (main) return main;
    if (teacher.class_teacher_class) return teacher.class_teacher_class.toString().trim();
    return null;
  } catch (e) { return (teacher && teacher.class_teacher_class) ? teacher.class_teacher_class.toString().trim() : null; }
}
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
      try { localStorage.setItem('openLoginRole', 'teacher'); } catch (e) {}
      window.location.href = 'index.html';
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
    // Schema uses split columns; do not request the legacy `class_teacher_class` which may be absent
    .select('id, name, staff_id, responsibility, class_teacher_class_main, class_teacher_subclass')
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
  // For Career Tech, show area dropdown if needed (SBA section)
  const subjectSelect = document.getElementById('subjectSelect');
  const areaSelect = document.getElementById('careerTechAreaSelect');
  const careerTechAreaLabel = document.getElementById('careerTechAreaLabel');
  if (subjectSelect && areaSelect && careerTechAreaLabel) {
    subjectSelect.addEventListener('change', function() {
      if (subjectSelect.value === 'Career Tech') {
        areaSelect.classList.remove('hidden');
        careerTechAreaLabel.classList.remove('hidden');
        // Only show areas assigned to this teacher
        areaSelect.innerHTML = '<option value="">-- Select Area --</option>' + teacher.areas.map(a => `<option value="${a}">${a}</option>`).join('');
      } else {
        areaSelect.classList.add('hidden');
        careerTechAreaLabel.classList.add('hidden');
        areaSelect.innerHTML = '';
        areaSelect.value = '';
      }
    });
    // Hide area dropdown by default
    areaSelect.classList.add('hidden');
    careerTechAreaLabel.classList.add('hidden');
  }

  // For Career Tech, show area dropdown if needed (Exam section)
  const subjectSelectExam = document.getElementById('subjectSelectExam');
  const areaSelectExam = document.getElementById('careerTechAreaSelectExam');
  const careerTechAreaLabelExam = document.getElementById('careerTechAreaLabelExam');
  if (subjectSelectExam && areaSelectExam && careerTechAreaLabelExam) {
    subjectSelectExam.addEventListener('change', function() {
      if (subjectSelectExam.value === 'Career Tech') {
        areaSelectExam.classList.remove('hidden');
        careerTechAreaLabelExam.classList.remove('hidden');
        // Only show areas assigned to this teacher
        areaSelectExam.innerHTML = '<option value="">-- Select Area --</option>' + teacher.areas.map(a => `<option value="${a}">${a}</option>`).join('');
      } else {
        areaSelectExam.classList.add('hidden');
        careerTechAreaLabelExam.classList.add('hidden');
        areaSelectExam.innerHTML = '';
        areaSelectExam.value = '';
      }
    });
    // Hide area dropdown by default
    areaSelectExam.classList.add('hidden');
    careerTechAreaLabelExam.classList.add('hidden');
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
      notify('Please select class, subject, term, and year.', 'warning');
    return;
  }
  // Ensure term is valid
  const allowedTerms = ['First', 'Second', 'Third', 'Promotion'];
  if (!allowedTerms.includes(termVal)) {
    notify('Invalid term value.', 'warning');
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
    notify('No students to mark.', 'warning');
    return;
  }
  let loader = null;
  try {
    loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Submitting promotion exam marks...') : null;
    if (loader) loader.update(10);
    const { error, data } = await supabaseClient
      .from('promotion_exams')
      .upsert(records, { onConflict: ['student_id', 'class', 'subject', 'term', 'year'] });
    if (error) {
      console.error('Promotion exam upsert error:', error);
      notify('Failed to submit promotion exam: ' + (error.message || JSON.stringify(error)), 'error');
    } else {
      if (loader) loader.update(100);
      notify('Promotion exam submitted to admin!', 'info');
      document.getElementById('promotionExamTableBody').innerHTML = '';
      // Optionally reload students to repopulate form with latest marks
      loadPromotionExamStudents();
    }
  } catch (err) {
    console.error('Promotion exam upsert exception:', err);
    notify('Unexpected error: ' + err.message, 'error');
  } finally {
    try { if (loader) loader.close(); } catch(e) {}
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
  // All teachers (Class Teacher, Subject Teacher, Career Tech, etc.) can access SBA/exam entry
  // for their assigned classes and subjects. The class/subject select dropdowns are already
  // filtered by their teaching assignment, so access control is implicit.
  if (!teacher) {
    students = [];
    if (section === 'sba') {
      renderSBAForm({});
      const sbaSearch = document.getElementById('studentSearchSBA');
      if (sbaSearch) sbaSearch.value = '';
    } else if (section === 'exam') {
      renderExamForm({});
      const examSearch = document.getElementById('studentSearchExam');
      if (examSearch) examSearch.value = '';
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
    .select('id, first_name, surname, register_id')
    .eq('class', selectedClass);
  if (error) {
    console.error('Failed to load students:', error.message);
    students = [];
  } else {
    // Sort students by register_id (roll number)
    students = (data || []).slice().sort((a, b) => {
      if (!a.register_id || !b.register_id) return 0;
      const [ac, an] = a.register_id.split('_');
      const [bc, bn] = b.register_id.split('_');
      if (ac === bc) return parseInt(an, 10) - parseInt(bn, 10);
      return ac.localeCompare(bc);
    });
  }
  // Only load marks if subject, term, and year are selected
  let marksMap = {};
  if (section === 'sba') {
    const { term, year } = getTermYear();
    const areaVal = document.getElementById('careerTechAreaSelect')?.value || null;
    if (selectedSubject && term && year) {
      try {
        let marksData = [];
        
        if (selectedSubject === 'Career Tech') {
          // For Career Tech, fetch from career_tech_results table in Career Tech Supabase
          let query = supabaseCareerTech
            .from('career_tech_results')
            .select('student_id, class_score, individual, "group", class_test, project, area')
            .eq('term', term)
            .eq('year', year);
          // If area is selected, filter by it; otherwise fetch all areas
          if (areaVal) {
            query = query.eq('area', areaVal);
          }
          const result = await query;
          marksData = result.data || [];
        } else {
          // For other subjects, fetch from results table
          let query = supabaseClient
            .from('results')
            .select('student_id, class_score, individual, "group", class_test, project, area')
            .eq('subject', selectedSubject)
            .eq('term', term)
            .eq('year', year);
          const result = await query;
          marksData = result.data || [];
        }
        
        if (Array.isArray(marksData)) {
          // Filter to only include marks for students in the current class roster
          const studentIds = new Set(students.map(s => s.id));
          marksData.forEach(m => {
            if (studentIds.has(m.student_id)) {
              marksMap[m.student_id] = {
                class_score: (typeof m.class_score === 'number') ? m.class_score : null,
                individual: (typeof m.individual === 'number') ? m.individual : null,
                group: (typeof m["group"] === 'number') ? m["group"] : null,
                class_test: (typeof m.class_test === 'number') ? m.class_test : null,
                project: (typeof m.project === 'number') ? m.project : null
              };
            }
          });
          console.debug('SBA marks loaded:', Object.keys(marksMap).length, 'records for', students.length, 'students');
        }
      } catch (err) {
        console.error('SBA marks query failed:', err);
        notify('Failed to load SBA marks. Please check your database columns.', 'error');
      }
    }
    renderSBAForm(marksMap);
    // Clear search input when new data is loaded
    const sbaSearch = document.getElementById('studentSearchSBA');
    if (sbaSearch) sbaSearch.value = '';
  } else if (section === 'exam') {
    const term = document.getElementById('termInputExam')?.value || '';
    const year = document.getElementById('yearInputExam')?.value || '';
    const areaValExam = document.getElementById('careerTechAreaSelectExam')?.value || null;
    if (selectedSubject && term && year) {
      try {
        let marksData = [];
        
        if (selectedSubject === 'Career Tech') {
          // For Career Tech, fetch from career_tech_results table in Career Tech Supabase
          let query = supabaseCareerTech
            .from('career_tech_results')
            .select('student_id, exam_score, area')
            .eq('term', term)
            .eq('year', year);
          // If area is selected, filter by it; otherwise fetch all areas
          if (areaValExam) {
            query = query.eq('area', areaValExam);
          }
          const result = await query;
          marksData = result.data || [];
        } else {
          // For other subjects, fetch from results table
          let query = supabaseClient
            .from('results')
            .select('student_id, exam_score, area')
            .eq('subject', selectedSubject)
            .eq('term', term)
            .eq('year', year);
          const result = await query;
          marksData = result.data || [];
        }
        
        if (Array.isArray(marksData)) {
          // Filter to only include marks for students in the current class roster
          const studentIds = new Set(students.map(s => s.id));
          marksData.forEach(m => {
            if (studentIds.has(m.student_id)) {
              // Convert stored 0-50 scaled value back to 0-100 for display
              marksMap[m.student_id] = Math.round((m.exam_score / 50) * 100);
            }
          });
          console.debug('Exam marks loaded:', Object.keys(marksMap).length, 'records for', students.length, 'students');
        }
      } catch (err) {
        console.error('Exam marks query failed:', err);
        notify('Failed to load exam marks. Please check your database columns.', 'error');
      }
    }
    renderExamForm(marksMap);
    // Clear search input when new data is loaded
    const examSearch = document.getElementById('studentSearchExam');
    if (examSearch) examSearch.value = '';
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

  // Load draft key and drafts upfront
  function getDraftKeyForExam() {
    const classVal = document.getElementById('classSelectExam')?.value || '';
    const subject = document.getElementById('subjectSelectExam')?.value || '';
    const area = document.getElementById('careerTechAreaSelectExam')?.value || '';
    const term = document.getElementById('termInputExam')?.value || '';
    const year = document.getElementById('yearInputExam')?.value || '';
    // Include area in the draft key for Career Tech to separate marks by area
    return `drafts:exam:${classVal}:${subject}:${area}:${term}:${year}`;
  }
  function loadDrafts(key) {
    try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch (e) { return {}; }
  }
  const draftKeyExam = getDraftKeyForExam();
  const examDrafts = loadDrafts(draftKeyExam);

  students.forEach(student => {
    // Pre-fill exam score: prefer drafts -> database -> empty
    let examPrefill = '';
    
    // First, load from database
    if (examMarksMap[student.id] !== undefined) {
      examPrefill = examMarksMap[student.id] || '';
    }
    
    // Then, override with drafts if they exist (drafts take precedence)
    if (examDrafts[student.id] !== undefined) {
      examPrefill = examDrafts[student.id] || '';
    }
    
    const scaledPrefill = examPrefill ? Math.round((examPrefill / 100) * 50) : 0;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
      <td style="display:flex;align-items:center;gap:8px">
        <input type="number" data-type="exam" data-id="${student.id}" max="100" min="0" value="${examPrefill}" style="width:80px" placeholder="0-100" />
        <button class="mark-save-btn" data-id="${student.id}" type="button">Save</button>
        <button class="mark-edit-btn hidden" data-id="${student.id}" type="button">Edit</button>
      </td>
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

  // Wire per-row save/edit buttons and local draft storage
  function saveDrafts(key, obj) {
    try { localStorage.setItem(key, JSON.stringify(obj)); } catch (e) {}
  }
  document.querySelectorAll('#examTableBody .mark-save-btn').forEach(btn => {
    const id = btn.dataset.id;
    const editBtn = document.querySelector(`#examTableBody .mark-edit-btn[data-id="${id}"]`);
    // Show "Saved" if either drafts or database records exist
    const hasDraft = examDrafts[id] !== undefined;
    const hasDBRecord = examMarksMap[id] !== undefined;
    if (hasDraft || hasDBRecord) {
      btn.textContent = 'Saved';
      btn.disabled = true;
      if (editBtn) editBtn.classList.remove('hidden');
    }
    btn.addEventListener('click', () => {
      const input = document.querySelector(`#examTableBody input[data-id="${id}"]`);
      const value = parseInt(input.value) || 0;
      examDrafts[id] = value;
      saveDrafts(draftKeyExam, examDrafts);
      btn.textContent = 'Saved';
      btn.disabled = true;
      if (editBtn) editBtn.classList.remove('hidden');
    });
    if (editBtn) {
      // Open edit modal so teacher can edit even after submit
      editBtn.addEventListener('click', () => {
        openEditMarksModal(id, 'exam');
      });
    }
  });

  // Global Save All for exam section
  const examToolbar = document.getElementById('examToolbar');
  if (examToolbar) {
    let saveAllBtn = examToolbar.querySelector('.save-all-exam-btn');
    if (!saveAllBtn) {
      saveAllBtn = document.createElement('button');
      saveAllBtn.type = 'button';
      saveAllBtn.className = 'save-all-exam-btn';
      saveAllBtn.textContent = 'Save All (Draft)';
      examToolbar.appendChild(saveAllBtn);
    }
    saveAllBtn.onclick = () => {
      // Save all visible inputs to drafts
      const inputs = document.querySelectorAll('#examTableBody input[data-type="exam"]');
      inputs.forEach(inp => {
        const id = inp.dataset.id;
        const v = parseInt(inp.value) || 0;
        examDrafts[id] = v;
      });
      saveDrafts(draftKeyExam, examDrafts);
      notify('All marks saved locally as draft.', 'info');
      // refresh buttons
      document.querySelectorAll('#examTableBody .mark-save-btn').forEach(b => { b.textContent = 'Saved'; b.disabled = true; const eb = document.querySelector(`#examTableBody .mark-edit-btn[data-id="${b.dataset.id}"]`); if (eb) eb.classList.remove('hidden'); });
    };
  }

  // If required selects (class/subject/term/year) are not set, disable inputs to prevent entry
  const requiredSetExam = (document.getElementById('classSelectExam')?.value && document.getElementById('subjectSelectExam')?.value && document.getElementById('termInputExam')?.value && document.getElementById('yearInputExam')?.value);
  if (!requiredSetExam) {
    setEntryLockFor('exam', true);
    const toolbar = document.getElementById('examToolbar');
    if (toolbar && !toolbar.querySelector('.exam-require-note')) {
      const note = document.createElement('div');
      note.className = 'exam-require-note';
      note.style.fontSize = '13px';
      note.style.color = '#664d03';
      note.style.margin = '8px 0';
      note.textContent = 'Select Class, Subject, Term and Year to enable Exam entry.';
      toolbar.appendChild(note);
    }
  } else {
    const note = document.querySelector('#examToolbar .exam-require-note'); if (note) note.remove();
    setEntryLockFor('exam', false);
  }
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

// Small helpers to disable/enable groups of inputs during async submissions
function setElementsDisabled(selectors = [], disabled = true) {
  try {
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        try { el.disabled = disabled; } catch (e) {}
      });
    });
  } catch (e) { /* ignore */ }
}

function setSubmissionLockFor(type, disabled) {
  if (type === 'sba') {
    setElementsDisabled([
      '#sbaTableBody input',
      '#sbaTableBody select',
      '#sbaTableBody textarea',
      '#sbaTableBody button',
      '#sbaToolbar button',
      '#classSelect', '#subjectSelect', '#termInput', '#yearInput'
    ], disabled);
  } else if (type === 'exam') {
    setElementsDisabled([
      '#examTableBody input',
      '#examTableBody select',
      '#examTableBody textarea',
      '#examTableBody button',
      '#examToolbar button',
      '#classSelectExam', '#subjectSelectExam', '#termInputExam', '#yearInputExam'
    ], disabled);
  }
}

// Lock only the entry inputs (table inputs and per-row buttons), but leave the global selects enabled
function setEntryLockFor(type, disabled) {
  if (type === 'sba') {
    setElementsDisabled([
      '#sbaTableBody input',
      '#sbaTableBody select',
      '#sbaTableBody textarea',
      '#sbaTableBody button',
      '#sbaToolbar button'
    ], disabled);
  } else if (type === 'exam') {
    setElementsDisabled([
      '#examTableBody input',
      '#examTableBody select',
      '#examTableBody textarea',
      '#examTableBody button',
      '#examToolbar button'
    ], disabled);
  }
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
    notify('SBA marks cannot exceed 15.', 'warning');
    return false;
  }
  if (exam > 100) {
    notify('Exam marks cannot exceed 100.', 'warning');
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
  notify('Scores submitted! Please refresh or reselect the student in the report dashboard to see updated results.', 'info');
  }
}

// ✅ Submit SBA scores
async function submitSBA() {
  const subject = document.getElementById('subjectSelect').value;
  const { term, year } = getTermYear();
  if (!subject || !term || !year) {
      notify('Please select class, subject, term, and year.', 'warning');
    return;
  }
    const classVal = document.getElementById('classSelect').value;
  // Capture Career Tech area if present
  const areaVal = document.getElementById('careerTechAreaSelect')?.value || null;
  // For Career Tech, area must be selected
  if (subject === 'Career Tech' && !areaVal) {
    notify('Please select a Career Tech area.', 'warning');
    return;
  }
  // Check for local drafts and prefer them if present
  // Include area in draft key for Career Tech separation
  const draftKey = `drafts:sba:${classVal}:${subject}:${areaVal || ''}:${term}:${year}`;
  let drafts = {};
  try { drafts = JSON.parse(localStorage.getItem(draftKey) || '{}'); } catch (e) { drafts = {}; }
  const submissions = [];
  // Disable the submit button and show determinate loader immediately so users see progress
  const submitSbaBtn = document.querySelector('button[onclick="submitSBA()"]');
  if (submitSbaBtn) {
    submitSbaBtn.disabled = true;
    submitSbaBtn.dataset.prevText = submitSbaBtn.textContent;
    submitSbaBtn.textContent = 'Submitting...';
  }
  // Request a determinate loader so .update(percent) is shown
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Submitting SBA marks...', {indeterminate: false}) : null;
  // Disable the whole SBA area to prevent edits during upload
  setSubmissionLockFor('sba', true);
  // If drafts exist, use their component breakdown to build submissions; otherwise read component inputs from DOM where possible
  if (drafts && Object.keys(drafts).length > 0) {
    for (const student of students) {
      const d = drafts[student.id];
      if (!d) continue;
      const total = Math.min((d.individual||0) + (d.group||0) + (d.classTest||0) + (d.project||0), 60);
      const scaled = Math.round((total / 60) * 50);
      const rec = {
        student_id: student.id,
        subject,
        term,
        year,
        class_score: scaled,
        exam_score: 0,
        individual: Number(d.individual || 0),
        "group": Number(d.group || 0),
        class_test: Number(d.classTest || 0),
        project: Number(d.project || 0)
      };
      if (subject === 'Career Tech' && areaVal) rec.area = areaVal;
      submissions.push(rec);
    }
  } else {
    for (const student of students) {
      // Try to read component inputs; fall back to scaled display if components not present
      const indEl = document.querySelector(`#sbaTableBody input[data-id="${student.id}"][data-type="individual"]`);
      const grpEl = document.querySelector(`#sbaTableBody input[data-id="${student.id}"][data-type="group"]`);
      const ctEl = document.querySelector(`#sbaTableBody input[data-id="${student.id}"][data-type="classTest"]`);
      const projEl = document.querySelector(`#sbaTableBody input[data-id="${student.id}"][data-type="project"]`);
      let individual = indEl ? (parseInt(indEl.value, 10) || 0) : null;
      let groupVal = grpEl ? (parseInt(grpEl.value, 10) || 0) : null;
      let classTest = ctEl ? (parseInt(ctEl.value, 10) || 0) : null;
      let project = projEl ? (parseInt(projEl.value, 10) || 0) : null;
      // If component inputs are available, compute total and scaled
      let scaled = null;
      if (individual !== null && groupVal !== null && classTest !== null && project !== null) {
        const total = Math.min(individual + groupVal + classTest + project, 60);
        scaled = Math.round((total / 60) * 50);
      } else {
        // fall back to previously computed scaled value in DOM
        scaled = parseInt(document.getElementById(`scaled-${student.id}`).textContent) || 0;
      }
      if (isNaN(scaled) || scaled < 0 || scaled > 50) {
        notify(`Invalid SBA score for ${student.first_name || ''} ${student.surname || ''}. Must be between 0 and 50.`, 'warning');
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
        if (existing && typeof existing.exam_score === 'number') exam_score = existing.exam_score;
      } catch (e) {}
      const rec = {
        student_id: student.id,
        subject,
        term,
        year,
        class_score: scaled,
        exam_score,
        individual: Number(individual || 0),
        "group": Number(groupVal || 0),
        class_test: Number(classTest || 0),
        project: Number(project || 0)
      };
      if (subject === 'Career Tech' && areaVal) rec.area = areaVal;
      submissions.push(rec);
    }
  }
  if (submissions.length === 0) {
  notify('No valid SBA scores to submit.', 'warning');
    return;
  }
  if (submissions.length === 0) { notify('No valid SBA scores to submit.', 'warning'); return; }
  // Show progress using loading toast and submit sequentially to give progressive feedback
  try {
    const includeArea = submissions.some(s => s.area);
    // Separate Career Tech (with area) from regular submissions
    const careerTechSubmissions = submissions.filter(s => s.area).map(s => {
      // Remove 'subject' field from Career Tech records (they use 'area' instead)
      const { subject, ...rest } = s;
      return rest;
    });
    const regularSubmissions = submissions.filter(s => !s.area); // All other subjects
    
    // Batch upserts to reduce number of requests and provide smooth progress updates
    const BATCH_SIZE = 20;
    
    // Process Career Tech submissions (use career_tech_results table in Career Tech Supabase)
    if (careerTechSubmissions.length > 0) {
      for (let i = 0; i < careerTechSubmissions.length; i += BATCH_SIZE) {
        const batch = careerTechSubmissions.slice(i, i + BATCH_SIZE);
        if (loader) loader.update(Math.round(((i + batch.length) / (submissions.length || 1)) * 100));
        if (loader) await new Promise(r => setTimeout(r, 25));
        
        // For Career Tech: upsert to career_tech_results table in Career Tech Supabase
        // Use conflict on (student_id, area, term, year) which is the proper unique key
        const { error: ctErr } = await supabaseCareerTech.from('career_tech_results').upsert(batch, { 
          onConflict: ['student_id', 'area', 'term', 'year'] 
        });
        if (ctErr) throw ctErr;
      }
    }
    
    // Process regular subjects (non-Career Tech submissions to results table)
    if (regularSubmissions.length > 0) {
      const conflictKey = ['student_id', 'subject', 'term', 'year'];
      for (let i = 0; i < regularSubmissions.length; i += BATCH_SIZE) {
        const batch = regularSubmissions.slice(i, i + BATCH_SIZE);
        if (loader) loader.update(Math.round(((i + batch.length) / (submissions.length || 1)) * 100));
        if (loader) await new Promise(r => setTimeout(r, 25));
        
        const { error } = await supabaseClient.from('results').upsert(batch, { onConflict: conflictKey });
        if (error) throw error;
      }
    }
    if (loader) loader.update(100);
    // Clear drafts after successful submit
    try { localStorage.removeItem(draftKey); } catch (e) {}
    notify('SBA scores submitted successfully.', 'info');
    // Reload students to refresh the displayed marks from database
    setTimeout(() => loadStudents('sba'), 500);
  } catch (err) {
    console.error('SBA upsert error:', err);
    notify('Failed to submit SBA scores: ' + (err.message || String(err)), 'error');
  } finally {
    try { if (loader) loader.close(); } catch (e) {}
    // Re-enable SBA UI
    setSubmissionLockFor('sba', false);
    if (submitSbaBtn) {
      submitSbaBtn.disabled = false;
      submitSbaBtn.textContent = submitSbaBtn.dataset.prevText || 'Submit SBA';
      delete submitSbaBtn.dataset.prevText;
    }
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

  // Load draft storage key and drafts upfront
  function getDraftKeyForSBA() {
    const classVal = document.getElementById('classSelect')?.value || '';
    const subject = document.getElementById('subjectSelect')?.value || '';
    const area = document.getElementById('careerTechAreaSelect')?.value || '';
    const { term, year } = getTermYear();
    // Include area in the draft key for Career Tech to separate marks by area
    return `drafts:sba:${classVal}:${subject}:${area}:${term}:${year}`;
  }
  function loadDraftsSBA() { try { return JSON.parse(localStorage.getItem(getDraftKeyForSBA()) || '{}'); } catch (e) { return {}; } }
  const sbaDrafts = loadDraftsSBA();

  students.forEach(student => {
    // Pre-fill all SBA components: prefer drafts -> DB components -> empty
    let individual = '', group = '', classTest = '', project = '', scaledPrefill = 0, totalPrefill = 0;
    
    // First, load from database (marksMap)
    const mm = marksMap[student.id];
    if (mm && typeof mm === 'object') {
      if (mm.individual !== null && mm.individual !== undefined) individual = mm.individual || '';
      if (mm.group !== null && mm.group !== undefined) group = mm.group || '';
      if (mm.class_test !== null && mm.class_test !== undefined) classTest = mm.class_test || '';
      if (mm.project !== null && mm.project !== undefined) project = mm.project || '';
    }
    
    // Then, override with drafts if they exist (drafts take precedence)
    const draft = sbaDrafts[student.id];
    if (draft && typeof draft === 'object') {
      if (draft.individual !== null && draft.individual !== undefined) individual = draft.individual || '';
      if (draft.group !== null && draft.group !== undefined) group = draft.group || '';
      if (draft.classTest !== null && draft.classTest !== undefined) classTest = draft.classTest || '';
      if (draft.project !== null && draft.project !== undefined) project = draft.project || '';
    }
    
    // Calculate total and scaled
    if (mm && mm.class_score !== null && mm.class_score !== undefined && !draft) {
      // If DB has class_score and no draft override, use it
      scaledPrefill = mm.class_score;
      totalPrefill = Math.round((scaledPrefill / 50) * 60);
    } else if (individual || group || classTest || project) {
      // Calculate from components
      const totalComputed = Math.min(individual + group + classTest + project, 60);
      totalPrefill = totalComputed;
      scaledPrefill = Math.round((totalComputed / 60) * 50);
    }
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.first_name || ''} ${student.surname || ''}</td>
  <td><input type="number" data-type="individual" data-id="${student.id}" max="15" min="0" value="${individual}" class="sba-component" placeholder="0-15" /></td>
  <td><input type="number" data-type="group" data-id="${student.id}" max="15" min="0" value="${group}" class="sba-component" placeholder="0-15" /></td>
  <td><input type="number" data-type="classTest" data-id="${student.id}" max="15" min="0" value="${classTest}" class="sba-component" placeholder="0-15" /></td>
  <td><input type="number" data-type="project" data-id="${student.id}" max="15" min="0" value="${project}" class="sba-component" placeholder="0-15" /></td>
      <td><span id="total-${student.id}">${totalPrefill}</span></td>
      <td><span id="scaled-${student.id}">${scaledPrefill}</span></td>
      <td style="display:flex;gap:6px"><button class="sba-save-btn" data-id="${student.id}" type="button">Save</button><button class="sba-edit-btn hidden" data-id="${student.id}" type="button">Edit</button></td>
    `;
    tbody.appendChild(row);
  });
  document.querySelectorAll('#sbaTableBody input.sba-component').forEach(input => {
    input.addEventListener('input', () => calculateSBAScore(input.dataset.id));
  });

  // If required selects (class/subject/term/year) are not set, disable inputs to prevent entry
  const requiredSet = (document.getElementById('classSelect')?.value && document.getElementById('subjectSelect')?.value && document.getElementById('termInput')?.value && document.getElementById('yearInput')?.value);
  if (!requiredSet) {
    setEntryLockFor('sba', true);
    // Show a gentle notice to the user
    const toolbar = document.getElementById('sbaToolbar');
    if (toolbar && !toolbar.querySelector('.sba-require-note')) {
      const note = document.createElement('div');
      note.className = 'sba-require-note';
      note.style.fontSize = '13px';
      note.style.color = '#664d03';
      note.style.margin = '8px 0';
      note.textContent = 'Select Class, Subject, Term and Year to enable SBA entry.';
      toolbar.appendChild(note);
    }
    } else {
    // ensure toolbar notice removed and enable entry inputs
    const note = document.querySelector('#sbaToolbar .sba-require-note'); if (note) note.remove();
    setEntryLockFor('sba', false);
  }

  // SBA draft storage and per-row save/edit wiring
  // ...existing code...
  document.querySelectorAll('#sbaTableBody .sba-save-btn').forEach(btn => {
    const id = btn.dataset.id;
    const editBtn = document.querySelector(`#sbaTableBody .sba-edit-btn[data-id="${id}"]`);
    // Show "Saved" if either drafts or database records exist
    const hasDraft = sbaDrafts && sbaDrafts[id];
    const hasDBRecord = marksMap[id];
    if (hasDraft || hasDBRecord) {
      btn.textContent = 'Saved'; 
      btn.disabled = true; 
      if (editBtn) editBtn.classList.remove('hidden');
    }
    btn.addEventListener('click', () => {
      // collect inputs for this student
      const individual = parseInt(document.querySelector(`#sbaTableBody input[data-id="${id}"][data-type="individual"]`).value) || 0;
      const group = parseInt(document.querySelector(`#sbaTableBody input[data-id="${id}"][data-type="group"]`).value) || 0;
      const classTest = parseInt(document.querySelector(`#sbaTableBody input[data-id="${id}"][data-type="classTest"]`).value) || 0;
      const project = parseInt(document.querySelector(`#sbaTableBody input[data-id="${id}"][data-type="project"]`).value) || 0;
      sbaDrafts[id] = { individual, group, classTest, project };
      saveDraftsSBA(sbaDrafts);
      btn.textContent = 'Saved'; btn.disabled = true; if (editBtn) editBtn.classList.remove('hidden');
    });
    if (editBtn) editBtn.addEventListener('click', () => {
      openEditMarksModal(id, 'sba');
    });
  });

  // SBA Save All
  const sbaToolbar = document.getElementById('sbaToolbar');
  if (sbaToolbar) {
    let sbaSaveAll = sbaToolbar.querySelector('.save-all-sba-btn');
    if (!sbaSaveAll) {
      sbaSaveAll = document.createElement('button'); sbaSaveAll.type = 'button'; sbaSaveAll.className = 'save-all-sba-btn'; sbaSaveAll.textContent = 'Save All (Draft)'; sbaToolbar.appendChild(sbaSaveAll);
    }
    sbaSaveAll.onclick = () => {
      const rows = document.querySelectorAll('#sbaTableBody tr');
      rows.forEach(row => {
        const id = row.querySelector('input.sba-component')?.dataset.id;
        if (!id) return;
        const individual = parseInt(row.querySelector(`input[data-id="${id}"][data-type="individual"]`).value) || 0;
        const group = parseInt(row.querySelector(`input[data-id="${id}"][data-type="group"]`).value) || 0;
        const classTest = parseInt(row.querySelector(`input[data-id="${id}"][data-type="classTest"]`).value) || 0;
        const project = parseInt(row.querySelector(`input[data-id="${id}"][data-type="project"]`).value) || 0;
        sbaDrafts[id] = { individual, group, classTest, project };
      });
      const draftKey = getDraftKeyForSBA();
      saveDrafts(draftKey, sbaDrafts);
      notify('All SBA marks saved locally as draft.', 'info');
      document.querySelectorAll('#sbaTableBody .sba-save-btn').forEach(b => { b.textContent = 'Saved'; b.disabled = true; const eb = document.querySelector(`#sbaTableBody .sba-edit-btn[data-id="${b.dataset.id}"]`); if (eb) eb.classList.remove('hidden'); });
    };
  }
}

// ✅ Submit Exam scores
async function submitExams() {
  const subject = document.getElementById('subjectSelectExam').value;
  const term = document.getElementById('termInputExam').value;
  const year = document.getElementById('yearInputExam').value;
  if (!subject || !term || !year) {
      notify('Please select class, subject, term, and year.', 'warning');
    return;
  }
    const classVal = document.getElementById('classSelectExam').value;
  // Capture Career Tech area if present
  const areaVal = document.getElementById('careerTechAreaSelectExam')?.value || null;
  // For Career Tech, area must be selected
  if (subject === 'Career Tech' && !areaVal) {
    notify('Please select a Career Tech area.', 'warning');
    return;
  }
  // Include area in draft key for Career Tech separation
  const draftKey = `drafts:exam:${classVal}:${subject}:${areaVal || ''}:${term}:${year}`;
  let drafts = {};
  try { drafts = JSON.parse(localStorage.getItem(draftKey) || '{}'); } catch (e) { drafts = {}; }
  const submissions = [];
  // Disable the exam submit button and show loader immediately
  const submitExamBtn = document.querySelector('button[onclick="submitExams()"]');
  if (submitExamBtn) {
    submitExamBtn.disabled = true;
    submitExamBtn.dataset.prevText = submitExamBtn.textContent;
    submitExamBtn.textContent = 'Submitting...';
  }
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Submitting exam marks...', {indeterminate: false}) : null;
  // Lock the exam UI while uploading
  setSubmissionLockFor('exam', true);

  if (drafts && Object.keys(drafts).length > 0) {
    for (const student of students) {
      if (drafts[student.id] === undefined) continue;
      // Scale draft exam score from 0-100 to 0-50 for database storage
      const scaledExamScore = Math.round((drafts[student.id] / 100) * 50);
      const rec = { student_id: student.id, subject, term, year, exam_score: scaledExamScore, class_score: 0 };
      if (subject === 'Career Tech' && areaVal) rec.area = areaVal;
      submissions.push(rec);
    }
  } else {
    for (const student of students) {
        // Read raw exam input value (0-100), treat empty as 0
        const examInput = document.querySelector(`#examTableBody input[data-type="exam"][data-id="${student.id}"]`);
        const examRaw = examInput ? (parseInt(examInput.value, 10) || 0) : 0;
        if (isNaN(examRaw) || examRaw < 0 || examRaw > 100) {
          notify(`Invalid exam score for ${student.first_name || ''} ${student.surname || ''}. Must be between 0 and 100.`, 'warning');
          continue;
        }
        // Scaled preview
        const scaled = Math.round((examRaw / 100) * 50);
        // Fetch existing SBA component/class_score if present
        let class_score = 0, individual = 0, groupVal = 0, class_test = 0, project = 0;
        try {
          const { data: existing } = await supabaseClient
            .from('results')
            .select('class_score, individual, "group", class_test, project')
            .eq('student_id', student.id)
            .eq('subject', subject)
            .eq('term', term)
            .eq('year', year)
            .single();
          if (existing) {
            if (typeof existing.class_score === 'number') class_score = existing.class_score;
            if (typeof existing.individual === 'number') individual = existing.individual;
            if (typeof existing["group"] === 'number') groupVal = existing["group"];
            if (typeof existing.class_test === 'number') class_test = existing.class_test;
            if (typeof existing.project === 'number') project = existing.project;
          }
        } catch (e) {}
        const rec = { student_id: student.id, subject, term, year, class_score, exam_score: scaled, individual: Number(individual||0), "group": Number(groupVal||0), class_test: Number(class_test||0), project: Number(project||0) };
        if (subject === 'Career Tech' && areaVal) rec.area = areaVal;
        submissions.push(rec);
    }
  }
  if (submissions.length === 0) {
    notify('No valid exam scores to submit.', 'warning');
    return;
  }
  if (submissions.length === 0) { notify('No valid exam scores to submit.', 'warning'); return; }
  // loader already created earlier to show immediate feedback
  try {
    const includeArea = submissions.some(s => s.area);
    // Separate Career Tech (with area) from regular submissions
    const careerTechSubmissions = submissions.filter(s => s.area).map(s => {
      // Remove 'subject' field from Career Tech records (they use 'area' instead)
      const { subject, ...rest } = s;
      return rest;
    });
    const regularSubmissions = submissions.filter(s => !s.area); // All other subjects
    
    // Batch upserts to reduce number of requests and provide smooth progress updates
    const BATCH_SIZE = 20;
    
    // Process Career Tech submissions (use career_tech_results table in Career Tech Supabase)
    if (careerTechSubmissions.length > 0) {
      for (let i = 0; i < careerTechSubmissions.length; i += BATCH_SIZE) {
        const batch = careerTechSubmissions.slice(i, i + BATCH_SIZE);
        if (loader) loader.update(Math.round(((i + batch.length) / (submissions.length || 1)) * 100));
        if (loader) await new Promise(r => setTimeout(r, 25));
        
        // For Career Tech: upsert to career_tech_results table in Career Tech Supabase
        // Use conflict on (student_id, area, term, year) which is the proper unique key
        const { error: ctErr } = await supabaseCareerTech.from('career_tech_results').upsert(batch, { 
          onConflict: ['student_id', 'area', 'term', 'year'] 
        });
        if (ctErr) throw ctErr;
      }
    }
    
    // Process regular subjects (non-Career Tech submissions to results table)
    if (regularSubmissions.length > 0) {
      const conflictKey = ['student_id', 'subject', 'term', 'year'];
      for (let i = 0; i < regularSubmissions.length; i += BATCH_SIZE) {
        const batch = regularSubmissions.slice(i, i + BATCH_SIZE);
        if (loader) loader.update(Math.round(((i + batch.length) / (submissions.length || 1)) * 100));
        if (loader) await new Promise(r => setTimeout(r, 25));
        
        const { error } = await supabaseClient.from('results').upsert(batch, { onConflict: conflictKey });
        if (error) throw error;
      }
    }
    if (loader) loader.update(100);
    // Clear drafts after successful submit
    try { localStorage.removeItem(draftKey); } catch (e) {}
    notify('Exam scores submitted successfully.', 'info');
    document.getElementById('examTableBody').innerHTML = '';
    loadStudents('exam');
  } catch (err) {
    console.error('Exam upsert error:', err);
    notify('Failed to submit exam scores: ' + (err.message || String(err)), 'error');
  } finally {
    try { if (loader) loader.close(); } catch (e) {}
    // unlock exam UI
    setSubmissionLockFor('exam', false);
    if (submitExamBtn) {
      submitExamBtn.disabled = false;
      submitExamBtn.textContent = submitExamBtn.dataset.prevText || 'Submit Exams';
      delete submitExamBtn.dataset.prevText;
    }
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
    notify('Please fill in all required fields.', 'warning');
    return;
  }

  // Prevent sending assignment to class/subject not assigned to teacher
  const isAssigned = teacher.assignments && teacher.assignments.some(a => a.class === className && a.subject === subject);
  if (!isAssigned) {
    notify('You are not assigned to this class and subject. You cannot compose an assignment for it.', 'warning');
    return;
  }

  // Show loader for file upload / assignment creation
  let loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Sending assignment...') : null;
  let fileUrl = null;
  try {
    if (file) {
      try {
        if (loader) loader.update(5);
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const filePath = `teacher/${Date.now()}_${safeFileName}`;
        const { data, error } = await supabaseClient.storage.from('assignments').upload(filePath, file);
        console.debug('Upload response:', data, error);
        if (error) throw error;
        if (loader) loader.update(50);

        const uploadedPath = data && (data.path || data.Key || data.id) ? (data.path || data.Key || data.id) : (typeof data === 'string' ? data : null);
        if (!uploadedPath) throw new Error('No storage path returned from upload');

        const publicUrlResult = supabaseClient.storage.from('assignments').getPublicUrl(uploadedPath);
        try { if (loader) loader.update(80); } catch (e) {}
        fileUrl = publicUrlResult && publicUrlResult.data && publicUrlResult.data.publicUrl ? publicUrlResult.data.publicUrl : null;
        if (!fileUrl) throw new Error('Could not generate public URL for uploaded file');
      } catch (e) {
        console.error('Assignment upload failed:', e);
        notify('File upload failed: ' + (e.message || String(e)), 'error');
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
      file_url: fileUrl || null,
      created_at: new Date().toISOString()
    };

    if (loader) try { loader.update(90); } catch (e) {}
    const { error } = await supabaseClient.from('assignments').insert([payload]);
    if (error) {
      notify('Assignment submission failed: ' + (error.message || String(error)), 'error');
      return;
    }

    if (loader) try { loader.update(100); } catch (e) {}
    notify('Assignment sent successfully.', 'info');
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
  } finally {
    try { if (loader) loader.close(); } catch (e) {}
  }
}

// 📬 Load student submissions for assignments sent by this teacher
async function loadStudentSubmissions() {
  const tbody = document.getElementById('studentSubmissionTableBody');
  console.debug('DEBUG: loadStudentSubmissions called. Teacher:', teacher);
  if (!tbody) return;
  tbody.innerHTML = '';
  const { data: assignments, error: aErr } = await supabaseClient
    .from('assignments')
    .select('id, title, class')
    .eq('teacher_id', teacher.id);
  console.debug('DEBUG: Assignments query result:', assignments, aErr);
  if (aErr || !Array.isArray(assignments) || assignments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No student submissions yet.</td></tr>';
    return;
  }
  const assignmentIds = assignments.map(a => a.id);
  console.debug('DEBUG: Teacher assignments IDs:', assignmentIds);
  if (assignmentIds.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No student submissions yet.</td></tr>';
    return;
  }
  const { data: submissions, error: sErr } = await supabaseClient
    .from('student_submissions')
  .select('id, student_id, assignment_id, file_url, submitted_at, students(first_name, surname), assignments(title)')
    .in('assignment_id', assignmentIds);
  console.debug('DEBUG: Submissions fetched for these assignment IDs:', submissions, sErr);
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

// Load assignments for teacher page (safe noop if elements not present)
async function loadAssignments() {
  try {
    if (!teacher || !teacher.id) return;
    const { data, error } = await supabaseClient
      .from('assignments')
      .select('id, title, subject, term, year, file_url, instructions, class, created_at')
      .eq('teacher_id', teacher.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.debug('loadAssignments (teacher) query error:', error);
      return;
    }
    // If this page contains an inbox-like table for assignments, populate it
    const teacherTbl = document.getElementById('teacherAssignmentsTableBody') || document.getElementById('assignmentTableBody');
    if (teacherTbl) {
      teacherTbl.innerHTML = '';
      if (!Array.isArray(data) || data.length === 0) {
        teacherTbl.innerHTML = '<tr><td colspan="7">No assignments found.</td></tr>';
      } else {
        data.forEach(item => {
          const row = document.createElement('tr');
          const fileCell = item.file_url ? `<a href="${item.file_url}" target="_blank">Download</a>` : 'No file';
          row.innerHTML = `
            <td>${item.class || ''}</td>
            <td>${item.subject || ''}</td>
            <td>${item.title || ''}</td>
            <td>${item.term || ''}</td>
            <td>${item.year || ''}</td>
            <td>${item.instructions || ''}</td>
            <td>${fileCell}</td>
          `;
          teacherTbl.appendChild(row);
        });
      }
    }
    // If there's a select element (student page compatibility), populate it too
    const sel = document.getElementById('assignmentSelect');
    if (sel) {
      sel.innerHTML = '<option value="">-- Select Assignment --</option>';
      if (Array.isArray(data)) {
        data.forEach(item => {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = `${item.subject} - ${item.title}`;
          sel.appendChild(opt);
        });
      }
    }
    return data;
  } catch (err) {
    console.debug('loadAssignments (teacher) exception:', err);
  }
}

// Expose for other scripts (compatibility)
window.loadAssignments = loadAssignments;

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
    const { data, error: err } = await supabaseClient.from('students').select('first_name, surname, class, gender, dob, parent_name, parent_contact, nhis_number, register_id').eq('class', selectedClass);
    studentsData = data || [];
    error = err;
  } else {
    // Fetch students for all assigned classes
    const { data, error: err } = await supabaseClient.from('students').select('first_name, surname, class, gender, dob, parent_name, parent_contact, nhis_number, register_id').in('class', teacher.classes);
    studentsData = data || [];
    error = err;
  }
  // Sort students by register_id (roll number)
  studentsData = studentsData.slice().sort((a, b) => {
    if (!a.register_id || !b.register_id) return 0;
    const [ac, an] = a.register_id.split('_');
    const [bc, bn] = b.register_id.split('_');
    if (ac === bc) return parseInt(an, 10) - parseInt(bn, 10);
    return ac.localeCompare(bc);
  });
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
      <td>${student.register_id || ''}</td>
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
        notify('Teacher session not found.', 'error');
        return;
      }
      // Fetch teacher record to verify current PIN
      const { data, error } = await supabaseClient.from('teachers').select('pin').eq('id', teacher.id).single();
      if (error || !data) {
        notify('Failed to verify current PIN.', 'error');
        return;
      }
      if (data.pin !== currentPin) {
        notify('Current PIN is incorrect.', 'warning');
        return;
      }
      // Update PIN
      const { error: updateError } = await supabaseClient.from('teachers').update({ pin: newPin }).eq('id', teacher.id);
      if (updateError) {
        notify('Failed to update PIN.', 'error');
        return;
      }
      notify('PIN changed successfully!', 'info');
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

// --- Edit Marks Modal Logic ---
function openEditMarksModal(studentId, section) {
  try {
    const modal = document.getElementById('editMarksModal');
    const studentNameEl = document.getElementById('editMarksStudentName');
    const titleEl = document.getElementById('editMarksTitle');
    const sidEl = document.getElementById('editMarksStudentId');
    const sectionEl = document.getElementById('editMarksSection');
    const sbaFields = document.getElementById('editMarksSBAFields');
    const examFields = document.getElementById('editMarksExamFields');
    // set context
    sidEl.value = studentId;
    sectionEl.value = section;
    const student = students.find(s => s.id === studentId) || { first_name: '', surname: '' };
    studentNameEl.textContent = `${student.first_name || ''} ${student.surname || ''}`.trim();
    // Clear fields
    document.getElementById('edit_individual').value = '';
    document.getElementById('edit_group').value = '';
    document.getElementById('edit_classTest').value = '';
    document.getElementById('edit_project').value = '';
    document.getElementById('edit_total').textContent = '0';
    document.getElementById('edit_scaled').textContent = '0';
    document.getElementById('edit_examScore').value = '';
    document.getElementById('edit_examScaled').textContent = '0';

    // Determine current selected subject/term/year based on section
    let subject = '';
    let term = '';
    let year = '';
    if (section === 'sba') {
      subject = document.getElementById('subjectSelect')?.value || '';
      ({ term, year } = getTermYear());
    } else {
      subject = document.getElementById('subjectSelectExam')?.value || '';
      term = document.getElementById('termInputExam')?.value || '';
      year = document.getElementById('yearInputExam')?.value || '';
    }

    // Try to populate from local drafts first
    if (section === 'sba') {
      const dk = `drafts:sba:${document.getElementById('classSelect')?.value || ''}:${subject}:${term}:${year}`;
      let drafts = {};
      try { drafts = JSON.parse(localStorage.getItem(dk) || '{}'); } catch (e) { drafts = {}; }
      if (drafts && drafts[studentId]) {
        const d = drafts[studentId];
        document.getElementById('edit_individual').value = d.individual || 0;
        document.getElementById('edit_group').value = d.group || 0;
        document.getElementById('edit_classTest').value = d.classTest || 0;
        document.getElementById('edit_project').value = d.project || 0;
        const total = Math.min((d.individual||0)+(d.group||0)+(d.classTest||0)+(d.project||0), 60);
        document.getElementById('edit_total').textContent = total;
        document.getElementById('edit_scaled').textContent = Math.round((total/60)*50);
      } else if (subject && term && year) {
        // Load class_score and component breakdown from DB
        supabaseClient.from('results').select('class_score, individual, "group", class_test, project').eq('student_id', studentId).eq('subject', subject).eq('term', term).eq('year', year).single().then(({ data, error }) => {
          if (!error && data) {
            if (typeof data.class_score === 'number') {
              document.getElementById('edit_scaled').textContent = data.class_score;
              document.getElementById('edit_total').textContent = Math.round((data.class_score/50)*60);
            }
            document.getElementById('edit_individual').value = data.individual || 0;
            document.getElementById('edit_group').value = data["group"] || 0;
            document.getElementById('edit_classTest').value = data.class_test || 0;
            document.getElementById('edit_project').value = data.project || 0;
          }
        }).catch(e => { /* ignore */ });
      }
      sbaFields.style.display = 'block';
      examFields.style.display = 'none';
      titleEl.textContent = 'Edit SBA Marks';
    } else {
      const dk = `drafts:exam:${document.getElementById('classSelectExam')?.value || ''}:${subject}:${term}:${year}`;
      let drafts = {};
      try { drafts = JSON.parse(localStorage.getItem(dk) || '{}'); } catch (e) { drafts = {}; }
      if (drafts && drafts[studentId] !== undefined) {
        document.getElementById('edit_examScore').value = drafts[studentId];
        document.getElementById('edit_examScaled').textContent = Math.round((drafts[studentId]/100)*50);
      } else if (subject && term && year) {
        supabaseClient.from('results').select('exam_score').eq('student_id', studentId).eq('subject', subject).eq('term', term).eq('year', year).single().then(({ data, error }) => {
          if (!error && data && typeof data.exam_score === 'number') {
            // exam_score is now stored as 0-50, convert back to 0-100 for display
            const originalScore = Math.round((data.exam_score / 50) * 100);
            document.getElementById('edit_examScore').value = originalScore;
            document.getElementById('edit_examScaled').textContent = data.exam_score;
          }
        }).catch(e => { /* ignore */ });
      }
      sbaFields.style.display = 'none';
      examFields.style.display = 'block';
      titleEl.textContent = 'Edit Exam Marks';
    }

    // Wire input previews
    ['edit_individual','edit_group','edit_classTest','edit_project'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => {
        const a = Math.min(parseInt(document.getElementById('edit_individual').value) || 0,15);
        const b = Math.min(parseInt(document.getElementById('edit_group').value) || 0,15);
        const c = Math.min(parseInt(document.getElementById('edit_classTest').value) || 0,15);
        const d = Math.min(parseInt(document.getElementById('edit_project').value) || 0,15);
        const total = Math.min(a+b+c+d,60);
        document.getElementById('edit_total').textContent = total;
        document.getElementById('edit_scaled').textContent = Math.round((total/60)*50);
      };
    });
    const examInp = document.getElementById('edit_examScore');
    if (examInp) examInp.oninput = () => { const v = Math.min(Math.max(parseInt(examInp.value) || 0,0),100); document.getElementById('edit_examScaled').textContent = Math.round((v/100)*50); };

    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'block';
    modal.setAttribute('aria-hidden', 'false');
  } catch (e) {
    console.debug('openEditMarksModal error', e);
  }
}

function closeEditMarksModal() {
  const modal = document.getElementById('editMarksModal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
}

// Save handler for edit modal
document.addEventListener('DOMContentLoaded', () => {
  const saveBtn = document.getElementById('editMarksSaveBtn');
  const cancelBtn = document.getElementById('editMarksCancelBtn');
  const closeX = document.getElementById('editMarksClose');
  if (cancelBtn) cancelBtn.addEventListener('click', closeEditMarksModal);
  if (closeX) closeX.addEventListener('click', closeEditMarksModal);
  if (saveBtn) saveBtn.addEventListener('click', async () => {
    const studentId = document.getElementById('editMarksStudentId').value;
    const section = document.getElementById('editMarksSection').value;
    // determine subject/term/year
    let subject=''; let term=''; let year=''; let classVal='';
    if (section === 'sba') { subject = document.getElementById('subjectSelect')?.value || ''; ({ term, year } = getTermYear()); classVal = document.getElementById('classSelect')?.value || ''; }
    else { subject = document.getElementById('subjectSelectExam')?.value || ''; term = document.getElementById('termInputExam')?.value || ''; year = document.getElementById('yearInputExam')?.value || ''; classVal = document.getElementById('classSelectExam')?.value || ''; }
    if (!subject || !term || !year) { notify('Please ensure class, subject, term and year are selected before saving edits.', 'warning'); return; }
    let _lastPayload = null;
    try {
      if (section === 'sba') {
        const individual = Math.min(parseInt(document.getElementById('edit_individual').value) || 0, 15);
        const group = Math.min(parseInt(document.getElementById('edit_group').value) || 0, 15);
        const classTest = Math.min(parseInt(document.getElementById('edit_classTest').value) || 0, 15);
        const project = Math.min(parseInt(document.getElementById('edit_project').value) || 0, 15);
        const total = Math.min(individual+group+classTest+project, 60);
        const scaled = Math.round((total/60)*50);
        // Upsert scaled class_score into results, preserve exam_score if exists by fetching
        const { data: existing } = await supabaseClient.from('results').select('exam_score').eq('student_id', studentId).eq('subject', subject).eq('term', term).eq('year', year).single();
        // Ensure exam_score is present (DB has NOT NULL constraint) - default to 0 when missing
        const payload = { student_id: studentId, subject, term, year, class_score: scaled };
        payload.exam_score = (existing && typeof existing.exam_score === 'number') ? existing.exam_score : 0;
        // Include component breakdown so it is persisted in DB
        payload.individual = Number(individual || 0);
        payload["group"] = Number(group || 0);
        payload.class_test = Number(classTest || 0);
        payload.project = Number(project || 0);
        _lastPayload = payload;
        console.debug('Upserting SBA payload:', payload);
        const { error } = await supabaseClient.from('results').upsert([payload], { onConflict: ['student_id','subject','term','year'] });
        if (error) throw error;
        // Update local drafts to reflect saved value (remove draft entry because saved to DB)
        const dk = `drafts:sba:${classVal}:${subject}:${term}:${year}`;
        try { const drafts = JSON.parse(localStorage.getItem(dk) || '{}'); delete drafts[studentId]; localStorage.setItem(dk, JSON.stringify(drafts)); } catch(e){}
        notify('SBA marks updated.', 'info');
      } else {
    const examScore = Math.min(Math.max(parseInt(document.getElementById('edit_examScore').value) || 0, 0), 100);
    // Scale exam score from 0-100 to 0-50 for database storage
    const scaledExamScore = Math.round((examScore / 100) * 50);
    // Fetch existing class_score and component breakdown to preserve them
    const { data: existing } = await supabaseClient.from('results').select('class_score, individual, "group", class_test, project').eq('student_id', studentId).eq('subject', subject).eq('term', term).eq('year', year).single();
    // Ensure class_score is present to satisfy NOT NULL constraints if any - default to 0 when missing
    const payload = { student_id: studentId, subject, term, year, exam_score: scaledExamScore };
    payload.class_score = (existing && typeof existing.class_score === 'number') ? existing.class_score : 0;
    // Preserve component breakdown if present
    payload.individual = (existing && typeof existing.individual === 'number') ? existing.individual : 0;
    payload["group"] = (existing && typeof existing["group"] === 'number') ? existing["group"] : 0;
    payload.class_test = (existing && typeof existing.class_test === 'number') ? existing.class_test : 0;
    payload.project = (existing && typeof existing.project === 'number') ? existing.project : 0;
    _lastPayload = payload;
    console.debug('Upserting Exam payload:', payload);
    const { error } = await supabaseClient.from('results').upsert([payload], { onConflict: ['student_id','subject','term','year'] });
    if (error) throw error;
        // Update drafts key if present (remove saved draft)
        const dk = `drafts:exam:${classVal}:${subject}:${term}:${year}`;
        try { const drafts = JSON.parse(localStorage.getItem(dk) || '{}'); delete drafts[studentId]; localStorage.setItem(dk, JSON.stringify(drafts)); } catch(e){}
        notify('Exam marks updated.', 'info');
      }
      // Refresh current table row UI if present
      await loadStudents(section === 'sba' ? 'sba' : 'exam');
      closeEditMarksModal();
    } catch (err) {
      // Provide richer debug info to help diagnose DB upsert errors
      try {
        console.error('Failed to save edited marks:', err, { section, studentId, subject, term, year, payload: _lastPayload });
      } catch (e) { console.error('Failed to save edited marks (secondary):', err); }
      // If Supabase error object contains .message or .details, surface them
      let msg = 'Failed to save marks.';
      if (err && err.message) msg = err.message;
      else if (err && err.error_description) msg = err.error_description;
      notify('Failed to save marks: ' + msg, 'error');
    }
  });
  // allow closing modal by Escape or clicking outside
  const modal = document.getElementById('editMarksModal');
  window.addEventListener('click', (ev) => { if (ev.target === modal) closeEditMarksModal(); });
  window.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeEditMarksModal(); });
});

// ---------------- CSV Export / Import for SBA and Exams ----------------
// Simple CSV generator and parser (handles quoted fields)
function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return rows;
  const header = splitCSVLine(lines[0]).map(h => h.trim());
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !line.trim()) continue;
    const cols = splitCSVLine(line);
    const obj = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = cols[j] !== undefined ? cols[j] : '';
    }
    rows.push(obj);
  }
  return rows;
}

function splitCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i+1] === '"') { cur += '"'; i++; } else { inQuotes = !inQuotes; }
      continue;
    }
    if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

// Export SBA marks to CSV
async function exportSBAToCSV() {
  const classVal = document.getElementById('classSelect')?.value;
  const subject = document.getElementById('subjectSelect')?.value;
  const { term, year } = getTermYear();
  if (!classVal || !subject || !term || !year) {
    notify('Please select class, subject, term and year to export SBA marks.', 'warning');
    return;
  }
  const isCareerTech = subject === 'Career Tech';
  const area = isCareerTech ? (document.getElementById('careerTechAreaSelect')?.value || null) : null;
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Preparing SBA CSV...') : null;
  try {
    if (loader) loader.update(10);
    const { data: studentsData, error: studentsErr } = await supabaseClient.from('students').select('id, first_name, surname, register_id').eq('class', classVal);
    if (studentsErr) throw studentsErr;
    const studentIds = (studentsData || []).map(s => s.id);
    if (loader) loader.update(30);
    // Use appropriate client: Career Tech Supabase for Career Tech, main Supabase for others
    const client = isCareerTech ? supabaseCareerTech : supabaseClient;
    const tableName = isCareerTech ? 'career_tech_results' : 'results';
    let resultsData, resultsErr;
    if (isCareerTech) {
      const result = await client.from(tableName).select('student_id, individual, "group", class_test, project, class_score, exam_score, area').in('student_id', studentIds).eq('term', term).eq('year', year);
      resultsData = result.data;
      resultsErr = result.error;
    } else {
      const result = await client.from(tableName).select('student_id, individual, "group", class_test, project, class_score, exam_score, area').in('student_id', studentIds).eq('subject', subject).eq('term', term).eq('year', year);
      resultsData = result.data;
      resultsErr = result.error;
    }
    if (resultsErr) throw resultsErr;
    const resultsMap = {};
    (resultsData || []).forEach(r => { resultsMap[r.student_id] = r; });
    if (loader) loader.update(70);
    const header = ['register_id','student_id','first_name','surname','individual','group','class_test','project','class_score','exam_score','area'];
    const lines = [header.join(',')];
    (studentsData || []).forEach(s => {
      const r = resultsMap[s.id] || {};
      const cols = [s.register_id || '', s.id || '', s.first_name || '', s.surname || '', r.individual || 0, r['group'] || 0, r.class_test || 0, r.project || 0, r.class_score || 0, r.exam_score || 0, r.area || ''];
      const row = cols.map(c => (typeof c === 'string' && c.includes(',')) ? '"' + c.replace(/"/g,'""') + '"' : c).join(',');
      lines.push(row);
    });
    const csv = lines.join('\n');
    downloadCSV(`${classVal}_${subject}_SBA_${term}_${year}.csv`, csv);
    if (loader) loader.update(100);
  } catch (err) {
    console.error('exportSBAToCSV error', err);
    notify('Failed to export SBA CSV: ' + (err.message || String(err)), 'error');
  } finally { try { if (loader) loader.close(); } catch(e) {} }
}

// Export Exam marks to CSV
async function exportExamsToCSV() {
  const classVal = document.getElementById('classSelectExam')?.value;
  const subject = document.getElementById('subjectSelectExam')?.value;
  const term = document.getElementById('termInputExam')?.value;
  const year = document.getElementById('yearInputExam')?.value;
  if (!classVal || !subject || !term || !year) { notify('Please select class, subject, term and year to export exam marks.', 'warning'); return; }
  const isCareerTech = subject === 'Career Tech';
  const area = isCareerTech ? (document.getElementById('careerTechAreaSelectExam')?.value || null) : null;
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Preparing Exam CSV...') : null;
  try {
    if (loader) loader.update(10);
    const { data: studentsData, error: studentsErr } = await supabaseClient.from('students').select('id, first_name, surname, register_id').eq('class', classVal);
    if (studentsErr) throw studentsErr;
    const studentIds = (studentsData || []).map(s => s.id);
    if (loader) loader.update(30);
    // Use appropriate client: Career Tech Supabase for Career Tech, main Supabase for others
    const client = isCareerTech ? supabaseCareerTech : supabaseClient;
    const tableName = isCareerTech ? 'career_tech_results' : 'results';
    let resultsData, resultsErr;
    if (isCareerTech) {
      const result = await client.from(tableName).select('student_id, exam_score, area').in('student_id', studentIds).eq('term', term).eq('year', year);
      resultsData = result.data;
      resultsErr = result.error;
    } else {
      const result = await client.from(tableName).select('student_id, exam_score, area').in('student_id', studentIds).eq('subject', subject).eq('term', term).eq('year', year);
      resultsData = result.data;
      resultsErr = result.error;
    }
    if (resultsErr) throw resultsErr;
    const resultsMap = {};
    (resultsData || []).forEach(r => { resultsMap[r.student_id] = r; });
    if (loader) loader.update(70);
    const header = ['register_id','student_id','first_name','surname','exam_score','area'];
    const lines = [header.join(',')];
    (studentsData || []).forEach(s => {
      const r = resultsMap[s.id] || {};
      const cols = [s.register_id || '', s.id || '', s.first_name || '', s.surname || '', r.exam_score || 0, r.area || ''];
      const row = cols.map(c => (typeof c === 'string' && c.includes(',')) ? '"' + c.replace(/"/g,'""') + '"' : c).join(',');
      lines.push(row);
    });
    const csv = lines.join('\n');
    downloadCSV(`${classVal}_${subject}_Exams_${term}_${year}.csv`, csv);
    if (loader) loader.update(100);
  } catch (err) {
    console.error('exportExamsToCSV error', err);
    notify('Failed to export Exam CSV: ' + (err.message || String(err)), 'error');
  } finally { try { if (loader) loader.close(); } catch(e) {} }
}

// Import SBA CSV (file object)
async function importSBAFromFile(file) {
  if (!file) return notify('No file selected.', 'warning');
  const classVal = document.getElementById('classSelect')?.value;
  const subject = document.getElementById('subjectSelect')?.value;
  const { term, year } = getTermYear();
  if (!classVal || !subject || !term || !year) {
    notify('Please select class, subject, term and year before importing.', 'warning');
    return;
  }
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Importing SBA CSV...') : null;
  try {
    if (loader) loader.update(5);
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows || rows.length === 0) { notify('CSV contains no rows.', 'warning'); return; }
    if (loader) loader.update(20);
    const { data: studentsData } = await supabaseClient.from('students').select('id, register_id, first_name, surname').eq('class', classVal);
    const byId = {};
    const byReg = {};
    (studentsData || []).forEach(s => { byId[s.id] = s; if (s.register_id) byReg[String(s.register_id).trim()] = s; });
    const payloads = [];
    const errors = [];
    rows.forEach((r, idx) => {
      const studentIdCol = r['student_id'] || r['id'] || r['studentId'] || '';
      const regCol = r['register_id'] || r['reg'] || r['register'] || '';
      let student = null;
      if (studentIdCol && byId[studentIdCol]) student = byId[studentIdCol];
      else if (regCol && byReg[String(regCol).trim()]) student = byReg[String(regCol).trim()];
      if (!student) { errors.push(`Row ${idx+2}: student not found (student_id/register_id missing or mismatched)`); return; }
      
      // Handle area for Career Tech
      let importArea = null;
      if (subject === 'Career Tech') {
        const areaCol = r['area'] || r['Area'] || r['AREA'] || '';
        if (!areaCol) { errors.push(`Row ${idx+2}: Career Tech requires area field but it's missing or empty`); return; }
        importArea = String(areaCol).trim();
      }
      
      const getVal = keys => { for (const k of keys) { if (r[k] !== undefined && r[k] !== '') return r[k]; } return ''; };
      const individual = Number(getVal(['individual','ind','i'])) || 0;
      const groupVal = Number(getVal(['group','grp','g'])) || 0;
      const class_test = Number(getVal(['class_test','class test','ct'])) || 0;
      const project = Number(getVal(['project','proj','p'])) || 0;
      const total = Math.min(individual + groupVal + class_test + project, 60);
      const class_score = Math.round((total / 60) * 50);
      payloads.push({ student_id: student.id, subject, term, year, class_score, exam_score: 0, individual, "group": groupVal, class_test, project, area: importArea });
    });
    if (errors.length) { notify('Import completed with some errors; check console for details.', 'warning'); console.warn('SBA import errors:', errors); }
    if (payloads.length === 0) { notify('No valid rows to import.', 'warning'); return; }
    if (loader) loader.update(60);
    // Separate Career Tech from regular subjects
    const careerTechPayloads = payloads.filter(p => p.subject === 'Career Tech').map(p => {
      const { subject, ...rest } = p;
      return rest;
    });
    const regularPayloads = payloads.filter(p => p.subject !== 'Career Tech');
    // Upsert to appropriate tables
    if (careerTechPayloads.length > 0) {
      const { error: ctErr } = await supabaseCareerTech.from('career_tech_results').upsert(careerTechPayloads, { onConflict: ['student_id','area','term','year'] });
      if (ctErr) throw ctErr;
    }
    if (regularPayloads.length > 0) {
      const { error: regErr } = await supabaseClient.from('results').upsert(regularPayloads, { onConflict: ['student_id','subject','term','year'] });
      if (regErr) throw regErr;
    }
    if (loader) loader.update(100);
    notify(`Imported ${payloads.length} SBA rows.`, 'info');
    await loadStudents('sba');
  } catch (err) {
    console.error('importSBAFromFile error', err);
    notify('Failed to import SBA CSV: ' + (err.message || String(err)), 'error');
  } finally { try { if (loader) loader.close(); } catch(e) {} }
}

// Import Exams CSV
async function importExamsFromFile(file) {
  if (!file) return notify('No file selected.', 'warning');
  const classVal = document.getElementById('classSelectExam')?.value;
  const subject = document.getElementById('subjectSelectExam')?.value;
  const term = document.getElementById('termInputExam')?.value;
  const year = document.getElementById('yearInputExam')?.value;
  if (!classVal || !subject || !term || !year) { notify('Please select class, subject, term and year before importing.', 'warning'); return; }
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Importing Exam CSV...') : null;
  try {
    if (loader) loader.update(5);
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows || rows.length === 0) { notify('CSV contains no rows.', 'warning'); return; }
    if (loader) loader.update(20);
    const { data: studentsData } = await supabaseClient.from('students').select('id, register_id, first_name, surname').eq('class', classVal);
    const byId = {};
    const byReg = {};
    (studentsData || []).forEach(s => { byId[s.id] = s; if (s.register_id) byReg[String(s.register_id).trim()] = s; });
    const payloads = [];
    const errors = [];
    rows.forEach((r, idx) => {
      const studentIdCol = r['student_id'] || r['id'] || r['studentId'] || '';
      const regCol = r['register_id'] || r['reg'] || r['register'] || '';
      let student = null;
      if (studentIdCol && byId[studentIdCol]) student = byId[studentIdCol];
      else if (regCol && byReg[String(regCol).trim()]) student = byReg[String(regCol).trim()];
      if (!student) { errors.push(`Row ${idx+2}: student not found (student_id/register_id missing or mismatched)`); return; }
      
      // Handle area for Career Tech
      let importArea = null;
      if (subject === 'Career Tech') {
        const areaCol = r['area'] || r['Area'] || r['AREA'] || '';
        if (!areaCol) { errors.push(`Row ${idx+2}: Career Tech requires area field but it's missing or empty`); return; }
        importArea = String(areaCol).trim();
      }
      
      const exam_score = Number(r['exam_score'] || r['score'] || r['exam'] || 0) || 0;
      // Validate exam score range (0-100 for input)
      if (exam_score < 0 || exam_score > 100) {
        errors.push(`Row ${idx+2}: exam score must be between 0 and 100, got ${exam_score}`);
        return;
      }
      // Scale exam score from 0-100 to 0-50 for database storage
      const scaledExamScore = Math.round((exam_score / 100) * 50);
      payloads.push({ student_id: student.id, subject, term, year, exam_score: scaledExamScore, area: importArea });
    });
    if (errors.length) { notify('Import completed with some errors; check console for details.', 'warning'); console.warn('Exam import errors:', errors); }
    if (payloads.length === 0) { notify('No valid rows to import.', 'warning'); return; }
    if (loader) loader.update(60);
    const upsertPayloads = [];
    for (const p of payloads) {
      // Use appropriate client for querying existing data
      const client = p.subject === 'Career Tech' ? supabaseCareerTech : supabaseClient;
      const tableName = p.subject === 'Career Tech' ? 'career_tech_results' : 'results';
      let query = client.from(tableName).select('class_score, individual, "group", class_test, project, area').eq('student_id', p.student_id).eq('term', p.term).eq('year', p.year);
      if (p.subject === 'Career Tech') {
        query = query.eq('area', p.area);
      } else {
        query = query.eq('subject', p.subject);
      }
      const { data: existing } = await query.single().catch(() => ({ data: null }));
      const payload = { student_id: p.student_id, term: p.term, year: p.year, exam_score: p.exam_score, class_score: (existing && typeof existing.class_score === 'number') ? existing.class_score : 0, individual: (existing && typeof existing.individual === 'number') ? existing.individual : 0, "group": (existing && typeof existing['group'] === 'number') ? existing['group'] : 0, class_test: (existing && typeof existing.class_test === 'number') ? existing.class_test : 0, project: (existing && typeof existing.project === 'number') ? existing.project : 0 };
      if (p.subject === 'Career Tech') {
        payload.area = p.area;
      } else {
        payload.subject = p.subject;
      }
      upsertPayloads.push(payload);
    }
    // Separate Career Tech from regular subjects
    const careerTechUpserts = upsertPayloads.filter((_, idx) => payloads[idx].subject === 'Career Tech');
    const regularUpserts = upsertPayloads.filter((_, idx) => payloads[idx].subject !== 'Career Tech');
    // Upsert to appropriate tables
    if (careerTechUpserts.length > 0) {
      const { error: ctErr } = await supabaseCareerTech.from('career_tech_results').upsert(careerTechUpserts, { onConflict: ['student_id','area','term','year'] });
      if (ctErr) throw ctErr;
    }
    if (regularUpserts.length > 0) {
      const { error: regErr } = await supabaseClient.from('results').upsert(regularUpserts, { onConflict: ['student_id','subject','term','year'] });
      if (regErr) throw regErr;
    }
    if (loader) loader.update(100);
    notify(`Imported ${upsertPayloads.length} exam rows.`, 'info');
    await loadStudents('exam');
  } catch (err) {
    console.error('importExamsFromFile error', err);
    notify('Failed to import Exam CSV: ' + (err.message || String(err)), 'error');
  } finally { try { if (loader) loader.close(); } catch(e) {} }
}

// Wire file inputs and import buttons
document.addEventListener('DOMContentLoaded', () => {
  const importSBAFile = document.getElementById('importSBAFile');
  const importSBAButton = document.getElementById('importSBAButton');
  if (importSBAFile && importSBAButton) {
    importSBAButton.addEventListener('click', () => importSBAFile.click());
    importSBAFile.addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (f) importSBAFromFile(f);
      importSBAFile.value = '';
    });
  }
  const importExamFile = document.getElementById('importExamFile');
  const importExamButton = document.getElementById('importExamButton');
  if (importExamFile && importExamButton) {
    importExamButton.addEventListener('click', () => importExamFile.click());
    importExamFile.addEventListener('change', (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (f) importExamsFromFile(f);
      importExamFile.value = '';
    });
  }
});

// Expose functions for manual calls
window.exportSBAToCSV = exportSBAToCSV;
window.exportExamsToCSV = exportExamsToCSV;
window.importSBAFromFile = importSBAFromFile;
window.importExamsFromFile = importExamsFromFile;
window.filterStudents = filterStudents;

// Student filtering function for SBA and Exam tables
function filterStudents(section) {
  const searchInput = section === 'sba' ? document.getElementById('studentSearchSBA') : document.getElementById('studentSearchExam');
  const tbody = section === 'sba' ? document.getElementById('sbaTableBody') : document.getElementById('examTableBody');
  
  if (!searchInput || !tbody) return;
  
  const searchTerm = searchInput.value.toLowerCase().trim();
  const rows = tbody.querySelectorAll('tr');
  
  if (!searchTerm) {
    // Show all rows if search is empty
    rows.forEach(row => row.style.display = '');
    return;
  }
  
  rows.forEach(row => {
    const studentName = row.cells[0]?.textContent?.toLowerCase() || '';
    const studentId = row.cells[0]?.textContent?.toLowerCase() || '';
    
    // Check if student name or ID contains the search term
    if (studentName.includes(searchTerm) || studentId.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}