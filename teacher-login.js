// Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);

document.getElementById('teacherLoginForm').onsubmit = async function(e) {
  e.preventDefault();
  const staffId = document.getElementById('teacherLoginGesCode').value.trim();
  const pin = document.getElementById('teacherLoginPin').value.trim();
  const status = document.getElementById('teacherLoginStatus');
  status.textContent = '';
  if (!staffId || !pin) {
    status.textContent = 'Please enter your Staff ID and PIN.';
    return;
  }
  const { data, error } = await supabaseClient
    .from('teachers')
    .select('*')
    .eq('staff_id', staffId)
    .eq('pin', pin)
    .single();
  if (error || !data) {
    status.textContent = 'Invalid Staff ID or PIN.';
    return;
  }
  // Store staff_id in sessionStorage for dashboard use
  sessionStorage.setItem('teacher_staff_id', staffId);
  window.location.href = 'teacher-dashboard.html';
};
