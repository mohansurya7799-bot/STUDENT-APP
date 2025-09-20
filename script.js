let currentUser = null;
let role = null;

function login() {
  role = document.getElementById("roleSelect").value;
  const username = document.getElementById("username").value;
  if (!username) {
    alert("Please enter your name");
    return;
  }
  currentUser = username;
  document.getElementById("loginPage").classList.remove("active");
  document.getElementById("dashboard").classList.add("active");
  document.getElementById("userDetails").innerText = `${role}: ${username}`;
  toggleTeacherFeatures();
  generateClassList();
  generateCalendar();
}

function logout() {
  currentUser = null;
  role = null;
  document.getElementById("dashboard").classList.remove("active");
  document.getElementById("loginPage").classList.add("active");
}

// Sidebar navigation
function openSection(id) {
  document.querySelectorAll(".content-section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// Teacher-only controls
function toggleTeacherFeatures() {
  document.querySelectorAll(".teacher-only").forEach(el => {
    el.style.display = (role === "teacher") ? "block" : "none";
  });
}

// Classes
function generateClassList() {
  const list = document.getElementById("classList");
  list.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    let li = document.createElement("li");
    li.innerText = "Class " + i;
    list.appendChild(li);
  }
}

// Attendance Calendar
function generateCalendar() {
  const cal = document.getElementById("calendar");
  cal.innerHTML = "";
  const date = new Date();
  const month = date.getMonth();
  const year = date.getFullYear();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let table = "<table><tr>";
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  days.forEach(d => table += `<th>${d}</th>`);
  table += "</tr><tr>";

  for (let i = 0; i < firstDay; i++) table += "<td></td>";

  for (let d = 1; d <= daysInMonth; d++) {
    table += `<td onclick="markAttendance(this)">${d}</td>`;
    if ((d + firstDay) % 7 === 0) table += "</tr><tr>";
  }
  table += "</tr></table>";
  cal.innerHTML = table;
}

function markAttendance(cell) {
  if (role !== "teacher") return;
  if (cell.style.background === "green") {
    cell.style.background = "";
  } else {
    cell.style.background = "green";
  }
}

// Homework
function uploadHomework() {
  const text = document.getElementById("homeworkText").value;
  if (!text) return alert("Enter homework");
  addNotification("New homework uploaded");
  document.getElementById("homeworkList").innerHTML += `<p>${text}</p>`;
  document.getElementById("homeworkText").value = "";
}

// Videos
function uploadVideo() {
  const file = document.getElementById("videoFile").files[0];
  if (!file) return alert("Select a video");
  const url = URL.createObjectURL(file);
  document.getElementById("videoList").innerHTML += `<video controls width="300"><source src="${url}"></video>`;
  addNotification("New video uploaded");
}

// Exams
function uploadExam() {
  const name = document.getElementById("examName").value;
  const date = document.getElementById("examDate").value;
  const file = document.getElementById("examPaper").files[0];
  if (!name || !date || !file) return alert("Fill all fields");
  const url = URL.createObjectURL(file);
  document.getElementById("examList").innerHTML += `<p><b>${name}</b> - ${date} - <a href="${url}" target="_blank">Question Paper</a></p>`;
  addNotification("Exam uploaded: " + name);
}

// Marks
function uploadMarks() {
  const student = document.getElementById("marksStudent").value;
  const marks = document.getElementById("marksValue").value;
  if (!student || !marks) return alert("Enter student and marks");
  document.getElementById("marksList").innerHTML += `<p>${student}: ${marks} marks</p>`;
  addNotification("Marks uploaded for " + student);
}

// Notifications
function addNotification(msg) {
  const li = document.createElement("li");
  li.innerText = msg;
  document.getElementById("notificationList").appendChild(li);
}
