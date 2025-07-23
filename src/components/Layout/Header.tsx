import React, { useState, useEffect } from 'react';
import { Menu, Clock, User, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { NotificationsPanel } from './NotificationsPanel';

interface HeaderProps {
  onMenuToggle: () => void;
  currentView: string;
}

export function Header({ onMenuToggle, currentView }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { data: notificaciones, loading: notifLoading, refetch: refetchNotifications } = useSupabaseData<any>('notificaciones', '*', { leida: false });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'general': return 'General';
      case 'ventas': return 'Ventas';
      case 'inventario': return 'Inventario';
      case 'pedidos': return 'Recepción de pedidos';
      case 'despachos': return 'Gestión de despachos';
      case 'pos': return 'Información de POS';
      case 'documentos': return 'Documentos';
      case 'promociones': return 'Promociones';
      case 'colaboradores': return 'Colaboradores';
      default: return 'General';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative">
      <div className="flex items-center">
        {/* Left side - Menu and Title */}
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          
          <h1 className="text-xl font-semibold text-gray-900">{getViewTitle(currentView)}</h1>
        </div>
        
        {/* Center - Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <img 
            src="/logo_negro.svg" 
            alt="Solvendo" 
            className="h-8"
          />
        </div>
        
        {/* Right side - Time and User */}
        <div className="flex items-center space-x-6 flex-1 justify-end">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 rounded-md hover:bg-gray-100 transition-all ${notifLoading ? 'animate-pulse' : ''}`}
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {notificaciones.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {notificaciones.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <NotificationsPanel 
                notifications={notificaciones}
                onClose={() => setShowNotifications(false)}
                onRefresh={refetchNotifications}
              />
            )}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">{formatTime(currentTime)}</span>
            <Clock className="w-4 h-4" />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.nombres || 'Emilio Aguilera'}
              </p>
              <button
                onClick={signOut}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}