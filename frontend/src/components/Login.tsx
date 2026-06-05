import { useState } from 'react';
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
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg, #0f0020 0%, #1a003a 30%, #2d0060 60%, #1a0030 100%)' }}>

      {/* Floating orbs */}
      <div className="orb animate-float"
        style={{ width: 520, height: 520, background: 'radial-gradient(circle, #5b068c 0%, transparent 70%)', top: '-120px', right: '-120px', opacity: 0.45 }} />
      <div className="orb animate-float-slow"
        style={{ width: 380, height: 380, background: 'radial-gradient(circle, #ff5e00 0%, transparent 70%)', bottom: '-80px', left: '-80px', opacity: 0.35, animationDelay: '-4s' }} />
      <div className="orb animate-float-fast"
        style={{ width: 240, height: 240, background: 'radial-gradient(circle, #7a0cbf 0%, transparent 70%)', top: '40%', left: '20%', opacity: 0.3, animationDelay: '-2s' }} />
      <div className="orb animate-float"
        style={{ width: 160, height: 160, background: 'radial-gradient(circle, #ff7a2e 0%, transparent 70%)', top: '20%', right: '25%', opacity: 0.25, animationDelay: '-6s' }} />

      {/* Card */}
      <div className="relative w-full max-w-sm animate-bounce-in z-10">
        <div className="glass rounded-3xl p-8 shadow-modal">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-40"
                style={{ background: 'linear-gradient(135deg, #5b068c, #ff5e00)' }} />
              <img src={logo} alt="Litinfor" className="relative h-9 object-contain" />
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo</h1>
            <p className="text-sm text-gray-500">Inicia sessão para continuar</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2 animate-scale-in">
              <span className="text-red-500 shrink-0">⚠</span>
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
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />A entrar...</>
                : 'Entrar →'
              }
            </button>
          </form>
        </div>

        <p className="text-center text-white/25 text-xs mt-5">
          Litinfor © {new Date().getFullYear()} — Uso interno
        </p>
      </div>
    </div>
  );
}
