import React, { useState } from 'react';
import { MovimientosEfectivo } from './MovimientosEfectivo';
import { Devoluciones } from './Devoluciones';
import { OpcionesCaja } from './OpcionesCaja';
import { POSIntegrationSimple } from './POSIntegrationSimple';

export function POSInfo() {
  const [activeTab, setActiveTab] = useState('movimientos');

  const tabs = [
    { id: 'movimientos', label: 'Movimientos de efectivo' },
    { id: 'devoluciones', label: 'Devoluciones' },
    { id: 'integracion', label: 'Integración POS' },
    { id: 'opciones', label: 'Opciones de caja' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'movimientos':
        return <MovimientosEfectivo />;
      case 'devoluciones':
        return <Devoluciones />;
      case 'integracion':
        return <POSIntegrationSimple />;
      case 'opciones':
        return <OpcionesCaja />;
      default:
        return <MovimientosEfectivo />;
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
        </div>
        
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}