import { ListTodo, LayoutDashboard, ChartColumn, Users, LogOut, type LucideIcon } from 'lucide-react';
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
  Admin: 'Administrador', Tecnico: 'Técnico', Rececionista: 'Rececionista',
};

function initials(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function Navbar({ user, currentView, setView, isAdmin, onLogout }: Props) {
  const navItem = (view: View, label: string, Icon: LucideIcon) => (
    <button
      key={view}
      onClick={() => setView(view)}
      aria-current={currentView === view ? 'page' : undefined}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
        currentView === view
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden md:inline">{label}</span>
    </button>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-[60] bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <button onClick={() => setView('tasks')} className="shrink-0 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Litinfor" className="h-7 object-contain" />
        </button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {navItem('tasks', 'Tarefas', ListTodo)}
          {navItem('dashboard', 'Dashboard', LayoutDashboard)}
          {navItem('stats', 'Estatísticas', ChartColumn)}
          {isAdmin && navItem('users', 'Utilizadores', Users)}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user.nome}</p>
            <p className="text-xs text-gray-500">{roleLabel[user.role]}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-semibold text-white shrink-0">
            {initials(user.nome)}
          </div>
          <button onClick={onLogout} className="btn-icon hover:text-red-600 hover:bg-red-50" title="Terminar sessão" aria-label="Terminar sessão">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
