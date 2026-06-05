import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api/api';
import { User } from '../App';
import { ConfirmModal } from '../components/ConfirmModal';

const roleLabel: Record<string, string> = {
  Admin: 'Admin', Tecnico: 'Técnico', Rececionista: 'Rececionista',
};

const roleBadge: Record<string, string> = {
  Admin:        'bg-purple-100 text-purple-700 border border-purple-200',
  Tecnico:      'bg-blue-100 text-blue-700 border border-blue-200',
  Rececionista: 'bg-gray-100 text-gray-600 border border-gray-200',
};

interface UserFormData {
  nome: string;
  username: string;
  password: string;
  role: string;
  ativo?: boolean;
}

export function UsersView({ token: _token }: { token: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>({ nome: '', username: '', password: '', role: 'Tecnico' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const load = () => {
    setLoading(true);
    getUsers()
      .then(setUsers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ nome: '', username: '', password: '', role: 'Tecnico' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({ nome: u.nome, username: u.username, password: '', role: u.role, ativo: u.ativo });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editing) {
        const data: Partial<UserFormData> = { nome: form.nome, username: form.username, role: form.role, ativo: form.ativo };
        if (form.password) data.password = form.password;
        await updateUser(editing.id, data);
      } else {
        await createUser(form);
      }
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u: User) => {
    try {
      await deleteUser(u.id);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro');
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800">Utilizadores</h1>
        <button className="btn-accent" onClick={openCreate}>+ Novo Utilizador</button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-4">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">A carregar...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Nome</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Username</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u, i) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="px-5 py-3 font-medium text-gray-800">{u.nome}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{u.username}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${roleBadge[u.role]}`}>{roleLabel[u.role]}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${u.ativo ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(u)}>Editar</button>
                      <button className="btn-danger btn-sm" onClick={() => setConfirmDelete(u)}>Desativar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editing ? 'Editar Utilizador' : 'Novo Utilizador'}</h2>
              <button className="btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{formError}</div>
              )}
              <div>
                <label className="form-label">Nome <span className="text-red-500">*</span></label>
                <input className="form-input" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} required autoFocus />
              </div>
              <div>
                <label className="form-label">Username <span className="text-red-500">*</span></label>
                <input className="form-input" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required autoComplete="off" />
              </div>
              <div>
                <label className="form-label">Password {editing && <span className="text-gray-400 font-normal">(deixar em branco para não alterar)</span>}</label>
                <input type="password" className="form-input" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} minLength={6} required={!editing} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                    <option value="Tecnico">Técnico</option>
                    <option value="Rececionista">Rececionista</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                {editing && (
                  <div>
                    <label className="form-label">Estado</label>
                    <select className="form-select" value={form.ativo ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, ativo: e.target.value === 'true' }))}>
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'A guardar...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Desativar utilizador"
          message={`Tens a certeza que queres desativar "${confirmDelete.nome}"? O utilizador não conseguirá iniciar sessão.`}
          confirmLabel="Desativar"
          danger
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
