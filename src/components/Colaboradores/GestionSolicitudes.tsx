import React, { useState } from 'react';
import { Table } from '../Common/Table';
import { Search } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { SolicitudVacacionesModal } from './SolicitudVacacionesModal';

export function GestionSolicitudes() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);

  const { data: solicitudes, loading, error } = useSupabaseData<any>('solicitudes_vacaciones', '*');

  const columns = [
    { key: 'nombres', label: 'Nombres' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'numero_solicitud', label: 'N° de solicitud' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'estado', label: 'Estado' },
  ];

  const processedData = (solicitudes || []).map((solicitud) => ({
    id: solicitud.id,
    nombres: 'Pedro Pérez',
    tipo: 'Vacaciones',
    numero_solicitud: solicitud.numero_solicitud,
    fecha: new Date(solicitud.created_at).toLocaleDateString('es-CL'),
    estado: solicitud.estado === 'pendiente' ? 'Pendiente' : 
             solicitud.estado === 'aprobado' ? 'Aprobado' : 'Rechazado',
    solicitud: solicitud
  }));

  const filteredData = processedData.filter(item =>
    searchTerm === '' || 
    item.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewSolicitud = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setShowSolicitudModal(true);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando solicitudes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Gestión de solicitudes</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewSolicitud(row)}
              >
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-900">{row.nombres}</span>
                  </div>
                </td>
                {columns.slice(1).map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SolicitudVacacionesModal 
        isOpen={showSolicitudModal} 
        onClose={() => setShowSolicitudModal(false)} 
        solicitud={selectedSolicitud}
      />
    </div>
  );
}