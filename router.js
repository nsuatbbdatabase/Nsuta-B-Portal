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