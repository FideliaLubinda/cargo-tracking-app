const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all vehicles
router.get('/', (req, res) => {
  db.all(`SELECT * FROM vehicles ORDER BY createdAt DESC`, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Add new vehicle
router.post('/add', (req, res) => {
  const { busColor, busType, numberPlate, description, createdBy } = req.body;
  
  if (!busColor || !busType || !numberPlate) {
    return res.status(400).json({ error: 'Bus color, type, and number plate are required' });
  }

  db.run(
    `INSERT INTO vehicles (busColor, busType, numberPlate, description, createdBy) VALUES (?, ?, ?, ?, ?)`,
    [busColor, busType, numberPlate, description, createdBy],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'A vehicle with this number plate already exists' });
        }
        return res.status(400).json({ error: err.message });
      }
      res.json({ 
        message: 'Vehicle added successfully',
        vehicleId: this.lastID 
      });
    }
  );
});

// Get vehicle by ID
router.get('/:id', (req, res) => {
  db.get(`SELECT * FROM vehicles WHERE id = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(row);
  });
});

module.exports = router; 