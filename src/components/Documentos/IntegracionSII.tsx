import React, { useState } from 'react';
import { Upload, CheckCircle, FileText, Download, AlertCircle } from 'lucide-react';
import { useSupabaseData, useSupabaseInsert } from '../../hooks/useSupabaseData';

export function IntegracionSII() {
  const [archivoSubido, setArchivoSubido] = useState(false);
  const [cafContent, setCafContent] = useState('');
  const [uploadError, setUploadError] = useState('');

  const { data: cafFiles, loading, refetch } = useSupabaseData<any>('caf_files', '*');
  const { data: foliosDisponibles } = useSupabaseData<any>('folios_electronicos', '*', { usado: false });
  const { insert: insertCaf, loading: uploading } = useSupabaseInsert('caf_files');

  // Temporalmente invisible hasta integración completa
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">🔧 Integración SII</div>
      <p className="text-sm text-gray-500">
        La integración con SII estará disponible próximamente
      </p>
    </div>
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCafContent(content);
        processCafFile(content);
      };
      reader.readAsText(file);
    }
  };

  const processCafFile = async (xmlContent: string) => {
    try {
      setUploadError('');
      
      // Parse XML to extract CAF data
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Extract data from XML
      const re = xmlDoc.querySelector('RE')?.textContent;
      const rs = xmlDoc.querySelector('RS')?.textContent;
      const td = xmlDoc.querySelector('TD')?.textContent;
      const folioDesde = parseInt(xmlDoc.querySelector('D')?.textContent || '0');
      const folioHasta = parseInt(xmlDoc.querySelector('H')?.textContent || '0');
      const fechaAutorizacion = xmlDoc.querySelector('FA')?.textContent;
      const privateKey = xmlDoc.querySelector('RSASK')?.textContent;
      const publicKey = xmlDoc.querySelector('RSAPUBK')?.textContent;
      const firma = xmlDoc.querySelector('FRMA')?.textContent;

      if (!re || !rs || !td || !folioDesde || !folioHasta) {
        throw new Error('Archivo CAF inválido: faltan datos requeridos');
      }

      // Insert CAF into database
      const success = await insertCaf({
        empresa_id: '00000000-0000-0000-0000-000000000001',
        tipo_documento: td,
        rut_empresa: re,
        razon_social: rs,
        folio_desde: folioDesde,
        folio_hasta: folioHasta,
        fecha_autorizacion: fechaAutorizacion,
        fecha_vencimiento: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months
        caf_xml: xmlContent,
        private_key: privateKey || '',
        public_key: publicKey || '',
        firma_caf: firma || ''
      });

      if (success) {
        setArchivoSubido(true);
        refetch();
      }
    } catch (error) {
      setUploadError(`Error procesando archivo CAF: ${error.message}`);
    }
  };

  const downloadCafStatus = () => {
    const data = {
      cafFiles: cafFiles.length,
      foliosDisponibles: foliosDisponibles.length,
      estado: 'Configurado correctamente',
      ultimaActualizacion: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estado_caf_sii.json';
    a.click();
  };

  if (loading) {
    return <div className="text-center py-4">Cargando configuración SII...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">Integración con SII</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activar emisión electrónica */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Activar emisión electrónica</span>
            </label>
          </div>
        </div>

        {/* Estado de la conexión */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Estado de la conexión</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${cafFiles.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className={`font-medium ${cafFiles.length > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                {cafFiles.length > 0 ? 'Configurado' : 'Pendiente configuración'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CAF Files Status */}
      {cafFiles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Archivos CAF Configurados</h3>
            <button
              onClick={downloadCafStatus}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Estado</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {cafFiles.map((caf, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Tipo:</span>
                    <p className="text-gray-900">{caf.tipo_documento === '39' ? 'Boleta Electrónica' : 'Factura Electrónica'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">RUT:</span>
                    <p className="text-gray-900">{caf.rut_empresa}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Folios:</span>
                    <p className="text-gray-900">{caf.folio_desde} - {caf.folio_hasta}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Usados:</span>
                    <p className="text-gray-900">{caf.folios_usados} / {caf.folio_hasta - caf.folio_desde + 1}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium text-gray-700">Razón Social:</span>
                  <p className="text-gray-900">{caf.razon_social}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subir certificado CAF */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-6">
          <h3 className="font-medium text-gray-900">Subir Archivo CAF (Código de Autorización de Folios)</h3>
          
          {uploadError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-600 text-sm">{uploadError}</span>
            </div>
          )}
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {!archivoSubido ? (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".xml"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <span className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block">
                      {uploading ? 'Procesando...' : 'Adjuntar archivo CAF (.xml)'}
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  Sube el archivo CAF proporcionado por el SII para boletas electrónicas
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-green-600 font-medium">Archivo CAF procesado correctamente</p>
                <p className="text-sm text-gray-500">
                  Folios disponibles: {foliosDisponibles.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información para POS */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <FileText className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="font-medium text-blue-900">Integración con Terminales POS</h4>
            <p className="text-blue-700 text-sm mt-1">
              Los archivos CAF se sincronizan automáticamente con todos los terminales POS configurados. 
              Los folios se asignan secuencialmente para cada venta realizada.
            </p>
            <div className="mt-3 text-sm text-blue-600">
              <p>• Folios disponibles: <strong>{foliosDisponibles.length}</strong></p>
              <p>• Terminales conectados: <strong>3</strong></p>
              <p>• Sincronización: <strong>Automática cada 5 minutos</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}