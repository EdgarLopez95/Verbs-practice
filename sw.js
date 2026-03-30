/**
 * Verb Flow — Service Worker
 * Precache + respuestas desde caché para carga rápida y uso offline.
 */
const CACHE_NAME = "verbflow-v1";

const PRECACHE_URLS = [
    "./",
    "./Index.html",
    "./index.html",
    "./assets/css/styles.css",
    "./assets/manifest.json",
    "./assets/icons/logo.png",
    "./assets/data/verbs.json",
    "./src/app/bootstrap.js",
    "./src/app/installPrompt.js",
    "./src/features/practice/index.js",
    "./src/features/practice/practiceController.js",
    "./src/features/practice/practiceView.js",
    "./src/services/verbsService.js",
    "./src/shared/components/modal.js",
];

function precache() {
    return caches.open(CACHE_NAME).then((cache) =>
        Promise.allSettled(
            PRECACHE_URLS.map((url) =>
                cache.add(new Request(url, { cache: "reload" })).catch(() => null)
            )
        )
    );
}

self.addEventListener("install", (event) => {
    event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
            )
            .then(() => self.clients.claim())
    );
});

function cacheAndPut(request, response) {
    if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
}

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((res) => cacheAndPut(event.request, res))
                .catch(() =>
                    caches
                        .match(event.request)
                        .then(
                            (r) =>
                                r ||
                                caches.match("./Index.html") ||
                                caches.match("./index.html") ||
                                caches.match("./")
                        )
                )
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const networkFetch = fetch(event.request)
                .then((res) => cacheAndPut(event.request, res))
                .catch(() => cached);
            return cached || networkFetch;
        })
    );
});
