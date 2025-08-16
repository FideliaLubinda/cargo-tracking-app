const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./luggage.db');

// Create tables if they don't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullname TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT,
    company TEXT,
    employeeId TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS luggage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER,
    color TEXT,
    shape TEXT,
    description TEXT,
    qrCode TEXT,
    gpsLat REAL,
    gpsLng REAL,
    vehicleId INTEGER,
    FOREIGN KEY(senderId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS custodyLogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    luggageId INTEGER,
    handlerName TEXT,
    company TEXT,
    employeeId TEXT,
    timestamp TEXT,
    FOREIGN KEY(luggageId) REFERENCES luggage(id)
  )`);

  // Create vehicles table for manual bus descriptions
  db.run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    busColor TEXT,
    busType TEXT,
    numberPlate TEXT UNIQUE,
    description TEXT,
    createdBy INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(createdBy) REFERENCES users(id)
  )`);

  // Add vehicleId column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE luggage ADD COLUMN vehicleId INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('Database schema updated');
    }
  });
});

module.exports = db;