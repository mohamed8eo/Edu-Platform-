import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddCategorieDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  parentId: string;
}
