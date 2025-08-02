import React, { useState } from "react";
import { DetallePedido } from "./DetallePedido";
import { Filter, Plus } from "lucide-react";
import {
  useSupabaseData,
  useSupabaseInsert,
} from "../../hooks/useSupabaseData";
import { Modal } from "../Common/Modal";

export function RecepcionPedidos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [filters, setFilters] = useState({
    proveedor: "",
    fecha: "",
    estado: "",
  });

  // Formulario para agregar pedido manualmente
  const [formData, setFormData] = useState({
    proveedor: "",
    folio_factura: "",
    monto_total: "",
    sucursal_captura: "",
    archivo_respaldo: null as File | null,
  });

  // Hooks para datos
  const {
    data: pedidos,
    loading,
    refetch,
  } = useSupabaseData<any>("pedidos", "*, sucursales(nombre)");
  const { data: sucursales } = useSupabaseData<any>("sucursales", "*");
  const { insert, loading: inserting } = useSupabaseInsert("pedidos");

  // Procesa datos para tabla principal
  const processedData = (pedidos || [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((pedido) => {
      const fechaPedido = pedido.fecha || pedido.created_at;
      const sucursal =
        pedido.sucursales?.nombre ||
        sucursales.find((s) => s.id === pedido.sucursal_id)?.nombre ||
        "Sucursal Desconocida";

      return {
        id: pedido.id,
        proveedor: pedido.razon_social || "Proveedor Desconocido",
        folio_factura: pedido.folio || `PED-${pedido.id?.slice(0, 8)}`,
        fecha: new Date(fechaPedido).toLocaleDateString("es-CL"),
        monto_total: `$${(pedido.total || 0).toLocaleString("es-CL")}`,
        sucursal_captura: sucursal,
        pedido,
      };
    });

  // Aplica filtros sobre los datos procesados
  const filteredData = processedData.filter((item) => {
    if (filters.proveedor && !item.proveedor.toLowerCase().includes(filters.proveedor.toLowerCase())) return false;
    
    if (filters.fecha) {
      const filterDateStr = filters.fecha;
      const itemDateStr = new Date(item.pedido.fecha || item.pedido.created_at).toISOString().split('T')[0];
      if (filterDateStr !== itemDateStr) return false;
    }
    
    if (filters.estado && item.pedido.estado !== filters.estado) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleViewDetalle = (pedido: any) => {
    setSelectedPedido(pedido);
    setShowDetalle(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipos de archivo permitidos
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Solo se permiten archivos PNG, JPG, JPEG y PDF');
        return;
      }
      setFormData(prev => ({ ...prev, archivo_respaldo: file }));
    }
  };

  const handleAgregarPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.proveedor.trim()) {
      alert("Por favor ingresa el nombre del proveedor");
      return;
    }
    if (!formData.folio_factura.trim()) {
      alert("Por favor ingresa el folio de la factura");
      return;
    }
    if (!formData.monto_total) {
      alert("Por favor ingresa el monto total");
      return;
    }
    if (!formData.sucursal_captura) {
      alert("Por favor selecciona una sucursal de captura");
      return;
    }

    console.log('📝 PEDIDOS: Agregando pedido manual', formData);

    try {
      const success = await insert({
        empresa_id: "00000000-0000-0000-0000-000000000001",
        sucursal_id: formData.sucursal_captura,
        razon_social: formData.proveedor.trim(),
        folio: formData.folio_factura.trim(),
        fecha: new Date().toISOString(),
        total: parseFloat(formData.monto_total),
        estado: "recibido",
      });

      if (success) {
        console.log('✅ PEDIDOS: Pedido agregado exitosamente');
        setShowAgregarModal(false);
        setFormData({
          proveedor: "",
          folio_factura: "",
          monto_total: "",
          sucursal_captura: "",
          archivo_respaldo: null,
        });
        refetch();
      }
    } catch (error) {
      console.error('❌ PEDIDOS: Error agregando pedido:', error);
      alert(`Error al agregar el pedido: ${error.message}`);
    }
  };

  const applyFilters = () => {
    console.log('🔍 PEDIDOS: Aplicando filtros', filters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando pedidos...</div>;
  }

  if (showDetalle) {
    return (
      <DetallePedido
        onBack={() => setShowDetalle(false)}
        pedido={selectedPedido}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Recepción de Pedidos
        </h1>

        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>

          <button
            onClick={() => setShowAgregarModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar pedido</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Mostrar:</label>
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
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Folio factura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Monto total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sucursal de captura
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewDetalle(row)}
              >
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.proveedor}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.folio_factura}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{row.fecha}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.monto_total}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {row.sucursal_captura}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a{" "}
                {Math.min(startIndex + itemsPerPage, filteredData.length)} de{" "}
                {filteredData.length} pedidos
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
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
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
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor
            </label>
            <input
              type="text"
              value={filters.proveedor}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, proveedor: e.target.value }))
              }
              placeholder="Buscar proveedor..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

          <div className="flex justify-end">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Agregar Pedido Manual */}
      <Modal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        title="Agregar pedido"
        size="md"
      >
        <form onSubmit={handleAgregarPedido} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor *
            </label>
            <input
              type="text"
              value={formData.proveedor}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, proveedor: e.target.value }))
              }
              placeholder="Nombre del proveedor"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folio factura *
            </label>
            <input
              type="text"
              value={formData.folio_factura}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, folio_factura: e.target.value }))
              }
              placeholder="Número de folio"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="text"
              value={new Date().toLocaleDateString("es-CL")}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              La fecha se asigna automáticamente
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto total *
            </label>
            <input
              type="number"
              value={formData.monto_total}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, monto_total: e.target.value }))
              }
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal de captura *
            </label>
            <select
              value={formData.sucursal_captura}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sucursal_captura: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Archivo de respaldo (PNG, JPG, JPEG, PDF)
            </label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileUpload}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.archivo_respaldo && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Archivo seleccionado: {formData.archivo_respaldo.name}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Opcional: Sube una foto de la guía de despacho como respaldo
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAgregarModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={inserting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {inserting ? "Guardando..." : "Guardar pedido"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}