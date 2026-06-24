import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { User, UserSchema } from '../schemas/user.schema';
import { RemoteConfigModule } from '../config/config.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RemoteConfigModule,
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
