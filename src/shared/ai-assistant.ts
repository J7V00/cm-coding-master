import { getSupabase } from "./supabase";

const PANEL_ID = "cmAiPanel";

type AiMessage = { role: "user" | "assistant" | "system"; content: string };

function panelHtml(lang: "ar" | "en"): string {
  const t =
    lang === "en"
      ? {
          title: "Code Master AI",
          placeholder: "Ask about your code, bugs, or next steps…",
          send: "Send",
          attach: "Attach image",
          empty: "Ask a coding question. Suggestions appear here before any file is changed.",
          close: "Close",
        }
      : {
          title: "مساعد Code Master",
          placeholder: "اسأل عن الكود أو الأخطاء أو الخطوة التالية…",
          send: "إرسال",
          attach: "إرفاق صورة",
          empty: "اطرح سؤالاً برمجيًا. الاقتراحات تظهر هنا قبل أي تعديل على الملفات.",
          close: "إغلاق",
        };

  return `
    <div class="cm-ai-shell" role="dialog" aria-label="${t.title}">
      <header class="cm-ai-head">
        <div>
          <b>${t.title}</b>
          <small>⌥⇧A</small>
        </div>
        <button type="button" class="cm-ai-close" data-ai-close aria-label="${t.close}">×</button>
      </header>
      <div class="cm-ai-messages" id="cmAiMessages">
        <p class="cm-ai-empty">${t.empty}</p>
      </div>
      <div class="cm-ai-compose">
        <input id="cmAiFile" type="file" accept="image/*" hidden>
        <button type="button" class="cm-ai-attach" data-ai-attach>${t.attach}</button>
        <textarea id="cmAiInput" rows="2" placeholder="${t.placeholder}"></textarea>
        <button type="button" class="cm-ai-send" data-ai-send>${t.send}</button>
      </div>
      <div class="cm-ai-status" id="cmAiStatus" hidden></div>
    </div>`;
}

function lang(): "ar" | "en" {
  return document.documentElement.lang === "en" ? "en" : "ar";
}

function ensurePanel(): HTMLElement {
  let root = document.getElementById(PANEL_ID);
  if (!root) {
    root = document.createElement("aside");
    root.id = PANEL_ID;
    root.className = "cm-ai-panel";
    root.hidden = true;
    root.innerHTML = panelHtml(lang());
    document.body.appendChild(root);
    wire(root);
  }
  return root;
}

function setStatus(text: string, kind: "ok" | "err" | "load" = "ok"): void {
  const el = document.getElementById("cmAiStatus");
  if (!el) return;
  el.hidden = !text;
  el.dataset.kind = kind;
  el.textContent = text;
}

function appendMessage(role: "user" | "assistant", content: string): void {
  const box = document.getElementById("cmAiMessages");
  if (!box) return;
  box.querySelector(".cm-ai-empty")?.remove();
  const row = document.createElement("div");
  row.className = `cm-ai-msg cm-ai-${role}`;
  row.textContent = content;
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

async function requestAi(messages: AiMessage[], imageDataUrl?: string | null): Promise<string> {
  const endpoint = import.meta.env.VITE_AI_PROXY_URL as string | undefined;
  const sb = getSupabase();

  if (endpoint) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const session = sb ? (await sb.auth.getSession()).data.session : null;
    if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ messages, image: imageDataUrl || null }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || `AI request failed (${response.status})`);
    }
    const data = await response.json();
    return String(data.reply || data.content || "");
  }

  // Local guidance mode when no proxy is configured — never embeds API secrets.
  const last = messages.filter((m) => m.role === "user").at(-1)?.content || "";
  return [
    lang() === "en"
      ? "AI proxy is not configured yet. Set VITE_AI_PROXY_URL to your secure backend."
      : "لم يتم إعداد خدمة الذكاء الاصطناعي بعد. عيّن VITE_AI_PROXY_URL لخادمك الآمن.",
    "",
    lang() === "en" ? `Your request: ${last}` : `طلبك: ${last}`,
    "",
    lang() === "en"
      ? "Suggested next step: open the related file, describe the bug, then apply changes only after you choose Keep."
      : "اقتراح: افتح الملف ذي الصلة، صف المشكلة، ثم طبّق التعديلات فقط بعد اختيار Keep.",
  ].join("\n");
}

let pendingImage: string | null = null;
const history: AiMessage[] = [];

function wire(root: HTMLElement): void {
  root.querySelector("[data-ai-close]")?.addEventListener("click", () => closeAi());
  root.querySelector("[data-ai-attach]")?.addEventListener("click", () => {
    document.getElementById("cmAiFile")?.click();
  });
  document.getElementById("cmAiFile")?.addEventListener("change", async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingImage = String(reader.result || "");
      setStatus(lang() === "en" ? "Image attached." : "تم إرفاق الصورة.", "ok");
    };
    reader.readAsDataURL(file);
  });
  root.querySelector("[data-ai-send]")?.addEventListener("click", () => void send());
  document.getElementById("cmAiInput")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  });
}

async function send(): Promise<void> {
  const input = document.getElementById("cmAiInput") as HTMLTextAreaElement | null;
  const text = input?.value.trim() || "";
  if (!text && !pendingImage) return;
  if (input) input.value = "";
  appendMessage("user", text || (lang() === "en" ? "(image)" : "(صورة)"));
  history.push({ role: "user", content: text || "[image]" });
  setStatus(lang() === "en" ? "Thinking…" : "جارٍ التحليل…", "load");
  try {
    const reply = await requestAi(history.slice(-12), pendingImage);
    pendingImage = null;
    history.push({ role: "assistant", content: reply });
    appendMessage("assistant", reply);
    setStatus("", "ok");
  } catch (error) {
    setStatus((error as Error).message || "AI error", "err");
  }
}

export function openAi(): void {
  const root = ensurePanel();
  root.hidden = false;
  document.getElementById("cmAiInput")?.focus();
}

export function closeAi(): void {
  const root = document.getElementById(PANEL_ID);
  if (root) root.hidden = true;
}

export function toggleAi(): void {
  const root = ensurePanel();
  if (root.hidden) openAi();
  else closeAi();
}

export function initAiAssistant(): void {
  ensurePanel();
  window.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.code === "KeyA") {
      event.preventDefault();
      toggleAi();
    }
  });
  document.querySelectorAll("[data-open-ai]").forEach((btn) => {
    btn.addEventListener("click", () => openAi());
  });
}
