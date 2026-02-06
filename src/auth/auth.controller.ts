/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { SignUpDto } from './dto/SignUp.dto';
import { SignInDto } from './dto/SignIn.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/sendOTP.dto';
import type { Request, Response } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/password.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SocialLoginDto } from './dto/social-login.dto';
import { auth } from '../lib/auth';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @AllowAnonymous()
  @ApiOperation({ summary: 'User sign up' })
  @ApiResponse({ status: 201, description: 'User signed up successfully.' })
  async SignUp(@Body() signUp: SignUpDto) {
    return await this.authService.SignUp(signUp);
  }

  @Post('sign-in')
  @AllowAnonymous()
  @ApiOperation({ summary: 'User sign in' })
  @ApiResponse({ status: 201, description: 'User signed in successfully.' })
  async SignIn(@Body() signIn: SignInDto, @Req() req: Request) {
    return await this.authService.SignIn(signIn, req);
  }

  @Post('sign-in-social')
  @AllowAnonymous()
  @ApiOperation({ summary: 'User sign in with social' })
  async signInSocial(@Body() socialLoginDto: SocialLoginDto) {
    return await this.authService.SignInSocial(socialLoginDto);
  }

  @Post('sign-out')
  @AllowAnonymous() // Allow access, but validate token in service
  @ApiOperation({ summary: 'User sign out' })
  @ApiResponse({ status: 201, description: 'User signed out successfully.' })
  async SignOut(@Req() req: Request) {
    await this.authService.SignOut(req);
    return { message: 'Signed out successfully' };
  }

  @Post('send-otp')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Send OTP' })
  @ApiResponse({ status: 201, description: 'OTP sent successfully.' })
  async sendOTP(@Body() sendOtp: SendOtpDto) {
    await this.authService.sendOTP(sendOtp);

    return {
      message: 'verification code has been sent.',
    };
  }

  @Post('verify-OTP')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({ status: 201, description: 'OTP verified successfully.' })
  async verifyOTP(@Body() verifyOTP: VerifyOtpDto) {
    return await this.authService.verifyOTP(verifyOTP);
  }

  @Post('forget-password')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Forgot password request' })
  @ApiResponse({ status: 201, description: 'Password reset email sent.' })
  async forgetPassword(@Body() forgetPassowrd: ForgotPasswordDto) {
    return this.authService.forgetPassword(forgetPassowrd.email);
  }

  @Post('reset-password')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Reset password' })
  @ApiResponse({ status: 201, description: 'Password reset successfully.' })
  async resetPassword(@Body() resetPassword: ResetPasswordDto) {
    return this.authService.resetPassword(resetPassword);
  }
  @Get('session')
  @AllowAnonymous()
  async getSession(@Req() request: Request) {
    try {
      // This will return null if no session exists
      const session = await auth.api.getSession({
        headers: request.headers as any,
      });

      if (!session) {
        return { authenticated: false };
      }

      return {
        authenticated: true,
        user: session.session.token,
      };
    } catch (error) {
      return { authenticated: false };
    }
  }
}
