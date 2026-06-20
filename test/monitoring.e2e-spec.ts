import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/auth/entities/user.entity';
import { UsersService } from './../src/auth/users.service';

interface Page {
  data: { id: string }[];
  total: number;
  page: number;
  limit: number;
}

describe('Monitoring / sales-order queries (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let customerId: string;
  let transportId: string;
  let orderId: string;

  const ts = Date.now();
  const adminEmail = `mon-admin-${ts}@ovgs.local`;
  const password = 'e2e-password';

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
    token = (
      (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: adminEmail, password })
      ).body as { access_token: string }
    ).access_token;

    transportId = idOf(
      await request(app.getHttpServer())
        .post('/transport-types')
        .set(auth())
        .send({ name: 'Caminhão', code: `MON_${ts}` }),
    );
    const itemId = idOf(
      await request(app.getHttpServer())
        .post('/items')
        .set(auth())
        .send({ sku: `MON_SKU_${ts}`, name: 'Caixa' }),
    );
    customerId = idOf(
      await request(app.getHttpServer())
        .post('/customers')
        .set(auth())
        .send({
          name: 'ACME',
          document: `${ts}`,
          authorizedTransportTypeIds: [transportId],
        }),
    );
    orderId = idOf(
      await request(app.getHttpServer())
        .post('/sales-orders')
        .set(auth())
        .send({
          customerId,
          transportTypeId: transportId,
          items: [{ itemId, quantity: 1 }],
        }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns a paginated envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/sales-orders')
      .set(auth());
    expect(res.status).toBe(200);
    const body = res.body as Page;
    expect(Array.isArray(body.data)).toBe(true);
    expect(typeof body.total).toBe('number');
    expect(body.page).toBe(1);
    expect(body.limit).toBe(20);
  });

  it('filters by customer (deterministic)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/sales-orders?customerId=${customerId}`)
      .set(auth());
    expect(res.status).toBe(200);
    const body = res.body as Page;
    expect(body.total).toBe(1);
    expect(body.data[0].id).toBe(orderId);
  });

  it('combines customer + status filters', async () => {
    const res = await request(app.getHttpServer())
      .get(`/sales-orders?customerId=${customerId}&status=ENTREGUE`)
      .set(auth());
    expect(res.status).toBe(200);
    expect((res.body as Page).total).toBe(0);
  });

  it('respects pagination params', async () => {
    const res = await request(app.getHttpServer())
      .get(`/sales-orders?customerId=${customerId}&page=1&limit=1`)
      .set(auth());
    expect(res.status).toBe(200);
    const body = res.body as Page;
    expect(body.limit).toBe(1);
    expect(body.data.length).toBeLessThanOrEqual(1);
  });

  it('rejects an invalid status filter (400)', async () => {
    const res = await request(app.getHttpServer())
      .get('/sales-orders?status=VOANDO')
      .set(auth());
    expect(res.status).toBe(400);
  });
});
