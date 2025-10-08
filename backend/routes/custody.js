const express = require('express');
const db = require('../db');
const router = express.Router();

// Add custody log
router.post('/add', (req, res) => {
  const { luggageId, handlerName, company, employeeId, timestamp, station = null, locationNote = null, lat = null, lng = null } = req.body;
  db.run(
    `INSERT INTO custodyLogs (luggageId, handlerName, company, employeeId, timestamp, station, locationNote, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [luggageId, handlerName, company, employeeId, timestamp, station, locationNote, lat, lng],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Get all custody logs (for database viewer)
router.get('/', (req, res) => {
  db.all(`SELECT * FROM custodyLogs ORDER BY timestamp DESC`, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Get custody logs for luggage
router.get('/by-luggage/:luggageId', (req, res) => {
  db.all(`SELECT * FROM custodyLogs WHERE luggageId = ?`, [req.params.luggageId], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;