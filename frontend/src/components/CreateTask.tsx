import { useState, useEffect } from 'react';
import { createTask, getTecnicos } from '../api/api';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTask({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    cliente: '',
    contacto: '',
    descricao: '',
    prioridade: 'Normal',
    tecnicoSolicitadoId: '',
  });
  const [tecnicos, setTecnicos] = useState<{ id: number; nome: string }[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getTecnicos().then(setTecnicos).catch(() => {});
  }, []);

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await createTask({
        cliente: form.cliente,
        contacto: form.contacto || undefined,
        descricao: form.descricao || undefined,
        prioridade: form.prioridade,
        tecnicoSolicitadoId: form.tecnicoSolicitadoId ? Number(form.tecnicoSolicitadoId) : undefined,
      });
      onCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Novo Pedido</h2>
          <button onClick={onClose} className="btn-ghost btn-sm">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Cliente <span className="text-red-500">*</span></label>
              <input
                className="form-input"
                placeholder="Nome da empresa / cliente"
                value={form.cliente}
                onChange={e => set('cliente', e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Contacto</label>
              <input
                className="form-input"
                placeholder="Telefone / email"
                value={form.contacto}
                onChange={e => set('contacto', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Descrição</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Detalhe sobre o pedido..."
              value={form.descricao}
              onChange={e => set('descricao', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Prioridade</label>
              <select
                className="form-select"
                value={form.prioridade}
                onChange={e => set('prioridade', e.target.value)}
              >
                <option value="Normal">Normal</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="form-label">Técnico solicitado</label>
              <select
                className="form-select"
                value={form.tecnicoSolicitadoId}
                onChange={e => set('tecnicoSolicitadoId', e.target.value)}
              >
                <option value="">— Nenhum —</option>
                {tecnicos.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'A criar...' : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
