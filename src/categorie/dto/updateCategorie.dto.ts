import { IsOptional, IsString } from 'class-validator';

export class UpdateCategorieDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  parentId: string;
}
