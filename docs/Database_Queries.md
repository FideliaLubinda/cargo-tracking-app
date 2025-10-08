# Database Queries for Cargo Tracking App

## Overview
This document provides SQL queries to view, manage, and delete data in the cargo tracking application database.

## Database Files
- Primary: `backend/database.db` (SQLite)
- Legacy: `backend/luggage.db` (SQLite)

## View Data Queries

### 1. View All Users
```sql
SELECT id, fullname, email, role, company, employeeId, 
       datetime(createdAt, 'localtime') as created_at
FROM users 
ORDER BY createdAt DESC;
```

### 2. View All Luggage
```sql
SELECT l.id, l.tag, l.description, l.status, l.lastLat, l.lastLng,
       u.fullname as sender_name, u.email as sender_email,
       v.busColor, v.busType, v.numberPlate,
       datetime(l.createdAt, 'localtime') as created_at
FROM luggage l
LEFT JOIN users u ON l.createdBy = u.id
LEFT JOIN vehicles v ON l.vehicleId = v.id
ORDER BY l.createdAt DESC;
```

### 3. View All Custody Logs
```sql
SELECT c.id, c.luggageId, c.action, c.note, c.station, c.locationNote,
       c.lat, c.lng, u.fullname as handler_name, u.company,
       datetime(c.createdAt, 'localtime') as created_at
FROM custody_logs c
LEFT JOIN users u ON c.userId = u.id
ORDER BY c.createdAt DESC;
```

### 4. View All Vehicles
```sql
SELECT v.id, v.busColor, v.busType, v.numberPlate, v.description,
       u.fullname as created_by,
       datetime(v.createdAt, 'localtime') as created_at
FROM vehicles v
LEFT JOIN users u ON v.createdBy = u.id
ORDER BY v.createdAt DESC;
```

### 5. View Luggage with Full Custody Chain
```sql
SELECT l.id as luggage_id, l.tag, l.description,
       u.fullname as sender_name,
       c.action, c.note, c.station, c.locationNote,
       h.fullname as handler_name, h.company,
       datetime(c.createdAt, 'localtime') as custody_time
FROM luggage l
LEFT JOIN users u ON l.createdBy = u.id
LEFT JOIN custody_logs c ON l.id = c.luggageId
LEFT JOIN users h ON c.userId = h.id
ORDER BY l.id, c.createdAt;
```

### 6. View Recent Activity (Last 24 Hours)
```sql
SELECT 'user_signup' as activity_type, fullname as actor, email as details, 
       datetime(createdAt, 'localtime') as timestamp
FROM users 
WHERE datetime(createdAt) > datetime('now', '-1 day')

UNION ALL

SELECT 'luggage_created' as activity_type, u.fullname as actor, 
       l.description as details, datetime(l.createdAt, 'localtime') as timestamp
FROM luggage l
LEFT JOIN users u ON l.createdBy = u.id
WHERE datetime(l.createdAt) > datetime('now', '-1 day')

UNION ALL

SELECT 'custody_log' as activity_type, u.fullname as actor,
       c.action || ' - ' || c.note as details,
       datetime(c.createdAt, 'localtime') as timestamp
FROM custody_logs c
LEFT JOIN users u ON c.userId = u.id
WHERE datetime(c.createdAt) > datetime('now', '-1 day')

ORDER BY timestamp DESC;
```

## Delete Data Queries

### 1. Delete Specific User
```sql
-- First, delete related data
DELETE FROM custody_logs WHERE userId = ?;
DELETE FROM luggage WHERE createdBy = ?;
DELETE FROM vehicles WHERE createdBy = ?;

-- Then delete the user
DELETE FROM users WHERE id = ?;
```

### 2. Delete Specific Luggage and Related Data
```sql
-- Delete custody logs for this luggage
DELETE FROM custody_logs WHERE luggageId = ?;

-- Delete the luggage
DELETE FROM luggage WHERE id = ?;
```

### 3. Delete Specific Custody Log
```sql
DELETE FROM custody_logs WHERE id = ?;
```

### 4. Delete Specific Vehicle
```sql
-- First update luggage to remove vehicle reference
UPDATE luggage SET vehicleId = NULL WHERE vehicleId = ?;

-- Then delete the vehicle
DELETE FROM vehicles WHERE id = ?;
```

### 5. Delete All Test Data
```sql
-- Delete all custody logs
DELETE FROM custody_logs;

-- Delete all luggage
DELETE FROM luggage;

-- Delete all vehicles
DELETE FROM vehicles;

-- Delete all users (except admin if you have one)
DELETE FROM users WHERE role != 'admin';
```

### 6. Reset Database (Complete Cleanup)
```sql
-- Drop and recreate tables
DROP TABLE IF EXISTS custody_logs;
DROP TABLE IF EXISTS luggage;
DROP TABLE IF EXISTS vehicles;
DROP TABLE IF EXISTS users;

-- Recreate tables (run the CREATE TABLE statements from db.js)
```

## Update Data Queries

### 1. Update User Information
```sql
UPDATE users 
SET fullname = ?, email = ?, company = ?, employeeId = ?
WHERE id = ?;
```

### 2. Update Luggage Location
```sql
UPDATE luggage 
SET lastLat = ?, lastLng = ?
WHERE id = ?;
```

### 3. Update Luggage Status
```sql
UPDATE luggage 
SET status = ?
WHERE id = ?;
```

## Search Queries

### 1. Search Users by Name or Email
```sql
SELECT * FROM users 
WHERE fullname LIKE '%search_term%' 
   OR email LIKE '%search_term%';
```

### 2. Search Luggage by Description
```sql
SELECT l.*, u.fullname as sender_name
FROM luggage l
LEFT JOIN users u ON l.createdBy = u.id
WHERE l.description LIKE '%search_term%';
```

### 3. Find Luggage by Location (within radius)
```sql
SELECT l.*, u.fullname as sender_name,
       (6371 * acos(cos(radians(?)) * cos(radians(l.lastLat)) * 
        cos(radians(l.lastLng) - radians(?)) + 
        sin(radians(?)) * sin(radians(l.lastLat)))) AS distance
FROM luggage l
LEFT JOIN users u ON l.createdBy = u.id
WHERE l.lastLat IS NOT NULL AND l.lastLng IS NOT NULL
HAVING distance < ?
ORDER BY distance;
```

## Statistics Queries

### 1. User Statistics
```sql
SELECT 
    role,
    COUNT(*) as count
FROM users 
GROUP BY role;
```

### 2. Luggage Statistics
```sql
SELECT 
    COUNT(*) as total_luggage,
    COUNT(CASE WHEN lastLat IS NOT NULL THEN 1 END) as with_location,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active
FROM luggage;
```

### 3. Custody Activity by Day
```sql
SELECT 
    DATE(createdAt) as date,
    COUNT(*) as custody_events
FROM custody_logs 
GROUP BY DATE(createdAt)
ORDER BY date DESC;
```

## Using These Queries

### Via SQLite Command Line
```bash
# Open database
sqlite3 backend/database.db

# Run queries
SELECT * FROM users;

# Exit
.quit
```

### Via Node.js Script
```javascript
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./backend/database.db');

db.all("SELECT * FROM users", (err, rows) => {
    if (err) throw err;
    console.log(rows);
});

db.close();
```

### Via Browser Console (if database-viewer.html is available)
Open `http://localhost:5000/database-viewer` and use the interface.

## Common Issues and Solutions

### 1. "User not found" Error
- Check if user exists: `SELECT * FROM users WHERE email = 'user@example.com';`
- Verify password hash: `SELECT password FROM users WHERE email = 'user@example.com';`

### 2. "Luggage not found" Error
- Check luggage exists: `SELECT * FROM luggage WHERE id = ?;`
- Verify luggage has GPS data: `SELECT lastLat, lastLng FROM luggage WHERE id = ?;`

### 3. Database Locked Error
- Stop the Node.js server before running direct SQL queries
- Use `PRAGMA busy_timeout = 30000;` to wait for locks

### 4. Foreign Key Constraint Errors
- Delete child records first (custody_logs before luggage)
- Use transactions for complex deletions

## Backup and Restore

### Backup Database
```bash
# Copy the database file
cp backend/database.db backend/database_backup_$(date +%Y%m%d_%H%M%S).db

# Or export to SQL
sqlite3 backend/database.db .dump > backup.sql
```

### Restore Database
```bash
# From backup file
cp backend/database_backup_20231201_120000.db backend/database.db

# From SQL dump
sqlite3 backend/database.db < backup.sql
```
