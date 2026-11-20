export interface ParsedEvent {
  title: string;
  location: string;
  month: string;
  day: string;
  dateObj: Date;
  endDateObj?: Date;
  link?: string;
  map?: string;
}

export interface EventPostalAddress {
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
}

export function extractLocationAddress(
  location: string,
  mapUrl?: string
): EventPostalAddress | undefined {
  // 1. Try explicit "City, ST" inside the location text (e.g. "SoWa Power Station, Boston, MA (Mar 19-21)")
  const locMatch = location.match(/(?:^|,\s*)([A-Za-z][A-Za-z.\s-]{1,40}),\s*([A-Z]{2})(?:\b|$)/);
  if (locMatch) {
    return {
      addressLocality: locMatch[1].trim(),
      addressRegion: locMatch[2],
      addressCountry: 'US'
    };
  }

  // 2. Fallback: extract "City ST 12345" from the Google Maps query string
  if (mapUrl) {
    try {
      const parsed = new URL(mapUrl);
      const q = (parsed.searchParams.get('q') || '').replace(/\+/g, ' ');
      const mapMatch = q.match(
        /(?:^|[,\s])([A-Za-z][A-Za-z.-]{1,30}),?\s+([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/
      );
      if (mapMatch) {
        return {
          addressLocality: mapMatch[1].trim(),
          addressRegion: mapMatch[2],
          addressCountry: 'US'
        };
      }
    } catch {
      // ignore malformed map URL
    }
  }

  return undefined;
}

function parseDateRange(
  dateString: string,
  currentYear: number
): { dateObj: Date; endDateObj?: Date; month: string; day: string } {
  const normalized = dateString.replace(/[–—]/g, '-').trim();
  const explicitYearMatch = normalized.match(/\b(\d{4})\b/);
  const year = explicitYearMatch ? Number.parseInt(explicitYearMatch[1], 10) : currentYear;
  const withoutYear = normalized.replace(/,?\s*\b\d{4}\b/, '').trim();

  // Case 1: Cross-month range e.g. "OCT 29-NOV 1" or "OCT 29 - NOV 1"
  const crossMonth = withoutYear.match(/^([A-Za-z]+)\s+(\d{1,2})\s*-\s*([A-Za-z]+)\s+(\d{1,2})$/);
  if (crossMonth) {
    const [, startMon, startDay, endMon, endDay] = crossMonth;
    const startTs = Date.parse(`${startMon} ${startDay}, ${year}`);
    const endTs = Date.parse(`${endMon} ${endDay}, ${year}`);
    const dateObj = !isNaN(startTs) ? new Date(startTs) : new Date(0);
    let endDateObj = !isNaN(endTs) ? new Date(endTs) : undefined;
    if (endDateObj && !isNaN(startTs) && endDateObj < dateObj) {
      // Cross-year range like "DEC 30-JAN 2"
      endDateObj.setFullYear(endDateObj.getFullYear() + 1);
    }
    return {
      dateObj,
      endDateObj,
      month: startMon.substring(0, 3).toUpperCase(),
      day: startDay
    };
  }

  // Case 2: Same-month range e.g. "MAR 19-21"
  const sameMonth = withoutYear.match(/^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2})$/);
  if (sameMonth) {
    const [, mon, startDay, endDay] = sameMonth;
    const startTs = Date.parse(`${mon} ${startDay}, ${year}`);
    const endTs = Date.parse(`${mon} ${endDay}, ${year}`);
    return {
      dateObj: !isNaN(startTs) ? new Date(startTs) : new Date(0),
      endDateObj: !isNaN(endTs) ? new Date(endTs) : undefined,
      month: mon.substring(0, 3).toUpperCase(),
      day: `${startDay}-${endDay}`
    };
  }

  // Case 3: Single date e.g. "DEC 19, 2026" or "DEC 19"
  const parseableDate = explicitYearMatch ? normalized : `${normalized}, ${year}`;
  const parsedTime = Date.parse(parseableDate);
  const dateObj = !isNaN(parsedTime) ? new Date(parsedTime) : new Date(0);

  const parts = normalized.split(/\s+/);
  let month = '???';
  let day = '??';
  if (parts.length >= 2) {
    month = parts[0].substring(0, 3).toUpperCase();
    day = parts[1].replace(/,/g, '');
  } else if (normalized.length > 0) {
    month = normalized.substring(0, 3).toUpperCase();
  }

  return { dateObj, month, day };
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

  const currentYear = referenceDate.getFullYear();

  sections.forEach((section) => {
    const lines = section.trim().split(/\r?\n/);
    const title = lines[0].trim();
    let location = 'TBA';
    let link: string | undefined;
    let map: string | undefined;
    let month = '???';
    let day = '??';
    let dateObj = new Date(0);
    let endDateObj: Date | undefined;

    lines.slice(1).forEach((line) => {
      const lowerLine = line.toLowerCase();

      if (lowerLine.indexOf('date') !== -1) {
        const rawDate = line.split(/date/i)[1]?.replace(/^[\s:*]+/, '').trim() || '';
        const dateString = rawDate.replace(/\*\*/g, '').trim();
        const parsed = parseDateRange(dateString, currentYear);
        dateObj = parsed.dateObj;
        endDateObj = parsed.endDateObj;
        month = parsed.month;
        day = parsed.day;
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

    allEvents.push({
      title,
      location,
      month,
      day,
      dateObj,
      ...(endDateObj ? { endDateObj } : {}),
      link,
      map
    });
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
    .filter((event) => (event.endDateObj ?? event.dateObj) >= today)
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
    .slice(0, maxEvents);
}
