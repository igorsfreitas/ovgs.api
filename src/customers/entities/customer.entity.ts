import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { TransportType } from '../../transport-types/entities/transport-type.entity';

@Entity('customers')
@Unique(['document'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** Documento fiscal (CNPJ/CPF) — identificador único do cliente. */
  @Column()
  document: string;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Tipos de transporte autorizados para o cliente. Uma Ordem de Venda só pode
   * ser criada com um transporte que esteja nesta lista.
   */
  @ManyToMany(() => TransportType)
  @JoinTable({
    name: 'customer_authorized_transport_types',
    joinColumn: { name: 'customer_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'transport_type_id',
      referencedColumnName: 'id',
    },
  })
  authorizedTransportTypes: TransportType[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
