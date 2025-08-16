const express = require('express');
const db = require('../db');
const QRCode = require('qrcode');
const router = express.Router();

// Add luggage and generate QR code
router.post('/add', (req, res) => {
  const { senderId, color, shape, description, vehicleId } = req.body;
  db.run(
    `INSERT INTO luggage (senderId, color, shape, description, vehicleId) VALUES (?, ?, ?, ?, ?)`,
    [senderId, color, shape, description, vehicleId],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      const luggageId = this.lastID;
      // Generate QR code with luggageId and vehicleId
      QRCode.toDataURL(`${luggageId}:${vehicleId}`, (err, url) => {
        if (err) return res.status(500).json({ error: 'QR code error' });
        db.run(`UPDATE luggage SET qrCode = ? WHERE id = ?`, [url, luggageId]);
        res.json({ 
          luggageId, 
          vehicleId, 
          qrCode: url,
          color: color,
          shape: shape,
          description: description
        });
      });
    }
  );
});

// Update GPS coordinates for luggage (for hardware simulation)
router.post('/update-location/:luggageId', (req, res) => {
  const { luggageId } = req.params;
  const { latitude, longitude } = req.body;
  
  db.run(
    `UPDATE luggage SET gpsLat = ?, gpsLng = ? WHERE id = ?`,
    [latitude, longitude, luggageId],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Luggage not found' });
      }
      res.json({ message: 'Location updated successfully' });
    }
  );
});

// Get luggage by sender
router.get('/by-sender/:senderId', (req, res) => {
  db.all(`SELECT * FROM luggage WHERE senderId = ?`, [req.params.senderId], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Get luggage by id (must come after other specific routes)
router.get('/id/:id', (req, res) => {
  db.get(`SELECT * FROM luggage WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(row);
  });
});

// Get all luggage (for database viewer) - must be last
router.get('/', (req, res) => {
  db.all(`SELECT * FROM luggage`, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;