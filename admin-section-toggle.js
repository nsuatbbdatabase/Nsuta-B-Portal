
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
    if (overview) overview.style.display = 'none';
    // mark body to indicate a section is open (used for visual focus)
    if (typeof document !== 'undefined') {
      document.body.classList.add('section-open');
      document.body.setAttribute('data-section-open', '1');
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

  // Show overview, hide all sections
  function showOverview() {
    sectionIds.forEach(secId => {
      const sec = document.getElementById(secId);
      if (sec) sec.style.display = 'none';
    });
    if (overview) overview.style.display = 'grid';
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
      // Previously these sections redirected to separate pages; keep behavior consistent
      // and open them in the section modal so admins get a live interactive view.
      // Open the target section inside an overlay modal by MOVING the original section DOM
      // This preserves IDs and event handlers so the content remains fully interactive inside the modal.
      function openSectionInModal(sectionId) {
        const src = document.getElementById(sectionId);
        const modal = document.getElementById('sectionModal');
        const body = document.getElementById('sectionModalBody');
        const title = document.getElementById('sectionModalTitle');
        if (!src || !modal || !body) {
          // If the section doesn't exist on this page, prefer navigating to the
          // section's canonical dashboard page (as defined in sample.html).
          // Fall back to sample.html#<sectionId> if no direct page is known.
          try {
            var sectionToPageMap = {
              'interestConduct': 'interest-conduct.html',
              'interestUpdate': 'dashboard.html'
            };
            if (sectionToPageMap[sectionId]) {
              window.location.href = sectionToPageMap[sectionId];
              return;
            }
            window.location.href = 'sample.html#' + encodeURIComponent(sectionId);
            return;
          } catch (e) {
            return showSection(sectionId);
          }
        }
        // Ensure global state map exists
        window._movedSectionState = window._movedSectionState || {};
        // If already moved, just open modal
        if (window._movedSectionState[sectionId] && window._movedSectionState[sectionId].moved) {
          if (typeof showModalById === 'function') { try { showModalById('sectionModal'); } catch(e){} }
          else if (typeof openModal === 'function') { try { openModal('sectionModal'); } catch(e){} }
          else { modal.classList.remove('hidden'); modal.style.display = 'flex'; }
          return;
        }
        // Use the section's heading as modal title if available
        const h = src.querySelector('h2');
        if (h && h.textContent) title.textContent = h.textContent;
        else title.textContent = sectionId;
        // Insert a placeholder where the section currently is so we can restore later
        const placeholder = document.createElement('div');
        placeholder.setAttribute('data-section-placeholder', sectionId);
        placeholder.style.display = 'none';
        src.parentNode.insertBefore(placeholder, src);
        // Move the original section node into the modal body
        body.appendChild(src);
        // record state for restore
        window._movedSectionState[sectionId] = { moved: true, placeholder: placeholder };
        // Open the modal (prefer helper)
        if (typeof showModalById === 'function') { try { showModalById('sectionModal'); } catch(e){} }
        else if (typeof openModal === 'function') { try { openModal('sectionModal'); } catch(e){} }
        else { modal.classList.remove('hidden'); modal.style.display = 'flex'; }
        // focus first control in the moved section
        try { const first = src.querySelector('input,select,textarea,button,a'); if (first) first.focus(); } catch(e){}
      }

      openSectionInModal(section);
    });
  });

  // Restore moved section back to its placeholder when the section modal is closed.
  function restoreMovedSectionIfAny() {
    try {
      if (!window._movedSectionState) return;
      const modalBody = document.getElementById('sectionModalBody');
      Object.keys(window._movedSectionState).forEach(sectionId => {
        const state = window._movedSectionState[sectionId];
        if (!state || !state.moved) return;
        const srcEl = document.getElementById(sectionId);
        if (!srcEl) return;
        const placeholder = state.placeholder;
        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.insertBefore(srcEl, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        } else {
          // fallback: append to main
          const main = document.querySelector('main');
          if (main) main.appendChild(srcEl);
        }
        delete window._movedSectionState[sectionId];
      });
      // reset modal body and title
      const body = document.getElementById('sectionModalBody'); if (body) body.innerHTML = '';
      const title = document.getElementById('sectionModalTitle'); if (title) title.textContent = 'Section';
    } catch (e) { console.warn('restoreMovedSectionIfAny failed', e); }
  }

  // Hook into modal-close clicks to restore moved section
  document.addEventListener('click', function(e){
    const closeBtn = e.target.closest('.modal-close');
    if (!closeBtn) return;
    const panel = closeBtn.closest('[id]');
    if (panel && panel.id === 'sectionModal') {
      setTimeout(restoreMovedSectionIfAny, 40);
    }
  });

  // MutationObserver fallback: detect when sectionModal becomes hidden (class change) and restore
  (function(){
    const modal = document.getElementById('sectionModal');
    if (!modal || typeof MutationObserver === 'undefined') return;
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          if (modal.classList.contains('hidden')) {
            restoreMovedSectionIfAny();
          }
        }
      }
    });
    mo.observe(modal, { attributes: true, attributeFilter: ['class'] });
  })();

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
  // Ensure Overview is visible on initial load (admin homepage should show overview)
  if (overview) {
    try { showOverview(); } catch(e) { console.warn('showOverview bootstrap failed', e); }
  }
});
