import React, { useState, useEffect } from "react";
import { DetallePedido } from "./DetallePedido";
import { Filter, Plus, Download, FileDown, X } from "lucide-react";
import { saveAs } from "file-saver";
import {
  useSupabaseData,
  useSupabaseInsert,
} from "../../hooks/useSupabaseData";
import { Modal } from "../Common/Modal";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import { extraerDatosCompletos } from "../../../utils/pdfParser";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { toast } from "react-toastify";

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
  const [selectedPedido, setSelectedPedido] = useState<any>(null);
  const { empresaId } = useAuth();
  const [filters, setFilters] = useState({
    proveedor: "",
    fecha: "",
    estado: "",
    montoTotal: "",
    sucursal: "",
  });

  // Estados para formulario manual  
  const [formData, setFormData] = useState({
    proveedor: '',
    folio: '',
    montoTotal: 0,
    sucursalId: '',
    productos: [{ nombre: '', sku: '', cantidad: 1, costoUnitario: 0 }],
    archivo: null as File | null
  });
  const [uploading, setUploading] = useState(false);
  const [modalMode, setModalMode] = useState<'pdf' | 'manual'>('manual');

  // Estados para PDF (comentados pero funcionales)  
  const [file, setFile] = useState<File | null>(null);
  const [parsedPdfInfo, setParsedPdfInfo] = useState<ResultadoExtraccion | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: string]: { selected: boolean; cantidad: number };
  }>({});
  const [processing, setProcessing] = useState(false);
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

  const { insert, loading: inserting } = useSupabaseInsert("pedidos");

  // Función para subir archivo a Supabase Storage  
  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = fileName; // Sin carpeta adicional  

    const { data, error } = await supabase.storage
      .from('archivos-respaldo')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    return filePath;
  };

  // Función para agregar pedido manual (SIN usar tabla clientes)  
  const handleAgregarPedidoManual = async () => {
    if (!formData.proveedor || !formData.folio || !formData.sucursalId) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setUploading(true);
    try {
      let archivoPath = null;
      if (formData.archivo) {
        archivoPath = await uploadFile(formData.archivo);
      }

      // Calcular total automáticamente  
      const totalCalculado = formData.productos.reduce((sum, p) =>
        sum + (p.cantidad * p.costoUnitario), 0
      );

      const { error } = await supabase
        .from('pedidos')
        .insert({
          empresa_id: empresaId,
          sucursal_id: formData.sucursalId,
          proveedor_nombre: formData.proveedor,
          folio: formData.folio,
          fecha_pedido: new Date().toISOString(),
          estado: 'pendiente',
          total: formData.montoTotal || totalCalculado,
          archivo_respaldo: archivoPath,
          productos: JSON.stringify(formData.productos)
        });

      if (error) throw error;

      setFormData({
        proveedor: '',
        folio: '',
        montoTotal: 0,
        sucursalId: '',
        productos: [{ nombre: '', sku: '', cantidad: 1, costoUnitario: 0 }],
        archivo: null
      });
      setShowAgregarModal(false);
      refetch();
      toast.success('Pedido agregado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar pedido');
    } finally {
      setUploading(false);
    }
  };

  // Funciones para manejar productos en el formulario  
  const addProducto = () => {
    setFormData(prev => ({
      ...prev,
      productos: [...prev.productos, { nombre: '', sku: '', cantidad: 1, costoUnitario: 0 }]
    }));
  };

  const updateProducto = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      productos: prev.productos.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    }));
  };

  const removeProducto = (index: number) => {
    if (formData.productos.length > 1) {
      setFormData(prev => ({
        ...prev,
        productos: prev.productos.filter((_, i) => i !== index)
      }));
    }
  };

  // Funciones del PDF (comentadas pero funcionales)  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleAgregarPedidoPDF = async () => {
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
        proveedor_nombre: parsedPdfInfo.proveedor || "Proveedor PDF",
        folio: `PED-${Date.now()}`,
        fecha_pedido: new Date().toISOString(),
        estado: "pendiente",
        total: totalPedido,
        productos: JSON.stringify(productosSeleccionados)
      });

      if (success) {
        setShowAgregarModal(false);
        setFile(null);
        setParsedPdfInfo(null);
        setSelectedProducts({});
        setSucursalCaptura("");
        refetch();
      }
    } catch (error) {
      console.error("Error agregando pedido:", error);
      alert(`Hubo un error al agregar el pedido: ${(error as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Procesa datos para tabla principal (SIN usar tabla clientes)  
  const processedData = (pedidos || [])
    .slice()
    .sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((pedido: any) => {
      const fechaPedido =
        pedido.fecha || pedido.fecha_pedido || pedido.created_at;
      const proveedor = pedido.proveedor_nombre || "Proveedor Desconocido";
      const sucursal =
        pedido.sucursales?.nombre ||
        sucursales?.find((s: any) => s.id === pedido.sucursal_id)?.nombre ||
        "Sucursal Desconocida";

      return {
        id: pedido.id,
        proveedor,
        folio_factura: pedido.folio || `PED-${pedido.id?.slice(0, 8)}`,
        fecha: new Date(fechaPedido).toLocaleDateString("es-CL"),
        monto_total: pedido.total || 0,
        monto_total_formatted: `$${(pedido.total || 0).toLocaleString("es-CL")}`,
        sucursal_captura: sucursal,
        pedido,
      };
    });

  // Aplica filtros mejorados sobre los datos procesados  
  // Aplica filtros mejorados sobre los datos procesados  
  const filteredData = processedData.filter((item: any) => {
    if (
      filters.proveedor &&
      !item.proveedor.toLowerCase().includes(filters.proveedor.toLowerCase())
    )
      return false;

    if (filters.fecha && !item.fecha.includes(filters.fecha)) return false;

    if (filters.estado && item.pedido.estado !== filters.estado) return false;

    if (filters.montoTotal) {
      const filterMonto = parseFloat(filters.montoTotal);
      if (isNaN(filterMonto) || item.monto_total < filterMonto) return false;
    }

    // Cambiar esta línea para filtrar por ID de sucursal  
    if (filters.sucursal && item.pedido.sucursal_id !== filters.sucursal)
      return false;

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
      ...filteredData.map((row: any) =>
        [
          `"${row.proveedor}"`,
          `"${row.folio_factura}"`,
          `"${row.fecha}"`,
          row.monto_total,
          `"${row.sucursal_captura}"`,
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

  const clearFilters = () => {
    setFilters({
      proveedor: "",
      fecha: "",
      estado: "",
      montoTotal: "",
      sucursal: "",
    });
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando pedidos...</div>;
  }

  if (showDetalle) {
    return (
      <DetallePedido
        productos={selectedPedido.pedido.productos ? JSON.parse(selectedPedido.pedido.productos) : []}
        onBack={() => setShowDetalle(false)}
        pedido={selectedPedido}
        proveedor={{ razon_social: selectedPedido.pedido.proveedor_nombre }}
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
            {paginatedData.map((row: any) => (
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
                  {row.monto_total_formatted}
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

      {/* Modal de Filtros Mejorado */}
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
              <option value="pendiente">Pendiente</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto Total
            </label>
            <input
              type="number"
              value={filters.montoTotal}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, montoTotal: e.target.value }))
              }
              placeholder="0"
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
              {sucursales?.map((sucursal: any) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-between">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Limpiar
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Agregar Pedido con SKU y Costo Unitario */}
      <Modal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        title="Agregar Pedido"
        size="xl"
      >
        <div className="space-y-6">
          {/* Selector de modo */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setModalMode('manual')}
              className={`px-4 py-2 rounded-lg ${modalMode === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
                }`}
            >
              Formulario Manual
            </button>
          </div>

          {modalMode === 'manual' ? (
            // Formulario Manual Mejorado  
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    value={formData.proveedor}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, proveedor: e.target.value }))
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
                    value={formData.folio}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, folio: e.target.value }))
                    }
                    placeholder="Número de folio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto total *
                  </label>
                  <input
                    type="text"
                    value={formData.montoTotal || ""}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                    onChange={(e) => {
                      let value = e.target.value;

                      // Reemplazar coma por punto si el usuario escribe decimal con coma
                      value = value.replace(",", ".");

                      // Validar que sea número o vacío
                      if (value === "" || /^[0-9]*\.?[0-9]*$/.test(value)) {
                        // Evitar negativos
                        if (parseFloat(value) < 0) {
                          value = "0";
                        }
                        setFormData((prev) => ({ ...prev, montoTotal: value }));
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sucursal de captura *
                  </label>
                  <select
                    value={formData.sucursalId}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, sucursalId: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar sucursal</option>
                    {sucursales?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Productos
                </label>
                <div className="space-y-3">
                  {formData.productos.map((producto, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 p-3 border border-gray-200 rounded-lg">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Producto</label>
                        <input
                          type="text"
                          value={producto.nombre}
                          onChange={(e) => updateProducto(index, 'nombre', e.target.value)}
                          placeholder="Nombre"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">SKU</label>
                        <input
                          type="text"
                          value={producto.sku}
                          onChange={(e) => updateProducto(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                        <input
                          type="number"
                          value={producto.cantidad}
                          onChange={(e) => updateProducto(index, 'cantidad', Number(e.target.value))}
                          min="1"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Costo Unit.</label>
                        <input
                          type="number"
                          value={producto.costoUnitario}
                          onChange={(e) => updateProducto(index, 'costoUnitario', Number(e.target.value))}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-end">
                        {formData.productos.length > 1 && (
                          <button
                            onClick={() => removeProducto(index)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={addProducto}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Agregar Producto
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo de respaldo (PNG, JPG, JPEG, PDF)
                </label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 20 * 1024 * 1024) {
                      setFormData(prev => ({ ...prev, archivo: file }));
                    } else if (file) {
                      alert('El archivo debe ser menor a 20MB');
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.archivo && (
                  <p className="text-sm text-gray-600 mt-1">
                    Archivo seleccionado: {formData.archivo.name}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowAgregarModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAgregarPedidoManual}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Guardando...' : 'Agregar Pedido'}
                </button>
              </div>
            </div>
          ) : (
            // Modo PDF (comentado pero funcional)  
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
                  {sucursales?.map((s: any) => (
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
                      {parsedPdfInfo.productos.map((producto: any) => (
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
                              setSelectedProducts((prev: any) => ({
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
                              setSelectedProducts((prev: any) => ({
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
                      onClick={handleAgregarPedidoPDF}
                      disabled={
                        inserting ||
                        !sucursalCaptura ||
                        processing
                      }
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {inserting
                        ? "Agregando..."
                        : `Agregar ${Object.values(selectedProducts).filter(
                          (p: any) => p.selected
                        ).length
                        } productos como pedido`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}