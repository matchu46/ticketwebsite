// Required dependencies 
const puppeteer = require('puppeteer');  // For automating browser interaction (web scraping)
const sqlite3 = require('sqlite3').verbose(); // SQLite database driver
const fs = require('fs');                // File system access to save tickets to a .txt file

// Configuration constants for this specific event scrape
const url = "https://www.stubhub.com/arizona-diamondbacks-phoenix-tickets-4-9-2025/event/154654431/?quantity=2";
const outputFile = "bsb_sh_04_09.txt";       // File to write scraped ticket info
const gameDate = "04-09-2025";              // Date of the game
const homeTeam = "Dbacks";                  // Home team name
const awayTeam = "Orioles";                 // Away team name
const source = "StubHub";                   // Ticket source

// Set up SQLite database connection
const dbFile = "tickets.db";
const db = new sqlite3.Database(dbFile);

// Create the `ticketsbsb` table if it doesn't already exist
db.run(`
    CREATE TABLE IF NOT EXISTS ticketsbsb (
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

// Helper to make SQLite write operations async
const runAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this); // Allows accessing 'this.lastID' if needed
        });
    });
};

// Main async function to run scraping and data processing
(async () => {
    try {
        // Clean up old records for the same game and source to avoid duplicates
        const deleteResult = await runAsync(
            `DELETE FROM ticketsbsb WHERE source = ? AND date = ? AND home_team = ?`,
            [source, gameDate, homeTeam]
        );
        console.log(`Cleared ${deleteResult.changes} old records`);
    } catch (err) {
        console.error("Database initialization error:", err);
        process.exit(1);
    }

    // Launch Chrome using Puppeteer (not headless so you can see it)
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Users\\Owner\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe', // Specific Chrome path
        headless: false, // Run visibly
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' }); // Wait for page to fully load

    // Try to disable any loading overlays or spinners
    await page.evaluate(() => {
        const overlay = document.querySelector('.loading-overlay, .spinner-class');
        if (overlay) {
            overlay.style.display = 'none';
        }
    });

    const collectedTickets = new Set(); // To avoid duplicate entries in memory

    // Function to collect ticket info from the page
    const collectTickets = async () => {
        const ticketElements = await page.$$('div[data-listing-id]'); // StubHub embeds ticket listings in divs with data-listing-id
        console.log(`Found ${ticketElements.length} ticket elements.`);

        for (const ticketElement of ticketElements) {
            try {
                const listingId = await ticketElement.evaluate(el => el.getAttribute('data-listing-id'));
                if (!listingId) continue; // Skip if no ID found

                const ticketUrl = `${url}&listingId=${listingId}`; // Append listing ID to base URL

                // Try to extract section and row
                const section = await ticketElement.$eval(
                    '.sc-fd01ffb-0.sc-fd01ffb-6.jBMRtu.ifPVso',
                    el => el.innerText.trim().match(/Section\s*(\d+)/)?.[1]
                );
                const row = await ticketElement.$eval(
                    '.sc-fd01ffb-24.NKtZA',
                    el => el.innerText.trim().match(/Row\s*(\d+)/)?.[1]
                );

                // Extract price and clean the text to get a float
                const priceText = await ticketElement.$eval(
                    '.sc-fd01ffb-0.sc-fd01ffb-1.jBMRtu.ksrMNx',
                    el => el.innerText.trim()
                );
                let price = parseFloat(priceText.replace(/[^\d.]/g, ''));

                // Estimate what the ticket should be worth
                let estimatedPrice = price <= 25 ? (price * 1.8).toFixed(2) :
                                    price <= 60 ? (price * 1.6).toFixed(2) :
                                    price <= 130 ? (price * 1.45).toFixed(2) :
                                    (price * 1.3).toFixed(2);

                // Save if it has both section and row info
                if (section && row) {
                    const ticketInfo = `Date: ${gameDate}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Section: ${section}, Row: ${row}, Price: ${priceText}, Est. Price: $${estimatedPrice}, URL: ${ticketUrl}`;
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo); // Prevent duplication in memory
                        console.log(`Valid Ticket - ${ticketInfo}`);

                        // Save ticket info to database
                        db.run(
                            `INSERT OR REPLACE INTO ticketsbsb (date, home_team, away_team, section, row, price, estimated_price, url, source)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [gameDate, homeTeam, awayTeam, section, row, price, estimatedPrice, ticketUrl, source],
                            function (err) {
                                if (err) console.error("Error inserting data:", err.message);
                                else console.log(`Ticket added to database: Row ID ${this.lastID}`);
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

    // Write all ticket entries to a .txt file
    const writeTicketsToFile = () => {
        try {
            fs.writeFileSync(outputFile, Array.from(collectedTickets).join('\n'));
            console.log(`Tickets have been saved to ${outputFile}. Total: ${collectedTickets.size}`);
        } catch (error) {
            console.error(`Error writing to file: ${error.message}`);
        }
    };

    // Listen for user input to allow manual stop
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('data', async (input) => {
        if (input.trim() === '') {
            console.log('Stopping the collection of tickets...');
            await browser.close();       // Clean up browser
            writeTicketsToFile();        // Save collected data
            process.exit(0);             // Exit the script
        }
    });

    // Loop: keep collecting tickets continuously
    while (true) {
        await collectTickets();                // Scrape tickets
        writeTicketsToFile();                  // Save to file after each pass
        await new Promise(resolve => setTimeout(resolve, 0)); // Slight delay, can adjust if needed
    }
})();
