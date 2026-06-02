import { useState, useEffect, useCallback } from 'react';
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

interface Section {
  key: string;
  label: string;
  emoji: string;
  tasks: Task[];
  defaultOpen: boolean;
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ Concluido: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (filterEstado) params.estado = filterEstado;
      if (filterPrioridade) params.prioridade = filterPrioridade;
      if (search.trim()) params.search = search.trim();
      const data = await getTasks(params);
      setTasks(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  }, [search, filterEstado, filterPrioridade]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const urgentes     = tasks.filter(t => t.prioridade === 'Urgente' && t.estado !== 'Concluido');
  const novas        = tasks.filter(t => t.prioridade !== 'Urgente' && t.estado === 'Novo');
  const emTratamento = tasks.filter(t => t.prioridade !== 'Urgente' && t.estado === 'EmTratamento');
  const concluidas   = tasks.filter(t => t.estado === 'Concluido');

  const sections: Section[] = [
    { key: 'urgentes',     label: 'Urgentes',      emoji: '🔥', tasks: urgentes,     defaultOpen: true },
    { key: 'novas',        label: 'Novas',          emoji: '📥', tasks: novas,        defaultOpen: true },
    { key: 'emTratamento', label: 'Em Tratamento',  emoji: '🔧', tasks: emTratamento, defaultOpen: true },
    { key: 'Concluido',    label: 'Concluídas',     emoji: '✅', tasks: concluidas,   defaultOpen: false },
  ];

  const toggle = (key: string) =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const isOpen = (s: Section) =>
    collapsed[s.key] === undefined ? s.defaultOpen : !collapsed[s.key];

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2 flex-1">
          <input
            type="search"
            className="form-input max-w-xs"
            placeholder="Pesquisar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-select w-auto"
            value={filterEstado}
            onChange={e => setFilterEstado(e.target.value)}
          >
            <option value="">Todos os estados</option>
            <option value="Novo">Novo</option>
            <option value="EmTratamento">Em Tratamento</option>
            <option value="Concluido">Concluído</option>
          </select>
          <select
            className="form-select w-auto"
            value={filterPrioridade}
            onChange={e => setFilterPrioridade(e.target.value)}
          >
            <option value="">Todas as prioridades</option>
            <option value="Urgente">Urgente</option>
            <option value="Alta">Alta</option>
            <option value="Normal">Normal</option>
            <option value="Baixa">Baixa</option>
          </select>
        </div>
        <button className="btn-accent shrink-0" onClick={() => setShowCreate(true)}>
          + Novo Pedido
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-gray-400 text-sm">A carregar...</div>
      )}

      {/* Sections */}
      {!loading && sections.map(section => (
        <div key={section.key}>
          <div className="section-title" onClick={() => toggle(section.key)}>
            <span>{section.emoji}</span>
            <span>{section.label}</span>
            <span className="bg-gray-100 text-gray-500 text-xs rounded-full px-2 py-0.5 font-medium">
              {section.tasks.length}
            </span>
            <span className="ml-auto text-gray-300 text-xs">
              {isOpen(section) ? '▲' : '▼'}
            </span>
          </div>

          {isOpen(section) && (
            section.tasks.length === 0
              ? <p className="text-sm text-gray-400 italic pl-1 mb-2">Nenhuma tarefa nesta secção.</p>
              : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {section.tasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setSelectedId(task.id)}
                      style={{ animationDelay: `${i * 40}ms` }}
                    />
                  ))}
                </div>
              )
          )}
        </div>
      ))}

      {/* No results */}
      {!loading && tasks.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm">Nenhuma tarefa encontrada.</p>
        </div>
      )}

      {/* Modals */}
      {selectedId !== null && (
        <TaskDetail
          taskId={selectedId}
          user={user}
          isAdmin={isAdmin}
          isTecnico={isTecnico}
          onClose={() => setSelectedId(null)}
          onUpdated={load}
        />
      )}
      {showCreate && (
        <CreateTask
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
