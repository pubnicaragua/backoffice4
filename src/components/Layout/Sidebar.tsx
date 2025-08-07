import React from 'react';
import { 
  BarChart3, 
  FileText, 
  Users, 
  ShoppingCart, 
  Package, 
  Truck,
  X,
  Tag,
  Send,
  Monitor,
  Bell,
  ShoppingBasket
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { id: 'general', label: 'General', icon: BarChart3 },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'pedidos', label: 'Recepción de pedidos', icon: Truck },
  { id: 'despachos', label: 'Gestión de despachos', icon: Send },
  { id: 'cajas', label: 'Gestión de Cajas', icon: ShoppingBasket },
  { id: 'pos', label: 'Información de POS', icon: Monitor },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'promociones', label: 'Promociones', icon: Tag },
  { id: 'colaboradores', label: 'Colaboradores', icon: Users },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
];

export function Sidebar({ currentView, onViewChange, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile and desktop when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar - Hidden by default, shows as overlay when opened */}
      <div className={`
        fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header with logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img 
              src="/logo_negro.svg" 
              alt="Solvendo" 
              className="h-8"
            />
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange(item.id);
                      // Auto-close after selection
                      onToggle();
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors text-sm
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}