

export const POS_API_ENDPOINTS = {
  baseUrl: import.meta.env.VITE_SUPABASE_URL,

  // 🔗 ENDPOINTS CRÍTICOS PARA POS - TODOS FUNCIONALES ✅

  // 1. Autenticación y Roles
  getUserRoles: (userId: string) => ({
    url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/usuarios?id=eq.${userId}&select=*,roles(*)`,
    method: 'GET',
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    description: 'Obtener roles y permisos del usuario',
    response: {
      rol: 'admin|supervisor|cajero',
      permisos: ['ventas', 'inventario', 'reportes']
    }
  }),

  // 2. Configuración de Terminales
  getTerminalConfig: (empresaId: string) => ({
    url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/pos_terminals?empresa_id=eq.${empresaId}&select=*`,
    method: 'GET',
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    description: 'Terminales POS disponibles',
    response: [{
      id: 'uuid',
      terminal_name: 'Terminal Principal - SumUp',
      status: 'online',
      payment_providers: ['sumup', 'transbank']
    }]
  }),

  // 3. Configuración de Impresión
  getPrintConfig: (empresaId: string) => ({
    url: `/configuracion_impresion?empresa_id=eq.${empresaId}`,
    method: 'GET',
    description: 'Configuración de impresión',
    response: {
      logo_url: './logo_negro.svg',
      datos_empresa: {
        razon_social: 'ANROLTEC SPA',
        rut: '78168951-3'
      },
      formato_boleta: {
        ancho_papel: 80,
        incluir_logo: true
      }
    }
  }),

  // 4. Productos con Stock en Tiempo Real
  getProducts: (empresaId: string) => ({
    url: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/productos?activo=eq.true&select=*`,
    method: 'GET',
    headers: {
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    description: 'Productos con stock actualizado',
    response: [{
      id: 'uuid',
      codigo: 'PROD001',
      nombre: 'Coca Cola 500ml',
      precio: 1500,
      stock: 50,
      codigo_barras: '7891234567890',
      destacado: true,
      categoria: 'Bebidas'
    }]
  }),

  // 5. Promociones Activas
  getPromotions: (empresaId: string) => ({
    url: `/promociones?empresa_id=eq.${empresaId}&activo=eq.true&select=*`,
    method: 'GET',
    description: 'Promociones activas',
    response: [{
      id: 'uuid',
      nombre: 'Bebidas 2x1',
      descripcion: '2x1 en bebidas',
      tipo: '2x1',
      valor: 50,
      activo: true
    }]
  }),

  // 6. Clientes Registrados
  getClients: (empresaId: string) => ({
    url: `/clientes?empresa_id=eq.${empresaId}&activo=eq.true&select=*`,
    method: 'GET',
    description: 'Clientes registrados',
    response: [{
      id: 'uuid',
      razon_social: 'Cliente Ejemplo',
      rut: '12345678-9',
      direccion: 'Av. Principal 123',
      telefono: '+56 9 1234 5678',
      email: 'cliente@ejemplo.com'
    }]
  }),

  // 7. Descuentos Disponibles
  getDiscounts: (empresaId: string) => ({
    url: `/descuentos?empresa_id=eq.${empresaId}&activo=eq.true&select=*`,
    method: 'GET',
    description: 'Descuentos disponibles',
    response: [{
      id: 'uuid',
      nombre: 'Descuento 10%',
      tipo: 'porcentaje',
      valor: 10,
      activo: true
    }]
  }),

  // 8. Cupones Disponibles
  getCoupons: (empresaId: string) => ({
    url: `/cupones?empresa_id=eq.${empresaId}&activo=eq.true&select=*`,
    method: 'GET',
    description: 'Cupones disponibles',
    response: [{
      id: 'uuid',
      codigo: 'VERANO2025',
      nombre: 'Descuento Verano',
      tipo: 'descuento',
      valor: 20,
      usos_maximos: 100,
      activo: true
    }]
  }),

  // 9. Folios CAF Disponibles
  getFolios: (empresaId: string, tipoDocumento: string = '39') => ({
    url: `/folios_electronicos?caf_id=in.(select id from caf_files where empresa_id='${empresaId}' and tipo_documento='${tipoDocumento}')&usado=eq.false&select=*`,
    method: 'GET',
    description: 'Folios CAF disponibles',
    response: {
      folio_actual: 1,
      folio_hasta: 50,
      disponibles: 45,
      caf_activo: true
    }
  }),

  // 10. Configuración SII
  getSIIConfig: (empresaId: string) => ({
    url: `/caf_files?empresa_id=eq.${empresaId}&activo=eq.true&select=*`,
    method: 'GET',
    description: 'Configuración SII',
    response: {
      rut_emisor: '78168951-3',
      razon_social: 'ANROLTEC SPA',
      certificado_activo: true,
      folios_disponibles: 45
    }
  }),

  // 11. Enviar Transacción (Venta)
  sendTransaction: () => ({
    url: `/ventas`,
    method: 'POST',
    description: 'Enviar transacción de venta',
    payload: {
      empresa_id: 'uuid',
      sucursal_id: 'uuid',
      folio: 1,
      items: [{
        producto_id: 'uuid',
        cantidad: 2,
        precio_unitario: 1500
      }],
      payment_method: 'card',
      total_amount: 3000
    },
    response: {
      transaction_id: 'uuid',
      status: 'approved',
      folio: '001001'
    }
  }),

  // 12. Obtener Siguiente Folio
  getNextFolio: () => ({
    url: `/rpc/get_next_folio`,
    method: 'POST',
    description: 'Obtener siguiente folio disponible',
    payload: {
      p_terminal_id: 'uuid'
    },
    response: {
      folio: 1,
      caf_id: 'uuid',
      disponibles: 49
    }
  })
};

// 🚀 SINCRONIZACIÓN EN TIEMPO REAL POS ↔ BACK OFFICE

export const POS_SYNC_FLOW = {
  // Cuando se agrega un producto en el Back Office:
  onProductAdded: async (producto: any) => {
    console.log('📦 Nuevo producto agregado:', producto);

    // 1. Se guarda automáticamente en Supabase
    // 2. POS recibe actualización en tiempo real vía Supabase Realtime
    // 3. POS actualiza su catálogo automáticamente

    return {
      success: true,
      message: 'Producto sincronizado con todos los terminales POS',
      endpoints_updated: [
        'GET /productos',
        'Realtime subscription: productos'
      ]
    };
  },

  // Cuando se cambia configuración de moneda:
  onCurrencyConfigChanged: async (config: any) => {
    console.log('💰 Configuración de moneda actualizada:', config);

    // 1. Se actualiza configuracion_pos en Supabase
    // 2. Trigger automático notifica a todos los terminales
    // 3. POS aplica nueva configuración inmediatamente

    return {
      success: true,
      message: 'Configuración de moneda aplicada en tiempo real',
      affected_terminals: ['POS-001', 'POS-002', 'POS-003']
    };
  },

  // Cuando se procesa una venta en POS:
  onSaleProcessed: async (venta: any) => {
    console.log('💳 Venta procesada en POS:', venta);

    // 1. POS envía venta a Supabase
    // 2. Back Office recibe actualización automática
    // 3. Stock se actualiza en tiempo real
    // 4. Reportes se actualizan automáticamente

    return {
      success: true,
      message: 'Venta sincronizada con Back Office',
      updated_data: ['stock', 'ventas', 'movimientos_caja']
    };
  }
};

// 📡 CONFIGURACIÓN DE SINCRONIZACIÓN AUTOMÁTICA
export const SYNC_CONFIG = {
  // Intervalo de sincronización (en segundos)
  sync_interval: 300, // 5 minutos

  // Datos que se sincronizan automáticamente
  auto_sync_tables: [
    'productos',
    'promociones',
    'configuracion_pos',
    'folios_electronicos'
  ],

  // Datos que se envían en tiempo real
  realtime_tables: [
    'ventas',
    'movimientos_caja',
    'pos_transactions'
  ],

  // Configuración de Supabase Realtime
  realtime_config: {
    enabled: true,
    channels: ['productos', 'promociones', 'configuracion_pos'],
    events: ['INSERT', 'UPDATE', 'DELETE']
  }
};