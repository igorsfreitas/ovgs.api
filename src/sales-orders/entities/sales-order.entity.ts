import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { TransportType } from '../../transport-types/entities/transport-type.entity';
import { SalesOrderStatus } from '../enums/sales-order-status.enum';
import { SalesOrderItem } from './sales-order-item.entity';

@Entity('sales_orders')
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => TransportType, { nullable: false })
  @JoinColumn({ name: 'transport_type_id' })
  transportType: TransportType;

  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.Criada,
  })
  status: SalesOrderStatus;

  @OneToMany(() => SalesOrderItem, (item) => item.salesOrder, {
    cascade: true,
  })
  items: SalesOrderItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
