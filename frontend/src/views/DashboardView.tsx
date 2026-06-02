import { useState, useEffect, useRef } from 'react';
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
  label: string; value: number; emoji: string;
  gradient: string; delay: number; accent?: string;
}

function StatCard({ label, value, emoji, gradient, delay, accent }: CardProps) {
  const count = useCountUp(value);
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-slide-up relative overflow-hidden group cursor-default"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', animationDelay: `${delay}ms` }}>

      {/* Bg glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ background: `${gradient}12` }} />

      {/* Icon circle */}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4 relative"
        style={{ background: gradient, boxShadow: `0 4px 14px ${accent ?? 'rgba(91,6,140,0.3)'}` }}>
        {emoji}
      </div>

      {/* Value */}
      <p className="text-4xl font-black text-gray-900 mb-1 tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {count}
      </p>

      {/* Label */}
      <p className="text-sm text-gray-500 font-medium leading-tight">{label}</p>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: gradient }} />
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
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div className="shimmer w-11 h-11 rounded-xl mb-4" />
            <div className="shimmer h-9 w-16 rounded-lg mb-2" />
            <div className="shimmer h-3 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">⚠️ {error}</div>
  );
  if (!data) return null;

  const cards: CardProps[] = [
    { label: 'Tarefas em aberto',     value: data.abertas,         emoji: '📋', delay: 0,   gradient: 'linear-gradient(135deg, #5b068c, #7a0cbf)', accent: 'rgba(91,6,140,0.3)' },
    { label: 'Urgentes por resolver', value: data.urgentes,        emoji: '🔥', delay: 80,  gradient: 'linear-gradient(135deg, #ff5e00, #ff7a2e)', accent: 'rgba(255,94,0,0.3)' },
    { label: 'Sem responsável',        value: data.semResponsavel, emoji: '⚠️', delay: 160, gradient: 'linear-gradient(135deg, #d97706, #f59e0b)', accent: 'rgba(217,119,6,0.3)' },
    { label: 'Em tratamento',          value: data.emTratamento,   emoji: '🔧', delay: 240, gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', accent: 'rgba(37,99,235,0.3)' },
    { label: 'Concluídas hoje',        value: data.concluidasHoje, emoji: '✅', delay: 320, gradient: 'linear-gradient(135deg, #16a34a, #22c55e)', accent: 'rgba(22,163,74,0.3)' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="h-1 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, #5b068c20, transparent)' }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>
    </div>
  );
}
