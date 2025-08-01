import React from 'react';
import { useState } from 'react';
import { ArrowLeft, Calendar, Download, Edit } from 'lucide-react';
import { Modal } from '../Common/Modal';
import { useSupabaseUpdate } from '../../hooks/useSupabaseData';

interface DetalleDespachoProps {
  onBack: () => void;
  despacho?: any;
}

export function DetalleDespacho({ onBack, despacho }: DetalleDespachoProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    estado: despacho?.estado || 'pendiente',
    direccion: despacho?.sucursal_destino || 'Jr. Santiago de Chile 193'
  });
  
  const { update, loading } = useSupabaseUpdate('despachos');
  
  const productos = [
    { nombre: 'Pola - cola 500ml', sku: '9520401', cantidad: 20, costo: '$125' },
    { nombre: 'Pola - cola 1L', sku: '9520401', cantidad: 15, costo: '$25' },
    { nombre: 'Pola - cola 1.5L', sku: '9520401', cantidad: 30, costo: '$5' },
    { nombre: 'Pola - cola 3L', sku: '9520401', cantidad: 10, costo: '$5' },
    { nombre: 'Pola - cola 3L', sku: '9520401', cantidad: 10, costo: '$5' },
  ];

  const handleEditSubmit = async () => {
    console.log('💾 DESPACHO: Guardando cambios', editData);
    
    if (despacho?.despacho?.id) {
      const success = await update(despacho.despacho.id, {
        estado: editData.estado,
        direccion: editData.direccion
      });
      
      if (success) {
        console.log('✅ DESPACHO: Actualizado exitosamente');
        setShowEditModal(false);
        // Refresh page to show changes
        window.location.reload();
      }
    }
  };

  const handleDownloadDocument = () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Despacho - ${despacho?.folio_factura || '8949564506'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
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
            <h3>DESPACHO</h3>
            <p><strong>Folio:</strong> ${despacho?.folio_factura || '8949564506'}</p>
            <p><strong>Fecha:</strong> ${despacho?.fecha || new Date().toLocaleDateString('es-CL')}</p>
            <p><strong>Entregado por:</strong> ${despacho?.entregado_por || 'Emilio Aguilera'}</p>
            <p><strong>Dirección:</strong> Jr. Santiago de Chile 193</p>
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
      a.download = `despacho_${despacho?.folio_factura || '8949564506'}.html`;
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
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Gestión de despachos</h1>
      </div>
      
      {/* Botones con más margen */}
      <div className="flex justify-end space-x-4 mb-8">
        <div className="flex items-center space-x-4">
          {despacho?.despacho?.estado !== 'entregado' && despacho?.estado !== 'Entregado' && (
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
            >
              <Edit className="w-4 h-4" />
              <span>Editar Despacho</span>
            </button>
          )}
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Despacho</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entregado por:
                  </label>
                  <span className="text-sm text-gray-900">{despacho?.entregado_por || 'Emilio Aguilera'}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Folio:
                  </label>
                  <span className="text-sm text-gray-900">{despacho?.folio_factura || '8949564506'}</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha:
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-900">{despacho?.fecha ? new Date(despacho.fecha).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}</span>
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recepcionado por:
                  </label>
                  <span className="text-sm text-gray-900">Pedro Hernández</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUT:
                  </label>
                  <span className="text-sm text-gray-900">54658425</span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección:
                  </label>
                  <span className="text-sm text-gray-900">Jr. Santiago de Chile 193</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Guía de despacho:</h3>
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
                    <span>DESPACHO</span>
                    <span>N° {despacho?.folio_factura || '8949564506'}</span>
                  </div>
                  <div>Fecha: {despacho?.fecha || new Date().toLocaleDateString('es-CL')}</div>
                  <div>Entregado por: {despacho?.entregado_por || 'Emilio Aguilera'}</div>
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
                  <div>Dirección: Jr. Santiago de Chile 193</div>
                  <div>www.solvendo.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
      {/* Modal de Edición */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Despacho"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={editData.estado}
              onChange={(e) => setEditData(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pendiente">Pendiente</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={editData.direccion}
              onChange={(e) => setEditData(prev => ({ ...prev, direccion: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={handleEditSubmit}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}