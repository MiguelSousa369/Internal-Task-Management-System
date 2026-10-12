import { useState, useEffect, useRef } from 'react';
import { ClipboardList, Flame, UserX, Wrench, CircleCheck, TriangleAlert, type LucideIcon } from 'lucide-react';
import { getDashboard } from '../api/api';

interface DashboardData {
  abertas: number; urgentes: number; semResponsavel: number;
  emTratamento: number; concluidasHoje: number;
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);
  return count;
}

interface CardProps {
  label: string; value: number; icon: LucideIcon;
  tone: string; delay: number;
}

function StatCard({ label, value, icon: Icon, tone, delay }: CardProps) {
  const count = useCountUp(value);
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${tone}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1 tabular-nums">{count}</p>
      <p className="text-sm text-gray-500 font-medium leading-tight">{label}</p>
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
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="shimmer h-7 w-36 rounded-xl mb-6" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
            <div className="shimmer w-10 h-10 rounded-lg mb-4" />
            <div className="shimmer h-9 w-16 rounded-lg mb-2" />
            <div className="shimmer h-3 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
      <TriangleAlert className="w-4 h-4 shrink-0" /> {error}
    </div>
  );
  if (!data) return null;

  const cards: CardProps[] = [
    { label: 'Tarefas em aberto',     value: data.abertas,         icon: ClipboardList, delay: 0,   tone: 'bg-primary-50 text-primary-600' },
    { label: 'Urgentes por resolver', value: data.urgentes,        icon: Flame,         delay: 60,  tone: 'bg-orange-50 text-accent-500' },
    { label: 'Sem responsável',       value: data.semResponsavel,  icon: UserX,         delay: 120, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Em tratamento',         value: data.emTratamento,    icon: Wrench,        delay: 180, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Concluídas hoje',       value: data.concluidasHoje,  icon: CircleCheck,   delay: 240, tone: 'bg-green-50 text-green-600' },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  );
}
