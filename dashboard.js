// ✅ Supabase client setup
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://omhmahhfeduejykrxflx.supabase.co', // Replace with your actual Supabase URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9taG1haGhmZWR1ZWp5a3J4Zmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDI5NDAsImV4cCI6MjA3MjM3ODk0MH0.UL7cRM4JUEZRqhXarRf8xQDyobvoOxa8eXfG8h9wNHo'             // Replace with your actual anon key
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
document.getElementById('studentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const studentId = form.student_id.value;
  const fullName = form.full_name.value.trim();
  const gender = form.gender.value;
  const studentClass = form.class.value.trim();
  const parentName = form.parent_name.value.trim();
  const parentContact = form.parent_contact.value.trim();
  const pictureFile = form.picture.files[0];

  if (!fullName || !gender || !studentClass || !parentName || !parentContact) {
    alert('Please fill in all required fields.');
    return;
  }

  let pictureUrl = null;
  if (pictureFile) {
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('student-pictures')
      .upload(`students/${Date.now()}_${pictureFile.name}`, pictureFile);
    if (uploadError) return alert('Picture upload failed.');
    pictureUrl = supabaseClient.storage
      .from('student-pictures')
      .getPublicUrl(uploadData.path).publicUrl;
  }

  const username = generateUsername(fullName);
  const pin = generatePin();
  const payload = {
    full_name: fullName,
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

// 📥 CSV Import
function importCSV() {
  const input = document.getElementById('csvInput');
  const file = input.files[0];
  if (!file) return alert('Please select a CSV file.');

  const reader = new FileReader();
  reader.onload = async (e) => {
    const lines = e.target.result.split('\n');
    for (let line of lines.slice(1)) {
      const [full_name, gender, studentClass, parent_name, parent_contact] = line.split(',');
      if (!full_name || !gender || !studentClass || !parent_name || !parent_contact) continue;
      const username = generateUsername(full_name);
      const pin = generatePin();
      await supabaseClient.from('students').insert([{
        full_name, gender, class: studentClass, parent_name, parent_contact, username, pin
      }]);
    }
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
  form.student_id.value = data.id;
  form.full_name.value = data.full_name;
  form.gender.value = data.gender;
  form.class.value = data.class;
  form.parent_name.value = data.parent_name;
  form.parent_contact.value = data.parent_contact;
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
  tbody.innerHTML = '';
  if (error) return console.error('Failed to load students:', error.message);
  data.forEach(student => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><img src="${student.picture_url || ''}" alt="Student" width="40" height="40" /></td>
      <td>${student.full_name}</td>
      <td>${student.gender}</td>
      <td>${student.class}</td>
      <td>${student.parent_name}</td>
      <td>${student.parent_contact}</td>
      <td>${student.username}</td>
      <td>${student.pin}</td>
      <td>
        <button onclick="editStudent('${student.id}')">Edit</button>
        <button onclick="deleteStudent('${student.id}')">Delete</button>
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
  const teacherData = {
    name: form.name.value.trim(),
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
    subjects: getMultiSelectValues(form.subjects)
  };

  const result = teacherId
    ? await supabaseClient.from('teachers').update(teacherData).eq('id', teacherId)
    : await supabaseClient.from('teachers').insert([teacherData]);

  if (result.error) {
    alert('Error: ' + result.error.message);
  } else {
    alert(teacherId ? 'Teacher updated!' : `Teacher registered: ${teacherData.name}`);
    form.reset();
    closeModal('teacherModal');
    loadTeachers();
  }
});

// 📝 Edit Teacher
async function editTeacher(id) {
  const { data, error } = await supabaseClient.from('teachers').select('*').eq('id', id).single();
  if (error) return alert('Failed to load teacher.');
  const form = document.getElementById('teacherForm');
  form.teacher_id.value = data.id;
  form.name.value = data.name;
  form.gender.value = data.gender;
  form.dob.value = data.dob;
  form.staff_id.value = data.staff_id;
  form.ntc.value = data.ntc;
  form.registered_number.value = data.registered_number;
  form.ssnit.value = data.ssnit;
  form.ghana_card.value = data.ghana_card;
  form.contact.value = data.contact;
  form.rank.value = data.rank;
  form.qualification.value = data.qualification;
  Array.from(form.classes.options).forEach(opt => {
    opt.selected = data.classes?.includes(opt.value);
  });
  Array.from(form.subjects.options).forEach(opt => {
    opt.selected = data.subjects?.includes(opt.value);
  });
  openModal('teacherModal');
}

// 🗑️ Delete Teacher
async function deleteTeacher(id) {
  if (!confirm('Are you sure you want to delete this teacher?')) return;
  const { error } = await supabaseClient.from('teachers').delete().eq('id', id);
  if (error) alert('Delete failed.');
  else loadTeachers();
}

// 📋 Load Teachers
async function loadTeachers() {
  const { data, error } = await supabaseClient.from('teachers').select('*');
  const tbody = document.querySelector('#teacherTable tbody');
  tbody.innerHTML = '';
    if (error) {
    console.error('Failed to load teachers:', error.message);
    return;
  }

  data.forEach(teacher => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${teacher.name}</td>
      <td>${teacher.gender}</td>
      <td>${teacher.dob}</td>
      <td>${teacher.staff_id}</td>
      <td>${teacher.ntc}</td>
      <td>${teacher.registered_number}</td>
      <td>${teacher.ssnit}</td>
      <td>${teacher.ghana_card}</td>
      <td>${teacher.contact}</td>
      <td>${teacher.rank}</td>
      <td>${teacher.qualification}</td>
      <td>${teacher.classes?.join(', ') || ''}</td>
      <td>${teacher.subjects?.join(', ') || ''}</td>
      <td>
        <button onclick="editTeacher('${teacher.id}')">Edit</button>
        <button onclick="deleteTeacher('${teacher.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 🔐 Admin Registration
document.getElementById('adminForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const adminId = form.admin_id.value;
  const fullName = form.full_name.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();

  if (!fullName || !email || !phone) {
    alert('Please fill in all fields.');
    return;
  }

  const { data: existingAdmins, error: countError } = await supabaseClient
    .from('admins')
    .select('id');

  if (!adminId && existingAdmins.length >= 2) {
    alert('Only 2 admin users are allowed.');
    return;
  }

  const pin = generatePin();
  const payload = { full_name: fullName, email, phone, pin };

  const result = adminId
    ? await supabaseClient.from('admins').update(payload).eq('id', adminId)
    : await supabaseClient.from('admins').insert([payload]);

  if (result.error) {
    alert('Error: ' + result.error.message);
  } else {
    alert(adminId ? 'Admin updated!' : `Admin added!\nPIN: ${pin}`);
    form.reset();
    closeModal('adminModal');
    loadAdmins();
  }
});

// 📝 Edit Admin
async function editAdmin(id) {
  const { data, error } = await supabaseClient.from('admins').select('*').eq('id', id).single();
  if (error) return alert('Failed to load admin.');

  const form = document.getElementById('adminForm');
  form.admin_id.value = data.id;
  form.full_name.value = data.full_name;
  form.email.value = data.email;
  form.phone.value = data.phone;

  openModal('adminModal');
}

// 🗑️ Delete Admin
async function deleteAdmin(id) {
  if (!confirm('Are you sure you want to delete this admin?')) return;
  const { error } = await supabaseClient.from('admins').delete().eq('id', id);
  if (error) alert('Delete failed.');
  else loadAdmins();
}

// 📋 Load Admins
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
      <td>${admin.full_name}</td>
      <td>${admin.email}</td>
      <td>${admin.phone}</td>
      <td>${admin.pin}</td>
      <td>
        <button onclick="editAdmin('${admin.id}')">Edit</button>
        <button onclick="deleteAdmin('${admin.id}')">Delete</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 🔄 Initial Load
loadStudents();
loadTeachers();
loadAdmins();