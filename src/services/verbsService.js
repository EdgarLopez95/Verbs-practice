let cachedVerbs = null;

/**
 * Carga el dataset de verbos desde assets/data/verbs.json.
 * Cachea el resultado en memoria (solo se hace fetch una vez).
 * @returns {Promise<Array>} Array de verbos
 */
export async function loadVerbsDataset() {
    if (cachedVerbs !== null) {
        return cachedVerbs;
    }

    const response = await fetch("assets/data/verbs.json");
    if (!response.ok) {
        throw new Error(`Failed to load verbs: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.verbs)) {
        throw new Error("Invalid dataset: missing or invalid 'verbs' array");
    }

    cachedVerbs = data.verbs;
    return cachedVerbs;
}

/**
 * Devuelve un array con `count` verbos aleatorios sin repetidos.
 * Carga el dataset si aún no está en caché.
 * @param {number} count - Cantidad de verbos a devolver
 * @returns {Promise<Array>} Array de verbos aleatorios
 */
export async function getRandomVerbs(count) {
    const verbs = await loadVerbsDataset();
    if (verbs.length === 0) return [];

    const copy = [...verbs];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(count, copy.length));
}
