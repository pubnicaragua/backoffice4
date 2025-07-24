import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert } from '../../hooks/useSupabaseData';

interface AgregarProductoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgregarProducto({ isOpen, onClose }: AgregarProductoProps) {
  const [formData, setFormData] = useState({
    producto: '',
    categoria: '',
    descripcion: '',
    se_vende_por: 'unidad',
    codigo_unitario: '',
    precio_unitario: '',
    sku: '',
    agregar_stock: ''
  });

  const { insert, loading } = useSupabaseInsert('productos');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await insert({
      codigo: formData.sku,
      nombre: formData.producto,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.precio_unitario),
      tipo: 'producto',
      unidad: formData.se_vende_por === 'unidad' ? 'UN' : 'KG',
    });

    if (success) {
      onClose();
      setFormData({
        producto: '',
        categoria: '',
        descripcion: '',
        se_vende_por: 'unidad',
        codigo_unitario: '',
        precio_unitario: '',
        sku: '',
        agregar_stock: ''
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar producto" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Producto
          </label>
          <input
            type="text"
            value={formData.producto}
            onChange={(e) => setFormData(prev => ({ ...prev, producto: e.target.value }))}
            placeholder="Producto"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <input
            type="text"
            value={formData.categoria}
            onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
            placeholder="Categoría"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <input
            type="text"
            value={formData.descripcion}
            onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
            placeholder="Descripción"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Se vende por
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="se_vende_por"
                value="unidad"
                checked={formData.se_vende_por === 'unidad'}
                onChange={(e) => setFormData(prev => ({ ...prev, se_vende_por: e.target.value }))}
                className="mr-2"
              />
              Unidad
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="se_vende_por"
                value="kilogramo"
                checked={formData.se_vende_por === 'kilogramo'}
                onChange={(e) => setFormData(prev => ({ ...prev, se_vende_por: e.target.value }))}
                className="mr-2"
              />
              Kilogramo
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.se_vende_por === 'unidad' ? 'Código unitario' : 'Código kg'}
            </label>
            <input
              type="text"
              value={formData.codigo_unitario}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo_unitario: e.target.value }))}
              placeholder={formData.se_vende_por === 'unidad' ? 'Código unitario' : 'Código kg'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formData.se_vende_por === 'unidad' ? 'Precio unitario' : 'Precio kg'}
            </label>
            <input
              type="number"
              value={formData.precio_unitario}
              onChange={(e) => setFormData(prev => ({ ...prev, precio_unitario: e.target.value }))}
              placeholder={formData.se_vende_por === 'unidad' ? 'Precio unitario' : 'Precio kg'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
            placeholder="SKU específico"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agregar stock actual
          </label>
          <input
            type="number"
            value={formData.agregar_stock}
            onChange={(e) => setFormData(prev => ({ ...prev, agregar_stock: e.target.value }))}
            placeholder="Agregar stock actual / adicional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}