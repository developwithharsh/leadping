var currentFilter = 'all';
var allLeads = [];
var currentUserId = null;

document.addEventListener('DOMContentLoaded', function() { init(); });

function init() {
  chrome.storage.local.get(['user_id', 'tier'], function(result) {
    currentUserId = result.user_id || null;
    var tier = result.tier || 'free';
    var tierBadge = document.getElementById('tier-badge');
    if (tierBadge) {
      tierBadge.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
      tierBadge.className = 'tier-badge tier-' + tier;
    }
  });

  chrome.storage.local.get(['leads'], function(result) {
    var leads = result.leads || {};
    allLeads = Object.values(leads).sort(function(a, b) { return (b.detected_at || 0) - (a.detected_at || 0); });
    renderStats(allLeads);
    renderLeads(allLeads, 'all');
    var totalCount = document.getElementById('total-count');
    if (totalCount) {
      var today = getTodayLeads(allLeads);
      totalCount.textContent = today.length + ' lead' + (today.length !== 1 ? 's' : '') + ' today';
    }
  });

  document.querySelectorAll('.tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      renderLeads(allLeads, currentFilter);
    });
  });

  var settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) settingsBtn.addEventListener('click', function() { chrome.runtime.openOptionsPage(); });

  var exportCsv = document.getElementById('export-csv');
  if (exportCsv) exportCsv.addEventListener('click', exportCSV);

  var exportJson = document.getElementById('export-json');
  if (exportJson) exportJson.addEventListener('click', exportJSON);
}

function getTodayLeads(leads) {
  var start = new Date(); start.setHours(0,0,0,0);
  var end = new Date(); end.setHours(23,59,59,999);
  return leads.filter(function(l) {
    var d = new Date(l.detected_at || 0);
    return d >= start && d <= end;
  });
}

function renderStats(leads) {
  var today = getTodayLeads(leads);
  var detected = today.length;
  var followedUp = today.filter(function(l) { return l.status && l.status !== 'pending'; }).length;
  var pending = today.filter(function(l) { return !l.status || l.status === 'pending'; }).length;

  var el = document.getElementById('stat-detected');
  if (el) el.textContent = detected;
  el = document.getElementById('stat-followed');
  if (el) el.textContent = followedUp;
  el = document.getElementById('stat-pending');
  if (el) el.textContent = pending;
}

function renderLeads(leads, filter) {
  var list = document.getElementById('lead-list');
  var empty = document.getElementById('empty-state');
  if (!list) return;
  list.innerHTML = '';

  var filtered = filter === 'all' ? leads : leads.filter(function(l) { return l.platform === filter; });

  if (filtered.length === 0) {
    list.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }

  list.style.display = 'flex';
  if (empty) empty.style.display = 'none';

  filtered.forEach(function(lead) {
    var card = createLeadCard(lead);
    list.appendChild(card);
  });
}

function createLeadCard(lead) {
  var card = document.createElement('div');
  card.className = 'lead-card';
  card.dataset.id = lead.lead_id;

  var platformLabels = { indiamart: 'IndiaMART', justdial: 'JustDial', tradeindia: 'TradeIndia' };
  var pLabel = platformLabels[lead.platform] || lead.platform || 'Unknown';

  var top = document.createElement('div');
  top.className = 'lead-top';
  var nameEl = document.createElement('span');
  nameEl.className = 'lead-name';
  nameEl.textContent = lead.buyer_name || 'Unknown Buyer';
  var platBadge = document.createElement('span');
  platBadge.className = 'platform-badge badge-' + (lead.platform || 'indiamart');
  platBadge.textContent = pLabel;
  top.appendChild(nameEl);
  top.appendChild(platBadge);

  var productEl = document.createElement('div');
  productEl.className = 'lead-product';
  productEl.textContent = '📦 ' + (lead.product || 'Product not detected');

  var meta = document.createElement('div');
  meta.className = 'lead-meta';
  var cityEl = document.createElement('span');
  cityEl.className = 'city-chip';
  cityEl.textContent = '📍 ' + (lead.city || 'Location unknown');
  var timeEl = document.createElement('span');
  timeEl.className = 'time-ago';
  timeEl.textContent = timeAgo(lead.detected_at);
  meta.appendChild(cityEl);
  meta.appendChild(timeEl);

  var actions = document.createElement('div');
  actions.className = 'lead-actions';

  var waBtn = document.createElement('button');
  waBtn.className = 'lp-wa-btn popup-wa-btn';
  waBtn.dataset.id = lead.lead_id;
  waBtn.textContent = '📱 WhatsApp';
  if (!lead.buyer_phone) waBtn.disabled = true;
  if (lead.status && lead.status !== 'pending') { waBtn.classList.add('lp-sent'); waBtn.textContent = '✅ Sent'; }
  waBtn.addEventListener('click', function() { handlePopupWA(lead, waBtn); });

  var statusEl = document.createElement('span');
  statusEl.className = 'lp-status lp-status-' + (lead.status || 'pending');
  statusEl.textContent = statusLabel(lead.status || 'pending');

  var notesBtn = document.createElement('button');
  notesBtn.className = 'btn-notes';
  notesBtn.dataset.id = lead.lead_id;
  notesBtn.title = 'Add notes';
  notesBtn.textContent = '📝';

  actions.appendChild(waBtn);
  actions.appendChild(statusEl);
  actions.appendChild(notesBtn);

  var notesArea = document.createElement('div');
  notesArea.className = 'notes-area';
  notesArea.id = 'notes-' + lead.lead_id;
  notesArea.style.display = 'none';

  var notesInput = document.createElement('textarea');
  notesInput.className = 'notes-input';
  notesInput.placeholder = 'Add notes about this lead...';
  notesInput.value = lead.notes || '';

  var saveNotesBtn = document.createElement('button');
  saveNotesBtn.className = 'btn-save-notes';
  saveNotesBtn.dataset.id = lead.lead_id;
  saveNotesBtn.textContent = 'Save Note';
  saveNotesBtn.addEventListener('click', function() {
    var notes = notesInput.value;
    chrome.storage.local.get(['leads'], function(result) {
      var leads = result.leads || {};
      if (leads[lead.lead_id]) {
        leads[lead.lead_id].notes = notes;
        chrome.storage.local.set({ leads: leads });
      }
    });
    if (currentUserId) {
      chrome.runtime.sendMessage({ type: 'PING' }).catch(function(){});
    }
    saveNotesBtn.textContent = '✅ Saved';
    setTimeout(function() { saveNotesBtn.textContent = 'Save Note'; }, 1500);
  });

  notesArea.appendChild(notesInput);
  notesArea.appendChild(saveNotesBtn);

  notesBtn.addEventListener('click', function() {
    var area = document.getElementById('notes-' + lead.lead_id);
    if (area) area.style.display = area.style.display === 'none' ? 'flex' : 'none';
  });

  card.appendChild(top);
  card.appendChild(productEl);
  card.appendChild(meta);
  card.appendChild(actions);
  card.appendChild(notesArea);
  return card;
}

function handlePopupWA(lead, btn) {
  btn.disabled = true;
  btn.textContent = '⏳...';
  chrome.runtime.sendMessage({
    type: 'GENERATE_AI_MESSAGE',
    user_id: currentUserId,
    buyer_name: lead.buyer_name || '',
    product: lead.product || '',
    city: lead.city || '',
    company: lead.company || '',
    platform: lead.platform || 'indiamart'
  }, function(response) {
    var message = (response && response.message) ? response.message : 'Namaste! Aapka inquiry mila. Kab baat ho sakti hai? 🙏';
    showPopupModal(lead, message, btn);
  });
}

function showPopupModal(lead, message, triggerBtn) {
  var overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  var box = document.createElement('div');
  box.className = 'modal-box';

  var h3 = document.createElement('h3');
  h3.textContent = '📱 Send WhatsApp Message';

  var buyerP = document.createElement('p');
  buyerP.style.cssText = 'font-size:12px;color:#374151;margin-bottom:10px';
  buyerP.innerHTML = 'To: <strong>' + escHtml(lead.buyer_name || 'Unknown') + '</strong>';
  if (lead.buyer_phone) buyerP.innerHTML += ' <span style="background:#EBF4FD;color:#185FA5;padding:2px 7px;border-radius:4px;font-size:11px;border:1px solid #B5D4F4">+91 ' + escHtml(lead.buyer_phone) + '</span>';

  var textarea = document.createElement('textarea');
  textarea.value = message;

  var actions = document.createElement('div');
  actions.className = 'modal-actions';

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn-modal-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', function() { overlay.remove(); triggerBtn.disabled = false; triggerBtn.textContent = '📱 WhatsApp'; });

  var sendBtn = document.createElement('button');
  sendBtn.className = 'btn-modal-send';
  sendBtn.textContent = 'Send on WhatsApp ✓';
  sendBtn.addEventListener('click', function() {
    var finalMsg = textarea.value;
    var phone = lead.buyer_phone;
    if (!phone) { alert('No phone number available'); return; }
    var cleaned = phone.replace(/[\s\-\+\(\)\.]/g,'').replace(/^0+/,'');
    if (cleaned.startsWith('91') && cleaned.length === 12) cleaned = cleaned.slice(2);
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      window.open('https://wa.me/91' + cleaned + '?text=' + encodeURIComponent(finalMsg), '_blank');
    } else {
      alert('Invalid phone number');
      return;
    }
    chrome.storage.local.get(['leads'], function(result) {
      var leads = result.leads || {};
      if (leads[lead.lead_id]) {
        leads[lead.lead_id].status = 'followed_up';
        leads[lead.lead_id].followed_up_at = Date.now();
        leads[lead.lead_id].message_sent = finalMsg;
        chrome.storage.local.set({ leads: leads }, function() {
          allLeads = Object.values(leads).sort(function(a, b) { return (b.detected_at||0) - (a.detected_at||0); });
          renderStats(allLeads);
          renderLeads(allLeads, currentFilter);
        });
      }
    });
    overlay.remove();
    triggerBtn.disabled = false;
    triggerBtn.classList.add('lp-sent');
    triggerBtn.textContent = '✅ Sent';
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(sendBtn);
  box.appendChild(h3);
  box.appendChild(buyerP);
  box.appendChild(textarea);
  box.appendChild(actions);
  overlay.appendChild(box);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) { overlay.remove(); triggerBtn.disabled = false; triggerBtn.textContent = '📱 WhatsApp'; } });
  document.body.appendChild(overlay);
}

function exportCSV() {
  chrome.storage.local.get(['leads'], function(result) {
    var leads = Object.values(result.leads || {});
    var headers = ['lead_id','platform','buyer_name','buyer_phone','product','city','company','status','detected_at','followed_up_at','notes'];
    var rows = [headers.join(',')];
    leads.forEach(function(l) {
      var row = headers.map(function(h) {
        var val = l[h] || '';
        if (h === 'detected_at' || h === 'followed_up_at') val = val ? new Date(val).toISOString() : '';
        return '"' + String(val).replace(/"/g,'""') + '"';
      });
      rows.push(row.join(','));
    });
    downloadBlob(rows.join('\n'), 'leadping-leads-' + dateStr() + '.csv', 'text/csv');
  });
}

function exportJSON() {
  chrome.storage.local.get(['leads'], function(result) {
    var leads = Object.values(result.leads || {});
    downloadBlob(JSON.stringify(leads, null, 2), 'leadping-leads-' + dateStr() + '.json', 'application/json');
  });
}

function downloadBlob(content, filename, type) {
  var blob = new Blob([content], { type: type });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
}

function timeAgo(ts) {
  if (!ts) return 'Unknown';
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  var days = Math.floor(hours / 24);
  return days + 'd ago';
}

function statusLabel(status) {
  var labels = { pending: '⏳ Pending', followed_up: '✅ Followed Up', called_back: '📞 Called Back', interested: '⭐ Interested', closed_won: '🏆 Won', closed_lost: '❌ Lost' };
  return labels[status] || '⏳ Pending';
}

function dateStr() {
  return new Date().toISOString().slice(0,10);
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
