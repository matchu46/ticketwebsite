const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.resolve(__dirname, '../ticketDB.sqlite'), // Path to the SQLite database file
});

// Define the Ticket model
const Ticket = sequelize.define('Ticket', {
    section: { type: DataTypes.STRING, allowNull: false },
    row: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
    estPrice: { type: DataTypes.FLOAT, allowNull: false },
    url: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.STRING, defaultValue: 'available' }, // e.g., 'available', 'sold'
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// Sync the model with the database
(async () => {
    await sequelize.sync();
    console.log('Database synced and Ticket table created.');
})();

module.exports = { sequelize, Ticket };
