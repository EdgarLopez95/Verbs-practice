import { loadVerbs, buildPools, buildLevelState } from "../services/verbsService.js";
import { initPractice } from "../features/practice/index.js";
import { initInstallPrompt } from "./installPrompt.js";

const LEVEL_KEYS = ["mandatory", "medium", "hard"];

export const levelsState = {};
LEVEL_KEYS.forEach((k) => { levelsState[k] = null; });

export let activeLevelKey = null;

export function setActiveLevelKey(key) {
    activeLevelKey = key;
}

export function getActiveLevelKey() {
    return activeLevelKey;
}

let lastPools = null;

const VIEW_IDS = ["levelSelect", "practice", "verbsList"];

/**
 * Muestra solo la vista indicada. No toca el header; solo cambia la vista del main.
 * heroPracticeBlock se muestra solo cuando viewId === "practice".
 */
function showView(viewId) {
    const heroBlock = document.getElementById("heroPracticeBlock");
    VIEW_IDS.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle("hidden", id !== viewId);
    });
    if (heroBlock) heroBlock.classList.toggle("hidden", viewId !== "practice");

    if (viewId === "verbsList") {
        const wrap = document.getElementById("verbsListTableWrap");
        if (wrap) wrap.scrollTop = 0;
    }
}

function showLevelSelect() {
    showView("levelSelect");
}

function showPractice() {
    showView("practice");
}

function showVerbsList() {
    showView("verbsList");
}

async function startPracticeForLevel(levelKey) {
    let verbs;
    try {
        verbs = await loadVerbs();
    } catch (e) {
        console.error("Load verbs failed", e);
        return;
    }
    if (!verbs || verbs.length === 0) {
        console.error("No verbs loaded");
        return;
    }
    lastPools = buildPools(verbs);
    const pool = lastPools[levelKey];
    if (!pool || pool.length === 0) {
        console.error("Empty pool for level", levelKey);
        return;
    }

    levelsState[levelKey] = buildLevelState(pool);

    const state = levelsState[levelKey];
    const currentVerb = state?.sets?.[0]?.[0];
    console.log("[VF] init level:", levelKey, "sets length:", state?.sets?.length, "currentVerb.base:", currentVerb?.base);

    setActiveLevelKey(levelKey);
    showPractice();
    initPractice();
    /* Evitar que el teclado se abra: blur y foco en contenedor no editable */
    if (typeof document.activeElement?.blur === "function") document.activeElement.blur();
    const practiceEl = document.getElementById("practice");
    if (practiceEl) {
        practiceEl.setAttribute("tabindex", "-1");
        practiceEl.focus({ preventScroll: true });
    }
    setTimeout(() => {
        if (typeof document.activeElement?.blur === "function") document.activeElement.blur();
        if (practiceEl) practiceEl.focus({ preventScroll: true });
    }, 0);
}

function onChangeLevel() {
    if (activeLevelKey && lastPools && lastPools[activeLevelKey]) {
        levelsState[activeLevelKey] = buildLevelState(lastPools[activeLevelKey]);
    }
    setActiveLevelKey(null);
    showLevelSelect();
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

async function renderVerbsTable(verbs) {
    const tbody = document.getElementById("verbsTableBody");
    if (!tbody) return;
    if (!verbs || verbs.length === 0) {
        tbody.innerHTML = "<tr><td colspan=\"3\">No verbs loaded.</td></tr>";
        return;
    }
    const pastStr = (v) => (Array.isArray(v.past) ? v.past.join(" / ") : String(v.past ?? ""));
    const ppStr = (v) => (Array.isArray(v.pp) ? v.pp.join(" / ") : String(v.pp ?? ""));
    tbody.innerHTML = verbs
        .map(
            (v) =>
                `<tr><td>${escapeHtml(v.base)}</td><td>${escapeHtml(pastStr(v))}</td><td>${escapeHtml(ppStr(v))}</td></tr>`
        )
        .join("");
}

async function loadAndRenderVerbsTable() {
    const verbs = await loadVerbs();
    await renderVerbsTable(verbs);
}

function initNavigation() {
    const levelCards = document.querySelectorAll(".level-card[data-level]");
    const changeLevelBtn = document.getElementById("changeLevelBtn");
    const verbsListBtn = document.getElementById("verbsListBtn");

    levelCards.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const levelKey = btn.getAttribute("data-level");
            if (!levelKey || !LEVEL_KEYS.includes(levelKey)) return;
            await startPracticeForLevel(levelKey);
        });
    });

    if (changeLevelBtn) changeLevelBtn.addEventListener("click", onChangeLevel);

    if (verbsListBtn) {
        verbsListBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await loadAndRenderVerbsTable();
            showVerbsList();
        });
    }

    const verbsListBackBtn = document.getElementById("verbsListBackBtn");
    if (verbsListBackBtn) {
        verbsListBackBtn.addEventListener("click", () => showLevelSelect());
    }
}

initNavigation();
showLevelSelect();
initInstallPrompt();

loadVerbs().catch((err) => console.error("Dataset load failed", err));
