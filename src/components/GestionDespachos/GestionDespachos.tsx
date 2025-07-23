import React, { useState } from 'react';
import { Filter, Plus, Download } from 'lucide-react';
import { DetalleDespacho } from '../Pedidos/DetalleDespacho';
import { useSupabaseData, useSupabaseInsert } from '../../hooks/useSupabaseData';
import { Modal } from '../Common/Modal';

export function GestionDespachos() {
  const [currentPage, setCurrentPage] = useState(1);
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
    id: despacho.id,
    entregado_por: usuarios.find(u => u.id === despacho.entregado_por)?.nombres || 'Emilio Aguilera',
    folio_factura: despacho.folio || despacho.id?.slice(0, 8) || 'N/A',
    fecha: new Date(despacho.fecha || despacho.created_at).toLocaleDateString('es-CL'),
    monto_total: `$${Math.floor(Math.random() * 50000 + 10000).toLocaleString('es-CL')}`,
    estado: despacho.estado === 'pendiente' ? 'Pendiente' : 'Entregado',
    sucursal_destino: despacho.direccion || 'Jr. Santiago de Chile 193',
    despacho: despacho
  }));

  const filteredData = processedData.filter(item => {
    if (filters.fecha && !item.fecha.includes(filters.fecha)) return false;
    if (filters.estado && item.estado.toLowerCase() !== filters.estado.toLowerCase()) return false;
    return true;
  });

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
      const blob = new Blob([BOM + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_despachos_${new Date().toISOString().split('T')[0]}.xls`;
      a.click();
      URL.revokeObjectURL(url);
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
          <button 
            onClick={handleDownloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
            {filteredData.map((row, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewDetalle(row)}
              >
                <td className="px-6 py-4 text-sm text-gray-900">{row.entregado_por}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.folio_factura}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.fecha}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.monto_total}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.estado}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.sucursal_destino}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="flex items-center justify-center px-6 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100">
              2
            </button>
            <button className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100">
              3
            </button>
            <button className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Filtros */}
    </div>
  );
}