import { useEffect, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from './api/api';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { TasksView } from './views/TasksView';
import { DashboardView } from './views/DashboardView';
import { StatsView } from './views/StatsView';
import { UsersView } from './views/UsersView';
import { TvMode } from './views/TvMode';

export interface User {
  id: number;
  nome: string;
  username: string;
  role: 'Admin' | 'Tecnico' | 'Rececionista' | 'TV';
  ativo: boolean;
}

export interface Task {
  id: number;
  descricao?: string;
  cliente: string;
  contacto?: string;
  prioridade: 'Normal' | 'Urgente';
  estado: 'Novo' | 'EmTratamento' | 'Concluido';
  criadoPor: { id: number; nome: string };
  tecnicoSolicitado?: { id: number; nome: string } | null;
  emTratamentoPor?: { id: number; nome: string } | null;
  dataCriacao: string;
  dataConclusao?: string | null;
  updatedAt: string;
  comentarios?: TaskComment[];
}

export interface TaskComment {
  id: number;
  taskId: number;
  comentario: string;
  dataCriacao: string;
  editadoEm?: string | null;
  user: { id: number; nome: string };
}

export type View = 'tasks' | 'dashboard' | 'stats' | 'users';

// O modo TV tem o seu endereço (/#tv), para uma TV poder abrir diretamente nele.
const TV_HASH = '#tv';
function setTvHash(on: boolean) {
  history.replaceState(null, '', on ? TV_HASH : window.location.pathname + window.location.search);
}

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [view, setView] = useState<View>('tasks');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [tvMode, setTvMode] = useState(() => window.location.hash === TV_HASH);

  const openTvMode = (on: boolean) => {
    setTvHash(on);
    setTvMode(on);
  };

  // Escrever /#tv na barra de endereço com a app já aberta também entra no modo TV.
  useEffect(() => {
    const onHash = () => setTvMode(window.location.hash === TV_HASH);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleLogin = (t: string, u: User) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setSessionExpired(false);
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('tasks');
  };

  // A sessão expirou (24h sem uso) ou o utilizador foi desativado: volta ao login com o aviso.
  useEffect(() => {
    const onExpired = () => {
      handleLogout();
      setSessionExpired(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  if (!user || !token) {
    return <Login onSuccess={handleLogin} notice={sessionExpired ? 'A sessão expirou. Inicia sessão novamente.' : undefined} />;
  }

  // Perfil TV: só o modo TV, e "sair" termina a sessão.
  if (user.role === 'TV') {
    return <TvMode isTvUser onExit={() => { openTvMode(false); handleLogout(); }} />;
  }
  if (tvMode) {
    return <TvMode isTvUser={false} onExit={() => openTvMode(false)} />;
  }

  const isAdmin = user.role === 'Admin';
  const isTecnico = user.role === 'Tecnico' || isAdmin;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={user}
        currentView={view}
        setView={setView}
        isAdmin={isAdmin}
        onLogout={() => { openTvMode(false); handleLogout(); }}
        onTvMode={() => {
          // O ecrã inteiro precisa deste clique; o modo TV funciona sem ele.
          void document.documentElement.requestFullscreen?.().catch(() => undefined);
          openTvMode(true);
        }}
      />
      <main className="max-w-6xl mx-auto px-4 py-6 pt-20">
        {view === 'tasks'     && <TasksView user={user} token={token} isAdmin={isAdmin} isTecnico={isTecnico} />}
        {view === 'dashboard' && <DashboardView token={token} />}
        {view === 'stats'     && <StatsView token={token} />}
        {view === 'users'     && <UsersView token={token} />}
      </main>
    </div>
  );
}

export default App;
