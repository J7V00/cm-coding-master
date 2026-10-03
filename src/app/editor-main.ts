import "../styles/theme.css";
import "../styles/editor.css";
import "../styles/github.css";
import { installDesktop } from "../shared/desktop";
import { installGitHub } from "../shared/github";
import { applyTheme, getTheme, toggleTheme } from "../shared/theme";
import { loadProject, saveProject, type ProjectState } from "../shared/storage";
import { lintCode } from "../shared/lint";
import {
  baseName,
  escapeAttr,
  escapeHtml,
  extension,
  language,
  normalizePath,
  parentFolder,
} from "../shared/paths";
import { createCmEditor, type CmEditor } from "./cm-editor";

installDesktop();
installGitHub();

const desktop = window.CMDesktop!;
const panelBody = document.getElementById("panelBody")!;
const sideContent = document.getElementById("sideContent")!;
const breadcrumb = document.getElementById("breadcrumb")!;
const status = document.getElementById("status")!;
const problemCount = document.getElementById("problemCount")!;
const projectName = document.getElementById("projectName")!;
const preview = document.getElementById("preview") as HTMLIFrameElement;
const filePicker = document.getElementById("filePicker") as HTMLInputElement;
const folderPicker = document.getElementById("folderPicker") as HTMLInputElement;
const editorHost = document.getElementById("editorHost")!;

let state: ProjectState = {
  files: {},
  folders: [],
  projectRoot: "CODING-MASTER",
  projectRootPath: "",
  nativePaths: {},
};
let folders = new Set<string>();
let activeFolder = "";
let currentFile = "index.html";
let openFiles = ["index.html"];
let cm: CmEditor;
const SHA_KEY = "cm-github-file-shas";

function iconClass(file: string) {
  const ext = extension(file);
  if (["html", "htm"].includes(ext)) return "html";
  if (ext === "css") return "css";
  if (["js", "jsx", "ts", "tsx"].includes(ext)) return "js";
  if (ext === "json") return "json";
  return "text";
}

function iconText(file: string) {
  const ext = extension(file);
  if (["html", "htm"].includes(ext)) return "<>";
  if (ext === "css") return "CSS";
  if (["js", "jsx", "ts", "tsx"].includes(ext)) return "JS";
  if (ext === "json") return "{}";
  return "TXT";
}

async function persist() {
  state.folders = [...folders];
  await saveProject(state);
}

function addFolderAndParents(path: string) {
  const clean = normalizePath(path);
  if (!clean) return;
  const parts = clean.split("/").filter(Boolean);
  for (let i = 1; i <= parts.length; i++) folders.add(parts.slice(0, i).join("/"));
}

function firstIndexFile() {
  const exact = Object.keys(state.files).find((p) => normalizePath(p).toLowerCase() === "index.html");
  if (exact) return exact;
  const nested = Object.keys(state.files).find((p) => baseName(p).toLowerCase() === "index.html");
  if (nested) return nested;
  return Object.keys(state.files).find((p) => extension(p) === "html") || Object.keys(state.files)[0] || "index.html";
}

function updateStatus() {
  const lint = lintCode(cm.getValue(), language(currentFile));
  problemCount.textContent = String(lint.lines.length);
  const pos = cm.view.state.selection.main.head;
  const line = cm.view.state.doc.lineAt(pos);
  const col = pos - line.from + 1;
  status.textContent =
    `Ln ${line.number}, Col ${col} • ${language(currentFile)} • UTF-8` +
    (lint.lines.length ? ` • ${lint.lines.length} problem(s)` : "");
}

function renderExplorer() {
  const entries = Object.keys(state.files).filter(Boolean).map(normalizePath).sort((a, b) => a.localeCompare(b));
  const folderList = new Set(folders);
  entries.forEach((path) => {
    const parts = path.split("/");
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) folderList.add(parts.slice(0, i).join("/"));
    }
  });

  const folderHtml = [...folderList]
    .sort((a, b) => a.localeCompare(b))
    .map((folder) => {
      const depth = folder.split("/").length - 1;
      return `<button class="tree-folder" data-folder="${escapeAttr(folder)}" style="padding-left:${10 + depth * 14}px" type="button">▾ ${escapeHtml(baseName(folder))}</button>`;
    })
    .join("");

  const fileHtml = entries
    .map((path) => {
      const depth = path.split("/").length - 1;
      return `<button class="tree-file ${path === currentFile ? "active" : ""}" data-file="${escapeAttr(path)}" style="padding-left:${10 + depth * 14}px" type="button" draggable="true"><span class="file-icon ${iconClass(path)}">${iconText(path)}</span><span>${escapeHtml(baseName(path))}</span></button>`;
    })
    .join("");

  sideContent.innerHTML = `<div class="project-root">⌄ ${escapeHtml(state.projectRoot)}</div>${folderHtml}${fileHtml}`;

  sideContent.querySelectorAll<HTMLButtonElement>(".tree-file").forEach((button) => {
    button.addEventListener("click", () => openFile(button.dataset.file || ""));
  });
  sideContent.querySelectorAll<HTMLButtonElement>(".tree-folder").forEach((button) => {
    button.addEventListener("click", () => {
      activeFolder = button.dataset.folder || "";
    });
  });
}

function renderTabs() {
  const tabs = document.getElementById("tabs")!;
  tabs.innerHTML = openFiles
    .map(
      (file) =>
        `<button class="tab ${file === currentFile ? "active" : ""}" data-file="${escapeAttr(file)}" type="button"><span class="tab-icon ${iconClass(file)}">${iconText(file)}</span><span>${escapeHtml(baseName(file))}</span><span class="tab-close">×</span></button>`,
    )
    .join("");

  tabs.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
    tab.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).classList.contains("tab-close")) {
        closeTab(tab.dataset.file || "");
        return;
      }
      openFile(tab.dataset.file || "");
    });
  });
}

function openFile(file: string) {
  file = normalizePath(file);
  if (!(file in state.files)) state.files[file] = "";
  if (currentFile) state.files[currentFile] = cm.getValue();
  currentFile = file;
  if (!openFiles.includes(file)) openFiles.push(file);
  cm.setFile(file, state.files[file] || "");
  breadcrumb.textContent = file.replace(/\//g, " / ");
  projectName.textContent = state.projectRoot;
  renderExplorer();
  renderTabs();
  updateStatus();
  cm.focus();
}

function closeTab(file: string) {
  if (openFiles.length === 1) return;
  const index = openFiles.indexOf(file);
  openFiles = openFiles.filter((item) => item !== file);
  if (currentFile === file) currentFile = openFiles[Math.max(0, index - 1)] || openFiles[0];
  openFile(currentFile);
}

async function save() {
  state.files[currentFile] = cm.getValue();
  try {
    if (desktop.isTauri() && state.nativePaths[currentFile]) {
      await desktop.writeText(state.nativePaths[currentFile], cm.getValue());
    }
  } catch (error) {
    panelBody.innerHTML = `<p class="problem-row">${escapeHtml((error as Error).message || "Could not save the file.")}</p>`;
    return;
  }
  await persist();
  renderExplorer();
  renderTabs();
  const lint = lintCode(cm.getValue(), language(currentFile));
  panelBody.innerHTML = `<div>$ coding-master save</div><p class="${lint.lines.length ? "problem-row" : "success-row"}">${
    lint.lines.length ? `Saved with ${lint.lines.length} problem(s).` : `Saved ${escapeHtml(currentFile)}.`
  }</p>`;
}

async function newFile(targetFolder = "") {
  const raw = prompt("File name", "index.html");
  if (!raw) return;
  let name = normalizePath(raw.trim());
  if (!name) return;
  if (targetFolder && !name.includes("/")) name = normalizePath(targetFolder) + "/" + name;
  if (name in state.files) {
    openFile(name);
    return;
  }
  state.files[name] = "";
  if (desktop.isTauri() && state.projectRootPath) {
    try {
      state.nativePaths[name] = await desktop.join(state.projectRootPath, name);
      await desktop.writeText(state.nativePaths[name], "");
    } catch (error) {
      delete state.nativePaths[name];
      panelBody.innerHTML = `<p class="problem-row">${escapeHtml((error as Error).message || "Could not create the file.")}</p>`;
      return;
    }
  }
  await persist();
  openFile(name);
}

async function newFolder(parent = "") {
  const raw = prompt("Folder name", "html");
  if (!raw) return;
  let name = normalizePath(raw.trim());
  if (!name) return;
  const path = parent && !name.includes("/") ? normalizePath(parent) + "/" + name : name;
  if (desktop.isTauri() && state.projectRootPath) {
    try {
      await desktop.makeDirectory(await desktop.join(state.projectRootPath, path));
    } catch (error) {
      panelBody.innerHTML = `<p class="problem-row">${escapeHtml((error as Error).message || "Could not create the folder.")}</p>`;
      return;
    }
  }
  addFolderAndParents(path);
  activeFolder = path;
  await persist();
  renderExplorer();
  panelBody.innerHTML = `<div>$ coding-master folder</div><p class="success-row">Created ${escapeHtml(path)}.</p>`;
}

async function importFiles(list: FileList | File[], targetFolder = "") {
  let count = 0;
  for (const file of [...list]) {
    try {
      const relative = (file as any).webkitRelativePath
        ? normalizePath((file as any).webkitRelativePath)
        : normalizePath(file.name);
      const parts = relative.split("/");
      const withoutRoot = parts.length > 1 ? parts.slice(1).join("/") : parts[0];
      const path = targetFolder ? normalizePath(targetFolder) + "/" + withoutRoot : withoutRoot;
      if (path) {
        state.files[path] = await file.text();
        addFolderAndParents(parentFolder(path));
        count++;
      }
      if ((file as any).webkitRelativePath) state.projectRoot = parts[0] || state.projectRoot;
    } catch {
      /* skip */
    }
  }
  if (!count) return;
  await persist();
  currentFile = firstIndexFile();
  openFiles = [currentFile];
  openFile(currentFile);
  panelBody.innerHTML = `<div>$ coding-master import</div><p class="success-row">Imported ${count} file(s).</p>`;
}

function findProjectFile(reference: string) {
  const clean = normalizePath(reference).split("?")[0].split("#")[0];
  if (state.files[clean] !== undefined) return clean;
  const normalized = clean.replace(/^\.\/+/, "");
  const exact = Object.keys(state.files).find((path) => normalizePath(path) === normalized);
  if (exact) return exact;
  return Object.keys(state.files).find((path) => baseName(path) === baseName(normalized)) || "";
}

function buildPreviewHtml() {
  state.files[currentFile] = cm.getValue();
  const indexFile = firstIndexFile();
  let htmlDoc = state.files[indexFile] || "";

  htmlDoc = htmlDoc.replace(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi, (full, href) => {
    const path = findProjectFile(href);
    return path ? `<style>\n${state.files[path]}\n</style>` : full;
  });

  htmlDoc = htmlDoc.replace(/<script([^>]+)src=["']([^"']+\.js)["'][^>]*><\/script>/gi, (full, attrs, src) => {
    const path = findProjectFile(src);
    if (!path) return full;
    const cleanAttrs = attrs.replace(/\s+src=["'][^"']+["']/i, "");
    return `<script${cleanAttrs}>${state.files[path]}<\/script>`;
  });

  if (!/<meta[^>]+name=["']viewport["']/i.test(htmlDoc)) {
    htmlDoc = htmlDoc.replace(/<head>/i, '<head><meta name="viewport" content="width=device-width,initial-scale=1.0">');
  }
  return htmlDoc;
}

async function run() {
  await save();
  preview.srcdoc = buildPreviewHtml();
  panelBody.innerHTML = `<div>$ coding-master run</div><p class="success-row">Project is running in the preview.</p>`;
}

function openPreview() {
  const blob = new Blob([buildPreviewHtml()], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const tab = window.open(url, "_blank", "noopener,noreferrer");
  if (!tab) {
    panelBody.innerHTML = `<p class="problem-row">The browser blocked the preview tab. Allow pop-ups for Coding Master.</p>`;
  } else {
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
}

function readShas(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SHA_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function writeShas(value: Record<string, string>) {
  try {
    localStorage.setItem(SHA_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function decodeBase64(value: string) {
  const binary = atob(String(value || "").replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

async function repositoriesView() {
  if (!window.CMGitHub?.isConnected()) {
    panelBody.innerHTML = `<p class="problem-row">Connect your GitHub account first.</p>`;
    return;
  }
  try {
    const list = await window.CMGitHub.listRepositories();
    document.getElementById("sideTitle")!.textContent = "GITHUB";
    sideContent.innerHTML =
      `<div class="github-panel-title">YOUR REPOSITORIES</div>` +
      (list.length
        ? list
            .map(
              (repository) =>
                `<button class="tree-file github-repo" type="button" data-repo="${escapeAttr(repository.full_name || "")}"><span class="file-icon text">${repository.private ? "◆" : "◇"}</span><span>${escapeHtml(repository.name || "Repository")}</span></button>`,
            )
            .join("")
        : `<div class="sidebar-note"><b>No repositories</b><span>No repositories were returned by GitHub.</span></div>`);

    sideContent.querySelectorAll<HTMLButtonElement>(".github-repo").forEach((button) => {
      button.addEventListener("click", () => {
        const item = list.find((repo) => repo.full_name === button.dataset.repo);
        if (item) void openRepository(item);
      });
    });
    panelBody.innerHTML = `<div>$ github repositories</div><p class="success-row">Loaded ${list.length} repository(s).</p>`;
  } catch (error) {
    panelBody.innerHTML = `<p class="problem-row">${escapeHtml((error as Error).message || "GitHub request failed.")}</p>`;
  }
}

async function openRepository(repository: any) {
  const selected = window.CMGitHub!.selectRepository(repository);
  if (!selected) return;
  try {
    const data = await window.CMGitHub!.getRepositoryTree(selected.owner, selected.name, selected.branch);
    const tree = data.tree.filter(
      (item: any) =>
        item.type === "blob" &&
        ["html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "md", "txt", "xml", "svg"].includes(extension(item.path)),
    );
    projectName.textContent = selected.full_name;
    document.getElementById("sideTitle")!.textContent = "GITHUB";
    sideContent.innerHTML =
      `<div class="github-repo-head"><b>${escapeHtml(selected.full_name)}</b><small>${escapeHtml(selected.branch)}</small></div>` +
      `<button class="github-back-btn" id="githubBackBtn" type="button">← Repositories</button>` +
      (tree.length
        ? tree
            .map(
              (item: any) =>
                `<button class="tree-file github-remote-file" type="button" data-path="${escapeAttr(item.path)}"><span class="file-icon ${iconClass(item.path)}">${iconText(item.path)}</span><span>${escapeHtml(item.path)}</span></button>`,
            )
            .join("")
        : `<div class="sidebar-note"><b>No code files</b><span>No supported text files were found.</span></div>`);

    document.getElementById("githubBackBtn")?.addEventListener("click", () => void repositoriesView());
    sideContent.querySelectorAll<HTMLButtonElement>(".github-remote-file").forEach((button) => {
      button.addEventListener("click", () => void openRemoteFile(button.dataset.path || ""));
    });
    panelBody.innerHTML = `<div>$ github repository</div><p class="success-row">Opened ${escapeHtml(selected.full_name)}.</p>`;
  } catch (error) {
    panelBody.innerHTML = `<p class="problem-row">${escapeHtml((error as Error).message || "Could not load the repository.")}</p>`;
  }
}

async function openRemoteFile(path: string) {
  const selected = window.CMGitHub!.getSelectedRepository();
  if (!selected) return;
  try {
    const data = await window.CMGitHub!.getRepositoryFile(selected.owner, selected.name, path, selected.branch);
    const key = normalizePath(path);
    const shas = readShas();
    state.files[key] = decodeBase64(data.content);
    shas[key] = data.sha || "";
    writeShas(shas);
    await persist();
    openFile(key);
    panelBody.innerHTML = `<div>$ github open</div><p class="success-row">Loaded ${escapeHtml(path)} from GitHub.</p>`;
  } catch (error) {
    panelBody.innerHTML = `<p class="problem-row">${escapeHtml((error as Error).message || "Could not open the GitHub file.")}</p>`;
  }
}

async function pushFile() {
  const selected = window.CMGitHub?.getSelectedRepository();
  if (!selected || !window.CMGitHub?.isConnected()) {
    panelBody.innerHTML = `<p class="problem-row">Connect GitHub and choose a repository first.</p>`;
    return;
  }
  state.files[currentFile] = cm.getValue();
  const message = prompt("Commit message", `Update ${currentFile} from Coding Master`);
  if (!message) return;
  const button = document.getElementById("githubPushBtn") as HTMLButtonElement | null;
  if (button) {
    button.disabled = true;
    button.textContent = "Pushing...";
  }
  try {
    const shas = readShas();
    const result = await window.CMGitHub.saveRepositoryFile(
      selected.owner,
      selected.name,
      currentFile,
      cm.getValue(),
      message,
      selected.branch,
      shas[currentFile] || null,
    );
    if (result?.content?.sha) {
      shas[currentFile] = result.content.sha;
      writeShas(shas);
    }
    panelBody.innerHTML = `<div>$ github push</div><p class="success-row">Commit created for ${escapeHtml(currentFile)} in ${escapeHtml(selected.full_name)}.</p>`;
  } catch (error) {
    panelBody.innerHTML = `<p class="problem-row">${escapeHtml((error as Error).message || "GitHub push failed.")}</p>`;
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "Push to GitHub";
    }
  }
}

function bindUi() {
  applyTheme(getTheme());
  const themeBtn = document.getElementById("themeBtn");
  themeBtn?.addEventListener("click", () => toggleTheme());

  document.getElementById("newFileBtn")?.addEventListener("click", () => void newFile(activeFolder));
  document.getElementById("newFolderBtn")?.addEventListener("click", () => void newFolder(activeFolder));
  document.getElementById("openFileBtn")?.addEventListener("click", async () => {
    if (desktop.isTauri()) {
      const picked = await desktop.openFile();
      if (!picked) return;
      const name = normalizePath(picked.name);
      state.files[name] = picked.content;
      state.nativePaths[name] = picked.path;
      folders = new Set();
      state.projectRootPath = await desktop.join(picked.path, "..");
      state.projectRoot = baseName(state.projectRootPath);
      await persist();
      currentFile = name;
      openFiles = [name];
      openFile(name);
      return;
    }
    filePicker.click();
  });
  document.getElementById("openFolderBtn")?.addEventListener("click", async () => {
    if (desktop.isTauri()) {
      const project = await desktop.openFolder();
      if (!project) return;
      if (!Object.keys(project.files).length) {
        panelBody.innerHTML = `<p class="problem-row">No supported code files were found in this folder.</p>`;
        return;
      }
      state.files = project.files;
      state.nativePaths = project.nativePaths;
      folders = new Set(project.folders || []);
      state.projectRoot = project.rootName || "CODING-MASTER";
      state.projectRootPath = project.rootPath || "";
      await persist();
      currentFile = firstIndexFile();
      openFiles = [currentFile];
      openFile(currentFile);
      return;
    }
    folderPicker.click();
  });

  filePicker.addEventListener("change", (event) => {
    void importFiles((event.target as HTMLInputElement).files || []);
    filePicker.value = "";
  });
  folderPicker.addEventListener("change", (event) => {
    void importFiles((event.target as HTMLInputElement).files || []);
    folderPicker.value = "";
  });

  document.getElementById("runBtn")?.addEventListener("click", () => void run());
  document.getElementById("saveBtn")?.addEventListener("click", () => void save());
  document.getElementById("chromeBtn")?.addEventListener("click", openPreview);
  document.getElementById("refreshBtn")?.addEventListener("click", () => void run());
  document.getElementById("githubPushBtn")?.addEventListener("click", () => void pushFile());
  document.getElementById("previewToggle")?.addEventListener("click", () => {
    const pane = document.getElementById("previewPane")!;
    pane.style.display = pane.style.display === "none" ? "flex" : "none";
  });
  document.getElementById("welcomeBtn")?.addEventListener("click", () => {
    localStorage.removeItem("cm-welcome-seen");
    location.href = "welcome.html";
  });

  document.querySelectorAll<HTMLButtonElement>(".activity[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".activity[data-view]").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      const view = button.dataset.view || "explorer";
      document.getElementById("sideTitle")!.textContent = view === "explorer" ? "EXPLORER" : view.toUpperCase();
      if (view === "github") {
        void repositoriesView();
        return;
      }
      if (view === "explorer") {
        renderExplorer();
        return;
      }
      sideContent.innerHTML = `<div class="sidebar-note"><b>${view.toUpperCase()}</b><span>Workspace tools are ready.</span></div>`;
    });
  });

  document.querySelectorAll<HTMLButtonElement>(".panel-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".panel-tab").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      if (button.dataset.panel === "problems") {
        const lint = lintCode(cm.getValue(), language(currentFile));
        panelBody.innerHTML = lint.messages.length
          ? lint.messages.map((message) => `<p class="problem-row">• ${escapeHtml(message)}</p>`).join("")
          : `<p class="success-row">No problems found.</p>`;
        return;
      }
      panelBody.innerHTML = `<div>${(button.dataset.panel || "").toUpperCase()}</div><p>Ready.</p>`;
    });
  });

  window.addEventListener("cm:github:repositories", () => void repositoriesView());

  window.addEventListener("keydown", (event) => {
    const mod = event.metaKey || event.ctrlKey;
    if (mod && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void save();
    }
    if (mod && event.key === "Enter") {
      event.preventDefault();
      void run();
    }
    if (mod && event.key.toLowerCase() === "n") {
      event.preventDefault();
      void newFile();
    }
  });

  document.addEventListener("dragover", (event) => event.preventDefault());
  document.addEventListener("drop", (event) => {
    event.preventDefault();
    if (!event.dataTransfer?.files?.length) return;
    void importFiles(event.dataTransfer.files);
  });
}

async function boot() {
  state = await loadProject();
  folders = new Set(state.folders || []);

  const requestedNewFile = localStorage.getItem("cm-new-file");
  if (requestedNewFile) {
    localStorage.removeItem("cm-new-file");
    currentFile = requestedNewFile;
    state.files[currentFile] = state.files[currentFile] || "";
    openFiles = [currentFile];
  }

  if (!(currentFile in state.files)) {
    currentFile = firstIndexFile();
    openFiles = [currentFile];
  }

  let persistTimer: number | undefined;
  cm = createCmEditor(editorHost, {
    file: currentFile,
    value: state.files[currentFile] || "",
    onChange: (value) => {
      state.files[currentFile] = value;
      updateStatus();
      window.clearTimeout(persistTimer);
      persistTimer = window.setTimeout(() => {
        void persist();
      }, 400);
    },
    onCursor: updateStatus,
  });

  bindUi();
  renderExplorer();
  renderTabs();
  openFile(currentFile);
  void run();
}

void boot();
