import React, { useState } from 'react';
import { Filter } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { Modal } from '../Common/Modal';

export function Devoluciones() {
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    folio: '',
    fecha: '',
    monto: '',
    sucursal: '',
    caja: ''
  });
  
  const { data: devoluciones, loading, error } = useSupabaseData<any>('devoluciones', '*');
  const { data: ventas } = useSupabaseData<any>('ventas', '*');

  const columns = [
    { key: 'folio', label: 'Folio' },
    { key: 'fecha', label: 'Fecha y hora' },
    { key: 'monto', label: 'Monto' },
    { key: 'sucursal', label: 'Sucursales' },
    { key: 'caja', label: 'Caja' },
  ];

  // Apply filters
  const filteredDevoluciones = devoluciones.filter(devolucion => {
    const venta = ventas.find(v => v.id === devolucion.venta_id);
    const folio = venta?.folio || devolucion.id?.slice(0, 8) || 'N/A';
    const fecha = new Date(devolucion.fecha).toLocaleString('es-CL');
    const monto = parseFloat(devolucion.monto_devuelto || 0);
    
    if (filters.folio && !folio.toLowerCase().includes(filters.folio.toLowerCase())) return false;
    if (filters.fecha && !fecha.includes(filters.fecha)) return false;
    if (filters.monto && monto < parseFloat(filters.monto)) return false;
    if (filters.sucursal && filters.sucursal !== 'N°1') return false;
    if (filters.caja && filters.caja !== 'N°1') return false;
    
    return true;
  });

  const processedData = filteredDevoluciones.map(devolucion => ({
    folio: ventas.find(v => v.id === devolucion.venta_id)?.folio || devolucion.id?.slice(0, 8) || 'N/A',
    fecha: new Date(devolucion.fecha).toLocaleString('es-CL'),
    monto: `$ ${parseFloat(devolucion.monto_devuelto || 0).toLocaleString('es-CL')}`,
    sucursal: 'N°1',
    caja: 'N°1',
  }));

  if (loading) {
    return <div className="text-center py-4">Cargando devoluciones...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">📋 No hay devoluciones registradas</div>
        <p className="text-sm text-gray-400">Las devoluciones aparecerán aquí cuando se procesen</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Devoluciones</h2>
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
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {processedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Filtros */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="reset-filters-devoluciones"
              onChange={(e) => {
                if (e.target.checked) {
                  console.log('🔄 DEVOLUCIONES: Restableciendo filtros');
                  setFilters({ folio: '', fecha: '', monto: '', sucursal: '', caja: '' });
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="reset-filters-devoluciones" className="text-sm text-gray-700">
              Restablecer filtros
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folio
            </label>
            <input
              type="text"
              value={filters.folio}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, folio: e.target.value }));
                console.log('🔍 DEVOLUCIONES: Filtro folio aplicado:', e.target.value);
              }}
              placeholder="Buscar folio..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha y hora
            </label>
            <input
              type="date"
              value={filters.fecha}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, fecha: e.target.value }));
                console.log('📅 DEVOLUCIONES: Filtro fecha aplicado:', e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto total
            </label>
            <input
              type="number"
              value={filters.monto}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, monto: e.target.value }));
                console.log('💰 DEVOLUCIONES: Filtro monto aplicado:', e.target.value);
              }}
              placeholder="Monto total..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursales
            </label>
            <select 
              value={filters.sucursal}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, sucursal: e.target.value }));
                console.log('🏢 DEVOLUCIONES: Filtro sucursal aplicado:', e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sucursales</option>
              <option value="N°1">N°1</option>
              <option value="N°2">N°2</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caja
            </label>
            <select 
              value={filters.caja}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, caja: e.target.value }));
                console.log('📦 DEVOLUCIONES: Filtro caja aplicado:', e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las cajas</option>
              <option value="N°1">N°1</option>
              <option value="N°2">N°2</option>
            </select>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                console.log('✅ DEVOLUCIONES: Filtros aplicados correctamente:', filters);
                setShowFilters(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}