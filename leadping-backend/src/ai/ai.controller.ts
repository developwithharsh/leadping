import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { UserGuard } from '../common/guards/user.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  @UseGuards(UserGuard)
  generate(
    @Body('user_id') user_id: string,
    @Body('buyer_name') buyer_name: string,
    @Body('product') product: string,
    @Body('city') city: string,
    @Body('company') company: string,
    @Body('platform') platform: string,
    @Body('style') style: string,
  ) {
    return this.aiService.generateMessage(user_id, buyer_name, product, city, company, platform || 'indiamart', style);
  }
}
