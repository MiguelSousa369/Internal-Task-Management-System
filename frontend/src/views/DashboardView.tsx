import { useState, useEffect } from 'react';
import { getDashboard } from '../api/api';

interface DashboardData {
  abertas: number;
  urgentes: number;
  semResponsavel: number;
  emTratamento: number;
  concluidasHoje: number;
}

interface StatCardProps {
  label: string;
  value: number;
  emoji: string;
  color: string;
  delay: number;
}

function StatCard({ label, value, emoji, color, delay }: StatCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-slide-up ${color}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function DashboardView({ token: _token }: { token: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">A carregar...</div>;
  if (error) return <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>;
  if (!data) return null;

  const cards = [
    { label: 'Tarefas em aberto',   value: data.abertas,         emoji: '📋', color: 'border-t-4 border-t-primary-500', delay: 0   },
    { label: 'Urgentes por resolver', value: data.urgentes,       emoji: '🔥', color: 'border-t-4 border-t-accent-500',  delay: 60  },
    { label: 'Sem responsável',       value: data.semResponsavel, emoji: '⚠️', color: 'border-t-4 border-t-yellow-400',  delay: 120 },
    { label: 'Em tratamento',         value: data.emTratamento,   emoji: '🔧', color: 'border-t-4 border-t-blue-400',    delay: 180 },
    { label: 'Concluídas hoje',       value: data.concluidasHoje, emoji: '✅', color: 'border-t-4 border-t-green-500',   delay: 240 },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  );
}
