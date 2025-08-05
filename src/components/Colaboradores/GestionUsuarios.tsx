import React, { useState, useEffect } from "react";
import { Search, Plus, Mail, Clock, Filter } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AgregarUsuarioModal } from "./AgregarUsuarioModal";
import { AsignarTiempoModal } from "./AsignarTiempoModal";
import { EnviarComunicadoModal } from "./EnviarComunicadoModal";
import { PerfilEmpleadoModal } from "./PerfilEmpleadoModal";
import { FilterModal } from "../Common/FilterModal";
import { useAuth } from "../../contexts/AuthContext";

export function GestionUsuarios() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showTiempoModal, setShowTiempoModal] = useState(false);
  const [showComunicadoModal, setShowComunicadoModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { empresaId } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = async () => {
    if (!empresaId) return;

    setLoading(true);

    // Paso 1: Obtener IDs de usuarios de la empresa
    const { data: usuarioEmpresaData, error: ueError } = await supabase
      .from("usuario_empresa")
      .select("usuario_id")
      .eq("empresa_id", empresaId)
      .eq("activo", true);

    if (ueError || !usuarioEmpresaData?.length) {
      setUsuarios([]);
      setLoading(false);
      return;
    }

    // Paso 2: Obtener datos completos de usuarios
    const userIds = usuarioEmpresaData.map((item) => item.usuario_id);
    const { data: usuariosData, error: usersError } = await supabase
      .from("usuarios")
      .select("*")
      .in("id", userIds);

    if (!usersError) {
      setUsuarios(usuariosData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, [empresaId]);

  // Defino las columnas que mostraré en la tabla
  const columns = [
    { key: "nombreCompleto", label: "Nombre completo" },
    { key: "email", label: "Email" },
    { key: "rut", label: "RUT" },
    { key: "rol", label: "Rol" },
  ];

  // Proceso los datos para construir las filas que usaré en la tabla
  const processedData = usuarios.map((usuario) => ({
    id: usuario.id,
    nombreCompleto:
      `${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim() ||
      "Sin nombre",
    email: usuario.email || "Sin email",
    rut: usuario.rut || "Sin RUT",
    rol: usuario.rol || "Empleado",
    usuario,
  }));

  // Aplico filtro simple por nombre completo o rut
  const filteredData = processedData.filter(
    (item) =>
      searchTerm === "" ||
      item.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rut.includes(searchTerm)
  );

  const handleViewPerfil = (userData) => {
    setSelectedUser(userData);
    setShowPerfilModal(true);
  };

  if (loading) {
    return <div className="text-center py-4">Cargando usuarios...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-900">
          Gestión de usuarios
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowComunicadoModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Mail className="w-4 h-4" />
            <span>Enviar un comunicado general</span>
          </button>
          <button
            onClick={() => setShowTiempoModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Clock className="w-4 h-4" />
            <span>Asignar tiempo de colación</span>
          </button>
          <button
            onClick={() => setShowFilters(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            placeholder="Buscar por nombre o RUT"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-4 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowAgregarModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar usuario</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewPerfil(row.usuario)}
              >
                <td className="px-4 py-3 text-sm text-gray-900">
                  {row.nombreCompleto}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.email}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.rut}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.rol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AgregarUsuarioModal
        isOpen={showAgregarModal}
        onClose={() => {
          setShowAgregarModal(false);
        }}
      />

      <AsignarTiempoModal
        isOpen={showTiempoModal}
        onClose={() => setShowTiempoModal(false)}
      />

      <EnviarComunicadoModal
        isOpen={showComunicadoModal}
        onClose={() => setShowComunicadoModal(false)}
      />

      <PerfilEmpleadoModal
        isOpen={showPerfilModal}
        onClose={() => setShowPerfilModal(false)}
        selectedUser={selectedUser}
      />

      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
      >
        {/* Aquí podrías conservar o modificar los filtros según necesidad */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas las sucursales</option>
              <option value="n1">N°1</option>
              <option value="n2">N°2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hora
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar hora</option>
              <option value="morning">Mañana</option>
              <option value="afternoon">Tarde</option>
            </select>
          </div>
        </div>
      </FilterModal>
    </div>
  );
}
