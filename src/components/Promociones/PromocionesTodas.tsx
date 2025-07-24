import React, { useState } from "react";
import { Filter, Search, Plus, Edit, Download, Trash2 } from "lucide-react";
import {
  useSupabaseData,
  useSupabaseUpdate,
} from "../../hooks/useSupabaseData";
import { AgregarPromocionModal } from "./AgregarPromocionModal";
import { EditarPromocionModal } from "./EditarPromocionModal";
import { Modal } from "../Common/Modal";

export function PromocionesTodas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [selectedPromocion, setSelectedPromocion] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filters, setFilters] = useState({
    sucursal: "",
    estado: "",
    tipo: "",
  });

  const {
    data: promociones,
    loading,
    refetch,
  } = useSupabaseData<any>("promociones", "*, sucursales(nombre)");
  const { data: sucursales } = useSupabaseData<any>("sucursales", "*");
  const { update: updatePromocion } = useSupabaseUpdate("promociones");
  const { data: productos } = useSupabaseData<any>("productos", "*");

  // Filtrar promociones con filtro por tipo incluido
  const filteredPromociones = (promociones || []).filter((promocion) => {
    if (filters.sucursal && promocion.sucursal_id !== filters.sucursal)
      return false;
    if (
      filters.estado &&
      (promocion.activo ? "activo" : "inactivo") !== filters.estado
    )
      return false;
    if (filters.tipo && (promocion.tipo || "") !== filters.tipo) return false;
    return true;
  });

  const obtenerNombresProductos = (productosIds: any) => {
    if (!productosIds || productos.length === 0) return "";
    const idsArray = Array.isArray(productosIds)
      ? productosIds
      : [productosIds];
    const prodsRelacionados = productos.filter(
      (p) => idsArray.includes(p.id) || idsArray.includes(String(p.id))
    );
    const prodsAMostrar =
      prodsRelacionados.length > 3
        ? shuffleArray(prodsRelacionados).slice(0, 3)
        : prodsRelacionados;
    const nombres = prodsAMostrar.map((p) => p.nombre).join(", ");
    return nombres + (prodsRelacionados.length > 3 ? "..." : "");
  };

  const shuffleArray = (array: any[]) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const processedData = filteredPromociones.map((promocion) => ({
    id: promocion.id,
    nombre: promocion.nombre,
    descripcion: promocion.descripcion,
    sucursal: promocion.sucursales?.nombre || "N°1",
    precio: Math.round(promocion.precio_prom || 0),
    disponible: promocion.activo ? "Disponible" : "No disponible",
    tipo: promocion.tipo || "",
    promocion,
    productosId: promocion.productos_id,
  }));

  const filteredData = processedData.filter(
    (item) =>
      searchTerm === "" ||
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditPromocion = (promocion: any) => {
    setSelectedPromocion(promocion);
    setShowEditarModal(true);
  };

  const handleDeletePromocion = (promocion: any) => {
    setSelectedPromocion(promocion);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedPromocion) {
      const success = await updatePromocion(selectedPromocion.id, {
        activo: false,
      });
      if (success) {
        setShowDeleteModal(false);
        setSelectedPromocion(null);
        refetch();
      } else {
        alert("Error eliminando la promoción");
      }
    }
  };

  const handleDownloadReport = () => {
    try {
      const headers = [
        "Promocion",
        "Descripcion",
        "Sucursal",
        "Precio",
        "Disponible",
        "Tipo",
      ];
      const csvContent = [
        headers.join("\t"),
        ...filteredData.map((p) =>
          [
            p.nombre,
            p.descripcion,
            p.sucursal,
            p.precio,
            p.disponible,
            p.tipo,
          ].join("\t")
        ),
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_promociones_${
        new Date().toISOString().split("T")[0]
      }.xls`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Error al descargar el reporte.");
    }
  };

  if (loading)
    return <div className="text-center py-4">Cargando promociones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Promociones de todas las tiendas
        </h2>
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          <button
            onClick={() => setShowAgregarModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
          <button
            onClick={handleDownloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Descargar reporte"
          >
            <Download className="w-4 h-4" />
            <span>Descargar</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tabla promociones */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Promoción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Productos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sucursal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Disponible
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.nombre}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="text-xs text-gray-600">
                    {obtenerNombresProductos(row.productosId)}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.descripcion}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.sucursal}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                  {row.tipo}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.disponible}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditPromocion(row)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      title="Editar promoción"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePromocion(row)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      title="Eliminar promoción"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AgregarPromocionModal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        onSuccess={() => {
          setShowAgregarModal(false);
          refetch();
        }}
      />

      <EditarPromocionModal
        isOpen={showEditarModal}
        onClose={() => setShowEditarModal(false)}
        promocion={selectedPromocion}
        onSuccess={() => {
          setShowEditarModal(false);
          setSelectedPromocion(null);
          refetch();
        }}
      />

      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        size="md"
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
              {sucursales?.map((sucursal: any) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de promoción
            </label>
            <select
              value={filters.tipo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, tipo: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los tipos</option>
              <option value="2x1">2x1</option>
              <option value="descuento">Descuento</option>
              <option value="combo">Combo</option>
              <option value="oferta">Oferta Especial</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Promoción"
        size="sm"
      >
        <div className="text-center space-y-4">
          <p>
            ¿Estás seguro de que deseas eliminar la promoción "
            {selectedPromocion?.nombre}"?
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
