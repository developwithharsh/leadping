import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LicenseController } from './license.controller';
import { LicenseService } from './license.service';
import { License, LicenseSchema } from '../schemas/license.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: License.name, schema: LicenseSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [LicenseController],
  providers: [LicenseService],
})
export class LicenseModule {}
