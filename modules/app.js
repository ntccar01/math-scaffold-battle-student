(function () {
  "use strict";

  const data = window.MathGameData;
  const { createBalancedPlan, arrangeOptions } = window.AnswerOrder;
  const profileStore = window.StudentProfileStore;
  const legacyStorageKey = "math-scaffold-battle-1-1-v2";
  const unitId = "M3-1-1";
  const totalSteps = data.questions.reduce((sum, question) => sum + question.steps.length, 0);
  const totalQuestions = data.questions.length;
  const xpPerQuestion = 10;
  const maxXp = totalQuestions * xpPerQuestion;
  const $ = (selector) => document.querySelector(selector);

  const els = {
    stageKind: $("#stage-kind"),
    stageTitle: $("#stage-title"),
    questionCount: $("#question-count"),
    questionTotal: $("#question-total"),
    enemyRank: $("#enemy-rank"),
    enemyName: $("#enemy-name"),
    enemySigil: $("#enemy-sigil"),
    shieldValue: $("#shield-value"),
    shieldMeter: $("#shield-meter"),
    focusValue: $("#focus-value"),
    focusMeter: $("#focus-meter"),
    combatCallout: $("#combat-callout"),
    combatField: $("#combat-field"),
    stepLabel: $("#step-label"),
    stepFill: $("#step-fill"),
    sourceReference: $("#source-reference"),
    missionLabel: $("#mission-label"),
    taskTitle: $("#task-title"),
    questionMath: $("#question-math"),
    questionVisual: $("#question-visual"),
    answerOptions: $("#answer-options"),
    answerForm: $("#answer-form"),
    feedbackPanel: $("#feedback-panel"),
    hintButton: $("#hint-button"),
    hintLevel: $("#hint-level"),
    hintPanel: $("#hint-panel"),
    hintHeadingLevel: $("#hint-heading-level"),
    hintCopy: $("#hint-copy"),
    formulaDialog: $("#formula-dialog"),
    formulaSheet: $("#formula-sheet"),
    roadmapDialog: $("#roadmap-dialog"),
    roadmapTitle: $("#roadmap-title"),
    roadmapCopy: $("#roadmap-copy"),
    victoryDialog: $("#victory-dialog"),
    victoryTitle: $("#victory-title"),
    victoryAnswer: $("#victory-answer"),
    victoryCopy: $("#victory-copy"),
    victoryRewardNote: $("#victory-reward-note"),
    nextQuestionButton: $("#next-question-button"),
    xpText: $("#xp-text"),
    xpFill: $("#xp-fill"),
    motionToggle: $("#motion-toggle"),
    studentIdentity: $("#student-identity"),
    studentProfileButton: $("#student-profile-button"),
    profileDialog: $("#profile-dialog"),
    profileDialogClose: $("#profile-dialog-close"),
    savedProfilesSection: $("#saved-profiles-section"),
    profileList: $("#profile-list"),
    createProfileForm: $("#create-profile-form"),
    profileFormFeedback: $("#profile-form-feedback"),
    learningDialog: $("#learning-dialog"),
    learningDialogClose: $("#learning-dialog-close"),
    learningDialogDone: $("#learning-dialog-done"),
    learningStudentName: $("#learning-student-name"),
    learningStudentMeta: $("#learning-student-meta"),
    learningCurrentProgress: $("#learning-current-progress"),
    learningCompleted: $("#learning-completed"),
    learningAttempts: $("#learning-attempts"),
    learningWrong: $("#learning-wrong"),
    learningHints: $("#learning-hints"),
    learningPractice: $("#learning-practice"),
    learningPracticeDetail: $("#learning-practice-detail"),
    learningTime: $("#learning-time"),
    learningErrorList: $("#learning-error-list"),
    switchProfileButton: $("#switch-profile-button"),
    deleteProfileButton: $("#delete-profile-button"),
    stageSelectorCopy: $("#stage-selector-copy"),
    stageList: $("#stage-list"),
    studyModeBanner: $("#study-mode-banner"),
    studyModeTitle: $("#study-mode-title"),
    studyModeCopy: $("#study-mode-copy"),
    replayQuestionButton: $("#replay-question-button"),
    stepNavigation: $("#step-navigation"),
    previousStepButton: $("#previous-step-button"),
    returnProgressButton: $("#return-progress-button"),
    nextStepButton: $("#next-step-button"),
    answerSubmitButton: $("#answer-submit-button"),
    appShell: $(".app-shell")
  };

  const emptyState = () => ({
    questionIndex: 0,
    stepIndex: 0,
    xp: 0,
    focus: 100,
    hintLevel: 0,
    mistakes: [],
    completedQuestionIds: [],
    learningSummary: {},
    eventLog: [],
    lastInteractionAt: null,
    lastInteractionQuestionId: null,
    lastInteractionMode: null,
    answerPositionPlan: createBalancedPlan(totalSteps, 3),
    optionOrders: {},
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  });

  function isValidPositionPlan(plan) {
    if (!Array.isArray(plan) || plan.length !== totalSteps) return false;
    const counts = [0, 0, 0];
    for (const position of plan) {
      if (!Number.isInteger(position) || position < 0 || position > 2) return false;
      counts[position] += 1;
    }
    return Math.max(...counts) - Math.min(...counts) <= 1;
  }

  function normalizeState(saved) {
    const next = { ...emptyState(), ...saved };
    const resetAnswerOrder = !isValidPositionPlan(next.answerPositionPlan);
    if (resetAnswerOrder) {
      next.answerPositionPlan = createBalancedPlan(totalSteps, 3);
    }
    if (resetAnswerOrder || !next.optionOrders || typeof next.optionOrders !== "object" || Array.isArray(next.optionOrders)) {
      next.optionOrders = {};
    }
    next.questionIndex = Math.max(0, Math.min(totalQuestions - 1, Number(next.questionIndex) || 0));
    next.stepIndex = Math.max(0, Math.min(data.questions[next.questionIndex].steps.length - 1, Number(next.stepIndex) || 0));
    next.xp = Math.max(0, Math.min(maxXp, Number(next.xp) || 0));
    if (!Array.isArray(next.mistakes)) next.mistakes = [];
    if (!Array.isArray(next.completedQuestionIds)) next.completedQuestionIds = [];
    if (!next.learningSummary || typeof next.learningSummary !== "object" || Array.isArray(next.learningSummary)) next.learningSummary = {};
    if (!Array.isArray(next.eventLog)) next.eventLog = [];
    next.eventLog = next.eventLog.slice(-200);
    if (next.completedQuestionIds.length === 0 && next.xp > 0) {
      const completedCount = Math.min(totalQuestions, Math.floor(next.xp / xpPerQuestion));
      next.completedQuestionIds = data.questions.slice(0, completedCount).map((question) => question.id);
    }
    const knownQuestionIds = new Set(data.questions.map((question) => question.id));
    next.completedQuestionIds = [...new Set(next.completedQuestionIds.filter((questionId) => knownQuestionIds.has(questionId)))];
    const firstUnfinishedQuestion = data.questions.findIndex((question) => !next.completedQuestionIds.includes(question.id));
    if (firstUnfinishedQuestion === -1) {
      next.questionIndex = totalQuestions - 1;
      next.stepIndex = data.questions[totalQuestions - 1].steps.length - 1;
      next.hintLevel = 0;
    } else if (next.completedQuestionIds.includes(data.questions[next.questionIndex].id)) {
      next.questionIndex = firstUnfinishedQuestion;
      next.stepIndex = 0;
      next.hintLevel = 0;
    }
    return next;
  }

  let activeProfile = profileStore.getActiveProfile();

  function loadState() {
    if (new URLSearchParams(location.search).has("reset")) {
      if (activeProfile) profileStore.clearUnitState(activeProfile.id, unitId);
      localStorage.removeItem(legacyStorageKey);
      return emptyState();
    }
    if (!activeProfile) return emptyState();
    const savedState = profileStore.loadUnitState(activeProfile.id, unitId);
    try {
      if (savedState) return normalizeState(savedState);
      const legacyState = profileStore.readLegacyState(legacyStorageKey);
      if (!legacyState) return emptyState();
      const migratedState = normalizeState(legacyState);
      if (profileStore.saveUnitState(activeProfile.id, unitId, migratedState)) {
        profileStore.markLegacyMigrated(activeProfile.id, legacyStorageKey);
      }
      return migratedState;
    } catch {
      return emptyState();
    }
  }

  let state = loadState();

  function isQuestionCompleted(questionIndex) {
    return state.completedQuestionIds.includes(data.questions[questionIndex].id);
  }

  function isUnitCompleted() {
    return data.questions.every((question) => state.completedQuestionIds.includes(question.id));
  }

  function createProgressView() {
    const completed = isUnitCompleted();
    return {
      mode: completed ? "review" : "progress",
      questionIndex: state.questionIndex,
      stepIndex: completed ? data.questions[state.questionIndex].steps.length - 1 : state.stepIndex,
      hintLevel: 0,
      focus: 100
    };
  }

  let view = createProgressView();

  function syncViewToProgress() {
    view = createProgressView();
  }

  function isReviewMode() {
    return view.mode === "review";
  }

  function isPracticeMode() {
    return view.mode === "practice";
  }

  function currentHintLevel() {
    if (isPracticeMode()) return view.hintLevel;
    if (isReviewMode()) return 0;
    return state.hintLevel;
  }

  function currentFocus() {
    if (isPracticeMode()) return view.focus;
    if (isReviewMode()) return 100;
    return state.focus;
  }

  function reviewStepLimit(questionIndex) {
    if (isQuestionCompleted(questionIndex) || questionIndex < state.questionIndex) {
      return data.questions[questionIndex].steps.length - 1;
    }
    if (questionIndex === state.questionIndex) return state.stepIndex - 1;
    return -1;
  }

  function saveState() {
    if (!activeProfile) return;
    profileStore.saveUnitState(activeProfile.id, unitId, state);
  }

  function ensureQuestionSummary(questionId) {
    const saved = state.learningSummary[questionId] || {};
    state.learningSummary[questionId] = {
      attempts: 0,
      correctSteps: 0,
      wrongAnswers: 0,
      hintsUsed: 0,
      maxHintLevel: 0,
      activeMs: 0,
      errorTags: {},
      startedAt: new Date().toISOString(),
      lastActiveAt: null,
      completedAt: null,
      reviewVisits: 0,
      practiceRuns: 0,
      practiceCompletions: 0,
      practiceAttempts: 0,
      practiceCorrectSteps: 0,
      practiceWrongAnswers: 0,
      practiceHintsUsed: 0,
      practiceMaxHintLevel: 0,
      practiceActiveMs: 0,
      practiceErrorTags: {},
      lastPracticedAt: null,
      ...saved,
      errorTags: saved.errorTags && typeof saved.errorTags === "object" ? saved.errorTags : {},
      practiceErrorTags: saved.practiceErrorTags && typeof saved.practiceErrorTags === "object" ? saved.practiceErrorTags : {}
    };
    return state.learningSummary[questionId];
  }

  function recordActivity(type, details = {}) {
    const now = new Date();
    const questionId = currentQuestion().id;
    const summary = ensureQuestionSummary(questionId);
    const mode = details.mode || view.mode;
    const isPractice = mode === "practice";
    const recordsTime = mode !== "review";
    if (recordsTime && state.lastInteractionAt && state.lastInteractionQuestionId === questionId && state.lastInteractionMode === mode) {
      const elapsed = now.getTime() - new Date(state.lastInteractionAt).getTime();
      if (Number.isFinite(elapsed) && elapsed > 0) {
        const timeKey = isPractice ? "practiceActiveMs" : "activeMs";
        summary[timeKey] += Math.min(elapsed, 5 * 60 * 1000);
      }
    }
    state.lastInteractionAt = now.toISOString();
    state.lastInteractionQuestionId = questionId;
    state.lastInteractionMode = mode;
    if (recordsTime) summary.lastActiveAt = now.toISOString();

    if (mode === "review") {
      if (type === "open") summary.reviewVisits += 1;
    } else if (isPractice) {
      summary.lastPracticedAt = now.toISOString();
      if (type === "start") {
        summary.practiceRuns += 1;
      } else if (type === "answer") {
        summary.practiceAttempts += 1;
        if (details.correct) {
          summary.practiceCorrectSteps += 1;
        } else {
          summary.practiceWrongAnswers += 1;
          if (details.errorTag) {
            summary.practiceErrorTags[details.errorTag] = (summary.practiceErrorTags[details.errorTag] || 0) + 1;
          }
        }
      } else if (type === "hint") {
        summary.practiceHintsUsed += 1;
        summary.practiceMaxHintLevel = Math.max(summary.practiceMaxHintLevel, Number(details.hintLevel) || 0);
      } else if (type === "complete") {
        summary.practiceCompletions += 1;
      }
    } else if (type === "answer") {
      summary.attempts += 1;
      if (details.correct) {
        summary.correctSteps += 1;
      } else {
        summary.wrongAnswers += 1;
        if (details.errorTag) {
          summary.errorTags[details.errorTag] = (summary.errorTags[details.errorTag] || 0) + 1;
        }
      }
    } else if (type === "hint") {
      summary.hintsUsed += 1;
      summary.maxHintLevel = Math.max(summary.maxHintLevel, Number(details.hintLevel) || 0);
    } else if (type === "complete") {
      summary.completedAt = now.toISOString();
      if (!state.completedQuestionIds.includes(questionId)) state.completedQuestionIds.push(questionId);
    }

    state.eventLog.push({
      type: mode === "progress" ? type : `${mode}_${type}`,
      mode,
      questionId,
      step: view.stepIndex + 1,
      correct: details.correct,
      errorTag: details.errorTag || undefined,
      hintLevel: details.hintLevel || undefined,
      at: now.toISOString()
    });
    state.eventLog = state.eventLog.slice(-200);
  }

  function currentQuestion() {
    return data.questions[view.questionIndex];
  }

  function currentStep() {
    return currentQuestion().steps[view.stepIndex];
  }

  function globalStepIndex() {
    let index = view.stepIndex;
    for (let questionIndex = 0; questionIndex < view.questionIndex; questionIndex += 1) {
      index += data.questions[questionIndex].steps.length;
    }
    return index;
  }

  function orderedOptions(question, step) {
    const key = `${question.id}:${view.stepIndex}`;
    const savedOrder = state.optionOrders[key];
    if (Array.isArray(savedOrder) && savedOrder.length === step.options.length) {
      const restored = savedOrder.map((id) => step.options.find((option) => option.id === id));
      if (restored.every(Boolean)) return restored;
    }

    const correctPosition = state.answerPositionPlan[globalStepIndex()];
    const arranged = arrangeOptions(step.options, correctPosition);
    state.optionOrders[key] = arranged.map((option) => option.id);
    return arranged;
  }

  function renderOption(item, index, readOnly = false) {
    const passedClass = readOnly && item.correct ? " is-passed-answer" : "";
    const checked = readOnly && item.correct ? " checked" : "";
    const disabled = readOnly ? " disabled" : "";
    return `<label class="answer-card${passedClass}">
      <input type="radio" name="answer" value="${item.id}"${checked}${disabled}>
      <span class="option-key">${String.fromCharCode(65 + index)}</span>
      <span class="option-content">${item.html}</span>
    </label>`;
  }

  function scrollTaskIntoView() {
    $("#task-panel").scrollIntoView({ behavior: state.reducedMotion ? "auto" : "smooth", block: "start" });
  }

  function renderStageSelector() {
    const unitCompleted = isUnitCompleted();
    if (isPracticeMode()) {
      els.stageSelectorCopy.textContent = "目前為不計分複習；完成或離開複習後可再選擇其他已解鎖關卡。";
    } else if (isReviewMode()) {
      els.stageSelectorCopy.textContent = "查看模式不會改變正式進度；已通過關卡可重新練習，但不重複計分。";
    } else {
      els.stageSelectorCopy.textContent = "可點回已通過關卡查看；目前關卡請由正式進度繼續。";
    }

    els.stageList.replaceChildren();
    data.questions.forEach((question, questionIndex) => {
      const completed = isQuestionCompleted(questionIndex);
      const currentProgress = !unitCompleted && questionIndex === state.questionIndex;
      const displayed = questionIndex === view.questionIndex;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stage-choice";
      button.classList.toggle("is-completed", completed);
      button.classList.toggle("is-progress", currentProgress);
      button.classList.toggle("is-viewing", displayed);
      button.classList.toggle("is-practicing", displayed && isPracticeMode());
      button.disabled = isPracticeMode() || (!completed && !currentProgress);
      if (displayed) button.setAttribute("aria-current", "step");

      const number = document.createElement("span");
      number.className = "stage-choice-number";
      number.textContent = `第 ${questionIndex + 1} 題`;
      const title = document.createElement("strong");
      title.textContent = question.title;
      const status = document.createElement("small");
      if (displayed && isPracticeMode()) {
        status.textContent = "不計分複習中";
      } else if (completed) {
        status.textContent = "✓ 已通過・可查看";
      } else if (currentProgress) {
        status.textContent = "進行中・繼續作答";
      } else {
        status.textContent = "尚未解鎖";
      }
      button.append(number, title, status);
      button.addEventListener("click", () => {
        if (completed) {
          enterReview(questionIndex, 0, true);
        } else if (currentProgress) {
          returnToProgress();
        }
      });
      els.stageList.append(button);
    });
  }

  function renderStudyControls() {
    const review = isReviewMode();
    const practice = isPracticeMode();
    const completedQuestion = isQuestionCompleted(view.questionIndex);
    els.studyModeBanner.hidden = !review && !practice;
    els.replayQuestionButton.hidden = !review || !completedQuestion;

    if (review) {
      els.studyModeTitle.textContent = completedQuestion ? "✓ 已通過・查看模式" : "✓ 已完成步驟・查看模式";
      els.studyModeCopy.textContent = "選項已鎖定，只能查看；回看不會改變正式進度或學習紀錄。";
    } else if (practice) {
      els.studyModeTitle.textContent = "重新練習・不計分";
      els.studyModeCopy.textContent = "可正常作答並觸發戰鬥動畫，但不增加經驗、金幣或正式成績。";
    }

    if (practice) {
      els.stepNavigation.hidden = true;
      return;
    }

    if (!review) {
      const canReviewPrevious = view.stepIndex > 0;
      els.stepNavigation.hidden = !canReviewPrevious;
      els.previousStepButton.hidden = !canReviewPrevious;
      els.previousStepButton.disabled = !canReviewPrevious;
      els.returnProgressButton.hidden = true;
      els.nextStepButton.hidden = true;
      return;
    }

    const reviewLimit = reviewStepLimit(view.questionIndex);
    els.stepNavigation.hidden = false;
    els.previousStepButton.hidden = false;
    els.previousStepButton.disabled = view.stepIndex <= 0;
    els.returnProgressButton.hidden = false;
    els.returnProgressButton.textContent = isUnitCompleted() ? "回到最後通關" : "回到目前進度";
    els.nextStepButton.hidden = false;
    els.nextStepButton.disabled = view.stepIndex >= reviewLimit;
  }

  function enterReview(questionIndex, stepIndex = 0, recordVisit = false) {
    const limit = reviewStepLimit(questionIndex);
    if (limit < 0) return;
    view = {
      mode: "review",
      questionIndex,
      stepIndex: Math.max(0, Math.min(limit, stepIndex)),
      hintLevel: 0,
      focus: 100
    };
    if (recordVisit) recordActivity("open", { mode: "review" });
    render();
    scrollTaskIntoView();
  }

  function returnToProgress() {
    syncViewToProgress();
    render();
    scrollTaskIntoView();
  }

  function startPractice() {
    if (!isQuestionCompleted(view.questionIndex)) return;
    view = {
      mode: "practice",
      questionIndex: view.questionIndex,
      stepIndex: 0,
      hintLevel: 0,
      focus: 100
    };
    recordActivity("start", { mode: "practice" });
    render();
    scrollTaskIntoView();
  }

  function goPreviousStep() {
    if (isPracticeMode()) return;
    if (isReviewMode()) {
      if (view.stepIndex <= 0) return;
      view.stepIndex -= 1;
      render();
      scrollTaskIntoView();
      return;
    }
    if (view.stepIndex > 0) enterReview(view.questionIndex, view.stepIndex - 1, false);
  }

  function goNextReviewStep() {
    if (!isReviewMode()) return;
    const limit = reviewStepLimit(view.questionIndex);
    if (view.stepIndex >= limit) return;
    view.stepIndex += 1;
    render();
    scrollTaskIntoView();
  }

  function render() {
    const question = currentQuestion();
    const step = currentStep();
    const options = orderedOptions(question, step);
    const review = isReviewMode();
    const practice = isPracticeMode();
    const hintLevel = currentHintLevel();
    const focus = currentFocus();
    const completedSteps = review ? view.stepIndex + 1 : view.stepIndex;
    const shield = Math.max(0, 100 - Math.round((completedSteps / question.steps.length) * 100));

    els.stageKind.textContent = question.kind;
    els.stageTitle.textContent = question.title;
    els.questionCount.textContent = String(view.questionIndex + 1);
    els.questionTotal.textContent = `/ ${totalQuestions}`;
    els.enemyRank.textContent = question.enemyRank;
    els.enemyName.textContent = question.enemyName;
    els.enemySigil.textContent = question.enemySigil;
    els.shieldValue.textContent = String(shield);
    els.shieldMeter.style.width = `${shield}%`;
    els.focusValue.textContent = String(focus);
    els.focusMeter.style.width = `${focus}%`;
    els.stepLabel.textContent = `第 ${view.stepIndex + 1} 步，共 ${question.steps.length} 步`;
    els.stepFill.style.width = `${((view.stepIndex + 1) / question.steps.length) * 100}%`;
    els.sourceReference.textContent = question.sourceReference;
    els.missionLabel.textContent = step.mission;
    els.taskTitle.textContent = step.title;
    els.questionMath.innerHTML = question.promptMath;
    const visualHtml = step.visualHtml || question.visualHtml || "";
    els.questionVisual.innerHTML = visualHtml;
    els.questionVisual.hidden = !visualHtml;
    els.answerOptions.innerHTML = options.map((item, index) => renderOption(item, index, review)).join("");
    els.xpText.textContent = `${state.xp} / ${maxXp}`;
    els.xpFill.style.width = `${Math.min(100, (state.xp / maxXp) * 100)}%`;
    els.hintLevel.textContent = `${hintLevel} / 5`;
    els.hintPanel.hidden = hintLevel === 0;
    els.hintButton.disabled = review;
    els.answerSubmitButton.disabled = review;
    els.answerSubmitButton.textContent = review ? "已通過，無法作答" : "確認這一步";
    els.answerForm.classList.toggle("is-read-only", review);
    els.feedbackPanel.hidden = true;
    els.feedbackPanel.className = "feedback-panel";
    els.combatField.classList.remove("is-striking", "is-shield-break", "is-checking", "is-finisher", "is-enemy-striking");
    els.combatCallout.textContent = review ? "已通過" : (completedSteps === 0 ? "找出弱點" : `已破 ${completedSteps} 式`);
    document.body.classList.toggle("reduce-motion", state.reducedMotion);
    document.body.classList.toggle("is-review-mode", review);
    document.body.classList.toggle("is-practice-mode", practice);
    els.motionToggle.textContent = `減少動畫：${state.reducedMotion ? "開" : "關"}`;
    els.motionToggle.setAttribute("aria-pressed", String(state.reducedMotion));
    updateStudentIdentity();

    document.querySelectorAll(".skill-slot").forEach((node) => node.classList.remove("is-lit"));
    if (view.stepIndex >= 1) $("#skill-structure").classList.add("is-lit");
    if (view.stepIndex >= 2) $("#skill-formula").classList.add("is-lit");
    if (view.stepIndex >= question.steps.length - 1) $("#skill-check").classList.add("is-lit");

    renderStageSelector();
    renderStudyControls();
    if (hintLevel > 0) renderHint();
    saveState();
  }

  function renderHint() {
    const question = currentQuestion();
    const hintLevel = currentHintLevel();
    const index = Math.max(0, hintLevel - 1);
    els.hintHeadingLevel.textContent = `第 ${hintLevel} 層`;
    els.hintCopy.textContent = question.hints[index];
    els.hintPanel.hidden = false;
  }

  function showFeedback(kind, title, copy) {
    els.feedbackPanel.className = `feedback-panel is-${kind}`;
    els.feedbackPanel.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;
    els.feedbackPanel.hidden = false;
  }

  function animateCombat(skill) {
    els.combatField.classList.remove("is-striking", "is-shield-break", "is-checking", "is-finisher", "is-enemy-striking");
    void els.combatField.offsetWidth;
    const animationClass = skill === "check" ? "is-checking" : (skill === "formula" ? "is-shield-break" : "is-striking");
    els.combatField.classList.add(animationClass);
    els.combatCallout.textContent = skill === "check" ? "驗算心法" : (skill === "formula" ? "定式破盾" : "拆招命中");
  }

  function animateEnemyCounterattack() {
    els.combatField.classList.remove("is-striking", "is-shield-break", "is-checking", "is-finisher", "is-enemy-striking");
    void els.combatField.offsetWidth;
    els.combatField.classList.add("is-enemy-striking");
    els.combatCallout.textContent = "幻影反擊・再看一次";
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isReviewMode()) return;
    const selected = new FormData(els.answerForm).get("answer");
    if (!selected) {
      showFeedback("neutral", "尚未選擇", "先選一個判斷，再確認這一步。");
      return;
    }

    const step = currentStep();
    const answer = step.options.find((item) => item.id === selected);
    const answeredMode = view.mode;
    const answeredQuestionIndex = view.questionIndex;
    const answeredStepIndex = view.stepIndex;
    if (!answer.correct) {
      if (isPracticeMode()) {
        view.focus = Math.max(55, view.focus - 5);
      } else {
        state.focus = Math.max(55, state.focus - 5);
      }
      recordActivity("answer", { correct: false, errorTag: answer.errorTag });
      if (!isPracticeMode()) {
        state.mistakes.push({
          questionId: currentQuestion().id,
          step: view.stepIndex + 1,
          errorTag: answer.errorTag,
          at: new Date().toISOString()
        });
      }
      saveState();
      els.focusValue.textContent = String(currentFocus());
      els.focusMeter.style.width = `${currentFocus()}%`;
      showFeedback("error", `需要修正｜${answer.errorTag}`, answer.feedback);
      animateEnemyCounterattack();
      return;
    }

    recordActivity("answer", { correct: true });
    document.querySelectorAll(".answer-card").forEach((node) => {
      node.classList.toggle("is-correct", node.querySelector("input").value === selected);
      node.querySelector("input").disabled = true;
    });
    showFeedback("success", "這一步正確", "你已完成目前步驟，戰鬥回饋不會取代下一步的思考。" );
    animateCombat(step.skill);

    window.setTimeout(() => {
      if (view.mode !== answeredMode || view.questionIndex !== answeredQuestionIndex || view.stepIndex !== answeredStepIndex) return;
      if (view.stepIndex < currentQuestion().steps.length - 1) {
        view.stepIndex += 1;
        if (isPracticeMode()) {
          view.hintLevel = 0;
        } else {
          state.stepIndex = view.stepIndex;
          state.hintLevel = 0;
        }
        render();
        scrollTaskIntoView();
      } else {
        completeQuestion();
      }
    }, state.reducedMotion ? 120 : 760);
  }

  function completeQuestion() {
    const question = currentQuestion();
    const practice = isPracticeMode();
    recordActivity("complete", { mode: practice ? "practice" : "progress" });
    if (!practice) {
      state.xp = Math.max(state.xp, (view.questionIndex + 1) * xpPerQuestion);
      state.focus = 100;
    }
    saveState();
    els.xpText.textContent = `${state.xp} / ${maxXp}`;
    els.xpFill.style.width = `${Math.min(100, (state.xp / maxXp) * 100)}%`;
    els.victoryTitle.textContent = practice
      ? "不計分複習完成"
      : (view.questionIndex === totalQuestions - 1 ? `${data.unit}・全部類題完成` : "主要招式發動");
    els.victoryAnswer.innerHTML = question.finalAnswer;
    els.victoryCopy.textContent = question.finalCopy;
    els.victoryRewardNote.hidden = false;
    els.victoryRewardNote.textContent = practice
      ? "本次為重新練習：已保留複習紀錄，但不增加經驗、金幣或正式成績。"
      : "首次通關獎勵已記錄；日後可由關卡導覽回看或進行不計分重練。";
    els.nextQuestionButton.textContent = practice
      ? "返回本關查看"
      : (view.questionIndex === totalQuestions - 1 ? "查看已通過關卡" : "前往下一關");
    els.victoryDialog.dataset.completionMode = practice ? "practice" : "progress";
    els.combatField.classList.remove("is-striking", "is-shield-break", "is-checking", "is-finisher", "is-enemy-striking");
    void els.combatField.offsetWidth;
    els.combatField.classList.add("is-finisher");
    els.combatCallout.textContent = "終式・解題斬";
    window.setTimeout(() => {
      els.victoryDialog.showModal();
    }, state.reducedMotion ? 120 : 1120);
  }

  function goNext() {
    const completionMode = els.victoryDialog.dataset.completionMode;
    els.victoryDialog.close();
    if (completionMode === "practice") {
      enterReview(view.questionIndex, currentQuestion().steps.length - 1, false);
      return;
    }
    if (state.questionIndex < data.questions.length - 1) {
      state.questionIndex += 1;
      state.stepIndex = 0;
      state.hintLevel = 0;
    }
    saveState();
    syncViewToProgress();
    render();
    window.scrollTo({ top: 0, behavior: state.reducedMotion ? "auto" : "smooth" });
  }

  function showRoadmap(name) {
    const copies = {
      "武學譜": "第一版已保留「拆招訣、定式訣、驗算心法」三個技能欄位。技能由正確學習行為觸發，不會直接提供答案。",
      "行囊": "後續將收納徽章、外觀與錯題修復任務；不販售重試次數，也不以體力限制練習。",
      "宗門商店": "商店將只提供角色外觀、招式特效與收藏品，不提供答案、免作答通關或付費變強。"
    };
    els.roadmapTitle.textContent = name;
    els.roadmapCopy.textContent = copies[name];
    els.roadmapDialog.showModal();
  }

  const errorLabels = {
    ANGLE_DECOMP: "角度拆分",
    FORMULA_FAMILY: "公式類型",
    SIGN_ERROR: "公式正負號",
    SPECIAL_VALUE: "特殊角函數值",
    RADICAL_OP: "根式運算",
    QUADRANT_CHECK: "象限檢查",
    TAN_FORMULA_SIGN: "正切差角符號",
    FRACTION_SCALE: "等值分數",
    CONJUGATE: "分母有理化",
    PATTERN_RECOG: "公式辨形",
    ANGLE_COMBINE: "角度合併",
    TRIANGLE_SIDE: "三角形邊長",
    COMPLEMENT_VALUE: "三角比補值",
    QUADRANT_SIGN: "象限正負號",
    SUBSTITUTION_SIGN: "負數代入",
    FRACTION_OP: "分數運算",
    RANGE_CHECK: "答案範圍檢查"
  };

  function updateStudentIdentity() {
    els.studentIdentity.textContent = activeProfile
      ? `${activeProfile.className}・${activeProfile.seatNo}號・${activeProfile.displayName}`
      : "尚未選擇";
  }

  function profileProgressText(profile) {
    const saved = profileStore.loadUnitState(profile.id, unitId);
    if (!saved) return `${data.unit}・尚未開始`;
    const completed = Array.isArray(saved.completedQuestionIds) ? saved.completedQuestionIds.length : 0;
    if (completed >= totalQuestions) return `${data.unit}・已完成 ${completed}/${totalQuestions} 題`;
    const question = Math.max(1, Math.min(totalQuestions, (Number(saved.questionIndex) || 0) + 1));
    const step = Math.max(1, (Number(saved.stepIndex) || 0) + 1);
    return `${data.unit}・第 ${question}/${totalQuestions} 題，第 ${step} 步`;
  }

  function renderProfileList() {
    const profiles = profileStore.listProfiles();
    els.savedProfilesSection.hidden = profiles.length === 0;
    els.profileList.replaceChildren();
    profiles.forEach((profile) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "profile-choice";
      const identity = document.createElement("strong");
      identity.textContent = `${profile.className}・${profile.seatNo}號・${profile.displayName}`;
      const progress = document.createElement("span");
      progress.textContent = profileProgressText(profile);
      button.append(identity, progress);
      button.addEventListener("click", () => activateProfile(profile.id));
      els.profileList.append(button);
    });
  }

  function showProfileFeedback(message, isError = true) {
    els.profileFormFeedback.textContent = message;
    els.profileFormFeedback.classList.toggle("is-error", isError);
    els.profileFormFeedback.hidden = false;
  }

  function openProfileDialog() {
    renderProfileList();
    els.profileDialogClose.hidden = !activeProfile;
    els.profileFormFeedback.hidden = true;
    if (!activeProfile) els.appShell.inert = true;
    if (!els.profileDialog.open) els.profileDialog.showModal();
  }

  function activateProfile(profileId) {
    if (activeProfile) saveState();
    const selected = profileStore.setActiveProfile(profileId);
    if (!selected) {
      showProfileFeedback("找不到這位學生的本機資料，請重新建立。");
      return;
    }
    activeProfile = selected;
    state = loadState();
    syncViewToProgress();
    els.appShell.inert = false;
    if (els.profileDialog.open) els.profileDialog.close();
    if (els.learningDialog.open) els.learningDialog.close();
    updateStudentIdentity();
    render();
    window.scrollTo({ top: 0, behavior: state.reducedMotion ? "auto" : "smooth" });
  }

  function formatLearningTime(milliseconds) {
    if (!milliseconds) return "0 分";
    return `${Math.max(1, Math.round(milliseconds / 60000))} 分`;
  }

  function renderLearningSummary() {
    if (!activeProfile) return;
    const summaries = Object.values(state.learningSummary);
    const totals = summaries.reduce((result, summary) => {
      result.attempts += Number(summary.attempts) || 0;
      result.wrong += Number(summary.wrongAnswers) || 0;
      result.hints += Number(summary.hintsUsed) || 0;
      result.activeMs += Number(summary.activeMs) || 0;
      result.practiceCompletions += Number(summary.practiceCompletions) || 0;
      result.practiceAttempts += Number(summary.practiceAttempts) || 0;
      result.practiceWrong += Number(summary.practiceWrongAnswers) || 0;
      result.practiceHints += Number(summary.practiceHintsUsed) || 0;
      Object.entries(summary.errorTags || {}).forEach(([tag, count]) => {
        result.errorTags[tag] = (result.errorTags[tag] || 0) + (Number(count) || 0);
      });
      return result;
    }, {
      attempts: 0,
      wrong: 0,
      hints: 0,
      activeMs: 0,
      practiceCompletions: 0,
      practiceAttempts: 0,
      practiceWrong: 0,
      practiceHints: 0,
      errorTags: {}
    });

    els.learningStudentName.textContent = activeProfile.displayName;
    els.learningStudentMeta.textContent = `${activeProfile.className}・座號 ${activeProfile.seatNo}`;
    els.learningCurrentProgress.textContent = isUnitCompleted()
      ? `目前：${data.unit}・全部 ${totalQuestions} 題已完成，可回看或進行不計分重練`
      : `目前：${data.unit}・第 ${state.questionIndex + 1}/${totalQuestions} 題・第 ${state.stepIndex + 1} 步`;
    els.learningCompleted.textContent = String(state.completedQuestionIds.length);
    els.learningAttempts.textContent = String(totals.attempts);
    els.learningWrong.textContent = String(totals.wrong);
    els.learningHints.textContent = String(totals.hints);
    els.learningPractice.textContent = String(totals.practiceCompletions);
    els.learningTime.textContent = formatLearningTime(totals.activeMs);
    els.learningPracticeDetail.textContent = totals.practiceAttempts
      ? `不計分複習：作答 ${totals.practiceAttempts} 次、答錯 ${totals.practiceWrong} 次、使用提示 ${totals.practiceHints} 次；以上不列入正式成績。`
      : "不計分複習尚無紀錄。";

    els.learningErrorList.replaceChildren();
    const errors = Object.entries(totals.errorTags).sort((a, b) => b[1] - a[1]);
    if (!errors.length) {
      const empty = document.createElement("p");
      empty.textContent = "目前沒有答錯紀錄，繼續保持。";
      els.learningErrorList.append(empty);
    } else {
      errors.slice(0, 5).forEach(([tag, count]) => {
        const item = document.createElement("span");
        item.textContent = `${errorLabels[tag] || tag}・${count} 次`;
        els.learningErrorList.append(item);
      });
    }
  }

  function openLearningDialog() {
    if (!activeProfile) {
      openProfileDialog();
      return;
    }
    saveState();
    renderLearningSummary();
    els.learningDialog.showModal();
  }

  function initializeStudentProfiles() {
    if (!profileStore.isStorageAvailable()) {
      openProfileDialog();
      showProfileFeedback("目前瀏覽器不允許本機儲存，無法建立可續玩的學生紀錄。");
      return;
    }
    if (!activeProfile) {
      openProfileDialog();
    } else {
      updateStudentIdentity();
    }
  }

  els.answerForm.addEventListener("submit", handleSubmit);
  els.hintButton.addEventListener("click", () => {
    if (isReviewMode()) return;
    const hintLevel = currentHintLevel();
    const nextHintLevel = Math.min(5, hintLevel + 1);
    if (nextHintLevel > hintLevel) {
      if (isPracticeMode()) {
        view.hintLevel = nextHintLevel;
      } else {
        state.hintLevel = nextHintLevel;
      }
      recordActivity("hint", { hintLevel: nextHintLevel });
    }
    renderHint();
    els.hintLevel.textContent = `${currentHintLevel()} / 5`;
    saveState();
  });
  $("#formula-reference-button").addEventListener("click", () => els.formulaDialog.showModal());
  els.nextQuestionButton.addEventListener("click", goNext);
  els.replayQuestionButton.addEventListener("click", startPractice);
  els.previousStepButton.addEventListener("click", goPreviousStep);
  els.returnProgressButton.addEventListener("click", returnToProgress);
  els.nextStepButton.addEventListener("click", goNextReviewStep);
  els.motionToggle.addEventListener("click", () => {
    state.reducedMotion = !state.reducedMotion;
    render();
  });
  document.querySelectorAll("[data-roadmap]").forEach((button) => {
    button.addEventListener("click", () => showRoadmap(button.dataset.roadmap));
  });
  els.studentProfileButton.addEventListener("click", openLearningDialog);
  els.createProfileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(els.createProfileForm);
    try {
      const result = profileStore.createProfile({
        className: formData.get("className"),
        seatNo: formData.get("seatNo"),
        displayName: formData.get("displayName")
      });
      els.createProfileForm.reset();
      activateProfile(result.profile.id);
    } catch (error) {
      showProfileFeedback(error.message || "無法建立學生資料，請稍後再試。");
    }
  });
  els.profileDialogClose.addEventListener("click", () => {
    if (!activeProfile) return;
    els.appShell.inert = false;
    els.profileDialog.close();
  });
  els.profileDialog.addEventListener("cancel", (event) => {
    if (!activeProfile) event.preventDefault();
  });
  els.learningDialogClose.addEventListener("click", () => els.learningDialog.close());
  els.learningDialogDone.addEventListener("click", () => els.learningDialog.close());
  els.switchProfileButton.addEventListener("click", () => {
    els.learningDialog.close();
    openProfileDialog();
  });
  els.deleteProfileButton.addEventListener("click", () => {
    if (!activeProfile) return;
    const confirmed = window.confirm(`確定刪除「${activeProfile.className}・${activeProfile.seatNo}號・${activeProfile.displayName}」在這台裝置上的全部紀錄嗎？刪除後無法復原。`);
    if (!confirmed) return;
    const deleted = profileStore.deleteProfile(activeProfile.id);
    if (!deleted) return;
    activeProfile = null;
    state = emptyState();
    syncViewToProgress();
    els.learningDialog.close();
    updateStudentIdentity();
    render();
    openProfileDialog();
  });

  els.formulaSheet.innerHTML = data.formulas.map((item) => `<div class="formula-row">${item}</div>`).join("");
  render();
  initializeStudentProfiles();
})();
