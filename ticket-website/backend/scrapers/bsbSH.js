// Required dependencies
const puppeteer = require('puppeteer');  // For web scraping
const sqlite3 = require('sqlite3').verbose(); // For SQLite DB
const fs = require('fs');                // For file operations

// Configuration constants
const url = "https://www.stubhub.com/arizona-diamondbacks-phoenix-tickets-8-4-2025/event/154664083/?quantity=2";
const outputFile = "bsb_sh_08_04.txt";
const gameDate = "08-04-2025";
const homeTeam = "Dbacks";
const awayTeam = "Padres";
const source = "StubHub"; // Assuming this is the source

// Initialize the database and create the `ticketsbsb` table if it doesn't exist
const dbFile = "tickets.db";
const db = new sqlite3.Database(dbFile);

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

// Function to execute SQLite queries with async/await
const runAsync = (query, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

// Main function using async/await for browser automation
(async () => {
    try {
        // Delete existing records for the same source, date, and home team
        const deleteResult = await runAsync(
            `DELETE FROM ticketsbsb WHERE source = ? AND date = ? AND home_team = ?`,
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
        headless: false,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.evaluate(() => {
        const overlay = document.querySelector('.loading-overlay, .spinner-class');
        if (overlay) {
            overlay.style.display = 'none';
        }
    });

    const collectedTickets = new Set();

    const collectTickets = async () => {
        const ticketElements = await page.$$('div[data-listing-id]');
        console.log(`Found ${ticketElements.length} ticket elements.`);

        for (const ticketElement of ticketElements) {
            try {
                const listingId = await ticketElement.evaluate(el => el.getAttribute('data-listing-id'));
                if (!listingId) continue;

                const ticketUrl = `${url}&listingId=${listingId}`;
                const section = await ticketElement.$eval('.sc-dfdbf63d-0.sc-dfdbf63d-6.fwjTNM.efdBxi', el => el.innerText.trim().match(/Section\s*(\d+)/)?.[1]);
                const row = await ticketElement.$eval('.sc-dfdbf63d-25.kaEobr', el => el.innerText.trim().match(/Row\s*(\d+)/)?.[1]);
                const priceText = await ticketElement.$eval('.sc-dfdbf63d-0.sc-dfdbf63d-1.fwjTNM.fPxgFv', el => el.innerText.trim());
                let price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                let estimatedPrice = price <= 25 ? (price * 1.8).toFixed(2) :
                                    price <= 60 ? (price * 1.6).toFixed(2) :
                                    price <= 130 ? (price * 1.45).toFixed(2) :
                                    (price * 1.3).toFixed(2);

                if (section && row) {
                    const ticketInfo = `Date: ${gameDate}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Section: ${section}, Row: ${row}, Price: ${priceText}, Est. Price: $${estimatedPrice}, URL: ${ticketUrl}`;
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);
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

    const writeTicketsToFile = () => {
        try {
            fs.writeFileSync(outputFile, Array.from(collectedTickets).join('\n'));
            console.log(`Tickets have been saved to ${outputFile}. Total: ${collectedTickets.size}`);
        } catch (error) {
            console.error(`Error writing to file: ${error.message}`);
        }
    };

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
        await new Promise(resolve => setTimeout(resolve, 0));
    }
})();
