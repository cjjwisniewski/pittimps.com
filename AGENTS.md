# pittimps.com — Agent Guidelines & Repository Specifics

This repository contains the static Vite + TypeScript website for **`https://pittimps.com`** (`cjjwisniewski/pittimps.com`).

## 1. Git, CI/CD & Documentation Continuity
- **Commit & Push**: Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat(scope):`, `fix(scope):`, `chore(scope):`, `docs(scope):`, `style(scope):`) and push to `origin/main`.
- **Auto-Deploy on `main`**: Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs `npm ci`, `npm run build` (`tsc && vite build`), and uploads `./dist` to the `$web` container of Azure Storage Account `pittimpscom` via Azure OIDC.
- **Keep BookStack up to date**: When site features, event parsing (`public/events.md`), or deployment behavior change, update the **`Pitt Imps`** book in BookStack (`HomeLab` shelf, via `bookstack-mcp` at `http://127.0.0.1:8002/mcp`).

## 2. Architecture & Content Invariants
- **Multi-Entry Static Build (`vite.config.ts`)**: Rollup builds both `index.html` and `404.html` into `dist/` to match Azure Storage `$web` `index_document` / `error_404_document`.
- **Dynamic Events (`public/events.md` & `src/main.ts`)**: Upcoming events are parsed client-side from `public/events.md`, past events are filtered out, and up to 4 upcoming events are rendered using safe DOM construction.
- **UI & Style Guide**: Follow `STYLE_GUIDE.md` (dark-first slate `#020617` + Pittsburgh Gold `#ffb81c`, CSS custom properties in `src/style.css`).
- **Verification & CI-Only Tests**: `npm run check` (`tsc --noEmit`) and `npm run test` (`scripts/run-tests.mjs`) run as pre-deploy gates in GitHub Actions. Automated tests enforce `GITHUB_ACTIONS === 'true'` and are designed for CI-only execution (do not run unit tests locally).

## 3. Privacy & GDPR Compliance
- **Self-Host Fonts & Assets**: Do not load fonts, icons, stylesheets, or scripts from third-party CDNs (e.g., `fonts.googleapis.com`, `fonts.gstatic.com`, `cdnjs.cloudflare.com`, `unpkg.com`, `jsdelivr.net`). Keep `Inter` self-hosted via `@fontsource-variable/inter` and use inline SVGs so visitor IP addresses are never leaked to third parties.
- **No Third-Party Trackers**: Do not add Google Analytics, third-party tracking scripts, embeds, or non-essential cookies.
- **Keep CSP Tight**: Keep `style-src` and `font-src` restricted to `'self'` in `pittimps_infra/cloudflare.tf` so external asset leaks fail closed.
