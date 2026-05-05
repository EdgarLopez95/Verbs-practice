const APP_VERSION = "2026.05.05-pwa-refactor";
const CACHE_PREFIX = "verb-flow";
const STATIC_CACHE = `${CACHE_PREFIX}:static:${APP_VERSION}`;
const LEGACY_CACHE_PREFIXES = ["verbflow", "verb-flow:"];

const APP_SHELL_URLS = [
    "./",
    "./index.html",
    "./assets/css/styles.css",
    "./assets/manifest.json",
    "./assets/data/verbs.json",
    "./assets/icons/ico.svg",
    "./assets/icons/logo.svg",
    "./src/app/bootstrap.js",
    "./src/app/pwa/config.js",
    "./src/app/pwa/index.js",
    "./src/app/pwa/installPrompt.js",
    "./src/app/pwa/platform.js",
    "./src/app/pwa/serviceWorker.js",
    "./src/features/practice/index.js",
    "./src/features/practice/practiceController.js",
    "./src/features/practice/practiceView.js",
    "./src/services/verbsService.js",
    "./src/shared/animations/motion.js",
    "./src/shared/constants/levels.js",
    "./src/shared/utils/dom.js",
    "./src/styles/base.css",
    "./src/styles/components.css",
    "./src/styles/layout.css",
    "./src/styles/motion.css",
    "./src/styles/practice.css",
    "./src/styles/screens.css",
    "./src/styles/tokens.css"
];

async function openStaticCache() {
    return caches.open(STATIC_CACHE);
}

async function precacheAppShell() {
    const cache = await openStaticCache();
    await Promise.allSettled(
        APP_SHELL_URLS.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch(() => null)
        )
    );
}

async function deleteOldCaches() {
    const keys = await caches.keys();
    await Promise.all(
        keys
            .filter((key) => {
                if (key === STATIC_CACHE) return false;
                return LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
            })
            .map((key) => caches.delete(key))
    );
}

async function networkFirstNavigation(request) {
    try {
        const response = await fetch(request);
        const cache = await openStaticCache();
        cache.put(request, response.clone());
        return response;
    } catch {
        return (
            (await caches.match(request)) ||
            (await caches.match("./index.html")) ||
            (await caches.match("./"))
        );
    }
}

async function staleWhileRevalidate(request) {
    const cached = await caches.match(request);
    const network = fetch(request)
        .then(async (response) => {
            if (response && response.ok) {
                const cache = await openStaticCache();
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached);

    return cached || network;
}

self.addEventListener("install", (event) => {
    event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(deleteOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;

    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (event.request.mode === "navigate") {
        event.respondWith(networkFirstNavigation(event.request));
        return;
    }

    event.respondWith(staleWhileRevalidate(event.request));
});
