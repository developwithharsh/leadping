import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UsageLogDocument = UsageLog & Document;

@Schema()
export class UsageLog {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ enum: ['whatsapp', 'ai', 'lead_detected'] })
  action: string;

  @Prop()
  platform: string;

  @Prop()
  lead_id: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const UsageLogSchema = SchemaFactory.createForClass(UsageLog);
