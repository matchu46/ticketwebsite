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
        // Select elements that contain ticket information
        const ticketElements = await page.$$('.sc-57jg3s-0.ifTptv');

        // Collect ticket information from each element
        for (const ticketElement of ticketElements) {
            try {
                // Extract section number
                const section = await ticketElement.$eval('.sc-hlalgf-0', el => {
                    const sectionText = el.innerText.trim();
                    const sectionMatch = sectionText.match(/Section\s*(\d+)/);
                    return sectionMatch ? sectionMatch[1] : null; // Return just the section number
                });

                // Extract row number
                const row = await ticketElement.$eval('.sc-hlalgf-26', el => {
                    const rowText = el.innerText.trim();
                    const rowMatch = rowText.match(/Row\s*(\d+)/);
                    return rowMatch ? rowMatch[1] : null; // Return just the row number
                });

                // Extract price
                const price = await ticketElement.$eval('.sc-hlalgf-1', el => el.innerText.trim());

                if (section && row) { // Only add if both section and row are found
                    const ticketInfo = `Section: ${section}, Row: ${row}, Price: ${price}`;
                    collectedTickets.add(ticketInfo); // Add to set to avoid duplicates
                    console.log(`Valid Ticket - ${ticketInfo}`); // Log valid tickets
                }
            } catch (error) {
                console.error(`Error extracting ticket information: ${error.message}`);
            }
        }
    };

    // Listen for keyboard input to stop the collection
    const stopListening = () => {
        process.stdin.pause(); // Stop listening for input
    };

    process.stdin.setEncoding('utf8');
    process.stdin.resume();
    process.stdin.on('data', async (input) => {
        if (input.trim() === '') { // Check if Enter key was pressed
            console.log('Stopping the collection of tickets...');
            stopListening();
            await browser.close(); // Close the browser
            // Write collected tickets to file, overwriting previous content
            fs.writeFileSync(outputFile, Array.from(collectedTickets).join('\n'));
            console.log(`Tickets have been saved to ${outputFile}.`);
            process.exit(0); // Exit the process
        }
    });

    // Main collection loop
    while (true) {
        await collectTickets(); // Collect tickets based on the visible content
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to allow time for user to scroll
    }
})();
