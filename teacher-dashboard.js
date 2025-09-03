// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

let teacher = {};
let students = [];

// 🔐 Load teacher profile
async function loadTeacherDashboard(staffId) {
  const { data, error } = await supabaseClient
    .from('teachers')
    .select('id, name, classes, subjects')
    .eq('staff_id', staffId)
    .single();

  if (error || !data) {
    alert('Access denied or teacher not found.');
    return;
  }

  teacher = data;
  document.getElementById('welcomeMessage').textContent = `Welcome, ${teacher.name}`;

  // 📌 Display assigned classes and subjects
  const rolesDiv = document.getElementById('assignedRoles');
  rolesDiv.innerHTML = `
    <strong>Assigned Classes:</strong> ${teacher.classes.join(', ')}<br/>
    <strong>Assigned Subjects:</strong> ${teacher.subjects.join(', ')}
  `;

  // Populate dropdowns
  populateDropdown('classSelect', teacher.classes);
  populateDropdown('subjectSelect', teacher.subjects);
  populateDropdown('assignClass', teacher.classes);
  populateDropdown('assignSubject', teacher.subjects);

  // Load assignment inbox
  await loadAssignments();
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

// 📋 Load students by selected class
async function loadStudents() {
  const selectedClass = document.getElementById('classSelect').value;
  const selectedSubject = document.getElementById('subjectSelect').value;
  const term = document.getElementById('term').value;
  const year = document.getElementById('year').value;

  if (!selectedClass || !selectedSubject || !term || !year) return;

  const { data, error } = await supabaseClient
    .from('students')
    .select('id, full_name')
    .eq('class', selectedClass);

  if (error) return console.error('Failed to load students:', error.message);
  students = data;

  renderSBAForm();
  renderExamForm();
}

// 📝 Render SBA form
function renderSBAForm() {
  const tbody = document.getElementById('sbaTableBody');
  tbody.innerHTML = '';
  students.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.full_name}</td>
      <td><input type="number" data-type="individual" data-id="${student.id}" /></td>
      <td><input type="number" data-type="group" data-id="${student.id}" /></td>
      <td><input type="number" data-type="classTest" data-id="${student.id}" /></td>
      <td><input type="number" data-type="project" data-id="${student.id}" /></td>
      <td><span id="total-${student.id}">0</span></td>
      <td><span id="scaled-${student.id}">0</span></td>
    `;
    tbody.appendChild(row);
  });

  document.querySelectorAll('#sbaTableBody input').forEach(input => {
    input.addEventListener('input', () => calculateSBAScore(input.dataset.id));
  });
}

// 🧮 Calculate SBA scaled score
function calculateSBAScore(studentId) {
  const individual = parseInt(document.querySelector(`input[data-id="${studentId}"][data-type="individual"]`)?.value) || 0;
  const group = parseInt(document.querySelector(`input[data-id="${studentId}"][data-type="group"]`)?.value) || 0;
  const classTest = parseInt(document.querySelector(`input[data-id="${studentId}"][data-type="classTest"]`)?.value) || 0;
  const project = parseInt(document.querySelector(`input[data-id="${studentId}"][data-type="project"]`)?.value) || 0;

  const total = individual + group + classTest + project;
  const scaled = Math.floor((total / 60) * 50);

  document.getElementById(`total-${studentId}`).textContent = total;
  document.getElementById(`scaled-${studentId}`).textContent = scaled;
}

// ✅ Submit SBA scores
async function submitSBA() {
  const subject = document.getElementById('subjectSelect').value;
  const term = document.getElementById('term').value;
  const year = document.getElementById('year').value;

  for (const student of students) {
    const scaled = parseInt(document.getElementById(`scaled-${student.id}`).textContent);
    const payload = {
      student_id: student.id,
      subject,
      term,
      year,
      class_score: scaled,
      exam_score: 0
    };

    await supabaseClient.from('results').upsert([payload], {
      onConflict: ['student_id', 'subject', 'term', 'year']
    });
  }

  alert('SBA scores submitted successfully.');
}

// 🧪 Render Exam form
function renderExamForm() {
  const tbody = document.getElementById('examTableBody');
  tbody.innerHTML = '';
  students.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${student.full_name}</td>
      <td><input type="number" data-type="exam" data-id="${student.id}" /></td>
      <td><span id="examScaled-${student.id}">0</span></td>
    `;
    tbody.appendChild(row);
  });

  document.querySelectorAll('#examTableBody input').forEach(input => {
    input.addEventListener('input', () => {
      const raw = parseInt(input.value) || 0;
      const scaled = Math.floor((raw / 100) * 50);
      document.getElementById(`examScaled-${input.dataset.id}`).textContent = scaled;
    });
  });
}

// ✅ Submit Exam scores
async function submitExams() {
  const subject = document.getElementById('subjectSelect').value;
  const term = document.getElementById('term').value;
  const year = document.getElementById('year').value;

  for (const student of students) {
    const scaled = parseInt(document.getElementById(`examScaled-${student.id}`).textContent);
    const payload = {
      student_id: student.id,
      subject,
      term,
      year,
      exam_score: scaled
    };

    await supabaseClient.from('results').upsert([payload], {
      onConflict: ['student_id', 'subject', 'term', 'year']
    });
  }

  alert('Exam scores submitted successfully.');
}

// 📤 Send assignment to students
async function sendAssignment() {
  const className = document.getElementById('assignClass').value;
  const subject = document.getElementById('assignSubject').value;
  const term = document.getElementById('assignTerm').value;
  const year = document.getElementById('assignYear').value;
  const title = document.getElementById('assignTitle').value.trim();
  const instructions = document.getElementById('assignText').value.trim();
  const fileInput = document.getElementById('assignFile');
  const file = fileInput.files[0];

  if (!className || !subject || !term || !year || !title || !instructions) {
    alert('Please fill in all required fields.');
    return;
  }

  let fileUrl = null;
  if (file) {
    const { data, error } = await supabaseClient.storage
      .from('assignments')
      .upload(`teacher/${Date.now()}_${file.name}`, file);

    if (error) {
      alert('File upload failed: ' + error.message);
      return;
    }

    fileUrl = supabaseClient.storage
      .from('assignments')
      .getPublicUrl(data.path).publicUrl;
  }

  const payload = {
    teacher_id: teacher.id,
    class: className,
    subject,
    term,
    year,
    title,
    instructions,
    file_url: fileUrl
  };

  const { error } = await supabaseClient.from('assignments').insert([payload]);
  if (error) {
    alert('Assignment submission failed: ' + error.message);
  } else {
        alert('Assignment sent successfully.');

    // Clear form fields
    document.getElementById('assignTitle').value = '';
    document.getElementById('assignText').value = '';
    document.getElementById('assignFile').value = '';
    document.getElementById('assignClass').value = '';
    document.getElementById('assignSubject').value = '';
    document.getElementById('assignTerm').value = '';
    document.getElementById('assignYear').value = '';

    // Optionally reload assignment inbox
    await loadAssignments();
  }
}