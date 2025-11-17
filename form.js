// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

// Helper to normalize values used in REST filters: trim and replace stray plus signs
function normalizeFilterValue(v) {
  if (v === null || v === undefined) return '';
  return v.toString().trim().replace(/\+/g, ' ');
}

// 🔽 Populate class dropdown
async function populateClassDropdown() {
  const { data, error } = await supabaseClient.from('students').select('class').neq('class', '').order('class');
  if (error) return console.error('Failed to load classes:', error.message);
  const uniqueClasses = [...new Set(data.map(s => s.class))];
  const select = document.getElementById('classSelect');
  uniqueClasses.forEach(cls => {
    const option = document.createElement('option');
    option.value = cls;
    option.textContent = cls;
    select.appendChild(option);
  });
}

// 🔽 Populate student dropdown by class and term
async function populateStudentDropdown(className, term, year) {
  const select = document.getElementById('studentSelect');
  // Preserve the previously selected student
  const prevSelected = select.value;
  select.innerHTML = '<option value="">-- Select --</option>';
  if (!className) return;
  const { data: students, error: studentError } = await supabaseClient.from('students').select('id, first_name, surname').eq('class', className);
  if (studentError) return console.error('Failed to load students:', studentError.message);
  let foundPrev = false;
  for (const student of students) {
    let hasProfile = false;
    if (term && year) {
      const t = normalizeFilterValue(term);
      const y = normalizeFilterValue(year);
      const { data: profile } = await supabaseClient.from('profiles').select('id').eq('student_id', student.id).eq('term', t).eq('year', y).maybeSingle();
      hasProfile = !!profile;
    }
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = `${student.first_name || ''} ${student.surname || ''}`.trim() + (hasProfile ? ' (Has Data)' : '');
    if (student.id === prevSelected) {
      option.selected = true;
      foundPrev = true;
    }
    select.appendChild(option);
  }
  // If previous student is still available, reload their profile
  if (foundPrev && select.value) {
    loadStudentProfileForUpdate();
  } else {
    // Otherwise, clear profile fields
    document.getElementById('attendanceTotal').value = '';
    document.getElementById('attendanceActual').value = '';
    document.getElementById('interest').value = '';
    document.getElementById('conduct').value = '';
  }
}

// 🖊️ Load selected student's details for update
async function setAttendanceActualFromSchoolDates() {
  // Always fetch the latest attendance_total_days from school_dates
  let attendanceTotalDays = '';
  try {
    const { data: schoolDatesData, error: schoolDatesError } = await supabaseClient
      .from('school_dates')
      .select('attendance_total_days')
      .order('inserted_at', { ascending: false })
      .limit(1);
    if (!schoolDatesError && schoolDatesData && schoolDatesData.length > 0) {
      attendanceTotalDays = schoolDatesData[0].attendance_total_days || '';
    }
  } catch (e) {}
  document.getElementById('attendanceActual').value = attendanceTotalDays;
}

async function loadStudentProfileForUpdate() {
  await setAttendanceActualFromSchoolDates();
  const studentId = document.getElementById('studentSelect').value;
  const term = document.getElementById('term').value.trim();
  if (!studentId || !term) return;
  // Fetch profile with retry/backoff to handle eventual consistency or transient DB visibility
  const { profile, error } = await fetchProfileWithRetry(studentId, term, 5);
  if (profile) {
    document.getElementById('attendanceTotal').value = profile.attendance_total || '';
    document.getElementById('interest').value = profile.interest || '';
    document.getElementById('conduct').value = profile.conduct || '';
  } else {
    document.getElementById('attendanceTotal').value = '';
    document.getElementById('interest').value = '';
    document.getElementById('conduct').value = '';
  }
}

// Helper: fetch profile with exponential backoff when no result is immediately available
async function fetchProfileWithRetry(studentId, term, maxAttempts = 5) {
  const baseDelay = 200; // ms
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('interest, conduct, attendance_total, attendance_actual')
        .eq('student_id', studentId)
        .eq('term', term)
        .maybeSingle();
      // If we have a profile or a server error, return immediately
      if (error) return { profile: null, error };
      if (profile) return { profile, error: null };
      // No profile returned — wait and retry
    } catch (e) {
      // Network or unexpected error — return it
      return { profile: null, error: e };
    }
    // Exponential backoff with jitter
    const jitter = Math.floor(Math.random() * 100);
    const delay = Math.min(2000, baseDelay * Math.pow(2, attempt - 1)) + jitter;
    await new Promise(res => setTimeout(res, delay));
  }
  // After attempts, return null without error (caller handles empty state)
  return { profile: null, error: null };
}

// ✅ Submit profile data
async function submitProfile() {
  const studentId = document.getElementById('studentSelect').value;
  const term = document.getElementById('term').value.trim();
  const year = document.getElementById('year')?.value?.trim() || '';
  const attendanceTotal = parseInt(document.getElementById('attendanceTotal').value);
  const attendanceActual = parseInt(document.getElementById('attendanceActual').value); // This is now always set from school_dates and read-only
  const interest = document.getElementById('interest').value.trim();
  const conduct = document.getElementById('conduct').value.trim();

  if (!studentId || !term || !year || isNaN(attendanceTotal) || !interest || !conduct) {
  try { notify('Please fill in all fields correctly.', 'warning'); } catch (e) { try { safeNotify('Please fill in all fields correctly.', 'warning'); } catch (ee) { console.error('safeNotify failed', ee); } }
    return;
  }

  const payload = {
    student_id: studentId,
    term,
    year,
    attendance_total: attendanceTotal,
    attendance_actual: attendanceActual,
    interest,
    conduct,
    updated_at: new Date().toISOString()
  };

  // 🔄 Check if profile exists for this student, term, and year
  const tSan = normalizeFilterValue(term);
  const ySan = normalizeFilterValue(year);
  const { data: existing, error: fetchError } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('student_id', studentId)
    .eq('term', tSan)
    .eq('year', ySan)
    .maybeSingle();

  let result;
  if (existing) {
    result = await supabaseClient
      .from('profiles')
      .update(payload)
      .eq('student_id', studentId)
      .eq('term', term)
      .eq('year', year);
  } else {
    result = await supabaseClient.from('profiles').insert([payload]);
  }

  if (result.error) {
  try { notify('Error saving profile: ' + result.error.message, 'error'); } catch (e) { try { safeNotify('Error saving profile: ' + result.error.message, 'error'); } catch (ee) { console.error('safeNotify failed', ee); } }
    // Extra logging for debugging
    console.error('Full Supabase error:', result.error);
    if (result.status) {
      console.error('Supabase response status:', result.status);
    }
    if (result.data) {
      console.error('Supabase response data:', result.data);
    }
  } else {
  try { notify('Profile saved successfully.', 'info'); } catch (e) { try { safeNotify('Profile saved successfully.', 'info'); } catch (ee) { console.error('safeNotify failed', ee); } }
    document.getElementById('term').value = '';
    document.getElementById('year').value = '';
    document.getElementById('attendanceTotal').value = '';
    document.getElementById('attendanceActual').value = '';
    document.getElementById('interest').value = '';
    document.getElementById('conduct').value = '';
    document.getElementById('classSelect').value = '';
    document.getElementById('studentSelect').innerHTML = '<option value="">-- Select --</option>';
  }
}

// 🚀 Initialize
populateClassDropdown();
setAttendanceActualFromSchoolDates();
const classSelect = document.getElementById('classSelect');
if (classSelect) {
  classSelect.addEventListener('change', function() {
    const term = document.getElementById('term')?.value?.trim() || '';
    const year = document.getElementById('year')?.value?.trim() || '';
    setAttendanceActualFromSchoolDates();
    populateStudentDropdown(this.value, term, year);
  });
}
const termInput = document.getElementById('term');
if (termInput) {
  termInput.addEventListener('change', function() {
    const className = document.getElementById('classSelect')?.value || '';
    const year = document.getElementById('year')?.value?.trim() || '';
    setAttendanceActualFromSchoolDates();
    populateStudentDropdown(className, this.value.trim(), year);
  });
}
const yearInput = document.getElementById('year');
if (yearInput) {
  yearInput.addEventListener('input', function() {
    const className = document.getElementById('classSelect')?.value || '';
    const term = document.getElementById('term')?.value?.trim() || '';
    setAttendanceActualFromSchoolDates();
    populateStudentDropdown(className, term, this.value.trim());
  });
}
const studentSelect = document.getElementById('studentSelect');
if (studentSelect) {
  studentSelect.addEventListener('change', loadStudentProfileForUpdate);
}

// Listen for attendance updates from other pages and refresh profile if affected
window.addEventListener('storage', function(ev) {
  if (!ev.key) return;
  if (ev.key === 'attendanceUpdated') {
    try {
      const payload = JSON.parse(ev.newValue || '{}');
      // If current selected student is in the updated list, refresh
      const studentId = document.getElementById('studentSelect')?.value;
      if (!studentId) return;
      const updatedIds = Array.isArray(payload.studentIds) ? payload.studentIds : [];
      if (updatedIds.includes(studentId)) {
        // Refresh the profile display
        setTimeout(() => loadStudentProfileForUpdate(), 50);
      }
    } catch (e) { /* ignore parse errors */ }
  }
});