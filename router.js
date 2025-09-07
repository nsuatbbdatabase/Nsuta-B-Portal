// Simple router/session guard for dashboard pages
window.addEventListener('DOMContentLoaded', function() {
  const path = window.location.pathname;
  // Map dashboard pages to their required session keys
  const guards = [
    { page: 'student-dashboard.html', key: 'studentId', storage: localStorage },
    { page: 'teacher-dashboard.html', key: 'teacher_staff_id', storage: sessionStorage },
    { page: 'admin.html', key: 'adminId', storage: sessionStorage },
    { page: 'headteacher-dashboard.html', key: 'headteacherId', storage: sessionStorage }
  ];
  for (const guard of guards) {
    if (path.endsWith(guard.page)) {
      const id = guard.storage.getItem(guard.key);
      if (!id) {
        alert('Access denied. Please log in first.');
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
    alert('Access denied. Please log in.');
    window.location.href = 'login.html';
  }
}