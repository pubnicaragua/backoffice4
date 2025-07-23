import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { X, Search } from 'lucide-react';
import { useSupabaseUpdate, useSupabaseData } from '../../hooks/useSupabaseData';

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
    precio_unitario: ''
  });
  const [productosPromocion, setProductosPromocion] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  console.log('✏️ PROMOCIONES: Modal editar inicializado', promocion?.nombre);

  const { update, loading } = useSupabaseUpdate('promociones');
  const { data: productos } = useSupabaseData<any>('productos', '*');
  
  // Update form when promocion changes
  React.useEffect(() => {
    if (promocion) {
      console.log('📝 PROMOCIONES: Cargando datos de promoción', promocion);
      
      setFormData({
        nombre: promocion.promocion?.nombre || promocion.nombre || '',
        descripcion: promocion.promocion?.descripcion || promocion.descripcion || '',
        sucursales: ['N°1'],
        precio_unitario: promocion.promocion?.precio_prom?.toString() || promocion.precio?.toString() || ''
      });
      
      // Filter products that are part of this promotion
      const productosRelacionados = (productos || []).filter(p => 
        p.nombre.toLowerCase().includes(promocion.nombre?.toLowerCase() || '')
      );
      setProductosPromocion(productosRelacionados);
      
      console.log('📊 PROMOCIONES: Productos relacionados cargados', productosRelacionados.length);
    }
  }, [promocion, productos]);

  const handleRemoverProducto = (index: number) => {
    const producto = productosPromocion[index];
    console.log('🗑️ PROMOCIONES: Removiendo producto', producto?.nombre);
    setProductosPromocion(prev => prev.filter((_, i) => i !== index));
  };

  const handleAgregarProducto = () => {
    console.log('🔍 PROMOCIONES: Buscando producto para agregar', searchTerm);
    
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
        console.log('✅ PROMOCIONES: Producto agregado', producto.nombre);
      } else {
        console.log('❌ PROMOCIONES: Producto ya existe');
        alert('Este producto ya está en la promoción');
      }
      setSearchTerm('');
    } else {
      console.log('❌ PROMOCIONES: No se encontraron productos');
    }
  };

  const handleSucursalChange = (sucursal: string, checked: boolean) => {
    console.log('🏢 PROMOCIONES: Cambiando sucursal', sucursal, checked);
    setFormData(prev => ({
      ...prev,
      sucursales: checked 
        ? [...prev.sucursales, sucursal]
        : prev.sucursales.filter(s => s !== sucursal)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 PROMOCIONES: Actualizando promoción', {
      id: promocion?.id,
      nombre: formData.nombre,
      productos: productosPromocion.length
    });
    
    const promocionId = promocion?.promocion?.id || promocion?.id;
    if (!promocionId) {
      console.error('❌ PROMOCIONES: ID no encontrado');
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
      console.log('✅ PROMOCIONES: Promoción actualizada exitosamente');
      // Reset form
      setFormData({
        nombre: '',
        descripcion: '',
        sucursales: ['N°1'],
        precio_unitario: ''
      });
      setProductosPromocion([]);
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } else {
      console.error('❌ PROMOCIONES: Error actualizando promoción');
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
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                type="number"
                value={formData.precio_unitario}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_unitario: e.target.value }))}
                placeholder="Precio"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
      
        {/* Resumen a la derecha - IGUAL que en agregar */}
        <div className="w-80 bg-gray-50 rounded-lg p-4">
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