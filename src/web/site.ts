import "../styles/theme.css";
import "../styles/github.css";
import { mountSharedNav } from "../shared/nav";
import { installGitHub } from "../shared/github";
import { initI18n } from "../shared/i18n";
import { initTheme } from "../shared/theme";

function bindMobileMenu(): void {
  window.openMobileMenu = () => {
    document.getElementById("mobileMenuOverlay")?.classList.add("active");
  };
  window.closeMobileMenu = () => {
    document.getElementById("mobileMenuOverlay")?.classList.remove("active");
  };

  document.getElementById("mobileMenuOverlay")?.addEventListener("click", (event) => {
    if (event.target === event.currentTarget) window.closeMobileMenu?.();
  });
}

function boot(): void {
  bindMobileMenu();
  initI18n();
  mountSharedNav();
  initTheme();
  installGitHub();

  window.addEventListener("cm:langchange", () => {
    mountSharedNav();
  });
}

boot();

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

declare global {
  interface Window {
    openMobileMenu?: () => void;
    closeMobileMenu?: () => void;
  }
}
