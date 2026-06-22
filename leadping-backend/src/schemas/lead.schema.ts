import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true })
export class Lead {
  @Prop({ required: true })
  lead_id: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ enum: ['indiamart', 'justdial', 'tradeindia'] })
  platform: string;

  @Prop()
  buyer_name: string;

  @Prop()
  buyer_phone: string;

  @Prop()
  buyer_email: string;

  @Prop()
  product: string;

  @Prop()
  city: string;

  @Prop()
  company: string;

  @Prop({ default: Date.now })
  detected_at: Date;

  @Prop()
  followed_up_at: Date;

  @Prop({
    default: 'pending',
    enum: ['pending', 'followed_up', 'called_back', 'interested', 'closed_won', 'closed_lost'],
  })
  status: string;

  @Prop()
  message_sent: string;

  @Prop()
  notes: string;

  @Prop({ default: false })
  reminder_set: boolean;

  @Prop()
  reminder_at: Date;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
