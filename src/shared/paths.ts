export function normalizePath(value: string): string {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "");
}

export function baseName(path: string): string {
  const parts = normalizePath(path).split("/");
  return parts[parts.length - 1] || path;
}

export function extension(path: string): string {
  const name = baseName(path).toLowerCase();
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1);
}

export function parentFolder(path: string): string {
  const clean = normalizePath(path);
  const slash = clean.lastIndexOf("/");
  return slash === -1 ? "" : clean.slice(0, slash);
}

export function language(file: string): string {
  const ext = extension(file);
  if (ext === "css") return "CSS";
  if (["js", "jsx", "ts", "tsx", "mjs", "cjs"].includes(ext)) return "JavaScript";
  if (ext === "json") return "JSON";
  if (["md", "txt", "xml", "svg"].includes(ext)) return "Text";
  return "HTML";
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"]/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch] || ch),
  );
}

export function escapeAttr(value: unknown): string {
  return escapeHtml(value).replace(/'/g, "&#039;");
}
