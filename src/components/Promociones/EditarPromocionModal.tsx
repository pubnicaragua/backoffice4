import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseUpdate } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';

interface EditarPromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  promocion?: any;
  onSuccess?: () => void;
}

export function EditarPromocionModal({ isOpen, onClose, promocion, onSuccess }: EditarPromocionModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    sucursales: ['N°1'] as string[],
    costo_unitario: '',
    precio_unitario: '',
    sku: ''
  });

  const { update, loading } = useSupabaseUpdate('promociones');
  
  // Update form when promocion changes
  React.useEffect(() => {
    if (promocion) {
      setFormData({
        nombre: promocion.promocion?.nombre || promocion.nombre || '',
        descripcion: promocion.promocion?.descripcion || promocion.descripcion || '',
        sucursales: ['N°1'],
        costo_unitario: promocion.promocion?.costo?.toString() || '',
        precio_unitario: promocion.promocion?.precio_prom?.toString() || '',
        sku: promocion.promocion?.codigo || ''
      });
    }
  }, [promocion]);

  const handleSucursalChange = (sucursal: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sucursales: checked 
        ? [...prev.sucursales, sucursal]
        : prev.sucursales.filter(s => s !== sucursal)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('✏️ PROMOCIÓN: Actualizando', promocion?.id);
    
    const promocionId = promocion?.promocion?.id || promocion?.id;
    if (!promocionId) {
      console.error('❌ PROMOCIÓN: ID no encontrado');
      return;
    }
    
    const success = await update(promocionId, {
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      costo: parseFloat(formData.costo_unitario) || 1000,
      disponible: true
    });

    if (success) {
      console.log('✅ PROMOCIÓN: Actualizada exitosamente');
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar promoción" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
            placeholder="Nombre de la promoción"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Escoger sucursal
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['N°1', 'N°2', 'N°3', 'N°4'].map(sucursal => (
              <label key={sucursal} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.sucursales.includes(sucursal)}
                  onChange={(e) => handleSucursalChange(sucursal, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{sucursal}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo
            </label>
            <input
              type="text"
              value={formData.costo_unitario}
              onChange={(e) => setFormData(prev => ({ ...prev, costo_unitario: e.target.value }))}
              placeholder="Costo"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio
            </label>
            <input
              type="text"
              value={formData.precio_unitario}
              onChange={(e) => setFormData(prev => ({ ...prev, precio_unitario: e.target.value }))}
              placeholder="Precio"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          />
        </div>

        <div className="flex justify-center space-x-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              console.log('🔄 PROMOCIÓN: Agregando otro producto');
              // Reset form but keep modal open
              setFormData({
                nombre: '',
                descripcion: '',
                sucursales: [],
                costo_unitario: '',
                precio_unitario: '',
                sku: ''
              });
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Agregar otro producto
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar promoción'}
          </button>
        </div>
      </form>
    </Modal>
  );
}