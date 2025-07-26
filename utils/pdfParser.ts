interface Producto {
  numero_serie: string;
  cantidad: number;
  descripcion: string;
  total: number | null;
}

interface ResultadoExtraccion {
  proveedor: string | null;
  productos: Producto[];
  costo_total: number | null;
}

export function extraerDatosCompletos(texto: string): ResultadoExtraccion {
  const delimitadoresProveedor = "(Limitada|Ltda|SpA|SPA|S\\.A|E\\.I\\.R\\.L)";

  const patronProveedor = new RegExp(
    "([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]+(?:\\s+[A-Za-zÁÉÍÓÚÜÑa-záéíóúüñ0-9]+)*\\s+" +
      delimitadoresProveedor +
      ")",
    "u"
  );

  const matchProveedor = patronProveedor.exec(texto);
  const proveedor = matchProveedor ? matchProveedor[1].trim() : null;

  const triggerInicio = "NRO. DE SERIE   TOTAL";
  const triggerFin = "TIPO DE TRASLADO";

  let inicio: number;
  let fin: number;

  try {
    inicio = texto.indexOf(triggerInicio) + triggerInicio.length;
    fin = texto.indexOf(triggerFin, inicio);
  } catch {
    return { proveedor, productos: [], costo_total: null };
  }
  if (inicio < triggerInicio.length || fin === -1) {
    return { proveedor, productos: [], costo_total: null };
  }

  let segmento = texto.slice(inicio, fin).trim();
  segmento = segmento.replace(/\s{2,}/g, "  ");

  const patronProducto = /(\S+)\s{2}(\d+)\s{2}(.+?)\s{2}(\d{1,3}(?:\.\d{3})*)/g;

  const productos: Producto[] = [];
  let matchProducto;
  while ((matchProducto = patronProducto.exec(segmento)) !== null) {
    const nroSerie = matchProducto[1];
    if (/despacho|envio/i.test(nroSerie)) continue;

    const cantidad = parseInt(matchProducto[2], 10);
    const descripcion = matchProducto[3].trim();
    const totalStr = matchProducto[4];
    const totalSinPuntos = totalStr.replace(/\./g, "");
    let total: number | null = null;
    if (!isNaN(Number(totalSinPuntos))) {
      total = parseFloat(totalSinPuntos);
    }

    productos.push({
      numero_serie: nroSerie,
      cantidad,
      descripcion,
      total,
    });
  }

  let costo_total: number | null = null;
  const patronTotal = /TOTAL\s*\$\s*(\d{1,3}(?:\.\d{3})*)/i;
  const matchTotal = patronTotal.exec(texto);
  if (matchTotal) {
    const totalStr = matchTotal[1];
    const totalSinPuntos = totalStr.replace(/\./g, "");
    if (!isNaN(Number(totalSinPuntos))) {
      costo_total = parseFloat(totalSinPuntos);
    }
  }

  return {
    proveedor,
    productos,
    costo_total,
  };
}
