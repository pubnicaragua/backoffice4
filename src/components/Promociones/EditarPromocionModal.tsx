import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { X } from 'lucide-react';
import { useSupabaseUpdate, useSupabaseData } from '../../hooks/useSupabaseData'; // Ensure useSupabaseData is imported
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
    precio_unitario: '',
    sku: '' // This SKU is for the promotion itself, not a product
  });
  const [productosPromocion, setProductosPromocion] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { update, loading } = useSupabaseUpdate('promociones');
  const { data: productos } = useSupabaseData<any>('productos', '*');
  
  // Update form when promocion changes
  React.useEffect(() => {
    if (promocion) {
      setFormData({
        nombre: promocion.promocion?.nombre || promocion.nombre || '',
        descripcion: promocion.promocion?.descripcion || promocion.descripcion || '',
        sucursales: ['N°1'],
        precio_unitario: promocion.promocion?.precio_prom?.toString() || '',
        sku: promocion.promocion?.codigo || ''
      }); // Initialize form data with existing promotion data
      
      // Filter products that are part of this promotion (example logic)
      const productosRelacionados = (productos || []).filter(p => 
        p.nombre.toLowerCase().includes(promocion.nombre?.toLowerCase() || '') ||
        p.codigo === promocion.sku
      );
      setProductosPromocion(productosRelacionados);
    }
  }, [promocion, productos]);

  const handleRemoverProducto = (index: number) => {
    setProductosPromocion(prev => prev.filter((_, i) => i !== index));
    console.log('🗑️ PROMOCIÓN: Producto removido del índice', index);
  };

  const handleAgregarProducto = () => {
    const filteredProductos = (productos || []).filter(producto =>
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredProductos.length > 0) {
      const producto = filteredProductos[0];
      // Verificar que no esté duplicado
      const yaExiste = productosPromocion.some(p => p.id === producto.id);
      if (!yaExiste) {
        setProductosPromocion(prev => [...prev, producto]);
        console.log('➕ PROMOCIÓN: Producto agregado', producto.nombre);
      } else {
        alert('Este producto ya está en la promoción');
      }
      setSearchTerm('');
    }
  };
  // Explanation for the user:
  // The `promocion` prop contains the data of the promotion being edited.
  // `productos` is a list of all available products from Supabase.
  // `productosPromocion` is a filtered list of products that are associated with this specific promotion.
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
      precio_prom: parseFloat(formData.precio_unitario) || 0,
      disponible: true,
      activo: true
    });

    if (success) {
      console.log('✅ PROMOCIÓN: Actualizada exitosamente');
      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        sucursales: ['N°1'],
        precio_unitario: '',
        sku: ''
      });
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar promoción" size="xl">
      <div className="flex space-x-6">
        {/* Formulario principal */}
        <div className="flex-1">
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

        {/* Buscar y agregar productos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agregar producto
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar productos..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAgregarProducto}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Agregar
            </button>
          </div>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU
          </label>
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
            placeholder="SKU específico"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        </div>

        <div className="flex justify-center space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar promoción'}
          </button>
        </div>
      </form>
        </div>
      
        {/* Resumen a la derecha */}
        <div className="w-80 bg-gray-50 rounded-lg p-4 ml-6">
          <h4 className="font-medium text-gray-900 mb-3">
            📋 Productos en promoción ({productosPromocion.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {productosPromocion.map((producto, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                <div>
                  <p className="font-medium text-sm">{producto.nombre}</p>
                  <p className="text-xs text-gray-500">SKU: {producto.codigo}</p>
                  <p className="text-xs text-gray-500">Precio: ${producto.precio?.toLocaleString('es-CL')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoverProducto(index)}
                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                  title="Eliminar producto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          {productosPromocion.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No hay productos en esta promoción
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}