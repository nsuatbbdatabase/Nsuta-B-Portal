// Student breakdown summary for admin dashboard
// Fetches and displays boys, girls, and class counts in a compact, responsive layout

async function renderStudentBreakdownSummary() {
  const container = document.getElementById('studentBreakdownSummary');
  if (!container) return;
  // Fetch all students
  const { data: students, error } = await supabaseClient.from('students').select('gender, class');
  if (error) {
    container.innerHTML = '<div class="error">Failed to load student data.</div>';
    return;
  }
  // Prepare breakdown by class and gender
  const classes = ['JHS 1', 'JHS 2', 'JHS 3'];
  const breakdown = {};
  let grandBoys = 0, grandGirls = 0, grandTotal = 0;
  classes.forEach(cls => breakdown[cls] = { boys: 0, girls: 0, total: 0 });
  students.forEach(s => {
    const cls = classes.includes(s.class) ? s.class : null;
    if (!cls) return;
    const gender = String(s.gender).toLowerCase();
    if (gender === 'male' || gender === 'boy' || gender === 'm') {
      breakdown[cls].boys++;
      grandBoys++;
    } else if (gender === 'female' || gender === 'girl' || gender === 'f') {
      breakdown[cls].girls++;
      grandGirls++;
    }
    breakdown[cls].total++;
    grandTotal++;
  });
  // Build HTML table
  let table = `<table class="student-breakdown-table"><thead><tr><th>Class</th><th>Boys</th><th>Girls</th><th>Total</th></tr></thead><tbody>`;
  classes.forEach(cls => {
    table += `<tr><td>${cls}</td><td>${breakdown[cls].boys}</td><td>${breakdown[cls].girls}</td><td>${breakdown[cls].total}</td></tr>`;
  });
  table += `<tr class="grand-total-row"><td><strong>Grand Total</strong></td><td><strong>${grandBoys}</strong></td><td><strong>${grandGirls}</strong></td><td><strong>${grandTotal}</strong></td></tr>`;
  table += '</tbody></table>';
  container.innerHTML = table;
}
// Call this after DOMContentLoaded
// renderStudentBreakdownSummary();
