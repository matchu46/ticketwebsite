const express = require('express');
const { Ticket } = require('./models/ticket');
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
    const filePath = path.resolve(__dirname, 'sun_sh_01_09.txt'); // Adjust this to your correct file path

    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return res.status(404).send('Ticket file not found.');
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error reading ticket data.');
        }
        console.log('Data read from file:', data); // Log file content for debugging
    
        // Process file data into tickets
        const tickets = data.split('\n').map(line => {
            // Match the structure: Section: <number>, Row: <number>, Price: $<amount>, Est. Price: $<amount>, URL: <string>
            const regex = /Section: (\d+), Row: (\d+), Price: \$([\d\.]+), Est\. Price: \$([\d\.]+), URL: (.+)/;
            const match = line.match(regex);

            if (match) {
                // Return the ticket information as an object
                const [, section, row, price, estPrice, url] = match;
                return { section, row, price: `$${price}`, estPrice: `$${estPrice}`, url };
            }
            return null; // Return null if no match found
        }).filter(ticket => ticket !== null); // Remove null values

        console.log('Tickets array:', tickets); // Log the parsed tickets array
        res.json(tickets); // Send tickets as JSON
    });
});

app.post('/import-tickets', async (req, res) => {
    const filePath = path.resolve(__dirname, 'sun_sh_01_09.txt');

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('Ticket file not found.');
    }

    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).send('Error reading ticket data.');
        }

        try {
            const tickets = data.split('\n').map(line => {
                const regex = /Section: (\d+), Row: (\d+), Price: \$([\d\.]+), Est\. Price: \$([\d\.]+), URL: (.+)/;
                const match = line.match(regex);

                if (match) {
                    const [, section, row, price, estPrice, url] = match;
                    return { section, row, price: parseFloat(price), estPrice: parseFloat(estPrice), url };
                }
                return null;
            }).filter(ticket => ticket !== null);

            await Ticket.bulkCreate(tickets);
            res.send('Tickets imported successfully!');
        } catch (error) {
            console.error('Error saving tickets:', error);
            res.status(500).send('Error saving tickets.');
        }
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
