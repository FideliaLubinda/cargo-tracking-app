// Show handler fields if role is handler
document.getElementById('role')?.addEventListener('change', function() {
    document.getElementById('handlerFields').style.display = this.value === 'handler' ? 'block' : 'none';
  });
  
  // Signup
  document.getElementById('signupForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this));
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.error) return alert(result.error);
    alert('Signup successful! Please login.');
    window.location = 'login.html';
  });
  
  // Login
  document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(this));
    
    try {
      console.log('Attempting login with:', data.email);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      console.log('Login response:', result);
      
      if (result.error) {
        alert('Login failed: ' + result.error);
        return;
      }
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      console.log('Login successful, redirecting to:', result.user.role === 'sender' ? 'sender.html' : 'handler.html');
      
      if (result.user.role === 'sender') {
        window.location.href = 'sender.html';
      } else {
        window.location.href = 'handler.html';
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  });