import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/auth/entities/user.entity';
import { UsersService } from './../src/auth/users.service';

describe('Customers (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let transportTypeId: string;
  let customerId: string;

  const ts = Date.now();
  const adminEmail = `cust-admin-${ts}@ovgs.local`;
  const password = 'e2e-password';
  const document = `DOC-${ts}`;
  const code = `CTRUCK_${ts}`;

  const auth = () => ({ Authorization: `Bearer ${token}` });

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

    const tt = await request(app.getHttpServer())
      .post('/transport-types')
      .set(auth())
      .send({ name: 'Caminhão', code });
    transportTypeId = (tt.body as { id: string }).id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication', async () => {
    const res = await request(app.getHttpServer()).get('/customers');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/customers')
      .set(auth())
      .send({ name: 'A', document: '123' });
    expect(res.status).toBe(400);
  });

  it('creates a customer with an authorized transport type', async () => {
    const res = await request(app.getHttpServer())
      .post('/customers')
      .set(auth())
      .send({
        name: 'ACME Ltda',
        document,
        authorizedTransportTypeIds: [transportTypeId],
      });
    expect(res.status).toBe(201);
    customerId = (res.body as { id: string }).id;

    const one = await request(app.getHttpServer())
      .get(`/customers/${customerId}`)
      .set(auth());
    expect(one.status).toBe(200);
    const body = one.body as {
      authorizedTransportTypes: { id: string }[];
    };
    expect(body.authorizedTransportTypes.map((t) => t.id)).toContain(
      transportTypeId,
    );
  });

  it('rejects a duplicated document with 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/customers')
      .set(auth())
      .send({ name: 'Outro', document });
    expect(res.status).toBe(409);
  });

  it('replaces the authorized transport list', async () => {
    const cleared = await request(app.getHttpServer())
      .put(`/customers/${customerId}/transport-types`)
      .set(auth())
      .send({ transportTypeIds: [] });
    expect(cleared.status).toBe(200);
    expect(
      (cleared.body as { authorizedTransportTypes: unknown[] })
        .authorizedTransportTypes,
    ).toHaveLength(0);
  });
});
