const SET_SIZE = 10;

/**
 * Render de la UI de práctica y referencias DOM.
 * Genera markup dual: .practice-mobile (visible en móvil) y .practice-desktop (visible en desktop vía CSS).
 */
export function renderPracticeView() {
    const section = document.getElementById("practice");
    if (!section) return;

    section.innerHTML = "";

    const container = document.createElement("div");
    container.className = "practice";

    // --- Bloque móvil: card + inputs + actions (sin cambios de estructura/IDs)
    const mobileWrap = document.createElement("div");
    mobileWrap.className = "practice-mobile";

    const card = document.createElement("div");
    card.className = "practice-card card";
    const cardLabel = document.createElement("span");
    cardLabel.className = "practice-card-label";
    const verbRow = document.createElement("div");
    verbRow.className = "verb-row";
    const cardValue = document.createElement("p");
    cardValue.className = "practice-card-value";
    cardValue.innerHTML = '<span id="baseVerb">—</span>';
    const meaningToggleBtn = document.createElement("button");
    meaningToggleBtn.type = "button";
    meaningToggleBtn.id = "meaningToggleBtn";
    meaningToggleBtn.className = "practice-meaning-toggle btn-ghost-small meaning-toggle-icon";
    meaningToggleBtn.setAttribute("aria-label", "Show meaning");
    meaningToggleBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
    meaningToggleBtn.disabled = true;
    verbRow.append(cardValue, meaningToggleBtn);
    const meaningContainer = document.createElement("div");
    meaningContainer.id = "meaningContainer";
    meaningContainer.className = "practice-meaning-container hidden";
    meaningContainer.setAttribute("aria-hidden", "true");
    card.append(cardLabel, verbRow, meaningContainer);

    const inputsWrap = document.createElement("div");
    inputsWrap.className = "practice-inputs";

    const pastLabel = document.createElement("label");
    pastLabel.htmlFor = "pastInput";
    pastLabel.className = "practice-label";
    pastLabel.textContent = "Past";
    const pastInput = document.createElement("input");
    pastInput.type = "text";
    pastInput.id = "pastInput";
    pastInput.name = "past";
    pastInput.className = "practice-input input";
    pastInput.setAttribute("autocomplete", "off");
    pastInput.setAttribute("autocapitalize", "none");
    pastInput.setAttribute("autocorrect", "off");
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
    ppInput.name = "pp";
    ppInput.className = "practice-input input";
    ppInput.setAttribute("autocomplete", "off");
    ppInput.setAttribute("autocapitalize", "none");
    ppInput.setAttribute("autocorrect", "off");
    ppInput.spellcheck = false;
    ppInput.setAttribute("inputmode", "text");
    ppInput.disabled = true;
    ppInput.setAttribute("aria-label", "Past participle form");

    inputsWrap.append(pastLabel, pastInput, ppLabel, ppInput);

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

    const feedback = document.createElement("div");
    feedback.className = "practice-feedback";
    feedback.id = "feedback";
    feedback.setAttribute("aria-live", "polite");
    feedback.setAttribute("aria-atomic", "true");

    mobileWrap.append(card, inputsWrap, actions, feedback);
    container.appendChild(mobileWrap);

    // --- Bloque desktop: tabla/lista con 10 filas (oculto por defecto, visible en @media 1024px)
    const desktopWrap = document.createElement("div");
    desktopWrap.className = "practice-desktop";

    const desktopInner = document.createElement("div");
    desktopInner.className = "practice-desktop-inner";

    const table = document.createElement("div");
    table.className = "practice-desk-table";
    table.setAttribute("role", "table");
    table.setAttribute("aria-label", "Practice set");

    const headerRow = document.createElement("div");
    headerRow.className = "practice-desk-row practice-desk-row--head";
    headerRow.setAttribute("role", "row");
    headerRow.innerHTML = `
        <span class="practice-desk-cell practice-desk-base" role="columnheader">Verb</span>
        <span class="practice-desk-cell practice-desk-cell--past" role="columnheader">Past</span>
        <span class="practice-desk-cell practice-desk-cell--pp" role="columnheader">Past participle</span>
        <span class="practice-desk-cell practice-desk-cell--actions" role="columnheader">Actions</span>
    `;
    table.appendChild(headerRow);

    for (let i = 0; i < SET_SIZE; i++) {
        const row = document.createElement("div");
        row.className = "practice-desk-row";
        row.setAttribute("role", "row");
        row.dataset.rowIndex = String(i);

        const baseCell = document.createElement("span");
        baseCell.className = "practice-desk-cell practice-desk-base";
        baseCell.setAttribute("role", "cell");
        baseCell.textContent = "—";

        const pastCell = document.createElement("span");
        pastCell.className = "practice-desk-cell practice-desk-cell--input";
        pastCell.setAttribute("role", "cell");
        const pastInputDesk = document.createElement("input");
        pastInputDesk.type = "text";
        pastInputDesk.className = "practice-input input practice-desk-past-input";
        pastInputDesk.setAttribute("autocomplete", "off");
        pastInputDesk.setAttribute("autocapitalize", "none");
        pastInputDesk.setAttribute("aria-label", `Past form row ${i + 1}`);
        pastCell.appendChild(pastInputDesk);

        const ppCell = document.createElement("span");
        ppCell.className = "practice-desk-cell practice-desk-cell--input";
        ppCell.setAttribute("role", "cell");
        const ppInputDesk = document.createElement("input");
        ppInputDesk.type = "text";
        ppInputDesk.className = "practice-input input practice-desk-pp-input";
        ppInputDesk.setAttribute("autocomplete", "off");
        ppInputDesk.setAttribute("autocapitalize", "none");
        ppInputDesk.setAttribute("aria-label", `Past participle row ${i + 1}`);
        ppCell.appendChild(ppInputDesk);

        const actionsCell = document.createElement("span");
        actionsCell.className = "practice-desk-cell practice-desk-cell--actions";
        actionsCell.setAttribute("role", "cell");
        const hintBtnDesk = document.createElement("button");
        hintBtnDesk.type = "button";
        hintBtnDesk.className = "practice-btn btn-secondary practice-desk-hint-btn";
        hintBtnDesk.textContent = "Show answer";
        const checkBtnDesk = document.createElement("button");
        checkBtnDesk.type = "button";
        checkBtnDesk.className = "practice-btn btn-primary practice-desk-check-btn";
        checkBtnDesk.textContent = "Check";
        const feedbackDesk = document.createElement("span");
        feedbackDesk.className = "practice-desk-feedback";
        feedbackDesk.setAttribute("aria-live", "polite");
        actionsCell.append(hintBtnDesk, checkBtnDesk, feedbackDesk);

        row.append(baseCell, pastCell, ppCell, actionsCell);
        table.appendChild(row);
    }

    desktopInner.appendChild(table);
    desktopWrap.appendChild(desktopInner);
    container.appendChild(desktopWrap);

    section.appendChild(container);
}

/**
 * Retorna referencias a los elementos de la UI de práctica (móvil).
 * Debe llamarse después de renderPracticeView().
 */
export function getPracticeRefs() {
    return {
        setCount: document.getElementById("setCount"),
        verbCount: document.getElementById("verbCount"),
        progressBar: document.getElementById("progressBar"),
        progressFill: document.getElementById("progressFill"),
        progressText: document.getElementById("progressText"),
        baseVerb: document.getElementById("baseVerb"),
        pastInput: document.getElementById("pastInput"),
        ppInput: document.getElementById("ppInput"),
        primaryBtn: document.getElementById("primaryBtn"),
        hintBtn: document.getElementById("hintBtn"),
        feedback: document.getElementById("feedback"),
        meaningToggleBtn: document.getElementById("meaningToggleBtn"),
        meaningContainer: document.getElementById("meaningContainer"),
        card: document.querySelector(".practice-mobile .practice-card"),
    };
}

/**
 * Retorna referencias a la UI de práctica desktop (tabla de filas).
 * Debe llamarse después de renderPracticeView() cuando matchMedia('(min-width: 1024px)').matches.
 */
export function getPracticeRefsDesktop() {
    const container = document.querySelector(".practice-desktop");
    const inner = document.querySelector(".practice-desktop-inner");
    const rows = [];
    const rowEls = container?.querySelectorAll(".practice-desk-row:not(.practice-desk-row--head)") ?? [];
    for (let i = 0; i < rowEls.length; i++) {
        const rowEl = rowEls[i];
        rows.push({
            baseEl: rowEl.querySelector(".practice-desk-base"),
            pastInput: rowEl.querySelector(".practice-desk-past-input"),
            ppInput: rowEl.querySelector(".practice-desk-pp-input"),
            hintBtn: rowEl.querySelector(".practice-desk-hint-btn"),
            checkBtn: rowEl.querySelector(".practice-desk-check-btn"),
            feedbackEl: rowEl.querySelector(".practice-desk-feedback"),
            rowEl,
        });
    }
    return { container, inner, rows };
}

function formatVerbLine(verb) {
    const base = verb?.base ?? "—";
    const past = Array.isArray(verb?.past) ? verb.past[0] : "";
    const pp = Array.isArray(verb?.pp) ? verb.pp[0] : "";
    return past && pp ? `${base} — ${past} / ${pp}` : base;
}

/**
 * Muestra la pantalla final del set (resumen + lista de verbos con hint).
 * @param {{ correct: number, incorrect: number, accuracy: number, hintUsedVerbs: Array }} stats
 * @param {() => void} onStartAnotherSet - callback al pulsar "Start another set"
 * @param {() => void} [onRepeatSet] - callback al pulsar "Repeat this set"
 */
export function renderFinalScreen(stats, onStartAnotherSet, onRepeatSet) {
    const section = document.getElementById("practice");
    if (!section) return;

    const { correct, incorrect, accuracy, hintUsedVerbs = [] } = stats;

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
            <span class="summary-stat-value">${correct}/10</span>
            <span class="summary-stat-label">Correct</span>
        </div>
        <div class="summary-stat-chip">
            <span class="summary-stat-value">${incorrect}/10</span>
            <span class="summary-stat-label">Hints used</span>
        </div>
        <div class="summary-stat-chip summary-stat-chip-full">
            <span class="summary-stat-value">${accuracy}%</span>
            <span class="summary-stat-label">Accuracy</span>
        </div>
    `;

    const listSection = document.createElement("div");
    listSection.className = "summary-hints-section";
    const listTitle = document.createElement("h3");
    listTitle.className = "summary-hints-title";
    listTitle.textContent = "Hints used on:";
    listSection.appendChild(listTitle);

    const listContent = document.createElement("div");
    listContent.className = "summary-hints-list";
    if (hintUsedVerbs.length === 0) {
        listContent.className = "summary-hints-list summary-hints-empty";
        listContent.textContent = "Perfect run — no hints used 🎉";
    } else {
        hintUsedVerbs.forEach((verb) => {
            const row = document.createElement("div");
            row.className = "summary-hints-row";
            row.textContent = formatVerbLine(verb);
            listContent.appendChild(row);
        });
    }
    listSection.appendChild(listContent);

    const actionsWrap = document.createElement("div");
    actionsWrap.className = "summary-actions";

    if (typeof onRepeatSet === "function") {
        const repeatBtn = document.createElement("button");
        repeatBtn.type = "button";
        repeatBtn.className = "practice-btn btn-secondary summary-btn summary-btn-repeat";
        repeatBtn.textContent = "Repeat this set";
        repeatBtn.addEventListener("click", onRepeatSet);
        actionsWrap.appendChild(repeatBtn);
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "practice-btn btn-primary summary-btn";
    btn.textContent = "Start another set";
    btn.addEventListener("click", onStartAnotherSet);
    actionsWrap.appendChild(btn);

    card.append(title, subtitle, statsGrid, listSection, actionsWrap);
    container.append(badge, card);
    section.appendChild(container);
}
