import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common';
import { UsageService } from './usage.service';
import { UserGuard } from '../common/guards/user.guard';

@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get('check')
  @UseGuards(UserGuard)
  checkUsage(@Request() req: any, @Query('action') action: string) {
    return this.usageService.checkUsage(req.user, action || 'whatsapp');
  }

  @Post('increment')
  @UseGuards(UserGuard)
  incrementUsage(
    @Request() req: any,
    @Body('action') action: string,
    @Body('lead_id') lead_id: string,
  ) {
    return this.usageService.incrementUsage(req.user, action || 'whatsapp', lead_id);
  }
}
