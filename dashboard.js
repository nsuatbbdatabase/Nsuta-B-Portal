// Utility: Create a test teacher user for login
async function createTestTeacher() {
  // Check if test user already exists
  const { data: existing } = await supabaseClient.from('teachers').select('*').eq('staff_id', 'TST001');
  if (existing && existing.length > 0) {
    alert(`Test teacher already exists.\nStaff ID: ${existing[0].staff_id}\nPIN: ${existing[0].pin}`);
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
    classes: ['JHS 1'],
    subjects: ['Maths'],
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
    alert('Failed to create test teacher: ' + error.message);
  } else {
    alert(`Test teacher created!\nStaff ID: TST001\nPIN: ${pin}`);
  }
}

// Call this ONCE to create a test teacher (uncomment to use):
// createTestTeacher();
// 🗑️ Delete Teacher
async function deleteTeacher(id) {
  if (!confirm('Are you sure you want to delete this teacher?')) return;
  const { error } = await supabaseClient.from('teachers').delete().eq('id', id);
  if (error) alert('Delete failed.');
  else loadTeachers();
}
// 🗑️ Delete Admin
async function deleteAdmin(id) {
  if (!confirm('Are you sure you want to delete this admin?')) return;
  const { error } = await supabaseClient.from('admins').delete().eq('id', id);
  if (error) alert('Delete failed.');
  else loadAdmins();
}
// � Edit Admin
async function editAdmin(id) {
  const { data, error } = await supabaseClient.from('admins').select('*').eq('id', id).single();
  if (error) return alert('Failed to load admin.');
  const form = document.getElementById('adminForm');
  if (!form) {
    alert('Admin form not found in the HTML.');
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
      <td>${admin.pin || ''}</td>
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
    alert('Error: ' + result.error.message);
  } else {
    alert(adminId ? 'Admin updated!' : `Admin registered: ${adminData.full_name}`);
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
      <td>${data.pin || ''}</td>
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
  const studentForm = document.getElementById('studentForm');
  if (studentForm) {
    studentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const studentId = form.student_id.value;
      const firstName = form.first_name.value.trim();
      const surname = form.surname.value.trim();
      const area = form.area.value.trim();
      const dob = form.dob.value;
      const nhisNumber = form.nhis_number.value.trim();
      const gender = form.gender.value;
      const studentClass = form.class.value.trim();
      const parentName = form.parent_name.value.trim();
      const parentContact = form.parent_contact.value.trim();
      const pictureFile = form.picture.files[0];

      if (!firstName || !surname || !area || !dob || !gender || !studentClass || !parentName || !parentContact) {
        alert('Please fill in all required fields.');
        return;
      }

      let pictureUrl = null;
      if (pictureFile) {
        const uploadPath = `students/${Date.now()}_${pictureFile.name}`;
        const { data: uploadData, error: uploadError } = await supabaseClient.storage
          .from('student-pictures')
          .upload(uploadPath, pictureFile);
        if (uploadError) {
          alert('Picture upload failed: ' + uploadError.message);
          return;
        }
        let publicUrl = null;
        if (uploadData && uploadData.path) {
          const publicUrlResult = supabaseClient.storage
            .from('student-pictures')
            .getPublicUrl(uploadData.path);
          if (publicUrlResult && publicUrlResult.data && publicUrlResult.data.publicUrl) {
            publicUrl = publicUrlResult.data.publicUrl;
          } else if (publicUrlResult && publicUrlResult.publicUrl) {
            publicUrl = publicUrlResult.publicUrl;
          }
        }
        pictureUrl = publicUrl;
        if (!pictureUrl) {
          alert('Picture uploaded but public URL could not be generated.');
          return;
        }
      }

      const username = (firstName + '.' + surname).toLowerCase();
      const pin = generatePin();
      const payload = {
        first_name: firstName,
        surname: surname,
        area: area,
        dob: dob,
        nhis_number: nhisNumber,
        gender,
        class: studentClass,
        parent_name: parentName,
        parent_contact: parentContact,
        username,
        pin,
        picture_url: pictureUrl
      };

      const result = studentId
        ? await supabaseClient.from('students').update(payload).eq('id', studentId)
        : await supabaseClient.from('students').insert([payload]);

      if (result.error) {
        alert('Error: ' + result.error.message);
      } else {
        alert(studentId ? 'Student updated!' : `Student added!\nUsername: ${username}\nPIN: ${pin}`);
        form.reset();
        closeModal('studentModal');
        loadStudents();
      }
    });
  }
});

// 📥 CSV Import
function importCSV() {
  const input = document.getElementById('csvInput');
  const file = input.files[0];
  if (!file) return alert('Please select a CSV file.');

  const reader = new FileReader();
  reader.onload = async (e) => {
    const lines = e.target.result.split('\n');
    const insertPromises = [];
    for (let line of lines.slice(1)) {
      const [first_name, surname, area, dob, nhis_number, gender, studentClass, parent_name, parent_contact] = line.split(',');
      if (!first_name || !surname || !area || !dob || !gender || !studentClass || !parent_name || !parent_contact) continue;
      const username = (first_name + '.' + surname).toLowerCase();
      const pin = generatePin();
      insertPromises.push(
        supabaseClient.from('students').insert([
          { first_name, surname, area, dob, nhis_number, gender, class: studentClass, parent_name, parent_contact, username, pin }
        ])
      );
    }
    await Promise.all(insertPromises);
    alert('CSV import complete.');
    loadStudents();
  };
  reader.readAsText(file);
}

// 📝 Edit Student
async function editStudent(id) {
  const { data, error } = await supabaseClient.from('students').select('*').eq('id', id).single();
  if (error) return alert('Failed to load student.');
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
  openModal('studentModal');
}

// 🗑️ Delete Student
async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) return;
  const { error } = await supabaseClient.from('students').delete().eq('id', id);
  if (error) alert('Delete failed.');
  else loadStudents();
}

// 📋 Load Students
async function loadStudents() {
  const { data, error } = await supabaseClient.from('students').select('*');
  const tbody = document.querySelector('#studentTable tbody');
  const select = document.getElementById('studentSelect');
  tbody.innerHTML = '';
  if (select) {
    select.innerHTML = '<option value="">-- Select Student --</option>';
    if (data && Array.isArray(data)) {
      data.forEach(student => {
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
        opt.textContent = name + ' (' + (student.class || '') + ')';
        select.appendChild(opt);
      });
    }
  }
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
      <td>${data.pin}</td>
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
    classes: getMultiSelectValues(form.classes),
    subjects: getMultiSelectValues(form.subjects),
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
    responsibility: form.responsibility.value.trim(),
    denomination: form.denomination.value.trim(),
    home_town: form.home_town.value.trim(),
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
    alert('Error: ' + result.error.message);
  } else {
    if (teacherId) {
      alert('Teacher updated!');
      // Re-fetch and reopen the edit modal with latest data
      await loadTeachers();
      setTimeout(() => editTeacher(teacherId), 300); // slight delay to ensure list is refreshed
    } else {
      alert(`Teacher registered: ${teacherData.name}\nPIN: ${pin}`);
      form.reset();
      Array.from(form.classes.options).forEach(opt => opt.selected = false);
      Array.from(form.subjects.options).forEach(opt => opt.selected = false);
      closeModal('teacherModal');
      loadTeachers();
    }
  }
});

// 📝 Edit Teacher
async function editTeacher(id) {
  const { data, error } = await supabaseClient.from('teachers').select('*').eq('id', id).single();
  if (error) return alert('Failed to load teacher.');
  const form = document.getElementById('teacherForm');
  form.teacher_id.value = data.id || '';
  form.name.value = data.name || '';
  form.gender.value = data.gender || '';
  form.dob.value = data.dob || '';
  form.staff_id.value = data.staff_id || '';
  form.ntc.value = data.ntc || '';
  form.registered_number.value = data.registered_number || '';
  form.ssnit.value = data.ssnit || '';
  form.ghana_card.value = data.ghana_card || '';
  form.contact.value = data.contact || '';
  form.rank.value = data.rank || '';
  form.qualification.value = data.qualification || '';
  // Multi-select: classes
  Array.from(form.classes.options).forEach(opt => {
    opt.selected = (data.classes || []).includes(opt.value);
  });
  // Multi-select: subjects
  Array.from(form.subjects.options).forEach(opt => {
    opt.selected = (data.subjects || []).includes(opt.value);
  });
  form.first_appointment_date.value = data.first_appointment_date || '';
  form.date_placed_on_rank.value = data.date_placed_on_rank || '';
  form.salary_level.value = data.salary_level || '';
  form.bank.value = data.bank || '';
  form.bank_branch.value = data.bank_branch || '';
  form.bank_account_number.value = data.bank_account_number || '';
  form.highest_professional_qualification.value = data.highest_professional_qualification || '';
  form.professional_qualification_date.value = data.professional_qualification_date || '';
  form.last_promotion_date.value = data.last_promotion_date || '';
  form.previous_station.value = data.previous_station || '';
  form.years_at_present_school.value = data.years_at_present_school || '';
  form.due_for_promotion.value = data.due_for_promotion || '';
  form.responsibility.value = data.responsibility || '';
  form.denomination.value = data.denomination || '';
  form.home_town.value = data.home_town || '';

  openModal('teacherModal');
}
// 🔄 Initial Load
loadStudents();
loadTeachers();
loadAdmins();