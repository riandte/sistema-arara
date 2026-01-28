'use client'

import { useState, useEffect } from 'react';
import { Funcionario, Setor, Cargo, User } from '@/shared/types';
import { Plus, Pencil, Trash2, UserCheck, Search } from 'lucide-react';
import Modal from '@/frontend/components/ui/Modal';
import ConfirmDialog from '@/frontend/components/ui/ConfirmDialog';

export default function FuncionariosPage() {
  const [items, setItems] = useState<Funcionario[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Funcionario | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Funcionario>>({});
  
  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Funcionario | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [funcRes, setoresRes, cargosRes, usersRes] = await Promise.all([
          fetch('/api/admin/funcionarios'),
          fetch('/api/admin/setores'),
          fetch('/api/admin/cargos'),
          fetch('/api/admin/users')
      ]);
      
      if (funcRes.ok) setItems(await funcRes.json());
      if (setoresRes.ok) setSetores(await setoresRes.json());
      if (cargosRes.ok) setCargos(await cargosRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/admin/funcionarios/${editingItem.id}` : '/api/admin/funcionarios';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
      });
      
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Falha ao salvar');
      }
      
      await fetchData();
      setIsFormOpen(false);
    } catch (error: any) {
      alert(error.message || 'Erro ao salvar');
    }
  };

  const handleDelete = async () => {
      if (!itemToDelete) return;
      try {
          const res = await fetch(`/api/admin/funcionarios/${itemToDelete.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Falha ao excluir');
          await fetchData();
          setConfirmOpen(false);
      } catch (error) {
          alert('Erro ao excluir');
      }
  };

  const getSetorName = (id: string) => setores.find(s => s.id === id)?.nome || id;
  const getCargoName = (id: string) => cargos.find(c => c.id === id)?.nome || id;
  const getUserLogin = (id?: string) => users.find(u => u.id === id)?.email || '-';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="text-green-400" />
            Gestão de Funcionários
          </h2>
          <p className="text-gray-400">Vincule usuários a cargos e setores</p>
        </div>
        <button
          onClick={() => {
              setEditingItem(undefined);
              setFormData({ ativo: true });
              setIsFormOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Funcionário
        </button>
      </div>

      <div className="bg-gray-800 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900/50 text-gray-400 text-sm">
            <tr>
              <th className="p-4">Nome / Email</th>
              <th className="p-4">Setor</th>
              <th className="p-4">Cargo</th>
              <th className="p-4">Usuário Vinculado</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-gray-300">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center">Carregando...</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                    <div className="font-medium text-white">{item.nome}</div>
                    <div className="text-sm text-gray-500">{item.emailCorporativo}</div>
                </td>
                <td className="p-4">{getSetorName(item.setorId)}</td>
                <td className="p-4">{getCargoName(item.cargoId)}</td>
                <td className="p-4 font-mono text-sm">{getUserLogin(item.usuarioId)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.ativo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {item.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => {
                        setEditingItem(item);
                        setFormData(item);
                        setIsFormOpen(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button 
                    onClick={() => {
                        setItemToDelete(item);
                        setConfirmOpen(true);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Editar Funcionário' : 'Novo Funcionário'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                    <input 
                        type="text" 
                        required 
                        className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                        value={formData.nome || ''}
                        onChange={e => setFormData({...formData, nome: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Email Corporativo</label>
                    <input 
                        type="email" 
                        required 
                        className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                        value={formData.emailCorporativo || ''}
                        onChange={e => setFormData({...formData, emailCorporativo: e.target.value})}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Setor</label>
                    <select 
                        required
                        className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                        value={formData.setorId || ''}
                        onChange={e => setFormData({...formData, setorId: e.target.value})}
                    >
                        <option value="">Selecione...</option>
                        {setores.filter(s => s.ativo).map(s => (
                            <option key={s.id} value={s.id}>{s.nome}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Cargo</label>
                    <select 
                        required
                        className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                        value={formData.cargoId || ''}
                        onChange={e => setFormData({...formData, cargoId: e.target.value})}
                    >
                        <option value="">Selecione...</option>
                        {cargos.filter(c => c.ativo).map(c => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Usuário do Sistema (Login)</label>
                <select 
                    className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                    value={formData.usuarioId || ''}
                    onChange={e => setFormData({...formData, usuarioId: e.target.value || undefined})}
                >
                    <option value="">Sem vínculo (Apenas registro)</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) 
                            {items.some(i => i.usuarioId === u.id && i.id !== formData.id) ? ' - JÁ VINCULADO' : ''}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    Vincule a um login existente para conceder acesso.
                </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
                <input 
                    type="checkbox" 
                    id="ativo"
                    checked={formData.ativo ?? true}
                    onChange={e => setFormData({...formData, ativo: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                />
                <label htmlFor="ativo" className="text-sm text-gray-300">Funcionário Ativo</label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Salvar</button>
            </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Funcionário"
        message={`Tem certeza que deseja excluir o funcionário "${itemToDelete?.nome}"?`}
        isDestructive
      />
    </div>
  );
}
