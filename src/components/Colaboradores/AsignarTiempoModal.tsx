import React, { useState } from 'react';
import { Modal } from '../Common/Modal';

interface AsignarTiempoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AsignarTiempoModal({ isOpen, onClose }: AsignarTiempoModalProps) {
  const [formData, setFormData] = useState({
    tiempo_colacion: '1h',
    rol_usuario: 'empleado'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para asignar tiempo de colación
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar tiempo de colación" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tiempo de colación
          </label>
          <select
            value={formData.tiempo_colacion}
            onChange={(e) => setFormData(prev => ({ ...prev, tiempo_colacion: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="30min">30 minutos</option>
            <option value="1h">1 hora</option>
            <option value="1h30min">1 hora 30 minutos</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rol del usuario
          </label>
          <select
            value={formData.rol_usuario}
            onChange={(e) => setFormData(prev => ({ ...prev, rol_usuario: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="empleado">Empleado</option>
            <option value="supervisor">Supervisor</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Guardar usuario
          </button>
        </div>
      </form>
    </Modal>
  );
}