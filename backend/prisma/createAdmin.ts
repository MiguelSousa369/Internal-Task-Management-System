import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const nome = process.env.ADMIN_NOME;
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!nome || !username || !password) {
    console.error('Uso: ADMIN_NOME="Nome" ADMIN_USERNAME="username" ADMIN_PASSWORD="pass" npm run create-admin');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Erro: a password deve ter pelo menos 6 caracteres.');
    process.exit(1);
  }

  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    console.error(`Erro: já existe um utilizador com o username "${username}".`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: { nome, username, passwordHash, role: 'Admin' },
    select: { id: true, nome: true, username: true, role: true }
  });

  console.log('Admin criado com sucesso:');
  console.log(`  ID:       ${admin.id}`);
  console.log(`  Nome:     ${admin.nome}`);
  console.log(`  Username: ${admin.username}`);
  console.log(`  Role:     ${admin.role}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
