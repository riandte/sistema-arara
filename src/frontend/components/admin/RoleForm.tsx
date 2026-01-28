import { useState } from 'react';
import { Role, Permission } from '@/shared/types';
import PermissionMatrix from './PermissionMatrix';

interface RoleFormProps {
  initialData?: Role;
  onSubmit: (data: Role) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function RoleForm({ initialData, onSubmit, onCancel, isEditing = false }: RoleFormProps) {
  const [formData, setFormData] = useState<Role>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    permissions: initialData?.permissions || [],
    isSystem: initialData?.isSystem || false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name) throw new Error('Nome do papel é obrigatório.');
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Papel</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
            disabled={isEditing && formData.isSystem} // Cannot change system role name
            className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ex: FINANCEIRO"
          />
          {isEditing && formData.isSystem && (
            <p className="text-xs text-yellow-500/80 mt-1">Este é um papel de sistema e seu nome não pode ser alterado.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
          <input
            type="text"
            value={formData.description || ''}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descrição das responsabilidades..."
          />
        </div>
      </div>

      <div className="pt-2">
        <label className="block text-sm font-medium text-gray-400 mb-3">Permissões de Acesso</label>
        <PermissionMatrix
          selectedPermissions={formData.permissions}
          onChange={perms => setFormData({ ...formData, permissions: perms })}
          disabled={false} // Admin can always edit permissions? Yes, but maybe warn for ADMIN role.
        />
        {formData.name === 'ADMIN' && (
           <p className="text-xs text-yellow-500/80 mt-2">Cuidado: Remover permissões do Administrador pode bloquear acesso ao sistema.</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Papel'}
        </button>
      </div>
    </form>
  );
}
