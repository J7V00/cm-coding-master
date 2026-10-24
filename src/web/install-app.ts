let deferred: BeforeInstallPromptEvent | null = null;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function initInstallApp(): void {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
  });

  document.getElementById("installAppBtn")?.addEventListener("click", async () => {
    if (deferred) {
      await deferred.prompt();
      deferred = null;
      return;
    }
    const lang = localStorage.getItem("CMLang") === "en" ? "en" : "ar";
    alert(
      lang === "en"
        ? "Open the browser menu and choose Add to Home Screen or Install App. On desktop, use the install icon in the address bar."
        : "من قائمة المتصفح اختر إضافة إلى الشاشة الرئيسية أو تثبيت التطبيق. على الكمبيوتر استخدم أيقونة التثبيت في شريط العنوان.",
    );
  });

  document.getElementById("openAppBtn")?.addEventListener("click", () => {
    location.href = "editor.html";
  });
}

initInstallApp();
