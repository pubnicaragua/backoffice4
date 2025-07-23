import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert } from '../../hooks/useSupabaseData';

interface AsignarTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AsignarTurnoModal({ isOpen, onClose }: AsignarTurnoModalProps) {
  const [formData, setFormData] = useState({
    sucursal: 'N°1',
    hora_ingreso: '10:00 AM',
    hora_salida: '18:00 PM'
  });

  const { insert, loading } = useSupabaseInsert('turnos');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await insert({
      empresa_id: '00000000-0000-0000-0000-000000000001',
      sucursal_id: '00000000-0000-0000-0000-000000000001',
      usuario_id: '00000000-0000-0000-0000-000000000001',
      fecha: new Date().toISOString().split('T')[0],
      hora_ingreso: formData.hora_ingreso,
      hora_salida: formData.hora_salida
    });

    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar turno" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sucursal
          </label>
          <select
            value={formData.sucursal}
            onChange={(e) => setFormData(prev => ({ ...prev, sucursal: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="N°1">N°1</option>
            <option value="N°2">N°2</option>
            <option value="N°3">N°3</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora de ingreso
          </label>
          <input
            type="text"
            value={formData.hora_ingreso}
            onChange={(e) => setFormData(prev => ({ ...prev, hora_ingreso: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora de salida
          </label>
          <input
            type="text"
            value={formData.hora_salida}
            onChange={(e) => setFormData(prev => ({ ...prev, hora_salida: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Asignando...' : 'Confirmar turno'}
          </button>
        </div>
      </form>
    </Modal>
  );
}