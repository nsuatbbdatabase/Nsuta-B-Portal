// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

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
  select.innerHTML = '<option value="">-- Select --</option>';
  if (!className) return;
  const { data: students, error: studentError } = await supabaseClient.from('students').select('id, full_name').eq('class', className);
  if (studentError) return console.error('Failed to load students:', studentError.message);
  for (const student of students) {
    let hasProfile = false;
    if (term && year) {
      const { data: profile } = await supabaseClient.from('profiles').select('id').eq('student_id', student.id).eq('term', term).eq('year', year).single();
      hasProfile = !!profile;
    }
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = student.full_name + (hasProfile ? ' (Has Data)' : '');
    select.appendChild(option);
  }
}

// 🖊️ Load selected student's details for update
async function loadStudentProfileForUpdate() {
  const studentId = document.getElementById('studentSelect').value;
  const term = document.getElementById('term').value.trim();
  if (!studentId || !term) return;
  const { data: profile, error } = await supabaseClient.from('profiles').select('interest, conduct, attendance_total, attendance_actual').eq('student_id', studentId).eq('term', term).single();
  if (profile) {
    document.getElementById('attendanceTotal').value = profile.attendance_total || '';
    document.getElementById('attendanceActual').value = profile.attendance_actual || '';
    document.getElementById('interest').value = profile.interest || '';
    document.getElementById('conduct').value = profile.conduct || '';
  } else {
    document.getElementById('attendanceTotal').value = '';
    document.getElementById('attendanceActual').value = '';
    document.getElementById('interest').value = '';
    document.getElementById('conduct').value = '';
  }
}

// ✅ Submit profile data
async function submitProfile() {
  const studentId = document.getElementById('studentSelect').value;
  const term = document.getElementById('term').value.trim();
  const year = document.getElementById('year')?.value?.trim() || '';
  const attendanceTotal = parseInt(document.getElementById('attendanceTotal').value);
  const attendanceActual = parseInt(document.getElementById('attendanceActual').value);
  const interest = document.getElementById('interest').value.trim();
  const conduct = document.getElementById('conduct').value.trim();

  if (!studentId || !term || !year || isNaN(attendanceTotal) || isNaN(attendanceActual) || !interest || !conduct) {
    alert('Please fill in all fields correctly.');
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
  const { data: existing, error: fetchError } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('student_id', studentId)
    .eq('term', term)
    .eq('year', year)
    .single();

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
    alert('Error saving profile: ' + result.error.message);
  } else {
    alert('Profile saved successfully.');
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
document.getElementById('classSelect').addEventListener('change', function() {
  const term = document.getElementById('term').value.trim();
  const year = document.getElementById('year')?.value?.trim() || '';
  populateStudentDropdown(this.value, term, year);
});
document.getElementById('term').addEventListener('change', function() {
  const className = document.getElementById('classSelect').value;
  const year = document.getElementById('year')?.value?.trim() || '';
  populateStudentDropdown(className, this.value.trim(), year);
});
document.getElementById('year').addEventListener('input', function() {
  const className = document.getElementById('classSelect').value;
  const term = document.getElementById('term').value.trim();
  populateStudentDropdown(className, term, this.value.trim());
});
document.getElementById('studentSelect').addEventListener('change', loadStudentProfileForUpdate);