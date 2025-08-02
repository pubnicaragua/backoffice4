export interface User {
  id: string;
  email: string;
  nombres?: string;
  apellidos?: string;
  rut?: string;
  telefono?: string;
  direccion?: string;
  activo: boolean;
  created_at: string;
}

export interface Empresa {
  id: string;
  rut: string;
  razon_social: string;
  giro?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  region?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
  created_at: string;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  tipo: string;
  unidad: string;
  activo: boolean;
  created_at: string;
}

export interface Venta {
  id: string;
  empresa_id: string;
  sucursal_id: string;
  cliente_id?: string;
  usuario_id?: string;
  folio?: string;
  tipo_dte?: string;
  metodo_pago?: string;
  total?: number;
  fecha: string;
}

export interface MovimientoCaja {
  id: string;
  empresa_id?: string;
  usuario_id?: string;
  tipo: 'ingreso' | 'retiro';
  monto: number;
  observacion?: string;
  sucursal_id?: string;
  fecha: string;
}