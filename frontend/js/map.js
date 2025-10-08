// js/map.js - Cargo Tracking Map Implementation

console.log('Loading cargo tracking map...');

// Resolve API base so map opened via file/127.0.0.1:5500 can reach backend on :5000
const API_BASE = (window.location.port && window.location.port !== '5000')
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : '';

// Initialize map centered on Lusaka, Zambia
const map = L.map('map').setView([-15.3875, 28.3228], 12);

// Add OpenStreetMap tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

// Store active markers for management
let activeMarkers = {};
let trackingLines = {};

// Custom icons (only green active and red inactive)
const deviceIcons = {
  active: L.divIcon({
    className: 'custom-marker active',
    html: '<div style="background-color: #28a745; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  }),
  inactive: L.divIcon({
    className: 'custom-marker inactive',
    html: '<div style="background-color: #dc3545; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  })
};

// Add CSS for marker animation
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
    100% { transform: scale(1); opacity: 1; }
  }
`;
document.head.appendChild(style);

// Function to determine device status (active/inactive only)
function getDeviceStatus(lastUpdate) {
  const now = new Date();
  const lastUpdateTime = new Date(lastUpdate);
  const timeDiff = (now - lastUpdateTime) / 1000 / 60; // minutes

  if (timeDiff > 10) return 'inactive'; // No update in 10 minutes
  return 'active'; // Active within 10 minutes
}

// Function to add or update GPS marker
function addOrUpdateGPSMarker(gpsData) {
  const { deviceId, latitude, longitude, timestamp, speed = 0, heading = 0 } = gpsData;
  const status = getDeviceStatus(timestamp);
  
  // Remove existing marker if it exists
  if (activeMarkers[deviceId]) {
    map.removeLayer(activeMarkers[deviceId]);
  }
  
  // Create new marker
  const marker = L.marker([latitude, longitude], {
    icon: deviceIcons[status]
  }).addTo(map);
  
  // Create popup content
  const popupContent = `
    <div style="min-width: 200px;">
      <h4 style="margin: 0 0 10px 0; color: #333;">📦 ${deviceId}</h4>
      <div style="font-size: 12px; line-height: 1.4;">
        <strong>📍 Location:</strong><br>
        Lat: ${latitude.toFixed(6)}<br>
        Lng: ${longitude.toFixed(6)}<br><br>
        
        <strong>📊 Status:</strong> 
        <span style="color: ${status === 'active' ? '#28a745' : '#dc3545'};">
          ${status.toUpperCase()}
        </span><br>
        
        <strong>🚗 Speed:</strong> ${speed} km/h<br>
        <strong>🧭 Heading:</strong> ${heading}°<br>
        <strong>🕒 Last Update:</strong><br>
        ${new Date(timestamp).toLocaleString()}
      </div>
      <div style="margin-top: 10px;">
        <button onclick="centerOnDevice('${deviceId}')" style="background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
          Center Map
        </button>
      </div>
    </div>
  `;
  
  marker.bindPopup(popupContent);
  
  // Store marker reference
  activeMarkers[deviceId] = marker;
  
  console.log(`Updated marker for ${deviceId} at [${latitude}, ${longitude}] - Status: ${status}`);
  
  return marker;
}

// Function to center map on specific device
window.centerOnDevice = function(deviceId) {
  if (activeMarkers[deviceId]) {
    const marker = activeMarkers[deviceId];
    map.setView(marker.getLatLng(), 16);
    marker.openPopup();
  }
};

// Helper: read query parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Normalize luggage rows to map points
function luggageRowToPoint(row) {
  // Backend rows are expected to include: id, gpsLat, gpsLng, description, vehicleId, etc.
  const lat = typeof row.gpsLat === 'number' ? row.gpsLat : parseFloat(row.gpsLat);
  const lng = typeof row.gpsLng === 'number' ? row.gpsLng : parseFloat(row.gpsLng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return {
    deviceId: `LUGGAGE_${row.id}`,
    latitude: lat,
    longitude: lng,
    timestamp: new Date().toISOString(),
    speed: 0,
    heading: 0
  };
}

// Function to fetch GPS data from backend (supports ?luggageId= or ?senderId=)
async function fetchGPSData() {
  try {
    console.log('Fetching GPS data from backend...');

    const luggageId = getQueryParam('luggageId');
    const senderId = getQueryParam('senderId');
    let endpoint = `${API_BASE}/api/luggage`;

    if (luggageId) {
      endpoint = `${API_BASE}/api/luggage/id/${encodeURIComponent(luggageId)}`;
    } else if (senderId) {
      endpoint = `${API_BASE}/api/luggage/by-sender/${encodeURIComponent(senderId)}`;
    }

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : (payload ? [payload] : []);

    const points = rows
      .map(luggageRowToPoint)
      .filter(Boolean);

    // Clear previous markers when scoped to a single luggage or sender for accuracy
    if (luggageId || senderId) {
      Object.values(activeMarkers).forEach(m => map.removeLayer(m));
      activeMarkers = {};
    }

    if (points.length > 0) {
      points.forEach(pt => addOrUpdateGPSMarker(pt));

      const bounds = L.featureGroup(Object.values(activeMarkers)).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1));
      }
      updateStatusDisplay(points.length);
    } else {
      console.log('No GPS coordinates on the selected records');
      updateStatusDisplay(0);
    }
  } catch (error) {
    console.error('Error fetching GPS data:', error);
    console.log('Loading demo data...');
    loadDemoData();
  }
}

// Function to load demo/test data (used only when backend not reachable)
function loadDemoData() {
  const demoData = [
    {
      deviceId: 'CARGO_001',
      latitude: -15.3875,
      longitude: 28.3228,
      timestamp: new Date().toISOString(),
      speed: 0,
      heading: 0
    },
    {
      deviceId: 'CARGO_002', 
      latitude: -15.3900,
      longitude: 28.3250,
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
      speed: 45,
      heading: 90
    },
    {
      deviceId: 'CARGO_003',
      latitude: -15.3850,
      longitude: 28.3200,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago (inactive)
      speed: 0,
      heading: 180
    }
  ];
  
  demoData.forEach(point => {
    addOrUpdateGPSMarker(point);
  });
  
  updateStatusDisplay(demoData.length);
  console.log('Demo data loaded');
}

// Function to update status display
function updateStatusDisplay(deviceCount) {
  // Remove existing status display
  const existingStatus = document.querySelector('.status-display');
  if (existingStatus) {
    existingStatus.remove();
  }
  
  // Create new status display
  const statusDiv = document.createElement('div');
  statusDiv.className = 'status-display';
  statusDiv.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 1000;
    font-size: 12px;
    min-width: 150px;
  `;
  
  statusDiv.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px;">📊 Tracking Status</div>
    <div>🚛 Active Devices: ${deviceCount}</div>
    <div style="margin-top: 5px; font-size: 10px; color: #666;">
      Last Update: ${new Date().toLocaleTimeString()}
    </div>
  `;
  
  document.querySelector('.container').appendChild(statusDiv);
}

// Auto-refresh GPS data every 30 seconds
const refreshInterval = setInterval(fetchGPSData, 30000);

// Initial load
console.log('Initializing cargo tracking map...');
fetchGPSData();

// Add initial marker for Lusaka as reference
const lusakaMarker = L.marker([-15.3875, 28.3228], {
  icon: L.divIcon({
    className: 'reference-marker',
    html: '<div style="background-color: #6c757d; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  })
}).addTo(map);

lusakaMarker.bindPopup('📍 Lusaka, Zambia<br><small>Reference Location</small>');

// Add map controls
L.control.scale().addTo(map);

console.log('Cargo tracking map initialized successfully!');

// Cleanup function (called when page unloads)
window.addEventListener('beforeunload', () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
});
