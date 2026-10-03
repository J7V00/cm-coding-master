export type DesktopAPI = {
  isTauri: () => boolean;
  openFile: () => Promise<{ path: string; name: string; content: string } | null>;
  openFolder: () => Promise<{
    rootPath: string;
    rootName: string;
    files: Record<string, string>;
    nativePaths: Record<string, string>;
    folders: string[];
  } | null>;
  readFolder: (rootPath: string) => Promise<{
    rootPath: string;
    rootName: string;
    files: Record<string, string>;
    nativePaths: Record<string, string>;
    folders: string[];
  }>;
  writeText: (path: string, content: string) => Promise<boolean>;
  makeDirectory: (path: string) => Promise<boolean>;
  runCommand: (command: string, cwd?: string) => Promise<{
    stdout: string;
    stderr: string;
    code: number;
  }>;
  join: (...parts: string[]) => Promise<string>;
  normalize: (value: string) => string;
  relativePath: (root: string, file: string) => string;
};

const TEXT_EXTENSIONS = new Set([
  "html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "md", "txt", "xml", "svg",
  "yml", "yaml", "toml", "ini", "env", "sql", "py", "rs", "java", "c", "cpp", "h", "hpp",
  "php", "go", "swift", "kt", "kts", "vue", "svelte",
]);

const SKIP_DIRS = new Set([
  ".git", "node_modules", ".next", "dist", "build", "target", ".venv", "venv", "__pycache__",
]);

function normalize(value: string): string {
  return String(value || "").replace(/\\/g, "/");
}

function ext(path: string): string {
  const name = normalize(path).split("/").pop() || "";
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

function relativePath(root: string, file: string): string {
  const r = normalize(root).replace(/\/+$/, "");
  const f = normalize(file);
  if (f.toLowerCase().startsWith((r + "/").toLowerCase())) {
    return f.slice(r.length + 1);
  }
  return f.split("/").pop() || f;
}

export function createDesktopAPI(): DesktopAPI {
  const T = window.__TAURI__ as any;
  const native = Boolean(T?.dialog && T?.fs && T?.shell);

  async function join(...parts: string[]): Promise<string> {
    if (T?.path?.join) return T.path.join(...parts);
    return parts.map(normalize).filter(Boolean).join("/");
  }

  async function readFolder(rootPath: string) {
    const files: Record<string, string> = {};
    const nativePaths: Record<string, string> = {};
    const folders = new Set<string>();
    const queue = [rootPath];
    let count = 0;

    while (queue.length && count < 2000) {
      const current = queue.shift()!;
      let entries: any[] = [];
      try {
        entries = await T.fs.readDir(current);
      } catch {
        continue;
      }

      for (const entry of entries) {
        if (!entry?.name) continue;
        const fullPath = await join(current, entry.name);

        if (entry.isDirectory) {
          if (SKIP_DIRS.has(entry.name)) continue;
          folders.add(relativePath(rootPath, fullPath));
          queue.push(fullPath);
          continue;
        }

        if (!TEXT_EXTENSIONS.has(ext(entry.name))) continue;

        try {
          const rel = relativePath(rootPath, fullPath);
          files[rel] = await T.fs.readTextFile(fullPath);
          nativePaths[rel] = fullPath;
          count++;
        } catch {
          /* skip unreadable */
        }
      }
    }

    return {
      rootPath,
      rootName: normalize(rootPath).split("/").pop() || "CODING-MASTER",
      files,
      nativePaths,
      folders: [...folders],
    };
  }

  return {
    isTauri: () => native,
    normalize,
    relativePath,
    join,
    readFolder,
    async openFile() {
      if (!native) return null;
      const selected = await T.dialog.open({
        directory: false,
        multiple: false,
        title: "Open File",
        filters: [{ name: "Code", extensions: [...TEXT_EXTENSIONS] }],
      });
      if (!selected || Array.isArray(selected)) return null;
      return {
        path: selected,
        name: normalize(selected).split("/").pop() || "untitled",
        content: await T.fs.readTextFile(selected),
      };
    },
    async openFolder() {
      if (!native) return null;
      const selected = await T.dialog.open({
        directory: true,
        multiple: false,
        recursive: true,
        title: "Open Folder",
      });
      if (!selected || Array.isArray(selected)) return null;
      return readFolder(selected);
    },
    async writeText(path, content) {
      if (!native) return false;
      await T.fs.writeTextFile(path, content);
      return true;
    },
    async makeDirectory(path) {
      if (!native) return false;
      await T.fs.mkdir(path, { recursive: true });
      return true;
    },
    async runCommand(command, cwd) {
      if (!native) throw new Error("The Terminal is available in the Coding Master desktop app.");
      const isWindows = /Windows/i.test(navigator.userAgent);
      const Command = T.shell.Command;
      if (!Command) throw new Error("Terminal support is not available in this build.");
      const process = isWindows
        ? Command.create("cm-powershell", ["-NoProfile", "-Command", command], cwd ? { cwd } : undefined)
        : Command.create("cm-shell", ["-lc", command], cwd ? { cwd } : undefined);
      return process.execute();
    },
  };
}

export function installDesktop(): DesktopAPI {
  const api = createDesktopAPI();
  window.CMDesktop = api;
  return api;
}
