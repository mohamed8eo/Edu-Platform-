import { IsNotEmpty, IsEmail, IsString, MinLength } from 'class-validator';
export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  name: string;
}
