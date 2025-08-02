import React from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';

interface NotaCreditoDetalleProps {
  onBack: () => void;
}

export function NotaCreditoDetalle({ onBack }: NotaCreditoDetalleProps) {
  const productos = [
    { nombre: 'Pola - cola 500ml', sku: '9520401', cantidad: 20, monto: '$125' },
    { nombre: 'Pola - cola 1L', sku: '9520401', cantidad: 15, monto: '$25' },
    { nombre: 'Pola - cola 1.5L', sku: '9520401', cantidad: 30, monto: '$5' },
    { nombre: 'Pola - cola 3L', sku: '9520401', cantidad: 10, monto: '$5' },
    { nombre: 'Pola - cola 3L', sku: '9520401', cantidad: 10, monto: '$5' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">Nota de crédito</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de productos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">
                <span>Productos</span>
                <span>SKU</span>
                <span>Cantidad</span>
                <span>Monto</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {productos.map((producto, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <span className="text-gray-900">{producto.nombre}</span>
                    <span className="text-gray-600">{producto.sku}</span>
                    <span className="text-gray-600">{producto.cantidad}</span>
                    <span className="text-gray-900 font-medium">{producto.monto}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-lg font-semibold text-gray-900">204 $</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información lateral */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sucursal
                </label>
                <span className="text-sm text-gray-900">N°1</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caja
                </label>
                <span className="text-sm text-gray-900">N°1</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folio
                </label>
                <span className="text-sm text-gray-900">8949564506</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">30/05/2025</span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Nota de crédito:</h3>
            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">Vista previa del documento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}