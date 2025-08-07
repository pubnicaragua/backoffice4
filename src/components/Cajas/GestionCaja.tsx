import React, { useState, useEffect, useCallback } from 'react';  
  
import { toast } from 'react-toastify';  
import {  
  Card,  
  Button,  
  Label,  
  TextInput,  
  Textarea,  
  Alert,  
  Spinner,  
  Badge  
} from 'flowbite-react';  
import { HiLockOpen, HiLockClosed, HiRefresh } from 'react-icons/hi';  
import { Modal } from '../Common/Modal';  
import { supabase } from '../../lib/supabase';  
import 'react-toastify/dist/ReactToastify.css';  
  
// Definición de tipos  
type EstadoSesion = 'abierta' | 'cerrada' | 'en_proceso';  
  
interface Sucursal {  
  id: string;  
  nombre: string;  
  direccion: string;  
  telefono: string;  
  email: string;  
  activa: boolean;  
  created_at: string;  
  updated_at: string;  
}  
  
interface Caja {  
  id: string;  
  nombre: string;  
  sucursal_id: string;  
  activo: boolean;  
  sucursal?: Sucursal;  
  created_at: string;  
  updated_at: string;  
}  
  
interface SesionCaja {  
  id: string;  
  caja_id: string;  
  usuario_id: string;  
  sucursal_id: string;  
  estado: EstadoSesion;  
  saldo_inicial: number;  
  saldo_final?: number;  
  fecha_apertura: string;  
  fecha_cierre?: string;  
  observaciones?: string;  
  created_at: string;  
  updated_at: string;  
  caja?: Caja;  
  sucursal?: Sucursal;  
}  
  
interface GestionCajaState {  
  cargando: boolean;  
  procesando: boolean;  
  error: string | null;  
  sucursales: Sucursal[];  
  cajasDisponibles: Caja[];  
  cajaSeleccionada: Caja | null;  
  sesionActiva: SesionCaja | null;  
  mostrarModalApertura: boolean;  
  mostrarModalCierre: boolean;  
  saldoInicial: string;  
  saldoFinal: string;  
  observaciones: string;  
}  
  
const GestionCaja: React.FC = () => {  
  // Estado inicial  
  const initialState: GestionCajaState = {  
    cargando: true,  
    procesando: false,  
    error: null,  
    sucursales: [],  
    cajasDisponibles: [],  
    cajaSeleccionada: null,  
    sesionActiva: null,  
    mostrarModalApertura: false,  
    mostrarModalCierre: false,  
    saldoInicial: '',  
    saldoFinal: '',  
    observaciones: ''  
  };  
  
  const [state, setState] = useState<GestionCajaState>(initialState);  
  
  // Helper para actualizar el estado  
  const updateState = useCallback((updates: Partial<GestionCajaState>) => {  
    setState(prev => ({ ...prev, ...updates }));  
  }, []);  
  
  // Función para mostrar notificaciones toast  
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {  
    toast[type](message, {  
      position: 'top-right',  
      autoClose: 3000,  
      hideProgressBar: false,  
      closeOnClick: true,  
      pauseOnHover: true,  
      draggable: true,  
      progress: undefined,  
    });  
  }, []);  
  
  // Cargar cajas disponibles
  const cargarCajasDisponibles = useCallback(async (): Promise<Caja[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('No se pudo obtener la información del usuario', 'error');
        return [];
      }

      // Try direct table access first since RPC is failing
      const { data: cajas, error } = await supabase
        .from('cajas')
        .select('*')
        .eq('activo', true);

      if (error) {
        console.error('Error cargando cajas:', error);
        showToast('Error al cargar las cajas disponibles', 'error');
        return [];
      }
      
      return cajas || [];
    } catch (error) {
      console.error('Error inesperado al cargar cajas:', error);
      showToast('Error inesperado al cargar las cajas', 'error');
      return [];
    }
  }, [showToast]);
  
  // Función para cargar la sesión activa del usuario
  const cargarSesionActiva = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Build the base query
      const query = supabase
        .from('sesiones_caja')
        .select('*, caja:cajas(*)')
        .eq('usuario_id', user.id)
        .eq('estado', 'abierta')
        .maybeSingle();

      // Execute query
      const { data, error } = await query;

      if (error) {
        // Ignore no rows found error
        if (error.code !== 'PGRST116' && error.code !== '0') {
          console.error('Error cargando sesión activa:', error);
          throw error;
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error inesperado cargando sesión activa:', error);
      return null;
    }
  }, [showToast]);
  
  // Cargar datos iniciales  
  const cargarDatosIniciales = useCallback(async () => {  
    try {  
      setState(prev => ({ ...prev, cargando: true }));  
  
      // Cargar datos en paralelo  
      const [cajasData, sesion] = await Promise.all([  
        cargarCajasDisponibles(),  
        cargarSesionActiva()  
      ]);  
  
      setState(prev => ({  
        ...prev,  
        cajasDisponibles: cajasData,  
        sesionActiva: sesion || null,  
        cajaSeleccionada: sesion?.caja || prev.cajaSeleccionada,  
        cargando: false  
      }));  
    } catch (error) {  
      console.error('Error cargando datos iniciales:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToast(`Error al cargar los datos: ${errorMessage}`, 'error');
      setState(prev => ({ 
        ...prev, 
        cargando: false,
        error: errorMessage 
      }));
    }  
  }, [cargarCajasDisponibles, cargarSesionActiva, updateState, showToast]);  
  
  // Efecto para cargar los datos al montar el componente  
  useEffect(() => {  
    cargarDatosIniciales();  
  }, [cargarDatosIniciales]);  
  
  // Función para abrir el modal de apertura de caja  
  const handleAbrirCaja = useCallback(() => {  
    if (!state.cajaSeleccionada) {  
      showToast('Por favor selecciona una caja', 'warning');  
      return;  
    }  
    updateState({  
      mostrarModalApertura: true,  
      saldoInicial: '',  
      observaciones: ''  
    });  
  }, [state.cajaSeleccionada, updateState, showToast]);  
  
  // Función para abrir el modal de cierre de caja  
  const handleCerrarCaja = useCallback(() => {  
    if (!state.sesionActiva) return;  
    updateState({  
      mostrarModalCierre: true,  
      saldoFinal: '',  
      observaciones: ''  
    });  
  }, [state.sesionActiva, updateState]);  
  
  // Función para confirmar la apertura de caja  
  const handleConfirmarApertura = useCallback(async () => {  
    if (!state.cajaSeleccionada || !state.saldoInicial) {  
      showToast('Por favor ingresa un saldo inicial válido', 'warning');  
      return;  
    }  
  
    try {  
      updateState({ procesando: true });  
      const { data: { user } } = await supabase.auth.getUser();  
      if (!user) {  
        throw new Error('No se pudo obtener la información del usuario');  
      }  
  
      const { data, error } = await supabase  
        .from('sesiones_caja')  
        .insert([{  
          caja_id: state.cajaSeleccionada.id,  
          usuario_id: user.id,  
          sucursal_id: state.cajaSeleccionada.sucursal_id,  
          estado: 'abierta' as EstadoSesion,  
          saldo_inicial: parseFloat(state.saldoInicial),  
          observaciones: state.observaciones,  
        }])  
        .select()  
        .single();  
  
      if (error) throw error;  
  
      showToast('Caja abierta correctamente', 'success');  
      updateState({  
        sesionActiva: data,  
        mostrarModalApertura: false,  
        saldoInicial: '',  
        observaciones: '',  
        procesando: false,  
      });  
    } catch (error) {  
      console.error('Error al abrir la caja:', error);  
      showToast(error instanceof Error ? error.message : 'Error al abrir la caja', 'error');  
      updateState({ procesando: false });  
    }  
  }, [state.cajaSeleccionada, state.saldoInicial, state.observaciones, updateState, showToast]);  
  
  // Función para confirmar el cierre de caja  
  const handleConfirmarCierre = useCallback(async () => {  
    if (!state.sesionActiva || !state.saldoFinal) {  
      showToast('Por favor completa todos los campos requeridos', 'warning');  
      return;  
    }  
  
    try {  
      updateState({ procesando: true });  
      const { error } = await supabase  
        .from('sesiones_caja')  
        .update({  
          estado: 'cerrada' as EstadoSesion,  
          saldo_final: parseFloat(state.saldoFinal),  
          fecha_cierre: new Date().toISOString(),  
          observaciones: state.observaciones  
        })  
        .eq('id', state.sesionActiva.id);  
  
      if (error) throw error;  
  
      updateState({  
        sesionActiva: null,  
        mostrarModalCierre: false,  
        saldoFinal: '',  
        observaciones: '',  
        cajaSeleccionada: null  
      });  
      showToast('Caja cerrada correctamente', 'success');  
    } catch (err) {  
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cerrar la caja';  
      console.error('Error al cerrar la caja:', err);  
      updateState({ error: errorMessage });  
      showToast(errorMessage, 'error');  
    } finally {  
      updateState({ procesando: false });  
    }  
  }, [state.sesionActiva, state.saldoFinal, state.observaciones, updateState, showToast]);  
  
  if (state.cargando) {  
    return (  
      <div className="flex justify-center items-center h-64">  
        <Spinner size="xl" />  
      </div>  
    );  
  }  
  
  return (  
    <div className="flex flex-col space-y-4">  
      <div className="flex justify-between items-center mb-6">  
        <h1 className="text-2xl font-bold">Gestión de Caja</h1>  
        <Button color="light" onClick={cargarDatosIniciales}>  
          <HiRefresh className="mr-2 h-5 w-5" />  
          Actualizar  
        </Button>  
      </div>  
  
      {state.error && (  
        <Alert color="failure" className="mb-4">  
          <span>{state.error}</span>  
        </Alert>  
      )}  
  
      <Card className="mb-6">  
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">  
          <div>  
            <h2 className="text-xl font-semibold">  
              {state.sesionActiva ? 'Caja Abierta' : 'Seleccionar Caja'}  
            </h2>  
            <p className="text-gray-600">  
              {state.sesionActiva  
                ? `Caja: ${state.sesionActiva.caja?.nombre || 'N/A'}`  
                : 'Selecciona una caja para comenzar'}  
            </p>  
          </div>  
          <div className="flex gap-2">  
            {!state.sesionActiva ? (  
              <>  
                <select  
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"  
                  value={state.cajaSeleccionada?.id || ''}  
                  onChange={(e) => {  
                    const caja = state.cajasDisponibles.find(c => c.id === e.target.value) || null;  
                    updateState({ cajaSeleccionada: caja });  
                  }}  
                  disabled={state.procesando}  
                >  
                  <option value="">Seleccionar caja</option>  
                  {state.cajasDisponibles.map((caja) => (  
                    <option key={caja.id} value={caja.id}>  
                      {caja.nombre}  
                    </option>  
                  ))}  
                </select>  
                <Button  
                  color="success"  
                  onClick={handleAbrirCaja}  
                  disabled={!state.cajaSeleccionada || state.procesando}  
                >  
                  <HiLockOpen className="mr-2 h-5 w-5" />  
                  Abrir Caja  
                </Button>  
              </>  
            ) : (  
              <Button  
                color="failure"  
                onClick={handleCerrarCaja}  
                disabled={state.procesando}  
              >  
                <HiLockClosed className="mr-2 h-5 w-5" />  
                Cerrar Caja  
              </Button>  
            )}  
          </div>  
        </div>  
  
        {state.sesionActiva && (  
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">  
            <div className="bg-gray-50 p-4 rounded-lg">  
              <h3 className="font-medium text-gray-700">Saldo Inicial</h3>  
              <p className="text-2xl font-bold">  
                C${state.sesionActiva.saldo_inicial.toFixed(2)}  
              </p>  
            </div>  
            <div className="bg-gray-50 p-4 rounded-lg">  
              <h3 className="font-medium text-gray-700">Fecha de Apertura</h3>  
              <p className="text-lg">  
                {new Date(state.sesionActiva.fecha_apertura).toLocaleString()}  
              </p>  
            </div>  
            <div className="bg-gray-50 p-4 rounded-lg">  
              <h3 className="font-medium text-gray-700">Estado</h3>  
              <Badge color="success" className="text-sm">  
                <HiLockOpen className="mr-1 h-4 w-4" />  
                {state.sesionActiva.estado.toUpperCase()}  
              </Badge>  
            </div>  
          </div>  
        )}  
      </Card>  
  
      {!state.sesionActiva ? (  
        <Card className="mb-6">  
          <div className="text-center py-8">  
            <HiLockClosed className="mx-auto h-12 w-12 text-gray-400" />  
            <h3 className="mt-2 text-lg font-medium text-gray-900">Caja cerrada</h3>  
            <p className="mt-1 text-sm text-gray-500">  
              No hay ninguna caja abierta actualmente.  
            </p>  
            <div className="mt-6">  
              <Button  
                color="success"  
                onClick={() => updateState({ mostrarModalApertura: true })}  
                disabled={state.cajasDisponibles.length === 0}  
                className="inline-flex items-center"  
              >  
                <HiLockOpen className="mr-2 h-5 w-5" />  
                Abrir Caja  
              </Button>  
            </div>  
            {state.cajasDisponibles.length === 0 && (  
              <p className="mt-2 text-sm text-red-600">  
                No hay cajas disponibles para abrir  
              </p>  
            )}  
          </div>  
        </Card>  
      ) : (  
        <Card className="mb-6">  
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">  
            <div>  
              <h2 className="text-xl font-semibold">  
                Caja: {state.sesionActiva.caja?.nombre || 'Caja'}  
              </h2>  
              <p className="text-sm text-gray-500">  
                Sucursal: {state.sesionActiva.sucursal?.nombre || 'N/A'}  
              </p>  
            </div>  
            <div className="mt-4 md:mt-0">  
              <Badge color="success" className="text-sm">  
                <HiLockOpen className="mr-1 h-4 w-4" />  
                Abierta  
              </Badge>  
            </div>  
          </div>  
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">  
            <div className="bg-gray-50 p-4 rounded-lg">  
              <h3 className="font-medium text-gray-700">Resumen de Caja</h3>  
              <p className="text-lg mt-2">  
                Aquí se mostrará el resumen de la caja cuando esté disponible.  
              </p>  
            </div>  
            <div className="bg-gray-50 p-4 rounded-lg">  
              <p className="text-sm font-medium text-gray-500">Total Esperado</p>  
              <p className="text-2xl font-semibold">  
                $ {parseFloat(state.sesionActiva.saldo_inicial?.toString() || '0').toLocaleString('es-CL')} CLP
              </p>  
            </div>  
          </div>  
  
          <div className="flex justify-end space-x-3">  
            <Button  
              color="failure"  
              onClick={handleCerrarCaja}  
              className="flex items-center"  
            >  
              <HiLockClosed className="mr-2 h-5 w-5" />  
              Cerrar Caja  
            </Button>  
          </div>  
        </Card>  
      )}  
  
      {/* Modal para abrir caja */}  
      <Modal  
        isOpen={state.mostrarModalApertura}  
        onClose={() => updateState({ mostrarModalApertura: false })}  
        title="Abrir Caja"  
        size="md"  
      >  
        <div className="space-y-4">  
          <div>  
            <Label htmlFor="saldoInicial">Saldo Inicial en Efectivo</Label>  
            <TextInput  
              id="saldoInicial"  
              type="number"  
              min="0"  
              step="0.01"  
              value={state.saldoInicial}  
              onChange={(e) => updateState({ saldoInicial: e.target.value })}  
              placeholder="0.00"  
              required  
              className="mt-1"  
            />  
          </div>  
          <div>  
            <Label htmlFor="observacionesApertura">Observaciones (Opcional)</Label>  
            <Textarea  
              id="observacionesApertura"  
              value={state.observaciones}  
              onChange={(e) => updateState({ observaciones: e.target.value })}  
              placeholder="Observaciones sobre la apertura de caja"  
              disabled={state.procesando}  
              rows={3}  
              className="mt-1"  
            />  
          </div>  
          <p className="text-sm text-gray-500">  
            Ingrese el monto en efectivo con el que inicia la caja.  
          </p>  
        </div>  
  
        <div className="flex justify-end mt-6 space-x-3">  
          <Button  
            color="gray"  
            onClick={() => updateState({ mostrarModalApertura: false })}  
            disabled={state.procesando}  
          >  
            Cancelar  
          </Button>  
          <Button  
            color="success"  
            onClick={handleConfirmarApertura}  
            disabled={!state.saldoInicial || state.procesando}  
            className="flex items-center"  
          >  
            {state.procesando ? (  
              <>  
                <Spinner size="sm" className="mr-2" />  
                Procesando...  
              </>  
            ) : (  
              'Confirmar Apertura'  
            )}  
          </Button>  
        </div>  
      </Modal>  
  
      {/* Modal para cerrar caja */}  
      <Modal  
        isOpen={state.mostrarModalCierre}  
        onClose={() => updateState({ mostrarModalCierre: false })}  
        title="Cerrar Caja"  
        size="md"  
      >  
        <div className="space-y-4">  
          <div>  
            <Label htmlFor="saldoFinal">Saldo Final en Efectivo</Label>  
            <TextInput  
              id="saldoFinal"  
              type="number"  
              min="0"  
              step="0.01"  
              value={state.saldoFinal}  
              onChange={(e) => updateState({ saldoFinal: e.target.value })}  
              placeholder="0.00"  
              required  
              className="mt-1"  
            />  
            {state.sesionActiva && (  
              <>  
                <p className="mt-1 text-sm text-gray-500">  
                  Saldo inicial: $ {parseFloat(state.sesionActiva.saldo_inicial?.toString() || '0').toLocaleString('es-CL')} CLP
                </p>  
                <p className="text-sm text-gray-500">Ventas en efectivo: $ 0 CLP</p>  
                <p className="text-sm font-medium">  
                  Total esperado: $ {parseFloat(state.sesionActiva.saldo_inicial?.toString() || '0').toLocaleString('es-CL')} CLP
                </p>  
              </>  
            )}  
          </div>  
          <div>  
            <Label htmlFor="observacionesCierre">Observaciones (opcional)</Label>  
            <Textarea  
              id="observacionesCierre"  
              rows={3}  
              value={state.observaciones}  
              onChange={(e) => updateState({ observaciones: e.target.value })}  
              className="mt-1"  
              placeholder="Notas sobre el cierre, diferencias, etc."  
              disabled={state.procesando}  
            />  
          </div>  
        </div>  
  
        <div className="flex justify-end mt-6 space-x-3">  
          <Button  
            color="gray"  
            onClick={() => updateState({ mostrarModalCierre: false })}  
            disabled={state.procesando}  
          >  
            Cancelar  
          </Button>  
          <Button  
            color="failure"  
            onClick={handleConfirmarCierre}  
            disabled={!state.saldoFinal || state.procesando}  
            className="flex items-center"  
          >  
            {state.procesando ? (  
              <>  
                <Spinner size="sm" className="mr-2" />  
                Procesando...  
              </>  
            ) : (  
              'Confirmar Cierre'  
            )}  
          </Button>  
        </div>  
      </Modal>  
    </div>  
  );  
};  
  
export default GestionCaja;