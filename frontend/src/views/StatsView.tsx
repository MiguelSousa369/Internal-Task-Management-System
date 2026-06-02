import { useState, useEffect } from 'react';
import { getStats } from '../api/api';

interface StatRow { tecnico: string; concluidasHoje: number; concluidasMes: number; }

const medals = ['🥇', '🥈', '🥉'];
const podiumGradient = [
  'linear-gradient(135deg, #f59e0b, #fbbf24)',
  'linear-gradient(135deg, #6b7280, #9ca3af)',
  'linear-gradient(135deg, #b45309, #d97706)',
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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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
    <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">⚠️ {error}</div>
  );

  const maxMes = Math.max(...stats.map(s => s.concluidasMes), 1);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Estatísticas</h1>
        <div className="h-1 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, #5b068c20, transparent)' }} />
      </div>

      {stats.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-gray-500 font-medium">Sem dados disponíveis</p>
          <p className="text-gray-400 text-sm mt-1">As estatísticas aparecem quando existirem tarefas concluídas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map((row, i) => {
            const pct = maxMes > 0 ? Math.round((row.concluidasMes / maxMes) * 100) : 0;
            const isTop3 = i < 3;

            return (
              <div key={row.tecnico}
                className="bg-white rounded-2xl border border-gray-100 p-5 animate-slide-up relative overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)', animationDelay: `${i * 60}ms` }}>

                {/* Top 3 accent */}
                {isTop3 && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                    style={{ background: podiumGradient[i] }} />
                )}

                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${isTop3 ? '' : 'bg-gray-100'}`}
                    style={isTop3 ? { background: podiumGradient[i], boxShadow: '0 4px 12px rgba(0,0,0,0.15)' } : {}}>
                    {isTop3 ? medals[i] : <span className="text-sm font-bold text-gray-500">{i + 1}º</span>}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className={`font-semibold text-sm ${i === 0 ? 'gradient-text' : 'text-gray-800'}`}>
                        {row.tecnico}
                      </p>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-gray-400 leading-none mb-0.5">Hoje</p>
                          <p className="text-sm font-bold text-gray-700">{row.concluidasHoje}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 leading-none mb-0.5">Este mês</p>
                          <p className={`text-xl font-black ${i === 0 ? 'gradient-text' : 'text-gray-800'}`}>{row.concluidasMes}</p>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: animated ? `${pct}%` : '0%',
                          background: i === 0
                            ? 'linear-gradient(90deg, #5b068c, #ff5e00)'
                            : i === 1
                              ? 'linear-gradient(90deg, #5b068c, #7a0cbf)'
                              : 'linear-gradient(90deg, #7a0cbf, #9452d0)',
                          transition: `width ${0.8 + i * 0.1}s cubic-bezier(0.34,1.2,0.64,1) ${i * 0.08}s`,
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
