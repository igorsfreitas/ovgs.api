import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Item de catálogo. Premissa do desafio: itens existem previamente no sistema
 * e são vinculados às Ordens de Venda. Identificado por um SKU único.
 */
@Entity('items')
@Unique(['sku'])
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sku: string;

  @Column()
  name: string;

  /** Unidade de medida (ex.: UN, KG, CX). */
  @Column({ default: 'UN' })
  unit: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
