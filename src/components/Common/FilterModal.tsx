import React, { useState } from 'react';
import { Modal } from './Modal';
import { X } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  onApplyFilter?: () => void;
}

export function FilterModal({ isOpen, onClose, title = "Filtros", children, onApplyFilter }: FilterModalProps) {
  const [resetFilters, setResetFilters] = useState(false);

  const handleApplyFilter = () => {
    if (resetFilters) {
      console.log('🔄 FILTROS: Restableciendo filtros');
      // Reset all form inputs
      const form = document.querySelector('.filter-form');
      if (form) {
        const inputs = form.querySelectorAll('input, select');
        inputs.forEach(input => {
          if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
          } else {
            input.value = '';
          }
        });
        console.log('✅ FILTROS: Restablecidos correctamente');
      }
    }
    console.log('✅ FILTROS: Aplicando filtros', { title });
    if (onApplyFilter) {
      onApplyFilter();
    }
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 text-lg"></span>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 filter-form">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="resetFilters"
              checked={resetFilters}
              onChange={(e) => {
                console.log('🔄 FILTROS: Restablecer activado', e.target.checked);
                setResetFilters(e.target.checked);
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="resetFilters" className="text-sm text-gray-700">
              Restablecer filtros
            </label>
          </div>
          
          {children}
          
          <div className="pt-4">
            <button
              onClick={handleApplyFilter}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Realizar filtro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}