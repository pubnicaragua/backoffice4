import React, { useState } from "react";
import { Modal } from "../Common/Modal";
import { AsignarTurnoModal } from "./AsignarTurnoModal";
import { useSupabaseData } from "../../hooks/useSupabaseData";
import { AsignarTareaModal } from "./AsignarTareaModal";
import { EditarPermisosModal } from "./EditarPermisosModal";

interface PerfilEmpleadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: any;
}

export const PerfilEmpleadoModal: React.FC<PerfilEmpleadoModalProps> = ({
  isOpen,
  onClose,
  selectedUser,
}) => {
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [showTareaModal, setShowTareaModal] = useState(false);
 const [showEditarPermisosModal, setShowEditarPermisosModal] = useState(false);

  // Fetch user details, permissions, and tasks for the selected user
  const { data: userDetails, loading: userLoading } = useSupabaseData<any>(
    "usuarios",
    "*", // Remove roles relationship that doesn't exist
    selectedUser?.id ? { id: selectedUser.id } : null
  );

  const {
    data: userPermissions,
    loading: permissionsLoading,
    refetch: refetchPermissions,
  } = useSupabaseData<any>(
    "permisos", // Get all available permissions
    "*",
    null // Get all permissions, not user-specific
  );

  const {
    data: userTasks,
    loading: tasksLoading,
    refetch: refetchTasks,
  } = useSupabaseData<any>(
    "asignaciones_tareas",
    "*, tareas(nombre, descripcion, tipo)",
    selectedUser?.id ? { usuario_id: selectedUser.id } : null
  );

  const empleado = userDetails[0] || selectedUser; // Use fetched details or fallback to passed prop
  const permisos = userPermissions || [];
  const tareas = userTasks || [];

  // Prevent rendering if no user is selected
  if (!selectedUser && (!userDetails || userDetails.length === 0)) {
    return null;
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
        {" "}
        {/* Title is empty as it's handled inside */}
        <div className="space-y-6">
          {/* Header del perfil */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {empleado?.nombres
                    ? empleado.nombres
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                    : "NN"}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {empleado?.nombres || "Cargando..."}{" "}
                  {empleado?.apellidos || ""}
                </h2>
                <p className="text-sm text-blue-600 font-medium">
                  Rol: {empleado?.roles?.nombre || empleado?.rol || "Empleado"}
                </p>
                <p className="text-xs text-gray-500">
                  RUT: {empleado?.rut || "Sin RUT"}
                </p>
              </div>
            </div>
            <button className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Visualizar CV
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos personales */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Datos personales
              </h3>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-medium">RUT:</span>{" "}
                  {empleado?.rut || "Sin RUT"}
                </p>
                <p>
                  <span className="font-medium">Fecha de nacimiento:</span>{" "}
                  {empleado?.fecha_nacimiento || "Sin fecha"}
                </p>
                <p>
                  <span className="font-medium">Género:</span>{" "}
                  {empleado?.genero || "No especificado"}
                </p>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Información de contacto
              </h3>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-medium">Celular:</span>{" "}
                  {empleado?.telefono || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Correo:</span>{" "}
                  {empleado?.email || "N/A"}
                </p>
                <p>
                  <span className="font-medium">Dirección:</span>{" "}
                  {empleado?.direccion || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-center space-x-4 py-4">
            <button
              onClick={() => setShowTareaModal(true)} // Pass selectedUser to modal
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tareas
            </button>
            <button
              onClick={() => setShowTurnoModal(true)} // Pass selectedUser to modal
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Turnos
            </button>
            <button
              onClick={() => setShowPermisoModal(true)} // Pass selectedUser to modal
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Permisos
            </button>
          </div>

          {/* Martes (Hoy) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Tareas Asignadas (Hoy)
              </h3>
              <button
                onClick={() => setShowTareaModal(true)} // Pass selectedUser to modal
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Agregar tarea
              </button>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto">
              {tareas.length > 0 ? (
                tareas.map((tarea, index) => (
                  <div
                    key={tarea.id || index}
                    className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">🧹</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {tarea.nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {tarea.descripcion}
                      </p>
                      <p className="text-xs text-blue-600">
                        Asignado para hoy -{" "}
                        {new Date().toLocaleDateString("es-CL")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No hay tareas asignadas para hoy.
                </div>
              )}
            </div>
          </div>

          {/* Rol actual */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Rol actual (
                {empleado?.roles?.nombre || empleado?.rol || "Empleado"})
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEditarPermisosModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Editar permisos
                </button>
                <button
                  onClick={() => setShowEditarPermisosModal(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Asignar permisos
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-48 overflow-y-auto">
              {userPermissions.length > 0 ? (
                userPermissions.map((permiso, index) => (
                  <div
                    key={index}
                    className="text-center p-2 bg-white rounded-lg border border-gray-200"
                  >
                    <p className="text-xs text-gray-600 mb-2 font-medium">
                      {permiso.nombre}
                    </p>
                    <div
                      className={`w-4 h-4 mx-auto rounded ${
                        permiso.activo
                          ? "bg-green-500"
                          : "bg-red-500"
                      } flex items-center justify-center`}
                    >
                      <span className="text-white text-xs">
                        {permiso.activo ? "✓" : "✗"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {permiso.modulo || ""}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-4">
                  No hay permisos asignados.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <AsignarTurnoModal
        isOpen={showTurnoModal}
        onClose={() => setShowTurnoModal(false)}
        selectedUser={empleado}
      />
      <AsignarTareaModal
        isOpen={showTareaModal}
        onClose={() => setShowTareaModal(false)}
        selectedUser={empleado}
        onSuccess={() => refetchTasks()}
      />
      <EditarPermisosModal
        isOpen={showEditarPermisosModal}
        onClose={() => setShowEditarPermisosModal(false)}
        selectedUser={empleado}
        availablePermissions={userPermissions}
      />
    </>
  );
};
