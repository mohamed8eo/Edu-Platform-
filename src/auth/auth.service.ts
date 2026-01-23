import { Injectable } from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { auth } from '../lib/auth';

@Injectable()
export class AuthService {
  async SignUp(signUp: SignUpDto) {
    const { email, password, name } = signUp;

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    return result;
  }
}
