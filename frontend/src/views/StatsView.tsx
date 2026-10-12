import { useState, useEffect } from 'react';
import { Trophy, ChartColumn, TriangleAlert } from 'lucide-react';
import { getStats } from '../api/api';

interface StatRow { tecnico: string; concluidasHoje: number; concluidasMes: number; }

// Ouro, prata e bronze para os três primeiros.
const podiumTone = [
  'bg-amber-50 text-amber-500 border-amber-200',
  'bg-gray-50 text-gray-400 border-gray-200',
  'bg-orange-50 text-orange-700 border-orange-200',
];

export function StatsView({ token: _token }: { token: string }) {
  const [stats, setStats] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    getStats()
      .then(data => { setStats(data); setTimeout(() => setAnimated(true), 100); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="shimmer h-7 w-52 rounded-xl mb-6" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-5 py-4 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-4">
              <div className="shimmer w-8 h-8 rounded-xl shrink-0" />
              <div className="shimmer h-4 w-32 rounded-lg flex-1" />
              <div className="shimmer h-5 w-24 rounded-full" />
              <div className="shimmer h-6 w-16 rounded-lg" />
            </div>
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

  const maxMes = Math.max(...stats.map(s => s.concluidasMes), 1);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Estatísticas</h1>

      {stats.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <ChartColumn className="w-12 h-12 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
          <p className="text-gray-500 font-medium">Sem dados disponíveis</p>
          <p className="text-gray-400 text-sm mt-1">As estatísticas aparecem quando existirem tarefas concluídas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map((row, i) => {
            const pct = maxMes > 0 ? Math.round((row.concluidasMes / maxMes) * 100) : 0;
            const isTop3 = i < 3 && row.concluidasMes > 0;

            return (
              <div key={row.tecnico}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}>

                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${isTop3 ? podiumTone[i] : 'bg-gray-50 border-gray-200'}`}
                    title={`${i + 1}º lugar`}>
                    {isTop3
                      ? <Trophy className="w-5 h-5" />
                      : <span className="text-sm font-semibold text-gray-500">{i + 1}º</span>}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm text-gray-800">
                        {row.tecnico}
                      </p>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 leading-none mb-0.5">Hoje</p>
                          <p className="text-sm font-bold text-gray-700">{row.concluidasHoje}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 leading-none mb-0.5">Este mês</p>
                          <p className="text-xl font-bold text-gray-900 tabular-nums">{row.concluidasMes}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary-600"
                        style={{
                          width: animated ? `${pct}%` : '0%',
                          transition: `width 0.7s ease-out ${i * 0.05}s`,
                        }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
