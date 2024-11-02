const puppeteer = require('puppeteer');
const fs = require('fs');

const url = 'https://www.stubhub.com/phoenix-suns-phoenix-tickets-11-20-2024/event/154770080/?qid=24e3298a63bcfbd58f65bcd783136755&index=stubhub&ut=0f02c2f5fa9a11994a37229ffb5950bb36ccaab3&quantity=2';

// Define valid section ranges
const VALID_SECTIONS = [...Array(125 - 101 + 1).keys()].map(i => i + 101).concat([...Array(233 - 201 + 1).keys()].map(i => i + 201));
const VALID_ROW_RANGE = [...Array(28).keys()].map(i => i + 1);  // Rows from 1 to 28

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Wait for the ticket elements to load
    await page.waitForSelector('.sc-hlalgf-26');

    // Scroll and load tickets dynamically
    const collectedTickets = new Map();

    while (true) {
        // Get ticket data
        const tickets = await page.evaluate(() => {
            const ticketRows = Array.from(document.querySelectorAll('.sc-hlalgf-26'));
            const prices = Array.from(document.querySelectorAll('.sc-hlalgf-1'));
            const sections = Array.from(document.querySelectorAll('.sc-hlalgf-0'));

            return ticketRows.map((row, index) => {
                return {
                    row: row.innerText,
                    price: prices[index] ? prices[index].innerText : '',
                    section: sections[index] ? sections[index].innerText : ''
                };
            });
        });

        // Process ticket data
        for (const ticket of tickets) {
            const cleanedSection = cleanSection(ticket.section);
            const cleanedRow = cleanRow(ticket.row);
            const cleanedPrice = ticket.price.replace('$', '').trim();

            if (isValidTicket(cleanedSection, cleanedRow)) {
                const ticketKey = `${cleanedSection}-${cleanedRow}`;
                if (!collectedTickets.has(ticketKey)) {
                    collectedTickets.set(ticketKey, cleanedPrice);
                    console.log(`Valid Ticket - Section: ${cleanedSection}, Row: ${cleanedRow}, Price: $${cleanedPrice}`);
                }
            }
        }

        // Check if new tickets were loaded
        const newTicketsCount = collectedTickets.size;
        console.log(`Collected ${newTicketsCount} unique tickets`);

        // Scroll down to load more tickets
        await page.evaluate(() => {
            window.scrollBy(0, window.innerHeight);
        });

        // Wait for new tickets to load
        await page.waitForTimeout(3000);

        // Break the loop if no new tickets were found after scrolling
        if (newTicketsCount === collectedTickets.size) {
            console.log("No new tickets found. Stopping the scrape.");
            break;
        }
    }

    // Save tickets to file
    saveTicketsToFile(collectedTickets, 'ticket_info_11_20.txt');

    await browser.close();
})();

function cleanSection(sectionText) {
    return sectionText.includes('Section') ? sectionText.split("Section")[-1].trim() : sectionText.trim();
}

function cleanRow(rowText) {
    return rowText.includes('Row') ? rowText.split("Row")[-1].trim() : rowText.trim();
}

function isValidTicket(section, row) {
    return VALID_SECTIONS.includes(parseInt(section)) && VALID_ROW_RANGE.includes(parseInt(row));
}

function saveTicketsToFile(tickets, filename) {
    const lines = [];
    for (const [key, price] of tickets) {
        const [section, row] = key.split('-');
        lines.push(`Section: ${section}, Row: ${row}, Price: $${price}`);
    }
    fs.writeFileSync(filename, lines.join('\n'), 'utf8');
    console.log(`Tickets have been saved to ${filename}.`);
}
