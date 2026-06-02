import { useState, useEffect } from 'react';
import { getStats } from '../api/api';

interface StatRow {
  tecnico: string;
  concluidasHoje: number;
  concluidasMes: number;
}

const medals = ['🥇', '🥈', '🥉'];

export function StatsView({ token: _token }: { token: string }) {
  const [stats, setStats] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">A carregar...</div>;
  if (error) return <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-6">Estatísticas de Produtividade</h1>

      {stats.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm">Sem dados disponíveis.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-8">#</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Técnico</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Hoje</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">Este mês</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.map((row, i) => (
                <tr key={row.tecnico} className="hover:bg-gray-50 transition-colors animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <td className="px-5 py-4 text-lg">{medals[i] ?? `${i + 1}º`}</td>
                  <td className="px-5 py-4 font-medium text-gray-800">{row.tecnico}</td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-semibold text-primary-600">{row.concluidasHoje}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-bold text-gray-800 text-base">{row.concluidasMes}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
