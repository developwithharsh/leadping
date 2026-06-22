import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { License, LicenseDocument } from '../schemas/license.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class LicenseService {
  constructor(
    @InjectModel(License.name) private licenseModel: Model<LicenseDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async activate(license_key: string, device_id: string) {
    const license = await this.licenseModel.findOne({ key: license_key });
    if (!license) {
      throw new NotFoundException('License key not found');
    }

    if (license.is_active && license.device_id !== device_id) {
      throw new ConflictException('Key already activated on another device');
    }

    if (license.is_active && license.device_id === device_id) {
      return { success: true, tier: license.tier, message: 'Already activated' };
    }

    license.is_active = true;
    license.activated_at = new Date();
    license.device_id = device_id;
    await license.save();

    await this.userModel.findOneAndUpdate(
      { device_id },
      { tier: license.tier, license_key: license_key },
    );

    return { success: true, tier: license.tier, message: 'License activated successfully!' };
  }

  async validate(device_id: string) {
    const user = await this.userModel.findOne({ device_id }).lean();
    if (!user) return { tier: 'free', is_valid: true };
    return { tier: user.tier, is_valid: true };
  }
}
