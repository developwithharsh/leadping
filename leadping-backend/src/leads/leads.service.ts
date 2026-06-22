import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from '../schemas/lead.schema';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
  ) {}

  private getIstDayRange(): { start: Date; end: Date } {
    const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const dayStart = new Date(istNow); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(istNow); dayEnd.setHours(23, 59, 59, 999);
    const offset = 5.5 * 60 * 60 * 1000;
    return {
      start: new Date(dayStart.getTime() - offset),
      end: new Date(dayEnd.getTime() - offset),
    };
  }

  async saveLead(user_id: string, data: any) {
    const { start, end } = this.getIstDayRange();

    if (data.buyer_phone && data.product) {
      const existing = await this.leadModel.findOne({
        user_id: new Types.ObjectId(user_id),
        buyer_phone: data.buyer_phone,
        product: data.product,
        detected_at: { $gte: start, $lte: end },
      }).lean();

      if (existing) {
        return { lead_id: existing['_id'].toString(), duplicate: true };
      }
    }

    const lead = await this.leadModel.create({
      ...data,
      user_id: new Types.ObjectId(user_id),
      detected_at: data.detected_at ? new Date(data.detected_at) : new Date(),
    });

    return { lead_id: lead._id.toString() };
  }

  async updateStatus(user_id: string, lead_id: string, status: string, notes?: string, message_sent?: string) {
    const update: any = { status };
    if (notes !== undefined) update.notes = notes;
    if (message_sent !== undefined) update.message_sent = message_sent;
    if (status === 'followed_up' || status === 'called_back') update.followed_up_at = new Date();

    await this.leadModel.findByIdAndUpdate(lead_id, update);
    return { success: true };
  }

  async getLeads(user_id: string, filters: any) {
    const query: any = { user_id: new Types.ObjectId(user_id) };
    if (filters.platform) query.platform = filters.platform;
    if (filters.status) query.status = filters.status;

    const limit = Math.min(parseInt(filters.limit) || 20, 100);

    return this.leadModel
      .find(query)
      .sort({ detected_at: -1 })
      .limit(limit)
      .lean();
  }

  async getStats(user_id: string) {
    const uid = new Types.ObjectId(user_id);
    const { start, end } = this.getIstDayRange();

    const todayLeads = await this.leadModel
      .find({ user_id: uid, detected_at: { $gte: start, $lte: end } })
      .lean();

    const followedStatuses = ['followed_up', 'called_back', 'interested', 'closed_won'];
    const today = {
      detected: todayLeads.length,
      followed_up: todayLeads.filter(l => followedStatuses.includes(l.status)).length,
      pending: todayLeads.filter(l => l.status === 'pending').length,
      by_platform: {
        indiamart: todayLeads.filter(l => l.platform === 'indiamart').length,
        justdial: todayLeads.filter(l => l.platform === 'justdial').length,
        tradeindia: todayLeads.filter(l => l.platform === 'tradeindia').length,
      },
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const week = [];
    const offsetMs = 5.5 * 60 * 60 * 1000;

    for (let i = 6; i >= 0; i--) {
      const istDay = new Date(Date.now() + offsetMs);
      istDay.setDate(istDay.getDate() - i);
      const dayStart = new Date(istDay); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(istDay); dayEnd.setHours(23, 59, 59, 999);

      const dayLeads = await this.leadModel.countDocuments({
        user_id: uid,
        detected_at: { $gte: new Date(dayStart.getTime() - offsetMs), $lte: new Date(dayEnd.getTime() - offsetMs) },
      });

      const dayFollowed = await this.leadModel.countDocuments({
        user_id: uid,
        status: { $in: followedStatuses },
        detected_at: { $gte: new Date(dayStart.getTime() - offsetMs), $lte: new Date(dayEnd.getTime() - offsetMs) },
      });

      week.push({ date: dayNames[istDay.getDay()], detected: dayLeads, followed_up: dayFollowed });
    }

    return { today, week };
  }
}
