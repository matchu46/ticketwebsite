const puppeteer = require('puppeteer');
const fs = require('fs');

const url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-1-12-2025/event/154770096/?quantity=2";
const outputFile = "sun_sh_01_12.txt";

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

    // Function to collect ticket data
    const collectTickets = async () => {
        const ticketElements = await page.$$('.sc-57jg3s-0.ifTptv'); // Check if this selector is still correct

        for (const ticketElement of ticketElements) {
            try {
                const section = await ticketElement.$eval('.sc-hlalgf-0.sc-hlalgf-6.jfjuff.jXdyTR', el => {
                    const sectionText = el.innerText.trim();
                    const sectionMatch = sectionText.match(/Section\s*(\d+)/);
                    return sectionMatch ? sectionMatch[1] : null;
                });

                const row = await ticketElement.$eval('.sc-hlalgf-25.bSdQWo', el => {
                    const rowText = el.innerText.trim();
                    const rowMatch = rowText.match(/Row\s*(\d+)/);
                    return rowMatch ? rowMatch[1] : null;
                });

                const priceText = await ticketElement.$eval('.sc-hlalgf-0.sc-hlalgf-1.jfjuff.tOKfM', el => el.innerText.trim());
                let price = parseFloat(priceText.replace(/[^\d.]/g, ''));

                // Price estimate based on the price ranges
                let estimatedPrice = 0;
                if (price <= 25) {
                    estimatedPrice = (price * 1.8).toFixed(2); // For prices $25 or less
                } else if (price > 25 && price <= 60) {
                    estimatedPrice = (price * 1.6).toFixed(2); // For prices between $25 and $60
                } else if (price > 60 && price <= 130) {
                    estimatedPrice = (price * 1.45).toFixed(2); // For prices between $61 and $130
                } else {
                    estimatedPrice = (price * 1.3).toFixed(2); // For prices above $130
                }

                if (section && row) {
                    const ticketInfo = `Section: ${section}, Row: ${row}, Price: ${priceText}, Est. Price: $${estimatedPrice}, URL: ${url}`;
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
        await new Promise(resolve => setTimeout(resolve, 0)); // Delay between iterations
    }
})();
