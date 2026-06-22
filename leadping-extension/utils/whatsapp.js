var WhatsAppUtil = (function() {
  function formatPhone(raw) {
    if (!raw) return null;
    try {
      var cleaned = String(raw).replace(/[\s\-\+\(\)\.​ ]/g, '');
      cleaned = cleaned.replace(/^0+/, '');
      if (cleaned.startsWith('91') && cleaned.length === 12) {
        cleaned = cleaned.slice(2);
      }
      if (!/^[6-9]\d{9}$/.test(cleaned)) return null;
      return cleaned;
    } catch(e) {
      return null;
    }
  }

  function buildURL(phone, message, mode) {
    var encoded = encodeURIComponent(message || '');
    if (mode === 'app') {
      return 'whatsapp://send?phone=91' + phone + '&text=' + encoded;
    }
    return 'https://wa.me/91' + phone + '?text=' + encoded;
  }

  function open(phone, message) {
    return StorageUtil.getSettings().then(function(settings) {
      var mode = settings.whatsapp_mode || 'web';
      var clean = formatPhone(phone);
      if (!clean) {
        alert('Phone number not available for this lead');
        return;
      }
      var url = buildURL(clean, message, mode);
      window.open(url, '_blank');
    }).catch(function() {
      var clean = formatPhone(phone);
      if (!clean) { alert('Phone number not available for this lead'); return; }
      window.open(buildURL(clean, message, 'web'), '_blank');
    });
  }

  return { formatPhone: formatPhone, buildURL: buildURL, open: open };
})();
