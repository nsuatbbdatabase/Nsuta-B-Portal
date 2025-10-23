// Admin initialization: wire up DOMContentLoaded tasks that call rendering helpers
document.addEventListener('DOMContentLoaded', function() {
  if (typeof renderTeacherBreakdownSummary === 'function') renderTeacherBreakdownSummary();
  if (typeof renderDuplicateStudentsWarning === 'function') renderDuplicateStudentsWarning();
  // Student breakdown preview is rendered when Overview is shown to keep it exclusive to Overview
  if (typeof renderPopulationChart === 'function') renderPopulationChart();
  if (typeof loadStudents === 'function') loadStudents();
  if (typeof loadTeachers === 'function') loadTeachers();
  if (typeof loadAdmins === 'function') loadAdmins();

  // Logout wiring
  var lb = document.getElementById('logoutBtn');
  if (lb) lb.addEventListener('click', function() { sessionStorage.clear(); localStorage.clear(); window.location.href = 'index.html'; });
});
