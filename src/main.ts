import './style.css';

// Set dynamic footer year
const yearEl = document.getElementById('footer-year');
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

// Discord temporary invite modal
const discordModal = document.getElementById('discord-modal');
const discordCloseBtn = document.getElementById('discord-modal-close');
const discordCancelBtn = document.getElementById('discord-modal-cancel');
const discordContinueLink = document.getElementById('discord-modal-continue');
let lastFocusedTrigger: HTMLElement | null = null;

function openDiscordModal(trigger: HTMLElement): void {
  if (!discordModal) return;
  lastFocusedTrigger = trigger;
  discordModal.hidden = false;
  document.body.style.overflow = 'hidden';
  discordContinueLink?.focus();
}

function closeDiscordModal(): void {
  if (!discordModal || discordModal.hidden) return;
  discordModal.hidden = true;
  document.body.style.overflow = '';
  lastFocusedTrigger?.focus();
  lastFocusedTrigger = null;
}

document.querySelectorAll<HTMLAnchorElement>('[data-discord-invite]').forEach((link) => {
  link.addEventListener('click', (e) => {
    if (!discordModal) return;
    e.preventDefault();
    openDiscordModal(link);
  });
});

discordCloseBtn?.addEventListener('click', closeDiscordModal);
discordCancelBtn?.addEventListener('click', closeDiscordModal);
discordContinueLink?.addEventListener('click', closeDiscordModal);

discordModal?.addEventListener('click', (e) => {
  if (e.target === discordModal) {
    closeDiscordModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && discordModal && !discordModal.hidden) {
    closeDiscordModal();
  }
});

// Setup card 3D hover effect (hover devices only, respecting reduced motion)
const card = document.querySelector('.mtg-card') as HTMLDivElement | null;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const supportsHover = window.matchMedia('(hover: hover)').matches;

if (card && !prefersReducedMotion && supportsHover) {
  document.addEventListener('mousemove', (e) => {
    const x = (window.innerWidth / 2 - e.pageX) / 60;
    const y = (window.innerHeight / 2 - e.pageY) / 60;
    card.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg)`;
  });

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', `${mx}%`);
    card.style.setProperty('--my', `${my}%`);
  });

  document.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateY(-10deg) rotateX(4deg)';
  });
}

interface ParsedEvent {
  title: string;
  location: string;
  month: string;
  day: string;
  dateObj: Date;
  link?: string;
  map?: string;
}

function sanitizeHttpUrl(raw: string): string | undefined {
  const trimmed = raw.replace(/\*\*/g, '').trim();
  const mdMatch = trimmed.match(/^\[[^\]]*\]\((https?:\/\/[^\s)]+)\)$/i);
  const candidate = mdMatch ? mdMatch[1] : trimmed;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function createSvgIcon(
  elements: Array<{ tag: 'path' | 'circle' | 'polyline' | 'line' | 'polygon'; attrs: Record<string, string> }>
): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  elements.forEach(({ tag, attrs }) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    svg.appendChild(el);
  });

  return svg;
}

function createPinIcon(): SVGSVGElement {
  return createSvgIcon([
    { tag: 'path', attrs: { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' } },
    { tag: 'circle', attrs: { cx: '12', cy: '10', r: '3' } }
  ]);
}

function createExternalLinkIcon(): SVGSVGElement {
  return createSvgIcon([
    { tag: 'path', attrs: { d: 'M15 3h6v6' } },
    { tag: 'path', attrs: { d: 'M10 14 21 3' } },
    { tag: 'path', attrs: { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' } }
  ]);
}

function createMapIcon(): SVGSVGElement {
  return createSvgIcon([
    { tag: 'polygon', attrs: { points: '3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21' } },
    { tag: 'line', attrs: { x1: '9', x2: '9', y1: '3', y2: '18' } },
    { tag: 'line', attrs: { x1: '15', x2: '15', y1: '6', y2: '21' } }
  ]);
}

function createEventActionLink(
  href: string,
  label: string,
  icon: SVGSVGElement
): HTMLAnchorElement {
  const linkEl = document.createElement('a');
  linkEl.className = 'event-action-link';
  linkEl.href = href;
  linkEl.target = '_blank';
  linkEl.rel = 'noopener noreferrer';
  linkEl.append(icon, document.createTextNode(label));
  return linkEl;
}

function renderEventCard(event: ParsedEvent, isNext: boolean): HTMLElement {
  const cardEl = document.createElement('article');
  cardEl.className = isNext
    ? 'glass-panel interactive event-card is-next'
    : 'glass-panel interactive event-card';

  const dateEl = document.createElement('div');
  dateEl.className = 'event-date';

  const monthEl = document.createElement('span');
  monthEl.className = 'month';
  monthEl.textContent = event.month;

  const dayEl = document.createElement('span');
  dayEl.className = 'day';
  dayEl.textContent = event.day;

  dateEl.append(monthEl, dayEl);

  const infoEl = document.createElement('div');
  infoEl.className = 'event-info';

  const titleRowEl = document.createElement('div');
  titleRowEl.className = 'event-title-row';

  const titleEl = document.createElement('h3');
  titleEl.textContent = event.title;
  titleRowEl.appendChild(titleEl);

  if (isNext) {
    const badgeEl = document.createElement('span');
    badgeEl.className = 'next-pill';
    badgeEl.textContent = 'Next Up';
    titleRowEl.appendChild(badgeEl);
  }

  const locEl = document.createElement('span');
  locEl.className = 'event-location';
  locEl.append(createPinIcon(), document.createTextNode(event.location));

  infoEl.append(titleRowEl, locEl);

  if (event.link || event.map) {
    const actionsEl = document.createElement('div');
    actionsEl.className = 'event-actions';

    if (event.link) {
      actionsEl.appendChild(
        createEventActionLink(event.link, 'Event Info', createExternalLinkIcon())
      );
    }

    if (event.map) {
      actionsEl.appendChild(createEventActionLink(event.map, 'Map', createMapIcon()));
    }

    infoEl.appendChild(actionsEl);
  }

  cardEl.append(dateEl, infoEl);
  return cardEl;
}

function renderEmptyEvents(eventsGrid: HTMLElement): void {
  const emptyEl = document.createElement('div');
  emptyEl.className = 'glass-panel events-empty';
  emptyEl.style.gridColumn = '1 / -1';
  const p = document.createElement('p');
  p.textContent = 'No upcoming events scheduled right now - check Discord for ad-hoc meetups.';
  emptyEl.appendChild(p);
  eventsGrid.replaceChildren(emptyEl);
}

// Event Markdown Parser
async function loadEvents(): Promise<void> {
  const eventsGrid = document.getElementById('events-grid');
  if (!eventsGrid) return;

  try {
    const response = await fetch('/events.md');
    if (!response.ok) throw new Error('Failed to load events');
    const text = await response.text();

    const sections = text.split('##').filter((s) => s.trim().length > 0);
    const allEvents: ParsedEvent[] = [];

    sections.forEach((section) => {
      const lines = section.trim().split(/\r?\n/);
      const title = lines[0].trim();
      let dateString = '';
      let location = 'TBA';
      let link: string | undefined;
      let map: string | undefined;
      let month = '???';
      let day = '??';
      let dateObj = new Date(0);

      lines.slice(1).forEach((line) => {
        const lowerLine = line.toLowerCase();

        if (lowerLine.indexOf('date') !== -1) {
          const rawDate = line.split(/date/i)[1]?.replace(/^[\s:*]+/, '').trim() || '';
          dateString = rawDate.replace(/\*\*/g, '').trim();

          let parseableDate = dateString;
          if (!/\d{4}/.test(dateString)) {
            parseableDate += `, ${new Date().getFullYear()}`;
          }

          const parsedTime = Date.parse(parseableDate);
          if (!isNaN(parsedTime)) {
            dateObj = new Date(parsedTime);

            const todayCheck = new Date();
            todayCheck.setHours(0, 0, 0, 0);
            if (dateObj < todayCheck && !/\d{4}/.test(dateString)) {
              dateObj.setFullYear(dateObj.getFullYear() + 1);
            }
          }

          const parts = dateString.split(' ');
          if (parts.length >= 2) {
            month = parts[0].substring(0, 3).toUpperCase();
            day = parts[1].replace(/,/g, '');
          } else {
            month = dateString.substring(0, 3).toUpperCase();
          }
        }

        if (lowerLine.indexOf('location') !== -1) {
          const rawLoc = line.split(/location/i)[1]?.replace(/^[\s:*]+/, '').trim() || '';
          location = rawLoc.replace(/\*\*/g, '').trim();
        }

        const linkMatch = line.match(/^[-*]\s*\*{0,2}link\*{0,2}\s*:\s*(.+)$/i);
        if (linkMatch) {
          link = sanitizeHttpUrl(linkMatch[1]);
        }

        const mapMatch = line.match(/^[-*]\s*\*{0,2}map\*{0,2}\s*:\s*(.+)$/i);
        if (mapMatch) {
          map = sanitizeHttpUrl(mapMatch[1]);
        }
      });

      allEvents.push({ title, location, month, day, dateObj, link, map });
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = allEvents
      .filter((event) => event.dateObj >= today)
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

    const MAX_EVENTS = 4;
    const eventsToDisplay = upcomingEvents.slice(0, MAX_EVENTS);

    if (eventsToDisplay.length === 0) {
      renderEmptyEvents(eventsGrid);
      return;
    }

    eventsGrid.replaceChildren(
      ...eventsToDisplay.map((event, index) => renderEventCard(event, index === 0))
    );
  } catch (error) {
    console.error('Error loading events:', error);
    renderEmptyEvents(eventsGrid);
  }
}

loadEvents();
