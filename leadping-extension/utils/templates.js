var DEFAULT_TEMPLATES = [
  {
    id: 'tpl_01',
    name: 'Warm Namaste',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: 'Namaste {name}ji! Aapka {product} ke liye inquiry mila. {city} mein delivery possible hai. Best price aur quality guarantee. Kya kal baat ho sakti hai? 🙏'
  },
  {
    id: 'tpl_02',
    name: 'Competitive Rate',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: 'Hello {name}ji, {company} ke liye {product} chahiye? Bilkul sahi jagah aaye. Hamara rate sabse competitive hai. WhatsApp pe detail bhejein. 📦'
  },
  {
    id: 'tpl_03',
    name: 'Experience Card',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: 'Namaskar! {product} ke baare mein aapki query mili. 15 saal ka experience hai hamare paas. {name}ji, kab convenient hai aapko? ☎️'
  },
  {
    id: 'tpl_04',
    name: 'Sample Offer',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: '{name}ji, aapka message mila. {product} ke liye hum specialise karte hain. Sample bhi bhej sakte hain pehle. 🤝'
  },
  {
    id: 'tpl_05',
    name: 'City Quick',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: 'Namaste {name}ji! {city} se inquiry ke liye shukriya. {product} ka best rate turant bhejenge. Sirf batao kab? 🙏'
  },
  {
    id: 'tpl_06',
    name: 'GST Registered',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: 'Hello! {product} ke liye shukria inquiry ka. GST registered hain, full bill milega. {name}ji rate discuss karein? 💼'
  },
  {
    id: 'tpl_07',
    name: 'Decade Expert',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: '{name}ji good day! {product} mein 10 saal se zyada ka experience hai. Quality aur delivery pe guarantee. Kal sample bhejun? 🏭'
  },
  {
    id: 'tpl_08',
    name: 'Network Strong',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: 'Namaste! {city} mein {product} ke liye best network hai hamare paas. {name}ji requirement batayein, baaki hum karenge. 🎯'
  },
  {
    id: 'tpl_09',
    name: 'Bulk Retail',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: 'Hello {name}ji! Bulk aur retail dono handle karte hain. {product} ke liye budget range batao, exact quote abhi bhejta hoon. 💰'
  },
  {
    id: 'tpl_10',
    name: 'Custom Solution',
    platforms: ['indiamart', 'justdial', 'tradeindia'],
    body: 'Namaskar {name}ji! {product} inquiry ke liye dhanyawad. {company} ke liye customized solution available hai. 5 min call? 📞'
  }
];

var TemplateUtil = (function() {
  function getAll() {
    return new Promise(function(resolve) {
      try {
        // Remote templates override local defaults when present
        var remoteTemplates = (typeof RemoteConfig !== 'undefined') ? RemoteConfig.getTemplates() : null;
        chrome.storage.local.get(['custom_templates'], function(result) {
          var base = remoteTemplates || DEFAULT_TEMPLATES;
          var custom = result.custom_templates || [];
          resolve(base.concat(custom));
        });
      } catch(e) {
        resolve(DEFAULT_TEMPLATES.slice());
      }
    });
  }

  function fill(body, data) {
    if (!body) return '';
    return body
      .replace(/\{name\}/g, (data && data.buyer_name) ? data.buyer_name : 'Aap')
      .replace(/\{product\}/g, (data && data.product) ? data.product : 'aapka product')
      .replace(/\{city\}/g, (data && data.city) ? data.city : 'aapke sheher')
      .replace(/\{company\}/g, (data && data.company) ? data.company : 'aapki company');
  }

  function getActive(platform) {
    return Promise.all([StorageUtil.getSettings(), getAll()]).then(function(results) {
      var settings = results[0];
      var templates = results[1];
      var idx = (settings.active_template && settings.active_template[platform]) ? settings.active_template[platform] : 0;
      return templates[idx] || templates[0];
    });
  }

  return { getAll: getAll, fill: fill, getActive: getActive };
})();
