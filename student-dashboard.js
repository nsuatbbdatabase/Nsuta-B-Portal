// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

let student = {};

// 🔐 Load student profile
async function loadStudentDashboard(username, pin) {
  const { data, error } = await supabaseClient
    .from('students')
    .select('*')
    .eq('username', username)
    .eq('pin', pin)
    .single();

  if (error || !data) {
    alert('Invalid login credentials.');
    return;
  }

  student = data;
  document.getElementById('welcomeMessage').textContent = `Welcome, ${student.full_name}`;
  document.getElementById('studentName').textContent = student.full_name;
  document.getElementById('studentClass').textContent = `Class: ${student.class}`;
  document.getElementById('studentGender').textContent = `Gender: ${student.gender}`;
  document.getElementById('studentPhoto').src = student.picture_url || 'default-photo.png';

  await loadProfile();
  await loadAssignments();
  await loadSubmissions();
  await loadReleasedResults();
  await loadMotivations();
  await loadResources();
}

// 📅 Load attendance, conduct, interest
async function loadProfile() {
  const { data } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('student_id', student.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (data) {
    document.getElementById('studentInterest').textContent = `Interest: ${data.interest}`;
    document.getElementById('studentConduct').textContent = `Conduct: ${data.conduct}`;
    document.getElementById('studentAttendance').textContent = `Attendance: ${data.attendance_actual}/${data.attendance_total}`;
  }
}

// 📥 Load assignments sent to student’s class
async function loadAssignments() {
  const { data } = await supabaseClient
    .from('assignments')
    .select('*, teachers(name)')
    .eq('class', student.class);

  const tbody = document.getElementById('assignmentTableBody');
  tbody.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.teachers?.name || 'Unknown'}</td>
      <td>${item.subject}</td>
      <td>${item.title}</td>
      <td>${item.term}</td>
      <td>${item.year}</td>
      <td>Pending</td>
      <td><a href="${item.file_url}" target="_blank">Download</a></td>
    `;
    tbody.appendChild(row);

    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.subject} - ${item.title}`;
    document.getElementById('assignmentSelect').appendChild(option);
  });
}

// 📂 Load submission history
async function loadSubmissions() {
  const { data } = await supabaseClient
    .from('student_submissions')
    .select('*, assignments(title)')
    .eq('student_id', student.id);

  const tbody = document.getElementById('submissionTableBody');
  tbody.innerHTML = '';

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.assignments?.title || 'Unknown'}</td>
      <td>${new Date(item.submitted_at).toLocaleString()}</td>
      <td><a href="${item.file_url}" target="_blank">View</a></td>
    `;
    tbody.appendChild(row);
  });
}

// 📊 Load released results and render chart
async function loadReleasedResults() {
  const { data } = await supabaseClient
    .from('released_results')
    .select('*')
    .eq('student_id', student.id);

  const subjects = [];
  const classScores = [];
  const examScores = [];

  data.forEach(item => {
    subjects.push(item.subject);
    classScores.push(item.class_score);
    examScores.push(item.exam_score);
  });

  const ctx = document.getElementById('scoreChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: subjects,
      datasets: [
        {
          label: 'Class Score (SBA)',
          data: classScores,
          backgroundColor: '#004080'
        },
        {
          label: 'Exam Score',
          data: examScores,
          backgroundColor: '#ffa500'
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 50 }
      }
    }
  });
}

// 📤 Submit assignment
async function submitAssignment() {
  const assignmentId = document.getElementById('assignmentSelect').value;
  const fileInput = document.getElementById('submissionFile');
  const file = fileInput.files[0];

  if (!assignmentId || !file) {
    alert('Please select an assignment and upload a file.');
    return;
  }

  const { data, error } = await supabaseClient.storage
    .from('submissions')
    .upload(`student/${Date.now()}_${file.name}`, file);

  if (error) {
    alert('File upload failed.');
    return;
  }

  const fileUrl = supabaseClient.storage
    .from('submissions')
    .getPublicUrl(data.path).publicUrl;

  await supabaseClient.from('student_submissions').insert([{
    student_id: student.id,
    assignment_id: assignmentId,
    file_url: fileUrl
  }]);

  alert('Assignment submitted successfully.');
  fileInput.value = '';
  await loadSubmissions();
}

// 📬 Load motivational messages
async function loadMotivations() {
  const { data } = await supabaseClient
    .from('motivations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const list = document.getElementById('motivationList');
  list.innerHTML = '';

  data.forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg.message;
    list.appendChild(li);
  });
}

// 📚 Load study resources
async function loadResources() {
  const { data } = await supabaseClient
    .from('resources')
    .select('*');

  const list = document.getElementById('resourceList');
  list.innerHTML = '';

  data.forEach(res => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${res.link}" target="_blank">${res.title}</a>`;
    list.appendChild(li);
  });
}

// 🌙 Dark Mode Toggle
document.getElementById('darkModeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// 🚀 Initialize dashboard (replace with login logic)

// 🚀 Initialize dashboard with logged-in student
const studentId = localStorage.getItem('studentId');
if (studentId) {
  (async () => {
    const { data, error } = await supabaseClient
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    if (error || !data) {
      alert('Session expired. Please log in again.');
      window.location.href = 'index.html';
      return;
    }
    student = data;
    document.getElementById('welcomeMessage').textContent = `Welcome, ${student.full_name}`;
    document.getElementById('studentName').textContent = student.full_name;
    document.getElementById('studentClass').textContent = `Class: ${student.class}`;
    document.getElementById('studentGender').textContent = `Gender: ${student.gender}`;
    document.getElementById('studentPhoto').src = student.picture_url || 'default-photo.png';
    await loadProfile();
    await loadAssignments();
    await loadSubmissions();
    await loadReleasedResults();
    await loadMotivations();
    await loadResources();
  })();
} else {
  window.location.href = 'index.html';
}