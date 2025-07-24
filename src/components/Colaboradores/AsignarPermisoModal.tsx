import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert } from '../../hooks/useSupabaseData';

interface AsignarPermisoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AsignarPermisoModal({ isOpen, onClose }: AsignarPermisoModalProps) {
  const [formData, setFormData] = useState({
    permiso: 'Apertura de caja'
  });

  const { insert, loading } = useSupabaseInsert('usuario_permisos');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await insert({
      usuario_id: '00000000-0000-0000-0000-000000000001',
      permiso_id: '00000000-0000-0000-0000-000000000001',
      otorgado: true
    });

    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar permiso" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Permiso
          </label>
          <select
            value={formData.permiso}
            onChange={(e) => setFormData(prev => ({ ...prev, permiso: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Apertura de caja">Apertura de caja</option>
            <option value="Cierre de caja">Cierre de caja</option>
            <option value="Gestión de inventario">Gestión de inventario</option>
            <option value="Acceso a reportes">Acceso a reportes</option>
          </select>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Asignando...' : 'Confirmar permiso'}
          </button>
        </div>
      </form>
    </Modal>
  );
}