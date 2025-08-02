import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseUpdate } from '../../hooks/useSupabaseData';

interface SolicitudVacacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: any;
}

export function SolicitudVacacionesModal({ isOpen, onClose, solicitud }: SolicitudVacacionesModalProps) {
  const [respuesta, setRespuesta] = useState('');
  const [isProcessed, setIsProcessed] = useState(false);
  const { update, loading } = useSupabaseUpdate('solicitudes_vacaciones');

  // Check if solicitud is already processed
  React.useEffect(() => {
    if (solicitud?.estado && solicitud.estado !== 'pendiente') {
      setIsProcessed(true);
    } else {
      setIsProcessed(false);
    }
  }, [solicitud]);
  const handleAprobar = async () => {
    if (isProcessed) return;
    
    const success = await update(solicitud?.id || 'sol-vac-001-001-001-001-001001001', {
      estado: 'aprobado',
      respuesta: respuesta || 'Solicitud aprobada'
    });

    if (success) {
      onClose();
      window.location.reload();
    }
  };

  const handleRechazar = async () => {
    if (isProcessed) return;
    
    const success = await update(solicitud?.id || 'sol-vac-001-001-001-001-001001001', {
      estado: 'rechazado',
      respuesta: respuesta || 'Solicitud rechazada'
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
          <span className={`text-sm font-medium ${
            solicitud?.estado === 'aprobado' ? 'text-green-600' :
            solicitud?.estado === 'rechazado' ? 'text-red-600' : 'text-yellow-600'
          }`}>
            {solicitud?.estado === 'aprobado' ? 'Aprobado' :
             solicitud?.estado === 'rechazado' ? 'Rechazado' : 'Pendiente'}
          </span>
        </div>

        {!isProcessed && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Respuesta (opcional):
              </label>
              <textarea
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Agregar comentarios sobre la decisión..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
          </>
        )}
        
        {isProcessed && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Esta solicitud ya ha sido procesada y no puede modificarse.</p>
            {solicitud?.respuesta && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Respuesta:</p>
                <p className="text-sm text-gray-600">{solicitud.respuesta}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}