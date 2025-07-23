import React, { useState } from 'react';
import { PromocionesTodas } from './PromocionesTodas';
import { DescuentosTodas } from './DescuentosTodas';
import { CuponesTodas } from './CuponesTodas';
import { PromocionesModal } from './PromocionesModal';

export function Promociones() {
  const [activeTab, setActiveTab] = useState('todas');
  const [showModal, setShowModal] = useState(false);

  const tabs = [
    { id: 'todas', label: 'Promociones de todas las tiendas' },
    { id: 'descuentos', label: 'Descuentos' },
    { id: 'cupones', label: 'Cupones' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'todas':
        return <PromocionesTodas onShowModal={() => setShowModal(true)} />;
      case 'descuentos':
        return <DescuentosTodas />;
      case 'cupones':
        return <CuponesTodas />;
      default:
        return <PromocionesTodas onShowModal={() => setShowModal(true)} />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Promociones</h1>
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

      <PromocionesModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </div>
  );
}