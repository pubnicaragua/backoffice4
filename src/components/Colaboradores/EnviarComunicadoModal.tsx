import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert } from '../../hooks/useSupabaseData';

interface EnviarComunicadoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnviarComunicadoModal({ isOpen, onClose }: EnviarComunicadoModalProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    comunicado: '',
    programar_envio: '',
    destinatario: 'todos'
  });

  const { insert, loading } = useSupabaseInsert('comunicados');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📢 COMUNICADO: Iniciando envío');
    console.log('📝 DATOS:', {
      titulo: formData.titulo,
      destinatario: formData.destinatario,
      programado: formData.programar_envio
    });
    
    const success = await insert({
      titulo: formData.titulo,
      comunicado: formData.comunicado,
      programar_envio: formData.programar_envio ? new Date(formData.programar_envio) : null,
      destinatario: formData.destinatario,
      empresa_id: '00000000-0000-0000-0000-000000000001',
      usuario_id: '80ca7f2b-d125-4df6-9f22-a5fe3ada00e4'
    });

    if (success) {
      console.log('✅ COMUNICADO: Enviado exitosamente');
      onClose();
      setFormData({
        titulo: '',
        comunicado: '',
        programar_envio: '',
        destinatario: 'todos'
      });
    } else {
      console.error('❌ COMUNICADO: Error en envío');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enviar comunicado general" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="titulo-comunicado-input" className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          <input
            id="titulo-comunicado-input"
            name="titulo-comunicado-input"
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
            placeholder="Título"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="comunicado-textarea" className="block text-sm font-medium text-gray-700 mb-1">
            Comunicado
          </label>
          <textarea
            id="comunicado-textarea"
            name="comunicado-textarea"
            value={formData.comunicado}
            onChange={(e) => setFormData(prev => ({ ...prev, comunicado: e.target.value }))}
            placeholder="Comunicado"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Programar envío
          </label>
          <input
            type="datetime-local"
            value={formData.programar_envio}
            onChange={(e) => setFormData(prev => ({ ...prev, programar_envio: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destinatario
          </label>
          <select
            value={formData.destinatario}
            onChange={(e) => setFormData(prev => ({ ...prev, destinatario: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="empleados">Solo empleados</option>
            <option value="supervisores">Solo supervisores</option>
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
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar comunicado'}
          </button>
        </div>
      </form>
    </Modal>
  );
}