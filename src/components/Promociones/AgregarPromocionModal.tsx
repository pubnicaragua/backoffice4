import React, { useState } from "react";
import { Modal } from "../Common/Modal";
import {
  useSupabaseInsert,
  useSupabaseData,
} from "../../hooks/useSupabaseData";
import { X, Search } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface AgregarPromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProductoAgregado {
  id: number;
  nombre: string;
  descripcion: string;
  precio_promocion: number;
  sku: string;
  sucursal: string;
  sucursalNombre: string;
  producto: any;
  precio_real: number;
}

export function AgregarPromocionModal({
  isOpen,
  onClose,
  onSuccess,
}: AgregarPromocionModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sucursal: "",
    precio_promocion: "",
    sku: "",
    tipo: "",
    producto_seleccionado: null as any,
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

  // Filtrado productos
  const filteredProductos = (productos || []).filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSucursalChange = (sucursalId: string) =>
    setFormData((prev) => ({ ...prev, sucursal: sucursalId }));

  const handleProductoSelect = (producto: any) => {
    setFormData((prev) => ({
      ...prev,
      producto_seleccionado: producto,
      sku: producto.codigo,
    }));
    setSearchTerm(""); // Cierra la lista de búsqueda al seleccionar
  };

  const handleAgregarOtroProducto = () => {
    if (!formData.nombre.trim()) {
      alert("Por favor ingresa el nombre de la promoción");
      return;
    }
    if (!formData.descripcion.trim()) {
      alert("Por favor ingresa la descripción de la promoción");
      return;
    }
    if (!formData.sucursal) {
      alert("Por favor selecciona una sucursal");
      return;
    }
    if (!formData.tipo) {
      alert("Por favor selecciona un tipo de promoción");
      return;
    }
    if (!formData.producto_seleccionado) {
      alert("Por favor selecciona un producto");
      return;
    }
    if (!formData.precio_promocion) {
      alert("Por favor ingresa un precio de promoción");
      return;
    }

    const sucursalObj = sucursales?.find(
      (s: any) => s.id === formData.sucursal
    );
    const sucursalNombre = sucursalObj ? sucursalObj.nombre : "Desconocida";

    const nuevoProducto: ProductoAgregado = {
      id: formData.producto_seleccionado.id,
      nombre: formData.producto_seleccionado.nombre,
      descripcion: formData.descripcion,
      precio_promocion: parseFloat(formData.precio_promocion),
      sku: formData.sku,
      sucursal: formData.sucursal,
      sucursalNombre,
      producto: formData.producto_seleccionado,
      precio_real: formData.producto_seleccionado.precio,
    };

    // Evitar duplicados por sku y sucursal
    const yaExiste = productosAgregados.some(
      (p) =>
        p.sku === nuevoProducto.sku && p.sucursal === nuevoProducto.sucursal
    );
    if (yaExiste) {
      alert("Este producto ya está agregado para la sucursal seleccionada");
      return;
    }

    setProductosAgregados((prev) => [...prev, nuevoProducto]);

    // Limpiar producto seleccionado, precio promocional y sku
    setFormData((prev) => ({
      ...prev,
      precio_promocion: "",
      sku: "",
      producto_seleccionado: null,
    }));
    setSearchTerm("");
  };

  const handleRemoverProducto = (index: number) => {
    setProductosAgregados((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombre.trim() ||
      !formData.descripcion.trim() ||
      !formData.sucursal ||
      !formData.tipo
    ) {
      alert("Por favor llena todos los campos obligatorios.");
      return;
    }
    if (productosAgregados.length === 0 && !formData.producto_seleccionado) {
      alert("Por favor agrega al menos un producto.");
      return;
    }
    const productosFinal =
      productosAgregados.length > 0
        ? productosAgregados
        : [
            {
              id: formData.producto_seleccionado?.id,
              nombre: formData.producto_seleccionado?.nombre,
              descripcion: formData.descripcion,
              precio_promocion: parseFloat(formData.precio_promocion),
              sku: formData.sku,
              sucursal: formData.sucursal,
              sucursalNombre:
                sucursales?.find((s: any) => s.id === formData.sucursal)
                  ?.nombre || "Desconocida",
              producto: formData.producto_seleccionado,
              precio_real: formData.producto_seleccionado?.precio,
            },
          ];

    const productosIds = productosFinal.map((p) => p.id);

    // IMPORTANTE: Siempre enviar array para productos_id, para evitar error "malformed array literal"
    const productosIdCampo = productosIds;

    const success = await insert({
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      empresa_id: empresaId,
      sucursal_id: formData.sucursal,
      precio_prom: null,
      productos_id: productosIdCampo, // Siempre array
      tipo: formData.tipo,
      activo: true,
    });

    if (success) {
      setProductosAgregados([]);
      setFormData({
        nombre: "",
        descripcion: "",
        sucursal: "",
        precio_promocion: "",
        sku: "",
        tipo: "", // <--- Resetear tipo
        producto_seleccionado: null,
      });
      setSearchTerm("");
      if (onSuccess) onSuccess();
      else onClose();
    } else {
      alert("Error guardando la promoción.");
      console.error("Error en guardar promoción");
    }
  };

  const canAgregar =
    formData.nombre.trim() !== "" &&
    formData.descripcion.trim() !== "" &&
    formData.sucursal !== "" &&
    formData.tipo !== "" && // <--- Validar tipo obligatorio
    formData.producto_seleccionado !== null &&
    formData.precio_promocion.trim() !== "";

  const canGuardar =
    !loading &&
    formData.nombre.trim() !== "" &&
    formData.descripcion.trim() !== "" &&
    formData.sucursal !== "" &&
    formData.tipo !== "" && // <--- Validar tipo obligatorio
    (productosAgregados.length > 0 || formData.producto_seleccionado !== null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
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

            {/* Campo NUEVO: tipo de promoción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de promoción <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.tipo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, tipo: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecciona un tipo</option>
                <option value="2x1">2x1</option>
                <option value="descuento">Descuento</option>
                <option value="combo">Combo</option>
                <option value="oferta">Oferta Especial</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escoger sucursal <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                {sucursales && sucursales.length > 0 ? (
                  sucursales.map((sucursal: any) => (
                    <label
                      key={sucursal.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="sucursal"
                        value={sucursal.id}
                        checked={formData.sucursal === sucursal.id}
                        onChange={() => handleSucursalChange(sucursal.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        required
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
                Buscar producto (SKU obligatorio)
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
            {formData.producto_seleccionado && (
              <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                <div className="font-medium">
                  {formData.producto_seleccionado.nombre}
                </div>
                <div>
                  <span className="line-through text-xs mr-1">
                    $
                    {formData.producto_seleccionado.precio?.toLocaleString(
                      "es-CL"
                    )}
                  </span>
                  <span className="text-xs font-semibold mr-2">
                    -$
                    {(
                      formData.producto_seleccionado.precio -
                      parseFloat(formData.precio_promocion || "0")
                    ).toLocaleString("es-CL")}
                  </span>
                  <span className="text-xs">
                    Promo: $
                    {parseFloat(
                      formData.precio_promocion || "0"
                    ).toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  Sucursal:{" "}
                  {sucursales?.find((s: any) => s.id === formData.sucursal)
                    ?.nombre || "Ninguna"}
                </div>
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
                type="button"
                onClick={handleAgregarOtroProducto}
                disabled={!canAgregar}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Agregar otro producto
              </button>
              <button
                type="submit"
                disabled={!canGuardar || loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading
                  ? "Guardando..."
                  : `Guardar ${
                      productosAgregados.length > 0
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
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {productosAgregados.map((producto, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-3 rounded border"
                >
                  <div>
                    <p className="font-medium text-sm">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">SKU: {producto.sku}</p>
                    <p className="text-xs text-gray-500">
                      Precio promoción: $
                      {producto.precio_promocion.toLocaleString("es-CL")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Sucursal: {producto.sucursalNombre}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoverProducto(index)}
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
