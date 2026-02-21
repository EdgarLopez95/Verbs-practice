let cachedVerbs = null;
let cachedPools = null;

function toArray(val) {
    if (val == null) return [];
    if (Array.isArray(val)) return val.map((x) => String(x ?? "").trim()).filter(Boolean);
    return [String(val).trim()].filter(Boolean);
}

function toMeaningString(val) {
    if (val == null) return "";
    if (typeof val === "string") return val.trim();
    if (Array.isArray(val)) return (val[0] != null ? String(val[0]) : "").trim();
    if (typeof val === "object" && val.es != null) return toMeaningString(val.es);
    return "";
}

/**
 * Modelo interno único: { base, past[], pp[], meaning, difficulty }.
 * Retorna null si el verbo es inválido (sin base o past/pp vacíos).
 */
function normalizeVerb(v) {
    const base =
        (typeof v.base === "string" && v.base.trim()) ? v.base.trim()
        : (v.forms?.base != null ? toArray(v.forms.base)[0] : "") || (v.id != null ? String(v.id) : "");
    const past = toArray(v.past ?? v.forms?.past);
    const pp = toArray(v.pp ?? v.forms?.pp);
    const meaning =
        typeof v.meaning === "string" ? v.meaning.trim()
        : toMeaningString(v.meaning ?? v.meaningEs ?? v.meaning?.es);
    const difficulty =
        typeof v.difficulty === "number" && v.difficulty >= 1 && v.difficulty <= 10
            ? v.difficulty
            : 1;

    if (!base || past.length === 0 || pp.length === 0) return null;
    return { base, past, pp, meaning, difficulty };
}

/**
 * Carga y normaliza el dataset. Filtra inválidos.
 * @returns {Promise<Array<{ base, past, pp, meaning, difficulty }>>}
 */
export async function loadVerbs() {
    if (cachedVerbs !== null) return cachedVerbs;

    const url = new URL("assets/data/verbs.json", document.baseURI || window.location.href).href;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load verbs: ${response.status}`);

    const data = await response.json();
    const raw = Array.isArray(data) ? data : (data && data.verbs);
    if (!Array.isArray(raw) || raw.length === 0) {
        throw new Error("Invalid dataset: missing or empty verbs array");
    }

    const normalized = raw.map(normalizeVerb).filter(Boolean);
    const filtered = raw.length - normalized.length;
    if (filtered > 0) {
        console.warn("[VF] filtered invalid verbs:", filtered);
    }

    cachedVerbs = normalized;
    console.log("[VF] verbs length:", cachedVerbs.length);
    return cachedVerbs;
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) {
        out.push(arr.slice(i, i + size));
    }
    return out;
}

/**
 * Rellena un array hasta length n reusando elementos de source (ciclo).
 */
function fillFrom(source, n) {
    if (!source.length || n <= 0) return [];
    const out = [];
    for (let i = 0; i < n; i++) {
        out.push(source[i % source.length]);
    }
    return out;
}

/**
 * Pools por ranking de difficulty: sorted asc → slice(0,50), slice(50,100), slice(100,150).
 * Siempre 50 por nivel; si hay menos de 150 verbos se rellena por ciclo y se hace warn.
 */
export function buildPools(verbs) {
    if (cachedPools !== null) return cachedPools;

    const sorted = [...verbs].sort((a, b) => a.difficulty - b.difficulty);

    let mandatory = sorted.slice(0, 50);
    let medium = sorted.slice(50, 100);
    let hard = sorted.slice(100, 150);

    if (mandatory.length < 50) {
        const had = mandatory.length;
        mandatory = fillFrom(sorted, 50);
        console.warn("[VF] mandatory pool filled from", had, "to 50 (insufficient data by range)");
    }
    if (medium.length < 50) {
        medium = fillFrom(sorted, 50);
        console.warn("[VF] medium pool filled to 50 (insufficient data by range)");
    }
    if (hard.length < 50) {
        hard = fillFrom(sorted, 50);
        console.warn("[VF] hard pool filled to 50 (insufficient data by range)");
    }

    cachedPools = { mandatory, medium, hard };
    console.log("[VF] pools:", { mandatory: mandatory.length, medium: medium.length, hard: hard.length });
    return cachedPools;
}

/**
 * Crea estado del nivel: pool de 50 → shuffle → chunk(10) → 5 sets.
 * @param {Array} pool - 50 verbos
 * @returns {{ sets: Array<Array>, setIndex: number, verbIndex: number }}
 */
export function buildLevelState(pool) {
    if (!pool || pool.length === 0) {
        return { sets: [], setIndex: 0, verbIndex: 0 };
    }
    const shuffled = shuffle([...pool]);
    const sets = chunk(shuffled, 10);
    return { sets, setIndex: 0, verbIndex: 0 };
}

export function getCurrentSet(levelState) {
    if (!levelState?.sets?.length) return [];
    const set = levelState.sets[levelState.setIndex];
    return Array.isArray(set) ? set : [];
}

export function getCurrentVerb(levelState) {
    const currentSet = getCurrentSet(levelState);
    const idx = levelState?.verbIndex ?? 0;
    return currentSet[idx] ?? null;
}

/**
 * Avanza verbIndex. Si llega a 10, avanza setIndex y verbIndex=0.
 * Si setIndex >= número de sets (o >= 5), reshuffle todos los verbos y vuelve a set 0.
 */
export function advanceVerb(levelState) {
    if (!levelState) return;
    levelState.verbIndex++;
    if (levelState.verbIndex >= 10) {
        levelState.setIndex++;
        levelState.verbIndex = 0;
        const numSets = levelState.sets?.length ?? 0;
        if (levelState.setIndex >= numSets || levelState.setIndex >= 5) {
            const allVerbs = levelState.sets.flat();
            if (allVerbs.length > 0) {
                levelState.sets = chunk(shuffle(allVerbs), 10);
            }
            levelState.setIndex = 0;
        }
    }
}
