import { toggleTheme, getTheme } from "../shared/theme";
import { escapeAttr, escapeHtml } from "../shared/paths";

const SETTINGS_KEY = "cm-ide-settings";
const EXT_KEY = "cm-ide-extensions";
const SNAP_KEY = "cm-ide-snapshot";

export type IdeSettings = {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autosave: boolean;
};

export type IdeHost = {
  files: () => Record<string, string>;
  currentFile: () => string;
  getValue: () => string;
  openFile: (file: string) => void;
  run: () => void | Promise<void>;
  save: () => void | Promise<void>;
  newFile: () => void;
  projectRoot: () => string;
  projectRootPath: () => string;
  isDesktop: () => boolean;
  runCommand?: (command: string, cwd?: string) => Promise<{ stdout: string; stderr: string; code: number }>;
};

const DEFAULT_SETTINGS: IdeSettings = {
  fontSize: 13,
  tabSize: 2,
  wordWrap: false,
  minimap: false,
  autosave: true,
};

const EXTENSIONS = [
  { id: "preview", name: "Live Preview", detail: "Run HTML/CSS/JS beside the editor." },
  { id: "lint", name: "Problems", detail: "Show HTML, CSS, JS, and JSON issues." },
  { id: "github", name: "GitHub", detail: "Sign in, browse repos, and push files." },
  { id: "format", name: "Format Document", detail: "Trim trailing spaces and normalize indentation." },
  { id: "snippets", name: "HTML Snippets", detail: "Insert a starter page with ⌘⇧H." },
];

export function loadSettings(): IdeSettings {
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Partial<IdeSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: IdeSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applyEditorSettings(settings);
  window.dispatchEvent(new CustomEvent("cm:settings", { detail: settings }));
}

export function applyEditorSettings(settings = loadSettings()): void {
  document.documentElement.style.setProperty("--editor-font", `${settings.fontSize}px`);
  document.documentElement.style.setProperty("--editor-tab", String(settings.tabSize));
  document.documentElement.dataset.wordWrap = settings.wordWrap ? "1" : "0";
}

function enabledExtensions(): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(EXT_KEY) || "null");
    if (Array.isArray(saved)) return new Set(saved);
  } catch {
    /* ignore */
  }
  return new Set(EXTENSIONS.map((item) => item.id));
}

function writeExtensions(ids: Set<string>): void {
  localStorage.setItem(EXT_KEY, JSON.stringify([...ids]));
}

export function extensionOn(id: string): boolean {
  return enabledExtensions().has(id);
}

function snapshot(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SNAP_KEY) || "{}");
  } catch {
    return {};
  }
}

export function checkpoint(files: Record<string, string>): void {
  localStorage.setItem(SNAP_KEY, JSON.stringify(files));
}

const titles: Record<string, string> = {
  explorer: "EXPLORER",
  search: "SEARCH",
  source: "SOURCE CONTROL",
  run: "RUN AND DEBUG",
  github: "GITHUB",
  extensions: "EXTENSIONS",
  settings: "SETTINGS",
};

export function viewTitle(view: string): string {
  return titles[view] || view.toUpperCase();
}

export function renderSearch(host: IdeHost, side: HTMLElement): void {
  side.innerHTML = `
    <div class="ide-pad">
      <input id="ideSearch" class="ide-input" type="search" placeholder="Search in files" autocomplete="off">
      <div id="ideSearchResults" class="ide-list"></div>
    </div>`;
  const input = side.querySelector<HTMLInputElement>("#ideSearch")!;
  const results = side.querySelector<HTMLElement>("#ideSearchResults")!;
  const paint = () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.innerHTML = `<p class="ide-muted">Type to search every open project file.</p>`;
      return;
    }
    const hits: string[] = [];
    for (const [path, content] of Object.entries(host.files())) {
      const lines = content.split("\n");
      lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query)) {
          hits.push(
            `<button type="button" class="ide-hit" data-file="${escapeAttr(path)}" data-line="${index + 1}"><b>${escapeHtml(path)}</b><span>${escapeHtml(line.trim().slice(0, 120))}</span></button>`,
          );
        }
      });
    }
    results.innerHTML = hits.slice(0, 80).join("") || `<p class="ide-muted">No matches.</p>`;
    results.querySelectorAll<HTMLButtonElement>(".ide-hit").forEach((button) => {
      button.addEventListener("click", () => host.openFile(button.dataset.file || ""));
    });
  };
  input.addEventListener("input", paint);
  input.focus();
  paint();
}

export function renderSource(host: IdeHost, side: HTMLElement): void {
  const base = snapshot();
  const files = host.files();
  const changed = Object.keys(files).filter((path) => (base[path] ?? "") !== files[path]);
  side.innerHTML = `
    <div class="ide-pad">
      <button id="ideCheckpoint" class="ide-btn" type="button">Checkpoint changes</button>
      <p class="ide-muted">${changed.length} changed file(s) since the last checkpoint.</p>
      <div class="ide-list">
        ${
          changed.length
            ? changed
                .map(
                  (path) =>
                    `<button type="button" class="ide-hit" data-file="${escapeAttr(path)}"><b>M</b><span>${escapeHtml(path)}</span></button>`,
                )
                .join("")
            : `<p class="ide-muted">Working tree is clean.</p>`
        }
      </div>
    </div>`;
  side.querySelector("#ideCheckpoint")?.addEventListener("click", () => {
    checkpoint(host.files());
    renderSource(host, side);
  });
  side.querySelectorAll<HTMLButtonElement>(".ide-hit").forEach((button) => {
    button.addEventListener("click", () => host.openFile(button.dataset.file || ""));
  });
}

export function renderRun(host: IdeHost, side: HTMLElement): void {
  side.innerHTML = `
    <div class="ide-pad">
      <button id="ideRun" class="ide-btn primary" type="button">▶ Run preview</button>
      <button id="ideBrowser" class="ide-btn" type="button">Open in browser</button>
      <p class="ide-muted">Runs the project index in the live preview. HTML, CSS, and JS files are bundled together.</p>
    </div>`;
  side.querySelector("#ideRun")?.addEventListener("click", () => void host.run());
  side.querySelector("#ideBrowser")?.addEventListener("click", () => {
    document.getElementById("chromeBtn")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

export function renderExtensions(side: HTMLElement): void {
  const on = enabledExtensions();
  side.innerHTML = `
    <div class="ide-pad">
      <p class="ide-muted">Built-in extensions. Turn them on or off for this workspace.</p>
      ${EXTENSIONS.map(
        (item) => `
        <label class="ide-ext">
          <input type="checkbox" data-ext="${item.id}" ${on.has(item.id) ? "checked" : ""}>
          <span><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.detail)}</small></span>
        </label>`,
      ).join("")}
    </div>`;
  side.querySelectorAll<HTMLInputElement>("[data-ext]").forEach((input) => {
    input.addEventListener("change", () => {
      const next = enabledExtensions();
      if (input.checked) next.add(input.dataset.ext || "");
      else next.delete(input.dataset.ext || "");
      writeExtensions(next);
    });
  });
}

export function renderSettings(side: HTMLElement): void {
  const settings = loadSettings();
  side.innerHTML = `
    <div class="ide-pad">
      <label class="ide-field">Font size <input id="setFont" class="ide-input" type="number" min="10" max="24" value="${settings.fontSize}"></label>
      <label class="ide-field">Tab size <input id="setTab" class="ide-input" type="number" min="2" max="8" value="${settings.tabSize}"></label>
      <label class="ide-ext"><input id="setWrap" type="checkbox" ${settings.wordWrap ? "checked" : ""}><span><b>Word wrap</b></span></label>
      <label class="ide-ext"><input id="setSave" type="checkbox" ${settings.autosave ? "checked" : ""}><span><b>Autosave</b><small>Writes the project while you type.</small></span></label>
      <button id="setTheme" class="ide-btn" type="button">Theme: ${getTheme() === "light" ? "Light" : "Dark"}</button>
    </div>`;
  const commit = () => {
    saveSettings({
      fontSize: Number((side.querySelector("#setFont") as HTMLInputElement).value) || 13,
      tabSize: Number((side.querySelector("#setTab") as HTMLInputElement).value) || 2,
      wordWrap: (side.querySelector("#setWrap") as HTMLInputElement).checked,
      minimap: false,
      autosave: (side.querySelector("#setSave") as HTMLInputElement).checked,
    });
  };
  side.querySelectorAll("input").forEach((input) => input.addEventListener("change", commit));
  side.querySelector("#setTheme")?.addEventListener("click", () => {
    toggleTheme();
    renderSettings(side);
  });
}

const history: Array<{ text: string; kind: string }> = [
  { text: "Coding Master terminal", kind: "status" },
  { text: "Type help to see commands.", kind: "output" },
];

export function renderTerminal(host: IdeHost, panel: HTMLElement): void {
  panel.innerHTML = `
    <div class="cm-terminal">
      <div class="cm-terminal-history" id="cmTerminalHistory"></div>
      <div class="cm-terminal-line">
        <span class="cm-terminal-prompt">$</span>
        <input class="cm-terminal-input" type="text" autocomplete="off" spellcheck="false" placeholder="help, ls, cat, clear, or a shell command">
      </div>
    </div>`;
  const box = panel.querySelector<HTMLElement>("#cmTerminalHistory")!;
  history.forEach((item) => {
    const row = document.createElement("div");
    row.className = `cm-terminal-row ${item.kind}`;
    row.textContent = item.text;
    box.appendChild(row);
  });
  const input = panel.querySelector<HTMLInputElement>(".cm-terminal-input")!;
  input.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    const command = input.value.trim();
    input.value = "";
    if (!command) return;
    history.push({ text: `$ ${command}`, kind: "command" });
    await runLocalCommand(host, command);
    renderTerminal(host, panel);
  });
  input.focus();
}

async function runLocalCommand(host: IdeHost, command: string): Promise<void> {
  const [name, ...rest] = command.split(/\s+/);
  const arg = rest.join(" ");
  if (name === "help") {
    history.push({
      text: "help  ls  cat <file>  pwd  clear  echo <text>\nDesktop app: other commands run in the system shell.",
      kind: "output",
    });
    return;
  }
  if (name === "clear") {
    history.splice(0, history.length);
    return;
  }
  if (name === "pwd") {
    history.push({ text: host.projectRootPath() || host.projectRoot() || "/", kind: "output" });
    return;
  }
  if (name === "ls") {
    history.push({ text: Object.keys(host.files()).sort().join("\n") || "(empty)", kind: "output" });
    return;
  }
  if (name === "echo") {
    history.push({ text: arg, kind: "output" });
    return;
  }
  if (name === "cat") {
    const file = host.files()[arg];
    history.push({ text: file ?? `No such file: ${arg}`, kind: file == null ? "error" : "output" });
    return;
  }
  if (host.isDesktop() && host.runCommand) {
    try {
      const result = await host.runCommand(command, host.projectRootPath() || undefined);
      if (result.stdout) history.push({ text: result.stdout.trimEnd(), kind: "output" });
      if (result.stderr) history.push({ text: result.stderr.trimEnd(), kind: "error" });
      history.push({ text: `exit ${result.code ?? 0}`, kind: "status" });
    } catch (error) {
      history.push({ text: (error as Error).message || "Command failed.", kind: "error" });
    }
    return;
  }
  history.push({
    text: "That command runs in the Coding Master desktop app. In the browser, use help, ls, cat, echo, pwd, and clear.",
    kind: "error",
  });
}

export function openCommandPalette(host: IdeHost, panel: HTMLElement): void {
  const commands = [
    ["New File", () => host.newFile()],
    ["Open File", () => document.getElementById("openFileBtn")?.click()],
    ["Open Folder", () => document.getElementById("openFolderBtn")?.click()],
    ["Save", () => void host.save()],
    ["Run Preview", () => void host.run()],
    ["Toggle Theme", () => toggleTheme()],
    ["Settings", () => document.querySelector<HTMLButtonElement>('.activity[data-view="settings"]')?.click()],
    ["Extensions", () => document.querySelector<HTMLButtonElement>('.activity[data-view="extensions"]')?.click()],
    ["Search", () => document.querySelector<HTMLButtonElement>('.activity[data-view="search"]')?.click()],
    ["Terminal", () => document.querySelector<HTMLButtonElement>('.panel-tab[data-panel="terminal"]')?.click()],
  ] as const;
  panel.innerHTML = `<div class="cm-command-palette">${commands
    .map(([label], index) => `<button type="button" data-i="${index}">${escapeHtml(label)}</button>`)
    .join("")}</div>`;
  panel.querySelectorAll<HTMLButtonElement>("[data-i]").forEach((button) => {
    button.addEventListener("click", () => commands[Number(button.dataset.i)][1]());
  });
}

export function formatDocument(source: string, tabSize: number): string {
  const pad = " ".repeat(tabSize);
  return source
    .replace(/\t/g, pad)
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n");
}
