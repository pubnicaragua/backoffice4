import React, { useState } from 'react';
import { Filter, Eye } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { DocumentoDetalleModal } from './DocumentoDetalleModal';
import { Modal } from '../Common/Modal';

export function DocumentosEmitidos() {
  const [filters, setFilters] = useState({
    fecha: '',
    sucursal: '',
    caja: '',
    tipo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const { data: ventas, loading } = useSupabaseData<any>(
    'ventas',
    '*, sucursales(nombre)'
  );

  const handleViewDetalle = (documento) => {
    setSelectedDocument(documento);
    setShowDetalle(true);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando documentos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Documentos emitidos</h2>
        <button 
          onClick={() => setShowFilters(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo de doc.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Folio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha y hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sucursales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Caja
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewDetalle({
              tipo: 'Boleta',
              folio: '849456465456',
              fecha: '234235432',
              monto: '28/05/2025 20:00',
              sucursal: 'N°1',
              caja: 'N°1'
            })}>
              <td className="px-6 py-4 text-sm text-gray-900">Boleta</td>
              <td className="px-6 py-4 text-sm text-gray-900">849456465456</td>
              <td className="px-6 py-4 text-sm text-gray-900">28/05/2025 20:00</td>
              <td className="px-6 py-4 text-sm text-gray-900">$234.235.432</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
            </tr>
            <tr className="hover:bg-gray-50 cursor-pointer">
              <td className="px-6 py-4 text-sm text-gray-900">Factura</td>
              <td className="px-6 py-4 text-sm text-gray-900">849456465456</td>
              <td className="px-6 py-4 text-sm text-gray-900">28/05/2025 20:00</td>
              <td className="px-6 py-4 text-sm text-gray-900">$234.235.432</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
            </tr>
            <tr className="hover:bg-gray-50 cursor-pointer">
              <td className="px-6 py-4 text-sm text-gray-900">Factura</td>
              <td className="px-6 py-4 text-sm text-gray-900">849456465456</td>
              <td className="px-6 py-4 text-sm text-gray-900">234235432</td>
              <td className="px-6 py-4 text-sm text-gray-900">28/05/2025 20:00</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
            </tr>
            <tr className="hover:bg-gray-50 cursor-pointer">
              <td className="px-6 py-4 text-sm text-gray-900">Factura</td>
              <td className="px-6 py-4 text-sm text-gray-900">849456465456</td>
              <td className="px-6 py-4 text-sm text-gray-900">234235432</td>
              <td className="px-6 py-4 text-sm text-gray-900">28/05/2025 20:00</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
            </tr>
            <tr className="hover:bg-gray-50 cursor-pointer">
              <td className="px-6 py-4 text-sm text-gray-900">Factura</td>
              <td className="px-6 py-4 text-sm text-gray-900">849456465456</td>
              <td className="px-6 py-4 text-sm text-gray-900">234235432</td>
              <td className="px-6 py-4 text-sm text-gray-900">28/05/2025 20:00</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
              <td className="px-6 py-4 text-sm text-gray-900">N°1</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha / Hora
            </label>
            <input
              type="date"
              value={filters.fecha}
              onChange={(e) => {
                console.log('📅 DOCUMENTOS: Filtro fecha aplicado:', e.target.value);
                setFilters(prev => ({ ...prev, fecha: e.target.value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select 
              value={filters.sucursal}
              onChange={(e) => {
                console.log('🏢 DOCUMENTOS: Filtro sucursal aplicado:', e.target.value);
                setFilters(prev => ({ ...prev, sucursal: e.target.value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sucursales</option>
              <option value="n1">N°1</option>
              <option value="n2">N°2</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cajas
            </label>
            <div className="space-y-2">
              {['Caja N°1', 'Caja N°2', 'Caja N°3', 'Caja N°4'].map(caja => (
                <label key={caja} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      console.log(`📦 DOCUMENTOS: Filtro caja ${caja}:`, e.target.checked);
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{caja}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                console.log('✅ DOCUMENTOS: Filtros aplicados correctamente:', filters);
                setShowFilters(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </Modal>

      <DocumentoDetalleModal 
        isOpen={showDetalle} 
        onClose={() => setShowDetalle(false)}
        documento={selectedDocument}
      />
    </div>
  );
}