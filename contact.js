(() => {
  const cfg = window.SURVEY_CONFIG || {};
  const form = document.querySelector("#contactForm");
  const success = document.querySelector("#contactSuccess");
  const errorBox = document.querySelector("#contactError");
  const errorText = document.querySelector("#contactErrorText");

  async function submit(payload) {
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_PUBLISHABLE_KEY) {
      throw new Error("Supabase 尚未設定。請先填寫 config.js 的 Project URL 與 Publishable key。");
    }
    const url = `${cfg.SUPABASE_URL}/rest/v1/${cfg.CONTACTS_TABLE || "survey_contacts"}`;
    const res = await fetch(url, {
      method:"POST",
      headers:{
        apikey:cfg.SUPABASE_PUBLISHABLE_KEY,
        "Content-Type":"application/json",
        Prefer:"return=minimal"
      },
      body:JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`送出失敗 (${res.status})`);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const channel = form.querySelector('[name="channel"]:checked')?.value;
    const contact = form.querySelector('[name="contact"]').value.trim();
    const note = form.querySelector('[name="note"]').value.trim();
    if (!channel || !contact) {
      errorText.textContent = "請選擇聯絡方式並填寫聯絡資料。";
      errorBox.classList.remove("hidden");
      return;
    }
    try {
      await submit({ channel, contact, note, created_at:new Date().toISOString() });
      form.classList.add("hidden");
      errorBox.classList.add("hidden");
      success.classList.remove("hidden");
    } catch (err) {
      errorText.textContent = err.message || "送出失敗。";
      errorBox.classList.remove("hidden");
    }
  });
})();
