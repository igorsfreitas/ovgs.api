import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateTransportTypeDto {
  @IsString()
  @Length(2, 80)
  name: string;

  /** Identificador estável e único, em caixa alta (ex.: TRUCK, CARRETA). */
  @IsString()
  @Length(2, 30)
  @Matches(/^[A-Z0-9_]+$/, {
    message:
      'code must contain only uppercase letters, numbers and underscores',
  })
  code: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;
}
