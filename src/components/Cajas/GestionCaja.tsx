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
  Badge,
  Select,
} from "flowbite-react";
import { HiLockOpen, HiLockClosed, HiRefresh } from "react-icons/hi";
import { Modal } from "../Common/Modal";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import "react-toastify/dist/ReactToastify.css";

type EstadoSesion = "abierta" | "cerrada" | "en_proceso";

interface Sucursal {
  id: string;
  empresa_id?: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  activa?: boolean;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

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
  cajasDisponibles: Caja[];
  cajaSeleccionada: Caja | null;
  sesionesActivas: SesionCaja[];
  mostrarModalApertura: boolean;
  mostrarModalCierre: boolean;
  saldoInicial: string;
  saldoFinal: string;
  observaciones: string;
  sucursalSeleccionadaId: string;
  sesionSeleccionadaCerrar: SesionCaja | null;
  tipoVueltoSeleccionado: TipoVuelto;
  montoVuelto: string;
}

const GestionCaja: React.FC = () => {
  const initialState: GestionCajaState = {
    cargando: true,
    procesando: false,
    error: null,
    sucursales: [],
    cajasDisponibles: [],
    cajaSeleccionada: null,
    sesionesActivas: [],
    mostrarModalApertura: false,
    mostrarModalCierre: false,
    saldoInicial: "",
    saldoFinal: "",
    observaciones: "",
    sucursalSeleccionadaId: "",
    sesionSeleccionadaCerrar: null,
    tipoVueltoSeleccionado: "monto_efectivo",
    montoVuelto: "",
  };
  const { empresaId, user } = useAuth();
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

  const cargarCajasDisponibles = useCallback(async (): Promise<Caja[]> => {
    if (!user) {
      showToast("No se pudo obtener usuario autenticado", "error");
      return [];
    }
    const { data: cajas, error } = await supabase
      .from("cajas")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("activo", true);
    if (error) {
      showToast("Error cargando cajas disponibles", "error");
      return [];
    }
    return cajas || [];
  }, [empresaId, showToast, user]);

  const cargarSucursalesDisponibles = useCallback(async (): Promise<
    Sucursal[]
  > => {
    if (!user) {
      showToast("No se pudo obtener usuario autenticado", "error");
      return [];
    }
    const { data: sucursales, error } = await supabase
      .from("sucursales")
      .select("*")
      .eq("empresa_id", empresaId);
    if (error) {
      showToast("Error cargando sucursales disponibles", "error");
      return [];
    }
    return sucursales || [];
  }, [empresaId, showToast, user]);

  const cargarSesionesActivas = useCallback(async (): Promise<SesionCaja[]> => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("sesiones_caja")
      .select("*, caja:cajas(*)")
      .eq("usuario_id", user.id)
      .eq("estado", "abierta");
    if (error) {
      showToast("Error cargando sesiones activas", "error");
      return [];
    }
    return data || [];
  }, [showToast, user]);

  const verificarUsuarioEnTablaUsers =
    useCallback(async (): Promise<boolean> => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("usuarios")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
      if (error) {
        showToast("Error verificando usuario en tabla usuarios", "error");
        return false;
      }
      if (!data) {
        showToast(
          "Usuario no está registrado en la tabla usuarios. Contacte al administrador.",
          "error"
        );
        return false;
      }
      return true;
    }, [user, showToast]);

  const cargarDatosIniciales = useCallback(async () => {
    updateState({ cargando: true });
    try {
      const [cajasData, sucursalesData, sesionesData] = await Promise.all([
        cargarCajasDisponibles(),
        cargarSucursalesDisponibles(),
        cargarSesionesActivas(),
      ]);
      updateState({
        cajasDisponibles: cajasData,
        sucursales: sucursalesData,
        sesionesActivas: sesionesData,
        cargando: false,
        cajaSeleccionada: cajasData.length > 0 ? cajasData[0] : null,
        sucursalSeleccionadaId:
          sucursalesData.length > 0 ? sucursalesData[0].id : "",
        sesionSeleccionadaCerrar:
          sesionesData.length > 0 ? sesionesData[0] : null,
        saldoInicial: "",
        saldoFinal: "",
        observaciones: "",
        tipoVueltoSeleccionado: "monto_efectivo",
        montoVuelto: "",
      });
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Error desconocido";
      showToast(`Error cargando datos: ${errMsg}`, "error");
      updateState({ cargando: false, error: errMsg });
    }
  }, [
    cargarCajasDisponibles,
    cargarSucursalesDisponibles,
    cargarSesionesActivas,
    showToast,
    updateState,
  ]);

  useEffect(() => {
    cargarDatosIniciales();
  }, [cargarDatosIniciales]);

  // Manejo cambios estados y selects
  const handleCajaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const caja =
      state.cajasDisponibles.find((c) => c.id === e.target.value) || null;
    updateState({ cajaSeleccionada: caja });
  };
  const handleSucursalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateState({ sucursalSeleccionadaId: e.target.value });
  };
  const handleSesionCerrarChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const sesion =
      state.sesionesActivas.find((s) => s.id === e.target.value) || null;
    updateState({ sesionSeleccionadaCerrar: sesion });
  };
  const handleMontoVueltoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({ montoVuelto: e.target.value });
  };
  const handleTipoVueltoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateState({
      tipoVueltoSeleccionado: e.target.value as TipoVuelto,
      montoVuelto: "",
    });
  };
  const handleObservacionesChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    updateState({ observaciones: e.target.value });
  };
  const handleSaldoInicialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({ saldoInicial: e.target.value });
  };
  const handleSaldoFinalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({ saldoFinal: e.target.value });
  };

  const handleAbrirModal = useCallback(() => {
    updateState({
      mostrarModalApertura: true,
      saldoInicial: "",
      observaciones: "",
      procesando: false,
      cajaSeleccionada:
        state.cajasDisponibles.length > 0 ? state.cajasDisponibles[0] : null,
      sucursalSeleccionadaId:
        state.sucursales.length > 0 ? state.sucursales[0].id : "",
    });
  }, [state.cajasDisponibles, state.sucursales, updateState]);

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
      showToast(
        "Esta caja ya está abierta. Por favor cierre la sesión existente.",
        "warning"
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
    if (!state.saldoInicial || parseFloat(state.saldoInicial) < 0) {
      showToast("Por favor ingresa un saldo inicial válido", "warning");
      return;
    }
    if (!state.sucursalSeleccionadaId) {
      showToast("Por favor selecciona una sucursal", "warning");
      return;
    }
    if (!user) {
      showToast("Usuario no autenticado", "error");
      return;
    }
    try {
      updateState({ procesando: true });

      // Verificar existencia en tabla usuarios para evitar error FK
      const userValid = await verificarUsuarioEnTablaUsers();
      if (!userValid) {
        updateState({ procesando: false });
        return;
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("sesiones_caja")
        .insert([
          {
            caja_id: state.cajaSeleccionada.id,
            usuario_id: user.id,
            sucursal_id: state.sucursalSeleccionadaId,
            estado: "abierta",
            saldo_inicial: parseFloat(state.saldoInicial),
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

      const sesiones = await cargarSesionesActivas();

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
    verificarUsuarioEnTablaUsers,
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
    // Validar montoVuelto según tipo seleccionado
    if (!state.montoVuelto || parseFloat(state.montoVuelto) < 0) {
      showToast("Por favor ingresa un monto válido para el vuelto", "warning");
      return;
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

      const sesiones = await cargarSesionesActivas();

      updateState({
        sesionesActivas: sesiones,
        mostrarModalCierre: false,
        saldoFinal: "",
        observaciones: "",
        cajaSeleccionada: null,
        sesionSeleccionadaCerrar: null,
        procesando: false,
        montoVuelto: "",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error desconocido al cerrar la caja";
      updateState({ error: errorMessage });
      showToast(errorMessage, "error");
      updateState({ procesando: false });
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

  if (state.cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
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
            <h2 className="text-xl font-semibold">Abrir Nueva Caja</h2>
          </div>
          <div className="flex gap-2 w-full md:w-auto flex-col md:flex-row">
            <select
              className="block w-full md:w-auto p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={state.cajaSeleccionada?.id || ""}
              onChange={handleCajaChange}
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
                    Sucursal: {sesion.sucursal?.nombre || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Saldo Inicial: C${sesion.saldo_inicial.toFixed(2)}
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
              onChange={handleSaldoInicialChange}
              placeholder="0.00"
              required
              className="mt-1"
              disabled={state.procesando}
            />
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
            <Label htmlFor="observacionesApertura">
              Observaciones (Opcional)
            </Label>
            <Textarea
              id="observacionesApertura"
              value={state.observaciones}
              onChange={handleObservacionesChange}
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
              !state.saldoInicial ||
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
              "Confirmar Apertura"
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
            <Label htmlFor="tipoVueltoSeleccionado">
              Selecciona tipo de vuelto
            </Label>
            <select
              id="tipoVueltoSeleccionado"
              value={state.tipoVueltoSeleccionado}
              onChange={handleTipoVueltoChange}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1"
              disabled={state.procesando}
            >
              <option value="monto_efectivo">Efectivo</option>
              <option value="monto_tarjeta">Tarjeta</option>
              <option value="monto_transferencia">Transferencia</option>
              <option value="monto_otros">Otros</option>
            </select>
          </div>

          <div>
            <Label htmlFor="montoVuelto">Monto del vuelto</Label>
            <TextInput
              id="montoVuelto"
              type="number"
              min="0"
              step="0.01"
              value={state.montoVuelto}
              onChange={handleMontoVueltoChange}
              placeholder="0.00"
              className="mt-1"
              disabled={state.procesando}
            />
          </div>

          <div>
            <Label htmlFor="saldoFinal">Saldo Final en Efectivo</Label>
            <TextInput
              id="saldoFinal"
              type="number"
              min="0"
              step="0.01"
              value={state.saldoFinal}
              onChange={handleSaldoFinalChange}
              placeholder="0.00"
              required
              className="mt-1"
              disabled={state.procesando}
            />
          </div>

          <div>
            <Label htmlFor="observacionesCierre">
              Observaciones (Opcional)
            </Label>
            <Textarea
              id="observacionesCierre"
              rows={3}
              value={state.observaciones}
              onChange={handleObservacionesChange}
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
                !state.saldoFinal || !state.montoVuelto || state.procesando
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
    </div>
  );
};

export default GestionCaja;
