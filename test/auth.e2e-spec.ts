import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from './../src/auth/entities/user.entity';
import { UsersService } from './../src/auth/users.service';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const email = `e2e-${Date.now()}@ovgs.local`;
  const password = 'e2e-password';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    await app
      .get(UsersService)
      .create({ email, password, role: UserRole.Admin });
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects an invalid password with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('rejects a malformed login body with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
  });

  it('issues a token and authorizes /auth/me', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });

    expect(login.status).toBe(200);
    const token = (login.body as { access_token: string }).access_token;
    expect(typeof token).toBe('string');

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect((me.body as { email: string }).email).toBe(email);
    expect((me.body as { role: string }).role).toBe(UserRole.Admin);
  });

  it('blocks /auth/me without a token', async () => {
    const res = await request(app.getHttpServer()).get('/auth/me');
    expect(res.status).toBe(401);
  });
});
