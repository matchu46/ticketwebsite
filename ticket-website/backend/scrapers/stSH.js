// Required dependencies
const puppeteer = require('puppeteer');  // For web scraping
const sqlite3 = require('sqlite3').verbose(); // For SQLite DB
const fs = require('fs');                // For file operations

// Configuration constants
const url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-4-9-2025/event/154770106/?quantity=2";
const outputFile = "sun_sh_04_09.txt";
const gameDate = "04-09-2025";
const homeTeam = "Suns";
const awayTeam = "Thunder";
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

// Function to check database contents
const checkDatabase = () => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM tickets WHERE source = ? AND date = ? AND home_team = ?`,
            [source, gameDate, homeTeam],
            (err, rows) => {
                if (err) {
                    console.error('Error checking database:', err);
                    reject(err);
                } else {
                    console.log('Current database contents:', rows);
                    resolve(rows);
                }
            }
        );
    });
};

// Main function using async/await for browser automation
(async () => {
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
                const section = await ticketElement.$eval('.sc-fd01ffb-0.sc-fd01ffb-6.jBMRtu.ifPVso', el => {
                    const sectionText = el.innerText.trim();
                    const sectionMatch = sectionText.match(/Section\s*(\d+)/);
                    return sectionMatch ? sectionMatch[1] : null;
                });
                const row = await ticketElement.$eval('.sc-fd01ffb-24.NKtZA', el => {
                    const rowText = el.innerText.trim();
                    const rowMatch = rowText.match(/Row\s*(\d+)/);
                    return rowMatch ? rowMatch[1] : null;
                });
                const priceText = await ticketElement.$eval('.sc-fd01ffb-0.sc-fd01ffb-1.jBMRtu.ksrMNx', el => el.innerText.trim());
                let price = parseFloat(priceText.replace(/[^\d.]/g, ''));

                let estimatedPrice = 0;
                if (price <= 25) estimatedPrice = (price * 1.8).toFixed(2);
                else if (price <= 60) estimatedPrice = (price * 1.6).toFixed(2);
                else if (price <= 130) estimatedPrice = (price * 1.45).toFixed(2);
                else estimatedPrice = (price * 1.3).toFixed(2);

                if (section && row) {
                    const ticketInfo = `Date: ${gameDate}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Section: ${section}, Row: ${row}, Price: ${priceText}, Est. Price: $${estimatedPrice}, URL: ${ticketUrl}`;
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);

                        db.run(
                            `INSERT OR REPLACE INTO tickets (date, home_team, away_team, section, row, price, estimated_price, url, source)
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

    await checkDatabase(); // Check database before scraping

    while (true) {
        await collectTickets();
        writeTicketsToFile();
        await new Promise(resolve => setTimeout(resolve, 0));
    }
})();
