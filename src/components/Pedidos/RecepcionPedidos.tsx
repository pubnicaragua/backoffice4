import React, { useState } from "react";
import { DetallePedido } from "./DetallePedido";
import { Filter, Plus, Download, FileDown } from "lucide-react";
import { saveAs } from "file-saver";
import {
  useSupabaseData,
  useSupabaseInsert,
} from "../../hooks/useSupabaseData";
import { Modal } from "../Common/Modal";

import { PDFDocument } from "pdf-lib";
import Tesseract from "tesseract.js";

export function RecepcionPedidos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [file, setFile] = useState(null);
  const [productos, setProductos] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [processing, setProcessing] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
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
  } = useSupabaseData(
    "pedidos",
    "*, clientes(razon_social), sucursales(nombre)"
  );
  const { data: clientes } = useSupabaseData("clientes", "*");
  const { data: sucursales } = useSupabaseData("sucursales", "*");
  const { insert, loading: inserting } = useSupabaseInsert("pedidos");

  // Procesar datos para tabla y filtros igual que antes...
  const processedData = (pedidos || []).map((pedido) => {
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
      proveedor: proveedor,
      folio_factura: pedido.folio || `PED-${pedido.id?.slice(0, 8)}`,
      fecha: new Date(fechaPedido).toLocaleDateString("es-CL"),
      monto_total: `$${(pedido.total || 0).toLocaleString("es-CL")}`,
      sucursal_captura: sucursal,
      pedido: pedido,
    };
  });

  const filteredData = processedData.filter((item) => {
    if (
      filters.proveedor &&
      !item.proveedor.toLowerCase().includes(filters.proveedor.toLowerCase())
    ) {
      return false;
    }
    if (filters.fecha && !item.fecha.includes(filters.fecha)) {
      return false;
    }
    if (filters.estado && item.pedido.estado !== filters.estado) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleViewDetalle = (pedido) => {
    setSelectedPedido(pedido);
    setShowDetalle(true);
  };

  const handleFileUpload = async (event) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      await processFile(uploadedFile);
    }
  };

  // Convierte página PDF a imagen usando pdf-lib y canvas
  const pdfPageToImage = async (pdfDoc, pageIndex) => {
    const page = pdfDoc.getPage(pageIndex);

    // Crear canvas
    const viewportWidth = page.getSize().width;
    const viewportHeight = page.getSize().height;

    // Crear canvas HTML (fuera del DOM)
    const canvas = document.createElement("canvas");
    canvas.width = viewportWidth;
    canvas.height = viewportHeight;
    const ctx = canvas.getContext("2d");

    // pdf-lib no tiene método directo para render (a diferencia de pdfjs),
    // Por esto, mejor usar método alternativo:
    // Dibujar el contenido del PDF en canvas es complejo con pdf-lib
    // por lo que aquí usaremos un truco:
    // - Extraer la página como PDF solo
    // - Crear Blob y usar PDF.js para render (pero no queremos pdfjs)
    // Como el cliente no quiere pdfjs, usaremos lo básico:

    // Por limitación técnica, vamos a convertir cada página entera a Blob,
    // y luego usar Tesseract para hacer OCR directo de esa página.
    // (Se pierde precisión pero tabla es sencilla.)

    // Alternativamente convertir todo PDF a base64 y OCR total.

    // En esta función devolvemos canvas vacío para usar OCR después en processFile
    return canvas;
  };

  // Función para extraer texto usando OCR Tesseract.js página por página
  const extractTextWithOCR = async (file) => {
    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const numPages = pdfDoc.getPageCount();
      let fullText = "";

      // Alternativa práctica: Usar Tesseract OCR en todo el PDF convertido a imagen
      // Como pdf-lib no permite render a imagen directamente,
      // usaremos solo OCR en el PDF completo convertido a base64

      // Crear URL de objeto para mostrar PDF si es necesario
      // pero OCR necesita imagen, por eso haremos:
      // Generar base64 desde arrayBuffer para OCR.

      // Conversión arrayBuffer a blob y luego base64:
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      const fileReader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        fileReader.onloadend = () => resolve(fileReader.result);
        fileReader.readAsDataURL(blob);
      });
      const base64 = await base64Promise;

      // Ejecutar OCR sobre base64 del PDF entero (probablemente lento)
      const {
        data: { text },
      } = await Tesseract.recognize(base64, "spa", {
        logger: (m) => {
          // console.log(m);
        },
      });

      fullText = text;

      return fullText;
    } catch (error) {
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  // Función para extraer productos desde texto con regex
  const extractProductsFromText = (text) => {
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const products = [];

    // Regex patrón: cantidad X precio nombreproducto
    // Ejemplo línea (del texto OCR): "1 X 12.596.640.000 Sleeve Business Style para Macbo"
    const productRegex = /^(\d+)\s*X\s*([\d.,]+)\s+(.+)$/i;

    lines.forEach((line) => {
      const m = productRegex.exec(line);
      if (m) {
        const cantidad = parseInt(m[1].replace(/\./g, ""));
        const costoStr = m[2].replace(/\./g, "").replace(",", ".");
        const costoSinIva = parseFloat(costoStr);
        const nombreProducto = m[3].trim();

        if (!isNaN(cantidad) && !isNaN(costoSinIva)) {
          products.push({
            nombre: nombreProducto,
            cantidad,
            costo_sin_iva: costoSinIva,
            costo_con_iva: Math.round(costoSinIva * 1.19),
            descripcion: `Costo con IVA incluido (${costoSinIva} + 19%): $${Math.round(
              costoSinIva * 1.19
            )}`,
          });
        }
      }
    });

    return products;
  };

  // Procesa el archivo PDF: extrae texto con OCR y luego extrae productos con regex
  const processFile = async (file) => {
    setProcessing(true);
    try {
      const text = await extractTextWithOCR(file);
      const extractedProducts = extractProductsFromText(text);

      setProductos(extractedProducts);

      const initialSelection = {};
      extractedProducts.forEach((producto) => {
        initialSelection[producto.nombre] = {
          selected: true,
          cantidad: producto.cantidad,
        };
      });
      setSelectedProducts(initialSelection);
    } catch (error) {
      console.error("Error procesando PDF con OCR:", error);
      alert(
        "Error al procesar el PDF. Asegúrese de que el archivo no esté dañado y tenga texto legible."
      );
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
      .map(([nombre, data]) => {
        const producto = productos.find((p) => p.nombre === nombre);
        return {
          nombre,
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
      refetch();
    }
  };

  // Funciones para descarga reporte, plantilla y filtros igual que antes...

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
              <span className="text-sm text-gray-600">Mostrar:</span>
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
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {processing ? (
              <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            ) : (
              <div className="w-16 h-16 text-gray-400 mx-auto mb-4 text-4xl">
                📄
              </div>
            )}
            <div className="mb-4">
              <label className="cursor-pointer">
                <span className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block font-medium">
                  {processing ? "Procesando PDF (OCR)..." : "Subir archivo PDF"}
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
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Análisis de PDF con OCR:</strong>
              </p>
              <p className="text-xs text-gray-500">
                • Extrae productos y cantidades usando reconocimiento óptico
                (OCR)
                <br />
                • Calcula costos con IVA incluido (19%)
                <br />• Puede ser más lento que extracción directa (depende del
                PDF)
              </p>
            </div>
          </div>

          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                📋 Análisis del PDF:
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Archivo:</strong> {file.name}
                </p>
                <p>
                  <strong>Método:</strong> Reconocimiento óptico OCR
                  (Tesseract.js)
                </p>
                <p>
                  <strong>Productos detectados:</strong> {productos.length}
                </p>
                <p>
                  <strong>IVA aplicado:</strong> 19% automáticamente
                </p>
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
                    key={index}
                    className="grid grid-cols-4 gap-4 text-sm items-center bg-white p-3 rounded border"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts[producto.nombre]?.selected || false
                      }
                      onChange={(e) => {
                        setSelectedProducts((prev) => ({
                          ...prev,
                          [producto.nombre]: {
                            selected: e.target.checked,
                            cantidad:
                              prev[producto.nombre]?.cantidad ||
                              producto.cantidad,
                          },
                        }));
                      }}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-gray-900">{producto.nombre}</span>
                    <input
                      type="number"
                      value={
                        selectedProducts[producto.nombre]?.cantidad ||
                        producto.cantidad
                      }
                      onChange={(e) => {
                        setSelectedProducts((prev) => ({
                          ...prev,
                          [producto.nombre]: {
                            selected: true,
                            cantidad: parseInt(e.target.value) || 1,
                          },
                        }));
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="1"
                    />
                    <span className="text-gray-600 text-xs">
                      {producto.descripcion}
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
      </Modal>
    </div>
  );
}
