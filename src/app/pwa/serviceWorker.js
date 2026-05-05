import { PWA_CONFIG } from "./config.js";
import { canRegisterServiceWorker } from "./platform.js";

function resolveFromBase(path) {
    return new URL(path, document.baseURI || window.location.href).href;
}

export function registerAppServiceWorker() {
    if (!canRegisterServiceWorker()) {
        return Promise.resolve(null);
    }

    const swUrl = resolveFromBase(PWA_CONFIG.serviceWorkerUrl);
    const scope = resolveFromBase(PWA_CONFIG.serviceWorkerScope);

    return navigator.serviceWorker.register(swUrl, { scope }).catch((error) => {
        console.warn("[PWA] Service worker registration failed", error);
        return null;
    });
}
