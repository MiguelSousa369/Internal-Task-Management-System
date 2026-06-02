import { prisma } from '../lib/prisma';

export const getDashboard = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [abertas, urgentes, semResponsavel, emTratamento, concluidasHoje] = await Promise.all([
    prisma.task.count({ where: { estado: { in: ['Novo', 'EmTratamento'] } } }),
    prisma.task.count({ where: { prioridade: 'Urgente', estado: { not: 'Concluido' } } }),
    prisma.task.count({ where: { emTratamentoPorId: null, estado: { not: 'Concluido' } } }),
    prisma.task.count({ where: { estado: 'EmTratamento' } }),
    prisma.task.count({ where: { estado: 'Concluido', dataConclusao: { gte: today } } })
  ]);

  return { abertas, urgentes, semResponsavel, emTratamento, concluidasHoje };
};

export const getStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const tecnicos = await prisma.user.findMany({
    where: { role: 'Tecnico', ativo: true },
    select: { id: true, nome: true }
  });

  const stats = await Promise.all(
    tecnicos.map(async (t) => {
      const [concluidasHoje, concluidasMes] = await Promise.all([
        prisma.task.count({
          where: { emTratamentoPorId: t.id, estado: 'Concluido', dataConclusao: { gte: today } }
        }),
        prisma.task.count({
          where: { emTratamentoPorId: t.id, estado: 'Concluido', dataConclusao: { gte: firstDayOfMonth } }
        })
      ]);
      return { tecnico: t.nome, concluidasHoje, concluidasMes };
    })
  );

  return stats.sort((a, b) => b.concluidasMes - a.concluidasMes);
};
