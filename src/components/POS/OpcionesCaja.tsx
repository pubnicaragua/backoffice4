import React, { useEffect, useState } from 'react';
import { Modal } from '../Common/Modal';
import { Filter } from 'lucide-react';
import { useSupabaseData, useSupabaseUpdate } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';
import { Caja, Sucursal } from '../../types/cajas';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

export function OpcionesCaja() {
  const { empresaId } = useAuth()
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{
    sucursales: Sucursal | null;
    cajas: Caja[];
  }>({
    sucursales: null,
    cajas: [],
  });


  const { data: configuracion, loading } = useSupabaseData<any>('configuracion_pos', '*');
  const { data: cajas } = useSupabaseData<Caja>(
    "cajas",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { data: sucursales } = useSupabaseData<Sucursal>(
    "sucursales",
    "*",
    empresaId ? { empresa_id: empresaId } : undefined
  );

  const { update } = useSupabaseUpdate('configuracion_pos');

  useEffect(() => {
    if (filters.sucursales) {
      setFilters(prev => ({
        ...prev,
        cajas: [],
      }));
    }
  }, [filters.sucursales]);


  const [settings, setSettings] = useState({
    usd: true,
    clp: false,
    transbank: false,
    getnet: false,
    solicitar_autorizacion: true,
  });

  useEffect(() => {
    if (configuracion && configuracion.length > 0) {
      setSettings(configuracion[0]);
    }
  }, [configuracion]);

  // Guardar y sincronizar solo un cambio de configuración
  const handleSettingChange = async (key: string, value: boolean) => {
    // ✅ Primero actualizamos el estado local para refrescar la UI
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));

    try {
      if (configuracion && configuracion[0]) {
        await update(configuracion[0].id, { [key]: value });
      } else {
        const { data, error } = await supabase
          .from("configuracion_pos")
          .insert([{ [key]: value }])
          .select()
          .single();

        if (error) throw error;
        if (data) setSettings(data);
      }

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
      console.error('Error updating configuration:', error);
    }
  };

  // Guardar y sincronizar toda la configuración
  const handleSaveConfiguration = async () => {
    try {
      console.log('💾 Guardando configuración completa...');

      if (configuracion && configuracion[0]) {
        // ✅ Guardamos todo el objeto settings en la BD
        await update(configuracion[0].id, settings);
      } else {
        // ✅ Si no existe configuración, la creamos
        const { data, error } = await supabase
          .from("configuracion_pos")
          .insert([settings])
          .select()
          .single();

        if (error) throw error;
        if (data) setSettings(data);
      }

      // ✅ Sync all configuration to POS terminals
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

      toast.success('✅ Configuración guardada y sincronizada con todos los terminales POS');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('❌ Error al guardar la configuración');
    }
  };

  const handleCajaChange = (caja: Caja, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      cajas: checked
        ? [...prev.cajas, caja]
        : prev.cajas.filter(c => c.id !== caja.id),
    }));
  };

  if (loading) {
    return <div className="text-center py-4">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">
          Opciones de caja
        </h2>
        {/* <button
          onClick={() => setShowFilters(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Filter className="w-4 h-4" />
          <span>Filtros</span>
        </button> */}
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
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-900 font-medium"
        >
          Guardar Configuración y Sincronizar POS
        </button>
      </div>

      {/* Modal de Filtros */}
      {/* <Modal
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
              value={filters.sucursales?.id || ""}
              onChange={(e) => {
                console.log(sucursales)
                const sucursal = sucursales?.find(s => s.id === e.target.value) || null;
                setFilters(prev => ({ ...prev, sucursales: sucursal, cajas: [] }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cajas
            </label>
            <div className="space-y-2">
              {cajas
                ?.filter(c => c.sucursal_id === filters.sucursales?.id)
                .map(caja => (
                  <label key={caja.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.cajas.some(c => c.id === caja.id)}
                      onChange={(e) => handleCajaChange(caja, e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{caja.nombre}</span>
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
      </Modal> */}
    </div>
  );
}