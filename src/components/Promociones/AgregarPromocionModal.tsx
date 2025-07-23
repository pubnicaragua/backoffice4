import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert, useSupabaseData } from '../../hooks/useSupabaseData';
import { X, Search } from 'lucide-react';

interface AgregarPromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AgregarPromocionModal({ isOpen, onClose, onSuccess }: AgregarPromocionModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    sucursales: [] as string[],
    precio_promocion: '',
    sku: '',
    producto_seleccionado: null as any
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [productosAgregados, setProductosAgregados] = useState<Array<{
    nombre: string;
    descripcion: string;
    precio_real: number;
    precio_promocion: number;
    sku: string;
    sucursales: string[];
    producto: any;
  }>>([]);

  const { insert, loading } = useSupabaseInsert('promociones');
  const { data: productos } = useSupabaseData<any>('productos', '*');

  // Filtrar productos mientras escribe
  const filteredProductos = (productos || []).filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSucursalChange = (sucursal: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sucursales: checked 
        ? [...prev.sucursales, sucursal]
        : prev.sucursales.filter(s => s !== sucursal)
    }));
  };

  const handleProductoSelect = (producto: any) => {
    setFormData(prev => ({
      ...prev,
      producto_seleccionado: producto,
      sku: producto.codigo
    }));
    setSearchTerm(''); // Clear search instead of keeping product name
  };

  const handleAgregarOtroProducto = () => {
    if (formData.producto_seleccionado) {
      const nuevoProducto = {
        nombre: formData.nombre || formData.producto_seleccionado.nombre,
        descripcion: formData.descripcion || formData.producto_seleccionado.descripcion,
        precio_real: formData.producto_seleccionado.precio,
        precio_promocion: parseFloat(formData.precio_promocion) || formData.producto_seleccionado.precio * 0.8,
        sku: formData.sku,
        sucursales: [...formData.sucursales],
        producto: formData.producto_seleccionado
      };
      
      // Siempre agregar como nuevo producto (acumulativo)
      setProductosAgregados(prev => [...prev, nuevoProducto]);
      
      // Clear product-specific fields but keep promotion info
      setFormData(prev => ({
        ...prev,
        precio_promocion: '', // Clear price for next product
        sku: '',
        producto_seleccionado: null
      }));
      setSearchTerm('');
      
      console.log('🔄 PROMOCIÓN: Producto agregado a la lista', nuevoProducto);
    }
  };

  const handleRemoverProducto = (index: number) => {
    setProductosAgregados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🎯 PROMOCIÓN: Guardando promoción completa');
    
    // Si hay productos en la lista, guardar todos
    const productosParaGuardar = productosAgregados.length > 0 
      ? productosAgregados 
      : formData.producto_seleccionado ? [{
          nombre: formData.nombre || formData.producto_seleccionado.nombre,
          descripcion: formData.descripcion || formData.producto_seleccionado.descripcion,
          precio_real: formData.producto_seleccionado.precio,
          precio_promocion: parseFloat(formData.precio_promocion),
          sku: formData.sku,
          sucursales: formData.sucursales,
          producto: formData.producto_seleccionado
        }] : [];
    
    let allSuccess = true;
    
    for (const producto of productosParaGuardar) {
      const success = await insert({
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio_prom: producto.precio_promocion,
        empresa_id: '00000000-0000-0000-0000-000000000001',
        sucursal_id: '00000000-0000-0000-0000-000000000001',
        activo: true
      });
      
      if (!success) {
        allSuccess = false;
        break;
      }
    }

    if (allSuccess) {
      console.log('✅ PROMOCIÓN: Todas las promociones guardadas');
      setProductosAgregados([]);
      setFormData({
        nombre: '',
        descripcion: '',
        sucursales: [],
        precio_promocion: '',
        sku: '',
        producto_seleccionado: null
      });
      setSearchTerm('');
      
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar promoción" size="xl">
      <div className="flex space-x-6">
        {/* Formulario principal */}
        <div className="flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la promoción
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
                placeholder="Descripción de la promoción"
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

            {/* Buscador de productos */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar producto (SKU obligatorio)
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Lista de productos filtrados */}
              {searchTerm && filteredProductos.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredProductos.slice(0, 5).map(producto => (
                    <button
                      key={producto.id}
                      type="button"
                      onClick={() => handleProductoSelect(producto)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                    >
                      <div className="font-medium">{producto.nombre}</div>
                      <div className="text-gray-500 text-xs">
                        SKU: {producto.codigo} - Precio: ${producto.precio?.toLocaleString('es-CL')}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mostrar producto seleccionado */}
            {formData.producto_seleccionado && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Producto seleccionado:</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Nombre:</strong> {formData.producto_seleccionado.nombre}</p>
                  <p><strong>SKU:</strong> {formData.producto_seleccionado.codigo}</p>
                  <p><strong>Precio real:</strong> ${formData.producto_seleccionado.precio?.toLocaleString('es-CL')}</p>
                </div>
              </div>
            )}

            {productosAgregados.length === 0 && (
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio de promoción
              </label>
              <input
                type="number"
                value={formData.precio_promocion}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_promocion: e.target.value }))}
                placeholder="Precio promocional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            )}

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={handleAgregarOtroProducto}
                disabled={!formData.producto_seleccionado}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg disabled:opacity-50"
              >
                Agregar otro producto
              </button>
              <button
                type="submit"
                disabled={loading || (productosAgregados.length === 0 && !formData.producto_seleccionado)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : `Guardar ${productosAgregados.length > 0 ? productosAgregados.length : 1} promoción(es)`}
              </button>
            </div>
          </form>
        </div>

        {/* Lista flotante de productos */}
        {productosAgregados.length > 0 && (
          <div className="w-80 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              📋 Productos agregados ({productosAgregados.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {productosAgregados.map((producto, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div>
                    <p className="font-medium text-sm">{producto.nombre}</p>
                    <p className="text-xs text-gray-500">SKU: {producto.sku}</p>
                    <p className="text-xs text-gray-500">Precio: ${producto.precio_real?.toLocaleString('es-CL')}</p>
                  </div>
                  <button
                    onClick={() => handleRemoverProducto(index)}
                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                    title="Eliminar producto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Producto actual siendo editado */}
            {formData.producto_seleccionado && (
              <div className="mt-3 bg-blue-50 p-3 rounded border border-blue-200">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Producto actual:</h5>
                <div className="text-xs text-blue-700">
                  <p>{formData.producto_seleccionado.nombre}</p>
                  <p>Precio promocional: ${parseFloat(formData.precio_promocion || '0').toLocaleString('es-CL')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}