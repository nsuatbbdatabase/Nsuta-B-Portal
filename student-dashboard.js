// Dashboard Overview Back Button Logic
window.addEventListener('DOMContentLoaded', () => {
  // Removed force PIN change modal logic from student dashboard. Now handled on login page only.
  // Change PIN form logic
  const changePinForm = document.getElementById('changePinForm');
  if (changePinForm) {
    changePinForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const oldPin = document.getElementById('oldPinInput').value.trim();
      const newPin = document.getElementById('newPinInput').value.trim();
      const confirmPin = document.getElementById('confirmPinInput').value.trim();
      const statusDiv = document.getElementById('changePinStatus');
      statusDiv.style.color = 'red';
      if (!oldPin || !newPin || !confirmPin) {
        statusDiv.textContent = 'All fields are required.';
        return;
      }
      if (newPin !== confirmPin) {
        statusDiv.textContent = 'New PIN and confirmation do not match.';
        return;
      }
      if (newPin.length < 4 || newPin.length > 8) {
        statusDiv.textContent = 'PIN must be 4-8 digits.';
        return;
      }
      // Get current student info from session/localStorage
      let student = JSON.parse(localStorage.getItem('studentSession'));
      // If not found, fetch from Supabase using studentId
      if (!student) {
        const studentId = localStorage.getItem('studentId');
        if (!studentId) {
          statusDiv.textContent = 'Session expired. Please log in again.';
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
          return;
        }
        const { data, error } = await supabaseClient
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
        if (error || !data) {
          statusDiv.textContent = 'Session expired. Please log in again.';
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
          return;
        }
        student = data;
        localStorage.setItem('studentSession', JSON.stringify(student));
      }
      // Validate old PIN
      if (oldPin !== student.pin) {
        statusDiv.textContent = 'Current PIN is incorrect.';
        return;
      }
      // Update PIN in Supabase
      try {
        const { data, error } = await supabaseClient
          .from('students')
          .update({ pin: newPin, forcepinchange: false })
          .eq('id', student.id);
        if (error) {
          statusDiv.textContent = 'Failed to update PIN. Please try again.';
          return;
        }
        // Update local session
        student.pin = newPin;
        student.forcepinchange = false;
        localStorage.setItem('studentSession', JSON.stringify(student));
        statusDiv.style.color = 'green';
        statusDiv.textContent = 'PIN changed successfully!';
        setTimeout(() => {
          window.closeChangePinModal();
          document.body.classList.remove('force-pin-change');
        }, 1200);
      } catch (err) {
        statusDiv.textContent = 'An error occurred. Please try again.';
      }
    });
  }
  // Change PIN modal logic
  const openChangePinModalBtn = document.getElementById('changePinBtn');
    // About Me modal logic
    const aboutMeBtn = document.getElementById('aboutMeBtn');
    const aboutMeModal = document.getElementById('aboutMeModal');
    const closeAboutMeBtn = document.getElementById('closeAboutMe');
    window.openAboutMeModal = function() {
      if (aboutMeModal) {
        aboutMeModal.classList.remove('hidden');
        aboutMeModal.style.display = '';
      }
    };
    window.closeAboutMeModal = function() {
      if (aboutMeModal) {
        aboutMeModal.classList.add('hidden');
        aboutMeModal.style.display = 'none';
      }
    };
    if (aboutMeBtn) {
      aboutMeBtn.onclick = function() {
        window.openAboutMeModal();
      };
    }
    if (closeAboutMeBtn) {
      closeAboutMeBtn.onclick = function() {
        window.closeAboutMeModal();
      };
    }
  var changePinModal = document.getElementById('changePinModal');
  const closeChangePinBtn = document.getElementById('closeChangePin');
  window.closeChangePinModal = function() {
    changePinModal.classList.add('hidden');
  };
  if (openChangePinModalBtn) {
    openChangePinModalBtn.onclick = function() {
      changePinModal.classList.remove('hidden');
    };
  }
  if (closeChangePinBtn) {
    closeChangePinBtn.onclick = function() {
      changePinModal.classList.add('hidden');
    };
  }
  // Removed duplicate declaration of changePinModal
  if (openChangePinModalBtn && changePinModal) {
    openChangePinModalBtn.onclick = function() {
      changePinModal.classList.remove('hidden');
      changePinModal.style.display = '';
    };
  }
  window.closeChangePinModal = function() {
    if (changePinModal) {
      changePinModal.classList.add('hidden');
      changePinModal.style.display = 'none';
      document.getElementById('changePinForm').reset();
      document.getElementById('changePinStatus').textContent = '';
    }
  };
  // Prevent access if not logged in as student
  const studentId = localStorage.getItem('studentId');
  if (!studentId) {
    window.location.href = 'login.html';
    return;
  }
  const backBtn = document.getElementById('backToDashboardBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
  const backToAdminBtn = document.getElementById('backToAdminBtn');
  if (backToAdminBtn) {
    backToAdminBtn.addEventListener('click', () => {
      window.location.href = 'admin.html';
    });
  }
});
// --- Render Student Timetable Table ---
async function renderStudentTimetable() {
  const tbody = document.querySelector('#studentTimetableTable tbody');
  if (!tbody || !window.student || !window.student.class) return;
  tbody.innerHTML = '<tr><td colspan="3">Loading...</td></tr>';

  // Determine classes to fetch
  let classList = [];
  if (window.student.class === 'JHS 1') classList = ['JHS 1 A', 'JHS 1 B'];
  else if (window.student.class === 'JHS 2') classList = ['JHS 2 A', 'JHS 2 B'];
  else if (window.student.class) classList = [window.student.class];
  if (!classList.length) {
    tbody.innerHTML = '<tr><td colspan="3">No class assigned.</td></tr>';
    return;
  }
  const { data: timetable, error } = await supabaseClient
    .from('timetable')
    .select('*')
    .in('class', classList)
    .order('day', { ascending: true })
    .order('start_time', { ascending: true });

  tbody.innerHTML = '';
  if (error || !Array.isArray(timetable)) {
    tbody.innerHTML = '<tr><td colspan="3">Error loading timetable.</td></tr>';
    return;
  }
  if (timetable.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3">No timetable entries found.</td></tr>';
    return;
  }
  timetable.forEach(item => {
    const row = document.createElement('tr');
    // Format time as HH:MM - HH:MM
    let time = '';
    if (item.start_time && item.end_time) {
      time = `${item.start_time} - ${item.end_time}`;
    } else if (item.start_time) {
      time = item.start_time;
    }
    row.innerHTML = `
      <td>${item.day || ''}</td>
      <td>${time}</td>
      <td>${item.subject || item.title || ''}</td>
    `;
    tbody.appendChild(row);
  });
}
// --- Render Student Extra Classes Table ---
async function renderStudentExtraClasses() {
  const tbody = document.querySelector('#studentExtraClassesTable tbody');
  if (!tbody || !window.student || !window.student.class) return;
  tbody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

  // Fetch teachers and build a map of id -> name
  const { data: teachers, error: teachersError } = await supabaseClient
    .from('teachers')
    .select('id, name');
  const teacherMap = {};
  if (Array.isArray(teachers)) {
    teachers.forEach(t => { teacherMap[t.id] = t.name; });
  }

  // Determine classes to fetch
  let classList = [];
  if (window.student.class === 'JHS 1') classList = ['JHS 1 A', 'JHS 1 B'];
  else if (window.student.class === 'JHS 2') classList = ['JHS 2 A', 'JHS 2 B'];
  else if (window.student.class) classList = [window.student.class];
  if (!classList.length) {
    tbody.innerHTML = '<tr><td colspan="5">No class assigned.</td></tr>';
    return;
  }
  const { data: extraClasses, error: extraClassesError } = await supabaseClient
    .from('extra_classes')
    .select('*')
    .in('class', classList)
    .order('day', { ascending: true });

  tbody.innerHTML = '';
  if (extraClassesError || !Array.isArray(extraClasses)) {
    tbody.innerHTML = '<tr><td colspan="5">Error loading extra classes.</td></tr>';
    return;
  }
  if (extraClasses.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5">No extra classes found.</td></tr>';
    return;
  }
  extraClasses.forEach(xc => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${xc.day || ''}</td>
      <td>${xc.class || ''}</td>
      <td>${teacherMap[xc.teacher_morning_class] || ''}</td>
      <td>${teacherMap[xc.teacher_extra_class] || ''}</td>
      <td>${teacherMap[xc.teacher_extra_extra_class] || ''}</td>
    `;
    tbody.appendChild(row);
  });
}
// --- Render Student Header ---
function renderStudentHeader() {
  if (!window.student) return;
  // Welcome message
  const studentName = `${window.student.first_name || ''} ${window.student.surname || ''}`.trim();
  document.getElementById('welcomeMessage').textContent = `Welcome, ${studentName}`;
  // About Me modal fields (show only if exist)
  function setField(id, label, value) {
    const el = document.getElementById(id);
    if (el) {
      if (value) {
        el.style.display = '';
        el.textContent = `${label}: ${value}`;
      } else {
        el.style.display = 'none';
      }
    }
  }
  setField('studentFirstName', 'First Name', window.student.first_name);
  setField('studentSurname', 'Surname', window.student.surname);
  setField('studentLocation', 'Location', window.student.area);
  setField('studentDob', 'Date of Birth', window.student.dob);
  setField('studentNhis', 'NHIS Number', window.student.nhis_number);
  setField('studentGender', 'Gender', window.student.gender);
  setField('studentClass', 'Class', window.student.class);
  setField('studentParentName', 'Parent/Guardian Name', window.student.parent_name);
  setField('studentParentContact', 'Parent/Guardian Number', window.student.parent_contact);
  document.getElementById('studentPhoto').src = window.student.picture_url || 'default-photo.png';
}
// --- Load Assignments Section ---
async function loadAssignments() {
  if (!window.student || !window.student.class) {
    console.log('DEBUG: No student or student class found in window.student:', window.student);
    return;
  }
  // Query assignments where class matches exactly the student's class (no section logic)
  // Ensure class is used exactly as stored (no :1 or section letters)
  const className = (window.student.class || '').replace(/:.*$/, '').replace(/\s+[A-Z]$/, '');
  // Fetch all teachers for mapping id to name
  const { data: teachers, error: teachersError } = await supabaseClient
    .from('teachers')
    .select('id, name');
  const teacherMap = {};
  if (Array.isArray(teachers)) {
    teachers.forEach(t => { teacherMap[t.id] = t.name; });
  }
  const { data, error } = await supabaseClient
    .from('assignments')
    .select('id, title, subject, term, year, file_url, instructions, class, teacher_id')
    .eq('class', className);
  console.log('DEBUG: Supabase assignments query result:', { data, error, studentClass: window.student.class });

  const tbody = document.getElementById('assignmentTableBody');
  const select = document.getElementById('assignmentSelect');
  if (tbody) tbody.innerHTML = '';
  if (select) select.innerHTML = '<option value="">-- Select Assignment --</option>';

  if (error || !Array.isArray(data)) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="7">Error loading assignments.</td></tr>';
    return;
  }
  if (data.length === 0) {
    if (tbody) tbody.innerHTML = '<tr><td colspan="7">No assignments found.</td></tr>';
    return;
  }
  data.forEach(item => {
    const downloadCell = item.file_url
      ? `<a href="${item.file_url}" target="_blank">Download</a>`
      : '<span style="color:gray;">No file</span>';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${teacherMap[item.teacher_id] || item.teacher_id || '\u2014'}</td>
      <td>${item.subject}</td>
      <td>${item.title}</td>
      <td>${item.term}</td>
      <td>${item.year}</td>
      <td>${item.instructions || ''}</td>
      <td>${downloadCell}</td>
    `;
    if (tbody) tbody.appendChild(row);
    if (select) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = `${item.subject} - ${item.title}`;
      select.appendChild(option);
    }
  });
}
// --- Supabase Client Initialization ---
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);
// --- Load Profile Section ---
// --- Dashboard UI Logic moved from HTML ---
document.addEventListener('DOMContentLoaded', function() {
  // Timetable/Extra Classes toggles
  window.toggleStudentTimetable = function() {
    const wrapper = document.getElementById('studentTimetableWrapper');
    const btn = document.querySelector('.collapsible-btn[onclick*="toggleStudentTimetable"]');
    if (!wrapper || !btn) return;
    if (wrapper.style.display === 'none') {
      wrapper.style.display = 'block';
      btn.textContent = 'Hide Timetable';
      renderStudentTimetable();
    } else {
      wrapper.style.display = 'none';
      btn.textContent = 'Show Timetable';
    }
  };
  window.toggleStudentExtraClasses = function() {
    const wrapper = document.getElementById('studentExtraClassesWrapper');
    const btn = document.querySelector('.collapsible-btn[onclick*="toggleStudentExtraClasses"]');
    if (!wrapper || !btn) return;
    if (wrapper.style.display === 'none') {
      wrapper.style.display = 'block';
      btn.textContent = 'Hide Extra Classes';
      renderStudentExtraClasses();
    } else {
      wrapper.style.display = 'none';
      btn.textContent = 'Show Extra Classes';
    }
  };
  // (fetchAndDisplayUpcomingEvents removed: function not defined)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = function() {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = 'index.html';
    };
  }
  // Dashboard card click logic
  document.querySelectorAll('.dashboard-card').forEach(card => {
    card.onclick = function() {
      const section = card.getAttribute('data-section');
      if (section === 'profileSection') {
        window.openAboutMeModal();
      } else if (section) {
        // Show tab section for other cards
        document.getElementById('dashboardOverview').style.display = 'none';
        document.querySelectorAll('.tab-section').forEach(sec => sec.style.display = 'none');
        var tabSection = document.getElementById(section);
        if (tabSection) {
          tabSection.style.display = 'block';
          // Optionally load data for each section
          if (section === 'assignmentsSection') loadAssignments();
          if (section === 'resultsSection') loadReleasedResults();
          if (section === 'submissionsSection') loadSubmissions();
          if (section === 'resourcesSection') loadResources();
          if (section === 'motivationSection') loadMotivations();
        } else {
          console.warn('Tab section not found:', section);
        }
      }
    };
  });
  // Optionally, load teacher dropdowns once on page load
  if (typeof populateTeacherDropdown === 'function') populateTeacherDropdown();

  // --- Student session debug and Supabase fetch ---
  // Add a debug div if not present
  let debugDiv = document.getElementById('debugStudentUsername');
  if (!debugDiv) {
  // debugDiv removed
  }
  // Try to get username from all possible sources
  let username = sessionStorage.getItem('student_username') || localStorage.getItem('student_username') || (window.student && window.student.username);
  let originalUsername = username;
  if (username) username = username.trim();
  // debugDiv output removed
  // Only fetch if window.student is not set
  if (!window.student && username) {
    supabaseClient
      .from('students')
      .select('*')
      .eq('username', username)
      .single()
      .then(async ({ data, error }) => {
        if (!error && data) {
          window.student = data;
          renderStudentHeader();
        }
        // Debug output removed
      });
  }
});
// --- AI Quiz Generator ---
async function generateQuiz() {
  const subject = document.getElementById('quizSubject')?.value || '';
  const topic = document.getElementById('quizTopic')?.value?.trim() || '';
  if (!subject || !topic) {
    gptStatus().textContent = 'Please select a subject and enter a topic.';
    return;
  }
  gptStatus().textContent = 'Generating quiz...';
  const prompt = `Generate a short quiz (3-5 questions) for a student on the topic '${topic}' in '${subject}'. Format as numbered questions, with multiple choice options and indicate the correct answer after each question.`;
  try {
    const apiKey = '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';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      // Add your fetch options here
      // Example:
      // method: 'POST',
      // headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      // body: JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{role: 'user', content: prompt}] })
    });
    // Handle response here if needed
  } catch (error) {
    gptStatus().textContent = 'Error generating quiz: ' + error.message;
  }
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
    notify('Please select an assignment and upload a file.', 'warning');
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
    notify('File upload failed: ' + error.message, 'error');
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
      notify('File uploaded but public URL could not be generated.', 'error');
      return;
    }
  } else {
    notify('File uploaded but no path returned.', 'error');
    return;
  }
  const submissionPayload = {
    student_id: student.id,
    assignment_id: assignmentId,
    file_url: fileUrl
  };
  console.log('DEBUG: Inserting into student_submissions:', submissionPayload);
  await supabaseClient.from('student_submissions').insert([submissionPayload]);
  notify('Assignment submitted successfully.', 'info');
  fileInput.value = '';
  await loadSubmissions();
}

// 📬 Load motivational messages
async function loadMotivations() {
  // Fetch school events from Supabase
  const { data: schoolEvents, error: schoolError } = await supabaseClient
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });
  // Fetch Ghana public holidays from public API
  let holidays = [];
  try {
    const year = new Date().getFullYear();
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/GH`);
    if (res.ok) {
      holidays = await res.json();
    }
  } catch (e) {
    // If API fails, just show school events
    holidays = [];
  }
  const slideshow = document.getElementById('eventsSlideshow');
  if (!slideshow) return;
  slideshow.innerHTML = '';
  // Only show national holidays and admin-set events
  const today = new Date();
  today.setHours(0,0,0,0);
  let allEvents = [];
  if (Array.isArray(schoolEvents)) {
    allEvents = schoolEvents
      .filter(ev => new Date(ev.event_date) >= today)
      .map(ev => ({
        date: new Date(ev.event_date),
        title: ev.event_title,
        desc: ev.event_desc,
        type: 'school'
      }));
  }
  if (Array.isArray(holidays)) {
    allEvents = allEvents.concat(
      holidays
        .filter(h => new Date(h.date) >= today && h.types && h.types.includes('National'))
        .map(h => ({
          date: new Date(h.date),
          title: h.localName,
          desc: h.name,
          type: 'holiday',
          holidayType: h.types || []
        }))
    );
  }
  // Sort by date ascending
  allEvents.sort((a, b) => a.date - b.date);
  if (allEvents.length === 0) {
    slideshow.innerHTML = '<div class="event-slide">No upcoming events.</div>';
    return;
  }
  // Format date in Ghana local format (dd/mm/yyyy)
  allEvents.forEach(ev => {
    const ghanaDate = `${ev.date.getDate().toString().padStart(2, '0')}/${(ev.date.getMonth()+1).toString().padStart(2, '0')}/${ev.date.getFullYear()}`;
    const slide = document.createElement('div');
    slide.className = 'event-slide';
    slide.innerHTML = `
      <div class="event-date">${ghanaDate}</div>
      <div class="event-title">${ev.title}</div>
      <div class="event-desc">${ev.desc}</div>
      ${ev.type === 'holiday' ? '<div class="event-type">National Holiday</div>' : ''}
    `;
    slideshow.appendChild(slide);
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
  // Filter by type and search
  const typeFilter = document.getElementById('resourceTypeFilter')?.value || '';
  const search = document.getElementById('resourceSearch')?.value?.toLowerCase() || '';
  let filtered = data.filter(res => {
    let matchType = !typeFilter || res.type === typeFilter;
    let matchSearch = !search || (res.title && res.title.toLowerCase().includes(search)) || (res.description && res.description.toLowerCase().includes(search));
    return matchType && matchSearch;
  });
  filtered.forEach(res => {
    const li = document.createElement('li');
    let icon = '';
    if (res.type === 'note') icon = '📝';
    else if (res.type === 'video') icon = '🎬';
    else if (res.type === 'quiz') icon = '❓';
    else icon = '📁';
    let preview = '';
    if (res.type === 'video' && res.link && res.link.includes('youtube.com')) {
      // Embed YouTube preview
      const videoId = res.link.split('v=')[1]?.split('&')[0];
      if (videoId) preview = `<br><iframe width="280" height="158" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
    }
    li.innerHTML = `${icon} <a href="${res.link}" target="_blank">${res.title}</a> ${res.type === 'quiz' ? '<span style="color:#0074d9;">[Take Quiz]</span>' : ''} ${preview}`;
    list.appendChild(li);
  });
  // Recommended resources logic
  const recommendedList = document.getElementById('recommendedList');
  recommendedList.innerHTML = '';
  // Example: recommend resources matching student's interest or recent results
  let recommended = data.filter(res => {
    if (!window.student || !window.student.interest) return false;
    return res.title && res.title.toLowerCase().includes(window.student.interest.toLowerCase());
  });
  if (recommended.length === 0) {
    recommendedList.innerHTML = '<li>No recommendations yet.</li>';
  } else {
    recommended.forEach(res => {
      const li = document.createElement('li');
      li.innerHTML = `<a href="${res.link}" target="_blank">${res.title}</a>`;
      recommendedList.appendChild(li);
    });
  }
}

// Add filterResources for UI filter/search
window.filterResources = function() {
  loadResources();
};

// --- GPT Study Bot Logic ---
const gptChatBox = () => document.getElementById('gptChatBox');
const gptUserInput = () => document.getElementById('gptUserInput');
const gptStatus = () => document.getElementById('gptStatus');
let gptHistory = [];
let gptLastRequestTime = 0;
const GPT_REQUEST_INTERVAL = 5000; // 5 seconds

async function sendGptMessage() {
  const now = Date.now();
  if (now - gptLastRequestTime < GPT_REQUEST_INTERVAL) {
    gptStatus().textContent = `Please wait ${Math.ceil((GPT_REQUEST_INTERVAL - (now - gptLastRequestTime))/1000)}s before sending another request.`;
    return;
  }
  gptLastRequestTime = now;
  const input = gptUserInput().value.trim();
  if (!input) return;
  gptUserInput().value = '';
  gptStatus().textContent = 'Thinking...';
  gptHistory.push({ role: 'user', content: input });
  renderGptChat();
  try {
    // --- Replace with your OpenAI API key for demo/testing ---
    const apiKey = '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';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: gptHistory,
        max_tokens: 256,
        temperature: 0.7
      })
    });
    let gptRateLimitTimeout = null;

    if (!response.ok) {
      let errorMsg = '';
      if (response.status === 401) {
        errorMsg = 'Unauthorized: Your OpenAI API key is missing, invalid, or expired.';
      } else if (response.status === 429) {
        errorMsg = 'Too Many Requests: You are sending requests too quickly or have reached your quota. Please wait and try again.';
        disableGptInput(10); // lock for 10 seconds
      } else if (response.status === 400) {
        errorMsg = 'Bad Request: The request to OpenAI was malformed.';
      } else if (response.status === 404) {
        errorMsg = 'Not Found: The OpenAI endpoint could not be reached.';
      } else if (response.status >= 500) {
        errorMsg = 'Server Error: OpenAI is currently unavailable. Try again later.';
      } else {
        errorMsg = `Unknown Error (${response.status}): Please check your network and API key.`;
      }
      gptStatus().textContent = errorMsg;
      enableGptInput();
      return;
    }
    const data = await response.json();
    const botMsg = data.choices?.[0]?.message?.content || 'Sorry, I could not answer.';
    gptHistory.push({ role: 'assistant', content: botMsg });
    renderGptChat();
    gptStatus().textContent = '';
    enableGptInput();
  } catch (e) {
    gptStatus().textContent = 'Network or API Error: ' + (e.message || 'Could not reach OpenAI. Check your internet connection and API key.');
    enableGptInput();
  }
}

function renderGptChat() {
  if (!gptChatBox()) return;
  gptChatBox().innerHTML = gptHistory.map(msg =>
    `<div style="margin-bottom:0.5em;"><b style="color:${msg.role==='user'?'#0074d9':'#2ecc40'};">${msg.role==='user'?'You':'Bot'}:</b> ${msg.content.replace(/\n/g,'<br>')}</div>`
  ).join('');
  gptChatBox().scrollTop = gptChatBox().scrollHeight;
}

// Optional: Enter key to send
document.addEventListener('DOMContentLoaded', () => {
  const input = gptUserInput();
  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendGptMessage();
    });
  }
});
// Expose GPT bot functions globally for HTML onclick (must be outside DOMContentLoaded)
window.sendGptMessage = sendGptMessage;
window.renderGptChat = renderGptChat;
window.loadAssignments = loadAssignments;
window.loadReleasedResults = loadReleasedResults;
window.loadSubmissions = loadSubmissions;
window.loadResources = loadResources;
window.loadMotivations = loadMotivations;
window.populateTeacherDropdown = populateTeacherDropdown;
// ...existing code...


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
  const studentUsername = localStorage.getItem('student_username');
  if (studentId && studentUsername) {
    (async () => {
      const { data, error } = await supabaseClient
        .from('students')
        .select('*')
        .eq('username', studentUsername)
        .single();
      if (error || !data) {
        notify('Session expired. Please log in again.', 'error');
        window.location.href = 'index.html';
        return;
      }
      student = data;
  renderStudentHeader();
  await loadAssignments();
  await loadSubmissions();
  await loadReleasedResults();
  await loadResources();
  await loadFloatingEventsSection();
    })();
  } else {
    window.location.href = 'index.html';
  }
});

// --- Floating Events/Timetable/Extra Classes Logic ---
async function loadFloatingEventsSection() {
  if (!window.student || !window.student.class) return;
  const eventsList = document.getElementById('eventsList');
  if (!eventsList) return;
  eventsList.innerHTML = '<li>Loading...</li>';

  // Fetch events, timetable, extra classes for student's class
  const { data: events, error: eventsError } = await supabaseClient
    .from('events')
    .select('*')
    .or(`class.eq.${window.student.class},class.is.null`)
  .order('day', { ascending: true })
  .order('start_time', { ascending: true });
  const { data: timetable, error: timetableError } = await supabaseClient
    .from('timetable')
    .select('*')
    .eq('class', window.student.class)
  .order('day', { ascending: true })
  .order('start_time', { ascending: true });
  const { data: extraClasses, error: extraClassesError } = await supabaseClient
    .from('extra_classes')
    .select('*')
    .eq('class', window.student.class)
  .order('day', { ascending: true })
  .order('start_time', { ascending: true });

  // Merge and sort all items by date
  let allItems = [];
  if (Array.isArray(events)) {
    allItems = allItems.concat(events.map(e => ({
      type: e.type === 'holiday' ? 'Holiday' : 'Event',
      title: e.title,
      date: e.date,
      details: e.details || '',
    })));
  }
  if (Array.isArray(timetable)) {
    allItems = allItems.concat(timetable.map(t => ({
      type: 'Timetable',
      title: t.subject || t.title,
      day: t.day,
      start_time: t.start_time,
      end_time: t.end_time,
      details: t.details || '',
    })));
  }
  if (Array.isArray(extraClasses)) {
    allItems = allItems.concat(extraClasses.map(xc => ({
      type: 'Extra Class',
      title: xc.subject || xc.title,
      day: xc.day,
      start_time: xc.start_time,
      end_time: xc.end_time,
      details: xc.details || '',
    })));
  }
  // Only filter events/holidays by date (keep timetable/extra classes always visible)
  const today = new Date();
  allItems = allItems.filter(item => {
    if (item.type === 'Holiday' || item.type === 'Event') {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      return itemDate >= today.setHours(0,0,0,0);
    }
    return true;
  });
  // Sort: events/holidays by date, timetable/extra by day/start_time
  allItems.sort((a, b) => {
    if ((a.type === 'Holiday' || a.type === 'Event') && (b.type === 'Holiday' || b.type === 'Event')) {
      return new Date(a.date) - new Date(b.date);
    } else if ((a.type === 'Timetable' || a.type === 'Extra Class') && (b.type === 'Timetable' || b.type === 'Extra Class')) {
      // Sort by day of week, then start_time
      const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      const dayA = days.indexOf(a.day);
      const dayB = days.indexOf(b.day);
      if (dayA !== dayB) return dayA - dayB;
      if (a.start_time && b.start_time) return a.start_time.localeCompare(b.start_time);
      return 0;
    }
    // Events before timetable/extra classes
    return (a.type === 'Holiday' || a.type === 'Event') ? -1 : 1;
  });

  // Render
  if (allItems.length === 0) {
    eventsList.innerHTML = '<li>No upcoming events or timetable items.</li>';
    return;
  }
  eventsList.innerHTML = '';
  allItems.forEach(item => {
    const li = document.createElement('li');
    let typeClass = '';
    if (item.type === 'Holiday') typeClass = 'event-holiday';
    else if (item.type === 'Event') typeClass = 'event-activity';
    else if (item.type === 'Timetable') typeClass = 'event-timetable';
    else if (item.type === 'Extra Class') typeClass = 'event-extra-class';
    li.className = typeClass;
    let timeStr = '';
    if (item.type === 'Timetable' || item.type === 'Extra Class') {
      if (item.day) timeStr += `<span style='margin-right:0.5rem;'>${item.day}</span>`;
      if (item.start_time && item.end_time) timeStr += `<span>${item.start_time} - ${item.end_time}</span>`;
      else if (item.start_time) timeStr += `<span>${item.start_time}</span>`;
    }
    li.innerHTML = `
      <span class="event-type">${item.type}</span>
      <span>${item.title}</span>
      ${timeStr}
      ${item.type === 'Holiday' || item.type === 'Event' ? `<span class="event-date">${item.date ? new Date(item.date).toLocaleDateString() : ''}</span>` : ''}
      ${item.details ? `<span style='margin-left:0.7rem;color:#555;'>${item.details}</span>` : ''}
    `;
    eventsList.appendChild(li);
  });
}

// If you want to filter assignments by term/year, you can use:
// const term = document.getElementById('termFilter')?.value || '';
// const year = document.getElementById('yearFilter')?.value || '';
// Use these in your Supabase query if you add term/year filters to student dashboard
// End of file