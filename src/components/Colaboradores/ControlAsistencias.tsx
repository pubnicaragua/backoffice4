import React, { useState } from 'react';
import { Table } from '../Common/Table';
import { FilterModal } from '../Common/FilterModal';
import { Search, Eye, Filter } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';

export function ControlAsistencias() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: asistencias, loading } = useSupabaseData<any>('asistencias', '*');

  const columns = [
    { key: 'nombres', label: 'Nombres' },
    { key: 'rut', label: 'RUT' },
    { key: 'fecha_hora', label: 'Fecha y hora' },
    { key: 'ingreso_salida', label: 'Ingreso - Salida' },
    { key: 'horas_trabajadas', label: 'Horas trabajadas' },
    { key: 'sucursal', label: 'Sucursal' },
  ];

  const processedData = (asistencias || []).map(asistencia => ({
    nombres: 'Pedro Pérez',
    rut: '12.345.678-9',
    fecha_hora: new Date(asistencia.fecha).toLocaleDateString('es-CL'),
    ingreso_salida: `${asistencia.hora_ingreso || '08:00'} - ${asistencia.hora_salida || '18:00'}`,
    horas_trabajadas: asistencia.hora_ingreso && asistencia.hora_salida ? 
      `${Math.round((new Date(`1970-01-01T${asistencia.hora_salida}`) - new Date(`1970-01-01T${asistencia.hora_ingreso}`)) / (1000 * 60 * 60))}H` : '0H',
    sucursal: 'Sucursal N°1',
  }));

  const filteredData = processedData.filter(item =>
    item.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.rut.includes(searchTerm)
  );

  if (loading) {
    return <div className="text-center py-4">Cargando asistencias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Control de asistencias</h2>
          <p className="text-sm text-gray-600">Este mes</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Eye className="w-4 h-4" />
            <span>Ver reporte de asistencia</span>
          </button>
          <button 
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>
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
              <tr key={index} className="hover:bg-gray-50">
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

      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas las sucursales</option>
              <option value="n1">N°1</option>
              <option value="n2">N°2</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar hora</option>
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
            </select>
          </div>
        </div>
      </FilterModal>
    </div>
  );
}