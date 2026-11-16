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
- **Verification**: Run `npm run build` (`tsc && vite build`) when Node/npm is available before committing.
