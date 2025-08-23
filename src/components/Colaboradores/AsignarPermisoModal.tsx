import React, { useEffect, useState } from "react";
import { Modal } from "../Common/Modal";
import {
  useSupabaseInsert,
  useSupabaseData,
} from "../../hooks/useSupabaseData";
import { supabase } from "../../lib/supabase";

interface AsignarPermisoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: any;
  availablePermissions?: any[];
  onSuccess?: () => void;
}

export function AsignarPermisoModal({
  isOpen,
  onClose,
  selectedUser,
  onSuccess,
}: AsignarPermisoModalProps) {
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [permissionChanges, setPermissionChanges] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!isOpen) return;

      const { data, error } = await supabase.from("permisos").select("*");

      if (error) {
        console.error("Error cargando permisos:", error);
        setAvailablePermissions([]);
      } else {
        setAvailablePermissions(data || []);
      }
    };

    fetchPermissions();
  }, [isOpen]);

  const { insert, loading } = useSupabaseInsert("usuario_permisos");

  const { data: currentUserPermissions } = useSupabaseData<any>(
    "usuario_permisos",
    "*",
    selectedUser?.id ? { usuario_id: selectedUser.id } : null
  );

  // Crear lista de todos los permisos con su estado actual
  const allPermissionsWithStatus = availablePermissions.map((permission) => {
    const userPermission = currentUserPermissions?.find(
      (userPerm) => userPerm.permiso_id === permission.id
    );
    return {
      ...permission,
      isAssigned: !!userPermission,
      otorgado: userPermission?.otorgado || false,
      userPermissionId: userPermission?.id,
    };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser?.id) {
      alert("No se pudo identificar el usuario");
      return;
    }

    const operations = [];

    // Procesar cada cambio
    for (const [permissionId, newState] of Object.entries(permissionChanges)) {
      const permission = allPermissionsWithStatus.find(
        (p) => p.id === permissionId
      );
      if (!permission) continue;

      if (newState && !permission.isAssigned) {
        // Insertar nuevo permiso
        operations.push(
          insert({
            usuario_id: selectedUser.id,
            permiso_id: permissionId,
            otorgado: true,
          })
        );
      } else if (!newState && permission.isAssigned) {
        // Eliminar permiso existente
        operations.push(
          supabase
            .from("usuario_permisos")
            .delete()
            .eq("id", permission.userPermissionId)
        );
      } else if (newState !== permission.otorgado && permission.isAssigned) {
        // Actualizar estado del permiso
        operations.push(
          supabase
            .from("usuario_permisos")
            .update({ otorgado: newState })
            .eq("id", permission.userPermissionId)
        );
      }
    }

    if (operations.length === 0) {
      alert("No hay cambios para guardar");
      return;
    }

    console.log("💾 PERMISOS: Aplicando cambios", {
      usuario: selectedUser.nombres,
      cambios: Object.keys(permissionChanges).length,
    });

    try {
      const results = await Promise.all(operations);
      console.log("✅ PERMISOS: Cambios aplicados exitosamente");
      setPermissionChanges({});
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("❌ PERMISOS: Error aplicando cambios:", error);
      alert("Error al aplicar los cambios");
    }
  };

  // Contar cambios pendientes
  const pendingChanges = Object.keys(permissionChanges).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gestionar Permisos"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Gestionar permisos para:{" "}
          <span className="font-medium text-gray-900">
            {selectedUser?.nombres || "Usuario"}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Todos los Permisos
            </label>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-300 rounded-md p-3">
              {allPermissionsWithStatus.length > 0 ? (
                allPermissionsWithStatus.map((permission) => {
                  const currentState =
                    permissionChanges[permission.id] !== undefined
                      ? permissionChanges[permission.id]
                      : permission.otorgado;

                  const hasChanged =
                    permissionChanges[permission.id] !== undefined;

                  return (
                    <label
                      key={permission.id}
                      className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                        hasChanged
                          ? "bg-yellow-50 border border-yellow-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={currentState}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          if (newValue === permission.otorgado) {
                            // Si vuelve al estado original, remover del tracking de cambios
                            setPermissionChanges((prev) => {
                              const newChanges = { ...prev };
                              delete newChanges[permission.id];
                              return newChanges;
                            });
                          } else {
                            // Trackear el cambio
                            setPermissionChanges((prev) => ({
                              ...prev,
                              [permission.id]: newValue,
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {permission.nombre}
                          </span>
                          {permission.modulo && (
                            <span className="text-sm text-gray-500">
                              - {permission.modulo}
                            </span>
                          )}
                          {permission.isAssigned && !hasChanged && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Asignado
                            </span>
                          )}
                          {hasChanged && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              Modificado
                            </span>
                          )}
                        </div>
                        {permission.descripcion && (
                          <p className="text-xs text-gray-600 mt-1">
                            {permission.descripcion}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No hay permisos disponibles
                </p>
              )}
            </div>

            {pendingChanges > 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-700">
                  {pendingChanges} cambio{pendingChanges !== 1 ? "s" : ""}{" "}
                  pendiente{pendingChanges !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setPermissionChanges({});
                onClose();
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || pendingChanges === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading
                ? "Guardando..."
                : `Guardar Cambios${
                    pendingChanges > 0 ? ` (${pendingChanges})` : ""
                  }`}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
