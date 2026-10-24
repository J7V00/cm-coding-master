import "../styles/theme.css";
import "../styles/welcome.css";
import "../styles/github.css";
import "../styles/ai-assistant.css";
import { installDesktop } from "../shared/desktop";
import { installGitHub } from "../shared/github";
import { saveProject } from "../shared/storage";
import { escapeHtml, normalizePath } from "../shared/paths";
import { initTheme } from "../shared/theme";
import { initI18n, applyLang, getLang } from "../shared/i18n";
import { initAiAssistant } from "../shared/ai-assistant";

initI18n();
initTheme();
installDesktop();
installGitHub();
initAiAssistant();

const STARTUP_KEY = "cm-welcome-seen";
const RECENT_KEY = "cm-recent-projects";
const desktop = window.CMDesktop!;
const filePicker = document.getElementById("filePicker") as HTMLInputElement | null;
const folderPicker = document.getElementById("folderPicker") as HTMLInputElement | null;

type RecentItem = { name: string; detail: string; date: number };

function readRecent(): RecentItem[] {
  try {
    const items = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveRecent(name: string, detail: string) {
  try {
    const items = readRecent().filter((item) => item.name !== name);
    items.unshift({ name, detail, date: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 6)));
  } catch {
    /* ignore */
  }
}

function renderRecent() {
  const box = document.getElementById("recentBox");
  const list = document.getElementById("recentList");
  if (!box || !list) return;
  const items = readRecent();
  if (!items.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  list.innerHTML = items
    .map(
      (item) =>
        `<button type="button" class="recent-item" data-name="${escapeHtml(item.name)}"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.detail)}</small></button>`,
    )
    .join("");
  list.querySelectorAll<HTMLButtonElement>(".recent-item").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.setItem(STARTUP_KEY, "1");
      window.location.href = "editor.html";
    });
  });
}

function goEditor() {
  localStorage.setItem(STARTUP_KEY, "1");
  saveRecent("My Latest Project", "Code Master");
  window.location.href = "editor.html";
}

async function importFiles(fileList: FileList | null) {
  if (!fileList?.length) return;
  const incoming: Record<string, string> = {};
  let projectRoot = "CODE-MASTER";

  for (const file of [...fileList]) {
    try {
      const relative = (file as File & { webkitRelativePath?: string }).webkitRelativePath
        ? normalizePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || "")
        : normalizePath(file.name);
      if ((file as File & { webkitRelativePath?: string }).webkitRelativePath) {
        projectRoot = relative.split("/")[0] || projectRoot;
      }
      const parts = relative.split("/");
      const path = parts.length > 1 ? parts.slice(1).join("/") : parts[0];
      if (path) incoming[path] = await file.text();
    } catch {
      /* skip */
    }
  }

  if (!Object.keys(incoming).length) return;

  await saveProject({
    files: incoming,
    folders: [],
    projectRoot,
    projectRootPath: "",
    nativePaths: {},
  });
  saveRecent(projectRoot, Object.keys(incoming).length + " files");
  localStorage.setItem(STARTUP_KEY, "1");
  localStorage.setItem("cm-was-imported", "1");
  window.location.href = "editor.html";
}

document.getElementById("helpBtn")?.addEventListener("click", goEditor);

document.getElementById("openFileBtn")?.addEventListener("click", async () => {
  if (!desktop.isTauri()) {
    filePicker?.click();
    return;
  }
  const picked = await desktop.openFile();
  if (!picked) return;
  await saveProject({
    files: { [picked.name]: picked.content },
    folders: [],
    projectRoot: String(picked.path).replace(/\\/g, "/").split("/").pop() || "CODE-MASTER",
    projectRootPath: await desktop.join(picked.path, ".."),
    nativePaths: { [picked.name]: picked.path },
  });
  saveRecent(picked.name, picked.path);
  localStorage.setItem(STARTUP_KEY, "1");
  window.location.href = "editor.html";
});

document.getElementById("openFolderBtn")?.addEventListener("click", async () => {
  if (!desktop.isTauri()) {
    folderPicker?.click();
    return;
  }
  const project = await desktop.openFolder();
  if (!project) return;
  if (!Object.keys(project.files).length) {
    alert(getLang() === "en" ? "No supported code files were found in this folder." : "لم يُعثر على ملفات كود مدعومة في هذا المجلد.");
    return;
  }
  await saveProject({
    files: project.files,
    folders: project.folders || [],
    projectRoot: project.rootName || "CODE-MASTER",
    projectRootPath: project.rootPath || "",
    nativePaths: project.nativePaths,
  });
  saveRecent(project.rootName || "Project", project.rootPath || "");
  localStorage.setItem(STARTUP_KEY, "1");
  window.location.href = "editor.html";
});

document.getElementById("newFileBtn")?.addEventListener("click", () => {
  localStorage.removeItem(STARTUP_KEY);
  localStorage.setItem("cm-new-file", "index.html");
  saveRecent("index.html", "New file");
  window.location.href = "editor.html";
});

filePicker?.addEventListener("change", (event) => {
  void importFiles((event.target as HTMLInputElement).files);
  if (filePicker) filePicker.value = "";
});
folderPicker?.addEventListener("change", (event) => {
  void importFiles((event.target as HTMLInputElement).files);
  if (folderPicker) folderPicker.value = "";
});

document.addEventListener("keydown", (event) => {
  const mod = event.metaKey || event.ctrlKey;
  if (mod && event.key.toLowerCase() === "n") {
    event.preventDefault();
    document.getElementById("newFileBtn")?.click();
  }
  if (mod && event.key.toLowerCase() === "o" && event.shiftKey) {
    event.preventDefault();
    document.getElementById("openFolderBtn")?.click();
  } else if (mod && event.key.toLowerCase() === "o") {
    event.preventDefault();
    document.getElementById("openFileBtn")?.click();
  }
});

window.addEventListener("cm:langchange", () => applyLang(getLang()));
renderRecent();
