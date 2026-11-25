(function () {
  'use strict';

  // Replace with your Render backend URL after deploying the backend (no trailing slash)
  var PRODUCTION_API_URL = 'https://invoice-generator-rh1s.onrender.com';

  var isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

  var baseUrl = isLocal ? 'http://localhost:5000' : PRODUCTION_API_URL;

  try {
    var override = localStorage.getItem('techwave_api_url');
    if (override) baseUrl = override.replace(/\/+$/, '');
  } catch (e) {}

  window.TECHWAVE_API_BASE = baseUrl.replace(/\/+$/, '');
  window.apiUrl = function (path) {
    var cleanPath = path.charAt(0) === '/' ? path : '/' + path;
    return window.TECHWAVE_API_BASE + cleanPath;
  };
})();
