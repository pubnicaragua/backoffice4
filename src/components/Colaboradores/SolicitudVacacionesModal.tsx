import React, { useState, useEffect } from "react";
import { X, Calendar, User, FileText, Clock } from "lucide-react";

interface SolicitudVacacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitud: any;
  isEditing: boolean;
  usuariosEmpresa: any[];
  onSave: (data: any) => void;
  loading: boolean;
}

export function SolicitudVacacionesModal({
  isOpen,
  onClose,
  solicitud,
  isEditing,
  usuariosEmpresa,
  onSave,
  loading,
}: SolicitudVacacionesModalProps) {
  const [formData, setFormData] = useState({
    usuario_id: "",
    numero_solicitud: "",
    fecha_inicio: "",
    fecha_fin: "",
    dias_solicitados: 0,
    motivo: "",
    estado: "pendiente",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && solicitud) {
      // Cargar datos existentes para edición
      setFormData({
        usuario_id: solicitud.solicitud.usuario_id || "",
        numero_solicitud: solicitud.solicitud.numero_solicitud || "",
        fecha_inicio: solicitud.solicitud.fecha_inicio || "",
        fecha_fin: solicitud.solicitud.fecha_fin || "",
        dias_solicitados: solicitud.solicitud.dias_solicitados || 0,
        motivo: solicitud.solicitud.motivo || "",
        estado: solicitud.solicitud.estado || "pendiente",
      });
    } else {
      // Resetear formulario para nueva solicitud
      setFormData({
        usuario_id: "",
        numero_solicitud: generateSolicitudNumber(),
        fecha_inicio: "",
        fecha_fin: "",
        dias_solicitados: 0,
        motivo: "",
        estado: "pendiente",
      });
    }
    setErrors({});
  }, [isEditing, solicitud, isOpen]);

  // Generar número de solicitud automático
  const generateSolicitudNumber = () => {
    return Math.floor(2500 + Math.random() * 500).toString();
  };

  // Calcular días automáticamente cuando cambian las fechas
  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      const inicio = new Date(formData.fecha_inicio);
      const fin = new Date(formData.fecha_fin);
      const diffTime = Math.abs(fin.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > 0) {
        setFormData((prev) => ({ ...prev, dias_solicitados: diffDays }));
      }
    }
  }, [formData.fecha_inicio, formData.fecha_fin]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.usuario_id) {
      newErrors.usuario_id = "Debe seleccionar un usuario";
    }
    if (!formData.numero_solicitud) {
      newErrors.numero_solicitud = "Número de solicitud es requerido";
    }
    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = "Fecha de inicio es requerida";
    }
    if (!formData.fecha_fin) {
      newErrors.fecha_fin = "Fecha de fin es requerida";
    }
    if (
      formData.fecha_inicio &&
      formData.fecha_fin &&
      new Date(formData.fecha_inicio) > new Date(formData.fecha_fin)
    ) {
      newErrors.fecha_fin =
        "La fecha de fin debe ser posterior a la fecha de inicio";
    }
    if (!formData.motivo || formData.motivo.trim().length < 10) {
      newErrors.motivo = "El motivo debe tener al menos 10 caracteres";
    }
    if (formData.dias_solicitados <= 0) {
      newErrors.dias_solicitados = "Los días solicitados deben ser mayor a 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing
              ? "Editar Solicitud de Vacaciones"
              : "Nueva Solicitud de Vacaciones"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Selección de Usuario */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4" />
              <span>Usuario</span>
            </label>
            <select
              value={formData.usuario_id}
              onChange={(e) => handleInputChange("usuario_id", e.target.value)}
              disabled={isEditing}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.usuario_id ? "border-red-500" : "border-gray-300"
              } ${isEditing ? "bg-gray-100 cursor-not-allowed" : ""}`}
            >
              <option value="">Seleccionar usuario...</option>
              {usuariosEmpresa?.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombres} {usuario.apellidos}
                </option>
              ))}
            </select>
            {errors.usuario_id && (
              <p className="mt-1 text-sm text-red-600">{errors.usuario_id}</p>
            )}
          </div>

          {/* Número de Solicitud */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Número de Solicitud</span>
            </label>
            <input
              type="text"
              value={formData.numero_solicitud}
              onChange={(e) =>
                handleInputChange("numero_solicitud", e.target.value)
              }
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.numero_solicitud ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ej: 2514"
            />
            {errors.numero_solicitud && (
              <p className="mt-1 text-sm text-red-600">
                {errors.numero_solicitud}
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Fecha de Inicio</span>
              </label>
              <input
                type="date"
                value={formData.fecha_inicio}
                onChange={(e) =>
                  handleInputChange("fecha_inicio", e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fecha_inicio ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.fecha_inicio && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.fecha_inicio}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Fecha de Fin</span>
              </label>
              <input
                type="date"
                value={formData.fecha_fin}
                onChange={(e) => handleInputChange("fecha_fin", e.target.value)}
                min={
                  formData.fecha_inicio ||
                  new Date().toISOString().split("T")[0]
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fecha_fin ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.fecha_fin && (
                <p className="mt-1 text-sm text-red-600">{errors.fecha_fin}</p>
              )}
            </div>
          </div>

          {/* Días Solicitados */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4" />
              <span>Días Solicitados</span>
            </label>
            <input
              type="number"
              value={formData.dias_solicitados}
              onChange={(e) =>
                handleInputChange(
                  "dias_solicitados",
                  parseInt(e.target.value) || 0
                )
              }
              min="1"
              max="365"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.dias_solicitados ? "border-red-500" : "border-gray-300"
              }`}
              readOnly
            />
            {errors.dias_solicitados && (
              <p className="mt-1 text-sm text-red-600">
                {errors.dias_solicitados}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Los días se calculan automáticamente basado en las fechas
              seleccionadas
            </p>
          </div>

          {/* Estado (solo para edición) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => handleInputChange("estado", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="pendiente">Pendiente</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          )}

          {/* Motivo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo de la Solicitud
            </label>
            <textarea
              value={formData.motivo}
              onChange={(e) => handleInputChange("motivo", e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.motivo ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Describe el motivo de tu solicitud de vacaciones..."
            />
            {errors.motivo && (
              <p className="mt-1 text-sm text-red-600">{errors.motivo}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Mínimo 10 caracteres. Actual: {formData.motivo.length}
            </p>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Guardando..."
                : isEditing
                ? "Actualizar"
                : "Crear Solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
