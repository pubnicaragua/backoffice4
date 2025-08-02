import React, { useState } from 'react';
import { Table } from '../Common/Table';
import { Search, ArrowLeft } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';

export function ReporteAsistencia() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: asistencias, loading } = useSupabaseData<any>(
    'asistencias',
    '*, usuarios(nombres, rut)'
  );

  const columns = [
    { key: 'nombre', label: 'Nombres' },
    { key: 'rut', label: 'RUT' },
    { key: 'horasTrabajadas', label: 'Horas totales trabajadas' },
    { key: 'horasTotales', label: 'Horas totales trabajadas' },
  ];

  const processedData = asistencias.map(asistencia => ({
    nombre: asistencia.usuarios?.nombres || 'Pedro Pérez',
    rut: asistencia.usuarios?.rut || '12.345.678-9',
    horasTrabajadas: '80H',
    horasTotales: '2H',
  }));

  const filteredData = processedData.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.rut.includes(searchTerm)
  );

  if (loading) {
    return <div className="text-center py-4">Cargando asistencias...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center space-x-4 mb-6">
        <button className="p-2 rounded-md hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Reporte de asistencia</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-600">Este mes</span>
          
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
        </div>

        <Table
          columns={columns}
          data={filteredData}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / 10)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}