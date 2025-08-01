import React, { useState } from 'react';
import { Filter, Eye } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { DocumentoDetalleModal } from './DocumentoDetalleModal';
import { Modal } from '../Common/Modal';

export function DocumentosEmitidos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    fecha: '',
    hora: '',
    monto: '',
    sucursal: '',
    caja: '',
    tipo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const { data: ventas, loading } = useSupabaseData<any>(
    'ventas', 
    '*, sucursales(nombre), cajas(nombre)'
  );
  const { data: sucursales } = useSupabaseData<any>('sucursales');

  const handleViewDetalle = (documento) => {
    console.log('📄 DOCUMENTOS: Abriendo detalle', documento);
    setSelectedDocument(documento);
    setShowDetalle(true);
  };

  // Procesar datos reales de ventas
  const processedData = (ventas || []).map(venta => ({
    id: venta.id,
    tipo: venta.tipo_dte === 'factura' ? 'Factura' : 'Boleta',
    folio: venta.folio || `V-${venta.id?.slice(0, 8)}`,
    fecha: new Date(venta.fecha).toLocaleString('es-CL'),
    monto: `$${parseFloat(venta.total || 0).toLocaleString('es-CL')}`,
    sucursal: venta.sucursales?.nombre || 'Principal',
    caja: venta.cajas?.nombre || 'Caja 1',
    venta: venta
  }));

  // Aplicar filtros
  const filteredData = processedData.filter(item => {
    if (searchTerm && !item.folio.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filters.fecha) {
      const filterDate = new Date(filters.fecha).toLocaleDateString('es-CL');
      const itemDate = new Date(item.venta.fecha).toLocaleDateString('es-CL');
      if (itemDate !== filterDate) return false;
    }
    if (filters.monto && parseFloat(item.venta.total) < parseFloat(filters.monto)) return false;
    if (filters.sucursal && item.venta.sucursal_id !== filters.sucursal) return false;
    if (filters.tipo && item.tipo.toLowerCase() !== filters.tipo.toLowerCase()) return false;
    return true;
  });
  if (loading) {
    return <div className="text-center py-4">Cargando documentos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Documentos emitidos</h2>
        <div className="flex items-center space-x-4">
          {/* Barra de búsqueda por folio */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por folio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-3 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>
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
            {filteredData.map((row, index) => (
              <tr 
                key={row.id} 
                className="hover:bg-gray-50 cursor-pointer" 
                onClick={() => handleViewDetalle(row)}
              >
                <td className="px-6 py-4 text-sm text-gray-900">{row.tipo}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.folio}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.fecha}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.monto}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.sucursal}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.caja}</td>
              </tr>
            ))}
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
              Fecha
            </label>
            <input
              type="date"
              value={filters.fecha}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, fecha: e.target.value }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora
            </label>
            <input
              type="time"
              value={filters.hora}
              onChange={(e) => setFilters(prev => ({ ...prev, hora: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto total mínimo
            </label>
            <input
              type="number"
              value={filters.monto}
              onChange={(e) => setFilters(prev => ({ ...prev, monto: e.target.value }))}
              placeholder="Monto mínimo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto total mínimo
            </label>
            <input
              type="number"
              value={filters.monto}
              onChange={(e) => setFilters(prev => ({ ...prev, monto: e.target.value }))}
              placeholder="Monto mínimo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select 
              value={filters.sucursal}
              onChange={(e) => setFilters(prev => ({ ...prev, sucursal: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sucursales</option>
              {sucursales?.map(sucursal => (
                <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
              ))}
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