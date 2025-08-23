import React, { SetStateAction, useState } from "react";  
import { Modal } from "../Common/Modal";  
import { supabase, supabaseAnonKey } from "../../lib/supabase";  
import { useAuth } from "../../contexts/AuthContext";  
import { toast } from "react-toastify";  
import { useSupabaseData } from "../../hooks/useSupabaseData";  
  
interface AgregarUsuarioModalProps {  
  loading: boolean;  
  setLoading: React.Dispatch<SetStateAction<boolean>>;  
  isOpen: boolean;  
  onClose: () => void;  
  onSuccess?: () => void;  
}  
  
// ✅ Función para enviar correo de bienvenida con SendGrid  
const sendWelcomeEmail = async (email: string, nombre: string) => {  
  try {  
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {  
      method: 'POST',  
      headers: {  
        'Content-Type': 'application/json',  
        'Authorization': `Bearer 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`  
      },  
      body: JSON.stringify({  
        personalizations: [{  
          to: [{ email: email }],  
          subject: 'Bienvenido al sistema - Confirma tu cuenta'  
        }],  
        // ✅ CAMBIAR ESTA LÍNEA:  
        from: { email: 'registros@solvendo.cl', name: 'Sistema Solvendo' },  
        content: [{  
          type: 'text/html',  
          value: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">  
            <h2 style="color: #2563eb;">¡Bienvenido al sistema!</h2>  
            <p>Hola ${nombre},</p>  
            <p>Tu cuenta ha sido creada exitosamente. Recibirás un correo de confirmación para establecer tu contraseña.</p>  
            <p>Una vez que confirmes tu cuenta, podrás acceder al sistema con tu email.</p>  
            <a href="${window.location.origin}/login"  
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">  
              Ir al Login  
            </a>  
            <p style="color: #6b7280; font-size: 14px;">Si tienes problemas para acceder, contacta al administrador del sistema.</p>  
          </div>`  
        }]  
      })  
    });  
    return response.ok;  
  } catch (error) {  
    console.error('Error enviando correo de bienvenida:', error);  
    return false;  
  }  
};

export function AgregarUsuarioModal({  
  loading,  
  setLoading,  
  isOpen,  
  onClose,  
  onSuccess,  
}: AgregarUsuarioModalProps) {  
  const { empresaId } = useAuth();  
    
  // ✅ Removido 'direccion' del formData  
  const [formData, setFormData] = useState({  
    nombres: "",  
    apellidos: "",  
    rut: "",  
    email: "",  
    telefono: "", // ✅ Opcional  
    fecha_nacimiento: "",  
    sucursal_id: "",  
    rol: "empleado",  
  });  
    
  const [mensaje, setMensaje] = useState<{  
    texto: string;  
    tipo: "error" | "success" | null;  
  }>({ texto: "", tipo: null });  
  
  const { data: sucursales } = useSupabaseData("sucursales", "*", empresaId ? { empresa_id: empresaId } : undefined);  
  
  const handleSucursalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {  
    const { value } = e.target;  
    setFormData((prev) => ({  
      ...prev,  
      sucursal_id: value  
    }));  
  };  
  
  const handleChange = (field: string, value: string) => {  
    setFormData((prev) => ({ ...prev, [field]: value }));  
    if (mensaje.tipo) setMensaje({ texto: "", tipo: null });  
  };  
  
  const crearUsuario = async (datosUsuario: typeof formData) => {  
    try {  
      setLoading(true);  
      console.log('debug');  
    
      // ✅ Solo llamar a la Edge Function - ella maneja todo  
      const resp = await fetch("https://ujkdekqhoeyfjvtzdtaz.supabase.co/functions/v1/crear-colaborador", {  
        method: "POST",  
        headers: {  
          "Content-Type": "application/json",  
          "Authorization": `Bearer ${supabaseAnonKey}`,  
        },  
        body: JSON.stringify({  
          p_nombres: datosUsuario.nombres,  
          p_apellidos: datosUsuario.apellidos,  
          p_rut: datosUsuario.rut,  
          p_email: datosUsuario.email,  
          p_telefono: datosUsuario.telefono,  
          p_direccion: "",  
          p_fecha_nacimiento: datosUsuario.fecha_nacimiento || null,  
          p_password: null,  
          p_empresa_id: empresaId,  
          p_sucursal_id: datosUsuario.sucursal_id,  
          p_rol: datosUsuario.rol || "empleado",  
          p_send_confirmation: true,  
        }),  
      });  
    
      const data = await resp.json();  
      console.log("📌 Respuesta Edge Function:", data);  
    
      if (!resp.ok || !data.success) {  
        if (data.error?.includes("Ya existe un usuario con este RUT")) {  
          setMensaje({  
            texto: "Error: Ya existe un usuario con este RUT",  
            tipo: "error",  
          });  
          toast.error("Ya existe un usuario con ese RUT");  
          return;  
        }  
        throw new Error(data.error || "Error desconocido al crear usuario");  
      }  
    
      // ✅ Mensaje de éxito simplificado  
      const mensajeExito = "Usuario creado correctamente. Se han enviado los correos de confirmación.";  
      toast.success(mensajeExito);  
      setMensaje({ texto: mensajeExito, tipo: "success" });    
      // ✅ Solo vaciar formulario en caso de éxito  
      setFormData({  
        nombres: "",  
        apellidos: "",  
        rut: "",  
        email: "",  
        telefono: "",  
        fecha_nacimiento: "",  
        sucursal_id: "",  
        rol: "empleado",  
      });  
  
      if (onSuccess) onSuccess();  
  
      // Cerrar modal después de un breve delay  
      setTimeout(() => {  
        onClose();  
      }, 2000);  
  
    } catch (error: any) {  
      console.error("Error creando usuario:", error);  
      toast.error("Error al crear el usuario");  
      setMensaje({  
        texto: error.message || "Error al crear el usuario. Por favor intenta nuevamente.",  
        tipo: "error",  
      });  
      // ✅ NO vaciar formulario en caso de error  
    } finally {  
      setLoading(false);  
    }  
  };  
  
  const handleSubmit = async (e: React.FormEvent) => {  
    e.preventDefault();  
    setMensaje({ texto: "", tipo: null });  
  
    if (!formData.nombres || !formData.rut || !formData.email || !formData.sucursal_id) {  
      setMensaje({  
        texto: "Por favor, completa los campos obligatorios: Nombres, RUT, Email y Sucursal.",  
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
  
        {/* ✅ Sucursal */}  
        <div>  
          <label  
            htmlFor="sucursal_id"  
            className="block text-sm font-medium text-gray-700 mb-1"  
          >  
            Sucursal <span className="text-red-600">*</span>  
          </label>  
          <select  
            id="sucursal_id"  
            value={formData.sucursal_id || ""}  
            onChange={handleSucursalChange}  
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"  
            required  
          >  
            <option value="" disabled>-- Seleccionar sucursal --</option>  
            {sucursales?.map((sucursal) => (  
              <option key={sucursal.id} value={sucursal.id}>  
                {sucursal.nombre}  
              </option>  
            ))}  
          </select>  
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
          <p className="text-xs text-gray-500 mt-1">  
            Se enviará un correo de confirmación para establecer la contraseña  
          </p>  
        </div>  
  
        {/* ✅ Teléfono (opcional) */}  
        <div>  
          <label  
            htmlFor="telefono-input"  
            className="block text-sm font-medium text-gray-700 mb-1"  
          >  
            Teléfono (opcional)  
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
          />  </div>  
  
          {/* ✅ Rol mejorado con descripciones */}  
          <div>  
            <label  
              htmlFor="rol-select"  
              className="block text-sm font-medium text-gray-700 mb-1"  
            >  
              Rol del usuario <span className="text-red-600">*</span>  
            </label>  
            <select  
              id="rol-select"  
              value={formData.rol}  
              onChange={(e) => handleChange("rol", e.target.value)}  
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"  
            >  
              <option value="empleado">Empleado - Ventas básicas</option>  
              <option value="supervisor">Supervisor - Ventas, Inventario, Reportes</option>  
              <option value="administrador">Administrador - Todos los permisos</option>  
            </select>  
          </div>  
    
          {/* Mensaje de estado */}  
          {mensaje.tipo && (  
            <div  
              className={`p-3 rounded-lg ${  
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