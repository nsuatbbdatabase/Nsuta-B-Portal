// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

// 🔐 Login handler
async function login() {
  const role = document.getElementById('roleSelect').value;
  const username = document.getElementById('username').value.trim();
  const pin = document.getElementById('pin').value.trim();

  if (!role || !username || !pin) {
    alert('Please select a role and enter your credentials.');
    return;
  }

  let table = '';
  let query = {};

  switch (role) {
    case 'student':
      table = 'students';
      query = { username, pin };
      break;
    case 'teacher':
      table = 'teachers';
      query = { staff_id: username, pin };
      break;
    case 'admin':
      table = 'admins';
      query = { email: username, pin };
      break;
    default:
      alert('Invalid role selected.');
      return;
  }

  const { data, error } = await supabaseClient
    .from(table)
    .select('*')
    .match(query)
    .single();

  if (error || !data) {
    alert('Login failed. Please check your credentials.');
    return;
  }

  // ✅ Store ID and redirect
  switch (role) {
    case 'student':
      localStorage.setItem('studentId', data.id);
      window.location.href = 'student-dashboard.html';
      break;
    case 'teacher':
      localStorage.setItem('teacherId', data.id);
      window.location.href = 'teacher-dashboard.html';
      break;
    case 'admin':
      localStorage.setItem('adminId', data.id);
      window.location.href = 'admin.html';
      break;
  }
}

// 🌟 Load motivational message (optional)
async function loadMotivation() {
  const { data } = await supabaseClient
    .from('motivations')
    .select('message')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (data) {
    document.getElementById('motivationMessage').textContent = data.message;
  }
}

// 🚀 Initialize
loadMotivation();