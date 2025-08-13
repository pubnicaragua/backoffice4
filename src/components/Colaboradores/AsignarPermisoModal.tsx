import React, { useState } from "react";
import { Modal } from "../Common/Modal";
import {
  useSupabaseInsert,
  useSupabaseData,
} from "../../hooks/useSupabaseData";

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
  availablePermissions = [],
  onSuccess,
}: AsignarPermisoModalProps) {
  const [selectedPermissionId, setSelectedPermissionId] = useState("");

  const { insert, loading } = useSupabaseInsert("usuario_permisos");

  const { data: currentUserPermissions } = useSupabaseData<any>(
    "usuario_permisos",
    "*",
    selectedUser?.id ? { usuario_id: selectedUser.id } : null
  );

  const unassignedPermissions = availablePermissions.filter(
    (permission) =>
      !currentUserPermissions?.some(
        (userPerm) => userPerm.permiso_id === permission.id
      )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser?.id) {
      alert("No se pudo identificar el usuario");
      return;
    }

    if (!selectedPermissionId) {
      alert("Debe seleccionar un permiso");
      return;
    }

    console.log("💾 PERMISOS: Asignando permiso", {
      usuario: selectedUser.nombres,
      permiso_id: selectedPermissionId,
    });

    const success = await insert({
      usuario_id: selectedUser.id,
      permiso_id: selectedPermissionId,
      otorgado: true,
    });

    if (success) {
      console.log("✅ PERMISOS: Permiso asignado exitosamente");
      setSelectedPermissionId("");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } else {
      console.error("❌ PERMISOS: Error asignando permiso");
      alert("Error al asignar el permiso");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar Permiso" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Asignar permiso a:{" "}
          <span className="font-medium text-gray-900">
            {selectedUser?.nombres || "Usuario"}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permiso
            </label>
            <select
              value={selectedPermissionId}
              onChange={(e) => setSelectedPermissionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar permiso...</option>
              {unassignedPermissions.map((permission) => (
                <option key={permission.id} value={permission.id}>
                  {permission.nombre}
                  {permission.modulo && ` - ${permission.modulo}`}
                </option>
              ))}
            </select>

            {selectedPermissionId && (
              <div className="mt-2 p-2 bg-gray-50 rounded-md">
                {(() => {
                  const selectedPermission = availablePermissions.find(
                    (p) => p.id === selectedPermissionId
                  );
                  return (
                    selectedPermission?.descripcion && (
                      <p className="text-sm text-gray-600">
                        {selectedPermission.descripcion}
                      </p>
                    )
                  );
                })()}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedPermissionId}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Asignando..." : "Asignar Permiso"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
