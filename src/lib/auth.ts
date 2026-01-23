import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db'; // your drizzle instance
import * as schema from '../db/schema';
import { lastLoginMethod } from 'better-auth/plugins';
import { emailOTP } from 'better-auth/plugins';
import { bearer } from 'better-auth/plugins';
const isDev = 'Development';
async function sendOTPEmail(email: string, otp: string, type: string) {
  // Development: Log to console
  if (isDev) {
    console.log(`\n📧 [Email OTP] ${type} → ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`⏰ Valid for 5 minutes\n`);
    // return;
  }

  // Production: Send real email via Resend
  // Uncomment below and install Resend: yarn add resend
  if (process.env.RESEND_API_KEY) {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const subject =
      type === 'sign-in'
        ? 'Your Sign-In Code'
        : type === 'email-verification'
          ? 'Verify Your Email'
          : 'Reset Your Password';

    const html = `
      <h2>Your Verification Code</h2>
      <p>Your code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
      <p>If you didn't request this code, please ignore this email.</p>
    `;

    // Don't await - Better Auth runs this in background to avoid timing attacks
    void resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject,
      html,
    });
    return;
  }
  // Fallback: Warn if no email service configured
  console.warn(
    `[Email OTP] No email service configured. OTP for ${email}: ${otp}`,
  );
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    schema,
    provider: 'pg', // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    bearer(), // Enable Bearer token authentication
    lastLoginMethod({
      storeInDatabase: true,
    }),

    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTPEmail(email, otp, type);
        await Promise.resolve();
      },
    }),
  ],
});
