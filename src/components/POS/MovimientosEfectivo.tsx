import React, { useState, useEffect } from "react";  
import { Filter } from "lucide-react";  
import { useSupabaseData } from "../../hooks/useSupabaseData";  
import { FilterModal } from "../Common/FilterModal";  
import { useAuth } from "../../contexts/AuthContext";  
  
interface Movimiento {  
  id: string;  
  tipo: string;  
  monto: number;  
  fecha: string;  
  sucursal_id: string;  
  caja_id: string;  
}  
  
interface Sucursal {  
  id: string;  
  nombre: string;  
}  
  
interface Caja {  
  id: string;  
  nombre: string;  
  sucursal_id: string;  
}  
  
interface FilterState {  
  sucursal: string;  
  tipo: string;  
  fecha: string;  
  caja: string[];  
}  
  
export function MovimientosEfectivo() {  
  const { empresaId } = useAuth();  
  const [showFilters, setShowFilters] = useState(false);  
  const [filters, setFilters] = useState<FilterState>({  
    sucursal: "",  
    tipo: "",  
    fecha: "",  
    caja: [],  
  });  
  const [cajasSucursal, setCajasSucursal] = useState<Caja[]>([]);  
  
  // Filtrar movimientos por empresa  
  const {  
    data: movimientos,  
    loading,  
  } = useSupabaseData<Movimiento>(  
    "movimientos_caja",  
    "*",  
    empresaId ? { empresa_id: empresaId } : undefined  
  );  
  
  // Filtrar sucursales por empresa  
  const { data: sucursales } = useSupabaseData<Sucursal>(  
    "sucursales",  
    "*",  
    empresaId ? { empresa_id: empresaId } : undefined  
  );  
  
  // Filtrar cajas por empresa  
  const { data: cajas } = useSupabaseData<Caja>(  
    "cajas",  
    "*",  
    empresaId ? { empresa_id: empresaId } : undefined  
  );  
  
  // Filtrar cajas por sucursal seleccionada  
  useEffect(() => {  
    filterCajas();  
  }, [filters.sucursal, cajas]);  
  
  const filterCajas = () => {  
    if (!filters.sucursal) {  
      setCajasSucursal(cajas || []);  
    } else {  
      const cajasFiltradas = (cajas || []).filter(  
        (caja) => caja.sucursal_id === filters.sucursal  
      );  
      setCajasSucursal(cajasFiltradas);  
    }  
  };  
  
  const handleSucursalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {  
    setFilters((prev) => ({  
      ...prev,  
      sucursal: e.target.value,  
      caja: [], // Limpiar cajas seleccionadas  
    }));  
  };  
  
  // Validación de empresa  
  if (!empresaId) {  
    return (  
      <div className="text-center py-4">  
        Error: No se pudo determinar la empresa.  
      </div>  
    );  
  }  
  
  // Apply filters  
  const filteredMovimientos = (movimientos || []).filter((movimiento) => {  
    const fechaMovimiento = new Date(movimiento.fecha).toLocaleDateString("es-CL");  
    const tipoMovimiento = movimiento.tipo;  
  
    if (filters.sucursal && movimiento.sucursal_id !== filters.sucursal)  
      return false;  
    if (filters.tipo && filters.tipo !== "" && tipoMovimiento !== filters.tipo)  
      return false;  
    if (filters.fecha && !fechaMovimiento.includes(filters.fecha))  
      return false;  
    if (filters.caja.length > 0 && !filters.caja.includes(movimiento.caja_id))  
      return false;  
    return true;  
  });  
  
  if (loading) {  
    return <div className="text-center py-4">Cargando movimientos...</div>;  
  }  
  
  return (  
    <div className="space-y-6">  
      <div className="flex items-center justify-between">  
        <h2 className="text-lg font-medium text-gray-900">  
          Movimientos de efectivo  
        </h2>  
  
        {/* Botón de filtros alineado a la derecha */}  
        <button  
          onClick={() => setShowFilters(true)}  
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"  
        >  
          <Filter className="w-4 h-4" />  
          <span>Filtros</span>  
        </button>  
      </div>  
  
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">  
        <table className="w-full">  
          <thead className="bg-gray-50 border-b border-gray-200">  
            <tr>  
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">  
                Retiros / Ingresos  
              </th>  
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">  
                Monto  
              </th>  
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">  
                Fecha y hora  
              </th>  
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">  
                Sucursales  
              </th>  
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">  
                Caja  
              </th>  
            </tr>  
          </thead>  
          <tbody className="divide-y divide-gray-200">  
            {filteredMovimientos.map((movimiento, index) => (  
              <tr key={index} className="hover:bg-gray-50">  
                <td className="px-6 py-4 text-sm text-gray-900">  
                  {movimiento.tipo === "retiro" ? "Retiro" : "Ingreso"}  
                </td>  
                <td className="px-6 py-4 text-sm text-gray-900">  
                  {movimiento.tipo === "retiro" ? "- " : "+ "}$  
                  {parseFloat(movimiento.monto?.toString() || "0").toLocaleString("es-CL")}  
                </td>  
                <td className="px-6 py-4 text-sm text-gray-900">  
                  {new Date(movimiento.fecha).toLocaleString("es-CL")}  
                </td>  
                <td className="px-6 py-4 text-sm text-gray-900">  
                  {sucursales?.find((s) => s.id === movimiento.sucursal_id)  
                    ?.nombre || "Sin nombre"}  
                </td>  
                <td className="px-6 py-4 text-sm text-gray-900">  
                  {cajas?.find((c) => c.id === movimiento.caja_id)?.nombre || "Sin nombre"}  
                </td>  
              </tr>  
            ))}  
          </tbody>  
        </table>  
      </div>  
  
      <FilterModal  
        isOpen={showFilters}  
        onClose={() => setShowFilters(false)}  
        title="Filtros"  
      >  
        <div className="space-y-4">  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">  
              Tipo de Movimiento  
            </label>  
            <select  
              value={filters.tipo}  
              onChange={(e) =>  
                setFilters((prev) => ({ ...prev, tipo: e.target.value }))  
              }  
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"  
            >  
              <option value="">Todos los movimientos</option>  
              <option value="ingreso">Ingresos</option>  
              <option value="retiro">Retiros</option>  
            </select>  
          </div>  
  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">  
              Fecha / Hora  
            </label>  
            <input  
              type="datetime-local"  
              value={filters.fecha}  
              onChange={(e) =>  
                setFilters((prev) => ({ ...prev, fecha: e.target.value }))  
              }  
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"  
            />  
          </div>  
  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">  
              Sucursal  
            </label>  
            <select  
              value={filters.sucursal}  
              onChange={handleSucursalChange}  
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"  
            >  
              <option value="">Todas las sucursales</option>  
              {sucursales?.map((sucursal) => (  
                <option key={sucursal.id} value={sucursal.id}>  
                  {sucursal.nombre}  
                </option>  
              ))}  
            </select>  
          </div>  
  
          <div>  
            <label className="block text-sm font-medium text-gray-700 mb-2">  
              Cajas  
            </label>  
            <div className="space-y-2">  
              {cajasSucursal?.map((caja) => (  
                <label key={caja.id} className="flex items-center space-x-2">  
                  <input  
                    type="checkbox"  
                    checked={filters.caja.includes(caja.id)}  
                    onChange={(e) => {  
                      setFilters((prev) => {  
                        if (e.target.checked) {  
                          return { ...prev, caja: [...prev.caja, caja.id] };  
                        } else {  
                          return {  
                            ...prev,  
                            caja: prev.caja.filter((id) => id !== caja.id),  
                          };  
                        }  
                      });  
                    }}  
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"  
                  />  
                  <span className="text-sm text-gray-700">{caja.nombre}</span>  
                </label>  
              ))}  
            </div>  
          </div>  
        </div>  
      </FilterModal>  
    </div>  
  );  
}