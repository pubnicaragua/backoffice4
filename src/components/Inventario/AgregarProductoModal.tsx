import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert, useSupabaseUpdate } from '../../hooks/useSupabaseData';

interface AgregarProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct?: any;
  onSuccess?: () => void;
}

export function AgregarProductoModal({ isOpen, onClose, selectedProduct, onSuccess }: AgregarProductoModalProps) {
  const [formData, setFormData] = useState({
    producto: '',
    categoria: '',
    descripcion: '',
    se_vende_por: 'unidad',
    codigo_unitario: '',
    precio_unitario: '', // Precio de venta
    sku: '',
    agregar_stock: '',
    costo: ''
  });

  const { insert, loading } = useSupabaseInsert('productos');
  const { update, loading: updating } = useSupabaseUpdate('productos');

  // Update form when selectedProduct changes
  React.useEffect(() => {
    if (selectedProduct) {
      setFormData({
        producto: selectedProduct.nombre || '',
        categoria: selectedProduct.categoria || '',
        descripcion: selectedProduct.descripcion || '',
        se_vende_por: selectedProduct.unidad === 'KG' ? 'kilogramo' : 'unidad',
        codigo_unitario: selectedProduct.codigo || '', // SKU
        precio_unitario: selectedProduct.precio?.toString() || '',
        sku: selectedProduct.codigo || '',
        agregar_stock: selectedProduct.stock?.toString() || '',
        costo: selectedProduct.costo?.toString() || ''
      });
    } else {
      // Reset form completely when no product selected
      setFormData({
        producto: '',
        categoria: '',
        descripcion: '',
        se_vende_por: 'unidad',
        codigo_unitario: '',
        precio_unitario: '', // Precio de venta
        sku: '',
        agregar_stock: '',
        costo: ''
      });
    }
  }, [selectedProduct, isOpen]); // Add isOpen dependency

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      console.log('🔄 MODAL: Reseteando formulario al cerrar');
      setFormData({
        producto: '',
        categoria: '',
        descripcion: '',
        se_vende_por: 'unidad',
        codigo_unitario: '',
        precio_unitario: '', // Precio de venta
        sku: '',
        agregar_stock: '',
        costo: ''
      });
    }
  }, [isOpen]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let success;
    
    if (selectedProduct) {
      // Update existing product
      success = await update(selectedProduct.id, {
        codigo: formData.sku,
        nombre: formData.producto,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio_unitario),
        costo: parseFloat(formData.costo) || 0,
        unidad: formData.se_vende_por === 'unidad' ? 'UN' : 'KG',
        stock: parseFloat(formData.agregar_stock) || 0
      });
    } else {
      // Create new product
      success = await insert({
        codigo: formData.sku || `AUTO-${Date.now()}`,
        nombre: formData.producto,
        descripcion: formData.descripcion,
        precio: parseFloat(formData.precio_unitario),
        costo: parseFloat(formData.costo) || 0,
        tipo: 'producto',
        unidad: formData.se_vende_por === 'unidad' ? 'UN' : 'KG',
        stock: parseFloat(formData.agregar_stock) || 0
      });
    }

    if (success) {
      // Reset form data
      setFormData({
        producto: '',
        categoria: '',
        descripcion: '',
        se_vende_por: 'unidad',
        codigo_unitario: '',
        precio_unitario: '',
        sku: '',
        agregar_stock: '',
        costo: ''
      });
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={selectedProduct ? "Editar producto" : "Agregar producto"} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="producto-nombre" className="block text-sm font-medium text-gray-700 mb-1">
            Producto
          </label>
          <input
            id="producto-nombre"
            name="producto-nombre"
            type="text"
            value={formData.producto}
            onChange={(e) => setFormData(prev => ({ ...prev, producto: e.target.value }))}
            placeholder="Producto"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="producto-categoria" className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <input
            id="producto-categoria"
            name="producto-categoria"
            type="text"
            value={formData.categoria}
            onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
            placeholder="Categoría"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="producto-descripcion" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <input
            id="producto-descripcion"
            name="producto-descripcion"
            type="text"
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Descripción"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de venta
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                id="venta-unidad"
                name="se_vende_por"
                type="radio"
                value="unidad"
                checked={formData.se_vende_por === 'unidad'}
                onChange={(e) => setFormData(prev => ({ ...prev, se_vende_por: e.target.value }))}
                className="mr-2 text-blue-600"
              />
              Unidad
            </label>
            <label className="flex items-center">
              <input
                id="venta-kilogramo"
                name="se_vende_por"
                type="radio"
                value="kilogramo"
                checked={formData.se_vende_por === 'kilogramo'}
                onChange={(e) => setFormData(prev => ({ ...prev, se_vende_por: e.target.value }))}
                className="mr-2 text-blue-600"
              />
              Kilogramo
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="producto-sku" className="block text-sm font-medium text-gray-700 mb-1">
            SKU (Opcional)
          </label>
          <input
            id="producto-sku"
            name="producto-sku"
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
            placeholder="SKU específico"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="costo-producto" className="block text-sm font-medium text-gray-700 mb-1">
              Costo
            </label>
            <input
              id="costo-producto"
              name="costo-producto"
              type="number"
              value={formData.costo}
              onChange={(e) => setFormData(prev => ({ ...prev, costo: e.target.value }))}
              placeholder="Costo del producto"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="precio-unitario" className="block text-sm font-medium text-gray-700 mb-1">
              Precio de venta
            </label>
            <input
              id="precio-unitario"
              name="precio-unitario"
              type="number"
              value={formData.precio_unitario}
              onChange={(e) => setFormData(prev => ({ ...prev, precio_unitario: e.target.value }))}
              placeholder="Precio de venta"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="stock-actual" className="block text-sm font-medium text-gray-700 mb-1">
            Agregar stock actual
          </label>
          <input
            id="stock-actual"
            name="stock-actual"
            type="number"
            value={formData.agregar_stock}
            onChange={(e) => setFormData(prev => ({ ...prev, agregar_stock: e.target.value }))}
            placeholder="Agregar stock actual / adicional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || updating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {(loading || updating) ? 'Guardando...' : selectedProduct ? 'Actualizar producto' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}