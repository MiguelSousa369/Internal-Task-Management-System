import { useState } from 'react';
import { login } from '../api/api';
import { User } from '../App';
import logo from '../assets/logo.png';

interface Props {
  onSuccess: (token: string, user: User) => void;
}

export function Login({ onSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      onSuccess(res.token, res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-700 to-primary-600 p-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Litinfor" className="h-10 object-contain" />
          </div>

          <h1 className="text-xl font-semibold text-gray-800 text-center mb-1">
            Gestão de Tarefas
          </h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Inicia sessão para continuar
          </p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="email@empresa.pt"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Litinfor © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
