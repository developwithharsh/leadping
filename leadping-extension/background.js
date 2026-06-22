function getFallbackTemplate(platform) {
  var templates = {
    indiamart: 'Namaste! Aapka inquiry mila. Hum aapko best price aur quality denge. Kab baat ho sakti hai? 🙏',
    justdial: 'Hello! JustDial pe aapki query mili. Hamara service top rated hai. Kab contact karein? 📞',
    tradeindia: 'Namaskar! TradeIndia pe aapka message mila. Product details aur rates abhi share karte hain. 🤝'
  };
  return templates[platform] || templates.indiamart;
}

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'PING') {
    sendResponse({ pong: true });
    return false;
  }

  if (msg.type === 'GENERATE_AI_MESSAGE') {
    chrome.storage.local.get(['BACKEND_URL', 'user_id'], function(result) {
      var backendUrl = result.BACKEND_URL || 'https://leadping-backend.onrender.com';
      var userId = result.user_id || msg.user_id;
      var platform = msg.platform || 'indiamart';

      fetch(backendUrl + '/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          buyer_name: msg.buyer_name || '',
          product: msg.product || '',
          city: msg.city || '',
          company: msg.company || '',
          platform: platform
        })
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.message) {
          sendResponse({ message: data.message });
        } else {
          sendResponse({ message: getFallbackTemplate(platform) });
        }
      })
      .catch(function() {
        sendResponse({ message: getFallbackTemplate(platform) });
      });
    });
    return true;
  }

  if (msg.type === 'SCHEDULE_REMINDER') {
    chrome.alarms.create('reminder_' + msg.lead_id, { delayInMinutes: msg.hours * 60 });
    sendResponse({ success: true });
    return false;
  }

  if (msg.type === 'CANCEL_REMINDER') {
    chrome.alarms.clear('reminder_' + msg.lead_id);
    sendResponse({ success: true });
    return false;
  }

  return false;
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name && alarm.name.indexOf('reminder_') === 0) {
    var leadId = alarm.name.replace('reminder_', '');
    chrome.storage.local.get(['leads'], function(result) {
      var leads = result.leads || {};
      var lead = leads[leadId];
      if (lead && (lead.status === 'pending' || lead.status === 'followed_up')) {
        chrome.notifications.create('notif_' + leadId, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: '⚡ LeadPing Reminder',
          message: 'Follow up with ' + (lead.buyer_name || 'this lead') + ' for ' + (lead.product || 'your product')
        });
      }
    });
  }
});

chrome.notifications.onClicked.addListener(function(notifId) {
  if (notifId && notifId.indexOf('notif_') === 0) {
    var leadId = notifId.replace('notif_', '');
    chrome.storage.local.get(['leads'], function(result) {
      var leads = result.leads || {};
      var lead = leads[leadId];
      if (lead) {
        var urls = {
          indiamart: 'https://leadmanager.indiamart.com/',
          justdial: 'https://my.justdial.com/',
          tradeindia: 'https://seller.tradeindia.com/'
        };
        var url = urls[lead.platform] || 'https://leadmanager.indiamart.com/';
        chrome.tabs.create({ url: url });
      }
    });
  }
});

setInterval(function() {
  chrome.runtime.sendMessage({ type: 'PING' }).catch(function() {});
}, 25000);
