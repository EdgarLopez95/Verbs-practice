import { getRandomVerbs } from "../../services/verbsService.js";
import { getPracticeRefs, renderPracticeView, renderFinalScreen } from "./practiceView.js";

const SET_SIZE = 10;

let currentSet = [];
let currentIndex = 0;
let isSetActive = false;
let correctCount = 0;
let attemptsCount = 0;
let wrongCount = 0;
let streak = 0;
let hintUsedCount = 0;
let mistakesCount = 0;
let perfectCorrectCount = 0;
let hintUsedForIndex = new Set();

const AUTO_ADVANCE_MS = 700;

function resetState() {
    currentSet = [];
    currentIndex = 0;
    isSetActive = false;
    correctCount = 0;
    attemptsCount = 0;
    wrongCount = 0;
    streak = 0;
    hintUsedCount = 0;
    mistakesCount = 0;
    perfectCorrectCount = 0;
    hintUsedForIndex = new Set();
}

function resetInputStates(refs) {
    if (refs.pastInput) refs.pastInput.classList.remove("is-success", "is-error");
    if (refs.ppInput) refs.ppInput.classList.remove("is-success", "is-error");
}

function setInputErrorStates(refs, pastOk, ppOk) {
    if (refs.pastInput) {
        if (pastOk) refs.pastInput.classList.remove("is-error");
        else refs.pastInput.classList.add("is-error");
    }
    if (refs.ppInput) {
        if (ppOk) refs.ppInput.classList.remove("is-error");
        else refs.ppInput.classList.add("is-error");
    }
}

function getBaseForm(verb) {
    const base = verb?.forms?.base;
    if (!Array.isArray(base) || base.length === 0) return verb?.id ?? "—";
    return base.join(" / ");
}

function normalize(s) {
    return (s ?? "").trim().toLowerCase();
}

function matchesForm(userValue, formArray) {
    if (!Array.isArray(formArray)) return false;
    const normalized = normalize(userValue);
    return formArray.some((f) => normalize(f) === normalized);
}

function updateProgress(refs) {
    const pct =
        isSetActive && currentSet.length
            ? Math.round((currentIndex / SET_SIZE) * 100)
            : 0;
    if (refs.progressBar) refs.progressBar.style.width = `${pct}%`;
    if (refs.progressWrap) refs.progressWrap.setAttribute("aria-valuenow", String(pct));
    if (refs.progressText) refs.progressText.textContent = `${pct}%`;
}

function updateUI(refs, verb = null, clearInputs = true) {
    if (!refs.baseVerb) return;
    refs.baseVerb.textContent = verb ? getBaseForm(verb) : "—";
    if (refs.setCount) refs.setCount.textContent = isSetActive ? String(currentIndex + 1) : "0";
    updateProgress(refs);
    if (clearInputs) {
        if (refs.pastInput) refs.pastInput.value = "";
        if (refs.ppInput) refs.ppInput.value = "";
    }
    if (verb) resetMeaningAndHintUI(refs);
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
    if (refs.meaningToggleBtn) refs.meaningToggleBtn.textContent = "Show meaning";
    if (refs.pastInput) refs.pastInput.classList.remove("hint-active");
    if (refs.ppInput) refs.ppInput.classList.remove("hint-active");
}

export function initPracticeController() {
    const refs = getPracticeRefs();
    if (!refs.primaryBtn || !refs.feedback) return;

    refs.primaryBtn.textContent = "Check";
    refs.primaryBtn.disabled = true;
    refs.feedback.textContent = "";
    refs.feedback.classList.remove("feedback-success", "feedback-error");
    setInputsAndHintEnabled(refs, false);
    updateUI(refs);

    async function startSet() {
        try {
            currentSet = await getRandomVerbs(SET_SIZE);
            currentIndex = 0;
            correctCount = 0;
            attemptsCount = 0;
            wrongCount = 0;
            streak = 0;
            hintUsedCount = 0;
            mistakesCount = 0;
            perfectCorrectCount = 0;
            hintUsedForIndex = new Set();
            isSetActive = true;
            const verb = currentSet[currentIndex];
            updateUI(refs, verb);
            setInputsAndHintEnabled(refs, true);
            refs.primaryBtn.disabled = false;
            setFeedback(refs, "", null);
            resetInputStates(refs);
            refs.pastInput?.focus();
        } catch (err) {
            setFeedback(refs, "Could not load verbs.", "error");
        }
    }

    startSet();

    function onCheck() {
        const verb = currentSet[currentIndex];
        if (!verb) return;

        resetInputStates(refs);
        const pastVal = refs.pastInput?.value ?? "";
        const ppVal = refs.ppInput?.value ?? "";
        const pastOk = matchesForm(pastVal, verb.forms?.past);
        const ppOk = matchesForm(ppVal, verb.forms?.pp);

        attemptsCount++;

        if (pastOk && ppOk) {
            correctCount++;
            if (!hintUsedForIndex.has(currentIndex)) perfectCorrectCount++;
            streak++;
            setFeedback(refs, "Correct ✓", "success");
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
                    resetInputStates(refs);
                    currentIndex++;
                    if (currentIndex < SET_SIZE) {
                        const nextVerb = currentSet[currentIndex];
                        updateUI(refs, nextVerb);
                        if (refs.card) {
                            refs.card.classList.remove("fade-out");
                            refs.card.classList.add("fade-in");
                        }
                        setInputsAndHintEnabled(refs, true);
                        refs.primaryBtn.disabled = false;
                        setFeedback(refs, "", null);
                        refs.pastInput?.focus();
                        setTimeout(() => {
                            if (refs.card) refs.card.classList.remove("fade-in");
                        }, 150);
                    } else {
                        updateProgress(refs);
                        const accuracy = Math.round((perfectCorrectCount / SET_SIZE) * 100);
                        renderFinalScreen(
                            { perfectCorrectCount, mistakesCount, accuracy },
                            () => {
                                resetState();
                                renderPracticeView();
                                initPracticeController();
                            }
                        );
                    }
                }, 150);
            }, AUTO_ADVANCE_MS);
        } else {
            wrongCount++;
            mistakesCount++;
            streak = 0;
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
        const container = refs.meaningContainer;
        const btn = refs.meaningToggleBtn;
        if (!container || !btn) return;
        const verb = currentSet[currentIndex];
        const isHidden = container.classList.contains("hidden");
        if (isHidden) {
            const meaning = verb?.meaning?.es?.[0] ?? "—";
            container.textContent = `(es: ${meaning})`;
            container.classList.remove("hidden");
            container.setAttribute("aria-hidden", "false");
            btn.textContent = "Hide meaning";
        } else {
            container.textContent = "";
            container.classList.add("hidden");
            container.setAttribute("aria-hidden", "true");
            btn.textContent = "Show meaning";
        }
    }

    function onHint() {
        const verb = currentSet[currentIndex];
        if (!verb) return;

        hintUsedCount++;
        mistakesCount++;
        hintUsedForIndex.add(currentIndex);
        wrongCount++;
        attemptsCount++;
        streak = 0;

        const pastVal = verb.forms?.past?.[0] ?? "";
        const ppVal = verb.forms?.pp?.[0] ?? "";
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

    refs.primaryBtn.addEventListener("click", () => {
        if (isSetActive) onCheck();
    });

    refs.hintBtn?.addEventListener("click", onHint);
    refs.meaningToggleBtn?.addEventListener("click", onMeaningToggle);
}
