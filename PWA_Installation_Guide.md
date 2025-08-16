# PWA Installation Guide for iOS

## What is a PWA?
A Progressive Web App (PWA) makes your web app work like a native mobile app with features like:
- ✅ Install to home screen
- ✅ Works offline
- ✅ Full-screen experience
- ✅ Push notifications (if implemented)
- ✅ Fast loading with caching

## How to Install on iOS

### Method 1: Safari (Recommended)
1. **Open Safari** on your iPhone
2. **Navigate to**: `http://172.16.38.171:5000`
3. **Tap the Share button** (square with arrow pointing up)
4. **Scroll down** and tap **"Add to Home Screen"**
5. **Customize the name** (e.g., "Cargo Tracker")
6. **Tap "Add"**

### Method 2: Chrome (Alternative)
1. **Open Chrome** on your iPhone
2. **Navigate to**: `http://172.16.38.171:5000`
3. **Tap the menu** (three dots)
4. **Select "Add to Home Screen"**
5. **Follow the prompts**

## Using Your PWA

### Launch the App
- **Tap the app icon** on your home screen
- It opens in **full-screen mode** (no Safari address bar)
- **Looks and feels** like a native app

### Available Features
- **Offline Access**: View cached data when no internet
- **Fast Loading**: App loads instantly from cache
- **Native Feel**: Smooth animations and transitions
- **Home Screen Icon**: Custom icon with your app name

### App Pages
- **Dashboard**: Main tracking overview
- **Map View**: Real-time GPS tracking
- **Login/Signup**: User authentication
- **Custody Management**: Track luggage transfers
- **Handler Interface**: For airport staff
- **Sender Interface**: For travelers

## Troubleshooting

### App Won't Install
- Make sure you're using **Safari** (iOS requirement)
- Check that the server is running (`npm start`)
- Verify both devices are on the same WiFi network

### App Won't Load
- Check if the server is running on port 5000
- Try refreshing the page
- Clear Safari cache: Settings > Safari > Clear History and Website Data

### Offline Mode Not Working
- The app needs to be visited once online to cache resources
- Service worker caches pages for offline use
- GPS tracking requires internet connection

## Advanced Features

### Service Worker
- Automatically caches app resources
- Enables offline functionality
- Updates in background

### Manifest File
- Defines app appearance and behavior
- Sets theme colors and icons
- Configures display mode

### iOS-Specific Features
- **Apple Touch Icon**: Custom home screen icon
- **Status Bar Style**: Matches your app theme
- **Full-Screen Mode**: No browser UI visible

## Benefits of PWA

1. **No App Store**: Install directly from browser
2. **Smaller Size**: Much smaller than native apps
3. **Easy Updates**: Updates automatically
4. **Cross-Platform**: Works on iOS and Android
5. **Offline Capable**: Works without internet
6. **Native Feel**: Looks and behaves like native apps

## Quick Commands

### Start Server
```bash
cd backend
npm start
```

### Check Server Status
```bash
netstat -an | findstr :5000
```

### Access App
- **Local Network**: `http://172.16.38.171:5000`
- **From Phone**: Same URL (must be on same WiFi) 