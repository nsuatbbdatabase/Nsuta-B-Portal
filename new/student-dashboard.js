const { createClient } = supabase;

const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);

let student = {};

// 🔐 Load student dashboard
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
  renderStudentHeader();
  await loadProfile();
  await loadAssignments();
  await loadSubmissions();
  await loadReleasedResults();
  await loadResources();
}

// 🧑‍🎓 Render student header
function renderStudentHeader() {
  document.getElementById('welcomeMessage').textContent = `Welcome, ${student.full_name}`;
  document.getElementById('studentName').textContent = student.full_name;
  document.getElementById('studentClass').textContent = `Class: ${student.class}`;
  document.getElementById('studentGender').textContent = `Gender: ${student.gender}`;
  document.getElementById('studentPhoto').src = student.picture_url || 'default-photo.png';
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
  console.log('DEBUG: Student class for assignment query:', student.class);
  const { data, error } = await supabaseClient
    .from('assignments')
    .select('id, title, subject, term, year, file_url, instructions, class, teachers(name)')
    .eq('class', student.class);

  const tbody = document.getElementById('assignmentTableBody');
  const select = document.getElementById('assignmentSelect');
  tbody.innerHTML = '';
  select.innerHTML = '<option value="">-- Select Assignment --</option>';

  if (error || !Array.isArray(data)) {
    console.error('DEBUG: Error loading assignments:', error);
    tbody.innerHTML = '<tr><td colspan="7">Error loading assignments.</td></tr>';
    return;
  }

  if (data.length === 0) {
    console.log('DEBUG: No assignments found for class:', student.class);
    tbody.innerHTML = '<tr><td colspan="7">No assignments found.</td></tr>';
    return;
  }

  data.forEach(item => {
    console.log('DEBUG: Assignment row:', item);
    const downloadCell = item.file_url
      ? `<a href="${item.file_url}" target="_blank">Download</a>`
      : '<span style="color:gray;">No file</span>';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.teachers?.name || 'Unknown'}</td>
      <td>${item.subject}</td>
      <td>${item.title}</td>
      <td>${item.term}</td>
      <td>${item.year}</td>
      <td>${item.instructions}</td>
      <td>${downloadCell}</td>
    `;
    tbody.appendChild(row);

    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.subject} - ${item.title}`;
    select.appendChild(option);
  });
}

// 📂 Load submission history
async function loadSubmissions() {
  const { data, error } = await supabaseClient
    .from('student_submissions')
    .select('*, assignments(title)')
    .eq('student_id', student.id);

  const tbody = document.getElementById('submissionTableBody');
  tbody.innerHTML = '';

  if (error || !Array.isArray(data)) {
    tbody.innerHTML = '<tr><td colspan="3">Error loading submissions.</td></tr>';
    return;
  }

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No submissions yet.</td></tr>';
    return;
  }

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

let scoreChartInstance = null;

async function loadReleasedResults() {
  const term = document.getElementById('termFilter')?.value?.trim() || '';
  const year = document.getElementById('yearFilter')?.value?.trim() || '';
  const table = document.getElementById('releasedResultsTableBody');
  if (!term || !year) {
    if (table) {
      table.innerHTML = '<tr><td colspan="4" style="color:red;text-align:center;">Please select both term and year to view results.</td></tr>';
    }
    if (scoreChartInstance) {
      scoreChartInstance.destroy();
      scoreChartInstance = null;
    }
    return;
  }
  let query = supabaseClient
    .from('results')
    .select('*')
    .eq('student_id', student.id)
    .eq('term', term)
    .eq('year', year);
  const { data } = await query;

  const subjects = [];
  const classScores = [];
  const examScores = [];

  if (table) {
    table.innerHTML = '';
    if (!data || data.length === 0) {
      table.innerHTML = '<tr><td colspan="4">No released results found.</td></tr>';
    } else {
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.subject}</td>
          <td>${item.class_score}</td>
          <td>${item.exam_score}</td>
          <td>${(item.class_score || 0) + (item.exam_score || 0)}</td>
        `;
        table.appendChild(row);
      });
    }
  }

  data.forEach(item => {
    subjects.push(item.subject);
    classScores.push(item.class_score);
    examScores.push(item.exam_score);
  });

  const ctx = document.getElementById('scoreChart').getContext('2d');
  if (scoreChartInstance) {
    scoreChartInstance.destroy();
  }
  scoreChartInstance = new Chart(ctx, {
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

  console.log('DEBUG: Submitting assignment with assignmentId:', assignmentId);
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const filePath = `student/${Date.now()}_${safeFileName}`;
  const { data, error } = await supabaseClient.storage
    .from('submissions')
    .upload(filePath, file);
  console.log('Student upload response:', data, error);
  if (error) {
    alert('File upload failed: ' + error.message);
    return;
  }
  // Try to extract the file path from the response
  let uploadedPath = null;
  if (data) {
    if (data.path) uploadedPath = data.path;
    else if (data.Key) uploadedPath = data.Key;
    else if (data.id) uploadedPath = data.id;
    else if (typeof data === 'string') uploadedPath = data;
  }
  let fileUrl = null;
  if (uploadedPath) {
    const publicUrlResult = supabaseClient.storage
      .from('submissions')
      .getPublicUrl(uploadedPath);
    fileUrl = publicUrlResult && publicUrlResult.data && publicUrlResult.data.publicUrl ? publicUrlResult.data.publicUrl : null;
    if (!fileUrl) {
      alert('File uploaded but public URL could not be generated.');
      return;
    }
  } else {
    alert('File uploaded but no path returned.');
    return;
  }
  const submissionPayload = {
    student_id: student.id,
    assignment_id: assignmentId,
    file_url: fileUrl
  };
  console.log('DEBUG: Inserting into student_submissions:', submissionPayload);
  await supabaseClient.from('student_submissions').insert([submissionPayload]);
  alert('Assignment submitted successfully.');
  fileInput.value = '';
  await loadSubmissions();
}

// 📬 Load motivational messages
async function loadMotivations() {
  const { data, error } = await supabaseClient
    .from('motivations')
    .select('id, message, created_at, teacher_id')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const list = document.getElementById('motivationList');
  list.innerHTML = '';

  if (error || !Array.isArray(data) || data.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No motivational messages found.';
    list.appendChild(li);
    return;
  }

  data.forEach(msg => {
    const li = document.createElement('li');
    let date = msg.created_at ? new Date(msg.created_at).toLocaleString() : '';
    let display = msg.message;
    if (date) {
      display += `\n(${date})`;
    }
    li.textContent = display;
    list.appendChild(li);
  });
}

// Teacher sends motivational message to student
async function sendMotivationalMessage() {
  const teacherId = document.getElementById('motivationTeacherId')?.value || localStorage.getItem('teacherId') || '';
  const studentId = document.getElementById('motivationStudentSelect')?.value;
  const message = document.getElementById('motivationText')?.value.trim();
  const statusDiv = document.getElementById('motivationStatus');
  if (!teacherId || !studentId || !message) {
    if (statusDiv) {
      statusDiv.textContent = 'Please select a student and enter a message.';
      statusDiv.style.color = 'red';
    }
    return;
  }
  // Basic UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(studentId) || !uuidRegex.test(teacherId)) {
    if (statusDiv) {
      statusDiv.textContent = 'Invalid student or teacher ID format.';
      statusDiv.style.color = 'red';
    }
    return;
  }
  const { error } = await supabaseClient.from('motivations').insert([
    {
      teacher_id: teacherId,
      student_id: studentId,
      message
    }
  ]);
  if (error) {
    if (statusDiv) {
      statusDiv.textContent = 'Failed to send motivation: ' + error.message;
      statusDiv.style.color = 'red';
    }
  } else {
    if (statusDiv) {
      statusDiv.textContent = 'Motivational message sent!';
      statusDiv.style.color = 'green';
    }
    document.getElementById('motivationText').value = '';
    loadMotivations();
  }
}

// 📚 Load study resources
async function loadResources() {
  const { data, error } = await supabaseClient
    .from('resources')
    .select('*');

  const list = document.getElementById('resourceList');
  list.innerHTML = '';

  if (error || !Array.isArray(data) || data.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No resources found.';
    list.appendChild(li);
    return;
  }

  data.forEach(res => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="${res.link}" target="_blank">${res.title}</a>`;
    list.appendChild(li);
  });
}

// Contact Teacher Logic
async function populateTeacherDropdown() {
  const { data, error } = await supabaseClient.from('teachers').select('id, name');
  const selects = [
    document.getElementById('teacherSelect'),
    document.getElementById('teacherSelectResource')
  ].filter(Boolean);
  selects.forEach(select => {
    select.innerHTML = '<option value="">-- Select Teacher --</option>';
    if (!error && Array.isArray(data)) {
      data.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher.id;
        option.textContent = teacher.name;
        select.appendChild(option);
      });
    }
  });
}

async function sendMessageToTeacher() {
  const teacherId = document.getElementById('teacherSelect').value;
  const message = document.getElementById('messageToTeacher').value.trim();
  const statusDiv = document.getElementById('teacherMessageStatus');
  if (!teacherId || !message) {
    statusDiv.textContent = 'Please select a teacher and enter your message.';
    statusDiv.style.color = 'red';
    return;
  }
  // Basic UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(student.id) || !uuidRegex.test(teacherId)) {
    statusDiv.textContent = 'Invalid student or teacher ID format.';
    statusDiv.style.color = 'red';
    return;
  }
  const { error } = await supabaseClient.from('teacher_messages').insert([
    {
      student_id: student.id,
      teacher_id: teacherId,
      message
      // created_at will default
    }
  ]);
  if (error) {
    statusDiv.textContent = 'Failed to send message: ' + error.message;
    statusDiv.style.color = 'red';
  } else {
    statusDiv.textContent = 'Message sent successfully!';
    statusDiv.style.color = 'green';
    document.getElementById('messageToTeacher').value = '';
  }
}

// Resource Request Logic
async function sendResourceRequest() {
  const teacherId = document.getElementById('teacherSelectResource').value;
  const resource = document.getElementById('resourceTopic').value.trim();
  const reason = document.getElementById('resourceReason')?.value?.trim() || '';
  const statusDiv = document.getElementById('resourceRequestStatus');
  if (!teacherId || !resource) {
    statusDiv.textContent = 'Please select a teacher and enter a resource/topic.';
    statusDiv.style.color = 'red';
    return;
  }
  // Basic UUID format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(student.id) || !uuidRegex.test(teacherId)) {
    statusDiv.textContent = 'Invalid student or teacher ID format.';
    statusDiv.style.color = 'red';
    return;
  }
  const { error } = await supabaseClient.from('resource_requests').insert([
    {
      student_id: student.id,
      teacher_id: teacherId,
      resource,
      reason
      // created_at will default
    }
  ]);
  if (error) {
    statusDiv.textContent = 'Failed to send request: ' + error.message;
    statusDiv.style.color = 'red';
  } else {
    statusDiv.textContent = 'Request sent successfully!';
    statusDiv.style.color = 'green';
    document.getElementById('resourceTopic').value = '';
    if (document.getElementById('resourceReason')) document.getElementById('resourceReason').value = '';
  }
}

// Initialize teacher dropdown on page load
window.addEventListener('DOMContentLoaded', async () => {
  await populateTeacherDropdown();
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
      renderStudentHeader();
      await loadProfile();
      await loadAssignments();
      await loadSubmissions();
      await loadReleasedResults();
      await loadResources();
    })();
  } else {
    window.location.href = 'index.html';
  }
});

// If you want to filter assignments by term/year, you can use:
// const term = document.getElementById('termFilter')?.value || '';
// const year = document.getElementById('yearFilter')?.value || '';
// Use these in your Supabase query if you add term/year filters to student dashboard