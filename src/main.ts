import './style.css'

// Setup header scroll effect
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header?.classList.add('scrolled');
    } else {
        header?.classList.remove('scrolled');
    }
});

// Setup card 3D hover effect
const card = document.querySelector('.mtg-card') as HTMLDivElement;
if (card) {
    document.addEventListener('mousemove', (e) => {
        // Only apply effect if mouse is relatively close to the card or just global?
        // Let's do a subtle global effect to make it feel alive
        const x = (window.innerWidth / 2 - e.pageX) / 50;
        const y = (window.innerHeight / 2 - e.pageY) / 50;
        card.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${y}deg)`;
    });

    // Also reset to a nice tilt when mouse leaves window
    document.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateY(-15deg) rotateX(5deg)`;
    });
}

// Event Markdown Parser
async function loadEvents() {
    try {
        const response = await fetch('/events.md');
        if (!response.ok) throw new Error('Failed to load events');
        const text = await response.text();

        const eventsGrid = document.getElementById('events-grid');
        if (!eventsGrid) return;

        const sections = text.split('##').filter(s => s.trim().length > 0);

        interface ParsedEvent {
            title: string;
            location: string;
            month: string;
            day: string;
            dateObj: Date;
        }

        const allEvents: ParsedEvent[] = [];

        sections.forEach(section => {
            const lines = section.trim().split(/\r?\n/);
            const title = lines[0].trim();
            let dateString = '';
            let location = 'TBA';
            let month = '???';
            let day = '??';
            let dateObj = new Date(0); // Default to past if unparseable

            lines.slice(1).forEach(line => {
                const lowerLine = line.toLowerCase();

                if (lowerLine.indexOf('date') !== -1) {
                    const rawDate = line.split(/date/i)[1]?.replace(/^[\s:*]+/, '').trim() || '';
                    dateString = rawDate.replace(/\*\*/g, '').trim();

                    // Try to parse the date string (e.g. "OCT 14" or "Oct 14, 2026")
                    // If no year provided, Date.parse often assumes 2001. We should append current year.
                    let parseableDate = dateString;
                    if (!/\d{4}/.test(dateString)) {
                        parseableDate += `, ${new Date().getFullYear()}`;
                    }

                    const parsedTime = Date.parse(parseableDate);
                    if (!isNaN(parsedTime)) {
                        dateObj = new Date(parsedTime);

                        // If appending the current year makes it a past event (e.g. today is Nov, event is "Jan 15")
                        // then it must be for next year
                        const todayCheck = new Date();
                        todayCheck.setHours(0, 0, 0, 0);
                        if (dateObj < todayCheck && !/\d{4}/.test(dateString)) {
                            dateObj.setFullYear(dateObj.getFullYear() + 1);
                        }
                    }

                    const parts = dateString.split(' ');
                    if (parts.length >= 2) {
                        month = parts[0].substring(0, 3).toUpperCase();
                        day = parts[1].replace(/,/g, ''); // Remove commas if year is present
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

        // Get start of today for comparison (ignore time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter out past events, sort chronologically, and take top N
        const upcomingEvents = allEvents
            .filter(event => event.dateObj >= today)
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

        // CONFIGURATION: Set the maximum number of events to display
        const MAX_EVENTS = 2;
        const eventsToDisplay = upcomingEvents.slice(0, MAX_EVENTS);

        let html = '';

        eventsToDisplay.forEach(event => {
            html += `
        <div class="event-card">
            <div class="event-date">
                <span class="month">${event.month}</span>
                <span class="day">${event.day}</span>
            </div>
            <div class="event-info">
                <h3>${event.title}</h3>
                <p>Location: ${event.location}</p>
            </div>
        </div>
      `;
        });

        eventsGrid.innerHTML = html;

    } catch (error) {
        console.error('Error loading events:', error);
        const eventsGrid = document.getElementById('events-grid');
        if (eventsGrid) {
            eventsGrid.innerHTML = '<p class="text-center" style="grid-column: 1 / -1;"><em>No upcoming events scheduled right now.</em></p>';
        }
    }
}

// Load events on initialize
loadEvents();
