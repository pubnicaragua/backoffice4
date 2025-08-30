import React, { useState } from "react";
import { Filter, Search, Plus, Edit, Trash2 } from "lucide-react";
import {
  useSupabaseData,
  useSupabaseInsert,
  useSupabaseUpdate,
} from "../../hooks/useSupabaseData";
import { Modal } from "../Common/Modal";
import { useAuth } from "../../contexts/AuthContext";
import { Producto } from "../../types";
import AgregarCuponForm from "./modals/AgregarCuponModal";
import { toast } from "react-toastify";
import { supabase } from "../../lib/supabase";

export function CuponesTodas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [selectedCupon, setSelectedCupon] = useState(null);
  const { empresaId } = useAuth();
  const [filters, setFilters] = useState({
    codigo: "",
    estado: "",
    tipo: "",
  });
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    tipo: "descuento",
    valor: "",
    usos_maximos: "1",
    fecha_inicio: "",
    fecha_fin: "",
    producto_id: "",
    searchTerm: "",
  });


  const {
    data: cupones,
    loading,
    refetch,
  } = useSupabaseData<any>(
    "cupones",
    "*, sucursales(nombre)",
    empresaId ? { empresa_id: empresaId } : undefined
  );
  const { insert, loading: inserting } = useSupabaseInsert("cupones");
  const { update, loading: updating } = useSupabaseUpdate("cupones");

  const { data: productos } = useSupabaseData<any>(
    "productos",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const columns = [
    { key: "codigo", label: "Código" },
    { key: "nombre", label: "Nombre" },
    { key: "tipo", label: "Tipo" },
    { key: "valor", label: "Valor" },
    { key: "estado", label: "Estado" },
    { key: "acciones", label: "Acciones" },
  ];

  const processedData = (cupones || []).map((cupon) => {

    return {
      id: cupon.id,
      codigo: cupon.codigo,
      nombre: cupon.nombre,
      tipo:
        cupon.tipo === "descuento"
          ? "Descuento"
          : cupon.tipo === "envio"
            ? "Envío Gratis"
            : "Desconocido",
      valor:
        cupon.tipo === "envio"
          ? "Gratis"
          : cupon.valor > 100
            ? `$${cupon.valor.toLocaleString("es-CL")}`
            : `${cupon.valor}%`,
      estado: cupon.activo ? "Activo" : "Inactivo",
      acciones: (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedCupon(cupon)
              setShowAgregarModal(true)
            }}
            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
            title="Editar cupón"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteCupon(cupon)}
            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
            title="Eliminar cupón"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      cupon: cupon,
    };
  });

  // Aplicar filtros FUNCIONALES
  const filteredData = processedData.filter((item) => {


    if (
      searchTerm &&
      !item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (
      filters.codigo &&
      !item.codigo.toLowerCase().includes(filters.codigo.toLowerCase())
    )
      return false;
    if (
      filters.estado &&
      item.estado.toLowerCase() !== filters.estado.toLowerCase()
    )
      return false;
    if (filters.tipo && item.tipo.toLowerCase() !== filters.tipo.toLowerCase())
      return false;
    return true;
  });

  const filteredProductos = (productos || []).filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cleanFormData = () => {
    setFormData({
      codigo: "",
      nombre: "",
      descripcion: "",
      tipo: "descuento",
      valor: "",
      usos_maximos: "1",
      fecha_inicio: "",
      fecha_fin: "",
      searchTerm: "",
      producto_id: "",
    });
  }


  const handleDeleteCupon = async (cupon) => {
    if (confirm(`¿Estás seguro de eliminar el cupón ${cupon.codigo}?`)) {
      const success = await update(cupon.id, { activo: false });
      if (success) {
        refetch();
      }
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
  };
  const validarCodigoUnico = async (
    codigo: string,
    cuponId?: string
  ): Promise<boolean> => {
    try {
      let query = supabase
        .from("cupones")
        .select("id")
        .eq("codigo", codigo)
        .eq("empresa_id", empresaId);

      if (cuponId) {
        query = query.neq("id", cuponId);
      }

      const { data } = await query.single();
      return !data; // Retorna true si el código no existe
    } catch (error) {
      return true; // Si hay error, asumimos que no existe
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando cupones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Cupones</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setShowFilters(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          <button
            onClick={() => {
              setShowAgregarModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar cupones"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
          }}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
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
      </div>

      {/* Modal Filtros */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código
            </label>
            <input
              type="text"
              value={filters.codigo}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, codigo: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Agregar */}
      <AgregarCuponForm
        show={showAgregarModal || showEditarModal}
        onClose={() => {
          setShowAgregarModal(false);
          setShowEditarModal(false);
          setSelectedCupon(null);
        }}
        empresaId={empresaId!}
        insert={insert}
        update={update}
        validarCodigoUnico={validarCodigoUnico}
        refetch={refetch}
        selectedCupon={selectedCupon}
      />
    </div>
  );
}
