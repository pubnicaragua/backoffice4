import React, { useState } from "react";

import { FilterModal } from "../Common/FilterModal";
import {
  Filter,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  Package,
  Download,
  FileDown,
} from "lucide-react";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { ReporteMermas } from "./ReporteMermas";
import { ActualizarInventario } from "./ActualizarInventario";
import { AgregarProductoModal } from "./AgregarProductoModal";
import { Modal } from "../Common/Modal";
import { supabase } from "../../lib/supabase";
import { useSupabaseInsert } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";

export function ProductosTotales() {
  const { empresaId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    sucursal: "",
    categoria: "",
    disponibilidad: "",
  });
  const [showMermasModal, setShowMermasModal] = useState(false);
  const [showInventarioModal, setShowInventarioModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const {
    data: productos,
    loading,
    refetch,
  } = useSupabaseData<any>(
    "productos",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );
  const { data: sucursales } = useSupabaseData<any>("sucursales", "*");
  const { data: categorias } = useSupabaseData<any>("categorias", "*");
  const { insert: insertNotification } = useSupabaseInsert("notificaciones");

  const columns = [
    { key: "checkbox", label: "", width: "40px" },
    { key: "producto", label: "Producto" },
    { key: "stock", label: "Stock" },
    { key: "categoria", label: "Categoría" },
    { key: "descripcion", label: "Descripción" },
    { key: "sku", label: "SKU" },
    { key: "costo", label: "Costo" },
    { key: "precio", label: "Precio" },
    { key: "margen", label: "Margen" },
    { key: "disponible", label: "Disponible" },
    { key: "acciones", label: "Acciones" },
  ];

  // Aplicar filtros
  const filteredProductos = (productos || []).filter((producto) => {
    if (filters.sucursal && filters.sucursal !== "") {
      // Aplicar filtro de sucursal
    }
    if (filters.categoria && filters.categoria !== "") {
      const categoria = categorias.find(
        (c) => c.nombre.toLowerCase() === filters.categoria.toLowerCase()
      );
      if (categoria && producto.categoria_id !== categoria.id) return false;
    }
    if (filters.disponibilidad === "disponibles" && (producto.stock || 0) <= 0)
      return false;
    if (filters.disponibilidad === "agotados" && (producto.stock || 0) > 0)
      return false;
    return true;
  });

  const handleEditProduct = (producto) => {
    console.log("✏️ EDITANDO PRODUCTO:", producto.nombre);
    setSelectedProduct(producto);
    setShowProductoModal(true);
  };

  const handleDeleteProduct = (producto) => {
    console.log("🗑️ ELIMINANDO PRODUCTO:", producto.nombre);
    setSelectedProduct(producto);
    setShowDeleteModal(true);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size > 0) {
      setShowBulkDeleteModal(true);
    }
  };

  const confirmBulkDelete = async () => {
    console.log(
      "🗑️ PRODUCTOS: Eliminación masiva",
      selectedProducts.size,
      "productos"
    );

    for (const productId of selectedProducts) {
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id", productId);

      if (error) {
        console.error("❌ PRODUCTO: Error eliminando", productId, error);
      }
    }

    console.log("✅ PRODUCTOS: Eliminación masiva completada");
    setShowBulkDeleteModal(false);
    setSelectedProducts(new Set());
    refetch();
  };

  const confirmDelete = async () => {
    if (selectedProduct) {
      console.log("🗑️ PRODUCTO: Eliminando producto", selectedProduct.nombre);
      const { data, error } = await supabase
        .from("productos")
        .delete()
        .eq("id", selectedProduct.id);

      if (!error) {
        console.log("✅ PRODUCTO: Eliminado exitosamente");
        setShowDeleteModal(false);
        setSelectedProduct(null);
        refetch();
      } else {
        console.error("❌ PRODUCTO: Error eliminando", error);
      }
    }
  };

  const handleDownloadTemplate = () => {
    console.log("📊 INVENTARIO: Generando plantilla Producto/Stock");
    const headers = ["Producto", "Stock"];
    const csvContent = headers.join(",") + "\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantilla_productos_stock_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("✅ INVENTARIO: Plantilla CSV descargada");
  };

  const handleDownloadReport = () => {
    console.log("📊 INVENTARIO: Generando reporte completo CSV");
    const headers = [
      "Producto",
      "Stock",
      "Categoria",
      "SKU",
      "Costo",
      "Precio",
      "Margen",
      "Disponible",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.producto,
          row.stock,
          row.categoria,
          row.sku,
          row.costo.replace(/[$.,]/g, ""),
          row.precio.replace(/[$.,]/g, ""),
          row.margen.replace("%", ""),
          row.disponible,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_inventario_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    console.log("✅ INVENTARIO: Reporte CSV descargado");
  };

  const processedData = filteredProductos.map((producto) => ({
    id: producto.id,
    producto: producto.nombre,
    stock: producto.stock?.toString() || "0",
    categoria:
      categorias.find((c) => c.id === producto.categoria_id)?.nombre ||
      "Sin categoría",
    descripcion: producto.descripcion || "",
    sku: producto.codigo,
    costo: `$${Math.round(producto.costo || 0).toLocaleString("es-CL")}`,
    precio: `$${Math.round(producto.precio || 0).toLocaleString("es-CL")}`,
    margen: `${Math.round(
      (((producto.precio || 0) - (producto.costo || 0)) /
        (producto.precio || 1)) *
        100
    )}%`,
    disponible: producto.stock > 0 ? "Disponible" : "Agotado",
    checkbox: (
      <input
        type="checkbox"
        checked={selectedProducts.has(producto.id)}
        onChange={(e) => handleSelectProduct(producto.id, e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
    ),
    acciones: (
      <div className="flex items-center space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditProduct(producto);
          }}
          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
          title="Editar producto"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteProduct(producto);
          }}
          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
          title="Eliminar producto"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    ),
  }));

  const filteredData = processedData.filter(
    (item) =>
      searchTerm === "" ||
      item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Productos totales
        </h1>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="search-productos"
            name="search-productos"
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center space-x-3">
          {selectedProducts.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar {selectedProducts.size}</span>
            </button>
          )}
          <button
            onClick={() => handleDownloadReport}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Descargar Reporte"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDownloadTemplate}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Descargar Plantilla"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              console.log("🔍 FILTROS: Abriendo panel de filtros");
              setShowFilters(true);
            }}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Filtros"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              console.log("➕ PRODUCTO: Abriendo modal agregar");
              setSelectedProduct(null);
              setShowProductoModal(true);
            }}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Agregar"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              console.log("📊 INVENTARIO: Abriendo actualización masiva");
              setShowInventarioModal(true);
            }}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Actualizar inventario"
          >
            <Package className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              console.log("⚠️ MERMAS: Abriendo reporte");
              setShowMermasModal(true);
            }}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Mermas"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Tabla con paginación mejorada */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-gray-900"
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación personalizada */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            {/* Selector de items por página */}
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
                {filteredData.length} productos
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

      <ReporteMermas
        isOpen={showMermasModal}
        onClose={() => setShowMermasModal(false)}
        onMermaReported={async (mermaData) => {
          // Crear notificación cuando se reporte una merma
          await insertNotification({
            empresa_id: empresaId,
            tipo: "merma_reportada",
            titulo: "Nueva Merma Reportada",
            mensaje: `Se reportó una merma de ${mermaData.cantidad} unidades por ${mermaData.tipo}`,
            prioridad: "media",
          });
        }}
      />

      <ActualizarInventario
        isOpen={showInventarioModal}
        empresaId={empresaId}
        onClose={() => {
          setShowInventarioModal(false);
        }}
      />

      <AgregarProductoModal
        isOpen={showProductoModal}
        onClose={() => setShowProductoModal(false)}
        empresaId={empresaId}
        selectedProduct={selectedProduct}
        onSuccess={() => {
          setShowProductoModal(false);
          setSelectedProduct(null);
          refetch();
        }}
      />

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
              id="filter-sucursal"
              name="filter-sucursal"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disponibilidad
            </label>
            <select
              value={filters.disponibilidad}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  disponibilidad: e.target.value,
                }))
              }
              id="filter-disponibilidad"
              name="filter-disponibilidad"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los productos</option>
              <option value="disponibles">Disponibles</option>
              <option value="agotados">Agotados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={filters.categoria}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, categoria: e.target.value }))
              }
              id="filter-categoria"
              name="filter-categoria"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nombre}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                console.log("✅ INVENTARIO: Filtros aplicados:", filters);
                setShowFilters(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </FilterModal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Eliminar Productos"
        size="sm"
      >
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar {selectedProducts.size}{" "}
            productos seleccionados?
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={confirmBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar {selectedProducts.size} productos
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Producto"
        size="sm"
      >
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el producto "
            {selectedProduct?.nombre}"?
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
