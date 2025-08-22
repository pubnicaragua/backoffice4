import { useState, useEffect } from "react";  
import { Search, Plus, Mail, Clock, Filter } from "lucide-react";  
import { supabase } from "../../lib/supabase";  
import { AgregarUsuarioModal } from "./AgregarUsuarioModal";  
import { AsignarTiempoModal } from "./AsignarTiempoModal";  
import { EnviarComunicadoModal } from "./EnviarComunicadoModal";  
import { PerfilEmpleadoModal } from "./PerfilEmpleadoModal";  
import { FilterModal } from "../Common/FilterModal";  
import { useAuth } from "../../contexts/AuthContext";  
  
export function GestionUsuarios() {  
  const [searchTerm, setSearchTerm] = useState("");  
  const [showAgregarModal, setShowAgregarModal] = useState(false);  
  const [showTiempoModal, setShowTiempoModal] = useState(false);  
  const [showComunicadoModal, setShowComunicadoModal] = useState(false);  
  const [showFilters, setShowFilters] = useState(false);  
  const [showPerfilModal, setShowPerfilModal] = useState(false);  
  const [selectedUser, setSelectedUser] = useState(null);  
  const { empresaId } = useAuth();  
  
  const [usuarios, setUsuarios] = useState([]);  
  const [loading, setLoading] = useState(true);  
    
  // ✅ Obtener sucursales para el filtro y mostrar en tabla  
  const [sucursales, setSucursales] = useState([]);  
  const [filtroSucursal, setFiltroSucursal] = useState("");  
  
  const fetchSucursales = async () => {  
    if (!empresaId) return;  
      
    const { data: sucursalesData } = await supabase  
      .from("sucursales")  
      .select("*")  
      .eq("empresa_id", empresaId);  
      
    setSucursales(sucursalesData || []);  
  };  
  
  const fetchUsuarios = async () => {  
    if (!empresaId) return;  
  
    setLoading(true);  
  
    // Paso 1: Obtener IDs de usuarios de la empresa CON sucursal_id  
    const { data: usuarioEmpresaData, error: ueError } = await supabase  
      .from("usuario_empresa")  
      .select("usuario_id, sucursal_id")  
      .eq("empresa_id", empresaId)  
      .eq("activo", true);  
  
    if (ueError || !usuarioEmpresaData?.length) {  
      setUsuarios([]);  
      setLoading(false);  
      return;  
    }  
  
    // Paso 2: Obtener datos completos de usuarios  
    const userIds = usuarioEmpresaData.map((item) => item.usuario_id);  
    const { data: usuariosData, error: usersError } = await supabase  
      .from("usuarios")  
      .select("*")  
      .in("id", userIds);  
  
    if (!usersError) {  
      // ✅ Combinar datos de usuario con sucursal  
      const usuariosConSucursal = usuariosData.map(usuario => {  
        const usuarioEmpresa = usuarioEmpresaData.find(ue => ue.usuario_id === usuario.id);  
        const sucursal = sucursales.find(s => s.id === usuarioEmpresa?.sucursal_id);  
          
        return {  
          ...usuario,  
          sucursal_id: usuarioEmpresa?.sucursal_id,  
          sucursal_nombre: sucursal?.nombre || "Sin asignar"  
        };  
      });  
        
      setUsuarios(usuariosConSucursal || []);  
    }  
  
    setLoading(false);  
  };  
  
  useEffect(() => {  
    fetchSucursales();  
  }, [empresaId]);  
  
  useEffect(() => {  
    if (sucursales.length > 0) {  
      fetchUsuarios();  
    }  
  }, [empresaId, sucursales]);  
  
  // ✅ Columnas actualizadas con sucursal y permisos  
  const columns = [  
    { key: "nombreCompleto", label: "Nombre completo" },  
    { key: "email", label: "Email" },  
    { key: "rut", label: "RUT" },  
    { key: "sucursal", label: "Sucursal" },  
    { key: "rol", label: "Rol" },  
    { key: "permisos", label: "Permisos" },  
  ];  
  
  // ✅ Función para obtener resumen de permisos según rol  
  const getPermisosResumen = (rol: string) => {  
    switch (rol) {  
      case "administrador":  
        return "Todos los permisos";  
      case "supervisor":  
        return "Ventas, Inventario, Reportes";  
      case "empleado":  
        return "Ventas básicas";  
      default:  
        return "Sin permisos";  
    }  
  };  
  
  // ✅ Proceso los datos con sucursal y permisos  
  const processedData = usuarios.map((usuario) => ({  
    id: usuario.id,  
    nombreCompleto:  
      `${usuario.nombres || ""} ${usuario.apellidos || ""}`.trim() ||  
      "Sin nombre",  
    email: usuario.email || "Sin email",  
    rut: usuario.rut || "Sin RUT",  
    sucursal: usuario.sucursal_nombre || "Sin asignar",  
    rol: usuario.rol || "Empleado",  
    permisos: getPermisosResumen(usuario.rol),  
    usuario,  
  }));  
  
  // ✅ Filtro aplicado con búsqueda y sucursal  
  const filteredData = processedData.filter((item) => {  
    // Filtro por búsqueda  
    const matchesSearch = searchTerm === "" ||  
      item.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||  
      item.rut.includes(searchTerm);  
      
    // Filtro por sucursal  
    const matchesSucursal = filtroSucursal === "" ||  
      item.usuario.sucursal_id === filtroSucursal;  
      
    return matchesSearch && matchesSucursal;  
  });  
  
  const handleViewPerfil = (userData) => {  
    setSelectedUser(userData);  
    setShowPerfilModal(true);  
  };  
  
  const handleRefresh = () => {  
    fetchUsuarios();  
  };  
  
  if (loading) {  
    return <div className="text-center py-4">Cargando usuarios...</div>;  
  }  
  
  return (  
    <div className="space-y-4">  
      <div className="flex items-center justify-between">  
        <h2 className="text-base font-medium text-gray-900">  
          Gestión de usuarios  
        </h2>  
        <div className="flex items-center space-x-2">  
          <button  
            onClick={() => setShowComunicadoModal(true)}  
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"  
          >  
            <Mail className="w-4 h-4" />  
            <span>Enviar un comunicado general</span>  
          </button>  
          <button  
            onClick={() => setShowTiempoModal(true)}  
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"  
          >  
            <Clock className="w-4 h-4" />  
            <span>Asignar tiempo de colación</span>  
          </button>  
          <button  
            onClick={() => setShowFilters(true)}  
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"  
          >  
            <Filter className="w-4 h-4" />  
            <span>Filtros</span>  
          </button>  
        </div>  
      </div>  
  
      <div className="flex items-center justify-between mb-4">  
        <div className="flex items-center space-x-4">  
          <div className="relative">  
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />  
            <input  
              type="text"  
              placeholder="Buscar por nombre o RUT"  
              value={searchTerm}  
              onChange={(e) => setSearchTerm(e.target.value)}  
              className="pl-8 pr-4 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"  
            />  
          </div>  
            
          {/* ✅ Filtro directo por sucursal */}  
          <select  
            value={filtroSucursal}  
            onChange={(e) => setFiltroSucursal(e.target.value)}  
            className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"  
          >  
            <option value="">Todas las sucursales</option>  
            {sucursales.map(sucursal => (  
              <option key={sucursal.id} value={sucursal.id}>  
                {sucursal.nombre}  
              </option>  
            ))}  
          </select>  
        </div>  
          
        <div className="ml-auto">  
          <button  
            onClick={() => setShowAgregarModal(true)}  
            className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"  
          >  
            <Plus className="w-4 h-4" />  
            <span>Agregar usuario</span>  
          </button>  
        </div>  
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
            {filteredData.map((row) => (  
              <tr  
                key={row.id}  
                className="hover:bg-gray-50 cursor-pointer"  
                onClick={() => handleViewPerfil(row.usuario)}  
              >  
                <td className="px-4 py-3 text-sm text-gray-900">  
                  {row.nombreCompleto}  
                </td>  
                <td className="px-4 py-3 text-sm text-gray-900">{row.email}</td>  
                <td className="px-4 py-3 text-sm text-gray-900">{row.rut}</td>  
                <td className="px-4 py-3 text-sm text-gray-900">  
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">  
                    {row.sucursal}  
                  </span>  
                </td>  
                <td className="px-4 py-3 text-sm text-gray-900">  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${  
                    row.rol === 'administrador' ? 'bg-red-100 text-red-800' :  
                    row.rol === 'supervisor' ? 'bg-yellow-100 text-yellow-800' :  
                    'bg-green-100 text-green-800'  
                  }`}>  
                    {row.rol}  
                  </span>  
                </td>  
                <td className="px-4 py-3 text-sm text-gray-500">{row.permisos}</td>  
              </tr>  
            ))}  
          </tbody>  
        </table>  
      </div>  
  
      <AgregarUsuarioModal  
        loading={loading}  
        setLoading={setLoading}  
        isOpen={showAgregarModal}  
        onClose={() => {  
          setShowAgregarModal(false);  
        }}  
        onSuccess={handleRefresh}  
      />  
  
      <AsignarTiempoModal  
        isOpen={showTiempoModal}  
        onClose={() => setShowTiempoModal(false)}  
      />  
  
      <EnviarComunicadoModal  
        isOpen={showComunicadoModal}  
        onClose={() => setShowComunicadoModal(false)}  
      />  
  
      <PerfilEmpleadoModal  
        isOpen={showPerfilModal}  
        onClose={() => setShowPerfilModal(false)}  
        selectedUser={selectedUser}  
      />  
  
      <FilterModal  
        isOpen={showFilters}  
        onClose={() => setShowFilters(false)}  
        title="Filtros"  
      >  
        {/* ✅ Filtros comentados como solicitaste */}  
        <div className="space-y-4">  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">Sucursal</label>  
            <select   
              value={filtroSucursal}  
              onChange={(e) => setFiltroSucursal(e.target.value)}  
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"  
            >  
              <option value="">Todas las sucursales</option>  
              {sucursales.map(sucursal => (  
                <option key={sucursal.id} value={sucursal.id}>  
                  {sucursal.nombre}  
                </option>  
              ))}  
            </select>  
          </div>  
          {/* ✅ Filtros de fecha y hora comentados */}  
          {/* <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>  
            <input  
              type="date"  
              className="w-full  px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"  
            />  
          </div>  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">Hora</label>  
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">  
              <option value="">Seleccionar hora</option>  
              <option value="morning">Mañana</option>  
              <option value="afternoon">Tarde</option>  
            </select>  
          </div> */}  
        </div>  
      </FilterModal>  
    </div>  
  );  
}