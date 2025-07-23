import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { useSupabaseInsert } from '../../hooks/useSupabaseData';

interface AgregarUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgregarUsuarioModal({ isOpen, onClose }: AgregarUsuarioModalProps) {
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    rut: '',
    fecha_nacimiento: '',
    rol_usuario: 'empleado',
    agregar_permiso: 'seleccionar'
  });

  const { insert, loading } = useSupabaseInsert('usuarios');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('👤 USUARIO: Iniciando creación de usuario');
    console.log('📝 DATOS:', {
      nombres: formData.nombres,
      rut: formData.rut,
      rol: formData.rol_usuario
    });
    
    const success = await insert({
      nombres: formData.nombres,
      apellidos: formData.apellidos || 'Apellido',
      rut: formData.rut,
      email: `${formData.rut.replace(/[.-]/g, '')}@empresa.com`,
      rol: formData.rol_usuario,
      fecha_nacimiento: formData.fecha_nacimiento || '1990-01-01',
      activo: true
    });

    if (success) {
      console.log('✅ USUARIO: Creado exitosamente');
      onClose();
      setFormData({
        nombres: '',
        apellidos: '',
        rut: '',
        fecha_nacimiento: '',
        rol_usuario: 'empleado',
        agregar_permiso: 'seleccionar'
      });
    } else {
      console.error('❌ USUARIO: Error en creación');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar usuario" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nombres-usuario-input" className="block text-sm font-medium text-gray-700 mb-1">
            Nombres
          </label>
          <input
            id="nombres-usuario-input"
            name="nombres-usuario-input"
            type="text"
            value={formData.nombres}
            onChange={(e) => setFormData(prev => ({ ...prev, nombres: e.target.value }))}
            placeholder="Nombre del empleado"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="rut-usuario-input" className="block text-sm font-medium text-gray-700 mb-1">
            RUT
          </label>
          <input
            id="rut-usuario-input"
            name="rut-usuario-input"
            type="text"
            value={formData.rut}
            onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
            placeholder="12.345.678-9"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="apellidos-usuario-input" className="block text-sm font-medium text-gray-700 mb-1">
            Apellidos
          </label>
          <input
            id="apellidos-usuario-input"
            name="apellidos-usuario-input"
            type="text"
            value={formData.apellidos}
            onChange={(e) => setFormData(prev => ({ ...prev, apellidos: e.target.value }))}
            placeholder="Apellidos del empleado"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="fecha-nacimiento-input" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de nacimiento
          </label>
          <input
            id="fecha-nacimiento-input"
            name="fecha-nacimiento-input"
            type="date"
            value={formData.fecha_nacimiento}
            onChange={(e) => setFormData(prev => ({ ...prev, fecha_nacimiento: e.target.value }))}
            max="2010-12-31"
            min="1950-01-01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="rol-usuario-select" className="block text-sm font-medium text-gray-700 mb-1">
            Rol del usuario
          </label>
          <select
            id="rol-usuario-select"
            name="rol-usuario-select"
            value={formData.rol_usuario}
            onChange={(e) => setFormData(prev => ({ ...prev, rol_usuario: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="empleado">Empleado</option>
            <option value="supervisor">Supervisor</option>
            <option value="administrador">Administrador</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agregar permiso adicional
          </label>
          <select
            value={formData.agregar_permiso}
            onChange={(e) => setFormData(prev => ({ ...prev, agregar_permiso: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="seleccionar">Seleccionar rol</option>
            <option value="ventas">Ventas</option>
            <option value="inventario">Inventario</option>
            <option value="caja">Caja</option>
          </select>
        </div>

        <div className="text-center">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Asignar con permiso adicional
          </button>
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
            {loading ? 'Guardando...' : 'Guardar usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}