import React, { useState } from 'react';
import { Table } from '../Common/Table';
import { Filter, Search, Plus } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';

export function CuponesTodas() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: cupones, loading } = useSupabaseData<any>('cupones', '*, sucursales(nombre)');

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'valor', label: 'Valor' },
    { key: 'usos', label: 'Usos' },
    { key: 'estado', label: 'Estado' },
  ];

  const processedData = cupones.map(cupon => ({
    id: cupon.id,
    codigo: cupon.codigo,
    nombre: cupon.nombre,
    tipo: cupon.tipo === 'descuento' ? 'Descuento' : cupon.tipo === 'envio_gratis' ? 'Envío Gratis' : 'Regalo',
    valor: cupon.tipo === 'envio_gratis' ? 'Gratis' : 
           cupon.valor > 100 ? `$${cupon.valor.toLocaleString('es-CL')}` : `${cupon.valor}%`,
    usos: `${cupon.usos_actuales}/${cupon.usos_maximos}`,
    estado: cupon.activo ? 'Activo' : 'Inactivo',
  }));

  const filteredData = processedData.filter(item =>
    searchTerm === '' || 
    item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-4">Cargando cupones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Cupones</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => console.log('🔍 CUPONES: Abriendo filtros')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          <button 
            onClick={() => console.log('➕ CUPONES: Abriendo agregar')}
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
          placeholder="Buscar cupones"
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