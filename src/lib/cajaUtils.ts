import { supabase } from "./supabase";
import {
  Caja,
  SesionCaja,
  AperturaCajaParams,
  CierreCajaParams,
} from "../types/cajas";

/**
 * Obtiene todas las cajas de una sucursal específica
 * @param sucursalId ID de la sucursal
 * @returns Lista de cajas
 */
export const obtenerCajasPorSucursal = async (
  sucursalId: string
): Promise<Caja[]> => {
  try {
    const { data, error } = await supabase
      .from("cajas")
      .select("*")
      .eq("sucursal_id", sucursalId)
      .eq("activa", true)
      .order("nombre");

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener cajas por sucursal:", error);
    throw error;
  }
};

/**
 * Obtiene las sesiones de caja activas para una sucursal
 * @param sucursalId ID de la sucursal
 * @returns Lista de sesiones de caja activas
 */
export const obtenerSesionesActivas = async (
  sucursalId: string
): Promise<SesionCaja[]> => {
  try {
    const { data, error } = await supabase
      .from("sesiones_caja")
      .select("*")
      .eq("sucursal_id", sucursalId)
      .eq("estado", "abierta")
      .order("abierta_en", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener sesiones activas:", error);
    throw error;
  }
};

/**
 * Obtiene la sesión activa de un usuario
 * @param usuarioId ID del usuario
 * @returns Sesión activa o null si no hay ninguna
 */
export const obtenerSesionActivaUsuario = async (
  usuarioId: string
): Promise<SesionCaja | null> => {
  try {
    const { data, error } = await supabase
      .from("sesiones_caja")
      .select("*")
      .eq("usuario_id", usuarioId)
      .eq("estado", "abierta")
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al obtener sesión activa del usuario:", error);
    throw error;
  }
};

/**
 * Abre una nueva sesión de caja
 * @param params Parámetros para abrir la caja
 * @returns La sesión de caja creada
 */
export const abrirCaja = async (
  params: AperturaCajaParams
): Promise<SesionCaja> => {
  try {
    const { data: caja, error: errorCaja } = await supabase
      .from("cajas")
      .select("sucursal_id")
      .eq("id", params.caja_id)
      .single();

    if (errorCaja || !caja) {
      throw new Error("No se pudo obtener la información de la caja");
    }

    const { data, error } = await supabase
      .from("sesiones_caja")
      .insert([
        {
          ...params,
          sucursal_id: caja.sucursal_id,
          estado: "abierta",
          abierta_en: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al abrir caja:", error);
    throw error;
  }
};

/**
 * Cierra una sesión de caja
 * @param params Parámetros para cerrar la caja
 * @returns La sesión de caja actualizada
 */
export const cerrarCaja = async (
  params: CierreCajaParams
): Promise<SesionCaja> => {
  try {
    const { data, error } = await supabase
      .from("sesiones_caja")
      .update({
        estado: "cerrada",
        saldo_final: params.saldo_final,
        cerrada_en: new Date().toISOString(),
        observaciones: params.observaciones,
      })
      .eq("id", params.sesion_id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al cerrar caja:", error);
    throw error;
  }
};

/**
 * Fuerza el cierre de una sesión de caja (para administradores)
 * @param sesionId ID de la sesión a forzar cierre
 * @param motivo Motivo por el que se fuerza el cierre
 * @returns La sesión de caja actualizada
 */
export const forzarCierreCaja = async (
  sesionId: string,
  motivo: string
): Promise<SesionCaja> => {
  try {
    const { data, error } = await supabase
      .from("sesiones_caja")
      .update({
        estado: "cerrada",
        cerrada_en: new Date().toISOString(),
        observaciones: `Cierre forzado: ${motivo}`,
      })
      .eq("id", sesionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al forzar cierre de caja:", error);
    throw error;
  }
};

/**
 * Obtiene el historial de sesiones de caja
 * @param filtros Filtros para la consulta
 * @returns Lista de sesiones de caja que coinciden con los filtros
 */
export const obtenerHistorialSesiones = async (filtros: {
  sucursalId?: string;
  cajaId?: string;
  usuarioId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: "abierta" | "cerrada" | "pendiente_aprobacion";
  limite?: number;
}): Promise<SesionCaja[]> => {
  try {
    let query = supabase
      .from("sesiones_caja")
      .select("*")
      .order("abierta_en", { ascending: false });

    if (filtros.sucursalId) {
      query = query.eq("sucursal_id", filtros.sucursalId);
    }

    if (filtros.cajaId) {
      query = query.eq("caja_id", filtros.cajaId);
    }

    if (filtros.usuarioId) {
      query = query.eq("usuario_id", filtros.usuarioId);
    }

    if (filtros.fechaInicio) {
      query = query.gte("abierta_en", filtros.fechaInicio);
    }

    if (filtros.fechaFin) {
      // Añadir un día completo para incluir la fecha de fin
      const fechaFin = new Date(filtros.fechaFin);
      fechaFin.setDate(fechaFin.getDate() + 1);
      query = query.lt("abierta_en", fechaFin.toISOString());
    }

    if (filtros.estado) {
      query = query.eq("estado", filtros.estado);
    }

    if (filtros.limite) {
      query = query.limit(filtros.limite);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error al obtener historial de sesiones:", error);
    throw error;
  }
};

/**
 * Verifica si un usuario puede abrir una caja
 * @param usuarioId ID del usuario
 * @param cajaId ID de la caja
 * @returns true si el usuario puede abrir la caja, false en caso contrario
 */
export const puedeAbrirCaja = async (
  usuarioId: string,
  cajaId: string
): Promise<boolean> => {
  try {
    // Verificar si el usuario ya tiene una caja abierta
    const sesionActiva = await obtenerSesionActivaUsuario(usuarioId);
    if (sesionActiva) {
      throw new Error("Ya tienes una caja abierta");
    }

    // Aquí puedes agregar más validaciones según tus reglas de negocio
    // Por ejemplo, verificar si el usuario tiene permisos para abrir la caja
    // o si la caja ya está siendo utilizada por otro usuario

    const { data, error } = await supabase
      .from("sesiones_caja")
      .select("id")
      .eq("caja_id", cajaId)
      .eq("estado", "abierta")
      .maybeSingle();

    if (error) throw error;

    // Si hay una sesión activa para esta caja, no se puede abrir
    return !data;
  } catch (error) {
    console.error("Error al verificar si se puede abrir la caja:", error);
    throw error;
  }
};
