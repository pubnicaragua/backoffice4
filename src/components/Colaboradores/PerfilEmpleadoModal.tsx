import React, { useState } from "react";  
import { Modal } from "../Common/Modal";  
import { AsignarTurnoModal } from "./AsignarTurnoModal";  
import { useSupabaseData } from "../../hooks/useSupabaseData";  
import { AsignarTareaModal } from "./AsignarTareaModal";  
import { AsignarPermisoModal } from "./AsignarPermisoModal";  
import { useAuth } from "../../contexts/AuthContext";  
import {   
  User,   
  Phone,   
  Mail,   
  Calendar,   
  MapPin,   
  FileText,   
  Clock,   
  Shield,   
  CheckCircle,   
  XCircle,   
  Plus,  
  Edit3,  
  Building2,  
  UserCheck,  
  ClipboardList,  
  Settings  
} from "lucide-react";  
  
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
  const [showPermisoModal, setShowPermisoModal] = useState(false);  
  const { empresaId } = useAuth();  
  
  // ✅ Obtener detalles del usuario con mejor manejo de errores  
  const { data: userDetails, loading: userLoading, error: userError } = useSupabaseData<any>(  
    "usuarios",  
    "*",  
    selectedUser?.id ? { id: selectedUser.id } : null  
  );  
  
  // ✅ Obtener sucursal del usuario  
  const { data: usuarioEmpresa } = useSupabaseData<any>(  
    "usuario_empresa",  
    "*, sucursales(nombre)",  
    selectedUser?.id ? { usuario_id: selectedUser.id, empresa_id: empresaId } : null  
  );  
  
  // ✅ Permisos del usuario  
  const {  
    data: userPermissions,  
    loading: permissionsLoading,  
    refetch: refetchPermissions,  
  } = useSupabaseData<any>(  
    "usuario_permisos",  
    "*, permisos(nombre, modulo)",  
    selectedUser?.id ? { usuario_id: selectedUser.id } : null  
  );  
  
  // ✅ Todos los permisos disponibles  
  const { data: allPermissions, loading: allPermissionsLoading } =  
    useSupabaseData<any>("permisos", "*", null);  
  
  // ✅ Tareas asignadas  
  const {  
    data: userTasks,  
    loading: tasksLoading,  
    refetch: refetchTasks,  
  } = useSupabaseData<any>(  
    "asignaciones_tareas",  
    "*, tareas(nombre, descripcion, tipo)",  
    selectedUser?.id ? { usuario_id: selectedUser.id } : null  
  );  
  
  const empleado = userDetails?.[0] || selectedUser;  
  const permisos = userPermissions || [];  
  const tareas = userTasks || [];  
  const sucursalInfo = usuarioEmpresa?.[0]?.sucursales;  
  
  // ✅ Función para obtener resumen de permisos según rol  
  const getPermisosResumen = (rol: string) => {  
    switch (rol) {  
      case "administrador":  
        return "Todos los permisos del sistema";  
      case "supervisor":  
        return "Ventas, Inventario, Reportes";  
      case "empleado":  
        return "Ventas básicas";  
      default:  
        return "Sin permisos asignados";  
    }  
  };  
  
  // ✅ Función para obtener iniciales del nombre  
  const getInitials = (nombres?: string, apellidos?: string) => {  
    if (!nombres) return "NN";  
    const firstInitial = nombres.charAt(0).toUpperCase();  
    const lastInitial = apellidos ? apellidos.charAt(0).toUpperCase() : "";  
    return firstInitial + lastInitial;  
  };  
  
  // ✅ Función para obtener color del rol  
  const getRolColor = (rol: string) => {  
    switch (rol) {  
      case "administrador":  
        return "bg-red-100 text-red-800";  
      case "supervisor":  
        return "bg-yellow-100 text-yellow-800";  
      case "empleado":  
        return "bg-green-100 text-green-800";  
      default:  
        return "bg-gray-100 text-gray-800";  
    }  
  };  
  
  if (!selectedUser && (!userDetails || userDetails.length === 0)) {  
    return null;  
  }  
  
  if (userError) {  
    return (  
      <Modal isOpen={isOpen} onClose={onClose} title="Error" size="md">  
        <div className="text-center py-8">  
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />  
          <p className="text-sm text-gray-600">  
            No se pudieron cargar los datos del empleado. Intenta nuevamente.  
          </p>  
        </div>  
      </Modal>  
    );  
  }  
  
  return (  
    <>  
      <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">  
        <div className="space-y-6">  
          {/* ✅ Header profesional con información de sucursal */}  
          <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">  
            <div className="flex items-center space-x-4">  
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">  
                <span className="text-white font-bold text-xl">  
                  {getInitials(empleado?.nombres, empleado?.apellidos)}  
                </span>  
              </div>  
              <div>  
                <h2 className="text-xl font-bold text-gray-900">  
                  {empleado?.nombres || "Cargando..."} {empleado?.apellidos || ""}  
                </h2>  
                <div className="flex items-center space-x-4 mt-2">  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRolColor(empleado?.rol)}`}>  
                    <UserCheck className="w-3 h-3 mr-1" />  
                    {empleado?.rol || "Empleado"}  
                  </span>  
                  {sucursalInfo && (  
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">  
                      <Building2 className="w-3 h-3 mr-1" />  
                      {sucursalInfo.nombre}  
                    </span>  
                  )}  
                </div>  
                <p className="text-xs text-gray-500 mt-1 flex items-center">  
                  <User className="w-3 h-3 mr-1" />  
                  RUT: {empleado?.rut || "Sin RUT"}  
                </p>  
              </div>  
            </div>  
            <button className="flex items-center space-x-2 px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">  
              <FileText className="w-4 h-4" />  
              <span>Visualizar CV</span>  
            </button>  
          </div>  
  
          {/* ✅ Grid de información personal mejorado (sin dirección) */}  
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">  
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">  
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">  
                <User className="w-5 h-5 text-blue-500 mr-3" />  
                Datos personales  
              </h3>  
              <div className="space-y-4 text-sm">  
                <div className="flex justify-between items-center">  
                  <span className="font-medium text-gray-600 flex items-center">  
                    <User className="w-4 h-4 mr-2" />  
                    RUT:  
                  </span>  
                  <span className="text-gray-900">{empleado?.rut || "Sin RUT"}</span>  
                </div>  
                <div className="flex justify-between items-center">  
                  <span className="font-medium text-gray-600 flex items-center">  
                    <Calendar className="w-4 h-4 mr-2" />  
                    Fecha de nacimiento:  
                  </span>  
                  <span className="text-gray-900">  
                    {empleado?.fecha_nacimiento  
                      ? new Date(empleado.fecha_nacimiento).toLocaleDateString('es-CL')  
                      : "Sin fecha"  
                    }  
                  </span>  
                </div>  
              </div>  
            </div>  
  
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">  
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">  
                <Mail className="w-5 h-5 text-green-500 mr-3" />  
                Información de contacto  
              </h3>  
              <div className="space-y-4 text-sm">  
                <div className="flex justify-between items-center">  
                  <span className="font-medium text-gray-600 flex items-center">  
                    <Phone className="w-4 h-4 mr-2" />  
                    Celular:  
                  </span>  
                  <span className="text-gray-900">{empleado?.telefono || "N/A"}</span>  
                </div>  
                <div className="flex justify-between items-center">  
                  <span className="font-medium text-gray-600 flex items-center">  
                    <Mail className="w-4 h-4 mr-2" />  
                    Correo:  
                  </span>  
                  <span className="text-gray-900 break-all">{empleado?.email || "N/A"}</span>  
                </div>  
              </div>  
            </div>  
          </div>  
  
          {/* ✅ Botones de acción profesionales */}  
          <div className="flex justify-center space-x-4 py-4">  
            <button  
              onClick={() => setShowTareaModal(true)}  
              className="flex items-center space-x-2 px-6 py-3 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"  
            >  
              <ClipboardList className="w-4 h-4" />  
              <span>Tareas</span>  
            </button>  
            <button  
              onClick={() => setShowTurnoModal(true)}  
              className="flex items-center space-x-2 px-6 py-3 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"  
            >  
              <Clock className="w-4 h-4" />  
              <span>Turnos</span>  
            </button>  
            <button  
              onClick={() => setShowPermisoModal(true)}  
              className="flex items-center space-x-2 px-6 py-3 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"  
            >  
              <Shield className="w-4 h-4" />  
              <span>Permisos</span>  
            </button>  
          </div>  
  
          {/* ✅ Sección de tareas profesional */}  
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">  
            <div className="flex items-center justify-between mb-4">  
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">  
                <ClipboardList className="w-5 h-5 text-blue-500 mr-3" />  
                Tareas Asignadas ({tareas.length})  
              </h3>  
              <button  
                onClick={() => setShowTareaModal(true)}  
                className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"  
              >  
                <Plus className="w-4 h-4" />  
                <span>Agregar tarea</span>  
              </button>  
            </div>  
            <div className="space-y-3 max-h-48 overflow-y-auto">  
              {tareas.length > 0 ? (  
                tareas.map((tarea, index) => (  
                  <div  
                    key={tarea.id || index}  
                    className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-blue-200 shadow-sm"  
                  >  
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">  
                      <ClipboardList className="w-5 h-5 text-white" />  
                    </div>  
                    <div className="flex-1">  
                      <p className="text-sm font-semibold text-gray-900">  
                        {tarea.tareas?.nombre || tarea.nombre}  
                      </p>  
                      <p className="text-sm text-gray-600">  
                        {tarea.tareas?.descripcion || tarea.descripcion}  
                      </p>  
                      <p className="text-xs text-blue-600 mt-1 flex items-center">  
                        <Calendar className="w-3 h-3 mr-1" />  
                        Asignado para hoy - {new Date().toLocaleDateString("es-CL")}  
                      </p>  
                    </div>  
                  </div>  
                ))  
              ) : (  
                <div className="text-center text-gray-500 py-8">  
                  <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />  
                  <p>No hay tareas asignadas para hoy.</p>  
                </div>  
              )}  
            </div>  
          </div>  
  
          {/* ✅ Sección de permisos profesional (sin dirección) */}  
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">  
            <div className="flex items-center justify-between mb-4">  
              <div>  
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">  
                  <Shield className="w-5 h-5 text-purple-500 mr-3" />  
                  Rol: {empleado?.rol || "Empleado"}  
                </h3>  
                <p className="text-sm text-gray-600 mt-1">  
                  {getPermisosResumen(empleado?.rol)}  
                </p>  
              </div>  
              <div className="flex space-x-3">  
                <button  
                  onClick={() => setShowPermisoModal(true)}  
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"  
                >  
                  <Edit3 className="w-4 h-4" />  
                  <span>Editar permisos</span>  
                </button>  
              </div>  
            </div>  
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-48 overflow-y-auto">  
              {permisos.length > 0 ? (  
                permisos.map((permiso, index) => (  
                  <div  
                    key={permiso.id || index}  
                    className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm"  
                  >  
                    <p className="text-xs text-gray-600 mb-2 font-medium">  
                      {permiso.permisos?.nombre || permiso.nombre}  
                    </p>  
                    <div className="flex justify-center mb-2">  
                      {permiso.otorgado ? (  
                        <CheckCircle className="w-6 h-6 text-green-500" />  
                      ) : (  
                        <XCircle className="w-6 h-6 text-red-500" />  
                      )}  
                    </div>  
                    <p className="text-xs text-gray-400">  
                      {permiso.permisos?.modulo || ""}  
                    </p>  
                  </div>  
                ))  
              ) : (  
                <div className="col-span-full text-center text-gray-500 py-8">  
                  <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />  
                  <p>No hay permisos asignados.</p>  
                  <p className="text-xs mt-1">Los permisos se asignan según el rol del usuario</p>  
                </div>  
              )}  
            </div>  
          </div>  
        </div>  
      </Modal>  
  
      {/* ✅ Modales mejorados con mejor paso de datos */}  
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
        
      <AsignarPermisoModal  
        isOpen={showPermisoModal}  
        onClose={() => setShowPermisoModal(false)}  
        selectedUser={empleado}  
        availablePermissions={allPermissions || []}  
        onSuccess={() => refetchPermissions()}  
      />  
    </>  
  );  
};