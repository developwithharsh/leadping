import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import { User, UserSchema } from '../schemas/user.schema';
import { UsageLog, UsageLogSchema } from '../schemas/usage-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UsageLog.name, schema: UsageLogSchema },
    ]),
  ],
  controllers: [UsageController],
  providers: [UsageService],
})
export class UsageModule {}
