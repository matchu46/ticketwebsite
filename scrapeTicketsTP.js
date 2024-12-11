const puppeteer = require('puppeteer');
const fs = require('fs');

const url = "https://www.tickpick.com/buy-phoenix-suns-vs-utah-jazz-tickets-footprint-center-1-11-25-3pm/6634421/?qty=2-false";
const outputFile = "sun_tp_01_11.txt";

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Users\\Owner\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe',
        headless: false, // Set to false to see the browser window
    });

    const page = await browser.newPage();

    // Go to the page and wait for the network to be idle
    await page.goto(url, { waitUntil: 'networkidle2' });

    const collectedTickets = new Set();

    // Function to collect ticket data
    const collectTickets = async () => {
        // Selecting all ticket containers dynamically
        const ticketElements = await page.$$('div[class*="listing star"]'); // Matches any class containing 'listing starX'

        for (const ticketElement of ticketElements) {
            try {
                // Extract section and row information from 'sout' class
                const sectionRowText = await ticketElement.$eval('.sout', el => el.innerText.trim());
                
                // Extract section and row separately using regex
                const sectionMatch = sectionRowText.match(/Section\s*(\d+)/i);
                const rowMatch = sectionRowText.match(/Row\s*(\d+)/i);

                const sectionNumber = sectionMatch ? sectionMatch[1] : null;
                const rowNumber = rowMatch ? rowMatch[1] : null;

                // Extract price information from 'sendE' class
                const priceText = await ticketElement.$eval('.sendE', el => el.innerText.trim());

                if (sectionNumber && rowNumber) {
                    const ticketInfo = `Section: ${sectionNumber}, Row: ${rowNumber}, Price: ${priceText}, URL: ${url}`;
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);
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
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between iterations to avoid throttling
    }
})();
