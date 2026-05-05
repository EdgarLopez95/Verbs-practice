import { loadVerbs, buildPools, buildLevelState } from "../services/verbsService.js";
import { initPractice } from "../features/practice/index.js";
import { initPwa } from "./pwa/index.js";
import { LEVEL_KEYS } from "../shared/constants/levels.js";
import { escapeHtml, qsa, setHidden } from "../shared/utils/dom.js";
import { animateLevelScreen, animateViewEnter } from "../shared/animations/motion.js";

export const levelsState = {};
LEVEL_KEYS.forEach((key) => {
    levelsState[key] = null;
});

export let activeLevelKey = null;

export function setActiveLevelKey(key) {
    activeLevelKey = key;
}

export function getActiveLevelKey() {
    return activeLevelKey;
}

let lastPools = null;

const VIEW_IDS = ["levelSelect", "practice", "verbsList"];

function showView(viewId) {
    const heroBlock = document.getElementById("heroPracticeBlock");

    VIEW_IDS.forEach((id) => {
        setHidden(document.getElementById(id), id !== viewId);
    });
    setHidden(heroBlock, viewId !== "practice");

    if (viewId === "verbsList") {
        const wrap = document.getElementById("verbsListTableWrap");
        if (wrap) wrap.scrollTop = 0;
    }

    animateViewEnter(viewId);
    if (viewId === "levelSelect") animateLevelScreen();
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
    } catch (error) {
        console.error("Load verbs failed", error);
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
    setActiveLevelKey(levelKey);
    showPractice();
    initPractice();

    // Keep mobile keyboards closed until the user intentionally taps an input.
    if (typeof document.activeElement?.blur === "function") document.activeElement.blur();
    const practiceEl = document.getElementById("practice");
    if (practiceEl) {
        practiceEl.setAttribute("tabindex", "-1");
        practiceEl.focus({ preventScroll: true });
    }
    setTimeout(() => {
        if (typeof document.activeElement?.blur === "function") document.activeElement.blur();
        practiceEl?.focus({ preventScroll: true });
    }, 0);
}

function onChangeLevel() {
    if (activeLevelKey && lastPools?.[activeLevelKey]) {
        levelsState[activeLevelKey] = buildLevelState(lastPools[activeLevelKey]);
    }
    setActiveLevelKey(null);
    showLevelSelect();
}

async function renderVerbsTable(verbs) {
    const tbody = document.getElementById("verbsTableBody");
    if (!tbody) return;

    if (!verbs || verbs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">No verbs loaded.</td></tr>';
        return;
    }

    const pastStr = (verb) => (Array.isArray(verb.past) ? verb.past.join(" / ") : String(verb.past ?? ""));
    const ppStr = (verb) => (Array.isArray(verb.pp) ? verb.pp.join(" / ") : String(verb.pp ?? ""));

    tbody.innerHTML = verbs
        .map(
            (verb) =>
                `<tr><td>${escapeHtml(verb.base)}</td><td>${escapeHtml(pastStr(verb))}</td><td>${escapeHtml(ppStr(verb))}</td></tr>`
        )
        .join("");
}

async function loadAndRenderVerbsTable() {
    const verbs = await loadVerbs();
    await renderVerbsTable(verbs);
}

function initNavigation() {
    const levelCards = qsa(".level-card[data-level]");
    const homeLogoBtn = document.getElementById("homeLogoBtn");
    const changeLevelBtn = document.getElementById("changeLevelBtn");
    const verbsListBtn = document.getElementById("verbsListBtn");
    const verbsListBackBtn = document.getElementById("verbsListBackBtn");

    levelCards.forEach((btn) => {
        btn.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            const levelKey = btn.getAttribute("data-level");
            if (!levelKey || !LEVEL_KEYS.includes(levelKey)) return;
            await startPracticeForLevel(levelKey);
        });
    });

    homeLogoBtn?.addEventListener("click", onChangeLevel);
    changeLevelBtn?.addEventListener("click", onChangeLevel);

    verbsListBtn?.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await loadAndRenderVerbsTable();
        showVerbsList();
    });

    verbsListBackBtn?.addEventListener("click", showLevelSelect);
}

initNavigation();
showLevelSelect();
initPwa();

loadVerbs().catch((error) => console.error("Dataset load failed", error));
