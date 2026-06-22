var StorageUtil = (function() {
  function get(key) {
    return new Promise(function(resolve) {
      try {
        chrome.storage.local.get([key], function(result) {
          resolve(result[key] !== undefined ? result[key] : null);
        });
      } catch(e) {
        resolve(null);
      }
    });
  }

  function set(key, value) {
    return new Promise(function(resolve) {
      try {
        var obj = {};
        obj[key] = value;
        chrome.storage.local.set(obj, function() {
          resolve(value);
        });
      } catch(e) {
        resolve(value);
      }
    });
  }

  function getSettings() {
    return new Promise(function(resolve) {
      try {
        chrome.storage.local.get(['settings'], function(result) {
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
          var stored = result.settings || {};
          var merged = Object.assign({}, defaults, stored);
          if (!merged.platforms) merged.platforms = defaults.platforms;
          else merged.platforms = Object.assign({}, defaults.platforms, merged.platforms);
          if (!merged.active_template) merged.active_template = defaults.active_template;
          else merged.active_template = Object.assign({}, defaults.active_template, merged.active_template);
          resolve(merged);
        });
      } catch(e) {
        resolve({
          whatsapp_mode: 'web',
          country_code: '91',
          reminder_enabled: true,
          reminder_interval_hours: 24,
          second_reminder_days: 3,
          daily_summary: true,
          platforms: { indiamart: true, justdial: true, tradeindia: true },
          active_template: { indiamart: 0, justdial: 0, tradeindia: 0 },
          message_style: 'hinglish_warm'
        });
      }
    });
  }

  function saveSettings(updates) {
    return getSettings().then(function(existing) {
      var merged = Object.assign({}, existing, updates);
      return new Promise(function(resolve) {
        try {
          chrome.storage.local.set({ settings: merged }, function() {
            resolve(merged);
          });
        } catch(e) {
          resolve(merged);
        }
      });
    });
  }

  function saveLead(lead) {
    return new Promise(function(resolve) {
      try {
        chrome.storage.local.get(['leads'], function(result) {
          var leads = result.leads || {};
          leads[lead.lead_id] = lead;
          chrome.storage.local.set({ leads: leads }, function() {
            resolve(lead);
          });
        });
      } catch(e) {
        resolve(lead);
      }
    });
  }

  function updateLead(lead_id, updates) {
    return new Promise(function(resolve) {
      try {
        chrome.storage.local.get(['leads'], function(result) {
          var leads = result.leads || {};
          if (leads[lead_id]) {
            leads[lead_id] = Object.assign({}, leads[lead_id], updates);
            chrome.storage.local.set({ leads: leads }, function() {
              resolve(leads[lead_id]);
            });
          } else {
            resolve(null);
          }
        });
      } catch(e) {
        resolve(null);
      }
    });
  }

  function getLeads(filters) {
    filters = filters || {};
    return new Promise(function(resolve) {
      try {
        chrome.storage.local.get(['leads'], function(result) {
          var leads = result.leads || {};
          var arr = Object.values(leads);

          if (filters.platform) {
            arr = arr.filter(function(l) { return l.platform === filters.platform; });
          }
          if (filters.status) {
            arr = arr.filter(function(l) { return l.status === filters.status; });
          }
          if (filters.date) {
            var filterDate = new Date(filters.date);
            var start = new Date(filterDate); start.setHours(0,0,0,0);
            var end = new Date(filterDate); end.setHours(23,59,59,999);
            arr = arr.filter(function(l) {
              var d = new Date(l.detected_at);
              return d >= start && d <= end;
            });
          }

          arr.sort(function(a, b) { return (b.detected_at || 0) - (a.detected_at || 0); });
          resolve(arr);
        });
      } catch(e) {
        resolve([]);
      }
    });
  }

  function getStats() {
    return new Promise(function(resolve) {
      try {
        chrome.storage.local.get(['leads'], function(result) {
          var leads = result.leads || {};
          var arr = Object.values(leads);

          var now = new Date();
          var todayStart = new Date(now); todayStart.setHours(0,0,0,0);
          var todayEnd = new Date(now); todayEnd.setHours(23,59,59,999);

          var todayLeads = arr.filter(function(l) {
            var d = new Date(l.detected_at);
            return d >= todayStart && d <= todayEnd;
          });

          var stats = {
            today: {
              detected: todayLeads.length,
              followed_up: todayLeads.filter(function(l) { return l.status === 'followed_up' || l.status === 'called_back' || l.status === 'interested' || l.status === 'closed_won'; }).length,
              pending: todayLeads.filter(function(l) { return l.status === 'pending'; }).length,
              by_platform: {
                indiamart: todayLeads.filter(function(l) { return l.platform === 'indiamart'; }).length,
                justdial: todayLeads.filter(function(l) { return l.platform === 'justdial'; }).length,
                tradeindia: todayLeads.filter(function(l) { return l.platform === 'tradeindia'; }).length
              }
            },
            week: []
          };

          for (var i = 6; i >= 0; i--) {
            var day = new Date(now);
            day.setDate(day.getDate() - i);
            var dayStart = new Date(day); dayStart.setHours(0,0,0,0);
            var dayEnd = new Date(day); dayEnd.setHours(23,59,59,999);
            var dayLeads = arr.filter(function(l) {
              var d = new Date(l.detected_at);
              return d >= dayStart && d <= dayEnd;
            });
            var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
            stats.week.push({
              date: dayNames[day.getDay()],
              detected: dayLeads.length,
              followed_up: dayLeads.filter(function(l) { return l.status !== 'pending'; }).length
            });
          }

          resolve(stats);
        });
      } catch(e) {
        resolve({ today: { detected:0, followed_up:0, pending:0, by_platform:{indiamart:0,justdial:0,tradeindia:0} }, week: [] });
      }
    });
  }

  function clearOldLeads(days) {
    return new Promise(function(resolve) {
      try {
        chrome.storage.local.get(['leads'], function(result) {
          var leads = result.leads || {};
          var cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
          var deleted = 0;
          var newLeads = {};
          Object.keys(leads).forEach(function(id) {
            if ((leads[id].detected_at || 0) < cutoff) {
              deleted++;
            } else {
              newLeads[id] = leads[id];
            }
          });
          chrome.storage.local.set({ leads: newLeads }, function() {
            resolve(deleted);
          });
        });
      } catch(e) {
        resolve(0);
      }
    });
  }

  return { get: get, set: set, getSettings: getSettings, saveSettings: saveSettings, saveLead: saveLead, updateLead: updateLead, getLeads: getLeads, getStats: getStats, clearOldLeads: clearOldLeads };
})();
