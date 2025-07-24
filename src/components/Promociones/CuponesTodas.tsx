import React, { useState } from 'react';
import { Filter, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { useSupabaseData, useSupabaseInsert, useSupabaseUpdate } from '../../hooks/useSupabaseData';
import { Modal } from '../Common/Modal';

export function CuponesTodas() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAgregarModal, setShowAgregarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [selectedCupon, setSelectedCupon] = useState(null);
  const [filters, setFilters] = useState({
    codigo: '',
    estado: '',
    tipo: ''
  });
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'descuento',
    valor: '',
    usos_maximos: '1',
    fecha_inicio: '',
    fecha_fin: ''
  });

  console.log('🎫 CUPONES: Componente inicializado');

  const { data: cupones, loading, refetch } = useSupabaseData<any>('cupones', '*, sucursales(nombre)');
  const { insert, loading: inserting } = useSupabaseInsert('cupones');
  const { update, loading: updating } = useSupabaseUpdate('cupones');

  console.log('📊 CUPONES: Data del backend', { cupones: cupones?.length || 0 });

  const columns = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Nombre' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'valor', label: 'Valor' },
    { key: 'usos', label: 'Usos' },
    { key: 'estado', label: 'Estado' },
    { key: 'acciones', label: 'Acciones' }
  ];

  const processedData = (cupones || []).map(cupon => {
    console.log('🎫 CUPONES: Procesando cupón', cupon.codigo);
    
    return {
      id: cupon.id,
      codigo: cupon.codigo,
      nombre: cupon.nombre,
      tipo: cupon.tipo === 'descuento' ? 'Descuento' : cupon.tipo === 'envio_gratis' ? 'Envío Gratis' : 'Regalo',
      valor: cupon.tipo === 'envio_gratis' ? 'Gratis' : 
             cupon.valor > 100 ? `$${cupon.valor.toLocaleString('es-CL')}` : `${cupon.valor}%`,
      usos: `${cupon.usos_actuales || 0}/${cupon.usos_maximos}`,
      estado: cupon.activo ? 'Activo' : 'Inactivo',
      acciones: (
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleEditCupon(cupon)}
            className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
            title="Editar cupón"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteCupon(cupon)}
            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
            title="Eliminar cupón"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      cupon: cupon
    };
  });

  // Aplicar filtros FUNCIONALES
  const filteredData = processedData.filter(item => {
    console.log('🔍 CUPONES: Aplicando filtros', { filters, item: item.codigo });
    
    if (searchTerm && !item.codigo.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !item.nombre.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.codigo && !item.codigo.toLowerCase().includes(filters.codigo.toLowerCase())) return false;
    if (filters.estado && item.estado.toLowerCase() !== filters.estado.toLowerCase()) return false;
    if (filters.tipo && item.tipo.toLowerCase() !== filters.tipo.toLowerCase()) return false;
    return true;
  });

  const handleEditCupon = (cupon) => {
    console.log('✏️ CUPONES: Editando cupón', cupon.codigo);
    setSelectedCupon(cupon);
    setFormData({
      codigo: cupon.codigo,
      nombre: cupon.nombre,
      descripcion: cupon.descripcion || '',
      tipo: cupon.tipo,
      valor: cupon.valor.toString(),
      usos_maximos: cupon.usos_maximos.toString(),
      fecha_inicio: cupon.fecha_inicio || '',
      fecha_fin: cupon.fecha_fin || ''
    });
    setShowEditarModal(true);
  };

  const handleDeleteCupon = async (cupon) => {
    console.log('🗑️ CUPONES: Eliminando cupón', cupon.codigo);
    if (confirm(`¿Estás seguro de eliminar el cupón ${cupon.codigo}?`)) {
      const success = await update(cupon.id, { activo: false });
      if (success) {
        console.log('✅ CUPONES: Cupón eliminado');
        refetch();
      }
    }
  };

  const handleSubmitAgregar = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 CUPONES: Guardando nuevo cupón', formData);
    
    const success = await insert({
      empresa_id: '00000000-0000-0000-0000-000000000001',
      sucursal_id: '00000000-0000-0000-0000-000000000001',
      codigo: formData.codigo,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor),
      usos_maximos: parseInt(formData.usos_maximos),
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null,
      activo: true
    });

    if (success) {
      console.log('✅ CUPONES: Cupón creado exitosamente');
      setShowAgregarModal(false);
      setFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        tipo: 'descuento',
        valor: '',
        usos_maximos: '1',
        fecha_inicio: '',
        fecha_fin: ''
      });
      refetch();
    }
  };

  const handleSubmitEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 CUPONES: Actualizando cupón', selectedCupon?.id);
    
    const success = await update(selectedCupon.id, {
      codigo: formData.codigo,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      valor: parseFloat(formData.valor),
      usos_maximos: parseInt(formData.usos_maximos),
      fecha_inicio: formData.fecha_inicio || null,
      fecha_fin: formData.fecha_fin || null
    });

    if (success) {
      console.log('✅ CUPONES: Cupón actualizado exitosamente');
      setShowEditarModal(false);
      setSelectedCupon(null);
      refetch();
    }
  };

  const applyFilters = () => {
    console.log('✅ CUPONES: Aplicando filtros', filters);
    setShowFilters(false);
  };

  if (loading) {
    console.log('⏳ CUPONES: Cargando datos...');
    return <div className="text-center py-4">Cargando cupones...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Cupones</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => {
              console.log('🔍 CUPONES: Abriendo filtros');
              setShowFilters(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          <button 
            onClick={() => {
              console.log('➕ CUPONES: Abriendo agregar');
              setShowAgregarModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Buscar cupones"
          value={searchTerm}
          onChange={(e) => {
            console.log('🔍 CUPONES: Búsqueda', e.target.value);
            setSearchTerm(e.target.value);
          }}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((row, index) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 text-sm text-gray-900">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Filtros */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
            <input 
              type="text" 
              value={filters.codigo}
              onChange={(e) => setFilters(prev => ({ ...prev, codigo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
            <select 
              value={filters.estado}
              onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Aplicar filtros
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Agregar */}
      <Modal
        isOpen={showAgregarModal}
        onClose={() => setShowAgregarModal(false)}
        title="Agregar Cupón"
        size="md"
      >
        <form onSubmit={handleSubmitAgregar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input 
              type="text" 
              value={formData.codigo}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input 
              type="text" 
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              value={formData.tipo}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="descuento">Descuento</option>
              <option value="envio_gratis">Envío Gratis</option>
              <option value="regalo">Regalo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input 
              type="number" 
              value={formData.valor}
              onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required
            />
          </div>
          <div className="flex justify-center">
            <button 
              type="submit" 
              disabled={inserting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {inserting ? 'Guardando...' : 'Guardar Cupón'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar */}
      <Modal
        isOpen={showEditarModal}
        onClose={() => setShowEditarModal(false)}
        title="Editar Cupón"
        size="md"
      >
        <form onSubmit={handleSubmitEditar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input 
              type="text" 
              value={formData.codigo}
              onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input 
              type="text" 
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input 
              type="number" 
              value={formData.valor}
              onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md" 
              required
            />
          </div>
          <div className="flex justify-center">
            <button 
              type="submit" 
              disabled={updating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updating ? 'Actualizando...' : 'Actualizar Cupón'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}