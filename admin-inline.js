// Consolidated admin inline scripts
// Global handler: capture unhandled promise rejections (e.g. browser-extension messaging errors)
// and present a friendly, debounced notification while avoiding noisy "Uncaught (in promise)" logs
// for the known Chrome extension messaging case. We only suppress the default logging for the
// specific message pattern so real app errors still surface.
window.addEventListener('unhandledrejection', function (e) {
  try {
    const reason = e.reason;
    const msg = reason && reason.message ? reason.message : String(reason || '');
    // Known extension message substring
    const extensionMsgFragment = 'A listener indicated an asynchronous response by returning true';
    if (msg && msg.indexOf(extensionMsgFragment) !== -1) {
      // Show a non-fatal toast so the user knows it's from a browser extension and not the app
      try { if (window.showToast) window.showToast('A browser extension produced a messaging warning — it does not affect app functionality.', 'warning', 6000); } catch (t) {}
      // Prevent the browser from printing the noisy "Uncaught (in promise)" entry for this case
      try { e.preventDefault(); } catch (pe) {}
    } else {
      // For other unhandled rejections, log and surface a concise toast but do not fully suppress
      try { console.warn('Unhandled promise rejection captured:', reason); } catch (c) {}
      try { if (window.showToast) window.showToast('Unhandled promise rejection: ' + (msg || '[object]'), 'error', 6000); } catch (t) {}
      // Do not call preventDefault for unknown errors so developers still see full console output
    }
  } catch (err) {
    try { console.error('unhandledrejection handler error', err); } catch (e) {}
  }
});

(function(){
  // Activation helper for dashboard cards (data-action values)
  function activateAction(action) {
    if (!action) return;
    var parts = action.split(':');
    var type = parts[0];
    var target = parts.slice(1).join(':');
    if (type === 'modal') {
      var id = target;
      if (typeof openModal === 'function') openModal(id);
      else document.getElementById(id) && document.getElementById(id).classList.remove('hidden');
    } else if (type === 'link') {
      window.location.href = target;
    } else if (type === 'section') {
      var el = document.getElementById(target);
      if (el) {
        if (typeof showSection === 'function') showSection(target);
        else { document.querySelectorAll('.dashboard-section').forEach(s => s.hidden = true); el.hidden = false; el.scrollIntoView({behavior:'smooth', block:'start'}); }
      }
    }
  }

  document.addEventListener('click', function(e){
    var btn = e.target.closest('.dashboard-card-action');
    if (btn && btn.dataset && btn.dataset.action) {
      activateAction(btn.dataset.action);
      e.stopPropagation();
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') {
      var el = document.activeElement;
      if (el && el.classList && el.classList.contains('dashboard-card')) {
        var act = el.dataset.action;
        if (act) { activateAction(act); e.preventDefault(); }
      }
    }
  });
  document.addEventListener('click', function(e){
    var card = e.target.closest('.dashboard-card');
    if (card && card.dataset && card.dataset.action) {
      activateAction(card.dataset.action);
    }
  });

  // Assignment rows helper (moved from inline)
  const SUBJECT_OPTIONS = ['Maths','English','Science','Computing','Social Studies','RME','Creative Arts','Career Tech','Twi'];
  const CLASS_OPTIONS = ['JHS 1','JHS 2','JHS 3'];
  window.createAssignmentRow = function(selectedClass = '', selectedSubject = '', selectedArea = '') {
    const row = document.createElement('div');
    row.className = 'assignment-row';
    row.style.display = 'flex';
    row.style.gap = '0.5rem';

    // If selectedClass contains a subclass (e.g. "JHS 1 A"), strip to main class
    let initialMain = '';
    if (selectedClass && typeof selectedClass === 'string') {
      const m = selectedClass.trim().match(/^(.+?)\s+[A-Za-z]$/);
      initialMain = m ? m[1] : selectedClass;
    }

    const classSelect = document.createElement('select');
    classSelect.name = 'assignment_class[]';
    classSelect.required = true;
    classSelect.innerHTML = '<option value="">Class</option>' + CLASS_OPTIONS.map(c => `<option value="${c}">${c}</option>`).join('');
    classSelect.value = initialMain || '';

    const subjectSelect = document.createElement('select');
    subjectSelect.name = 'assignment_subject[]';
    subjectSelect.required = true;
    subjectSelect.innerHTML = '<option value="">Subject</option>' + SUBJECT_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('');
    subjectSelect.value = selectedSubject || '';

    const areaSelectWrapper = document.createElement('div');
    areaSelectWrapper.style.display = 'none';
    areaSelectWrapper.style.flex = '1';
    const areaSelect = document.createElement('select');
    areaSelect.name = 'assignment_career_area[]';
    areaSelect.innerHTML = '<option value="">Select Area</option>' + ['Home Economics','Pre Technical'].map(a => `<option value="${a}">${a}</option>`).join('');
    areaSelectWrapper.appendChild(areaSelect);
    if (selectedArea) areaSelect.value = selectedArea;

    // Duplicate check based only on class + subject
    function isDuplicateAssignment(testClass, testSubject, thisRow) {
      try {
        const rows = Array.from(document.querySelectorAll('#assignmentRowsContainer .assignment-row'));
        for (const r of rows) {
          if (r === thisRow) continue;
          const c = (r.querySelector('select[name="assignment_class[]"]')?.value || '').trim();
          const subj = r.querySelector('select[name="assignment_subject[]"]')?.value || '';
          if (!c || !subj) continue;
          if (c === testClass && subj === testSubject) return true;
        }
      } catch (e) { /* ignore */ }
      return false;
    }

    subjectSelect.addEventListener('change', function() {
      if (subjectSelect.value === 'Career Tech') {
        areaSelectWrapper.style.display = '';
        areaSelect.required = true;
      } else {
        areaSelectWrapper.style.display = 'none';
        areaSelect.required = false;
        areaSelect.value = '';
      }
      const cls = classSelect.value || '';
      const subj = subjectSelect.value || '';
      if (cls && subj) {
        if (isDuplicateAssignment(cls, subj, row)) {
          try { window.showToast && window.showToast('This class-subject assignment already exists. Please choose another.', 'warning'); } catch(e){}
          subjectSelect.value = '';
          if (areaSelect) { areaSelectWrapper.style.display = 'none'; areaSelect.required = false; areaSelect.value = ''; }
        }
      }
    });
    if (selectedSubject === 'Career Tech') { areaSelectWrapper.style.display = ''; areaSelect.required = true; }

    classSelect.addEventListener('change', function() {
      const v = classSelect.value;
      const subj = subjectSelect.value || '';
      if (v && subj) {
        if (isDuplicateAssignment(v, subj, row)) {
          try { window.showToast && window.showToast('This class-subject assignment already exists. Please choose another.', 'warning'); } catch(e){}
          subjectSelect.value = '';
          if (areaSelect) { areaSelectWrapper.style.display = 'none'; areaSelect.required = false; areaSelect.value = ''; }
        }
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.onclick = () => row.remove();

    row.appendChild(classSelect);
    row.appendChild(subjectSelect);
    row.appendChild(areaSelectWrapper);
    row.appendChild(removeBtn);
    return row;
  };

  // Wire assignment rows add button
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('assignmentRowsContainer');
    const addBtn = document.getElementById('addAssignmentRowBtn');
    if (container && addBtn) {
      addBtn.onclick = function() { container.appendChild(window.createAssignmentRow()); };
      if (!container.hasChildNodes()) container.appendChild(window.createAssignmentRow());
    }
  });

  // Show/hide Career Tech subselect helper
  document.addEventListener('DOMContentLoaded', function() {
    var subjectsSelect = document.getElementById('teacherSubjectsSelect');
    var subselectWrapper = document.getElementById('careerTechSubselectWrapper');
    if(subjectsSelect && subselectWrapper) {
      subjectsSelect.addEventListener('change', function() {
        var selected = Array.from(subjectsSelect.selectedOptions).map(opt => opt.value);
        subselectWrapper.style.display = selected.includes('Career Tech') ? '' : 'none';
      });
    }
  });

  // Auto-calculate Years at Present School
  document.addEventListener('DOMContentLoaded', function() {
    var yearPostedInput = document.getElementById('year_posted_station');
    var yearsAtPresentInput = document.getElementById('years_at_present_school');
    if(yearPostedInput && yearsAtPresentInput) {
      yearPostedInput.addEventListener('input', function() {
        var postedYear = parseInt(yearPostedInput.value, 10);
        var currentYear = new Date().getFullYear();
        var years = currentYear - postedYear + 1;
        if (isNaN(years) || years < 1) years = 1;
        yearsAtPresentInput.value = years;
      });
    }
  });

  // Show/hide class teacher section based on responsibility
  document.addEventListener('DOMContentLoaded', function() {
    var respSelect = document.getElementById('responsibility');
    var classSection = document.getElementById('classTeacherSection');
    if (respSelect && classSection) {
      respSelect.addEventListener('change', function() {
        if (respSelect.value === 'Class Teacher') {
          classSection.style.display = '';
          var ct = document.getElementById('class_teacher_class'); if (ct) ct.required = true;
        } else {
          classSection.style.display = 'none';
          var ct2 = document.getElementById('class_teacher_class'); if (ct2) { ct2.required = false; ct2.value=''; }
        }
      });
    }
  });

  // Minimal showToast shim (keeps inline behavior if toasts.js not yet loaded)
  if (!window.showToast) {
    window._toastQueue = window._toastQueue || [];
    window.showToast = function(message, type='info', durationMs = 3500) {
      if (typeof window.__realShowToast === 'function') return window.__realShowToast(message, type, durationMs);
      window._toastQueue.push({ message: String(message), type, durationMs });
    };
    window._originalAlert = window.alert;
    window.alert = function(msg) { try { window.showToast(String(msg), 'info'); } catch (e) { try { window._originalAlert(msg); } catch (ee) { /* alert fallback suppressed to avoid noisy logs */ } } };
  }

  // UI force-show helper (keeps dashboard cards visible if CSS hides them)
  function forceShowDashboardCards() {
    try {
      const ov = document.getElementById('dashboardOverview');
      const bg = document.querySelector('.dashboard-cards-bg');
      if (bg) { bg.style.zIndex = 999; bg.style.position = 'relative'; bg.style.overflow = 'visible'; }
      if (ov) {
        ov.style.display = 'grid'; ov.style.visibility = 'visible'; ov.style.opacity = '1'; ov.style.maxHeight = 'none'; ov.style.overflow = 'visible'; ov.style.position = 'relative'; ov.style.zIndex = 1000;
        ov.querySelectorAll('.dashboard-card').forEach((c, i) => {
          c.style.display = 'flex'; c.style.visibility = 'visible'; c.style.opacity = '1'; c.style.transform = 'none'; c.style.maxHeight = 'none'; c.style.minHeight = '56px'; c.style.margin = '0.4rem 0'; c.style.pointerEvents = 'auto'; c.classList.remove('hidden'); c.classList.add('animate-in');
        });
      }
    } catch (e) { console.warn('forceShowDashboardCards error', e); }
  }
  document.addEventListener('DOMContentLoaded', () => { forceShowDashboardCards(); setTimeout(forceShowDashboardCards, 180); setTimeout(forceShowDashboardCards, 600); });

})();
