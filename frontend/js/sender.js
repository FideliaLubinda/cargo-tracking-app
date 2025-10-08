// Global variables
let currentLuggageId = null;
let currentVehicleId = null;

// Resolve API base so pages opened via 127.0.0.1:5500 still hit backend on 5000
const API_BASE = (window.location.port && window.location.port !== '5000')
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : '';

async function safeJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  throw new Error(text || `Unexpected response (status ${response.status})`);
}

// Color picker functionality
document.getElementById('colorInput')?.addEventListener('input', function() {
    const color = this.value;
    const colorDisplay = document.getElementById('colorDisplay');
    colorDisplay.style.backgroundColor = color;
    colorDisplay.textContent = color.toUpperCase();
    
    // Adjust text color for better visibility
    const brightness = getBrightness(color);
    colorDisplay.style.color = brightness > 128 ? '#000' : '#fff';
});

// Helper function to calculate color brightness
function getBrightness(hexColor) {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// Shape button logic
document.querySelectorAll('.shape-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.getElementById('shapeInput').value = this.dataset.shape;
        document.querySelectorAll('.shape-btn').forEach(b => {
            b.style.background = '';
            b.style.transform = '';
        });
        this.style.background = '#667eea';
        this.style.transform = 'scale(1.05)';
    });
});

// Debug function (UI disabled by default)
function debugLog(message) {
    console.log(message);
    // UI logging intentionally disabled to avoid showing logs to end users
}

// Submit luggage form
document.getElementById('luggageForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    debugLog('Form submission started');
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        debugLog('No user found, redirecting to login');
        alert('Please login first');
        window.location = 'login.html';
        return;
    }
    
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    data.senderId = user.id;
    
    // Validate shape selection
    if (!data.shape) {
        debugLog('No shape selected');
        alert('Please select a shape for your luggage');
        return;
    }
    
    // Validate vehicle information
    if (!data.busColor || !data.busType || !data.numberPlate) {
        debugLog('Missing vehicle information');
        alert('Please fill in all vehicle information (color, type, and number plate)');
        return;
    }
    
    debugLog('Submitting luggage data: ' + JSON.stringify(data));
    
    try {
        // First, create the vehicle
        const vehicleData = {
            busColor: data.busColor,
            busType: data.busType,
            numberPlate: data.numberPlate,
            description: data.vehicleDescription || '',
            createdBy: user.id
        };
        
        debugLog('Creating vehicle: ' + JSON.stringify(vehicleData));
        
        const vehicleRes = await fetch(`${API_BASE}/api/vehicles/add`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(vehicleData)
        });
        
        if (!vehicleRes.ok) {
            // Try to extract error text safely
            try {
                const vehicleError = await safeJson(vehicleRes);
                throw new Error(`Vehicle creation failed: ${vehicleError.error || 'Unknown error'}`);
            } catch (e) {
                throw new Error(`Vehicle creation failed: ${e.message}`);
            }
        }
        
        const vehicleResult = await safeJson(vehicleRes);
        currentVehicleId = vehicleResult.vehicleId;
        debugLog('Vehicle created with ID: ' + currentVehicleId);
        
        // Now create the luggage with the vehicle ID
        const luggageData = {
            senderId: user.id,
            color: data.color,
            shape: data.shape,
            description: data.description,
            vehicleId: currentVehicleId
        };
        
        debugLog('Creating luggage: ' + JSON.stringify(luggageData));
        
        const luggageRes = await fetch(`${API_BASE}/api/luggage/add`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(luggageData)
        });
        
        if (!luggageRes.ok) {
            throw new Error(`HTTP error! status: ${luggageRes.status}`);
        }
        
        const luggageResult = await safeJson(luggageRes);
        debugLog('Luggage response received: ' + JSON.stringify(luggageResult));
        
        if (luggageResult.error) {
            debugLog('Server error: ' + luggageResult.error);
            alert('Error: ' + luggageResult.error);
            return;
        }
        
        currentLuggageId = luggageResult.luggageId;
        debugLog('Luggage created with ID: ' + currentLuggageId);
        
        // Display QR code and success actions
        displayQRCode(luggageResult, vehicleData);
        // Start polling for custody updates for this luggage
        startCustodyPolling(currentLuggageId);
        
    } catch (error) {
        debugLog('Error: ' + error.message);
        console.error('Error submitting luggage:', error);
        alert('Error: ' + error.message);
    }
    
    return false;
});

// Display QR code and success actions
function displayQRCode(luggageResult, vehicleData) {
    const qrDiv = document.getElementById('qrCode');
    const successActions = document.getElementById('successActions');
    
    qrDiv.innerHTML = `
        <div class="card" style="text-align: center; margin-top: 30px;">
            <h2>✅ Luggage Created Successfully!</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Luggage Details</h3>
                <p><strong>Luggage ID:</strong> ${luggageResult.luggageId}</p>
                <p><strong>Color:</strong> <span style="background: ${luggageResult.color || '#000000'}; padding: 5px 10px; border-radius: 5px; color: white;">${(luggageResult.color || '#000000').toUpperCase()}</span></p>
                <p><strong>Shape:</strong> ${luggageResult.shape || 'N/A'}</p>
                <p><strong>Description:</strong> ${luggageResult.description || 'N/A'}</p>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3>Vehicle Information</h3>
                <p><strong>Bus Color:</strong> ${vehicleData.busColor}</p>
                <p><strong>Bus Type:</strong> ${vehicleData.busType}</p>
                <p><strong>Number Plate:</strong> ${vehicleData.numberPlate}</p>
                ${vehicleData.description ? `<p><strong>Additional Info:</strong> ${vehicleData.description}</p>` : ''}
            </div>
            
            <div style="margin: 30px 0;">
                <h3>QR Code for Tracking</h3>
                <img src="${luggageResult.qrCode}" alt="QR Code" style="max-width: 300px; height: auto; border: 2px solid #333; border-radius: 10px;">
                <p style="margin-top: 15px; color: #666; font-size: 14px;">
                    <strong>Instructions:</strong><br>
                    1. Print this QR code<br>
                    2. Stick it on your luggage<br>
                    3. Handlers will scan this to track your luggage<br>
                    4. Your luggage will be tracked on ${vehicleData.busColor} ${vehicleData.busType} (${vehicleData.numberPlate})
                </p>
            </div>

            <div id="custodyStatus" style="background: #f8f9fa; padding: 16px; border-radius: 10px;">
                <h3>Custody Status</h3>
                <div id="custodyStatusContent">Waiting for first handler scan...</div>
            </div>
        </div>
    `;
    
    // Show QR code and success actions
    qrDiv.style.display = 'block';
    successActions.style.display = 'block';
    
    // Scroll to QR code
    qrDiv.scrollIntoView({ behavior: 'smooth' });
    
    debugLog('QR code displayed successfully');
}

// Poll custody updates and show latest handler to the sender
let custodyPollTimer = null;
function startCustodyPolling(luggageId) {
    if (custodyPollTimer) clearInterval(custodyPollTimer);
    const fetchAndRender = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/custody/by-luggage/${luggageId}`);
            if (!res.ok) return;
            const logs = await safeJson(res);
            const container = document.getElementById('custodyStatusContent');
            if (!container) return;
            if (!logs || logs.length === 0) {
                container.textContent = 'No custody logs yet.';
                return;
            }
            const latest = logs[0];
            const locationStr = [latest.station, latest.locationNote]
              .filter(Boolean)
              .join(' — ');
            const latlngStr = (latest.lat != null && latest.lng != null)
              ? ` (${Number(latest.lat).toFixed(5)}, ${Number(latest.lng).toFixed(5)})`
              : '';
            container.innerHTML = `Handled by <strong>${latest.handlerName}</strong> (${latest.company}, ID: ${latest.employeeId}) at <strong>${new Date(latest.timestamp).toLocaleString()}</strong>${locationStr ? `<br><em>${locationStr}${latlngStr}</em>` : ''}`;
        } catch (_) {
            // ignore
        }
    };
    fetchAndRender();
    custodyPollTimer = setInterval(fetchAndRender, 5000);
}

// View on map function
function viewOnMap() {
    if (currentLuggageId) {
        window.location.href = `map.html?luggageId=${currentLuggageId}`;
    } else {
        alert('No luggage ID available. Please create luggage first.');
    }
}

// Add another luggage function
function addAnotherLuggage() {
    // Reset form
    document.getElementById('luggageForm').reset();
    document.getElementById('colorDisplay').textContent = '';
    document.getElementById('colorDisplay').style.backgroundColor = '';
    document.querySelectorAll('.shape-btn').forEach(b => {
        b.style.background = '';
        b.style.transform = '';
    });
    
    // Hide QR code and success actions
    document.getElementById('qrCode').style.display = 'none';
    document.getElementById('successActions').style.display = 'none';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Reset global variables
    currentLuggageId = null;
    currentVehicleId = null;
}

// Print QR code function
function printQRCode() {
    window.print();
}

// Initialize color display on page load
document.addEventListener('DOMContentLoaded', function() {
    const colorInput = document.getElementById('colorInput');
    if (colorInput) {
        const colorDisplay = document.getElementById('colorDisplay');
        colorDisplay.style.backgroundColor = colorInput.value;
        colorDisplay.textContent = colorInput.value.toUpperCase();
    }
});