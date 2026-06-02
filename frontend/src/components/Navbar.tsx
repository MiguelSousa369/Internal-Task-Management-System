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

const roleColor: Record<string, string> = {
  Admin: 'bg-primary-100 text-primary-700',
  Tecnico: 'bg-blue-100 text-blue-700',
  Rececionista: 'bg-gray-100 text-gray-600',
};

function initials(nome: string) {
  return nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function Navbar({ user, currentView, setView, isAdmin, onLogout }: Props) {
  const navItem = (view: View, label: string) => (
    <button
      key={view}
      onClick={() => setView(view)}
      className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        currentView === view
          ? 'text-white shadow-md'
          : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
      }`}
    >
      {currentView === view && (
        <span className="absolute inset-0 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #5b068c, #7a0cbf)' }} />
      )}
      <span className="relative">{label}</span>
    </button>
  );

  return (
    <header className="fixed top-0 inset-x-0 z-[60] glass border-b border-gray-100/80"
      style={{ boxShadow: '0 1px 16px rgba(0,0,0,0.06)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">

        {/* Logo */}
        <button onClick={() => setView('tasks')} className="shrink-0 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Litinfor" className="h-7 object-contain" />
        </button>

        <div className="w-px h-5 bg-gray-200 shrink-0" />

        {/* Nav */}
        <nav className="flex items-center gap-1 flex-1">
          {navItem('tasks', 'Tarefas')}
          {navItem('dashboard', 'Dashboard')}
          {navItem('stats', 'Estatísticas')}
          {isAdmin && navItem('users', 'Utilizadores')}
        </nav>

        {/* User */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user.nome}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${roleColor[user.role]}`}>
              {roleLabel[user.role]}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #5b068c, #ff5e00)' }}>
            {initials(user.nome)}
          </div>
          <button onClick={onLogout} className="btn-ghost btn-sm text-gray-500 hover:text-red-600 hover:border-red-200">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
