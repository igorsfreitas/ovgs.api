import { IsEnum } from 'class-validator';
import { SalesOrderStatus } from '../enums/sales-order-status.enum';

export class UpdateSalesOrderStatusDto {
  @IsEnum(SalesOrderStatus)
  status: SalesOrderStatus;
}
