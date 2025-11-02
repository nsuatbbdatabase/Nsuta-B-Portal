
// Hide all sections except overview on load, and show only one section at a time
window.addEventListener('DOMContentLoaded', function() {
  // Dynamically collect all section elements with an id inside <main> so every dashboard panel
  // (including 'students', 'teachers', 'studentBreakdown', 'dashboardOverview', etc.) is handled
  const sectionEls = Array.from(document.querySelectorAll('main section[id]'));
  const sectionIds = sectionEls.map(s => s.id).filter(Boolean);
  const overview = document.getElementById('dashboardOverview');
  // Hide all sections except overview
  sectionIds.forEach(id => {
    const sec = document.getElementById(id);
    if (sec) sec.style.display = 'none';
  });
  if (overview) overview.style.display = 'grid';

  // Show section and hide others/overview
  function showSection(id) {
    // If asked to show the overview, delegate to the dedicated showOverview() function
    if (id === 'dashboardOverview') {
      try { showOverview(); } catch (e) { /* if showOverview not available, continue */ }
      return;
    }
    // If the requested id exists as a dashboard-section, show it and hide others
    var found = false;
    sectionIds.forEach(secId => {
      const sec = document.getElementById(secId);
      if (!sec) return;
      if (secId === id) { sec.style.display = 'block'; found = true; }
      else sec.style.display = 'none';
    });
    // If id wasn't in the known list but an element with that id exists, show it and hide other sections
    if (!found) {
      const target = document.getElementById(id);
      if (target) {
        // hide all known sections
        sectionIds.forEach(secId => { const s = document.getElementById(secId); if (s) s.style.display = 'none'; });
        target.style.display = 'block';
      }
    }
  // Only hide the overview when we're showing a different section
  if (overview && id !== 'dashboardOverview') overview.style.display = 'none';
  // Persist current admin section so refresh restores it (use localStorage for cross-tab persistence)
  try { localStorage.setItem('adminCurrentSection', String(id)); } catch (e) { /* ignore storage errors */ }
    // mark body to indicate a section is open (used for visual focus)
    if (typeof document !== 'undefined') {
      // Only mark the page as 'section-open' when a non-overview section is shown.
      if (id !== 'dashboardOverview') {
        document.body.classList.add('section-open');
        document.body.setAttribute('data-section-open', '1');
      } else {
        // Ensure any open-section state is cleared when showing the overview
        document.body.classList.remove('section-open');
        document.body.removeAttribute('data-section-open');
        // remove active-section classes when returning to overview
        try { document.querySelectorAll('.dashboard-section').forEach(function(s){ s.classList.remove('active-section'); }); } catch(e) {}
      }
      // add active-section to the currently shown panel for "card-as-page" styling
      try {
        document.querySelectorAll('.dashboard-section').forEach(function(s){ s.classList.remove('active-section'); });
        var targetEl = document.getElementById(id);
        if (targetEl) targetEl.classList.add('active-section');
      } catch(e) { /* ignore */ }
      // JS fallback: hide overview UI inline when on desktop to avoid CSS specificity/caching issues
      if (window.matchMedia && window.matchMedia('(min-width: 901px)').matches) {
        document.querySelectorAll('.admin-toolbar, .recent-activity-section, .dashboard-cards-bg, .dashboard-overview-section').forEach(function(el){ if(el) el.style.display = 'none'; });
      }
    }
  }

  // Add a mobile hamburger toggle to open/close the sidebar on small screens
  (function ensureSidebarToggle() {
    try {
      var header = document.querySelector('.dashboard-header');
      if (!header) return;
      if (document.getElementById('sidebarToggleBtn')) return; // already present
      var btn = document.createElement('button');
      btn.id = 'sidebarToggleBtn';
      btn.type = 'button';
      btn.title = 'Open navigation';
      btn.setAttribute('aria-label', 'Open navigation');
      btn.innerHTML = '<span aria-hidden="true">☰</span>';
      // Insert at start of header for easy reach
      header.insertBefore(btn, header.firstChild);
      btn.addEventListener('click', function(e) {
        var sb = document.querySelector('.sidebar');
        if (!sb) return;
        var willOpen = !sb.classList.contains('open');
        // show overlay when opening on mobile
        var overlay = document.getElementById('sidebarOverlay');
        if (overlay) overlay.style.display = willOpen ? 'block' : 'none';
        if (willOpen) sb.classList.add('open'); else sb.classList.remove('open');
        // ensure focus goes to first sidebar item for keyboard users
        if (sb.classList.contains('open')) {
          var first = sb.querySelector('.sidebar-item');
          if (first && typeof first.focus === 'function') first.focus();
        }
      });
    } catch (e) { /* non-fatal */ }
  })();

  // Create an overlay element for mobile sidebar and wire interactions
  (function ensureSidebarOverlay() {
    try {
      if (document.getElementById('sidebarOverlay')) return;
      var overlay = document.createElement('div');
      overlay.id = 'sidebarOverlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.background = 'rgba(0,0,0,0.35)';
      overlay.style.zIndex = '1000';
      overlay.style.display = 'none';
      overlay.setAttribute('aria-hidden', 'true');
      document.body.appendChild(overlay);

      function showOverlay(show) {
        var sb = document.querySelector('.sidebar');
        if (show) {
          overlay.style.display = 'block';
          try { overlay.setAttribute('aria-hidden', 'false'); } catch(e){}
          if (sb) sb.classList.add('open');
        } else {
          overlay.style.display = 'none';
          try { overlay.setAttribute('aria-hidden', 'true'); } catch(e){}
          if (sb) sb.classList.remove('open');
        }
      }

      // Toggle via the existing sidebarToggleBtn
      var toggle = document.getElementById('sidebarToggleBtn');
      if (toggle) {
        toggle.addEventListener('click', function() {
          var sb = document.querySelector('.sidebar');
          if (!sb) return;
          var willOpen = !sb.classList.contains('open');
          showOverlay(willOpen);
        });
      }

      // Clicking overlay closes sidebar
      overlay.addEventListener('click', function() { showOverlay(false); });

      // Close sidebar when any sidebar item is clicked (mobile behavior)
      document.addEventListener('click', function(e) {
        var item = e.target.closest && e.target.closest('.sidebar-item');
        var sb = document.querySelector('.sidebar');
        if (item && sb && window.matchMedia('(max-width: 900px)').matches) {
          // set active item
          try {
            document.querySelectorAll('.sidebar-item').forEach(function(i){ i.classList.remove('active'); });
            item.classList.add('active');
          } catch(e){}
          showOverlay(false);
        }
      });

      // Close overlay/sidebar on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') showOverlay(false);
      });

      // Ensure sidebar is hidden if viewport expands beyond mobile
      window.addEventListener('resize', function() {
        if (window.matchMedia('(min-width: 901px)').matches) {
          showOverlay(false);
        }
      });
    } catch (e) { /* ignore overlay creation errors */ }
  })();

  // Sidebar collapse/expand toggle (persistent)
  (function ensureSidebarCollapse() {
    try {
      var sb = document.querySelector('.sidebar');
      if (!sb) return;
      // create control area if not present
      var controls = sb.querySelector('.sidebar-controls');
      if (!controls) {
        controls = document.createElement('div');
        controls.className = 'sidebar-controls';
        sb.appendChild(controls);
      }
      if (document.getElementById('sidebarCollapseBtn')) return;
      var cbtn = document.createElement('button');
      cbtn.id = 'sidebarCollapseBtn';
      cbtn.type = 'button';
      cbtn.title = 'Collapse sidebar';
      cbtn.setAttribute('aria-label', 'Collapse sidebar');
      cbtn.innerHTML = '<span aria-hidden="true">◀</span>';
      controls.appendChild(cbtn);

      function setCollapsed(collapsed) {
        try { localStorage.setItem('adminSidebarCollapsed', collapsed ? '1' : '0'); } catch(e) {}
        if (collapsed) sb.classList.add('collapsed'); else sb.classList.remove('collapsed');
        // update button icon
        cbtn.innerHTML = collapsed ? '<span aria-hidden="true">▶</span>' : '<span aria-hidden="true">◀</span>';
        cbtn.title = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
      }

      cbtn.addEventListener('click', function() {
        var collapsed = sb.classList.contains('collapsed');
        setCollapsed(!collapsed);
      });

      // restore persisted state
      try {
        var ps = localStorage.getItem('adminSidebarCollapsed');
        if (ps === '1') setCollapsed(true); else setCollapsed(false);
      } catch(e) { /* ignore */ }
      // keyboard shortcut: press 'b' to toggle sidebar collapse when focused in body
      document.addEventListener('keydown', function(e){
        if (e.key === 'b' && (document.activeElement === document.body || document.activeElement === document.documentElement)) {
          setCollapsed(!sb.classList.contains('collapsed'));
        }
      });
    } catch (e) { /* ignore */ }
  })();

  // Show overview, hide all sections
  function showOverview() {
    sectionIds.forEach(secId => {
      const sec = document.getElementById(secId);
      if (sec) sec.style.display = 'none';
    });
    if (overview) overview.style.display = 'grid';
  // Clear any persisted section on returning to overview
  try { localStorage.removeItem('adminCurrentSection'); } catch (e) { /* ignore */ }
    if (typeof document !== 'undefined') {
      document.body.classList.remove('section-open');
      document.body.removeAttribute('data-section-open');
      // remove active-section from any panels
      try { document.querySelectorAll('.dashboard-section').forEach(function(s){ s.classList.remove('active-section'); }); } catch(e) {}
      // restore inline styles removed by JS fallback
      document.querySelectorAll('.admin-toolbar, .recent-activity-section, .dashboard-cards-bg, .dashboard-overview-section').forEach(function(el){ if(el) el.style.display = ''; });
    }
    // Trigger student breakdown render for the overview preview (if those renderers exist)
    if (typeof renderStudentBreakdownSummary === 'function') {
      try { renderStudentBreakdownSummary(); } catch(e){ console.warn('renderStudentBreakdownSummary failed', e); }
    }
    if (typeof renderStudentBreakdownChart === 'function') {
      try { renderStudentBreakdownChart(); } catch(e){ console.warn('renderStudentBreakdownChart failed', e); }
    }
  }

  // expose to global so other inline handlers can call them
  window.showSection = showSection;
  window.showOverview = showOverview;

  // Add click handlers to overview cards
  document.querySelectorAll('.dashboard-card').forEach(card => {
    card.addEventListener('click', function() {
      // prefer explicit data-section, but fall back to data-action='section:ID'
      var section = this.getAttribute('data-section');
      if (!section) {
        var act = this.getAttribute('data-action');
        if (act && act.indexOf('section:') === 0) section = act.split(':').slice(1).join(':');
      }
      if (!section) return;
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

  // Add 'Back to Overview' buttons only on mobile (<=900px). Also ensure Reports has a
  // 'Back to Main Dashboard' button on all viewports (user requested explicit button for reports)
  function renderBackButtons() {
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    sectionIds.forEach(id => {
      const sec = document.getElementById(id);
      if (!sec) return;
      // remove any existing mobile-only back button first
      const existing = sec.querySelector('.back-to-overview[data-mobile]');
      if (existing) existing.remove();
      if (isMobile) {
        const btn = document.createElement('button');
        btn.textContent = '← Back to Overview';
        btn.className = 'back-to-dashboard back-to-overview';
        btn.setAttribute('data-mobile','1');
        btn.style.marginBottom = '1.2rem';
        btn.addEventListener('click', showOverview);
        sec.insertBefore(btn, sec.firstChild);
      }
      // Ensure Reports always has a 'Back to Main Dashboard' button (desktop + mobile)
      if (id === 'reports' && !sec.querySelector('.back-to-main-dashboard')) {
        const rbtn = document.createElement('button');
        rbtn.textContent = 'Back to Main Dashboard';
        rbtn.className = 'back-to-dashboard back-to-main-dashboard';
        rbtn.style.marginBottom = '1.2rem';
        rbtn.addEventListener('click', showOverview);
        sec.insertBefore(rbtn, sec.firstChild);
      }
    });
  }

  // initial render and re-render on resize
  renderBackButtons();
  window.addEventListener('resize', function(){ renderBackButtons(); });

  // Optionally, show first section by default (or keep all hidden)
  // showSection('reports');
  // Restore persisted section (if any) so refresh keeps user in the active panel.
  try {
    const persisted = localStorage.getItem('adminCurrentSection');
    if (persisted && document.getElementById(persisted)) {
      try { showSection(persisted); } catch(e) { console.warn('showSection restore failed', e); showOverview(); }
    } else {
      // Ensure Overview is visible on initial load (admin homepage should show overview)
      if (overview) { try { showOverview(); } catch(e) { console.warn('showOverview bootstrap failed', e); } }
    }
  } catch (e) {
    if (overview) { try { showOverview(); } catch(e) { console.warn('showOverview bootstrap failed', e); } }
  }
});
