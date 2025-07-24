import React, { useState } from 'react';
import { Filter, Plus, Download } from 'lucide-react';
import { DetalleDespacho } from '../Pedidos/DetalleDespacho';
import { saveAs } from 'file-saver'; // Import file-saver
import { useSupabaseData, useSupabaseInsert } from '../../hooks/useSupabaseData';
import { Modal } from '../Common/Modal';

export function GestionDespachos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedDespacho, setSelectedDespacho] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [filters, setFilters] = useState({
    fecha: '',
    estado: '',
    sucursal: ''
  });

  const { data: despachos, loading, refetch } = useSupabaseData<any>('despachos', '*');
  const { insert, loading: inserting } = useSupabaseInsert('despachos');
  const { data: usuarios } = useSupabaseData<any>('usuarios', 'id, nombres, apellidos');

  // Apply filters
  const filteredDespachos = (despachos || []).filter(despacho => {
    if (filters.fecha && !new Date(despacho.fecha || despacho.created_at).toLocaleDateString('es-CL').includes(filters.fecha)) return false;
    if (filters.estado && despacho.estado.toLowerCase() !== filters.estado.toLowerCase()) return false;
    if (filters.sucursal && despacho.sucursal_id !== filters.sucursal) return false;
    return true;
  });

  const processedData = filteredDespachos.map(despacho => ({
    id: despacho.id, // Keep original ID for detail view
    entregado_por: usuarios.find(u => u.id === despacho.entregado_por)?.nombres || 'Emilio Aguilera',
    folio_factura: despacho.folio || despacho.id?.slice(0, 8) || 'N/A',
    fechaDisplay: new Date(despacho.fecha || despacho.created_at).toLocaleDateString('es-CL'),
    monto_total: `$${Math.floor(Math.random() * 50000 + 10000).toLocaleString('es-CL')}`,
    estado: despacho.estado === 'pendiente' ? 'Pendiente' : 'Entregado',
    sucursal_destino: despacho.direccion || 'Jr. Santiago de Chile 193',
    despacho: despacho
  }));

  // Apply search term filter (if any)
  const filteredData = processedData.filter(item => {
    if (filters.fecha && !item.fechaDisplay.includes(filters.fecha)) return false;
    if (filters.estado && item.estado.toLowerCase() !== filters.estado.toLowerCase()) return false;
    return true;
  });

  // Aplicar ordenamiento
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'fecha') {
      const dateA = new Date(a.fechaDisplay);
      const dateB = new Date(b.fechaDisplay);
      return sortOrder === 'desc' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
    }
    return 0;
  });

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetalle = (despacho) => {
    setSelectedDespacho(despacho);
    setShowDetalle(true);
  };

  const handleAgregarDespacho = async () => {
    console.log('➕ DESPACHO: Iniciando creación');
    
    // No hacer insert automático, solo mostrar el modal
    console.log('📝 DESPACHO: Mostrando modal para datos manuales');
  };

  const handleDownloadReport = () => {
    console.log('📥 DESPACHO: Descargando reporte');
    try {
      const headers = ['Entregado por', 'Folio', 'Fecha', 'Monto', 'Estado', 'Sucursal'];
      const csvContent = [
        headers.join('\t'),
        ...filteredData.map(d => [
          d.entregado_por,
          d.folio_factura,
          d.fecha,
          d.monto_total,
          d.estado,
          d.sucursal_destino
        ].join('\t'))
      ].join('\n');
    
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' }); // Changed to CSV
      saveAs(blob, `reporte_despachos_${new Date().toISOString().split('T')[0]}.csv`); // Changed to CSV
      console.log('✅ DESPACHO: Reporte descargado');
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error al descargar el reporte.');
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando despachos...</div>;
  }

  if (showDetalle) {
    return <DetalleDespacho onBack={() => setShowDetalle(false)} despacho={selectedDespacho} />;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de despachos</h1>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Selector de items por página */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          {/* Ordenamiento */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Ordenar:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="fecha-desc">Fecha (Más reciente)</option>
              <option value="fecha-asc">Fecha (Más antiguo)</option>
            </select>
          </div>
          
          <button 
            onClick={handleDownloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Descargar</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entregado por
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Folio de factura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sucursal de destino
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewDetalle(row)}
              >
                <td className="px-6 py-4 text-sm text-gray-900">{row.entregado_por}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.folio_factura}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.fechaDisplay}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.monto_total}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.estado}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.sucursal_destino}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Paginación mejorada */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedData.length)} de {sortedData.length} despachos
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Filtros */}
    </div>
  );
}