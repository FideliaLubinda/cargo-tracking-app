const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const JWT_SECRET = 'your_secret_key';

// Sender/Handler Signup
router.post('/signup', (req, res) => {
  const { fullname, email, password, role, company, employeeId } = req.body;
  const hash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (fullname, email, password, role, company, employeeId) VALUES (?, ?, ?, ?, ?, ?)`,
    [fullname, email, hash, role, company || null, employeeId || null],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ id: this.lastID, fullname, email, role, company, employeeId });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) return res.status(400).json({ error: 'User not found' });
    if (!bcrypt.compareSync(password, user.password))
      return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, fullname: user.fullname, role: user.role } });
  });
});

// Get all users (for database viewer)
router.get('/users', (req, res) => {
  db.all(`SELECT id, fullname, email, role, company, employeeId FROM users`, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;