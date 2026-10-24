import { getSupabase } from "../shared/supabase";

function lang(): "ar" | "en" {
  return localStorage.getItem("CMLang") === "en" ? "en" : "ar";
}

function showModal(ok: boolean, message: string): void {
  const overlay = document.getElementById("modalOverlay");
  const title = document.getElementById("modalTitle");
  const text = document.getElementById("modalText");
  if (title) title.textContent = ok ? (lang() === "en" ? "Sent" : "تم الإرسال") : lang() === "en" ? "Error" : "خطأ";
  if (text) text.textContent = message;
  overlay?.classList.add("active");
}

export async function sendContact(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.target as HTMLFormElement;
  const btn = document.getElementById("btnSubmit") as HTMLButtonElement | null;
  const fd = new FormData(form);

  const name = String(fd.get("name") || fd.get("fullName") || "").trim();
  const email = String(fd.get("email") || "").trim();
  const message = String(fd.get("message") || "").trim();
  const country = String(fd.get("country_code") || "").trim();
  const phoneRaw = String(fd.get("phone") || "").trim();
  const phone = [country, phoneRaw].filter(Boolean).join(" ").trim();
  const account_code = String(fd.get("account_code") || fd.get("accountCode") || fd.get("zip") || "").trim();
  const subject = String(fd.get("subject") || fd.get("type") || "contact").trim();

  if (!name || !email || !message) {
    showModal(false, lang() === "en" ? "Please fill the required fields." : "يرجى تعبئة الحقول المطلوبة.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showModal(false, lang() === "en" ? "Enter a valid email." : "أدخل بريدًا إلكترونيًا صالحًا.");
    return;
  }

  const sb = getSupabase();
  if (!sb) {
    showModal(false, lang() === "en" ? "Backend is unavailable." : "الخدمة الخلفية غير متاحة.");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = lang() === "en" ? "Sending..." : "جاري الإرسال...";
  }

  try {
    const { error } = await sb.from("messages").insert({
      name,
      email,
      phone,
      account_code,
      message,
      subject,
      status: "new",
    });
    if (error) throw error;
    form.reset();
    showModal(true, lang() === "en" ? "Your message was saved successfully." : "تم حفظ رسالتك بنجاح.");
  } catch (error) {
    showModal(
      false,
      (error as Error).message ||
        (lang() === "en" ? "Could not save the message. Try again." : "تعذر حفظ الرسالة. حاول مجددًا."),
    );
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML =
        lang() === "en"
          ? 'Send Message <i class="fas fa-paper-plane"></i>'
          : 'إرسال الرسالة <i class="fas fa-paper-plane"></i>';
    }
  }
}

window.sendEmail = (event: Event) => {
  void sendContact(event);
};

declare global {
  interface Window {
    sendEmail?: (event: Event) => void;
  }
}
