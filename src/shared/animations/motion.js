const DEFAULT_EASE = "power3.out";

function gsapInstance() {
    return window.gsap || null;
}

export function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canAnimate() {
    return Boolean(gsapInstance()) && !prefersReducedMotion();
}

export function animateViewEnter(viewId) {
    if (!canAnimate()) return;
    const gsap = gsapInstance();
    const view = document.getElementById(viewId);
    if (!view) return;

    gsap.killTweensOf(view);
    gsap.fromTo(
        view,
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.34, ease: DEFAULT_EASE, clearProps: "opacity,visibility,transform" }
    );
}

export function animateLevelScreen() {
    if (!canAnimate()) return;
    const gsap = gsapInstance();
    gsap.fromTo(
        [".level-hero", ".level-intro"],
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: 0.32, stagger: 0.06, ease: DEFAULT_EASE, clearProps: "opacity,visibility,transform" }
    );
    gsap.fromTo(
        ".level-card",
        { autoAlpha: 0, y: 18, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, stagger: 0.08, ease: DEFAULT_EASE, clearProps: "opacity,visibility,transform" }
    );
}

export function animatePracticeEnter() {
    if (!canAnimate()) return;
    const gsap = gsapInstance();
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    const targets = isDesktop ? ".practice-desk-row" : [".practice-card", ".practice-inputs", ".practice-actions"];
    gsap.fromTo(
        targets,
        { autoAlpha: 0, y: isDesktop ? 10 : 16 },
        { autoAlpha: 1, y: 0, duration: 0.34, stagger: isDesktop ? 0.035 : 0.07, ease: DEFAULT_EASE, clearProps: "opacity,visibility,transform" }
    );
}

export function animateSuccess(target) {
    if (!target) return;
    if (!canAnimate()) {
        target.classList.add("success-animate");
        setTimeout(() => target.classList.remove("success-animate"), 260);
        return;
    }
    gsapInstance().fromTo(target, { scale: 0.985 }, { scale: 1, duration: 0.24, ease: "back.out(2.2)", clearProps: "transform" });
}

export function animateError(target) {
    if (!target) return;
    if (!canAnimate()) {
        target.classList.add("error-animate");
        setTimeout(() => target.classList.remove("error-animate"), 300);
        return;
    }
    gsapInstance().fromTo(target, { x: -5 }, { x: 0, duration: 0.28, ease: "elastic.out(1, 0.35)", clearProps: "transform" });
}

export function animateHint(targets) {
    if (!targets || !canAnimate()) return;
    gsapInstance().fromTo(
        targets,
        { boxShadow: "0 0 0 0 rgba(255, 242, 87, 0)" },
        {
            boxShadow: "0 0 0 5px rgba(255, 242, 87, 0.34)",
            duration: 0.22,
            yoyo: true,
            repeat: 1,
            ease: "sine.out",
            clearProps: "boxShadow",
        }
    );
}

export function animateFinalScreen() {
    if (!canAnimate()) return;
    gsapInstance().fromTo(
        [".summary-badge", ".summary-card"],
        { autoAlpha: 0, y: 18, scale: 0.985 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.42, stagger: 0.08, ease: DEFAULT_EASE, clearProps: "opacity,visibility,transform" }
    );
}
