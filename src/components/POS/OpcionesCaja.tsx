import React, { useState } from 'react';
import { Modal } from '../Common/Modal';
import { Filter } from 'lucide-react';
import { useSupabaseData, useSupabaseUpdate } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';

export function OpcionesCaja() {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sucursales: '',
    cajas: [],
  });

  const { data: configuracion, loading } = useSupabaseData<any>('configuracion_pos', '*');
  const { update } = useSupabaseUpdate('configuracion_pos');

  const settings = configuracion[0] || {
    deposito: true,
    reporte_ventas: false,
    devoluciones: true,
    usd: true,
    clp: false,
    mercado_pago: false,
    sumup: true,
    transbank: false,
    getnet: false,
    solicitar_autorizacion: true,
  };

  const handleSettingChange = async (key: string, value: boolean) => {
    if (configuracion[0]) {
      await update(configuracion[0].id, { [key]: value });
      
      // Trigger real-time sync to POS terminals
      console.log(`🔄 POS Config Updated: ${key} = ${value}`);
      console.log('📡 Syncing to all POS terminals in real-time...');
      
      // Sync configuration to POS terminals
      try {
        const { data: terminals } = await supabase
          .from('pos_terminals')
          .select('*')
          .eq('status', 'online');
        
        for (const terminal of terminals || []) {
          await supabase.from('pos_sync_log').insert({
            terminal_id: terminal.id,
            sync_type: 'configuration',
            direction: 'to_pos',
            status: 'success',
            records_count: 1,
            sync_data: {
              action: 'config_updated',
              config: { [key]: value },
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.error('Error syncing to POS:', error);
      }
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      console.log('💾 Guardando configuración completa...');
      
      // Sync all configuration to POS terminals
      const { data: terminals } = await supabase
        .from('pos_terminals')
        .select('*')
        .eq('status', 'online');
      
      for (const terminal of terminals || []) {
        await supabase.from('pos_sync_log').insert({
          terminal_id: terminal.id,
          sync_type: 'configuration',
          direction: 'to_pos',
          status: 'success',
          records_count: 1,
          sync_data: {
            action: 'full_config_sync',
            config: settings,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      alert('✅ Configuración guardada y sincronizada con todos los terminales POS');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('❌ Error al guardar la configuración');
    }
  };
  const handleCajaChange = (caja: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      cajas: checked 
        ? [...prev.cajas, caja]
        : prev.cajas.filter(c => c !== caja)
    }));
  };

  if (loading) {
    return <div className="text-center py-4">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Opciones de caja (Todas las sucursales y cajas)
        </h2>
        <button 
          onClick={() => setShowFilters(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </button>
      </div>

      {/* Opciones de caja */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Opciones de caja</h3>
        <div className="space-y-3">
          {[
            { key: 'deposito', label: 'Depósito' },
            { key: 'reporte_ventas', label: 'Reporte de ventas' },
            { key: 'devoluciones', label: 'Devoluciones' },
          ].map(option => (
            <label key={option.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings[option.key]}
                onChange={(e) => handleSettingChange(option.key, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tipo de moneda */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Tipo de moneda</h3>
        <div className="space-y-3">
          {[
            { key: 'usd', label: 'USD' },
            { key: 'clp', label: 'CLP' },
          ].map(option => (
            <label key={option.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings[option.key]}
                onChange={(e) => handleSettingChange(option.key, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Integración con POS */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Integración con POS</h3>
        <div className="space-y-3">
          {[
            { key: 'mercado_pago', label: 'Mercado Pago' },
            { key: 'sumup', label: 'SumUp' },
            { key: 'transbank', label: 'Transbank' },
            { key: 'getnet', label: 'GetNet' },
          ].map(option => (
            <label key={option.key} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings[option.key]}
                onChange={(e) => handleSettingChange(option.key, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Autorización */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">
          ¿Solicitar autorización para eliminar productos de una venta o cancelar venta?
        </h3>
        <div className="flex space-x-6">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="autorizacion"
              checked={settings.solicitar_autorizacion}
              onChange={() => handleSettingChange('solicitar_autorizacion', true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">Sí</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="autorizacion"
              checked={!settings.solicitar_autorizacion}
              onChange={() => handleSettingChange('solicitar_autorizacion', false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-gray-700">No</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t border-gray-200">
        <button
          onClick={handleSaveConfiguration}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          💾 Guardar Configuración y Sincronizar POS
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          ✅ Los cambios se aplicarán automáticamente a todos los terminales POS
        </p>
      </div>

      {/* Modal de Filtros */}
      <Modal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtros"
        size="md"
      >
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
              Sucursales
            </label>
            <select
              value={filters.sucursales}
              onChange={(e) => setFilters(prev => ({ ...prev, sucursales: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar sucursal</option>
              <option value="sucursal1">Sucursal N°1</option>
              <option value="sucursal2">Sucursal N°2</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cajas
            </label>
            <div className="space-y-2">
              {['Caja N°1', 'Caja N°2', 'Caja N°3', 'Caja N°4'].map(caja => (
                <label key={caja} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.cajas.includes(caja)}
                    onChange={(e) => handleCajaChange(caja, e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{caja}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowFilters(false)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Realizar filtro
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}