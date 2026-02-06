import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db'; // your drizzle instance
import * as schema from '../db/schema';
import { bearer, lastLoginMethod } from 'better-auth/plugins';
import { emailOTP } from 'better-auth/plugins';
import { admin } from 'better-auth/plugins';
import { sendOTPEmail } from './email';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    schema,
    provider: 'pg', // or "mysql", "sqlite"
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ['http://localhost:3000'],
  emailAndPassword: {
    enabled: true,
  },
  account: {
    skipStateCookieCheck: true,
  },
  plugins: [
    lastLoginMethod({
      storeInDatabase: true,
    }),
    bearer(),
    admin(),

    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await sendOTPEmail(email, otp, type);
        await Promise.resolve();
      },
    }),
  ],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
