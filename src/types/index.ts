export interface UserMetadata {
  role?: string;
  full_name?: string;
  avatar_url?: string;
  [key: string]: any;
}

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
  empresa_id?: string;
  user_metadata?: UserMetadata;
  role?: string; // Para compatibilidad con código existente
}

export interface Merma {
  id: string;
  sucursal_id: string;
  producto_id: string;
  tipo?: string | null;
  cantidad: number;
  observacion?: string | null;
  fecha?: string | Date | null;
  empresa_id?: string | null;
}

export interface MermaConNombres extends Merma {
  sucursal_nombre: string;
  producto_nombre: string;
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
  empresa_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo: string;
  stock: number;
  stock_minimo: number;
  destacado: boolean;
  activo: boolean;
  unidad: string;
  sucursal_id: string;
  categoria_id: string;
}

export interface ProductoAgregado {
  id: string;
  nombre: string;
  descripcion: string;
  precio_promocion: number;
  sku: string;
  sucursales: string[];
  sucursalNombre: string;
  producto: Producto;
  precio_real: number;
}

export interface Promocion {
  id: string;
  empresa_id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  disponible: boolean;
  precio_prom: number;
  productos_id: string[];
  sucursales_id: string[]
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
  tipo: "ingreso" | "retiro";
  monto: number;
  observacion?: string;
  sucursal_id?: string;
  fecha: string;
}
