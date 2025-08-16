let html5QrcodeScanner = null;
let scannedLuggageId = null;
let scannedVehicleId = null;

// Initialize QR code scanner
function initQRScanner() {
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  html5QrcodeScanner = new Html5QrcodeScanner(
    "reader",
    config,
    /* verbose= */ false
  );

  html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

// QR code scan success callback
function onScanSuccess(decodedText, decodedResult) {
  console.log(`QR Code scanned: ${decodedText}`);
  
  // Parse luggage ID and vehicle ID from QR code (format: "luggageId:vehicleId")
  const parts = decodedText.split(':');
  if (parts.length === 2) {
    scannedLuggageId = parts[0];
    scannedVehicleId = parts[1];
  } else {
    // Fallback for old format (just luggage ID)
    scannedLuggageId = decodedText;
    scannedVehicleId = 'Unknown';
  }
  
  // Update the form
  document.getElementById('luggageIdInput').value = scannedLuggageId;
  
  const vehicleNames = {
    '1': 'Bus 1 - Main Route',
    '2': 'Bus 2 - Express Route',
    '3': 'Bus 3 - Local Route'
  };
  
  document.getElementById('scannedLuggageId').textContent = scannedLuggageId;
  document.getElementById('scannedInfo').innerHTML = `
    <strong>Scanned Luggage ID:</strong> ${scannedLuggageId}<br>
    <strong>Vehicle:</strong> ${vehicleNames[scannedVehicleId] || `Bus ${scannedVehicleId}`}
  `;
  document.getElementById('scannedInfo').style.display = 'block';
  document.getElementById('submitBtn').disabled = false;
  
  // Stop the scanner
  stopScanner();
  
  // Show success message
  showMessage(`QR Code scanned successfully! Luggage ${scannedLuggageId} is on ${vehicleNames[scannedVehicleId] || `Bus ${scannedVehicleId}`}`, 'success');
}

// QR code scan failure callback
function onScanFailure(error) {
  // Handle scan failure, ignore errors
  console.warn(`QR Code scan error = ${error}`);
}

// Start QR code scanner
function startScanner() {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear();
  }
  
  try {
    initQRScanner();
    document.getElementById('startScan').style.display = 'none';
    document.getElementById('stopScan').style.display = 'inline-block';
    document.getElementById('cameraError').style.display = 'none';
    showMessage('Scanner started. Point camera at QR code.', 'info');
  } catch (error) {
    console.error('Camera access error:', error);
    document.getElementById('cameraError').style.display = 'block';
    showMessage('Camera access denied. Please use manual entry or access via HTTPS/localhost.', 'error');
  }
}

// Stop QR code scanner
function stopScanner() {
  if (html5QrcodeScanner) {
    html5QrcodeScanner.clear();
    html5QrcodeScanner = null;
  }
  
  document.getElementById('startScan').style.display = 'inline-block';
  document.getElementById('stopScan').style.display = 'none';
}

// Show message to user
function showMessage(message, type = 'info') {
  const messageDiv = document.getElementById('message');
  const colors = {
    success: '#d4edda',
    error: '#f8d7da',
    info: '#d1ecf1'
  };
  
  messageDiv.innerHTML = `<div style="padding: 10px; margin: 10px 0; background: ${colors[type]}; border-radius: 5px;">${message}</div>`;
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    messageDiv.innerHTML = '';
  }, 3000);
}

// Manual entry functions
function showManualEntry() {
  document.getElementById('manualEntrySection').style.display = 'block';
  document.getElementById('cameraError').style.display = 'none';
  if (html5QrcodeScanner) {
    stopScanner();
  }
}

function confirmManualEntry() {
  const manualId = document.getElementById('manualLuggageId').value.trim();
  if (!manualId) {
    showMessage('Please enter a luggage ID', 'error');
    return;
  }
  
  // Validate that it's a number
  if (isNaN(manualId)) {
    showMessage('Please enter a valid luggage ID (numbers only)', 'error');
    return;
  }
  
  scannedLuggageId = manualId;
  scannedVehicleId = 'Manual Entry';
  
  // Update the form
  document.getElementById('luggageIdInput').value = scannedLuggageId;
  document.getElementById('scannedLuggageId').textContent = scannedLuggageId;
  document.getElementById('scannedInfo').innerHTML = `
    <strong>Manual Entry - Luggage ID:</strong> ${scannedLuggageId}<br>
    <strong>Note:</strong> Vehicle information will be retrieved from database
  `;
  document.getElementById('scannedInfo').style.display = 'block';
  document.getElementById('submitBtn').disabled = false;
  
  // Hide manual entry section
  document.getElementById('manualEntrySection').style.display = 'none';
  
  showMessage(`Manual entry confirmed! Luggage ID: ${scannedLuggageId}`, 'success');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Start scanner button
  document.getElementById('startScan').addEventListener('click', startScanner);
  
  // Stop scanner button
  document.getElementById('stopScan').addEventListener('click', stopScanner);
  
  // Manual entry button
  document.getElementById('manualEntry').addEventListener('click', showManualEntry);
  
  // Confirm manual entry button
  document.getElementById('confirmManualEntry').addEventListener('click', confirmManualEntry);
  
  // Form submission
  document.getElementById('custodyForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!scannedLuggageId) {
      showMessage('Please scan a QR code first!', 'error');
      return;
    }
    
    const data = Object.fromEntries(new FormData(this));
    data.timestamp = new Date().toISOString();
    
    console.log('Submitting custody log:', data);
    
    try {
      const res = await fetch('/api/custody/add', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      console.log('Server response:', result);
      
      if (result.error) {
        showMessage('Error: ' + result.error, 'error');
        return;
      }
      
      const vehicleNames = {
        '1': 'Bus 1 - Main Route',
        '2': 'Bus 2 - Express Route',
        '3': 'Bus 3 - Local Route'
      };
      
      showMessage(`Custody log submitted successfully! Luggage ${scannedLuggageId} on ${vehicleNames[scannedVehicleId] || `Bus ${scannedVehicleId}`}`, 'success');
      
      // Reset form
      this.reset();
      document.getElementById('scannedInfo').style.display = 'none';
      document.getElementById('submitBtn').disabled = true;
      scannedLuggageId = null;
      scannedVehicleId = null;
      
    } catch (error) {
      console.error('Error submitting custody log:', error);
      showMessage('Error submitting custody log. Please check console for details.', 'error');
    }
  });
});