// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

// 🔍 Load profiles by term/year
async function loadProfiles() {
  const term = document.getElementById('termFilter').value.trim();
  const year = document.getElementById('yearFilter').value.trim();
  const tbody = document.querySelector('#profileTable tbody');
  tbody.innerHTML = '';

  if (!term || !year) {
    alert('Please select both term and academic year.');
    return;
  }

  // 📦 Fetch profiles with student info
  const { data, error } = await supabaseClient
    .from('profiles')
    .select(`
      id,
      student_id,
      term,
      year,
      attendance_total,
      attendance_actual,
      interest,
      conduct,
      students (
        full_name,
        class
      )
    `)
    .eq('term', term)
    .eq('year', year);

  if (error) {
    console.error('Failed to load profiles:', error.message);
    return;
  }

  data.forEach(profile => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${profile.students?.full_name || '—'}</td>
      <td>${profile.students?.class || '—'}</td>
      <td>
        <input type="number" value="${profile.attendance_total}" data-id="${profile.id}" data-field="attendance_total" />
        /
        <input type="number" value="${profile.attendance_actual}" data-id="${profile.id}" data-field="attendance_actual" />
      </td>
      <td>
        <select data-id="${profile.id}" data-field="interest">
          ${generateInterestOptions(profile.interest)}
        </select>
      </td>
      <td>
        <select data-id="${profile.id}" data-field="conduct">
          ${generateConductOptions(profile.conduct)}
        </select>
      </td>
      <td>
        <button onclick="updateProfile('${profile.id}')">Update</button>
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

// ✏️ Update profile
async function updateProfile(profileId) {
  const inputs = document.querySelectorAll(`[data-id="${profileId}"]`);
  const payload = {};

  inputs.forEach(input => {
    const field = input.dataset.field;
    const value = input.tagName === 'SELECT' ? input.value : parseInt(input.value);
    payload[field] = value;
  });

  payload.updated_at = new Date().toISOString();

  const { error } = await supabaseClient
    .from('profiles')
    .update(payload)
    .eq('id', profileId);

  if (error) {
    alert('Update failed: ' + error.message);
  } else {
    alert('Profile updated successfully.');
  }
}