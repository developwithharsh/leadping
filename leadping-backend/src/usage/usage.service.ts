import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UsageLog, UsageLogDocument } from '../schemas/usage-log.schema';

function getLimits(tier: string) {
  if (tier === 'pro' || tier === 'lifetime') {
    return { whatsapp_per_day: 9999, ai_per_day: 9999 };
  }
  return { whatsapp_per_day: 10, ai_per_day: 3 };
}

@Injectable()
export class UsageService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(UsageLog.name) private usageLogModel: Model<UsageLogDocument>,
  ) {}

  private getIstMidnight(): Date {
    const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const midnight = new Date(istNow);
    midnight.setHours(0, 0, 0, 0);
    return new Date(midnight.getTime() - 5.5 * 60 * 60 * 1000);
  }

  async checkUsage(user: any, action: string) {
    const userDoc = await this.userModel.findById(user._id);
    if (!userDoc) return { allowed: false, remaining: 0, limit: 0 };

    if (!userDoc.usage) {
      userDoc.usage = { today_whatsapp: 0, today_ai: 0, last_reset: new Date() };
    }

    const istMidnight = this.getIstMidnight();
    if (!userDoc.usage.last_reset || new Date(userDoc.usage.last_reset) < istMidnight) {
      userDoc.usage.today_whatsapp = 0;
      userDoc.usage.today_ai = 0;
      userDoc.usage.last_reset = new Date();
      await userDoc.save();
    }

    const limits = getLimits(userDoc.tier);
    const limit = action === 'whatsapp' ? limits.whatsapp_per_day : limits.ai_per_day;
    const count = action === 'whatsapp' ? userDoc.usage.today_whatsapp : userDoc.usage.today_ai;
    const allowed = count < limit;

    return { allowed, remaining: Math.max(0, limit - count), limit };
  }

  async incrementUsage(user: any, action: string, lead_id?: string) {
    const userDoc = await this.userModel.findById(user._id);
    if (!userDoc) return { success: false };

    if (!userDoc.usage) {
      userDoc.usage = { today_whatsapp: 0, today_ai: 0, last_reset: new Date() };
    }

    if (action === 'whatsapp') {
      userDoc.usage.today_whatsapp = (userDoc.usage.today_whatsapp || 0) + 1;
    } else if (action === 'ai') {
      userDoc.usage.today_ai = (userDoc.usage.today_ai || 0) + 1;
    }

    await userDoc.save();

    await this.usageLogModel.create({
      user_id: userDoc._id,
      action: action as any,
      lead_id: lead_id || '',
      timestamp: new Date(),
    });

    return { success: true };
  }
}
