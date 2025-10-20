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
// Notification helper: prefer in-page toast if available
const notify = (msg, type='info') => { try { if (window.showToast) return window.showToast(msg, type); alert(msg); } catch (e) { console.log('Notify fallback:', msg); } };
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
}

// Call this ONCE to create a test teacher (uncomment to use):
// createTestTeacher();
// 🗑️ Delete Teacher
async function deleteTeacher(id) {
  if (!confirm('Are you sure you want to delete this teacher?')) return;
  const { error } = await supabaseClient.from('teachers').delete().eq('id', id);
  if (error) notify('Delete failed.', 'error');
  else loadTeachers();
}
// 🗑️ Delete Admin
async function deleteAdmin(id) {
  if (!confirm('Are you sure you want to delete this admin?')) return;
  const { error } = await supabaseClient.from('admins').delete().eq('id', id);
  if (error) notify('Delete failed.', 'error');
  else loadAdmins();
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
      <td>${admin.full_name || ''}</td>
      <td>${admin.email || ''}</td>
      <td>${admin.phone || ''}</td>
      <td>${admin.pin ? '••••' : ''}</td>
      <td>
        <button onclick="editAdmin('${admin.id}')">Edit</button>
        <button onclick="deleteAdmin('${admin.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}
// 📋 Load Teachers
document.getElementById('adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const adminId = form.admin_id.value;
  const adminData = {
    full_name: form.full_name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    pin: form.pin.value.trim()
  };

  const result = adminId
    ? await supabaseClient.from('admins').update(adminData).eq('id', adminId)
    : await supabaseClient.from('admins').insert([adminData]);

  if (result.error) {
    notify('Error: ' + result.error.message, 'error');
  } else {
    notify(adminId ? 'Admin updated!' : `Admin registered: ${adminData.full_name}`, 'info');
    form.reset();
    closeModal('adminModal');
    loadAdmins();
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
      <td>${data.name}</td>
      <td>${data.gender}</td>
      <td>${data.dob}</td>
      <td>${data.staff_id}</td>
      <td>${data.ntc}</td>
      <td>${data.registered_number}</td>
      <td>${data.ssnit}</td>
      <td>${data.ghana_card}</td>
      <td>${data.contact}</td>
      <td>${data.rank}</td>
      <td>${data.qualification}</td>
      <td>${data.classes?.join(', ') || ''}</td>
      <td>${data.subjects?.join(', ') || ''}</td>
      <td>${data.pin ? '••••' : ''}</td>
      <td>
        <button onclick="editTeacher('${data.id}')">Edit</button>
        <button onclick="deleteTeacher('${data.id}')">Delete</button>
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
    }
    let msg = `CSV import complete. Success: ${successCount}, Failed: ${failCount}`;
    if (errorRows.length) msg += `\nRows with errors: ${errorRows.join(', ')}`;
  notify(msg, 'info');
    loadStudents();
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
  form.class.value = data.class || '';
  form.parent_name.value = data.parent_name || '';
  form.parent_contact.value = data.parent_contact || '';
  form.register_id.value = data.register_id || '';
  openModal('studentModal');
}

// 🗑️ Delete Student
async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) return;
  const { error } = await supabaseClient.from('students').delete().eq('id', id);
  if (error) notify('Delete failed.', 'error');
  else loadStudents();
}

// 📋 Load Students
// TEMP: Delete all students in a class (for re-import/testing)
window.deleteClassStudents = async function deleteClassStudents() {
  const className = prompt('Enter the class name to delete all students (e.g., JHS 1):');
  if (!className) return notify('No class entered.', 'warning');
  if (!confirm('Are you sure you want to delete ALL students in ' + className + '? This cannot be undone.')) return;
  const { error } = await supabaseClient.from('students').delete().eq('class', className);
  if (error) notify('Delete failed: ' + error.message, 'error');
  else {
  notify('All students in ' + className + ' deleted.', 'info');
    loadStudents();
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

  let result;
  if (teacherId) {
    // Don't overwrite pin on update
    const updateData = { ...teacherData };
    delete updateData.pin;
    result = await supabaseClient.from('teachers').update(updateData).eq('id', teacherId);
  } else {
    result = await supabaseClient.from('teachers').insert([teacherData]);
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
  form.reset();
  document.getElementById('assignmentRowsContainer').innerHTML = '';
  closeModal('teacherModal');
});

// 📝 Edit Teacher
async function editTeacher(id) {
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
    const { data: assignments } = await supabaseClient.from('teaching_assignments').select('class,subject,area').eq('teacher_id', id);
    if (assignments && assignments.length) {
      assignments.forEach(a => {
        // Pass area as third argument if subject is Career Tech
        if (a.subject === 'Career Tech') {
          container.appendChild(createAssignmentRow(a.class, a.subject, a.area));
        } else {
          container.appendChild(createAssignmentRow(a.class, a.subject));
        }
      });
    } else {
      container.appendChild(createAssignmentRow());
    }
  }

  openModal('teacherModal');
}
// 🔄 Initial Load
loadStudents();
loadTeachers();
loadAdmins();