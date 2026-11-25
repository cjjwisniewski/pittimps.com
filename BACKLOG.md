# pittimps.com — Backlog

## Open

### Investigate Automatic Local Premodern Events via Wizards Event API
- **Goal:** Automatically discover and list local Pittsburgh-area Premodern (and/or Legacy) Magic: The Gathering events on `pittimps.com` instead of relying solely on manual edits to `public/events.md`.
- **Architecture Note:** Per `AGENTS.md`, `pittimps.com` must not leak visitor IPs to third-party APIs or relax CSP (`connect-src`). Prefer a **scheduled GitHub Actions workflow or build-time sync script** that queries the Wizards Event Reservations API and updates `public/events.md` (or generates a static JSON/Markdown feed) rather than fetching `api.tabletop.wizards.com` from the browser.
- **Reference Coordinates:** Pittsburgh (`lat=40.3205701`, `lng=-80.08701549999999`).
- **API Endpoints to Investigate:**
  - **List stores:**
    ```text
    https://api.tabletop.wizards.com/event-reservations-service/Organizations/by-location?lat=40.3205701&lng=-80.08701549999999&maxMeters=16093&pageSize=10000&isPremium=false
    ```
  - **List MTG events:**
    ```text
    https://api.tabletop.wizards.com/event-reservations-service/events/search?lat=40.3205701&lng=-80.08701549999999&isPremium=false&tag=magic:_the_gathering&maxMeters=16093.4&pageSize=10&page=0&sort=date&sortDirection=asc
    ```
  - **List 25 most recent Legacy events (50-mile radius):**
    ```text
    https://api.tabletop.wizards.com/event-reservations-service/events/search?lat=40.3205701&lng=-80.08701549999999&isPremium=false&tag=magic:_the_gathering&tag=legacy&maxMeters=80467&pageSize=25&page=0&sort=date&sortDirection=asc
    ```
  - **Get store information:**
    ```text
    https://api.tabletop.wizards.com/event-reservations-service/Organizations/by-ids?ids=5838
    ```
- **Investigation Tasks:**
  - Verify whether Premodern has a dedicated `tag=` in the Wizards API or if events must be matched by `title` / `description` keywords (e.g., `premodern`) across `tag=magic:_the_gathering` (or `tag=legacy` / `casual`) results.
  - Check response schema, rate limits, auth/header requirements (if any), and how store IDs map to store names/addresses.
  - Design deduplication/merge logic so manually curated events in `public/events.md` are preserved alongside auto-discovered Wizards events.
