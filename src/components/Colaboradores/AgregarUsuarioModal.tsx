import React, { useState } from "react";
import { Modal } from "../Common/Modal";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

interface AgregarUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AgregarUsuarioModal({
  isOpen,
  onClose,
  onSuccess,
}: AgregarUsuarioModalProps) {
  const { empresaId } = useAuth();
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    rut: "",
    email: "",
    telefono: "",
    direccion: "",
    fecha_nacimiento: "",
    pass: "",
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{
    texto: string;
    tipo: "error" | "success" | null;
  }>({ texto: "", tipo: null });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (mensaje.tipo) setMensaje({ texto: "", tipo: null });
  };

  const crearUsuario = async (datosUsuario: any) => {
    try {
      setLoading(true);

      // Validar RUT único
      const validarRutUnico = async (rut: string) => {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id")
          .eq("rut", rut)
          .single();
        return !data;
      };

      const rutExiste = await validarRutUnico(datosUsuario.rut);
      if (!rutExiste) {
        setMensaje({
          texto: "Error: Ya existe un usuario con este RUT",
          tipo: "error",
        });
        return;
      }

      // Crear el usuario en auth - el trigger se encarga de crear en usuarios
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: datosUsuario.email,
        password: datosUsuario.pass,
        options: {
          data: {
            nombres: datosUsuario.nombres,
            apellidos: datosUsuario.apellidos,
            rut: datosUsuario.rut,
            telefono: datosUsuario.telefono,
            direccion: datosUsuario.direccion,
          },
        },
      });

      if (authError) throw authError;

      // Esperar para que el trigger procese
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Buscar el usuario creado por el trigger
      const { data: usuarioCreado, error: buscarError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", datosUsuario.email)
        .single();

      if (buscarError) {
        console.error("Error buscando usuario creado:", buscarError);
        throw new Error("No se pudo encontrar el usuario creado");
      }

      if (usuarioCreado && empresaId) {
        // Crear relación usuario-empresa
        const { error: empresaError } = await supabase
          .from("usuario_empresa")
          .insert({
            usuario_id: usuarioCreado.id,
            empresa_id: empresaId,
            activo: true,
          });

        if (empresaError) {
          console.error(
            "Error creando relación usuario-empresa:",
            empresaError
          );
          throw empresaError;
        }
      }

      setMensaje({ texto: "Usuario creado correctamente.", tipo: "success" });

      // Reset form
      setFormData({
        nombres: "",
        apellidos: "",
        rut: "",
        email: "",
        telefono: "",
        direccion: "",
        fecha_nacimiento: "",
        pass: "",
      });

      // Solo llamar onSuccess para refrescar la lista de usuarios
      onSuccess?.();

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      setMensaje({
        texto:
          error.message ||
          "Error al crear el usuario. Por favor intenta nuevamente.",
        tipo: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje({ texto: "", tipo: null });

    if (!formData.nombres || !formData.rut || !formData.email) {
      setMensaje({
        texto:
          "Por favor, completa los campos obligatorios: Nombres, RUT y Email.",
        tipo: "error",
      });
      return;
    }
    if (formData.pass.length < 6) {
      setMensaje({
        texto: "La contraseña debe tener al menos 6 caracteres.",
        tipo: "error",
      });
      return;
    }

    await crearUsuario(formData);
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

        {/* Contraseña */}
        <div>
          <label
            htmlFor="pass-input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Contraseña <span className="text-red-600">*</span>
          </label>
          <input
            id="pass-input"
            type="password"
            value={formData.pass}
            onChange={(e) => handleChange("pass", e.target.value)}
            placeholder="********"
            minLength={6}
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
            max={new Date().toISOString().split("T")[0]}
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

        {/* Mensaje de estado */}
        {mensaje.tipo && (
          <div
            className={`p-2 rounded ${
              mensaje.tipo === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
            role="alert"
          >
            {mensaje.texto}
          </div>
        )}

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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
