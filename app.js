(() => {
  "use strict";
  const config = window.assessmentConfig;
  const scoring = window.assessmentScoring;
  const byId = (id) => document.getElementById(id);
  if (!config?.questions?.length || !scoring) {
    byId("quiz-view").textContent = "题目暂未加载好，请刷新后再试。";
    return;
  }
  const { questions, modules, supplements } = config;
  const storageKey = `assessment:${config.id}`;
  const emptyState = () => ({ index: 0, view: "quiz", answers: {}, supplement: {} });
  let state = emptyState();
  let advanceTimer;
  let qrFile;
  if (location.protocol === "https:" || location.protocol === "http:") {
    fetch("./assets/wechat-qr.jpg").then((response) => {
      if (!response.ok) throw new Error("QR image unavailable");
      return response.blob();
    }).then((blob) => { qrFile = new File([blob], "元一-微信二维码.jpg", { type: "image/jpeg" }); })
      .catch(() => { /* The original image remains available for long-press saving. */ });
  }
  function cancelAdvance() {
    clearTimeout(advanceTimer);
    advanceTimer = undefined;
  }
  function hasAllAnswers() {
    return questions.every((question) => question.options.some((option) => option.id === state.answers[question.id]));
  }
  function hasRequiredInfo() {
    return supplements.filter((field) => field.required).every((field) => {
      const value = state.supplement[field.id];
      return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 64;
    });
  }
  // Storage is optional; blocked or malformed storage must not break the questionnaire.
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && saved.answers && typeof saved.answers === "object") {
      for (const question of questions) {
        const option = question.options.find((item) => item.id === saved.answers[question.id]);
        if (option) state.answers[question.id] = option.id;
      }
      const firstUnanswered = questions.findIndex((question) => state.answers[question.id] === undefined);
      const maxIndex = firstUnanswered === -1 ? questions.length - 1 : firstUnanswered;
      state.index = Number.isInteger(saved.index) ? Math.max(0, Math.min(maxIndex, saved.index)) : 0;
      if (["result", "supplement"].includes(saved.view) && hasAllAnswers()) state.view = saved.view;
      if (saved.supplement && typeof saved.supplement === "object") {
        for (const field of supplements) {
          const value = saved.supplement[field.id];
          if (field.type === "multiple" && Array.isArray(value)) {
            state.supplement[field.id] = field.options.filter((option) => value.includes(option.id)).map((option) => option.id);
          } else if (field.type === "text" && typeof value === "string") {
            state.supplement[field.id] = value.slice(0, 2000);
          }
        }
      }
    }
  } catch { /* Start fresh if storage is not accessible. */ }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Proceed without persistence. */ }
  }
  function focusHeading(id) {
    const element = byId(id);
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: "nearest" });
  }
  function setView(view) {
    cancelAdvance();
    state.view = view;
    document.body.dataset.view = view;
    document.body.dataset.question = String(state.index);
    for (const name of ["quiz", "supplement", "result"]) byId(`${name}-view`).hidden = name !== view;
    byId("journey-header").hidden = view === "result" || view === "supplement";
  }
  function renderProgress() {
    const question = questions[state.index];
    const currentModule = modules.findIndex((module) => module.id === question.module);
    const answered = questions.filter((item) => state.answers[item.id] !== undefined).length;
    byId("module-steps").replaceChildren(...modules.map((module, index) => {
      const step = document.createElement("li");
      step.className = "module-step";
      step.dataset.status = index < currentModule ? "done" : index === currentModule ? "current" : "future";
      if (index === currentModule) step.setAttribute("aria-current", "step");
      const number = document.createElement("span");
      number.className = "step-number";
      number.textContent = String(index + 1).padStart(2, "0");
      step.append(number, document.createTextNode(module.title));
      return step;
    }));
    byId("module-caption").textContent = modules[currentModule].caption;
    byId("total-count").textContent = `已完成 ${answered} / ${questions.length} 题`;
    const percent = Math.round(answered / questions.length * 100);
    byId("progress-fill").style.width = `${percent}%`;
    byId("progress").setAttribute("aria-valuenow", String(percent));
    byId("progress").setAttribute("aria-valuetext", `已完成 ${answered} 题，共 ${questions.length} 题`);
  }
  function renderQuestion(focus = false) {
    setView("quiz");
    renderProgress();
    const question = questions[state.index];
    const module = modules.find((item) => item.id === question.module);
    const moduleQuestions = questions.filter((item) => item.module === question.module);
    const moduleIndex = moduleQuestions.findIndex((item) => item.id === question.id);
    byId("question-category").textContent = `第 ${modules.indexOf(module) + 1} 站 · ${module.title}`;
    byId("question-count").textContent = `本节 ${moduleIndex + 1} / ${moduleQuestions.length}`;
    byId("question-title").textContent = question.title;
    byId("answer-options").replaceChildren(...question.options.map((option) => {
      const label = document.createElement("label");
      label.className = "answer-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "answer";
      input.value = option.id;
      input.required = true;
      input.checked = state.answers[question.id] === option.id;
      const letter = document.createElement("span");
      letter.className = "option-letter";
      letter.textContent = option.id;
      letter.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.className = "option-text";
      // Prefix moves into the letter marker; the source option text remains unchanged.
      text.textContent = option.text.replace(/^[A-Z][.\s]*/, "");
      label.append(input, letter, text);
      return label;
    }));
    byId("previous-button").disabled = state.index === 0;
    byId("next-button").disabled = state.answers[question.id] === undefined;
    byId("next-button").hidden = state.answers[question.id] === undefined;
    byId("next-button").textContent = state.index === questions.length - 1 ? "填写信息" : "下一题";
    if (focus) focusHeading("question-title");
  }
  function renderSupplements(focus = false) {
    setView("supplement");
    const createField = (field) => {
      const group = document.createElement(field.type === "multiple" ? "fieldset" : "div");
      group.className = "supplement-field";
      const title = document.createElement(field.type === "multiple" ? "legend" : "label");
      title.textContent = `${field.title}${field.required ? "（必填）" : ""}`;
      title.htmlFor = `supplement-${field.id}`;
      group.append(title);
      if (field.type === "multiple") {
        for (const option of field.options) {
          const label = document.createElement("label");
          label.className = "check-option";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.name = field.id;
          input.value = option.id;
          input.checked = (state.supplement[field.id] || []).includes(option.id);
          label.append(input, document.createTextNode(option.text));
          group.append(label);
        }
      } else {
        const input = document.createElement(field.title === "微信号/微信名" ? "input" : "textarea");
        if (input.tagName === "INPUT") input.type = "text";
        input.id = `supplement-${field.id}`;
        input.name = field.id;
        input.maxLength = field.required ? 64 : 2000;
        if (field.required) {
          input.required = true;
          input.pattern = ".*\\S.*";
          input.autocomplete = "off";
          input.autocapitalize = "none";
          input.spellcheck = false;
          input.setAttribute("aria-describedby", "contact-error");
        }
        input.value = state.supplement[field.id] || "";
        group.append(input);
      }
      if (field.required) {
        const error = document.createElement("p");
        error.id = "contact-error";
        error.className = "contact-error";
        error.setAttribute("role", "status");
        group.append(error);
      }
      return group;
    };
    byId("required-fields").replaceChildren(...supplements.filter((field) => field.required).map(createField));
    byId("supplement-fields").replaceChildren(...supplements.filter((field) => !field.required).map(createField));
    if (focus) focusHeading("supplement-title");
  }
  function renderResult(focus = false) {
    if (!hasAllAnswers()) {
      state.index = questions.findIndex((question) => state.answers[question.id] === undefined);
      renderQuestion(focus);
      return;
    }
    if (!hasRequiredInfo()) {
      renderSupplements(focus);
      return;
    }
    const { report } = scoring.calculate(config, state.answers);
    setView("result");
    byId("result-type").textContent = report.name;
    byId("result-trait").textContent = report.summary;
    byId("report-image").src = `./assets/${report.image}`;
    byId("report-image").alt = report.name;
    if (focus) {
      window.scrollTo(0, 0);
      byId("result-type").tabIndex = -1;
      byId("result-type").focus({ preventScroll: true });
    }
  }
  function scheduleAdvance() {
    cancelAdvance();
    const index = state.index;
    advanceTimer = setTimeout(() => {
      if (state.view === "quiz" && state.index === index) advanceQuestion();
    }, 320);
  }
  byId("quiz-form").addEventListener("change", (event) => {
    if (event.target.name !== "answer") return;
    const question = questions[state.index];
    if (!question.options.some((option) => option.id === event.target.value)) return;
    state.answers[question.id] = event.target.value;
    persist();
    byId("next-button").disabled = false;
    renderProgress();
    scheduleAdvance();
  });
  byId("quiz-form").addEventListener("click", (event) => {
    if (event.target.name === "answer" && state.answers[questions[state.index].id] === event.target.value) scheduleAdvance();
  });
  function advanceQuestion() {
    cancelAdvance();
    if (state.view !== "quiz") return;
    if (!questions[state.index].options.some((option) => option.id === state.answers[questions[state.index].id])) return;
    if (state.index === questions.length - 1) {
      if (!hasAllAnswers()) return;
      renderSupplements(true);
    } else {
      state.index += 1;
      renderQuestion(true);
    }
    persist();
  }
  byId("quiz-form").addEventListener("submit", (event) => {
    event.preventDefault();
    advanceQuestion();
  });
  byId("previous-button").addEventListener("click", () => {
    if (state.index === 0) return;
    state.index -= 1;
    renderQuestion(true);
    persist();
  });
  byId("supplement-button").addEventListener("click", () => { renderSupplements(true); persist(); });
  byId("supplement-form").addEventListener("input", () => {
    const data = new FormData(byId("supplement-form"));
    for (const field of supplements) state.supplement[field.id] = field.type === "multiple"
      ? data.getAll(field.id) : String(data.get(field.id) || "");
    const requiredField = supplements.find((field) => field.required);
    const input = byId(`supplement-${requiredField.id}`);
    input.setCustomValidity("");
    if (input.value && !input.value.trim()) {
      input.setCustomValidity("请输入微信号，不能只填写空格。");
      byId("contact-error").textContent = "请输入微信号，不能只填写空格。";
    } else byId("contact-error").textContent = "";
    persist();
  });
  byId("supplement-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!hasRequiredInfo()) {
      const requiredField = supplements.find((field) => field.required);
      const input = byId(`supplement-${requiredField.id}`);
      byId("contact-error").textContent = "请先填写微信号。";
      input.setCustomValidity("请先填写微信号。");
      input.reportValidity();
      return;
    }
    for (const field of supplements.filter((item) => item.required)) {
      state.supplement[field.id] = state.supplement[field.id].trim();
    }
    renderResult(true);
    persist();
  });
  byId("supplement-back").addEventListener("click", () => {
    state.index = questions.length - 1;
    renderQuestion(true);
    persist();
  });
  byId("save-qr").addEventListener("click", async () => {
    const button = byId("save-qr");
    const status = byId("save-status");
    status.textContent = "";
    try {
      if (qrFile && navigator.share && navigator.canShare?.({ files: [qrFile] })) {
        button.disabled = true;
        await navigator.share({ files: [qrFile] });
        status.textContent = "已关闭系统分享窗口。";
      } else byId("save-dialog").showModal();
    } catch (error) {
      if (error.name !== "AbortError") {
        status.textContent = "此浏览器暂不支持系统保存，可长按图片保存。";
        byId("save-dialog").showModal();
      }
    } finally { button.disabled = false; }
  });
  byId("close-save").addEventListener("click", () => byId("save-dialog").close());
  window.addEventListener("pagehide", cancelAdvance);
  byId("review-button").addEventListener("click", () => {
    state.index = 0;
    renderQuestion(true);
    persist();
  });
  byId("restart-button").addEventListener("click", () => byId("restart-dialog").showModal());
  byId("cancel-restart").addEventListener("click", () => byId("restart-dialog").close());
  byId("confirm-restart").addEventListener("click", () => {
    state = emptyState();
    byId("required-fields").replaceChildren();
    byId("supplement-fields").replaceChildren();
    byId("restart-dialog").close();
    renderQuestion(true);
    persist();
  });
  if (state.view === "result") renderResult();
  else if (state.view === "supplement") renderSupplements();
  else renderQuestion();
})();
