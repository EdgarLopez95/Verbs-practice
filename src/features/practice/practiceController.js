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
let isShowingNext = false;

function resetState() {
    currentSet = [];
    currentIndex = 0;
    isSetActive = false;
    correctCount = 0;
    attemptsCount = 0;
    wrongCount = 0;
    streak = 0;
    isShowingNext = false;
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

    updateUI(refs);
    setInputsAndHintEnabled(refs, false);
    refs.primaryBtn.textContent = "Start set";
    isShowingNext = false;
    refs.feedback.textContent = "";
    refs.feedback.classList.remove("feedback-success", "feedback-error");

    async function onStartSet() {
        try {
            currentSet = await getRandomVerbs(SET_SIZE);
            currentIndex = 0;
            correctCount = 0;
            attemptsCount = 0;
            wrongCount = 0;
            streak = 0;
            isSetActive = true;
            isShowingNext = false;
            const verb = currentSet[currentIndex];
            updateUI(refs, verb);
            setInputsAndHintEnabled(refs, true);
            refs.primaryBtn.textContent = "Check";
            setFeedback(refs, "", null);
        } catch (err) {
            setFeedback(refs, "Could not load verbs.", "error");
        }
    }

    function onCheck() {
        const verb = currentSet[currentIndex];
        if (!verb) return;

        const pastVal = refs.pastInput?.value ?? "";
        const ppVal = refs.ppInput?.value ?? "";
        const pastOk = matchesForm(pastVal, verb.forms?.past);
        const ppOk = matchesForm(ppVal, verb.forms?.pp);

        attemptsCount++;

        if (pastOk && ppOk) {
            correctCount++;
            streak++;
            setFeedback(refs, "Correct!", "success");
            refs.primaryBtn.textContent = "Next";
            isShowingNext = true;
        } else {
            wrongCount++;
            streak = 0;
            setFeedback(refs, "Not quite. Try again.", "error");
            refs.pastInput?.focus();
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

    function onNext() {
        currentIndex++;
        if (currentIndex < SET_SIZE) {
            const verb = currentSet[currentIndex];
            updateUI(refs, verb);
            refs.primaryBtn.textContent = "Check";
            isShowingNext = false;
            setFeedback(refs, "", null);
        } else {
            renderFinalScreen(
                { correctCount, attemptsCount },
                () => {
                    resetState();
                    renderPracticeView();
                    initPracticeController();
                }
            );
        }
    }

    function onHint() {
        const verb = currentSet[currentIndex];
        if (!verb) return;

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
        if (!isSetActive) {
            onStartSet();
        } else if (isShowingNext) {
            onNext();
        } else {
            onCheck();
        }
    });

    refs.hintBtn?.addEventListener("click", onHint);
    refs.meaningToggleBtn?.addEventListener("click", onMeaningToggle);
}
