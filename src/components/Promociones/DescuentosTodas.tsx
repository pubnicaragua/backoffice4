import React, { useState } from 'react';
import { Table } from '../Common/Table';
import { Filter, Search, Plus } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';

export function DescuentosTodas() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: descuentos, loading } = useSupabaseData<any>('descuentos', '*, sucursales(nombre)');

  const columns = [
    { key: 'nombre', label: 'Descuento' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'valor', label: 'Valor' },
    { key: 'sucursal', label: 'Sucursal' },
    { key: 'estado', label: 'Estado' },
  ];

  const processedData = descuentos.map(descuento => ({
    id: descuento.id,
    nombre: descuento.nombre,
    tipo: descuento.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo',
    valor: descuento.tipo === 'porcentaje' ? `${descuento.valor}%` : `$${descuento.valor.toLocaleString('es-CL')}`,
    sucursal: descuento.sucursales?.nombre || 'Todas',
    estado: descuento.activo ? 'Activo' : 'Inactivo',
  }));

  const filteredData = processedData.filter(item =>
    searchTerm === '' || 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-4">Cargando descuentos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Descuentos</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => console.log('🔍 DESCUENTOS: Abriendo filtros')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          <button 
            onClick={() => console.log('➕ DESCUENTOS: Abriendo agregar')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar descuentos"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <Table
        columns={columns}
        data={filteredData}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredData.length / 10)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}