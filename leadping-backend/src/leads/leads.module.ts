import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { Lead, LeadSchema } from '../schemas/lead.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
