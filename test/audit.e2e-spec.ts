import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/auth/entities/user.entity';
import { UsersService } from './../src/auth/users.service';

interface AuditPage {
  data: { action: string; entityId: string; actor: string | null }[];
  total: number;
}

describe('Audit (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let operatorToken: string;
  let orderId: string;

  const ts = Date.now();
  const adminEmail = `aud-admin-${ts}@ovgs.local`;
  const operatorEmail = `aud-op-${ts}@ovgs.local`;
  const password = 'e2e-password';

  const idOf = (res: request.Response) => (res.body as { id: string }).id;
  const login = async (email: string): Promise<string> =>
    (
      (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password })
      ).body as { access_token: string }
    ).access_token;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    const users = app.get(UsersService);
    await users.create({ email: adminEmail, password, role: UserRole.Admin });
    await users.create({
      email: operatorEmail,
      password,
      role: UserRole.Operator,
    });
    adminToken = await login(adminEmail);
    operatorToken = await login(operatorEmail);

    const headers = { Authorization: `Bearer ${adminToken}` };
    const transportId = idOf(
      await request(app.getHttpServer())
        .post('/transport-types')
        .set(headers)
        .send({ name: 'Caminhão', code: `AUD_${ts}` }),
    );
    const itemId = idOf(
      await request(app.getHttpServer())
        .post('/items')
        .set(headers)
        .send({ sku: `AUD_SKU_${ts}`, name: 'Caixa' }),
    );
    const customerId = idOf(
      await request(app.getHttpServer())
        .post('/customers')
        .set(headers)
        .send({
          name: 'ACME',
          document: `${ts}`,
          authorizedTransportTypeIds: [transportId],
        }),
    );
    orderId = idOf(
      await request(app.getHttpServer())
        .post('/sales-orders')
        .set(headers)
        .send({
          customerId,
          transportTypeId: transportId,
          items: [{ itemId, quantity: 1 }],
        }),
    );
    // gera um evento de mudança de status
    await request(app.getHttpServer())
      .patch(`/sales-orders/${orderId}/status`)
      .set(headers)
      .send({ status: 'PLANEJADA' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('forbids non-admins from reading the audit trail (403)', async () => {
    const res = await request(app.getHttpServer())
      .get('/audit')
      .set('Authorization', `Bearer ${operatorToken}`);
    expect(res.status).toBe(403);
  });

  it('records the order creation with the actor', async () => {
    const res = await request(app.getHttpServer())
      .get(`/audit?entityId=${orderId}&action=SALES_ORDER_CREATED`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const body = res.body as AuditPage;
    expect(body.total).toBe(1);
    expect(body.data[0].actor).toBe(adminEmail);
  });

  it('records the status change', async () => {
    const res = await request(app.getHttpServer())
      .get(`/audit?entityId=${orderId}&action=SALES_ORDER_STATUS_CHANGED`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect((res.body as AuditPage).total).toBe(1);
  });
});
