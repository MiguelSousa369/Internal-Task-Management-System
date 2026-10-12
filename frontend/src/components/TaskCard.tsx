import { Flame, Clock } from 'lucide-react';
import { Task } from '../App';

interface Props {
  task: Task;
  onClick: () => void;
  style?: React.CSSProperties;
}

const estadoLabel: Record<string, string> = {
  Novo: 'Novo', EmTratamento: 'Em Tratamento', Concluido: 'Concluído',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'agora mesmo';
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
      {/* Priority + Status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.prioridade === 'Urgente' && (
            <span className="badge badge-Urgente">
              <Flame className="w-3 h-3" /> Urgente
            </span>
          )}
          <span className={`badge badge-${task.estado}`}>
            {estadoLabel[task.estado]}
          </span>
        </div>
        <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0 mt-0.5">
          <Clock className="w-3 h-3" /> {timeAgo(task.dataCriacao)}
        </span>
      </div>

      {/* Client */}
      <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate mb-1">
        {task.cliente}
      </h3>
      {task.contacto && (
        <p className="text-xs text-gray-400 truncate mb-1">{task.contacto}</p>
      )}
      {task.descricao && (
        <p className="text-xs text-gray-500 line-clamp-2">{task.descricao}</p>
      )}

      {/* Footer */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2">
        {task.emTratamentoPor ? (
          <>
            <div className="w-5 h-5 rounded-md bg-primary-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {task.emTratamentoPor.nome.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-primary-700 truncate">{task.emTratamentoPor.nome}</span>
          </>
        ) : (
          <span className="text-xs text-gray-400 italic">Sem responsável</span>
        )}

        {task.tecnicoSolicitado && !task.emTratamentoPor && (
          <span className="ml-auto text-xs text-gray-400 truncate shrink-0">
            solicitou {task.tecnicoSolicitado.nome.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  );
}
