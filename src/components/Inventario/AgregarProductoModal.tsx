import React, { useState, useEffect } from "react";
import { Modal } from "../Common/Modal";
import {
  useSupabaseData,
  useSupabaseInsert,
  useSupabaseUpdate,
} from "../../hooks/useSupabaseData";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface AgregarProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: any;
  onSuccess?: () => void;
}

export function AgregarProductoModal({
  isOpen,
  onClose,
  selectedProduct,
  onSuccess,
}: AgregarProductoModalProps) {
  const [formData, setFormData] = useState({
    producto: "",
    descripcion: "",
    se_vende_por: "unidad",
    codigo_unitario: "",
    precio_unitario: "", // Precio de venta
    categoria_id: '',
    sku: "",
    agregar_stock: "",
    costo: "",
    sucursal: "", // agregada para seleccionar sucursal
  });
  const { insert, loading } = useSupabaseInsert("productos");
  const { empresaId, user } = useAuth()

  const { update, loading: updating } = useSupabaseUpdate("productos");

  const { data: categorias } = useSupabaseData<any>("categorias", '*')

  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  // Cargar sucursales cuando cambie empresaId o se abra modal
  useEffect(() => {
    if (!empresaId || !isOpen) {
      setSucursales([]);
      setFormData((prev) => ({ ...prev, sucursal: "" }));
      return;
    }
    setLoadingSucursales(true);
    supabase
      .from("sucursales")
      .select("*")
      .eq("empresa_id", empresaId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error cargando sucursales:", error);
          setSucursales([]);
        } else {
          setSucursales(data || []);
        }
        setLoadingSucursales(false);
      });
  }, [empresaId, isOpen]);

  // Update form when selectedProduct changes or modal opens
  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        categoria_id: selectedProduct.categoria_id || '',
        producto: selectedProduct.nombre || "",
        descripcion: selectedProduct.descripcion || "",
        se_vende_por: selectedProduct.unidad === "KG" ? "kilogramo" : "unidad",
        codigo_unitario: selectedProduct.codigo || "",
        precio_unitario:
          selectedProduct.precio !== undefined
            ? selectedProduct.precio.toString()
            : "",
        sku: selectedProduct.codigo || "",
        agregar_stock:
          selectedProduct.stock !== undefined
            ? selectedProduct.stock.toString()
            : "",
        costo:
          selectedProduct.costo !== undefined
            ? selectedProduct.costo.toString()
            : "",
        sucursal: selectedProduct.sucursal_id || "",
      });
    } else {
      // Reset form completely when no product selected
      setFormData({
        producto: "",
        descripcion: "",
        se_vende_por: "unidad",
        codigo_unitario: "",
        precio_unitario: "",
        sku: "",
        agregar_stock: "",
        categoria_id: '',
        costo: "",
        sucursal: "",
      });
    }
  }, [selectedProduct, isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        categoria_id: "",
        producto: "",
        descripcion: "",
        se_vende_por: "unidad",
        codigo_unitario: "",
        precio_unitario: "",
        sku: "",
        agregar_stock: "",
        costo: "",
        sucursal: "",
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresaId) {
      alert("Error: No se ha definido la empresa.");
      return;
    }

    if (!formData.sucursal) {
      alert("Por favor, seleccione una sucursal.");
      return;
    }

    const precioParsed = parseFloat(formData.precio_unitario);
    if (isNaN(precioParsed) || precioParsed < 0) {
      alert("Por favor, ingrese un precio válido.");
      return;
    }

    const costoParsed = parseFloat(formData.costo) || 0;
    const stockParsed = parseFloat(formData.agregar_stock) || 0;

    let success;

    console.log(formData);

    if (selectedProduct) {
      const { error } = await supabase
        .from("productos")
        .update({
          codigo: formData.sku || formData.codigo_unitario,
          nombre: formData.producto,
          descripcion: formData.descripcion,
          precio: precioParsed,
          costo: costoParsed,
          unidad: formData.se_vende_por === "unidad" ? "UN" : "KG",
          stock: stockParsed,
          empresa_id: empresaId,
          sucursal_id: formData.sucursal,
          categoria_id: formData.categoria_id,
        })
        .eq("id", selectedProduct.id);

      success = !error;
    } else {
      // 1. Verificar si ya existe el producto
      const { data: existingProduct, error: findError } = await supabase
        .from("productos")
        .select("*")
        .eq("codigo", formData.sku)
        .eq("empresa_id", empresaId)
        .eq("sucursal_id", formData.sucursal)
        .single();

      if (existingProduct) {
        // 2. Buscar el último registro de inventario de ese producto
        const { data: lastMov, error: invError } = await supabase
          .from("inventario")
          .select("stock_final")
          .eq("producto_id", existingProduct.id)
          .order("fecha", { ascending: false })
          .limit(1)
          .single();

        const stockAnterior = lastMov?.stock_final || 0;
        const nuevoStock = stockAnterior + stockParsed;

        // 3. Actualizar el producto con el nuevo stock
        const { error: updateError } = await supabase
          .from("productos")
          .update({
            stock: nuevoStock,
          })
          .eq("id", existingProduct.id);

        if (!updateError) {
          // 4. Insertar un movimiento en inventario (tipo entrada)
          await supabase.from("inventario").insert({
            empresa_id: empresaId,
            sucursal_id: formData.sucursal,
            producto_id: existingProduct.id,
            fecha: new Date().toISOString(),
            movimiento: "entrada",
            cantidad: stockParsed,
            stock_final: nuevoStock,
            stock_anterior: stockAnterior,
            referencia: "Ingreso adicional de producto",
            usuario_id: user?.id,
          });
        }

        success = !updateError;
      } else {
        // 5. Si no existe → crear producto normalmente
        const { error } = await supabase.from("productos").insert({
          codigo: formData.sku,
          nombre: formData.producto,
          descripcion: formData.descripcion,
          precio: precioParsed,
          costo: costoParsed,
          tipo: "producto",
          unidad: formData.se_vende_por === "unidad" ? "UN" : "KG",
          stock: stockParsed,
          empresa_id: empresaId,
          sucursal_id: formData.sucursal,
          categoria_id: formData.categoria_id,
        });

        success = !error;
      }
    }

    if (success) {
      setFormData({
        producto: "",
        descripcion: "",
        se_vende_por: "unidad",
        codigo_unitario: "",
        precio_unitario: "",
        sku: "",
        agregar_stock: "",
        costo: "",
        sucursal: "",
        categoria_id: "",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedProduct ? "Editar producto" : "Agregar producto"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="producto-nombre"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Producto
          </label>
          <input
            id="producto-nombre"
            name="producto-nombre"
            type="text"
            value={formData.producto}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, producto: e.target.value }))
            }
            placeholder="Producto"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="producto-descripcion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Descripción
          </label>
          <input
            id="producto-descripcion"
            name="producto-descripcion"
            type="text"
            value={formData.descripcion}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
            }
            placeholder="Descripción"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de venta
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                id="venta-unidad"
                name="se_vende_por"
                type="radio"
                value="unidad"
                checked={formData.se_vende_por === "unidad"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    se_vende_por: e.target.value,
                  }))
                }
                className="mr-2 text-blue-600"
              />
              Unidad
            </label>
            <label className="flex items-center">
              <input
                id="venta-kilogramo"
                name="se_vende_por"
                type="radio"
                value="kilogramo"
                checked={formData.se_vende_por === "kilogramo"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    se_vende_por: e.target.value,
                  }))
                }
                className="mr-2 text-blue-600"
              />
              Kilogramo
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="producto-sku"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            SKU (Opcional)
          </label>
          <input
            id="producto-sku"
            name="producto-sku"
            type="text"
            value={formData.sku}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, sku: e.target.value }))
            }
            placeholder="SKU específico"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="sucursal-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sucursal
          </label>
          <select
            id="sucursal-select"
            name="sucursal-select"
            value={formData.sucursal}
            onChange={(e) => {
              console.log(e.target.value)
              setFormData((prev) => ({ ...prev, sucursal: e.target.value }))

            }
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loadingSucursales}
          >
            <option value="">Seleccionar sucursal</option>
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
          {loadingSucursales && (
            <p className="mt-1 text-sm text-gray-500">Cargando sucursales...</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="costo-producto"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Costo
            </label>
            <input
              id="costo-producto"
              name="costo-producto"
              type="number"
              value={formData.costo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, costo: e.target.value }))
              }
              placeholder="Costo del producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="any"
            />
          </div>
          <div>
            <label
              htmlFor="precio-unitario"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Precio de venta
            </label>
            <input
              id="precio-unitario"
              name="precio-unitario"
              type="number"
              value={formData.precio_unitario}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  precio_unitario: e.target.value,
                }))
              }
              placeholder="Precio de venta"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0"
              step="any"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="stock-actual"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Agregar stock actual
          </label>
          <input
            id="stock-actual"
            name="stock-actual"
            type="number"
            value={formData.agregar_stock}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                agregar_stock: e.target.value,
              }))
            }
            placeholder="Agregar stock actual / adicional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="any"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría
          </label>
          <select
            value={formData.categoria_id}
            onChange={(e) => setFormData(prev => ({ ...prev, categoria_id: e.target.value }))}
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

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || updating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading || updating
              ? "Guardando..."
              : selectedProduct
                ? "Actualizar producto"
                : "Guardar producto"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
