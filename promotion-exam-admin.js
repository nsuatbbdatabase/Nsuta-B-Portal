// Promotion Exam Admin JS
// Loads submitted promotion exam entries for admin review

// Supabase client initialization
const supabaseUrl = 'https://omhmahhfeduejykrxflx.supabase.co'; // <-- Replace with your Supabase URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'; // <-- Replace with your Supabase anon/public key
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function loadPromotionExamEntries() {
  const classElem = document.getElementById('promotionClassSelect');
  const subjectElem = document.getElementById('promotionSubjectSelect');
  const termElem = document.getElementById('promotionTermSelect');
  const yearElem = document.getElementById('promotionYearInput');
  const tbody = document.getElementById('promotionExamTableBody');
  if (!classElem || !subjectElem || !termElem || !yearElem || !tbody) {
    // If any element is missing, do nothing
    return;
  }
  const classVal = classElem.value;
  const subjectVal = subjectElem.value;
  const termVal = termElem.value;
  const yearVal = yearElem.value.trim();
  tbody.innerHTML = '';
  if (!yearVal) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:red;">Please select academic year to view scores.</td></tr>';
    return;
  }
  let query = supabaseClient.from('promotion_exams').select('student_id, class, subject, term, year, score, marked_by, students(first_name, surname), teachers(name)');
  if (classVal) query = query.eq('class', classVal);
  if (subjectVal) query = query.eq('subject', subjectVal);
  if (termVal) query = query.eq('term', termVal);
  if (yearVal) query = query.eq('year', yearVal);
  query = query.eq('submitted_to_admin', true);
  const { data, error } = await query;
  if (error) {
    tbody.innerHTML = '<tr><td colspan="9" style="color:red;">Error loading promotion exam entries.</td></tr>';
    return;
  }
  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9">No promotion exam entries found.</td></tr>';
    return;
  }
  // Calculate total scores per student
  const totalScores = {};
  data.forEach(entry => {
    if (!totalScores[entry.student_id]) totalScores[entry.student_id] = 0;
    totalScores[entry.student_id] += entry.score;
  });

  // Get pass mark
  const passMarkInput = document.getElementById('passMarkInput');
  const passMark = passMarkInput ? parseInt(passMarkInput.value, 10) : 0;

  data.forEach(entry => {
    const studentName = entry.students ? `${entry.students.first_name || ''} ${entry.students.surname || ''}`.trim() : entry.student_id;
    const teacherName = entry.teachers ? entry.teachers.name : entry.marked_by;
    const totalScore = totalScores[entry.student_id];
    const status = totalScore >= passMark ? '<span style="color:green;font-weight:bold;">Passed</span>' : '<span style="color:red;font-weight:bold;">Failed</span>';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${studentName}</td>
      <td>${entry.class}</td>
      <td>${entry.subject}</td>
      <td>${entry.score}</td>
      <td>${totalScore}</td>
      <td>${status}</td>
      <td>${entry.term}</td>
      <td>${entry.year}</td>
      <td>${teacherName}</td>
    `;
    tbody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  const classSelect = document.getElementById('promotionClassSelect');
  if (classSelect) classSelect.addEventListener('change', loadPromotionExamEntries);
  const subjectSelect = document.getElementById('promotionSubjectSelect');
  if (subjectSelect) subjectSelect.addEventListener('change', loadPromotionExamEntries);
  const termSelect = document.getElementById('promotionTermSelect');
  if (termSelect) termSelect.addEventListener('change', loadPromotionExamEntries);
  const yearInput = document.getElementById('promotionYearInput');
  if (yearInput) yearInput.addEventListener('input', loadPromotionExamEntries);
  const passMarkInput = document.getElementById('passMarkInput');
  if (passMarkInput) passMarkInput.addEventListener('input', loadPromotionExamEntries);
  loadPromotionExamEntries();
});
