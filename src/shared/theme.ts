export type Theme = "dark" | "light";

const STORAGE_KEY = "CMTheme";

export function getTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

export function applyTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#f4f6fb" : "#060709");
  }

  document.querySelectorAll<HTMLElement>("[data-theme-toggle]").forEach((btn) => {
    const isLight = theme === "light";
    btn.setAttribute("aria-pressed", String(isLight));
    btn.title = isLight ? "Dark mode" : "Light mode";
    const icon = btn.querySelector("[data-theme-icon]");
    const label = btn.querySelector("[data-theme-label]");
    if (icon) icon.textContent = isLight ? "☾" : "☀";
    if (label) label.textContent = isLight ? (document.documentElement.lang === "en" ? "Dark" : "داكن") : (document.documentElement.lang === "en" ? "Light" : "فاتح");
  });

  window.dispatchEvent(new CustomEvent("cm:themechange", { detail: { theme } }));
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

function makeThemeButton(extraClass = ""): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `theme-btn ${extraClass}`.trim();
  btn.setAttribute("data-theme-toggle", "1");
  btn.setAttribute("aria-label", "Toggle theme");
  btn.innerHTML = `<span data-theme-icon aria-hidden="true">☀</span><span data-theme-label></span>`;
  btn.addEventListener("click", () => toggleTheme());
  return btn;
}

function ensureThemeButtons(): void {
  // One control in the main header only.
  const headerHost =
    document.querySelector(".nav-left-icons") ||
    document.querySelector(".navbar .nav-right") ||
    document.querySelector("header.navbar");

  if (headerHost && !headerHost.querySelector(":scope > [data-theme-toggle]")) {
    const btn = makeThemeButton();
    const langBtn = headerHost.querySelector(".en-btn, .desktop-lang");
    if (langBtn) headerHost.insertBefore(btn, langBtn);
    else headerHost.appendChild(btn);
  }

  // Separate control inside the mobile drawer (hidden until menu opens).
  const mobileHost = document.querySelector(".mobile-menu-overlay .mobile-nav-links") ||
    document.querySelector(".mobile-menu-overlay");
  if (mobileHost && !mobileHost.querySelector("[data-theme-toggle]")) {
    const btn = makeThemeButton("mobile-theme-btn");
    const mobileLang = mobileHost.querySelector(".en-btn, .mobile-lang-btn");
    if (mobileLang) mobileLang.insertAdjacentElement("beforebegin", btn);
    else mobileHost.appendChild(btn);
  }
}

export function initTheme(): void {
  ensureThemeButtons();
  applyTheme(getTheme());

  window.toggleTheme = () => toggleTheme();

  window.addEventListener("cm:langchange", () => {
    applyTheme(getTheme());
  });
}

declare global {
  interface Window {
    toggleTheme?: () => void;
  }
}
