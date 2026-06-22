var ApiClient = (function() {
  function getBackendUrl() {
    return new Promise(function(resolve) {
      try {
        chrome.storage.local.get(['BACKEND_URL'], function(result) {
          resolve(result.BACKEND_URL || 'https://leadping-backend.onrender.com');
        });
      } catch(e) {
        resolve('https://leadping-backend.onrender.com');
      }
    });
  }

  function doFetch(url, options) {
    return fetch(url, options)
      .then(function(res) {
        if (!res.ok) return null;
        return res.json();
      })
      .catch(function() { return null; });
  }

  function registerFree(device_id) {
    return getBackendUrl().then(function(url) {
      return doFetch(url + '/api/auth/register-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: device_id })
      });
    }).catch(function() { return null; });
  }

  function checkUsage(user_id, action) {
    return getBackendUrl().then(function(url) {
      return doFetch(url + '/api/usage/check?user_id=' + encodeURIComponent(user_id) + '&action=' + encodeURIComponent(action));
    }).catch(function() { return null; });
  }

  function incrementUsage(user_id, action, lead_id) {
    return getBackendUrl().then(function(url) {
      return doFetch(url + '/api/usage/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user_id, action: action, lead_id: lead_id || '' })
      });
    }).catch(function() { return null; });
  }

  function generateMessage(user_id, leadData) {
    return getBackendUrl().then(function(url) {
      return doFetch(url + '/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ user_id: user_id }, leadData))
      });
    }).catch(function() { return null; });
  }

  function saveLead(user_id, leadData) {
    return getBackendUrl().then(function(url) {
      return doFetch(url + '/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ user_id: user_id }, leadData))
      });
    }).catch(function() { return null; });
  }

  function updateLeadStatus(user_id, lead_id, status, notes, message_sent) {
    return getBackendUrl().then(function(url) {
      return doFetch(url + '/api/leads/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user_id, lead_id: lead_id, status: status, notes: notes || '', message_sent: message_sent || '' })
      });
    }).catch(function() { return null; });
  }

  function getLeads(user_id, filters) {
    filters = filters || {};
    return getBackendUrl().then(function(url) {
      var qs = 'user_id=' + encodeURIComponent(user_id);
      if (filters.platform) qs += '&platform=' + encodeURIComponent(filters.platform);
      if (filters.status) qs += '&status=' + encodeURIComponent(filters.status);
      qs += '&limit=' + (filters.limit || 20);
      return doFetch(url + '/api/leads?' + qs);
    }).catch(function() { return null; });
  }

  function getStats(user_id) {
    return getBackendUrl().then(function(url) {
      return doFetch(url + '/api/stats?user_id=' + encodeURIComponent(user_id));
    }).catch(function() { return null; });
  }

  function activateLicense(license_key, device_id) {
    return getBackendUrl().then(function(url) {
      return doFetch(url + '/api/license/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: license_key, device_id: device_id })
      });
    }).catch(function() { return null; });
  }

  return {
    getBackendUrl: getBackendUrl,
    registerFree: registerFree,
    checkUsage: checkUsage,
    incrementUsage: incrementUsage,
    generateMessage: generateMessage,
    saveLead: saveLead,
    updateLeadStatus: updateLeadStatus,
    getLeads: getLeads,
    getStats: getStats,
    activateLicense: activateLicense
  };
})();
