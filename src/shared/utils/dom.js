export function qs(selector, root = document) {
    return root.querySelector(selector);
}

export function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

export function setHidden(element, hidden) {
    if (!element) return;
    element.classList.toggle("hidden", hidden);
}

export function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}

export function createSvgIcon(name, className = "icon") {
    const icons = {
        target: '<path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/>',
        list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        bolt: '<path d="m13 2-9 13h7l-1 7 9-13h-7l1-7z"/>',
        spark: '<path d="M12 3 9.7 8.5 4 10.8l5.7 2.3L12 19l2.3-5.9 5.7-2.3-5.7-2.3L12 3z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>',
        eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    };

    const wrapper = document.createElement("span");
    wrapper.className = className;
    wrapper.setAttribute("aria-hidden", "true");
    wrapper.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icons[name] ?? icons.spark}</svg>`;
    return wrapper;
}
