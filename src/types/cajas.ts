// Tipos relacionados con la gestión de cajas y sesiones

export interface Caja {
  id: string;
  sucursal_id: string;
  nombre: string;
  activa: boolean;
  creada_en: string;
  actualizada_en?: string;
}

export interface SesionCaja {
  id: string;
  caja_id: string;
  usuario_id: string;
  saldo_inicial: number;
  saldo_final: number | null;
  abierta_en: string;
  cerrada_en: string | null;
  estado: 'abierta' | 'cerrada' | 'pendiente_aprobacion';
  observaciones?: string;
  sucursal_id: string;
}

export interface Usuario {
  id: string;
  email: string;
  user_metadata?: {
    nombre_completo?: string;
  };
}

export interface Sucursal {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa: boolean;
}

// Tipos para las operaciones de caja
export interface AperturaCajaParams {
  caja_id: string;
  saldo_inicial: number;
  observaciones?: string;
}

export interface CierreCajaParams {
  sesion_id: string;
  saldo_final: number;
  observaciones?: string;
}

// Estado global de cajas
export interface EstadoCajas {
  cajas: Caja[];
  sesionesActivas: SesionCaja[];
  sucursales: Sucursal[];
  cargando: boolean;
  error: string | null;
}
