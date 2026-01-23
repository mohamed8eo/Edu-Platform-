import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { SignUpDto } from './dto/SignUp.dto';
import { SignInDto } from './dto/SignIn.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/sendOTP.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @AllowAnonymous()
  async SignUp(@Body() signUp: SignUpDto) {
    return await this.authService.SignUp(signUp);
  }

  @Post('sign-in')
  @AllowAnonymous()
  async SignIn(@Body() signIn: SignInDto) {
    return await this.authService.SignIn(signIn);
  }

  @Post('sign-out')
  @AllowAnonymous() // Allow access, but validate token in service
  async SignOut(@Req() req: Request) {
    await this.authService.SignOut(req);
    return { message: 'Signed out successfully' };
  }

  @Post('send-otp')
  @AllowAnonymous()
  async sendOTP(@Body() dto: SendOtpDto) {
    await this.authService.sendOTP(dto.email, dto.type);

    return {
      message: 'If the email exists, a verification code has been sent.',
    };
  }

  @Post('verify-OTP')
  @AllowAnonymous()
  async verifyOTP(@Body() verifyOTP: VerifyOtpDto) {
    return await this.authService.verifyOTP(verifyOTP);
  }
}
