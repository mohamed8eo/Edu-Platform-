import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignUpDto } from './dto/SignUp.dto';
import { auth } from '../lib/auth';
import { SignInDto } from './dto/SignIn.dto';
import { VerifyOtpDto } from './dto/sendOTP.dto';
import type { Request } from 'express';
import { db } from '../db';
import { session } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

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

  async SignIn(signIn: SignInDto) {
    const { email, password } = signIn;

    const result = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    // Single session mode: Invalidate all other sessions for this user
    // This ensures only one active session per user (most secure)
    if (result.user?.id) {
      await this.invalidateOtherSessions(result.user.id, result.token);
    }

    return result;
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

  async sendOTP(
    email: string,
    type: 'sign-in' | 'email-verification' | 'forget-password',
  ) {
    await auth.api.sendVerificationOTP({
      body: {
        email,
        type,
      },
    });
  }

  async verifyOTP(verifyOTP: VerifyOtpDto) {
    const { email, otp } = verifyOTP;

    const result = await auth.api.verifyEmailOTP({
      body: {
        email,
        otp,
      },
    });
    return { message: 'Email verified successfully', result };
  }
}
