# Cargo Tracking System - Entity Relationship Diagram

## Database Schema Overview

### Entities and Their Relationships

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│      USERS      │         │     LUGGAGE     │         │    VEHICLES     │
├─────────────────┤         ├─────────────────┤         ├─────────────────┤
│ PK: id          │         │ PK: id          │         │ PK: id          │
│ fullname        │         │ FK: senderId    │◄────────┤ busColor        │
│ email (UNIQUE)  │◄────────┤ color           │         │ busType         │
│ password        │         │ shape           │         │ numberPlate     │
│ role            │         │ description     │         │ (UNIQUE)        │
│ company         │         │ qrCode          │         │ description     │
│ employeeId      │         │ gpsLat          │         │ FK: createdBy   │
└─────────────────┘         │ gpsLng          │         │ createdAt       │
                            │ FK: vehicleId   │────────►└─────────────────┘
                            └─────────────────┘
                                    │
                                    │
                            ┌─────────────────┐
                            │  CUSTODY LOGS   │
                            ├─────────────────┤
                            │ PK: id          │
                            │ FK: luggageId   │◄────────┘
                            │ handlerName     │
                            │ company         │
                            │ employeeId      │
                            │ timestamp       │
                            └─────────────────┘
```

## Detailed Entity Descriptions

### 1. USERS Table
- **Primary Key:** id (INTEGER, AUTOINCREMENT)
- **Attributes:**
  - fullname (TEXT) - User's full name
  - email (TEXT, UNIQUE) - User's email address
  - password (TEXT) - Hashed password
  - role (TEXT) - 'sender' or 'handler'
  - company (TEXT) - Company name (for handlers)
  - employeeId (TEXT) - Employee ID (for handlers)

### 2. VEHICLES Table
- **Primary Key:** id (INTEGER, AUTOINCREMENT)
- **Attributes:**
  - busColor (TEXT) - Color of the bus
  - busType (TEXT) - Type of bus (Express, Local, etc.)
  - numberPlate (TEXT, UNIQUE) - Vehicle registration number
  - description (TEXT) - Additional vehicle description
  - createdBy (INTEGER) - Foreign key to USERS.id
  - createdAt (TEXT) - Timestamp of creation

### 3. LUGGAGE Table
- **Primary Key:** id (INTEGER, AUTOINCREMENT)
- **Foreign Keys:**
  - senderId (INTEGER) → USERS.id
  - vehicleId (INTEGER) → VEHICLES.id
- **Attributes:**
  - color (TEXT) - Luggage color
  - shape (TEXT) - Luggage shape (circle, box, irregular)
  - description (TEXT) - Luggage description
  - qrCode (TEXT) - Generated QR code data URL
  - gpsLat (REAL) - GPS latitude
  - gpsLng (REAL) - GPS longitude

### 4. CUSTODY LOGS Table
- **Primary Key:** id (INTEGER, AUTOINCREMENT)
- **Foreign Key:** luggageId (INTEGER) → LUGGAGE.id
- **Attributes:**
  - handlerName (TEXT) - Name of handler
  - company (TEXT) - Handler's company
  - employeeId (TEXT) - Handler's employee ID
  - timestamp (TEXT) - When custody was taken

## Relationships

1. **USERS → LUGGAGE** (1:N)
   - One user can create multiple luggage items
   - Each luggage belongs to one sender (user)

2. **USERS → VEHICLES** (1:N)
   - One user can create multiple vehicles
   - Each vehicle is created by one user

3. **VEHICLES → LUGGAGE** (1:N)
   - One vehicle can carry multiple luggage items
   - Each luggage is assigned to one vehicle

4. **LUGGAGE → CUSTODY LOGS** (1:N)
   - One luggage can have multiple custody logs
   - Each custody log belongs to one luggage

## Business Rules

1. **User Authentication:**
   - Email addresses must be unique
   - Passwords are hashed for security
   - Users have specific roles (sender/handler)

2. **Vehicle Management:**
   - Number plates must be unique
   - Vehicles are created by authenticated users
   - Each vehicle has detailed information

3. **Luggage Tracking:**
   - Each luggage has a unique QR code
   - GPS coordinates are optional (for tracking)
   - Luggage is linked to both sender and vehicle

4. **Custody Management:**
   - Each custody log tracks who handled the luggage
   - Timestamps are automatically recorded
   - Multiple handlers can handle the same luggage

## Data Flow

1. **Sender Workflow:**
   - User registers/logs in
   - Creates vehicle description
   - Describes luggage
   - System generates QR code
   - Luggage is ready for tracking

2. **Handler Workflow:**
   - Handler logs in
   - Scans QR code or enters luggage ID manually
   - System records custody
   - GPS updates can be simulated

3. **Tracking Workflow:**
   - GPS coordinates are updated
   - Map shows luggage location
   - Custody logs show handling history 