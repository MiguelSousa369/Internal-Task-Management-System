import { useState, useEffect, useCallback } from 'react';
import {
  getTask, getComments, addComment,
  startTask, releaseTask, completeTask, reopenTask,
  updateTaskPriority, updateTask, deleteTask,
  getUsers,
} from '../api/api';
import { Task, TaskComment, User } from '../App';
import { ConfirmModal } from './ConfirmModal';

interface Props {
  taskId: number;
  user: User;
  isAdmin: boolean;
  isTecnico: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const estadoLabel: Record<string, string> = {
  Novo: 'Novo', EmTratamento: 'Em Tratamento', Concluido: 'Concluído',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function TaskDetail({ taskId, user, isAdmin, isTecnico, onClose, onUpdated }: Props) {
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [tecnicos, setTecnicos] = useState<User[]>([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; action: () => Promise<void>; danger?: boolean }>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ titulo: '', descricao: '', cliente: '', contacto: '', prioridade: 'Normal', tecnicoSolicitadoId: '' });

  const load = useCallback(async () => {
    try {
      const [t, c] = await Promise.all([getTask(taskId), getComments(taskId)]);
      setTask(t);
      setComments(c);
    } catch {
      setError('Erro ao carregar tarefa');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (isTecnico) {
      getUsers()
        .then((users: User[]) => setTecnicos(users.filter((u: User) => u.role === 'Tecnico' && u.ativo)))
        .catch(() => {});
    }
  }, [isTecnico]);

  useEffect(() => {
    if (task && editing) {
      setEditForm({
        titulo: task.titulo,
        descricao: task.descricao ?? '',
        cliente: task.cliente,
        contacto: task.contacto ?? '',
        prioridade: task.prioridade,
        tecnicoSolicitadoId: task.tecnicoSolicitado?.id.toString() ?? '',
      });
    }
  }, [task, editing]);

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionError('');
    try {
      await fn();
      await load();
      onUpdated();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await addComment(taskId, newComment.trim());
      setNewComment('');
      const c = await getComments(taskId);
      setComments(c);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAction(() => updateTask(taskId, {
      titulo: editForm.titulo,
      descricao: editForm.descricao || undefined,
      cliente: editForm.cliente,
      contacto: editForm.contacto || undefined,
      prioridade: editForm.prioridade,
      tecnicoSolicitadoId: editForm.tecnicoSolicitadoId ? Number(editForm.tecnicoSolicitadoId) : null,
    }));
    setEditing(false);
  };

  const handleDelete = async () => {
    await runAction(() => deleteTask(taskId));
    onUpdated();
    onClose();
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-box flex items-center justify-center h-48">
          <div className="text-gray-400 text-sm">A carregar...</div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box p-6 text-center">
          <p className="text-red-600">{error || 'Tarefa não encontrada'}</p>
          <button className="btn-ghost mt-4" onClick={onClose}>Fechar</button>
        </div>
      </div>
    );
  }

  const isHandling = task.emTratamentoPor?.id === user.id;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`badge badge-${task.prioridade}`}>{task.prioridade}</span>
                <span className={`badge badge-${task.estado}`}>{estadoLabel[task.estado]}</span>
              </div>
              <h2 className="font-semibold text-gray-900 text-base leading-snug">{task.titulo}</h2>
            </div>
            <button onClick={onClose} className="btn-ghost btn-sm shrink-0">✕</button>
          </div>

          <div className="p-5 space-y-5">
            {actionError && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                {actionError}
              </div>
            )}

            {/* Edit form */}
            {editing ? (
              <form onSubmit={handleEditSubmit} className="space-y-3 bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Editar Tarefa</p>
                <div>
                  <label className="form-label">Título</label>
                  <input className="form-input" value={editForm.titulo} onChange={e => setEditForm(p => ({ ...p, titulo: e.target.value }))} required />
                </div>
                <div>
                  <label className="form-label">Descrição</label>
                  <textarea className="form-textarea" rows={2} value={editForm.descricao} onChange={e => setEditForm(p => ({ ...p, descricao: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Cliente</label>
                    <input className="form-input" value={editForm.cliente} onChange={e => setEditForm(p => ({ ...p, cliente: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label">Contacto</label>
                    <input className="form-input" value={editForm.contacto} onChange={e => setEditForm(p => ({ ...p, contacto: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Prioridade</label>
                    <select className="form-select" value={editForm.prioridade} onChange={e => setEditForm(p => ({ ...p, prioridade: e.target.value }))}>
                      {['Baixa','Normal','Alta','Urgente'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Técnico solicitado</label>
                    <select className="form-select" value={editForm.tecnicoSolicitadoId} onChange={e => setEditForm(p => ({ ...p, tecnicoSolicitadoId: e.target.value }))}>
                      <option value="">— Nenhum —</option>
                      {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary btn-sm">Guardar</button>
                </div>
              </form>
            ) : (
              /* Task info */
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Cliente</p>
                  <p className="font-medium text-gray-800">{task.cliente}</p>
                </div>
                {task.contacto && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Contacto</p>
                    <p className="font-medium text-gray-800">{task.contacto}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Criado por</p>
                  <p className="font-medium text-gray-800">{task.criadoPor.nome}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Data criação</p>
                  <p className="font-medium text-gray-800">{formatDate(task.dataCriacao)}</p>
                </div>
                {task.tecnicoSolicitado && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Técnico solicitado</p>
                    <p className="font-medium text-gray-800">{task.tecnicoSolicitado.nome}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Em tratamento por</p>
                  <p className={`font-medium ${task.emTratamentoPor ? 'text-primary-700' : 'text-gray-400'}`}>
                    {task.emTratamentoPor?.nome ?? '—'}
                  </p>
                </div>
                {task.dataConclusao && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Concluído em</p>
                    <p className="font-medium text-green-700">{formatDate(task.dataConclusao)}</p>
                  </div>
                )}
                {task.descricao && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Descrição</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{task.descricao}</p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {!editing && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                {/* Assumir */}
                {isTecnico && task.estado !== 'Concluido' && (
                  <button
                    className="btn-primary btn-sm"
                    onClick={() => runAction(() => startTask(task.id))}
                  >
                    {isHandling ? '↺ Reassumir' : 'Assumir'}
                  </button>
                )}
                {/* Libertar */}
                {isTecnico && task.estado === 'EmTratamento' && (
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => setConfirm({
                      title: 'Libertar tarefa',
                      message: 'Tens a certeza? A tarefa volta ao estado Novo.',
                      action: () => runAction(() => releaseTask(task.id)),
                    })}
                  >
                    Libertar
                  </button>
                )}
                {/* Concluir */}
                {isTecnico && task.estado !== 'Concluido' && (
                  <button
                    className="btn-success btn-sm"
                    onClick={() => setConfirm({
                      title: 'Concluir tarefa',
                      message: 'Marcar esta tarefa como concluída?',
                      action: () => runAction(() => completeTask(task.id)),
                    })}
                  >
                    Concluir
                  </button>
                )}
                {/* Reabrir */}
                {isTecnico && task.estado === 'Concluido' && (
                  <button
                    className="btn-ghost btn-sm"
                    onClick={() => runAction(() => reopenTask(task.id))}
                  >
                    Reabrir
                  </button>
                )}
                {/* Prioridade */}
                <div className="flex items-center gap-1">
                  <select
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    value={task.prioridade}
                    onChange={e => runAction(() => updateTaskPriority(task.id, e.target.value))}
                  >
                    {['Baixa','Normal','Alta','Urgente'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                {/* Editar */}
                {isTecnico && (
                  <button className="btn-ghost btn-sm" onClick={() => setEditing(true)}>Editar</button>
                )}
                {/* Eliminar */}
                {isAdmin && (
                  <button
                    className="btn-danger btn-sm ml-auto"
                    onClick={() => setConfirm({
                      title: 'Eliminar tarefa',
                      message: 'Esta ação é irreversível. Tens a certeza?',
                      action: handleDelete,
                      danger: true,
                    })}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Observações ({comments.length})
              </p>

              {comments.length === 0 && (
                <p className="text-sm text-gray-400 italic mb-3">Sem observações ainda.</p>
              )}

              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                {comments.map(c => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-3 text-sm animate-fade-in">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-primary-700 text-xs">{c.user.nome}</span>
                      <span className="text-xs text-gray-400">{formatDate(c.dataCriacao)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{c.comentario}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  className="form-input flex-1 text-sm"
                  placeholder="Adicionar observação..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn-primary btn-sm shrink-0" disabled={submitting || !newComment.trim()}>
                  Enviar
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={() => { confirm.action(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
