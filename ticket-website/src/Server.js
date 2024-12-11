const express = require('express');
const fs = require('fs');
const path = require('path');  // Import the path module
const cors = require('cors');  // To allow frontend access
const app = express();
const PORT = 5000;

// Enable CORS for frontend-backend communication
app.use(cors());

// Serve ticket data
app.get('/tickets', (req, res) => {
    // Use path.resolve to get the absolute path to the ticket file
    const filePath = path.resolve(__dirname, 'ticket_info_02_08.txt'); // Adjust this to your correct file path

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading ticket data.');
        }
        console.log('Data read from file:', data); // Log file content for debugging
    
        // Process file data into tickets
        const tickets = data.split('\n').map(line => {
            // Match the structure: Section: <number>, Row: <number>, Price: $<amount>, Est. Price: $<amount>
            const regex = /Section: (\d+), Row: (\d+), Price: \$([\d\.]+), Est\. Price: \$([\d\.]+)/;
            const match = line.match(regex);

            if (match) {
                // Return the ticket information as an object
                const [, section, row, price, estPrice] = match;
                return { section, row, price: `$${price}`, estPrice: `$${estPrice}` };
            }
            return null; // Return null if no match found
        }).filter(ticket => ticket !== null); // Remove null values

        console.log('Tickets array:', tickets); // Log the parsed tickets array
        res.json(tickets); // Send tickets as JSON
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
