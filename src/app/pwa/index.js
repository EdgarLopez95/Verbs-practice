import { initInstallPromptController } from "./installPrompt.js";
import { registerAppServiceWorker } from "./serviceWorker.js";

export function initPwa() {
    registerAppServiceWorker();
    initInstallPromptController();
}
