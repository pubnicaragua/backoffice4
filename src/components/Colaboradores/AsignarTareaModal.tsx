import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert } from '../../hooks/useSupabaseData';

interface AsignarTareaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AsignarTareaModal({ isOpen, onClose }: AsignarTareaModalProps) {
  const [formData, setFormData] = useState({
    nombre_tarea: 'Limpieza total de la sucursal',
    descripcion: 'Hacer limpieza y sacar la basura de la sucursal',
    tipo_tareas: 'Limpieza'
  });

  const { insert, loading } = useSupabaseInsert('asignaciones_tareas');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await insert({
      usuario_id: '00000000-0000-0000-0000-000000000001',
      tarea_id: '00000000-0000-0000-0000-000000000001',
      sucursal_id: '00000000-0000-0000-0000-000000000001',
      fecha_asignacion: new Date().toISOString().split('T')[0],
      completada: false
    });

    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar tarea" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la tarea
          </label>
          <input
            type="text"
            value={formData.nombre_tarea}
            onChange={(e) => setFormData(prev => ({ ...prev, nombre_tarea: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de tareas
          </label>
          <select
            value={formData.tipo_tareas}
            onChange={(e) => setFormData(prev => ({ ...prev, tipo_tareas: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Limpieza">Limpieza</option>
            <option value="Inventario">Inventario</option>
            <option value="Atención al cliente">Atención al cliente</option>
          </select>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Asignando...' : 'Confirmar tarea'}
          </button>
        </div>
      </form>
    </Modal>
  );
}