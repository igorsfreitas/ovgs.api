import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateTransportTypeDto } from './dto/create-transport-type.dto';
import { UpdateTransportTypeDto } from './dto/update-transport-type.dto';
import { TransportType } from './entities/transport-type.entity';

@Injectable()
export class TransportTypesService {
  constructor(
    @InjectRepository(TransportType)
    private readonly repo: Repository<TransportType>,
  ) {}

  async create(dto: CreateTransportTypeDto): Promise<TransportType> {
    await this.assertCodeAvailable(dto.code);
    const entity = this.repo.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
    });
    return this.repo.save(entity);
  }

  findAll(activeOnly = false): Promise<TransportType[]> {
    return this.repo.find({
      where: activeOnly ? { isActive: true } : {},
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<TransportType> {
    const found = await this.repo.findOne({ where: { id } });
    if (!found) {
      throw new NotFoundException(`Transport type ${id} not found`);
    }
    return found;
  }

  /** Busca por ids, garantindo que todos existam (usado por outros módulos). */
  async findByIds(ids: string[]): Promise<TransportType[]> {
    const found = await this.repo.find({ where: { id: In(ids) } });
    if (found.length !== new Set(ids).size) {
      throw new NotFoundException('One or more transport types were not found');
    }
    return found;
  }

  async update(
    id: string,
    dto: UpdateTransportTypeDto,
  ): Promise<TransportType> {
    const entity = await this.findOne(id);
    if (dto.code && dto.code !== entity.code) {
      await this.assertCodeAvailable(dto.code);
    }
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  private async assertCodeAvailable(code: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { code } });
    if (existing) {
      throw new ConflictException(
        `Transport type code "${code}" already exists`,
      );
    }
  }
}
