const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const url = "https://gametime.co/nba-basketball/warriors-at-suns-tickets/4-8-2025-phoenix-az-footprint-center/events/66be5ef0d2310128074c5017";
const outputFile = "sun_gt_04_11.txt";
const collectedTickets = new Set();
const source = "Gametime";
const baseUrl = "https://gametime.co";
const date = "04-11-2025";
const homeTeam = "Suns";
const awayTeam = "Spurs";

// Database file and connection
const dbFile = "tickets.db";
const db = new sqlite3.Database(dbFile);

// Initialize the database
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

(async () => {
    const browser = await puppeteer.launch({
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: false,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    console.log('Website loaded. Type "g" and press Enter to start scraping, or press Enter to exit.');

    let isScrapingActive = false;

    // Helper function to parse price text
    const parsePrice = (priceText) => {
        // Split the text by the dollar sign to handle multiple prices
        const priceParts = priceText.split('$').filter(part => part.trim() !== '');

        // If there are multiple prices, take the second one (discounted price)
        if (priceParts.length > 1) {
            const discountedPriceText = priceParts[1].trim();
            // Extract the numeric value from the discounted price text
            const priceMatch = discountedPriceText.match(/\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?/);
            if (priceMatch) {
                return parseFloat(priceMatch[0].replace(/,/g, ''));
            }
        }

        // Fallback: If only one price is found, parse it as usual
        const priceMatch = priceText.match(/\$?(\d{1,3}(,\d{3})*(\.\d+)?|\d+(\.\d+)?)/);
        if (priceMatch) {
            return parseFloat(priceMatch[0].replace(/[$,]/g, ''));
        }

        // Return null if no valid price is found
        return null;
    };

    // Function to collect ticket data
    const collectTickets = async () => {
        const ticketElements = await page.$$('a.pages-Event-components-ListingCard-ListingCard-module__listing-card');

        for (const ticketElement of ticketElements) {
            try {
                // Get ticket URL
                const hrefValue = await ticketElement.evaluate(el => el.getAttribute('href'));
                const ticketUrl = hrefValue.startsWith('http') ? hrefValue : `${baseUrl}${hrefValue}`;

                if (!ticketUrl) continue;

                // Extract Section and Row
                const seatDetailsElement = await ticketElement.$('.pages-Event-components-ListingCard-ListingCard-module__seat-details-row');
                const seatDetailsText = await seatDetailsElement.evaluate(el => el.textContent);
                
                const [sectionStr, rowStr] = seatDetailsText.split(',');
                const section = sectionStr.trim();
                const row = rowStr ? rowStr.replace('Row', '').trim() : null;

                // Extract Price - get the entire price info container text
                const priceElement = await ticketElement.$('.pages-Event-components-ListingCard-ListingCard-module__price-info');
                const priceText = await priceElement.evaluate(el => el.textContent);
                
                // Use the helper function to parse price
                let price = parsePrice(priceText);
                
                // Skip if no valid price was found
                if (!price) continue;

                // Set estimated price equal to actual price as specified
                const estimatedPrice = price;

                if (section && row && price) {
                    const ticketInfo = `Date: ${date}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Section: ${section}, Row: ${row}, Price: $${price.toFixed(2)}, Est. Price: $${estimatedPrice.toFixed(2)}, URL: ${ticketUrl}`;
                    
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);

                        db.run(
                            `INSERT OR REPLACE INTO tickets (date, home_team, away_team, section, row, price, estimated_price, url, source)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [date, homeTeam, awayTeam, section, row, price, estimatedPrice, ticketUrl, source],
                            function (err) {
                                if (err) {
                                    console.error("Error inserting data:", err.message);
                                } else {
                                    if (this.changes > 0) {
                                        console.log(`Ticket added to database: Row ID ${this.lastID}`);
                                    } else {
                                        console.log(`No changes made (duplicate or conflict): ${ticketUrl}`);
                                    }
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

    // Function to write collected tickets to file
    const writeTicketsToFile = () => {
        try {
            fs.writeFileSync(outputFile, Array.from(collectedTickets).join('\n'));
            console.log(`Tickets have been saved to ${outputFile}. Total: ${collectedTickets.size}`);
        } catch (error) {
            console.error(`Error writing to file: ${error.message}`);
        }
    };

    // Clear old data from the database when scraping starts
    const clearOldData = () => {
        db.run(`DELETE FROM tickets WHERE source = ? AND date = ? AND home_team = ?`, [source, date, homeTeam], (err) => {
            if (err) {
                console.error("Error deleting old data:", err.message);
            } else {
                console.log(`Old data cleared for ${source} on ${date} for home team ${homeTeam}`);
            }
        });
    };

    // Listen for keyboard input
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('data', async (input) => {
        const command = input.trim().toLowerCase();
        
        if (command === 'g' && !isScrapingActive) {
            console.log('Starting the scraping process...');
            isScrapingActive = true;
            clearOldData();
            
            // Start the main collection loop
            while (isScrapingActive) {
                await collectTickets();
                writeTicketsToFile();
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        } else if (command === '') {
            console.log('Stopping the collection of tickets...');
            isScrapingActive = false;
            await browser.close();
            writeTicketsToFile();
            process.exit(0);
        }
    });
})();