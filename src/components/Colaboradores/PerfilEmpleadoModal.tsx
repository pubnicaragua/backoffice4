import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { AsignarTurnoModal } from './AsignarTurnoModal';
import { AsignarTareaModal } from './AsignarTareaModal';
import { AsignarPermisoModal } from './AsignarPermisoModal';

interface PerfilEmpleadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser?: any;
}

export const PerfilEmpleadoModal: React.FC<PerfilEmpleadoModalProps> = ({ isOpen, onClose, selectedUser }) => {
  const [showTurnoModal, setShowTurnoModal] = useState(false);
  const [showTareaModal, setShowTareaModal] = useState(false);
  const [showPermisoModal, setShowPermisoModal] = useState(false);

  const empleado = {
    nombre: 'Pedro Pérez',
    rol: 'Empleado',
    rut: '23443432',
    fechaNacimiento: '08/02/1997',
    genero: 'Hombre',
    celular: '+56 943 234 534',
    correo: 'mfgfgfg@gmail.com',
    direccion: 'Jr. De la Unión 253'
  };

  const permisos = [
    { nombre: 'Permiso de caja', estado: 'denegado' },
    { nombre: 'Permiso de hacer despacho', estado: 'permitido' },
    { nombre: 'Permiso de hacer despacho', estado: 'permitido' },
    { nombre: 'Permiso de hacer despacho', estado: 'permitido' },
    { nombre: 'Permiso de hacer despacho', estado: 'permitido' }
  ];

  const tareas = [
    { nombre: 'Limpieza total', descripcion: 'Hacer limpieza y sacar la basura de la sucursal' },
    { nombre: 'Limpieza total', descripcion: 'Hacer limpieza y sacar la basura de la tienda' }
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
        <div className="space-y-6">
          {/* Header del perfil */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {empleado.nombre.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{empleado.nombre}</h2>
                <p className="text-sm text-blue-600 font-medium">Rol: {empleado.rol}</p>
                <p className="text-xs text-gray-500">RUT: {empleado.rut}</p>
              </div>
            </div>
            <button className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Visualizar CV
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos personales */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Datos personales
              </h3>
              <div className="space-y-3 text-sm">
                <p><span className="font-medium">RUT:</span> {empleado.rut}</p>
                <p><span className="font-medium">Fecha de nacimiento:</span> {empleado.fechaNacimiento}</p>
                <p><span className="font-medium">Género:</span> {empleado.genero}</p>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Información de contacto
              </h3>
              <div className="space-y-3 text-sm">
                <p><span className="font-medium">Celular:</span> {empleado.celular}</p>
                <p><span className="font-medium">Correo:</span> {empleado.correo}</p>
                <p><span className="font-medium">Dirección:</span> {empleado.direccion}</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-center space-x-4 py-4">
            <button 
              onClick={() => setShowTareaModal(true)}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Tareas
            </button>
            <button 
              onClick={() => setShowTurnoModal(true)}
              className="px-6 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              Turnos
            </button>
            <button 
              onClick={() => setShowPermisoModal(true)}
              className="px-6 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
            >
              Permisos
            </button>
          </div>

          {/* Martes (Hoy) */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Martes (Hoy)
              </h3>
              <button 
                onClick={() => setShowTareaModal(true)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Agregar tarea
              </button>
            </div>
            
            <div className="space-y-3">
              {tareas.map((tarea, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-blue-200">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🧹</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tarea.nombre}</p>
                    <p className="text-sm text-gray-600">{tarea.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rol actual */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Rol actual (Empleado)
              </h3>
              <div className="flex space-x-3">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Editar permisos
                </button>
                <button 
                  onClick={() => setShowPermisoModal(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Asignar permisos
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              {permisos.map((permiso, index) => (
                <div key={index} className="text-center p-2 bg-white rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2 font-medium">{permiso.nombre}</p>
                  <div className={`w-4 h-4 mx-auto rounded ${
                    permiso.estado === 'permitido' ? 'bg-green-500' : 'bg-red-500'
                  } flex items-center justify-center`}>
                    <span className="text-white text-xs">
                      {permiso.estado === 'permitido' ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <AsignarTurnoModal 
        isOpen={showTurnoModal} 
        onClose={() => setShowTurnoModal(false)} 
      />
      
      <AsignarTareaModal 
        isOpen={showTareaModal} 
        onClose={() => setShowTareaModal(false)} 
      />
      
      <AsignarPermisoModal 
        isOpen={showPermisoModal} 
        onClose={() => setShowPermisoModal(false)} 
      />
    </>
  );
};