import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { SalesOrderStatus } from '../enums/sales-order-status.enum';

export class QuerySalesOrdersDto {
  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;

  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsOptional()
  @IsUUID('4')
  transportTypeId?: string;

  /** Filtra OVs criadas a partir desta data (YYYY-MM-DD, inclusive). */
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  /** Filtra OVs criadas até esta data (YYYY-MM-DD, inclusive). */
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
