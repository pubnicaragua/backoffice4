import { useEffect, useState } from "react";
import { DetallePedido } from "./DetallePedido";
import { Filter, Plus, Download } from "lucide-react";
import { saveAs } from "file-saver";
import {
  useSupabaseData,
} from "../../hooks/useSupabaseData";
import { Modal } from "../Common/Modal";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

import { useAuth } from "../../contexts/AuthContext";
import { AgregarPedidoModal } from "./modals/CrearPedido";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

export function RecepcionPedidos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const { empresaId } = useAuth();
  const [filters, setFilters] = useState({
    proveedor: "",
    fecha: "",
    estado: "",
  });

  const {
    data: proveedores
  } = useSupabaseData<any>(
    "clientes",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  )

  const [loading, setLoading] = useState<boolean>(true)

  const { data: productos } = useSupabaseData("productos", "*", empresaId ? { empresa_id: empresaId } : undefined)

  const {
    data: pedidos,
    loading: pedidosLoading,
    refetch,
  } = useSupabaseData<any>(
    "pedidos",
    "*, sucursales(nombre)",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { data: sucursales } = useSupabaseData<any>(
    "sucursales",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );
  const { data: clientes } = useSupabaseData<any>(
    "clientes",
    "*"
  );

  // Procesa datos para tabla principal
  const processedData = (pedidos || [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((pedido) => {
      const fechaPedido =
        pedido.fecha || pedido.fecha_pedido || pedido.created_at;
      const proveedor =
        pedido.clientes?.razon_social ||
        clientes.find((c) => c.id === pedido.proveedor_id)?.razon_social ||
        "Proveedor Desconocido";
      const sucursal =
        pedido.sucursales?.nombre ||
        sucursales.find((s) => s.id === pedido.sucursal_id)?.nombre ||
        "Sucursal Desconocida";

      return {
        id: pedido.id,
        proveedor,
        folio_factura: pedido.folio || `PED-${pedido.id?.slice(0, 8)}`,
        fecha: new Date(fechaPedido).toLocaleDateString("es-CL"),
        monto_total: `$${(pedido.total || 0).toLocaleString("es-CL")}`,
        sucursal_captura: sucursal,
        pedido,
      };
    });

  // Aplica filtros sobre los datos procesados
  const filteredData = processedData.filter((item) => {
    if (
      filters.proveedor &&
      !item.proveedor.toLowerCase().includes(filters.proveedor.toLowerCase())
    )
      return false;
    if (filters.fecha && !item.fecha.includes(filters.fecha)) return false;
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

  const handleDownloadReport = () => {
    const headers = [
      "Proveedor",
      "Folio Factura",
      "Fecha",
      "Monto Total",
      "Sucursal Captura",
    ];
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.proveedor,
          row.folio_factura,
          row.fecha,
          row.monto_total.replace(/[$.,]/g, ""),
          row.sucursal_captura,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(
      blob,
      `reporte_pedidos_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  useEffect(() => {
    refetch()
  }, [loading]);

  const applyFilters = () => {
    setCurrentPage(1);
    setShowFilters(false);
  };

  if (pedidosLoading) {
    return <div className="text-center py-4">Cargando pedidos...</div>;
  }

  // if (showDetalle) {
  //   const selectedProveedor = proveedores.find((proveedor) => proveedor.nombre === selectedPedido.proovedor)

  //   return (
  //     <DetallePedido
  //       productos={productos}
  //       onBack={() => setShowDetalle(false)}
  //       pedido={selectedPedido}
  //       proveedor={selectedProveedor}
  //     />
  //   );
  // }

  const refresh = () => {
    refetch()
    setLoading(true)
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
            <span>Agregar pedido recibido</span>
          </button>

          <button
            onClick={handleDownloadReport}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Descargar Reporte"
          >
            <Download className="w-4 h-4" />
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
                      className={`px-3 py-1 rounded-md text-sm ${currentPage === page
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

      <AgregarPedidoModal
        refresh={refresh}
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        empresaId={empresaId!}
        sucursales={sucursales}
      />
    </div>
  );
}
