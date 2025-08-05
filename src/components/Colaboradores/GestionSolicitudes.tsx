import React, { useState, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import {
  useSupabaseData,
  useSupabaseInsert,
  useSupabaseUpdate,
} from "../../hooks/useSupabaseData";
import { SolicitudVacacionesModal } from "./SolicitudVacacionesModal";
import { useAuth } from "../../contexts/AuthContext";

export function GestionSolicitudes() {
  const { empresaId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSolicitudModal, setShowSolicitudModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Obtener todas las solicitudes
  const {
    data: todasSolicitudes,
    loading,
    refetch,
  } = useSupabaseData<any>(
    "solicitudes_vacaciones",
    "*, usuarios(id, nombres, apellidos)"
  );

  // Obtener relaciones usuario-empresa
  const { data: usuarioEmpresaRelaciones } = useSupabaseData<any>(
    "usuario_empresa",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  // Obtener usuarios de la empresa por separado
  const { data: todosUsuarios } = useSupabaseData<any>(
    "usuarios",
    "id, nombres, apellidos"
  );

  // Filtrar solicitudes por usuarios de la empresa
  const solicitudes = useMemo(() => {
    if (!todasSolicitudes || !usuarioEmpresaRelaciones) return [];

    const usuarioIds = usuarioEmpresaRelaciones.map((ue) => ue.usuario_id);
    return todasSolicitudes.filter((solicitud) =>
      usuarioIds.includes(solicitud.usuario_id)
    );
  }, [todasSolicitudes, usuarioEmpresaRelaciones]);

  // Crear lista de usuarios de la empresa para el modal
  const usuariosEmpresa = useMemo(() => {
    if (!usuarioEmpresaRelaciones || !todosUsuarios) return [];

    const usuarioIds = usuarioEmpresaRelaciones.map((ue) => ue.usuario_id);
    return todosUsuarios.filter((usuario) => usuarioIds.includes(usuario.id));
  }, [usuarioEmpresaRelaciones, todosUsuarios]);

  const { insert, loading: inserting } = useSupabaseInsert(
    "solicitudes_vacaciones"
  );
  const { update, loading: updating } = useSupabaseUpdate(
    "solicitudes_vacaciones"
  );

  // Validación de empresa
  if (!empresaId) {
    return (
      <div className="text-center py-4">
        Error: No se pudo determinar la empresa.
      </div>
    );
  }

  const columns = [
    { key: "nombres", label: "Nombres" },
    { key: "tipo", label: "Tipo" },
    { key: "numero_solicitud", label: "N° de solicitud" },
    { key: "fecha", label: "Fecha" },
    { key: "estado", label: "Estado" },
  ];

  const processedData = (solicitudes || []).map((solicitud) => ({
    id: solicitud.id,
    nombres: `${solicitud.usuarios?.nombres || ""} ${
      solicitud.usuarios?.apellidos || ""
    }`.trim(),
    tipo: "Vacaciones",
    numero_solicitud: solicitud.numero_solicitud,
    fecha: new Date(solicitud.created_at).toLocaleDateString("es-CL"),
    estado:
      solicitud.estado === "pendiente"
        ? "Pendiente"
        : solicitud.estado === "aprobado"
        ? "Aprobado"
        : "Rechazado",
    solicitud: solicitud,
  }));

  const filteredData = processedData.filter(
    (item) =>
      searchTerm === "" ||
      item.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numero_solicitud.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewSolicitud = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setIsEditing(true);
    setShowSolicitudModal(true);
  };

  const handleCreateSolicitud = () => {
    setSelectedSolicitud(null);
    setIsEditing(false);
    setShowSolicitudModal(true);
  };

  const handleSaveSolicitud = async (solicitudData) => {
    try {
      if (isEditing && selectedSolicitud) {
        // Editar solicitud existente
        await update(selectedSolicitud.solicitud.id, {
          numero_solicitud: solicitudData.numero_solicitud,
          fecha_inicio: solicitudData.fecha_inicio,
          fecha_fin: solicitudData.fecha_fin,
          dias_solicitados: solicitudData.dias_solicitados,
          motivo: solicitudData.motivo,
          estado: solicitudData.estado,
        });
      } else {
        // Crear nueva solicitud
        await insert({
          usuario_id: solicitudData.usuario_id,
          numero_solicitud: solicitudData.numero_solicitud,
          fecha_inicio: solicitudData.fecha_inicio,
          fecha_fin: solicitudData.fecha_fin,
          dias_solicitados: solicitudData.dias_solicitados,
          motivo: solicitudData.motivo,
          estado: "pendiente",
        });
      }

      refetch();
      setShowSolicitudModal(false);
    } catch (error) {
      console.error("Error guardando solicitud:", error);
      alert("Error al guardar la solicitud");
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando solicitudes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Gestión de solicitudes
        </h2>
        <button
          onClick={handleCreateSolicitud}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Solicitud</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar por nombre, tipo o número de solicitud..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
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
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewSolicitud(row)}
              >
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    <span className="text-gray-900">{row.nombres}</span>
                  </div>
                </td>
                {columns.slice(1).map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 text-sm text-gray-900"
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SolicitudVacacionesModal
        isOpen={showSolicitudModal}
        onClose={() => setShowSolicitudModal(false)}
        solicitud={selectedSolicitud}
        isEditing={isEditing}
        usuariosEmpresa={usuariosEmpresa}
        onSave={handleSaveSolicitud}
        loading={inserting || updating}
      />
    </div>
  );
}
