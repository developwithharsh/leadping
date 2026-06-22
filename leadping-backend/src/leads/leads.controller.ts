import { Body, Controller, Get, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { UserGuard } from '../common/guards/user.guard';

@Controller('')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads/save')
  @UseGuards(UserGuard)
  saveLead(@Body('user_id') user_id: string, @Body() body: any) {
    const { user_id: _uid, ...leadData } = body;
    return this.leadsService.saveLead(user_id, leadData);
  }

  @Patch('leads/status')
  @UseGuards(UserGuard)
  updateStatus(
    @Body('user_id') user_id: string,
    @Body('lead_id') lead_id: string,
    @Body('status') status: string,
    @Body('notes') notes: string,
    @Body('message_sent') message_sent: string,
  ) {
    return this.leadsService.updateStatus(user_id, lead_id, status, notes, message_sent);
  }

  @Get('leads')
  @UseGuards(UserGuard)
  getLeads(@Query('user_id') user_id: string, @Query() query: any) {
    return this.leadsService.getLeads(user_id, query);
  }

  @Get('stats')
  @UseGuards(UserGuard)
  getStats(@Query('user_id') user_id: string) {
    return this.leadsService.getStats(user_id);
  }
}
