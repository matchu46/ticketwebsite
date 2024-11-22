const puppeteer = require('puppeteer');
const fs = require('fs');

const url = "https://www.stubhub.com/phoenix-suns-phoenix-tickets-2-8-2025/event/154770085/?quantity=2";
const outputFile = "ticket_info_02_08.txt";

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Users\\Owner\\Downloads\\chrome-win64\\chrome-win64\\chrome.exe',
        headless: false, // Set to false to see the browser window
        args: ['--start-maximized'], // Start the browser maximized
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 }); // Set a specific viewport size

    // Go to the page and reload to ensure it's fully loaded
    await page.goto(url, { waitUntil: 'networkidle2' });
    //await page.reload({ waitUntil: 'networkidle2' });

    // Hide any overlay or loading spinner (if present)
    await page.evaluate(() => {
        const overlay = document.querySelector('.loading-overlay, .spinner-class'); // Replace with the correct class
        if (overlay) {
            overlay.style.display = 'none'; // Hide the overlay
        }
    });

    // Optionally, take a screenshot to check the greyed-out state
    //await page.screenshot({ path: 'debug_screenshot.png' }); // Debug screenshot

    // Inject the scrolling script into the page
    await page.evaluate(() => {
        const scrollHeight = 200;  // Amount to scroll by each time (in pixels)
        const scrollSpeed = 200; // Scroll every 200ms

        const scrollableElement = document.querySelector('.sc-57jg3s-0.ifTptv'); // Update the selector if necessary

        if (scrollableElement) {
            // Function to keep scrolling down the scrollable container
            const scrollDown = () => {
                scrollableElement.scrollBy(0, scrollHeight);  // Scroll by 200px down
            };

            // Set interval to keep scrolling
            setInterval(scrollDown, scrollSpeed);  // Scroll every 200ms
        } else {
            console.error('Scrollable container not found.');
        }
    });

    const collectedTickets = new Set();

    // Function to collect ticket data
    const collectTickets = async () => {
        const ticketElements = await page.$$('.sc-57jg3s-0.ifTptv'); // Update this if the selector is different

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

                const priceText = await ticketElement.$eval('.sc-hlalgf-1', el => el.innerText.trim());
                const price = parseFloat(priceText.replace(/[^\d.]/g, ''));
                const estimatedPrice = (price * 1.3).toFixed(2);

                if (section && row) {
                    const ticketInfo = `Section: ${section}, Row: ${row}, Price: ${priceText}, Est. Price: $${estimatedPrice}`;
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
        writeTicketsToFile(); // Write to file after each collection iteration
        await new Promise(resolve => setTimeout(resolve, 0)); // Delay between iterations
    }
})();
