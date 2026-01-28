'use client'

import { useState, useEffect } from 'react';
import { Cargo, Setor } from '@/shared/types';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import Modal from '@/frontend/components/ui/Modal';
import ConfirmDialog from '@/frontend/components/ui/ConfirmDialog';

export default function CargosPage() {
  const [items, setItems] = useState<Cargo[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Cargo | undefined>(undefined);
  const [formData, setFormData] = useState<Partial<Cargo>>({});
  
  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Cargo | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cargosRes, setoresRes] = await Promise.all([
          fetch('/api/admin/cargos'),
          fetch('/api/admin/setores')
      ]);
      if (cargosRes.ok) setItems(await cargosRes.json());
      if (setoresRes.ok) setSetores(await setoresRes.json());
    } catch (error) {
      console.error('Failed to fetch', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem ? `/api/admin/cargos/${editingItem.id}` : '/api/admin/cargos';
      const method = editingItem ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Falha ao salvar');
      
      await fetchData();
      setIsFormOpen(false);
    } catch (error) {
      alert('Erro ao salvar');
    }
  };

  const handleDelete = async () => {
      if (!itemToDelete) return;
      try {
          const res = await fetch(`/api/admin/cargos/${itemToDelete.id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Falha ao excluir');
          await fetchData();
          setConfirmOpen(false);
      } catch (error) {
          alert('Erro ao excluir');
      }
  };

  const toggleSetor = (setorId: string) => {
      const current = formData.setoresPermitidos || [];
      if (current.includes(setorId)) {
          setFormData({ ...formData, setoresPermitidos: current.filter(id => id !== setorId) });
      } else {
          setFormData({ ...formData, setoresPermitidos: [...current, setorId] });
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Briefcase className="text-purple-400" />
            Gestão de Cargos
          </h2>
          <p className="text-gray-400">Defina funções e competências</p>
        </div>
        <button
          onClick={() => {
              setEditingItem(undefined);
              setFormData({ ativo: true, escopo: 'INDIVIDUAL', setoresPermitidos: [] });
              setIsFormOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Cargo
        </button>
      </div>

      <div className="bg-gray-800 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900/50 text-gray-400 text-sm">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Escopo</th>
              <th className="p-4">Setores Permitidos</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-gray-300">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center">Carregando...</td></tr>
            ) : items.map((item) => (
              <tr key={item.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-white">{item.nome}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                        item.escopo === 'SETORIAL' 
                        ? 'border-purple-500/50 text-purple-400' 
                        : 'border-blue-500/50 text-blue-400'
                    }`}>
                        {item.escopo}
                    </span>
                </td>
                <td className="p-4 text-sm text-gray-400">
                    {item.setoresPermitidos.length} setores
                </td>
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
        title={editingItem ? 'Editar Cargo' : 'Novo Cargo'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
                <input 
                    type="text" 
                    required 
                    className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                    value={formData.nome || ''}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea 
                    className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                    rows={2}
                    value={formData.descricao || ''}
                    onChange={e => setFormData({...formData, descricao: e.target.value})}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Escopo de Atuação</label>
                    <select 
                        className="w-full bg-gray-900 border border-white/10 rounded-lg p-2 text-white focus:border-blue-500 outline-none"
                        value={formData.escopo || 'INDIVIDUAL'}
                        onChange={e => setFormData({...formData, escopo: e.target.value as any})}
                    >
                        <option value="INDIVIDUAL">Individual (Vê apenas suas)</option>
                        <option value="SETORIAL">Setorial (Vê tudo do setor)</option>
                    </select>
                </div>
                
                <div className="flex items-center pt-6">
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="ativo"
                            checked={formData.ativo ?? true}
                            onChange={e => setFormData({...formData, ativo: e.target.checked})}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                        />
                        <label htmlFor="ativo" className="text-sm text-gray-300">Cargo Ativo</label>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Setores Permitidos</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-2 bg-gray-900/50 rounded-lg border border-white/5">
                    {setores.map(setor => (
                        <label key={setor.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                            <input 
                                type="checkbox"
                                checked={(formData.setoresPermitidos || []).includes(setor.id)}
                                onChange={() => toggleSetor(setor.id)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                            />
                            <span className="text-sm text-gray-300">{setor.nome}</span>
                        </label>
                    ))}
                </div>
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
        title="Excluir Cargo"
        message={`Tem certeza que deseja excluir o cargo "${itemToDelete?.nome}"?`}
        isDestructive
      />
    </div>
  );
}
