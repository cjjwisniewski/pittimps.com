export interface ParsedEvent {
  title: string;
  location: string;
  month: string;
  day: string;
  dateObj: Date;
  link?: string;
  map?: string;
}

export function sanitizeHttpUrl(raw: string): string | undefined {
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

export function parseEventsMarkdown(text: string, referenceDate: Date = new Date()): ParsedEvent[] {
  const sections = text.split('##').filter((s) => s.trim().length > 0);
  const allEvents: ParsedEvent[] = [];

  const todayCheck = new Date(referenceDate);
  todayCheck.setHours(0, 0, 0, 0);
  const currentYear = referenceDate.getFullYear();

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
          parseableDate += `, ${currentYear}`;
        }

        const parsedTime = Date.parse(parseableDate);
        if (!isNaN(parsedTime)) {
          dateObj = new Date(parsedTime);

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

  return allEvents;
}

export function filterUpcomingEvents(
  events: ParsedEvent[],
  referenceDate: Date = new Date(),
  maxEvents = 4
): ParsedEvent[] {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  return events
    .filter((event) => event.dateObj >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, maxEvents);
}
