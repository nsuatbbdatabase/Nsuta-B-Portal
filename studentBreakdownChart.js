// Chart rendering for student population breakdown by gender and class
// Assumes Chart.js is loaded in admin.html

async function renderStudentBreakdownChart() {
  // Fetch all students
  const { data: students, error } = await supabaseClient.from('students').select('gender, class');
  if (error) {
    alert('Failed to load student data.');
    return;
  }
  // Gender counts
  let boys = 0, girls = 0;
  const classCounts = {};
  students.forEach(s => {
    if (String(s.gender).toLowerCase() === 'male' || String(s.gender).toLowerCase() === 'boy' || String(s.gender).toLowerCase() === 'm') boys++;
    else if (String(s.gender).toLowerCase() === 'female' || String(s.gender).toLowerCase() === 'girl' || String(s.gender).toLowerCase() === 'f') girls++;
    // Count by class
    if (s.class) {
      classCounts[s.class] = (classCounts[s.class] || 0) + 1;
    }
  });
  // Prepare data
  const genderData = [boys, girls];
  const classLabels = Object.keys(classCounts);
  const classData = classLabels.map(cls => classCounts[cls]);

  // Render gender chart
  const genderCtx = document.getElementById('studentGenderChart').getContext('2d');
  if (window.studentGenderChartInstance) window.studentGenderChartInstance.destroy();
  window.studentGenderChartInstance = new Chart(genderCtx, {
    type: 'doughnut',
    data: {
      labels: ['Boys', 'Girls'],
      datasets: [{
        data: genderData,
        backgroundColor: ['#4e79a7', '#f28e2b'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 14 } } },
        title: { display: true, text: 'Student Gender', font: { size: 16 } }
      },
      cutout: '65%',
      layout: { padding: 10 }
    }
  });

  // Render class chart
  const classCtx = document.getElementById('studentClassChart').getContext('2d');
  if (window.studentClassChartInstance) window.studentClassChartInstance.destroy();
  window.studentClassChartInstance = new Chart(classCtx, {
    type: 'bar',
    data: {
      labels: classLabels,
      datasets: [{
        label: 'Students per Class',
        data: classData,
        backgroundColor: '#59a14f',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Class Distribution', font: { size: 16 } }
      },
      scales: {
        x: { ticks: { font: { size: 13 } } },
        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 13 } } }
      },
      layout: { padding: 10 }
    }
  });
}

// Call this after DOMContentLoaded and after Chart.js is loaded
// renderStudentBreakdownChart();
