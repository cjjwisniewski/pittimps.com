import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  extractLocationAddress,
  filterUpcomingEvents,
  parseEventsMarkdown,
  sanitizeHttpUrl
} from '../src/events.ts';

const repoRoot = process.cwd();

test('sanitizeHttpUrl allows http/https and strips markdown or rejects unsafe schemes', () => {
  assert.equal(sanitizeHttpUrl('https://vaultgamestore.com/'), 'https://vaultgamestore.com/');
  assert.equal(sanitizeHttpUrl('**[Info](https://duressfest.com/)**'), 'https://duressfest.com/');
  assert.equal(sanitizeHttpUrl('http://example.com/event'), 'http://example.com/event');
  assert.equal(sanitizeHttpUrl('javascript:alert(1)'), undefined);
  assert.equal(sanitizeHttpUrl('data:text/html,hi'), undefined);
  assert.equal(sanitizeHttpUrl('not a url'), undefined);
});

test('parseEventsMarkdown parses single dates, multi-day ranges, and expires past yearless dates', () => {
  const sample = `
## Past Explicit
- **Date**: JAN 10, 2025
- **Location**: Old Hall

## Past Yearless
- **Date**: FEB 15
- **Location**: The Vault
- **Link**: https://vaultgamestore.com/
- **Map**: https://maps.google.com/?q=The+Vault+5274+State+Route+30+Suite+18+Greensburg+PA+15601

## Cross-Month Range
- **Date**: OCT 29-NOV 1, 2026
- **Location**: Convention Center

## Same-Month Range
- **Date**: MAR 19-21, 2027
- **Location**: SoWa Power Station, Boston, MA
`;

  const ref = new Date('2026-11-18T12:00:00Z');
  const parsed = parseEventsMarkdown(sample, ref);
  assert.equal(parsed.length, 4);

  assert.equal(parsed[0].title, 'Past Explicit');
  assert.equal(parsed[0].dateObj.getFullYear(), 2025);

  assert.equal(parsed[1].title, 'Past Yearless');
  assert.equal(parsed[1].month, 'FEB');
  assert.equal(parsed[1].day, '15');
  assert.equal(parsed[1].dateObj.getFullYear(), 2026);
  assert.equal(parsed[1].link, 'https://vaultgamestore.com/');

  assert.equal(parsed[2].title, 'Cross-Month Range');
  assert.equal(parsed[2].month, 'OCT');
  assert.equal(parsed[2].day, '29');
  assert.equal(parsed[2].dateObj.getFullYear(), 2026);
  assert.equal(parsed[2].endDateObj?.getMonth(), 10); // November
  assert.equal(parsed[2].endDateObj?.getDate(), 1);

  assert.equal(parsed[3].title, 'Same-Month Range');
  assert.equal(parsed[3].month, 'MAR');
  assert.equal(parsed[3].day, '19-21');
  assert.equal(parsed[3].dateObj.getFullYear(), 2027);
  assert.equal(parsed[3].endDateObj?.getDate(), 21);

  // Only Same-Month Range is upcoming on 2026-11-18; Past Yearless must NOT roll over to 2027
  const upcoming = filterUpcomingEvents(parsed, ref);
  assert.deepEqual(
    upcoming.map((e) => e.title),
    ['Same-Month Range']
  );

  // Cross-Month Range stays active mid-event (e.g. Oct 31)
  const midEvent = filterUpcomingEvents(parsed, new Date('2026-10-31T12:00:00Z'));
  assert.deepEqual(
    midEvent.map((e) => e.title),
    ['Cross-Month Range', 'Same-Month Range']
  );
});

test('extractLocationAddress infers city/state from location text or Google Maps query', () => {
  assert.deepEqual(extractLocationAddress('SoWa Power Station, Boston, MA'), {
    addressLocality: 'Boston',
    addressRegion: 'MA',
    addressCountry: 'US'
  });
  assert.deepEqual(
    extractLocationAddress(
      'The Vault',
      'https://maps.google.com/?q=The+Vault+5274+State+Route+30+Suite+18+Greensburg+PA+15601'
    ),
    {
      addressLocality: 'Greensburg',
      addressRegion: 'PA',
      addressCountry: 'US'
    }
  );
  assert.equal(extractLocationAddress('Online Event'), undefined);
});

test('filterUpcomingEvents drops past events, sorts ascending, and limits to maxEvents', () => {
  const ref = new Date('2026-11-18T12:00:00Z');
  const markdown = `
## Past
- **Date**: NOV 01, 2026
- **Location**: A
## Fifth
- **Date**: MAY 10, 2027
- **Location**: E
## Second
- **Date**: DEC 19, 2026
- **Location**: B
## First
- **Date**: DEC 01, 2026
- **Location**: C
## Fourth
- **Date**: APR 01, 2027
- **Location**: D
## Third
- **Date**: MAR 19, 2027
- **Location**: F
`;

  const upcoming = filterUpcomingEvents(parseEventsMarkdown(markdown, ref), ref, 4);
  assert.deepEqual(
    upcoming.map((e) => e.title),
    ['First', 'Second', 'Third', 'Fourth']
  );
});

test('committed public/events.md parses cleanly without missing locations or invalid URLs', () => {
  const md = fs.readFileSync(path.join(repoRoot, 'public/events.md'), 'utf8');
  const parsed = parseEventsMarkdown(md, new Date('2026-01-01T12:00:00Z'));
  assert.ok(parsed.length > 0, 'Expected at least one event in public/events.md');

  for (const event of parsed) {
    assert.ok(event.title.length > 0);
    assert.notEqual(event.location, 'TBA');
  }
});

test('vite.config.ts builds both index.html and 404.html entries', () => {
  const viteConfig = fs.readFileSync(path.join(repoRoot, 'vite.config.ts'), 'utf8');
  assert.match(viteConfig, /index\.html/);
  assert.match(viteConfig, /404\.html/);
});
