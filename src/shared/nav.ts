import { getLang, t } from "./i18n";

const LINKS = [
  { href: "index.html", key: "home" as const, match: ["/", "/index.html", "index.html"] },
  { href: "about.html", key: "about" as const, match: ["/about.html", "about.html"] },
  { href: "contact.html", key: "contact" as const, match: ["/contact.html", "contact.html"] },
  { href: "download.html", key: "download" as const, match: ["/download.html", "download.html"] },
];

function currentPath(): string {
  const path = location.pathname.replace(/\/+$/, "") || "/";
  if (path.endsWith(".html")) return path.split("/").pop() || path;
  if (path === "/") return "index.html";
  return `${path.split("/").pop()}.html`;
}

/** Mark active nav item and keep labels in sync with current language. */
export function mountSharedNav(): void {
  const path = currentPath();
  const lang = getLang();

  document.querySelectorAll(".nav-pill a, .desktop-nav a, .mobile-nav-links a").forEach((anchor) => {
    const a = anchor as HTMLAnchorElement;
    const href = (a.getAttribute("href") || "").split("?")[0];
    const file = href.split("/").pop() || href;
    const link = LINKS.find((item) => item.match.includes(file) || href.endsWith(item.href));
    if (!link) return;

    // Prefer data-ar/data-en when present; otherwise dictionary.
    if (a.hasAttribute("data-ar") && a.hasAttribute("data-en")) {
      a.textContent = lang === "en" ? a.dataset.en || "" : a.dataset.ar || "";
    } else {
      a.textContent = t(link.key, lang);
    }

    a.classList.toggle(
      "active",
      link.match.includes(path) || link.match.includes(`/${path}`),
    );
  });
}
