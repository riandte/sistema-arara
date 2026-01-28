'use client'

import { useState, useEffect } from 'react';
import { Role } from '@/shared/types';
import { Plus, Pencil, Trash2, Shield, Lock } from 'lucide-react';
import Modal from '@/frontend/components/ui/Modal';
import ConfirmDialog from '@/frontend/components/ui/ConfirmDialog';
import RoleForm from '@/frontend/components/admin/RoleForm';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  
  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) setRoles(await res.json());
    } catch (error) {
      console.error('Failed to fetch roles', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: Role) => {
    try {
      if (editingRole) {
        // Update
        // Encode name to handle spaces etc
        const encodedName = encodeURIComponent(editingRole.name);
        const res = await fetch(`/api/admin/roles/${encodedName}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Falha ao atualizar');
        }
      } else {
        // Create
        const res = await fetch('/api/admin/roles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Falha ao criar');
        }
      }
      await fetchRoles();
      setIsFormOpen(false);
    } catch (error: any) {
        throw error;
    }
  };

  const handleDelete = async () => {
      if (!roleToDelete) return;
      try {
          const encodedName = encodeURIComponent(roleToDelete.name);
          const res = await fetch(`/api/admin/roles/${encodedName}`, {
              method: 'DELETE'
          });
           if (!res.ok) {
              const err = await res.json();
              alert(err.error || 'Falha ao excluir'); // Use simple alert for error in delete for now or toast
              return;
           }
          await fetchRoles();
      } catch (error) {
          alert('Erro ao excluir papel');
      }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Gerenciar Papéis</h1>
          <p className="text-gray-400">Perfis de acesso e permissões do sistema</p>
        </div>
        
        <button
          onClick={() => { setEditingRole(undefined); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          Novo Papel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <p className="text-gray-500">Carregando papéis...</p>
        ) : (
            roles.map(role => (
                <div key={role.name} className="bg-gray-800/50 rounded-2xl border border-white/10 p-6 flex flex-col hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${role.isSystem ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                {role.isSystem ? <Lock size={24} /> : <Shield size={24} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-lg">{role.name}</h3>
                                <p className="text-xs text-gray-500">{role.isSystem ? 'Sistema' : 'Personalizado'}</p>
                            </div>
                        </div>
                        <div className="flex gap-1">
                             <button
                               onClick={() => { setEditingRole(role); setIsFormOpen(true); }}
                               className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                             >
                                <Pencil size={18} />
                             </button>
                             {!role.isSystem && (
                                <button
                                    onClick={() => { setRoleToDelete(role); setConfirmOpen(true); }}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                             )}
                        </div>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-6 flex-1">
                        {role.description || 'Sem descrição.'}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="text-xs text-gray-500">
                            {role.permissions.length} permissões
                        </div>
                        <div className="text-xs font-medium text-gray-300 bg-white/5 px-2 py-1 rounded-md">
                            {role.userCount || 0} usuários
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRole ? `Editar Papel: ${editingRole.name}` : 'Novo Papel'}
      >
        <RoleForm
          initialData={editingRole}
          onSubmit={handleSave}
          onCancel={() => setIsFormOpen(false)}
          isEditing={!!editingRole}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Papel"
        message={`Tem certeza que deseja excluir o papel "${roleToDelete?.name}"?`}
        confirmText="Excluir"
        isDestructive={true}
      />
    </div>
  );
}
