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
  const emptyState = () => ({ index: 0, view: "start", answers: {}, supplement: {} });
  let state = emptyState();
  let advanceTimer;
  const warmedImages = new Map();
  const reportSource = (report) => `./${report.image.replace(/\.(jpg|png)$/, ".webp")}`;
  function warmResult() {
    if (!hasAllAnswers()) return;
    const { report } = scoring.calculate(config, state.answers);
    for (const src of [reportSource(report), "./wechat-qr.jpg", "./wechat-original.jpg"]) {
      if (warmedImages.has(src)) continue;
      const image = new Image();
      image.fetchPriority = "high";
      image.src = src;
      warmedImages.set(src, image);
    }
  }
  function cancelAdvance() {
    clearTimeout(advanceTimer);
    advanceTimer = undefined;
  }
  function hasAllAnswers() {
    return questions.every((question) => question.options.some((option) => option.id === state.answers[question.id]));
  }
  function validField(field) {
    const value = state.supplement[field.id];
    if (field.type === "multiple") return Array.isArray(value) && value.length > 0
      && value.every((id) => field.options.some((option) => option.id === id));
    return typeof value === "string" && value.trim().length > 0
      && value.trim().length <= (field.title === "微信号/微信名" ? 64 : 2000);
  }
  function hasRequiredInfo() {
    return supplements.filter((field) => field.required).every(validField);
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
      if (["quiz", "supplement", "result"].includes(saved.view)) state.view = "quiz";
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
  function renderQuestionTitle(element, number, text, required) {
    const parts = [];
    if (required) {
      const mark = document.createElement("span");
      mark.className = "required-mark";
      mark.textContent = "*";
      mark.setAttribute("aria-hidden", "true");
      const accessibleLabel = document.createElement("span");
      accessibleLabel.className = "visually-hidden";
      accessibleLabel.textContent = "必填，";
      parts.push(mark, accessibleLabel);
    }
    const label = document.createElement("span");
    label.className = "question-number";
    label.textContent = `${number}. `;
    const title = document.createElement("span");
    title.className = "question-text";
    title.textContent = text;
    element.replaceChildren(...parts, label, title);
  }
  function setView(view) {
    cancelAdvance();
    state.view = view;
    document.body.dataset.view = view;
    document.body.dataset.question = String(state.index);
    for (const name of ["start", "quiz", "supplement", "result"]) byId(`${name}-view`).hidden = name !== view;
    byId("journey-header").hidden = view !== "quiz";
  }
  function renderStart() {
    setView("start");
    window.scrollTo(0, 0);
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
    renderQuestionTitle(byId("question-title"), state.index + 1, question.title, true);
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
    warmResult();
    const createField = (field, index) => {
      const group = document.createElement(field.type === "multiple" ? "fieldset" : "div");
      group.className = "supplement-field";
      group.id = `field-${field.id}`;
      const title = document.createElement(field.type === "multiple" ? "legend" : "label");
      renderQuestionTitle(title, questions.length + index + 1, field.title, field.required);
      title.htmlFor = `supplement-${field.id}`;
      group.append(title);
      if (field.type === "multiple") {
        if (field.required) group.setAttribute("aria-required", "true");
        for (const option of field.options) {
          const label = document.createElement("label");
          label.className = "check-option";
          const input = document.createElement("input");
          input.type = "checkbox";
          input.name = field.id;
          input.value = option.id;
          input.setAttribute("aria-describedby", `error-${field.id}`);
          input.checked = (state.supplement[field.id] || []).includes(option.id);
          label.append(input, document.createTextNode(option.text));
          group.append(label);
        }
      } else {
        const input = document.createElement(field.title === "微信号/微信名" ? "input" : "textarea");
        if (input.tagName === "INPUT") input.type = "text";
        input.id = `supplement-${field.id}`;
        input.name = field.id;
        input.maxLength = field.title === "微信号/微信名" ? 64 : 2000;
        if (field.required) {
          input.required = true;
          input.pattern = ".*\\S.*";
          input.autocomplete = "off";
          input.autocapitalize = "none";
          input.spellcheck = false;
          input.setAttribute("aria-describedby", `error-${field.id}`);
        }
        input.value = state.supplement[field.id] || "";
        group.append(input);
      }
      if (field.required) {
        const error = document.createElement("p");
        error.id = `error-${field.id}`;
        error.className = "contact-error";
        error.setAttribute("role", "status");
        group.append(error);
      }
      return group;
    };
    byId("supplement-fields").replaceChildren(...supplements.map(createField));
    validateFields();
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
    byId("report-image").src = reportSource(report);
    byId("report-image").alt = report.name;
    const teaser = document.querySelector(".report-teaser img");
    teaser.src = teaser.dataset.src;
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
  byId("start-button").addEventListener("click", () => {
    renderQuestion();
    window.scrollTo(0, 0);
    byId("question-title").focus({ preventScroll: true });
    persist();
  });
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
  function readSupplementForm() {
    const data = new FormData(byId("supplement-form"));
    for (const field of supplements) state.supplement[field.id] = field.type === "multiple"
      ? data.getAll(field.id) : String(data.get(field.id) || "");
  }
  function fieldControl(field) {
    return byId(`field-${field.id}`).querySelector("input, textarea");
  }
  function validateFields(showErrors = false) {
    for (const field of supplements.filter((item) => item.required)) {
      const valid = validField(field);
      const control = fieldControl(field);
      const message = field.type === "multiple" ? "请至少选择一个你感兴趣的课程方向。" : "请填写微信号，不能只填写空格。";
      control.setCustomValidity(valid ? "" : message);
      if (field.type === "multiple") control.required = !valid;
      byId(`error-${field.id}`).textContent = !valid && showErrors ? message : "";
    }
  }
  byId("supplement-form").addEventListener("input", () => {
    readSupplementForm();
    validateFields();
    persist();
  });
  byId("supplement-form").addEventListener("invalid", () => validateFields(true), true);
  byId("supplement-form").addEventListener("submit", (event) => {
    event.preventDefault();
    readSupplementForm();
    validateFields(true);
    if (!hasRequiredInfo()) {
      const field = supplements.find((item) => item.required && !validField(item));
      fieldControl(field).reportValidity();
      return;
    }
    for (const field of supplements.filter((item) => item.required && item.type === "text")) {
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
  byId("view-card").addEventListener("click", () => {
    const image = document.querySelector("#save-dialog > img");
    image.src = image.dataset.src;
    byId("save-dialog").showModal();
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
    byId("supplement-fields").replaceChildren();
    byId("restart-dialog").close();
    renderStart();
    persist();
  });
  if (state.view === "result") renderResult();
  else if (state.view === "supplement") renderSupplements();
  else if (state.view === "quiz") renderQuestion();
  else renderStart();
})();
