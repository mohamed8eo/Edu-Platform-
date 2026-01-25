import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsString()
  @IsNotEmpty()
  thumbnail?: string;

  @IsString()
  @IsNotEmpty()
  level?: string;

  @IsString()
  @IsNotEmpty()
  language?: string;

  @IsArray()
  @IsString({ each: true })
  categoryIds: string[];

  @IsString()
  @IsOptional()
  youtubeUrl?: string;

  @IsString()
  @IsOptional()
  youtubePlaylistId?: string;

  @IsString()
  @IsOptional()
  youtubeVideoId?: string;
}
