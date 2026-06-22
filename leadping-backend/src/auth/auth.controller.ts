import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-free')
  registerFree(@Body('device_id') device_id: string) {
    return this.authService.registerFree(device_id || 'unknown_' + Date.now());
  }
}
