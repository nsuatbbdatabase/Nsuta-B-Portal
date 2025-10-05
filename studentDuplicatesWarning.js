// Detect and display duplicate students by username or name+class
// Shows a warning and a list of duplicates in the student section

async function renderDuplicateStudentsWarning() {
  const container = document.getElementById('studentDuplicatesWarning');
  if (!container) return;
  const { data: students, error } = await supabaseClient.from('students').select('id, first_name, surname, class, username');
  if (error) {
    container.innerHTML = '<div class="error">Failed to load students for duplicate check.</div>';
    return;
  }
  // Find duplicates by username and by (first_name+surname+class)
  const seenUsernames = {}, seenNameClass = {}, duplicates = [];
  students.forEach(s => {
    const uname = (s.username || '').toLowerCase();
    const nameClass = ((s.first_name || '') + ' ' + (s.surname || '') + '|' + (s.class || '')).toLowerCase();
    if (uname && seenUsernames[uname]) {
      duplicates.push(s);
    } else if (uname) {
      seenUsernames[uname] = true;
    }
    if (nameClass && seenNameClass[nameClass]) {
      duplicates.push(s);
    } else if (nameClass) {
      seenNameClass[nameClass] = true;
    }
  });
  if (duplicates.length === 0) {
    container.innerHTML = '';
    return;
  }
  // Show warning and list
  let html = `<div class="student-duplicates-warning">
    <strong>Warning:</strong> ${duplicates.length} possible duplicate students found.<br>
    <span class="student-duplicates-toggle" onclick="this.nextElementSibling.classList.toggle('hidden')">Show/Hide List</span>
    <div class="student-duplicates-list hidden">`;
  html += '<ul>' + duplicates.map(s =>
    `<li>${(s.first_name || '')} ${(s.surname || '')} (${s.class || ''}) <span class="dup-username">[${s.username || ''}]</span> <button onclick="deleteStudent('${s.id}')">Delete</button></li>`
  ).join('') + '</ul></div></div>';
  container.innerHTML = html;
}
// Call this after DOMContentLoaded
// renderDuplicateStudentsWarning();
