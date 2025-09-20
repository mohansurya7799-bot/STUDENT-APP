let currentUser = null;
let notifications = [];

// Login
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

  if (role === "teacher") {
    document.getElementById("classUploadForm").classList.remove("hidden");
    document.getElementById("videoUploadForm").classList.remove("hidden");
    document.getElementById("examUploadForm").classList.remove("hidden");
    document.getElementById("marksUploadForm").classList.remove("hidden");
  }

  generateCalendar();
}

// Logout
function logout() {
  currentUser = null;
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");
}

// Open Section
function openSection(id) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// === CLASSES ===
function uploadClass() {
  let title = document.getElementById("classTitle").value;
  let content = document.getElementById("classContent").value;

  if (title && content) {
    let div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<h3>${title}</h3><p>${content}</p><small>Uploaded by ${currentUser.name}</small>`;
    document.getElementById("classList").appendChild(div);

    addNotification("classes", `New class uploaded: ${title}`);
    document.getElementById("classTitle").value = "";
    document.getElementById("classContent").value = "";
  }
}

// === ATTENDANCE ===
function generateCalendar() {
  let cal = document.getElementById("calendar");
  cal.innerHTML = "";
  for (let day = 1; day <= 30; day++) {
    let div = document.createElement("div");
    div.innerText = day;
    if (currentUser.role === "teacher") {
      div.onclick = () => {
        div.style.background = div.style.background === "green"
          ? "rgba(255,255,255,0.2)"
          : "green";
      };
    }
    cal.appendChild(div);
  }
}

// === VIDEOS ===
function uploadVideo() {
  let file = document.getElementById("videoFile").files[0];
  if (file) {
    let div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `🎞️ ${file.name} <br><small>Uploaded by ${currentUser.name}</small>`;
    document.getElementById("videoUploads").appendChild(div);

    addNotification("videos", `New video uploaded: ${file.name}`);
  }
}

// === EXAMS ===
function uploadExam() {
  let file = document.getElementById("examFile").files[0];
  if (file) {
    let div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `📝 ${file.name} <br><small>Uploaded by ${currentUser.name}</small>`;
    document.getElementById("examUploa
