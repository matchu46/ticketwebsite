// Required dependencies
const puppeteer = require('puppeteer');  // For web scraping
const sqlite3 = require('sqlite3').verbose(); // For SQLite DB
const fs = require('fs');                // For file operations

// Configuration constants
const url = "https://www.stubhub.com/wu-tang-clan-phoenix-tickets-6-18-2025/event/157376307/?quantity=2";
const outputFile = "con_sh_06_18.txt";
const gameDate = "06-18-2025";
const homeTeam = "PHX Arena";
const awayTeam = "Wu Tang Clan";
const source = "StubHub"; // Assuming this is the source

// Initialize the database and create the `ticketscon` table if it doesn't exist
const dbFile = "tickets.db";
const db = new sqlite3.Database(dbFile);

db.run(`
    CREATE TABLE IF NOT EXISTS ticketscon (
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

// Function to run database queries asynchronously
const runAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve({ changes: this.changes });
            }
        });
    });
};

// Main function using async/await for browser automation
(async () => {
    try {
        // Clear old records before collecting new data
        const deleteResult = await runAsync(
            `DELETE FROM ticketscon WHERE source = ? AND date = ? AND home_team = ?`,
            [source, gameDate, homeTeam]
        );
        console.log(`Cleared ${deleteResult.changes} old records`);
    } catch (err) {
        console.error("Database initialization error:", err);
        process.exit(1);
    }

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
                if (!listingId) continue;
                const ticketUrl = `${url}&listingId=${listingId}`;

                // Extract section, row, and price
                const section = await ticketElement.$eval('.sc-1t1b4cp-0.sc-1t1b4cp-6.eMtQWq.dQzlcE', el => el.innerText.trim().match(/Section\s*(\d+)/)?.[1] || null);
                const row = await ticketElement.$eval('.sc-1t1b4cp-25.eYtDdR', el => el.innerText.trim().match(/Row\s*(\d+)/)?.[1] || null);
                const priceText = await ticketElement.$eval('.sc-1t1b4cp-0.sc-1t1b4cp-1.eMtQWq.jJnid', el => el.innerText.trim());
                let price = parseFloat(priceText.replace(/[^\d.]/g, ''));

                // Calculate estimated price
                let estimatedPrice = price * (price <= 25 ? 1.8 : price <= 60 ? 1.6 : price <= 130 ? 1.45 : 1.3);

                // Only process tickets that have both section and row information
                if (section && row) {
                    const ticketInfo = `Date: ${gameDate}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Section: ${section}, Row: ${row}, Price: ${priceText}, Est. Price: $${estimatedPrice}, URL: ${ticketUrl}`;
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);

                        db.run(
                            `INSERT OR REPLACE INTO ticketscon (date, home_team, away_team, section, row, price, estimated_price, url, source)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [gameDate, homeTeam, awayTeam, section, row, price, estimatedPrice, ticketUrl, source],
                            function (err) {
                                if (err) console.error("Error inserting data:", err.message);
                            }
                        );
                    }
                }
            } catch (error) {
                console.error(`Error extracting ticket information: ${error.message}`);
            }
        }
    };

    // Function to save collected tickets to file
    const writeTicketsToFile = () => {
        fs.writeFileSync(outputFile, Array.from(collectedTickets).join('\n'));
        console.log(`Tickets have been saved to ${outputFile}. Total: ${collectedTickets.size}`);
    };

    // Stop script gracefully on user input
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

    while (true) {
        await collectTickets();
        writeTicketsToFile();
        await new Promise(resolve => setTimeout(resolve, 0)); // Adjust delay for efficiency
    }
})();
