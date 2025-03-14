const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Database setup
const db = new sqlite3.Database('./tickets.db');

// Initialize database schema
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        section INTEGER NOT NULL,
        row INTEGER NOT NULL,
        price REAL NOT NULL,
        est_price REAL NOT NULL,
        url TEXT NOT NULL
    )`);

    console.log('Database initialized.');

    // Load text file and populate database
    const filePath = path.resolve(__dirname, 'sun_sh_02_27.txt');
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        process.exit(1);
    }

    const fileData = fs.readFileSync(filePath, 'utf8');
    const lines = fileData.split('\n');

    const insertStmt = db.prepare(`INSERT INTO tickets (date, home_team, away_team, section, row, price, est_price, url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

    lines.forEach(line => {
        const regex = /Date: ([\d-]+), Home Team: ([^,]+), Away Team: ([^,]+), Section: (\d+), Row: (\d+), Price: \$([\d\.]+), Est\. Price: \$([\d\.]+), URL: (.+)/;
        const match = line.match(regex);

        if (match) {
            const [, date, homeTeam, awayTeam, section, row, price, estPrice, url] = match;
            insertStmt.run(date, homeTeam, awayTeam, section, row, price, estPrice, url);
        }
    });

    insertStmt.finalize();
    console.log('Data loaded into the database.');
});

db.close();
