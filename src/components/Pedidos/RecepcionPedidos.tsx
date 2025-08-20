import React, { useState } from "react";
import { DetallePedido } from "./DetallePedido";
import { Filter, Plus, Download, FileDown } from "lucide-react";
import { saveAs } from "file-saver";
import {
  useSupabaseData,
  useSupabaseInsert,
} from "../../hooks/useSupabaseData";
import { Modal } from "../Common/Modal";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

import { extraerDatosCompletos } from "../../../utils/pdfParser";
import { useAuth } from "../../contexts/AuthContext";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

interface Producto {
  numero_serie: string;
  cantidad: number;
  descripcion: string;
  total: number | null;
}

interface ResultadoExtraccion {
  proveedor: string | null;
  productos: Producto[];
  costo_total: number | null;
}

export function RecepcionPedidos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedPdfInfo, setParsedPdfInfo] =
    useState<ResultadoExtraccion | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: string]: { selected: boolean; cantidad: number };
  }>({});
  const [processing, setProcessing] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const { empresaId } = useAuth();
  const [filters, setFilters] = useState({
    proveedor: "",
    fecha: "",
    estado: "",
  });
  const [sucursalCaptura, setSucursalCaptura] = useState("");

  const {
    data: pedidos,
    loading,
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
  const { data: clientes, refetch: refetchClientes } = useSupabaseData<any>(
    "clientes",
    "*"
  );
  const { insert, loading: inserting } = useSupabaseInsert("pedidos");
  const { insert: insertCliente, loading: insertingCliente } =
    useSupabaseInsert("clientes");

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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      await processFile(uploadedFile);
    }
  };

  const processFile = async (file: File) => {
    setProcessing(true);
    setParsedPdfInfo(null);
    setSelectedProducts({});
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n";
      }
      const resultado: ResultadoExtraccion = extraerDatosCompletos(fullText);
      setParsedPdfInfo(resultado);

      // Inicializa selectedProducts con todos seleccionados y cantidades
      const initialSelectedProducts = resultado.productos.reduce(
        (acc, producto) => {
          acc[producto.descripcion] = {
            selected: true,
            cantidad: producto.cantidad,
          };
          return acc;
        },
        {} as { [key: string]: { selected: boolean; cantidad: number } }
      );
      setSelectedProducts(initialSelectedProducts);
    } catch (error) {
      console.error("Error procesando PDF:", error);
      alert("No se pudo procesar el archivo PDF correctamente.");
    } finally {
      setProcessing(false);
    }
  };

  // Espera a que cliente aparezca en datos de clientes tras la recarga
  const waitForCliente = async (
    razon_social: string,
    retries = 5,
    delayMs = 500
  ): Promise<string> => {
    for (let i = 0; i < retries; i++) {
      const clienteEncontrado = (clientes || []).find(
        (c) =>
          c.razon_social?.trim().toLowerCase() === razon_social.toLowerCase()
      );
      if (clienteEncontrado) return clienteEncontrado.id;

      // Esperar antes de reiniciar
      await new Promise((res) => setTimeout(res, delayMs));
      await refetchClientes();
    }
    throw new Error(
      "No se pudo obtener el id del nuevo cliente insertado después de crear"
    );
  };

  // Obtiene el id de proveedor: busca o inserta y espera a tenerlo
  const getProveedorId = async (): Promise<string> => {
    if (!parsedPdfInfo?.proveedor) {
      throw new Error("Proveedor no detectado en el PDF");
    }
    const nombreProveedor = parsedPdfInfo.proveedor.trim();

    const clienteExistente = (clientes || []).find(
      (c) =>
        c.razon_social?.trim().toLowerCase() === nombreProveedor.toLowerCase()
    );
    if (clienteExistente) {
      return clienteExistente.id;
    }

    // Inserta cliente nuevo
    const insertResult = await insertCliente({ razon_social: nombreProveedor });
    if (!insertResult) {
      throw new Error("Error insertando nuevo cliente");
    }

    // Espera y obtiene el id del cliente insertado
    const clienteId = await waitForCliente(nombreProveedor);
    return clienteId;
  };

  const handleAgregarPedido = async () => {
    if (!sucursalCaptura) {
      alert("Por favor selecciona una sucursal de captura");
      return;
    }
    if (!parsedPdfInfo) {
      alert("No hay datos para agregar.");
      return;
    }
    try {
      setProcessing(true);

      const proveedorId = await getProveedorId();

      const productosSeleccionados = Object.entries(selectedProducts)
        .filter(([_, data]) => data.selected)
        .map(([key, data]) => {
          const producto = parsedPdfInfo.productos.find(
            (p) => p.descripcion === key
          );
          return {
            nombre: key,
            cantidad: data.cantidad,
            costo: producto?.total || 1000,
          };
        });

      const totalPedido = productosSeleccionados.reduce(
        (sum, p) => sum + p.cantidad * p.costo,
        0
      );

      const success = await insert({
        empresa_id: empresaId,
        sucursal_id: sucursalCaptura,
        proveedor_id: proveedorId,
        folio: `PED-${Date.now()}`,
        fecha: new Date().toISOString(),
        estado: "pendiente",
        total: totalPedido,
      });

      if (success) {
        setShowAgregarModal(false);
        setFile(null);
        setParsedPdfInfo(null);
        setSelectedProducts({});
        setSucursalCaptura("");
        refetch();
        refetchClientes();
      }
    } catch (error) {
      console.error("Error agregando pedido:", error);
      alert(`Hubo un error al agregar el pedido: ${(error as Error).message}`);
    } finally {
      setProcessing(false);
    }
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

  const applyFilters = () => {
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

      <Modal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        title="Agregar pedido recibido"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal de captura *
            </label>
            <select
              value={sucursalCaptura}
              onChange={(e) => setSucursalCaptura(e.target.value)}
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

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {processing ? (
              <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            ) : (
              <div className="w-16 h-16 text-gray-400 mx-auto mb-4 text-4xl">
                📄
              </div>
            )}
            <div className="mb-4">
              <label className="cursor-pointer">
                <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block font-medium">
                  {processing ? "Procesando PDF..." : "Subir archivo PDF"}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={processing}
                />
              </label>
            </div>

            {file && parsedPdfInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-blue-900 mb-2">
                  📋 Análisis del PDF:
                </h4>
                <p>
                  <strong>Archivo:</strong> {file.name}
                </p>
                <p>
                  <strong>Proveedor Detectado:</strong>{" "}
                  {parsedPdfInfo.proveedor || "No detectado"}
                </p>
                <p>
                  <strong>Costo Total:</strong>{" "}
                  {parsedPdfInfo.costo_total !== null
                    ? `$${parsedPdfInfo.costo_total.toLocaleString("es-CL")}`
                    : "No disponible"}
                </p>

                <h5 className="mt-4 font-semibold text-blue-900">
                  Productos detectados:
                </h5>
                {parsedPdfInfo.productos.length === 0 && (
                  <p className="text-sm text-blue-800">
                    No se detectaron productos.
                  </p>
                )}
                <div className="max-h-60 overflow-y-auto mt-2 space-y-2">
                  {parsedPdfInfo.productos.map((producto) => (
                    <div
                      key={producto.descripcion}
                      className="grid grid-cols-4 gap-4 text-sm items-center bg-white p-3 rounded border"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedProducts[producto.descripcion]?.selected ||
                          false
                        }
                        onChange={(e) =>
                          setSelectedProducts((prev) => ({
                            ...prev,
                            [producto.descripcion]: {
                              selected: e.target.checked,
                              cantidad:
                                prev[producto.descripcion]?.cantidad ||
                                producto.cantidad,
                            },
                          }))
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-900">
                        {producto.descripcion}
                      </span>
                      <input
                        type="number"
                        value={
                          selectedProducts[producto.descripcion]?.cantidad ||
                          producto.cantidad
                        }
                        onChange={(e) =>
                          setSelectedProducts((prev) => ({
                            ...prev,
                            [producto.descripcion]: {
                              selected: true,
                              cantidad: Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              ),
                            },
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                      />
                      <span className="text-gray-600 text-xs">
                        Total:{" "}
                        {producto.total !== null
                          ? `$${producto.total.toLocaleString("es-CL")}`
                          : "No disponible"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parsedPdfInfo && parsedPdfInfo.productos.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={handleAgregarPedido}
                  disabled={
                    inserting ||
                    !sucursalCaptura ||
                    insertingCliente ||
                    processing
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {inserting
                    ? "Agregando..."
                    : `Agregar ${Object.values(selectedProducts).filter(
                      (p) => p.selected
                    ).length
                    } productos como pedido`}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
