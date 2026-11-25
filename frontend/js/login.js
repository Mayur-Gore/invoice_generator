(function () {
  'use strict';

  var form = document.getElementById('loginForm');
  var idInput = document.getElementById('loginId');
  var passInput = document.getElementById('loginPassword');
  var togglePassBtn = document.getElementById('togglePassword');
  var alertBox = document.getElementById('alertBox');
  var submitBtn = document.getElementById('submitBtn');
  var btnText = submitBtn.querySelector('.btn-text');
  var btnSpinner = submitBtn.querySelector('.btn-spinner');
  var dbBadge = document.getElementById('dbStatusBadge');
  var dbStatusText = document.getElementById('dbStatusText');

  // Check if user is already signed in
  try {
    var storedUser = localStorage.getItem('techwave_user');
    if (storedUser) {
      var u = JSON.parse(storedUser);
      if (u && (u.username || u.id)) {
        // Already authenticated, forward to bill generator!
        window.location.replace('invoice.html');
        return;
      }
    }
  } catch (e) {}

  // Toggle password visibility
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', function () {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassBtn.textContent = '🔒';
      } else {
        passInput.type = 'password';
        togglePassBtn.textContent = '👁️';
      }
    });
  }

  // Display alert notification
  function showAlert(msg, isSuccess) {
    alertBox.textContent = msg;
    alertBox.className = 'alert ' + (isSuccess ? 'success' : 'error shake');
    alertBox.classList.remove('hidden');
  }

  function hideAlert() {
    alertBox.classList.add('hidden');
    alertBox.classList.remove('shake');
  }

  // Check MongoDB connection status on page load
  function checkDatabaseStatus() {
    fetch(window.apiUrl('/api/auth/status'))
      .then(function (res) { return res.json(); })
      .then(function (data) {
        dbBadge.className = 'status-badge ' + (data.connected ? 'online' : 'offline');
        dbStatusText.textContent = data.connected ? 'MongoDB Connected' : 'MongoDB Disconnected (Check backend env)';
      })
      .catch(function () {
        dbBadge.className = 'status-badge offline';
        if (window.TECHWAVE_API_BASE && window.TECHWAVE_API_BASE.indexOf('your-render-backend.onrender.com') !== -1) {
          dbStatusText.textContent = 'Set Render URL in js/config.js';
        } else {
          dbStatusText.textContent = 'Backend Offline (' + (window.TECHWAVE_API_BASE || 'http://localhost:5000') + ')';
        }
      });
  }

  checkDatabaseStatus();

  // Form submission handler
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    hideAlert();

    var id = idInput.value.trim();
    var password = passInput.value;

    if (!id || !password) {
      showAlert('Please enter both User ID and Password.', false);
      return;
    }

    // Set loading state
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');

    try {
      var res = await fetch(window.apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, username: id, password: password, pass: password })
      });

      var data = await res.json();

      if (data.success) {
        showAlert('✓ ' + data.message, true);

        // Store user authentication state
        localStorage.setItem('techwave_user', JSON.stringify(data.user));

        setTimeout(function () {
          window.location.href = 'invoice.html';
        }, 500);
      } else {
        showAlert(data.message || 'Login failed. Please check credentials.', false);
        submitBtn.disabled = false;
        btnText.classList.remove('hidden');
        btnSpinner.classList.add('hidden');
      }
    } catch (err) {
      if (window.TECHWAVE_API_BASE && window.TECHWAVE_API_BASE.indexOf('your-render-backend.onrender.com') !== -1) {
        showAlert('Backend URL is not set yet. Replace PRODUCTION_API_URL in frontend/js/config.js with your Render backend URL.', false);
      } else {
        showAlert('Unable to reach server at ' + (window.TECHWAVE_API_BASE || 'http://localhost:5000') + '. Ensure the backend is running.', false);
      }
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
    }
  });

})();
