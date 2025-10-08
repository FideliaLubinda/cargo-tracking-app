const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const authRoutes = require('./routes/auth');
const luggageRoutes = require('./routes/luggage');
const custodyRoutes = require('./routes/custody');
const vehicleRoutes = require('./routes/vehicles');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/luggage', luggageRoutes);
app.use('/api/custody', custodyRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Route to get all users (moved from auth routes for easier access)
app.get('/api/users', (req, res) => {
  db.all(`SELECT id, fullname, email, role, company, employeeId FROM users`, (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Serve specific HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/signup.html'));
});

app.get('/sender', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/sender.html'));
});

app.get('/handler', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/handler.html'));
});

app.get('/custody', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/custody.html'));
});

app.get('/map', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/map.html'));
});

app.get('/database-viewer', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/database-viewer.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin-dashboard.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));