// Filter student dropdown by search box
window.filterStudentDropdown = function filterStudentDropdown() {
  const search = document.getElementById('studentSearch').value.trim().toLowerCase();
  const classValue = document.getElementById('classFilter').value.trim().toUpperCase();
  let filtered = classValue
    ? allStudents.filter(s => (s.class || '').trim().toUpperCase() === classValue)
    : allStudents;
  // Sort by register_id (roll number)
  filtered = filtered.slice().sort((a, b) => {
    if (!a.register_id || !b.register_id) return 0;
    const [ac, an] = a.register_id.split('_');
    const [bc, bn] = b.register_id.split('_');
    if (ac === bc) return parseInt(an, 10) - parseInt(bn, 10);
    return ac.localeCompare(bc);
  });
  if (search) {
    filtered = filtered.filter(s => {
      const name = ((s.first_name || '') + ' ' + (s.surname || '')).toLowerCase();
      return name.includes(search);
    });
  }
  const studentSelect = document.getElementById('studentSelect');
  studentSelect.innerHTML = '<option value="">-- Select Student --</option>';
  filtered.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    let name = '';
    if (s.first_name && s.surname) {
      name = s.first_name + ' ' + s.surname;
    } else if (s.first_name) {
      name = s.first_name;
    } else if (s.surname) {
      name = s.surname;
    } else {
      name = '[No Name]';
    }
    opt.textContent = name + (s.class ? ` (${s.class})` : '');
    opt.dataset.class = s.class || '';
    opt.dataset.picture = s.picture_url || '';
    studentSelect.appendChild(opt);
  });
};
// Modal open/close logic
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
  // Maintain a stack of open modals so nested dialogs stack correctly
    try {
      window._openModals = window._openModals || [];
    } catch (e) {
      window._openModals = [];
    }
    // push this modal onto the stack (if not already present)
    if (window._openModals.indexOf(modalId) === -1) window._openModals.push(modalId);
    // compute backdrop/modal z-index based on stack depth
    const baseBackdropZ = 9000; // matches .modal-backdrop in CSS
    const perModal = 50; // spacing between stacked modals
    const stackIndex = window._openModals.length - 1; // 0..n-1
    const backdropZ = baseBackdropZ + stackIndex * perModal;
    const modalZ = backdropZ + 10;
  // debug logging removed
    modal.classList.remove('hidden');
    // Force visible display and bring to front in case CSS rules conflict
    modal.style.display = 'flex';
    try { modal.style.zIndex = String(modalZ); } catch(e) {}
    // Mark as visible for assistive tech
    try { modal.setAttribute('aria-hidden', 'false'); } catch(e) {}
    // If this is the modal-panel variant used for small registration dialogs,
    // apply the `.open` class so the CSS rules that center and fix the panel
    // will take effect (prevents the panel from rendering inline at the page bottom).
    if (modal.classList && modal.classList.contains('modal-panel')) {
      modal.classList.add('open');
      // ensure it's appended to body so it's not clipped by parent containers
      try { if (modal.parentElement !== document.body) document.body.appendChild(modal); } catch(e) {}
      // focus first control for convenience
      try { const first = modal.querySelector('input,select,textarea,button'); if (first) first.focus(); } catch(e) {}
      return;
    }
    // Diagnostic: log computed styles and bounding rects for the modal and its content
    try {
      const cs = window.getComputedStyle(modal);
      // diagnostic logging removed
      const rect = modal.getBoundingClientRect();
      // Prefer .modal-content, but fall back to .modal-panel, a form, or the modal itself
      let content = modal.querySelector('.modal-content') || modal.querySelector('.modal-panel') || modal.querySelector('form') || modal;
      if (content) {
        const cs2 = window.getComputedStyle(content);
        // diagnostic logging removed for modal content
        // If the modal lacked a dedicated .modal-content wrapper, emit a debug-level note
        if (!modal.querySelector('.modal-content')) {
          console.debug('openModal: no .modal-content wrapper found; using fallback content element for', modalId);
        }
      }
      // Inspect parent stacking context
      // ancestor diagnostic logging removed
    } catch (diagErr) {
      console.error('openModal: diagnostic logging failed', diagErr);
    }
    // Practical fix: ensure modal is appended to document.body so it's not constrained by ancestors
    try {
      if (modal.parentElement !== document.body) {
  // moved modal to document.body to avoid stacking/overflow issues
        document.body.appendChild(modal);
      }
      const content = modal.querySelector('.modal-content');
      if (content) {
        // Force visible state in case CSS animation or cascade left it at opacity:0 or transform off-screen
        content.style.opacity = '1';
        content.style.transform = 'none';
        content.style.visibility = 'visible';
      }
      // Ensure modal occupies viewport
      modal.style.width = modal.style.width || '100%';
      modal.style.height = modal.style.height || '100%';
      try { modal.setAttribute('aria-hidden', 'false'); } catch(e) {}
      // Ensure the shared backdrop sits behind the top-most modal
      try {
        const back = document.getElementById('modalBackdrop');
        if (back) {
          back.setAttribute('aria-hidden', 'false');
          back.classList.add('show');
          back.style.zIndex = String(backdropZ);
        }
      } catch (be) { /* ignore backdrop errors */ }
    } catch (moveErr) {
      console.error('openModal: failed to move/force-visual modal', moveErr);
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
  // close modal
    // Remove `.open` for modal-panel and reset inline styles we may have injected
    try { if (modal.classList && modal.classList.contains('modal-panel')) modal.classList.remove('open'); } catch(e) {}
    modal.classList.add('hidden');
    modal.style.display = 'none';
    try { modal.style.zIndex = ''; } catch(e) {}
    try { modal.setAttribute('aria-hidden', 'true'); } catch(e) {}
    // cleanup inline positioning that might have been injected
    try {
      modal.style.position = '';
      modal.style.left = '';
      modal.style.top = '';
      modal.style.transform = '';
      modal.style.zIndex = '';
    } catch(e) {}
  }
  // Also hide the shared backdrop if present
  try {
    // remove this modal from stack
    try { window._openModals = window._openModals || []; } catch (e) { window._openModals = []; }
    const idx = window._openModals.indexOf(modalId);
    if (idx !== -1) window._openModals.splice(idx, 1);
    const back = document.getElementById('modalBackdrop');
    if (back) {
      if (!window._openModals || window._openModals.length === 0) {
        // no more open modals: hide backdrop
        back.setAttribute('aria-hidden', 'true');
        back.classList.remove('show');
        back.style.zIndex = '';
      } else {
        // there are still open modals: adjust backdrop z-index to the new top
        const baseBackdropZ = 9000;
        const perModal = 50;
        const stackIndex = window._openModals.length - 1;
        const backdropZ = baseBackdropZ + stackIndex * perModal;
        back.style.zIndex = String(backdropZ);
      }
    }
  } catch (e) {}
  // Always show dashboard overview after closing key modals
  if (modalId === 'promotionPassMarkModal' || modalId === 'eventsModal') {
    const overview = document.getElementById('dashboardOverview');
    if (overview) {
      overview.classList.remove('hidden');
      overview.style.display = '';
    }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  // Populate denomination dropdown with approved churches in Ghana
  (function populateDenominations(){
    try {
      const denomSelect = document.getElementById('denomination');
      if (!denomSelect) return;
      const denominations = [
        'Church of Pentecost',
        'Presbyterian Church of Ghana',
        'Methodist Church Ghana',
        'Roman Catholic Church Ghana',
        'Anglican Church Ghana',
        'Redeemed Christian Church of God (RCCG)',
        'Assemblies of God Ghana',
        'Seventh-day Adventist Church Ghana',
        'Baptist Convention Ghana',
        'Salvation Army Ghana',
        'International Central Gospel Church (ICGC)',
        'Action Chapel International',
        'Lighthouse Chapel International',
        'Perez Chapel International',
        'Christ Embassy Ghana',
        'Power Chapel Worldwide',
        'Deeper Christian Life Ministry',
        'Winners Chapel International',
        'Synagogue Church of All Nations (SCOAN)',
        'Church of Jesus Christ of Latter-day Saints',
        'Jehovah\'s Witnesses',
        'Church of Christ',
        'Christ Apostolic Church International',
        'Evangelical Presbyterian Church Ghana',
        'Calvary Baptist Church',
        'The Church of the Lord Brotherhood'
      ];
      // clear existing options but keep a placeholder
      denomSelect.innerHTML = '<option value="">Select Denomination</option>';
      denominations.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d;
        opt.textContent = d;
        denomSelect.appendChild(opt);
      });
      // If the teacher form has an existing value (when editing), preserve it
      try {
        const form = document.getElementById('teacherForm');
        if (form && form.denomination && form.denomination.value) {
          denomSelect.value = form.denomination.value;
        }
      } catch (e) { /* ignore */ }
    } catch (e) { console.warn('populateDenominations failed', e); }
  })();
  // --- Student registration modal: show subclass select when main class is selected ---
  var studentMainClass = document.getElementById('student_main_class_select');
  var studentSubClass = document.getElementById('student_sub_class_select');
  if (studentMainClass && studentSubClass) {
    // Ensure initial state
    if (!(studentMainClass.value === 'JHS 1' || studentMainClass.value === 'JHS 2')) {
      studentSubClass.classList.add('hidden-select');
      studentSubClass.required = false;
      studentSubClass.value = '';
    } else {
      studentSubClass.classList.remove('hidden-select');
      studentSubClass.required = true;
    }

    studentMainClass.addEventListener('change', function() {
      if (studentMainClass.value === 'JHS 1' || studentMainClass.value === 'JHS 2') {
        studentSubClass.classList.remove('hidden-select');
        studentSubClass.required = true;
        // leave value alone to allow editing; don't reset unless explicitly desired
      } else {
        studentSubClass.classList.add('hidden-select');
        studentSubClass.required = false;
        studentSubClass.value = '';
      }
    });
  }
  // --- Class/Subclass selection logic for Class Teacher ---
  var mainClass = document.getElementById('main_class_select');
  var subClass = document.getElementById('sub_class_select');
  var hiddenClass = document.getElementById('class_teacher_class');
  var hiddenClassMain = document.getElementById('class_teacher_class_main');
  var hiddenClassSub = document.getElementById('class_teacher_subclass');
  if (mainClass && subClass && hiddenClass) {
    // ensure initial state matches hidden-select convention
    if (!(mainClass.value === 'JHS 1' || mainClass.value === 'JHS 2')) {
      subClass.classList.add('hidden-select');
      subClass.required = false;
      subClass.value = '';
    } else {
      subClass.classList.remove('hidden-select');
      subClass.required = true;
    }
    mainClass.addEventListener('change', function() {
      if (mainClass.value === 'JHS 1' || mainClass.value === 'JHS 2') {
        subClass.classList.remove('hidden-select');
        subClass.required = true;
        subClass.value = '';
        if (hiddenClassMain) hiddenClassMain.value = '';
        if (hiddenClassSub) hiddenClassSub.value = '';
        if (hiddenClass) hiddenClass.value = '';
      } else if (mainClass.value === 'JHS 3') {
        subClass.classList.add('hidden-select');
        subClass.required = false;
        subClass.value = '';
        if (hiddenClassMain) hiddenClassMain.value = 'JHS 3';
        if (hiddenClassSub) hiddenClassSub.value = '';
        if (hiddenClass) hiddenClass.value = 'JHS 3';
      } else {
        subClass.classList.add('hidden-select');
        subClass.required = false;
        subClass.value = '';
        if (hiddenClassMain) hiddenClassMain.value = '';
        if (hiddenClassSub) hiddenClassSub.value = '';
        if (hiddenClass) hiddenClass.value = '';
      }
    });
    subClass.addEventListener('change', function() {
      if (mainClass.value && subClass.value) {
        const combined = mainClass.value + ' ' + subClass.value;
        if (hiddenClassMain) hiddenClassMain.value = mainClass.value;
        if (hiddenClassSub) hiddenClassSub.value = subClass.value;
        if (hiddenClass) hiddenClass.value = combined;
      } else {
        if (hiddenClassMain) hiddenClassMain.value = '';
        if (hiddenClassSub) hiddenClassSub.value = '';
        if (hiddenClass) hiddenClass.value = '';
      }
    });
  }
  // --- Teacher Form Submission Logic ---
  const teacherForm = document.getElementById('teacherForm');
  if (teacherForm) {
    teacherForm.addEventListener('submit', async function(e) {
      const resp = teacherForm.querySelector('[name="responsibility"]').value;
      const mainClass = teacherForm.querySelector('[name="main_class_select"]');
      const subClass = teacherForm.querySelector('[name="sub_class_select"]');
      const classField = teacherForm.querySelector('[name="class_teacher_class"]');
      const classMainField = teacherForm.querySelector('[name="class_teacher_class_main"]');
  const classSubField = teacherForm.querySelector('[name="class_teacher_subclass"]');
      if (resp === 'Class Teacher') {
        if (!mainClass.value) {
          e.preventDefault();
          showToast('Please select the main class you are responsible for.', 'warning');
          mainClass.focus();
          return;
        }
        if ((mainClass.value === 'JHS 1' || mainClass.value === 'JHS 2') && !subClass.value) {
          e.preventDefault();
          showToast('Please select the subclass (A or B) for ' + mainClass.value + '.', 'warning');
          subClass.focus();
          return;
        }
        if (mainClass.value === 'JHS 3') {
          if (classMainField) classMainField.value = 'JHS 3';
          if (classSubField) classSubField.value = '';
          if (classField) classField.value = 'JHS 3';
        } else if (mainClass.value && subClass.value) {
          if (classMainField) classMainField.value = mainClass.value;
          if (classSubField) classSubField.value = subClass.value;
          if (classField) classField.value = mainClass.value + ' ' + subClass.value;
        }
        if (classField) classField.disabled = false;
      } else {
        if (classField) {
          classField.value = '';
          classField.disabled = true;
        }
        if (classMainField) classMainField.value = '';
        if (classSubField) classSubField.value = '';
      }
    });
  }
  // --- Promotion Pass Mark UI Logic ---
  // --- Promotion Pass Mark Modal Logic ---
  const promotionPassMarkInput = document.getElementById('promotionPassMarkInput');
  const promotionPassMarkForm = document.getElementById('promotionPassMarkForm');
  const promotionPassMarkStatus = document.getElementById('promotionPassMarkStatus');
  if (promotionPassMarkInput && promotionPassMarkForm) {
    // Load current value from Supabase settings
    (async function() {
      try {
        const { data, error } = await supabaseClient
          .from('settings')
          .select('id, promotion_pass_mark')
          .order('id', { ascending: true })
          .limit(1);
        if (!error && data && data.length && data[0].promotion_pass_mark) {
          promotionPassMarkInput.value = data[0].promotion_pass_mark;
        } else {
          promotionPassMarkInput.value = 300;
        }
      } catch (e) {
        promotionPassMarkInput.value = 300;
      }
    })();
    // Save handler
    promotionPassMarkForm.onsubmit = async function(e) {
      e.preventDefault();
      const value = parseInt(promotionPassMarkInput.value, 10);
      if (isNaN(value) || value < 0) {
        promotionPassMarkStatus.textContent = 'Enter a valid number.';
        promotionPassMarkStatus.style.color = 'red';
        return;
      }
      // Show loader while saving
      const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Saving pass mark...', { color: '#0b66b2' }) : null;
      try {
        const { data, error: fetchError } = await supabaseClient
          .from('settings')
          .select('id')
          .order('id', { ascending: true })
          .limit(1);
        let upsertData;
        if (!fetchError && data && data.length) {
          upsertData = { id: data[0].id, promotion_pass_mark: value };
        } else {
          upsertData = { promotion_pass_mark: value };
        }
        const { error } = await supabaseClient
          .from('settings')
          .upsert([upsertData]);
        if (!error) {
          try { showToast('Pass mark saved', 'info'); } catch(e) {}
        } else {
          try { showToast('Error saving pass mark', 'error'); } catch(e) {}
        }
      } finally {
        try { loader && loader.close(); } catch (e) {}
      }
    };
  }

  // --- Site Announcement UI Logic ---
  const announcementForm = document.getElementById('announcementForm');
  const announcementText = document.getElementById('announcementText');
  const announcementStatus = document.getElementById('announcementStatus');
  const announcementStatEl = document.querySelector('[data-stat-key="siteAnnouncement"]');
  if (announcementText && announcementForm) {
    // Load current announcement from settings
    (async function() {
      try {
        const { data, error } = await supabaseClient
          .from('settings')
          .select('id, announcement')
          .order('id', { ascending: true })
          .limit(1);
        if (!error && data && data.length && typeof data[0].announcement === 'string') {
          announcementText.value = data[0].announcement;
          if (announcementStatEl) announcementStatEl.textContent = data[0].announcement || '—';
        } else {
          announcementText.value = '';
          if (announcementStatEl) announcementStatEl.textContent = '—';
        }
      } catch (e) {
        announcementText.value = '';
        if (announcementStatEl) announcementStatEl.textContent = '—';
      }
    })();

    announcementForm.onsubmit = async function(e) {
      e.preventDefault();
      const text = announcementText.value.trim();
      const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Saving announcement...', { color: '#0b66b2' }) : null;
      try {
        const { data: existing, error: fetchErr } = await supabaseClient
          .from('settings')
          .select('id')
          .order('id', { ascending: true })
          .limit(1);
        let upsertData;
        if (!fetchErr && existing && existing.length) {
          upsertData = { id: existing[0].id, announcement: text };
        } else {
          upsertData = { announcement: text };
        }
        // Use explicit onConflict target to ensure upsert behaves predictably.
        const { data: upsertResponse, error: upsertErr } = await supabaseClient.from('settings').upsert([upsertData], { onConflict: 'id' });
        if (!upsertErr) {
          try { showToast('Announcement saved', 'info'); } catch(e) {}
          if (announcementStatEl) announcementStatEl.textContent = text || '—';
          try { localStorage.setItem('siteAnnouncementUpdatedAt', Date.now().toString()); } catch (e) {}
        } else {
          console.error('Announcement upsert failed', upsertErr, upsertResponse);
          const errMsg = (upsertErr && (upsertErr.message || upsertErr.details || upsertErr.code)) ? (upsertErr.message || upsertErr.details || String(upsertErr.code)) : 'Unknown error';
          if (/column\s+"announcement"\s+does not exist/i.test(errMsg) || /invalid column reference/i.test(errMsg)) {
            try { showToast('DB schema missing `announcement` column. See console for details.', 'error', 6000); } catch(e) {}
            console.error('Likely cause: `settings` table does not have an `announcement` column. Example migration SQL: ALTER TABLE settings ADD COLUMN announcement text;');
          } else {
            // fallback attempts
            try {
              if (existing && existing.length && existing[0].id) {
                const { error: updateErr } = await supabaseClient.from('settings').update({ announcement: text }).eq('id', existing[0].id);
                if (!updateErr) {
                  try { showToast('Announcement saved (fallback)', 'info'); } catch(e) {}
                  if (announcementStatEl) announcementStatEl.textContent = text || '—';
                  try { localStorage.setItem('siteAnnouncementUpdatedAt', Date.now().toString()); } catch (e) {}
                } else {
                  const { error: insertErr } = await supabaseClient.from('settings').insert([{ announcement: text }]);
                  if (!insertErr) {
                    try { showToast('Announcement saved (fallback insert)', 'info'); } catch(e) {}
                    if (announcementStatEl) announcementStatEl.textContent = text || '—';
                    try { localStorage.setItem('siteAnnouncementUpdatedAt', Date.now().toString()); } catch (e) {}
                  } else {
                    try { showToast('Error saving announcement', 'error'); } catch(e) {}
                  }
                }
              } else {
                const { error: insertErr } = await supabaseClient.from('settings').insert([{ announcement: text }]);
                if (!insertErr) {
                  try { showToast('Announcement saved (insert)', 'info'); } catch(e) {}
                  if (announcementStatEl) announcementStatEl.textContent = text || '—';
                  try { localStorage.setItem('siteAnnouncementUpdatedAt', Date.now().toString()); } catch (e) {}
                } else {
                  try { showToast('Error saving announcement', 'error'); } catch(e) {}
                }
              }
            } catch (fallbackErr) {
              console.error('Announcement fallback path failed', fallbackErr);
              try { showToast('Error saving announcement', 'error'); } catch(e) {}
            }
          }
        }
      } catch (err) {
        try { showToast('Error saving announcement', 'error'); } catch(e) {}
      } finally {
        try { loader && loader.close(); } catch (e) {}
      }
    };
  }
  // Prevent access if not logged in as admin
  const adminId = localStorage.getItem('adminId');
  if (!adminId) {
    try { localStorage.setItem('openLoginRole', 'admin'); } catch (e) {}
    window.location.href = 'index.html';
    return;
  }
  // CSV Import Handler (schema-aligned)
  const importInput = document.getElementById('csvInput');
  if (importInput) {
    importInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async function(evt) {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Importing CSV...', { color: '#0b66b2' }) : null;
        if (lines.length < 2) {
          notify('CSV file is empty or missing data.', 'warning');
          return;
        }
        // Define allowed schema fields for Supabase students table
        // Match new schema: no full_name, require first_name and surname, include area, dob, nhis_number
        const allowedFields = [
          'first_name', 'surname', 'area', 'dob', 'nhis_number',
          'gender', 'class', 'subclass', 'parent_name', 'parent_contact', 'username', 'pin', 'picture_url'
        ];
        // Map CSV headers to schema fields (case-insensitive)
        const headers = lines[0].split(/\t|,/).map(h => h.trim());
        const normalizedHeaders = headers.map(h => h.toLowerCase());
        // Build a mapping from CSV header to schema field
        const headerToField = {};
        headers.forEach((h, idx) => {
          const norm = h.toLowerCase();
          // Map common variations to schema fields
          if (norm === 'full name') headerToField[h] = 'full_name';
          else if (norm === 'parent') headerToField[h] = 'parent_name';
          else if (norm === 'contact') headerToField[h] = 'parent_contact';
          else if (norm === 'nhis number') headerToField[h] = 'nhis_number';
          else if (norm === 'class') headerToField[h] = 'class';
          else if (norm === 'subclass') headerToField[h] = 'subclass';
          else if (norm === 'gender') headerToField[h] = 'gender';
          else if (norm === 'area') headerToField[h] = 'area';
          else if (norm === 'dob') headerToField[h] = 'dob';
          else if (norm === 'username') headerToField[h] = 'username';
          else if (norm === 'pin') headerToField[h] = 'pin';
          else if (norm === 'picture url') headerToField[h] = 'picture_url';
          else if (norm === 'surname') headerToField[h] = 'surname';
          else if (norm === 'first name') headerToField[h] = 'first_name';
          else headerToField[h] = null; // ignore unknown columns
        });
  let successCount = 0, failCount = 0, duplicateRows = [], invalidRows = [];
        for (let i = 1; i < lines.length; i++) {
          if (i % 5 === 0) {
            try { loader && loader.update(Math.round((i / (lines.length - 1)) * 100)); } catch (e) {}
          }
          const row = lines[i].split(/\t|,/);
          if (row.length < 5) continue;
          // Build studentData with only allowed fields
          const studentData = {};
          let hasAllRequired = true;
          // Required fields for import (username and pin are always generated)
          const requiredFields = ['first_name', 'surname', 'gender', 'class', 'parent_name', 'parent_contact'];
          // Fill studentData from CSV row (CSV uses Full Name, split to first_name/surname)
          headers.forEach((h, idx) => {
            const field = headerToField[h];
            if (field === 'full_name') {
              const { first_name, surname } = splitFullName(row[idx] ? row[idx].trim() : '');
              studentData['first_name'] = first_name;
              studentData['surname'] = surname;
            } else if (field && allowedFields.includes(field)) {
              studentData[field] = row[idx] ? row[idx].trim() : '';
            }
          });
          // Always auto-generate username and pin
          studentData['username'] = generateUsername(studentData['first_name'], studentData['surname']);
          studentData['pin'] = generatePin();
          // Subclass logic for import: JHS 1/2 require subclass, JHS 3 omits
          if (studentData['class'] === 'JHS 1' || studentData['class'] === 'JHS 2') {
            if (!('subclass' in studentData) || !studentData['subclass']) {
              studentData['subclass'] = '';
            }
          } else if (studentData['class'] === 'JHS 3') {
            studentData['subclass'] = null;
          }
          // Check for required fields
          for (const req of requiredFields) {
            if (!studentData[req] || studentData[req].length === 0) {
              hasAllRequired = false;
              break;
            }
          }
          if (!hasAllRequired) {
            failCount++;
            invalidRows.push(i+1);
            continue;
          }
          // Prevent duplicate by username/class/subclass
          const { data: existing, error: existErr } = await supabaseClient.from('students').select('id').eq('username', studentData.username).eq('class', studentData.class).eq('subclass', studentData.subclass);
          if (existing && existing.length) {
            failCount++;
            duplicateRows.push(i+1);
            continue;
          }
          // Only insert allowed fields
          const insertData = {};
          allowedFields.forEach(f => {
            if (studentData[f] !== undefined) insertData[f] = studentData[f];
          });
          // Auto-assign register_id if missing (JHS1_1, JHS2_1, JHS3_1, etc.)
          if (!insertData.register_id) {
            const { data: classStudents } = await supabaseClient.from('students').select('register_id').eq('class', studentData.class);
            let nextNum = 1;
            if (classStudents && classStudents.length > 0) {
              const nums = classStudents.map(s => { const m = (s.register_id||'').match(/_(\d+)$/); return m ? parseInt(m[1],10) : 0; });
              nextNum = Math.max(...nums, 0) + 1;
            }
            insertData.register_id = studentData.class.replace(/\s+/g,'').toUpperCase() + '_' + nextNum;
          }
          const { error } = await supabaseClient.from('students').insert([insertData]);
          if (error) {
            failCount++;
            invalidRows.push(i+1);
          } else {
            successCount++;
          }
        }
        try { loader && loader.update(100); } catch (e) {}
        let msg = `Import complete. Success: ${successCount}, Failed: ${failCount}`;
        if (duplicateRows.length) msg += `\nDuplicate students (already exist in this class): ${duplicateRows.join(', ')}`;
        if (invalidRows.length) msg += `\nRows with missing/invalid fields or other errors: ${invalidRows.join(', ')}`;
        notify(msg, 'info');
        try { loader && loader.close(); } catch (e) {}
      };
      reader.readAsText(file);
    });
  }
});

// Simple toast UI helper: showToast(message, type="info", durationMs=3500)
function showToast(message, type = 'info', durationMs = 3500) {
  try {
    const container = document.getElementById('toastContainer');
  if (!container) { /* toast container missing */ return; }
    const toast = document.createElement('div');
    toast.className = 'app-toast app-toast-' + type;
    toast.style.pointerEvents = 'auto';
    toast.style.minWidth = '220px';
    toast.style.maxWidth = '360px';
    toast.style.padding = '0.6rem 0.9rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 6px 18px rgba(9,30,66,0.12)';
    toast.style.background = (type === 'error' ? '#fee2e2' : (type === 'warning' ? '#fff7ed' : '#f0f9ff'));
    toast.style.color = (type === 'error' ? '#7f1d1d' : (type === 'warning' ? '#92400e' : '#0b2740'));
    toast.style.border = '1px solid rgba(9,30,66,0.06)';
    toast.style.fontWeight = '600';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(8px)';
  toast.style.transition = 'opacity 220ms ease, transform 220ms ease';
  // Accessibility
  toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
  toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  toast.setAttribute('aria-atomic', 'true');
  toast.tabIndex = 0; // make focusable for screen readers
  // content
  toast.textContent = message;
    container.appendChild(toast);
    // Force layout then animate
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; });
    const hide = () => {
      toast.style.opacity = '0'; toast.style.transform = 'translateY(8px)';
      setTimeout(() => { try { container.removeChild(toast); } catch (e) {} }, 240);
    };
    setTimeout(hide, durationMs);
    // click to dismiss quickly
    toast.addEventListener('click', hide);
    // Make screen readers read it immediately
    try { toast.focus(); } catch (e) { /* ignore */ }
  } catch (e) {
    // toast creation error (kept as non-fatal)
  }
}
// Expose as the real showToast so other scripts can use it immediately
try { window.__realShowToast = showToast; if (window._toastQueue && window._toastQueue.length) { window._toastQueue.forEach(t => showToast(t.message, t.type, t.durationMs)); window._toastQueue = []; } } catch (e) { /* ignore */ }
// Export students as CSV
// Split full name into first name and surname
// Generate username and pin
function splitFullName(fullName) {
  const parts = fullName.trim().split(' ');
  const surname = parts.length > 1 ? parts.pop() : '';
  const firstName = parts.join(' ');
  return { first_name: firstName, surname: surname };
}

// Suppress native HTML5 validation UI globally and log invalid events for debugging.
// This prevents browsers from showing the built-in "Please fill in all required fields" dialog
// while we perform validation and submission in JavaScript.
document.addEventListener('invalid', function(e) {
  try {
    e.preventDefault(); // stop browser default bubble/tooltip
  } catch (err) {
    /* ignore */
  }
  console.warn('Suppressed native validation for element:', e.target, 'in form:', e.target && e.target.form ? (e.target.form.id || e.target.form.name) : null);
  // Attempt to focus the invalid element so user gets feedback
  try { e.target.focus(); } catch (err) { /* ignore */ }
}, true); // use capture to catch the event before the browser shows UI

// Capture any native submit events across the document for diagnostics.
document.addEventListener('submit', function(e) {
  // document-level submit captured (debug log removed)
}, true);
  // Intercept student form submission to support full name splitting and proper required field validation
  const studentForm = document.getElementById('studentForm');
  if (studentForm) {
    studentForm.addEventListener('submit', function(e) {
      // Always prevent browser default submit/validation; we manage everything in JS
      e.preventDefault();
  // student form submit handler invoked
      // Validate only truly required fields
      const mainClass = studentForm.querySelector('[name="main_class_select"]');
      const subClass = studentForm.querySelector('[name="sub_class_select"]');
      const firstName = studentForm.querySelector('[name="first_name"]');
      const surname = studentForm.querySelector('[name="surname"]');
      const dob = studentForm.querySelector('[name="dob"]');
      const gender = studentForm.querySelector('[name="gender"]');
      let combinedClass = '';
      // Only these are required:
  if (!firstName.value.trim()) { notify('Please enter first name.', 'warning'); firstName.focus(); return; }
  if (!surname.value.trim()) { notify('Please enter surname.', 'warning'); surname.focus(); return; }
  // Date of birth is now optional
  if (!gender.value) { notify('Please select gender.', 'warning'); gender.focus(); return; }
      if (mainClass && mainClass.value) {
        if ((mainClass.value === 'JHS 1' || mainClass.value === 'JHS 2')) {
          subClass.required = true;
          if (!subClass.value) {
            notify('Please select subclass (A or B) for ' + mainClass.value, 'warning');
            subClass.focus();
            return;
          }
          combinedClass = mainClass.value + ' ' + subClass.value;
        } else {
          subClass.required = false;
          combinedClass = mainClass.value;
        }
      } else {
        notify('Please select a class.', 'warning');
        mainClass.focus();
        return;
      }
      // Set hidden class value
      studentForm.querySelector('[name="class"]').value = combinedClass;
      // ...existing full name splitting and duplicate check logic...
  const fullNameInput = studentForm.querySelector('[name="full_name"]');
  if (fullNameInput) {
        const { first_name, surname } = splitFullName(fullNameInput.value);
        studentForm.querySelector('[name="first_name"]').value = first_name;
        studentForm.querySelector('[name="surname"]').value = surname;
        // Auto-generate username and pin if missing
        const usernameInput = studentForm.querySelector('[name="username"]');
        const pinInput = studentForm.querySelector('[name="pin"]');
        if (usernameInput && !usernameInput.value) {
          usernameInput.value = generateUsername(first_name, surname);
        }
        if (pinInput && !pinInput.value) {
          pinInput.value = generatePin();
        }
        // Prevent duplicate student by name and class
        const classInput = studentForm.querySelector('[name="class"]');
        const nameClass = (first_name + ' ' + surname + '|' + (classInput ? classInput.value : ''));
        window._studentNameClassSet = window._studentNameClassSet || new Set();
        if (window._studentNameClassSet.has(nameClass)) {
  try { notify('Duplicate student detected: ' + first_name + ' ' + surname + ' in class ' + (classInput ? classInput.value : ''), 'warning'); } catch (e) { try { safeNotify('Duplicate student detected: ' + first_name + ' ' + surname + ' in class ' + (classInput ? classInput.value : ''), 'warning'); } catch (ee) { console.error('safeNotify failed', ee); } }
          return;
        }
        window._studentNameClassSet.add(nameClass);
      }
      // Passed validation — create student via JS flow
  // proceeding to create student
  createStudentFromForm(studentForm).catch(err => { console.error(err); try { notify('Failed to save student: ' + (err.message || err), 'error'); } catch (e) { try { safeNotify('Failed to save student: ' + (err.message || err), 'error'); } catch (ee) { console.error('safeNotify failed', ee); } } });
      return;
    });
    // Wire up custom Save button to trigger form submit programmatically
    const saveBtn = document.getElementById('studentSaveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        // Ensure native validation is disabled for programmatic submit
        studentForm.noValidate = true;
        // Programmatically dispatch a submit event that will be handled by our listener
        const ev = new Event('submit', { bubbles: true, cancelable: true });
        studentForm.dispatchEvent(ev);
        // If event wasn't prevented, submit the form programmatically so server logic runs
        if (!ev.defaultPrevented) {
          // Use our own JS flow to insert the student to avoid native validation
          createStudentFromForm(studentForm).catch(err => {
            console.error('Student insert failed:', err);
            try { notify('Failed to save student. See console for details.', 'error'); } catch (e) { try { safeNotify('Failed to save student. See console for details.', 'error'); } catch (ee) { console.error('safeNotify failed', ee); } }
          });
        }
      });
    }
  }

// Create student record from the provided form element (uploads picture, assigns register_id)
async function createStudentFromForm(form) {
  // Ask for confirmation before saving
  try {
    // respect remembered preference
    let pref = null;
    try { pref = localStorage.getItem('nsuta_confirm_save_student'); } catch (e) { pref = null; }
    if (pref === 'false') {
      // user opted out of confirmations for this action
    } else {
      const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Save student changes?', { title: 'Confirm save', rememberKey: 'save_student' }) : confirm('Save student changes?');
      if (!ok) return;
    }
  } catch (e) { return; }

  // Prevent double submits and show a persistent loading/progress toast if available
  if (form._saving) return;
  form._saving = true;
  const saveBtn = document.getElementById('studentSaveBtn');
  try { if (saveBtn) saveBtn.disabled = true; } catch(e){}
  const _loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Saving student...', { color: '#0b66b2' }) : null;
  try {
  // gather values
  const firstName = (form.querySelector('[name="first_name"]')?.value || '').trim();
  const surname = (form.querySelector('[name="surname"]')?.value || '').trim();
  const area = (form.querySelector('[name="area"]')?.value || '').trim();
  const dob = form.querySelector('[name="dob"]')?.value || null;
  const nhis = (form.querySelector('[name="nhis_number"]')?.value || '').trim();
  const gender = form.querySelector('[name="gender"]')?.value || '';
  const mainClass = form.querySelector('[name="main_class_select"]')?.value || '';
  let subClass = form.querySelector('[name="sub_class_select"]')?.value || '';
  const parentName = (form.querySelector('[name="parent_name"]')?.value || '').trim();
  const parentContact = (form.querySelector('[name="parent_contact"]')?.value || '').trim();
  const pictureFile = form.querySelector('[name="picture"]')?.files?.[0] || null;

  // Subclass logic: JHS 1 and JHS 2 require subclass, JHS 3 omits subclass
  let studentClass = mainClass;
  if (mainClass === 'JHS 1' || mainClass === 'JHS 2') {
    if (!subClass) {
      notify('Please select subclass (A or B) for ' + mainClass, 'warning');
      return;
    }
    studentClass = mainClass;
  } else if (mainClass === 'JHS 3') {
    subClass = null;
    studentClass = mainClass;
  }

  // Generate username & pin
  const firstPart = (firstName || '').split(/\s+/)[0] || '';
  const secondPart = (surname || '').split(/\s+/)[0] || '';
  const baseUsername = (firstPart + '.' + secondPart).toLowerCase().replace(/[^a-z0-9\.\-_]/g, '');
  const pin = typeof generatePin === 'function' ? generatePin() : Math.floor(1000 + Math.random() * 9000).toString();

  // Helper: check DB for existing username and produce a unique candidate
  async function ensureUniqueUsername(client, base, maxAttempts = 20) {
    if (!client) return base;
    let candidate = base;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const { data, error } = await client.from('students').select('username').eq('username', candidate).limit(1);
        if (error) {
          console.warn('Username uniqueness check error:', error);
          // fall back to candidate as-is
          return candidate;
        }
        if (!data || data.length === 0) return candidate; // available
      } catch (err) {
        console.warn('Username check catch:', err);
        return candidate;
      }
      // already exists — append a suffix and retry
      candidate = `${base}${i + 1}`;
    }
    // last resort: append timestamp fragment
    return `${base}_${Date.now().toString().slice(-4)}`;
  }

  // Upload picture if present
  let pictureUrl = null;
  if (pictureFile && window.supabaseClient) {
    try {
      _loader && _loader.update('Uploading picture...');
      const uploadPath = `students/${Date.now()}_${pictureFile.name}`;
      const { data: uploadData, error: uploadError } = await window.supabaseClient.storage.from('student-pictures').upload(uploadPath, pictureFile);
      if (uploadError) {
        console.warn('Picture upload failed:', uploadError.message);
      } else {
        const publicUrlResult = window.supabaseClient.storage.from('student-pictures').getPublicUrl(uploadData.path);
        pictureUrl = publicUrlResult?.data?.publicUrl || publicUrlResult?.publicUrl || null;
      }
    } catch (upErr) {
      console.warn('Picture upload exception', upErr);
    }
  }

  // Determine next register_id for this class (JHS1_1, JHS2_1, JHS3_1, etc.)
  let register_id = form.querySelector('[name="register_id"]')?.value || '';
  if (!register_id && window.supabaseClient) {
    // Only count by main class (not subclass)
    const { data: classStudents } = await window.supabaseClient.from('students').select('register_id').eq('class', studentClass);
    let nextNum = 1;
    if (classStudents && classStudents.length > 0) {
      const nums = classStudents.map(s => { const m = (s.register_id||'').match(/_(\d+)$/); return m ? parseInt(m[1],10) : 0; });
      nextNum = Math.max(...nums, 0) + 1;
    }
    register_id = studentClass.replace(/\s+/g,'').toUpperCase() + '_' + nextNum;
    const ridField = form.querySelector('[name="register_id"]'); if (ridField) ridField.value = register_id;
  }

  // Ensure username uniqueness before creating payload
  let finalUsername = baseUsername;
  if (window.supabaseClient) {
    finalUsername = await ensureUniqueUsername(window.supabaseClient, baseUsername);
  }

  const payload = {
    first_name: firstName,
    surname: surname,
    area: area || null,
    dob: dob || null,
    nhis_number: nhis || '',
    gender: gender || '',
    class: studentClass || '',
    subclass: (mainClass === 'JHS 1' || mainClass === 'JHS 2') ? subClass : null,
    parent_name: parentName || '',
    parent_contact: parentContact || '',
    username: finalUsername,
    pin,
    picture_url: pictureUrl,
    register_id
  };
  // If form contains student_id, perform update instead of insert to avoid duplicates
  const studentId = form.querySelector('[name="student_id"]')?.value || null;
  if (!window.supabaseClient) throw new Error('Supabase client not available');

  if (studentId) {
    // Build update payload but preserve username, pin and register_id by not overwriting them
    const updatePayload = {
      first_name: firstName,
      surname: surname,
      area: area || null,
      dob: dob || null,
      nhis_number: nhis || '',
      gender: gender || '',
      class: studentClass || '',
      subclass: subClass !== '' ? subClass : null,
      parent_name: parentName || '',
      parent_contact: parentContact || ''
    };
    if (pictureUrl) updatePayload.picture_url = pictureUrl;

    const { error } = await window.supabaseClient.from('students').update(updatePayload).eq('id', studentId).select();
    if (error) {
      console.error('Failed to update student:', error);
      throw error;
    }
    try { showToast('Student updated!', 'info', 3500); } catch (e) { /* fallback */ }
    if (typeof loadStudents === 'function') loadStudents();
    closeModal('studentModal');
    return;
  }

  // No studentId -> create new student record (insert). Try inserting and retry on username conflict.
  let insertError = null;
  const maxInsertAttempts = 6;
  for (let attempt = 0; attempt < maxInsertAttempts; attempt++) {
    const { data: insData, error } = await window.supabaseClient.from('students').insert([payload]).select();
    if (!error) { insertError = null; break; }
    insertError = error;
    const errMsg = (error && (error.message || error.details || '')).toString();
    const isUsernameConflict = errMsg.toLowerCase().includes('username') || (error.code && error.code === '23505');
    if (!isUsernameConflict) break;
    const suffix = '_' + Math.floor(1000 + Math.random() * 9000);
    finalUsername = `${baseUsername}${suffix}`;
    payload.username = finalUsername;
    console.warn(`Username conflict detected, retrying insert with username=${finalUsername} (attempt ${attempt + 1})`);
  }
  if (insertError) throw insertError;
  try { showToast(`Student added!\nUsername: ${finalUsername}\nPIN: [hidden for security]`, 'info', 6000); } catch (e) { try { safeNotify(`Student added!\nUsername: ${finalUsername}\nPIN: [hidden for security]`, 'info'); } catch (ee) { console.error('safeNotify failed', ee); } }
  if (typeof loadStudents === 'function') loadStudents();
  closeModal('studentModal');
  } finally {
    try { _loader && _loader.close(); } catch (e) {}
    try { if (saveBtn) saveBtn.disabled = false; } catch(e){}
    form._saving = false;
  }
}
function exportStudentsCSV() {
  if (!allStudents || allStudents.length === 0) {
  try { notify('No student data to export.', 'warning'); } catch (e) { try { safeNotify('No student data to export.', 'warning'); } catch (ee) { console.error('safeNotify failed', ee); } }
    return;
  }
  // Export as: Student ID, Full Name, Area, DOB, NHIS Number, Gender, Class, Subclass (JHS 1/2 only), Parent Name, Parent Contact
  const headers = [
    'Student ID', 'Full Name', 'Area', 'DOB', 'NHIS Number', 'Gender', 'Class', 'Subclass', 'Parent Name', 'Parent Contact'
  ];
  const rows = allStudents.map(s => [
    s.register_id || '',
    ((s.first_name || '') + (s.surname ? ' ' + s.surname : '')).trim(),
    s.area || '',
    s.dob || '',
    s.nhis_number || '',
    s.gender || '',
    s.class || '',
    (s.class === 'JHS 1' || s.class === 'JHS 2') ? (s.subclass || '') : '',
    s.parent_name || '',
    s.parent_contact || ''
  ]);
  let csvContent = '';
  csvContent += headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(val => '"' + val.replace(/"/g, '""') + '"').join(',') + '\n';
  });
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'students_export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
// Show attendance note if Class Teacher is selected in teacher modal
document.addEventListener('DOMContentLoaded', function() {
  var responsibilitySelect = document.getElementById('responsibility');
  var attendanceNote = document.getElementById('attendanceNote');
  var classTeacherSection = document.getElementById('classTeacherSection');
  var mainClassSelect = document.getElementById('main_class_select');
  var teacherSubClass = document.getElementById('sub_class_select');
  var hiddenClassField = document.getElementById('class_teacher_class');
  var hiddenClassMain = document.getElementById('class_teacher_class_main');
  var hiddenClassSub = document.getElementById('class_teacher_subclass');

  function updateClassTeacherUI() {
    // attendance note
    if (attendanceNote) attendanceNote.style.display = (responsibilitySelect && responsibilitySelect.value === 'Class Teacher') ? '' : 'none';
    // show/hide the class responsibility block
    if (classTeacherSection) {
      if (responsibilitySelect && responsibilitySelect.value === 'Class Teacher') {
        classTeacherSection.style.display = '';
        // ensure subclass visibility matches main class selection
        if (mainClassSelect) {
          if (mainClassSelect.value === 'JHS 1' || mainClassSelect.value === 'JHS 2') {
            if (teacherSubClass) { teacherSubClass.classList.remove('hidden-select'); teacherSubClass.required = true; }
            if (hiddenClassField) hiddenClassField.value = '';
            if (hiddenClassMain) hiddenClassMain.value = '';
            if (hiddenClassSub) hiddenClassSub.value = '';
          } else if (mainClassSelect.value === 'JHS 3') {
            if (teacherSubClass) { teacherSubClass.classList.add('hidden-select'); teacherSubClass.required = false; }
            if (hiddenClassField) hiddenClassField.value = 'JHS 3';
            if (hiddenClassMain) hiddenClassMain.value = 'JHS 3';
            if (hiddenClassSub) hiddenClassSub.value = '';
          } else {
            if (teacherSubClass) { teacherSubClass.classList.add('hidden-select'); teacherSubClass.required = false; }
            if (hiddenClassField) hiddenClassField.value = '';
            if (hiddenClassMain) hiddenClassMain.value = '';
            if (hiddenClassSub) hiddenClassSub.value = '';
          }
        }
      } else {
        // hide the whole section and clear values
        classTeacherSection.style.display = 'none';
        if (teacherSubClass) { teacherSubClass.classList.add('hidden-select'); teacherSubClass.required = false; }
        if (hiddenClassField) { hiddenClassField.value = ''; hiddenClassField.disabled = true; }
      }
    }
  }

  // Wire change listener on responsibility select
  if (responsibilitySelect) responsibilitySelect.addEventListener('change', updateClassTeacherUI);
  // Also wire main class change to adjust subclass visibility when the section is visible
  if (mainClassSelect) {
    mainClassSelect.addEventListener('change', function() {
      // Only affect subclass when classTeacherSection is visible (i.e., Class Teacher selected)
      if (classTeacherSection && classTeacherSection.style.display !== 'none') {
        if (mainClassSelect.value === 'JHS 1' || mainClassSelect.value === 'JHS 2') {
          if (teacherSubClass) { teacherSubClass.classList.remove('hidden-select'); teacherSubClass.required = true; }
          if (hiddenClassField) hiddenClassField.value = '';
          if (hiddenClassMain) hiddenClassMain.value = '';
          if (hiddenClassSub) hiddenClassSub.value = '';
        } else if (mainClassSelect.value === 'JHS 3') {
          if (teacherSubClass) { teacherSubClass.classList.add('hidden-select'); teacherSubClass.required = false; }
          if (hiddenClassField) hiddenClassField.value = 'JHS 3';
          if (hiddenClassMain) hiddenClassMain.value = 'JHS 3';
          if (hiddenClassSub) hiddenClassSub.value = '';
        } else {
          if (teacherSubClass) { teacherSubClass.classList.add('hidden-select'); teacherSubClass.required = false; }
          if (hiddenClassField) hiddenClassField.value = '';
          if (hiddenClassMain) hiddenClassMain.value = '';
          if (hiddenClassSub) hiddenClassSub.value = '';
        }
      }
    });
  }

  // initial state
  updateClassTeacherUI();
});

// Use the supabaseClient already declared in dashboard.js
// (Do not redeclare supabaseClient or createClient here)

// Show only the selected student's details in the table
function showSelectedStudent() {
  const studentId = document.getElementById('studentSelect').value;
  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';
  if (!studentId) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="12" class="center">No student selected</td>';
    tbody.appendChild(row);
    return;
  }
  // Find student in sorted order for consistency
  const sortedStudents = allStudents.slice().sort((a, b) => {
    if (!a.register_id || !b.register_id) return 0;
    const [ac, an] = a.register_id.split('_');
    const [bc, bn] = b.register_id.split('_');
    if (ac === bc) return parseInt(an, 10) - parseInt(bn, 10);
    return ac.localeCompare(bc);
  });
  const student = sortedStudents.find(s => s.id == studentId);
  if (!student) return;
  const name = (student.first_name && student.surname)
    ? student.first_name + ' ' + student.surname
    : (student.first_name || student.surname || '[No Name]');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td class="photo">${student.picture_url ? `<img src="${student.picture_url}" alt="pic" />` : ''}</td>
    <td class="name">${name}</td>
    <td class="mono">${student.area || ''}</td>
    <td class="center">${student.dob || ''}</td>
    <td class="mono">${student.nhis_number || ''}</td>
    <td class="center">${student.gender || ''}</td>
    <td class="center">${student.class || ''}</td>
    <td class="mono">${student.parent_name || ''}</td>
    <td class="mono">${student.parent_contact || ''}</td>
    <td class="mono">${student.username || ''}</td>
    <td class="center">${student.pin ? '••••' : ''}</td>
    <td class="actions">
      <button class="btn" onclick="editStudent('${student.id}')">Edit</button>
      <button class="btn" onclick="deleteStudent('${student.id}')">Delete</button>
      <button class="btn" onclick="resetStudentPin('${student.id}')">Reset PIN</button>
    </td>
  `;
  tbody.appendChild(row);
}

let allStudents = [];

// --- School Dates Logic ---
// Securely reset student PIN to default and set forcePinChange flag
async function resetStudentPin(studentId) {
  if (!studentId) return;
  if (!window.supabaseClient) {
    try { notify('PIN reset failed: Supabase client not found. Please refresh the page or contact IT support.', 'error'); } catch (e) { try { safeNotify('PIN reset failed: Supabase client not found. Please refresh the page or contact IT support.', 'error'); } catch (ee) { console.error('safeNotify failed', ee); } }
    return;
  }

  // Show a small progress indicator while we perform the reset
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Resetting PIN...', { color: '#0b66b2' }) : null;
  try {
    const { error } = await window.supabaseClient
      .from('students')
      .update({ pin: '1234', forcePinChange: true })
      .eq('id', studentId);
    if (error) {
      try { notify('Failed to reset PIN. Please check your Supabase connection and schema.', 'error'); } catch (e) { try { safeNotify('Failed to reset PIN. Please check your Supabase connection and schema.', 'error'); } catch (ee) { console.error('safeNotify failed', ee); } }
      return;
    }

    // If the logged-in student matches the reset student, clear session
    try {
      const loggedInStudentId = localStorage.getItem('studentId');
      if (loggedInStudentId && loggedInStudentId === studentId) {
        localStorage.removeItem('studentId');
        localStorage.removeItem('studentSession');
        localStorage.removeItem('studentUsername');
        localStorage.removeItem('studentPin');
        if (window.location.pathname.includes('student-dashboard')) {
          try { localStorage.setItem('openLoginRole', 'student'); } catch (e) {}
          window.location.href = 'index.html';
        }
      }
    } catch (e) { /* ignore */ }

    try { notify('Student PIN has been reset. The student will be required to change their PIN on next login.', 'info'); } catch (e) { try { safeNotify('Student PIN has been reset. The student will be required to change their PIN on next login.', 'info'); } catch (ee) { console.error('safeNotify failed', ee); } }
    if (typeof showSelectedStudent === 'function') showSelectedStudent();
  } finally {
    try { loader && loader.close(); } catch (e) {}
  }
}
async function fetchAndDisplaySchoolDates() {
  const { data, error } = await supabaseClient
    .from('school_dates')
    .select('*')
    .order('inserted_at', { ascending: false })
    .limit(1);
  // Helper to safely set textContent/value only if the element exists
  function safeSetText(id, text) {
    try {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    } catch (e) { /* ignore */ }
  }
  function safeSetValue(id, value) {
    try {
      const el = document.getElementById(id);
      if (el) el.value = value;
    } catch (e) { /* ignore */ }
  }

  if (error) {
    safeSetText('vacationDateDisplay', '—');
    safeSetText('reopenDateDisplay', '—');
    return;
  }
  const latest = data && data.length > 0 ? data[0] : null;
  safeSetText('vacationDateDisplay', latest && latest.vacation_date ? new Date(latest.vacation_date).toLocaleDateString() : '—');
  safeSetText('reopenDateDisplay', latest && latest.reopen_date ? new Date(latest.reopen_date).toLocaleDateString() : '—');
  // Pre-fill modal form if editing (guard inputs)
  if (latest) {
    safeSetValue('vacation_date', latest.vacation_date || '');
    safeSetValue('reopen_date', latest.reopen_date || '');
    safeSetValue('attendance_total_days', latest.attendance_total_days || '');
  } else {
    safeSetValue('vacation_date', '');
    safeSetValue('reopen_date', '');
    safeSetValue('attendance_total_days', '');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAndDisplaySchoolDates();
  const schoolDatesForm = document.getElementById('schoolDatesForm');
    if (schoolDatesForm) {
    schoolDatesForm.onsubmit = async function(e) {
      e.preventDefault();
      const vacation_date = document.getElementById('vacation_date').value;
      const reopen_date = document.getElementById('reopen_date').value;
      const attendance_total_days = parseInt(document.getElementById('attendance_total_days').value, 10);
      if (isNaN(attendance_total_days) || attendance_total_days < 1) {
      try { notify('Please enter a valid number for Actual Attendance Days.', 'warning'); } catch (e) { try { safeNotify('Please enter a valid number for Actual Attendance Days.', 'warning'); } catch (ee) { console.error('safeNotify failed', ee); } }
        return;
      }
      const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Saving school dates...', { color: '#0b66b2' }) : null;
      try {
        // Upsert (insert or update latest row)
        const { data, error } = await supabaseClient
          .from('school_dates')
          .upsert([
            { vacation_date, reopen_date, attendance_total_days }
          ]);
        if (error) {
          try { showToast('Failed to save dates', 'error'); } catch (e) {}
          return;
        }
        closeModal('schoolDatesModal');
        fetchAndDisplaySchoolDates();
      } finally {
        try { loader && loader.close(); } catch (e) {}
      }
    };
  }

  // Events modal logic
  fetchAndRenderEvents();
  const eventsForm = document.getElementById('eventsForm');
  if (eventsForm) {
    eventsForm.onsubmit = async function(e) {
      e.preventDefault();
      const title = document.getElementById('event_title').value;
      const date = document.getElementById('event_date').value;
      const details = document.getElementById('event_desc').value;
      const type = 'event';
      const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Saving event...', { color: '#0b66b2' }) : null;
      try {
        const { error } = await supabaseClient.from('events').insert([
          { title, date, details, type }
        ]);
        if (error) {
          try { showToast('Failed to save event', 'error'); } catch (e) {}
          return;
        }
        closeModal('eventsModal');
        eventsForm.reset();
        fetchAndRenderEvents();
      } finally {
        try { loader && loader.close(); } catch (e) {}
      }
    };
  }
});
// Fetch and render events for admin
async function fetchAndRenderEvents() {
  const { data, error } = await supabaseClient
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  const eventsSection = document.getElementById('eventsSection');
  if (!eventsSection) return;
  eventsSection.innerHTML = '';
  if (error || !data || data.length === 0) {
    eventsSection.innerHTML = '<p>No events found.</p>';
    return;
  }
  data.forEach(event => {
    const div = document.createElement('div');
    div.className = 'event-item';
    div.innerHTML = `
      <div class="event-date">${new Date(event.date).toLocaleDateString()}</div>
      <div class="event-title">${event.title}</div>
      <div class="event-desc">${event.details}</div>
      <button class="delete-event-btn" onclick="deleteEvent('${event.id}')">Delete</button>
    `;
    eventsSection.appendChild(div);
  });
}

// Delete event by id
async function deleteEvent(eventId) {
  try {
    const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Delete this event?', { title: 'Delete event' }) : confirm('Delete this event?');
    if (!ok) return;
  } catch (e) { return; }
  const { error } = await supabaseClient.from('events').delete().eq('id', eventId);
  if (error) {
  try { notify('Failed to delete event', 'error'); } catch (e) { try { if (window.safeNotify) window.safeNotify('Failed to delete event', 'error'); else if (window._originalAlert) window._originalAlert('Failed to delete event'); else console.debug('Failed to delete event'); } catch(err){ console.debug('Failed to delete event'); } }
    return;
  }
  fetchAndRenderEvents();
}

// Fetch all students on page load
window.addEventListener('DOMContentLoaded', async () => {
  await fetchAndRenderStudents();
  const classFilterEl = document.getElementById('classFilter');
  if (classFilterEl) classFilterEl.addEventListener('change', filterStudentsByClass);
  // Ensure selecting a student shows the student table. Attach change listener here so it
  // remains active even if the students section is moved into a modal (moving nodes keeps
  // event listeners, but attaching here guarantees behavior on initial load).
  try {
    const studentSelectEl = document.getElementById('studentSelect');
    if (studentSelectEl) {
      studentSelectEl.addEventListener('change', function() {
        try { if (typeof window.showSelectedStudent === 'function') window.showSelectedStudent(); } catch (e) { console.warn('showSelectedStudent failed on change', e); }
      });
    }
    const teacherSelectEl = document.getElementById('teacherSelect');
    if (teacherSelectEl) {
      // Use a shared, named handler so modal code can remove/add the same reference and avoid duplicates
      if (!window._globalTeacherSelectHandler) {
        window._globalTeacherSelectHandler = function() {
          try { if (typeof window.showSelectedTeacher === 'function') window.showSelectedTeacher(); } catch (e) { console.warn('showSelectedTeacher failed on change', e); }
        };
      }
      // Ensure we don't add multiple listeners
      try { teacherSelectEl.removeEventListener('change', window._globalTeacherSelectHandler); } catch (e) {}
      teacherSelectEl.addEventListener('change', window._globalTeacherSelectHandler);
    }
  } catch (e) {
    console.warn('Failed to attach studentSelect change listener', e);
  }
});

async function fetchAndRenderStudents() {
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Loading students...', { color: '#0b66b2' }) : null;
  try {
    const { data, error } = await supabaseClient.from('students').select('*');
    if (error) {
      try { notify('Failed to fetch students', 'error'); } catch (e) { try { if (window.safeNotify) window.safeNotify('Failed to fetch students', 'error'); else if (window._originalAlert) window._originalAlert('Failed to fetch students'); else console.debug('Failed to fetch students'); } catch(err){ console.debug('Failed to fetch students'); } }
      return;
    }
  // Sort students by register_id (natural order: class, then number)
  allStudents = (data || []).slice().sort((a, b) => {
    if (!a.register_id || !b.register_id) return 0;
    const [ac, an] = a.register_id.split('_');
    const [bc, bn] = b.register_id.split('_');
    if (ac === bc) return parseInt(an, 10) - parseInt(bn, 10);
    return ac.localeCompare(bc);
  });
  filterStudentsByClass();
  } finally {
    try { loader && loader.close(); } catch (e) {}
  }
}

function filterStudentsByClass() {
  window.filterStudentDropdown();
  // Clear student table and show message
  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';
  const row = document.createElement('tr');
  row.innerHTML = '<td colspan="12" style="text-align:center;">No student selected</td>';
  tbody.appendChild(row);
}

/* ------------------------------------------------------------------
   Mobile stacked table support (admin tables)
   -----------------------------------------------------------
   Many global styles convert tables into stacked blocks on small viewports
   and use `td:before { content: attr(data-label); }` to show the header label
   beside each value. To support that pattern reliably for admin tables we
   programmatically set `data-label` on each `td` from the corresponding
   `thead th` text and observe the tbody for changes so newly-inserted rows
   also receive labels.
*/
function setTableDataLabels(table) {
  if (!table) return;
  const thead = table.querySelector('thead');
  if (!thead) return;
  const headers = Array.from(thead.querySelectorAll('th')).map(h => h.textContent.trim());
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  Array.from(tbody.querySelectorAll('tr')).forEach(tr => {
    const cells = Array.from(tr.children).filter(el => el.tagName && el.tagName.toLowerCase() === 'td');
    for (let i = 0; i < cells.length; i++) {
      const hdr = headers[i] || '';
      if (hdr) {
        cells[i].setAttribute('data-label', hdr);
      } else {
        // remove stale attribute if header not available
        cells[i].removeAttribute('data-label');
      }
    }
  });
}

function observeTableForDataLabels(table) {
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;
  // apply once now
  setTableDataLabels(table);
  // avoid duplicating observers
  if (tbody._dataLabelObserver) return;
  const mo = new MutationObserver(mutations => {
    let changed = false;
    for (const m of mutations) {
      if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) { changed = true; break; }
      if (m.type === 'attributes' && m.attributeName === 'class') { changed = true; break; }
    }
    if (changed) setTableDataLabels(table);
  });
  mo.observe(tbody, { childList: true, subtree: false, attributes: true, attributeFilter: ['class'] });
  tbody._dataLabelObserver = mo;
}

function initAdminTableDataLabels() {
  // target admin-scoped grid tables
  const tables = document.querySelectorAll('.admin-dashboard .grid-table-4-accent-3');
  tables.forEach(t => observeTableForDataLabels(t));
  // Watch for tables added later under .admin-dashboard
  const root = document.querySelector('.admin-dashboard');
  if (!root) return;
  if (root._adminTableObserver) return;
  const rootMo = new MutationObserver(muts => {
    let added = false;
    for (const m of muts) {
      if (m.type === 'childList' && m.addedNodes.length) { added = true; break; }
    }
    if (added) {
      const tables = document.querySelectorAll('.admin-dashboard .grid-table-4-accent-3');
      tables.forEach(t => observeTableForDataLabels(t));
    }
  });
  rootMo.observe(root, { childList: true, subtree: true });
  root._adminTableObserver = rootMo;
}

// Initialize on DOMContentLoaded so headers exist. Also call once now in case
// this script executes after DOMContentLoaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminTableDataLabels);
} else {
  setTimeout(initAdminTableDataLabels, 0);
}
