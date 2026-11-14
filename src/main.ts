import './style.css';

// Set dynamic footer year
const yearEl = document.getElementById('footer-year');
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

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
}

function createPinIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '10');
  circle.setAttribute('r', '3');

  svg.append(path, circle);
  return svg;
}

function renderEventCard(event: ParsedEvent): HTMLElement {
  const cardEl = document.createElement('article');
  cardEl.className = 'glass-panel interactive event-card';

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

  const titleEl = document.createElement('h3');
  titleEl.textContent = event.title;

  const locEl = document.createElement('span');
  locEl.className = 'event-location';
  locEl.append(createPinIcon(), document.createTextNode(event.location));

  infoEl.append(titleEl, locEl);
  cardEl.append(dateEl, infoEl);
  return cardEl;
}

function renderEmptyEvents(eventsGrid: HTMLElement): void {
  const emptyEl = document.createElement('div');
  emptyEl.className = 'glass-panel events-empty';
  emptyEl.style.gridColumn = '1 / -1';
  const p = document.createElement('p');
  p.textContent = 'No upcoming events scheduled right now — check Discord for ad-hoc meetups.';
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
      });

      allEvents.push({ title, location, month, day, dateObj });
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

    eventsGrid.replaceChildren(...eventsToDisplay.map(renderEventCard));
  } catch (error) {
    console.error('Error loading events:', error);
    renderEmptyEvents(eventsGrid);
  }
}

loadEvents();
