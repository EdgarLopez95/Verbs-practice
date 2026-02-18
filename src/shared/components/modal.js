/**
 * Modal de login: solo UI + open/close. Sin auth.
 */
export function initLoginModal() {
    const loginBtn = document.getElementById("loginBtn");
    const overlay = document.getElementById("loginModalOverlay");
    const modalBox = overlay?.querySelector(".modal-box");
    const emailInput = document.getElementById("loginModalEmail");
    const closeBtn = document.getElementById("loginModalClose");

    if (!loginBtn || !overlay || !modalBox || !emailInput || !closeBtn) return;

    function open() {
        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");
        emailInput.focus();
        document.addEventListener("keydown", handleEscape);
    }

    function close() {
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
        document.removeEventListener("keydown", handleEscape);
        loginBtn.focus();
    }

    function handleEscape(e) {
        if (e.key === "Escape") close();
    }

    loginBtn.addEventListener("click", open);

    closeBtn.addEventListener("click", close);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) close();
    });

    modalBox.addEventListener("click", (e) => e.stopPropagation());
}
