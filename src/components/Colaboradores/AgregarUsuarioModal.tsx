import React, { useState } from "react";
import { Modal } from "../Common/Modal";
import { useSupabaseInsert } from "../../hooks/useSupabaseData";

interface AgregarUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgregarUsuarioModal({
  isOpen,
  onClose,
}: AgregarUsuarioModalProps) {
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    rol: "empleado",
    fecha_nacimiento: "", // nuevo campo para la fecha de nacimiento
  });

  const { insert, loading } = useSupabaseInsert("usuarios");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación mínima opcional
    if (!formData.nombres || !formData.rut || !formData.email) {
      alert(
        "Por favor, completa los campos obligatorios: Nombres, RUT y Email."
      );
      return;
    }

    const success = await insert({
      nombres: formData.nombres.trim(),
      apellidos: formData.apellidos.trim() || null,
      rut: formData.rut.trim(),
      email: formData.email.trim(),
      telefono: formData.telefono.trim() || null,
      direccion: formData.direccion.trim() || null,
      rol: formData.rol,
      fecha_nacimiento: formData.fecha_nacimiento || null, // envío opcional de la fecha
      activo: true,
    });

    if (success) {
      console.log("✅ Usuario creado exitosamente");
      onClose();
      setFormData({
        nombres: "",
        apellidos: "",
        rut: "",
        email: "",
        telefono: "",
        direccion: "",
        rol: "empleado",
        fecha_nacimiento: "",
      });
    } else {
      alert("Error al crear el usuario. Por favor intenta nuevamente.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar usuario" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombres */}
        <div>
          <label
            htmlFor="nombres-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombres <span className="text-red-600">*</span>
          </label>
          <input
            id="nombres-input"
            type="text"
            value={formData.nombres}
            onChange={(e) => handleChange("nombres", e.target.value)}
            placeholder="Nombre del empleado"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Apellidos */}
        <div>
          <label
            htmlFor="apellidos-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Apellidos <span className="text-red-600">*</span>
          </label>
          <input
            id="apellidos-input"
            type="text"
            value={formData.apellidos}
            onChange={(e) => handleChange("apellidos", e.target.value)}
            placeholder="Apellidos del empleado"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* RUT */}
        <div>
          <label
            htmlFor="rut-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            RUT <span className="text-red-600">*</span>
          </label>
          <input
            id="rut-input"
            type="text"
            value={formData.rut}
            onChange={(e) => handleChange("rut", e.target.value)}
            placeholder="12.345.678-9"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email <span className="text-red-600">*</span>
          </label>
          <input
            id="email-input"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="correo@empresa.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Teléfono */}
        <div>
          <label
            htmlFor="telefono-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Teléfono
          </label>
          <input
            id="telefono-input"
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleChange("telefono", e.target.value)}
            placeholder="+56912345678"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dirección */}
        <div>
          <label
            htmlFor="direccion-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Dirección
          </label>
          <input
            id="direccion-input"
            type="text"
            value={formData.direccion}
            onChange={(e) => handleChange("direccion", e.target.value)}
            placeholder="Dirección del empleado"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Fecha de nacimiento */}
        <div>
          <label
            htmlFor="fecha-nacimiento-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Fecha de nacimiento (opcional)
          </label>
          <input
            id="fecha-nacimiento-input"
            type="date"
            value={formData.fecha_nacimiento}
            onChange={(e) => handleChange("fecha_nacimiento", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            max={new Date().toISOString().split("T")[0]} // fecha máxima hoy
          />
        </div>

        {/* Rol */}
        <div>
          <label
            htmlFor="rol-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Rol del usuario
          </label>
          <select
            id="rol-select"
            value={formData.rol}
            onChange={(e) => handleChange("rol", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="empleado">Empleado</option>
            <option value="supervisor">Supervisor</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
