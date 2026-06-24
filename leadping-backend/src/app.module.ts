import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { LicenseModule } from './license/license.module';
import { AiModule } from './ai/ai.module';
import { LeadsModule } from './leads/leads.module';
import { UsageModule } from './usage/usage.module';
import { AdminModule } from './admin/admin.module';
import { RemoteConfigModule } from './config/config.module';
import { AppUiModule } from './app-ui/app-ui.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost/leadping'),
    AuthModule,
    LicenseModule,
    AiModule,
    LeadsModule,
    UsageModule,
    AdminModule,
    RemoteConfigModule,
    AppUiModule,
  ],
})
export class AppModule {}
