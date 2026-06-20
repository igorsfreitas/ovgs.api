import { IsOptional, IsString, Length } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @Length(1, 60)
  sku: string;

  @IsString()
  @Length(2, 160)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 10)
  unit?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;
}
