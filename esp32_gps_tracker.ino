#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>

// ===========================================
// CONFIGURATION SECTION - UPDATE THESE VALUES
// ===========================================

// WiFi Configuration - UPDATE THESE FOR YOUR NETWORK
const char* ssid = "Fifi";           // Change this to your WiFi network name
const char* password = "01230428";   // Change this to your WiFi password

// Server Configuration - UPDATE THIS TO YOUR COMPUTER'S IP
const char* serverUrl = "http://172.20.10.2:5000/api/luggage/update-location/";
const int luggageId = 1; // Change this to match your luggage ID

// Zambia Default Coordinates (Lusaka area)
const double ZAMBIA_DEFAULT_LAT = -15.3875;  // Lusaka latitude
const double ZAMBIA_DEFAULT_LNG = 28.3228;   // Lusaka longitude

// ===========================================
// END CONFIGURATION SECTION
// ===========================================

// GPS Configuration for ESP32 DevKit
#define GPS_RX 16  // G16 pin on your board
#define GPS_TX 17  // G17 pin on your board
HardwareSerial gpsSerial(2); // Use UART2

TinyGPSPlus gps;

// Timing
unsigned long lastUpdate = 0;
const unsigned long updateInterval = 30000; // Update every 30 seconds

// GPS Quality Settings
const int MIN_SATELLITES = 4;  // Minimum satellites for good GPS fix
const float MIN_ACCURACY = 10.0; // Minimum accuracy in meters

// LED for status indication
const int ledPin = 2; // Built-in LED on most ESP32 boards

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  
  Serial.println("ESP32 GPS Tracker Starting...");
  Serial.println("Configured for Zambia location");
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    digitalWrite(ledPin, !digitalRead(ledPin)); // Blink LED while connecting
  }
  
  digitalWrite(ledPin, HIGH); // Solid LED when connected
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  Serial.println("Waiting for GPS signal...");
  Serial.println("Make sure GPS module has clear view of sky");
}

void loop() {
  // Read GPS data
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      displayInfo();
    }
  }
  
  // Check if GPS is working
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("No GPS detected. Check wiring.");
    Serial.println("Please check:");
    Serial.println("1. GPS module is connected to pins 16 (RX) and 17 (TX)");
    Serial.println("2. GPS module is powered (VCC to 3.3V, GND to GND)");
    Serial.println("3. GPS module has clear view of sky");
    digitalWrite(ledPin, LOW);
    while(true);
  }
  
  // Send GPS data to server periodically
  if (millis() - lastUpdate > updateInterval) {
    if (gps.location.isValid() && gps.satellites.value() >= MIN_SATELLITES) {
      sendGPSData();
      lastUpdate = millis();
    } else {
      Serial.println("GPS location not valid yet or insufficient satellites...");
      Serial.print("Satellites: ");
      Serial.println(gps.satellites.value());
    }
  }
  
  // Check WiFi connection and reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost. Reconnecting...");
    WiFi.reconnect();
    delay(5000);
  }
}

void displayInfo() {
  if (gps.location.isValid()) {
    Serial.print("Latitude: ");
    Serial.println(gps.location.lat(), 6);
    Serial.print("Longitude: ");
    Serial.println(gps.location.lng(), 6);
  } else {
    Serial.println("Location: Not Available");
  }
  
  Serial.print("Satellites: ");
  Serial.println(gps.satellites.value());
  
  Serial.print("Date: ");
  if (gps.date.isValid()) {
    Serial.print(gps.date.month());
    Serial.print("/");
    Serial.print(gps.date.day());
    Serial.print("/");
    Serial.println(gps.date.year());
  } else {
    Serial.println("Not Available");
  }
  
  Serial.print("Time: ");
  if (gps.time.isValid()) {
    if (gps.time.hour() < 10) Serial.print(F("0"));
    Serial.print(gps.time.hour());
    Serial.print(":");
    if (gps.time.minute() < 10) Serial.print(F("0"));
    Serial.print(gps.time.minute());
    Serial.print(":");
    if (gps.time.second() < 10) Serial.print(F("0"));
    Serial.println(gps.time.second());
  } else {
    Serial.println("Not Available");
  }
  
  Serial.println();
}

void sendGPSData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Create JSON payload with additional GPS quality data
    StaticJsonDocument<300> doc;
    doc["latitude"] = gps.location.lat();
    doc["longitude"] = gps.location.lng();
    doc["satellites"] = gps.satellites.value();
    doc["altitude"] = gps.altitude.meters();
    doc["speed"] = gps.speed.kmph();
    doc["timestamp"] = String(gps.date.year()) + "-" + 
                      String(gps.date.month()) + "-" + 
                      String(gps.date.day()) + " " +
                      String(gps.time.hour()) + ":" + 
                      String(gps.time.minute()) + ":" + 
                      String(gps.time.second());
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Create URL with luggage ID
    String url = String(serverUrl) + String(luggageId);
    
    Serial.println("Sending GPS data to: " + url);
    Serial.println("Data: " + jsonString);
    
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println("Response: " + response);
      
      // Blink LED to indicate successful transmission
      digitalWrite(ledPin, LOW);
      delay(100);
      digitalWrite(ledPin, HIGH);
    } else {
      Serial.println("Error on sending POST: " + http.errorToString(httpResponseCode));
      Serial.println("Check if your server is running on the correct IP and port");
      // Rapid blink to indicate error
      for(int i = 0; i < 3; i++) {
        digitalWrite(ledPin, LOW);
        delay(200);
        digitalWrite(ledPin, HIGH);
        delay(200);
      }
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}

// Optional: Add a simple web server for configuration
#include <WebServer.h>
WebServer server(80);

void setupWebServer() {
  server.on("/", handleRoot);
  server.on("/config", handleConfig);
  server.begin();
  Serial.println("Web server started on port 80");
}

void handleRoot() {
  String html = "<html><body>";
  html += "<h1>ESP32 GPS Tracker - Zambia</h1>";
  html += "<p>GPS Status: " + String(gps.location.isValid() ? "Valid" : "Invalid") + "</p>";
  html += "<p>Latitude: " + String(gps.location.lat(), 6) + "</p>";
  html += "<p>Longitude: " + String(gps.location.lng(), 6) + "</p>";
  html += "<p>Satellites: " + String(gps.satellites.value()) + "</p>";
  html += "<p>Altitude: " + String(gps.altitude.meters()) + "m</p>";
  html += "<p>Speed: " + String(gps.speed.kmph()) + " km/h</p>";
  html += "<p>WiFi: " + WiFi.SSID() + "</p>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
  html += "<p>Server: " + String(serverUrl) + String(luggageId) + "</p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleConfig() {
  // Add configuration page here if needed
  server.send(200, "text/plain", "Configuration page");
} 