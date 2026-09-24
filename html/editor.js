const STORAGE_KEY = "coding-master-editor-v1";

const starters = {
  html: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>صفحتي الأولى</title>
</head>
<body>
  <h1>مرحبًا من Coding Master 👋</h1>
  <p>اكتب الكود وشاهد النتيجة هنا.</p>
</body>
</html>`,
  css: `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #111;
  color: white;
  font-family: sans-serif;
}

h1 {
  font-size: 42px;
}`,
  js: `document.body.innerHTML = "<h1>JavaScript يعمل ✅</h1>";`
};

const state = {
  language: "html",
  code: loadState()
};

const codeEditor = document.getElementById("codeEditor");
const lineNumbers = document.getElementById("lineNumbers");
const preview = document.getElementById("preview");
const languageLabel = document.getElementById("languageLabel");
const saveState = document.getElementById("saveState");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");
const clearPreviewBtn = document.getElementById("clearPreviewBtn");
const tabs = [...document.querySelectorAll(".tab")];

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.code) {
      return {
        html: saved.code.html || starters.html,
        css: saved.code.css || starters.css,
        js: saved.code.js || starters.js
      };
    }
  } catch (error) {
    console.warn("Could not load editor state:", error);
  }

  return { ...starters };
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: state.code }));
  saveState.textContent = "تم الحفظ تلقائيًا";
}

function refreshLines() {
  const count = Math.max(codeEditor.value.split("\n").length, 1);
  lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join("\n");
}

function renderEditor() {
  codeEditor.value = state.code[state.language];
  languageLabel.textContent = state.language === "js" ? "JavaScript" : state.language.toUpperCase();

  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.language === state.language);
  });

  refreshLines();
  codeEditor.scrollTop = 0;
  runCode();
}

function runCode() {
  state.code[state.language] = codeEditor.value;

  const html = state.code.html;
  const css = state.code.css;
  const js = state.code.js;

  const documentSource = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
${css}
  </style>
</head>
<body>
${html}
<script>
try {
${js}
} catch (error) {
  document.body.innerHTML = "<pre style=\"padding:16px;color:#b00020;white-space:pre-wrap;\">" + String(error) + "</pre>";
}
<\/script>
</body>
</html>`;

  preview.srcdoc = documentSource;
  persistState();
}

function resetCurrentCode() {
  state.code[state.language] = starters[state.language];
  renderEditor();
  persistState();
}

codeEditor.addEventListener("input", () => {
  state.code[state.language] = codeEditor.value;
  refreshLines();
  persistState();
});

codeEditor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = codeEditor.scrollTop;
});

codeEditor.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const start = codeEditor.selectionStart;
    const end = codeEditor.selectionEnd;
    codeEditor.setRangeText("  ", start, end, "end");
    state.code[state.language] = codeEditor.value;
    refreshLines();
    persistState();
  }

  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    runCode();
  }
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.code[state.language] = codeEditor.value;
    state.language = tab.dataset.language;
    renderEditor();
  });
});

runBtn.addEventListener("click", runCode);
resetBtn.addEventListener("click", resetCurrentCode);

clearPreviewBtn.addEventListener("click", () => {
  preview.srcdoc = `<!DOCTYPE html><html><body style="margin:0;display:grid;place-items:center;height:100vh;font-family:sans-serif;color:#555;"><p>المعاينة فارغة</p></body></html>`;
});

window.addEventListener("resize", refreshLines);

renderEditor();