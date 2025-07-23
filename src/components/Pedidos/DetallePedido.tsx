import React from 'react';
import { ArrowLeft, Calendar, Download } from 'lucide-react';

interface DetallePedidoProps {
  onBack: () => void;
  pedido?: any;
}

export function DetallePedido({ onBack, pedido }: DetallePedidoProps) {
  const productos = [
    { nombre: 'Pola - cola 500ml', sku: '9520401', cantidad: 20, costo: '$125' },
    { nombre: 'Pola - cola 1L', sku: '9520401', cantidad: 15, costo: '$25' },
    { nombre: 'Pola - cola 1.5L', sku: '9520401', cantidad: 30, costo: '$5' },
    { nombre: 'Pola - cola 3L', sku: '9520401', cantidad: 10, costo: '$5' },
    { nombre: 'Pola - cola 3L', sku: '9520401', cantidad: 10, costo: '$5' },
  ];

  const handleDownloadDocument = () => {
    try {
      // Crear contenido HTML para la vista previa
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Guía de Despacho - ${pedido?.folio || '8949564506'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { height: 40px; margin-bottom: 10px; }
            .company-info { margin-bottom: 20px; }
            .document-info { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; }
            .products-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .products-table th, .products-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            .products-table th { background-color: #f5f5f5; }
            .total { text-align: right; font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h2>ANROLTEC SPA</h2>
              <p>RUT: 78.168.951-3</p>
              <p>Av. Principal 123, Santiago</p>
              <p>Tel: +56 9 1234 5678</p>
            </div>
          </div>
          
          <div class="document-info">
            <h3>GUÍA DE DESPACHO</h3>
            <p><strong>Folio:</strong> ${pedido?.folio || '8949564506'}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CL')}</p>
            <p><strong>Proveedor:</strong> Pola - cola</p>
            <p><strong>Entregado por:</strong> Emilio Aguilera</p>
          </div>
          
          <table class="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Cantidad</th>
                <th>Costo Unit.</th>
              </tr>
            </thead>
            <tbody>
              ${productos.map(p => `
                <tr>
                  <td>${p.nombre}</td>
                  <td>${p.sku}</td>
                  <td>${p.cantidad}</td>
                  <td>${p.costo}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p>Total: $204</p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; color: #666;">
            <p>Documento generado por Solvendo</p>
            <p>www.solvendo.com</p>
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `guia_despacho_${pedido?.folio || '8949564506'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento.');
    }
  };
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={onBack}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Recepción de pedidos</h1>
        
        {/* Botón de descarga alineado a la derecha */}
        <div className="ml-auto">
          <button
            onClick={handleDownloadDocument}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Documento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de productos */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">
                <span>Producto</span>
                <span>SKU</span>
                <span>Cantidad</span>
                <span>Costo unit</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {productos.map((producto, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <span className="text-gray-900">{producto.nombre}</span>
                    <span className="text-gray-600">{producto.sku}</span>
                    <span className="text-gray-600">{producto.cantidad}</span>
                    <span className="text-gray-900 font-medium">{producto.costo}</span>
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
                  Proveedor:
                </label>
                <span className="text-sm text-gray-900">Pola - cola</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Folio:
                </label>
                <span className="text-sm text-gray-900">8949564506</span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha:
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">30/05/2025</span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recepcionado por:
                </label>
                <span className="text-sm text-gray-900">Emilio Aguilera</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Guía de despacho</h3>
            <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4 text-xs font-mono overflow-y-auto">
              <div className="text-center mb-4">
                <img src="/logo_negro.svg" alt="Solvendo" className="h-8 mx-auto mb-2" />
                <div className="text-sm font-bold">ANROLTEC SPA</div>
                <div>RUT: 78.168.951-3</div>
                <div>Av. Principal 123, Santiago</div>
                <div>Tel: +56 9 1234 5678</div>
              </div>
              
              <div className="border-t border-b border-gray-300 py-2 mb-2">
                <div className="flex justify-between">
                  <span>GUÍA DE DESPACHO</span>
                  <span>N° {pedido?.folio || '8949564506'}</span>
                </div>
                <div>Fecha: {new Date().toLocaleDateString('es-CL')}</div>
                <div>Proveedor: Pola - cola</div>
              </div>
              
              <div className="space-y-1 mb-2">
                {productos.slice(0, 3).map((producto, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{producto.nombre}</span>
                    <span>{producto.costo}</span>
                  </div>
                ))}
                {productos.length > 3 && (
                  <div className="text-center text-gray-500">... y {productos.length - 3} más</div>
                )}
              </div>
              
              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>$204</span>
                </div>
              </div>
              
              <div className="text-center mt-4 text-gray-500">
                <div>Entregado por: Emilio Aguilera</div>
                <div>www.solvendo.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}