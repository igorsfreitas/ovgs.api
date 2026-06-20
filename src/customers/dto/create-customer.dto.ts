import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @Length(2, 120)
  name: string;

  /** CNPJ/CPF (com ou sem máscara). */
  @IsString()
  @Length(11, 18)
  document: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  /** Tipos de transporte autorizados na criação (opcional). */
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  authorizedTransportTypeIds?: string[];
}
