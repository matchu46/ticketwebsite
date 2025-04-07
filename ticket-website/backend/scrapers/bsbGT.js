const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const url = "https://gametime.co/mlb-baseball/orioles-at-diamondbacks-tickets/4-9-2025-phoenix-az-chase-field/events/66a15f1847d07f0c7229d1fc";
const outputFile = "bsb_gt_04_09.txt";
const date = "04-09-2025";
const collectedTickets = new Set();
const source = "Gametime";
const baseUrl = "https://gametime.co";
const homeTeam = "Dbacks";
const awayTeam = "Orioles";

// Database file and connection
const dbFile = "tickets.db";
const db = new sqlite3.Database(dbFile);

// Debug query execution
const debugQuery = (query, params) => {
    let debugSQL = query;
    if (params) {
        params.forEach((param, i) => {
            debugSQL = debugSQL.replace('?', `'${param}'`);
        });
    }
    console.log('Executing SQL:', debugSQL);
};

// Promisified database operations with debug
const runAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        debugQuery(query, params);
        db.run(query, params, function (err) {
            if (err) {
                console.error('SQL Error:', err);
                reject(err);
            } else {
                console.log('SQL Success - Changes:', this.changes);
                resolve(this);
            }
        });
    });
};

// Initialize the database
const initializeDb = async () => {
    try {
        await runAsync(`
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
                source TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const deleteResult = await runAsync(
            `DELETE FROM ticketsbsb WHERE source = ? AND date = ? AND home_team = ?`,
            [source, date, homeTeam]
        );
        console.log(`Cleared ${deleteResult.changes} old records`);
    } catch (err) {
        console.error("Database initialization error:", err);
        process.exit(1);
    }
};

// Helper function to parse price text
const parsePrice = (priceText) => {
    const priceParts = priceText.split('$').filter(part => part.trim() !== '');
    if (priceParts.length > 1) {
        const discountedPriceText = priceParts[1].trim();
        const priceMatch = discountedPriceText.match(/\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?/);
        if (priceMatch) {
            return parseFloat(priceMatch[0].replace(/,/g, ''));
        }
    }
    const priceMatch = priceText.match(/\$?(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/);
    if (priceMatch) {
        return parseFloat(priceMatch[0].replace(/[$,]/g, ''));
    }
    return null;
};

(async () => {
    await initializeDb();

    const browser = await puppeteer.launch({
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: false,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('Website loaded. Type "g" and press Enter to start scraping, or press Enter to exit.');

    let isScrapingActive = false;

    const collectTickets = async () => {
        const ticketElements = await page.$$('a.pages-Event-components-ListingCard-ListingCard-module__listing-card');

        for (const ticketElement of ticketElements) {
            try {
                const hrefValue = await ticketElement.evaluate(el => el.getAttribute('href'));
                const ticketUrl = hrefValue.startsWith('http') ? hrefValue : `${baseUrl}${hrefValue}`;
                if (!ticketUrl) continue;

                const seatDetailsElement = await ticketElement.$('.pages-Event-components-ListingCard-ListingCard-module__seat-details-row');
                const seatDetailsText = await seatDetailsElement.evaluate(el => el.textContent);
                const [sectionStr, rowStr] = seatDetailsText.split(',');
                const section = sectionStr.trim();
                const row = rowStr ? rowStr.replace('Row', '').trim() : null;

                const priceElement = await ticketElement.$('.pages-Event-components-ListingCard-ListingCard-module__price-info');
                const priceText = await priceElement.evaluate(el => el.textContent);
                let price = parsePrice(priceText);

                if (!price) continue;
                const estimatedPrice = price;

                if (section && row && price) {
                    const ticketInfo = `Date: ${date}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Section: ${section}, Row: ${row}, Price: $${price.toFixed(2)}, Est. Price: $${estimatedPrice.toFixed(2)}, URL: ${ticketUrl}`;

                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);

                        try {
                            await runAsync(
                                `INSERT OR REPLACE INTO ticketsbsb (date, home_team, away_team, section, row, price, estimated_price, url, source)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [date, homeTeam, awayTeam, section, row, price, estimatedPrice, ticketUrl, source]
                            );
                        } catch (err) {
                            console.error("Error inserting ticket:", err);
                        }
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

    const shutdown = async () => {
        console.log('Shutting down...');
        await browser.close();
        writeTicketsToFile();
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err);
            } else {
                console.log('Database connection closed');
            }
            process.exit(0);
        });
    };

    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('data', async (input) => {
        const command = input.trim().toLowerCase();

        if (command === 'g' && !isScrapingActive) {
            console.log('Starting the scraping process...');
            isScrapingActive = true;

            while (isScrapingActive) {
                await collectTickets();
                writeTicketsToFile();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } else if (command === '') {
            await shutdown();
        }
    });

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
})();
