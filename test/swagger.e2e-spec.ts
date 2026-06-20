import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupSwagger } from './../src/swagger';

interface OpenApiDoc {
  openapi: string;
  paths: Record<string, unknown>;
}

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves the OpenAPI JSON publicly with the documented paths', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json');
    expect(res.status).toBe(200);
    const doc = res.body as OpenApiDoc;
    expect(doc.openapi).toBeDefined();
    expect(Object.keys(doc.paths)).toContain('/sales-orders');
    expect(Object.keys(doc.paths)).toContain('/auth/login');
  });
});
