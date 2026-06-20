import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { ItemsModule } from '../items/items.module';
import { TransportTypesModule } from '../transport-types/transport-types.module';
import { Schedule } from './entities/schedule.entity';
import { SalesOrderItem } from './entities/sales-order-item.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrdersController } from './sales-orders.controller';
import { SalesOrdersService } from './sales-orders.service';
import { SchedulingController } from './scheduling.controller';
import { SchedulingService } from './scheduling.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalesOrder, SalesOrderItem, Schedule]),
    CustomersModule,
    TransportTypesModule,
    ItemsModule,
  ],
  controllers: [SalesOrdersController, SchedulingController],
  providers: [SalesOrdersService, SchedulingService],
  exports: [SalesOrdersService, SchedulingService],
})
export class SalesOrdersModule {}
