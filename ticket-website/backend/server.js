const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());

// Database connection
const db = new sqlite3.Database('./scrapers/tickets.db');

// Get all tickets or apply filters
app.get('/tickets', (req, res) => {
    const { section, min_price, max_price } = req.query;
    let query = 'SELECT * FROM tickets WHERE 1=1';
    const params = [];

    if (section) {
        query += ' AND section = ?';
        params.push(section);
    }

    if (min_price) {
        query += ' AND price >= ?';
        params.push(min_price);
    }

    if (max_price) {
        query += ' AND price <= ?';
        params.push(max_price);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('Database error.');
        }
        res.json(rows);
    });
});

app.get('/ticketsbsb', (req, res) => {
    const { section, min_price, max_price } = req.query;
    let query = 'SELECT * FROM ticketsbsb WHERE 1=1';
    const params = [];

    if (section) {
        query += ' AND section = ?';
        params.push(section);
    }

    if (min_price) {
        query += ' AND price >= ?';
        params.push(min_price);
    }

    if (max_price) {
        query += ' AND price <= ?';
        params.push(max_price);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error querying database: ', err);
            return res.status(500).send('Database error.');
        }
        res.json(rows);
    });
});

app.get('/ticketscon', (req, res) => {
    const { section, min_price, max_price } = req.query;
    let query = 'SELECT * FROM ticketscon WHERE 1=1';
    const params = [];

    if (section) {
        query += ' AND section = ?';
        params.push(section);
    }

    if (min_price) {
        query += ' AND price >= ?';
        params.push(min_price);
    }

    if (max_price) {
        query += ' AND price <= ?';
        params.push(max_price);
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error querying database: ', err);
            return res.status(500).send('Database error.');
        }
        res.json(rows);
    });
})

// Update ticket information
app.put('/tickets/:id', express.json(), (req, res) => {
    const { id } = req.params;
    const { date, home_team, away_team, section, row, price, est_price, url, source, created_at } = req.body;

    const query = `
        UPDATE tickets
        SET date = ?, home_team = ?, away_team = ?, section = ?, row = ?, price = ?, est_price = ?, url = ?, source = ?, created_at = ?
        WHERE id = ?
    `;

    db.run(query, [date, home_team, away_team, section, row, price, est_price, url, source, created_at, id], function (err) {
        if (err) {
            console.error('Error updating ticket:', err);
            return res.status(500).send('Database error.');
        }
        res.send({ updated: this.changes });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
