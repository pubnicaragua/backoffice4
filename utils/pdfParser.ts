// pdfParser.ts

export interface ProductExtracted {
  nombre: string; // nombre o descripción
  descripcion?: string;
  cantidad: number;
  costo_sin_iva?: number;
  costo_con_iva?: number;
  total: number; // total sin IVA, costo_sin_iva * cantidad habitualmente
}

export interface ParsedPdfData {
  formatDetected: "FORMATO_1" | "FORMATO_2" | "UNKNOWN";
  productos: ProductExtracted[];
  subtotal?: number;
  neto?: number;
  iva?: number;
  totalGeneral?: number;
  error?: string;
}

/** Normaliza texto para limpiar espacios extra */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Convierte cadena numérica chilena a número flotante */
function parseNumber(valueStr: string): number {
  if (!valueStr) return NaN;
  const cleanedStr = valueStr
    .replace(/[^0-9,\.-]/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  return parseFloat(cleanedStr);
}

/** Parsea texto para Formato 1 (CANTIDAD PRODUCTO MONTO) */
function parseFormat1(text: string): ProductExtracted[] {
  const lines = text.split("\n").map(normalizeText);
  const prods: ProductExtracted[] = [];

  const regex = /^(\d+)\s*X\s*([\d.,]+)\s+(.+?)\s*\$\s*([\d.,]+)$/i;

  let startParsing = false;
  for (const line of lines) {
    if (line.includes("CANTIDAD PRODUCTO MONTO")) {
      startParsing = true;
      continue;
    }
    if (
      startParsing &&
      (line.includes("SUBTOTAL") ||
        line.includes("NETO") ||
        line.includes("TOTAL") ||
        line.includes("I.V.A."))
    )
      break;

    if (startParsing) {
      const m = line.match(regex);
      if (m) {
        const cantidad = parseNumber(m[1]);
        const costoSinIva = parseNumber(m[4]);
        const descripcion = m[3].trim();
        const costoConIva = Math.round(costoSinIva * 1.19);
        if (!isNaN(cantidad) && !isNaN(costoSinIva) && descripcion.length > 0) {
          prods.push({
            nombre: descripcion,
            descripcion: `Costo con IVA incluido (${costoSinIva} + 19%): $${costoConIva}`,
            cantidad,
            costo_sin_iva: costoSinIva,
            costo_con_iva: costoConIva,
            total: cantidad * costoSinIva,
          });
        }
      }
    }
  }
  return prods;
}

/** Parsea texto para Formato 2 (CÓDIGO CANTIDAD DESCRIPCIÓN NRO. DE SERIE TOTAL) */
function parseFormat2(text: string): ProductExtracted[] {
  const lines = text.split("\n").map(normalizeText);
  const prods: ProductExtracted[] = [];

  const regex = /^(?:[A-Z0-9\/\-]+)?\s*(\d+)\s+(.+?)\s+([\d.,]+)$/i;

  let startParsing = false;
  for (const line of lines) {
    if (line.includes("CÓDIGO CANTIDAD DESCRIPCIÓN NRO. DE SERIE TOTAL")) {
      startParsing = true;
      continue;
    }
    if (
      startParsing &&
      (line.includes("SUBTOTAL") ||
        line.includes("DESCUENTO") ||
        line.includes("NETO") ||
        line.includes("TOTAL"))
    )
      break;

    if (startParsing) {
      const m = line.match(regex);
      if (m) {
        const cantidad = parseNumber(m[1]);
        const descripcion = m[2].trim();
        const costoSinIva = parseNumber(m[3]);
        const costoConIva = Math.round(costoSinIva * 1.19);
        if (!isNaN(cantidad) && !isNaN(costoSinIva) && descripcion.length > 0) {
          prods.push({
            nombre: descripcion,
            descripcion: `Costo con IVA incluido (${costoSinIva} + 19%): $${costoConIva}`,
            cantidad,
            costo_sin_iva: costoSinIva,
            costo_con_iva: costoConIva,
            total: cantidad * costoSinIva,
          });
        }
      }
    }
  }
  return prods;
}

/** Función principal que detecta tipo y parsea */
export function parsePdfContent(fullText: string): ParsedPdfData {
  if (!fullText || typeof fullText !== "string") {
    return {
      formatDetected: "UNKNOWN",
      productos: [],
      error: "El texto del PDF está vacío o es inválido.",
    };
  }
  const normalizedText = normalizeText(fullText);
  if (normalizedText.includes("CANTIDAD PRODUCTO MONTO")) {
    return {
      formatDetected: "FORMATO_1",
      productos: parseFormat1(fullText),
    };
  } else if (
    normalizedText.includes("CÓDIGO CANTIDAD DESCRIPCIÓN NRO. DE SERIE TOTAL")
  ) {
    return {
      formatDetected: "FORMATO_2",
      productos: parseFormat2(fullText),
    };
  } else {
    return {
      formatDetected: "UNKNOWN",
      productos: [],
      error: "Formato de PDF no reconocido",
    };
  }
}
