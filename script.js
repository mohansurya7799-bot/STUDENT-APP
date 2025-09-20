let currentUser = null;

// Wait until page loads
window.onload = () => {
  document.getElementById("loginBtn").onclick = login;
  document.getElementById("logoutBtn").onclick = logout;
};

// Login
function login() {
  const name = document.getElementById("username").value.trim();
  const role = document.getElementById("role").value;

  if (!name) {
    alert("Please enter your name");
    return;
  }

  currentUser = { name, role };

  // Show user details
  document.getElementById("loginDetails").innerText = `${name} (${role})`;

  // Switch screens
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  // Open first section
  openSection("classes");
}

// Logout
function logout() {
  currentUser = null;

  // Switch screens back
  document.getElementById("app").classList.add("hidden");
  document.getElementById("loginPage").classList.remove("hidden");

  // Clear inputs
  document.getElementById("username").value = "";
  document.getElementById("loginDetails").innerText = "";
}

// Open sections
function openSection(id) {
  document.querySelectorAll("main section").forEach(sec => sec.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}
