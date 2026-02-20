# Pitt Imps Premodern MTG Website

This is the source code for the official website of the **Pitt Imps**, a Pittsburgh-based Premodern format Magic: The Gathering group.

The site is a simple, fast, and modern static site built using **Vite**, **TypeScript**, and **Vanilla HTML/CSS**.

## Features
- **Dynamic Event Parsing**: The Upcoming Events section is fully dynamically populated. Simply add new events to `public/events.md` and the frontend Javascript automatically parses it, filters out past events, and displays the next two chronological upcoming events!
- **Modern UI**: Custom CSS utilizing Pittsburgh Gold and MTG Red aesthetics, complete with glassmorphism, background blurring, and 3D card tilt effects.
- **Performant**: Serves static files resulting in lightning-fast load times.

## How to use `events.md`
To add a new event to the website, open `public/events.md` and add your event to the bottom of the list using this structure:

```markdown
## Premodern Tournament
- **Date**: MAR 15
- **Location**: The Vault
```
*Note: The script automatically handles keeping the events sorted chronologically on the webpage, and will gracefully hide the event from the UI once the date has passed.*

## Running Locally

1. Install dependencies
```bash
npm install
```

2. Start the development server
```bash
npm run dev
```

3. Build for production
```bash
npm run build
```

## Contributing

We welcome contributions from Pitt Imps members! Feel free to submit an issue or pull request. 

## License
[MIT License](LICENSE)
