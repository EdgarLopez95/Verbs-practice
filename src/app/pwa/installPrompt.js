import { PWA_CONFIG } from "./config.js";
import {
    isIosDevice,
    isMobileViewport,
    isStandaloneMode,
    markInstallPromptDismissed,
    wasInstallPromptDismissed,
} from "./platform.js";

function resolveLogoUrl() {
    return new URL("assets/icons/logo.svg", document.baseURI || window.location.href).href;
}

function createInstallBanner({ mode, promptEvent }) {
    const wrap = document.createElement("div");
    wrap.className = "pwa-install-wrap";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", `Install ${PWA_CONFIG.appName}`);

    const card = document.createElement("div");
    card.className = "pwa-install-card";

    const row = document.createElement("div");
    row.className = "pwa-install-card__row";

    const icon = document.createElement("img");
    icon.className = "pwa-install-card__icon";
    icon.src = resolveLogoUrl();
    icon.alt = "";
    icon.width = 48;
    icon.height = 48;
    icon.decoding = "async";

    const copy = document.createElement("div");
    copy.className = "pwa-install-card__copy";

    const headline = document.createElement("p");
    headline.className = "pwa-install-card__headline";
    headline.textContent = "Instala Verb Flow";

    const sub = document.createElement("p");
    sub.className = "pwa-install-card__sub";
    sub.textContent =
        mode === "ios"
            ? "Pulsa Compartir y elige Anadir a pantalla de inicio."
            : "Abrela como app desde tu pantalla de inicio.";

    copy.append(headline, sub);
    row.append(icon, copy);

    const installButton = document.createElement("button");
    installButton.type = "button";
    installButton.className = "pwa-install-card__cta";
    installButton.textContent = mode === "ios" ? "Entendido" : "Instalar";

    const dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.className = "pwa-install-card__dismiss";
    dismissButton.textContent = "Ahora no";

    function close({ remember = true } = {}) {
        if (remember) markInstallPromptDismissed();
        wrap.remove();
    }

    dismissButton.addEventListener("click", () => close());

    installButton.addEventListener("click", async () => {
        if (mode === "ios") {
            close();
            return;
        }

        if (!promptEvent) return;

        promptEvent.prompt();
        const choice = await promptEvent.userChoice.catch(() => ({ outcome: "dismissed" }));
        close({ remember: choice?.outcome !== "accepted" });
    });

    card.append(row, installButton, dismissButton);
    wrap.appendChild(card);
    return wrap;
}

function canShowInstallUi() {
    return isMobileViewport() && !isStandaloneMode() && !wasInstallPromptDismissed();
}

export function initInstallPromptController() {
    if (!canShowInstallUi()) return;

    let banner = null;
    let nativePromptEvent = null;

    function showBanner(mode, promptEvent = null) {
        if (banner || !canShowInstallUi()) return;
        banner = createInstallBanner({ mode, promptEvent });
        document.body.appendChild(banner);
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        nativePromptEvent = event;
        showBanner("native", nativePromptEvent);
    });

    if (isIosDevice()) {
        window.setTimeout(() => showBanner("ios"), 800);
    }
}
