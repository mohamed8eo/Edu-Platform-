import { IsEmail, IsString, Length } from 'class-validator';

export class SendOtpDto {
  @IsEmail()
  email: string;
  type: 'email-verification';
}

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 8) // depends on your OTP length
  otp: string;

  type: 'email-verification';
}
