import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('A limpar dados existentes...');
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  console.log('A criar utilizadores...');
  const [admin, joao, pedro, recepcao] = await Promise.all([
    prisma.user.create({
      data: {
        nome: 'Administrador',
        username: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'Admin'
      }
    }),
    prisma.user.create({
      data: {
        nome: 'João Silva',
        username: 'joao',
        passwordHash: await bcrypt.hash('joao123', 10),
        role: 'Tecnico'
      }
    }),
    prisma.user.create({
      data: {
        nome: 'Pedro Costa',
        username: 'pedro',
        passwordHash: await bcrypt.hash('pedro123', 10),
        role: 'Tecnico'
      }
    }),
    prisma.user.create({
      data: {
        nome: 'Ana Receção',
        username: 'recepcao',
        passwordHash: await bcrypt.hash('recepcao123', 10),
        role: 'Rececionista'
      }
    })
  ]);

  console.log('A criar tarefas de exemplo...');
  const task1 = await prisma.task.create({
    data: {
      descricao: 'Cliente não consegue abrir o software de faturação. Aparece erro na inicialização.',
      cliente: 'Padaria Central Lda.',
      contacto: '912 345 678',
      prioridade: 'Urgente',
      estado: 'EmTratamento',
      criadoPorId: recepcao.id,
      tecnicoSolicitadoId: joao.id,
      emTratamentoPorId: joao.id
    }
  });

  const task2 = await prisma.task.create({
    data: {
      descricao: 'A impressora da receção deixou de funcionar depois de atualização do Windows.',
      cliente: 'Clínica Saúde Total',
      contacto: '961 234 567',
      prioridade: 'Normal',
      estado: 'Novo',
      criadoPorId: recepcao.id
    }
  });

  const task3 = await prisma.task.create({
    data: {
      descricao: 'Instalação do sistema operativo e aplicações no novo computador do departamento de RH.',
      cliente: 'GestorRH Soluções S.A.',
      contacto: '253 789 456',
      prioridade: 'Normal',
      estado: 'EmTratamento',
      criadoPorId: recepcao.id,
      emTratamentoPorId: pedro.id
    }
  });

  await prisma.task.create({
    data: {
      descricao: 'O email profissional deixou de sincronizar no iPhone após atualização do iOS.',
      cliente: 'João Ferreira',
      contacto: '934 567 890',
      prioridade: 'Normal',
      estado: 'Novo',
      criadoPorId: recepcao.id
    }
  });

  await prisma.task.create({
    data: {
      descricao: 'Trabalhador em teletrabalho não consegue aceder aos recursos internos via VPN.',
      cliente: 'Construtora Norte Lda.',
      contacto: '222 345 678',
      prioridade: 'Urgente',
      estado: 'Concluido',
      criadoPorId: recepcao.id,
      emTratamentoPorId: joao.id,
      dataConclusao: new Date()
    }
  });

  console.log('A criar comentários...');
  await prisma.taskComment.createMany({
    data: [
      {
        taskId: task1.id,
        userId: joao.id,
        comentario: 'Já entrei em contacto com o cliente. Parece ser um problema de licença expirada.'
      },
      {
        taskId: task1.id,
        userId: joao.id,
        comentario: 'A aguardar resposta do fornecedor do software para renovar a licença.'
      },
      {
        taskId: task2.id,
        userId: recepcao.id,
        comentario: 'Cliente ficou de ligar amanhã de manhã para agendar visita.'
      },
      {
        taskId: task3.id,
        userId: pedro.id,
        comentario: 'Sistema operativo já instalado. A instalar aplicações de escritório.'
      }
    ]
  });

  console.log('\nSeed concluído com sucesso!\n');
  console.log('Utilizadores criados:');
  console.log(`  Admin        | admin     | admin123`);
  console.log(`  Técnico      | joao      | joao123`);
  console.log(`  Técnico      | pedro     | pedro123`);
  console.log(`  Rececionista | recepcao  | recepcao123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
