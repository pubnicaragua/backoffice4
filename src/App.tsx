import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import GeneralDashboard from './components/Dashboard/GeneralDashboard';
import { Documentos } from './components/Documentos/Documentos';
import { Promociones } from './components/Promociones/Promociones';
import { Colaboradores } from './components/Colaboradores/Colaboradores';
import { VentasDashboard } from './components/Ventas/VentasDashboard';
import { ProductosTotales } from './components/Inventario/ProductosTotales';
import { RecepcionPedidos } from './components/Pedidos/RecepcionPedidos';
import { GestionDespachos } from './components/GestionDespachos/GestionDespachos';
import { POSInfo } from './components/POS/POSInfo';
import { NotificacionesView } from './components/Notificaciones/NotificacionesView';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('general');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'general':
        return <GeneralDashboard />;
      case 'ventas':
        return <VentasDashboard />;
      case 'inventario':
        return <ProductosTotales />;
      case 'pedidos':
        return <RecepcionPedidos />;
      case 'despachos':
        return <GestionDespachos />;
      case 'pos':
        return <POSInfo />;
      case 'documentos':
        return <Documentos />;
      case 'promociones':
        return <Promociones />;
      case 'colaboradores':
        return <Colaboradores />;
      case 'notificaciones':
        return <NotificacionesView />;
      default:
        return <GeneralDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Hidden by default, overlay when open */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      
      {/* Main content area - Full width, no offset */}
      <div className="w-full">
        <Header 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          currentView={currentView}
        />
        <main className="bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;