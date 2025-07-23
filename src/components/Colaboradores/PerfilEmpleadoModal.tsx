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
        <div className="space-y-4">
          {/* Header del perfil */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{empleado.nombre}</h2>
                <p className="text-sm text-gray-600">Rol: {empleado.rol}</p>
              </div>
            </div>
            <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Visualizar CV
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Datos personales */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Datos personales</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">RUT:</span> {empleado.rut}</p>
                <p><span className="font-medium">Fecha de nacimiento:</span> {empleado.fechaNacimiento}</p>
                <p><span className="font-medium">Género:</span> {empleado.genero}</p>
              </div>
            </div>

            {/* Información de contacto */}
            <div>
              <h3 className="text-base font-medium text-gray-900 mb-2">Información de contacto</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Celular:</span> {empleado.celular}</p>
                <p><span className="font-medium">Correo:</span> {empleado.correo}</p>
                <p><span className="font-medium">Dirección:</span> {empleado.direccion}</p>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-center space-x-2">
            <button 
              onClick={() => setShowTareaModal(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Tareas
            </button>
            <button 
              onClick={() => setShowTurnoModal(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Turnos
            </button>
            <button 
              onClick={() => setShowPermisoModal(true)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Permisos
            </button>
          </div>

          {/* Martes (Hoy) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900">Martes (Hoy)</h3>
              <button 
                onClick={() => setShowTareaModal(true)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Agregar tarea
              </button>
            </div>
            
            <div className="space-y-2">
              {tareas.map((tarea, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-blue-50 rounded">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🧹</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tarea.nombre}</p>
                    <p className="text-sm text-gray-600">{tarea.descripcion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rol actual */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-gray-900">Rol actual (Empleado)</h3>
              <div className="flex space-x-2">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Editar permisos
                </button>
                <button 
                  onClick={() => setShowPermisoModal(true)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Asignar permisos
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {permisos.map((permiso, index) => (
                <div key={index} className="text-center">
                  <p className="text-xs text-gray-600 mb-1">{permiso.nombre}</p>
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