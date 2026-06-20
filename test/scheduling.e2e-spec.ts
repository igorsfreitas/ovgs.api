import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/auth/entities/user.entity';
import { UsersService } from './../src/auth/users.service';

describe('Scheduling (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let orderId: string;

  const ts = Date.now();
  const adminEmail = `sch-admin-${ts}@ovgs.local`;
  const password = 'e2e-password';
  const futureDate = '2999-01-01';

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: request.Response) => (res.body as { id: string }).id;
  const setStatus = (status: string) =>
    request(app.getHttpServer())
      .patch(`/sales-orders/${orderId}/status`)
      .set(auth())
      .send({ status });
  const schedule = (path = '') =>
    request(app.getHttpServer()).post(
      `/sales-orders/${orderId}/schedule${path}`,
    );

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
        .send({ name: 'Caminhão', code: `SCH_${ts}` }),
    );
    const itemId = idOf(
      await request(app.getHttpServer())
        .post('/items')
        .set(auth())
        .send({ sku: `SCH_SKU_${ts}`, name: 'Caixa' }),
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
    await setStatus('PLANEJADA');
  });

  afterAll(async () => {
    await app.close();
  });

  it('blocks AGENDADA before any schedule (422)', async () => {
    const res = await setStatus('AGENDADA');
    expect(res.status).toBe(422);
  });

  it('defines a schedule in PENDING', async () => {
    const res = await request(app.getHttpServer())
      .put(`/sales-orders/${orderId}/schedule`)
      .set(auth())
      .send({
        deliveryDate: futureDate,
        windowStart: '08:00',
        windowEnd: '12:00',
      });
    expect(res.status).toBe(200);
    expect((res.body as { status: string }).status).toBe('PENDING');
  });

  it('still blocks AGENDADA while the schedule is not confirmed (422)', async () => {
    const res = await setStatus('AGENDADA');
    expect(res.status).toBe(422);
  });

  it('confirms the schedule and then allows AGENDADA', async () => {
    const confirm = await schedule('/confirm').set(auth()).send();
    expect(confirm.status).toBe(200);
    expect((confirm.body as { status: string }).status).toBe('CONFIRMED');

    const agendada = await setStatus('AGENDADA');
    expect(agendada.status).toBe(200);
    expect((agendada.body as { status: string }).status).toBe('AGENDADA');
  });

  it('reschedules back to PENDING', async () => {
    const res = await schedule('/reschedule').set(auth()).send({
      deliveryDate: futureDate,
      windowStart: '14:00',
      windowEnd: '18:00',
    });
    expect(res.status).toBe(200);
    expect((res.body as { status: string }).status).toBe('PENDING');
  });

  it('rejects an invalid window (422)', async () => {
    const res = await request(app.getHttpServer())
      .put(`/sales-orders/${orderId}/schedule`)
      .set(auth())
      .send({
        deliveryDate: futureDate,
        windowStart: '18:00',
        windowEnd: '09:00',
      });
    expect(res.status).toBe(422);
  });

  it('reads the current schedule', async () => {
    const res = await request(app.getHttpServer())
      .get(`/sales-orders/${orderId}/schedule`)
      .set(auth());
    expect(res.status).toBe(200);
  });
});
