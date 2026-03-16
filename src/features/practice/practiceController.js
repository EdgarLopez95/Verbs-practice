import {
    getCurrentSet,
    getCurrentVerb,
    advanceVerb,
    advanceSet,
} from "../../services/verbsService.js";
import { getActiveLevelKey, levelsState } from "../../app/bootstrap.js";
import { getPracticeRefs, getPracticeRefsDesktop, renderPracticeView, renderFinalScreen } from "./practiceView.js";

const SET_SIZE = 10;
const AUTO_ADVANCE_MS = 700;
const DESKTOP_BREAKPOINT = 1024;

function isDesktop() {
    return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches;
}

let currentSet = [];
let hintUsed = [];
let correctCount = 0;
let hintCount = 0;
let rowDone = [];
let resizeListenerAttached = false;
/** true cuando solo se pulsó Shift (para atajo Shift = Show answer sin activar al escribir mayúsculas) */
let shiftOnlyPressed = false;

function resetSetState() {
    currentSet = [];
    hintUsed = Array(SET_SIZE).fill(false);
    correctCount = 0;
    hintCount = 0;
}

function normalizeInput(s) {
    return (s ?? "").trim().toLowerCase();
}

function matchesForm(userValue, formArray) {
    if (!Array.isArray(formArray) || formArray.length === 0) return false;
    const n = normalizeInput(userValue);
    return formArray.some((f) => normalizeInput(f) === n);
}

function getLevelState() {
    const key = getActiveLevelKey();
    return key ? levelsState[key] : null;
}

export function initPracticeController() {
    const levelState = getLevelState();
    if (!levelState) {
        const refs = getPracticeRefs();
        if (refs.feedback) refs.feedback.textContent = "Select a level first.";
        return;
    }

    const setsLength = levelState.sets?.length ?? 0;
    if (setsLength !== 5) {
        console.warn("[VF] expected 5 sets but got", setsLength);
        const refs = getPracticeRefs();
        if (refs.feedback) refs.feedback.textContent = "Dataset invalid.";
        return;
    }

    currentSet = getCurrentSet(levelState);
    if (!currentSet.length) {
        console.warn("[VF] currentSet is empty. State:", {
            levelKey: getActiveLevelKey(),
            setIndex: levelState.setIndex,
            verbIndex: levelState.verbIndex,
            setsLength: levelState.sets?.length,
        });
        const refs = getPracticeRefs();
        if (refs.feedback) refs.feedback.textContent = "Could not load verbs.";
        return;
    }

    if (isDesktop()) {
        initPracticeControllerDesktop(levelState);
    } else {
        initPracticeControllerMobile(levelState);
    }

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
    renderCurrentVerb(refs);
    wirePracticeEvents();
}

function initPracticeControllerDesktop(levelState) {
    const desktopRefs = getPracticeRefsDesktop();
    if (!desktopRefs.container || !desktopRefs.rows.length) return;

    resetSetState();
    rowDone = Array(SET_SIZE).fill(false);

    currentSet = getCurrentSet(levelState);
    for (let i = 0; i < SET_SIZE && i < desktopRefs.rows.length; i++) {
        const row = desktopRefs.rows[i];
        const verb = currentSet[i];
        if (row.baseEl) row.baseEl.textContent = verb?.base ?? "—";
        if (row.pastInput) row.pastInput.value = "";
        if (row.ppInput) row.ppInput.value = "";
        if (row.feedbackEl) row.feedbackEl.textContent = "";
        if (row.pastInput) row.pastInput.classList.remove("is-success", "is-error", "hint-active");
        if (row.ppInput) row.ppInput.classList.remove("is-success", "is-error", "hint-active");
        row.pastInput.disabled = false;
        row.ppInput.disabled = false;
        row.hintBtn.disabled = false;
        row.checkBtn.disabled = false;
        if (row.rowEl) row.rowEl.classList.remove("practice-desk-row--done", "practice-desk-row--error");
    }

    updateHeroDesktop(desktopRefs);
    wirePracticeEventsDesktop(desktopRefs, levelState);
}

function updateHeroDesktop(desktopRefs) {
    const refs = getPracticeRefs();
    const levelState = getLevelState();
    if (!levelState || !refs) return;
    const setIndex = levelState.setIndex;
    const doneCount = rowDone.filter(Boolean).length;
    const pct = Math.round((doneCount / SET_SIZE) * 100);
    if (refs.setCount) refs.setCount.textContent = String(setIndex + 1);
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

/** Focus Past input of the next pending row; skips completed rows. */
function focusNextPendingRow(desktopRefs) {
    if (!desktopRefs?.rows?.length) return;
    for (let i = 0; i < desktopRefs.rows.length; i++) {
        if (!rowDone[i]) {
            const next = desktopRefs.rows[i];
            if (next.pastInput && !next.pastInput.disabled) {
                next.pastInput.focus();
                return;
            }
        }
    }
}

function onCheckDesktop(rowIndex, desktopRefs, levelState) {
    const row = desktopRefs.rows[rowIndex];
    const verb = currentSet[rowIndex];
    if (!verb || !row || rowDone[rowIndex]) return;

    const pastVal = row.pastInput?.value ?? "";
    const ppVal = row.ppInput?.value ?? "";
    const pastOk = matchesForm(pastVal, verb.past ?? []);
    const ppOk = matchesForm(ppVal, verb.pp ?? []);

    if (pastOk && ppOk) {
        if (!hintUsed[rowIndex]) correctCount++;
        rowDone[rowIndex] = true;
        setRowFeedback(row, hintUsed[rowIndex] ? "Done (with hint)" : "Correct ✓", hintUsed[rowIndex] ? "error" : "success");
        row.pastInput.classList.add("is-success");
        row.ppInput.classList.add("is-success");
        row.pastInput.disabled = true;
        row.ppInput.disabled = true;
        row.hintBtn.disabled = true;
        row.checkBtn.disabled = true;
        if (row.rowEl) row.rowEl.classList.add("practice-desk-row--done");

        updateHeroDesktop(desktopRefs);

        const allDone = rowDone.every(Boolean);
        if (allDone) {
            advanceSet(levelState);
            const incorrect = hintCount;
            const accuracy = Math.round(((SET_SIZE - incorrect) / SET_SIZE) * 100);
            const hintUsedVerbs = currentSet.filter((_, i) => hintUsed[i]);
            renderFinalScreen(
                {
                    correct: SET_SIZE - incorrect,
                    incorrect: hintCount,
                    accuracy,
                    hintUsedVerbs,
                },
                () => {
                    currentSet = getCurrentSet(levelState);
                    resetSetState();
                    renderPracticeView();
                    initPracticeController();
                }
            );
        } else {
            setTimeout(() => focusNextPendingRow(desktopRefs), 0);
        }
    } else {
        setRowFeedback(row, "Not quite. Try again.", "error");
        row.pastInput.classList.toggle("is-error", !pastOk);
        row.ppInput.classList.toggle("is-error", !ppOk);
        if (row.rowEl) row.rowEl.classList.add("practice-desk-row--error");
    }
}

function onShowAnswerDesktop(rowIndex, desktopRefs) {
    const row = desktopRefs.rows[rowIndex];
    const verb = currentSet[rowIndex];
    if (!verb || !row || rowDone[rowIndex]) return;

    if (!hintUsed[rowIndex]) hintCount++;
    hintUsed[rowIndex] = true;

    const pastVal = verb.past?.[0] ?? "";
    const ppVal = verb.pp?.[0] ?? "";
    row.pastInput.value = pastVal;
    row.ppInput.value = ppVal;
    row.pastInput.classList.add("hint-active");
    row.ppInput.classList.add("hint-active");
    row.hintBtn.disabled = true;
    setRowFeedback(row, "Answer revealed. Try to remember for next time.", "error");

    setTimeout(() => {
        if (rowDone[rowIndex]) return;
        row.pastInput.value = "";
        row.ppInput.value = "";
        row.pastInput.classList.remove("hint-active");
        row.ppInput.classList.remove("hint-active");
        setRowFeedback(row, "Try again.", "error");
        row.pastInput?.focus();
    }, 2000);
}

/**
 * Desktop keyboard: Enter = Check; Shift+Enter = Show answer; Shift solo (al soltar) = Show answer.
 */
function handleDesktopKeydown(rowIndex, desktopRefs, levelState) {
    return function (e) {
        if (e.key === "Shift") {
            shiftOnlyPressed = true;
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            shiftOnlyPressed = false;
            if (e.shiftKey) {
                onShowAnswerDesktop(rowIndex, desktopRefs);
            } else {
                onCheckDesktop(rowIndex, desktopRefs, levelState);
            }
            return;
        }
        shiftOnlyPressed = false;
    };
}

function handleDesktopKeyup(rowIndex, desktopRefs) {
    return function (e) {
        if (e.key === "Shift" && shiftOnlyPressed) {
            shiftOnlyPressed = false;
            onShowAnswerDesktop(rowIndex, desktopRefs);
        }
    };
}

function wirePracticeEventsDesktop(desktopRefs, levelState) {
    for (let i = 0; i < desktopRefs.rows.length; i++) {
        const row = desktopRefs.rows[i];
        const idx = i;
        const onKeydown = handleDesktopKeydown(idx, desktopRefs, levelState);
        const onKeyup = handleDesktopKeyup(idx, desktopRefs);
        row.checkBtn?.addEventListener("click", () => onCheckDesktop(idx, desktopRefs, levelState));
        row.hintBtn?.addEventListener("click", () => onShowAnswerDesktop(idx, desktopRefs));
        row.pastInput?.addEventListener("keydown", onKeydown);
        row.ppInput?.addEventListener("keydown", onKeydown);
        row.pastInput?.addEventListener("keyup", onKeyup);
        row.ppInput?.addEventListener("keyup", onKeyup);
    }
}

function attachResizeListenerIfNeeded() {
    if (resizeListenerAttached) return;
    let lastDesktop = isDesktop();
    window.addEventListener("resize", () => {
        const nowDesktop = isDesktop();
        if (nowDesktop !== lastDesktop) {
            lastDesktop = nowDesktop;
            const section = document.getElementById("practice");
            if (section && !section.classList.contains("hidden")) {
                renderPracticeView();
                initPracticeController();
            }
        }
    });
    resizeListenerAttached = true;
}

function updateHero(refs) {
    const levelState = getLevelState();
    if (!levelState) return;
    const setIndex = levelState.setIndex;
    const verbIndex = levelState.verbIndex;
    if (refs.setCount) refs.setCount.textContent = String(setIndex + 1);
    if (refs.verbCount) refs.verbCount.textContent = String(verbIndex + 1); /* opcional: ya no en UI */
    const pct = Math.round((verbIndex / SET_SIZE) * 100);
    if (refs.progressFill) refs.progressFill.style.width = `${pct}%`;
    if (refs.progressBar) refs.progressBar.setAttribute("aria-valuenow", String(pct));
    if (refs.progressText) refs.progressText.textContent = `${pct}%`;
}

function renderCurrentVerb(refs) {
    const levelState = getLevelState();
    if (!levelState) return;

    currentSet = getCurrentSet(levelState);
    const currentVerb = getCurrentVerb(levelState);

    if (!currentVerb) {
        console.warn("[VF] currentVerb is undefined. State:", {
            levelKey: getActiveLevelKey(),
            setIndex: levelState.setIndex,
            verbIndex: levelState.verbIndex,
            currentSet,
        });
        const refsEl = refs?.baseVerb ?? document.getElementById("baseVerb");
        if (refsEl) refsEl.textContent = "No verb loaded";
        if (refs.feedback) refs.feedback.textContent = "No verb loaded";
        return;
    }

    const refsEl = refs?.baseVerb ?? document.getElementById("baseVerb");
    if (refsEl) refsEl.textContent = currentVerb.base;

    updateHero(refs);
    if (refs.pastInput) refs.pastInput.value = "";
    if (refs.ppInput) refs.ppInput.value = "";
    resetInputStates(refs);
    resetMeaningAndHintUI(refs);
    setInputsAndHintEnabled(refs, true);
    if (refs.meaningContainer) {
        refs.meaningContainer.classList.add("hidden");
        refs.meaningContainer.textContent = "";
    }
    if (refs.meaningToggleBtn) refs.meaningToggleBtn.setAttribute("aria-label", "Show meaning");
}

function resetInputStates(refs) {
    if (refs.pastInput) refs.pastInput.classList.remove("is-success", "is-error");
    if (refs.ppInput) refs.ppInput.classList.remove("is-success", "is-error");
}

function setInputErrorStates(refs, pastOk, ppOk) {
    if (refs.pastInput) refs.pastInput.classList.toggle("is-error", !pastOk);
    if (refs.ppInput) refs.ppInput.classList.toggle("is-error", !ppOk);
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
    }
    if (refs.meaningToggleBtn) refs.meaningToggleBtn.setAttribute("aria-label", "Show meaning");
    if (refs.pastInput) refs.pastInput.classList.remove("hint-active");
    if (refs.ppInput) refs.ppInput.classList.remove("hint-active");
}

function onCheck() {
    const refs = getPracticeRefs();
    const levelState = getLevelState();
    if (!levelState) return;

    const currentVerb = getCurrentVerb(levelState);
    if (!currentVerb) return;

    resetInputStates(refs);
    const pastVal = refs.pastInput?.value ?? "";
    const ppVal = refs.ppInput?.value ?? "";
    const pastOk = matchesForm(pastVal, currentVerb.past ?? []);
    const ppOk = matchesForm(ppVal, currentVerb.pp ?? []);

    if (pastOk && ppOk) {
        const idx = levelState.verbIndex;
        if (!hintUsed[idx]) correctCount++;
        setFeedback(refs, hintUsed[idx] ? "Done (with hint)" : "Correct ✓", hintUsed[idx] ? "error" : "success");
        if (refs.pastInput) refs.pastInput.classList.add("is-success");
        if (refs.ppInput) refs.ppInput.classList.add("is-success");
        setInputsAndHintEnabled(refs, false);
        refs.primaryBtn.disabled = true;

        if (refs.card) {
            refs.card.classList.add("success-animate");
            setTimeout(() => refs.card.classList.remove("success-animate"), 250);
        }

        setTimeout(() => {
            if (refs.card) refs.card.classList.add("fade-out");
            setTimeout(() => {
                advanceVerb(levelState);
                if (levelState.verbIndex === 0) {
                    if (refs.progressFill) refs.progressFill.style.width = "100%";
                    if (refs.progressText) refs.progressText.textContent = "100%";
                    const incorrect = hintCount;
                    const accuracy = Math.round(((SET_SIZE - incorrect) / SET_SIZE) * 100);
                    const hintUsedVerbs = currentSet.filter((_, i) => hintUsed[i]);
                    renderFinalScreen(
                        {
                            correct: SET_SIZE - incorrect,
                            incorrect: hintCount,
                            accuracy,
                            hintUsedVerbs,
                        },
                        () => {
                            currentSet = getCurrentSet(levelState);
                            resetSetState();
                            renderPracticeView();
                            initPracticeController();
                        }
                    );
                } else {
                    currentSet = getCurrentSet(levelState);
                    const nextVerb = getCurrentVerb(levelState);
                    resetInputStates(refs);
                    if (refs.card) refs.card.classList.remove("fade-out");
                    if (refs.card) refs.card.classList.add("fade-in");
                    updateHero(refs);
                    const refsEl = refs.baseVerb ?? document.getElementById("baseVerb");
                    if (refsEl) refsEl.textContent = nextVerb?.base ?? "—";
                    if (refs.pastInput) refs.pastInput.value = "";
                    if (refs.ppInput) refs.ppInput.value = "";
                    setInputsAndHintEnabled(refs, true);
                    refs.primaryBtn.disabled = false;
                    setFeedback(refs, "", null);
                    refs.pastInput?.focus();
                    setTimeout(() => refs.card?.classList.remove("fade-in"), 150);
                }
            }, 150);
        }, AUTO_ADVANCE_MS);
    } else {
        setFeedback(refs, "Not quite. Try again.", "error");
        setInputErrorStates(refs, pastOk, ppOk);
        if (refs.card) {
            refs.card.classList.add("error-animate");
            setTimeout(() => refs.card.classList.remove("error-animate"), 300);
        }
        if (!pastOk) refs.pastInput?.focus();
        else refs.ppInput?.focus();
    }
}

function onMeaningToggle() {
    const refs = getPracticeRefs();
    const levelState = getLevelState();
    if (!levelState) return;
    const currentVerb = getCurrentVerb(levelState);
    const container = refs.meaningContainer;
    const btn = refs.meaningToggleBtn;
    if (!container || !btn) return;

    const isHidden = container.classList.contains("hidden");
    if (isHidden) {
        const meaning = currentVerb?.meaning ?? "—";
        container.textContent = `(es: ${meaning})`;
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
    if (!levelState) return;
    const currentVerb = getCurrentVerb(levelState);
    if (!currentVerb) return;

    const idx = levelState.verbIndex;
    if (!hintUsed[idx]) hintCount++;
    hintUsed[idx] = true;

    const pastVal = currentVerb.past?.[0] ?? "";
    const ppVal = currentVerb.pp?.[0] ?? "";
    if (refs.pastInput) {
        refs.pastInput.value = pastVal;
        refs.pastInput.classList.add("hint-active");
    }
    if (refs.ppInput) {
        refs.ppInput.value = ppVal;
        refs.ppInput.classList.add("hint-active");
    }
    setFeedback(refs, "Answer revealed. Try to remember for next time.", "error");

    if (refs.hintBtn) {
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
}

/**
 * Mobile keyboard: Enter = Check; Shift+Enter = Show answer; Shift solo (al soltar) = Show answer.
 */
function handleMobileKeydown(e) {
    if (e.key === "Shift") {
        shiftOnlyPressed = true;
        return;
    }
    if (e.key === "Enter") {
        e.preventDefault();
        shiftOnlyPressed = false;
        if (e.shiftKey) {
            onShowAnswer();
        } else {
            onCheck();
        }
        return;
    }
    shiftOnlyPressed = false;
}

function handleMobileKeyup(e) {
    if (e.key === "Shift" && shiftOnlyPressed) {
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
