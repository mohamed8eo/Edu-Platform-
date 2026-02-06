import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  thumbnail?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  level?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  language?: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty()
  categoryIds: string[];

  @IsString()
  @ApiProperty()
  youtubePlaylistURL?: string;
}
