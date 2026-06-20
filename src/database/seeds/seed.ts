import { NestFactory } from '@nestjs/core';
import { UserRole } from '../../auth/entities/user.entity';
import { UsersService } from '../../auth/users.service';
import { AppModule } from '../../app.module';

/**
 * Seed idempotente: cria (uma vez) o usuário administrador inicial.
 * Requer o banco no ar e as migrations aplicadas. Uso: `npm run seed`.
 */
async function run(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const users = app.get(UsersService);
    const email = process.env.ADMIN_EMAIL ?? 'admin@ovgs.local';
    const password = process.env.ADMIN_PASSWORD ?? 'admin12345';

    const existing = await users.findByEmail(email);
    if (existing) {
      console.log(`Admin user already exists: ${email}`);
    } else {
      await users.create({ email, password, role: UserRole.Admin });
      console.log(`Admin user created: ${email}`);
    }
  } finally {
    await app.close();
  }
}

void run();
