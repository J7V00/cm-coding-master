export type Lang = "ar" | "en";

const STORAGE_KEY = "CMLang";

const dict = {
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    contact: "تواصل معنا",
    download: "التنزيلات",
    openEditor: "افتح المحرر",
    langBtn: "English",
    themeLight: "فاتح",
    themeDark: "داكن",
  },
  en: {
    home: "Home",
    about: "About Us",
    contact: "Contact Us",
    download: "Downloads",
    openEditor: "Open Editor",
    langBtn: "العربية",
    themeLight: "Light",
    themeDark: "Dark",
  },
} as const;

type PageApply = ((lang: Lang) => void) & { __cmUnified?: boolean };

let pageApplyLanguage: PageApply | null = null;
let ready = false;

export function getLang(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "ar";
}

export function t(key: keyof (typeof dict)["ar"], lang = getLang()): string {
  return dict[lang][key];
}

function applyDataAttributes(lang: Lang): void {
  document.querySelectorAll<HTMLElement>("[data-ar][data-en]").forEach((el) => {
    const value = lang === "en" ? el.dataset.en || "" : el.dataset.ar || "";
    if (el.dataset.i18nHtml === "1" || el.hasAttribute("data-i18n-html")) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "[data-ar-placeholder][data-en-placeholder]",
  ).forEach((el) => {
    el.placeholder =
      lang === "en"
        ? el.getAttribute("data-en-placeholder") || ""
        : el.getAttribute("data-ar-placeholder") || "";
  });

  document.querySelectorAll<HTMLImageElement>("[data-alt-ar][data-alt-en]").forEach((img) => {
    img.alt =
      lang === "en"
        ? img.getAttribute("data-alt-en") || ""
        : img.getAttribute("data-alt-ar") || "";
  });

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n as keyof (typeof dict)["ar"] | undefined;
    if (key && dict[lang][key]) el.textContent = dict[lang][key];
  });
}

function updateLangButtons(lang: Lang): void {
  const label = t("langBtn", lang);
  document.querySelectorAll("#btnLangText, .lang-text").forEach((el) => {
    el.textContent = label;
  });
}

export function applyLang(lang: Lang): void {
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.documentElement.dataset.lang = lang;

  applyDataAttributes(lang);

  if (pageApplyLanguage) {
    try {
      pageApplyLanguage(lang);
    } catch (error) {
      console.error("Page language apply failed:", error);
    }
  }

  updateLangButtons(lang);
  window.dispatchEvent(new CustomEvent("cm:langchange", { detail: { lang } }));
}

export function setLang(lang: Lang): void {
  applyLang(lang);
}

export function toggleLang(): Lang {
  const next: Lang = getLang() === "ar" ? "en" : "ar";
  applyLang(next);
  return next;
}

export function initI18n(): void {
  if (!ready) {
    const existing = window.applyLanguage as PageApply | undefined;
    if (typeof existing === "function" && !existing.__cmUnified) {
      pageApplyLanguage = existing;
    }
    ready = true;
  }

  const unified = ((lang: Lang) => applyLang(lang)) as PageApply;
  unified.__cmUnified = true;

  window.applyLanguage = unified;
  window.toggleLanguage = () => {
    toggleLang();
  };

  applyLang(getLang());
}

declare global {
  interface Window {
    toggleLanguage?: () => void;
    applyLanguage?: (lang: Lang) => void;
  }
}
