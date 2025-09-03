// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
);

// 🔢 Grade point logic
function getGradePoint(score) {
  if (score >= 90) return 1;
  if (score >= 80) return 2;
  if (score >= 70) return 3;
  if (score >= 60) return 4;
  if (score >= 55) return 5;
  if (score >= 50) return 6;
  if (score >= 40) return 7;
  if (score >= 35) return 8;
  return 9;
}

// 💬 Subject remark logic
function getSubjectRemark(point) {
  switch (point) {
    case 1: return "Outstanding";
    case 2: return "Excellent";
    case 3: return "Very Good";
    case 4: return "Good";
    case 5: return "Fair";
    case 6: return "Pass";
    case 7: return "Weak";
    case 8: return "Poor";
    default: return "Fail";
  }
}

// 🧠 Teacher remark logic
function getTeacherRemark(totalScore) {
  if (totalScore >= 800) return "IMPRESSIVE PERFORMANCE. KEEP IT UP";
  if (totalScore >= 750) return "EXCELLENT. KEEP WORKING HARD";
  if (totalScore >= 700) return "VERY GOOD RESULTS. BUT CAPABLE OF MAKING FURTHER PROGRESS";
  if (totalScore >= 650) return "PROGRESSING SATISFACTORILY. CAN STILL DO BETTER";
  if (totalScore >= 600) return "GOOD WORK. MORE ROOM FOR IMPROVEMENT";
  if (totalScore >= 500) return "AVERAGE PERFORMANCE";
  if (totalScore >= 450) return "MUST WORK HARD";
  if (totalScore >= 400) return "BELOW AVERAGE. MUST BUCK UP";
  return "BELOW AVERAGE. MUST PAY ATTENTION IN CLASS";
}

// 🔽 Populate student dropdown
async function populateStudentDropdown() {
  const { data, error } = await supabaseClient.from('students').select('id, full_name, class, picture_url');
  const select = document.getElementById('studentSelect');
  if (error) return console.error('Failed to load students:', error.message);

  data.forEach(student => {
    const option = document.createElement('option');
    option.value = student.id;
    option.textContent = student.full_name;
    option.dataset.class = student.class;
    option.dataset.picture = student.picture_url || '';
    select.appendChild(option);
  });
}

// 📊 Load report for selected student
async function loadReportForStudent() {
  const select = document.getElementById('studentSelect');
  const studentId = select.value;
  const studentName = select.options[select.selectedIndex].textContent;
  const studentClass = select.options[select.selectedIndex].dataset.class;
  const studentPhoto = select.options[select.selectedIndex].dataset.picture;

  if (!studentId) return;

  // 🖼️ Load student photo
  document.getElementById("studentPhoto").src = studentPhoto || "placeholder.png";

  // 📦 Fetch results
  const { data: results, error: resultError } = await supabaseClient
    .from('results')
    .select('*')
    .eq('student_id', studentId);

  if (resultError) return console.error('Failed to load results:', resultError.message);

  // 📦 Fetch interest/conduct/attendance
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('interest, conduct, attendance_total, attendance_actual')
    .eq('student_id', studentId)
    .single();

  if (profileError) console.warn('No interest/conduct data found.');

  // 🧾 Populate student info
  document.getElementById("studentName").textContent = studentName;
  document.getElementById("studentClass").textContent = studentClass;
  document.getElementById("term").textContent = results[0]?.term || "—";
  document.getElementById("year").textContent = results[0]?.year || "—";
  document.getElementById("position").textContent = "—";

  // 📅 Attendance
  document.getElementById("totalAttendance").textContent = profile?.attendance_total ?? "—";
  document.getElementById("actualAttendance").textContent = profile?.attendance_actual ?? "—";

  // 🎭 Interest & Conduct
  document.getElementById("studentInterest").textContent = profile?.interest ?? "—";
  document.getElementById("studentConduct").textContent = profile?.conduct ?? "—";

  // 📊 Score Table
  const tbody = document.getElementById("scoreBody");
  tbody.innerHTML = "";
  let totalScore = 0;

  const subjects = [
    "English", "Mathematics", "Science", "RME",
    "Social Studies", "Computing", "Career Tech",
    "Creative Arts", "Twi"
  ];

  subjects.forEach(subject => {
    const entry = results.find(r => r.subject === subject);
    const classScore = entry?.class_score || 0;
    const examScore = entry?.exam_score || 0;
    const total = classScore + examScore;
    const point = getGradePoint(total);
    const remark = getSubjectRemark(point);
    totalScore += total;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${subject}</td>
      <td>${classScore}</td>
      <td>${examScore}</td>
      <td>${total}</td>
      <td>${point}</td>
      <td>${remark}</td>
    `;
    tbody.appendChild(row);
  });

  const average = (totalScore / subjects.length).toFixed(2);
  const teacherRemark = getTeacherRemark(totalScore);

  document.getElementById("totalScore").textContent = totalScore;
  document.getElementById("averageScore").textContent = average;
  document.getElementById("teacherRemark").textContent = teacherRemark;
}

// 🚀 Initialize
populateStudentDropdown();