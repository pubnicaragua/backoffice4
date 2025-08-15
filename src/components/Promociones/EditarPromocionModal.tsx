import React, { useState, useEffect } from "react";
import { Modal } from "../Common/Modal";
import { X, Search } from "lucide-react";
import {
  useSupabaseUpdate,
  useSupabaseData,
} from "../../hooks/useSupabaseData";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";
import { Producto, Promocion } from "../../types";

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
    sucursales_id: [] as string[],
    precio_promocion: "",
    productos_seleccionados: [] as Producto[],
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProductos, setFilteredProductos] = useState<any[]>([]);
  const { empresaId } = useAuth()

  const { update, loading } = useSupabaseUpdate("promociones");
  const { data: productos } = useSupabaseData<any>("productos", "*");
  const { data: sucursales } = useSupabaseData<any>("sucursales", "*", empresaId ? { empresa_id: empresaId } : undefined)

  // Cargar datos al abrir o cuando cambien promocion/productos
  useEffect(() => {
    console.log(promocion)
    if (promocion) {
      setFormData({
        nombre: promocion.promocion?.nombre || promocion.nombre || "",
        descripcion:
          promocion.promocion?.descripcion || promocion.descripcion || "",
        sucursales_id: promocion.sucursales_id || [],
        precio_promocion: promocion.precio_prom,
        productos_seleccionados: promocion.productos_id.map((id: string) => {
          const producto = productos.find((p) => p.id === id);
          return producto
            ? {
              ...producto,
              precio_promocion: promocion.precio_prom,
              precio_real: producto.precio,
            }
            : null;
        }).filter(Boolean),
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        sucursales_id: [],
        precio_promocion: "",
        productos_seleccionados: [],
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
    setFormData((prev) => ({
      ...prev,
      productos_seleccionados: prev.productos_seleccionados.filter(
        (_, i) => i !== index
      ),
    }));
  };


  const handleAgregarProducto = (producto: any) => {
    if (formData.productos_seleccionados.some((p) => p.id === producto.id)) {
      toast.error("Este producto ya está en la promoción");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      productos_seleccionados: [...prev.productos_seleccionados, producto]
    }))
    setSearchTerm("");
    setFilteredProductos([]);
  };

  const handleSucursalChange = (sucursalId: string) => {
    setFormData(prev => {
      const sucursalesActuales = prev.sucursales_id || [];

      if (sucursalesActuales.includes(sucursalId)) {
        // Si ya está seleccionada, la removemos
        return {
          ...prev,
          sucursales_id: sucursalesActuales.filter(id => id !== sucursalId)
        };
      } else {
        // Si no está seleccionada, la agregamos
        return {
          ...prev,
          sucursales_id: [...sucursalesActuales, sucursalId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      toast.error("Por favor ingresa el nombre de la promoción");
      return;
    }
    if (!formData.descripcion.trim()) {
      toast.error("Por favor ingresa la descripción de la promoción");
      return;
    }
    if (formData.sucursales_id.length === 0) {
      toast.error("Por favor selecciona al menos una sucursal");
      return;
    }
    if (formData.productos_seleccionados.length === 0) {
      toast.error("Por favor agrega al menos un producto a la promoción");
      return;
    }

    const promocionId = promocion?.promocion?.id || promocion?.id;
    if (!promocionId) {
      toast.error("No se pudo determinar la promoción a editar");
      return;
    }

    const productosIds = formData.productos_seleccionados.map((p) => p.id);

    const success = await update(promocionId, {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      precio_prom: parseFloat(formData.precio_promocion) || 0,
      sucursales_id: formData.sucursales_id,
      productos_id: productosIds,
      activo: true,
      disponible: true,
    });

    if (success) {
      setFormData({
        nombre: "",
        descripcion: "",
        sucursales_id: [],
        precio_promocion: "",
        productos_seleccionados: [],
      });
      if (onSuccess) onSuccess();
      else onClose();
    } else {
      toast.error("Error actualizando promoción");
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: "",
      descripcion: "",
      sucursales_id: [],
      precio_promocion: "",
      productos_seleccionados: [],
    });  
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar promoción" size="xl">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escoger sucursales <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {sucursales && sucursales.length > 0 ? (
                  sucursales.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={s.id}
                        checked={formData.sucursales_id.includes(s.id)}
                        onChange={() => handleSucursalChange(s.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                value={formData.precio_promocion}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    precio_promocion: e.target.value,
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
            📋 Productos en promoción ({formData.productos_seleccionados.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {formData.productos_seleccionados.length === 0 && (
              <p className="text-center text-gray-500">
                No hay productos en esta promoción
              </p>
            )}
            {formData.productos_seleccionados.map((producto, index) => (
              <div
                key={producto.id || index}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div>
                  <p className="font-medium text-sm">{producto.nombre}</p>
                  <p className="text-xs text-gray-500">
                    SKU: {producto.codigo}
                  </p>
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
