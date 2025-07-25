import React from 'react';
import { Bell, Package, Monitor, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useSupabaseData, useSupabaseUpdate } from '../../hooks/useSupabaseData';

export function NotificacionesView() {
  const { data: notificaciones, loading, refetch } = useSupabaseData<any>('notificaciones', '*');
  const { update } = useSupabaseUpdate('notificaciones');

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'stock_bajo':
        return <Package className="w-6 h-6 text-orange-500" />;
      case 'inconsistencia_pos':
        return <Monitor className="w-6 h-6 text-red-500" />;
      default:
        return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getPriorityColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'border-l-red-500 bg-red-50';
      case 'media':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const markAsRead = async (notificationId: string) => {
    console.log('✅ NOTIFICACIÓN: Marcando como leída', notificationId);
    await update(notificationId, { leida: true });
    refetch();
  };

  const markAllAsRead = async () => {
    console.log('✅ NOTIFICACIONES: Marcando todas como leídas');
    for (const notification of notificaciones.filter(n => !n.leida)) {
      await markAsRead(notification.id);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando notificaciones...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Notificaciones</h1>
          {notificaciones.filter(n => !n.leida).length > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
              {notificaciones.filter(n => !n.leida).length} nuevas
            </span>
          )}
        </div>
        
        {notificaciones.filter(n => !n.leida).length > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Marcar todas como leídas</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notificaciones.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay notificaciones</p>
          </div>
        ) : (
          notificaciones.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border-l-4 ${getPriorityColor(notification.prioridad)} ${
                notification.leida ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getIcon(notification.tipo)}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {notification.titulo}
                      {!notification.leida && (
                        <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                      )}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {notification.mensaje}
                    </p>
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(notification.created_at).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
                
                {!notification.leida && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Marcar como leída"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}