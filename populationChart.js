// Chart rendering for admin dashboard
// Assumes Chart.js is loaded in admin.html

async function renderPopulationChart() {
  // Fetch student and teacher counts
  const [{ data: students, error: sErr }, { data: teachers, error: tErr }] = await Promise.all([
    supabaseClient.from('students').select('id'),
    supabaseClient.from('teachers').select('id')
  ]);
  if (sErr || tErr) {
    try { notify('Failed to load population data.', 'error'); } catch (e) { console.error('Failed to load population data.'); }
    return;
  }
  const studentCount = students ? students.length : 0;
  const teacherCount = teachers ? teachers.length : 0;

  // Chart.js config
  const ctx = document.getElementById('populationChart').getContext('2d');
  if (window.populationChartInstance) window.populationChartInstance.destroy();
  window.populationChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Students', 'Teachers'],
      datasets: [{
        data: [studentCount, teacherCount],
        backgroundColor: ['#4e79a7', '#f28e2b'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { font: { size: 14 } }
        },
        title: {
          display: true,
          text: 'Population Overview',
          font: { size: 18 }
        }
      },
      cutout: '65%',
      layout: { padding: 10 }
    }
  });
}

// Call this after DOMContentLoaded and after Chart.js is loaded
// renderPopulationChart();
