import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert, useSupabaseData } from '../../hooks/useSupabaseData';

interface AsignarTareaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: any;
  onSuccess?: () => void; // Callback on successful assignment
}

export function AsignarTareaModal({ isOpen, onClose, selectedUser, onSuccess }: AsignarTareaModalProps) {
  const [formData, setFormData] = useState({
    nombre_tarea: 'Limpieza total de la sucursal',
    descripcion: 'Hacer limpieza y sacar la basura de la sucursal',
    tipo_tareas: 'Limpieza',
    fecha_asignacion: new Date().toISOString().split('T')[0],
    hora_inicio: '08:00',
    hora_fin: '18:00'
  });

  const { insert, loading } = useSupabaseInsert('asignaciones_tareas'); // For assigning tasks
  const { data: tareasDisponibles } = useSupabaseData<any>('tareas', '*'); // For available tasks
  const { data: sucursales } = useSupabaseData<any>('sucursales', '*'); // For available sucursales

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 COLABORADORES: Asignando tarea', {
      usuario: selectedUser?.nombres,
      tarea: formData.nombre_tarea,
      fecha: formData.fecha_asignacion
    });
    
    if (!selectedUser?.id || !formData.nombre_tarea || !formData.fecha_asignacion) {
      console.log('❌ COLABORADORES: Faltan datos requeridos para asignar tarea');
      return;
    }

    const success = await insert({
      usuario_id: selectedUser?.id || '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4',
      tarea_id: tareasDisponibles.find(t => t.nombre === formData.nombre_tarea)?.id || '00000000-0000-0000-0000-000000000001', // Find task ID
      sucursal_id: sucursales[0]?.id || '00000000-0000-0000-0000-000000000001', // Default to first sucursal
      fecha_asignacion: formData.fecha_asignacion,
      completada: false,
    });

    if (success) {
      console.log('✅ COLABORADORES: Tarea asignada exitosamente');
      onClose();
    } else {
      console.error('❌ COLABORADORES: Error asignando tarea');
    }
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar tarea" size="sm">
      <p className="text-sm text-gray-600 mb-4">
        Asignar tarea a: <span className="font-medium text-gray-900">
          {selectedUser?.nombres || 'Usuario Seleccionado'}
        </span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la tarea
          </label>
          <input
            type="text"
            list="tareas-list" // Add datalist for suggestions
            value={formData.nombre_tarea} // Bind to input value
            onChange={(e) => {
              setFormData(prev => ({ ...prev, nombre_tarea: e.target.value }));
              setFormData(prev => ({ ...prev, descripcion: tareasDisponibles.find(t => t.nombre === e.target.value)?.descripcion || '' }));
            }}
            onChange={(e) => setFormData(prev => ({ ...prev, nombre_tarea: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea // Make this read-only if description is auto-filled
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de tareas
          </label> {/* This field is now derived from the selected task */}
          <input
            type="text"
            value={tareasDisponibles.find(t => t.nombre === formData.nombre_tarea)?.tipo || ''}
            readOnly // Make it read-only
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
          />
          <datalist id="tareas-list">
            {tareasDisponibles.map(tarea => (
              <option key={tarea.id} value={tarea.nombre} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de asignación
          </label>
          <input
            type="date"
            value={formData.fecha_asignacion}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha_asignacion: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora inicio
            </label>
            <input
              type="time"
              value={formData.hora_inicio}
              onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora fin
            </label>
            <input
              type="time"
              value={formData.hora_fin}
              onChange={(e) => setFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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