import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const nome = process.env.ADMIN_NOME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!nome || !email || !password) {
    console.error('Uso: ADMIN_NOME="Nome" ADMIN_EMAIL="email" ADMIN_PASSWORD="pass" npm run create-admin');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Erro: a password deve ter pelo menos 6 caracteres.');
    process.exit(1);
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.error(`Erro: já existe um utilizador com o email "${email}".`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.user.create({
    data: { nome, email, passwordHash, role: 'Admin' },
    select: { id: true, nome: true, email: true, role: true }
  });

  console.log('Admin criado com sucesso:');
  console.log(`  ID:    ${admin.id}`);
  console.log(`  Nome:  ${admin.nome}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Role:  ${admin.role}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
