import React, { useState, useEffect } from "react";
import {
  Filter,
  Download,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  Trash2,
  Package,
  FileDown,
  Loader,
} from "lucide-react";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";
import { FilterModal } from "../Common/FilterModal";
import { ReporteMermas } from "./ReporteMermas";
import { ActualizarInventario } from "./ActualizarInventario";
import { AgregarProductoModal } from "./AgregarProductoModal";
import { Modal } from "../Common/Modal";
import { supabase } from "../../lib/supabase";
import { Producto } from "../../types";
import { Sucursal } from "../../types/cajas";
import { toast } from "react-toastify";
import { useUserPermissions } from "../../hooks/usePermission";

interface Categoria {
  id: string;
  nombre: string;
}

interface Inventario {
  id: string;
  producto_id: string;
  sucursal_id: string;
  stock_final: number;
}

interface VentaItem {
  id: string;
  cantidad: number;
  producto_id: string;
  venta_id: string;
  created_at: string;
}

interface FilterState {
  sucursal: string;
  categoria: string;
  disponibilidad: string;
  movimiento: string; // Nuevo filtro
}

export function ProductosTotales() {
  const { empresaId, user } = useAuth();
  const { hasPermission, PERMISOS } = useUserPermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    sucursal: "",
    categoria: "",
    disponibilidad: "",
    movimiento: "", // Nuevo filtro
  });
  const [showMermasModal, setShowMermasModal] = useState(false);
  const [showInventarioModal, setShowInventarioModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [inventariosLoading, setInventariosLoading] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [ventaItems, setVentaItems] = useState<VentaItem[]>([]);

  const { data: productos = [], refetch } = useSupabaseData<Producto>(
    "productos",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { data: sucursales = [] } = useSupabaseData<Sucursal>(
    "sucursales",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { data: categorias = [] } = useSupabaseData<Categoria>(
    "categorias",
    "*"
  );

  // Cargar datos de ventas para calcular movimiento
  useEffect(() => {
    async function cargarVentaItems() {
      if (!empresaId) return;

      const { data, error } = await supabase
        .from("venta_items")
        .select("*, ventas!inner(empresa_id)")
        .eq("ventas.empresa_id", empresaId)
        .gte(
          "created_at",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ); // Últimos 30 días

      if (!error && data) {
        setVentaItems(data);
      }
    }
    cargarVentaItems();
  }, [empresaId]);

  useEffect(() => {
    async function cargarInventarios() {
      if (!empresaId) {
        setInventarios([]);
        return;
      }
      setInventariosLoading(true);
      let query = supabase.from("inventario").select("*");

      if (filters.sucursal) {
        query = query.eq("sucursal_id", filters.sucursal);
      }

      if (filters.disponibilidad === "disponibles") {
        query = query.gt("stock_final", 0);
      } else if (filters.disponibilidad === "agotados") {
        query = query.eq("stock_final", 0);
      } else {
        query = query.lte("stock_final", 9999999);
      }

      query = query.order("producto_id", { ascending: true });

      const { data, error } = await query;
      if (error) {
        console.error("Error cargando inventario:", error);
        setInventarios([]);
      } else {
        const latestInventarios = Object.values(
          data.reduce((acc, inv) => {
            const key = `${inv.producto_id}-${inv.sucursal_id}`;
            if (!acc[key] || new Date(inv.fecha) > new Date(acc[key].fecha)) {
              acc[key] = inv;
            }
            return acc;
          }, {})
        );
        setInventarios(latestInventarios);
      }
      setInventariosLoading(false);
    }
    cargarInventarios();
    setLoading(false);
  }, [empresaId, filters, loading]);

  const columns = [
    { key: "|", label: "", width: "40px" },
    { key: "producto", label: "Producto" },
    { key: "stock", label: "Stock" },
    { key: "descripcion", label: "Descripción" },
    { key: "sku", label: "SKU" },
    { key: "costo", label: "Costo" },
    { key: "precio", label: "Precio" },
    { key: "margen", label: "Margen" },
    { key: "movimiento", label: "Movimiento" }, // Nueva columna
    { key: "disponible", label: "Disponible" },
    { key: "acciones", label: "Acciones" },
  ];

  // Función para calcular el movimiento de un producto
  const calcularMovimientoProducto = (
    productoId: string
  ): { cantidad: number; tipo: string } => {
    const ventasProducto = ventaItems.filter(
      (item) => item.producto_id === productoId
    );
    const totalVendido = ventasProducto.reduce(
      (sum, item) => sum + item.cantidad,
      0
    );

    // Clasificar movimiento basado en ventas de los últimos 30 días
    let tipo = "Sin movimiento";
    if (totalVendido >= 50) {
      tipo = "Mucho movimiento";
    } else if (totalVendido >= 10) {
      tipo = "Movimiento medio";
    } else if (totalVendido > 0) {
      tipo = "Poco movimiento";
    }

    return { cantidad: totalVendido, tipo };
  };

  console.log("inventarios", inventarios)
  console.log("productos", productos)
  const getFilteredProducts = () => {
    return (
      inventarios
        // Filtrar inventarios cuyo producto ya no existe
        .filter((inv) => productos.some((p) => p.id === inv.producto_id))
        // Filtrar por categoría
        .filter((inv) => {
          if (filters.categoria) {
            const producto = productos.find((p) => p.id === inv.producto_id);
            return producto?.categoria_id === filters.categoria;
          }
          return true;
        })
        // Filtrar por si está activo o no
        .filter((inv) => {
          const producto = productos.find((p) => p.id === inv.producto_id);
          return producto?.activo === true;
        })
        // Filtrar por sucursal si aplica
        .filter((inv) => {
          if (filters.sucursal) {
            return inv.sucursal_id === filters.sucursal;
          }
          return true;
        })
        // Filtrar por disponibilidad
        .filter((inv) => {
          if (filters.disponibilidad === "disponibles") {
            return inv.stock_final > 0;
          }
          if (filters.disponibilidad === "agotados") {
            return inv.stock_final <= 0;
          }
          return true;
        })
        // Filtrar por movimiento
        .filter((inv) => {
          if (filters.movimiento) {
            const movimiento = calcularMovimientoProducto(inv.producto_id);
            if (
              filters.movimiento === "mucho" &&
              movimiento.tipo !== "Mucho movimiento"
            )
              return false;
            if (
              filters.movimiento === "poco" &&
              movimiento.tipo !== "Poco movimiento"
            )
              return false;
            if (
              filters.movimiento === "sin" &&
              movimiento.tipo !== "Sin movimiento"
            )
              return false;
          }
          return true;
        })
        // Mapear inventario + producto
        .map((inv) => {
          const producto = productos.find((p) => p.id === inv.producto_id)!;
          const margenPercent = Math.round(
            (((producto.precio || 0) - (parseFloat(producto.costo) || 0)) /
              (producto.precio || 1)) *
            100
          );
          const movimiento = calcularMovimientoProducto(producto.id);

          return {
            id: producto.id,
            checkbox: (
              <input
                type="checkbox"
                checked={selectedProducts.has(producto.id)}
                onChange={(e) =>
                  handleSelectProduct(producto.id, e.target.checked)
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            ),
            producto: producto.nombre,
            stock_final: inv.stock_final,
            stock: (
              <span
                className={`font-medium ${inv.stock_final > 0
                  ? "text-green-600"
                  : inv.stock_final === 0
                    ? "text-yellow-600"
                    : "text-red-600"
                  }`}
              >
                {inv.stock_final}
              </span>
            ), categoria:
              categorias.find((c) => c.id === producto.categoria_id)?.nombre ||
              "Sin categoría",
            descripcion: producto.descripcion || "",
            sku: producto.codigo,
            costo: `$${Math.round(
              parseFloat(producto.costo) || 0
            ).toLocaleString("es-CL")}`,
            precio: `$${Math.round(producto.precio || 0).toLocaleString(
              "es-CL"
            )}`,
            margen: `${margenPercent}%`,
            movimiento: (
              <div className="flex flex-col">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${movimiento.tipo === "Mucho movimiento"
                    ? "bg-green-100 text-green-800"
                    : movimiento.tipo === "Poco movimiento"
                      ? "bg-yellow-100 text-yellow-800"
                      : movimiento.tipo === "Movimiento medio"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {movimiento.tipo}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {movimiento.cantidad} vendidos
                </span>
              </div>
            ),
            disponible: inv.stock_final > 0
              ? "Disponible"
              : inv.stock_final === 0
                ? "Agotado"
                : "Stock negativo",
            acciones: (
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProduct(producto);
                  }}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  title="Editar producto"
                  type="button"
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
                  type="button"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ),
          };
        })
    );
  };

  const filteredProducts = getFilteredProducts();

  // Filtrar por búsqueda en tabla
  const filteredData = filteredProducts.filter(
    (item) =>
      searchTerm === "" ||
      item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Handlers para editar, eliminar y selección múltiple
  const handleEditProduct = (producto: Producto) => {
    setSelectedProduct(producto);
    setShowProductoModal(true);
  };

  const handleDeleteProduct = (producto: Producto) => {
    setSelectedProduct(producto);
    setShowDeleteModal(true);
  };

  const handleSelectProduct = (id: string, checked: boolean) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map((row) => row.id);
      setSelectedProducts(new Set(allIds));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size > 0) setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    for (const productId of selectedProducts) {
      const { error } = await supabase
        .from("productos")
        .update({ activo: false })
        .eq("id", productId);
      if (error) console.error("Error eliminando producto", productId, error);
    }
    setShowBulkDeleteModal(false);
    setSelectedProducts(new Set());
    refetch();
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    const { error: errorProducto } = await supabase
      .from("productos")
      .update({ activo: false })
      .eq("id", selectedProduct.id);

    if (errorProducto) {
      console.error("Error eliminando producto", errorProducto);
      return;
    }
    setShowDeleteModal(false);
    setSelectedProduct(null);
    refetch();
  };

  const handleDownloadReport = () => {
    const headers = [
      "Producto",
      "Stock",
      "Categoria",
      "SKU",
      "Costo",
      "Precio",
      "Margen",
      "Movimiento",
      "Cantidad Vendida",
      "Disponible",
    ];
    const filteredDataForReport = filteredProducts;
    const csvContent =
      "\uFEFF" +
      [
        headers.join(","),
        ...filteredDataForReport.map((row) => {
          const movimiento = calcularMovimientoProducto(row.id);
          return [
            row.producto,
            row.stock_final,
            row.categoria,
            row.sku,
            row.costo.replace(/[$.,]/g, ""),
            row.precio.replace(/[$.,]/g, ""),
            row.margen.replace("%", ""),
            movimiento.tipo,
            movimiento.cantidad,
            row.disponible,
          ].join(",");
        }),
      ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte_inventario_${new Date().toISOString().split("T")[0]
      }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Reporte CSV descargado");
  };

  const handleDownloadTemplate = () => {
    // 1. Encabezados de la plantilla
    const headers = ["Nombre", "Cantidad", "Costo", "Precio", "Categoria"];

    // 2. Datos de ejemplo
    const sampleData = [
      ["Coca Cola 500ml", 50, 1000, 1500, "Bebidas"],
      ["Pan Hallulla", 25, 500, 800, "Alimentos"],
      ["Leche 1L", 30, 800, 1200, "Bebidas"],
    ];

    // 3. Convertir a CSV
    const csvRows = [
      headers.join(","), // primera fila: encabezados
      ...sampleData.map(row => row.join(",")) // filas de ejemplo
    ];

    const csvContent = csvRows.join("\n");

    // 4. Crear el archivo CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // 5. Crear enlace de descarga
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantilla_productos_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    // 6. Liberar memoria
    URL.revokeObjectURL(url);

    // 7. Mostrar notificación
    toast.success("Plantilla de productos descargada.");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Productos totales
        </h1>
      </div>

      {/* Search and actions */}
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
            autoComplete="off"
          />
        </div>

        <div className="flex items-center space-x-3">
          {selectedProducts.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar {selectedProducts.size}</span>
            </button>
          )}
          <button
            onClick={handleDownloadTemplate}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Descargar Plantilla"
            type="button"
          >
            <FileDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownloadReport}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Descargar Reporte"
            type="button"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Filtros"
            type="button"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!hasPermission(PERMISOS.GestionProductos)) {
                toast.error("No cuentas permisos para realizar esta accion");
                return;
              }
              setSelectedProduct(null);
              setShowProductoModal(true);
            }}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Agregar"
            type="button"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (!hasPermission(PERMISOS.GestionProductos)) {
                toast.error("No cuentas permisos para realizar esta accion");
                return;
              }
              setShowInventarioModal(true);
            }}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Actualizar inventario"
            type="button"
          >
            <Package className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowMermasModal(true)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            title="Mermas"
            type="button"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">
                <input
                  type="checkbox"
                  checked={selectedProducts.size === paginatedData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </th>
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
            {paginatedData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(row.id)}
                    onChange={(e) =>
                      handleSelectProduct(row.id, e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 text-sm text-gray-900"
                  >
                    {row[column.key as keyof typeof row]}
                  </td>
                ))}
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
                {filteredProducts.length} productos
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                type="button"
              >
                Anterior
              </button>

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
                    type="button"
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-md text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                type="button"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <ReporteMermas
        isOpen={showMermasModal}
        onClose={() => setShowMermasModal(false)}
      />

      <ActualizarInventario
        isOpen={showInventarioModal}
        onClose={() => {
          setShowInventarioModal(false);
          setLoading(true);
          refetch();
        }}
      />

      <AgregarProductoModal
        isOpen={showProductoModal}
        onClose={() => {
          setShowProductoModal(false);
          setLoading(true);
          refetch();
        }}
        selectedProduct={selectedProduct}
        onSuccess={() => {
          setShowProductoModal(false);
          setSelectedProduct(null);
          setLoading(true);
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
                setFilters((prev) => ({
                  ...prev,
                  categoria: e.target.value,
                }))
              }
              id="filter-categoria"
              name="filter-categoria"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movimiento de Productos
            </label>
            <select
              value={filters.movimiento}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  movimiento: e.target.value,
                }))
              }
              id="filter-movimiento"
              name="filter-movimiento"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los movimientos</option>
              <option value="mucho">Mucho movimiento (50+ ventas)</option>
              <option value="poco">Poco movimiento (1-9 ventas)</option>
              <option value="sin">Sin movimiento (0 ventas)</option>
            </select>
          </div>
        </div>
      </FilterModal>

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
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={confirmBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              type="button"
            >
              Eliminar {selectedProducts.size} productos
            </button>
          </div>
        </div>
      </Modal>

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
              type="button"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              type="button"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
