import { get, set, del } from "idb-keyval";

const FILES_KEY = "cm-project-files";
const ROOT_KEY = "cm-project-root";
const FOLDERS_KEY = "cm-project-folders";
const NATIVE_PATHS_KEY = "cm-native-file-paths";
const NATIVE_ROOT_KEY = "cm-native-root-path";
const META_KEY = "cm-project-meta";

export type ProjectState = {
  files: Record<string, string>;
  folders: string[];
  projectRoot: string;
  projectRootPath: string;
  nativePaths: Record<string, string>;
};

const DEFAULT_FILES: Record<string, string> = {
  "index.html": `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>Coding Master</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<main class="card">
<h1>مرحبًا بك</h1>
<p>ابدأ بكتابة فكرتك هنا.</p>
<button onclick="hello()">جرّب JavaScript</button>
</main>
<script src="script.js"><\/script>
</body>
</html>`,
  "style.css": `*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b0b;color:#fff;font-family:Tajawal,sans-serif}
.card{width:min(520px,calc(100% - 40px));padding:34px;border:1px solid #333;border-radius:18px;background:#151515}
button{padding:10px 14px;border:0;border-radius:8px;cursor:pointer}`,
  "script.js": `function hello(){alert("JavaScript يعمل");}`,
};

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function migrateFromLocalStorage(): Promise<ProjectState | null> {
  const files = readLocal<Record<string, string> | null>(FILES_KEY, null);
  if (!files || typeof files !== "object" || !Object.keys(files).length) {
    return null;
  }

  const state: ProjectState = {
    files: { ...DEFAULT_FILES, ...files },
    folders: readLocal<string[]>(FOLDERS_KEY, []),
    projectRoot: localStorage.getItem(ROOT_KEY) || "CODING-MASTER",
    projectRootPath: localStorage.getItem(NATIVE_ROOT_KEY) || "",
    nativePaths: readLocal<Record<string, string>>(NATIVE_PATHS_KEY, {}),
  };

  await saveProject(state);
  return state;
}

export async function loadProject(): Promise<ProjectState> {
  const meta = await get<ProjectState>(META_KEY);
  if (meta?.files && Object.keys(meta.files).length) {
    return meta;
  }

  const migrated = await migrateFromLocalStorage();
  if (migrated) return migrated;

  return {
    files: { ...DEFAULT_FILES },
    folders: [],
    projectRoot: "CODING-MASTER",
    projectRootPath: "",
    nativePaths: {},
  };
}

export async function saveProject(state: ProjectState): Promise<void> {
  await set(META_KEY, state);

  // Keep a small localStorage mirror for welcome.html handoff / older paths.
  try {
    localStorage.setItem(FILES_KEY, JSON.stringify(state.files));
    localStorage.setItem(ROOT_KEY, state.projectRoot);
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(state.folders));
    localStorage.setItem(NATIVE_PATHS_KEY, JSON.stringify(state.nativePaths));
    if (state.projectRootPath) {
      localStorage.setItem(NATIVE_ROOT_KEY, state.projectRootPath);
    } else {
      localStorage.removeItem(NATIVE_ROOT_KEY);
    }
  } catch {
    // Quota exceeded is fine; IndexedDB is the source of truth.
  }
}

export async function clearProject(): Promise<void> {
  await del(META_KEY);
}

export { DEFAULT_FILES };
