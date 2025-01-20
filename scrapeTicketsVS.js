const puppeteer = require('puppeteer');
const fs = require('fs');

const url = "https://www.vividseats.com/phoenix-suns-tickets-footprint-center-2-27-2025--sports-nba-basketball/production/5159899";
const outputFile = "sun_vs_02_27.txt";

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
        const ticketElements = await page.$$('.styles_listingsList__xLDbK.styles_offsetOpenMapContainerHeight__zDGJd.styles_miniMapInHero__aRA4e a.styles_linkNoStyle__bZgvi'); // Update selector to target <a> elements containing ticket links

        for (const ticketElement of ticketElements) {
            try {
                // Get the specific URL for the ticket listing
                const ticketUrl = await ticketElement.getProperty('href');
                const ticketUrlValue = await ticketUrl.jsonValue();

                // Extract Section (e.g., "Lower Level 119" -> "119")
                const sectionText = await ticketElement.$eval('.MuiTypography-root.MuiTypography-small-medium.styles_nowrap___p2Eb.mui-12s2z4k', el => el.innerText.trim());
                const sectionMatch = sectionText.match(/(\d+)/);
                const section = sectionMatch ? sectionMatch[0] : null;

                // Extract Row (e.g., "Row 15" -> "15")
                const rowText = await ticketElement.$eval('.MuiTypography-root.MuiTypography-caption-regular.styles_nowrap___p2Eb.mui-x6azc9', el => el.innerText.trim());
                const rowMatch = rowText.match(/(\d+)/);
                const row = rowMatch ? rowMatch[0] : null;

                // Extract Price using the updated class selector that targets only the price
                const priceText = await ticketElement.$eval('.MuiTypography-root.MuiTypography-body-bold.styles_nowrap___p2Eb.mui-1nxievo', el => el.innerText.trim());

                // Remove unwanted characters like the extra dollar signs and 'ea'
                let price = priceText.replace(/[^0-9.]/g, ''); // Remove everything except digits and periods

                // If the price has two dollar signs, just keep one
                if (priceText.startsWith('$$')) {
                    price = priceText.replace('$$', '$').replace(/[^0-9.]/g, ''); // Keep a single dollar sign
                }

                // Parse price as a float and remove 'ea' text
                price = parseFloat(price);

                // Price estimate (uniform multiplier of 1.4)
                const estimatedPrice = (price * 1.4).toFixed(2);

                if (section && row) {
                    const ticketInfo = `Date: 02-27-2025, Home Team: Suns, Away Team: Pelicans, Section: ${section}, Row: ${row}, Price: $${price.toFixed(2)}, Est. Price: $${estimatedPrice}, URL: ${ticketUrlValue}`;
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
