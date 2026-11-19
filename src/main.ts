import '@fontsource-variable/inter';
import './style.css';
import { filterUpcomingEvents, parseEventsMarkdown, type ParsedEvent } from './events.ts';

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

// Event helpers imported from ./events.ts

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

function createCalendarIcon(): SVGSVGElement {
  return createSvgIcon([
    { tag: 'path', attrs: { d: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' } },
    { tag: 'line', attrs: { x1: '16', y1: '2', x2: '16', y2: '6' } },
    { tag: 'line', attrs: { x1: '8', y1: '2', x2: '8', y2: '6' } },
    { tag: 'line', attrs: { x1: '3', y1: '10', x2: '21', y2: '10' } },
  ]);
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatIcsDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function downloadEventIcs(event: ParsedEvent): void {
  const start = new Date(event.dateObj.getFullYear(), event.dateObj.getMonth(), event.dateObj.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const slug =
    event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'pitt-imps-event';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pitt Imps//Pittsburgh Premodern MTG//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${formatIcsDate(start)}-${slug}@pittimps.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${formatIcsDate(start)}`,
    `DTEND;VALUE=DATE:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    `DESCRIPTION:${escapeIcsText(`Pitt Imps Premodern MTG event at ${event.location}. Details: ${event.link || 'https://pittimps.com/#events'}`)}`,
    `URL:${event.link || 'https://pittimps.com/#events'}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-${formatIcsDate(start)}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function createCalendarActionButton(event: ParsedEvent): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'event-action-link';
  btn.append(createCalendarIcon(), document.createTextNode('Add to Calendar'));
  btn.addEventListener('click', () => downloadEventIcs(event));
  return btn;
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

  actionsEl.appendChild(createCalendarActionButton(event));
  infoEl.appendChild(actionsEl);

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

function injectEventStructuredData(events: ParsedEvent[]): void {
  const existing = document.getElementById('events-jsonld');
  if (existing) existing.remove();
  if (events.length === 0) return;

  const graph = events.map((event) => ({
    '@type': 'Event',
    name: event.title,
    startDate: event.dateObj.toISOString().split('T')[0],
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Pittsburgh',
        addressRegion: 'PA',
        addressCountry: 'US'
      }
    },
    organizer: {
      '@type': 'Organization',
      name: 'Pitt Imps',
      url: 'https://pittimps.com/'
    },
    ...(event.link ? { url: event.link } : { url: 'https://pittimps.com/#events' })
  }));

  const script = document.createElement('script');
  script.id = 'events-jsonld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
}

// Event Markdown Parser
async function loadEvents(): Promise<void> {
  const eventsGrid = document.getElementById('events-grid');
  if (!eventsGrid) return;

  try {
    const response = await fetch('/events.md');
    if (!response.ok) throw new Error('Failed to load events');
    const text = await response.text();

    const allEvents = parseEventsMarkdown(text);
    const eventsToDisplay = filterUpcomingEvents(allEvents);

    if (eventsToDisplay.length === 0) {
      renderEmptyEvents(eventsGrid);
      return;
    }

    eventsGrid.replaceChildren(
      ...eventsToDisplay.map((event, index) => renderEventCard(event, index === 0))
    );
    injectEventStructuredData(eventsToDisplay);
  } catch (error) {
    console.error('Error loading events:', error);
    renderEmptyEvents(eventsGrid);
  }
}

loadEvents();
