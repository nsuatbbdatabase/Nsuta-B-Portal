// Filter student dropdown by search box
window.filterStudentDropdown = function filterStudentDropdown() {
  const search = document.getElementById('studentSearch').value.trim().toLowerCase();
  const classValue = document.getElementById('classFilter').value.trim().toUpperCase();
  let filtered = classValue
    ? allStudents.filter(s => (s.class || '').trim().toUpperCase() === classValue)
    : allStudents;
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
    modal.classList.remove('hidden');
    modal.style.display = '';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
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
  // --- Student registration modal: show subclass select when main class is selected ---
  var studentMainClass = document.getElementById('student_main_class_select');
  var studentSubClass = document.getElementById('student_sub_class_select');
  if (studentMainClass && studentSubClass) {
    studentMainClass.addEventListener('change', function() {
      if (studentMainClass.value === 'JHS 1' || studentMainClass.value === 'JHS 2') {
        studentSubClass.style.display = '';
        studentSubClass.value = '';
      } else {
        studentSubClass.style.display = 'none';
        studentSubClass.value = '';
      }
    });
  }
  // --- Class/Subclass selection logic for Class Teacher ---
  var mainClass = document.getElementById('main_class_select');
  var subClass = document.getElementById('sub_class_select');
  var hiddenClass = document.getElementById('class_teacher_class');
  if (mainClass && subClass && hiddenClass) {
    mainClass.addEventListener('change', function() {
      if (mainClass.value === 'JHS 1' || mainClass.value === 'JHS 2') {
        subClass.style.display = '';
        subClass.value = '';
        hiddenClass.value = '';
      } else if (mainClass.value === 'JHS 3') {
        subClass.style.display = 'none';
        subClass.value = '';
        hiddenClass.value = 'JHS 3';
      } else {
        subClass.style.display = 'none';
        subClass.value = '';
        hiddenClass.value = '';
      }
    });
    subClass.addEventListener('change', function() {
      if (mainClass.value && subClass.value) {
        hiddenClass.value = mainClass.value + ' ' + subClass.value;
      } else {
        hiddenClass.value = '';
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
          classField.value = 'JHS 3';
        } else if (mainClass.value && subClass.value) {
          classField.value = mainClass.value + ' ' + subClass.value;
        }
        classField.disabled = false;
      } else {
        if (classField) {
          classField.value = '';
          classField.disabled = true;
        }
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
      // Get the first row's id if exists, else insert new
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
        promotionPassMarkStatus.textContent = 'Saved!';
        promotionPassMarkStatus.style.color = 'green';
      } else {
        promotionPassMarkStatus.textContent = 'Error saving.';
        promotionPassMarkStatus.style.color = 'red';
      }
      setTimeout(() => { promotionPassMarkStatus.textContent = ''; }, 2000);
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
          // Fix subclass logic: if class is JHS 1 or JHS 2, keep subclass; if JHS 3, set subclass to null
          if (studentData['class'] === 'JHS 1' || studentData['class'] === 'JHS 2') {
            // If subclass is missing, set to empty string
            if (!('subclass' in studentData)) studentData['subclass'] = '';
          } else {
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
          // Prevent duplicate by username/class
          const { data: existing, error: existErr } = await supabaseClient.from('students').select('id').eq('username', studentData.username).eq('class', studentData.class);
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
          const { error } = await supabaseClient.from('students').insert([insertData]);
          if (error) {
            failCount++;
            invalidRows.push(i+1);
          } else {
            successCount++;
          }
        }
        let msg = `Import complete. Success: ${successCount}, Failed: ${failCount}`;
        if (duplicateRows.length) msg += `\nDuplicate students (already exist in this class): ${duplicateRows.join(', ')}`;
        if (invalidRows.length) msg += `\nRows with missing/invalid fields or other errors: ${invalidRows.join(', ')}`;
        notify(msg, 'info');
      };
      reader.readAsText(file);
    });
  }
});

// Simple toast UI helper: showToast(message, type="info", durationMs=3500)
function showToast(message, type = 'info', durationMs = 3500) {
  try {
    const container = document.getElementById('toastContainer');
    if (!container) { console.log('Toast:', message); return; }
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
    console.log('Toast error:', e, message);
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
  console.log('Document-level submit captured for form:', e.target && (e.target.id || e.target.name) ? (e.target.id || e.target.name) : e.target);
}, true);
  // Intercept student form submission to support full name splitting and proper required field validation
  const studentForm = document.getElementById('studentForm');
  if (studentForm) {
    studentForm.addEventListener('submit', function(e) {
      // Always prevent browser default submit/validation; we manage everything in JS
      e.preventDefault();
      console.log('studentForm submit handler invoked');
      // Validate all required fields
      const mainClass = studentForm.querySelector('[name="main_class_select"]');
      const subClass = studentForm.querySelector('[name="sub_class_select"]');
      const firstName = studentForm.querySelector('[name="first_name"]');
      const surname = studentForm.querySelector('[name="surname"]');
      const area = studentForm.querySelector('[name="area"]');
      const dob = studentForm.querySelector('[name="dob"]');
      const gender = studentForm.querySelector('[name="gender"]');
      const parentName = studentForm.querySelector('[name="parent_name"]');
      const parentContact = studentForm.querySelector('[name="parent_contact"]');
      let combinedClass = '';
      // Validate required fields
      if (!firstName.value.trim()) { notify('Please enter first name.', 'warning'); firstName.focus(); return; }
      if (!surname.value.trim()) { notify('Please enter surname.', 'warning'); surname.focus(); return; }
      if (!area.value.trim()) { notify('Please enter area.', 'warning'); area.focus(); return; }
      if (!dob.value) { notify('Please enter date of birth.', 'warning'); dob.focus(); return; }
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
    try { notify('Duplicate student detected: ' + first_name + ' ' + surname + ' in class ' + (classInput ? classInput.value : ''), 'warning'); } catch (e) { alert('Duplicate student detected: ' + first_name + ' ' + surname + ' in class ' + (classInput ? classInput.value : '')); }
          return;
        }
        window._studentNameClassSet.add(nameClass);
      }
      // Passed validation — create student via JS flow
      console.log('studentForm validation passed, creating student...');
  createStudentFromForm(studentForm).catch(err => { console.error(err); try { notify('Failed to save student: ' + (err.message || err), 'error'); } catch (e) { alert('Failed to save student: ' + (err.message || err)); } });
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
            try { notify('Failed to save student. See console for details.', 'error'); } catch (e) { alert('Failed to save student. See console for details.'); }
          });
        }
      });
    }
  }

// Create student record from the provided form element (uploads picture, assigns register_id)
async function createStudentFromForm(form) {
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

  // Only JHS 1 and JHS 2 have subclass, JHS 3 should be null
  if (mainClass === 'JHS 3') subClass = null;
  const studentClass = (mainClass && subClass) ? `${mainClass} ${subClass}` : (mainClass || '');

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
    const uploadPath = `students/${Date.now()}_${pictureFile.name}`;
    const { data: uploadData, error: uploadError } = await window.supabaseClient.storage.from('student-pictures').upload(uploadPath, pictureFile);
    if (uploadError) {
      console.warn('Picture upload failed:', uploadError.message);
    } else {
      const publicUrlResult = window.supabaseClient.storage.from('student-pictures').getPublicUrl(uploadData.path);
      pictureUrl = publicUrlResult?.data?.publicUrl || publicUrlResult?.publicUrl || null;
    }
  }

  // Determine next register_id for this class
  let register_id = form.querySelector('[name="register_id"]')?.value || '';
  if (!register_id && window.supabaseClient) {
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
  subclass: subClass !== '' ? subClass : null,
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

    const { error } = await window.supabaseClient.from('students').update(updatePayload).eq('id', studentId);
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
    const { error } = await window.supabaseClient.from('students').insert([payload]);
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
  try { showToast(`Student added!\nUsername: ${finalUsername}\nPIN: [hidden for security]`, 'info', 6000); } catch (e) { alert(`Student added!\nUsername: ${finalUsername}\nPIN: [hidden for security]`); }
  if (typeof loadStudents === 'function') loadStudents();
  closeModal('studentModal');
}
function exportStudentsCSV() {
  if (!allStudents || allStudents.length === 0) {
    try { notify('No student data to export.', 'warning'); } catch (e) { alert('No student data to export.'); }
    return;
  }
  // Export as: Student ID, Full Name, Area, DOB, NHIS Number, Gender, Class, Subclass, Parent Name, Parent Contact
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
    s.subclass || '',
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
  if (responsibilitySelect && attendanceNote) {
    responsibilitySelect.addEventListener('change', function() {
      if (responsibilitySelect.value === 'Class Teacher') {
        attendanceNote.style.display = '';
      } else {
        attendanceNote.style.display = 'none';
      }
    });
  }
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
    row.innerHTML = '<td colspan="12" style="text-align:center;">No student selected</td>';
    tbody.appendChild(row);
    return;
  }
  const student = allStudents.find(s => s.id == studentId);
  if (!student) return;
  const name = (student.first_name && student.surname)
    ? student.first_name + ' ' + student.surname
    : (student.first_name || student.surname || '[No Name]');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${student.picture_url ? `<img src="${student.picture_url}" alt="pic" width="40">` : ''}</td>
    <td>${name}</td>
    <td>${student.area || ''}</td>
    <td>${student.dob || ''}</td>
    <td>${student.nhis_number || ''}</td>
    <td>${student.gender || ''}</td>
    <td>${student.class || ''}</td>
    <td>${student.parent_name || ''}</td>
    <td>${student.parent_contact || ''}</td>
    <td>${student.username || ''}</td>
  <td>${student.pin ? '••••' : ''}</td>
    <td>
      <button class="edit-btn" onclick="editStudent('${student.id}')">Edit</button>
      <button class="delete-btn" onclick="deleteStudent('${student.id}')">Delete</button>
        <button class="reset-pin-btn" onclick="resetStudentPin('${student.id}')">Reset PIN</button>
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
  try { notify('PIN reset failed: Supabase client not found. Please refresh the page or contact IT support.', 'error'); } catch (e) { alert('PIN reset failed: Supabase client not found. Please refresh the page or contact IT support.'); }
    // Optionally disable the button to prevent further attempts
    const btn = document.querySelector(`button.reset-pin-btn[onclick*="${studentId}"]`);
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Supabase Error';
      btn.style.background = '#ccc';
      btn.style.cursor = 'not-allowed';
    }
    return;
  }
  // Update student PIN to default and set forcePinChange flag (camelCase)
  const { error } = await window.supabaseClient
    .from('students')
    .update({ pin: '1234', forcePinChange: true })
    .eq('id', studentId);
  if (error) {
  try { notify('Failed to reset PIN. Please check your Supabase connection and schema.', 'error'); } catch (e) { alert('Failed to reset PIN. Please check your Supabase connection and schema.'); }
    return;
  }
  // Log out student if currently logged in
  try {
    // If the logged-in student matches the reset student, clear session
    const loggedInStudentId = localStorage.getItem('studentId');
    if (loggedInStudentId && loggedInStudentId === studentId) {
      localStorage.removeItem('studentId');
      localStorage.removeItem('studentSession');
      localStorage.removeItem('studentUsername');
      localStorage.removeItem('studentPin');
      // Optionally, redirect if on student dashboard
        if (window.location.pathname.includes('student-dashboard')) {
          try { localStorage.setItem('openLoginRole', 'student'); } catch (e) {}
          window.location.href = 'index.html';
        }
    }
  } catch (e) {
    // Ignore errors
  }
  try { notify('Student PIN has been reset. The student will be required to change their PIN on next login.', 'info'); } catch (e) { alert('Student PIN has been reset. The student will be required to change their PIN on next login.'); }
  // Optionally refresh student view
  if (typeof showSelectedStudent === 'function') showSelectedStudent();
}
async function fetchAndDisplaySchoolDates() {
  const { data, error } = await supabaseClient
    .from('school_dates')
    .select('*')
    .order('inserted_at', { ascending: false })
    .limit(1);
  if (error) {
    document.getElementById('vacationDateDisplay').textContent = '—';
    document.getElementById('reopenDateDisplay').textContent = '—';
    return;
  }
  const latest = data && data.length > 0 ? data[0] : null;
  document.getElementById('vacationDateDisplay').textContent = latest && latest.vacation_date ? new Date(latest.vacation_date).toLocaleDateString() : '—';
  document.getElementById('reopenDateDisplay').textContent = latest && latest.reopen_date ? new Date(latest.reopen_date).toLocaleDateString() : '—';
  // Pre-fill modal form if editing
  if (latest) {
    document.getElementById('vacation_date').value = latest.vacation_date || '';
    document.getElementById('reopen_date').value = latest.reopen_date || '';
    document.getElementById('attendance_total_days').value = latest.attendance_total_days || '';
  } else {
    document.getElementById('vacation_date').value = '';
    document.getElementById('reopen_date').value = '';
    document.getElementById('attendance_total_days').value = '';
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
      try { notify('Please enter a valid number for Actual Attendance Days.', 'warning'); } catch (e) { alert('Please enter a valid number for Actual Attendance Days.'); }
        return;
      }
      // Upsert (insert or update latest row)
      const { data, error } = await supabaseClient
        .from('school_dates')
        .upsert([
          { vacation_date, reopen_date, attendance_total_days }
        ]);
      if (error) {
  try { notify('Failed to save dates', 'error'); } catch (e) { alert('Failed to save dates'); }
        return;
      }
      closeModal('schoolDatesModal');
      fetchAndDisplaySchoolDates();
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
      const { error } = await supabaseClient.from('events').insert([
        { title, date, details, type }
      ]);
      if (error) {
  try { notify('Failed to save event', 'error'); } catch (e) { alert('Failed to save event'); }
        return;
      }
      closeModal('eventsModal');
      eventsForm.reset();
      fetchAndRenderEvents();
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
  if (!confirm('Delete this event?')) return;
  const { error } = await supabaseClient.from('events').delete().eq('id', eventId);
  if (error) {
  try { notify('Failed to delete event', 'error'); } catch (e) { alert('Failed to delete event'); }
    return;
  }
  fetchAndRenderEvents();
}

// Fetch all students on page load
window.addEventListener('DOMContentLoaded', async () => {
  await fetchAndRenderStudents();
  document.getElementById('classFilter').addEventListener('change', filterStudentsByClass);
});

async function fetchAndRenderStudents() {
  const { data, error } = await supabaseClient.from('students').select('*');
  if (error) {
  try { notify('Failed to fetch students', 'error'); } catch (e) { alert('Failed to fetch students'); }
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
