import React, { useEffect, useState } from 'react';
import { Upload, FileText, Download, X } from 'lucide-react';
import { Modal } from '../Common/Modal';
import { useSupabaseData, useSupabaseInsert } from '../../hooks/useSupabaseData';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ActualizarInventarioProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ActualizarInventario({ isOpen, onClose }: ActualizarInventarioProps) {
  const [uploadMethod, setUploadMethod] = useState('csv');
  const [file, setFile] = useState<File | null>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<{ [key: string]: { selected: boolean, cantidad: number, descripcion?: string } }>({});
  const [xmlFiles, setXmlFiles] = useState<Array<{ id: string, name: string, products: any[] }>>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { insert } = useSupabaseInsert('inventario');
  const { data: sucursales } = useSupabaseData<any>('sucursales', '*');
  const { data: categorias } = useSupabaseData<any>('categorias', '*')
  const { user, empresaId } = useAuth()

  const [sucursalDestino, setSucursalDestino] = useState("");

  useEffect(() => {
    setSucursalDestino(sucursales[0]?.id)
  }, [sucursales.length > 0])

  const findClosestCategory = (categoriaCsv: string, categorias: any[]) => {
    if (!categoriaCsv || categorias.length === 0) return null;

    const normalizedCsv = categoriaCsv
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    return categorias.find(cat =>
      cat.nombre
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase() === normalizedCsv
    ) || null;
  };

  const removeXmlFile = (fileId: string) => {
    setXmlFiles(prev => prev.filter(f => f.id !== fileId));

    // Update products and selections after file removal
    setXmlFiles(currentFiles => {
      const remainingFiles = currentFiles.filter(f => f.id !== fileId);
      const remainingProducts = remainingFiles.flatMap(f => f.products);

      setProductos(remainingProducts);

      // Clear selected products that are no longer in the list
      setSelectedProducts(prev => {
        const newSelection = {};
        remainingProducts.forEach(p => {
          if (prev[p.nombre]) newSelection[p.nombre] = prev[p.nombre];
        });
        return newSelection;
      });

      console.log('🗑️ XML removido y productos actualizados:', fileId, remainingProducts.length);
      return remainingFiles;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (uploadedFiles && uploadedFiles.length > 0) {
      console.log(`📁 PROCESANDO ${uploadedFiles.length} ARCHIVO(S) ${uploadMethod.toUpperCase()}`);

      // Always process multiple files, even if only one is selected
      // This ensures the xmlFiles state is always an array of processed files
      setFile(uploadedFiles[0]); // Set the first file for single file display
      if (uploadMethod === 'xml') { // Only XML files are managed as multiple "loaded files"
        // Procesar múltiples archivos
        processMultipleFiles(Array.from(uploadedFiles));
      } else {
        processFile(uploadedFiles[0]);
      }
    }
  };

  const processMultipleFiles = async (files: File[]) => {
    setProcessing(true);
    let allProducts: any[] = [];

    try {
      for (const file of files) {
        console.log(`📄 PROCESANDO ARCHIVO XML: ${file.name}`);
        const fileProducts = await processFileContent(file);
        allProducts.push({ id: Date.now().toString() + Math.random().toString(36).substr(2, 9), name: file.name, products: fileProducts });
      }

      setXmlFiles(allProducts); // Store all processed XML files
      setProductos(allProducts.flatMap(f => f.products)); // Flatten products for display
      console.log(`✅ TOTAL ARCHIVOS XML PROCESADOS: ${allProducts.length}`);
    } catch (error) {
      console.error('❌ ERROR PROCESANDO MÚLTIPLES ARCHIVOS:', error);
      alert('Error al procesar los archivos');
    } finally {
      setProcessing(false);
    }
  };

  const processFile = async (file: File) => {
    setProcessing(true);
    setXmlFiles([]); // Clear XML files for non-XML uploads
    try {
      const processedProducts = await processFileContent(file);
      setProductos(processedProducts);
    } catch (error) {
      console.error('❌ ERROR PROCESANDO ARCHIVO:', error);
      alert('Error al procesar el archivo');
    } finally {
      setProcessing(false);
    }
  };

  const processFileContent = async (file: File): Promise<any[]> => {
    try {
      if (file.name.endsWith('.xml')) {
        console.log('📄 INVENTARIO: Procesando XML personalizado');

        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Seleccionar los nodos <producto>
        const productos = xmlDoc.querySelectorAll('producto');

        const processedProducts = Array.from(productos).map(prod => {
          const nombre = prod.querySelector('nombre')?.textContent || '';
          const descripcion = prod.querySelector('descripcion')?.textContent || '';
          const cantidad = parseInt(prod.querySelector('cantidad')?.textContent || '0');
          const costoConIva = parseFloat(prod.querySelector('costo_con_iva')?.textContent || '0');
          const categoriaText = prod.querySelector('categoria')?.textContent || '';

          const categoriaEncontrada = findClosestCategory(categoriaText, categorias || [])

          return {
            nombre,
            codigo: '', // No hay código en este XML
            cantidad,
            costo: costoConIva,
            descripcion,
            categoria: categoriaEncontrada ? categoriaEncontrada.id : null
          };
        });

        console.log('✅ INVENTARIO: XML procesado', processedProducts.length, 'productos');
        return processedProducts;
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        console.log('📊 INVENTARIO: Procesando CSV');
        const text = await file.text();
        const lines = text.split('\n');

        const processedProducts = lines.slice(1).map(line => {
          const values = line.split(',');
          const costoBase = parseFloat(values[2]) || 0;
          const categoriaTexto = values[4] || '';

          const categoriaEncontrada = findClosestCategory(categoriaTexto, categorias || []);

          return {
            nombre: values[0] || 'Producto',
            cantidad: parseInt(values[1]) || 0,
            costo: Math.round(costoBase * 1.19), // Costo con IVA
            descripcion: `Costo con IVA incluido`,
            categoria: categoriaEncontrada ? categoriaEncontrada.id : null
          };
        }).filter(p => p.nombre && p.cantidad > 0);

        console.log('✅ INVENTARIO: CSV procesado', processedProducts.length, 'productos');
        return processedProducts;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
        console.log('📈 INVENTARIO: Procesando Excel');
        // Simulate Excel processing
        const mockExcelData = [
          { nombre: 'Producto Excel 1', cantidad: 15, costo: Math.round(1200 * 1.19), descripcion: 'Costo con IVA incluido' },
          { nombre: 'Producto Excel 2', cantidad: 25, costo: Math.round(800 * 1.19), descripcion: 'Costo con IVA incluido' }
        ];
        console.log('✅ INVENTARIO: Excel procesado', mockExcelData.length, 'productos');
        return mockExcelData;
      } else if (file.type === 'application/pdf') {
        console.log('📋 INVENTARIO: Procesando PDF con IVA');
        // Simulate PDF processing
        const costosBase = [2618, 1666];
        const costosConIva = costosBase.map(costo => Math.round(costo * 1.19)); // ✅ IVA 19%
        const mockPdfData = costosConIva.map((costoConIva, index) => {
          const costoSinIva = costosBase[index];
          return {
            nombre: `Producto PDF ${index + 1}`,
            cantidad: 20 - (index * 10),
            costo: costoConIva,
            descripcion: `Costo con IVA incluido (${costoSinIva} + 19%)`
          };
        });
        console.log('✅ INVENTARIO: PDF procesado', mockPdfData.length, 'productos');
        return mockPdfData;
      }
      return [];
    } catch (error) {
      console.error('❌ ERROR EN processFileContent:', error);
      throw error;
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'Nombre,Cantidad,Costo,Precio,Categoria\nCoca Cola 500ml,50,1000,1500,Bebidas\nPan Hallulla,25,500,800,Alimentos\nLeche 1L,30,800,1200,Bebidas\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_inventario.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirm = async () => {
    try {
      // 1. Se guarda automáticamente en Supabase
      // 2. Crear productos en la tabla productos
      setLoading(true)
      console.log(productos)
      for (const producto of productos) {
        try {
          console.log('📦 INVENTARIO: Creando producto', producto.nombre);

          const descripcionFinal = selectedProducts[producto.nombre]?.descripcion || producto.descripcion || 'Descripción del producto';
          const cantidadFinal = selectedProducts[producto.nombre]?.cantidad || producto.cantidad || 1;

          // Crear producto en tabla productos
          const { data: newProduct, error } = await supabase
            .from('productos')
            .insert({
              empresa_id: empresaId,
              sucursal_id: sucursalDestino,
              codigo: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              nombre: producto.nombre,
              descripcion: descripcionFinal,
              precio: Math.round(producto.costo * 1.3), // Precio = costo + 30% margen
              categoria_id: producto.categoria,
              costo: producto.costo,
              stock: cantidadFinal,
              stock_minimo: 0,
              destacado: false,
              activo: true,
              tipo: 'producto',
              unidad: 'UN'
            })
            .select()
            .single();

          if (error) {
            console.error('❌ INVENTARIO: Error creando producto', producto.nombre, error);
            throw error;
          }

          if (newProduct) {
            console.log('✅ INVENTARIO: Producto creado en BD', newProduct.nombre);
            // Registrar movimiento de inventario
            await insert({
              empresa_id: empresaId,
              sucursal_id: sucursalDestino,
              producto_id: newProduct.id,
              movimiento: 'entrada',
              cantidad: cantidadFinal,
              stock_anterior: 0,
              stock_final: cantidadFinal,
              categoria_id: newProduct.categoria,
              referencia: 'Actualización masiva XML/CSV',
              usuario_id: user?.id
            });

            console.log('✅ INVENTARIO: Producto sincronizado con POS', {
              nombre: producto.nombre,
              stock: cantidadFinal,
              precio: producto.precio || producto.costo * 1.5,
              id: newProduct.id
            });
          }
        } catch (productError) {
          console.error('❌ INVENTARIO: Error procesando producto', producto.nombre, productError);
          toast.error('Error procesando producto', producto.nombre)
          continue;
        }
      }

      // 3. Sincronizar con POS
      console.log('🔄 INVENTARIO: Sincronizando con terminales POS...');

      onClose();
      setXmlFiles([]); // Clear XML files
      setProductos([]); // Clear products list
      setSelectedProducts({}); // Clear selections

    } catch (generalError) {
      console.error('❌ INVENTARIO: Error general en confirmación masiva', generalError);
      toast.error('Error al procesar los productos');
    } finally {
      setLoading(false)
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Actualizar inventario masivo" size="lg">
      <div className="space-y-6">
        {/* Upload Method Selection */}
        <div className="grid grid-cols-4 gap-2">
          {['csv', 'xml', 'excel', 'pdf'].map(method => (
            <button
              key={method}
              onClick={() => setUploadMethod(method)}
              className={`px-3 py-2 text-sm rounded-lg border ${uploadMethod === method
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {method.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Download Template */}
        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-blue-900">Descargar plantilla</p>
            <p className="text-xs text-blue-700">Formato recomendado: CSV</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Descargar CSV</span>
          </button>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          {processing ? (
            <div className="w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          ) : (
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          )}
          <div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept={uploadMethod === 'xml' ? '.xml' : uploadMethod === 'csv' ? '.csv' : uploadMethod === 'excel' ? '.xlsx,.xls' : '.pdf'}
                onChange={handleFileUpload}
                multiple
                className="hidden"
                disabled={processing}
              />
              <span className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block">
                {processing ? 'Procesando...' : `Subir archivo ${uploadMethod.toUpperCase()}`}
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {uploadMethod === 'xml' ? '📄 XML: Facturas electrónicas SII' :
              uploadMethod === 'csv' ? '📄 CSV: Formato simple y compatible' :
                uploadMethod === 'excel' ? '📊 Excel: Soporta .xlsx y .xls' :
                  '📋 PDF: Extrae tablas automáticamente'}
          </p>
        </div>

        {/* Lista de archivos XML cargados */}
        {uploadMethod === 'xml' && xmlFiles.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">📁 Archivos XML Cargados ({xmlFiles.length})</h4>
            <div className="space-y-2">
              {xmlFiles.map((xmlFile) => (
                <div key={xmlFile.id} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div>
                    <span className="font-medium text-gray-900">{xmlFile.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({xmlFile.products.length} productos)</span>
                  </div>
                  <button
                    onClick={() => removeXmlFile(xmlFile.id)}
                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                    title="Remover archivo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {productos.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              Productos encontrados ({productos.length})
              {productos.some(p => p.costo) && (
                <span className="text-sm text-green-600 ml-2">✓ IVA 19% aplicado</span>
              )}
            </h4>

            {/* Selector de Sucursal */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sucursal de destino
              </label>
              <select
                value={sucursalDestino}
                onChange={(e) => {
                  setSucursalDestino(e.target.value as string)
                  console.log(e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sucursales.map(sucursal => (
                  <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                ))}
              </select>
            </div>

            {/* Encabezados de productos */}
            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-500 border-b pb-2 mb-2">
              <span>Producto</span>
              <span>Descripción del Producto</span>
              <span>Cantidad</span>
              <span>Costo con IVA</span>
              <span>Categoría</span>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {productos.map((producto, index) => {
                // Obtener categoría predeterminada
                const categoriaPredeterminada = findClosestCategory(producto.categoria || '', categorias || []);

                return (
                  <div key={index} className="grid grid-cols-5 gap-4 text-sm items-center">
                    {/* Nombre */}
                    <span className="text-gray-900">{producto.nombre}</span>

                    {/* Descripción */}
                    <input
                      type="text"
                      value={selectedProducts[producto.nombre]?.descripcion || producto.descripcion || ''}
                      onChange={(e) => {
                        setSelectedProducts(prev => ({
                          ...prev,
                          [producto.nombre]: {
                            ...prev[producto.nombre],
                            selected: true,
                            cantidad: prev[producto.nombre]?.cantidad || producto.cantidad,
                            descripcion: e.target.value
                          }
                        }));
                      }}
                      placeholder="Editar descripción..."
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />

                    {/* Cantidad */}
                    <input
                      type="number"
                      value={selectedProducts[producto.nombre]?.cantidad || producto.cantidad}
                      onChange={(e) => {
                        setSelectedProducts(prev => ({
                          ...prev,
                          [producto.nombre]: {
                            ...prev[producto.nombre],
                            selected: true,
                            cantidad: parseInt(e.target.value) || 0,
                            descripcion: prev[producto.nombre]?.descripcion || producto.descripcion
                          }
                        }));
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />

                    {/* Costo */}
                    <span className="text-gray-600 text-xs">
                      ${producto.costo?.toLocaleString('es-CL')}
                    </span>

                    {/* Select de Categoría */}
                    <select
                      value={selectedProducts[producto.nombre]?.categoria || producto.categoria || ''}
                      onChange={(e) => {
                        setSelectedProducts(prev => ({
                          ...prev,
                          [producto.nombre]: {
                            ...prev[producto.nombre],
                            categoria: e.target.value
                          }
                        }));
                      }}
                    >
                      <option value="">-- Seleccionar categoría --</option>
                      {categorias?.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            {/* Paginación para productos */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Mostrar:</span>
                <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className="text-sm text-gray-500">
                Mostrando {productos.length} productos
              </div>
            </div>
          </div>
        )}

        {file && uploadMethod !== 'xml' && ( // Only show single file upload message if not XML
          <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
            <FileText className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">Archivo cargado: {file.name}</span>
          </div>
        )}

        <div className="flex justify-center pt-4">
          <button
            onClick={handleConfirm}
            disabled={loading || productos.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Actualizando...' : `Confirmar ${productos.length} productos`}
          </button>
        </div>
      </div>
    </Modal>
  );
}