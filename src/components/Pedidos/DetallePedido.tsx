import { ArrowLeft, Calendar, Download } from "lucide-react";

interface DetallePedidoProps {
  onBack: () => void;
  productos: any[];
  proveedor: any[]
  pedido?: any;
}

export function DetallePedido({ onBack, pedido, productos, proveedor }: DetallePedidoProps) {
  // Calcular total de productos
  const total = productos.reduce(
    (acc, p) => acc + (p.costo ?? 0) * (p.cantidad ?? 1),
    0
  );

  console.log(proveedor)

  const handleDownloadDocument = () => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Guía de Despacho - ${pedido?.folio || 'SIN_FOLIO'}</title>
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
              <h2>${pedido?.proveedor?.nombre || 'Proveedor no definido'}</h2>
              <p>RUT: ${pedido?.proveedor?.rut || '---'}</p>
              <p>${pedido?.proveedor?.direccion || '---'}</p>
              <p>Tel: ${pedido?.proveedor?.telefono || '---'}</p>
            </div>
          </div>
          
          <div class="document-info">
            <h3>GUÍA DE DESPACHO</h3>
            <p><strong>Folio:</strong> ${pedido?.folio || 'SIN_FOLIO'}</p>
            <p><strong>Fecha:</strong> ${pedido?.fecha ? new Date(pedido.fecha).toLocaleDateString('es-CL') : new Date().toLocaleDateString('es-CL')}</p>
            <p><strong>Proveedor:</strong> ${pedido?.proveedor?.nombre || '---'}</p>
            <p><strong>Entregado por:</strong> ${pedido?.usuario?.nombre || '---'}</p>
          </div>
          
          <table class="products-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Cantidad</th>
                <th>Costo Unit.</th>
              </tr>
            </thead>
            <tbody>
              ${productos.map(p => `
                <tr>
                  <td>${p.nombre}</td>
                  <td>${p.sku}</td>
                  <td>${p.cantidad}</td>
                  <td>${p.costo}</td>
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
      a.download = `guia_despacho_${pedido?.folio || 'SIN_FOLIO'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
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
        {/* Lista de productos */}
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
                    <span className="text-gray-600">{producto.sku}</span>
                    <span className="text-gray-600">{producto.cantidad}</span>
                    <span className="text-gray-900 font-medium">{producto.costo}</span>
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

        {/* Información lateral */}
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
                  {pedido?.pedido.folio || "SIN_FOLIO"}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha:
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">
                    {pedido?.pedido.fecha
                      ? new Date(pedido.pedido.fecha).toLocaleDateString("es-CL")
                      : new Date().toLocaleDateString("es-CL")}
                  </span>
                  <Calendar className="w-4 h-4 text-gray-400" />
                </div>
              </div>
              {/* 
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recepcionado por:
                </label>
                <span className="text-sm text-gray-900">
                  {pedido.pedido?.usuario?.nombre || "No asignado"}
                </span>
              </div> */}
            </div>
          </div>

          {/* Vista previa de la guía */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Guía de despacho
            </h3>
            <div className="w-full h-64 bg-white border border-gray-200 rounded-lg p-4 text-xs font-mono overflow-y-auto">
              <div className="text-center mb-4">
                <img src="./logo_negro.svg" alt="Solvendo" className="h-8 mx-auto mb-2" />
                <div className="text-sm font-bold">{proveedor?.razon_social || "Proveedor"}</div>
                <div>RUT: {proveedor?.rut || "---"}</div>
                <div>{proveedor?.direccion || "---"}</div>
                <div>Tel: {proveedor?.telefono || "---"}</div>
              </div>

              <div className="border-t border-b border-gray-300 py-2 mb-2">
                <div className="flex justify-between">
                  <span>GUÍA DE DESPACHO</span>
                  <span>N° {pedido.pedido?.folio || "SIN_FOLIO"}</span>
                </div>
                <div>
                  Fecha:{" "}
                  {pedido.pedido?.fecha
                    ? new Date(pedido.pedido.fecha).toLocaleDateString("es-CL")
                    : new Date().toLocaleDateString("es-CL")}
                </div>
                <div>Proveedor: {proveedor.razon_social || "No asignado"}</div>
              </div>

              <div className="space-y-1 mb-2">
                {productos.slice(0, 3).map((producto, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{producto.nombre}</span>
                    <span>${producto.costo}</span>
                  </div>
                ))}
                {productos.length > 3 && (
                  <div className="text-center text-gray-500">
                    ... y {productos.length - 3} más
                  </div>
                )}
              </div>

              <div className="border-t border-gray-300 pt-2">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>${total.toLocaleString("es-CL")}</span>
                </div>
              </div>

              <div className="text-center mt-4 text-gray-500">
                <div>Entregado por: {pedido?.usuario?.nombre || "No asignado"}</div>
                <div>www.solvendo.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
