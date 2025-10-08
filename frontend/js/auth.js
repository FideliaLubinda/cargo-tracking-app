// Show handler fields if role is handler
document.getElementById('role')?.addEventListener('change', function() {
    document.getElementById('handlerFields').style.display = this.value === 'handler' ? 'block' : 'none';
});

// Password visibility toggles
document.getElementById('toggleLoginPassword')?.addEventListener('click', function() {
    const passwordField = document.getElementById('loginPassword');
    const isPassword = passwordField.type === 'password';
    passwordField.type = isPassword ? 'text' : 'password';
    this.textContent = isPassword ? '🙈' : '👁';
});

document.getElementById('toggleSignupPassword')?.addEventListener('click', function() {
    const passwordField = document.getElementById('signupPassword');
    const isPassword = passwordField.type === 'password';
    passwordField.type = isPassword ? 'text' : 'password';
    this.textContent = isPassword ? '🙈' : '👁';
});

// Support running frontend on 127.0.0.1:5500 or file:// while backend is on :5000
const API_BASE = (window.location.port && window.location.port !== '5000')
  ? `${window.location.protocol}//${window.location.hostname}:5000`
  : '';

async function safeJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  throw new Error(text || `Unexpected response (status ${response.status})`);
}

// Signup
document.getElementById('signupForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  try {
    const res = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await safeJson(res);
    if (result.error) return alert(result.error);
    alert('Signup successful! Please login.');
    window.location = 'login.html';
  } catch (err) {
    alert('Signup failed: ' + err.message);
  }
});

// Login
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await safeJson(res);
    if (result.error) {
      alert('Login failed: ' + result.error);
      return;
    }
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    window.location.href = result.user.role === 'sender' ? 'sender.html' : 'handler.html';
  } catch (error) {
    alert('Login failed: ' + error.message);
  }
});