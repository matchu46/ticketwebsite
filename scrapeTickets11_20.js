const puppeteer = require('puppeteer');
const fs = require('fs');

const url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-11-20-2024/event/154770080/?qid=24e3298a63bcfbd58f65bcd783136755&index=stubhub&ut=0f02c2f5fa9a11994a37229ffb5950bb36ccaab3&quantity=2";
const outputFile = "ticket_info_11_20.txt";

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Users\\Owner\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe',
        headless: false // Set to true if you don't want to see the browser window
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const collectedTickets = new Set(); // To store unique ticket data

    // Function to collect ticket data
    const collectTickets = async () => {
        const ticketElements = await page.$$('.sc-57jg3s-0.ifTptv');

        for (const ticketElement of ticketElements) {
            try {
                const section = await ticketElement.$eval('.sc-hlalgf-0', el => {
                    const sectionText = el.innerText.trim();
                    const sectionMatch = sectionText.match(/Section\s*(\d+)/);
                    return sectionMatch ? sectionMatch[1] : null;
                });

                const row = await ticketElement.$eval('.sc-hlalgf-26', el => {
                    const rowText = el.innerText.trim();
                    const rowMatch = rowText.match(/Row\s*(\d+)/);
                    return rowMatch ? rowMatch[1] : null;
                });

                const price = await ticketElement.$eval('.sc-hlalgf-1', el => el.innerText.trim());

                if (section && row) {
                    const ticketInfo = `Section: ${section}, Row: ${row}, Price: ${price}`;
                    if (!collectedTickets.has(ticketInfo)) {
                        collectedTickets.add(ticketInfo);
                        console.log(`Valid Ticket - ${ticketInfo}`);
                        // Consider writing to file every 5 tickets or on specific intervals
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
        writeTicketsToFile(); // Write to file after each collection iteration
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay between iterations
    }
})();
