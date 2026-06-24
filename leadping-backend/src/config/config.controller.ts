import { Controller, Get, Query } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig(@Query('user_id') user_id?: string) {
    return this.configService.getConfigForUser(user_id);
  }
}
