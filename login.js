
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
      // Also store staff_id in sessionStorage for dashboard compatibility
      if (data.staff_id) sessionStorage.setItem('teacher_staff_id', data.staff_id);
      window.location.href = 'teacher-dashboard.html';
      break;
    case 'admin':
      localStorage.setItem('adminId', data.id);
      sessionStorage.setItem('adminId', data.id); // Ensure sessionStorage is set for router.js
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

  window.addEventListener('load', function () {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isMobile = /Mobi/i.test(navigator.userAgent);

    if (isAndroid && isMobile) {
      const prompt = document.createElement('div');
      prompt.style.position = 'fixed';
      prompt.style.bottom = '20px';
      prompt.style.left = '20px';
      prompt.style.right = '20px';
      prompt.style.padding = '15px';
      prompt.style.background = '#4CAF50';
      prompt.style.color = '#fff';
      prompt.style.fontSize = '16px';
      prompt.style.borderRadius = '8px';
      prompt.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      prompt.style.zIndex = '9999';
      prompt.innerHTML = `
        📱 A faster experience is available in our mobile app.<br>
        <a href="https://your-download-link.com/app.apk" style="color: #fff; text-decoration: underline;">Download Now</a>
      `;

      document.body.appendChild(prompt);

      setTimeout(() => {
        prompt.remove();
      }, 15000); // auto-dismiss after 15 seconds
    }
  });

// 🚀 Initialize
loadMotivation();