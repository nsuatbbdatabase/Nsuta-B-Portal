// Show/hide class teacher section based on responsibility in teacher modal
document.addEventListener('DOMContentLoaded', function() {
  // --- Teacher Form Submission Logic: Ensure class_teacher_class is set ---
  const teacherForm = document.getElementById('teacherForm');
  if (teacherForm) {
    teacherForm.addEventListener('submit', async function(e) {
      // Set class_teacher_class before submit
      const resp = teacherForm.querySelector('[name="responsibility"]').value;
      const mainClass = teacherForm.querySelector('[name="main_class_select"]');
      const subClass = teacherForm.querySelector('[name="sub_class_select"]');
      const classField = teacherForm.querySelector('[name="class_teacher_class"]');
      if (resp === 'Class Teacher') {
        if (mainClass && mainClass.value === 'JHS 3') {
          classField.value = 'JHS 3';
        } else if (mainClass && subClass && mainClass.value && subClass.value) {
          classField.value = mainClass.value + ' ' + subClass.value;
        }
      } else {
        if (classField) classField.value = '';
      }
      // Collect all form data and send to Supabase
      // (Replace this with your actual Supabase insert/update logic)
      // let formData = new FormData(teacherForm);
      // let teacherData = Object.fromEntries(formData.entries());
      // await supabaseClient.from('teachers').insert([teacherData]);
    });
  }
  var respSelect = document.getElementById('responsibility');
  var classSection = document.getElementById('classTeacherSection');
  if (respSelect && classSection) {
    respSelect.addEventListener('change', function() {
      if (respSelect.value === 'Class Teacher') {
        classSection.style.display = '';
        document.getElementById('class_teacher_class').required = true;
      } else {
        classSection.style.display = 'none';
        document.getElementById('class_teacher_class').required = false;
        document.getElementById('class_teacher_class').value = '';
      }
    });
  }
});
// Notification helper: prefer in-page toast if available; fall back to safeNotify or original alert
const notify = (msg, type='info') => {
  try {
    if (window.showToast) return window.showToast(msg, type);
    if (window.safeNotify) return window.safeNotify(msg, type);
    if (window._originalAlert) return window._originalAlert(String(msg));
      // fallback: nothing else to do; keep silent in production
    } catch (e) { /* swallow notify errors silently */ }
};
// Utility: Create a test teacher user for login
async function createTestTeacher() {
  // Check if test user already exists
  const { data: existing } = await supabaseClient.from('teachers').select('*').eq('staff_id', 'TST001');
  if (existing && existing.length > 0) {
    // Do not expose PINs in notifications for security
    notify(`Test teacher already exists.\nStaff ID: ${existing[0].staff_id}\nPIN: [hidden for security]`, 'warning');
    return;
  }
  const pin = '1234';
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Creating test teacher...', { color: '#0b66b2' }) : null;
  try {
    const { error } = await supabaseClient.from('teachers').insert([{
      name: 'Test Teacher',
    gender: 'Male',
    dob: '1990-01-01',
    staff_id: 'TST001',
    ntc: 'NTC123',
    registered_number: 'REG123',
    ssnit: 'SSNIT123',
    ghana_card: 'GC123',
    contact: '0244000000',
    rank: 'Senior',
    qualification: 'B.Ed',
    classes: '{"JHS 1"}',
    subjects: '{"Maths"}',
    first_appointment_date: '2015-09-01',
    date_placed_on_rank: '2018-09-01',
    salary_level: 'GL15',
    bank: 'GCB',
    bank_branch: 'Nkawkaw',
    bank_account_number: '1234567890',
    highest_professional_qualification: 'PGDE',
    professional_qualification_date: '2016-07-01',
    last_promotion_date: '2020-09-01',
    previous_station: 'Old School',
    years_at_present_school: 5,
    due_for_promotion: 'GL16',
    responsibility: 'Class Teacher',
    denomination: 'Presbyterian Church of Ghana',
    home_town: 'Nkawkaw',
    pin
    }]);
    if (error) {
      notify('Failed to create test teacher: ' + error.message, 'error');
    } else {
      // Do not expose PINs in notifications
      notify(`Test teacher created!\nStaff ID: TST001\nPIN: [hidden for security]`, 'info');
    }
  } finally {
    try { loader && loader.close(); } catch (e) {}
  }
}

// Call this ONCE to create a test teacher (uncomment to use):
// createTestTeacher();
// 🗑️ Delete Teacher
async function deleteTeacher(id) {
  try {
    const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Are you sure you want to delete this teacher?', { title: 'Delete teacher' }) : confirm('Are you sure you want to delete this teacher?');
    if (!ok) return;
  } catch (e) { return; }
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Deleting teacher...', { color: '#c62828' }) : null;
  try {
    const { error } = await supabaseClient.from('teachers').delete().eq('id', id);
    if (error) notify('Delete failed: ' + (error.message || ''), 'error');
    else {
      notify('Teacher deleted.', 'info');
      loadTeachers();
    }
  } finally {
    try { loader && loader.close(); } catch (e) {}
  }
}
// 🗑️ Delete Admin
async function deleteAdmin(id) {
  try {
    const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Are you sure you want to delete this admin?', { title: 'Delete admin' }) : confirm('Are you sure you want to delete this admin?');
    if (!ok) return;
  } catch (e) { return; }
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Deleting admin...', { color: '#c62828' }) : null;
  try {
    const { error } = await supabaseClient.from('admins').delete().eq('id', id);
    if (error) notify('Delete failed: ' + (error.message || ''), 'error');
    else {
      notify('Admin deleted.', 'info');
      loadAdmins();
    }
  } finally {
    try { loader && loader.close(); } catch (e) {}
  }
}
// � Edit Admin
async function editAdmin(id) {
  const { data, error } = await supabaseClient.from('admins').select('*').eq('id', id).single();
  if (error) return notify('Failed to load admin.', 'error');
  const form = document.getElementById('adminForm');
  if (!form) {
  notify('Admin form not found in the HTML.', 'error');
    return;
  }
  form.admin_id.value = data.id || '';
  form.full_name.value = data.full_name || '';
  form.email.value = data.email || '';
  form.phone.value = data.phone || '';
  form.pin.value = data.pin || '';
  openModal('adminModal');
}
// �📋 Load Admins
async function loadAdmins() {
  const { data, error } = await supabaseClient.from('admins').select('*');
  const tbody = document.querySelector('#adminTable tbody');
  tbody.innerHTML = '';
  if (error) {
    console.error('Failed to load admins:', error.message);
    return;
  }
  data.forEach(admin => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="name">${admin.full_name || ''}</td>
      <td class="mono">${admin.email || ''}</td>
      <td class="mono">${admin.phone || ''}</td>
      <td class="center">${admin.pin ? '••••' : ''}</td>
      <td class="actions">
        <button class="btn" onclick="editAdmin('${admin.id}')">Edit</button>
        <button class="btn" onclick="deleteAdmin('${admin.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}
// 📋 Load Teachers
document.getElementById('adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  // Confirm before saving admin
  try {
    let pref = null;
    try { pref = localStorage.getItem('nsuta_confirm_save_admin'); } catch (e) { pref = null; }
    if (pref === 'false') {
      // proceed without confirmation
    } else {
      const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Save admin changes?', { title: 'Confirm save', rememberKey: 'save_admin' }) : confirm('Save admin changes?');
      if (!ok) return;
    }
  } catch (err) { return; }
  // prevent double submit
  if (form._saving) return;
  form._saving = true;
  const submitBtn = form.querySelector('button[type="submit"]');
  try { if (submitBtn) submitBtn.disabled = true; } catch(e){}

  const adminId = form.admin_id.value;
  const adminData = {
    full_name: form.full_name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    pin: form.pin.value.trim()
  };
  // Show loader while saving
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast(adminId ? 'Updating admin...' : 'Registering admin...', { color: '#0b66b2' }) : null;
  try {
    let result;
    if (adminId) {
      result = await supabaseClient.from('admins').update(adminData).eq('id', adminId).select();
    } else {
      result = await supabaseClient.from('admins').insert([adminData]).select();
    }

    if (result.error) {
      notify('Error: ' + result.error.message, 'error');
    } else {
      notify(adminId ? 'Admin updated!' : `Admin registered: ${adminData.full_name}`, 'info');
      form.reset();
      closeModal('adminModal');
      loadAdmins();
    }
  } finally {
    try { loader && loader.close(); } catch (e) {}
    try { if (submitBtn) submitBtn.disabled = false; } catch(e){}
    form._saving = false;
  }
});
async function loadTeachers() {
  const { data, error } = await supabaseClient.from('teachers').select('*');
  const tbody = document.querySelector('#teacherTable tbody');
  const select = document.getElementById('teacherSelect');
  tbody.innerHTML = '';
  if (select) {
    select.innerHTML = '<option value="">-- Select Teacher --</option>';
    if (data && Array.isArray(data)) {
      data.forEach(teacher => {
        const opt = document.createElement('option');
        opt.value = teacher.id;
        opt.textContent = teacher.name + ' (' + teacher.staff_id + ')';
        select.appendChild(opt);
      });
    }
  }
  // Show nothing by default until a teacher is selected
  // ...function ends, do not add extra closing brace here
}
// Show only the selected teacher's info in the table
window.showSelectedTeacher = function showSelectedTeacher() {
  const select = document.getElementById('teacherSelect');
  const tbody = document.querySelector('#teacherTable tbody');
  tbody.innerHTML = '';
  const teacherId = select.value;
  if (!teacherId) return;
  supabaseClient.from('teachers').select('*').eq('id', teacherId).single().then(({ data, error }) => {
    if (error || !data) return;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="name">${data.name}</td>
      <td class="center">${data.gender}</td>
      <td class="center">${data.dob}</td>
      <td class="mono">${data.staff_id}</td>
      <td class="mono">${data.ntc}</td>
      <td class="mono">${data.registered_number}</td>
      <td class="mono">${data.ssnit}</td>
      <td class="mono">${data.ghana_card}</td>
      <td class="mono">${data.contact}</td>
      <td class="center">${data.rank}</td>
      <td class="mono">${data.qualification}</td>
      <td class="mono">${data.classes?.join(', ') || ''}</td>
      <td class="mono">${data.subjects?.join(', ') || ''}</td>
      <td class="center">${data.pin ? '••••' : ''}</td>
      <td class="actions">
        <button class="btn" onclick="editTeacher('${data.id}')">Edit</button>
        <button class="btn" onclick="deleteTeacher('${data.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}
// ✅ Supabase client setup
const { createClient } = supabase;

const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'
);
window.supabaseClient = supabaseClient;

// 🔧 Modal controls
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// 🔢 Generators
const generateUsername = (fullName) =>
  fullName.trim().toLowerCase().replace(/\s+/g, '.');
const generatePin = () =>
  Math.floor(1000 + Math.random() * 9000).toString();
const getMultiSelectValues = (selectElement) =>
  Array.from(selectElement.selectedOptions).map(opt => opt.value);

// 🧑‍🎓 Student Registration
window.addEventListener('DOMContentLoaded', function() {
  // Show/hide subclass field based on class selection in student registration modal
  const classInput = document.querySelector('#studentForm [name="class"]');
  const subclassContainer = document.getElementById('subclassFieldContainer');
  if (classInput && subclassContainer) {
    subclassContainer.style.display = 'none';
    classInput.addEventListener('input', function() {
      if (classInput.value.trim()) {
        subclassContainer.style.display = '';
      } else {
        subclassContainer.style.display = 'none';
        document.querySelector('#studentForm [name="subclass"]').value = '';
      }
    });
  }
  const studentForm = document.getElementById('studentForm');
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      // Delegate to central create/update routine defined in admin.js to avoid duplicate insert/update
      if (typeof createStudentFromForm === 'function') {
        try {
          await createStudentFromForm(form);
        } catch (err) {
          console.error('createStudentFromForm error:', err);
          notify('Failed to save student. See console for details.', 'error');
        }
      } else {
        // Fallback: if createStudentFromForm not available, log and notify
        console.warn('createStudentFromForm not found; student save skipped.');
        notify('Student save routine not available. Please reload the page.', 'error');
      }
    });
  }
});

// 📥 CSV Import
function importCSV() {
  const input = document.getElementById('csvInput');
  const file = input.files[0];
  if (!file) return notify('Please select a CSV file.', 'warning');

  const reader = new FileReader();
  reader.onload = async (e) => {
    // Robust CSV parse: handle quoted fields, trim whitespace, ignore empty lines
    const raw = e.target.result;
    const lines = raw.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return notify('CSV file is empty or missing data.', 'warning');
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Importing CSV...', { color: '#0b66b2' }) : null;
  try {
    // Expect header: Student ID,Full Name,Area,DOB,NHIS Number,Gender,Class,Parent Name,Parent Contact
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    let successCount = 0, failCount = 0, errorRows = [];
    // Pre-fetch all current register_ids by class
    const { data: allCurrent } = await supabaseClient.from('students').select('class,register_id');
    const classCounters = {};
    if (allCurrent && Array.isArray(allCurrent)) {
      for (const s of allCurrent) {
        if (!s.class || !s.register_id) continue;
        const cls = s.class.replace(/\s+/g,'').toUpperCase();
        const m = (s.register_id||'').match(/_(\d+)$/);
        const num = m ? parseInt(m[1],10) : 0;
        if (!classCounters[cls] || classCounters[cls] < num) classCounters[cls] = num;
      }
    }
    for (let i = 1; i < lines.length; i++) {
      let row = [];
      let inQuotes = false, field = '';
      for (let c = 0; c < lines[i].length; c++) {
        const char = lines[i][c];
        if (char === '"') {
          if (inQuotes && lines[i][c+1] === '"') { field += '"'; c++; }
          else inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(field); field = '';
        } else {
          field += char;
        }
      }
      row.push(field);
      // Map columns by header
  let register_id = '', fullName = '', area = '', dob = '', nhis_number = '', gender = '', studentClass = '', parent_name = '', parent_contact = '', subclass = '';
      headers.forEach((h, idx) => {
        const val = row[idx] ? row[idx].trim().replace(/^"|"$/g, '') : '';
        if (/^student ?id$/i.test(h)) register_id = val;
        else if (/^full ?name$/i.test(h)) fullName = val;
        else if (/^area$/i.test(h)) area = val;
        else if (/^dob$/i.test(h)) dob = val;
        else if (/^nhis ?number$/i.test(h)) nhis_number = val;
        else if (/^gender$/i.test(h)) gender = val;
  else if (/^class$/i.test(h)) studentClass = val;
  else if (/^subclass$/i.test(h)) subclass = val;
  else if (/^parent ?name$/i.test(h)) parent_name = val;
  else if (/^parent ?contact$/i.test(h)) parent_contact = val;
      });
      // Split full name into first_name and surname (allow single word)
      let first_name = '', surname = '';
      if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length > 1) {
          first_name = parts.slice(0, -1).join(' ');
          surname = parts[parts.length - 1];
        } else {
          first_name = fullName;
          surname = '';
        }
      }
      // Only require register_id, first_name, gender, and class
      if (!register_id || !first_name || !gender || !studentClass) {
        failCount++;
        errorRows.push(i+1); // CSV is 1-based
        continue;
      }
      // Attempt to extract subclass if the Class column includes it (e.g. "JHS 1 A")
      // Prefer explicit Subclass column when provided; otherwise pull last token if it's a short code/letter.
      let parsedSubclass = subclass && subclass.trim() !== '' ? subclass.trim().toUpperCase() : null;
      if (!parsedSubclass && studentClass) {
        const m = studentClass.trim().match(/^(.+?)\s+([A-Za-z])$/);
        if (m) {
          studentClass = m[1];
          parsedSubclass = m[2].toUpperCase();
        }
      }

      // Username: take only the first word from first and surname
      const firstPart = (first_name || '').trim().split(/\s+/)[0] || '';
      const secondPart = (surname || '').trim().split(/\s+/)[0] || '';
      const username = (firstPart + '.' + secondPart).toLowerCase();
      const pin = generatePin();
      const studentPayload = {
        first_name,
        surname,
        area: area || '',
        dob: dob && dob.trim() !== '' ? dob : null,
        nhis_number: nhis_number || '',
        gender,
        class: studentClass,
        subclass: parsedSubclass || null,
        parent_name: parent_name || '',
        parent_contact: parent_contact || '',
        username,
        pin,
        register_id
      };
      try {
        const { error } = await supabaseClient.from('students').insert([studentPayload]);
        if (error) {
          failCount++;
          errorRows.push(i+1);
          console.error('Supabase insert error (row ' + (i+1) + '):', error.message);
        } else {
          successCount++;
        }
      } catch (err) {
        failCount++;
        errorRows.push(i+1);
        console.error('Unexpected JS error (row ' + (i+1) + '):', err.message);
      }
      // update visual progress if loader still exists
      try { if (loader && typeof loader.update === 'function') loader.update(Math.round((i / (lines.length - 1)) * 100)); } catch(e) {}
    }
    let msg = `CSV import complete. Success: ${successCount}, Failed: ${failCount}`;
    if (errorRows.length) msg += `\nRows with errors: ${errorRows.join(', ')}`;
  notify(msg, 'info');
    loadStudents();
  } finally {
    try { loader && loader.close(); } catch(e) {}
  }
  };
  reader.readAsText(file);
}

// 📝 Edit Student
async function editStudent(id) {
  const { data, error } = await supabaseClient.from('students').select('*').eq('id', id).single();
  if (error) return notify('Failed to load student.', 'error');
  const form = document.getElementById('studentForm');
  form.student_id.value = data.id || '';
  form.first_name.value = data.first_name || '';
  form.surname.value = data.surname || '';
  form.area.value = data.area || '';
  form.dob.value = data.dob || '';
  form.nhis_number.value = data.nhis_number || '';
  form.gender.value = data.gender || '';
  // Populate main class and subclass selects (so subclass is editable)
  form.class.value = data.class || '';
  try {
    const mainSelect = form.querySelector('[name="main_class_select"]');
    const subSelect = form.querySelector('[name="sub_class_select"]');
    // If database has a separate `subclass` column, use it; otherwise try to parse from class string
    const dbSubclass = (data.subclass || '').toString().trim();
    // Set main select to the stored main class
    if (mainSelect) {
      mainSelect.value = data.class || '';
      // Trigger any change handlers that show/hide the subclass control
      try { mainSelect.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { /* ignore */ }
    }
    if (subSelect) {
      if (dbSubclass) subSelect.value = dbSubclass;
      else {
        // attempt to parse subclass from class value like "JHS 1 A"
        const m = (data.class || '').toString().trim().match(/^(.+?)\s+([A-Za-z])$/);
        if (m) {
          // set main select to the parsed main class and subclass to the parsed letter
          if (mainSelect) mainSelect.value = m[1];
          subSelect.value = m[2].toUpperCase();
          try { mainSelect.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
        }
      }
    }
    // Ensure the combined hidden class field matches main + subclass where applicable
    const combinedField = form.querySelector('[name="class"]');
    if (combinedField) {
      const mainVal = (mainSelect && mainSelect.value) ? mainSelect.value : (data.class || '');
      const subVal = (subSelect && subSelect.value) ? subSelect.value : dbSubclass || '';
      combinedField.value = subVal ? (mainVal + ' ' + subVal) : mainVal;
    }
  } catch (e) {
    console.warn('Failed to populate class/subclass selects in editStudent:', e);
  }
  form.parent_name.value = data.parent_name || '';
  form.parent_contact.value = data.parent_contact || '';
  form.register_id.value = data.register_id || '';
  openModal('studentModal');
}

// 🗑️ Delete Student
async function deleteStudent(id) {
  try {
    const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Are you sure you want to delete this student?', { title: 'Delete student' }) : confirm('Are you sure you want to delete this student?');
    if (!ok) return;
  } catch (e) { return; }
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Deleting student...', { color: '#c62828' }) : null;
  try {
    const { error } = await supabaseClient.from('students').delete().eq('id', id);
    if (error) notify('Delete failed: ' + (error.message || ''), 'error');
    else {
      notify('Student deleted.', 'info');
      loadStudents();
    }
  } finally {
    try { loader && loader.close(); } catch (e) {}
  }
}

// 📋 Load Students
// TEMP: Delete all students in a class (for re-import/testing)
window.deleteClassStudents = async function deleteClassStudents() {
  // Use async prompt modal instead of blocking prompt()
  let className = null;
  try {
    if (typeof window.showPrompt === 'function') {
      className = await window.showPrompt('Enter the class name to delete all students (e.g., JHS 1):', { title: 'Delete class', placeholder: 'e.g., JHS 1' });
    } else {
      className = prompt('Enter the class name to delete all students (e.g., JHS 1):');
    }
  } catch (e) { className = null; }
  if (!className) return notify('No class entered.', 'warning');
  try {
    const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Are you sure you want to delete ALL students in ' + className + '? This cannot be undone.', { title: 'Delete all students' }) : confirm('Are you sure you want to delete ALL students in ' + className + '? This cannot be undone.');
    if (!ok) return;
  } catch (e) { return; }
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Deleting students in ' + className + '...', { color: '#c62828' }) : null;
  try {
    const { error } = await supabaseClient.from('students').delete().eq('class', className);
    if (error) notify('Delete failed: ' + (error.message || ''), 'error');
    else {
      notify('All students in ' + className + ' deleted.', 'info');
      loadStudents();
    }
  } finally {
    try { loader && loader.close(); } catch(e) {}
  }
}
async function loadStudents() {
  const { data, error } = await supabaseClient.from('students').select('*');
  const tbody = document.querySelector('#studentTable tbody');
  const select = document.getElementById('studentSelect');
  tbody.innerHTML = '';
  // Restrict to class teacher's class/subclass if set
  let filtered = (data && Array.isArray(data)) ? [...data] : [];
  let classTeacherClass = null;
  try {
    classTeacherClass = localStorage.getItem('class_teacher_class') || null;
  } catch (e) {}
  if (classTeacherClass) {
    // Parse e.g. 'JHS 2 A' or 'JHS 1 B' or 'JHS 3'
    const parts = classTeacherClass.trim().split(/\s+/);
    const mainClass = parts.slice(0, 2).join(' ');
    const subClass = parts[2] || null;
    filtered = filtered.filter(s => {
      if (!s.class) return false;
      if (subClass) {
        return s.class === mainClass && (s.subclass || '').toUpperCase() === subClass.toUpperCase();
      } else {
        return s.class === mainClass;
      }
    });
  }
  // Sort by register_id (natural order)
  let sorted = filtered;
  sorted.sort((a, b) => {
    if (!a.register_id || !b.register_id) return 0;
    const [ac, an] = a.register_id.split('_');
    const [bc, bn] = b.register_id.split('_');
    if (ac === bc) return parseInt(an, 10) - parseInt(bn, 10);
    return ac.localeCompare(bc);
  });
  if (select) {
    select.innerHTML = '<option value="">-- Select Student --</option>';
    sorted.forEach(student => {
      const opt = document.createElement('option');
      opt.value = student.id;
      let name = '';
      if (student.first_name && student.surname) {
        name = student.first_name + ' ' + student.surname;
      } else if (student.first_name) {
        name = student.first_name;
      } else if (student.surname) {
        name = student.surname;
      } else {
        name = '[No Name]';
      }
      opt.textContent = (student.register_id ? student.register_id + ' - ' : '') + name + ' (' + (student.class || '') + ')';
      select.appendChild(opt);
    });
  }
  // Optionally, update the table to show register_id as a column
  // (You may need to update the table header in HTML to add <th>Register ID</th> at the right spot)
  // If you want to render the table rows here, do it in register_id order as well
  // Show nothing by default until a student is selected
}
// Show only the selected student's info in the table
window.showSelectedStudent = function showSelectedStudent() {
  const select = document.getElementById('studentSelect');
  const tbody = document.querySelector('#studentTable tbody');
  tbody.innerHTML = '';
  const studentId = select.value;
  if (!studentId) return;
  supabaseClient.from('students').select('*').eq('id', studentId).single().then(({ data, error }) => {
    if (error || !data) return;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><img src="${data.picture_url || ''}" alt="Student" width="40" height="40" /></td>
      <td>${(data.first_name ? data.first_name + ' ' : '') + (data.surname || '')}</td>
      <td>${data.area || ''}</td>
      <td>${data.dob || ''}</td>
      <td>${data.nhis_number || ''}</td>
      <td>${data.gender}</td>
      <td>${data.class}</td>
      <td>${data.parent_name}</td>
      <td>${data.parent_contact}</td>
      <td>${data.username}</td>
      <td>${data.pin ? '••••' : ''}</td>
      <td>
        <button onclick="editStudent('${data.id}')">Edit</button>
        <button onclick="deleteStudent('${data.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 👨‍🏫 Teacher Registration
document.getElementById('teacherForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  // Confirm before saving teacher
  try {
    let pref = null;
    try { pref = localStorage.getItem('nsuta_confirm_save_teacher'); } catch (e) { pref = null; }
    if (pref === 'false') {
      // proceed without confirmation
    } else {
      const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Save teacher changes?', { title: 'Confirm save', rememberKey: 'save_teacher' }) : confirm('Save teacher changes?');
      if (!ok) return;
    }
  } catch (err) { return; }
  const teacherId = form.teacher_id.value;
  // Generate pin for new teachers
  const name = form.name.value.trim();
  const pin = generatePin();
  // Get classes and subjects from the assignment rows (collect all unique values)
  const assignmentRows = document.querySelectorAll('#assignmentRowsContainer .assignment-row');
  const classesSet = new Set();
  const subjectsSet = new Set();
  assignmentRows.forEach(row => {
    const classSelect = row.querySelector('select[name="assignment_class[]"]');
    const subjectSelect = row.querySelector('select[name="assignment_subject[]"]');
    if (classSelect && classSelect.value) classesSet.add(classSelect.value);
    if (subjectSelect && subjectSelect.value) subjectsSet.add(subjectSelect.value);
  });
  // If no assignments, fallback to empty string to avoid null
  const classesArray = Array.from(classesSet);
  const subjectsArray = Array.from(subjectsSet);
  // For Postgres array columns, use JSON string format: '{"val1","val2"}'
  const classesValue = classesArray.length ? '{"' + classesArray.join('","') + '"}' : '{""}';
  const subjectsValue = subjectsArray.length ? '{"' + subjectsArray.join('","') + '"}' : '{""}';
  const responsibilityValue = form.responsibility ? form.responsibility.value.trim() : '';
  // Ensure class teacher class value is captured when responsibility is Class Teacher
  let classTeacherClassValue = null;
  if (responsibilityValue === 'Class Teacher' && form.class_teacher_class && form.class_teacher_class.value.trim()) {
    classTeacherClassValue = form.class_teacher_class.value.trim();
  }

  if (responsibilityValue === 'Class Teacher' && !classTeacherClassValue) {
  notify('Please select the class you are responsible for before submitting.', 'warning');
    return;
  }

  const teacherData = {
    name,
    gender: form.gender.value,
    dob: form.dob.value,
    staff_id: form.staff_id.value.trim(),
    ntc: form.ntc.value.trim(),
    registered_number: form.registered_number.value.trim(),
    ssnit: form.ssnit.value.trim(),
    ghana_card: form.ghana_card.value.trim(),
    contact: form.contact.value.trim(),
    rank: form.rank.value.trim(),
    qualification: form.qualification.value.trim(),
    first_appointment_date: form.first_appointment_date.value,
    date_placed_on_rank: form.date_placed_on_rank.value,
    salary_level: form.salary_level.value.trim(),
    bank: form.bank.value.trim(),
    bank_branch: form.bank_branch.value.trim(),
    bank_account_number: form.bank_account_number.value.trim(),
    highest_professional_qualification: form.highest_professional_qualification.value.trim(),
    professional_qualification_date: form.professional_qualification_date.value,
    last_promotion_date: form.last_promotion_date.value,
    previous_station: form.previous_station.value.trim(),
    years_at_present_school: parseInt(form.years_at_present_school.value || '0'),
    due_for_promotion: form.due_for_promotion.value.trim(),
  responsibility: responsibilityValue,
  // Store the class teacher value under a single canonical column
  class_teacher_class: classTeacherClassValue,
    denomination: form.denomination.value.trim(),
    home_town: form.home_town.value.trim(),
    classes: classesValue,
    subjects: subjectsValue,
    pin
  };

  // prevent double submit
  if (form._saving) return;
  form._saving = true;
  const submitBtn = form.querySelector('button[type="submit"]');
  try { if (submitBtn) submitBtn.disabled = true; } catch(e){}

  // Show loader while saving teacher and assignments
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast(teacherId ? 'Updating teacher...' : 'Registering teacher...', { color: '#0b66b2' }) : null;
  try {
    let result;
    if (teacherId) {
      // Don't overwrite pin on update
      const updateData = { ...teacherData };
      delete updateData.pin;
      result = await supabaseClient.from('teachers').update(updateData).eq('id', teacherId).select();
    } else {
      result = await supabaseClient.from('teachers').insert([teacherData]).select();
    }

    if (result.error) {
      notify('Error: ' + result.error.message, 'error');
      return;
    }

  // Save teaching assignments
  const teacherRowId = teacherId || (result.data && result.data[0] && result.data[0].id);
  if (teacherRowId) {
    // Gather assignments from modal
    const assignments = [];
    const rows = document.querySelectorAll('#assignmentRowsContainer .assignment-row');
    rows.forEach(row => {
      const classSelect = row.querySelector('select[name="assignment_class[]"]');
      const subjectSelect = row.querySelector('select[name="assignment_subject[]"]');
      const areaSelect = row.querySelector('select[name="assignment_career_area[]"]');
      if (classSelect && subjectSelect && classSelect.value && subjectSelect.value) {
        const assignment = {
          teacher_id: teacherRowId,
          class: classSelect.value,
          subject: subjectSelect.value
        };
        if (subjectSelect.value === 'Career Tech' && areaSelect && areaSelect.value) {
          assignment.area = areaSelect.value;
        }
        assignments.push(assignment);
      }
    });
    if (teacherId) {
      // Remove old assignments first
      await supabaseClient.from('teaching_assignments').delete().eq('teacher_id', teacherRowId);
    }
    if (assignments.length) {
      await supabaseClient.from('teaching_assignments').insert(assignments);
    }
  }

    if (teacherId) {
      notify('Teacher updated!', 'info');
    } else {
      // Hide PIN in notifications
      notify(`Teacher registered: ${teacherData.name} (PIN hidden for security)`, 'info');
    }
  } finally {
    try { loader && loader.close(); } catch (e) {}
  }
  form.reset();
  document.getElementById('assignmentRowsContainer').innerHTML = '';
  closeModal('teacherModal');
});

// 📝 Edit Teacher
async function editTeacher(id) {

  // Helper: safely obtain createAssignmentRow function (falls back to a lightweight implementation
  // if the admin inline script hasn't been loaded yet). This prevents "createAssignmentRow is not defined" errors.
  function getCreateAssignmentRow() {
    if (typeof window !== 'undefined' && typeof window.createAssignmentRow === 'function') return window.createAssignmentRow;
    // Minimal fallback implementation matching the expected signature
    return function(selectedClass = '', selectedSubject = '', selectedArea = '') {
      const SUBJECT_OPTIONS = ['Maths','English','Science','Computing','Social Studies','RME','Creative Arts','Career Tech','Twi'];
      const CLASS_OPTIONS = ['JHS 1','JHS 2','JHS 3'];
      const row = document.createElement('div');
      row.className = 'assignment-row';
      row.style.display = 'flex';
      row.style.gap = '0.5rem';
      const classSelect = document.createElement('select');
      classSelect.name = 'assignment_class[]';
      classSelect.required = true;
      classSelect.innerHTML = '<option value="">Class</option>' + CLASS_OPTIONS.map(c => `<option value="${c}">${c}</option>`).join('');
      classSelect.value = selectedClass;
      const subjectSelect = document.createElement('select');
      subjectSelect.name = 'assignment_subject[]';
      subjectSelect.required = true;
      subjectSelect.innerHTML = '<option value="">Subject</option>' + SUBJECT_OPTIONS.map(s => `<option value="${s}">${s}</option>`).join('');
      subjectSelect.value = selectedSubject;
      const areaSelectWrapper = document.createElement('div');
      areaSelectWrapper.style.display = 'none';
      areaSelectWrapper.style.flex = '1';
      const areaSelect = document.createElement('select');
      areaSelect.name = 'assignment_career_area[]';
      areaSelect.innerHTML = '<option value="">Select Area</option>' + ['Home Economics','Pre Technical'].map(a => `<option value="${a}">${a}</option>`).join('');
      areaSelectWrapper.appendChild(areaSelect);
      if (selectedArea) areaSelect.value = selectedArea;
      subjectSelect.addEventListener('change', function() {
        if (subjectSelect.value === 'Career Tech') {
          areaSelectWrapper.style.display = '';
          areaSelect.required = true;
        } else {
          areaSelectWrapper.style.display = 'none';
          areaSelect.required = false;
          areaSelect.value = '';
        }
      });
      if (selectedSubject === 'Career Tech') {
        areaSelectWrapper.style.display = '';
        areaSelect.required = true;
      }
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
  }
  const { data, error } = await supabaseClient.from('teachers').select('*').eq('id', id).single();
  if (error) return notify('Failed to load teacher.', 'error');
  const form = document.getElementById('teacherForm');
  if (!form) {
  notify('Teacher form not found.', 'error');
    return;
  }
  if (form.teacher_id) form.teacher_id.value = data.id || '';
  if (form.name) form.name.value = data.name || '';
  if (form.gender) form.gender.value = data.gender || '';
  if (form.dob) form.dob.value = data.dob || '';
  if (form.staff_id) form.staff_id.value = data.staff_id || '';
  if (form.ntc) form.ntc.value = data.ntc || '';
  if (form.registered_number) form.registered_number.value = data.registered_number || '';
  if (form.ssnit) form.ssnit.value = data.ssnit || '';
  if (form.ghana_card) form.ghana_card.value = data.ghana_card || '';
  if (form.contact) form.contact.value = data.contact || '';
  if (form.rank) form.rank.value = data.rank || '';
  if (form.qualification) form.qualification.value = data.qualification || '';
  if (form.first_appointment_date) form.first_appointment_date.value = data.first_appointment_date || '';
  if (form.date_placed_on_rank) form.date_placed_on_rank.value = data.date_placed_on_rank || '';
  if (form.salary_level) form.salary_level.value = data.salary_level || '';
  if (form.bank) form.bank.value = data.bank || '';
  if (form.bank_branch) form.bank_branch.value = data.bank_branch || '';
  if (form.bank_account_number) form.bank_account_number.value = data.bank_account_number || '';
  if (form.highest_professional_qualification) form.highest_professional_qualification.value = data.highest_professional_qualification || '';
  if (form.professional_qualification_date) form.professional_qualification_date.value = data.professional_qualification_date || '';
  if (form.last_promotion_date) form.last_promotion_date.value = data.last_promotion_date || '';
  if (form.previous_station) form.previous_station.value = data.previous_station || '';
  if (form.years_at_present_school) form.years_at_present_school.value = data.years_at_present_school || '';
  if (form.due_for_promotion) form.due_for_promotion.value = data.due_for_promotion || '';
  if (form.responsibility) form.responsibility.value = data.responsibility || '';
  if (form.denomination) form.denomination.value = data.denomination || '';
  if (form.home_town) form.home_town.value = data.home_town || '';

  // Load teaching assignments
  const container = document.getElementById('assignmentRowsContainer');
  if (container) {
    container.innerHTML = '';
    // defensive logging to help debug why the modal might not populate
    try {
      const { data: assignments, error: assignErr } = await supabaseClient.from('teaching_assignments').select('class,subject,area').eq('teacher_id', id);
      if (assignErr) {
        console.error('Failed to fetch teaching_assignments for teacher', id, assignErr);
        notify('Failed to load teacher assignments. See console for details.', 'error');
      }
  // fetched assignments for teacher (debug logging removed)
      const createAssignmentRowFn = getCreateAssignmentRow();
      if (!createAssignmentRowFn || typeof createAssignmentRowFn !== 'function') {
        console.warn('createAssignmentRow function not available; using DOM fallback');
      }
      if (assignments && assignments.length) {
        assignments.forEach(a => {
          try {
            // Ensure we only pass main class (strip subclass if stored as "JHS 1 A")
            let mainClass = (a.class || '').toString();
            const m = mainClass.trim().match(/^(.+?)\s+[A-Za-z]$/);
            if (m) mainClass = m[1];
            if (a.subject === 'Career Tech') {
              container.appendChild(createAssignmentRowFn(mainClass, a.subject, a.area));
            } else {
              container.appendChild(createAssignmentRowFn(mainClass, a.subject));
            }
          } catch (innerErr) {
            console.error('Failed to append assignment row for assignment', a, innerErr);
          }
        });
      } else {
        try {
          container.appendChild(createAssignmentRowFn());
        } catch (innerErr) {
          console.error('Failed to append default assignment row', innerErr);
        }
      }
    } catch (err) {
      console.error('Unexpected error while populating assignment rows for teacher', id, err);
      notify('Unexpected error while preparing the teacher edit form. See console for details.', 'error');
    }
  }

  openModal('teacherModal');
}
// 🔄 Initial Load
loadStudents();
loadTeachers();
loadAdmins();

// Start live breakdowns (default: push). Change mode to 'pop' or 'slideshow' to use other animations.
try { initLiveBreakdowns('push', 9000); } catch (e) { /* ignore if init not available */ }

// -------------------------------
// Sidebar collapse / expand toggle
// Appends a toggle button to the header, persists state in localStorage,
// supports a slide-open behavior on small screens and accessibility keys.
// -------------------------------
(function(){
  const SIDEBAR_KEY = 'nsuta_sidebar_collapsed_v1';
  const sidebar = document.querySelector('.sidebar');
  const header = document.querySelector('.dashboard-header') || document.body;
  if (!sidebar || !header) return;

  // Create toggle button
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sidebar-toggle-btn';
  btn.setAttribute('aria-pressed', 'false');
  btn.setAttribute('aria-label', 'Toggle navigation');
  btn.title = 'Toggle navigation';
  btn.innerHTML = '<span aria-hidden="true">☰</span>';
  // Insert at the start of header (keeps existing layout)
  header.insertBefore(btn, header.firstChild);

  // Inject minimal styles so we don't need to edit CSS files
  const style = document.createElement('style');
  style.textContent = `
  /* Sidebar toggle styles (injected) */
  .sidebar.collapsed { width: 72px !important; overflow: hidden; }
  .sidebar.collapsed ul li a { justify-content: center; padding-left: 0.6rem; }
  .sidebar.collapsed .school-title, .sidebar.collapsed .motto, .sidebar.collapsed .sidebar-text { display: none !important; }
  body.sidebar-collapsed .dashboard-main { margin-left: 88px !important; }
  .sidebar-toggle-btn { background: transparent; border: 1px solid rgba(0,0,0,0.06); border-radius: 8px; padding: 6px 8px; margin: 0 0.5rem; cursor: pointer; }
  .sidebar-toggle-btn.active { background: var(--brand-500, #0b66b2); color: #fff; box-shadow: 0 8px 20px rgba(11,102,178,0.12); }
  @media (max-width: 900px) {
    .sidebar { left: -260px; transition: left .28s ease; }
    .sidebar.open { left: 0; }
    .sidebar.collapsed { left: 0; width: 220px; }
    body.sidebar-collapsed .dashboard-main { margin-left: 220px !important; }
  }
  `;
  document.head.appendChild(style);

  function setCollapsed(v) {
    if (v) {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
    try { localStorage.setItem(SIDEBAR_KEY, v ? '1' : '0'); } catch (e) { /* ignore */ }
  }

  // Toggle behavior: on small screens open/close slide; on desktop collapse/expand
  btn.addEventListener('click', function(e) {
    const isMobile = window.matchMedia('(max-width:900px)').matches;
    if (isMobile) {
      // slide open/close
      sidebar.classList.toggle('open');
      return;
    }
    setCollapsed(!sidebar.classList.contains('collapsed'));
  });

  // Keyboard accessibility
  btn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); }
  });

  // Click outside to close mobile sidebar
  document.addEventListener('click', function(e) {
    const isMobile = window.matchMedia('(max-width:900px)').matches;
    if (!isMobile) return;
    if (!sidebar.classList.contains('open')) return;
    if (e.target.closest('.sidebar')) return;
    if (e.target.closest('.sidebar-toggle-btn')) return;
    sidebar.classList.remove('open');
  });

  // Initialize from localStorage
  try {
    const saved = localStorage.getItem(SIDEBAR_KEY);
    if (saved === '1') setCollapsed(true);
  } catch (e) { /* ignore read errors */ }
})();

// Lightweight helpers: fill KPIs and recent activity
(function(){
  function setKPI(selector, value) {
    const el = document.getElementById(selector);
    if (el) el.textContent = String(value);
  }
  async function populateKPIs() {
    try {
      const [{ data: students }, { data: teachers }, { data: admins }] = await Promise.all([
        supabaseClient.from('students').select('id', { count: 'exact' }),
        supabaseClient.from('teachers').select('id', { count: 'exact' }),
        supabaseClient.from('admins').select('id', { count: 'exact' })
      ]);
      setKPI('kpiStudents', students ? students.length : '—');
      setKPI('kpiTeachers', teachers ? teachers.length : '—');
      setKPI('kpiAdmins', admins ? admins.length : '—');

      // Build concise breakdown summaries if we have the full rows available
      try {
        // Fetch full rows (lightweight) to compute breakdowns
        const [{ data: studentRows }, { data: teacherRows }] = await Promise.all([
          supabaseClient.from('students').select('class,subclass'),
          supabaseClient.from('teachers').select('responsibility,subjects')
        ]);
        // Students: count by main class and subclass
        if (studentRows && Array.isArray(studentRows)) {
          const classMap = {};
          studentRows.forEach(s => {
            const main = (s.class || '').toString().trim();
            const sub = (s.subclass || '').toString().trim();
            if (!main) return;
            classMap[main] = classMap[main] || { total: 0, subs: {} };
            classMap[main].total += 1;
            if (sub) {
              classMap[main].subs[sub] = (classMap[main].subs[sub] || 0) + 1;
            }
          });
          const parts = Object.keys(classMap).sort().map(k => {
            const entry = classMap[k];
            const subs = Object.keys(entry.subs).map(sk => `${sk}: ${entry.subs[sk]}`).join(', ');
            return `${k}: ${entry.total}${subs ? ' (' + subs + ')' : ''}`;
          });
          const studentsBreakdownEl = document.getElementById('studentsBreakdown');
          if (studentsBreakdownEl) {
            // If a live mode is active, don't overwrite the live container here.
            if (!window._nsuta_live_mode) studentsBreakdownEl.textContent = parts.length ? parts.join(' • ') : '—';
          }
        }

        // Teachers: count by responsibility and top subjects
        if (teacherRows && Array.isArray(teacherRows)) {
          const respMap = {};
          const subjMap = {};
          teacherRows.forEach(t => {
            const r = (t.responsibility || '').toString().trim() || 'Other';
            respMap[r] = (respMap[r] || 0) + 1;
            // subjects may be stored as Postgres array string like '{Maths,English}' or an array
            let subs = [];
            if (Array.isArray(t.subjects)) subs = t.subjects;
            else if (typeof t.subjects === 'string') {
              const m = t.subjects.trim();
              if (m.startsWith('{') && m.endsWith('}')) {
                subs = m.slice(1,-1).split(',').map(s => s.replace(/^"|"$/g,'').trim()).filter(Boolean);
              } else {
                subs = m ? [m] : [];
              }
            }
            subs.forEach(sv => { subjMap[sv] = (subjMap[sv] || 0) + 1; });
          });
          const respParts = Object.keys(respMap).map(k => `${k}: ${respMap[k]}`);
          const topSubjects = Object.keys(subjMap).sort((a,b)=> subjMap[b]-subjMap[a]).slice(0,5).map(k => `${k}: ${subjMap[k]}`);
          const teachersBreakdownEl = document.getElementById('teachersBreakdown');
          if (teachersBreakdownEl) {
            if (!window._nsuta_live_mode) teachersBreakdownEl.textContent = (respParts.length ? respParts.join(' • ') : '') + (topSubjects.length ? ' — Top subjects: ' + topSubjects.join(', ') : '');
          }
        }

        // Admins: list count and optional emails (kept brief)
        try {
          const { data: adminRows } = await supabaseClient.from('admins').select('email');
          const adminsBreakdownEl = document.getElementById('adminsBreakdown');
          if (adminsBreakdownEl) {
            if (!window._nsuta_live_mode) {
              if (adminRows && adminRows.length) {
                adminsBreakdownEl.textContent = `${adminRows.length} admin(s)`;
              } else {
                adminsBreakdownEl.textContent = 'None';
              }
            }
          }
        } catch (e) {
          // ignore admin breakdown failure
        }

      } catch (err) {
        console.warn('populateKPIs: breakdown calculation failed', err);
      }

    } catch (e) {
      console.warn('populateKPIs error', e);
    }
  }
  // Recent activity: append an item
  function recordActivity(text) {
    const list = document.getElementById('recentActivity');
    if (!list) return;
    const item = document.createElement('div');
    item.className = 'activity-item';
    item.textContent = (new Date()).toLocaleString() + ' — ' + text;
    list.insertBefore(item, list.firstChild);
    // trim list to 50
    while (list.children.length > 50) list.removeChild(list.lastChild);
  }
  // Wire search to a simple action: focus search + record
  document.addEventListener('DOMContentLoaded', function() {
    // Quick search wiring: support the studentSearch input and a debounce for live queries
    function debounce(fn, wait) {
      let t = null;
      return function(...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
    }

    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
      const performSearch = async (q) => {
        const qtrim = (q || '').trim();
        recordActivity('Searched students: ' + qtrim);
        if (!qtrim) {
          // if empty, reload full students list
          try { if (typeof loadStudents === 'function') await loadStudents(); } catch(e) { console.warn('loadStudents failed', e); }
          return;
        }
        try {
          // Query supabase for matches across several columns
          const filter = `%${qtrim.replace(/%/g, '')}%`;
          const { data, error } = await supabaseClient.from('students').select('*').or(
            `first_name.ilike.${filter},surname.ilike.${filter},username.ilike.${filter},register_id.ilike.${filter}`
          );
          if (error) {
            console.warn('Search query failed', error);
            notify('Search failed: ' + (error.message || ''), 'error');
            return;
          }
          // Update select and table
          const select = document.getElementById('studentSelect');
          if (select) {
            select.innerHTML = '<option value="">-- Select Student --</option>';
            data.forEach(s => {
              const opt = document.createElement('option'); opt.value = s.id; opt.textContent = (s.register_id ? s.register_id + ' - ' : '') + ((s.first_name||'') + (s.surname ? ' ' + s.surname : '')).trim() + ' (' + (s.class||'') + ')';
              select.appendChild(opt);
            });
          }
          const tbody = document.querySelector('#studentTable tbody');
          if (tbody) {
            tbody.innerHTML = '';
            data.forEach(d => {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td><img src="${d.picture_url || ''}" alt="Student" width="40" height="40" /></td>
                <td>${(d.first_name ? d.first_name + ' ' : '') + (d.surname || '')}</td>
                <td>${d.area || ''}</td>
                <td>${d.dob || ''}</td>
                <td>${d.nhis_number || ''}</td>
                <td>${d.gender || ''}</td>
                <td>${d.class || ''}</td>
                <td>${d.parent_name || ''}</td>
                <td>${d.parent_contact || ''}</td>
                <td>${d.username || ''}</td>
                <td>${d.pin ? '••••' : ''}</td>
                <td>
                  <button onclick="editStudent('${d.id}')">Edit</button>
                  <button onclick="deleteStudent('${d.id}')">Delete</button>
                </td>
              `;
              tbody.appendChild(row);
            });
          }
        } catch (err) {
          console.error('Search error', err);
          notify('Search error. See console for details.', 'error');
        }
      };
      studentSearch.addEventListener('input', debounce((e) => performSearch(e.target.value), 320));
    }
    populateKPIs();
  });
  // Export for other modules
  window.recordActivity = recordActivity;
})();

// -------------------------------
// Live breakdowns: periodically refresh and animate the overview breakdowns
// mode: 'slideshow' (cycles items) or 'pop' (popping entries on refresh)
// -------------------------------
let _nsuta_breakdown_timers = { containers: {} };

function _renderBreakdownItems(containerId, items, mode = 'slideshow', rotateInterval = 5000) {
  const container = document.getElementById(containerId);
  if (!container) return;
  // Toggle slideshow mode class so CSS can position items absolutely when cycling
  try {
    if (mode === 'slideshow') container.classList.add('breakdown-slideshow');
    else container.classList.remove('breakdown-slideshow');
  } catch (e) {}
  // Toggle push mode class for push transitions
  try {
    if (mode === 'push') container.classList.add('breakdown-push');
    else container.classList.remove('breakdown-push');
  } catch (e) {}
  // Clear previous timers for this container
  try { if (container._rotateTimer) { clearInterval(container._rotateTimer); container._rotateTimer = null; } } catch(e){}
  container.innerHTML = '';
  if (!items || !items.length) {
    const el = document.createElement('div'); el.className = 'breakdown-item show'; el.innerHTML = '<div class="bd-title">—</div><div class="bd-sub muted-small">No data</div>';
    container.appendChild(el);
    return;
  }
  // If push mode, render a horizontal track
  if (mode === 'push') {
    const track = document.createElement('div');
    track.className = 'break-push-track';
    items.forEach((it) => {
      const itemWrap = document.createElement('div');
      itemWrap.className = 'break-push-item breakdown-item';
      itemWrap.innerHTML = `<div class="bd-title">${it.title}</div><div class="bd-sub">${it.subtitle || ''}</div>`;
      track.appendChild(itemWrap);
    });
    container.appendChild(track);
    console.debug('[liveBreakdowns] rendered push track, items=', items.length);
    const nodes = Array.from(track.children);
    if (nodes.length <= 1) return;
    container._pushIndex = 0;
    // ensure starting transform
    track.style.transform = 'translateX(0)';
    container._rotateTimer = setInterval(() => {
      try {
        container._pushIndex = (container._pushIndex + 1) % nodes.length;
        track.style.transform = `translateX(-${container._pushIndex * 100}%)`;
      } catch (e) { /* ignore */ }
    }, rotateInterval);
    console.debug('[liveBreakdowns] push timer set on', containerId, 'interval=', rotateInterval);
    return;
  }

  // Default rendering for slideshow/pop
  items.forEach((it, idx) => {
    const el = document.createElement('div');
    el.className = 'breakdown-item';
    el.innerHTML = `<div class="bd-title">${it.title}</div><div class="bd-sub">${it.subtitle || ''}</div>`;
    if (mode === 'pop') {
      // add pop class with slight stagger
      setTimeout(() => { el.classList.add('break-pop'); }, 80 * idx);
    }
    if (idx === 0 && mode === 'slideshow') el.classList.add('show');
    container.appendChild(el);
  });

  if (mode === 'slideshow') {
    const nodes = Array.from(container.querySelectorAll('.breakdown-item'));
    if (nodes.length <= 1) return;
    container._rotateIndex = 0;
    container._rotateTimer = setInterval(() => {
      try {
        nodes[container._rotateIndex].classList.remove('show');
        container._rotateIndex = (container._rotateIndex + 1) % nodes.length;
        nodes[container._rotateIndex].classList.add('show');
      } catch (e) { /* ignore */ }
    }, rotateInterval);
  }
}

async function refreshLiveBreakdowns(mode = 'slideshow') {
  try {
    console.debug('[liveBreakdowns] refresh start, mode=', mode);
    const [{ data: studentRows }, { data: teacherRows }, { data: adminRows }] = await Promise.all([
      supabaseClient.from('students').select('class,subclass'),
      supabaseClient.from('teachers').select('responsibility,subjects'),
      supabaseClient.from('admins').select('email')
    ]);
    // Build student class + subclass breakdown and an overall gender summary
    const studentClassMap = {}; // { 'JHS 1': { total: n, subs: { A: n, B: n } } }
    const genderMap = { Male: 0, Female: 0, Other: 0 };
    if (studentRows && Array.isArray(studentRows)) {
      studentRows.forEach(s => {
        const main = (s.class || '').toString().trim();
        const sub = (s.subclass || '').toString().trim();
        const gender = (s.gender || '').toString().trim();
        if (gender) {
          if (/^male$/i.test(gender)) genderMap.Male++;
          else if (/^female$/i.test(gender)) genderMap.Female++;
          else genderMap.Other++;
        }
        if (!main) return;
        studentClassMap[main] = studentClassMap[main] || { total: 0, subs: {} };
        studentClassMap[main].total += 1;
        if (sub) {
          studentClassMap[main].subs[sub] = (studentClassMap[main].subs[sub] || 0) + 1;
        }
      });
    }
    const studentItems = Object.keys(studentClassMap).sort().map(k => {
      const entry = studentClassMap[k];
      const subs = Object.keys(entry.subs).sort().map(sk => `${sk}: ${entry.subs[sk]}`).join(', ');
      return { title: `${k}: ${entry.total}`, subtitle: subs || '' };
    });
    // add an overall gender summary as one of the items (helps admins quickly see gender split)
    const genderParts = [];
    if (genderMap.Male) genderParts.push(`M: ${genderMap.Male}`);
    if (genderMap.Female) genderParts.push(`F: ${genderMap.Female}`);
    if (genderMap.Other) genderParts.push(`Other: ${genderMap.Other}`);
    if (genderParts.length) studentItems.push({ title: 'Gender', subtitle: genderParts.join(' • ') });
  console.debug('[liveBreakdowns] studentItems=', studentItems);

    // Teachers: by responsibility
    const respMap = {};
    const subjMap = {};
    if (teacherRows && Array.isArray(teacherRows)) {
      teacherRows.forEach(t => {
        const r = (t.responsibility || '').toString().trim() || 'Other';
        respMap[r] = (respMap[r] || 0) + 1;
        let subs = [];
        if (Array.isArray(t.subjects)) subs = t.subjects;
        else if (typeof t.subjects === 'string') {
          const m = t.subjects.trim();
          if (m.startsWith('{') && m.endsWith('}')) subs = m.slice(1,-1).split(',').map(s=>s.replace(/^"|"$/g,'').trim()).filter(Boolean);
          else if (m) subs = [m];
        }
        subs.forEach(sv => subjMap[sv] = (subjMap[sv] || 0) + 1);
      });
    }
    const teacherItems = Object.keys(respMap).map(k => ({ title: k, subtitle: String(respMap[k]) }));
  console.debug('[liveBreakdowns] teacherItems=', teacherItems.slice(0,10));
    // Admins: show emails as items (short list)
    const adminItems = (adminRows && Array.isArray(adminRows) && adminRows.length) ? adminRows.slice(0,8).map(a => ({ title: a.email || '[no email]', subtitle: '' })) : [{ title: 'None', subtitle: '' }];
  console.debug('[liveBreakdowns] adminItems=', adminItems);

    // Render into containers
    _renderBreakdownItems('studentsBreakdown', studentItems.length ? studentItems : [{ title: 'None', subtitle: '' }], mode, 4500);
    _renderBreakdownItems('teachersBreakdown', teacherItems.length ? teacherItems : [{ title: 'None', subtitle: '' }], mode, 4500);
    _renderBreakdownItems('adminsBreakdown', adminItems, mode, 4500);
  } catch (err) {
    console.warn('refreshLiveBreakdowns failed', err);
  }
}

function initLiveBreakdowns(mode = 'slideshow', intervalMs = 8000) {
  try { if (_nsuta_breakdown_timers.master) clearInterval(_nsuta_breakdown_timers.master); } catch(e){}
  // record active live mode so other code (populateKPIs) won't clobber the live containers
  try { window._nsuta_live_mode = mode; } catch (e) {}
  // initial
  refreshLiveBreakdowns(mode);
  _nsuta_breakdown_timers.master = setInterval(() => refreshLiveBreakdowns(mode), intervalMs);
}


  // Wire the announcement toolbar button and sidebar item clicks
  document.addEventListener('DOMContentLoaded', function() {
    const annBtn = document.getElementById('announcementBtn');
    const annBtnSidebar = document.getElementById('announcementBtnSidebar');
    function openAnnouncement() {
      if (typeof openModal === 'function') openModal('announcementModal');
      else document.getElementById('announcementModal') && document.getElementById('announcementModal').classList.remove('hidden');
      recordActivity('Opened announcement editor');
    }
    if (annBtn) annBtn.addEventListener('click', openAnnouncement);
    if (annBtnSidebar) annBtnSidebar.addEventListener('click', openAnnouncement);

    // Sidebar item buttons use existing data-action handlers via delegated click in admin.html script
  });