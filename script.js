let currentUser = null;
let notifications = [];

function login() {
  const name = document.getElementById("username").value;
  const role = document.getElementById("role").value;

  if (!name) {
    alert("Please enter your name");
    return;
  }

  currentUser = { name, role };
  document.getElementById("loginDetails").innerText = `${name} (${role})`;
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  // Show upload forms only for teachers
  if (role === "teacher") {
    document.getElementById("videoUploadForm").classList.remove("hidden");
    document.getElementById("examUploadForm").classList.remove("hidden");
    document.getElementById("marksUploadForm").classList.remove("hidden");
  }
  generateClasses();
  generateCalendar();
}

function logout() {
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

function openSection(id) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function generateClasses() {
  let classList = document.getElementById("classList");
  classList.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    let div = document.createElement("div");
    div.innerText = `Class ${i}`;
    classList.appendChild(div);
  }
}

function generateCalendar() {
  let cal = document.getElementById("calendar");
  cal.innerHTML = "";
  for (let day = 1; day <= 30; day++) {
    let div = document.createElement("div");
    div.innerText = day;
    if (currentUser.role === "teacher") {
      div.onclick = () => {
        div.style.background = div.style.background === "green" ? "rgba(255,255,255,0.2)" : "green";
      };
    }
    cal.appendChild(div);
  }
}

// Upload Functions
function uploadVideo() {
  let file = document.getElementById("videoFile").files[0];
  if (file) {
    let div = document.createElement("div");
    div.innerText = `${file.name} (Uploaded by ${currentUser.name})`;
    document.getElementById("videoUploads").appendChild(div);
    addNotification("videos", `New video uploaded: ${file.name}`);
  }
}

function uploadExam() {
  let file = document.getElementById("examFile").files[0];
  if (file) {
    let div = document.createElement("div");
    div.innerText = `${file.name} (Uploaded by ${currentUser.name})`;
    document.getElementById("examUploads").appendChild(div);
    addNotification("exams", `New exam uploaded: ${file.name}`);
  }
}

function uploadMarks() {
  let mark = document.getElementById("studentMark").value;
  if (mark) {
    let div = document.createElement("div");
    div.innerText = `${mark} (Uploaded by ${currentUser.name})`;
    document.getElementById("marksList").appendChild(div);
    addNotification("marks", `Marks updated for ${mark}`);
  }
}

// Notifications
function addNotification(section, text) {
  let id = notifications.length;
  notifications.push({ id, section, text });
  let li = document.createElement("li");
  li.innerText = text;
  li.onclick = () => {
    openSection(section);
  };
  document.getElementById("notificationList").appendChild(li);
}
