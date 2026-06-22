import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { LicenseService } from './license.service';

@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Post('activate')
  activate(
    @Body('license_key') license_key: string,
    @Body('device_id') device_id: string,
  ) {
    return this.licenseService.activate(license_key, device_id);
  }

  @Get('validate')
  validate(@Query('device_id') device_id: string) {
    return this.licenseService.validate(device_id);
  }
}
