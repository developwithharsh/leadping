'use strict';

var allLeads = [];
var currentFilter = 'all';
var currentStatusFilter = 'all';
var currentSearchQuery = '';
var currentUserId = null;
var currentTier = 'free';
var activeModalLead = null;

// ── INIT ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  // Warm the remote config cache on sidebar open (non-blocking)
  if (typeof RemoteConfig !== 'undefined') {
    RemoteConfig.get().then(function() {
      showAnnouncement();
    }).catch(function() {});
  }
  loadState();
  bindEvents();
  listenForUpdates();
});

function loadState() {
  chrome.storage.local.get(['user_id', 'tier', 'leads'], function(result) {
    currentUserId = result.user_id || null;
    currentTier = result.tier || 'free';

    var tierBadge = document.getElementById('tier-badge');
    if (tierBadge) {
      var label = currentTier === 'lifetime' ? '✨ Lifetime' : currentTier === 'pro' ? '⚡ Pro' : 'Free';
      tierBadge.textContent = label;
      tierBadge.className = 'tier-badge tier-' + currentTier;
    }

    var leads = result.leads || {};
    allLeads = Object.values(leads).sort(function(a, b) {
      return (b.detected_at || 0) - (a.detected_at || 0);
    });

    renderStats();
    renderLeads();
    updateFooterCount();
  });
}

function bindEvents() {
  // Platform filters
  document.querySelectorAll('.filter-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      currentFilter = chip.dataset.filter;
      renderLeads();
    });
  });

  // Status filters
  document.querySelectorAll('.status-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.status-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      currentStatusFilter = chip.dataset.status;
      renderLeads();
    });
  });

  // Search
  var searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      currentSearchQuery = searchInput.value.trim().toLowerCase();
      renderLeads();
    });
  }

  // Refresh
  var refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function() {
      refreshBtn.classList.add('spinning');
      loadState();
      setTimeout(function() { refreshBtn.classList.remove('spinning'); }, 800);
    });
  }

  // Settings
  var settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
  }

  // Export
  var csvBtn = document.getElementById('export-csv');
  if (csvBtn) csvBtn.addEventListener('click', exportCSV);
  var jsonBtn = document.getElementById('export-json');
  if (jsonBtn) jsonBtn.addEventListener('click', exportJSON);

  // AI Modal close
  var aiClose = document.getElementById('ai-modal-close');
  if (aiClose) aiClose.addEventListener('click', closeAIModal);
  var aiCancel = document.getElementById('ai-cancel-btn');
  if (aiCancel) aiCancel.addEventListener('click', closeAIModal);

  // AI Modal backdrop
  var aiBackdrop = document.getElementById('ai-modal');
  if (aiBackdrop) {
    aiBackdrop.addEventListener('click', function(e) {
      if (e.target === aiBackdrop) closeAIModal();
    });
  }

  // AI Send
  var aiSendBtn = document.getElementById('ai-send-btn');
  if (aiSendBtn) aiSendBtn.addEventListener('click', handleAISend);

  // AI Regenerate
  var aiRegenBtn = document.getElementById('ai-regen-btn');
  if (aiRegenBtn) aiRegenBtn.addEventListener('click', handleRegen);

  // Upgrade modal close
  var upgradeClose = document.getElementById('upgrade-close');
  if (upgradeClose) upgradeClose.addEventListener('click', closeUpgradeModal);
  var upgradeBackdrop = document.getElementById('upgrade-modal');
  if (upgradeBackdrop) {
    upgradeBackdrop.addEventListener('click', function(e) {
      if (e.target === upgradeBackdrop) closeUpgradeModal();
    });
  }

  // Go to activate license
  var goActivate = document.getElementById('go-activate-btn');
  if (goActivate) {
    goActivate.addEventListener('click', function() {
      closeUpgradeModal();
      chrome.runtime.openOptionsPage();
    });
  }
}

function listenForUpdates() {
  chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === 'local' && changes.leads) {
      var leads = changes.leads.newValue || {};
      allLeads = Object.values(leads).sort(function(a, b) {
        return (b.detected_at || 0) - (a.detected_at || 0);
      });
      renderStats();
      renderLeads();
      updateFooterCount();
    }
  });
}

// ── STATS ──────────────────────────────────────────────────────────────

function renderStats() {
  var now = new Date();
  var dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  var dayEnd   = new Date(now); dayEnd.setHours(23, 59, 59, 999);

  var todayLeads = allLeads.filter(function(l) {
    var d = new Date(l.detected_at || 0);
    return d >= dayStart && d <= dayEnd;
  });

  var detected  = todayLeads.length;
  var followed  = todayLeads.filter(function(l) { return l.status && l.status !== 'pending'; }).length;
  var pending   = todayLeads.filter(function(l) { return !l.status || l.status === 'pending'; }).length;

  setText('stat-detected', detected);
  setText('stat-followed', followed);
  setText('stat-pending',  pending);
}

function updateFooterCount() {
  var now = new Date();
  var dayStart = new Date(now); dayStart.setHours(0, 0, 0, 0);
  var dayEnd   = new Date(now); dayEnd.setHours(23, 59, 59, 999);
  var today = allLeads.filter(function(l) {
    var d = new Date(l.detected_at || 0);
    return d >= dayStart && d <= dayEnd;
  });
  setText('total-count', today.length + ' lead' + (today.length !== 1 ? 's' : '') + ' today');
}

// ── RENDER LEADS ──────────────────────────────────────────────────────

function getFilteredLeads() {
  return allLeads.filter(function(lead) {
    if (currentFilter !== 'all' && lead.platform !== currentFilter) return false;
    if (currentStatusFilter !== 'all' && lead.status !== currentStatusFilter) return false;
    if (currentSearchQuery) {
      var hay = [lead.buyer_name, lead.product, lead.city, lead.company, lead.buyer_phone].join(' ').toLowerCase();
      if (hay.indexOf(currentSearchQuery) === -1) return false;
    }
    return true;
  });
}

function renderLeads() {
  var listEl   = document.getElementById('lead-list');
  var emptyEl  = document.getElementById('empty-state');
  if (!listEl) return;

  var filtered = getFilteredLeads();
  listEl.innerHTML = '';

  if (filtered.length === 0) {
    listEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'flex';
    return;
  }

  listEl.style.display = 'flex';
  if (emptyEl) emptyEl.style.display = 'none';

  filtered.forEach(function(lead) {
    var card = buildLeadCard(lead);
    listEl.appendChild(card);
  });
}

var PLATFORM_LABELS = { indiamart: 'IndiaMART', justdial: 'JustDial', tradeindia: 'TradeIndia' };
var STATUS_LABELS   = {
  pending:     '⏳ Pending',
  followed_up: '✅ Followed Up',
  called_back: '📞 Called Back',
  interested:  '⭐ Interested',
  closed_won:  '🏆 Won',
  closed_lost: '❌ Lost'
};
var STATUS_OPTIONS = [
  { value: 'pending',     label: '⏳ Pending' },
  { value: 'followed_up', label: '✅ Followed Up' },
  { value: 'called_back', label: '📞 Called Back' },
  { value: 'interested',  label: '⭐ Interested' },
  { value: 'closed_won',  label: '🏆 Closed Won' },
  { value: 'closed_lost', label: '❌ Closed Lost' }
];

function buildLeadCard(lead) {
  var card = document.createElement('div');
  card.className = 'lead-card' + (lead.status && lead.status !== 'pending' && lead.status !== 'closed_lost' ? '' : '');
  card.dataset.id = lead.lead_id;

  var status   = lead.status || 'pending';
  var platform = lead.platform || 'indiamart';

  // Top row
  var top = el('div', 'lc-top');
  var nameEl = el('div', 'lc-name'); nameEl.textContent = lead.buyer_name || 'Unknown Buyer';
  var platBadge = el('span', 'platform-badge badge-' + platform);
  platBadge.textContent = PLATFORM_LABELS[platform] || platform;
  top.appendChild(nameEl);
  top.appendChild(platBadge);

  // Product
  var prodEl = el('div', 'lc-product');
  prodEl.innerHTML = '<span class="lc-product-icon">📦</span>' + escHtml(lead.product || 'Product not detected');

  // Meta
  var meta = el('div', 'lc-meta');
  var cityEl = el('span', 'lc-city');
  cityEl.textContent = '📍 ' + (lead.city || 'Unknown');
  var timeEl = el('span', 'lc-time');
  timeEl.textContent = timeAgo(lead.detected_at);
  meta.appendChild(cityEl);
  meta.appendChild(timeEl);

  // Actions
  var actions = el('div', 'lc-actions');

  // WhatsApp button
  var waBtn = el('button', 'btn-wa');
  if (status !== 'pending' && status !== 'called_back') {
    waBtn.classList.add('sent');
    waBtn.innerHTML = '<span class="wa-icon">✅</span> Sent';
  } else {
    waBtn.innerHTML = '<span class="wa-icon">📱</span> WhatsApp';
  }
  if (!lead.buyer_phone) {
    waBtn.disabled = true;
    waBtn.title = 'Phone number not available';
  }
  waBtn.addEventListener('click', function() { handleWAButtonClick(lead, waBtn, card); });

  // Status badge + toggle
  var statusBadge = el('span', 'lc-status status-' + status);
  statusBadge.id = 'status-' + lead.lead_id;
  statusBadge.textContent = STATUS_LABELS[status] || '⏳ Pending';

  var statusToggle = el('button', 'btn-status-toggle');
  statusToggle.textContent = '↓';
  statusToggle.title = 'Change status';
  statusToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleStatusDropdown(lead, card, statusToggle, statusBadge);
  });

  // Notes toggle
  var notesToggle = el('button', 'btn-notes-toggle');
  notesToggle.title = 'Add notes';
  notesToggle.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  notesToggle.addEventListener('click', function() { toggleNotes(lead, card); });

  actions.appendChild(waBtn);
  actions.appendChild(statusBadge);
  actions.appendChild(statusToggle);
  actions.appendChild(notesToggle);

  // Notes area
  var notesArea = el('div', 'notes-area');
  notesArea.id = 'notes-area-' + lead.lead_id;
  var notesTA = el('textarea', 'notes-textarea');
  notesTA.id = 'notes-ta-' + lead.lead_id;
  notesTA.placeholder = 'Add notes about this lead...';
  notesTA.value = lead.notes || '';
  notesTA.rows = 2;
  var saveNoteBtn = el('button', 'btn-save-note');
  saveNoteBtn.textContent = 'Save Note';
  saveNoteBtn.addEventListener('click', function() { saveNote(lead.lead_id, notesTA.value, saveNoteBtn); });
  notesArea.appendChild(notesTA);
  notesArea.appendChild(saveNoteBtn);

  card.appendChild(top);
  card.appendChild(prodEl);
  card.appendChild(meta);
  card.appendChild(actions);
  card.appendChild(notesArea);

  return card;
}

// ── WA BUTTON CLICK ──────────────────────────────────────────────────

function handleWAButtonClick(lead, btn, card) {
  if (!lead.buyer_phone) {
    showToast('No phone number available for this lead', 'error');
    return;
  }

  // Check usage for free tier
  if (currentUserId) {
    ApiClient.checkUsage(currentUserId, 'whatsapp').then(function(usage) {
      if (usage && usage.allowed === false) {
        showUpgradeModal();
        return;
      }
      startGenerating(lead, btn);
    }).catch(function() {
      startGenerating(lead, btn);
    });
  } else {
    startGenerating(lead, btn);
  }
}

function startGenerating(lead, btn) {
  // Show loading state on button
  var originalContent = btn.innerHTML;
  btn.disabled = true;
  btn.className = 'btn-wa-loading';
  btn.innerHTML = '<div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>';

  chrome.runtime.sendMessage({
    type: 'GENERATE_AI_MESSAGE',
    user_id: currentUserId,
    buyer_name: lead.buyer_name || '',
    product: lead.product || '',
    city: lead.city || '',
    company: lead.company || '',
    platform: lead.platform || 'indiamart'
  }, function(response) {
    // Restore button
    btn.disabled = false;
    btn.className = 'btn-wa';
    btn.innerHTML = originalContent;

    var message = (response && response.message)
      ? response.message
      : 'Namaste! Aapka inquiry mila. Kab baat ho sakti hai? 🙏';

    openAIModal(lead, message);
  });
}

// ── AI MODAL ──────────────────────────────────────────────────────────

function openAIModal(lead, message) {
  activeModalLead = lead;

  var buyerEl = document.getElementById('ai-modal-buyer');
  if (buyerEl) {
    buyerEl.innerHTML =
      '<span class="buyer-name">' + escHtml(lead.buyer_name || 'Unknown Buyer') + '</span>' +
      (lead.buyer_phone
        ? '<span class="phone-badge">📞 +91 ' + escHtml(lead.buyer_phone) + '</span>'
        : '<span style="font-size:11px;color:#9CA3AF">No phone number</span>') +
      (lead.product ? '<div style="font-size:11px;margin-top:4px;color:#6B7280">📦 ' + escHtml(lead.product) + '</div>' : '');
  }

  var textarea = document.getElementById('ai-textarea');
  if (textarea) {
    textarea.value = message;
    textarea.disabled = false;
  }

  document.getElementById('ai-modal').style.display = 'flex';
}

function closeAIModal() {
  document.getElementById('ai-modal').style.display = 'none';
  activeModalLead = null;
}

function handleAISend() {
  if (!activeModalLead) return;
  var lead = activeModalLead;
  var textarea = document.getElementById('ai-textarea');
  var finalMessage = textarea ? textarea.value.trim() : '';

  if (!finalMessage) { showToast('Message cannot be empty', 'error'); return; }
  if (!lead.buyer_phone) { showToast('No phone number available', 'error'); return; }

  WhatsAppUtil.open(lead.buyer_phone, finalMessage);

  // Update storage
  var updates = { status: 'followed_up', followed_up_at: Date.now(), message_sent: finalMessage };
  StorageUtil.updateLead(lead.lead_id, updates).then(function() {
    updateCardAfterSend(lead.lead_id);
  });

  // Backend sync (non-blocking)
  if (currentUserId) {
    ApiClient.incrementUsage(currentUserId, 'whatsapp', lead.lead_id);
    ApiClient.updateLeadStatus(currentUserId, lead.lead_id, 'followed_up', '', finalMessage);
  }

  // Schedule reminder
  StorageUtil.getSettings().then(function(settings) {
    if (settings.reminder_enabled) {
      chrome.runtime.sendMessage({
        type: 'SCHEDULE_REMINDER',
        lead_id: lead.lead_id,
        hours: settings.reminder_interval_hours || 24
      }).catch(function() {});
    }
  });

  closeAIModal();
  showToast('WhatsApp opened! Lead marked as followed up ✅', 'success');
}

function updateCardAfterSend(leadId) {
  var statusEl = document.getElementById('status-' + leadId);
  if (statusEl) {
    statusEl.className = 'lc-status status-followed_up';
    statusEl.textContent = '✅ Followed Up';
  }
  var card = document.querySelector('[data-id="' + leadId + '"]');
  if (card) {
    var waBtn = card.querySelector('.btn-wa');
    if (waBtn) {
      waBtn.classList.add('sent');
      waBtn.innerHTML = '<span class="wa-icon">✅</span> Sent';
    }
    card.classList.add('just-sent');
  }
  // Update local allLeads
  allLeads.forEach(function(l) {
    if (l.lead_id === leadId) { l.status = 'followed_up'; l.followed_up_at = Date.now(); }
  });
  renderStats();
}

function handleRegen() {
  if (!activeModalLead) return;
  var lead = activeModalLead;
  var textarea = document.getElementById('ai-textarea');
  var regenBtn = document.getElementById('ai-regen-btn');

  if (textarea) { textarea.disabled = true; textarea.value = 'Regenerating...'; }
  if (regenBtn) regenBtn.classList.add('spinning');

  chrome.runtime.sendMessage({
    type: 'GENERATE_AI_MESSAGE',
    user_id: currentUserId,
    buyer_name: lead.buyer_name || '',
    product: lead.product || '',
    city: lead.city || '',
    company: lead.company || '',
    platform: lead.platform || 'indiamart'
  }, function(response) {
    if (textarea) {
      textarea.value = (response && response.message) ? response.message : 'Namaste! Kab baat ho sakti hai? 🙏';
      textarea.disabled = false;
    }
    if (regenBtn) regenBtn.classList.remove('spinning');
  });
}

// ── STATUS DROPDOWN ──────────────────────────────────────────────────

var openDropdownId = null;

function toggleStatusDropdown(lead, card, toggleBtn, statusBadge) {
  // Close existing
  var existing = document.getElementById('dropdown-' + lead.lead_id);
  if (existing) {
    existing.remove();
    openDropdownId = null;
    return;
  }
  // Close any other open dropdown
  if (openDropdownId) {
    var old = document.getElementById('dropdown-' + openDropdownId);
    if (old) old.remove();
    openDropdownId = null;
  }

  var dropdown = el('div', 'status-dropdown');
  dropdown.id = 'dropdown-' + lead.lead_id;

  STATUS_OPTIONS.forEach(function(opt) {
    var btn = el('button', 'status-opt');
    btn.textContent = opt.label;
    if (lead.status === opt.value) btn.style.fontWeight = '600';
    btn.addEventListener('click', function() {
      changeStatus(lead, opt.value, statusBadge, card);
      dropdown.remove();
      openDropdownId = null;
    });
    dropdown.appendChild(btn);
  });

  card.appendChild(dropdown);
  openDropdownId = lead.lead_id;

  // Close on outside click
  setTimeout(function() {
    document.addEventListener('click', function handler(e) {
      if (!dropdown.contains(e.target) && e.target !== toggleBtn) {
        dropdown.remove();
        openDropdownId = null;
        document.removeEventListener('click', handler);
      }
    });
  }, 10);
}

function changeStatus(lead, newStatus, statusBadge, card) {
  lead.status = newStatus;
  StorageUtil.updateLead(lead.lead_id, { status: newStatus });

  if (statusBadge) {
    statusBadge.className = 'lc-status status-' + newStatus;
    statusBadge.textContent = STATUS_LABELS[newStatus] || newStatus;
  }

  if (currentUserId) {
    ApiClient.updateLeadStatus(currentUserId, lead.lead_id, newStatus, '', '');
  }

  renderStats();
  showToast('Status updated to ' + (STATUS_LABELS[newStatus] || newStatus), 'success');
}

// ── NOTES ──────────────────────────────────────────────────────────────

function toggleNotes(lead, card) {
  var area = document.getElementById('notes-area-' + lead.lead_id);
  if (area) {
    area.classList.toggle('open');
    if (area.classList.contains('open')) {
      var ta = document.getElementById('notes-ta-' + lead.lead_id);
      if (ta) ta.focus();
    }
  }
}

function saveNote(leadId, notes, btn) {
  StorageUtil.updateLead(leadId, { notes: notes }).then(function() {
    if (btn) { btn.textContent = '✅ Saved'; setTimeout(function() { btn.textContent = 'Save Note'; }, 1500); }
    if (currentUserId) {
      ApiClient.updateLeadStatus(currentUserId, leadId, undefined, notes, undefined);
    }
    allLeads.forEach(function(l) { if (l.lead_id === leadId) l.notes = notes; });
  });
}

// ── ANNOUNCEMENT BANNER ────────────────────────────────────────────────

function showAnnouncement() {
  if (typeof RemoteConfig === 'undefined') return;
  var ann = RemoteConfig.getAnnouncement();
  var banner = document.getElementById('announcement-banner');
  if (!banner) return;
  if (ann && ann.text) {
    banner.textContent = ann.text;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

// ── UPGRADE MODAL ──────────────────────────────────────────────────────

function showUpgradeModal() {
  // Populate upgrade modal with remote config values when available
  if (typeof RemoteConfig !== 'undefined') {
    var info = RemoteConfig.getUpgradeInfo();
    var priceEl = document.getElementById('upgrade-price');
    var upiEl   = document.getElementById('upgrade-upi');
    var waEl    = document.getElementById('upgrade-wa');
    if (priceEl && info.pricing) priceEl.textContent = '₹' + (info.pricing.lifetime || 1999);
    if (upiEl && info.upi_id)   upiEl.textContent = info.upi_id;
    if (waEl && info.whatsapp_number) waEl.textContent = info.whatsapp_number;
  }
  document.getElementById('upgrade-modal').style.display = 'flex';
}
function closeUpgradeModal() {
  document.getElementById('upgrade-modal').style.display = 'none';
}

// ── EXPORT ──────────────────────────────────────────────────────────────

function exportCSV() {
  var headers = ['lead_id','platform','buyer_name','buyer_phone','product','city','company','status','detected_at','followed_up_at','notes'];
  var rows = [headers.join(',')];
  allLeads.forEach(function(l) {
    rows.push(headers.map(function(h) {
      var val = l[h] || '';
      if (h === 'detected_at' || h === 'followed_up_at') val = val ? new Date(val).toISOString() : '';
      return '"' + String(val).replace(/"/g,'""') + '"';
    }).join(','));
  });
  downloadBlob(rows.join('\n'), 'leadping-' + dateStr() + '.csv', 'text/csv');
  showToast('CSV exported ✓', 'success');
}

function exportJSON() {
  downloadBlob(JSON.stringify(allLeads, null, 2), 'leadping-' + dateStr() + '.json', 'application/json');
  showToast('JSON exported ✓', 'success');
}

function downloadBlob(content, filename, type) {
  var blob = new Blob([content], { type: type });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}

// ── TOAST ──────────────────────────────────────────────────────────────

var toastTimer = null;
function showToast(msg, type) {
  var toast = document.getElementById('toast-el');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-el';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast ' + (type || 'success');
  clearTimeout(toastTimer);
  requestAnimationFrame(function() {
    toast.classList.add('show');
    toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 2800);
  });
}

// ── HELPERS ──────────────────────────────────────────────────────────────

function el(tag, className) {
  var e = document.createElement(tag);
  if (className) e.className = className;
  return e;
}

function setText(id, val) {
  var e = document.getElementById(id);
  if (e) e.textContent = String(val);
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function timeAgo(ts) {
  if (!ts) return '';
  var diff = Date.now() - ts;
  var m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return m + 'm ago';
  var h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function dateStr() {
  return new Date().toISOString().slice(0, 10);
}
