
// 🔐 Login handler
async function login() {
  const role = document.getElementById('roleSelect').value;
  const username = document.getElementById('username').value.trim();
  const pin = document.getElementById('pin').value.trim();

  if (!role || !username) {
    try { notify('Please select a role and enter your username.', 'warning'); } catch (e) { alert('Please select a role and enter your username.'); }
    return;
  }

  // For students, check forcepinchange after username entry
  if (role === 'student') {
    const { data, error } = await supabaseClient
      .from('students')
      .select('id, forcepinchange')
      .eq('username', username)
      .single();
    if (error || !data) {
      try { notify('Student not found.', 'error'); } catch (e) { alert('Student not found.'); }
      return;
    }
    if (data.forcepinchange) {
      // Show PIN change modal before login
      showChangePinModal(data.id, username);
      return;
    }
  }

  // Continue with normal login
  if (!pin) {
    try { notify('Please enter your PIN.', 'warning'); } catch (e) { alert('Please enter your PIN.'); }
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
  try { notify('Invalid role selected.', 'error'); } catch (e) { alert('Invalid role selected.'); }
      return;
  }

  const { data, error } = await supabaseClient
    .from(table)
    .select('*')
    .match(query)
    .single();

  if (error || !data) {
    try { notify('Login failed. Please check your credentials.', 'error'); } catch (e) { alert('Login failed. Please check your credentials.'); }
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
      if (data.staff_id) sessionStorage.setItem('teacher_staff_id', data.staff_id);
      window.location.href = 'teacher-dashboard.html';
      break;
    case 'admin':
      localStorage.setItem('adminId', data.id);
      sessionStorage.setItem('adminId', data.id);
      window.location.href = 'admin.html';
      break;
  }
// Show PIN change modal before login if forcepinchange is true
function showChangePinModal(studentId, username) {
  // Create modal if not exists
  let modal = document.getElementById('preLoginChangePinModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'preLoginChangePinModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
      <div style="background:#fff;padding:2rem;border-radius:12px;max-width:350px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,0.15);">
        <h3 style="margin-top:0;color:#003366;">PIN Reset Required</h3>
        <p>Your PIN was reset by admin. Please set a new PIN to continue.</p>
        <form id="preLoginChangePinForm">
          <input type="password" id="newPreLoginPin" placeholder="New PIN" required style="width:100%;margin-bottom:0.7rem;padding:0.7rem;border-radius:8px;border:1.5px solid #e3e8f0;" />
          <input type="password" id="confirmPreLoginPin" placeholder="Confirm New PIN" required style="width:100%;margin-bottom:0.7rem;padding:0.7rem;border-radius:8px;border:1.5px solid #e3e8f0;" />
          <button type="submit" style="width:100%;background:#0074d9;color:#fff;border:none;border-radius:8px;padding:0.8rem;font-size:1.1rem;font-weight:600;">Change PIN</button>
          <div id="preLoginChangePinStatus" style="color:red;margin-top:0.7rem;"></div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'flex';
  const form = document.getElementById('preLoginChangePinForm');
  form.onsubmit = async function(e) {
    e.preventDefault();
    const newPin = document.getElementById('newPreLoginPin').value.trim();
    const confirmPin = document.getElementById('confirmPreLoginPin').value.trim();
    const statusDiv = document.getElementById('preLoginChangePinStatus');
    if (!newPin || !confirmPin) {
      statusDiv.textContent = 'All fields are required.';
      return;
    }
    if (newPin !== confirmPin) {
      statusDiv.textContent = 'PINs do not match.';
      return;
    }
    if (newPin.length < 4 || newPin.length > 8) {
      statusDiv.textContent = 'PIN must be 4-8 digits.';
      return;
    }
    // Update PIN and clear forcepinchange
    const { error } = await supabaseClient
      .from('students')
      .update({ pin: newPin, forcepinchange: false })
      .eq('id', studentId);
    if (error) {
      statusDiv.textContent = 'Failed to change PIN.';
      return;
    }
    statusDiv.style.color = 'green';
    statusDiv.textContent = 'PIN changed! You can now log in.';
    setTimeout(() => {
      modal.style.display = 'none';
    }, 1200);
  };
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