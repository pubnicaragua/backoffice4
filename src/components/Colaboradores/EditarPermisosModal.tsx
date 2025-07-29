import React, { useState, useEffect } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert, useSupabaseUpdate, useSupabaseData } from '../../hooks/useSupabaseData';

interface EditarPermisosModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: any;
  availablePermissions?: any[];
}

export function EditarPermisosModal({ isOpen, onClose, selectedUser, availablePermissions = [] }: EditarPermisosModalProps) {
  const [userPermissions, setUserPermissions] = useState<{[key: string]: boolean}>({});
  
  const { insert, loading: inserting } = useSupabaseInsert('usuario_permisos');
  const { update, loading: updating } = useSupabaseUpdate('usuario_permisos');
  const { data: currentUserPermissions, refetch } = useSupabaseData<any>(
    'usuario_permisos', 
    '*',
    selectedUser?.id ? { usuario_id: selectedUser.id } : null
  );

  useEffect(() => {
    if (currentUserPermissions && availablePermissions) {
      const permissionsMap = {};
      
      // Initialize all permissions as false
      availablePermissions.forEach(permission => {
        permissionsMap[permission.id] = false;
      });
      
      // Set user's current permissions to true
      currentUserPermissions.forEach(userPerm => {
        permissionsMap[userPerm.permiso_id] = userPerm.otorgado;
      });
      
      setUserPermissions(permissionsMap);
    }
  }, [currentUserPermissions, availablePermissions]);

  const handlePermissionChange = (permissionId: string, granted: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [permissionId]: granted
    }));
  };

  const handleSave = async () => {
    if (!selectedUser?.id) {
      alert('No se pudo identificar el usuario');
      return;
    }

    console.log('💾 PERMISOS: Guardando permisos para usuario', selectedUser.nombres);
    
    try {
      // Update or insert permissions
      for (const [permissionId, granted] of Object.entries(userPermissions)) {
        const existingPermission = currentUserPermissions.find(
          p => p.permiso_id === permissionId
        );
        
        if (existingPermission) {
          // Update existing permission
          await update(existingPermission.id, { otorgado: granted });
        } else {
          // Insert new permission
          await insert({
            usuario_id: selectedUser.id,
            permiso_id: permissionId,
            otorgado: granted
          });
        }
      }
      
      console.log('✅ PERMISOS: Permisos actualizados exitosamente');
      refetch();
      onClose();
    } catch (error) {
      console.error('❌ PERMISOS: Error actualizando permisos:', error);
      alert('Error al actualizar los permisos');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Permisos" size="md">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Editando permisos para: <span className="font-medium text-gray-900">
            {selectedUser?.nombres || 'Usuario'}
          </span>
        </p>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {availablePermissions.map((permission) => (
            <label key={permission.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                checked={userPermissions[permission.id] || false}
                onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">{permission.nombre}</div>
                {permission.descripcion && (
                  <div className="text-sm text-gray-600">{permission.descripcion}</div>
                )}
                {permission.modulo && (
                  <div className="text-xs text-blue-600">Módulo: {permission.modulo}</div>
                )}
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={inserting || updating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {(inserting || updating) ? 'Guardando...' : 'Guardar Permisos'}
          </button>
        </div>
      </div>
    </Modal>
  );
}