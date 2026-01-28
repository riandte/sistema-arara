'use client'

import { useState, useEffect } from 'react';
import { User, Role, Setor, Cargo, Funcionario } from '@/shared/types';
import { Plus, Pencil, Trash2, Search, ShieldAlert, UserX, UserCheck } from 'lucide-react';
import Modal from '@/frontend/components/ui/Modal';
import ConfirmDialog from '@/frontend/components/ui/ConfirmDialog';
import UserForm from '@/frontend/components/admin/UserForm';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [editingUserOrgData, setEditingUserOrgData] = useState<{setorId?: string, cargoId?: string}>({});
  
  // Confirm Dialog State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' };
      const [usersRes, rolesRes, setoresRes, cargosRes, funcRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/roles', { headers }),
        fetch('/api/admin/setores', { headers }),
        fetch('/api/admin/cargos', { headers }),
        fetch('/api/admin/funcionarios', { headers })
      ]);
      
      if (usersRes.ok) setUsers(await usersRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
      if (setoresRes.ok) setSetores(await setoresRes.json());
      if (cargosRes.ok) setCargos(await cargosRes.json());
      if (funcRes.ok) setFuncionarios(await funcRes.json());
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(undefined);
    setEditingUserOrgData({});
    setIsFormOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    const func = funcionarios.find(f => f.usuarioId === user.id);
    if (func) {
        setEditingUserOrgData({
            setorId: func.setorId,
            cargoId: func.cargoId
        });
    } else {
        setEditingUserOrgData({});
    }
    setIsFormOpen(true);
  };

  const handleSave = async (data: Partial<User> & { setorId?: string; cargoId?: string }) => {
    try {
      if (editingUser) {
        // Update
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
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
        const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Falha ao criar');
        }
      }
      await fetchData();
      setIsFormOpen(false);
    } catch (error: any) {
        throw error; // Let Form handle error
    }
  };

  const handleDelete = async () => {
      if (!userToDelete) return;
      try {
          // Assuming DELETE or deactivation via PUT
          // For now, let's assume we want to "Deactivate" if delete is not fully supported or "Delete" if supported.
          // API route has DELETE method commented out but mentions implementing it in service.
          // Wait, I did NOT implement DELETE in user route properly, I just added the route file but put logic inside.
          // Let's check `src/app/api/admin/users/[id]/route.ts`. 
          // I added PUT there. I did NOT add DELETE.
          // So I will use PUT to set active = false (Inactivate).
          // Or I should fix the API to support DELETE.
          // The prompt said "Admin desativar o último ADMIN".
          // So I will implement "Deactivate" button primarily, or "Delete" if it's a hard delete.
          // Let's assume we use PUT to toggle active for now.
          
          // Actually, let's implement a real Delete in API if I want "Excluir".
          // But "Inativar" is often safer.
          // Let's implement DELETE in API for "Excluir" and Toggle Active for "Inativar".
          
          // I'll stick to Toggle Active for the "Trash" icon for now or add a separate action?
          // Usually trash = delete.
          // Let's add a DELETE method to the API route now.
          
          const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
              method: 'DELETE'
          });
           if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || 'Falha ao excluir');
           }
          await fetchData();
      } catch (error) {
          alert('Erro ao excluir usuário');
      }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Gerenciar Usuários</h1>
          <p className="text-gray-400">Administração de acesso e contas de usuário</p>
        </div>
        
        <button
          onClick={() => { setEditingUser(undefined); setIsFormOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800/50 rounded-xl p-4 mb-6 border border-white/5 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800/50 rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900/50 border-b border-white/5">
                <th className="p-4 text-sm font-medium text-gray-400">Usuário</th>
                <th className="p-4 text-sm font-medium text-gray-400">Email / Login</th>
                <th className="p-4 text-sm font-medium text-gray-400">Papel</th>
                <th className="p-4 text-sm font-medium text-gray-400">Org.</th>
                <th className="p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="p-4 text-sm font-medium text-gray-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Carregando...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td></tr>
              ) : (
                filteredUsers.map(user => {
                  const func = funcionarios.find(f => f.usuarioId === user.id);
                  const setor = func ? setores.find(s => s.id === func.setorId) : null;
                  const cargo = func ? cargos.find(c => c.id === func.cargoId) : null;

                  return (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {user.roles.join(', ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                        {func ? (
                            <div className="flex flex-col">
                                <span className="text-white">{cargo?.nome || 'Sem Cargo'}</span>
                                <span className="text-xs">{setor?.nome || 'Sem Setor'}</span>
                            </div>
                        ) : (
                            <span className="text-xs italic opacity-50">Não vinculado</span>
                        )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        user.active 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setEditingUser(user); setIsFormOpen(true); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={18} />
                        </button>
                        {/* 
                           Disabled delete for now as per "inativar" vs "deletar" ambiguity,
                           but will show a visual indicator if it's safe to delete?
                           Actually, I'll implement Delete action.
                        */}
                        <button 
                          onClick={() => { setUserToDelete(user); setConfirmOpen(true); }}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Excluir/Inativar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingUser ? `Editar Usuário: ${editingUser.name}` : 'Novo Usuário'}
      >
        <UserForm
          initialData={editingUser ? { ...editingUser, ...editingUserOrgData } : undefined}
          roles={roles}
          setores={setores}
          cargos={cargos}
          onSubmit={handleSave}
          onCancel={() => setIsFormOpen(false)}
          isEditing={!!editingUser}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir o usuário "${userToDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        isDestructive={true}
      />
    </div>
  );
}
