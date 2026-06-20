import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransportTypesService } from '../transport-types/transport-types.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repo: Repository<Customer>,
    private readonly transportTypes: TransportTypesService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    await this.assertDocumentAvailable(dto.document);
    const authorized = dto.authorizedTransportTypeIds?.length
      ? await this.transportTypes.findByIds(dto.authorizedTransportTypeIds)
      : [];
    const customer = this.repo.create({
      name: dto.name,
      document: dto.document,
      email: dto.email ?? null,
      authorizedTransportTypes: authorized,
    });
    return this.repo.save(customer);
  }

  findAll(): Promise<Customer[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Customer> {
    const found = await this.repo.findOne({
      where: { id },
      relations: { authorizedTransportTypes: true },
    });
    if (!found) {
      throw new NotFoundException(`Customer ${id} not found`);
    }
    return found;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    if (dto.document && dto.document !== customer.document) {
      await this.assertDocumentAvailable(dto.document);
    }
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  async setAuthorizedTransports(
    id: string,
    transportTypeIds: string[],
  ): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.authorizedTransportTypes = transportTypeIds.length
      ? await this.transportTypes.findByIds(transportTypeIds)
      : [];
    return this.repo.save(customer);
  }

  /** Regra central: o transporte está autorizado para o cliente? */
  async isTransportAuthorized(
    customerId: string,
    transportTypeId: string,
  ): Promise<boolean> {
    const customer = await this.findOne(customerId);
    return customer.authorizedTransportTypes.some(
      (transport) => transport.id === transportTypeId,
    );
  }

  private async assertDocumentAvailable(document: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { document } });
    if (existing) {
      throw new ConflictException(
        `Customer with document "${document}" already exists`,
      );
    }
  }
}
