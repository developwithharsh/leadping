import { Body, Controller, ForbiddenException, Headers, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { License, LicenseDocument } from '../schemas/license.schema';

@Controller('admin')
export class AdminController {
  constructor(
    @InjectModel(License.name) private licenseModel: Model<LicenseDocument>,
  ) {}

  @Post('create-license')
  async createLicense(
    @Headers('x-admin-secret') adminSecret: string,
    @Body('tier') tier: string,
    @Body('price_paid') price_paid: number,
    @Body('payment_ref') payment_ref: string,
  ) {
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw new ForbiddenException('Unauthorized');
    }

    const segments = Array.from({ length: 4 }, () =>
      Math.random().toString(36).toUpperCase().slice(2, 6).padEnd(4, 'X'),
    );
    const key = 'LP-' + segments.join('-');

    const license = await this.licenseModel.create({
      key,
      tier: tier || 'lifetime',
      price_paid: price_paid || 0,
      payment_method: 'manual_upi',
      payment_ref: payment_ref || '',
      is_active: false,
    });

    return { license_key: license.key, tier: license.tier };
  }
}
