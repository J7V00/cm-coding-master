import { getSupabase } from "../shared/supabase";
import { escapeHtml } from "../shared/paths";

type MessageRow = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  account_code?: string;
  message?: string;
  subject?: string;
  status?: string;
  created_at?: string;
};

const GATE_KEY = "cm-admin-gate";

function expectedGate(): string {
  // Prefer env. Never ship a default production secret in source.
  return String(import.meta.env.VITE_ADMIN_GATE || "");
}

function lang(): "ar" | "en" {
  return localStorage.getItem("CMLang") === "en" ? "en" : "ar";
}

async function unlock(): Promise<void> {
  const input = document.getElementById("adminPassInput") as HTMLInputElement | null;
  const value = input?.value || "";
  const expected = expectedGate();

  if (!expected) {
    alert(
      lang() === "en"
        ? "Admin gate is not configured. Set VITE_ADMIN_GATE in your environment."
        : "بوابة الإدارة غير مُعدّة. عيّن VITE_ADMIN_GATE في البيئة.",
    );
    return;
  }

  if (value !== expected) {
    alert(lang() === "en" ? "Incorrect password." : "كلمة المرور غير صحيحة!");
    return;
  }

  sessionStorage.setItem(GATE_KEY, "1");
  document.getElementById("loginCard")!.style.display = "none";
  document.getElementById("dashboardContainer")!.style.display = "block";
  await fetchMessages();
}

async function loadRows(): Promise<MessageRow[]> {
  const api = String(import.meta.env.VITE_ADMIN_API_URL || "");
  if (api) {
    const response = await fetch(api, {
      headers: { "x-admin-gate": expectedGate() },
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Admin API failed");
    return (json.data || []) as MessageRow[];
  }

  const sb = getSupabase();
  if (!sb) throw new Error("Supabase unavailable");
  const { data, error } = await sb.from("messages").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as MessageRow[];
}

async function mutate(action: "update" | "delete", payload: Record<string, unknown>): Promise<void> {
  const api = String(import.meta.env.VITE_ADMIN_API_URL || "");
  if (api) {
    const response = await fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-gate": expectedGate(),
      },
      body: JSON.stringify({ action, ...payload }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error || "Admin API failed");
    return;
  }
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase unavailable");
  if (action === "update") {
    const { error } = await sb.from("messages").update({ status: payload.status }).eq("id", payload.id);
    if (error) throw error;
    return;
  }
  const { error } = await sb.from("messages").delete().eq("id", payload.id);
  if (error) throw error;
}

async function fetchMessages(): Promise<void> {
  const tbody = document.getElementById("messagesTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;">${
    lang() === "en" ? "Loading…" : "جاري تحميل الرسائل..."
  }</td></tr>`;

  let rows: MessageRow[] = [];
  try {
    rows = await loadRows();
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:#ef4444;">${escapeHtml((error as Error).message)}</td></tr>`;
    return;
  }
  const count = document.getElementById("totalMsgCount");
  if (count) count.textContent = String(rows.length);

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;">${
      lang() === "en" ? "No messages yet." : "لا يوجد رسائل حتى الآن."
    }</td></tr>`;
    return;
  }

  tbody.innerHTML = "";
  rows.forEach((msg, index) => {
    const dateFormatted = new Date(msg.created_at || Date.now()).toLocaleString(lang() === "en" ? "en-US" : "ar-SA");
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${escapeHtml(msg.name || "")}</strong></td>
      <td>${escapeHtml(msg.email || "")}</td>
      <td>${escapeHtml(msg.subject || "contact")}</td>
      <td><span class="secret-code">${escapeHtml(msg.account_code || "---")}</span></td>
      <td><span dir="ltr">${escapeHtml(msg.phone || "")}</span></td>
      <td class="msg-text-cell">${escapeHtml(msg.message || "")}</td>
      <td>
        <select data-status="${msg.id}">
          <option value="new" ${msg.status === "new" ? "selected" : ""}>${lang() === "en" ? "New" : "جديدة"}</option>
          <option value="processing" ${msg.status === "processing" ? "selected" : ""}>${lang() === "en" ? "Processing" : "قيد المعالجة"}</option>
          <option value="done" ${msg.status === "done" ? "selected" : ""}>${lang() === "en" ? "Done" : "تمت الإجابة"}</option>
        </select>
      </td>
      <td style="font-size:0.85rem;color:#a1a6b0;">${dateFormatted}</td>
      <td><button class="delete-btn" data-del="${msg.id}" type="button"><i class="fas fa-trash"></i></button></td>`;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll<HTMLSelectElement>("[data-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      try {
        await mutate("update", { id: Number(select.dataset.status), status: select.value });
      } catch (error) {
        alert((error as Error).message);
      }
    });
  });

  tbody.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = Number(button.dataset.del);
      if (!confirm(lang() === "en" ? "Delete this message?" : "هل أنت متأكد من حذف هذه الرسالة؟")) return;
      try {
        await mutate("delete", { id });
        await fetchMessages();
      } catch (error) {
        alert((error as Error).message);
      }
    });
  });
}

function logout(): void {
  sessionStorage.removeItem(GATE_KEY);
  location.reload();
}

export function initAdminPanel(): void {
  window.checkAdminPass = () => {
    void unlock();
  };
  window.fetchMessages = () => {
    void fetchMessages();
  };
  window.logoutAdmin = logout;

  if (sessionStorage.getItem(GATE_KEY) === "1" && expectedGate()) {
    document.getElementById("loginCard")!.style.display = "none";
    document.getElementById("dashboardContainer")!.style.display = "block";
    void fetchMessages();
  }

  const bar = document.querySelector(".stats-bar");
  if (bar && !document.getElementById("adminLogoutBtn")) {
    const btn = document.createElement("button");
    btn.id = "adminLogoutBtn";
    btn.className = "refresh-btn";
    btn.type = "button";
    btn.textContent = lang() === "en" ? "Sign out" : "تسجيل الخروج";
    btn.addEventListener("click", logout);
    bar.appendChild(btn);
  }
}

declare global {
  interface Window {
    checkAdminPass?: () => void;
    fetchMessages?: () => void;
    logoutAdmin?: () => void;
  }
}

initAdminPanel();
