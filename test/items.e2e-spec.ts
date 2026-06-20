import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/auth/entities/user.entity';
import { UsersService } from './../src/auth/users.service';

describe('Items (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let operatorToken: string;

  const ts = Date.now();
  const adminEmail = `item-admin-${ts}@ovgs.local`;
  const operatorEmail = `item-op-${ts}@ovgs.local`;
  const password = 'e2e-password';
  const sku = `SKU-${ts}`;

  const login = async (email: string): Promise<string> => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    return (res.body as { access_token: string }).access_token;
  };

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('requires authentication to list', async () => {
    const res = await request(app.getHttpServer()).get('/items');
    expect(res.status).toBe(401);
  });

  it('forbids a non-admin from creating', async () => {
    const res = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ sku, name: 'Caixa' });
    expect(res.status).toBe(403);
  });

  it('validates the payload', async () => {
    const res = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku });
    expect(res.status).toBe(400);
  });

  it('creates as admin and reads it back', async () => {
    const created = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku, name: 'Caixa', unit: 'CX' });
    expect(created.status).toBe(201);
    const id = (created.body as { id: string }).id;

    const one = await request(app.getHttpServer())
      .get(`/items/${id}`)
      .set('Authorization', `Bearer ${operatorToken}`);
    expect(one.status).toBe(200);
    expect((one.body as { sku: string }).sku).toBe(sku);
  });

  it('rejects a duplicated SKU with 409', async () => {
    const res = await request(app.getHttpServer())
      .post('/items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sku, name: 'Outra' });
    expect(res.status).toBe(409);
  });
});
