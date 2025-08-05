import React from 'react';
import { Monitor, Usb, QrCode } from 'lucide-react';

export function POSIntegrationSimple() {
  return (
    <div className="space-y-8">
      {/* Integration Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">🔗 Opciones para Conectar Terminal de Pago a Solvendo</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* USB/Serial Integration */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Usb className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">1. USB/Serial (Transbank)</h4>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">Compatible con Transbank POS integrados (Verifone VX520, Ingenico)</p>
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-medium text-blue-900">Funcionamiento:</p>
                <p className="text-blue-800">Solvendo envía monto → Terminal procesa → Respuesta automática</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-700">Requisitos:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Terminal en modo integrado</li>
                  <li>• Conexión USB/Serial</li>
                  <li>• Middleware Transbank</li>
                </ul>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm text-green-600">Flujo automático, reduce errores</span>
              </div>
            </div>
          </div>

          {/* API Integration */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">2. API/QR (Virtual)</h4>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">Webpay Plus, Mercado Pago, GetNet</p>
              <div className="bg-green-50 p-3 rounded">
                <p className="font-medium text-green-900">Funcionamiento:</p>
                <p className="text-green-800">Solvendo genera QR → Cliente paga → Confirmación automática</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-700">Ideal para:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Venta presencial rápida</li>
                  <li>• Delivery</li>
                  <li>• Sin conexión física</li>
                </ul>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✅</span>
                <span className="text-sm text-green-600">Sin configuración física</span>
              </div>
            </div>
          </div>

          {/* Manual Mode */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-8 h-8 text-gray-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-2">3. Modo Manual</h4>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">Usuario realiza cobro manualmente</p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-900">Funcionamiento:</p>
                <p className="text-gray-800">Cobro manual → Marcar en Solvendo como pagado</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium text-gray-700">Características:</p>
                <ul className="text-gray-600 space-y-1">
                  <li>• Fácil de usar</li>
                  <li>• Sin configuración</li>
                  <li>• Mayor riesgo de errores</li>
                </ul>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-green-600">Implementación inmediata</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Steps */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">🛠️ Configuración en Solvendo</h3>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <div>
              <p className="font-medium text-gray-900">Ir a "Información de POS" → "Opciones de caja"</p>
              <p className="text-sm text-gray-600">Configurar tipo de moneda (USD/CLP) y proveedores de pago</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <div>
              <p className="font-medium text-gray-900">Seleccionar "Agregar terminal de pago"</p>
              <p className="text-sm text-gray-600">Elegir tipo: Terminal físico (USB/Serial), Virtual (API/QR), o Manual</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <div>
              <p className="font-medium text-gray-900">Configurar conexión</p>
              <ul className="text-sm text-gray-600 mt-1 space-y-1">
                <li>• <strong>USB/Serial:</strong> Instalar drivers, conectar terminal, probar conexión</li>
                <li>• <strong>API/QR:</strong> Configurar credenciales del proveedor</li>
                <li>• <strong>Manual:</strong> Activar modo manual en caja</li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
            <div>
              <p className="font-medium text-gray-900">Terminal configurado y listo</p>
              <p className="text-sm text-gray-600">Solvendo sincroniza automáticamente productos, precios y folios SII</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}