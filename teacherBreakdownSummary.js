// Teacher breakdown summary for admin dashboard
// Shows number of male, female, and total teachers

async function renderTeacherBreakdownSummary() {
  const container = document.getElementById('teacherBreakdownSummary');
  if (!container) return;
  // Fetch all teachers
  const { data: teachers, error } = await supabaseClient.from('teachers').select('gender');
  if (error) {
    container.innerHTML = '<div class="error">Failed to load teacher data.</div>';
    return;
  }
  let males = 0, females = 0, total = 0;
  teachers.forEach(t => {
    const gender = String(t.gender).toLowerCase();
    if (gender === 'male' || gender === 'm' || gender === 'man') males++;
    else if (gender === 'female' || gender === 'f' || gender === 'woman') females++;
    total++;
  });
  container.innerHTML = `
    <div class="teacher-breakdown-cards">
      <div class="teacher-breakdown-card males"><span>Male Teachers</span><strong>${males}</strong></div>
      <div class="teacher-breakdown-card females"><span>Female Teachers</span><strong>${females}</strong></div>
      <div class="teacher-breakdown-card total"><span>Total</span><strong>${total}</strong></div>
    </div>
  `;
}
// Call this after DOMContentLoaded
// renderTeacherBreakdownSummary();
