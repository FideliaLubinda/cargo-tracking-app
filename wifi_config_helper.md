# WiFi Configuration Helper

## How to Change WiFi Settings in ESP32 GPS Tracker

### Step 1: Find Your New WiFi Details
- Network Name (SSID): Your WiFi network name
- Password: Your WiFi password

### Step 2: Update the ESP32 Code
Open `esp32_gps_tracker.ino` and change these lines:

```cpp
// WiFi Configuration - UPDATE THESE FOR YOUR NETWORK
const char* ssid = "YOUR_NEW_WIFI_NAME";        // Change this
const char* password = "YOUR_NEW_WIFI_PASSWORD"; // Change this
```

### Step 3: Update Server IP Address
If your computer's IP address changes, also update:

```cpp
// Server Configuration - UPDATE THIS TO YOUR COMPUTER'S IP
const char* serverUrl = "http://YOUR_NEW_IP:5000/api/luggage/update-location/";
```

To find your computer's IP address:
- Windows: Run `ipconfig` in Command Prompt
- Look for "IPv4 Address" under your WiFi adapter

### Step 4: Upload the Code
1. Connect your ESP32 to your computer
2. Open Arduino IDE
3. Select the correct board and port
4. Click "Upload" button

### Step 5: Test the Connection
- The built-in LED will blink while connecting to WiFi
- Solid LED means connected successfully
- Check the Serial Monitor for connection status

## Quick Commands

### To start the server:
```bash
cd backend
npm start
```

### To find your IP address:
```bash
ipconfig
```

### To check if server is running:
```bash
netstat -an | findstr :5000
```

## Troubleshooting

1. **ESP32 won't connect to WiFi:**
   - Double-check SSID and password
   - Make sure WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
   - Check if WiFi password has special characters

2. **Can't access app from phone:**
   - Make sure phone and computer are on same WiFi network
   - Check Windows Firewall settings
   - Verify server is running on port 5000

3. **GPS not working:**
   - Check GPS module wiring (RX/TX connections)
   - Make sure GPS module is outdoors or near a window
   - Wait 5-10 minutes for first GPS fix 