# Pitt Imps Premodern MTG Website

This is the source code for the official website of the **Pitt Imps**, a Pittsburgh-based Premodern format Magic: the Gathering community.

The site is a fast, static web application built with **Vite**, **TypeScript**, and **Vanilla HTML/CSS**, following the dark-first slate glassmorphism aesthetic documented in [STYLE_GUIDE.md](STYLE_GUIDE.md).

## Features
- **Dynamic Event Parsing**: The Upcoming Events section is populated from [`public/events.md`](public/events.md). [`src/main.ts`](src/main.ts) parses the Markdown, filters out past events, sorts chronologically, and renders up to 4 upcoming events using safe DOM construction.
- **Modern Slate & Gold UI**: High-contrast dark slate (`#020617`) canvas with translucent glassmorphism panels, `Inter` typography, Pittsburgh Gold (`#ffb81c`) accents, and a responsive 3D Pit Imp card showcase.
- **Custom Branding**: Features a cleaned-up circular Pitt Imps emblem ([`public/pitt-imps-emblem.jpg`](public/pitt-imps-emblem.jpg)) and a scalable SVG Pit Imp favicon ([`public/favicon.svg`](public/favicon.svg)).
- **Performant & Static**: Built with Vite and deployed to Azure Storage (`$web`) via GitHub Actions.

## How to Use `events.md`
To add a new event to the website, open [`public/events.md`](public/events.md) and append an entry using this structure:

```markdown
## Premodern Tournament
- **Date**: MAR 15
- **Location**: The Vault
- **Link**: https://example.com/event-details
- **Map**: https://maps.google.com/?q=The+Vault
```

`Link` and `Map` are optional (`http://` or `https://` URLs); when provided, the event card renders `Event Info` and `Map` buttons. You can also include a year in the date (e.g., `MAR 19, 2027`). The parser automatically sorts events chronologically and hides past events once their date has passed.

## Design & Style Conventions
See [STYLE_GUIDE.md](STYLE_GUIDE.md) for color tokens, typography, layout spacing, and component patterns.

## Running Locally

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Typecheck and test (CI-only):
```bash
npm run check   # TypeScript typecheck (tsc --noEmit)
npm run test    # Runs CI-only automated tests (requires GITHUB_ACTIONS=true)
```

4. Build for production:
```bash
npm run build
```

## Contributing
We welcome contributions from Pitt Imps members! Feel free to submit an issue or pull request.

## License
[MIT License](LICENSE)
