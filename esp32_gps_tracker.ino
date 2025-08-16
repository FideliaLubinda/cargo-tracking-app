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
const char* serverUrl = "http://172.16.38.171:5000/api/luggage/update-location/";
const int luggageId = 1; // Change this to match your luggage ID

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

// LED for status indication
const int ledPin = 2; // Built-in LED on most ESP32 boards

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
  
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  
  Serial.println("ESP32 GPS Tracker Starting...");
  
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
    digitalWrite(ledPin, LOW);
    while(true);
  }
  
  // Send GPS data to server periodically
  if (millis() - lastUpdate > updateInterval) {
    if (gps.location.isValid()) {
      sendGPSData();
      lastUpdate = millis();
    } else {
      Serial.println("GPS location not valid yet...");
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
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["latitude"] = gps.location.lat();
    doc["longitude"] = gps.location.lng();
    
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
  html += "<h1>ESP32 GPS Tracker</h1>";
  html += "<p>GPS Status: " + String(gps.location.isValid() ? "Valid" : "Invalid") + "</p>";
  html += "<p>Latitude: " + String(gps.location.lat(), 6) + "</p>";
  html += "<p>Longitude: " + String(gps.location.lng(), 6) + "</p>";
  html += "<p>Satellites: " + String(gps.satellites.value()) + "</p>";
  html += "<p>WiFi: " + WiFi.SSID() + "</p>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleConfig() {
  // Add configuration page here if needed
  server.send(200, "text/plain", "Configuration page");
} 