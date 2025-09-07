// Run this in your environment to check if the test teacher exists in Supabase
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);

async function checkTestTeacher() {
  const { data, error } = await supabaseClient
    .from('teachers')
    .select('*')
    .eq('staff_id', 'TST001')
    .single();
  if (error || !data) {
    console.log('Test teacher NOT found:', error ? error.message : 'No data');
  } else {
    console.log('Test teacher FOUND:', data);
  }
}

checkTestTeacher();
