import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateItemDto } from './dto/create-item.dto';
import { Item } from './entities/item.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(Item) private readonly repo: Repository<Item>,
  ) {}

  async create(dto: CreateItemDto): Promise<Item> {
    const existing = await this.repo.findOne({ where: { sku: dto.sku } });
    if (existing) {
      throw new ConflictException(`Item with SKU "${dto.sku}" already exists`);
    }
    const item = this.repo.create({
      sku: dto.sku,
      name: dto.name,
      unit: dto.unit ?? 'UN',
      description: dto.description ?? null,
    });
    return this.repo.save(item);
  }

  findAll(): Promise<Item[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Item> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Item ${id} not found`);
    }
    return found;
  }

  /** Busca por ids garantindo que todos existam (usado pelas Ordens de Venda). */
  async findByIds(ids: string[]): Promise<Item[]> {
    const found = await this.repo.find({ where: { id: In(ids) } });
    if (found.length !== new Set(ids).size) {
      throw new NotFoundException('One or more items were not found');
    }
    return found;
  }
}
