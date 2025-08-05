import React, { useState } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { Wifi, WifiOff, CreditCard, Smartphone, DollarSign, Settings, FileText, CheckCircle } from 'lucide-react';

export function POSIntegration() {
  const [activeProvider, setActiveProvider] = useState('sumup');
  
  const { data: terminals, loading: terminalsLoading } = useSupabaseData<any>('pos_terminals', '*, sucursales(nombre)');
  const { data: providers, loading: providersLoading } = useSupabaseData<any>('payment_providers', '*');
  const { data: transactions, loading: transactionsLoading } = useSupabaseData<any>('pos_transactions', '*, pos_terminals(terminal_name)');
  const { data: syncLogs } = useSupabaseData<any>('pos_sync_log', '*, pos_terminals(terminal_name)');
  const { data: cafFiles } = useSupabaseData<any>('caf_files', '*');
  const { data: foliosDisponibles } = useSupabaseData<any>('folios_electronicos', '*', { usado: false });

  const getProviderIcon = (providerType: string) => {
    switch (providerType) {
      case 'mercado_pago': return '💳';
      case 'sumup': return '📱';
      case 'transbank': return '🏦';
      case 'getnet': return '💰';
      default: return '💳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (terminalsLoading || providersLoading || transactionsLoading) {
    return <div className="text-center py-4">Cargando integración POS...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Payment Providers Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Proveedores de Pago Configurados</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((provider) => (
            <div 
              key={provider.id} 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                provider.is_active 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{getProviderIcon(provider.provider_type)}</span>
                <div className={`w-3 h-3 rounded-full ${
                  provider.is_active ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>
              <h4 className="font-medium text-gray-900">{provider.name}</h4>
              <p className="text-sm text-gray-600 capitalize">
                {provider.provider_type.replace('_', ' ')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {provider.is_active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* POS Terminals Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Terminales POS</h3>
        <div className="space-y-4">
          {terminals.map((terminal) => (
            <div key={terminal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {terminal.status === 'online' ? (
                    <Wifi className="w-5 h-5 text-green-600" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium text-gray-900">{terminal.terminal_name}</span>
                </div>
                <span className="text-sm text-gray-600">
                  {terminal.sucursales?.nombre} - {terminal.terminal_code}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(terminal.status)}`}>
                  {terminal.status === 'online' ? 'En línea' : 
                   terminal.status === 'offline' ? 'Desconectado' : 'Mantenimiento'}
                </span>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SII CAF Integration Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Integración SII - Folios Electrónicos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Archivos CAF</p>
                <p className="text-2xl font-bold text-blue-600">{cafFiles.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Folios Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{foliosDisponibles.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <Wifi className="w-8 h-8 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Sincronización</p>
                <p className="text-sm font-medium text-purple-600">Automática</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Estado de Sincronización CAF → POS</h4>
          <div className="space-y-2">
            {terminals.map((terminal) => (
              <div key={terminal.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{terminal.terminal_name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✓ CAF Sincronizado</span>
                  <span className="text-blue-600">{foliosDisponibles.length} folios</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transacciones Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terminal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {transaction.pos_terminals?.terminal_name}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    ${transaction.amount.toLocaleString('es-CL')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                    {transaction.payment_method === 'card' ? 'Tarjeta' : 
                     transaction.payment_method === 'cash' ? 'Efectivo' : 'Digital'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status === 'approved' ? 'Aprobada' :
                       transaction.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(transaction.created_at).toLocaleString('es-CL')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sync Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Estado de Sincronización</h3>
        <div className="space-y-3">
          {syncLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  log.status === 'success' ? 'bg-green-500' : 
                  log.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium text-gray-900">
                  {log.pos_terminals?.terminal_name}
                </span>
                <span className="text-sm text-gray-600">
                  {log.sync_type === 'products' ? 'Productos' :
                   log.sync_type === 'transactions' ? 'Transacciones' :
                   log.sync_type === 'promotions' ? 'Promociones' : log.sync_type}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {log.records_count} registros
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                  {log.status === 'success' ? 'Exitoso' :
                   log.status === 'failed' ? 'Fallido' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}