const express = require('express');
const db = require('../db');
const QRCode = require('qrcode');
const router = express.Router();

// Add luggage with systematic busSlot (1..20) per vehicle and generate QR
router.post('/add', (req, res) => {
  const { senderId, color, shape, description, vehicleId } = req.body;
  if (!vehicleId) return res.status(400).json({ error: 'vehicleId is required' });

  // Find next available slot (1..20) for this vehicle
  db.all(`SELECT busSlot FROM luggage WHERE vehicleId = ? ORDER BY busSlot ASC`, [vehicleId], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    const taken = new Set(rows.filter(r => r.busSlot != null).map(r => Number(r.busSlot)));
    let slot = null;
    for (let i = 1; i <= 20; i++) {
      if (!taken.has(i)) { slot = i; break; }
    }
    if (!slot) return res.status(400).json({ error: 'Vehicle capacity full (20 luggages)' });

    const publicId = (Number(vehicleId) - 1) * 20 + slot;

    db.run(
      `INSERT INTO luggage (senderId, color, shape, description, vehicleId, busSlot, publicId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [senderId, color, shape, description, vehicleId, slot, publicId],
      function (err2) {
        if (err2) return res.status(400).json({ error: err2.message });
        const luggageId = this.lastID;

        // Generate QR that includes publicId for hardware simplicity
        QRCode.toDataURL(`${publicId}:${vehicleId}`, (qrErr, url) => {
          if (qrErr) return res.status(500).json({ error: 'QR code error' });
          db.run(`UPDATE luggage SET qrCode = ? WHERE id = ?`, [url, luggageId]);
          res.json({
            luggageId,
            vehicleId,
            busSlot: slot,
            publicId,
            qrCode: url,
            color,
            shape,
            description
          });
        });
      }
    );
  });
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

// Update GPS by publicId (systematic ID used by hardware)
router.post('/update-location-by-public/:publicId', (req, res) => {
  const { publicId } = req.params;
  const { latitude, longitude } = req.body;
  db.run(
    `UPDATE luggage SET gpsLat = ?, gpsLng = ? WHERE publicId = ?`,
    [latitude, longitude, publicId],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Luggage (publicId) not found' });
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