import { Permission } from '@/shared/types';

interface PermissionMatrixProps {
  selectedPermissions: Permission[];
  onChange: (perms: Permission[]) => void;
  disabled?: boolean;
}

const MODULES = {
  'Pendências': [
    { id: 'PENDENCIA:LER_TODAS', label: 'Ver Todas' },
    { id: 'PENDENCIA:CRIAR', label: 'Criar' },
    { id: 'PENDENCIA:EDITAR', label: 'Editar' },
    { id: 'PENDENCIA:MOVER', label: 'Mover (Kanban)' },
    { id: 'PENDENCIA:CONCLUIR', label: 'Concluir' },
    { id: 'PENDENCIA:CANCELAR', label: 'Cancelar' },
    { id: 'PENDENCIA:ATRIBUIR_RESPONSAVEL', label: 'Atribuir Responsável' },
  ],
  'Usuários': [
    { id: 'USUARIO:GERENCIAR', label: 'Gerenciar Usuários' },
  ],
  'Ordens de Serviço': [
    { id: 'OS:CRIAR', label: 'Criar OS' },
  ]
};

export default function PermissionMatrix({ selectedPermissions, onChange, disabled = false }: PermissionMatrixProps) {
  const togglePermission = (id: Permission) => {
    if (disabled) return;
    if (selectedPermissions.includes(id)) {
      onChange(selectedPermissions.filter(p => p !== id));
    } else {
      onChange([...selectedPermissions, id]);
    }
  };

  const toggleModule = (modulePerms: { id: string }[]) => {
    if (disabled) return;
    const ids = modulePerms.map(p => p.id as Permission);
    const allSelected = ids.every(id => selectedPermissions.includes(id));
    
    if (allSelected) {
      // Remove all
      onChange(selectedPermissions.filter(p => !ids.includes(p)));
    } else {
      // Add all
      const newPerms = new Set([...selectedPermissions, ...ids]);
      onChange(Array.from(newPerms));
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(MODULES).map(([moduleName, permissions]) => (
        <div key={moduleName} className="bg-gray-900/50 rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
            <h3 className="font-semibold text-gray-200">{moduleName}</h3>
            <button
              type="button"
              onClick={() => toggleModule(permissions)}
              disabled={disabled}
              className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              Alternar Todos
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {permissions.map((perm) => (
              <label key={perm.id} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(perm.id as Permission)}
                  onChange={() => togglePermission(perm.id as Permission)}
                  disabled={disabled}
                  className="w-4 h-4 rounded bg-gray-800 border-white/20 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 disabled:opacity-50"
                />
                <span className={`text-sm ${disabled ? 'text-gray-500' : 'text-gray-400 group-hover:text-white'} transition-colors`}>
                  {perm.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
