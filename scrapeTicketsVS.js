const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const url = "https://www.vividseats.com/phoenix-suns-tickets-footprint-center-2-27-2025--sports-nba-basketball/production/5159899";
const outputFile = "sun_vs_02_27.txt";

// Database file and connection
const dbFile = "tickets.db";
const db = new sqlite3.Database(dbFile);

// Initialize the database and create the `tickets` table if it doesn't exist
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
        executablePath: 'C:\\Users\\Owner\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe',
        headless: false, // Set to false to see the browser window
    });

    const page = await browser.newPage();

    // Go to the page and wait for the network to be idle
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Hide any overlay or loading spinner (if present)
    await page.evaluate(() => {
        const overlay = document.querySelector('.loading-overlay, .spinner-class'); // Replace with the correct class if needed
        if (overlay) {
            overlay.style.display = 'none'; // Hide the overlay
        }
    });

    const collectedTickets = new Set();
    const source = "Vivid Seats"; // Website source
    const date = "02-27-2025"; // Game date
    const homeTeam = "Suns";
    const awayTeam = "Pelicans";

    // Clear old data from the database for this source, date, and home_team
    db.run(`DELETE FROM tickets WHERE source = ? AND date = ? AND home_team = ?`, [source, date, homeTeam], (err) => {
        if (err) {
            console.error("Error deleting old data:", err.message);
        } else {
            console.log(`Old data cleared for ${source} on ${date} for home team ${homeTeam}`);
        }
    });

    // Function to collect ticket data
    const collectTickets = async () => {
        const ticketElements = await page.$$('.styles_listingsList__xLDbK.styles_offsetOpenMapContainerHeight__zDGJd.styles_miniMapInHero__aRA4e a.styles_linkNoStyle__bZgvi'); // Update selector to target <a> elements containing ticket links

        for (const ticketElement of ticketElements) {
            try {
                // Get the specific URL for the ticket listing
                const ticketUrl = await ticketElement.getProperty('href');
                const ticketUrlValue = await ticketUrl.jsonValue();

                // Extract Section
                const sectionText = await ticketElement.$eval('.MuiTypography-root.MuiTypography-small-medium.styles_nowrap___p2Eb.mui-12s2z4k', el => el.innerText.trim());
                const sectionMatch = sectionText.match(/(\d+)/);
                const section = sectionMatch ? sectionMatch[0] : null;

                // Extract Row
                const rowText = await ticketElement.$eval('.MuiTypography-root.MuiTypography-caption-regular.styles_nowrap___p2Eb.mui-x6azc9', el => el.innerText.trim());
                const rowMatch = rowText.match(/(\d+)/);
                const row = rowMatch ? rowMatch[0] : null;

                // Extract Price
                const priceText = await ticketElement.$eval('.MuiTypography-root.MuiTypography-body-bold.styles_nowrap___p2Eb.mui-1nxievo', el => el.innerText.trim());
                let price = priceText.replace(/[^0-9.]/g, '');
                price = parseFloat(price);

                // Price estimate
                const estimatedPrice = (price * 1.4).toFixed(2);

                if (section && row) {
                    const ticketInfo = `Date: ${date}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Section: ${section}, Row: ${row}, Price: $${price.toFixed(2)}, Est. Price: $${estimatedPrice}, URL: ${ticketUrlValue}`;
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);

                        // Insert the ticket into the database
                        db.run(
                            `INSERT OR IGNORE INTO tickets (date, home_team, away_team, section, row, price, estimated_price, url, source)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [date, homeTeam, awayTeam, section, row, price, estimatedPrice, ticketUrlValue, source],
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

    // Function to write collected tickets to file
    const writeTicketsToFile = () => {
        try {
            fs.writeFileSync(outputFile, Array.from(collectedTickets).join('\n'));
            console.log(`Tickets have been saved to ${outputFile}. Total: ${collectedTickets.size}`);
        } catch (error) {
            console.error(`Error writing to file: ${error.message}`);
        }
    };

    // Listen for keyboard input to stop the collection
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('data', async (input) => {
        if (input.trim() === '') {
            console.log('Stopping the collection of tickets...');
            await browser.close();
            writeTicketsToFile(); // Final save before exit
            process.exit(0);
        }
    });

    // Main collection loop
    while (true) {
        await collectTickets(); // Collect tickets based on the visible content
        writeTicketsToFile();   // Write to file after each collection iteration
        await new Promise(resolve => setTimeout(resolve, 0)); // Delay between iterations
    }
})();
