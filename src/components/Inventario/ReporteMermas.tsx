import React, { useState, useEffect } from "react";
import { Modal } from "../Common/Modal";
import { Search } from "lucide-react";
import {
  useSupabaseData,
  useSupabaseInsert,
} from "../../hooks/useSupabaseData";
import { useAuth } from "../../contexts/AuthContext";

interface ReporteMermasProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReporteMermas({ isOpen, onClose }: ReporteMermasProps) {
  const { empresaId } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    tipo_merma: "robo",
    cantidad_mermada: "",
    observaciones: "",
    producto_seleccionado: "",
    sucursal_seleccionada: "",
  });

  // Cargar productos filtrados por empresaId
  const { data: productos, loading: loadingProductos } = useSupabaseData<any>(
    "productos",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Cargar sucursales filtradas por empresaId
  const { data: sucursales, loading: loadingSucursales } = useSupabaseData<any>(
    "sucursales",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { insert, loading: loadingInsert } = useSupabaseInsert("mermas");

  // Filtrar productos por búsqueda (nombre o código)
  const filteredProductos = (productos || []).filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (producto.codigo &&
        producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener datos completos del producto seleccionado para previsualización
  const productoSeleccionadoDatos = productos?.find(
    (p) => p.id === formData.producto_seleccionado
  );

  // Limpiar búsqueda y formulario si modal se cierra
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setFormData({
        tipo_merma: "robo",
        cantidad_mermada: "",
        observaciones: "",
        producto_seleccionado: "",
        sucursal_seleccionada: "",
      });
    }
  }, [isOpen]);

  // Función interna para insertar la merma
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!empresaId) {
      alert("Error: Empresa no definida");
      return;
    }
    if (!formData.sucursal_seleccionada) {
      alert("Por favor selecciona una sucursal");
      return;
    }
    if (!formData.producto_seleccionado) {
      alert("Por favor selecciona un producto");
      return;
    }
    const cantidad = parseFloat(formData.cantidad_mermada);
    if (isNaN(cantidad) || cantidad <= 0) {
      alert("Por favor ingresa una cantidad válida mayor a 0");
      return;
    }

    const dataToInsert = {
      empresa_id: empresaId,
      sucursal_id: formData.sucursal_seleccionada,
      producto_id: formData.producto_seleccionado,
      tipo: formData.tipo_merma || null,
      cantidad,
      observacion: formData.observaciones || null,
      fecha: new Date().toISOString(),
    };

    const success = await insert(dataToInsert);

    if (success) {
      onClose();
      setFormData({
        tipo_merma: "robo",
        cantidad_mermada: "",
        observaciones: "",
        producto_seleccionado: "",
        sucursal_seleccionada: "",
      });
      setSearchTerm("");
    } else {
      alert("Error reportando la merma");
      console.error("Error insertando merma", dataToInsert);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reporte de mermas"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* PREVISUALIZACIÓN DEL PRODUCTO SELECCIONADO */}
        {productoSeleccionadoDatos && (
          <div className="p-3 border rounded bg-gray-50 mb-3">
            <p className="font-semibold">Producto seleccionado:</p>
            <p>
              <span className="font-medium">Nombre:</span>{" "}
              {productoSeleccionadoDatos.nombre}
            </p>
            <p>
              <span className="font-medium">SKU:</span>{" "}
              {productoSeleccionadoDatos.codigo || "N/A"}
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="sucursal-merma-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sucursal <span className="text-red-600">*</span>
          </label>
          <select
            id="sucursal-merma-select"
            name="sucursal-merma-select"
            value={formData.sucursal_seleccionada}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sucursal_seleccionada: e.target.value,
              }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loadingSucursales}
          >
            <option value="">Seleccionar sucursal</option>
            {(sucursales || []).map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
          {loadingSucursales && (
            <p className="text-sm text-gray-500 mt-1">Cargando sucursales...</p>
          )}
        </div>

        <div className="relative">
          <label
            htmlFor="buscar-merma-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Buscar Producto (SKU o nombre)
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              id="buscar-merma-input"
              name="buscar-merma-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
              disabled={loadingProductos}
            />
          </div>

          {searchTerm && filteredProductos.length > 0 && (
            <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredProductos.slice(0, 5).map((producto) => (
                <button
                  key={producto.id}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      producto_seleccionado: producto.id,
                    }));
                    setSearchTerm(""); // Cierra la ventana desplegable limpiando la búsqueda
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  <div className="font-medium">{producto.nombre}</div>
                  <div className="text-gray-500 text-xs">
                    SKU: {producto.codigo}
                  </div>
                </button>
              ))}
            </div>
          )}

          {loadingProductos && (
            <p className="text-sm text-gray-500 mt-1">Cargando productos...</p>
          )}
        </div>

        <div>
          <label
            htmlFor="tipo-merma-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tipo de merma
          </label>
          <select
            id="tipo-merma-select"
            name="tipo-merma-select"
            value={formData.tipo_merma}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, tipo_merma: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="robo">Robo de merma</option>
            <option value="vencimiento">Vencimiento</option>
            <option value="daño">Daño</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="cantidad-mermada-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Cantidad mermada <span className="text-red-600">*</span>
          </label>
          <input
            id="cantidad-mermada-input"
            name="cantidad-mermada-input"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.cantidad_mermada}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                cantidad_mermada: e.target.value,
              }))
            }
            placeholder="Cantidad mermada"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="observaciones-merma-textarea"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Observaciones
          </label>
          <textarea
            id="observaciones-merma-textarea"
            name="observaciones-merma-textarea"
            value={formData.observaciones}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                observaciones: e.target.value,
              }))
            }
            placeholder="Observaciones adicionales..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loadingInsert}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingInsert ? "Reportando..." : "Reportar merma"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
