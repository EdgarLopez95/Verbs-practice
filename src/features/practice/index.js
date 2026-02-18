import { renderPracticeView } from "./practiceView.js";
import { initPracticeController } from "./practiceController.js";

/**
 * Inicializa la feature Practice: render + controlador.
 */
export function initPractice() {
    renderPracticeView();
    initPracticeController();
}
