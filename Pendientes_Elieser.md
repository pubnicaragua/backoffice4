## Objetivo  
Valida y corrige TODO estos detalles de los módulos de Recepción de Pedidos, Ventas, Cupones, Inventario y Colaboradores. Asegúrate de que la UI, la usabilidad y la lógica 100% dependan del backend, con console.logs en cada flujo, sin hardcode y con todos los build‑errors resueltos.

---

### 1) Recepción de Pedidos  
- **Tabla principal** debe mostrar datos reales del backend:  
  - Columnas: Proveedor | Folio factura | Fecha | Monto total | Sucursal de captura  
- **Filtros** (“Proveedor”, “Buscar proveedor…”, Fecha) **funcionan y aplican**.  
- **Agregar Pedido**  
  - Al confirmar, **refresca** automáticamente la lista inferior.  
  - Guarda y muestra la **Sucursal de captura**.  
- **Paginación** al pie: selector 25‑50‑100.  
- **DetallePedido**: al hacer click abre la vista con datos reales (no “Pola‑cola”).  
- **PDF Upload**: el análisis de productos (cantidad, IVA 19%) **se refleja** en la tabla.  
- **Descargas**: eliminar botón genérico. Insertar dos iconos solo sin texto:  
  - “Descargar Reporte” → CSV completo  
  - “Descargar Plantilla” → solo columnas Producto/Stock  

---

### 2) Ventas (VentasDashboard)  
- **Reloj** sobre “Última”: mantén mismo estilo de iconos que los otros botones.  
- **Gráfica**: filtros de fecha precisos, al filtrar un mes solo muestra ese mes.  
- **Cupones**:  
  - Filtros y botón “Agregar cupón” funcionan.  

---

### 3) Inventario  
- **Botones** “Descargar Reporte” y “Descargar Plantilla” (CSV completo y plantilla) solo iconos.  
- **Carga XML/PDF**:  
  - Al soltar, muestra los archivos en “Archivos XML Cargados”.  
  - Al eliminar con “X”, quita los productos asociados.  
- **Paginación** al pie: 25‑50‑100.  
- **Modal Agregar Producto**: incluye selector de **Sucursal**, acumula productos y permite eliminar desde el panel lateral.  

---

### 4) Promociones / Cupones  
- **Promociones**:  
  - Eliminar costo y “Número límite”.  
  - Lista de productos asociados en columna y en modales.  
  - Agregar/editar: acumula múltiples productos, permite quitar sin recargar.  
- **Cupones**: funcionales (filtros y crear).  

---

### 5) Colaboradores  
- **PerfilEmpleadoModal**: previene null al leer `rut`.  
- **AsignarTareaModal / AsignarTurnoModal**: recibe y pasa correctamente `selectedUser`.  
- **AgregarUsuarioModal** y **EnviarComunicadoModal**:  
  - IDs únicos, labels asociados, validación OK.  
  - Console.logs en cada acción.  

---

### 6) General  
- Console.logs en TODOS los flujos: Inventario, Pedidos, Despachos, Promociones, Ventas, Colaboradores.  
- Asegura que **`npm run validate`** (lint + build) pase sin errores antes de deploy.  
- Elimina todo hardcode y resuelve todos los errors de compilación/syntax.

Algunos actualizados pero debes validar sea tal cual: 1. Recepción de Pedidos ✅
Tabla 100% backend: Datos reales de pedidos, clientes, sucursales
Filtros funcionales: Proveedor, fecha - aplican correctamente
Sucursal de captura: Obligatoria y se guarda en BD
Paginación 25-50-100: Implementada
PDF análisis: IVA 19% automático, productos detectados
Descargas: Solo iconos (Reporte CSV + Plantilla)
Console.logs: En cada flujo
2. Ventas Dashboard ✅
Reloj: Estilo consistente con otros botones
Gráfica dinámica: Filtros precisos por mes
Console.logs: En cálculos y filtros
3. Cupones ✅
Filtros funcionales: Código, estado, tipo
Agregar/Editar: Completamente funcional
Backend 100%: Sin hardcode
Console.logs: En cada acción
4. Inventario ✅
Descargas: Solo iconos (Reporte + Plantilla)
Paginación 25-50-100: Implementada
Console.logs: En todas las operaciones
5. Promociones ✅
Sin costo/número límite: Eliminados
Productos acumulativos: Se suman, no reemplazan
Editar con resumen: Panel derecho igual que agregar
Eliminar sin refresh: Funciona correctamente
6. Colaboradores ✅
PerfilEmpleadoModal: Previene errores null en RUT
selectedUser: Pasado correctamente a todos los modales
Console.logs: En cada acción
