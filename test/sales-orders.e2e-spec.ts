import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/auth/entities/user.entity';
import { UsersService } from './../src/auth/users.service';

describe('SalesOrders (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let customerId: string;
  let authorizedTransportId: string;
  let unauthorizedTransportId: string;
  let itemId: string;

  const ts = Date.now();
  const adminEmail = `so-admin-${ts}@ovgs.local`;
  const password = 'e2e-password';
  const MISSING_UUID = '00000000-0000-4000-8000-000000000000';

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: request.Response) => (res.body as { id: string }).id;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    await app
      .get(UsersService)
      .create({ email: adminEmail, password, role: UserRole.Admin });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password });
    token = (login.body as { access_token: string }).access_token;

    authorizedTransportId = idOf(
      await request(app.getHttpServer())
        .post('/transport-types')
        .set(auth())
        .send({ name: 'Caminhão', code: `SO_A_${ts}` }),
    );
    unauthorizedTransportId = idOf(
      await request(app.getHttpServer())
        .post('/transport-types')
        .set(auth())
        .send({ name: 'Carreta', code: `SO_B_${ts}` }),
    );
    itemId = idOf(
      await request(app.getHttpServer())
        .post('/items')
        .set(auth())
        .send({ sku: `SO_SKU_${ts}`, name: 'Caixa' }),
    );
    customerId = idOf(
      await request(app.getHttpServer())
        .post('/customers')
        .set(auth())
        .send({
          name: 'ACME',
          document: `${ts}`,
          authorizedTransportTypeIds: [authorizedTransportId],
        }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication', async () => {
    const res = await request(app.getHttpServer()).get('/sales-orders');
    expect(res.status).toBe(401);
  });

  it('rejects an order with no items (400)', async () => {
    const res = await request(app.getHttpServer())
      .post('/sales-orders')
      .set(auth())
      .send({ customerId, transportTypeId: authorizedTransportId, items: [] });
    expect(res.status).toBe(400);
  });

  it('rejects an unauthorized transport type (422)', async () => {
    const res = await request(app.getHttpServer())
      .post('/sales-orders')
      .set(auth())
      .send({
        customerId,
        transportTypeId: unauthorizedTransportId,
        items: [{ itemId, quantity: 1 }],
      });
    expect(res.status).toBe(422);
  });

  it('rejects a non-existent item (404)', async () => {
    const res = await request(app.getHttpServer())
      .post('/sales-orders')
      .set(auth())
      .send({
        customerId,
        transportTypeId: authorizedTransportId,
        items: [{ itemId: MISSING_UUID, quantity: 1 }],
      });
    expect(res.status).toBe(404);
  });

  it('creates a valid order in CRIADA and reads it back', async () => {
    const created = await request(app.getHttpServer())
      .post('/sales-orders')
      .set(auth())
      .send({
        customerId,
        transportTypeId: authorizedTransportId,
        items: [{ itemId, quantity: 3 }],
      });
    expect(created.status).toBe(201);
    const body = created.body as { id: string; status: string };
    expect(body.status).toBe('CRIADA');

    const one = await request(app.getHttpServer())
      .get(`/sales-orders/${body.id}`)
      .set(auth());
    expect(one.status).toBe(200);
    const detail = one.body as {
      customer: { id: string };
      transportType: { id: string };
      items: { quantity: number }[];
    };
    expect(detail.customer.id).toBe(customerId);
    expect(detail.transportType.id).toBe(authorizedTransportId);
    expect(detail.items).toHaveLength(1);
    expect(detail.items[0].quantity).toBe(3);
  });
});
