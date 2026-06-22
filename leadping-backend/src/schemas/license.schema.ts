import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LicenseDocument = License & Document;

@Schema({ timestamps: true })
export class License {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ enum: ['pro', 'lifetime'] })
  tier: string;

  @Prop()
  price_paid: number;

  @Prop({ default: 'manual_upi' })
  payment_method: string;

  @Prop()
  payment_ref: string;

  @Prop()
  activated_at: Date;

  @Prop()
  device_id: string;

  @Prop({ default: false })
  is_active: boolean;
}

export const LicenseSchema = SchemaFactory.createForClass(License);
