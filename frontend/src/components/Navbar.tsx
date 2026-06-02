import { User, View } from '../App';
import logo from '../assets/logo.png';

interface Props {
  user: User;
  currentView: View;
  setView: (v: View) => void;
  isAdmin: boolean;
  onLogout: () => void;
}

const roleLabel: Record<string, string> = {
  Admin: 'Admin',
  Tecnico: 'Técnico',
  Rececionista: 'Rececionista',
};

export function Navbar({ user, currentView, setView, isAdmin, onLogout }: Props) {
  const navItem = (view: View, label: string) => (
    <button
      key={view}
      onClick={() => setView(view)}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        currentView === view
          ? 'bg-primary-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        {/* Logo */}
        <button onClick={() => setView('tasks')} className="shrink-0">
          <img src={logo} alt="Litinfor" className="h-7 object-contain" />
        </button>

        {/* Nav items */}
        <nav className="flex items-center gap-1 flex-1">
          {navItem('tasks', 'Tarefas')}
          {isAdmin && navItem('dashboard', 'Dashboard')}
          {isAdmin && navItem('stats', 'Estatísticas')}
          {isAdmin && navItem('users', 'Utilizadores')}
        </nav>

        {/* User info */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-800 leading-tight">{user.nome}</p>
            <p className="text-xs text-gray-400">{roleLabel[user.role]}</p>
          </div>
          <button
            onClick={onLogout}
            className="btn-ghost btn-sm text-gray-500"
            title="Terminar sessão"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
