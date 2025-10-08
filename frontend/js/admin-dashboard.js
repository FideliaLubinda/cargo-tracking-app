// Admin Dashboard JavaScript
const API_BASE = (window.location.port && window.location.port !== '5000')
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : '';

// Global variables
let userActivityChart = null;
let luggageStatusChart = null;
let refreshInterval = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
  startAutoRefresh();
  updateCurrentTime();
});

// Initialize dashboard components
function initializeDashboard() {
  loadOverviewStats();
  loadUsers();
  loadLuggage();
  loadCustodyLogs();
  loadVehicles();
  initializeCharts();
  loadRecentActivity();
  updateSystemHealth();
}

// Auto-refresh data every 30 seconds
function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    loadOverviewStats();
    loadRecentActivity();
    updateSystemHealth();
  }, 30000);
}

// Update current time
function updateCurrentTime() {
  const now = new Date();
  document.getElementById('currentTime').textContent = now.toLocaleString();
  setTimeout(updateCurrentTime, 1000);
}

// Navigation
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Remove active class from all nav buttons
  document.querySelectorAll('.admin-nav .nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected section
  document.getElementById(sectionId).classList.add('active');
  
  // Add active class to clicked button
  event.target.classList.add('active');
}

// Load overview statistics
async function loadOverviewStats() {
  try {
    const [users, luggage, custody, vehicles] = await Promise.all([
      fetch(`${API_BASE}/api/users`).then(res => res.json()),
      fetch(`${API_BASE}/api/luggage`).then(res => res.json()),
      fetch(`${API_BASE}/api/custody`).then(res => res.json()),
      fetch(`${API_BASE}/api/vehicles`).then(res => res.json())
    ]);
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalLuggage').textContent = luggage.length;
    document.getElementById('totalCustody').textContent = custody.length;
    document.getElementById('totalVehicles').textContent = vehicles.length;
    
  } catch (error) {
    console.error('Error loading overview stats:', error);
  }
}

// Load users table
async function loadUsers() {
  try {
    const users = await fetch(`${API_BASE}/api/users`).then(res => res.json());
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.id}</td>
        <td>${user.fullname}</td>
        <td>${user.email}</td>
        <td><span class="role-badge ${user.role}">${user.role}</span></td>
        <td>${user.company || '-'}</td>
        <td>${new Date().toLocaleDateString()}</td>
        <td>
          <button class="btn-small" onclick="editUser(${user.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-small btn-danger" onclick="deleteUser(${user.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

// Load luggage table
async function loadLuggage() {
  try {
    const luggage = await fetch(`${API_BASE}/api/luggage`).then(res => res.json());
    const tbody = document.getElementById('luggageTableBody');
    tbody.innerHTML = '';
    
    luggage.forEach(item => {
      const hasGPS = item.gpsLat && item.gpsLng;
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.id}</td>
        <td>${item.senderId}</td>
        <td><span class="color-swatch" style="background-color: ${item.color}"></span> ${item.color}</td>
        <td>${item.shape}</td>
        <td>${item.vehicleId || '-'}</td>
        <td>${hasGPS ? `${item.gpsLat.toFixed(4)}, ${item.gpsLng.toFixed(4)}` : 'No GPS'}</td>
        <td><span class="status-badge ${hasGPS ? 'active' : 'inactive'}">${hasGPS ? 'Tracked' : 'No GPS'}</span></td>
        <td>
          <button class="btn-small" onclick="viewLuggage(${item.id})">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn-small" onclick="trackLuggage(${item.id})">
            <i class="fas fa-map-marker-alt"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading luggage:', error);
  }
}

// Load custody logs
async function loadCustodyLogs() {
  try {
    const logs = await fetch(`${API_BASE}/api/custody`).then(res => res.json());
    const tbody = document.getElementById('custodyTableBody');
    tbody.innerHTML = '';
    
    logs.forEach(log => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${log.id}</td>
        <td>${log.luggageId}</td>
        <td>${log.handlerName}</td>
        <td>${log.company}</td>
        <td>${log.employeeId}</td>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>
          <button class="btn-small" onclick="viewCustodyLog(${log.id})">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading custody logs:', error);
  }
}

// Load vehicles
async function loadVehicles() {
  try {
    const vehicles = await fetch(`${API_BASE}/api/vehicles`).then(res => res.json());
    const tbody = document.getElementById('vehiclesTableBody');
    tbody.innerHTML = '';
    
    vehicles.forEach(vehicle => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${vehicle.id}</td>
        <td>${vehicle.busColor}</td>
        <td>${vehicle.busType}</td>
        <td>${vehicle.numberPlate}</td>
        <td>${vehicle.description || '-'}</td>
        <td>${vehicle.createdBy}</td>
        <td>
          <button class="btn-small" onclick="editVehicle(${vehicle.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-small btn-danger" onclick="deleteVehicle(${vehicle.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading vehicles:', error);
  }
}

// Initialize charts
function initializeCharts() {
  // User Activity Chart
  const userCtx = document.getElementById('userActivityChart').getContext('2d');
  userActivityChart = new Chart(userCtx, {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'New Users',
        data: [12, 19, 3, 5, 2, 3, 7],
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        }
      }
    }
  });

  // Luggage Status Chart
  const luggageCtx = document.getElementById('luggageStatusChart').getContext('2d');
  luggageStatusChart = new Chart(luggageCtx, {
    type: 'doughnut',
    data: {
      labels: ['With GPS', 'Without GPS', 'In Transit'],
      datasets: [{
        data: [65, 25, 10],
        backgroundColor: [
          '#10b981',
          '#ef4444',
          '#f59e0b'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        }
      }
    }
  });
}

// Load recent activity
async function loadRecentActivity() {
  try {
    const [logs, luggage] = await Promise.all([
      fetch(`${API_BASE}/api/custody`).then(res => res.json()),
      fetch(`${API_BASE}/api/luggage`).then(res => res.json())
    ]);
    
    const recentLogs = logs.slice(0, 5);
    const container = document.getElementById('recentActivityList');
    container.innerHTML = '';
    
    recentLogs.forEach(log => {
      const activityItem = document.createElement('div');
      activityItem.className = 'activity-item';
      activityItem.innerHTML = `
        <div class="activity-icon">
          <i class="fas fa-clipboard-check"></i>
        </div>
        <div class="activity-content">
          <p><strong>${log.handlerName}</strong> handled luggage #${log.luggageId}</p>
          <small>${new Date(log.timestamp).toLocaleString()}</small>
        </div>
      `;
      container.appendChild(activityItem);
    });
  } catch (error) {
    console.error('Error loading recent activity:', error);
  }
}

// Update system health
async function updateSystemHealth() {
  try {
    // Simulate system health checks
    const responseTime = Math.floor(Math.random() * 50) + 20;
    document.getElementById('responseTime').textContent = `${responseTime}ms`;
    
    // Update uptime (simulated)
    const uptime = (99.5 + Math.random() * 0.5).toFixed(1);
    document.getElementById('uptime').textContent = `${uptime}%`;
    
    // Update active sessions
    const sessions = Math.floor(Math.random() * 20) + 5;
    document.getElementById('activeSessions').textContent = sessions;
    
  } catch (error) {
    console.error('Error updating system health:', error);
  }
}

// Export functions
function exportUsers() {
  fetch(`${API_BASE}/api/users`)
    .then(res => res.json())
    .then(users => {
      const csv = convertToCSV(users);
      downloadCSV(csv, 'users-export.csv');
    });
}

function exportCustodyLogs() {
  fetch(`${API_BASE}/api/custody`)
    .then(res => res.json())
    .then(logs => {
      const csv = convertToCSV(logs);
      downloadCSV(csv, 'custody-logs-export.csv');
    });
}

// Utility functions
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      return `"${value}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Action functions
function editUser(userId) {
  alert(`Edit user ${userId} - Feature coming soon`);
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    alert(`Delete user ${userId} - Feature coming soon`);
  }
}

function viewLuggage(luggageId) {
  window.open(`map.html?luggageId=${luggageId}`, '_blank');
}

function trackLuggage(luggageId) {
  window.open(`map.html?luggageId=${luggageId}`, '_blank');
}

function viewCustodyLog(logId) {
  alert(`View custody log ${logId} - Feature coming soon`);
}

function editVehicle(vehicleId) {
  alert(`Edit vehicle ${vehicleId} - Feature coming soon`);
}

function deleteVehicle(vehicleId) {
  if (confirm('Are you sure you want to delete this vehicle?')) {
    alert(`Delete vehicle ${vehicleId} - Feature coming soon`);
  }
}

function addVehicle() {
  alert('Add vehicle - Feature coming soon');
}

// System functions
function backupDatabase() {
  alert('Database backup initiated - Feature coming soon');
}

function clearLogs() {
  if (confirm('Are you sure you want to clear all logs?')) {
    alert('Logs cleared - Feature coming soon');
  }
}

function restartServer() {
  if (confirm('Are you sure you want to restart the server?')) {
    alert('Server restart initiated - Feature coming soon');
  }
}
