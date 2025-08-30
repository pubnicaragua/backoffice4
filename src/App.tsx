import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginForm } from "./components/Auth/LoginForm";
import { Sidebar } from "./components/Layout/Sidebar";
import { Header } from "./components/Layout/Header";
import GeneralDashboard from "./components/Dashboard/GeneralDashboard";
import { Documentos } from "./components/Documentos/Documentos";
import { Promociones } from "./components/Promociones/Promociones";
import { Colaboradores } from "./components/Colaboradores/Colaboradores";
import { VentasDashboard } from "./components/Ventas/VentasDashboard";
import { ProductosTotales } from "./components/Inventario/ProductosTotales";
import { RecepcionPedidos } from "./components/Pedidos/RecepcionPedidos";
import { GestionDespachos } from "./components/GestionDespachos/GestionDespachos";
import { POSInfo } from "./components/POS/POSInfo";
import { NotificacionesView } from "./components/Notificaciones/NotificacionesView";
import EstadoCajas from "./components/Cajas/EstadoCaja";
import GestionCaja from "./components/Cajas/GestionCaja";
import Mermas from "./components/Mermas/mermas";
import { Inventario } from "./components/Inventario/inventario";
import { EstablecerPassword } from './pages/EstablecerPassword';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState("general");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

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

  // ✅ CRÍTICO: Rutas públicas que NO requieren autenticación  
  if (location.pathname.startsWith('/establecer-password')) {
    return <EstablecerPassword />;
  }

  if (location.pathname === '/login') {
    return user ? <Navigate to="/" replace /> : <LoginForm />;
  }

  if (location.pathname === '/protect/status-pos') {
    return <POSInfo />;
  }

  // ✅ Rutas que SÍ requieren autenticación  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin =
    user?.user_metadata?.role === "admin" ||
    user?.user_metadata?.role === "superadmin";

  const renderContent = () => {
    switch (currentView) {
      case "general":
        return <GeneralDashboard />;
      case "ventas":
        return <VentasDashboard />;
      case "inventario":
        return <Inventario />;
      case "pedidos":
        return <RecepcionPedidos />;
      // case "despachos":  
      //   return <GestionDespachos />;  
      case "cajas":
        return isAdmin ? <EstadoCajas /> : <GestionCaja />;
      case "pos":
        return <POSInfo />;
      case "documentos":
        return <Documentos />;
      case "promociones":
        return <Promociones />;
      case "colaboradores":
        return <Colaboradores />;
      case "notificaciones":
        return <NotificacionesView />;
      default:
        return <GeneralDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="w-full">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          currentView={currentView}
        />
        <main className="bg-gray-50">{renderContent()}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<AppContent />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;