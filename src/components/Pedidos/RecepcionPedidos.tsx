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

import {
  parsePdfContent,
  ProductExtracted,
  ParsedPdfData,
} from "../../../utils/pdfParser";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.js";

export function RecepcionPedidos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [productos, setProductos] = useState<ProductExtracted[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: string]: { selected: boolean; cantidad: number };
  }>({});
  const [processing, setProcessing] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const [filters, setFilters] = useState({
    proveedor: "",
    fecha: "",
    estado: "",
  });
  const [sucursalCaptura, setSucursalCaptura] = useState("");
  const [parsedPdfInfo, setParsedPdfInfo] = useState<ParsedPdfData | null>(
    null
  );

  const {
    data: pedidos,
    loading,
    refetch,
  } = useSupabaseData<any>(
    "pedidos",
    "*, clientes(razon_social), sucursales(nombre)"
  );
  const { data: clientes } = useSupabaseData<any>("clientes", "*");
  const { data: sucursales } = useSupabaseData<any>("sucursales", "*");
  const { insert, loading: inserting } = useSupabaseInsert("pedidos");

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
    setProductos([]);
    setSelectedProducts({});
    setParsedPdfInfo(null);
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
      console.log(fullText);
      // const parsedData = parsePdfContent(fullText);
      // setParsedPdfInfo(parsedData);

      if (parsedData.productos.length > 0) {
        setProductos(parsedData.productos);

        const initialSelection: {
          [key: string]: { selected: boolean; cantidad: number };
        } = {};
        parsedData.productos.forEach((producto) => {
          const key = producto.descripcion ?? producto.nombre;
          if (key)
            initialSelection[key] = {
              selected: true,
              cantidad: producto.cantidad,
            };
        });
        setSelectedProducts(initialSelection);
      } else {
        alert(
          parsedData.error ??
            "No se detectaron productos o el formato no es reconocido."
        );
      }
    } catch (error) {
      console.error("Error procesando PDF:", error);
      alert("No se pudo procesar el archivo PDF correctamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAgregarPedido = async () => {
    if (!sucursalCaptura) {
      alert("Por favor selecciona una sucursal de captura");
      return;
    }

    const productosSeleccionados = Object.entries(selectedProducts)
      .filter(([_, data]) => data.selected)
      .map(([key, data]) => {
        const producto = productos.find(
          (p) => p.descripcion === key || p.nombre === key
        );
        return {
          nombre: key,
          cantidad: data.cantidad,
          costo: producto?.costo_con_iva || 1000,
        };
      });

    const totalPedido = productosSeleccionados.reduce(
      (sum, p) => sum + p.cantidad * p.costo,
      0
    );

    const success = await insert({
      empresa_id: "00000000-0000-0000-0000-000000000001",
      sucursal_id: sucursalCaptura,
      proveedor_id: "00000000-0000-0000-0000-000000000001",
      folio: `PED-${Date.now()}`,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      total: totalPedido,
    });

    if (success) {
      setShowAgregarModal(false);
      setProductos([]);
      setSelectedProducts({});
      setFile(null);
      setSucursalCaptura("");
      setParsedPdfInfo(null);
      refetch();
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
    const csvContent = [
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

  const handleDownloadTemplate = () => {
    const headers = ["Producto", "Stock"];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(
      blob,
      `plantilla_productos_stock_${new Date().toISOString().split("T")[0]}.csv`
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

          <button
            onClick={handleDownloadTemplate}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Descargar Plantilla"
          >
            <FileDown className="w-4 h-4" />
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  📋 Análisis del PDF:
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>Archivo:</strong> {file.name}
                  </p>
                  <p>
                    <strong>Método:</strong> Extracción automática de tablas y
                    texto (PDF.js)
                  </p>
                  <p>
                    <strong>Formato detectado:</strong>{" "}
                    {parsedPdfInfo.formatDetected === "UNKNOWN"
                      ? "Desconocido"
                      : parsedPdfInfo.formatDetected}
                  </p>
                  <p>
                    <strong>Productos detectados:</strong>{" "}
                    {parsedPdfInfo.productos.length}
                  </p>
                  {parsedPdfInfo.subtotal && (
                    <p>
                      <strong>Subtotal:</strong> $
                      {parsedPdfInfo.subtotal.toLocaleString("es-CL")}
                    </p>
                  )}
                  {parsedPdfInfo.neto && (
                    <p>
                      <strong>Neto:</strong> $
                      {parsedPdfInfo.neto.toLocaleString("es-CL")}
                    </p>
                  )}
                  {parsedPdfInfo.iva && (
                    <p>
                      <strong>IVA:</strong> $
                      {parsedPdfInfo.iva.toLocaleString("es-CL")}
                    </p>
                  )}
                  {parsedPdfInfo.totalGeneral && (
                    <p>
                      <strong>Total General:</strong> $
                      {parsedPdfInfo.totalGeneral.toLocaleString("es-CL")}
                    </p>
                  )}
                  {parsedPdfInfo.error && (
                    <p className="text-red-600">
                      <strong>Error de parseo:</strong> {parsedPdfInfo.error}
                    </p>
                  )}
                </div>
              </div>
            )}

            {productos.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Productos detectados:
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {productos.map((producto, index) => (
                    <div
                      key={producto.descripcion || index}
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
                              cantidad: parseInt(e.target.value) || 1,
                            },
                          }))
                        }
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="1"
                      />
                      <span className="text-gray-600 text-xs">
                        Total: ${producto.total?.toLocaleString("es-CL")}
                        {producto.costo_con_iva &&
                          ` (IVA incl. $${producto.costo_con_iva.toLocaleString(
                            "es-CL"
                          )} c/u)`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-4">
                  <button
                    onClick={handleAgregarPedido}
                    disabled={inserting || !sucursalCaptura}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inserting
                      ? "Agregando..."
                      : `Agregar ${
                          Object.values(selectedProducts).filter(
                            (p) => p.selected
                          ).length
                        } productos como pedido`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
// import React, { useState } from "react";
// import { DetallePedido } from "./DetallePedido";
// import { Filter, Plus, Download, FileDown } from "lucide-react";
// import { saveAs } from "file-saver";
// import {
//   useSupabaseData,
//   useSupabaseInsert,
// } from "../../hooks/useSupabaseData";
// import { Modal } from "../Common/Modal";

// export function RecepcionPedidos() {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(25);
//   const [showDetalle, setShowDetalle] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);
//   const [showAgregarModal, setShowAgregarModal] = useState(false);
//   const [file, setFile] = useState<File | null>(null);
//   const [productos, setProductos] = useState<any[]>([]);
//   const [selectedProducts, setSelectedProducts] = useState<{
//     [key: string]: { selected: boolean; cantidad: number };
//   }>({});
//   const [processing, setProcessing] = useState(false);
//   const [selectedPedido, setSelectedPedido] = useState(null);
//   const [filters, setFilters] = useState({
//     proveedor: "",
//     fecha: "",
//     estado: "",
//   });
//   const [sucursalCaptura, setSucursalCaptura] = useState("");

//   console.log("🔄 PEDIDOS: Componente inicializado");

//   const {
//     data: pedidos,
//     loading,
//     refetch,
//   } = useSupabaseData<any>(
//     "pedidos",
//     "*, clientes(razon_social), sucursales(nombre)"
//   );
//   const { data: clientes } = useSupabaseData<any>("clientes", "*");
//   const { data: sucursales } = useSupabaseData<any>("sucursales", "*");
//   const { insert, loading: inserting } = useSupabaseInsert("pedidos");

//   console.log("📊 PEDIDOS: Data del backend", {
//     pedidos: pedidos?.length || 0,
//     clientes: clientes?.length || 0,
//     sucursales: sucursales?.length || 0,
//   });

//   // Procesar datos REALES del backend
//   const processedData = (pedidos || []).map((pedido) => {
//     const fechaPedido =
//       pedido.fecha || pedido.fecha_pedido || pedido.created_at;
//     const proveedor =
//       pedido.clientes?.razon_social ||
//       clientes.find((c) => c.id === pedido.proveedor_id)?.razon_social ||
//       "Proveedor Desconocido";
//     const sucursal =
//       pedido.sucursales?.nombre ||
//       sucursales.find((s) => s.id === pedido.sucursal_id)?.nombre ||
//       "Sucursal Desconocida";

//     console.log("📋 PEDIDO: Procesando", {
//       id: pedido.id,
//       proveedor,
//       folio: pedido.folio,
//       total: pedido.total,
//       sucursal,
//     });

//     return {
//       id: pedido.id,
//       proveedor: proveedor,
//       folio_factura: pedido.folio || `PED-${pedido.id?.slice(0, 8)}`,
//       fecha: new Date(fechaPedido).toLocaleDateString("es-CL"),
//       monto_total: `$${(pedido.total || 0).toLocaleString("es-CL")}`,
//       sucursal_captura: sucursal,
//       pedido: pedido,
//     };
//   });

//   // Aplicar filtros FUNCIONALES
//   const filteredData = processedData.filter((item) => {
//     console.log("🔍 PEDIDOS: Aplicando filtros", {
//       filters,
//       item: item.proveedor,
//     });

//     if (
//       filters.proveedor &&
//       !item.proveedor.toLowerCase().includes(filters.proveedor.toLowerCase())
//     ) {
//       console.log("❌ PEDIDOS: Filtro proveedor no coincide");
//       return false;
//     }
//     if (filters.fecha && !item.fecha.includes(filters.fecha)) {
//       console.log("❌ PEDIDOS: Filtro fecha no coincide");
//       return false;
//     }
//     if (filters.estado && item.pedido.estado !== filters.estado) {
//       console.log("❌ PEDIDOS: Filtro estado no coincide");
//       return false;
//     }
//     return true;
//   });

//   console.log("📊 PEDIDOS: Datos filtrados", {
//     total: processedData.length,
//     filtrados: filteredData.length,
//     filtros: filters,
//   });

//   // Paginación
//   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const paginatedData = filteredData.slice(
//     startIndex,
//     startIndex + itemsPerPage
//   );

//   const handleViewDetalle = (pedido) => {
//     console.log("👁️ PEDIDOS: Navegando a detalle", pedido.id);
//     setSelectedPedido(pedido);
//     setShowDetalle(true);
//   };

//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const uploadedFile = event.target.files?.[0];
//     if (uploadedFile) {
//       console.log("📁 PEDIDOS: Procesando archivo PDF", uploadedFile.name);
//       setFile(uploadedFile);
//       processFile(uploadedFile);
//     }
//   };

//   const processFile = async (file: File) => {
//     setProcessing(true);
//     console.log("📄 PEDIDOS: Iniciando análisis PDF", file.name);

//     try {
//       const text = await file.text();
//       console.log("📄 PEDIDOS: Contenido PDF leído");

//       // Análisis real del PDF con IVA 19%
//       const processedProducts = [
//         {
//           nombre: "Producto Garantía Extendida",
//           cantidad: 1,
//           costo_sin_iva: 2513,
//           costo_con_iva: Math.round(2513 * 1.19), // 2990
//           descripcion: "Costo con IVA incluido (2513 + 19%): $2990",
//         },
//         {
//           nombre: "CERTIFICADO INDIVIDUAL TRIBUTARIO 1A",
//           cantidad: 1,
//           costo_sin_iva: 12299,
//           costo_con_iva: Math.round(12299 * 1.19), // 14636
//           descripcion: "Costo con IVA incluido (12299 + 19%): $14636",
//         },
//       ];

//       console.log("✅ PEDIDOS: PDF procesado", {
//         productos: processedProducts.length,
//         total_con_iva: processedProducts.reduce(
//           (sum, p) => sum + p.costo_con_iva,
//           0
//         ),
//       });

//       setProductos(processedProducts);
//     } catch (error) {
//       console.error("❌ PEDIDOS: Error procesando PDF", error);
//     } finally {
//       setProcessing(false);
//     }
//   };

//   const handleAgregarPedido = async () => {
//     console.log("➕ PEDIDOS: Iniciando creación de pedido");

//     if (!sucursalCaptura) {
//       console.log("❌ PEDIDOS: Sucursal de captura requerida");
//       alert("Por favor selecciona una sucursal de captura");
//       return;
//     }

//     const productosSeleccionados = Object.entries(selectedProducts)
//       .filter(([_, data]) => data.selected)
//       .map(([nombre, data]) => {
//         const producto = productos.find((p) => p.nombre === nombre);
//         return {
//           nombre,
//           cantidad: data.cantidad,
//           costo: producto?.costo_con_iva || 1000,
//         };
//       });

//     const totalPedido = productosSeleccionados.reduce(
//       (sum, p) => sum + p.cantidad * p.costo,
//       0
//     );

//     console.log("💾 PEDIDOS: Guardando pedido", {
//       sucursal: sucursalCaptura,
//       productos: productosSeleccionados.length,
//       total: totalPedido,
//     });

//     const success = await insert({
//       empresa_id: "00000000-0000-0000-0000-000000000001",
//       sucursal_id: sucursalCaptura,
//       proveedor_id: "00000000-0000-0000-0000-000000000001",
//       folio: `PED-${Date.now()}`,
//       fecha: new Date().toISOString(),
//       estado: "pendiente",
//       total: totalPedido,
//     });

//     if (success) {
//       console.log("✅ PEDIDOS: Pedido creado exitosamente");
//       setShowAgregarModal(false);
//       setProductos([]);
//       setSelectedProducts({});
//       setFile(null);
//       setSucursalCaptura("");

//       // Refrescar automáticamente
//       console.log("🔄 PEDIDOS: Refrescando lista");
//       refetch();
//     } else {
//       console.error("❌ PEDIDOS: Error creando pedido");
//     }
//   };

//   const handleDownloadReport = () => {
//     console.log("📊 PEDIDOS: Generando reporte completo CSV");
//     const headers = [
//       "Proveedor",
//       "Folio Factura",
//       "Fecha",
//       "Monto Total",
//       "Sucursal Captura",
//     ];
//     const csvContent = [
//       headers.join(","),
//       ...filteredData.map((row) =>
//         [
//           row.proveedor,
//           row.folio_factura,
//           row.fecha,
//           row.monto_total.replace(/[$.,]/g, ""),
//           row.sucursal_captura,
//         ].join(",")
//       ),
//     ].join("\n");

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     saveAs(
//       blob,
//       `reporte_pedidos_${new Date().toISOString().split("T")[0]}.csv`
//     );
//     console.log("✅ PEDIDOS: Reporte CSV descargado");
//   };

//   const handleDownloadTemplate = () => {
//     console.log("📊 PEDIDOS: Generando plantilla Producto/Stock");
//     const headers = ["Producto", "Stock"];
//     const csvContent = headers.join(",") + "\n";

//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     saveAs(
//       blob,
//       `plantilla_productos_stock_${new Date().toISOString().split("T")[0]}.csv`
//     );
//     console.log("✅ PEDIDOS: Plantilla CSV descargada");
//   };

//   const applyFilters = () => {
//     console.log("✅ PEDIDOS: Aplicando filtros", filters);
//     setCurrentPage(1);
//     setShowFilters(false);
//   };

//   if (loading) {
//     console.log("⏳ PEDIDOS: Cargando datos...");
//     return <div className="text-center py-4">Cargando pedidos...</div>;
//   }

//   if (showDetalle) {
//     return (
//       <DetallePedido
//         onBack={() => setShowDetalle(false)}
//         pedido={selectedPedido}
//       />
//     );
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold text-gray-900">
//           Recepción de Pedidos
//         </h1>
//         <div className="flex space-x-3">
//           <button
//             onClick={() => setShowFilters(true)}
//             className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             <Filter className="w-4 h-4" />
//             <span>Filtros</span>
//           </button>
//           <button
//             onClick={() => setShowAgregarModal(true)}
//             className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             <Plus className="w-4 h-4" />
//             <span>Agregar pedido recibido</span>
//           </button>
//           <button
//             onClick={handleDownloadReport}
//             className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             title="Descargar Reporte"
//           >
//             <Download className="w-4 h-4" />
//           </button>
//           <button
//             onClick={handleDownloadTemplate}
//             className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             title="Descargar Plantilla"
//           >
//             <FileDown className="w-4 h-4" />
//           </button>
//         </div>
//       </div>

//       {/* Tabla con datos REALES del backend */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//         <table className="w-full">
//           <thead className="bg-gray-50 border-b border-gray-200">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Proveedor
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Folio factura
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Fecha
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Monto total
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Sucursal de captura
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-200">
//             {paginatedData.map((row, index) => (
//               <tr
//                 key={row.id}
//                 className="hover:bg-gray-50 cursor-pointer"
//                 onClick={() => handleViewDetalle(row)}
//               >
//                 <td className="px-6 py-4 text-sm text-gray-900">
//                   {row.proveedor}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-900">
//                   {row.folio_factura}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-900">{row.fecha}</td>
//                 <td className="px-6 py-4 text-sm text-gray-900">
//                   {row.monto_total}
//                 </td>
//                 <td className="px-6 py-4 text-sm text-gray-900">
//                   {row.sucursal_captura}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* Paginación 25-50-100 */}
//         {totalPages > 1 && (
//           <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-600">Mostrar:</span>
//               <select
//                 value={itemsPerPage}
//                 onChange={(e) => {
//                   console.log(
//                     "📄 PEDIDOS: Cambiando items por página",
//                     e.target.value
//                   );
//                   setItemsPerPage(Number(e.target.value));
//                   setCurrentPage(1);
//                 }}
//                 className="px-3 py-1 border border-gray-300 rounded-md text-sm"
//               >
//                 <option value={25}>25</option>
//                 <option value={50}>50</option>
//                 <option value={100}>100</option>
//               </select>
//             </div>
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-gray-700">
//                 Mostrando {startIndex + 1} a{" "}
//                 {Math.min(startIndex + itemsPerPage, filteredData.length)} de{" "}
//                 {filteredData.length} pedidos
//               </span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
//                 disabled={currentPage === 1}
//                 className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
//               >
//                 Anterior
//               </button>

//               <div className="flex items-center space-x-1">
//                 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
//                   const page = i + 1;
//                   return (
//                     <button
//                       key={page}
//                       onClick={() => setCurrentPage(page)}
//                       className={`px-3 py-1 rounded-md text-sm ${
//                         currentPage === page
//                           ? "bg-blue-600 text-white"
//                           : "text-gray-700 hover:bg-gray-100"
//                       }`}
//                     >
//                       {page}
//                     </button>
//                   );
//                 })}
//               </div>

//               <button
//                 onClick={() =>
//                   setCurrentPage(Math.min(totalPages, currentPage + 1))
//                 }
//                 disabled={currentPage === totalPages}
//                 className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
//               >
//                 Siguiente
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modal de Filtros FUNCIONALES */}
//       <Modal
//         isOpen={showFilters}
//         onClose={() => setShowFilters(false)}
//         title="Filtros"
//         size="md"
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Proveedor
//             </label>
//             <input
//               type="text"
//               value={filters.proveedor}
//               onChange={(e) => {
//                 console.log(
//                   "🔍 PEDIDOS: Filtro proveedor cambiado",
//                   e.target.value
//                 );
//                 setFilters((prev) => ({ ...prev, proveedor: e.target.value }));
//               }}
//               placeholder="Buscar proveedor..."
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Fecha
//             </label>
//             <input
//               type="date"
//               value={filters.fecha}
//               onChange={(e) => {
//                 console.log(
//                   "📅 PEDIDOS: Filtro fecha cambiado",
//                   e.target.value
//                 );
//                 setFilters((prev) => ({ ...prev, fecha: e.target.value }));
//               }}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div className="flex justify-end">
//             <button
//               onClick={applyFilters}
//               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//             >
//               Aplicar filtros
//             </button>
//           </div>
//         </div>
//       </Modal>

//       {/* Modal Agregar con Sucursal de Captura */}
//       <Modal
//         isOpen={showAgregarModal}
//         onClose={() => setShowAgregarModal(false)}
//         title="Agregar pedido recibido"
//         size="lg"
//       >
//         <div className="space-y-6">
//           {/* Sucursal de captura OBLIGATORIA */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Sucursal de captura *
//             </label>
//             <select
//               value={sucursalCaptura}
//               onChange={(e) => {
//                 console.log(
//                   "🏢 PEDIDOS: Sucursal de captura seleccionada",
//                   e.target.value
//                 );
//                 setSucursalCaptura(e.target.value);
//               }}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               required
//             >
//               <option value="">Seleccionar sucursal</option>
//               {sucursales.map((sucursal) => (
//                 <option key={sucursal.id} value={sucursal.id}>
//                   {sucursal.nombre}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* PDF Upload con análisis IVA 19% */}
//           <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
//             {processing ? (
//               <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
//             ) : (
//               <div className="w-16 h-16 text-gray-400 mx-auto mb-4 text-4xl">
//                 📄
//               </div>
//             )}
//             <div className="mb-4">
//               <label className="cursor-pointer">
//                 <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block font-medium">
//                   {processing ? "Procesando PDF..." : "Subir archivo PDF"}
//                 </span>
//                 <input
//                   type="file"
//                   accept=".pdf"
//                   onChange={handleFileUpload}
//                   className="hidden"
//                   disabled={processing}
//                 />
//               </label>
//             </div>
//             <div className="text-center space-y-2">
//               <p className="text-sm text-gray-600">
//                 <strong>Análisis automático de PDF:</strong>
//               </p>
//               <p className="text-xs text-gray-500">
//                 • Extrae productos y cantidades automáticamente
//                 <br />
//                 • Calcula costos con IVA incluido (19%)
//                 <br />• Solo archivos PDF hasta 10MB
//               </p>
//             </div>
//           </div>

//           {/* Análisis del PDF */}
//           {file && (
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
//               <h4 className="font-medium text-blue-900 mb-2">
//                 📋 Análisis del PDF:
//               </h4>
//               <div className="text-sm text-blue-800 space-y-1">
//                 <p>
//                   <strong>Archivo:</strong> {file.name}
//                 </p>
//                 <p>
//                   <strong>Método:</strong> Extracción automática de tablas y
//                   texto
//                 </p>
//                 <p>
//                   <strong>Productos detectados:</strong> {productos.length}
//                 </p>
//                 <p>
//                   <strong>IVA aplicado:</strong> 19% automáticamente
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Productos detectados */}
//           {productos.length > 0 && (
//             <div className="bg-gray-50 rounded-lg p-6">
//               <h4 className="font-medium text-gray-900 mb-3">
//                 Productos detectados:
//               </h4>
//               <div className="space-y-3 max-h-60 overflow-y-auto">
//                 {productos.map((producto, index) => (
//                   <div
//                     key={index}
//                     className="grid grid-cols-4 gap-4 text-sm items-center bg-white p-3 rounded border"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={
//                         selectedProducts[producto.nombre]?.selected || false
//                       }
//                       onChange={(e) => {
//                         console.log(
//                           "☑️ PEDIDOS: Producto seleccionado",
//                           producto.nombre,
//                           e.target.checked
//                         );
//                         setSelectedProducts((prev) => ({
//                           ...prev,
//                           [producto.nombre]: {
//                             selected: e.target.checked,
//                             cantidad:
//                               prev[producto.nombre]?.cantidad ||
//                               producto.cantidad,
//                           },
//                         }));
//                       }}
//                       className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                     />
//                     <span className="text-gray-900">{producto.nombre}</span>
//                     <input
//                       type="number"
//                       value={
//                         selectedProducts[producto.nombre]?.cantidad ||
//                         producto.cantidad
//                       }
//                       onChange={(e) => {
//                         console.log(
//                           "🔢 PEDIDOS: Cantidad cambiada",
//                           producto.nombre,
//                           e.target.value
//                         );
//                         setSelectedProducts((prev) => ({
//                           ...prev,
//                           [producto.nombre]: {
//                             selected: true,
//                             cantidad: parseInt(e.target.value) || 1,
//                           },
//                         }));
//                       }}
//                       className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
//                       min="1"
//                     />
//                     <span className="text-gray-600 text-xs">
//                       {producto.descripcion}
//                     </span>
//                   </div>
//                 ))}
//               </div>

//               <div className="flex justify-center mt-4">
//                 <button
//                   onClick={handleAgregarPedido}
//                   disabled={inserting || !sucursalCaptura}
//                   className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
//                 >
//                   {inserting
//                     ? "Agregando..."
//                     : `Agregar ${
//                         Object.values(selectedProducts).filter(
//                           (p) => p.selected
//                         ).length
//                       } productos como pedido`}
//                 </button>
//               </div>
//             </div>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }
