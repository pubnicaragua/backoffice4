import React, { useState } from "react";
import { Modal } from "../Common/Modal";
import {
  useSupabaseInsert,
  useSupabaseData,
} from "../../hooks/useSupabaseData";

interface AsignarTurnoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: any; // User to assign turn to
  onSuccess?: () => void; // Callback on successful assignment
}

export function AsignarTurnoModal({
  isOpen,
  onClose,
  selectedUser,
}: AsignarTurnoModalProps) {
  const [formData, setFormData] = useState({
    sucursal: "N°1",
    fecha_turno: new Date().toISOString().split("T")[0],
    hora_ingreso: "10:00 AM",
    hora_salida: "18:00 PM",
  });

  const { insert, loading } = useSupabaseInsert("turnos"); // For assigning turns
  const { data: sucursales } = useSupabaseData<any>("sucursales", "*"); // For available sucursales

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !selectedUser?.id ||
      !formData.fecha_turno ||
      !formData.hora_ingreso ||
      !formData.hora_salida
    )
      return;

    const sucursalId =
      sucursales.find((s) => s.nombre === formData.sucursal)?.id ||
      "00000000-0000-0000-0000-000000000001";

    const success = await insert({
      empresa_id: "00000000-0000-0000-0000-000000000001",
      sucursal_id: sucursalId,
      usuario_id: selectedUser.id,
      fecha: formData.fecha_turno, // Use selected date
      hora_ingreso: formData.hora_ingreso.replace(" AM", "").replace(" PM", ""), // Clean format
      hora_salida: formData.hora_salida.replace(" AM", "").replace(" PM", ""), // Clean format
    });

    if (success) {
      onClose();
    }
    if (onSuccess) onSuccess();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asignar turno" size="sm">
      <p className="text-sm text-gray-600 mb-4">
        Asignar turno a:{" "}
        <span className="font-medium text-gray-900">
          {selectedUser?.nombres || "Usuario Seleccionado"}
        </span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sucursal (para el turno)
          </label>
          <select
            value={formData.sucursal}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, sucursal: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="N°1">N°1</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del turno
          </label>
          <input
            type="date"
            value={formData.fecha_turno}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, fecha_turno: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora de ingreso
          </label>
          <input
            type="time"
            value={formData.hora_ingreso}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, hora_ingreso: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora de salida
          </label>
          <input
            type="time"
            value={formData.hora_salida}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, hora_salida: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Asignando..." : "Confirmar turno"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
