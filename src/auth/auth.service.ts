/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { auth } from '../lib/auth';
import { SignInDto } from './dto/SignIn.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/sendOTP.dto';
import type { Request } from 'express';
import { db } from '../db';
import { session, user } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { APIError } from 'better-auth';
import cloudinary from '../../cloudinary.config';
import { UserService } from '../user/user.service';
import { ResetPasswordDto } from './dto/password.dto';
import { SocialLoginDto } from './dto/social-login.dto';
@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}
  async SignUp(signUp: SignUpDto): Promise<any> {
    try {
      const { email, password, name } = signUp;

      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
        },
      });
      //send OTP
      if (result) {
        await this.sendOTP({ email, type: 'email-verification' });
      }

      if (!result?.user) return result;

      try {
        const dicebearUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(email)}`;
        const svgData = await fetch(dicebearUrl).then((res) => res.text());

        const uploaded = await cloudinary.uploader.upload(
          `data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`,
          {
            folder: 'avatars', // optional folder
            public_id: result.user.id, // use user ID for easy retrieval
            overwrite: true,
            resource_type: 'image', // necessary for SVG
          },
        );

        const avatarUrl = uploaded.secure_url;

        await db
          .update(user)
          .set({
            image: avatarUrl, // store Cloudinary URL
          })
          .where(eq(user.id, result.user.id));
      } catch (error) {
        console.error('Avatar upload failed:', error);
      }

      return {
        message: 'Sign up successful.',
        token: result.token,
        userId: result.user.id,
        userRole: result.user.role,
        userLastLoginMethod: result.user.lastLoginMethod,
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw new UnauthorizedException(error.message);
      }
      console.error('SignUp Error:', error);
      throw new InternalServerErrorException(
        'An error occurred during sign up',
      );
    }
  }

  async SignIn(signIn: SignInDto, req: Request): Promise<any> {
    try {
      const { email, password } = signIn;

      const result = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
        headers: req.headers as any,
      });
      const user = result.user;

      if (user.banned) {
        throw new ForbiddenException({
          message: 'User is banned',
          banned: user.banned,
          banExpires: user.banExpires,
        });
      }
      // Single session mode: Invalidate all other sessions for this user
      // This ensures only one active session per user (most secure)
      if (user?.id) {
        await this.invalidateOtherSessions(result.user.id, result.token);
      }
      return {
        message: 'Sign in successful.',
        token: result.token,
        userId: user.id,
        userRole: user.role,
        userLastLoginMethod: user.lastLoginMethod,
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw new UnauthorizedException(error.message);
      }
      console.error('SignIn Error:', error);
      throw new InternalServerErrorException(
        'An error occurred during sign in',
      );
    }
  }

  async SignInSocial(socialLoginDto: SocialLoginDto) {
    try {
      console.log(
        'Social login request for provider:',
        socialLoginDto.provider,
      );

      const result = await auth.api.signInSocial({
        body: {
          provider: socialLoginDto.provider,
          callbackURL: 'http://localhost:3000/home',
        },
      });

      return result;
    } catch (error) {
      if (error instanceof APIError) {
        throw new UnauthorizedException(error.message);
      }
      console.error('SignInSocial Error:', error);
      throw new InternalServerErrorException(
        'An error occurred during social sign in',
      );
    }
  }

  private async invalidateOtherSessions(userId: string, currentToken: string) {
    try {
      // Get the current session to find its ID
      const currentSession = await db
        .select()
        .from(session)
        .where(eq(session.token, currentToken))
        .limit(1);

      if (currentSession.length === 0) {
        // Current session not found yet (might be created async), skip cleanup
        return;
      }

      const currentSessionId = currentSession[0].id;

      // Get all session IDs for this user
      const allUserSessions = await db
        .select({ id: session.id })
        .from(session)
        .where(eq(session.userId, userId));

      // Filter out the current session ID
      const otherSessionIds = allUserSessions
        .map((s) => s.id)
        .filter((id) => id !== currentSessionId);

      // Delete all other sessions
      if (otherSessionIds.length > 0) {
        await db.delete(session).where(inArray(session.id, otherSessionIds));
      }
    } catch (error) {
      console.error('Error invalidating other sessions:', error);
    }
  }

  async SignOut(req: Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing Authorization header');
    }

    // Validate token format (should be "Bearer <token>")
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Invalid Authorization header format. Expected: Bearer <token>',
      );
    }

    try {
      await auth.api.signOut({
        headers: {
          authorization: authHeader,
        },
      });
    } catch (error) {
      throw new UnauthorizedException(
        `Invalid or expired token Error:${error}`,
      );
    }
  }
  // verfiey Email
  async sendOTP(sendOtp: SendOtpDto) {
    await auth.api.sendVerificationOTP({
      body: {
        email: sendOtp.email,
        type: sendOtp.type,
      },
    });
  }

  async verifyOTP(verifyOTP: VerifyOtpDto) {
    const { email, otp } = verifyOTP;

    await auth.api.verifyEmailOTP({
      body: {
        email,
        otp,
      },
    });
    return { message: 'Email verified successfully' };
  }

  // Forget password for SignIn
  async forgetPassword(email: string) {
    //Check is this email existing on db
    const existing = await db.select().from(user).where(eq(user.email, email));

    if (existing.length === 0) throw new NotFoundException('Email not found');
    await auth.api.forgetPasswordEmailOTP({
      body: {
        email: email,
      },
    });
    return {
      message: 'verification code has been sent.',
    };
  }

  async resetPassword(resetPassword: ResetPasswordDto) {
    const { otp, password, email } = resetPassword;

    await auth.api.resetPasswordEmailOTP({
      body: {
        email,
        otp,
        password,
      },
    });
    return {
      message: 'Password reset successfully',
    };
  }
}
