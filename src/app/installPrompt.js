const STORAGE_KEY = "vf_install_banner_dismissed";

function isMobileViewport() {
    return window.matchMedia("(max-width: 768px)").matches;
}

function isMobileUserAgent() {
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function isStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    const ok =
        location.protocol === "https:" ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1";
    if (!ok) return;
    const url = new URL("sw.js", document.baseURI || window.location.href).href;
    navigator.serviceWorker.register(url, { scope: new URL("./", document.baseURI || window.location.href).href }).catch(() => {});
}

/**
 * Banner para instalar la web como app en el móvil (Android: beforeinstallprompt; iOS: instrucciones).
 */
export function initInstallPrompt() {
    registerServiceWorker();

    if (localStorage.getItem(STORAGE_KEY)) return;
    if (isStandalone()) return;
    if (!isMobileViewport() && !isMobileUserAgent()) return;

    const banner = document.createElement("div");
    banner.className = "install-banner";
    banner.setAttribute("role", "region");
    banner.setAttribute("aria-label", "Instalar aplicación");

    const inner = document.createElement("div");
    inner.className = "install-banner__inner";

    const title = document.createElement("p");
    title.className = "install-banner__title";
    title.textContent = "Instala Verb Flow en tu teléfono";

    const text = document.createElement("p");
    text.className = "install-banner__text";

    if (isIOS()) {
        text.textContent =
            "Pulsa Compartir y elige «Añadir a la pantalla de inicio» para usarla como app.";
    } else {
        text.textContent =
            "Puedes instalar esta página como app: usa el menú del navegador (⋮) y «Instalar aplicación» o «Añadir a la pantalla de inicio».";
    }

    const actions = document.createElement("div");
    actions.className = "install-banner__actions";

    const installBtn = document.createElement("button");
    installBtn.type = "button";
    installBtn.className = "install-banner__btn install-banner__btn--primary";
    installBtn.textContent = "Instalar";
    installBtn.hidden = true;

    const dismissBtn = document.createElement("button");
    dismissBtn.type = "button";
    dismissBtn.className = "install-banner__btn install-banner__btn--ghost";
    dismissBtn.textContent = "Ahora no";

    let deferredPrompt = null;

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        installBtn.hidden = false;
        if (!isIOS()) {
            text.textContent =
                "Instala Verb Flow como app en tu dispositivo para abrirla rápido desde la pantalla de inicio.";
        }
    });

    installBtn.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice.catch(() => {});
        deferredPrompt = null;
        installBtn.hidden = true;
    });

    dismissBtn.addEventListener("click", () => {
        localStorage.setItem(STORAGE_KEY, "1");
        banner.remove();
    });

    actions.append(installBtn, dismissBtn);
    inner.append(title, text, actions);
    banner.appendChild(inner);
    document.body.appendChild(banner);
}
