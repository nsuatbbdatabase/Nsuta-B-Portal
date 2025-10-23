// Chart rendering for student population breakdown by gender and class
// Assumes Chart.js is loaded in admin.html

async function renderStudentBreakdownChart() {
  // Fetch all students
  // show loader in overview if present
  function showLoader(parentId) {
    const parent = document.getElementById(parentId);
    if (!parent) return null;
    let l = parent.querySelector('.chart-loader');
    if (!l) { l = document.createElement('span'); l.className = 'chart-loader'; parent.insertBefore(l, parent.firstChild); }
    return l;
  }
  const overviewLoader = showLoader('studentBreakdownOverview') || showLoader('dashboardOverview');
  try {
    const { data: students, error } = await supabaseClient.from('students').select('gender, class');
    if (error) {
      try { notify('Failed to load student data.', 'error'); } catch (e) { console.error('Failed to load student data.', e); }
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

  // Ensure we render into the Overview container if present, otherwise fallback to section canvases.
  function ensureCanvas(id, containerIds) {
    let el = document.getElementById(id);
    if (el) return el;
    // try to find a preferred container to attach the canvas
    for (const cid of containerIds) {
      const parent = document.getElementById(cid);
      if (parent) {
        el = document.createElement('canvas');
        el.id = id;
        el.style.width = '100%';
        el.style.height = '220px';
        parent.appendChild(el);
        return el;
      }
    }
    return null;
  }

  const genderCanvas = ensureCanvas('studentGenderChartOverview', ['studentBreakdownOverview','dashboardOverview','studentBreakdown']);
  const genderEl = genderCanvas || document.getElementById('studentGenderChart');
  if (!genderEl) {
    console.warn('No target element found for studentGenderChart');
  }
  const genderCtx = genderEl && genderEl.getContext ? genderEl.getContext('2d') : null;
  if (window.studentGenderChartInstance) window.studentGenderChartInstance.destroy();
  if (genderCtx) {
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
  }

  // Render class chart (same overview-first strategy)
  const classCanvas = ensureCanvas('studentClassChartOverview', ['studentBreakdownOverview','dashboardOverview','studentBreakdown']);
  const classEl = classCanvas || document.getElementById('studentClassChart');
  const classCtx = classEl && classEl.getContext ? classEl.getContext('2d') : null;
  if (classCtx && window.studentClassChartInstance) window.studentClassChartInstance.destroy();
  if (classCtx) {
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
  } finally {
    // hide loader
    try { if (overviewLoader && overviewLoader.parentNode) overviewLoader.parentNode.removeChild(overviewLoader); } catch(e){}
  }
}

// Call this after DOMContentLoaded and after Chart.js is loaded
// renderStudentBreakdownChart();
