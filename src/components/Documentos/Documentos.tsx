import React, { useState } from 'react';
import { DocumentosEmitidos } from './DocumentosEmitidos';
import { NotaCredito } from './NotaCredito';
import { IntegracionSII } from './IntegracionSII';

export function Documentos() {
  const [activeTab, setActiveTab] = useState('emitidos');

  const tabs = [
    { id: 'emitidos', label: 'Documentos emitidos' },
    { id: 'nota-credito', label: 'Nota de crédito' },
    { id: 'integracion-sii', label: 'Integración con SII' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'emitidos':
        return <DocumentosEmitidos />;
      case 'nota-credito':
        return <NotaCredito />;
      case 'integracion-sii':
        return <IntegracionSII />;
      default:
        return <DocumentosEmitidos />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Documentos</h1>
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