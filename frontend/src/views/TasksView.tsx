import { useState, useEffect, useCallback, useRef } from 'react';
import { Flame, Inbox, Wrench, CircleCheck, Search, ChevronDown, Plus, TriangleAlert, type LucideIcon } from 'lucide-react';
import { getTasks } from '../api/api';
import { Task, User } from '../App';
import { TaskCard } from '../components/TaskCard';
import { TaskDetail } from '../components/TaskDetail';
import { CreateTask } from '../components/CreateTask';

interface Props {
  user: User;
  token: string;
  isAdmin: boolean;
  isTecnico: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 border-l-[3px] border-l-gray-200 p-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex gap-2 mb-3">
        <div className="shimmer h-5 w-20 rounded-full" />
        <div className="shimmer h-5 w-24 rounded-full" />
      </div>
      <div className="shimmer h-4 w-full rounded-lg mb-1.5" />
      <div className="shimmer h-4 w-3/4 rounded-lg mb-3" />
      <div className="shimmer h-3 w-1/2 rounded-lg mb-1" />
      <div className="pt-2.5 mt-2 border-t border-gray-50">
        <div className="shimmer h-3 w-28 rounded-lg" />
      </div>
    </div>
  );
}

interface SectionProps {
  icon: LucideIcon;
  iconClass: string;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  empty: boolean;
}

function Section({ icon: Icon, iconClass, label, count, open, onToggle, children, empty }: SectionProps) {
  return (
    <div>
      <button className="section-title w-full text-left mb-3" onClick={onToggle} aria-expanded={open}>
        <Icon className={`w-4 h-4 ${iconClass}`} />
        <span>{label}</span>
        <span className="section-count">{count}</span>
        <ChevronDown className="ml-auto w-4 h-4 text-gray-400 transition-transform duration-200"
          style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
      </button>

      {open && (
        empty
          ? <p className="text-sm text-gray-400 pl-1 mb-1">Nenhuma tarefa.</p>
          : children
      )}
    </div>
  );
}

function dispatchNotification(task: Task) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const titulo = task.prioridade === 'Urgente' ? 'Nova tarefa urgente' : 'Nova tarefa';

  new Notification(`${titulo} — ${task.cliente}`, {
    body: [task.descricao, task.contacto].filter(Boolean).join('\n'),
    icon: '/favicon.png',
    tag: `task-${task.id}`,
  });
}

export function TasksView({ user, isAdmin, isTecnico }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ concluidas: true });
  const knownIdsRef = useRef<Set<number>>(new Set());
  const isFirstLoadRef = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (filterEstado) params.estado = filterEstado;
      if (filterPrioridade) params.prioridade = filterPrioridade;
      if (search.trim()) params.search = search.trim();
      const fetched: Task[] = await getTasks(params);
      setTasks(fetched);

      if (isFirstLoadRef.current) {
        fetched.forEach(t => knownIdsRef.current.add(t.id));
        isFirstLoadRef.current = false;
      } else {
        fetched.forEach(t => {
          if (!knownIdsRef.current.has(t.id)) {
            knownIdsRef.current.add(t.id);
            dispatchNotification(t);
          }
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, filterEstado, filterPrioridade]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  useEffect(() => {
    const id = setInterval(() => load(true), 5_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const urgentes     = tasks.filter(t => t.prioridade === 'Urgente' && t.estado !== 'Concluido');
  const novas        = tasks.filter(t => t.prioridade !== 'Urgente' && t.estado === 'Novo');
  const emTratamento = tasks.filter(t => t.prioridade !== 'Urgente' && t.estado === 'EmTratamento');
  const concluidas   = tasks.filter(t => t.estado === 'Concluido');

  const toggle = (k: string) => setCollapsed(p => ({ ...p, [k]: !p[k] }));
  const isOpen = (k: string, def: boolean) => collapsed[k] === undefined ? def : !collapsed[k];

  const grid = (items: Task[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
      {items.map((task, i) => (
        <TaskCard key={task.id} task={task} onClick={() => setSelectedId(task.id)}
          style={{ animationDelay: `${i * 45}ms` }} />
      ))}
    </div>
  );

  return (
    <div className="space-y-7">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input type="search" className="form-input pl-9 max-w-xs" placeholder="Pesquisar tarefas..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select w-auto" value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
            <option value="">Todos os estados</option>
            <option value="Novo">Novo</option>
            <option value="EmTratamento">Em Tratamento</option>
            <option value="Concluido">Concluído</option>
          </select>
          <select className="form-select w-auto" value={filterPrioridade} onChange={e => setFilterPrioridade(e.target.value)}>
            <option value="">Todas as prioridades</option>
            <option value="Urgente">Urgente</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
        <button className="btn-accent shrink-0" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> Novo Pedido
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2 animate-scale-in">
          <TriangleAlert className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-7">
          {['Urgentes', 'Novas', 'Em Tratamento'].map(l => (
            <div key={l}>
              <div className="flex items-center gap-2 mb-3">
                <div className="shimmer h-4 w-4 rounded" />
                <div className="shimmer h-3 w-20 rounded-full" />
                <div className="shimmer h-5 w-8 rounded-full" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sections */}
      {!loading && !error && (
        <>
          <Section icon={Flame} iconClass="text-accent-500" label="Urgentes" count={urgentes.length}
            open={isOpen('urgentes', true)} onToggle={() => toggle('urgentes')} empty={urgentes.length === 0}>
            {grid(urgentes)}
          </Section>

          <Section icon={Inbox} iconClass="text-blue-600" label="Novas" count={novas.length}
            open={isOpen('novas', true)} onToggle={() => toggle('novas')} empty={novas.length === 0}>
            {grid(novas)}
          </Section>

          <Section icon={Wrench} iconClass="text-amber-600" label="Em Tratamento" count={emTratamento.length}
            open={isOpen('emTratamento', true)} onToggle={() => toggle('emTratamento')} empty={emTratamento.length === 0}>
            {grid(emTratamento)}
          </Section>

          <Section icon={CircleCheck} iconClass="text-green-600" label="Concluídas" count={concluidas.length}
            open={isOpen('concluidas', false)} onToggle={() => toggle('concluidas')} empty={concluidas.length === 0}>
            {grid(concluidas)}
          </Section>

          {tasks.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
              <Inbox className="w-12 h-12 mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              <p className="text-gray-500 font-medium mb-1">Nenhuma tarefa encontrada</p>
              <p className="text-gray-400 text-sm">Tenta ajustar os filtros ou cria um novo pedido</p>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {selectedId !== null && (
        <TaskDetail taskId={selectedId} user={user} isAdmin={isAdmin} isTecnico={isTecnico}
          onClose={() => setSelectedId(null)} onUpdated={load} />
      )}
      {showCreate && (
        <CreateTask onClose={() => setShowCreate(false)} onCreated={load} />
      )}
    </div>
  );
}
