import { Task } from '../App';

interface Props {
  task: Task;
  onClick: () => void;
  style?: React.CSSProperties;
}

const estadoLabel: Record<string, string> = {
  Novo: 'Novo',
  EmTratamento: 'Em Tratamento',
  Concluido: 'Concluído',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m}m`;
  if (h < 24) return `há ${h}h`;
  return `há ${d}d`;
}

export function TaskCard({ task, onClick, style }: Props) {
  return (
    <div
      className={`task-card task-card-${task.prioridade}`}
      style={style}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2 flex-1">
          {task.titulo}
        </h3>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`badge badge-${task.prioridade}`}>{task.prioridade}</span>
          <span className={`badge badge-${task.estado}`}>{estadoLabel[task.estado]}</span>
        </div>
      </div>

      <p className="text-xs font-medium text-gray-600 mt-2">{task.cliente}</p>
      {task.contacto && (
        <p className="text-xs text-gray-400">{task.contacto}</p>
      )}

      <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center justify-between gap-2">
        <span className="text-xs truncate">
          {task.emTratamentoPor
            ? <span className="text-primary-600 font-medium">👤 {task.emTratamentoPor.nome}</span>
            : <span className="text-gray-400">Sem responsável</span>
          }
        </span>
        <span className="text-xs text-gray-400 shrink-0">{timeAgo(task.dataCriacao)}</span>
      </div>
    </div>
  );
}
