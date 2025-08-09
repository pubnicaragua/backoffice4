import React, { useState } from "react";
import { Search, Filter, Eye } from "lucide-react";
import { Modal } from "../Common/Modal";
import { DocumentoDetalleModal } from "./DocumentoDetalleModal";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";

export function DocumentosEmitidos() {
  const { empresaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showDetalle, setShowDetalle] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [filters, setFilters] = useState({
    fecha: "",
    montoMinimo: "",
    sucursal: "",
    tipoDocumento: "",
  });

  // Filtrar ventas por empresa
  const { data: ventas, loading } = useSupabaseData<any>(
    "ventas",
    "*, sucursales(nombre)",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Obtener sucursales filtradas por empresa
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

  const processedData = (ventas || []).map((venta) => ({
    folio: venta.folio || `DOC-${venta.id?.slice(0, 8)}`,
    fecha: new Date(venta.fecha).toLocaleDateString("es-CL"),
    tipo: venta.tipo_dte === "factura" ? "Factura" : "Boleta",
    monto: parseFloat(venta.total) || 0,
    sucursal: venta.sucursales?.nombre || "Sin sucursal",
    estado: venta.estado || "Completado",
    venta: venta,
  }));

  const filteredData = processedData.filter((item) => {
    if (
      searchTerm &&
      !item.folio.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    if (filters.fecha && !item.fecha.includes(filters.fecha)) return false;
    if (filters.montoMinimo && item.monto < parseFloat(filters.montoMinimo))
      return false;
    if (filters.sucursal && item.venta.sucursal_id !== filters.sucursal)
      return false;
    if (filters.tipoDocumento && item.tipo !== filters.tipoDocumento)
      return false;
    return true;
  });

  const handleViewDocument = (document) => {
    setSelectedDocument(document);
    setShowDetalle(true);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando documentos...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Documentos Emitidos
        </h1>
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por folio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Folio
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sucursal
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{row.folio}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.fecha}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.tipo}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  ${row.monto.toLocaleString("es-CL")}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.sucursal}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.estado}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <button
                    onClick={() => handleViewDocument(row)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Filter Modal */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros de Documentos"
      >
        <div className="space-y-4">
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
              Monto Mínimo
            </label>
            <input
              type="number"
              value={filters.montoMinimo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, montoMinimo: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              Tipo de Documento
            </label>
            <select
              value={filters.tipoDocumento}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  tipoDocumento: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="Factura">Factura</option>
              <option value="Boleta">Boleta</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Document Detail Modal */}
      <DocumentoDetalleModal
        isOpen={showDetalle}
        onClose={() => setShowDetalle(false)}
        documento={selectedDocument}
      />
    </div>
  );
}
