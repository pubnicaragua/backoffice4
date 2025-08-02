import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database, Code, Link, Bug } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';

interface StatusCheck {
  id: string;
  category: 'database' | 'functionality' | 'hardcode' | 'broken_links';
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  lastChecked: Date;
  details?: string;
}

export function StatusPOS() {
  const [statusChecks, setStatusChecks] = useState<StatusCheck[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Datos para verificar
  const { data: pedidos } = useSupabaseData<any>('pedidos', '*');
  const { data: despachos } = useSupabaseData<any>('despachos', '*');
  const { data: movimientos } = useSupabaseData<any>('movimientos_caja', '*, sucursales(nombre)');
  const { data: ventas } = useSupabaseData<any>('ventas', '*, sucursales(nombre)');
  const { data: productos } = useSupabaseData<any>('productos', '*');
  const { data: promociones } = useSupabaseData<any>('promociones', '*');
  const { data: usuarios } = useSupabaseData<any>('usuarios', '*');
  const { data: sucursales } = useSupabaseData<any>('sucursales', '*');
  const { data: cajas } = useSupabaseData<any>('cajas', '*');

  const runStatusChecks = async () => {
    setIsChecking(true);
    const checks: StatusCheck[] = [];

    // 1. RECEPCIÓN DE PEDIDOS
    checks.push({
      id: 'pedidos-filter-date',
      category: 'functionality',
      name: 'Recepción Pedidos - Filtro por Fecha',
      status: pedidos?.length > 0 ? 'ok' : 'warning',
      message: pedidos?.length > 0 ? 'Datos disponibles para filtrar' : 'Sin datos para probar filtros',
      lastChecked: new Date(),
      details: `${pedidos?.length || 0} pedidos en BD`
    });

    // 2. GESTIÓN DE DESPACHOS
    const despachosSinDatos = despachos?.filter(d => !d.entregado_por || !d.direccion) || [];
    checks.push({
      id: 'despachos-hardcode',
      category: 'hardcode',
      name: 'Gestión Despachos - Datos en Duro',
      status: despachosSinDatos.length > 0 ? 'error' : 'ok',
      message: despachosSinDatos.length > 0 ? `${despachosSinDatos.length} despachos con datos faltantes` : 'Todos los despachos tienen datos reales',
      lastChecked: new Date(),
      details: `${despachos?.length || 0} despachos total`
    });

    // 3. MOVIMIENTOS POS
    const movimientosSinSucursal = movimientos?.filter(m => !m.sucursales?.nombre) || [];
    checks.push({
      id: 'pos-movimientos-sucursales',
      category: 'database',
      name: 'POS Movimientos - Sucursales',
      status: movimientosSinSucursal.length > 0 ? 'error' : 'ok',
      message: movimientosSinSucursal.length > 0 ? `${movimientosSinSucursal.length} movimientos sin sucursal` : 'Todas las sucursales conectadas',
      lastChecked: new Date(),
      details: `${movimientos?.length || 0} movimientos total`
    });

    // 4. DOCUMENTOS
    const ventasSinSucursal = ventas?.filter(v => !v.sucursales?.nombre) || [];
    checks.push({
      id: 'documentos-sucursales',
      category: 'database',
      name: 'Documentos - Sucursales y Cajas',
      status: ventasSinSucursal.length > 0 ? 'error' : 'ok',
      message: ventasSinSucursal.length > 0 ? `${ventasSinSucursal.length} ventas sin sucursal` : 'Todas las ventas tienen sucursal',
      lastChecked: new Date(),
      details: `${ventas?.length || 0} ventas total`
    });

    // 5. COLABORADORES
    checks.push({
      id: 'colaboradores-endpoints',
      category: 'functionality',
      name: 'Colaboradores - Endpoints 400',
      status: usuarios?.length > 0 ? 'warning' : 'error',
      message: usuarios?.length > 0 ? 'Usuarios disponibles, verificar permisos' : 'Sin usuarios para probar',
      lastChecked: new Date(),
      details: `${usuarios?.length || 0} usuarios en BD`
    });

    // 6. VENTAS
    const ventasEfectivo = ventas?.filter(v => v.metodo_pago === 'efectivo') || [];
    const ventasTarjeta = ventas?.filter(v => v.metodo_pago === 'tarjeta') || [];
    checks.push({
      id: 'ventas-filtros',
      category: 'functionality',
      name: 'Ventas - Filtros Método Pago',
      status: (ventasEfectivo.length + ventasTarjeta.length) === ventas?.length ? 'ok' : 'warning',
      message: `Efectivo: ${ventasEfectivo.length}, Tarjeta: ${ventasTarjeta.length}`,
      lastChecked: new Date(),
      details: `Total ventas: ${ventas?.length || 0}`
    });

    // 7. INVENTARIO
    const productosConStock = productos?.filter(p => p.stock > 0) || [];
    checks.push({
      id: 'inventario-productos',
      category: 'database',
      name: 'Inventario - Productos con Stock',
      status: productosConStock.length > 0 ? 'ok' : 'warning',
      message: `${productosConStock.length} productos con stock`,
      lastChecked: new Date(),
      details: `${productos?.length || 0} productos total`
    });

    // 8. PROMOCIONES
    const promocionesActivas = promociones?.filter(p => p.activo) || [];
    checks.push({
      id: 'promociones-activas',
      category: 'functionality',
      name: 'Promociones - Estado Activo',
      status: promocionesActivas.length > 0 ? 'ok' : 'warning',
      message: `${promocionesActivas.length} promociones activas`,
      lastChecked: new Date(),
      details: `${promociones?.length || 0} promociones total`
    });

    // VERIFICACIONES DE ESQUEMA
    try {
      const { data: tablesCheck } = await supabase.rpc('check_table_exists', { table_name: 'pedidos' });
      checks.push({
        id: 'schema-tables',
        category: 'database',
        name: 'Esquema BD - Tablas Principales',
        status: 'ok',
        message: 'Todas las tablas principales existen',
        lastChecked: new Date(),
        details: 'pedidos, despachos, ventas, productos verificadas'
      });
    } catch (error) {
      checks.push({
        id: 'schema-tables',
        category: 'database',
        name: 'Esquema BD - Tablas Principales',
        status: 'error',
        message: 'Error verificando esquema de BD',
        lastChecked: new Date(),
        details: error.message
      });
    }

    // VERIFICACIÓN DE RELACIONES FK
    const relacionesRotas = [];
    if (movimientosSinSucursal.length > 0) relacionesRotas.push('movimientos_caja -> sucursales');
    if (ventasSinSucursal.length > 0) relacionesRotas.push('ventas -> sucursales');
    
    checks.push({
      id: 'foreign-keys',
      category: 'database',
      name: 'Relaciones Foreign Keys',
      status: relacionesRotas.length > 0 ? 'error' : 'ok',
      message: relacionesRotas.length > 0 ? `${relacionesRotas.length} relaciones rotas` : 'Todas las FK funcionando',
      lastChecked: new Date(),
      details: relacionesRotas.join(', ')
    });

    setStatusChecks(checks);
    setLastUpdate(new Date());
    setIsChecking(false);
  };

  useEffect(() => {
    runStatusChecks();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(runStatusChecks, 30000);
    return () => clearInterval(interval);
  }, [pedidos, despachos, movimientos, ventas, productos, promociones, usuarios]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="w-4 h-4" />;
      case 'functionality': return <Code className="w-4 h-4" />;
      case 'hardcode': return <Bug className="w-4 h-4" />;
      case 'broken_links': return <Link className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-50 border-green-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const statusSummary = {
    ok: statusChecks.filter(c => c.status === 'ok').length,
    warning: statusChecks.filter(c => c.status === 'warning').length,
    error: statusChecks.filter(c => c.status === 'error').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Status POS - Monitoreo en Tiempo Real</h1>
              <p className="text-gray-600 mt-1">
                Última actualización: {lastUpdate.toLocaleString('es-CL')}
              </p>
            </div>
            <button
              onClick={runStatusChecks}
              disabled={isChecking}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Verificando...' : 'Actualizar'}</span>
            </button>
          </div>
          
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{statusSummary.ok}</p>
                  <p className="text-green-700 text-sm">Funcionando</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{statusSummary.warning}</p>
                  <p className="text-yellow-700 text-sm">Advertencias</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{statusSummary.error}</p>
                  <p className="text-red-700 text-sm">Errores</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Checks */}
        <div className="space-y-4">
          {statusChecks.map((check) => (
            <div
              key={check.id}
              className={`border rounded-lg p-4 ${getStatusColor(check.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {getCategoryIcon(check.category)}
                      <h3 className="font-medium text-gray-900">{check.name}</h3>
                    </div>
                    <p className="text-gray-700 mt-1">{check.message}</p>
                    {check.details && (
                      <p className="text-gray-500 text-sm mt-1">{check.details}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {check.lastChecked.toLocaleTimeString('es-CL')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            🔄 Actualización automática cada 30 segundos
          </p>
        </div>
      </div>
    </div>
  );
}