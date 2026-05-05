import {
    advanceSet,
    advanceVerb,
    getCurrentSet,
    getCurrentVerb,
} from "../../services/verbsService.js";
import { getActiveLevelKey, levelsState } from "../../app/bootstrap.js";
import { SET_SIZE, SETS_PER_LEVEL } from "../../shared/constants/levels.js";
import { animateError, animateHint, animatePracticeEnter, animateSuccess } from "../../shared/animations/motion.js";
import { getPracticeRefs, getPracticeRefsDesktop, renderFinalScreen, renderPracticeView } from "./practiceView.js";

const AUTO_ADVANCE_MS = 700;
const DESKTOP_BREAKPOINT = 1024;

let currentSet = [];
let hintUsed = [];
let correctCount = 0;
let hintCount = 0;
let rowDone = [];
let resizeListenerAttached = false;
let shiftOnlyPressed = false;
let lastCompletedSet = null;
let lastCompletedSetIndex = 0;

function isDesktop() {
    return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches;
}

function resetSetState() {
    currentSet = [];
    hintUsed = Array(SET_SIZE).fill(false);
    correctCount = 0;
    hintCount = 0;
}

function normalizeInput(value) {
    return (value ?? "").trim().toLowerCase();
}

function matchesForm(userValue, formArray) {
    if (!Array.isArray(formArray) || formArray.length === 0) return false;
    const normalized = normalizeInput(userValue);
    return formArray.some((form) => normalizeInput(form) === normalized);
}

function getLevelState() {
    const key = getActiveLevelKey();
    return key ? levelsState[key] : null;
}

function repeatCompletedSet() {
    const levelState = getLevelState();
    if (!levelState || !lastCompletedSet?.length) return;
    levelState.sets[lastCompletedSetIndex] = lastCompletedSet;
    levelState.setIndex = lastCompletedSetIndex;
    levelState.verbIndex = 0;
    resetSetState();
    renderPracticeView();
    initPracticeController();
}

export function initPracticeController() {
    const levelState = getLevelState();
    if (!levelState) {
        const refs = getPracticeRefs();
        if (refs.feedback) refs.feedback.textContent = "Select a level first.";
        return;
    }

    const setsLength = levelState.sets?.length ?? 0;
    if (setsLength !== SETS_PER_LEVEL) {
        console.warn("[VF] expected sets:", SETS_PER_LEVEL, "got:", setsLength);
        const refs = getPracticeRefs();
        if (refs.feedback) refs.feedback.textContent = "Dataset invalid.";
        return;
    }

    currentSet = getCurrentSet(levelState);
    if (!currentSet.length) {
        console.warn("[VF] currentSet is empty", {
            levelKey: getActiveLevelKey(),
            setIndex: levelState.setIndex,
            verbIndex: levelState.verbIndex,
        });
        const refs = getPracticeRefs();
        if (refs.feedback) refs.feedback.textContent = "Could not load verbs.";
        return;
    }

    if (isDesktop()) initPracticeControllerDesktop(levelState);
    else initPracticeControllerMobile(levelState);

    attachResizeListenerIfNeeded();
}

function initPracticeControllerMobile(levelState) {
    const refs = getPracticeRefs();
    if (!refs.primaryBtn || !refs.feedback) return;

    resetSetState();
    refs.primaryBtn.textContent = "Check";
    refs.primaryBtn.disabled = false;
    refs.feedback.textContent = "";
    refs.feedback.classList.remove("feedback-success", "feedback-error");
    setInputsAndHintEnabled(refs, true);
    renderCurrentVerb(refs, levelState);
    wirePracticeEvents();
    animatePracticeEnter();
}

function initPracticeControllerDesktop(levelState) {
    const desktopRefs = getPracticeRefsDesktop();
    if (!desktopRefs.container || !desktopRefs.rows.length) return;

    resetSetState();
    rowDone = Array(SET_SIZE).fill(false);
    currentSet = getCurrentSet(levelState);

    desktopRefs.rows.forEach((row, index) => {
        const verb = currentSet[index];
        if (row.baseEl) row.baseEl.textContent = verb?.base ?? "-";
        if (row.pastInput) row.pastInput.value = "";
        if (row.ppInput) row.ppInput.value = "";
        if (row.feedbackEl) row.feedbackEl.textContent = "";
        row.pastInput?.classList.remove("is-success", "is-error", "hint-active");
        row.ppInput?.classList.remove("is-success", "is-error", "hint-active");
        if (row.pastInput) row.pastInput.disabled = false;
        if (row.ppInput) row.ppInput.disabled = false;
        if (row.hintBtn) row.hintBtn.disabled = false;
        if (row.checkBtn) row.checkBtn.disabled = false;
        row.rowEl?.classList.remove("practice-desk-row--done", "practice-desk-row--error");
    });

    updateHeroDesktop();
    wirePracticeEventsDesktop(desktopRefs, levelState);
    animatePracticeEnter();
}

function updateHeroDesktop() {
    const refs = getPracticeRefs();
    const levelState = getLevelState();
    if (!levelState) return;
    const pct = Math.round((rowDone.filter(Boolean).length / SET_SIZE) * 100);
    if (refs.setCount) refs.setCount.textContent = String(levelState.setIndex + 1);
    if (refs.progressFill) refs.progressFill.style.width = `${pct}%`;
    if (refs.progressBar) refs.progressBar.setAttribute("aria-valuenow", String(pct));
    if (refs.progressText) refs.progressText.textContent = `${pct}%`;
}

function setRowFeedback(row, message, type) {
    if (!row.feedbackEl) return;
    row.feedbackEl.textContent = message;
    row.feedbackEl.classList.remove("feedback-success", "feedback-error");
    if (type === "success") row.feedbackEl.classList.add("feedback-success");
    if (type === "error") row.feedbackEl.classList.add("feedback-error");
}

function scrollRowIntoComfortView(rowEl) {
    if (!rowEl || !isDesktop()) return;
    const rect = rowEl.getBoundingClientRect();
    const topGuard = 120;
    const bottomGuard = 100;
    if (rect.top < topGuard) {
        window.scrollBy({ top: rect.top - topGuard, behavior: "smooth" });
    } else if (rect.bottom > window.innerHeight - bottomGuard) {
        window.scrollBy({ top: rect.bottom - (window.innerHeight - bottomGuard), behavior: "smooth" });
    }
}

function focusNextPendingRow(desktopRefs) {
    const next = desktopRefs.rows.find((_, index) => !rowDone[index]);
    if (!next?.pastInput || next.pastInput.disabled) return;
    next.pastInput.focus();
    requestAnimationFrame(() => scrollRowIntoComfortView(next.rowEl));
}

function completeCurrentSet(levelState) {
    lastCompletedSet = currentSet.slice();
    lastCompletedSetIndex = levelState.setIndex;
    advanceSet(levelState);
    const incorrect = hintCount;
    const accuracy = Math.round(((SET_SIZE - incorrect) / SET_SIZE) * 100);
    const hintUsedVerbs = currentSet.filter((_, index) => hintUsed[index]);

    renderFinalScreen(
        {
            correct: SET_SIZE - incorrect,
            incorrect,
            accuracy,
            hintUsedVerbs,
        },
        () => {
            currentSet = getCurrentSet(levelState);
            resetSetState();
            renderPracticeView();
            initPracticeController();
        },
        repeatCompletedSet
    );
}

function onCheckDesktop(rowIndex, desktopRefs, levelState) {
    const row = desktopRefs.rows[rowIndex];
    const verb = currentSet[rowIndex];
    if (!verb || !row || rowDone[rowIndex]) return;

    const pastOk = matchesForm(row.pastInput?.value ?? "", verb.past ?? []);
    const ppOk = matchesForm(row.ppInput?.value ?? "", verb.pp ?? []);

    if (pastOk && ppOk) {
        if (!hintUsed[rowIndex]) correctCount++;
        rowDone[rowIndex] = true;
        setRowFeedback(row, hintUsed[rowIndex] ? "Done with hint" : "Correct", hintUsed[rowIndex] ? "error" : "success");
        row.pastInput?.classList.add("is-success");
        row.ppInput?.classList.add("is-success");
        if (row.pastInput) row.pastInput.disabled = true;
        if (row.ppInput) row.ppInput.disabled = true;
        if (row.hintBtn) row.hintBtn.disabled = true;
        if (row.checkBtn) row.checkBtn.disabled = true;
        row.rowEl?.classList.add("practice-desk-row--done");
        animateSuccess(row.rowEl);

        updateHeroDesktop();

        if (rowDone.every(Boolean)) completeCurrentSet(levelState);
        else setTimeout(() => focusNextPendingRow(desktopRefs), 0);
        return;
    }

    setRowFeedback(row, "Not quite. Try again.", "error");
    row.pastInput?.classList.toggle("is-error", !pastOk);
    row.ppInput?.classList.toggle("is-error", !ppOk);
    row.rowEl?.classList.add("practice-desk-row--error");
    animateError(row.rowEl);
}

function onShowAnswerDesktop(rowIndex, desktopRefs) {
    const row = desktopRefs.rows[rowIndex];
    const verb = currentSet[rowIndex];
    if (!verb || !row || rowDone[rowIndex]) return;

    if (!hintUsed[rowIndex]) hintCount++;
    hintUsed[rowIndex] = true;

    if (row.pastInput) {
        row.pastInput.value = verb.past?.[0] ?? "";
        row.pastInput.classList.add("hint-active");
    }
    if (row.ppInput) {
        row.ppInput.value = verb.pp?.[0] ?? "";
        row.ppInput.classList.add("hint-active");
    }
    if (row.hintBtn) row.hintBtn.disabled = true;
    setRowFeedback(row, "Answer revealed. Try to remember for next time.", "error");
    animateHint([row.pastInput, row.ppInput].filter(Boolean));

    setTimeout(() => {
        if (rowDone[rowIndex]) return;
        if (row.pastInput) {
            row.pastInput.value = "";
            row.pastInput.classList.remove("hint-active");
        }
        if (row.ppInput) {
            row.ppInput.value = "";
            row.ppInput.classList.remove("hint-active");
        }
        setRowFeedback(row, "Try again.", "error");
        row.pastInput?.focus();
    }, 2000);
}

function handleDesktopKeydown(rowIndex, desktopRefs, levelState) {
    return (event) => {
        if (event.key === "Shift") {
            shiftOnlyPressed = true;
            return;
        }
        if (event.key === "Enter") {
            event.preventDefault();
            shiftOnlyPressed = false;
            if (event.shiftKey) onShowAnswerDesktop(rowIndex, desktopRefs);
            else onCheckDesktop(rowIndex, desktopRefs, levelState);
            return;
        }
        shiftOnlyPressed = false;
    };
}

function handleDesktopKeyup(rowIndex, desktopRefs) {
    return (event) => {
        if (event.key === "Shift" && shiftOnlyPressed) {
            shiftOnlyPressed = false;
            onShowAnswerDesktop(rowIndex, desktopRefs);
        }
    };
}

function wirePracticeEventsDesktop(desktopRefs, levelState) {
    desktopRefs.rows.forEach((row, index) => {
        const onKeydown = handleDesktopKeydown(index, desktopRefs, levelState);
        const onKeyup = handleDesktopKeyup(index, desktopRefs);
        row.checkBtn?.addEventListener("click", () => onCheckDesktop(index, desktopRefs, levelState));
        row.hintBtn?.addEventListener("click", () => onShowAnswerDesktop(index, desktopRefs));
        row.pastInput?.addEventListener("keydown", onKeydown);
        row.ppInput?.addEventListener("keydown", onKeydown);
        row.pastInput?.addEventListener("keyup", onKeyup);
        row.ppInput?.addEventListener("keyup", onKeyup);
    });
}

function attachResizeListenerIfNeeded() {
    if (resizeListenerAttached) return;
    let wasDesktop = isDesktop();
    window.addEventListener("resize", () => {
        const nowDesktop = isDesktop();
        if (nowDesktop === wasDesktop) return;
        wasDesktop = nowDesktop;
        const section = document.getElementById("practice");
        if (!section || section.classList.contains("hidden")) return;
        renderPracticeView();
        initPracticeController();
    });
    resizeListenerAttached = true;
}

function updateHero(refs, levelState) {
    const pct = Math.round(((levelState?.verbIndex ?? 0) / SET_SIZE) * 100);
    if (refs.setCount) refs.setCount.textContent = String((levelState?.setIndex ?? 0) + 1);
    if (refs.verbCount) refs.verbCount.textContent = String((levelState?.verbIndex ?? 0) + 1);
    if (refs.progressFill) refs.progressFill.style.width = `${pct}%`;
    if (refs.progressBar) refs.progressBar.setAttribute("aria-valuenow", String(pct));
    if (refs.progressText) refs.progressText.textContent = `${pct}%`;
}

function renderCurrentVerb(refs, levelState = getLevelState()) {
    if (!levelState) return;
    currentSet = getCurrentSet(levelState);
    const currentVerb = getCurrentVerb(levelState);

    if (!currentVerb) {
        if (refs.baseVerb) refs.baseVerb.textContent = "No verb loaded";
        if (refs.feedback) refs.feedback.textContent = "No verb loaded";
        return;
    }

    if (refs.baseVerb) refs.baseVerb.textContent = currentVerb.base;
    if (refs.pastInput) refs.pastInput.value = "";
    if (refs.ppInput) refs.ppInput.value = "";
    resetInputStates(refs);
    resetMeaningAndHintUI(refs);
    setInputsAndHintEnabled(refs, true);
    setFeedback(refs, "", null);
    updateHero(refs, levelState);
}

function resetInputStates(refs) {
    refs.pastInput?.classList.remove("is-success", "is-error");
    refs.ppInput?.classList.remove("is-success", "is-error");
}

function setInputErrorStates(refs, pastOk, ppOk) {
    refs.pastInput?.classList.toggle("is-error", !pastOk);
    refs.ppInput?.classList.toggle("is-error", !ppOk);
}

function setFeedback(refs, message, type) {
    if (!refs.feedback) return;
    refs.feedback.textContent = message;
    refs.feedback.classList.remove("feedback-success", "feedback-error");
    if (type === "success") refs.feedback.classList.add("feedback-success");
    if (type === "error") refs.feedback.classList.add("feedback-error");
}

function setInputsAndHintEnabled(refs, enabled) {
    if (refs.pastInput) refs.pastInput.disabled = !enabled;
    if (refs.ppInput) refs.ppInput.disabled = !enabled;
    if (refs.hintBtn) refs.hintBtn.disabled = !enabled;
    if (refs.meaningToggleBtn) refs.meaningToggleBtn.disabled = !enabled;
}

function resetMeaningAndHintUI(refs) {
    if (refs.meaningContainer) {
        refs.meaningContainer.classList.add("hidden");
        refs.meaningContainer.setAttribute("aria-hidden", "true");
        refs.meaningContainer.textContent = "";
    }
    refs.meaningToggleBtn?.setAttribute("aria-label", "Show meaning");
    refs.pastInput?.classList.remove("hint-active");
    refs.ppInput?.classList.remove("hint-active");
}

function onCheck() {
    const refs = getPracticeRefs();
    const levelState = getLevelState();
    const currentVerb = levelState ? getCurrentVerb(levelState) : null;
    if (!levelState || !currentVerb) return;

    resetInputStates(refs);
    const pastOk = matchesForm(refs.pastInput?.value ?? "", currentVerb.past ?? []);
    const ppOk = matchesForm(refs.ppInput?.value ?? "", currentVerb.pp ?? []);

    if (pastOk && ppOk) {
        const index = levelState.verbIndex;
        if (!hintUsed[index]) correctCount++;
        setFeedback(refs, hintUsed[index] ? "Done with hint" : "Correct", hintUsed[index] ? "error" : "success");
        refs.pastInput?.classList.add("is-success");
        refs.ppInput?.classList.add("is-success");
        setInputsAndHintEnabled(refs, false);
        if (refs.primaryBtn) refs.primaryBtn.disabled = true;
        animateSuccess(refs.card);

        setTimeout(() => {
            refs.card?.classList.add("fade-out");
            setTimeout(() => {
                lastCompletedSet = currentSet.slice();
                lastCompletedSetIndex = levelState.setIndex;
                advanceVerb(levelState);

                if (levelState.verbIndex === 0) {
                    if (refs.progressFill) refs.progressFill.style.width = "100%";
                    if (refs.progressText) refs.progressText.textContent = "100%";
                    completeCurrentSetAfterMobileVerb(levelState);
                    return;
                }

                currentSet = getCurrentSet(levelState);
                refs.card?.classList.remove("fade-out");
                refs.card?.classList.add("fade-in");
                renderCurrentVerb(refs, levelState);
                if (refs.primaryBtn) refs.primaryBtn.disabled = false;
                refs.pastInput?.focus();
                setTimeout(() => refs.card?.classList.remove("fade-in"), 160);
            }, 150);
        }, AUTO_ADVANCE_MS);
        return;
    }

    setFeedback(refs, "Not quite. Try again.", "error");
    setInputErrorStates(refs, pastOk, ppOk);
    animateError(refs.card);
    if (!pastOk) refs.pastInput?.focus();
    else refs.ppInput?.focus();
}

function completeCurrentSetAfterMobileVerb(levelState) {
    const incorrect = hintCount;
    const accuracy = Math.round(((SET_SIZE - incorrect) / SET_SIZE) * 100);
    const hintUsedVerbs = currentSet.filter((_, index) => hintUsed[index]);
    renderFinalScreen(
        {
            correct: SET_SIZE - incorrect,
            incorrect,
            accuracy,
            hintUsedVerbs,
        },
        () => {
            currentSet = getCurrentSet(levelState);
            resetSetState();
            renderPracticeView();
            initPracticeController();
        },
        repeatCompletedSet
    );
}

function onMeaningToggle() {
    const refs = getPracticeRefs();
    const levelState = getLevelState();
    const currentVerb = levelState ? getCurrentVerb(levelState) : null;
    const container = refs.meaningContainer;
    const btn = refs.meaningToggleBtn;
    if (!container || !btn) return;

    const shouldShow = container.classList.contains("hidden");
    if (shouldShow) {
        container.textContent = `(es: ${currentVerb?.meaning ?? "-"})`;
        container.classList.remove("hidden");
        container.setAttribute("aria-hidden", "false");
        btn.setAttribute("aria-label", "Hide meaning");
    } else {
        container.textContent = "";
        container.classList.add("hidden");
        container.setAttribute("aria-hidden", "true");
        btn.setAttribute("aria-label", "Show meaning");
    }
}

function onShowAnswer() {
    const refs = getPracticeRefs();
    const levelState = getLevelState();
    const currentVerb = levelState ? getCurrentVerb(levelState) : null;
    if (!levelState || !currentVerb) return;

    const index = levelState.verbIndex;
    if (!hintUsed[index]) hintCount++;
    hintUsed[index] = true;

    if (refs.pastInput) {
        refs.pastInput.value = currentVerb.past?.[0] ?? "";
        refs.pastInput.classList.add("hint-active");
    }
    if (refs.ppInput) {
        refs.ppInput.value = currentVerb.pp?.[0] ?? "";
        refs.ppInput.classList.add("hint-active");
    }
    setFeedback(refs, "Answer revealed. Try to remember for next time.", "error");
    animateHint([refs.pastInput, refs.ppInput].filter(Boolean));

    if (!refs.hintBtn) return;
    refs.hintBtn.disabled = true;
    setTimeout(() => {
        if (refs.pastInput) {
            refs.pastInput.value = "";
            refs.pastInput.classList.remove("hint-active");
        }
        if (refs.ppInput) {
            refs.ppInput.value = "";
            refs.ppInput.classList.remove("hint-active");
        }
        setFeedback(refs, "Try again.", "error");
        if (refs.hintBtn) refs.hintBtn.disabled = false;
        refs.pastInput?.focus();
    }, 2000);
}

function handleMobileKeydown(event) {
    if (event.key === "Shift") {
        shiftOnlyPressed = true;
        return;
    }
    if (event.key === "Enter") {
        event.preventDefault();
        shiftOnlyPressed = false;
        if (event.shiftKey) onShowAnswer();
        else onCheck();
        return;
    }
    shiftOnlyPressed = false;
}

function handleMobileKeyup(event) {
    if (event.key === "Shift" && shiftOnlyPressed) {
        shiftOnlyPressed = false;
        onShowAnswer();
    }
}

export function wirePracticeEvents() {
    const refs = getPracticeRefs();
    refs.primaryBtn?.addEventListener("click", onCheck);
    refs.hintBtn?.addEventListener("click", onShowAnswer);
    refs.meaningToggleBtn?.addEventListener("click", onMeaningToggle);
    refs.pastInput?.addEventListener("keydown", handleMobileKeydown);
    refs.ppInput?.addEventListener("keydown", handleMobileKeydown);
    refs.pastInput?.addEventListener("keyup", handleMobileKeyup);
    refs.ppInput?.addEventListener("keyup", handleMobileKeyup);
}
