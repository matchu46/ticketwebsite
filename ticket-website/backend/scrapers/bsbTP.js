const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const url = "https://www.tickpick.com/buy-arizona-diamondbacks-vs-tampa-bay-rays-tickets-chase-field-4-24-25-6pm/6574891/?qty=2-false";
const outputFile = "bsb_tp_04_24.txt";
const gameDate = "04-24-2025";
const homeTeam = "Dbacks";
const awayTeam = "Rays";
const source = "TickPick";

// Database file and connection
const dbFile = "tickets.db"; 
const db = new sqlite3.Database(dbFile);

// Add debug query function
const debugQuery = (query, params) => {
    let debugSQL = query;
    if (params) {
        params.forEach((param, i) => {
            debugSQL = debugSQL.replace('?', `'${param}'`);
        });
    }
    console.log('Executing SQL:', debugSQL);
};

// Promisify database operations with debug
const runAsync = (query, params) => {
    return new Promise((resolve, reject) => {
        debugQuery(query, params);
        db.run(query, params, function(err) {
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

// Add function to check database contents
const checkDatabase = () => {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM ticketsbsb WHERE source = ? AND date = ? AND home_team = ?`,
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

// Initialize the database
const initializeDb = async () => {
    try {
        await runAsync(`
            CREATE TABLE IF NOT EXISTS ticketsbsb (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                home_team TEXT NOT NULL,
                away_team TEXT NOT NULL,
                section TEXT NOT NULL,
                row TEXT NOT NULL,
                price REAL,
                estimated_price REAL,
                url TEXT,
                source TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(date, home_team, section, row, source)
            )
        `);
        
        const deleteResult = await runAsync(
            `DELETE FROM ticketsbsb WHERE source = ? AND date = ? AND home_team = ?`,
            [source, gameDate, homeTeam]
        );
        console.log(`Cleared ${deleteResult.changes} old records`);

        // Check database after initialization
        await checkDatabase();
    } catch (err) {
        console.error("Database initialization error:", err);
        process.exit(1);
    }
};

(async () => {
    try {
        await initializeDb();

        const browser = await puppeteer.launch({
            executablePath: 'C:\\Users\\Owner\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe',
            headless: false,
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        const collectedTickets = new Set();

        const collectTickets = async () => {
            const ticketElements = await page.$$('div[class*="listing star"]');
            console.log(`Found ${ticketElements.length} ticket elements on page`);
            
            for (const ticketElement of ticketElements) {
                try {
                    const sectionRowText = await ticketElement.$eval('.sout', el => el.innerText.trim());
                    console.log('Raw section/row text:', sectionRowText);
                    
                    const sectionMatch = sectionRowText.match(/Section\s*(\d+)/i);
                    const rowMatch = sectionRowText.match(/Row\s*(\d+)/i);

                    const sectionNumber = sectionMatch ? sectionMatch[1] : null;
                    const rowNumber = rowMatch ? rowMatch[1] : null;

                    console.log(`Parsed section: ${sectionNumber}, row: ${rowNumber}`);

                    const priceText = await ticketElement.$eval('.sendE', el => el.innerText.trim());
                    console.log('Raw price text:', priceText);
                    
                    const cleanPrice = priceText.match(/\$[\d,]+/) ? priceText.match(/\$[\d,]+/)[0] : priceText;
                    console.log('Cleaned price:', cleanPrice);

                    if (sectionNumber && rowNumber) {
                        const ticketKey = `${gameDate}-${homeTeam}-${sectionNumber}-${rowNumber}-${source}`;
                        console.log('Generated ticket key:', ticketKey);
                        
                        if (!collectedTickets.has(ticketKey)) {
                            collectedTickets.add(ticketKey);
                            const price = parseFloat(cleanPrice.replace(/[$,]/g, '')); // Removes both $ and , 
                            const estimatedPrice = (price * 1).toFixed(2);

                            try {
                                await runAsync(
                                    `INSERT OR REPLACE INTO ticketsbsb (date, home_team, away_team, section, row, price, estimated_price, url, source)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [gameDate, homeTeam, awayTeam, sectionNumber, rowNumber, price, estimatedPrice, url, source]
                                );
                                
                                // Check database after each insert
                                await checkDatabase();
                                
                            } catch (err) {
                                console.error("Error inserting ticket:", err);
                            }
                        } else {
                            console.log('Duplicate ticket found:', ticketKey);
                        }
                    } else {
                        console.log('Invalid ticket data - missing section or row');
                    }
                } catch (error) {
                    console.error(`Error extracting ticket information: ${error.message}`);
                }
            }
            console.log(`Total collected tickets: ${collectedTickets.size}`);
            // Final database check after collection
            await checkDatabase();
        };

        const writeTicketsToFile = () => {
            try {
                fs.writeFileSync(outputFile, Array.from(collectedTickets).join('\n'));
                console.log(`Tickets saved to ${outputFile}. Total: ${collectedTickets.size}`);
            } catch (error) {
                console.error(`Error writing to file: ${error.message}`);
            }
        };

        // Graceful shutdown handler
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

        // Handle keyboard input and graceful shutdown
        process.stdin.setEncoding('utf8');
        process.stdin.resume();
        process.stdin.on('data', async (input) => {
            if (input.trim() === '') {
                await shutdown();
            }
        });

        // Handle process termination
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);

        // Main collection loop
        while (true) {
            await collectTickets();
            writeTicketsToFile();
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
})();
