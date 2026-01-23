import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { SignUpDto } from './dto/SignUp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  @AllowAnonymous()
  async SignUp(@Body() signUp: SignUpDto) {
    return await this.authService.SignUp(signUp);
  }
}
