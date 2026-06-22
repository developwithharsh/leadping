var currentSettings = {};
var currentTier = 'free';
var currentDeviceId = null;
var newTplTextarea = null;

document.addEventListener('DOMContentLoaded', function() { init(); });

function init() {
  chrome.storage.local.get(['settings', 'tier', 'device_id', 'user_id', 'BACKEND_URL'], function(result) {
    currentTier = result.tier || 'free';
    currentDeviceId = result.device_id || null;

    var defaults = {
      whatsapp_mode: 'web',
      country_code: '91',
      reminder_enabled: true,
      reminder_interval_hours: 24,
      second_reminder_days: 3,
      daily_summary: true,
      platforms: { indiamart: true, justdial: true, tradeindia: true },
      active_template: { indiamart: 0, justdial: 0, tradeindia: 0 },
      message_style: 'hinglish_warm'
    };
    currentSettings = Object.assign({}, defaults, result.settings || {});
    if (!currentSettings.platforms) currentSettings.platforms = defaults.platforms;
    if (!currentSettings.active_template) currentSettings.active_template = defaults.active_template;

    populateSettings(currentSettings, result.BACKEND_URL || '');
    loadLicenseSection();
    loadDataStats();
    renderTemplates();
    loadUsageDisplay();
  });

  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function() { toggleSection(item.dataset.section); });
  });

  var addTplBtn = document.getElementById('add-template-btn');
  if (addTplBtn) addTplBtn.addEventListener('click', function() {
    var form = document.getElementById('add-template-form');
    if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });

  var activateBtn = document.getElementById('activate-btn');
  if (activateBtn) activateBtn.addEventListener('click', handleActivateLicense);
}

function populateSettings(settings, backendUrl) {
  var waMode = document.querySelectorAll('input[name="whatsapp_mode"]');
  waMode.forEach(function(r) { r.checked = r.value === settings.whatsapp_mode; });

  var ccInput = document.getElementById('country-code-input');
  if (ccInput) ccInput.value = settings.country_code || '91';

  var msgStyle = document.querySelectorAll('input[name="message_style"]');
  msgStyle.forEach(function(r) { r.checked = r.value === settings.message_style; });

  var pIndia = document.getElementById('platform-indiamart');
  if (pIndia) pIndia.checked = settings.platforms.indiamart !== false;
  var pJd = document.getElementById('platform-justdial');
  if (pJd) pJd.checked = settings.platforms.justdial !== false;
  var pTi = document.getElementById('platform-tradeindia');
  if (pTi) pTi.checked = settings.platforms.tradeindia !== false;

  var remEnabled = document.getElementById('reminder-enabled');
  if (remEnabled) remEnabled.checked = settings.reminder_enabled !== false;
  var remInterval = document.getElementById('reminder-interval');
  if (remInterval) remInterval.value = String(settings.reminder_interval_hours || 24);
  var secRem = document.getElementById('second-reminder');
  if (secRem) secRem.value = String(settings.second_reminder_days || 3);
  var dailySum = document.getElementById('daily-summary');
  if (dailySum) dailySum.checked = settings.daily_summary !== false;

  var backendInput = document.getElementById('backend-url-input');
  if (backendInput) backendInput.value = backendUrl;

  if (currentTier !== 'pro' && currentTier !== 'lifetime') {
    var jdBadge = document.getElementById('jd-pro-badge');
    if (jdBadge) jdBadge.style.display = 'inline';
    var tiBadge = document.getElementById('ti-pro-badge');
    if (tiBadge) tiBadge.style.display = 'inline';
  }
}

function loadLicenseSection() {
  var freeDiv = document.getElementById('license-free');
  var activatedDiv = document.getElementById('license-activated');
  if (currentTier === 'pro' || currentTier === 'lifetime') {
    if (freeDiv) freeDiv.style.display = 'none';
    if (activatedDiv) {
      activatedDiv.style.display = 'block';
      var tierDisplay = document.getElementById('license-tier-display');
      if (tierDisplay) tierDisplay.textContent = currentTier === 'lifetime' ? 'Lifetime Pro ✨' : 'Pro Plan';
    }
  }
}

function loadUsageDisplay() {
  chrome.storage.local.get(['user_id'], function(result) {
    var userId = result.user_id;
    if (!userId) return;
    chrome.storage.local.get(['BACKEND_URL'], function(r) {
      var url = r.BACKEND_URL || 'https://leadping-backend.onrender.com';
      var limits = currentTier === 'free' ? { wa: 10, ai: 3 } : { wa: 9999, ai: 9999 };
      var aiEl = document.getElementById('ai-usage-display');
      var waEl = document.getElementById('wa-usage-display');
      fetch(url + '/api/usage/check?user_id=' + encodeURIComponent(userId) + '&action=ai')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.limit !== undefined) {
            var used = data.limit - data.remaining;
            if (aiEl) aiEl.textContent = used + ' / ' + (data.limit >= 9999 ? '∞' : data.limit);
          }
        }).catch(function() {
          if (aiEl) aiEl.textContent = '? / ' + (limits.ai >= 9999 ? '∞' : limits.ai);
        });
      fetch(url + '/api/usage/check?user_id=' + encodeURIComponent(userId) + '&action=whatsapp')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.limit !== undefined) {
            var used = data.limit - data.remaining;
            if (waEl) waEl.textContent = used + ' / ' + (data.limit >= 9999 ? '∞' : data.limit);
          }
        }).catch(function() {
          if (waEl) waEl.textContent = '? / ' + (limits.wa >= 9999 ? '∞' : limits.wa);
        });
    });
  });
}

function saveSection(sectionId) {
  var updates = {};
  if (sectionId === 'ai') {
    var styleInputs = document.querySelectorAll('input[name="message_style"]');
    styleInputs.forEach(function(r) { if (r.checked) updates.message_style = r.value; });
    var backendUrl = (document.getElementById('backend-url-input') || {}).value;
    if (backendUrl) chrome.storage.local.set({ BACKEND_URL: backendUrl.trim() });
  }
  if (sectionId === 'whatsapp') {
    var waInputs = document.querySelectorAll('input[name="whatsapp_mode"]');
    waInputs.forEach(function(r) { if (r.checked) updates.whatsapp_mode = r.value; });
    var cc = document.getElementById('country-code-input');
    if (cc) updates.country_code = cc.value || '91';
  }
  if (sectionId === 'platforms') {
    updates.platforms = {
      indiamart: (document.getElementById('platform-indiamart') || {}).checked !== false,
      justdial: (document.getElementById('platform-justdial') || {}).checked !== false,
      tradeindia: (document.getElementById('platform-tradeindia') || {}).checked !== false
    };
  }
  if (sectionId === 'reminders') {
    updates.reminder_enabled = (document.getElementById('reminder-enabled') || {}).checked !== false;
    var ri = document.getElementById('reminder-interval');
    updates.reminder_interval_hours = ri ? parseInt(ri.value) : 24;
    var sr = document.getElementById('second-reminder');
    updates.second_reminder_days = sr ? parseInt(sr.value) : 3;
    updates.daily_summary = (document.getElementById('daily-summary') || {}).checked !== false;
  }

  currentSettings = Object.assign({}, currentSettings, updates);
  chrome.storage.local.set({ settings: currentSettings }, function() {
    showToast('Settings saved ✓', 'success');
  });
}

function handleActivateLicense() {
  var keyInput = document.getElementById('license-key-input');
  var errorDiv = document.getElementById('license-error');
  var key = keyInput ? keyInput.value.trim() : '';

  if (!key || key.length < 10) {
    if (errorDiv) { errorDiv.textContent = 'Please enter a valid license key.'; errorDiv.style.display = 'block'; }
    return;
  }
  if (errorDiv) errorDiv.style.display = 'none';

  var activateBtn = document.getElementById('activate-btn');
  if (activateBtn) { activateBtn.disabled = true; activateBtn.textContent = 'Activating...'; }

  chrome.storage.local.get(['device_id', 'BACKEND_URL'], function(result) {
    var deviceId = result.device_id || ('dev_' + Date.now());
    var backendUrl = result.BACKEND_URL || 'https://leadping-backend.onrender.com';

    fetch(backendUrl + '/api/license/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: key, device_id: deviceId })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (activateBtn) { activateBtn.disabled = false; activateBtn.textContent = 'Activate License'; }
      if (data && data.success) {
        chrome.storage.local.set({ tier: data.tier }, function() {
          currentTier = data.tier;
          loadLicenseSection();
          showToast('License activated! ' + data.message, 'success');
        });
      } else {
        if (errorDiv) { errorDiv.textContent = (data && data.message) ? data.message : 'Activation failed. Please check your key.'; errorDiv.style.display = 'block'; }
      }
    })
    .catch(function() {
      if (activateBtn) { activateBtn.disabled = false; activateBtn.textContent = 'Activate License'; }
      if (errorDiv) { errorDiv.textContent = 'Network error. Please check your connection.'; errorDiv.style.display = 'block'; }
    });
  });
}

function renderTemplates() {
  var listEl = document.getElementById('template-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  chrome.storage.local.get(['custom_templates', 'settings'], function(result) {
    var custom = result.custom_templates || [];
    var settings = result.settings || {};
    var active = settings.active_template || { indiamart: 0, justdial: 0, tradeindia: 0 };
    var allTemplates = DEFAULT_TEMPLATES.concat(custom);

    allTemplates.forEach(function(tpl, idx) {
      var isDefault = idx < DEFAULT_TEMPLATES.length;
      var card = document.createElement('div');
      card.className = 'template-card';

      var header = document.createElement('div');
      header.className = 'template-card-header';
      var nameEl = document.createElement('span');
      nameEl.className = 'template-name';
      nameEl.textContent = tpl.name;
      var actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';
      actions.style.alignItems = 'center';

      if (!isDefault) {
        var delBtn = document.createElement('button');
        delBtn.className = 'btn-tpl-delete';
        delBtn.textContent = '🗑';
        delBtn.title = 'Delete template';
        delBtn.addEventListener('click', function() { deleteTemplate(tpl.id); });
        actions.appendChild(delBtn);
      } else {
        var lockEl = document.createElement('span');
        lockEl.className = 'tpl-lock';
        lockEl.title = 'Default template (cannot delete)';
        lockEl.textContent = '🔒';
        actions.appendChild(lockEl);
      }

      header.appendChild(nameEl);
      header.appendChild(actions);

      var preview = document.createElement('div');
      preview.className = 'template-body-preview';
      preview.textContent = tpl.body.length > 80 ? tpl.body.slice(0, 80) + '...' : tpl.body;

      var platforms = document.createElement('div');
      platforms.className = 'template-platforms';
      (tpl.platforms || []).forEach(function(p) {
        var chip = document.createElement('span');
        chip.className = 'tpl-platform-chip';
        chip.textContent = { indiamart: 'IndiaMART', justdial: 'JustDial', tradeindia: 'TradeIndia' }[p] || p;
        platforms.appendChild(chip);
      });

      var actRow = document.createElement('div');
      actRow.className = 'template-actions';
      var lbl = document.createElement('span');
      lbl.className = 'tpl-active-label';
      lbl.textContent = 'Set active for: ';
      actRow.appendChild(lbl);

      ['indiamart', 'justdial', 'tradeindia'].forEach(function(plt) {
        if (!tpl.platforms || tpl.platforms.indexOf(plt) === -1) return;
        var radioLabel = document.createElement('label');
        radioLabel.style.cssText = 'font-size:11px;display:flex;align-items:center;gap:4px;cursor:pointer;';
        var radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'active-tpl-' + plt;
        radio.value = String(idx);
        radio.checked = active[plt] === idx;
        radio.addEventListener('change', function() {
          if (!currentSettings.active_template) currentSettings.active_template = {};
          currentSettings.active_template[plt] = idx;
          chrome.storage.local.get(['settings'], function(r) {
            var s = Object.assign({}, r.settings || {}, { active_template: currentSettings.active_template });
            chrome.storage.local.set({ settings: s }, function() { showToast('Active template updated ✓', 'success'); });
          });
        });
        radioLabel.appendChild(radio);
        radioLabel.appendChild(document.createTextNode({ indiamart: 'IM', justdial: 'JD', tradeindia: 'TI' }[plt]));
        actRow.appendChild(radioLabel);
      });

      card.appendChild(header);
      card.appendChild(preview);
      card.appendChild(platforms);
      card.appendChild(actRow);
      listEl.appendChild(card);
    });
  });
}

function saveNewTemplate() {
  var nameInput = document.getElementById('new-tpl-name');
  var bodyInput = document.getElementById('new-tpl-body');
  var name = nameInput ? nameInput.value.trim() : '';
  var body = bodyInput ? bodyInput.value.trim() : '';
  if (!name || !body) { showToast('Please fill in name and message body.', 'error'); return; }

  var platforms = [];
  document.querySelectorAll('input[name="new-tpl-platform"]:checked').forEach(function(cb) { platforms.push(cb.value); });

  chrome.storage.local.get(['custom_templates'], function(result) {
    var custom = result.custom_templates || [];
    custom.push({ id: 'custom_' + Date.now(), name: name, platforms: platforms, body: body });
    chrome.storage.local.set({ custom_templates: custom }, function() {
      showToast('Template saved ✓', 'success');
      document.getElementById('add-template-form').style.display = 'none';
      if (nameInput) nameInput.value = '';
      if (bodyInput) bodyInput.value = '';
      renderTemplates();
    });
  });
}

function deleteTemplate(id) {
  chrome.storage.local.get(['custom_templates'], function(result) {
    var custom = (result.custom_templates || []).filter(function(t) { return t.id !== id; });
    chrome.storage.local.set({ custom_templates: custom }, function() {
      showToast('Template deleted.', 'success');
      renderTemplates();
    });
  });
}

function insertPlaceholder(placeholder) {
  var textarea = document.getElementById('new-tpl-body');
  if (!textarea) return;
  var start = textarea.selectionStart;
  var end = textarea.selectionEnd;
  var val = textarea.value;
  textarea.value = val.slice(0, start) + placeholder + val.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + placeholder.length;
  textarea.focus();
}

function loadDataStats() {
  chrome.storage.local.get(['leads'], function(result) {
    var leads = Object.values(result.leads || {});
    var total = leads.length;
    var followedUp = leads.filter(function(l) { return l.status && l.status !== 'pending'; }).length;
    var im = leads.filter(function(l) { return l.platform === 'indiamart'; }).length;
    var jd = leads.filter(function(l) { return l.platform === 'justdial'; }).length;
    var ti = leads.filter(function(l) { return l.platform === 'tradeindia'; }).length;

    var statsEl = document.getElementById('data-stats');
    if (!statsEl) return;
    statsEl.innerHTML = [
      { num: total, lbl: 'Total Leads' },
      { num: followedUp, lbl: 'Followed Up' },
      { num: im, lbl: 'IndiaMART' },
      { num: jd, lbl: 'JustDial' },
      { num: ti, lbl: 'TradeIndia' },
      { num: total - followedUp, lbl: 'Pending' }
    ].map(function(s) {
      return '<div class="stats-item"><div class="num">' + s.num + '</div><div class="lbl">' + s.lbl + '</div></div>';
    }).join('');
  });
}

function exportData(format) {
  chrome.storage.local.get(['leads'], function(result) {
    var leads = Object.values(result.leads || {});
    var date = new Date().toISOString().slice(0,10);
    if (format === 'csv') {
      var headers = ['lead_id','platform','buyer_name','buyer_phone','product','city','company','status','detected_at','followed_up_at','notes'];
      var rows = [headers.join(',')];
      leads.forEach(function(l) {
        rows.push(headers.map(function(h) {
          var val = l[h] || '';
          if (h === 'detected_at' || h === 'followed_up_at') val = val ? new Date(val).toISOString() : '';
          return '"' + String(val).replace(/"/g,'""') + '"';
        }).join(','));
      });
      downloadBlob(rows.join('\n'), 'leadping-leads-' + date + '.csv', 'text/csv');
    } else {
      downloadBlob(JSON.stringify(leads, null, 2), 'leadping-leads-' + date + '.json', 'application/json');
    }
  });
}

function downloadBlob(content, filename, type) {
  var blob = new Blob([content], { type: type });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}

function clearOldLeadsHandler() {
  var daysSelect = document.getElementById('clear-days');
  var days = daysSelect ? parseInt(daysSelect.value) : 30;
  var cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  chrome.storage.local.get(['leads'], function(result) {
    var leads = result.leads || {};
    var deleted = 0;
    var newLeads = {};
    Object.keys(leads).forEach(function(id) {
      if ((leads[id].detected_at || 0) < cutoff) deleted++;
      else newLeads[id] = leads[id];
    });
    chrome.storage.local.set({ leads: newLeads }, function() {
      showToast('Deleted ' + deleted + ' old lead(s).', 'success');
      loadDataStats();
    });
  });
}

function showClearAllModal() {
  var modal = document.getElementById('clear-all-modal');
  if (modal) modal.style.display = 'flex';
  var inp = document.getElementById('confirm-delete-input');
  if (inp) inp.value = '';
  var err = document.getElementById('confirm-delete-error');
  if (err) err.style.display = 'none';
}

function confirmClearAll() {
  var inp = document.getElementById('confirm-delete-input');
  var err = document.getElementById('confirm-delete-error');
  if (!inp || inp.value.trim() !== 'DELETE') {
    if (err) err.style.display = 'block';
    return;
  }
  chrome.storage.local.clear(function() { window.location.reload(); });
}

function toggleSection(sectionId) {
  document.querySelectorAll('.section').forEach(function(s) { s.style.display = 'none'; });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var target = document.getElementById(sectionId);
  if (target) target.style.display = 'block';
  var navItem = document.querySelector('[data-section="' + sectionId + '"]');
  if (navItem) navItem.classList.add('active');
}

function showToast(msg, type) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast toast-' + (type || 'success') + ' show';
  toast.style.display = 'block';
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.style.display = 'none'; }, 200);
  }, 3000);
}
