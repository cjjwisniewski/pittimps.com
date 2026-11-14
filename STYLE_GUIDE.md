# Pitt Imps Style Guide for Agents

This document defines the visual, structural, and code conventions for **pittimps.com** so future updates to pages, components, and copy stay consistent with the site's dark-first slate and Pittsburgh Gold aesthetic (aligned with `undo.is` and `seeker.cityoftraitors.com`).

---

## 1. Visual Identity & Aesthetic

* **Theme:** Dark-first, high-contrast slate aesthetic (`#020617` canvas with a subtle top radial gold glow) paired with translucent glassmorphism surfaces and a single vibrant Pittsburgh Gold accent (`#ffb81c`).
* **Tone:** Clean, restrained, modern. Avoid heavy multi-color gradients, neon clutter, or gratuitous animations.
* **Tokens First:** Always reference the CSS custom properties defined in [`src/style.css`](src/style.css) rather than hardcoding hex or `rgba(...)` colors.

---

## 2. Color Tokens & Semantic Palette

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg-color` | `#020617` (`--c-slate-950`) | Page canvas |
| `--bg-surface` | `#0f172a` (`--c-slate-900`) | Solid inner cards, date badges, secondary buttons |
| `--bg-surface-hover` | `#1e293b` (`--c-slate-800`) | Hover state for solid surfaces |
| `--text-primary` | `#f8fafc` (`--c-slate-50`) | Headings, primary labels, active nav links |
| `--text-secondary` | `#cbd5e1` (`--c-slate-300`) | Body copy, descriptions, subtitles |
| `--text-muted` | `#64748b` (`--c-slate-500`) | De-emphasized metadata, empty states, icons |
| `--accent-color` | `#ffb81c` | Primary CTAs, eyebrows, active indicators, links |
| `--accent-hover` | `#eab308` | Hover state for accent elements |
| `--accent-alpha` | `rgba(255, 184, 28, 0.14)` | Translucent pill backgrounds (e.g., `.nav-cta`) |
| `--accent-border` | `rgba(255, 184, 28, 0.3)` | Accent pill/hover borders and logo framing |
| `--border-color` | `#1e293b` (`--c-slate-800`) | Hairline dividers, secondary button borders, sub-cards |
| `--glass-bg` | `rgba(30, 41, 59, 0.4)` | `.glass-panel` background |
| `--glass-border` | `rgba(255, 255, 255, 0.06)` | `.glass-panel` border |
| `--glass-shadow` | `rgba(0, 0, 0, 0.5)` | Hover elevation shadow |
| `--nav-bg` | `rgba(15, 23, 42, 0.8)` | Sticky header background |

---

## 3. Typography

* **Font Family:** `'Inter', system-ui, -apple-system, sans-serif` (weights `400`–`700`, loaded in [`index.html`](index.html) and [`404.html`](404.html)).
* **Headings (`h1`–`h6`):** `font-weight: 700`, `letter-spacing: -0.02em`, `color: var(--text-primary)`.
  * Page `h1`: `clamp(2rem, 4.5vw, 3rem)`, `line-height: 1.2`.
  * Section `h2`: `clamp(1.35rem, 2.5vw, 1.75rem)`, `line-height: 1.3`.
* **Body Copy:** `line-height: 1.6`–`1.7`, `color: var(--text-secondary)`. Constrain long prose paragraphs to `max-width: 62ch`.
* **Eyebrow Labels (`.eyebrow`):** `0.78rem`, `font-weight: 600`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `color: var(--accent-color)`.
* **Tabular Numerals:** Apply `font-variant-numeric: tabular-nums` to numeric date badges (`.event-date .day`).

---

## 4. Layout, Spacing & Responsiveness

* **Document Shell:** Sticky blurred `.navbar`, flex-growing `<main class="page-content">`, and bottom `.site-footer` (`margin-top: auto`).
* **Container:** `.container` uses `max-width: 960px`, `margin: 0 auto`, `padding: 0 2rem` (`0 1rem` at `max-width: 640px`).
* **Vertical Rhythm:** `gap: 3rem` between major sections (`2rem` on mobile).
* **Border Radius:** `var(--border-radius)` (`8px`) for `.glass-panel`, `.highlight-box`, `.btn`, and `.nav-cta`; `12px` for the MTG card frame; `999px` for circular logo emblems.
* **Breakpoints:**
  * `max-width: 768px` - Collapses two-column `.about-panel` to single column and resets `.mtg-card` 3D tilt.
  * `max-width: 640px` - Mobile padding adjustments, tighter navbar spacing, stacked full-width hero CTAs.
* **Hover & Motion Guards:**
  * Wrap hover lift/scale transforms in `@media (hover: hover)` so touch devices do not get stuck in hover states.
  * Respect `@media (prefers-reduced-motion: reduce)` by disabling smooth-scroll and 3D card tilt transforms.

---

## 5. Component & Asset Patterns

* **Primary Cards (`.glass-panel`):** `backdrop-filter: blur(12px)`, `1px solid var(--glass-border)`, `8px` radius, `2rem` padding (`1.25rem` on mobile). Add `.interactive` when hover lift (`-2px`) + `--accent-border` highlight is desired.
* **Nested Sub-Cards (`.highlight-box`):** Inside a `.glass-panel`, use `background: rgba(15, 23, 42, 0.55)`, `1px solid var(--border-color)`, and `0.85rem 1rem` padding in a responsive grid (`repeat(auto-fit, minmax(min(170px, 100%), 1fr))`).
* **Buttons:**
  * **Primary (`.btn-primary`):** `background: var(--accent-color)`, `color: var(--c-slate-950)`, `font-weight: 600`.
  * **Secondary (`.btn-secondary`):** `background: var(--bg-surface)`, `border: 1px solid var(--border-color)`, `color: var(--text-primary)`, hover `border-color: var(--accent-color)`.
* **Brand Assets:**
  * **Logo:** [`public/pitt-imps-emblem.jpg`](public/pitt-imps-emblem.jpg) - Square circular Pitt Imps emblem on a dark slate inner background, framed in CSS with `border-radius: 999px` and `1px solid var(--accent-border)`.
  * **Favicon:** [`public/favicon.svg`](public/favicon.svg) - Scalable SVG Pit Imp silhouette on a `#0f172a` badge with `#ffb81c` ring, paired with `<link rel="alternate icon" type="image/jpeg" href="/pitt-imps-emblem.jpg" />`.
* **Icons:** Use inline SVGs (`fill="currentColor"` or `stroke="currentColor"`, `aria-hidden="true"`) rather than external icon libraries.

---

## 6. Security & Markup Conventions

* **No `innerHTML` Injection:** Build dynamic DOM nodes (such as event cards from [`public/events.md`](public/events.md)) using `document.createElement`, `document.createElementNS`, and `textContent` in [`src/main.ts`](src/main.ts).
* **External Links:** Always include `target="_blank" rel="noopener noreferrer"`.
* **SEO & Head Metadata:** Keep `<meta name="theme-color" content="#020617" />`, `<meta name="description" ... />`, and Open Graph tags up to date in [`index.html`](index.html) and [`404.html`](404.html).
