"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Card,
  Button,
  Label,
  TextInput,
  Textarea,
  Alert,
  Spinner,
} from "flowbite-react";
import { HiLockOpen, HiLockClosed, HiRefresh, HiOutlineCube } from "react-icons/hi";
import { Modal } from "../Common/Modal";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import "react-toastify/dist/ReactToastify.css";
import { Sucursal, Usuario } from "../../types/cajas";
import { CrearCajaModal } from "./modals/CrearCajaModal";

type EstadoSesion = "abierta" | "cerrada" | "en_proceso";

interface Caja {
  id: string;
  nombre: string;
  sucursal_id: string;
  activo: boolean;
  sucursal?: Sucursal;
  created_at?: string;
  updated_at?: string;
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
  monto_efectivo?: number;
  monto_tarjeta?: number;
  monto_transferencia?: number;
  monto_otros?: number;
  abierta_en?: string;
  cerrada_en?: string;
  cerrada_por?: string;
  creada_en?: string;
  actualizada_en?: string;
  caja?: Caja;
  sucursal?: Sucursal;
}

type TipoVuelto =
  | "monto_efectivo"
  | "monto_tarjeta"
  | "monto_transferencia"
  | "monto_otros";

interface GestionCajaState {
  cargando: boolean;
  procesando: boolean;
  error: string | null;
  sucursales: Sucursal[];
  empleados: Usuario[]
  cajasDisponibles: Caja[];
  cajaSeleccionada: Caja | null;
  sesionesActivas: SesionCaja[];
  mostrarModalApertura: boolean;
  mostrarModalCierre: boolean;
  saldoInicial: string;
  saldoFinal: string;
  observaciones: string;
  sucursalSeleccionadaId: string;
  empleadoSeleccionadoId: string;
  sesionSeleccionadaCerrar: SesionCaja | null;
  tipoVueltoSeleccionado: TipoVuelto;
  montoVuelto: string;
  crearCajaModal: boolean;
}

const GestionCaja: React.FC = () => {
  const initialState: GestionCajaState = {
    cargando: true,
    procesando: false,
    error: null,
    sucursales: [],
    empleados: [],
    cajasDisponibles: [],
    cajaSeleccionada: null,
    sesionesActivas: [],
    mostrarModalApertura: false,
    mostrarModalCierre: false,
    saldoInicial: "",
    saldoFinal: "",
    observaciones: "",
    sucursalSeleccionadaId: "",
    empleadoSeleccionadoId: "",
    sesionSeleccionadaCerrar: null,
    tipoVueltoSeleccionado: "monto_efectivo",
    montoVuelto: "",
    crearCajaModal: false,
  };
  const { empresaId, user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true)
  const [state, setState] = useState<GestionCajaState>(initialState);

  const updateState = useCallback((updates: Partial<GestionCajaState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: "success" | "error" | "warning" | "info" = "info"
    ) => {
      toast[type](message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    },
    []
  );

  // ✅ 1. cargar sucursales
  const cargarSucursalesDisponibles = useCallback(async (): Promise<Sucursal[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("sucursales")
      .select("*")
      .eq("empresa_id", empresaId);

    if (error) {
      showToast("Error cargando sucursales disponibles", "error");
      return [];
    }
    return data || [];
  }, [empresaId, showToast, user]);

  // ✅ 2. cargar cajas filtrando por sucursal seleccionada
  const cargarCajasDisponibles = useCallback(
    async (sucursalId: string): Promise<Caja[]> => {
      if (!user || !sucursalId) return [];
      const { data, error } = await supabase
        .from("cajas")
        .select("*")
        .eq("empresa_id", empresaId)
        .eq("activo", true)
        .eq("sucursal_id", sucursalId);
      if (error) {
        showToast("Error cargando cajas disponibles", "error");
        return [];
      }
      return data || [];
    },
    [empresaId, showToast, user]
  );

  // ✅ 3. cargar sesiones (igual que tenías)
  const cargarSesionesActivas = useCallback(async (sucursalId: string): Promise<SesionCaja[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("sesiones_caja")
      .select("*, caja:cajas(*)")
      .eq("sucursal_id", sucursalId)
      .eq("estado", "abierta");
    if (error) {
      showToast("Error cargando sesiones activas", "error");
      return [];
    }
    return data || [];
  }, [showToast, user]);

  // 4. Cargar empleados
  const cargarEmpleados = useCallback(async (sucursalId: string): Promise<Usuario[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("sucursal_id", sucursalId)
      .eq("rol", "empleado")
    if (error) {
      showToast("Error cargando sesiones activas", "error");
      return [];
    }
    return data || [];
  }, [])
  // ✅ 4. flujo inicial
  const cargarDatosIniciales = useCallback(async () => {
    updateState({ cargando: true });
    try {
      const sucursalesData = await cargarSucursalesDisponibles();

      // set sucursal por defecto
      const sucursalDefault = sucursalesData.length > 0 ? sucursalesData[0].id : "";

      const [cajasData, sesionesData, empleadosData] = await Promise.all([
        cargarCajasDisponibles(sucursalDefault),
        cargarSesionesActivas(sucursalDefault),
        cargarEmpleados(sucursalDefault),
      ]);

      updateState({
        sucursales: sucursalesData,
        empleados: empleadosData,
        sucursalSeleccionadaId: sucursalDefault,
        cajasDisponibles: cajasData,
        sesionesActivas: sesionesData,
        cajaSeleccionada: cajasData.length > 0 ? cajasData[0] : null,
        sesionSeleccionadaCerrar: sesionesData.length > 0 ? sesionesData[0] : null,
        cargando: false,
        saldoInicial: "",
        saldoFinal: "",
        observaciones: "",
        tipoVueltoSeleccionado: "monto_efectivo",
        montoVuelto: "",
      });

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Error desconocido";
      showToast(`Error cargando datos: ${errMsg}`, "error");
      updateState({ cargando: false, error: errMsg });
    }
  }, [cargarSucursalesDisponibles, cargarCajasDisponibles, cargarSesionesActivas, showToast, updateState, cargarEmpleados]);

  useEffect(() => {
    cargarDatosIniciales();
    updateState({ cargando: false })
  }, [cargarDatosIniciales, state.cargando]);

  const handleAbrirModal = useCallback(() => {
    updateState({
      mostrarModalApertura: true,
    })
  }, [state.cajasDisponibles, state.sucursales, updateState])

  // ✅ 5. cuando cambie sucursal, recargar cajas y empleados
  useEffect(() => {
    const fetchCajas = async () => {
      if (state.sucursalSeleccionadaId) {
        const empleados = await cargarEmpleados(state.sucursalSeleccionadaId);
        const cajas = await cargarCajasDisponibles(state.sucursalSeleccionadaId);
        updateState({
          empleados: empleados,
          empleadoSeleccionadoId: empleados.length > 0 ? empleados[0].id : undefined,
          cajasDisponibles: cajas,
          cajaSeleccionada: cajas.length > 0 ? cajas[0] : null,
        });
      }
    };
    fetchCajas();
  }, [state.sucursalSeleccionadaId, cargarCajasDisponibles, updateState]);

  const handleAbrirCaja = async () => {
    if (!state.cajaSeleccionada) {
      showToast("Por favor selecciona una caja", "warning");
      return;
    }
    // Verificar que la caja no esté abierta ya en sesiones activas
    const estaAbierta = state.sesionesActivas.some(
      (sesion) => sesion.caja_id === state.cajaSeleccionada?.id
    );
    if (estaAbierta) {
      toast.error(
        "Esta caja ya está abierta. Por favor cierre la sesión existente."
      );
      return;
    }
    // Verificar si hay alguna caja disponible por abrir
    const cajasAbiertasIds = new Set(
      state.sesionesActivas.map((s) => s.caja_id)
    );
    const cajasDisponiblesPorAbrir = state.cajasDisponibles.filter(
      (c) => !cajasAbiertasIds.has(c.id)
    );
    if (cajasDisponiblesPorAbrir.length === 0) {
      showToast("No quedan cajas disponibles para abrir.", "warning");
      return;
    }
    handleAbrirModal();
  };

  const handleAbrirCerrarCajaModal = () => {
    if (state.sesionesActivas.length === 0) {
      showToast("No hay cajas abiertas para cerrar", "warning");
      return;
    }
    updateState({
      mostrarModalCierre: true,
      saldoFinal: "",
      observaciones: "",
      procesando: false,
      sesionSeleccionadaCerrar: state.sesionesActivas[0],
      tipoVueltoSeleccionado: "monto_efectivo",
      montoVuelto: "",
    });
  };

  const handleCerrarCaja = useCallback(() => {
    handleAbrirCerrarCajaModal();
  }, [state.sesionesActivas]);

  // Confirmar apertura con validación en tabla usuarios para evitar error FK
  const handleConfirmarApertura = useCallback(async () => {
    if (!state.cajaSeleccionada) {
      showToast("Por favor selecciona una caja", "warning");
      return;
    }
    if (!state.sucursalSeleccionadaId) {
      showToast("Por favor selecciona una sucursal", "warning");
      return;
    }
    if (!state.empleadoSeleccionadoId) {
      showToast("Por favor selecciona un empleado", "warning")
    }
    if (!user) {
      showToast("Usuario no autenticado", "error");
      return;
    }
    const estaAbierta = state.sesionesActivas.some(
      (sesion) => sesion.caja_id === state.cajaSeleccionada?.id
    );
    if (estaAbierta) {
      toast.error(
        "Esta caja ya está abierta. Por favor cierre la sesión existente."
      );
      return;
    }
    const empleadoOcupado = state.sesionesActivas.find(
      (sesion) =>
        sesion.usuario_id === state.empleadoSeleccionadoId);
    if (empleadoOcupado) {
      toast.error("Este empleado ya tiene una caja asignada")
      return
    }
    try {
      updateState({ procesando: true });

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("sesiones_caja")
        .insert([
          {
            caja_id: state.cajaSeleccionada.id,
            usuario_id: state.empleadoSeleccionadoId,
            sucursal_id: state.sucursalSeleccionadaId,
            estado: "abierta",
            saldo_inicial: 0,
            observaciones: state.observaciones || null,
            abierta_en: now,
            creada_en: now,
            actualizada_en: now,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      showToast("Caja abierta correctamente", "success");

      const sesiones = await cargarSesionesActivas(state.sucursalSeleccionadaId);

      updateState({
        sesionesActivas: sesiones,
        mostrarModalApertura: false,
        saldoInicial: "",
        observaciones: "",
        procesando: false,
        sucursalSeleccionadaId: "",
        cajaSeleccionada: null,
      });
    } catch (error) {
      console.error("Error apertura:", error);
      showToast(
        error instanceof Error ? error.message : "Error al abrir la caja",
        "error"
      );
      updateState({ procesando: false });
    }
  }, [
    state.cajaSeleccionada,
    state.saldoInicial,
    state.observaciones,
    state.sucursalSeleccionadaId,
    showToast,
    updateState,
    user,
    cargarSesionesActivas,
  ]);

  // Confirmar cierre sesión: actualizar solo el campo monto seleccionado con el montoVuelto
  const handleConfirmarCierre = useCallback(async () => {
    if (!state.sesionSeleccionadaCerrar) {
      showToast("Por favor selecciona una sesión para cerrar", "warning");
      return;
    }
    if (!state.saldoFinal || parseFloat(state.saldoFinal) < 0) {
      showToast("Por favor ingresa un saldo final válido", "warning");
      return;
    }
    if (!user) {
      showToast("Usuario no autenticado", "error");
      return;
    }
    if (state.sesionSeleccionadaCerrar === null) {
      handleAbrirCaja()
      return
    }

    try {
      updateState({ procesando: true });
      const now = new Date().toISOString();

      // Creamos el objeto con el campo dinamico del vuelto
      const updateData: any = {
        estado: "cerrada",
        saldo_final: parseFloat(state.saldoFinal),
        observaciones: state.observaciones || null,
        cerrada_en: now,
        cerrada_por: user.id,
        actualizada_en: now,
      };
      updateData[state.tipoVueltoSeleccionado] = parseFloat(state.montoVuelto);

      const { error } = await supabase
        .from("sesiones_caja")
        .update(updateData)
        .eq("id", state.sesionSeleccionadaCerrar.id);

      if (error) throw error;

      showToast("Caja cerrada correctamente", "success");

      const sesiones = await cargarSesionesActivas(state.sucursalSeleccionadaId);

      updateState({
        sesionesActivas: sesiones,
        mostrarModalCierre: false,
        saldoFinal: "",
        observaciones: "",
        cajaSeleccionada: null,
        sesionSeleccionadaCerrar: null,
        procesando: false,
        cargando: true,
        montoVuelto: "",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al cerrar la caja";
      updateState({ error: errorMessage });
      showToast(errorMessage, "error");
      updateState({ procesando: false, cajaSeleccionada: null });
    }
  }, [
    state.sesionSeleccionadaCerrar,
    state.saldoFinal,
    state.observaciones,
    state.tipoVueltoSeleccionado,
    state.montoVuelto,
    updateState,
    showToast,
    user,
    cargarSesionesActivas,
  ]);

  const handleCajaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cajaId = e.target.value;

    // buscar la caja dentro de las cajas disponibles
    const caja = state.cajasDisponibles.find((c) => c.id === cajaId) || null;

    updateState({
      cajaSeleccionada: caja,
    });
  };

  const handleSucursalChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateState({ sucursalSeleccionadaId: e.target.value })
    const sesiones = await cargarSesionesActivas(e.target.value);

    updateState({
      sesionesActivas: sesiones,
    });
  }

  const handleEmpleadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empleadoId = e.target.value;

    updateState({ empleadoSeleccionadoId: empleadoId })
  }

  const handleCrearCajaModal = () => {
    updateState({ crearCajaModal: !state.crearCajaModal })
  }

  if (state.cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 " style={{ padding: '30px' }}>
      {/* Header */}
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

      {/* Seleccionar caja y abrir */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold">Otorgar Nueva Caja</h2>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-col md:flex-row">
            <select
              className="block w-full md:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={state.sucursalSeleccionadaId}
              onChange={handleSucursalChange}
              disabled={state.procesando}
            >
              {state.sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
            <Button
              color="success"
              onClick={handleAbrirModal}
            >
              <HiLockOpen className="mr-2 h-5 w-5" />
              Otorgar Caja
            </Button>
            <Button
              color="success"
              onClick={handleCrearCajaModal}
            >
              <HiOutlineCube className="mr-2 h-5 w-5" />
              Crear Caja
            </Button>
          </div>
        </div>
      </Card>

      {/* Listar sesiones abiertas */}
      <Card className="mb-6">
        <h2
          className="text-xl font-semibold mb-4"
          onClick={() => console.log(user)}
        >
          Sesiones Abiertas
        </h2>
        {state.sesionesActivas.length === 0 ? (
          <p className="text-gray-600">No hay cajas abiertas actualmente.</p>
        ) : (
          <ul className="space-y-4">
            {state.sesionesActivas.map((sesion) => (
              <li
                key={sesion.id}
                className="border p-4 rounded-lg bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-lg">
                    {sesion.caja?.nombre || "N/A"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Empleado: {state.empleados.find((usuario) => usuario.id === sesion.usuario_id)?.nombres || "Desconocido"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Saldo Inicial: $CLP {sesion.saldo_inicial.toFixed(2)}
                  </p>
                  <p
                    className="text-sm text-gray-600"
                    onClick={() => console.log(sesion)}
                  >
                    Fecha Apertura:{" "}
                    {new Date(sesion.abierta_en).toLocaleString()}
                  </p>
                </div>
                <Button
                  color="failure"
                  onClick={() => {
                    updateState({
                      mostrarModalCierre: true,
                      sesionSeleccionadaCerrar: sesion,
                      saldoFinal: "",
                      montoVuelto: "",
                      observaciones: "",
                      tipoVueltoSeleccionado: "monto_efectivo",
                    });
                  }}
                >
                  <HiLockClosed className="mr-2 h-5 w-5" />
                  Cerrar Caja
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Modal Abrir Caja */}
      <Modal
        isOpen={state.mostrarModalApertura}
        onClose={() => updateState({ mostrarModalApertura: false })}
        title="Otorgar Caja"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="sucursalSeleccionadaId">
              Selecciona una Sucursal
            </Label>
            <select
              id="sucursalSeleccionadaId"
              value={state.sucursalSeleccionadaId}
              onChange={handleSucursalChange}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1"
              required
              disabled={state.procesando}
            >
              <option value="" disabled>
                -- Seleccionar sucursal --
              </option>
              {state.sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="cajaSeleccionada">Selecciona una Caja</Label>
            <select
              id="cajaSeleccionada"
              value={state.cajaSeleccionada?.id || ""}
              onChange={handleCajaChange}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1"
              required
              disabled={state.procesando}
            >
              <option value="" disabled>
                -- Seleccionar caja --
              </option>
              {state.cajasDisponibles.map((caja) => (
                <option key={caja.id} value={caja.id}>
                  {caja.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="sucursalSeleccionadaId">
              Selecciona un Empleado
            </Label>
            <select
              id="sucursalSeleccionadaId"
              value={state.empleadoSeleccionadoId}
              onChange={handleEmpleadoChange}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1"
              required
              disabled={state.procesando}
            >
              <option value="" disabled>
                -- Seleccionar empleado --
              </option>
              {state.empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombres}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="observacionesApertura">
              Observaciones (Opcional)
            </Label>
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
            disabled={
              !state.sucursalSeleccionadaId ||
              !state.cajaSeleccionada ||
              state.procesando
            }
            className="flex items-center"
          >
            {state.procesando ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Procesando...
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </div>
      </Modal>

      {/* Modal Cerrar Caja */}
      <Modal
        isOpen={state.mostrarModalCierre}
        onClose={() => updateState({ mostrarModalCierre: false })}
        title="Cerrar Caja"
        size="md"
      >
        <div className="space-y-4">

          <div>
            <Label htmlFor="saldoFinal">
              Saldo Final
            </Label>
            <TextInput 
            id="saldoFinal" 
            value={state.saldoFinal} 
            onChange={(e) => updateState({ saldoFinal: e.target.value })} 
            className="mt-1" 
            placeholder="0.00" 
            disabled={state.procesando} />

          </div>

          <div>
            <Label htmlFor="observacionesCierre">
              Observaciones (Opcional)
            </Label>
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
              disabled={
                !state.saldoFinal || state.procesando
              }
              className="flex items-center"
            >
              {state.procesando ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Procesando...
                </>
              ) : (
                "Confirmar Cierre"
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Crear Caja*/}
      <CrearCajaModal isOpen={state.crearCajaModal} onClose={() => updateState({ crearCajaModal: !state.crearCajaModal, cargando: true })} empresaId={empresaId!} sucursales={state.sucursales} />
    </div>
  );
};

export default GestionCaja;
