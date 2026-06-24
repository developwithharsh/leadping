/**
 * RemoteConfig — fetches config from the backend on startup.
 * Cached in chrome.storage.local for 1 hour (or as directed by cache_ttl_seconds).
 * All other extension files read from the cache — never blocked on network.
 *
 * Usage:
 *   RemoteConfig.get().then(function(cfg) { ... })
 *   RemoteConfig.getLimits(tier)
 *   RemoteConfig.isPlatformEnabled(platform, tier)
 *   RemoteConfig.getTemplates()
 *   RemoteConfig.getUpgradeInfo()
 *   RemoteConfig.getAnnouncement()
 */

var RemoteConfig = (function() {
  var CACHE_KEY = 'remote_config';
  var DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

  var DEFAULT_CONFIG = {
    version: '1.0.0',
    config_version: 0,
    limits: {
      free:     { whatsapp_per_day: 10, ai_per_day: 3 },
      pro:      { whatsapp_per_day: 9999, ai_per_day: 9999 },
      lifetime: { whatsapp_per_day: 9999, ai_per_day: 9999 },
    },
    features: {
      indiamart_enabled:  true,
      justdial_enabled:   true,
      tradeindia_enabled: true,
      ai_generation:      true,
      reminders:          true,
      export:             true,
    },
    platforms: {
      indiamart:  { free: true,  pro: true,  lifetime: true },
      justdial:   { free: false, pro: true,  lifetime: true },
      tradeindia: { free: false, pro: true,  lifetime: true },
    },
    upgrade: {
      upi_id:          'leadping@upi',
      whatsapp_number: '+91 9999999999',
      pricing:         { pro_monthly: 999, lifetime: 1999, currency: 'INR' },
      cta_text:        'Pay ₹1,999 once, use forever. No renewal.',
    },
    announcement: null,
    cache_ttl_seconds: 3600,
  };

  // In-memory cache so we don't hit storage repeatedly in same page load
  var _memCache = null;

  function isExpired(cached) {
    if (!cached || !cached._fetched_at) return true;
    var ttl = (cached.cache_ttl_seconds || 3600) * 1000;
    return Date.now() - cached._fetched_at > ttl;
  }

  function fetchFromBackend(backendUrl, userId) {
    var url = backendUrl + '/api/config' + (userId ? '?user_id=' + encodeURIComponent(userId) : '');
    return fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        data._fetched_at = Date.now();
        _memCache = data;
        return new Promise(function(resolve) {
          chrome.storage.local.set({ remote_config: data }, function() { resolve(data); });
        });
      });
  }

  function get(forceRefresh) {
    // Return in-memory cache first
    if (!forceRefresh && _memCache && !isExpired(_memCache)) {
      return Promise.resolve(_memCache);
    }

    return new Promise(function(resolve) {
      chrome.storage.local.get([CACHE_KEY, 'BACKEND_URL', 'user_id'], function(result) {
        var cached = result[CACHE_KEY];
        var backendUrl = result.BACKEND_URL || 'https://leadping-backend.onrender.com';
        var userId = result.user_id;

        // Return cached if still fresh
        if (!forceRefresh && cached && !isExpired(cached)) {
          _memCache = cached;
          resolve(cached);
          return;
        }

        // Fetch fresh config
        fetchFromBackend(backendUrl, userId)
          .then(function(fresh) { resolve(fresh); })
          .catch(function() {
            // On any network error, return cached or default — NEVER block the extension
            resolve(cached || DEFAULT_CONFIG);
          });
      });
    });
  }

  function getLimits(tier) {
    if (_memCache && _memCache.limits && _memCache.limits[tier]) {
      return _memCache.limits[tier];
    }
    return DEFAULT_CONFIG.limits[tier] || DEFAULT_CONFIG.limits.free;
  }

  function isPlatformEnabled(platform, tier) {
    if (_memCache && _memCache.platforms && _memCache.platforms[platform]) {
      return _memCache.platforms[platform][tier] !== false;
    }
    return DEFAULT_CONFIG.platforms[platform]
      ? DEFAULT_CONFIG.platforms[platform][tier] !== false
      : false;
  }

  function isFeatureEnabled(featureName) {
    if (_memCache && _memCache.features) {
      return _memCache.features[featureName] !== false;
    }
    return DEFAULT_CONFIG.features[featureName] !== false;
  }

  function getTemplates() {
    if (_memCache && _memCache.templates && _memCache.templates.length > 0) {
      return _memCache.templates;
    }
    return null; // null = use local DEFAULT_TEMPLATES
  }

  function getUpgradeInfo() {
    return (_memCache && _memCache.upgrade) ? _memCache.upgrade : DEFAULT_CONFIG.upgrade;
  }

  function getAnnouncement() {
    return (_memCache && _memCache.announcement) ? _memCache.announcement : null;
  }

  function getAiFallback(platform) {
    if (_memCache && _memCache.ai && _memCache.ai.fallback_messages) {
      return _memCache.ai.fallback_messages[platform] || _memCache.ai.fallback_messages.indiamart;
    }
    return 'Namaste! Aapka inquiry mila. Kab baat ho sakti hai? 🙏';
  }

  return {
    get:                get,
    getLimits:          getLimits,
    isPlatformEnabled:  isPlatformEnabled,
    isFeatureEnabled:   isFeatureEnabled,
    getTemplates:       getTemplates,
    getUpgradeInfo:     getUpgradeInfo,
    getAnnouncement:    getAnnouncement,
    getAiFallback:      getAiFallback,
  };
})();
