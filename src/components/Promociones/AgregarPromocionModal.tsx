import React, { useState } from "react";
import { Modal } from "../Common/Modal";
import {
  useSupabaseInsert,
  useSupabaseData,
} from "../../hooks/useSupabaseData";
import { X, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Producto, ProductoAgregado } from "../../types";
import { toast } from "react-toastify";

interface AgregarPromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AgregarPromocionModal({
  isOpen,
  onClose,
  onSuccess,
}: AgregarPromocionModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sucursales: [] as string[],
    precio_promocion: "",
    sku: "",
    productos_seleccionados: [] as Producto[],
  });
  const { empresaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [productosAgregados, setProductosAgregados] = useState<
    ProductoAgregado[]
  >([]);

  const { insert, loading } = useSupabaseInsert("promociones");
  const { data: productos } = useSupabaseData<any>(
    "productos",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );
  const { data: sucursales } = useSupabaseData<any>(
    "sucursales",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const handleCLose = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      sucursales: [] as string[],
      precio_promocion: "",
      sku: "",
      productos_seleccionados: [] as Producto[]
    })
    onClose()
  }

  const handleSucursalChange = (sucursalId: string) => {
    setFormData(prev => {
      const sucursalesActuales = prev.sucursales || [];

      if (sucursalesActuales.includes(sucursalId)) {
        // Si ya está seleccionada, la removemos
        return {
          ...prev,
          sucursales: sucursalesActuales.filter(id => id !== sucursalId)
        };
      } else {
        // Si no está seleccionada, la agregamos
        return {
          ...prev,
          sucursales: [...sucursalesActuales, sucursalId]
        };
      }
    });
  };

  const handleProductoSelect = (producto: any) => {
    setFormData((prev) => ({
      ...prev,
      productos_seleccionados: [...prev.productos_seleccionados, producto],
      sku: producto.codigo,
    }));
    setSearchTerm("");
  };

  const handleRemoverProducto = (id: string | number) => {
    setProductosAgregados((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombre.trim() ||
      !formData.descripcion.trim() ||
      formData.sucursales.length === 0
    ) {
      toast.error("Por favor llena todos los campos obligatorios.");
      return;
    }

    if (productosAgregados.length === 0 && formData.productos_seleccionados.length === 0) {
      toast.error("Por favor agrega al menos un producto.");
      return;
    }

    // Construir productosFinal
    const productosFinal =
      productosAgregados.length > 0
        ? productosAgregados
        : formData.productos_seleccionados.map((producto) => ({
          id: producto.id,
          nombre: producto.nombre,
          descripcion: formData.descripcion,
          precio_promocion: parseFloat(formData.precio_promocion),
          sku: producto.codigo,
          sucursales: formData.sucursales,
          producto,
          precio_real: producto.precio,
        }));

    const productosIds = productosFinal.map((p) => p.id);

    const precioReal = productosFinal[0]?.precio_real || 0;
    const descuento = parseFloat(formData.precio_promocion || "0");

    const success = await insert({
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      empresa_id: empresaId,
      sucursales_id: formData.sucursales,
      precio: precioReal,
      precio_prom: precioReal - descuento,
      productos_id: productosIds,
      activo: true,
    });

    if (success) {
      setProductosAgregados([]);
      setFormData({
        nombre: "",
        descripcion: "",
        sucursales: [],
        precio_promocion: "",
        sku: "",
        productos_seleccionados: [],
      });
      setSearchTerm("");
      if (onSuccess) onSuccess();
      else onClose();
    } else {
      toast.error("Error guardando la promoción.");
      console.error("Error en guardar promoción");
    }
  };

  const canGuardar =
    !loading &&
    formData.nombre.trim() !== "" &&
    formData.descripcion.trim() !== "" &&
    formData.sucursales.length > 0 &&
    (productosAgregados.length > 0 || formData.productos_seleccionados.length > 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCLose}
      title="Agregar promoción"
      size="xl"
    >
      <div className="flex space-x-6">
        {/* Formulario */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la promoción <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Nombre de la promoción"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descripcion: e.target.value,
                  }))
                }
                placeholder="Descripción de la promoción"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escoger sucursales <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {sucursales && sucursales.length > 0 ? (
                  sucursales.map((sucursal: any) => (
                    <label
                      key={sucursal.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="sucursales" // Cambiado de "sucursal" a "sucursales"
                        value={sucursal.id}
                        checked={formData.sucursales?.includes(sucursal.id) || false} // Verificar si está en el array
                        onChange={() => handleSucursalChange(sucursal.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {sucursal.nombre}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500">Cargando sucursales...</p>
                )}
              </div>
            </div>

            {/* Buscador productos */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar producto
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {searchTerm && filteredProductos.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredProductos.slice(0, 5).map((producto) => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => handleProductoSelect(producto)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                    >
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-gray-500 text-xs">
                        SKU: {producto.codigo} - Precio: $
                        {producto.precio?.toLocaleString("es-CL")}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Producto seleccionado */}

            {formData.productos_seleccionados.length > 0 && (
              <div className="space-y-3">
                {formData.productos_seleccionados.map((producto) => (
                  <div
                    key={producto.id}
                    className="bg-gray-50 p-3 rounded-lg text-sm space-y-1"
                  >
                    <div className="font-medium">{producto.nombre}</div>
                    <div>
                      <span className="line-through text-xs mr-1">
                        $
                        {producto.precio?.toLocaleString("es-CL")}
                      </span>
                      <span className="text-xs font-semibold mr-2">
                        -$
                        {(
                          producto.precio -
                          parseFloat(formData.precio_promocion || "0")
                        ).toLocaleString("es-CL")}
                      </span>
                      <span className="text-xs">
                        Promo: $
                        {parseFloat(formData.precio_promocion || "0").toLocaleString(
                          "es-CL"
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Sucursal:{" "}
                      {sucursales?.find((s: any) => s.id === formData.sucursales)?.nombre ||
                        "Ninguna"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de promoción <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_promocion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    precio_promocion: e.target.value,
                  }))
                }
                placeholder="Precio promocional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-center space-x-3">
              <button
                type="submit"
                disabled={!canGuardar || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Guardando..."
                  : `Guardar ${productosAgregados.length > 0
                    ? productosAgregados.length
                    : 1
                  } promoción(es)`}
              </button>
            </div>
          </form>
        </div>

        {/* Lista flotante de productos agregados */}
        {productosAgregados.length > 0 && (
          <div className="w-80 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              📋 Productos agregados ({productosAgregados.length})
            </h4>

            {/* Contenedor scrollable */}
            <div
              className="space-y-2 overflow-y-auto"
              style={{ height: "384px" }} // Fija altura exacta
            >
              {productosAgregados.map((producto) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between bg-white p-3 rounded border"
                >
                  <div>
                    <p className="font-medium text-sm">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">SKU: {producto.sku}</p>
                    <p className="text-xs text-gray-500">
                      Precio promoción: $
                      {(producto.precio_promocion ?? 0).toLocaleString("es-CL")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Sucursal: {producto.sucursalNombre}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoverProducto(producto.id)}
                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                    title="Eliminar producto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
