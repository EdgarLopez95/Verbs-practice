const STORAGE_KEY = "vf_pwa_install_dismissed";

function isStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches || isIOS();
}

/**
 * Registra el Service Worker en la raíz del sitio (HTTPS o localhost).
 */
export function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    const secure =
        location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";
    if (!secure) return;
    const swUrl = new URL("sw.js", document.baseURI || window.location.href).href;
    const scope = new URL("./", document.baseURI || window.location.href).href;
    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {});
}

function getLogoUrl() {
    try {
        return new URL("assets/icons/logo.png", document.baseURI || window.location.href).href;
    } catch {
        return "assets/icons/logo.png";
    }
}

/**
 * Banner estilo tarjeta de nivel (delgada): solo si no está instalada.
 * Android/Chrome: muestra al dispararse beforeinstallprompt.
 * iOS: misma tarjeta con instrucciones (sin evento de instalación nativo).
 */
export function initInstallPrompt() {
    registerServiceWorker();

    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    let deferredPrompt = null;
    let shown = false;

    const wrap = document.createElement("div");
    wrap.className = "pwa-install-wrap";
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "Instalar Verb Flow");

    const card = document.createElement("div");
    card.className = "pwa-install-card";

    const row = document.createElement("div");
    row.className = "pwa-install-card__row";

    const icon = document.createElement("img");
    icon.className = "pwa-install-card__icon";
    icon.src = getLogoUrl();
    icon.alt = "";
    icon.width = 48;
    icon.height = 48;
    icon.decoding = "async";

    const copy = document.createElement("div");
    copy.className = "pwa-install-card__copy";

    const headline = document.createElement("p");
    headline.className = "pwa-install-card__headline";
    headline.textContent = "¡Mejora tu fluidez más rápido!";

    const sub = document.createElement("p");
    sub.className = "pwa-install-card__sub";

    copy.append(headline, sub);

    row.append(icon, copy);
    card.appendChild(row);

    const cta = document.createElement("button");
    cta.type = "button";
    cta.className = "pwa-install-card__cta";
    cta.textContent = "Instalar Verb Flow";

    const dismiss = document.createElement("button");
    dismiss.type = "button";
    dismiss.className = "pwa-install-card__dismiss";
    dismiss.textContent = "Ahora no";

    function show() {
        if (shown) return;
        shown = true;
        wrap.appendChild(card);
        document.body.appendChild(wrap);
    }

    function remove() {
        localStorage.setItem(STORAGE_KEY, "1");
        wrap.remove();
    }

    dismiss.addEventListener("click", remove);

    cta.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice.catch(() => ({ outcome: "dismissed" }));
        deferredPrompt = null;
        if (choice?.outcome === "accepted") {
            remove();
        }
    });

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        if (!isMobile()) return;
        deferredPrompt = e;
        sub.textContent = "Abre Verb Flow como app desde tu pantalla de inicio.";
        card.append(cta, dismiss);
        show();
    });

    /* iOS: misma tarjeta, sin beforeinstallprompt */
    if (isIOS() && isMobile()) {
        sub.textContent =
            "Pulsa Compartir y elige «Añadir a la pantalla de inicio».";
        cta.classList.add("pwa-install-card__cta--ios");
        cta.textContent = "Entendido";
        cta.addEventListener(
            "click",
            () => {
                remove();
            },
            { once: true }
        );
        card.append(cta, dismiss);
        show();
    }
}
