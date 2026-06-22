(function() {
  'use strict';

  var currentUserId = null;
  var currentTier = 'free';
  var scanDebounceTimer = null;

  function init() {
    StorageUtil.getSettings().then(function(settings) {
      if (!settings.platforms || settings.platforms.tradeindia === false) return;

      StorageUtil.get('device_id').then(function(deviceId) {
        if (!deviceId) {
          try { deviceId = crypto.randomUUID(); } catch(e) { deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2); }
          StorageUtil.set('device_id', deviceId);
        }

        StorageUtil.get('user_id').then(function(userId) {
          if (userId) {
            currentUserId = userId;
            StorageUtil.get('tier').then(function(t) { currentTier = t || 'free'; checkTierAndStart(); });
          } else {
            ApiClient.registerFree(deviceId).then(function(data) {
              if (data && data.user_id) {
                currentUserId = data.user_id;
                currentTier = data.tier || 'free';
                StorageUtil.set('user_id', data.user_id);
                StorageUtil.set('tier', data.tier || 'free');
              }
              checkTierAndStart();
            });
          }
        });
      });
    });
  }

  function checkTierAndStart() {
    if (currentTier !== 'pro' && currentTier !== 'lifetime') {
      injectUpgradeBanner();
      return;
    }
    startScan();
  }

  function injectUpgradeBanner() {
    try {
      if (document.getElementById('lp-upgrade-ti')) return;
      var banner = document.createElement('div');
      banner.id = 'lp-upgrade-ti';
      banner.className = 'lp-upgrade-banner';
      banner.innerHTML = '⚡ <strong>LeadPing</strong>: Upgrade to LeadPing Pro to enable TradeIndia support. ' +
        '<a href="#" id="lp-ti-upgrade-link" style="color:#185FA5;font-weight:500">Upgrade now →</a>';
      var target = document.querySelector('body > *:first-child') || document.body;
      document.body.insertBefore(banner, target);
      var link = document.getElementById('lp-ti-upgrade-link');
      if (link) link.addEventListener('click', function(e) { e.preventDefault(); chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' }).catch(function(){}); });
    } catch(e) {}
  }

  function startScan() {
    setInterval(function() { chrome.runtime.sendMessage({ type: 'PING' }).catch(function(){}); }, 25000);
    scanForLeads();
    startMutationObserver();
    startSPAWatcher();
  }

  function startMutationObserver() {
    try {
      var observer = new MutationObserver(function() {
        try { clearTimeout(scanDebounceTimer); scanDebounceTimer = setTimeout(scanForLeads, 300); } catch(e) {}
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch(e) {}
  }

  function startSPAWatcher() {
    try {
      var lastUrl = location.href;
      new MutationObserver(function() {
        try { if (location.href !== lastUrl) { lastUrl = location.href; setTimeout(scanForLeads, 1200); } } catch(e) {}
      }).observe(document, { subtree: true, childList: true });
    } catch(e) {}
  }

  function scanForLeads() {
    try {
      var selectors = ['.lead-card', '[class*="inquiry"]', '.buy-lead-row', 'tr.lead', '[class*="buyLead"]'];
      var cards = [];
      for (var i = 0; i < selectors.length; i++) {
        try { cards = Array.from(document.querySelectorAll(selectors[i])); } catch(e) { cards = []; }
        if (cards.length > 0) break;
      }
      cards.forEach(function(card) {
        try { if (!card.hasAttribute('data-lp-processed')) processLeadCard(card); } catch(e) {}
      });
    } catch(e) {}
  }

  function processLeadCard(card) {
    try {
      card.setAttribute('data-lp-processed', 'true');
      var leadData = extractLeadData(card);
      var leadId = 'lp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      var lead = Object.assign({ lead_id: leadId, detected_at: Date.now(), status: 'pending' }, leadData);
      StorageUtil.saveLead(lead);
      if (currentUserId) ApiClient.saveLead(currentUserId, lead);
      injectLeadPingUI(card, lead);
    } catch(e) {}
  }

  function trySelectors(card, selectors) {
    for (var i = 0; i < selectors.length; i++) {
      try {
        var el = card.querySelector(selectors[i]);
        var text = el ? el.innerText.trim() : null;
        if (text) return text;
      } catch(e) {}
    }
    return null;
  }

  function extractLeadData(card) {
    var buyer_name = trySelectors(card, ['[class*="buyer"]', '[class*="name"]', 'td.buyer-name', '[class*="sender"]']);
    var buyer_phone = trySelectors(card, ['[class*="phone"]', '[class*="contact"]', 'td.phone', '[class*="mobile"]']);
    if (!buyer_phone) { try { var m = card.innerText.match(/[6-9]\d{9}/); buyer_phone = m ? m[0] : null; } catch(e) {} }
    var product = trySelectors(card, ['[class*="product"]', '[class*="item"]', '.product-name', '[class*="subject"]']);
    var city = trySelectors(card, ['[class*="city"]', '[class*="location"]', 'td.city', '[class*="state"]']);
    var company = trySelectors(card, ['[class*="company"]', '[class*="firm"]', '[class*="business"]']);
    var buyer_email = null;
    try { var em = card.innerText.match(/[\w.-]+@[\w.-]+\.\w+/); buyer_email = em ? em[0] : null; } catch(e) {}
    return { buyer_name: buyer_name, buyer_phone: buyer_phone, buyer_email: buyer_email, product: product, city: city, company: company, platform: 'tradeindia' };
  }

  function injectLeadPingUI(card, lead) {
    try {
      var container = document.createElement('div');
      container.className = 'lp-container';

      var badge = document.createElement('span');
      badge.className = 'lp-badge';
      badge.textContent = '⚡ LeadPing';

      var waBtn = document.createElement('button');
      waBtn.className = 'lp-wa-btn';
      waBtn.id = 'lp-wa-' + lead.lead_id;
      waBtn.textContent = '📱 WhatsApp Follow-Up';
      if (!lead.buyer_phone) { waBtn.disabled = true; waBtn.title = 'Phone not available'; }

      var aiBtn = document.createElement('button');
      aiBtn.className = 'lp-ai-btn';
      aiBtn.id = 'lp-ai-' + lead.lead_id;
      aiBtn.textContent = '✨ AI Message';

      var statusBadge = document.createElement('span');
      statusBadge.className = 'lp-status lp-status-' + (lead.status || 'pending');
      statusBadge.id = 'lp-status-' + lead.lead_id;
      statusBadge.textContent = statusLabel(lead.status || 'pending');

      container.appendChild(badge);
      container.appendChild(waBtn);
      container.appendChild(aiBtn);
      container.appendChild(statusBadge);
      card.appendChild(container);

      waBtn.addEventListener('click', function() { handleWAClick(waBtn, lead); });
      aiBtn.addEventListener('click', function() { handleAIClick(aiBtn, lead); });
    } catch(e) {}
  }

  function handleWAClick(btn, lead) {
    btn.disabled = true; btn.textContent = '⏳ Generating...';
    ApiClient.checkUsage(currentUserId, 'whatsapp').then(function(usage) {
      if (usage && usage.allowed === false) { showUpgradeModal(); btn.disabled = false; btn.textContent = '📱 WhatsApp Follow-Up'; return; }
      generateAndShowModal(lead, function() { btn.disabled = false; btn.textContent = '📱 WhatsApp Follow-Up'; });
    }).catch(function() { generateAndShowModal(lead, function() { btn.disabled = false; btn.textContent = '📱 WhatsApp Follow-Up'; }); });
  }

  function handleAIClick(btn, lead) {
    btn.disabled = true; btn.textContent = '⏳ Generating...';
    generateAndShowModal(lead, function() { btn.disabled = false; btn.textContent = '✨ AI Message'; });
  }

  function generateAndShowModal(lead, onDone) {
    chrome.runtime.sendMessage({ type: 'GENERATE_AI_MESSAGE', user_id: currentUserId, buyer_name: lead.buyer_name||'', product: lead.product||'', city: lead.city||'', company: lead.company||'', platform: 'tradeindia' }, function(response) {
      try {
        var message = (response && response.message) ? response.message : 'Namaskar! TradeIndia pe aapka message mila. Kab baat karein? 🤝';
        showMessageModal(lead, message);
        if (onDone) onDone();
      } catch(e) { if (onDone) onDone(); }
    });
  }

  function showMessageModal(lead, message) {
    try {
      var overlay = document.createElement('div');
      overlay.className = 'lp-modal-overlay';
      var modal = document.createElement('div');
      modal.className = 'lp-modal';

      var header = document.createElement('div');
      header.className = 'lp-modal-header';
      var title = document.createElement('h3'); title.className = 'lp-modal-title'; title.textContent = '📱 Send WhatsApp Message';
      var closeBtn = document.createElement('button'); closeBtn.className = 'lp-modal-close'; closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', function() { overlay.remove(); });
      header.appendChild(title); header.appendChild(closeBtn);

      var buyerInfo = document.createElement('p'); buyerInfo.className = 'lp-modal-buyer';
      buyerInfo.innerHTML = 'To: <strong>' + escHtml(lead.buyer_name||'Unknown') + '</strong> ' +
        (lead.buyer_phone ? '<span class="phone-chip">+91 ' + escHtml(lead.buyer_phone) + '</span>' : '<span style="color:#9CA3AF">No phone</span>');

      var labelRow = document.createElement('div'); labelRow.className = 'lp-msg-label';
      var lbl = document.createElement('label'); lbl.textContent = '✨ AI generated message (editable)';
      var regenBtn = document.createElement('button'); regenBtn.className = 'lp-regen-btn'; regenBtn.textContent = '🔄 Regenerate';
      labelRow.appendChild(lbl); labelRow.appendChild(regenBtn);

      var textarea = document.createElement('textarea'); textarea.className = 'lp-msg-textarea'; textarea.value = message;

      var actions = document.createElement('div'); actions.className = 'lp-modal-actions';
      var cancelBtn = document.createElement('button'); cancelBtn.className = 'lp-btn-cancel'; cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', function() { overlay.remove(); });
      var sendBtn = document.createElement('button'); sendBtn.className = 'lp-btn-send'; sendBtn.textContent = 'Send on WhatsApp ✓';
      sendBtn.addEventListener('click', function() {
        var finalMessage = textarea.value;
        WhatsAppUtil.open(lead.buyer_phone, finalMessage);
        if (currentUserId) { ApiClient.incrementUsage(currentUserId, 'whatsapp', lead.lead_id); ApiClient.updateLeadStatus(currentUserId, lead.lead_id, 'followed_up', '', finalMessage); }
        StorageUtil.updateLead(lead.lead_id, { status: 'followed_up', followed_up_at: Date.now(), message_sent: finalMessage });
        var statusEl = document.getElementById('lp-status-' + lead.lead_id);
        if (statusEl) { statusEl.className = 'lp-status lp-status-followed_up'; statusEl.textContent = '✅ Followed Up'; }
        var waBtn = document.getElementById('lp-wa-' + lead.lead_id);
        if (waBtn) { waBtn.classList.add('lp-sent'); waBtn.textContent = '✅ Sent'; }
        StorageUtil.getSettings().then(function(settings) {
          if (settings.reminder_enabled) chrome.runtime.sendMessage({ type: 'SCHEDULE_REMINDER', lead_id: lead.lead_id, hours: settings.reminder_interval_hours || 24 }).catch(function(){});
        });
        overlay.remove();
      });

      regenBtn.addEventListener('click', function() {
        textarea.disabled = true; textarea.value = 'Regenerating...';
        chrome.runtime.sendMessage({ type: 'GENERATE_AI_MESSAGE', user_id: currentUserId, buyer_name: lead.buyer_name||'', product: lead.product||'', city: lead.city||'', company: lead.company||'', platform: 'tradeindia' }, function(r) {
          textarea.value = (r && r.message) ? r.message : message; textarea.disabled = false;
        });
      });

      actions.appendChild(cancelBtn); actions.appendChild(sendBtn);
      modal.appendChild(header); modal.appendChild(buyerInfo); modal.appendChild(labelRow); modal.appendChild(textarea); modal.appendChild(actions);
      overlay.appendChild(modal);
      overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
    } catch(e) {}
  }

  function showUpgradeModal() {
    try {
      var overlay = document.createElement('div'); overlay.className = 'lp-modal-overlay';
      var modal = document.createElement('div'); modal.className = 'lp-upgrade-modal';
      modal.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px"><h3 style="margin:0;font-size:17px;font-weight:600;color:#0C2D5E">🚀 Upgrade to LeadPing Pro</h3><button onclick="this.closest(\'.lp-modal-overlay\').remove()" style="background:none;border:none;font-size:18px;cursor:pointer">✕</button></div>' +
        '<div class="lp-upi-box">💳 Pay ₹1,999 to <strong>leadping@upi</strong> for Lifetime access to all platforms.</div>' +
        '<a href="#" id="lp-ti-opts" class="lp-activate-link">Already bought? Activate your license key →</a>';
      overlay.appendChild(modal);
      overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
      document.body.appendChild(overlay);
      var link = document.getElementById('lp-ti-opts');
      if (link) link.addEventListener('click', function(e) { e.preventDefault(); chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' }).catch(function(){}); overlay.remove(); });
    } catch(e) {}
  }

  function statusLabel(status) {
    var labels = { pending: '⏳ Pending', followed_up: '✅ Followed Up', called_back: '📞 Called Back', interested: '⭐ Interested', closed_won: '🏆 Won', closed_lost: '❌ Lost' };
    return labels[status] || '⏳ Pending';
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  init();
})();
