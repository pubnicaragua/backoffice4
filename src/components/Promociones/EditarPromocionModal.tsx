import React, { useState, useEffect } from "react";
import { Modal } from "../Common/Modal";
import { X, Search } from "lucide-react";
import {
  useSupabaseUpdate,
  useSupabaseData,
} from "../../hooks/useSupabaseData";

interface EditarPromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promocion?: any;
  onSuccess?: () => void;
}

export function EditarPromocionModal({
  isOpen,
  onClose,
  promocion,
  onSuccess,
}: EditarPromocionModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    sucursal: "",
    precio_unitario: "",
    tipo: "", // Nuevo campo tipo
  });

  const [productosPromocion, setProductosPromocion] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProductos, setFilteredProductos] = useState<any[]>([]);

  const { update, loading } = useSupabaseUpdate("promociones");
  const { data: productos } = useSupabaseData<any>("productos", "*");
  const { data: sucursales } = useSupabaseData<any>("sucursales", "*");

  // Cargar datos al abrir o cuando cambien promocion/productos
  useEffect(() => {
    if (promocion) {
      // Normalizar productos_id a array
      const productosIdsRaw =
        promocion.promocion?.productos_id || promocion.productosId || [];
      const productosIds = Array.isArray(productosIdsRaw)
        ? productosIdsRaw
        : [productosIdsRaw];

      // Filtrar productos asociados
      const productosRelacionados =
        (productos || []).filter(
          (p) =>
            productosIds.includes(p.id) || productosIds.includes(String(p.id))
        ) || [];

      setProductosPromocion(productosRelacionados);

      setFormData({
        nombre: promocion.promocion?.nombre || promocion.nombre || "",
        descripcion:
          promocion.promocion?.descripcion || promocion.descripcion || "",
        sucursal: promocion.sucursal_id || "",
        precio_unitario:
          promocion.promocion?.precio_prom?.toString() ||
          promocion.precio?.toString() ||
          "",
        tipo: promocion.tipo || "", // Cargar tipo existente
      });
    } else {
      setProductosPromocion([]);
      setFormData({
        nombre: "",
        descripcion: "",
        sucursal: "",
        precio_unitario: "",
        tipo: "",
      });
    }
    setSearchTerm("");
    setFilteredProductos([]);
  }, [promocion, productos]);

  // Filtrar productos en buscador
  useEffect(() => {
    if (!searchTerm) {
      setFilteredProductos([]);
      return;
    }
    const filtered = (productos || []).filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProductos(filtered.slice(0, 5));
  }, [searchTerm, productos]);

  const handleRemoverProducto = (index: number) => {
    setProductosPromocion((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAgregarProducto = (producto: any) => {
    if (productosPromocion.some((p) => p.id === producto.id)) {
      alert("Este producto ya está en la promoción");
      return;
    }
    setProductosPromocion((prev) => [...prev, producto]);
    setSearchTerm("");
    setFilteredProductos([]);
  };

  const handleSucursalChange = (sucursalId: string) => {
    setFormData((prev) => ({ ...prev, sucursal: sucursalId }));
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, tipo: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    if (productosPromocion.length === 0) {
      alert("Por favor agrega al menos un producto a la promoción");
      return;
    }

    const promocionId = promocion?.promocion?.id || promocion?.id;
    if (!promocionId) {
      alert("No se pudo determinar la promoción a editar");
      return;
    }

    const productosIds = productosPromocion.map((p) => p.id);

    const success = await update(promocionId, {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio_prom: parseFloat(formData.precio_unitario) || 0,
      sucursal_id: formData.sucursal,
      productos_id: productosIds,
      tipo: formData.tipo, // <-- Guardar tipo seleccionado
      activo: true,
      disponible: true,
    });

    if (success) {
      setFormData({
        nombre: "",
        descripcion: "",
        sucursal: "",
        precio_unitario: "",
        tipo: "",
      });
      setProductosPromocion([]);
      if (onSuccess) onSuccess();
      else onClose();
    } else {
      alert("Error actualizando promoción");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar promoción" size="xl">
      <div className="flex space-x-6">
        {/* Formulario principal */}
        <div className="flex-1">
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            autoComplete="off"
            noValidate
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre <span className="text-red-600">*</span>
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
                autoComplete="off"
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
                placeholder="Descripción"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                autoComplete="off"
              />
            </div>

            {/* Tipo de promoción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de promoción <span className="text-red-600">*</span>
              </label>
              <select
                value={formData.tipo}
                onChange={handleTipoChange}
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
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {sucursales && sucursales.length > 0 ? (
                  sucursales.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="sucursal"
                        value={s.id}
                        checked={formData.sucursal === s.id}
                        onChange={() => handleSucursalChange(s.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        required
                      />
                      <span className="text-sm text-gray-700">{s.nombre}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-500">Cargando sucursales...</p>
                )}
              </div>
            </div>

            {/* Buscar y agregar productos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agregar producto
              </label>
              <div className="relative flex space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                  {searchTerm && filteredProductos.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {filteredProductos.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleAgregarProducto(prod)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                        >
                          <div className="font-medium">{prod.nombre}</div>
                          <div className="text-gray-500 text-xs">
                            SKU: {prod.codigo} - Precio: $
                            {prod.precio?.toLocaleString("es-CL")}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio
              </label>
              <input
                type="number"
                value={formData.precio_unitario}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    precio_unitario: e.target.value,
                  }))
                }
                placeholder="Precio"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
            </div>

            <div className="flex justify-center space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar promoción"}
              </button>
            </div>
          </form>
        </div>

        {/* Lista productos en promoción */}
        <div className="w-80 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            📋 Productos en promoción ({productosPromocion.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {productosPromocion.length === 0 && (
              <p className="text-center text-gray-500">
                No hay productos en esta promoción
              </p>
            )}
            {productosPromocion.map((producto, index) => (
              <div
                key={producto.id || index}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div>
                  <p className="font-medium text-sm">{producto.nombre}</p>
                  <p className="text-xs text-gray-500">
                    SKU: {producto.codigo}
                  </p>
                  <p className="text-xs text-gray-500">
                    Precio: ${producto.precio?.toLocaleString("es-CL")}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoverProducto(index)}
                  type="button"
                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                  title="Eliminar producto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
