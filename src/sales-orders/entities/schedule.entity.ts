import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SchedulingStatus } from '../enums/scheduling-status.enum';
import { SalesOrder } from './sales-order.entity';

/** Agendamento de entrega de uma Ordem de Venda (um por OV). */
@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => SalesOrder, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder: SalesOrder;

  @Column({ name: 'delivery_date', type: 'date' })
  deliveryDate: string;

  @Column({ name: 'window_start', type: 'time' })
  windowStart: string;

  @Column({ name: 'window_end', type: 'time' })
  windowEnd: string;

  @Column({
    type: 'enum',
    enum: SchedulingStatus,
    default: SchedulingStatus.Pending,
  })
  status: SchedulingStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
