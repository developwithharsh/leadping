import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

function getLimits(tier: string) {
  if (tier === 'pro' || tier === 'lifetime') {
    return { whatsapp_per_day: 9999, ai_per_day: 9999 };
  }
  return { whatsapp_per_day: 10, ai_per_day: 3 };
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async registerFree(device_id: string) {
    let user = await this.userModel.findOne({ device_id }).lean();
    if (user) {
      return {
        user_id: user['_id'].toString(),
        tier: user.tier,
        limits: getLimits(user.tier),
      };
    }

    const created = await this.userModel.create({
      device_id,
      tier: 'free',
      usage: { today_whatsapp: 0, today_ai: 0, last_reset: new Date() },
    });

    return {
      user_id: created._id.toString(),
      tier: 'free',
      limits: getLimits('free'),
    };
  }
}
