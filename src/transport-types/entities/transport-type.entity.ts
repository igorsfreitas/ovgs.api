import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Modalidade de transporte (ex.: Caminhão, Carreta, Bi-truck).
 *
 * Modelada como dado (linha de tabela), e não enum, justamente para permitir
 * incluir novos tipos sem alterar as regras de negócio existentes.
 */
@Entity('transport_types')
@Unique(['code'])
export class TransportType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
