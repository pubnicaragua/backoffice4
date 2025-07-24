import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseUpdate } from '../../hooks/useSupabaseData';

interface SolicitudVacacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: any;
}

export function SolicitudVacacionesModal({ isOpen, onClose, solicitud }: SolicitudVacacionesModalProps) {
  const { update, loading } = useSupabaseUpdate('solicitudes_vacaciones');

  const handleAprobar = async () => {
    const success = await update(solicitud?.id || 'sol-vac-001-001-001-001-001001001', {
      estado: 'aprobado'
    });

    if (success) {
      onClose();
      window.location.reload();
    }
  };

  const handleRechazar = async () => {
    const success = await update(solicitud?.id || 'sol-vac-001-001-001-001-001001001', {
      estado: 'rechazado'
    });

    if (success) {
      onClose();
      window.location.reload();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitud de vacaciones" size="md">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">N° {solicitud?.numero_solicitud || '2514'}</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remitente:
          </label>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <span className="text-sm text-gray-900">{solicitud?.nombres || 'Pedro Pérez'}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción:
          </label>
          <p className="text-sm text-gray-600">{solicitud?.motivo || 'Hola quiero solicitar mis vacaciones de verano desde el 1 de julio hasta el 5 de julio'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado:
          </label>
          <span className="text-sm text-gray-900">{solicitud?.estado || 'Pendiente'}</span>
        </div>

        <div className="flex justify-center space-x-3">
          <button
            onClick={handleRechazar}
            disabled={loading}
            className="px-6 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Rechazar solicitud'}
          </button>
          <button
            onClick={handleAprobar}
            disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Aceptar solicitud'}
          </button>
        </div>
      </div>
    </Modal>
  );
}