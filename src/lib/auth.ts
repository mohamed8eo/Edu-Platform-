import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db'; // your drizzle instance
import * as schema from '../db/schema';
import { lastLoginMethod } from 'better-auth/plugins';
import { emailOTP } from 'better-auth/plugins';
import { bearer } from 'better-auth/plugins';
import { admin } from 'better-auth/plugins';
import { sendOTPEmail } from './email';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    schema,
    provider: 'pg', // or "mysql", "sqlite"
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    bearer(),
    lastLoginMethod({
      storeInDatabase: true,
    }),
    admin(),

    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTPEmail(email, otp, type);
        await Promise.resolve();
      },
    }),
  ],
});
