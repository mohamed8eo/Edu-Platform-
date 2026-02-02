import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SocialLoginDto {
  @ApiProperty({
    description: 'The social provider to use',
    enum: ['google', 'github'],
    example: 'google',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['google', 'github'])
  provider: 'google' | 'github';

  @ApiProperty({ description: 'Callback URL', required: false })
  @IsString()
  @IsOptional()
  callbackURL?: string;
}
