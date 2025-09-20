// --------------------
// Data model and utils
// --------------------
const STORAGE_KEY = 'student_app_demo_v1';

// Default demo data (used first-time)
const demo = {
  users: [
    {id: uid(), name: 'Teacher A', email: 't@example.com', role: 'teacher', pass: '123'},
    {id: uid(), name: 'Student S', email: 's@example.com', role: 'student', pass: '123'}
  ],
  classes: [
    {id: 'c1', title: 'Class 1', addedBy: 'Teacher A'},
    {id: 'c2', title: 'Class 5', addedBy: 'Teacher A'}
  ],
  studentsByClass: {
    'c1': [{id: uid(), name:'Alice'}, {id: uid(), name:'Bob'}],
    'c2': [{id: uid(), name:'Ravi'}, {id: uid(), name:'Mira'}]
  },
  attendance: {
    // attendance[classId][dateYYYYMMDD] = {studentId: true/false}
  },
  videos: [], // {id, title, uploader, blobUrl, createdAt}
  homeworks: [], // {id, title, desc, relatedVideoId, uploader, createdAt}
  marks: [] // {id, exam, studentName, marks, uploader, createdAt}
};

function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9); }

function loadStore(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(demo)); return JSON.parse(JSON.stringify(demo)); }
  return JSON.parse(raw);
}
function saveStore(store){ localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); }

let store = loadStore();
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

// --------------------
// DOM refs
// --------------------
const authModal = document.getElementById('auth-modal');
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const classSelect = document.getElementById('class-select');
const notifBell = document.getElementById('notif-bell');
const notifCount = document.getElementById('notif-count');
const notificationsList = document.getElementById('notifications-list');

const sections = ['classes','attendance','exams','homework','videos','notifications'];
const selected = { classId: null, date: null, monthOffset:0 };

// calendar helpers
const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatYmd(date){ const y = date.getFullYear(); const m = String(date.getMonth()+1).padStart(2,'0'); const d = String(date.getDate()).padStart(2,'0'); return `${y}${m}${d}`; }
function prettyDate(ymd){ return `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`; }

// --------------------
// Initialization
// --------------------
function init(){
  renderAuth();
  renderClassSelect();
  setupAuthHandlers();
  renderAllSections();
  setupCalendarControls();
  updateNotifIcon();
  if(currentUser) onLogin(currentUser);
  showSection('classes');
}
init();

// --------------------
// AUTH: signup & login
// --------------------
function renderAuth(){
  document.getElementById('tab-signup').onclick = ()=>{ document.getElementById('signup-form').classList.remove('hidden'); document.getElementById('login-form').classList.add('hidden'); document.getElementById('tab-signup').classList.add('active'); document.getElementById('tab-login').classList.remove('active');}
  document.getElementById('tab-login').onclick = ()=>{ document.getElementById('signup-form').classList.add('hidden'); document.getElementById('login-form').classList.remove('hidden'); document.getElementById('tab-signup').classList.remove('active'); document.getElementById('tab-login').classList.add('active');}
}
function setupAuthHandlers(){
  // Signup
  signupForm.querySelector('button').onclick = () => {
    const role = document.getElementById('signup-role').value;
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value;
    if(!name||!email||!pass){ alert('Fill fields'); return; }
    const u = {id: uid('u'), name, email, role, pass};
    store.users.push(u); saveStore(store);
    alert('Signed up. Now login.');
    document.getElementById('signup-name').value=''; document.getElementById('signup-email').value=''; document.getElementById('signup-password').value='';
    document.getElementById('tab-login').click();
  };

  // Login
  loginForm.querySelector('button').onclick = () => {
    const role = document.getElementById('login-role').value;
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value;
    const u = store.users.find(x => x.email===email && x.pass===pass && x.role===role);
    if(!u){ alert('Invalid credentials'); return; }
    currentUser = u;
    localStorage.setItem('currentUser', JSON.stringify(u));
    authModal.style.display='none';
    onLogin(u);
  };
}

// Called when user logs in
function onLogin(user){
  document.getElementById('user-info').textContent = `${user.name} (${user.role})`;
  document.getElementById('logout').style.display = 'inline-block';
  enableTeacherUI(user.role==='teacher');
  renderClassSelect();
  renderAllSections();
}

// logout
document.getElementById('logout').onclick = ()=>{
  currentUser = null;
  localStorage.removeItem('currentUser');
  document.getElementById('user-info').textContent = 'Not logged';
  document.getElementById('logout').style.display = 'none';
  enableTeacherUI(false);
  authModal.style.display='flex';
};

// enable/disable teacher-only UI
function enableTeacherUI(isTeacher){
  document.querySelectorAll('.card-form.hidden, .card-form').forEach(el=>{
    // show teacher areas: those with class "hidden" by default are teacher-only
  });
  // toggle visible controls:
  document.getElementById('class-upload').classList.toggle('hidden', !isTeacher);
  document.getElementById('marks-upload').classList.toggle('hidden', !isTeacher);
  document.getElementById('homework-upload').classList.toggle('hidden', !isTeacher);
  document.getElementById('video-upload').classList.toggle('hidden', !isTeacher);
  document.getElementById('add-student').style.display = isTeacher ? 'inline-block' : 'none';
  document.getElementById('save-attendance').style.display = isTeacher ? 'inline-block' : 'none';
}

// --------------------
// CLASSES
// --------------------
function renderClassSelect(){
  const sel = classSelect;
  sel.innerHTML = '<option value="">Select Class</option>';
  store.classes.forEach(c=>{
    const opt = document.createElement('option'); opt.value=c.id; opt.textContent=c.title; sel.appendChild(opt);
  });
  sel.onchange = ()=>{
    selected.classId = sel.value || null;
    document.getElementById('attendance-class-name').textContent = sel.options[sel.selectedIndex]?.text || '—';
    renderAttendanceStudents();
    renderAllSections();
  };
}

// add class
function addClass(){
  const title = document.getElementById('class-title').value.trim();
  if(!title) return alert('Enter class title');
  const addedBy = currentUser?.name || 'Unknown';
  const c = {id: uid('c'), title, addedBy};
  store.classes.push(c);
  store.studentsByClass[c.id] = [];
  saveStore(store);
  renderClassSelect();
  renderClassesList();
  addNotification(`Class added: ${title}`, 'classes');
  document.getElementById('class-title').value='';
}

// show classes list
function renderClassesList(){
  const container = document.getElementById('class-list');
  container.innerHTML = '';
  store.classes.forEach(c=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<strong>${c.title}</strong><div class="meta">Added by: ${c.addedBy}</div>`;
    if(currentUser && currentUser.role==='teacher'){
      const del = document.createElement('button'); del.className='action-btn'; del.textContent='Delete'; del.onclick=()=>{ if(confirm('Delete class?')){ deleteClass(c.id);} };
      card.appendChild(del);
    }
    container.appendChild(card);
  });
}
function deleteClass(id){
  store.classes = store.classes.filter(s=>s.id!==id);
  delete store.studentsByClass[id];
  delete store.attendance?.[id];
  saveStore(store);
  renderClassSelect(); renderClassesList(); addNotification('Class deleted', 'classes');
}

// --------------------
// ATTENDANCE & STUDENTS
// --------------------
function renderAttendanceStudents(){
  const tbody = document.getElementById('attendance-body');
  tbody.innerHTML = '';
  if(!selected.classId) return;
  const students = store.studentsByClass[selected.classId] || [];
  students.forEach(s=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input value="${escapeHtml(s.name)}" data-id="${s.id}" class="student-name" /></td>
                    <td><input type="checkbox" data-id="${s.id}" class="student-present" /></td>
                    <td><button class="action-btn" onclick="removeStudent('${s.id}')">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  // wire editing student names
  tbody.querySelectorAll('.student-name').forEach(inp=>{
    inp.onchange = (e)=>{ const id = inp.dataset.id; const st = store.studentsByClass[selected.classId].find(x=>x.id===id); if(st){ st.name = inp.value; saveStore(store); } };
  });
  // load attendance state for selected date
  loadAttendanceForSelectedDate();
}
function addStudent(){
  if(!selected.classId) return alert('Select a class first');
  const name = document.getElementById('new-student-name').value.trim();
  if(!name) return alert('Enter student name');
  const s = {id: uid('s'), name};
  store.studentsByClass[selected.classId].push(s);
  saveStore(store);
  renderAttendanceStudents();
  document.getElementById('new-student-name').value = '';
  addNotification(`Student added: ${name}`, 'attendance');
}
function removeStudent(studentId){
  if(!selected.classId) return;
  store.studentsByClass[selected.classId] = (store.studentsByClass[selected.classId]||[]).filter(s=>s.id!==studentId);
  // also remove their attendance entries
  const att = store.attendance[selected.classId] || {};
  for(const dateKey in att){ if(att[dateKey] && att[dateKey][studentId]!==undefined){ delete att[dateKey][studentId]; } }
  saveStore(store);
  renderAttendanceStudents();
  addNotification('Student removed','attendance');
}

// Attendance per date
function saveAttendance(){
  if(!selected.classId || !selected.date) return alert('Select class & date (click a date)');
  const dateKey = selected.date;
  const students = store.studentsByClass[selected.classId] || [];
  if(!store.attendance[selected.classId]) store.attendance[selected.classId] = {};
  const rec = {};
  document.querySelectorAll('#attendance-body .student-present').forEach(cb=>{
    const id = cb.dataset.id; rec[id] = cb.checked;
  });
  store.attendance[selected.classId][dateKey] = rec;
  saveStore(store);
  addNotification(`Attendance saved for ${prettyDate(dateKey)} (${getClassTitle(selected.classId)}) by ${currentUser?.name||'Unknown'}`, 'attendance');
  alert('Attendance saved');
}
function loadAttendanceForSelectedDate(){
  if(!selected.classId) return;
  const dateKey = selected.date;
  document.getElementById('selected-date-display').textContent = dateKey ? prettyDate(dateKey) : 'None';
  const rec = store.attendance?.[selected.classId]?.[dateKey] || {};
  document.querySelectorAll('#attendance-body .student-present').forEach(cb=>{
    cb.checked = !!rec[cb.dataset.id];
  });
}

// --------------------
// CALENDAR grid
// --------------------
const calendarGridEl = document.getElementById('calendar-grid');
const selectedDateDisplay = document.getElementById('selected-date-display');

function setupCalendarControls(){
  document.getElementById('prev-month').onclick = ()=>{ selected.monthOffset--; renderCalendar(); };
  document.getElementById('next-month').onclick = ()=>{ selected.monthOffset++; renderCalendar(); };
  renderCalendar();
}

function renderCalendar(){
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + selected.monthOffset, 1);
  const year = d.getFullYear(), month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0..6
  const daysInMonth = new Date(year, month+1, 0).getDate();

  // header
  if(!calendarGridEl) return;
  calendarGridEl.innerHTML = `<div class="month"><strong>${monthNames[month]} ${year}</strong></div>`;

  // grid header
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let html = '<div class="calendar-grid">';
  days.forEach(dn => html += `<div class="calendar-cell" style="font-weight:600; background:transparent">${dn}</div>`);

  // blank cells
  for(let i=0;i<firstDay;i++) html += `<div class="calendar-cell" style="background:transparent"></div>`;

  for(let day=1; day<=daysInMonth; day++){
    const cellDate = new Date(year, month, day);
    const ymd = formatYmd(cellDate);
    const isToday = formatYmd(new Date()) === ymd && selected.monthOffset===0;
    const selectedClassHas = selected.classId && !!(store.attendance[selected.classId] && store.attendance[selected.classId][ymd]);
    html += `<div class="calendar-cell ${isToday? 'today':''} ${selected.date===ymd ? 'selected':''}" data-ymd="${ymd}">
               <div>${day}</div>
               <div style="font-size:11px; color:var(--muted)">${selectedClassHas? '●':' '}</div>
             </div>`;
  }
  html += '</div>';
  calendarGridEl.innerHTML = html;

  // attach handlers
  calendarGridEl.querySelectorAll('.calendar-cell[data-ymd]').forEach(cell=>{
    cell.onclick = ()=>{
      selected.date = cell.dataset.ymd;
      // highlight selected
      calendarGridEl.querySelectorAll('.calendar-cell').forEach(c=>c.classList.remove('selected'));
      cell.classList.add('selected');
      loadAttendanceForSelectedDate();
    };
  });
}

// --------------------
// MARKS (CRUD + uploader name)
// --------------------
function renderMarks(){
  const container = document.getElementById('marks-list'); container.innerHTML='';
  store.marks.forEach(m=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<strong>${escapeHtml(m.exam)}</strong>
                      <div class="meta">Student: ${escapeHtml(m.studentName)} — Marks: ${m.marks} — by ${escapeHtml(m.uploader)} (${new Date(m.createdAt).toLocaleString()})</div>`;
    if(currentUser?.role==='teacher'){
      const edit = document.createElement('button'); edit.className='action-btn'; edit.textContent='Edit'; edit.onclick=()=>editMark(m.id);
      const del = document.createElement('button'); del.className='action-btn'; del.textContent='Delete'; del.onclick=()=>{ if(confirm('Delete?')){ store.marks = store.marks.filter(x=>x.id!==m.id); saveStore(store); renderMarks(); addNotification('Mark deleted','exams'); } };
      card.appendChild(edit); card.appendChild(del);
    }
    container.appendChild(card);
  });
}
function uploadMark(){
  const exam = document.getElementById('mark-exam').value.trim();
  const studentName = document.getElementById('mark-student').value.trim();
  const marks = Number(document.getElementById('mark-score').value);
  if(!exam||!studentName||Number.isNaN(marks)) return alert('Fill fields');
  const m = {id: uid('mark'), exam, studentName, marks, uploader: currentUser?.name || 'Unknown', createdAt: Date.now()};
  store.marks.push(m); saveStore(store); renderMarks(); addNotification(`Marks uploaded: ${exam} (${studentName})`, 'exams');
  document.getElementById('mark-exam').value=''; document.getElementById('mark-student').value=''; document.getElementById('mark-score').value='';
}
window.uploadMark = uploadMark;
function editMark(id){
  const m = store.marks.find(x=>x.id===id); if(!m) return;
  const newScore = prompt('New marks', m.marks); if(newScore===null) return;
  m.marks = Number(newScore); saveStore(store); renderMarks(); addNotification('Mark edited','exams');
}

// --------------------
// HOMEWORK (CRUD) + related video display
// --------------------
function renderHomeworks(){
  const container = document.getElementById('homework-list'); container.innerHTML='';
  // fill related-video select
  const sel = document.getElementById('hw-related-video'); sel.innerHTML = '<option value="">(No related video)</option>';
  store.videos.forEach(v=>{ const opt = document.createElement('option'); opt.value=v.id; opt.textContent=v.title; sel.appendChild(opt); });

  store.homeworks.forEach(h=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<strong>${escapeHtml(h.title)}</strong>
      <div class="meta">${escapeHtml(h.desc)}<br>by ${escapeHtml(h.uploader)} — ${new Date(h.createdAt).toLocaleString()}</div>`;

    // related video (if any)
    if(h.relatedVideoId){
      const vid = store.videos.find(v=>v.id===h.relatedVideoId);
      if(vid){
        const media = document.createElement('div'); media.style.marginTop='8px';
        media.innerHTML = `<div style="font-weight:600">Related video: ${escapeHtml(vid.title)}</div>
                           <video width="320" controls src="${vid.blobUrl}"></video>`;
        card.appendChild(media);
      }
    }

    if(currentUser?.role==='teacher'){
      const del = document.createElement('button'); del.className='action-btn'; del.textContent='Delete'; del.onclick=()=>{ if(confirm('Delete?')){ store.homeworks = store.homeworks.filter(x=>x.id!==h.id); saveStore(store); renderHomeworks(); addNotification('Homework deleted','homework'); } };
      card.appendChild(del);
    }
    container.appendChild(card);
  });
}
function addHomework(){
  if(!currentUser || currentUser.role!=='teacher') return alert('Only teachers can add');
  const title = document.getElementById('hw-title').value.trim();
  const desc = document.getElementById('hw-desc').value.trim();
  const rv = document.getElementById('hw-related-video').value || null;
  if(!title || !desc) return alert('Fill fields');
  const h = {id: uid('hw'), title, desc, relatedVideoId: rv, uploader: currentUser.name, createdAt: Date.now()};
  store.homeworks.unshift(h); saveStore(store); renderHomeworks(); addNotification(`Homework: ${title}`,'homework');
  document.getElementById('hw-title').value=''; document.getElementById('hw-desc').value='';
}
window.addHomework = addHomework;

// --------------------
// VIDEOS (upload from device) + show uploader
// --------------------
function renderVideos(){
  const container = document.getElementById('video-list'); container.innerHTML='';
  store.videos.forEach(v=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<strong>${escapeHtml(v.title)}</strong>
                      <div class="meta">by ${escapeHtml(v.uploader)} — ${new Date(v.createdAt).toLocaleString()}</div>
                      <div style="margin-top:8px"><video width="320" controls src="${v.blobUrl}"></video></div>`;
    if(currentUser?.role==='teacher'){
      const del = document.createElement('button'); del.className='action-btn'; del.textContent='Delete'; del.onclick=()=>{ if(confirm('Delete video?')){ store.videos = store.videos.filter(x=>x.id!==v.id); saveStore(store); renderVideos(); addNotification('Video deleted','videos'); } };
      card.appendChild(del);
    }
    container.appendChild(card);
  });
}
function uploadVideo(){
  if(!currentUser || currentUser.role!=='teacher') return alert('Only teachers');
  const title = document.getElementById('video-title').value.trim();
  const file = document.getElementById('video-file').files[0];
  if(!title || !file) return alert('Select file and title');
  const blobUrl = URL.createObjectURL(file);
  const v = {id: uid('v'), title, uploader: currentUser.name, createdAt: Date.now(), blobUrl};
  store.videos.unshift(v); saveStore(store);
  renderVideos(); renderHomeworks(); addNotification(`Video uploaded: ${title}`, 'videos');
  document.getElementById('video-title').value=''; document.getElementById('video-file').value='';
}
window.uploadVideo = uploadVideo;

// --------------------
// NOTIFICATIONS
// --------------------
function addNotification(text, section){
  const item = {id: uid('n'), text, section, date: Date.now()};
  store.notifications = store.notifications || [];
  store.notifications.unshift(item);
  saveStore(store);
  updateNotifIcon();
  renderNotificationsList();
}
function updateNotifIcon(){
  const count = (store.notifications || []).length;
  notifCount.textContent = count;
}
function renderNotificationsList(){
  const list = document.getElementById('notifications-list'); list.innerHTML='';
  (store.notifications||[]).forEach(n=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
                        <div>${escapeHtml(n.text)}</div>
                        <div class="meta">${new Date(n.date).toLocaleString()}</div>
                      </div>`;
    const go = document.createElement('button'); go.className='action-btn'; go.textContent='Open'; go.onclick=()=>{ showSection(n.section); };
    card.appendChild(go);
    list.appendChild(card);
  });
}
notifBell.onclick = ()=>{ showSection('notifications'); };

// --------------------
// Utilities & render orchestrator
// --------------------
function renderAllSections(){
  renderClassesList();
  renderAttendanceStudents();
  renderMarks();
  renderHomeworks();
  renderVideos();
  renderNotificationsList();
}

function showSection(id){
  sections.forEach(s => document.getElementById(s).classList.remove('active'));
  if(!sections.includes(id)) id = 'classes';
  document.getElementById(id).classList.add('active');
  // ensure teacher UI toggles
  enableTeacherUI(currentUser?.role==='teacher');
  // if attendance -> render calendar again to attach handlers
  if(id==='attendance') renderCalendar();
  // if notifications opened, reset count
  if(id==='notifications'){ if(store.notifications) store.notifications = []; saveStore(store); updateNotifIcon(); renderNotificationsList(); }
}

// escape html helper
function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]); }

// small helpers
function getClassTitle(id){ return (store.classes.find(c=>c.id===id)||{}).title || '—'; }

// --------------------
// initial demo rendering
// --------------------
renderClassesList();
renderHomeworks();
renderVideos();
renderMarks();
renderNotificationsList();
renderClassSelect();

// If no user logged in, show auth modal
if(!currentUser) authModal.style.display='flex'; else authModal.style.display='none';
