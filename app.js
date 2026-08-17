(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const cfg = window.SURVEY_CONFIG || {};
  const totalSteps = 5;
  let step = 1;
  let startedAt = null;

  const consent = $("#consent");
  const startBtn = $("#startBtn");
  const surveyShell = $("#surveyShell");
  const form = $("#surveyForm");
  const progressBar = $("#progressBar");
  const progressPct = $("#progressPct");
  const progressLabel = $("#progressLabel");
  const successState = $("#successState");
  const screenedOut = $("#screenedOut");
  const submitError = $("#submitError");
  const submitErrorText = $("#submitErrorText");

  consent?.addEventListener("change", () => startBtn.disabled = !consent.checked);
  startBtn?.addEventListener("click", () => {
    startedAt = new Date();
    $(".hero").classList.add("hidden");
    surveyShell.classList.remove("hidden");
    showStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function showStep(n) {
    step = n;
    $$(".step").forEach(el => el.classList.toggle("hidden", Number(el.dataset.step) !== n));
    const pct = Math.round(((n - 1) / totalSteps) * 100);
    progressBar.style.width = `${pct}%`;
    progressPct.textContent = `${pct}%`;
    progressLabel.textContent = `第 ${n} / ${totalSteps} 段`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectedValues(name) {
    return $$(`[name="${name}"]:checked`).map(el => el.value);
  }

  function validateStep(n) {
    const section = $(`.step[data-step="${n}"]`);
    let valid = true;
    $$("fieldset[data-required='true']", section).forEach(fs => {
      const q = fs.dataset.question;
      const error = $(".field-error", fs);
      if (error) error.textContent = "";
      let ok = true;
      const checks = q ? $$(`input[type="checkbox"][name="${q}"]`, fs) : [];
      const radios = q ? $$(`input[type="radio"][name="${q}"]`, fs) : [];
      const select = q ? $(`select[name="${q}"]`, fs) : null;
      if (checks.length) ok = checks.some(el => el.checked);
      else if (radios.length) ok = radios.some(el => el.checked);
      else if (select) ok = Boolean(select.value);
      if (!ok) {
        valid = false;
        if (error) error.textContent = "請完成這一題。";
      }
      const max = Number(fs.dataset.max || 0);
      if (max && checks.filter(el => el.checked).length > max) {
        valid = false;
        if (error) error.textContent = `最多只能選 ${max} 項。`;
      }
    });
    if (!valid) $(".field-error:not(:empty)", section)?.scrollIntoView({ behavior: "smooth", block: "center" });
    return valid;
  }

  $$(".next-btn").forEach(btn => btn.addEventListener("click", () => {
    if (!validateStep(step)) return;
    if (step === 1 && selectedValues("q1").includes("none")) {
      form.classList.add("hidden");
      $(".progress-wrap").classList.add("hidden");
      screenedOut.classList.remove("hidden");
      return;
    }
    showStep(Math.min(totalSteps, step + 1));
  }));

  $$(".prev-btn").forEach(btn => btn.addEventListener("click", () => showStep(Math.max(1, step - 1))));

  $$("input[type='checkbox']").forEach(input => {
    input.addEventListener("change", () => {
      const fs = input.closest("fieldset");
      if (!fs) return;
      const name = input.name;
      if (input.dataset.exclusive === "true" && input.checked) {
        $$(`input[name="${name}"]`, fs).forEach(other => { if (other !== input) other.checked = false; });
      } else if (input.checked) {
        const exclusive = $(`input[name="${name}"][data-exclusive="true"]`, fs);
        if (exclusive) exclusive.checked = false;
      }
      const max = Number(fs.dataset.max || 0);
      const checked = $$(`input[type="checkbox"][name="${name}"]:checked`, fs);
      const error = $(".field-error", fs);
      if (max && checked.length > max) {
        input.checked = false;
        if (error) error.textContent = `最多只能選 ${max} 項。`;
      } else if (error) error.textContent = "";
    });
  });

  function getParam(name) {
    return new URLSearchParams(location.search).get(name) || "";
  }

  function getAnswers() {
    const fd = new FormData(form);
    const answer = {};
    for (const [key, value] of fd.entries()) {
      if (answer[key] === undefined) answer[key] = value;
      else if (Array.isArray(answer[key])) answer[key].push(value);
      else answer[key] = [answer[key], value];
    }
    ["q1","q5","q8","q10","q11","q12","q14","q15"].forEach(q => {
      if (answer[q] === undefined) answer[q] = [];
      else if (!Array.isArray(answer[q])) answer[q] = [answer[q]];
    });
    return answer;
  }

  function randomId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return "r_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  async function submitToSupabase(payload) {
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) throw new Error("Supabase 尚未設定。請先填寫 config.js。");
    const url = `${cfg.SUPABASE_URL}/rest/v1/${cfg.RESPONSES_TABLE || "survey_responses"}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        apikey: cfg.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`資料庫回傳 ${res.status}: ${await res.text()}`);
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateStep(5)) return;
    const answers = getAnswers();
    const now = new Date();
    const payload = {
      respondent_id: randomId(),
      source: getParam("source") || answers.q16 || "unknown",
      campaign: getParam("campaign") || "",
      answers,
      started_at: startedAt?.toISOString() || now.toISOString(),
      completed_at: now.toISOString(),
      duration_seconds: startedAt ? Math.max(0, Math.round((now - startedAt) / 1000)) : null,
      user_agent: navigator.userAgent.slice(0, 500),
      referrer: document.referrer?.slice(0, 1000) || null
    };
    const submitBtn = $('button[type="submit"]', form);
    submitBtn.disabled = true;
    submitBtn.textContent = "送出中…";
    try {
      await submitToSupabase(payload);
      form.classList.add("hidden");
      $(".progress-wrap").classList.add("hidden");
      successState.classList.remove("hidden");
      if (answers.q18 === "yes") $("#followUpBlock").classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      submitErrorText.textContent = err.message || "送出失敗，請稍後再試。";
      submitError.classList.remove("hidden");
      submitError.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "送出匿名回答";
    }
  });
})();
