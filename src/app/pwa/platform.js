import { PWA_CONFIG } from "./config.js";

export function isStandaloneMode() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

export function isIosDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isMobileViewport() {
    return window.matchMedia(PWA_CONFIG.mobileQuery).matches || isIosDevice();
}

export function isSecureAppOrigin() {
    return (
        location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1"
    );
}

export function canRegisterServiceWorker() {
    return "serviceWorker" in navigator && isSecureAppOrigin();
}

export function wasInstallPromptDismissed() {
    try {
        return localStorage.getItem(PWA_CONFIG.installDismissKey) === "1";
    } catch {
        return false;
    }
}

export function markInstallPromptDismissed() {
    try {
        localStorage.setItem(PWA_CONFIG.installDismissKey, "1");
    } catch {
        // Storage can be unavailable in strict/private modes. The prompt can still work.
    }
}
