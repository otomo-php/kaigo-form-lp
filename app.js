const GAS_URL = "https://script.google.com/macros/s/AKfycbyvQ9QXF57GRTWbjrR209L6XKxzH1I4mIzqaSGCML6mXKXdlxGo3ilsbzqbxHO-Jxpt8w/exec";

const steps = [...document.querySelectorAll(".step")];
const form = document.getElementById("surveyForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const progressBar = document.getElementById("progressBar");
const stepLabel = document.getElementById("stepLabel");
const thanks = document.getElementById("thanks");

let currentStep = 1;
const totalSteps = steps.length;

function showStep(step) {
  steps.forEach(s => s.classList.remove("active"));
  document.querySelector(`.step[data-step="${step}"]`).classList.add("active");

  stepLabel.textContent = `STEP ${step} / ${totalSteps}`;
  progressBar.style.width = `${(step / totalSteps) * 100}%`;

  prevBtn.style.display = step === 1 ? "none" : "block";
  nextBtn.classList.toggle("hidden", step === totalSteps);
  submitBtn.classList.toggle("hidden", step !== totalSteps);
}

function getCheckedValues(name) {
  return [...document.querySelectorAll(`[name="${name}"]:checked`)].map(el => el.value);
}

function getValue(name) {
  const el = document.querySelector(`[name="${name}"]`);
  return el ? el.value.trim() : "";
}

function isChecked(name) {
  const el = document.querySelector(`[name="${name}"]`);
  return !!el && el.checked;
}

function setError(step, msg) {
  document.querySelector(`.step[data-step="${step}"] .error`).textContent = msg;
}

function clearError(step) {
  setError(step, "");
}

function validateStep(step) {
  clearError(step);

  if (step === 1) {
    if (getCheckedValues("qualification").length === 0) {
      setError(step, "資格を1つ以上選択してください。");
      return false;
    }
  }

  if (step === 2) {
    if (getCheckedValues("work_style").length === 0) {
      setError(step, "働き方を1つ以上選択してください。");
      return false;
    }
  }

  if (step === 3) {
    if (!document.querySelector('[name="timing"]:checked')) {
      setError(step, "転職時期を選択してください。");
      return false;
    }
  }

  if (step === 4) {
    const postal = getValue("postal_code");
    const pref = getValue("prefecture");
    if (!postal && !pref) {
      setError(step, "郵便番号または都道府県を入力してください。");
      return false;
    }
    if (postal && !/^\d{7}$/.test(postal)) {
      setError(step, "郵便番号は7桁の数字で入力してください。");
      return false;
    }
  }

  if (step === 5) {
    const name = getValue("full_name");
    const birthYear = getValue("birth_year");
    if (!name) {
      setError(step, "氏名を入力してください。");
      return false;
    }
    if (!/^\d{4}$/.test(birthYear)) {
      setError(step, "生まれ年を4桁で入力してください。");
      return false;
    }
  }

  if (step === 6) {
    const phone = getValue("phone");
    const email = getValue("email");
    const agreed = isChecked("terms_agreed");

    if (!/^\d{10,11}$/.test(phone)) {
      setError(step, "電話番号を10〜11桁の数字で入力してください。");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(step, "メールアドレスの形式が正しくありません。");
      return false;
    }
    if (!agreed) {
      setError(step, "利用規約への同意が必要です。");
      return false;
    }
  }

  return true;
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get("utm_source") || "",
    utm_medium: params.get("utm_medium") || "",
    utm_campaign: params.get("utm_campaign") || "",
    utm_content: params.get("utm_content") || ""
  };
}

nextBtn.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;
  currentStep++;
  showStep(currentStep);
});

prevBtn.addEventListener("click", () => {
  currentStep--;
  showStep(currentStep);
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateStep(currentStep)) return;

  const payload = {
    qualification: getCheckedValues("qualification"),
    work_style: getCheckedValues("work_style"),
    timing: document.querySelector('[name="timing"]:checked')?.value || "",
    postal_code: getValue("postal_code"),
    prefecture: getValue("prefecture"),
    full_name: getValue("full_name"),
    birth_year: getValue("birth_year"),
    phone: getValue("phone"),
    email: getValue("email"),
    offer_opt_in: isChecked("offer_opt_in"),
    terms_agreed: isChecked("terms_agreed"),
    lp_id: "kaigo_lp_01",
    user_agent: navigator.userAgent,
    referer: document.referrer,
    ...getUtmParams()
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "送信中...";

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "送信失敗");

    form.classList.add("hidden");
    thanks.classList.remove("hidden");

  } catch (err) {
    setError(currentStep, "送信に失敗しました。時間を置いて再度お試しください。");
    submitBtn.disabled = false;
    submitBtn.textContent = "送信する";
    console.error(err);
  }
});

showStep(currentStep);
