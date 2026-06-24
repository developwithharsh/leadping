import { Module } from '@nestjs/common';
import { AppUiController } from './app-ui.controller';

@Module({
  controllers: [AppUiController],
})
export class AppUiModule {}
