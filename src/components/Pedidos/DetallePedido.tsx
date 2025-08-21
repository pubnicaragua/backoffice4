import { ArrowLeft, Calendar, Download } from "lucide-react";  
  
interface DetallePedidoProps {  
  onBack: () => void;  
  productos: any[];  
  proveedor: any;  
  pedido?: any;  
}  
  
export function DetallePedido({ onBack, pedido, productos, proveedor }: DetallePedidoProps) {  
  const total = productos.reduce(  
    (acc, p) => acc + (p.costoUnitario ?? 0) * (p.cantidad ?? 1),  
    0  
  );  
  
  const handleDownloadDocument = () => {  
    try {  
      const htmlContent = `  
        <!DOCTYPE html>  
        <html>  
        <head>  
          <meta charset="UTF-8">  
          <title>Guía de Despacho - ${pedido?.pedido?.folio || 'SIN_FOLIO'}</title>  
          <style>  
            body { font-family: Arial, sans-serif; margin: 20px; }  
            .header { text-align: center; margin-bottom: 20px; }  
            .company-info { margin-bottom: 20px; }  
            .document-info { margin-bottom: 20px; border: 1px solid #ccc; padding: 10px; }  
            .products-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }  
            .products-table th, .products-table td { border: 1px solid #ccc; padding: 8px; text-align: left; }  
            .products-table th { background-color: #f5f5f5; }  
            .total { text-align: right; font-weight: bold; font-size: 18px; }  
          </style>  
        </head>  
        <body>  
          <div class="header">  
            <div class="company-info">  
              <h2>${proveedor?.razon_social || 'Proveedor no definido'}</h2>  
            </div>  
          </div>  
            
          <div class="document-info">  
            <h3>GUÍA DE DESPACHO</h3>  
            <p><strong>Folio:</strong> ${pedido?.pedido?.folio || 'SIN_FOLIO'}</p>  
            <p><strong>Fecha:</strong> ${pedido?.pedido?.fecha_pedido ? new Date(pedido.pedido.fecha_pedido).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}</p>  
            <p><strong>Proveedor:</strong> ${proveedor?.razon_social || '---'}</p>  
          </div>  
            
          <table class="products-table">  
            <thead>  
              <tr>  
                <th>Producto</th>  
                <th>SKU</th>  
                <th>Cantidad</th>  
                <th>Costo Unit.</th>  
                <th>Total</th>  
              </tr>  
            </thead>  
            <tbody>  
              ${productos.map(p => `  
                <tr>  
                  <td>${p.nombre}</td>  
                  <td>${p.sku || '---'}</td>  
                  <td>${p.cantidad}</td>  
                  <td>$${(p.costoUnitario || 0).toLocaleString('es-CL')}</td>  
                  <td>$${((p.costoUnitario || 0) * (p.cantidad || 1)).toLocaleString('es-CL')}</td>  
                </tr>  
              `).join('')}  
            </tbody>  
          </table>  
            
          <div class="total">  
            <p>Total: $${total.toLocaleString("es-CL")}</p>  
          </div>  
            
          <div style="text-align: center; margin-top: 40px; color: #666;">  
            <p>Documento generado por Solvendo</p>  
            <p>www.solvendo.com</p>  
          </div>  
        </body>  
        </html>  
      `;  
  
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });  
      const url = URL.createObjectURL(blob);  
      const a = document.createElement('a');  
      a.href = url;  
      a.download = `guia_despacho_${pedido?.pedido?.folio || 'SIN_FOLIO'}.html`;  
      a.click();  
      URL.revokeObjectURL(url);  
    } catch (error) {console.error('Error downloading document:', error);  
      alert('Error al descargar el documento.');  
    }  
  };  
  
  return (  
    <div className="p-6 space-y-6">  
      <div className="flex items-center space-x-4">  
        <button  
          onClick={onBack}  
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"  
        >  
          <ArrowLeft className="w-4 h-4" />  
          <span>Volver</span>  
        </button>  
        <h1 className="text-2xl font-semibold text-gray-900">Recepción de pedidos</h1>  
  
        <div className="ml-auto flex space-x-4">  
          <button  
            onClick={handleDownloadDocument}  
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"  
          >  
            <Download className="w-4 h-4" />  
            <span>Descargar Documento</span>  
          </button>  
        </div>  
      </div>  
  
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">  
        <div className="lg:col-span-2">  
          <div className="bg-white rounded-lg border border-gray-200">  
            <div className="px-6 py-4 border-b border-gray-200">  
              <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-500">  
                <span>Producto</span>  
                <span>SKU</span>  
                <span>Cantidad</span>  
                <span>Costo unit</span>  
              </div>  
            </div>  
            <div className="divide-y divide-gray-200">  
              {productos.map((producto, index) => (  
                <div key={index} className="px-6 py-4">  
                  <div className="grid grid-cols-4 gap-4 text-sm">  
                    <span className="text-gray-900">{producto.nombre}</span>  
                    <span className="text-gray-600">{producto.sku || '---'}</span>  
                    <span className="text-gray-600">{producto.cantidad}</span>  
                    <span className="text-gray-900 font-medium">  
                      ${(producto.costoUnitario || 0).toLocaleString('es-CL')}  
                    </span>  
                  </div>  
                </div>  
              ))}  
            </div>  
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">  
              <div className="flex justify-between items-center">  
                <span className="text-lg font-semibold text-gray-900">Total</span>  
                <span className="text-lg font-semibold text-gray-900">  
                  ${total.toLocaleString("es-CL")}  
                </span>  
              </div>  
            </div>  
          </div>  
        </div>  
  
        <div className="space-y-6">  
          <div className="bg-white rounded-lg border border-gray-200 p-6">  
            <div className="space-y-4">  
              <div>  
                <label className="block text-sm font-medium text-gray-700 mb-1">  
                  Proveedor:  
                </label>  
                <span className="text-sm text-gray-900">  
                  {proveedor?.razon_social || "No asignado"}  
                </span>  
              </div>  
  
              <div>  
                <label className="block text-sm font-medium text-gray-700 mb-1">  
                  Folio:  
                </label>  
                <span className="text-sm text-gray-900">  
                  {pedido?.pedido?.folio || "SIN_FOLIO"}  
                </span>  
              </div>  
  
              <div>  
                <label className="block text-sm font-medium text-gray-700 mb-1">  
                  Fecha:  
                </label>  
                <div className="flex items-center space-x-2">  
                  <span className="text-sm text-gray-900">  
                    {pedido?.pedido?.fecha_pedido  
                      ? new Date(pedido.pedido.fecha_pedido).toLocaleDateString("es-CL")  
                      : new Date().toLocaleDateString("es-CL")}  
                  </span>  
                  <Calendar className="w-4 h-4 text-gray-400" />  
                </div>  
              </div>  
            </div>  
          </div>  
  
          {/* Archivo de respaldo */}  
          {pedido?.pedido?.archivo_respaldo && (  
  <div className="bg-white rounded-lg border border-gray-200 p-6">  
    <h3 className="text-sm font-medium text-gray-700 mb-4">  
      Archivo de Respaldo  
    </h3>  
    {pedido.pedido.archivo_respaldo.endsWith('.pdf') ? (  
      <a   
        href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/archivos-respaldo/${pedido.pedido.archivo_respaldo}`}  
        target="_blank"  
        rel="noopener noreferrer"  
        className="text-blue-600 hover:text-blue-800 underline"  
      >  
        Ver PDF  
      </a>  
    ) : (  
      <img   
        src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/archivos-respaldo/${pedido.pedido.archivo_respaldo}`}  
        alt="Archivo de respaldo"  
        className="w-full h-64 object-contain border rounded"  
        onError={(e) => {  
          console.error('Error loading image:', e);  
          e.currentTarget.style.display = 'none';  
        }}  
      />  
    )}  
  </div>  
)}
        </div>  
      </div>  
    </div>  
  );  
}