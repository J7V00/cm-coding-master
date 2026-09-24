const STARTUP_KEY = "cm-welcome-seen";
const startBtn = document.getElementById("startBtn");
const rememberMe = document.getElementById("rememberMe");

if (localStorage.getItem(STARTUP_KEY) === "1") {
  window.location.replace("editor.html");
}

startBtn.addEventListener("click", () => {
  if (rememberMe.checked) {
    localStorage.setItem(STARTUP_KEY, "1");
  } else {
    localStorage.removeItem(STARTUP_KEY);
  }
  window.location.href = "editor.html";
});