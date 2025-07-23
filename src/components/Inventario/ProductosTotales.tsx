import React, { useState } from 'react';
import { Table } from '../Common/Table';
import { FilterModal } from '../Common/FilterModal';
import { Filter, Plus, Search, AlertTriangle, Edit, Trash2, X } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { ReporteMermas } from './ReporteMermas';
import { ActualizarInventario } from './ActualizarInventario';
import { AgregarProductoModal } from './AgregarProductoModal';
import { Modal } from '../Common/Modal';
import { supabase } from '../../lib/supabase';

export function ProductosTotales() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sucursal: '',
    categoria: '',
    disponibilidad: ''
  });
  const [showMermasModal, setShowMermasModal] = useState(false);
  const [showInventarioModal, setShowInventarioModal] = useState(false);
  const [showProductoModal, setShowProductoModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [xmlFiles, setXmlFiles] = useState<Array<{id: string, name: string, products: any[]}>>([]);

  const { data: productos, loading, refetch } = useSupabaseData<any>(
    'productos',
    '*'
  );
  const { data: sucursales } = useSupabaseData<any>('sucursales', '*');
  const { data: categorias } = useSupabaseData<any>('categorias', '*');

  const columns = [
    { key: 'checkbox', label: '', width: '40px' },
    { key: 'producto', label: 'Producto' },
    { key: 'stock', label: 'Stock' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'sku', label: 'SKU' },
    { key: 'costo', label: 'Costo' },
    { key: 'precio', label: 'Precio' },
    { key: 'margen', label: 'Margen' },
    { key: 'disponible', label: 'Disponible' },
    { key: 'acciones', label: 'Acciones' }
  ];

  // Aplicar filtros
  const filteredProductos = (productos || []).filter(producto => {
    if (filters.categoria && filters.categoria !== '') {
      const categoria = categorias.find(c => c.nombre.toLowerCase() === filters.categoria.toLowerCase());
      if (categoria && producto.categoria_id !== categoria.id) return false;
    }
    if (filters.sucursal && filters.sucursal !== '') {
      // Apply sucursal filter logic here
    }
    if (filters.disponibilidad === 'disponibles' && (producto.stock || 0) <= 0) return false;
    if (filters.disponibilidad === 'agotados' && (producto.stock || 0) > 0) return false;
    return true;
  });

  const handleEditProduct = (producto) => {
    console.log('✏️ EDITANDO PRODUCTO:', producto.nombre);
    setSelectedProduct(producto);
    setShowProductoModal(true);
  };

  const handleDeleteProduct = (producto) => {
    console.log('🗑️ ELIMINANDO PRODUCTO:', producto.nombre);
    setSelectedProduct(producto);
    setShowDeleteModal(true);
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size > 0) {
      setShowBulkDeleteModal(true);
    }
  };

  const confirmBulkDelete = async () => {
    console.log('🗑️ PRODUCTOS: Eliminación masiva', selectedProducts.size, 'productos');
    
    for (const productId of selectedProducts) {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productId);
      
      if (error) {
        console.error('❌ PRODUCTO: Error eliminando', productId, error);
      }
    }
    
    console.log('✅ PRODUCTOS: Eliminación masiva completada');
    setShowBulkDeleteModal(false);
    setSelectedProducts(new Set());
    refetch();
  };

  const confirmDelete = async () => {
    if (selectedProduct) {
      console.log('🗑️ PRODUCTO: Eliminando producto', selectedProduct.nombre);
      const { data, error } = await supabase
        .from('productos')
        .delete()
        .eq('id', selectedProduct.id);
      
      if (!error) {
        console.log('✅ PRODUCTO: Eliminado exitosamente');
        setShowDeleteModal(false);
        setSelectedProduct(null);
        refetch();
      } else {
        console.error('❌ PRODUCTO: Error eliminando', error);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      console.log(`📁 PROCESANDO ${files.length} ARCHIVO(S) XML`);
      
      Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          processXmlFile(file, content);
        };
        reader.readAsText(file);
      });
    }
  };

  const processXmlFile = (file: File, content: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      const detalles = xmlDoc.querySelectorAll('Detalle');
      const processedProducts = Array.from(detalles).map(detalle => {
        const codigo = detalle.querySelector('CdgItem VlrCodigo')?.textContent || '';
        const nombre = detalle.querySelector('NmbItem')?.textContent || '';
        const cantidad = parseInt(detalle.querySelector('QtyItem')?.textContent || '0');
        const costoBase = parseFloat(detalle.querySelector('PrcItem')?.textContent || '0');
        const costoConIva = Math.round(costoBase * 1.19);
        
        return {
          nombre,
          codigo,
          cantidad,
          costo: costoConIva,
          descripcion: `Costo con IVA incluido (${costoBase} + 19%)`
        };
      });
      
      const newXmlFile = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        products: processedProducts
      };
      
      setXmlFiles(prev => [...prev, newXmlFile]);
      console.log('✅ XML procesado:', file.name, processedProducts.length, 'productos');
    } catch (error) {
      console.error('❌ Error procesando XML:', error);
    }
  };

  const removeXmlFile = (fileId: string) => {
    setXmlFiles(prev => prev.filter(f => f.id !== fileId));
    console.log('🗑️ XML removido:', fileId);
  };
  const processedData = filteredProductos.map(producto => ({
    id: producto.id,
    producto: producto.nombre,
    stock: producto.stock?.toString() || '0',
    categoria: categorias.find(c => c.id === producto.categoria_id)?.nombre || 'Sin categoría',
    descripcion: producto.descripcion || '',
    sku: producto.codigo,
    costo: `$${Math.round((producto.costo || 0)).toLocaleString('es-CL')}`,
    precio: `$${Math.round((producto.precio || 0)).toLocaleString('es-CL')}`,
    margen: `${Math.round(((producto.precio || 0) - (producto.costo || 0)) / (producto.precio || 1) * 100)}%`,
    disponible: producto.stock > 0 ? 'Disponible' : 'Agotado',
    checkbox: (
      <input
        type="checkbox"
        checked={selectedProducts.has(producto.id)}
        onChange={(e) => handleSelectProduct(producto.id, e.target.checked)}
        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
      />
    ),
    acciones: (
      <div className="flex items-center space-x-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleEditProduct(producto);
          }}
          className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
          title="Editar producto"
        >
          <Edit className="w-5 h-5" />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteProduct(producto);
          }}
          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
          title="Eliminar producto"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    )
  }));

  const filteredData = processedData.filter(item =>
    (searchTerm === '' || 
     item.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
     item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Productos totales</h1>
      </div>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="search-productos"
            name="search-productos"
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedProducts.size > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar {selectedProducts.size}</span>
            </button>
          )}
          <button 
            onClick={() => {
              console.log('🔍 FILTROS: Abriendo panel de filtros'); 
              setShowFilters(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          <button 
            onClick={() => {
              console.log('➕ PRODUCTO: Abriendo modal agregar');
              setSelectedProduct(null);
              setShowProductoModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
          <button 
            onClick={() => {
              console.log('📊 INVENTARIO: Abriendo actualización masiva'); 
              setShowInventarioModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <span>Actualizar inventario</span>
          </button>
          <button 
            onClick={() => {
              console.log('⚠️ MERMAS: Abriendo reporte');
              setShowMermasModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Mermas</span>
          </button>
        </div>
      </div>

      {/* XML Files Counter */}
      {xmlFiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-blue-900">Archivos XML Cargados ({xmlFiles.length})</h3>
          </div>
          <div className="space-y-2">
            {xmlFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded border">
                <div>
                  <span className="font-medium text-gray-900">{file.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({file.products.length} productos)</span>
                </div>
                <button
                  onClick={() => removeXmlFile(file.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={filteredData}
        currentPage={currentPage}
        totalPages={Math.ceil(filteredData.length / 10)}
        onPageChange={setCurrentPage}
      />

      <ReporteMermas 
        isOpen={showMermasModal} 
        onClose={() => setShowMermasModal(false)} 
      />
      
      <ActualizarInventario 
        isOpen={showInventarioModal} 
        onClose={() => setShowInventarioModal(false)} 
      />
      
      <AgregarProductoModal 
        isOpen={showProductoModal} 
        onClose={() => setShowProductoModal(false)} 
        selectedProduct={selectedProduct}
        onSuccess={() => {
          setShowProductoModal(false);
          setSelectedProduct(null);
          refetch();
        }}
      />

      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sucursal
            </label>
            <select 
              value={filters.sucursal}
              onChange={(e) => setFilters(prev => ({ ...prev, sucursal: e.target.value }))}
              id="filter-sucursal"
              name="filter-sucursal"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map(sucursal => (
                <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Disponibilidad
            </label>
            <select 
              value={filters.disponibilidad}
              onChange={(e) => setFilters(prev => ({ ...prev, disponibilidad: e.target.value }))}
              id="filter-disponibilidad"
              name="filter-disponibilidad"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los productos</option>
              <option value="disponibles">Disponibles</option>
              <option value="agotados">Agotados</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select 
              value={filters.categoria}
              onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value }))}
              id="filter-categoria"
              name="filter-categoria"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowFilters(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </FilterModal>

      {/* Bulk Delete Modal */}
      <Modal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        title="Eliminar Productos"
        size="sm"
      >
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar {selectedProducts.size} productos seleccionados?
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowBulkDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={confirmBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar {selectedProducts.size} productos
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Producto"
        size="sm"
      >
        <div className="text-center space-y-4">
          <p className="text-gray-600">
            ¿Estás seguro de que deseas eliminar el producto "{selectedProduct?.nombre}"?
          </p>
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}