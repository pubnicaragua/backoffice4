import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Search } from 'lucide-react';
import { useSupabaseData, useSupabaseInsert } from '../../hooks/useSupabaseData';

interface ReporteMermasProps {
  isOpen: boolean;
  onClose: () => void;
  onMermaReported?: (mermaData: any) => void;
}

export function ReporteMermas({ isOpen, onClose, onMermaReported }: ReporteMermasProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    tipo_merma: 'robo',
    cantidad_mermada: '',
    observaciones: '',
    producto_seleccionado: '',
    sucursal_seleccionada: ''
  });

  const { insert, loading } = useSupabaseInsert('mermas');
  const { data: productos } = useSupabaseData<any>('productos', '*');
  const { data: sucursales } = useSupabaseData<any>('sucursales', '*');

  // Filtrar productos mientras escribe
  const filteredProductos = (productos || []).filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sucursal_seleccionada) {
      alert('Por favor selecciona una sucursal');
      return;
    }
    
    const success = await insert({
      tipo: formData.tipo_merma,
      cantidad: parseFloat(formData.cantidad_mermada),
      sucursal_id: formData.sucursal_seleccionada || '00000000-0000-0000-0000-000000000001',
      producto_id: formData.producto_seleccionado || '00000000-0000-0000-0000-000000000001',
      observaciones: formData.observaciones
    });

    if (success) {
      // Llamar callback para crear notificación
      if (onMermaReported) {
        onMermaReported({
          tipo: formData.tipo_merma, // Pasa el tipo de merma
          cantidad: formData.cantidad_mermada,
          producto: searchTerm
        });
      }
      
      onClose();
      setSearchTerm(''); // Limpiar búsqueda
      setFormData({
        tipo_merma: 'robo',
        cantidad_mermada: '',
        observaciones: '',
        producto_seleccionado: '',
        sucursal_seleccionada: ''
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reporte de mermas" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="sucursal-merma-select" className="block text-sm font-medium text-gray-700 mb-1">
            Sucursal
          </label>
          <select
            id="sucursal-merma-select"
            name="sucursal-merma-select"
            value={formData.sucursal_seleccionada}
            onChange={(e) => setFormData(prev => ({ ...prev, sucursal_seleccionada: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar sucursal</option>
            {sucursales.map(sucursal => (
              <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            id="buscar-merma-input"
            name="buscar-merma-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar Productos"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Lista de productos filtrados */}
          {searchTerm && filteredProductos.length > 0 && (
            <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {filteredProductos.slice(0, 5).map(producto => (
                <button
                  key={producto.id}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, producto_seleccionado: producto.id }));
                    setSearchTerm(producto.nombre);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                >
                  <div className="font-medium">{producto.nombre}</div>
                  <div className="text-gray-500 text-xs">{producto.codigo}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="tipo-merma-select" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de merma
          </label>
          <select
            id="tipo-merma-select"
            name="tipo-merma-select"
            value={formData.tipo_merma}
            onChange={(e) => setFormData(prev => ({ ...prev, tipo_merma: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="robo">Robo de merma</option>
            <option value="vencimiento">Vencimiento</option>
            <option value="daño">Daño</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div>
          <label htmlFor="cantidad-mermada-input" className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad mermada
          </label>
          <input
            id="cantidad-mermada-input"
            name="cantidad-mermada-input"
            type="number"
            value={formData.cantidad_mermada}
            onChange={(e) => setFormData(prev => ({ ...prev, cantidad_mermada: e.target.value }))}
            placeholder="Cantidad mermada"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="observaciones-merma-textarea" className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            id="observaciones-merma-textarea"
            name="observaciones-merma-textarea"
            value={formData.observaciones}
            onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
            placeholder="Observaciones adicionales..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Reportando...' : 'Reportar merma'}
          </button>
        </div>
      </form>
    </Modal>
  );
}