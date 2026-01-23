import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth'; // Your Better Auth instance
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [BetterAuthModule.forRoot({ auth }), AuthModule],
})
export class AppModule {}
