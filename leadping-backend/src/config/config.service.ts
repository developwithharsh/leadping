import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ConfigService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  getRemoteConfig(tier: string = 'free') {
    const base = {
      version: '1.0.0',
      config_version: 3,

      limits: {
        free:     { whatsapp_per_day: 10, ai_per_day: 3 },
        pro:      { whatsapp_per_day: 9999, ai_per_day: 9999 },
        lifetime: { whatsapp_per_day: 9999, ai_per_day: 9999 },
      },

      features: {
        indiamart_enabled:   true,
        justdial_enabled:    true,
        tradeindia_enabled:  true,
        ai_generation:       true,
        reminders:           true,
        export:              true,
        notes:               true,
        status_change:       true,
      },

      platforms: {
        indiamart:   { free: true,  pro: true,  lifetime: true  },
        justdial:    { free: false, pro: true,  lifetime: true  },
        tradeindia:  { free: false, pro: true,  lifetime: true  },
      },

      ai: {
        model:       'llama3-8b-8192',
        max_tokens:  120,
        temperature: 0.8,
        fallback_messages: {
          indiamart:   'Namaste! IndiaMART pe aapki inquiry mili. Best price guarantee. Kab baat ho sakti hai? 🙏',
          justdial:    'Hello! JustDial pe aapki query mili. Top-rated service. Kab contact karein? 📞',
          tradeindia:  'Namaskar! TradeIndia pe aapka message mila. Best rates abhi share karte hain. 🤝',
        },
        system_prompt: 'You are an Indian B2B business WhatsApp assistant. Write SHORT warm friendly Hinglish follow-up messages for sellers responding to buyer inquiries. Maximum 60 words. Always start with Namaste or Hello. Mention the product. End with 🙏. Sound like a real Indian businessman texting, not a formal email.',
      },

      templates: [
        {
          id: 'tpl_01', name: 'Warm Namaste',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: 'Namaste {name}ji! Aapka {product} ke liye inquiry mila. {city} mein delivery possible hai. Best price aur quality guarantee. Kya kal baat ho sakti hai? 🙏'
        },
        {
          id: 'tpl_02', name: 'Competitive Rate',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: 'Hello {name}ji, {company} ke liye {product} chahiye? Bilkul sahi jagah aaye. Hamara rate sabse competitive hai. WhatsApp pe detail bhejein. 📦'
        },
        {
          id: 'tpl_03', name: 'Experience Card',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: 'Namaskar! {product} ke baare mein aapki query mili. 15 saal ka experience hai hamare paas. {name}ji, kab convenient hai aapko? ☎️'
        },
        {
          id: 'tpl_04', name: 'Sample Offer',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: '{name}ji, aapka message mila. {product} ke liye hum specialise karte hain. Sample bhi bhej sakte hain pehle. 🤝'
        },
        {
          id: 'tpl_05', name: 'City Quick',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: 'Namaste {name}ji! {city} se inquiry ke liye shukriya. {product} ka best rate turant bhejenge. Sirf batao kab? 🙏'
        },
        {
          id: 'tpl_06', name: 'GST Registered',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: 'Hello! {product} ke liye shukria inquiry ka. GST registered hain, full bill milega. {name}ji rate discuss karein? 💼'
        },
        {
          id: 'tpl_07', name: 'Decade Expert',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: '{name}ji good day! {product} mein 10 saal se zyada ka experience hai. Quality aur delivery pe guarantee. Kal sample bhejun? 🏭'
        },
        {
          id: 'tpl_08', name: 'Network Strong',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: 'Namaste! {city} mein {product} ke liye best network hai hamare paas. {name}ji requirement batayein, baaki hum karenge. 🎯'
        },
        {
          id: 'tpl_09', name: 'Bulk Retail',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: 'Hello {name}ji! Bulk aur retail dono handle karte hain. {product} ke liye budget range batao, exact quote abhi bhejta hoon. 💰'
        },
        {
          id: 'tpl_10', name: 'Custom Solution',
          platforms: ['indiamart', 'justdial', 'tradeindia'],
          body: 'Namaskar {name}ji! {product} inquiry ke liye dhanyawad. {company} ke liye customized solution available hai. 5 min call? 📞'
        },
      ],

      upgrade: {
        upi_id:          'leadping@upi',
        whatsapp_number: '+91 9999999999',
        pricing: {
          pro_monthly:  999,
          lifetime:     1999,
          currency:     'INR',
        },
        cta_text:    'Pay ₹1,999 once, use forever. No renewal.',
        support_msg: 'Send payment screenshot on WhatsApp for instant activation.',
      },

      announcement: null,
    };

    return {
      ...base,
      current_tier_limits: base.limits[tier] || base.limits.free,
      current_tier_platforms: Object.fromEntries(
        Object.entries(base.platforms).map(([p, tiers]) => [p, tiers[tier] ?? false])
      ),
      fetched_at: new Date().toISOString(),
      cache_ttl_seconds: 3600,
    };
  }

  async getConfigForUser(user_id?: string) {
    let tier = 'free';
    if (user_id) {
      try {
        const user = await this.userModel.findById(user_id).lean();
        if (user) tier = user.tier || 'free';
      } catch { /* fall through */ }
    }
    return this.getRemoteConfig(tier);
  }
}
