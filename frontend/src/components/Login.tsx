import { useState } from 'react';
import { CircleAlert, LoaderCircle, ArrowRight } from 'lucide-react';
import { login } from '../api/api';
import { User } from '../App';
import logo from '../assets/logo.png';

interface Props {
  onSuccess: (token: string, user: User) => void;
}

export function Login({ onSuccess }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      onSuccess(res.token, res.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1a0030 0%, #2d0060 55%, #3b0a5c 100%)' }}>

      {/* Card */}
      <div className="w-full max-w-sm animate-scale-in">
        <div className="bg-white rounded-2xl p-8 shadow-modal">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src={logo} alt="Litinfor" className="h-9 object-contain" />
          </div>

          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">Gestão de Tarefas</h1>
            <p className="text-sm text-gray-500">Inicia sessão para continuar</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2 animate-scale-in">
              <CircleAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
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

            <button type="submit" className="btn-primary w-full mt-2 py-2.5 text-base" disabled={loading}>
              {loading
                ? <><LoaderCircle className="w-4 h-4 animate-spin" /> A entrar...</>
                : <>Entrar <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-xs mt-5">
          Litinfor © {new Date().getFullYear()} — Uso interno
        </p>
      </div>
    </div>
  );
}
