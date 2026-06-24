import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { ConfigService } from '../config/config.service';

function getFallbackMessage(platform: string): string {
  const messages: Record<string, string> = {
    indiamart: 'Namaste! IndiaMART pe aapki inquiry mili. Hum best quality aur competitive rates dete hain. Kab baat ho sakti hai? 🙏',
    justdial: 'Hello! JustDial pe aapki query mili. Hamara service top-rated hai aur delivery fast hai. Kab contact karein? 📞',
    tradeindia: 'Namaskar! TradeIndia pe aapka message mila. Product details aur best rates abhi share karte hain. 🤝',
  };
  return messages[platform] || messages.indiamart;
}

function getLimits(tier: string) {
  if (tier === 'pro' || tier === 'lifetime') return { ai_per_day: 9999 };
  return { ai_per_day: 3 };
}

@Injectable()
export class AiService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly remoteConfig: ConfigService,
  ) {}

  async generateMessage(
    user_id: string,
    buyer_name: string,
    product: string,
    city: string,
    company: string,
    platform: string,
    style?: string,
  ) {
    try {
      const user = await this.userModel.findById(user_id);
      if (!user) return { message: getFallbackMessage(platform), fallback: true };

      const limits = getLimits(user.tier);
      const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
      const istMidnight = new Date(istNow);
      istMidnight.setHours(0, 0, 0, 0);

      if (!user.usage) user.usage = { today_whatsapp: 0, today_ai: 0, last_reset: new Date() };
      if (!user.usage.last_reset || new Date(user.usage.last_reset) < istMidnight) {
        user.usage.today_ai = 0;
        user.usage.today_whatsapp = 0;
        user.usage.last_reset = new Date();
        await user.save();
      }

      if (user.usage.today_ai >= limits.ai_per_day) {
        return {
          error: 'limit_exceeded',
          fallback: true,
          message: getFallbackMessage(platform),
        };
      }

      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) return { message: getFallbackMessage(platform), fallback: true };

      // System prompt comes from remote config — update on backend to take effect instantly
      const cfg = this.remoteConfig.getRemoteConfig(user.tier);
      const systemPrompt = cfg.ai.system_prompt;
      const userPrompt = `Write a WhatsApp follow-up message for: Buyer Name: ${buyer_name || 'the buyer'}, Product: ${product || 'your product'}, City: ${city || 'your city'}, Company: ${company || 'your company'}, Platform: ${platform}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          max_tokens: 120,
          temperature: 0.8,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });

      if (!response.ok) {
        return { message: getFallbackMessage(platform), fallback: true };
      }

      const data = await response.json();
      const generatedText = data?.choices?.[0]?.message?.content;
      if (!generatedText) return { message: getFallbackMessage(platform), fallback: true };

      return { message: generatedText.trim() };
    } catch {
      return { message: getFallbackMessage(platform), fallback: true };
    }
  }
}
