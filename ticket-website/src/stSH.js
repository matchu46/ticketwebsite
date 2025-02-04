// Required dependencies
const puppeteer = require('puppeteer');  // For web scraping
const sqlite3 = require('sqlite3').verbose(); // For SQLite DB
const fs = require('fs');                // For file operations

// Configuration constants
const url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-3-21-2025/event/154770078/?quantity=2";
const outputFile = "sun_sh_03_21.txt";
const gameDate = "03-21-2025";
const homeTeam = "Suns";
const awayTeam = "Cavaliers";
const source = "StubHub"; // Assuming this is the source

// Initialize the database and create the `tickets` table if it doesn't exist
const dbFile = "tickets.db";
const db = new sqlite3.Database(dbFile);

db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        section TEXT,
        row TEXT,
        price REAL,
        estimated_price REAL,
        url TEXT UNIQUE,
        source TEXT NOT NULL
    )
`, (err) => {
    if (err) console.error("Error creating table:", err.message);
});

// Main function using async/await for browser automation
(async () => {
    // Launch browser with specific Chrome path
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Users\\Owner\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe',
        headless: false,  // Show the browser window for debugging
    });

    // Create a new page
    const page = await browser.newPage();

    // Navigate to the target URL and wait for network activity to settle
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Remove any loading overlays that might interfere with scraping
    await page.evaluate(() => {
        const overlay = document.querySelector('.loading-overlay, .spinner-class');
        if (overlay) {
            overlay.style.display = 'none';
        }
    });

    // Set to store unique ticket information and avoid duplicates
    const collectedTickets = new Set();

    // Function to collect ticket information from the page
    const collectTickets = async () => {
        // Find all ticket elements that have a listing ID
        const ticketElements = await page.$$('div[data-listing-id]');
        console.log(`Found ${ticketElements.length} ticket elements.`);

        // Process each ticket element
        for (const ticketElement of ticketElements) {
            try {
                // Extract the listing ID from the ticket element
                const listingId = await ticketElement.evaluate(el => el.getAttribute('data-listing-id'));
                console.log(`Extracted listingId: ${listingId}`);

                // Skip if no listing ID is found
                if (!listingId) {
                    console.error('Listing ID not found for this element. Skipping...');
                    continue;
                }

                // Construct the complete ticket URL with the listing ID
                const ticketUrl = `https://www.stubhub.com/phoenix-suns-phoenix-tickets-3-21-2025/event/154770078/?quantity=2&listingId=${listingId}`;

                // Extract section information using the specific class selector
                const section = await ticketElement.$eval('.sc-1t1b4cp-0.sc-1t1b4cp-6.eMtQWq.dQzlcE', el => {
                    const sectionText = el.innerText.trim();
                    const sectionMatch = sectionText.match(/Section\s*(\d+)/);
                    return sectionMatch ? sectionMatch[1] : null;
                });

                // Extract row information using the specific class selector
                const row = await ticketElement.$eval('.sc-1t1b4cp-25.eYtDdR', el => {
                    const rowText = el.innerText.trim();
                    const rowMatch = rowText.match(/Row\s*(\d+)/);
                    return rowMatch ? rowMatch[1] : null;
                });

                // Extract and clean up price text
                const priceText = await ticketElement.$eval('.sc-1t1b4cp-0.sc-1t1b4cp-1.eMtQWq.jJnid', el => el.innerText.trim());
                let price = parseFloat(priceText.replace(/[^\d.]/g, ''));

                // Calculate estimated final price based on price ranges
                let estimatedPrice = 0;
                if (price <= 25) {
                    estimatedPrice = (price * 1.8).toFixed(2);  // 80% markup for tickets <= $25
                } else if (price > 25 && price <= 60) {
                    estimatedPrice = (price * 1.6).toFixed(2);  // 60% markup for tickets $26-$60
                } else if (price > 60 && price <= 130) {
                    estimatedPrice = (price * 1.45).toFixed(2); // 45% markup for tickets $61-$130
                } else {
                    estimatedPrice = (price * 1.3).toFixed(2);  // 30% markup for tickets > $130
                }

                // Only process tickets that have both section and row information
                if (section && row) {
                    // Create formatted ticket information string
                    const ticketInfo = [
                        `Date: ${gameDate}`,
                        `Home Team: ${homeTeam}`,
                        `Away Team: ${awayTeam}`,
                        `Section: ${section}`,
                        `Row: ${row}`,
                        `Price: ${priceText}`,
                        `Est. Price: $${estimatedPrice}`,
                        `URL: ${ticketUrl}`
                    ].join(', ');

                    // Add to collection if it's a new ticket
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);

                        // Insert ticket into database
                        db.run(
                            `INSERT OR REPLACE INTO tickets (date, home_team, away_team, section, row, price, estimated_price, url, source)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [gameDate, homeTeam, awayTeam, section, row, price, estimatedPrice, ticketUrl, source],
                            function (err) {
                                if (err) {
                                    console.error("Error inserting data:", err.message);
                                } else {
                                    console.log(`Ticket added to database: Row ID ${this.lastID}`);
                                }
                            }
                        );
                    }
                }
            } catch (error) {
                console.error(`Error extracting ticket information: ${error.message}`);
            }
        }
        console.log(`Total collected tickets: ${collectedTickets.size}`);
    };

    // Function to save collected tickets to file
    const writeTicketsToFile = () => {
        try {
            fs.writeFileSync(outputFile, Array.from(collectedTickets).join('\n'));
            console.log(`Tickets have been saved to ${outputFile}. Total: ${collectedTickets.size}`);
        } catch (error) {
            console.error(`Error writing to file: ${error.message}`);
        }
    };

    // Set up input handling to allow stopping the script
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('data', async (input) => {
        if (input.trim() === '') {
            console.log('Stopping the collection of tickets...');
            await browser.close();
            writeTicketsToFile();
            process.exit(0);
        }
    });

    // Main loop - continuously collect and save tickets
    while (true) {
        await collectTickets();
        writeTicketsToFile();
        await new Promise(resolve => setTimeout(resolve, 0)); // Minimal delay between iterations
    }
})();
