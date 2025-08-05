import React, { useState, useMemo } from "react";
import { FilterModal } from "../Common/FilterModal";
import { Search, Eye, Filter } from "lucide-react";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";

export function ControlAsistencias() {
  const { empresaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sucursal: "",
    fecha: "",
    estado: "",
  });

  // Filtrar asistencias por empresa
  const { data: asistencias, loading } = useSupabaseData<any>(
    "asistencias",
    "*, usuarios(nombres, apellidos, rut)",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Filtrar sucursales por empresa
  const { data: sucursales } = useSupabaseData<any>(
    "sucursales",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Validación de empresa
  if (!empresaId) {
    return (
      <div className="text-center py-4">
        Error: No se pudo determinar la empresa.
      </div>
    );
  }

  const columns = [
    { key: "nombres", label: "Nombres" },
    { key: "rut", label: "RUT" },
    { key: "fecha_hora", label: "Fecha y hora" },
    { key: "ingreso_salida", label: "Ingreso - Salida" },
    { key: "horas_trabajadas", label: "Horas trabajadas" },
    { key: "sucursal", label: "Sucursal" },
  ];

  const processedData = (asistencias || []).map((asistencia) => {
    const sucursal = sucursales?.find((s) => s.id === asistencia.sucursal_id);
    const horasTrabajadas =
      asistencia.hora_ingreso && asistencia.hora_salida
        ? Math.round(
            (new Date(`1970-01-01T${asistencia.hora_salida}`) -
              new Date(`1970-01-01T${asistencia.hora_ingreso}`)) /
              (1000 * 60 * 60)
          )
        : 0;

    return {
      nombres: `${asistencia.usuarios?.nombres || ""} ${
        asistencia.usuarios?.apellidos || ""
      }`.trim(),
      rut: asistencia.usuarios?.rut || "Sin RUT",
      fecha_hora: new Date(asistencia.fecha).toLocaleDateString("es-CL"),
      ingreso_salida: `${asistencia.hora_ingreso || "--:--"} - ${
        asistencia.hora_salida || "--:--"
      }`,
      horas_trabajadas: `${horasTrabajadas}H`,
      sucursal: sucursal?.nombre || "Sin sucursal",
      asistencia: asistencia,
    };
  });

  // Aplicar filtros
  const filteredData = processedData.filter((item) => {
    if (
      searchTerm &&
      !item.nombres.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.rut.includes(searchTerm)
    )
      return false;
    if (filters.sucursal && item.asistencia.sucursal_id !== filters.sucursal)
      return false;
    if (filters.fecha && !item.fecha_hora.includes(filters.fecha)) return false;
    if (filters.estado && item.asistencia.estado !== filters.estado)
      return false;
    return true;
  });

  if (loading) {
    return <div className="text-center py-4">Cargando asistencias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Control de asistencias
          </h2>
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
          placeholder="Buscar por nombre o RUT..."
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
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm text-gray-900"
                  >
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
            <select
              value={filters.sucursal}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, sucursal: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sucursales</option>
              {sucursales?.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              value={filters.fecha}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, fecha: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, estado: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="presente">Presente</option>
              <option value="ausente">Ausente</option>
              <option value="tarde">Tarde</option>
              <option value="justificado">Justificado</option>
            </select>
          </div>
        </div>
      </FilterModal>
    </div>
  );
}
