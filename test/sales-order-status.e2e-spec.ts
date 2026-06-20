import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/auth/entities/user.entity';
import { UsersService } from './../src/auth/users.service';

describe('SalesOrder status transitions (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let orderId: string;

  const ts = Date.now();
  const adminEmail = `sos-admin-${ts}@ovgs.local`;
  const password = 'e2e-password';

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: request.Response) => (res.body as { id: string }).id;
  const patchStatus = (status: string) =>
    request(app.getHttpServer())
      .patch(`/sales-orders/${orderId}/status`)
      .set(auth())
      .send({ status });

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

    const transportId = idOf(
      await request(app.getHttpServer())
        .post('/transport-types')
        .set(auth())
        .send({ name: 'Caminhão', code: `SOS_${ts}` }),
    );
    const itemId = idOf(
      await request(app.getHttpServer())
        .post('/items')
        .set(auth())
        .send({ sku: `SOS_SKU_${ts}`, name: 'Caixa' }),
    );
    const customerId = idOf(
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

    // AGENDADA exige um agendamento confirmado.
    await request(app.getHttpServer())
      .put(`/sales-orders/${orderId}/schedule`)
      .set(auth())
      .send({
        deliveryDate: '2999-01-01',
        windowStart: '08:00',
        windowEnd: '12:00',
      });
    await request(app.getHttpServer())
      .post(`/sales-orders/${orderId}/schedule/confirm`)
      .set(auth())
      .send();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an invalid status value (400)', async () => {
    const res = await patchStatus('VOANDO');
    expect(res.status).toBe(400);
  });

  it('rejects an out-of-sequence transition (409)', async () => {
    const res = await patchStatus('ENTREGUE');
    expect(res.status).toBe(409);
  });

  it('walks the full valid sequence', async () => {
    for (const next of ['PLANEJADA', 'AGENDADA', 'EM_TRANSPORTE', 'ENTREGUE']) {
      const res = await patchStatus(next);
      expect(res.status).toBe(200);
      expect((res.body as { status: string }).status).toBe(next);
    }
  });

  it('rejects any transition out of the terminal state (409)', async () => {
    const res = await patchStatus('PLANEJADA');
    expect(res.status).toBe(409);
  });
});
