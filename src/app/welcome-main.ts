import "../styles/theme.css";
import "../styles/welcome.css";
import "../styles/github.css";
import { installDesktop } from "../shared/desktop";
import { installGitHub } from "../shared/github";
import { saveProject } from "../shared/storage";
import { normalizePath } from "../shared/paths";
import { initTheme } from "../shared/theme";
import { initI18n } from "../shared/i18n";

initI18n();
initTheme();
installDesktop();
installGitHub();

const STARTUP_KEY = "cm-welcome-seen";
const RECENT_KEY = "cm-recent-projects";
const desktop = window.CMDesktop!;
const filePicker = document.getElementById("filePicker") as HTMLInputElement | null;
const folderPicker = document.getElementById("folderPicker") as HTMLInputElement | null;

function saveRecent(name: string, detail: string) {
  try {
    const items = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").filter(
      (item: { name: string }) => item.name !== name,
    );
    items.unshift({ name, detail, date: Date.now() });
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 6)));
  } catch {
    /* ignore */
  }
}

function goEditor() {
  localStorage.setItem(STARTUP_KEY, "1");
  saveRecent("My Latest Project", "Coding Master");
  window.location.href = "editor.html";
}

async function importFiles(fileList: FileList | null) {
  if (!fileList?.length) return;
  const incoming: Record<string, string> = {};
  let projectRoot = "CODING-MASTER";

  for (const file of [...fileList]) {
    try {
      const relative = (file as any).webkitRelativePath
        ? normalizePath((file as any).webkitRelativePath)
        : normalizePath(file.name);
      if ((file as any).webkitRelativePath) {
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
  localStorage.setItem(STARTUP_KEY, "1");
  localStorage.setItem("cm-was-imported", "1");
  window.location.href = "editor.html";
}

document.getElementById("continueBtn")?.addEventListener("click", goEditor);
document.getElementById("heroOpenBtn")?.addEventListener("click", () => filePicker?.click());
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
    projectRoot: String(picked.path).replace(/\\/g, "/").split("/").pop() || "CODING-MASTER",
    projectRootPath: await desktop.join(picked.path, ".."),
    nativePaths: { [picked.name]: picked.path },
  });
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
    alert("No supported code files were found in this folder.");
    return;
  }
  await saveProject({
    files: project.files,
    folders: project.folders || [],
    projectRoot: project.rootName || "CODING-MASTER",
    projectRootPath: project.rootPath || "",
    nativePaths: project.nativePaths,
  });
  localStorage.setItem(STARTUP_KEY, "1");
  window.location.href = "editor.html";
});

document.getElementById("newFileBtn")?.addEventListener("click", () => {
  localStorage.removeItem(STARTUP_KEY);
  localStorage.setItem("cm-new-file", "index.html");
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
