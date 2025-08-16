// Function to get luggage ID from URL parameters or prompt
function getLuggageId() {
  const urlParams = new URLSearchParams(window.location.search);
  let luggageId = urlParams.get('luggageId');
  
  if (!luggageId) {
    luggageId = prompt('Enter Luggage ID to view location:');
  }
  
  return luggageId;
}

// Function to initialize map
function initMap(latitude, longitude, luggageId) {
  const map = L.map('map').setView([latitude, longitude], 13);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  L.marker([latitude, longitude]).addTo(map)
    .bindPopup(`Luggage ID: ${luggageId}<br>Location: ${latitude}, ${longitude}`)
    .openPopup();
  
  return map;
}

// Function to simulate GPS updates (for testing)
function simulateGPSUpdate(luggageId) {
  // Simulate movement by adding small random offsets
  const baseLat = 40.7128; // New York coordinates as example
  const baseLng = -74.0060;
  
  const randomLat = baseLat + (Math.random() - 0.5) * 0.01;
  const randomLng = baseLng + (Math.random() - 0.5) * 0.01;
  
  fetch(`/api/luggage/update-location/${luggageId}`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      latitude: randomLat,
      longitude: randomLng
    })
  })
  .then(res => res.json())
  .then(result => {
    console.log('GPS update result:', result);
    if (result.message) {
      alert('GPS location updated! Refresh the page to see new location.');
    }
  })
  .catch(error => {
    console.error('Error updating GPS:', error);
  });
}

// Main function to load luggage location
async function loadLuggageLocation() {
  const luggageId = getLuggageId();
  
  if (!luggageId) {
    document.getElementById('map').innerHTML = '<p>No luggage ID provided.</p>';
    return;
  }
  
  try {
    const response = await fetch(`/api/luggage/id/${luggageId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const luggage = await response.json();
    
    if (!luggage) {
      document.getElementById('map').innerHTML = '<p>Luggage not found.</p>';
      return;
    }
    
    // Get vehicle information
    let vehicleInfo = 'Unknown Vehicle';
    if (luggage.vehicleId) {
      try {
        const vehicleResponse = await fetch(`/api/vehicles/${luggage.vehicleId}`);
        if (vehicleResponse.ok) {
          const vehicle = await vehicleResponse.json();
          vehicleInfo = `${vehicle.busColor} ${vehicle.busType} (${vehicle.numberPlate})`;
        } else {
          vehicleInfo = `Vehicle ID: ${luggage.vehicleId}`;
        }
      } catch (error) {
        vehicleInfo = `Vehicle ID: ${luggage.vehicleId}`;
      }
    }
    
    if (!luggage.gpsLat || !luggage.gpsLng) {
      document.getElementById('map').innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <h3>No GPS Data Available</h3>
          <p>This luggage doesn't have GPS tracking data yet.</p>
          <p><strong>Luggage ID:</strong> ${luggageId}</p>
          <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
          <p><strong>Description:</strong> ${luggage.description || 'No description'}</p>
          <button onclick="simulateGPSUpdate('${luggageId}')" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Simulate GPS Update (for testing)
          </button>
        </div>
      `;
      return;
    }
    
    // Initialize map with GPS data
    const map = initMap(luggage.gpsLat, luggage.gpsLng, luggageId);
    
    // Add luggage info
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
      <div style="position: absolute; top: 10px; right: 10px; background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000;">
        <h4>Luggage Info</h4>
        <p><strong>ID:</strong> ${luggageId}</p>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Color:</strong> ${luggage.color || 'N/A'}</p>
        <p><strong>Shape:</strong> ${luggage.shape || 'N/A'}</p>
        <p><strong>Description:</strong> ${luggage.description || 'N/A'}</p>
        <button onclick="simulateGPSUpdate('${luggageId}')" style="padding: 5px 10px; background: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
          Update GPS
        </button>
      </div>
    `;
    document.body.appendChild(infoDiv);
    
  } catch (error) {
    console.error('Error loading luggage location:', error);
    document.getElementById('map').innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h3>Error Loading Location</h3>
        <p>Could not load luggage location data.</p>
        <p>Error: ${error.message}</p>
      </div>
    `;
  }
}

// Load luggage location when page loads
document.addEventListener('DOMContentLoaded', loadLuggageLocation);