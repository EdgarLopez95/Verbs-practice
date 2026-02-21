import { loadVerbs, buildPools, buildLevelState } from "../services/verbsService.js";
import { initPractice } from "../features/practice/index.js";
import { initLoginModal } from "../shared/components/modal.js";

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

function showLevelSelect() {
    document.getElementById("levelSelect").classList.remove("hidden");
    document.getElementById("practice").classList.add("hidden");
    const heroBlock = document.getElementById("heroPracticeBlock");
    const changeBtn = document.getElementById("changeLevelBtn");
    if (heroBlock) heroBlock.classList.add("hidden");
    if (changeBtn) changeBtn.classList.add("hidden");
}

function showPractice() {
    document.getElementById("levelSelect").classList.add("hidden");
    document.getElementById("practice").classList.remove("hidden");
    const heroBlock = document.getElementById("heroPracticeBlock");
    const changeBtn = document.getElementById("changeLevelBtn");
    if (heroBlock) heroBlock.classList.remove("hidden");
    if (changeBtn) changeBtn.classList.remove("hidden");
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

function initGuestNavigation() {
    const levelCards = document.querySelectorAll(".level-card[data-level]");
    const changeLevelBtn = document.getElementById("changeLevelBtn");

    levelCards.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const levelKey = btn.getAttribute("data-level");
            if (!levelKey || !LEVEL_KEYS.includes(levelKey)) return;
            await startPracticeForLevel(levelKey);
        });
    });

    if (changeLevelBtn) {
        changeLevelBtn.addEventListener("click", onChangeLevel);
    }
}

initLoginModal();
initGuestNavigation();
showLevelSelect();

loadVerbs().catch((err) => console.error("Dataset load failed", err));
