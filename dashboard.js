// Show/hide class teacher section based on responsibility in teacher modal
document.addEventListener('DOMContentLoaded', function() {
  // --- Teacher Form Submission Logic: Ensure class_teacher_class is set ---
  const teacherForm = document.getElementById('teacherForm');
  if (teacherForm) {
    teacherForm.addEventListener('submit', async function(e) {
      // Set class_teacher_class_main / subclass before submit (and keep legacy combined field)
      const resp = teacherForm.querySelector('[name="responsibility"]').value;
      const mainClass = teacherForm.querySelector('[name="main_class_select"]');
      const subClass = teacherForm.querySelector('[name="sub_class_select"]');
      const classField = teacherForm.querySelector('[name="class_teacher_class"]');
      const classMainField = teacherForm.querySelector('[name="class_teacher_class_main"]');
  const classSubField = teacherForm.querySelector('[name="class_teacher_subclass"]');
      if (resp === 'Class Teacher') {
        if (mainClass && mainClass.value === 'JHS 3') {
          if (classMainField) classMainField.value = 'JHS 3';
          if (classSubField) classSubField.value = '';
          if (classField) classField.value = 'JHS 3';
        } else if (mainClass && subClass && mainClass.value && subClass.value) {
          if (classMainField) classMainField.value = mainClass.value;
          if (classSubField) classSubField.value = subClass.value;
          if (classField) classField.value = mainClass.value + ' ' + subClass.value;
        }
      } else {
        if (classField) classField.value = '';
        if (classMainField) classMainField.value = '';
        if (classSubField) classSubField.value = '';
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
      const mainField = document.getElementById('class_teacher_class_main');
  const subField = document.getElementById('class_teacher_subclass');
      const legacy = document.getElementById('class_teacher_class');
      if (respSelect.value === 'Class Teacher') {
        classSection.style.display = '';
        if (mainField) mainField.required = true;
        if (legacy) legacy.required = true;
      } else {
        classSection.style.display = 'none';
        if (mainField) mainField.required = false;
        if (legacy) legacy.required = false;
        if (mainField) mainField.value = '';
        if (subField) subField.value = '';
        if (legacy) legacy.value = '';
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
      // fallback to native alert so admins see important messages even if toasts are not loaded
    if (typeof window.alert === 'function') return window.alert(String(msg));
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
    // Respect stored preference for this confirmation
    let pref = null;
    try { pref = localStorage.getItem('nsuta_confirm_delete_teacher'); } catch (e) { pref = null; }
    if (pref === 'false') {
      // user opted out of confirmations for this action
    } else {
      const ok = (typeof window.showConfirm === 'function') ? await window.showConfirm('Are you sure you want to delete this teacher?', { title: 'Delete teacher', rememberKey: 'delete_teacher' }) : confirm('Are you sure you want to delete this teacher?');
      if (!ok) return;
    }
  } catch (e) { return; }
  const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Deleting teacher...', { color: '#c62828' }) : null;
  try {
    const { error } = await supabaseClient.from('teachers').delete().eq('id', id);
    if (error) notify('Delete failed: ' + (error.message || ''), 'error');
    else {
      notify('Teacher deleted.', 'info');
      try { if (typeof loadTeachers === 'function') loadTeachers(); } catch (e) { /* ignore */ }
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
  let data, error;
  try {
    const res = await supabaseClient.from('admins').select('*');
    data = res.data; error = res.error;
  } catch (err) {
    data = null; error = err;
  }
  const tbody = document.querySelector('#adminTable tbody');
  if (!tbody) {
    console.warn('loadAdmins: #adminTable tbody not found in DOM; aborting render');
    return;
  }
  tbody.innerHTML = '';
  if (error || !Array.isArray(data)) {
    const isOffline = (typeof navigator !== 'undefined' && navigator && navigator.onLine === false);
    if (isOffline) notify('Please connect to the network and try again.', 'error');
    else notify('Failed to load admins. Please try again later.', 'error');
    console.error('Failed to load admins:', error && error.message ? error.message : error);
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
  let data, error;
  try {
    const res = await supabaseClient.from('teachers').select('*');
    data = res.data; error = res.error;
  } catch (err) {
    data = null; error = err;
  }
  const tbody = document.querySelector('#teacherTable tbody');
  const select = document.getElementById('teacherSelect');
  if (!tbody) {
    console.warn('loadTeachers: #teacherTable tbody not found in DOM; aborting render');
    return;
  }
  tbody.innerHTML = '';
  if (error || !Array.isArray(data)) {
    const isOffline = (typeof navigator !== 'undefined' && navigator && navigator.onLine === false);
    if (isOffline) notify('Please connect to the network and try again.', 'error');
    else notify('Failed to load teachers. Please try again later.', 'error');
    console.error('loadTeachers error', error);
    return;
  }
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
  // Render all teachers into the table so the Actions column is visible by default
  if (tbody && data && Array.isArray(data)) {
    data.forEach(dataTeacher => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="name">${dataTeacher.name}</td>
        <td class="center">${dataTeacher.gender}</td>
        <td class="center">${dataTeacher.dob}</td>
        <td class="mono">${dataTeacher.staff_id}</td>
        <td class="mono">${dataTeacher.ntc}</td>
        <td class="mono">${dataTeacher.registered_number}</td>
        <td class="mono">${dataTeacher.ssnit}</td>
        <td class="mono">${dataTeacher.ghana_card}</td>
        <td class="mono">${dataTeacher.contact}</td>
        <td class="center">${dataTeacher.rank}</td>
        <td class="mono">${dataTeacher.qualification}</td>
        <td class="mono">${(dataTeacher.classes && dataTeacher.classes.join(', ')) || ''}</td>
        <td class="mono">${(dataTeacher.subjects && dataTeacher.subjects.join(', ')) || ''}</td>
        <td class="center">${dataTeacher.pin ? '••••' : ''}</td>
        <td class="actions">
          <button class="btn" onclick="editTeacher('${dataTeacher.id}')">Edit</button>
          <button class="btn" onclick="deleteTeacher('${dataTeacher.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }
}
// Show only the selected teacher's info in the table
window.showSelectedTeacher = function showSelectedTeacher() {
  const select = document.getElementById('teacherSelect');
  const tbody = document.querySelector('#teacherTable tbody');
  if (!tbody) {
    console.warn('showSelectedTeacher: #teacherTable tbody not found in DOM; aborting');
    return;
  }
  if (!select) {
    console.warn('showSelectedTeacher: #teacherSelect not found; falling back to loadTeachers');
    try { if (typeof loadTeachers === 'function') loadTeachers(); } catch (e) {}
    return;
  }
  tbody.innerHTML = '';
  const teacherId = select.value;
  if (!teacherId) {
    // No selection -> show all teachers
    try { if (typeof loadTeachers === 'function') loadTeachers(); } catch (e) {}
    return;
  }
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

// When attendance is updated by any teacher, compute which Class Teachers did NOT mark
// their register for the given term/date and notify the admin UI.
async function checkMissingRegisters(term, date) {
  if (!term) return;
  try {
    // Fetch all teachers who are Class Teachers and have an assigned class
    const { data: teachers, error: tErr } = await supabaseClient
      .from('teachers')
      .select('id, name, staff_id, contact, email, class_teacher_class_main, class_teacher_subclass')
      .eq('responsibility', 'Class Teacher');
    if (tErr) {
      console.error('Failed to load class teachers for missing-register check:', tErr);
      return;
    }

    // Build expected class keys for each teacher
    const teacherMap = teachers.map(t => {
      const main = (t.class_teacher_class_main || '').toString().trim();
      const sub = (t.class_teacher_subclass || '').toString().trim();
      const key = main ? (sub ? `${main} ${sub}` : main) : null;
      return { id: t.id, name: t.name || t.staff_id || '(unknown)', key, contact: t.contact || '', email: t.email || '' };
    }).filter(x => x.key);

    // Query attendance rows for this term and date
    const { data: attRows, error: aErr } = await supabaseClient
      .from('attendance')
      .select('class, subclass, marked_by')
      .eq('term', term)
      .eq('date', date);
    if (aErr) {
      console.error('Failed to load attendance rows for missing-register check:', aErr);
      return;
    }

    const presentSet = new Set();
    (attRows || []).forEach(r => {
      const c = (r.class || '').toString().trim();
      const s = (r.subclass || '').toString().trim();
      if (!c) return;
      presentSet.add(s ? `${c} ${s}` : c);
    });

    const notMarked = teacherMap.filter(t => !presentSet.has(t.key));
    if (notMarked.length === 0) {
      notify(`All class teachers have marked attendance for ${date} (${term}).`, 'info');
      // Clear any existing panel
      renderMissingRegistersPanel([], term, date);
      return notMarked;
    }

    // Build a short message listing missing teachers and their classes
    const list = notMarked.map(t => `${t.name} (${t.key})`).join('; ');
    notify(`Attendance update: the following Class Teachers have NOT marked for ${date} (${term}): ${list}`, 'warning');
    // Render the detailed, dismissable panel if available
    renderMissingRegistersPanel(notMarked, term, date);
    return notMarked;
  } catch (e) {
    console.error('checkMissingRegisters failed:', e);
  }
}

// Update the 'Last Attendance' tile: show the teacher name and relative time of the most recent attendance submission.
async function updateLastAttendanceTile(payload) {
  const el = document.getElementById('kpiLastAttendance');
  const dateEl = document.getElementById('kpiLastAttendanceDate');
  const spinner = document.getElementById('kpiLastAttendanceSpinner');
  if (!el) return;
  try {
    // show spinner
    if (spinner) spinner.style.display = 'inline-block';

    // Fetch the last 3 attendance rows (prefer created_at if available)
    let rows = [];
    try {
      const { data, error } = await supabaseClient.from('attendance').select('marked_by,date,created_at').order('created_at', { ascending: false }).limit(3);
      if (!error && Array.isArray(data)) rows = data;
    } catch (e) {
      console.warn('updateLastAttendanceTile: attendance query failed', e);
    }

    // If we have no rows, fall back to payload info
    if ((!rows || rows.length === 0) && payload) {
      const teacherId = payload.marked_by || payload.teacherId || payload.markerId || null;
      if (teacherId) {
        try {
          const { data: tdata } = await supabaseClient.from('teachers').select('id,name').eq('id', teacherId).maybeSingle();
          if (tdata) rows = [{ marked_by: tdata.id, date: payload.date || null, created_at: payload.ts || null }];
        } catch (e) { /* ignore */ }
      }
    }

    // Resolve teacher names for the rows
    const teacherIds = [...new Set((rows || []).map(r => r.marked_by).filter(Boolean))];
    let teachersMap = {};
    if (teacherIds.length) {
      try {
        const { data: trows, error: terr } = await supabaseClient.from('teachers').select('id,name').in('id', teacherIds);
        if (!terr && Array.isArray(trows)) {
          trows.forEach(t => { teachersMap[t.id] = t.name; });
        }
      } catch (e) { /* ignore */ }
    }

    // Build a list of last submitters for modal usage
    const lastList = (rows || []).map(r => ({ teacher_id: r.marked_by || null, name: teachersMap[r.marked_by] || '(Unknown)', date: r.date || null, created_at: r.created_at || null }));
    // Cache it globally so modal can reuse
    try { window._lastAttendanceList = lastList; } catch (e) {}

    // Update the tile showing the most recent submitter and relative time
    const first = lastList[0];
    if (first) {
      el.textContent = first.name || '—';
      if (dateEl) {
        const ts = first.created_at || first.date;
        dateEl.textContent = ts ? relativeTimeFromISO(ts) : '';
      }
    } else {
      el.textContent = '—';
      if (dateEl) dateEl.textContent = '';
    }

  } catch (e) {
    console.warn('updateLastAttendanceTile failed', e);
  } finally {
    if (spinner) spinner.style.display = 'none';
  }
}

// Small helper: relative time string from an ISO date or timestamp
function relativeTimeFromISO(iso) {
  try {
    const d = new Date(iso);
    if (!d || isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 5) return 'just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    // older: show date
    return d.toISOString().slice(0,10);
  } catch (e) { return ''; }
}

// Wire the Last Attendance tile to open a modal listing the last 3 submitters
function wireLastAttendanceUI() {
  const tile = document.getElementById('tileLastAttendance');
  if (!tile) return;
  try {
    tile.addEventListener('click', async function() {
      // Populate modal list (use cached if present)
      const listEl = document.getElementById('lastAttendanceList');
      if (!listEl) return;
      listEl.textContent = 'Loading…';
      let list = window._lastAttendanceList;
      if (!list || !Array.isArray(list) || !list.length) {
        // re-fetch
        try {
          const { data: rows } = await supabaseClient.from('attendance').select('marked_by,date,created_at').order('created_at', { ascending: false }).limit(3);
          const ids = [...new Set((rows||[]).map(r=>r.marked_by).filter(Boolean))];
          let teachersMap = {};
          if (ids.length) {
            const { data: trows } = await supabaseClient.from('teachers').select('id,name').in('id', ids);
            (trows||[]).forEach(t => { teachersMap[t.id] = t.name; });
          }
          list = (rows||[]).map(r => ({ teacher_id: r.marked_by, name: teachersMap[r.marked_by] || '(Unknown)', date: r.date || null, created_at: r.created_at || null }));
          window._lastAttendanceList = list;
        } catch (e) { console.warn('Failed to fetch recent attendance for modal', e); list = []; }
      }
      if (!list || !list.length) {
        listEl.innerHTML = '<div class="muted-small">No recent attendance submissions found.</div>';
      } else {
        listEl.innerHTML = '';
        const ul = document.createElement('ul'); ul.style.listStyle = 'none'; ul.style.padding = '0'; ul.style.margin = '0';
        list.forEach(item => {
          const li = document.createElement('li'); li.style.padding = '0.4rem 0';
          const time = item.created_at || item.date || '';
          li.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;"><div><strong>${item.name}</strong></div><div class="muted-small">${time ? relativeTimeFromISO(time) : ''}</div></div>`;
          ul.appendChild(li);
        });
        listEl.appendChild(ul);
      }
      // Open modal using existing helper
      try { openModal('lastAttendanceModal'); } catch (e) { const m = document.getElementById('lastAttendanceModal'); if (m) m.classList.remove('hidden'); }
    });
  } catch (e) { console.warn('wireLastAttendanceUI failed', e); }
}

// -------------------------------
// Gallery: load, render and upload images to Supabase Storage + gallery table
// -------------------------------
async function loadGallery(limit = 18) {
  try {
    // include thumbnail metadata so previews can use the smaller images
    const { data, error } = await supabaseClient
      .from('gallery')
      .select('id,title,description,public_url,thumbnail_url,path,thumbnail_path,uploader_id,created_at')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.warn('loadGallery: failed to load gallery rows', error);
      // still clear any existing grid
      renderGalleryGrid([]);
      return [];
    }
    renderGalleryGrid(data || []);
  try { const kp = document.getElementById('kpiGalleryCount'); if (kp) kp.textContent = (data && data.length) ? (data.length + ' recent') : 'No items'; } catch(e){}

    // Show a random thumbnail in the small KPI preview on the dashboard
    try {
      const previewEl = document.getElementById('kpiGalleryPreview');
      if (previewEl) {
        if (!data || !data.length) {
          previewEl.textContent = '—';
        } else {
          const rnd = data[Math.floor(Math.random() * data.length)];
          const imgSrc = (rnd && (rnd.thumbnail_url || rnd.public_url || rnd.path)) ? (rnd.thumbnail_url || rnd.public_url || rnd.path) : null;
          if (imgSrc) {
            // use an <img> for the dashboard preview; keep it small and cover the card area
            // set styles via class to avoid inline style lint warnings
            previewEl.innerHTML = '';
            const img = document.createElement('img');
            img.src = imgSrc;
            img.alt = 'Gallery preview';
            img.className = 'kpi-gallery-preview-img';
            previewEl.appendChild(img);
            // ensure CSS for the preview img exists
            try {
              if (!document.getElementById('kpiGalleryPreviewImgStyle')) {
                const s = document.createElement('style');
                s.id = 'kpiGalleryPreviewImgStyle';
                s.textContent = '.kpi-gallery-preview-img{width:100%;height:64px;object-fit:cover;border-radius:6px;display:block;} @media (max-width:900px){.kpi-gallery-preview-img{height:48px;}}';
                document.head.appendChild(s);
              }
            } catch (e) { /* ignore */ }
          } else {
            previewEl.textContent = rnd.title || 'Latest';
          }
        }
      }
    } catch (e) { console.warn('Failed to set gallery KPI preview', e); }
    return data || [];
  } catch (e) {
    console.error('loadGallery failed', e);
    renderGalleryGrid([]);
    return [];
  }
}

function renderGalleryGrid(items) {
  const grid = document.getElementById('galleryGrid');
  const preview = document.getElementById('kpiGalleryPreview');
  if (!grid) return;
  grid.innerHTML = '';
  if (!items || !items.length) {
    grid.innerHTML = '<div class="muted-small">No gallery items yet.</div>';
    if (preview) preview.textContent = '—';
    return;
  }
  items.forEach(item => {
    const thumb = document.createElement('div');
    thumb.className = 'gallery-thumb';
    // Prefer thumbnail_url for fast previews when available
    const imgUrl = item.thumbnail_url || item.public_url || item.path || '';
    const safeTitle = item.title ? String(item.title) : '';
    const safeDesc = item.description ? String(item.description) : '';
    thumb.innerHTML = `<img src="${imgUrl}" alt="${safeTitle}" loading="lazy" /><div class="meta"><strong>${safeTitle}</strong><div class="muted-small">${safeDesc}</div></div>`;
    thumb.addEventListener('click', function() {
      // open image in new tab for full-size view
      // Open the original (full-size) image if available, otherwise open the preview
      const fullUrl = item.public_url || item.path || imgUrl;
      if (fullUrl) window.open(fullUrl, '_blank');
    });
    grid.appendChild(thumb);
  });
  if (preview) preview.textContent = items[0] && items[0].title ? items[0].title : 'Latest';
}

async function galleryUploadHandler() {
  try {
    const fileInput = document.getElementById('galleryFile');
    const titleEl = document.getElementById('galleryTitle');
    const descEl = document.getElementById('galleryDesc');
    if (!fileInput || !fileInput.files || !fileInput.files.length) return notify('Please select an image to upload.', 'warning');
    const files = Array.from(fileInput.files);
    const title = titleEl ? titleEl.value.trim() : '';
    const desc = descEl ? descEl.value.trim() : '';
    // Use a bucket named 'school-gallery' (create this bucket in Supabase Storage first)
    const bucket = 'school-gallery';
    const loader = (typeof window.showLoadingToast === 'function') ? window.showLoadingToast('Uploading images...', { color: '#0b66b2' }) : null;
    try {
      // helper: generate a thumbnail blob from a File using canvas
      async function generateThumbnailBlob(file, maxWidth = 800, quality = 0.7) {
        try {
          // Prefer createImageBitmap when available for better performance
          let imageBitmap;
          if (typeof createImageBitmap === 'function') {
            imageBitmap = await createImageBitmap(file);
            const ratio = imageBitmap.width / imageBitmap.height;
            const targetWidth = Math.min(maxWidth, imageBitmap.width);
            const targetHeight = Math.round(targetWidth / ratio);
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
            return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
          } else {
            // Fallback to Image + FileReader
            const dataUrl = await new Promise((resolve, reject) => {
              const fr = new FileReader();
              fr.onload = () => resolve(fr.result);
              fr.onerror = reject;
              fr.readAsDataURL(file);
            });
            const img = await new Promise((resolve, reject) => {
              const i = new Image();
              i.onload = () => resolve(i);
              i.onerror = reject;
              i.src = dataUrl;
            });
            const ratio = img.width / img.height;
            const targetWidth = Math.min(maxWidth, img.width);
            const targetHeight = Math.round(targetWidth / ratio);
            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            return await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
          }
        } catch (e) {
          console.warn('generateThumbnailBlob failed', e);
          return null;
        }
      }

      // Upload each file (original + thumbnail) and insert metadata row
      const inserted = [];
      for (const file of files) {
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g,'_')}`;
        const origPath = `gallery/${fileName}`;

        // Upload original file
        const { error: upErr } = await supabaseClient.storage.from(bucket).upload(origPath, file, { cacheControl: '3600', upsert: false });
        if (upErr) {
          const rawMsg = (upErr && upErr.message) ? upErr.message.toString() : JSON.stringify(upErr || '');
          console.error('galleryUpload: storage upload failed', upErr);
          const isBucketMissing = (upErr && (upErr.status === 404 || upErr.status === 400)) || /bucket.*not.*found|bucket.*does not exist|no such bucket|not found/i.test(rawMsg);
          if (isBucketMissing) {
            notify('Upload failed: storage bucket "school-gallery" not found. Create the bucket in Supabase Storage > Buckets (see instructions).', 'error');
            const hint = document.getElementById('galleryBucketHint');
            if (hint) {
              hint.style.display = 'block';
              hint.textContent = 'Storage bucket "school-gallery" was not found. In your Supabase project go to Storage → Buckets and create a bucket named "school-gallery". Set public if you want public image URLs.';
            }
            // stop processing further files
            break;
          } else {
            notify('Upload failed: ' + (upErr.message || String(upErr)), 'error');
            continue;
          }
        }

        // Try to get public URL for original
        let publicUrl = null;
        try {
          const { data: pu } = await supabaseClient.storage.from(bucket).getPublicUrl(origPath);
          publicUrl = pu && (pu.publicUrl || pu.public_url) ? (pu.publicUrl || pu.public_url) : null;
        } catch (e) { /* ignore */ }

        // Generate and upload thumbnail (best-effort)
        let thumbnailPath = null;
        let thumbnailUrl = null;
        try {
          const thumbBlob = await generateThumbnailBlob(file, 800, 0.7);
          if (thumbBlob) {
            const thumbName = `thumb_${fileName.replace(/[^a-zA-Z0-9_\.\-]/g,'')}`;
            thumbnailPath = `gallery/thumbs/${thumbName}.jpg`;
            const { error: thumbErr } = await supabaseClient.storage.from(bucket).upload(thumbnailPath, thumbBlob, { cacheControl: '3600', upsert: false });
            if (!thumbErr) {
              try {
                const { data: tpu } = await supabaseClient.storage.from(bucket).getPublicUrl(thumbnailPath);
                thumbnailUrl = tpu && (tpu.publicUrl || tpu.public_url) ? (tpu.publicUrl || tpu.public_url) : null;
              } catch (e) { /* ignore */ }
            } else {
              console.warn('Thumbnail upload failed for', thumbnailPath, thumbErr);
              thumbnailPath = null;
            }
          }
        } catch (e) { console.warn('Thumbnail generation/upload failed', e); }

        // Try to capture uploader id if an auth user is available (best-effort)
        let uploaderId = null;
        try {
          if (supabaseClient.auth && typeof supabaseClient.auth.getUser === 'function') {
            const userRes = await supabaseClient.auth.getUser();
            uploaderId = userRes && userRes.data && userRes.data.user ? userRes.data.user.id : null;
          } else if (supabaseClient.auth && typeof supabaseClient.auth.user === 'function') {
            const u = supabaseClient.auth.user();
            uploaderId = u ? u.id : null;
          }
        } catch (e) { /* ignore auth read errors */ }

        const meta = { title: title || null, description: desc || null, path: origPath, public_url: publicUrl, thumbnail_path: thumbnailPath || null, thumbnail_url: thumbnailUrl || null, uploader_id: uploaderId };
        try {
          const { error: insErr } = await supabaseClient.from('gallery').insert([meta]);
          if (insErr) {
            console.error('galleryUpload: failed to insert metadata', insErr);
            notify('Image uploaded but saving metadata failed: ' + (insErr.message || ''), 'warning');
          } else {
            inserted.push(meta);
          }
        } catch (e) {
          console.error('galleryUpload: metadata insert exception', e);
        }
      }

      if (inserted.length) {
        notify(`Uploaded ${inserted.length} image(s) to gallery.`, 'info');
        try { fileInput.value = ''; if (titleEl) titleEl.value = ''; if (descEl) descEl.value = ''; } catch(e){}
        await loadGallery();
        try { if (typeof setupHeaderSlideshow === 'function') await setupHeaderSlideshow(8); } catch (e) { /* ignore */ }
      }
    } finally {
      try { loader && loader.close(); } catch (e) {}
    }
  } catch (e) {
    console.error('galleryUploadHandler failed', e);
    notify('Gallery upload failed. See console for details.', 'error');
  }
}

function wireGalleryUI() {
  try {
    const tile = document.getElementById('tileGallery');
    if (tile) {
      tile.addEventListener('click', async function() {
        try { await loadGallery(); } catch(e){}
        try { openModal('galleryModal'); } catch (e) { const m = document.getElementById('galleryModal'); if (m) m.classList.remove('hidden'); }
      });
    }
    const uploadBtn = document.getElementById('galleryUploadBtn');
    if (uploadBtn) {
      try { uploadBtn.removeEventListener && uploadBtn.removeEventListener('click', uploadBtn._nsuta_gallery_handler); } catch(e){}
      uploadBtn._nsuta_gallery_handler = function(e) { e.preventDefault(); galleryUploadHandler(); };
      uploadBtn.addEventListener('click', uploadBtn._nsuta_gallery_handler);
    }
  } catch (e) { console.warn('wireGalleryUI failed', e); }
}


// Render or update the missing-registers panel in the admin UI
function renderMissingRegistersPanel(list, term, date) {
  let panel = document.getElementById('missingRegistersPanel');
  if (!panel) return;
  const header = panel.querySelector('.mrp-header');
  const body = panel.querySelector('.mrp-body');
  const footer = panel.querySelector('.mrp-footer');
  header.textContent = list.length === 0 ? `All class teachers marked for ${date} (${term})` : `Class teachers missing registers for ${date} (${term})`;
  body.innerHTML = '';
  if (!list || list.length === 0) {
    body.innerHTML = '<div class="mrp-empty">No missing registers.</div>';
  } else {
    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '0';
    ul.style.margin = '0';
    list.forEach(t => {
      const li = document.createElement('li');
      li.style.padding = '0.4rem 0';
      li.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;">
          <div><strong>${t.name}</strong> <span class="muted-small">${t.key}</span></div>
          <div style="display:flex;gap:0.4rem;align-items:center;">
            ${t.contact ? `<a href="tel:${t.contact}" class="mrp-link">Call</a>` : ''}
            ${t.email ? `<a href="mailto:${t.email}" class="mrp-link">Email</a>` : ''}
            <button class="mrp-edit-btn" data-teacher-id="${t.id}">Edit</button>
          </div>
        </div>
      `;
      ul.appendChild(li);
    });
    body.appendChild(ul);
    // Wire edit buttons
    body.querySelectorAll('.mrp-edit-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = ev.currentTarget.getAttribute('data-teacher-id');
        if (typeof editTeacher === 'function') editTeacher(id);
      });
    });
  }
  // Show panel
  panel.classList.remove('hidden');
}

// Listen for cross-tab attendance notifications (teacher pages set localStorage.attendanceUpdated)
window.addEventListener('storage', function(e) {
  if (!e || e.key !== 'attendanceUpdated') return;
  try {
  const payload = JSON.parse(e.newValue || e.oldValue || '{}');
  const term = payload && payload.term ? payload.term : (document.getElementById('term')?.value || '');
  // Prefer teacher-sent date in payload, otherwise use today's date
  const date = payload && payload.date ? payload.date : new Date().toISOString().slice(0,10);
    // Run the missing-registers check (no await to avoid blocking storage listener)
    checkMissingRegisters(term, date);
    // Also update the dashboard tile so admins can see who submitted
    try { updateLastAttendanceTile(payload); } catch (e) { /* ignore */ }
  } catch (err) {
    console.warn('Failed to process attendanceUpdated storage event', err);
  }
});

// Wire up admin UI controls (run immediately if DOM already ready)
function wireCheckRegistersUI() {
  const btn = document.getElementById('btnCheckRegisters');
  if (btn) {
    // avoid attaching duplicate handlers
    try { btn.removeEventListener && btn.removeEventListener('click', btn._nsuta_check_handler); } catch(e){}
    btn._nsuta_check_handler = function() {
      const crTerm = document.getElementById('crTerm');
      const crDate = document.getElementById('crDate');
      const defaultTerm = document.getElementById('term')?.value || '';
      if (crTerm) crTerm.value = defaultTerm;
      if (crDate) crDate.value = new Date().toISOString().slice(0,10);
      openModal('checkRegistersModal');
    };
    btn.addEventListener('click', btn._nsuta_check_handler);
  }

  const closeBtn = document.getElementById('mrpCloseBtn');
  if (closeBtn) {
    try { closeBtn.removeEventListener && closeBtn.removeEventListener('click', closeBtn._nsuta_close_handler); } catch(e){}
    closeBtn._nsuta_close_handler = function() { const p = document.getElementById('missingRegistersPanel'); if (p) p.classList.add('hidden'); };
    closeBtn.addEventListener('click', closeBtn._nsuta_close_handler);
  }

  // Modal buttons
  const crCancel = document.getElementById('crCancel');
  const crRun = document.getElementById('crRun');
  if (crCancel) {
    try { crCancel.removeEventListener && crCancel.removeEventListener('click', crCancel._nsuta_cancel_handler); } catch(e){}
    crCancel._nsuta_cancel_handler = function() { closeModal('checkRegistersModal'); };
    crCancel.addEventListener('click', crCancel._nsuta_cancel_handler);
  }
  if (crRun) {
    try { crRun.removeEventListener && crRun.removeEventListener('click', crRun._nsuta_run_handler); } catch(e){}
    crRun._nsuta_run_handler = async function() {
      const term = document.getElementById('crTerm')?.value?.trim() || '';
      const date = document.getElementById('crDate')?.value || new Date().toISOString().slice(0,10);
      if (!term) return notify('Term is required to check registers.', 'warning');
      try {
        await checkMissingRegisters(term, date);
        closeModal('checkRegistersModal');
      } catch (e) { console.error('Manual checkMissingRegisters failed', e); notify('Failed to run check.', 'error'); }
    };
    crRun.addEventListener('click', crRun._nsuta_run_handler);
  }
}

if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', wireCheckRegistersUI);
else wireCheckRegistersUI();

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

// Normalize gender values from various formats into canonical 'Male'|'Female'|'Other' or null
function normalizeGender(g) {
  if (!g && g !== 0) return null;
  const s = String(g).trim().toLowerCase();
  if (!s) return null;
  // Common patterns: 'm', 'male', 'male ', 'M', 'f', 'female', etc.
  if (s === 'm' || s === 'male' || s.startsWith('m')) return 'Male';
  if (s === 'f' || s === 'female' || s.startsWith('f')) return 'Female';
  return 'Other';
}

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
  let data, error;
  try {
    const res = await supabaseClient.from('students').select('*');
    data = res.data;
    error = res.error;
  } catch (err) {
    data = null; error = err;
  }
  // Robustly locate the student table tbody. The table may be moved into a modal or
  // temporarily not present when this runs (race with other scripts). Attempt a few
  // quick retries before giving up, and create a <tbody> if the <table> exists but no
  // tbody is present.
  let tbody = null;
  const maxRetries = 4;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const table = document.getElementById('studentTable');
      if (table) {
        tbody = table.querySelector('tbody');
        if (!tbody) {
          // create tbody so rendering can proceed
          tbody = document.createElement('tbody');
          table.appendChild(tbody);
        }
      } else {
        // fallback to querySelector across document (should be equivalent)
        tbody = document.querySelector('#studentTable tbody');
      }
      if (tbody) break;
    } catch (e) { /* ignore and retry */ }
    // brief delay before retrying to allow DOM mutations from other scripts
    await new Promise(resolve => setTimeout(resolve, 80));
  }
  const select = document.getElementById('studentSelect');
  if (!tbody) {
    console.warn('loadStudents: #studentTable tbody not found in DOM after retries; aborting render');
    return;
  }
  tbody.innerHTML = '';

  // Handle fetch errors (network down or Supabase errors)
  if (error || !Array.isArray(data)) {
    const isOffline = (typeof navigator !== 'undefined' && navigator && navigator.onLine === false);
    if (isOffline) {
      notify('Please connect to the network and try again.', 'error');
    } else {
      notify('Failed to load students. Please try again later.', 'error');
      console.error('loadStudents error', error);
    }
    return;
  }
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
  if (!tbody) {
    console.warn('showSelectedStudent: #studentTable tbody not found in DOM; aborting');
    return;
  }
  if (!select) {
    console.warn('showSelectedStudent: #studentSelect not found; aborting');
    return;
  }
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
  // NOTE: Supabase schema includes `class_teacher_class_main` and `class_teacher_subclass`.
  // We'll always send the split fields (main + subclass) to the DB. Do not send legacy combined field to avoid schema errors.
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
  // Prefer split hidden fields if present, fallback to legacy combined field
  let classTeacherClassValue = null;
  const mainFieldInForm = form.querySelector('[name="class_teacher_class_main"]');
  const subFieldInForm = form.querySelector('[name="class_teacher_subclass"]');
  if (mainFieldInForm && mainFieldInForm.value && mainFieldInForm.value.trim()) {
    const mainv = mainFieldInForm.value.trim();
    const subv = (subFieldInForm && subFieldInForm.value) ? subFieldInForm.value.trim() : '';
    if (mainv === 'JHS 3') classTeacherClassValue = 'JHS 3';
    else if (subv) classTeacherClassValue = mainv + ' ' + subv;
    else classTeacherClassValue = mainv;
  } else if (form.class_teacher_class && form.class_teacher_class.value && form.class_teacher_class.value.trim()) {
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
    denomination: form.denomination.value.trim(),
    home_town: form.home_town.value.trim(),
    classes: classesValue,
    subjects: subjectsValue,
    // Always include the new split columns (Supabase schema has them)
    class_teacher_class_main: (form.class_teacher_class_main && form.class_teacher_class_main.value) ? form.class_teacher_class_main.value.trim() : (classTeacherClassValue ? (classTeacherClassValue.split(/\s+/)[0] || null) : null),
    class_teacher_subclass: (function() {
      try {
        const raw = (form.class_teacher_subclass && form.class_teacher_subclass.value) ? form.class_teacher_subclass.value.trim() : '';
        const main = (form.class_teacher_class_main && form.class_teacher_class_main.value) ? form.class_teacher_class_main.value.trim() : (classTeacherClassValue ? (classTeacherClassValue.split(/\s+/)[0] || '') : '');
        if (main === 'JHS 3') return null;
        if (!raw || raw.length === 0) return null;
        return raw;
      } catch (e) { return null; }
    })(),
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
      // Ensure UI is unlocked so admin can retry
      try { form._saving = false; } catch (e) {}
      try { if (submitBtn) submitBtn.disabled = false; } catch (e) {}
      notify('Error: ' + (result.error && result.error.message ? result.error.message : String(result.error)), 'error');
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

  // Populate Class Teacher selects + hidden split/legacy fields
  try {
    const mainSel = form.querySelector('[name="main_class_select"]') || document.getElementById('main_class_select');
    const subSel = form.querySelector('[name="sub_class_select"]') || document.getElementById('sub_class_select');
    const hiddenLegacy = form.querySelector('[name="class_teacher_class"]');
    const hiddenMain = form.querySelector('[name="class_teacher_class_main"]');
    const hiddenSub = form.querySelector('[name="class_teacher_subclass"]');
    // Prefer split columns if present
    const mainVal = (data.class_teacher_class_main && data.class_teacher_class_main.toString().trim()) ? data.class_teacher_class_main.toString().trim() : null;
    const subVal = (data.class_teacher_subclass && data.class_teacher_subclass.toString().trim()) ? data.class_teacher_subclass.toString().trim() : null;
    if (mainVal) {
      if (mainSel) mainSel.value = mainVal;
      if (mainVal === 'JHS 3') {
        if (subSel) { subSel.classList.add('hidden-select'); subSel.required = false; subSel.value = ''; }
        if (hiddenMain) hiddenMain.value = 'JHS 3';
        if (hiddenSub) hiddenSub.value = '';
        if (hiddenLegacy) hiddenLegacy.value = 'JHS 3';
      } else {
        if (subSel) { subSel.classList.remove('hidden-select'); subSel.required = true; if (subVal) subSel.value = subVal; }
        if (hiddenMain) hiddenMain.value = mainVal;
        if (hiddenSub) hiddenSub.value = subVal || '';
        if (hiddenLegacy) hiddenLegacy.value = mainVal + (subVal ? (' ' + subVal) : '');
      }
    } else if (data.class_teacher_class && data.class_teacher_class.toString().trim()) {
      // Fallback: legacy combined field (e.g., "JHS 2 A")
      const combined = data.class_teacher_class.toString().trim();
      const m = combined.match(/^(.+?)\s+([A-Za-z0-9]+)$/);
      if (m) {
        const mval = m[1]; const sval = m[2];
        if (mainSel) mainSel.value = mval;
        if (subSel) { subSel.classList.remove('hidden-select'); subSel.required = true; subSel.value = sval; }
        if (hiddenMain) hiddenMain.value = mval;
        if (hiddenSub) hiddenSub.value = sval;
        if (hiddenLegacy) hiddenLegacy.value = combined;
      } else {
        // could be just main class
        if (mainSel) mainSel.value = combined;
        if (subSel) { subSel.classList.add('hidden-select'); subSel.required = false; subSel.value = ''; }
        if (hiddenMain) hiddenMain.value = combined;
        if (hiddenSub) hiddenSub.value = '';
        if (hiddenLegacy) hiddenLegacy.value = combined;
      }
    } else {
      // No class assignment
      if (mainSel) mainSel.value = '';
      if (subSel) { subSel.classList.add('hidden-select'); subSel.required = false; subSel.value = ''; }
      if (hiddenLegacy) hiddenLegacy.value = '';
      if (hiddenMain) hiddenMain.value = '';
      if (hiddenSub) hiddenSub.value = '';
    }
  } catch (e) { /* non-fatal */ }

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
// 🔄 Initial Load (deferred until DOM is ready)
function _nsuta_initialLoad() {
  try { if (typeof loadStudents === 'function') loadStudents(); } catch (e) { console.warn('initialLoad: loadStudents failed', e); }
  try { if (typeof loadTeachers === 'function') loadTeachers(); } catch (e) { console.warn('initialLoad: loadTeachers failed', e); }
  try { if (typeof loadAdmins === 'function') loadAdmins(); } catch (e) { console.warn('initialLoad: loadAdmins failed', e); }
  // Start live breakdowns (default: push)
  try { initLiveBreakdowns('push', 9000); } catch (e) { /* ignore if init not available */ }
  // Populate the Last Attendance tile on initial load
  try { updateLastAttendanceTile().catch(() => {}); } catch (e) {}
  // Wire the Last Attendance tile click handler
  try { wireLastAttendanceUI(); } catch (e) {}
  // Initialize header slideshow (random gallery pictures)
  try { if (typeof setupHeaderSlideshow === 'function') setupHeaderSlideshow(8); } catch (e) { console.warn('initialLoad: setupHeaderSlideshow failed', e); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _nsuta_initialLoad);
else _nsuta_initialLoad();

// Wire gallery UI after initial load
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireGalleryUI);
else wireGalleryUI();

// -------------------------------
// Header slideshow: random gallery image carousel in the top header
// -------------------------------
window._nsuta_headerSlideshow = window._nsuta_headerSlideshow || { timer: null, index: 0, items: [] };

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function setupHeaderSlideshow(limit = 8) {
  try {
    const container = document.getElementById('headerSlideshow');
    const slidesEl = document.getElementById('hsSlides');
    const prevBtn = document.getElementById('hsPrev');
    const nextBtn = document.getElementById('hsNext');
    if (!container || !slidesEl) return;
    // fetch recent gallery rows (include thumbnails) — try to select thumbnail fields, fall back if schema lacks them
    let data = null; let error = null;
    try {
      const res = await supabaseClient.from('gallery').select('id,title,thumbnail_url,public_url,path').order('created_at', { ascending: false }).limit(limit*2);
      data = res.data; error = res.error;
    } catch (e) { error = e; }
    if (error || !data || !data.length) {
      // fallback to select all columns if possible
      try {
        const res2 = await supabaseClient.from('gallery').select('*').order('created_at', { ascending: false }).limit(limit*2);
        data = res2.data; error = res2.error;
      } catch (e2) { error = e2; }
    }
    if (error || !data || !data.length) {
      container.style.display = 'none';
      return;
    }
    const items = shuffleArray((data || []).slice(0, limit));
    window._nsuta_headerSlideshow.items = items;
    // clear existing
    slidesEl.innerHTML = '';
    items.forEach((it, idx) => {
      const slide = document.createElement('div');
      slide.className = 'hs-slide' + (idx === 0 ? ' active' : '');
      const img = document.createElement('img');
      img.src = it.thumbnail_url || it.public_url || it.path || '';
      img.alt = it.title || 'School picture';
      img.loading = 'lazy';
      slide.appendChild(img);
      // click opens original
      slide.addEventListener('click', () => {
        const url = it.public_url || it.path || img.src;
        if (url) window.open(url, '_blank');
      });
      slidesEl.appendChild(slide);
    });
  // show container (use explicit block to override CSS default of display:none)
  container.style.display = 'block';
    // controls
    if (prevBtn && nextBtn) {
      prevBtn.onclick = (e) => { e.preventDefault(); headerPrev(); };
      nextBtn.onclick = (e) => { e.preventDefault(); headerNext(); };
    }
    // pause on hover
    container.onmouseenter = () => stopHeaderTimer();
    container.onmouseleave = () => startHeaderTimer(5000);
    // start autoplay
    startHeaderTimer(5000);
  } catch (e) {
    console.warn('setupHeaderSlideshow failed', e);
  }
}

function startHeaderTimer(ms = 5000) {
  try {
    stopHeaderTimer();
    window._nsuta_headerSlideshow.timer = setInterval(() => { headerNext(); }, ms);
  } catch (e) { /* ignore */ }
}

function stopHeaderTimer() {
  try { if (window._nsuta_headerSlideshow.timer) { clearInterval(window._nsuta_headerSlideshow.timer); window._nsuta_headerSlideshow.timer = null; } } catch (e) {}
}

function headerNext() {
  try {
    const slides = document.querySelectorAll('#hsSlides .hs-slide');
    if (!slides || !slides.length) return;
    const cur = Array.from(slides).findIndex(s => s.classList.contains('active'));
    const next = (cur + 1) % slides.length;
    slides[cur].classList.remove('active');
    slides[next].classList.add('active');
  } catch (e) { console.warn(e); }
}

function headerPrev() {
  try {
    const slides = document.querySelectorAll('#hsSlides .hs-slide');
    if (!slides || !slides.length) return;
    const cur = Array.from(slides).findIndex(s => s.classList.contains('active'));
    const prev = (cur - 1 + slides.length) % slides.length;
    slides[cur].classList.remove('active');
    slides[prev].classList.add('active');
  } catch (e) { console.warn(e); }
}

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
          // include gender so breakdowns can compute M/F counts
          supabaseClient.from('students').select('class,subclass,gender'),
          supabaseClient.from('teachers').select('responsibility,subjects')
        ]);
        // Students: count by main class, subclass and gender breakdown
        if (studentRows && Array.isArray(studentRows)) {
          const classMap = {};
          studentRows.forEach(s => {
            const main = (s.class || '').toString().trim();
            const sub = (s.subclass || '').toString().trim();
            const gender = (s.gender || '').toString().trim();
            if (!main) return;
            classMap[main] = classMap[main] || { total: 0, subs: {}, genders: { Male: 0, Female: 0, Other: 0 } };
            classMap[main].total += 1;
            if (sub) {
              classMap[main].subs[sub] = (classMap[main].subs[sub] || 0) + 1;
            }
            // normalize gender counts
            const _g = normalizeGender(gender);
            if (_g === 'Male') classMap[main].genders.Male++;
            else if (_g === 'Female') classMap[main].genders.Female++;
            else if (_g === 'Other') classMap[main].genders.Other++;
          });
          const parts = Object.keys(classMap).sort().map(k => {
            const entry = classMap[k];
            const subs = Object.keys(entry.subs).map(sk => `${sk}: ${entry.subs[sk]}`).join(', ');
            const g = entry.genders || { Male: 0, Female: 0, Other: 0 };
            const genderStr = `Male: ${g.Male} Female: ${g.Female}${g.Other ? ' Other: ' + g.Other : ''}`;
            return `${k}: ${entry.total} (${genderStr})${subs ? ' — ' + subs : ''}`;
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

  // ------------------
  // Top students (JHS 1 & JHS 2)
  // ------------------
  // Aggregate students' total marks from the `results` table (sum of class_score + exam_score per subject)
  // Optionally filter by term and year if provided via DOM controls (termFilter/yearFilter).
  async function fetchTopStudentsByResults(classes = ['JHS 1', 'JHS 2']) {
    try {
      // Determine term/year filters if present in the page
      const termEl = document.getElementById('termFilter');
      const yearEl = document.getElementById('yearFilter');
      const term = termEl && termEl.value ? termEl.value : null;
      const year = yearEl && yearEl.value ? yearEl.value : null;

      // Build query for results. We'll select student_id, class (if present), subject, class_score, exam_score
      let query = supabaseClient.from('results').select('student_id,subject,class_score,exam_score,term,year');
      if (term) query = query.eq('term', term);
      if (year) query = query.eq('year', year);
      // Limit to a reasonable ceiling to protect client memory; most deployments will be small.
      const { data: resultRows, error: resErr } = await query.limit(5000);
      if (resErr || !resultRows || !resultRows.length) return null;

      // Compute accumulated score per student
      const totals = {};
      const studentClassMap = {};
      resultRows.forEach(r => {
        if (!r || !r.student_id) return;
        const n = (Number(r.class_score) || 0) + (Number(r.exam_score) || 0);
        totals[r.student_id] = (totals[r.student_id] || 0) + n;
        // If results table stores class per-row, capture it to avoid extra lookups
        if (r.class) studentClassMap[r.student_id] = (r.class || '').toString().trim();
      });

      const studentIds = Object.keys(totals);
      if (!studentIds.length) return null;

      // Fetch student details (name/register/class as fallback)
      const { data: students } = await supabaseClient.from('students').select('id,first_name,surname,class,register_id').in('id', studentIds).limit(2000);
      if (!students || !students.length) return null;

      const byClass = {};
      students.forEach(s => {
        const main = (s.class || studentClassMap[s.id] || '').toString().trim();
        if (!classes.includes(main)) return;
        const score = totals[s.id] || 0;
        if (!byClass[main] || score > byClass[main].score) {
          byClass[main] = { student: s, score };
        }
      });
      return byClass;
    } catch (e) {
      console.warn('fetchTopStudentsByResults failed', e);
      return null;
    }
  }

  async function populateTopStudentsTile() {
    try {
      const el = document.getElementById('kpiTopStudents');
      if (!el) return;
      // Show loading placeholder
      el.textContent = 'Loading…';
      // Try results-based computation first
      const byClass = await fetchTopStudentsByResults(['JHS 1', 'JHS 2']);
      if (!byClass) {
        el.textContent = 'No results';
        return;
      }
      const j1 = byClass['JHS 1'] ? `${byClass['JHS 1'].student.first_name || ''} ${byClass['JHS 1'].student.surname || ''}`.trim() + ` (${byClass['JHS 1'].score})` : '—';
      const j2 = byClass['JHS 2'] ? `${byClass['JHS 2'].student.first_name || ''} ${byClass['JHS 2'].student.surname || ''}`.trim() + ` (${byClass['JHS 2'].score})` : '—';
      el.textContent = `J1: ${j1} • J2: ${j2}`;
    } catch (e) { console.warn('populateTopStudentsTile failed', e); }
  }

  // Populate modal content when opened
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action="modal:topStudentsModal"]');
    if (!el) return;
    // Fill modal content before open
    (async function() {
      const content = document.getElementById('topStudentsContent');
      if (!content) return;
      content.textContent = 'Loading top students…';
      const byClass = await fetchTopStudentsByResults(['JHS 1', 'JHS 2']);
      if (!byClass) {
        content.innerHTML = '<div class="muted-small">No results available. Ensure a `results` table exists with student_id and total_score columns.</div>';
        return;
      }
      const rows = [];
      ['JHS 1', 'JHS 2'].forEach(cls => {
        const info = byClass[cls];
        if (info && info.student) {
          rows.push(`<div><strong>${cls}</strong>: ${info.student.first_name || ''} ${info.student.surname || ''} — ${info.student.register_id || ''} — Score: ${info.score}</div>`);
        } else {
          rows.push(`<div><strong>${cls}</strong>: —</div>`);
        }
      });
      content.innerHTML = rows.join('\n');
    })();
  });

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
          // Query supabase for matches across several columns (expand fields and allow larger result sets)
          const safe = qtrim.replace(/%/g, '').replace(/'/g, "");
          const filter = `%${safe}%`;
          // Include additional searchable fields: parent_name, area, class
          // Increase limit to return many matches (adjust as needed for performance)
          const { data, error } = await supabaseClient.from('students')
            .select('*')
            .or(
              `first_name.ilike.${filter},surname.ilike.${filter},username.ilike.${filter},register_id.ilike.${filter},parent_name.ilike.${filter},area.ilike.${filter},class.ilike.${filter}`
            )
            .limit(1000);
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
      // include gender for live breakdown gender counts
      supabaseClient.from('students').select('class,subclass,gender'),
      supabaseClient.from('teachers').select('responsibility,subjects'),
      supabaseClient.from('admins').select('email')
    ]);
    // Build student class + subclass breakdown and an overall gender summary
    const studentClassMap = {}; // { 'JHS 1': { total: n, subs: { A: n, B: n } } }
    // Debug: log raw gender values early so we can see what's stored in the DB
    try {
      if (studentRows && Array.isArray(studentRows)) {
        const rawGenderCounts = {};
        studentRows.forEach(s => {
          const key = (s.gender === null || s.gender === undefined) ? '__NULL__' : String(s.gender);
          rawGenderCounts[key] = (rawGenderCounts[key] || 0) + 1;
        });
        console.debug('[debug] raw student gender values:', rawGenderCounts);
        console.debug('[debug] student gender sample (first 8 rows):', studentRows.slice(0,8).map(r => ({ id: r.id, gender: r.gender })));
      }
    } catch (e) { /* ignore debug failures */ }
    const genderMap = { Male: 0, Female: 0, Other: 0 };
    if (studentRows && Array.isArray(studentRows)) {
      studentRows.forEach(s => {
        const main = (s.class || '').toString().trim();
        const sub = (s.subclass || '').toString().trim();
        const gender = s.gender;
        const norm = normalizeGender(gender);
        if (!main) {
          // still count gender into overall map
          if (norm === 'Male') genderMap.Male++;
          else if (norm === 'Female') genderMap.Female++;
          else if (norm === 'Other') genderMap.Other++;
          return;
        }
        studentClassMap[main] = studentClassMap[main] || { total: 0, subs: {}, genders: { Male: 0, Female: 0, Other: 0 } };
        studentClassMap[main].total += 1;
        if (sub) {
          studentClassMap[main].subs[sub] = (studentClassMap[main].subs[sub] || 0) + 1;
        }
        if (norm === 'Male') studentClassMap[main].genders.Male++;
        else if (norm === 'Female') studentClassMap[main].genders.Female++;
        else if (norm === 'Other') studentClassMap[main].genders.Other++;
      });
    }
    const studentItems = Object.keys(studentClassMap).sort().map(k => {
      const entry = studentClassMap[k];
      const subs = Object.keys(entry.subs).sort().map(sk => `${sk}: ${entry.subs[sk]}`).join(', ');
  const g = entry.genders || { Male: 0, Female: 0, Other: 0 };
  const genderSubtitle = `Male: ${g.Male} Female: ${g.Female}${g.Other ? ' • Other: ' + g.Other : ''}`;
      const subtitleParts = [];
      if (subs) subtitleParts.push(subs);
      subtitleParts.push(genderSubtitle);
      return { title: `${k}: ${entry.total}`, subtitle: subtitleParts.join(' • ') };
    });
    // add an overall gender summary as one of the items (helps admins quickly see gender split)
    const genderParts = [];
  if (genderMap.Male) genderParts.push(`Male: ${genderMap.Male}`);
  if (genderMap.Female) genderParts.push(`Female: ${genderMap.Female}`);
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

  // ------------------
  // Class ranking: compute ranking for a selected class/term/year and generate printable PDF
  // ------------------
  async function populateRankingClassSelect() {
    try {
      // Get distinct classes from students table
      const { data: classes, error } = await supabaseClient.from('students').select('class').neq('class', null);
      const sel = document.getElementById('rankingClassSelect');
      if (!sel) return;
      sel.innerHTML = '<option value="">-- Select Class --</option>';
      if (error || !classes) return;
      const uniq = [...new Set(classes.map(c => c.class))].filter(Boolean).sort();
      uniq.forEach(c => {
        const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt);
      });
      // If there's a subclass select, clear it
      const subSel = document.getElementById('rankingSubclassSelect');
      const subWrap = document.getElementById('rankingSubclassWrapper');
      if (subSel) {
        subSel.innerHTML = '<option value="">-- All Subclasses --</option>';
        subSel.disabled = true;
      }
      if (subWrap) subWrap.classList.add('hidden-select');
    } catch (e) { console.warn('populateRankingClassSelect failed', e); }
  }

  // Populate subclass select when a class is chosen
  async function populateRankingSubclassSelect(cls) {
    const subSel = document.getElementById('rankingSubclassSelect');
    if (!subSel) return;
  subSel.innerHTML = '<option value="">-- All Subclasses --</option>';
  const subWrap = document.getElementById('rankingSubclassWrapper');
  if (!cls) { subSel.disabled = true; if (subWrap) subWrap.classList.add('hidden-select'); return; }
    try {
      const { data, error } = await supabaseClient.from('students').select('subclass').eq('class', cls).neq('subclass', null);
      if (error || !data) { subSel.disabled = true; return; }
      const uniq = [...new Set(data.map(d=>d.subclass))].filter(Boolean).sort();
      uniq.forEach(s => { const opt = document.createElement('option'); opt.value = s; opt.textContent = s; subSel.appendChild(opt); });
  subSel.disabled = false;
  if (subWrap) subWrap.classList.remove('hidden-select');
    } catch (e) { console.warn('populateRankingSubclassSelect failed', e); subSel.disabled = true; }
  }

  async function computeClassRanking(cls, term, year, subclass) {
    // Fetch students in class (and optional subclass)
    let q = supabaseClient.from('students').select('id,first_name,surname,register_id').eq('class', cls);
    if (subclass) q = q.eq('subclass', subclass);
    const { data: students, error: studErr } = await q;
    if (studErr || !Array.isArray(students) || students.length === 0) return { error: 'No students in class' };
    const ids = students.map(s => s.id);
    // Fetch results for these students for given term/year
  let query = supabaseClient.from('results').select('student_id,class_score,exam_score').in('student_id', ids);
    if (term) query = query.eq('term', term);
    if (year) query = query.eq('year', year);
    const { data: rows, error: resErr } = await query;
    if (resErr) return { error: resErr.message || String(resErr) };
    // Sum totals per student
    const totals = {};
    rows.forEach(r => {
      if (!r || !r.student_id) return;
      totals[r.student_id] = (totals[r.student_id] || 0) + (Number(r.class_score) || 0) + (Number(r.exam_score) || 0);
    });
    // Build ranking array
    const ranking = students.map(s => ({ id: s.id, name: ((s.first_name||'') + ' ' + (s.surname||'')).trim(), register_id: s.register_id || '', score: totals[s.id] || 0 }));
    ranking.sort((a,b)=> b.score - a.score);
    // Assign positions with handling ties
    let pos = 0, lastScore = null, displayPos = 0;
    ranking.forEach((r, idx) => {
      pos = idx + 1;
      if (lastScore === null || r.score !== lastScore) displayPos = pos;
      r.position = displayPos;
      lastScore = r.score;
    });
    return { ranking };
  }

  function renderRankingPrintable(cls, term, year, ranking, subclass) {
    const parts = [`${cls}`];
    if (subclass) parts.push(`Subclass: ${subclass}`);
    if (term) parts.push(term);
    if (year) parts.push(year);
    const title = `Class Ranking — ${parts.join(' / ')}`.trim();
    const header = `<div style="text-align:center;margin-bottom:12px;"><h2>${title}</h2></div>`;
    // Render columns: Student Name | Total Marks | Position in Class
    const tableRows = ranking.map(r => `<tr><td style="border:1px solid #ddd;padding:6px">${escapeHtml(r.name)}</td><td style="border:1px solid #ddd;padding:6px;text-align:right">${Number(r.score).toFixed(0)}</td><td style="border:1px solid #ddd;padding:6px;text-align:center">${r.position}</td></tr>`).join('');
    const html = `
      <div id="classRankingPrintContainer">
        ${header}
        <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;margin-bottom:12px;">
          <thead><tr><th style="border:1px solid #ddd;padding:6px;text-align:left">Student</th><th style="border:1px solid #ddd;padding:6px;text-align:right">Total Marks</th><th style="border:1px solid #ddd;padding:6px;text-align:center">Position in Class</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div style="font-size:12px;color:#666;">Generated: ${new Date().toLocaleString()}</div>
      </div>
    `;
    return html;
  }

  // small helper to avoid HTML injection in print output
  function escapeHtml(str){
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m]; });
  }

  async function generateClassRankingPDF() {
    const cls = (document.getElementById('rankingClassSelect') || {}).value;
    const term = (document.getElementById('rankingTermSelect') || {}).value;
    const year = (document.getElementById('rankingYearInput') || {}).value;
    const subclass = (document.getElementById('rankingSubclassSelect') || {}).value;
    const preview = document.getElementById('classRankingPreview');
    if (!cls) { notify('Please select a class.', 'warning'); return; }
    if (preview) preview.textContent = 'Computing ranking…';
    const res = await computeClassRanking(cls, term, year, subclass);
    if (res.error) { notify('Failed to compute ranking: ' + res.error, 'error'); if (preview) preview.textContent = 'Failed to compute ranking.'; return; }
    const html = renderRankingPrintable(cls, term, year, res.ranking, subclass);
    // Create a hidden print container, populate and call print
    let printContainer = document.getElementById('classRankingPrintOutput');
    if (printContainer) printContainer.remove();
    printContainer = document.createElement('div');
    printContainer.id = 'classRankingPrintOutput';
    printContainer.style.display = 'none';
    printContainer.innerHTML = html;
    document.body.appendChild(printContainer);
    // Inject a print stylesheet for the container
    const styleId = 'class-ranking-print-style';
    let ps = document.getElementById(styleId);
    if (ps) ps.remove();
    ps = document.createElement('style'); ps.id = styleId;
    ps.textContent = `@media print { 
      @page { margin: 10mm; }
      html, body { height: auto !important; }
      body * { visibility: hidden !important; }
      #classRankingPrintOutput, #classRankingPrintOutput * { visibility: visible !important; }
      #classRankingPrintOutput { position: absolute; left: 0; top: 0; width: 100%; padding: 6mm; box-sizing: border-box; }
      #classRankingPrintOutput table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; font-size: 12px; }
      #classRankingPrintOutput th, #classRankingPrintOutput td { white-space: nowrap !important; overflow: visible !important; padding: 6px !important; border:1px solid #ddd !important; }
      /* Keep the three main columns on the same row when possible */
      #classRankingPrintOutput thead th { font-weight: 700; }
    }`;
    document.head.appendChild(ps);
    // Show container then print
    printContainer.style.display = 'block';
    window.print();
    // Cleanup after print
    setTimeout(()=>{ try { printContainer.remove(); ps.remove(); } catch(e){} }, 1000);
  }

  // Wire modal open to populate class select and preview
  document.addEventListener('click', function(e){
    const el = e.target.closest('[data-action="modal:classRankingModal"]');
    if (!el) return;
    // populate select
    populateRankingClassSelect();
    const preview = document.getElementById('classRankingPreview'); if (preview) preview.textContent = 'Select class, term and year then click Generate.';
  });

  // When class select changes, populate subclass select (if present)
  document.addEventListener('change', function(e){
    const sel = e.target.closest('#rankingClassSelect');
    if (!sel) return;
    populateRankingSubclassSelect(sel.value);
  });

  // Wire generate button
  document.addEventListener('click', function(e){
    const btn = e.target.closest('#generateClassRankingBtn');
    if (!btn) return;
    e.preventDefault();
    generateClassRankingPDF();
  });