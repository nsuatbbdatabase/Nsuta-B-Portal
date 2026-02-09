// Admin initialization: wire up DOMContentLoaded tasks that call rendering helpers
document.addEventListener('DOMContentLoaded', function() {
  const runInit = function() {
    try { if (typeof renderTeacherBreakdownSummary === 'function') renderTeacherBreakdownSummary(); } catch (e) {}
    try { if (typeof renderDuplicateStudentsWarning === 'function') renderDuplicateStudentsWarning(); } catch (e) {}
    // Student breakdown preview is rendered when Overview is shown to keep it exclusive to Overview
    try { if (typeof renderPopulationChart === 'function') renderPopulationChart(); } catch (e) {}
    try { if (typeof loadStudents === 'function') loadStudents(); } catch (e) {}
    try { if (typeof loadTeachers === 'function') loadTeachers(); } catch (e) {}
    try { if (typeof loadAdmins === 'function') loadAdmins(); } catch (e) {}

    // Logout wiring
    try {
      var lb = document.getElementById('logoutBtn');
      if (lb) lb.addEventListener('click', function() { sessionStorage.clear(); localStorage.clear(); window.location.href = 'index.html'; });
    } catch (e) {}
  };

  if (typeof window.waitForSupabase === 'function') {
    window.waitForSupabase().then(() => runInit()).catch((err) => {
      console.warn('admin-init: supabase not ready, continuing safely:', err && err.message ? err.message : err);
      runInit();
    });
  } else if (window.supabaseClient) {
    runInit();
  } else {
    document.addEventListener('supabase:ready', function(){ runInit(); }, { once: true });
    // Fallback: runInit after a short delay so UI still initializes if helper not present
    setTimeout(() => { if (!window.supabaseClient) runInit(); }, 1500);
  }
});
