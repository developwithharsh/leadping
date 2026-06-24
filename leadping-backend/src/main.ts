import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*', methods: 'GET,POST,PATCH,DELETE,OPTIONS' });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // MongoDB connection status
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connected successfully!');
  });
  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 LeadPing backend running on port ${port}`);
}
bootstrap();
