/**
 * Render de la UI de práctica y referencias DOM.
 */
export function renderPracticeView() {
    const section = document.getElementById("practice");
    if (!section) return;

    section.innerHTML = "";

    const container = document.createElement("div");
    container.className = "practice";

    // Verb card: Base form | row (baseVerb + meaningToggleBtn) | meaningContainer debajo
    const card = document.createElement("div");
    card.className = "practice-card card";
    const cardLabel = document.createElement("span");
    cardLabel.className = "practice-card-label";
    cardLabel.textContent = "Base form";
    const verbRow = document.createElement("div");
    verbRow.className = "verb-row";
    const cardValue = document.createElement("p");
    cardValue.className = "practice-card-value";
    cardValue.innerHTML = '<span id="baseVerb">—</span>';
    const meaningToggleBtn = document.createElement("button");
    meaningToggleBtn.type = "button";
    meaningToggleBtn.id = "meaningToggleBtn";
    meaningToggleBtn.className = "practice-meaning-toggle btn-link";
    meaningToggleBtn.textContent = "Show meaning";
    meaningToggleBtn.disabled = true;
    verbRow.append(cardValue, meaningToggleBtn);
    const meaningContainer = document.createElement("div");
    meaningContainer.id = "meaningContainer";
    meaningContainer.className = "practice-meaning-container hidden";
    meaningContainer.setAttribute("aria-hidden", "true");
    card.append(cardLabel, verbRow, meaningContainer);

    // Inputs
    const inputsWrap = document.createElement("div");
    inputsWrap.className = "practice-inputs";

    const pastLabel = document.createElement("label");
    pastLabel.htmlFor = "pastInput";
    pastLabel.className = "practice-label";
    pastLabel.textContent = "Past";
    const pastInput = document.createElement("input");
    pastInput.type = "text";
    pastInput.id = "pastInput";
    pastInput.className = "practice-input input";
    pastInput.autocomplete = "off";
    pastInput.spellcheck = false;
    pastInput.disabled = true;
    pastInput.setAttribute("aria-label", "Past form");

    const ppLabel = document.createElement("label");
    ppLabel.htmlFor = "ppInput";
    ppLabel.className = "practice-label";
    ppLabel.textContent = "Past participle";
    const ppInput = document.createElement("input");
    ppInput.type = "text";
    ppInput.id = "ppInput";
    ppInput.className = "practice-input input";
    ppInput.autocomplete = "off";
    ppInput.spellcheck = false;
    ppInput.disabled = true;
    ppInput.setAttribute("aria-label", "Past participle form");

    inputsWrap.append(pastLabel, pastInput, ppLabel, ppInput);

    // Botones: primaryBtn "Start set", hintBtn "Show answer (2s)" disabled
    const actions = document.createElement("div");
    actions.className = "practice-actions";
    const primaryBtn = document.createElement("button");
    primaryBtn.type = "button";
    primaryBtn.id = "primaryBtn";
    primaryBtn.className = "practice-btn btn-primary";
    primaryBtn.textContent = "Start set";
    const hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.id = "hintBtn";
    hintBtn.className = "practice-btn btn-secondary";
    hintBtn.textContent = "Show answer (2s)";
    hintBtn.disabled = true;
    actions.append(primaryBtn, hintBtn);

    // Feedback
    const feedback = document.createElement("div");
    feedback.className = "practice-feedback";
    feedback.id = "feedback";
    feedback.setAttribute("aria-live", "polite");
    feedback.setAttribute("aria-atomic", "true");

    container.append(card, inputsWrap, actions, feedback);
    section.appendChild(container);
}

/**
 * Retorna referencias a los elementos de la UI de práctica.
 * Debe llamarse después de renderPracticeView().
 */
export function getPracticeRefs() {
    return {
        setCount: document.getElementById("setCount"),
        progressBar: document.getElementById("progressBar"),
        progressWrap: document.getElementById("progressWrap"),
        progressText: document.getElementById("progressText"),
        baseVerb: document.getElementById("baseVerb"),
        pastInput: document.getElementById("pastInput"),
        ppInput: document.getElementById("ppInput"),
        primaryBtn: document.getElementById("primaryBtn"),
        hintBtn: document.getElementById("hintBtn"),
        feedback: document.getElementById("feedback"),
        meaningToggleBtn: document.getElementById("meaningToggleBtn"),
        meaningContainer: document.getElementById("meaningContainer"),
    };
}

/**
 * Muestra la pantalla final del set (resumen).
 * @param {{ correctCount: number, attemptsCount: number }} stats
 * @param {() => void} onStartAnotherSet - callback al pulsar "Start another set"
 */
export function renderFinalScreen(stats, onStartAnotherSet) {
    const section = document.getElementById("practice");
    if (!section) return;

    const accuracy =
        stats.attemptsCount > 0
            ? Math.round((stats.correctCount / stats.attemptsCount) * 100)
            : 0;

    section.innerHTML = "";
    const container = document.createElement("div");
    container.className = "practice-summary";

    const title = document.createElement("h2");
    title.textContent = "Set complete";

    const statsBlock = document.createElement("div");
    statsBlock.className = "practice-summary-stats";
    statsBlock.innerHTML = `
        <p>Correct: ${stats.correctCount}</p>
        <p>Attempts: ${stats.attemptsCount}</p>
        <p>Accuracy: ${accuracy}%</p>
    `;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "practice-btn btn-primary";
    btn.textContent = "Start another set";
    btn.addEventListener("click", onStartAnotherSet);

    container.append(title, statsBlock, btn);
    section.appendChild(container);
}
