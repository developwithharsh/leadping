import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { License, LicenseSchema } from '../schemas/license.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: License.name, schema: LicenseSchema }]),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
