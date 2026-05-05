# Verb Flow Frontend Architecture

## Visual Direction

Verb Flow now uses a compact brand system based on the logo:

- Primary action: `#2563EB`
- Accent glow and soft surfaces: `#6FD4F7`
- Highlight and reward accent: `#FFF257`
- Main text: `#0F172A`
- Secondary text: `#475569`
- App background: `#EEF4FB` with blue, cyan, and yellow radial light

The desktop experience keeps a strong gradient hero and wide practice table. The mobile experience stays task-first: large verb card, accessible inputs, and full-width actions.

## CSS Structure

- `src/styles/tokens.css`: brand palette, gradients, shadows, radii, spacing, and layout constants.
- `src/styles/base.css`: resets, focus states, icons, reduced motion, and shared document rules.
- `src/styles/layout.css`: app shell, header, hero, progress area, and main view containers.
- `src/styles/components.css`: buttons, inputs, cards, modal, feedback, progress, and PWA install card.
- `src/styles/screens.css`: level selection and verbs list screens.
- `src/styles/practice.css`: mobile and desktop practice layouts.
- `src/styles/motion.css`: CSS fallback animations used when GSAP is unavailable or reduced motion is active.

`assets/css/styles.css` only imports those modules so GitHub Pages can keep the same public CSS entry point.

## JavaScript Structure

- `src/shared/constants/levels.js`: shared level and set constants.
- `src/shared/utils/dom.js`: DOM helpers and inline SVG icon creation.
- `src/shared/animations/motion.js`: GSAP-backed animation helpers with reduced-motion and no-GSAP fallbacks.
- `src/app/pwa`: install prompt, platform detection, PWA config, and service worker registration.
- `src/features/practice`: practice view rendering and controller logic remain feature-scoped.
- `src/services/verbsService.js`: dataset loading and verb pool logic remain service-scoped.

## PWA Structure

The PWA layer was rebuilt from scratch and split by responsibility:

- `src/app/pwa/config.js`: app name, storage key, service worker path, and mobile breakpoint.
- `src/app/pwa/platform.js`: standalone/iOS/mobile/secure-origin detection.
- `src/app/pwa/serviceWorker.js`: service worker registration only.
- `src/app/pwa/installPrompt.js`: native Android/Chrome prompt plus iOS install instructions.
- `src/app/pwa/index.js`: single `initPwa()` entry point used by `bootstrap.js`.
- `sw.js`: root service worker with app-shell precache, old-cache cleanup, navigation fallback, and stale-while-revalidate for same-origin assets.
- `assets/manifest.json`: install metadata for app name, icon, display mode, scope, theme color, and categories.
