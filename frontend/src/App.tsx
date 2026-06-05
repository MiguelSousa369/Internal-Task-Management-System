import { useState } from 'react';
import { Login } from './components/Login';
import { Navbar } from './components/Navbar';
import { TasksView } from './views/TasksView';
import { DashboardView } from './views/DashboardView';
import { StatsView } from './views/StatsView';
import { UsersView } from './views/UsersView';

export interface User {
  id: number;
  nome: string;
  username: string;
  role: 'Admin' | 'Tecnico' | 'Rececionista';
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
  user: { id: number; nome: string };
}

export type View = 'tasks' | 'dashboard' | 'stats' | 'users';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [view, setView] = useState<View>('tasks');

  const handleLogin = (t: string, u: User) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!user || !token) {
    return <Login onSuccess={handleLogin} />;
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
        onLogout={handleLogout}
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
