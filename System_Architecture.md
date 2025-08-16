# Cargo Tracking System - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Login     │  │   Sender    │  │   Handler   │  │   Map   │ │
│  │   Page      │  │   Dashboard │  │   Dashboard │  │   View  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│         │                │                │              │      │
│         └────────────────┼────────────────┼──────────────┘      │
│                          │                │                     │
└──────────────────────────┼────────────────┼─────────────────────┘
                           │                │
┌──────────────────────────┼────────────────┼─────────────────────┐
│                    BACKEND API LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │   Auth      │  │   Luggage   │  │   Custody   │  │Vehicles │ │
│  │   Routes    │  │   Routes    │  │   Routes    │  │ Routes  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘ │
│         │                │                │              │      │
│         └────────────────┼────────────────┼──────────────┘      │
│                          │                │                     │
└──────────────────────────┼────────────────┼─────────────────────┘
                           │                │
┌──────────────────────────┼────────────────┼─────────────────────┐
│                     DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    SQLite Database                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │ │
│  │  │    USERS    │  │   LUGGAGE   │  │  CUSTODY    │         │ │
│  │  │             │  │             │  │    LOGS     │         │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘         │ │
│  │  ┌─────────────┐                                          │ │
│  │  │  VEHICLES   │                                          │ │
│  │  └─────────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend Technologies
- **HTML5** - Structure and semantic markup
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Client-side functionality
- **Leaflet.js** - Interactive maps
- **HTML5 QR Code Scanner** - QR code scanning capability

### Backend Technologies
- **Node.js** - Server runtime environment
- **Express.js** - Web application framework
- **SQLite3** - Lightweight database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - Authentication tokens
- **qrcode** - QR code generation

### Development Tools
- **npm** - Package management
- **Git** - Version control
- **PowerShell** - Command line interface

## System Components

### 1. Authentication System
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───▶│   JWT       │───▶│   User      │
│   Form      │    │   Token     │    │   Session   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Luggage Creation Workflow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Vehicle   │───▶│   Luggage   │───▶│   QR Code   │───▶│   Success   │
│   Creation  │    │   Details   │    │ Generation  │    │   Page      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 3. Tracking System
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   QR Scan   │───▶│   GPS       │───▶│   Map       │───▶│   Location  │
│   / Manual  │    │   Update    │    │   Display   │    │   Tracking  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login

### Luggage Management
- `POST /api/luggage/add` - Create new luggage
- `GET /api/luggage/id/:id` - Get luggage by ID
- `POST /api/luggage/update-location/:id` - Update GPS coordinates

### Vehicle Management
- `POST /api/vehicles/add` - Create new vehicle
- `GET /api/vehicles/:id` - Get vehicle by ID
- `GET /api/vehicles` - Get all vehicles

### Custody Management
- `POST /api/custody/add` - Create custody log
- `GET /api/custody/by-luggage/:id` - Get custody logs for luggage

## Security Features

1. **Password Hashing** - bcryptjs for secure password storage
2. **JWT Authentication** - Stateless authentication tokens
3. **Input Validation** - Server-side data validation
4. **SQL Injection Prevention** - Parameterized queries
5. **CORS Configuration** - Cross-origin resource sharing

## Data Flow Architecture

### User Registration Flow
1. User fills registration form
2. Frontend validates input
3. Backend hashes password
4. User data stored in database
5. JWT token generated
6. User redirected to appropriate dashboard

### Luggage Creation Flow
1. User logs in as sender
2. User creates vehicle description
3. User describes luggage
4. System generates QR code
5. Luggage data stored with vehicle reference
6. Success page with QR code displayed

### Tracking Flow
1. Handler scans QR code or enters ID manually
2. System retrieves luggage information
3. GPS coordinates updated (simulated)
4. Map displays current location
5. Custody log created

## Scalability Considerations

### Current Architecture
- **Single-server deployment**
- **SQLite database** (suitable for small to medium scale)
- **File-based storage** for QR codes

### Future Scalability Options
- **Database migration** to PostgreSQL/MySQL
- **Cloud storage** for QR codes and images
- **Load balancing** for multiple servers
- **Redis caching** for session management
- **Microservices architecture** for different modules

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SERVER                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    Web Server                           │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │   Static    │  │   API       │  │   Database      │ │ │
│  │  │   Files     │  │   Server    │  │   (SQLite)      │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Performance Optimizations

1. **Static File Serving** - Express static middleware
2. **Database Indexing** - Primary and foreign key indexes
3. **Image Optimization** - QR codes as data URLs
4. **Caching Strategy** - Browser caching for static assets
5. **Minification** - CSS and JavaScript optimization

## Monitoring and Logging

1. **Error Handling** - Comprehensive try-catch blocks
2. **Console Logging** - Debug information for development
3. **User Feedback** - Success/error messages
4. **Database Logging** - Query execution tracking 