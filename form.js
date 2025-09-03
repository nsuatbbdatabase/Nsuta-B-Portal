// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

// 🔽 Populate student dropdown
async function populateStudentDropdown() {
  const { data, error } = await supabaseClient.from('students').select('id, full_name');
  const select = document.getElementById('studentSelect');
  if (error) return console.error('Failed to load students:', error.message);

  data.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = student.full_name;
    select.appendChild(option);
  });
}

// ✅ Submit profile data
async function submitProfile() {
  const studentId = document.getElementById('studentSelect').value;
  const term = document.getElementById('term').value.trim();
  const year = document.getElementById('year').value.trim();
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
  }
}

// 🚀 Initialize
populateStudentDropdown();