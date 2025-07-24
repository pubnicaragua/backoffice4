import React, { useState } from 'react';
import { GestionUsuarios } from './GestionUsuarios';
import { GestionSolicitudes } from './GestionSolicitudes';
import { ControlAsistencias } from './ControlAsistencias';
import { ReporteAsistencia } from './ReporteAsistencia';

export function Colaboradores() {
  const [activeTab, setActiveTab] = useState('usuarios');

  const tabs = [
    { id: 'usuarios', label: 'Gestión de usuarios' },
    { id: 'solicitudes', label: 'Gestión de solicitudes' },
    { id: 'control', label: 'Control de asistencias' },
    { id: 'reporte', label: 'Reporte de asistencia' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'usuarios':
        return <GestionUsuarios />;
      case 'solicitudes':
        return <GestionSolicitudes />;
      case 'control':
        return <ControlAsistencias />;
      case 'reporte':
        return <ReporteAsistencia />;
      default:
        return <GestionUsuarios />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Colaboradores</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}