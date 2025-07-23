import React, { useState } from 'react';
import { Modal } from '../Common/Modal';

interface PromocionesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PromocionesModal({ isOpen, onClose }: PromocionesModalProps) {
  const [filters, setFilters] = useState({
    sucursales: [] as string[],
  });

  const handleSucursalChange = (sucursal: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      sucursales: checked 
        ? [...prev.sucursales, sucursal]
        : prev.sucursales.filter(s => s !== sucursal)
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros" size="md">
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <input
            type="checkbox"
            id="resetFilters"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="resetFilters" className="text-sm text-gray-700">
            Restablecer filtros
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sucursal
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['N°1', 'N°2', 'N°3', 'N°4'].map(sucursal => (
              <label key={sucursal} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.sucursales.includes(sucursal)}
                  onChange={(e) => handleSucursalChange(sucursal, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{sucursal}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Realizar filtro
          </button>
        </div>
      </div>
    </Modal>
  );
}