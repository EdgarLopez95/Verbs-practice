import { SET_SIZE } from "../../shared/constants/levels.js";
import { createSvgIcon } from "../../shared/utils/dom.js";
import { animateFinalScreen } from "../../shared/animations/motion.js";

/**
 * Renders the practice UI and keeps mobile/desktop layouts separate.
 */
export function renderPracticeView() {
    const section = document.getElementById("practice");
    if (!section) return;

    section.innerHTML = "";

    const container = document.createElement("div");
    container.className = "practice";

    container.append(createMobilePractice(), createDesktopPractice());
    section.appendChild(container);
}

function createMobilePractice() {
    const mobileWrap = document.createElement("div");
    mobileWrap.className = "practice-mobile";

    const card = document.createElement("div");
    card.className = "practice-card card";

    const cardLabel = document.createElement("span");
    cardLabel.className = "practice-card-label";
    cardLabel.textContent = "Base verb";

    const verbRow = document.createElement("div");
    verbRow.className = "verb-row";

    const cardValue = document.createElement("p");
    cardValue.className = "practice-card-value";
    cardValue.innerHTML = '<span id="baseVerb">-</span>';

    const meaningToggleBtn = document.createElement("button");
    meaningToggleBtn.type = "button";
    meaningToggleBtn.id = "meaningToggleBtn";
    meaningToggleBtn.className = "practice-meaning-toggle btn-ghost-small meaning-toggle-icon";
    meaningToggleBtn.setAttribute("aria-label", "Show meaning");
    meaningToggleBtn.disabled = true;
    meaningToggleBtn.appendChild(createSvgIcon("eye", "icon icon--sm"));

    verbRow.append(cardValue, meaningToggleBtn);

    const meaningContainer = document.createElement("div");
    meaningContainer.id = "meaningContainer";
    meaningContainer.className = "practice-meaning-container hidden";
    meaningContainer.setAttribute("aria-hidden", "true");

    card.append(cardLabel, verbRow, meaningContainer);

    const inputsWrap = document.createElement("div");
    inputsWrap.className = "practice-inputs";
    inputsWrap.append(
        createPracticeLabel("pastInput", "Past"),
        createPracticeInput("pastInput", "past", "Past form"),
        createPracticeLabel("ppInput", "Past participle"),
        createPracticeInput("ppInput", "pp", "Past participle form")
    );

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
    return mobileWrap;
}

function createPracticeLabel(inputId, text) {
    const label = document.createElement("label");
    label.htmlFor = inputId;
    label.className = "practice-label";
    label.textContent = text;
    return label;
}

function createPracticeInput(id, name, ariaLabel) {
    const input = document.createElement("input");
    input.type = "text";
    input.id = id;
    input.name = name;
    input.className = "practice-input input";
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("inputmode", "text");
    input.setAttribute("aria-label", ariaLabel);
    input.spellcheck = false;
    input.disabled = true;
    return input;
}

function createDesktopPractice() {
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
        table.appendChild(createDesktopRow(i));
    }

    desktopInner.appendChild(table);
    desktopWrap.appendChild(desktopInner);
    return desktopWrap;
}

function createDesktopRow(index) {
    const row = document.createElement("div");
    row.className = "practice-desk-row";
    row.setAttribute("role", "row");
    row.dataset.rowIndex = String(index);

    const baseCell = document.createElement("span");
    baseCell.className = "practice-desk-cell practice-desk-base";
    baseCell.setAttribute("role", "cell");
    baseCell.textContent = "-";

    const pastCell = document.createElement("span");
    pastCell.className = "practice-desk-cell practice-desk-cell--input";
    pastCell.setAttribute("role", "cell");
    const pastInput = createDesktopInput(`Past form row ${index + 1}`, "practice-desk-past-input");
    pastCell.appendChild(pastInput);

    const ppCell = document.createElement("span");
    ppCell.className = "practice-desk-cell practice-desk-cell--input";
    ppCell.setAttribute("role", "cell");
    const ppInput = createDesktopInput(`Past participle row ${index + 1}`, "practice-desk-pp-input");
    ppCell.appendChild(ppInput);

    const actionsCell = document.createElement("span");
    actionsCell.className = "practice-desk-cell practice-desk-cell--actions";
    actionsCell.setAttribute("role", "cell");

    const hintBtn = document.createElement("button");
    hintBtn.type = "button";
    hintBtn.className = "practice-btn btn-secondary practice-desk-hint-btn";
    hintBtn.textContent = "Show answer";

    const checkBtn = document.createElement("button");
    checkBtn.type = "button";
    checkBtn.className = "practice-btn btn-primary practice-desk-check-btn";
    checkBtn.textContent = "Check";

    const feedback = document.createElement("span");
    feedback.className = "practice-desk-feedback";
    feedback.setAttribute("aria-live", "polite");

    actionsCell.append(hintBtn, checkBtn, feedback);
    row.append(baseCell, pastCell, ppCell, actionsCell);
    return row;
}

function createDesktopInput(ariaLabel, extraClass) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = `practice-input input ${extraClass}`;
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("aria-label", ariaLabel);
    input.spellcheck = false;
    return input;
}

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

export function getPracticeRefsDesktop() {
    const container = document.querySelector(".practice-desktop");
    const inner = document.querySelector(".practice-desktop-inner");
    const rows = [];
    const rowEls = container?.querySelectorAll(".practice-desk-row:not(.practice-desk-row--head)") ?? [];

    for (const rowEl of rowEls) {
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
    const base = verb?.base ?? "-";
    const past = Array.isArray(verb?.past) ? verb.past[0] : "";
    const pp = Array.isArray(verb?.pp) ? verb.pp[0] : "";
    return past && pp ? `${base} - ${past} / ${pp}` : base;
}

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
    title.textContent = "Set complete";

    const subtitle = document.createElement("p");
    subtitle.className = "summary-subtitle";
    subtitle.textContent = "Nice work. Keep the streak going.";

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
    listTitle.textContent = "Hints used on";
    listSection.appendChild(listTitle);

    const listContent = document.createElement("div");
    listContent.className = "summary-hints-list";
    if (hintUsedVerbs.length === 0) {
        listContent.className = "summary-hints-list summary-hints-empty";
        listContent.textContent = "Perfect run. No hints used.";
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

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "practice-btn btn-primary summary-btn";
    nextBtn.textContent = "Start another set";
    nextBtn.addEventListener("click", onStartAnotherSet);
    actionsWrap.appendChild(nextBtn);

    card.append(title, subtitle, statsGrid, listSection, actionsWrap);
    container.append(badge, card);
    section.appendChild(container);
    animateFinalScreen();
}
