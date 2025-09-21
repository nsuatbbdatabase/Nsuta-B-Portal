
// Hide all sections except overview on load, and show only one section at a time
window.addEventListener('DOMContentLoaded', function() {
  const sectionIds = ['reports', 'schoolDatesSection', 'students', 'teachers', 'admins', 'interestConduct', 'interestUpdate'];
  const overview = document.getElementById('dashboardOverview');
  // Hide all sections except overview
  sectionIds.forEach(id => {
    const sec = document.getElementById(id);
    if (sec) sec.style.display = 'none';
  });
  if (overview) overview.style.display = 'grid';

  // Show section and hide others/overview
  function showSection(id) {
    sectionIds.forEach(secId => {
      const sec = document.getElementById(secId);
      if (sec) sec.style.display = (secId === id) ? 'block' : 'none';
    });
    if (overview) overview.style.display = 'none';
  }

  // Show overview, hide all sections
  function showOverview() {
    sectionIds.forEach(secId => {
      const sec = document.getElementById(secId);
      if (sec) sec.style.display = 'none';
    });
    if (overview) overview.style.display = 'grid';
  }

  // Add click handlers to overview cards
  document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('click', function() {
      const section = this.getAttribute('data-section');
      if (section === 'interestConduct') {
        window.location.href = 'interest-conduct.html';
        return;
      }
      if (section === 'interestUpdate') {
        window.location.href = 'dashboard.html';
        return;
      }
      showSection(section);
    });
  });

  // Add click handlers to nav links (if present)
  document.querySelectorAll('.dashboard-nav a').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const hash = this.getAttribute('href').replace('#', '');
      showSection(hash);
    });
  });

  // Add 'Back to Overview' buttons to each section if not present
  sectionIds.forEach(id => {
    const sec = document.getElementById(id);
    if (sec && !sec.querySelector('.back-to-overview')) {
      const btn = document.createElement('button');
      btn.textContent = '← Back to Overview';
      btn.className = 'back-to-dashboard back-to-overview';
      btn.style.marginBottom = '1.2rem';
      btn.addEventListener('click', showOverview);
      sec.insertBefore(btn, sec.firstChild);
    }
  });

  // Optionally, show first section by default (or keep all hidden)
  // showSection('reports');
});
