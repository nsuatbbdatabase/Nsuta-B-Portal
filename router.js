// Simple router/session guard for dashboard pages
window.addEventListener('DOMContentLoaded', function() {
  // Debug output for student session keys
  if (window.location.pathname.endsWith('student-dashboard.html')) {
    const debugDiv = document.createElement('div');
    debugDiv.style = 'color:#b00;font-size:0.95em;margin:8px 0;';
    debugDiv.innerText =
  '';
    document.body.prepend(debugDiv);
  }
  const path = window.location.pathname;
  // Map dashboard pages to their required session keys
  const guards = [
    {
      page: 'student-dashboard.html',
      keys: [
        { key: 'studentId', storage: localStorage },
        { key: 'studentId', storage: sessionStorage },
        { key: 'student_username', storage: localStorage },
        { key: 'student_username', storage: sessionStorage }
      ]
    },
    {
      page: 'teacher-dashboard.html',
      keys: [
        { key: 'teacher_staff_id', storage: sessionStorage },
        { key: 'teacherId', storage: localStorage }
      ]
    },
    {
      page: 'admin.html',
      keys: [
        { key: 'adminId', storage: sessionStorage },
        { key: 'adminId', storage: localStorage }
      ]
    },
    {
      page: 'headteacher-dashboard.html',
      keys: [
        { key: 'headteacherId', storage: sessionStorage },
        { key: 'headteacherId', storage: localStorage }
      ]
    }
  ];
  for (const guard of guards) {
    if (path.endsWith(guard.page)) {
      let found = false;
      if (guard.page === 'student-dashboard.html') {
        // Require both studentId and student_username in the same storage
        const localOk = localStorage.getItem('studentId') && localStorage.getItem('student_username');
        const sessionOk = sessionStorage.getItem('studentId') && sessionStorage.getItem('student_username');
        found = localOk || sessionOk;
      } else {
        for (const k of guard.keys) {
          if (k.storage.getItem(k.key)) {
            found = true;
            break;
          }
        }
      }
      if (!found) {
          try { notify('Access denied. Please log in first.', 'error'); } catch (e) { alert('Access denied. Please log in first.'); }
        window.location.href = 'index.html';
        return;
      }
    }
  }
});
// 🔀 Role-based router
function routeUser() {
  const studentId = localStorage.getItem('studentId');
  const teacherId = localStorage.getItem('teacherId');
  const adminId = localStorage.getItem('adminId');

  if (studentId) {
    window.location.href = 'student-dashboard.html';
  } else if (teacherId) {
    window.location.href = 'teacher-dashboard.html';
  } else if (adminId) {
    window.location.href = 'admin.html';
  } else {
    window.location.href = 'login.html';
  }
}

// 🚪 Logout function
function logout() {
  localStorage.removeItem('studentId');
  localStorage.removeItem('teacherId');
  localStorage.removeItem('adminId');
  window.location.href = 'login.html';
}

// 🧭 Protect dashboard access
function protectRoute(role) {
  const id = localStorage.getItem(`${role}Id`);
  if (!id) {
    try { notify('Access denied. Please log in.', 'error'); } catch (e) { alert('Access denied. Please log in.'); }
    window.location.href = 'login.html';
  }
}