import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  device_id: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop({ default: 'free', enum: ['free', 'pro', 'lifetime'] })
  tier: string;

  @Prop()
  license_key: string;

  @Prop({
    type: Object,
    default: () => ({ today_whatsapp: 0, today_ai: 0, last_reset: null }),
  })
  usage: { today_whatsapp: number; today_ai: number; last_reset: Date };

  @Prop({ default: Date.now })
  last_active: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
