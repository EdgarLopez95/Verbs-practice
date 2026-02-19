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
    //cardLabel.textContent = "Base form";
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
    pastInput.autocapitalize = "none";
    pastInput.autocorrect = "off";
    pastInput.spellcheck = false;
    pastInput.setAttribute("inputmode", "text");
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
    ppInput.autocapitalize = "none";
    ppInput.autocorrect = "off";
    ppInput.spellcheck = false;
    ppInput.setAttribute("inputmode", "text");
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
        card: document.querySelector(".practice-card"),
    };
}

/**
 * Muestra la pantalla final del set (resumen premium).
 * @param {{ perfectCorrectCount: number, mistakesCount: number, accuracy: number }} stats
 * @param {() => void} onStartAnotherSet - callback al pulsar "Start another set"
 */
export function renderFinalScreen(stats, onStartAnotherSet) {
    const section = document.getElementById("practice");
    if (!section) return;

    section.innerHTML = "";
    const container = document.createElement("div");
    container.className = "practice-summary";

    const badge = document.createElement("span");
    badge.className = "summary-badge";
    badge.textContent = "10 verbs";

    const card = document.createElement("div");
    card.className = "summary-card card";

    const title = document.createElement("h2");
    title.className = "summary-title";
    title.textContent = "Set complete 🎉";

    const subtitle = document.createElement("p");
    subtitle.className = "summary-subtitle";
    subtitle.textContent = "Nice work — keep the streak going.";

    const statsGrid = document.createElement("div");
    statsGrid.className = "summary-stats-grid";
    statsGrid.innerHTML = `
        <div class="summary-stat-chip">
            <span class="summary-stat-value">${stats.perfectCorrectCount}/10</span>
            <span class="summary-stat-label">Perfect correct</span>
        </div>
        <div class="summary-stat-chip">
            <span class="summary-stat-value">${stats.mistakesCount}</span>
            <span class="summary-stat-label">Mistakes</span>
        </div>
        <div class="summary-stat-chip summary-stat-chip-full">
            <span class="summary-stat-value">${stats.accuracy}%</span>
            <span class="summary-stat-label">Accuracy</span>
        </div>
    `;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "practice-btn btn-primary summary-btn";
    btn.textContent = "Start another set";
    btn.addEventListener("click", onStartAnotherSet);

    card.append(title, subtitle, statsGrid, btn);
    container.append(badge, card);
    section.appendChild(container);
}
