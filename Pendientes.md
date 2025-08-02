#### CORRECCIONES BACKOFFICE 4 V3 01/08 AM

### 1) Ventas

- Revisar la consola,el componente se encuentra en un estado re re-renderizado permanente
- En "Filtros" los numeros de caja considero que estan estaticos,no cargas ningun endpoint para traerlos (no lo veo)

---

### 2) Recepción de Pedidos

- Al seleccionar cualquier pedido los datos que se cargan aparecen estaticos
- El descargar documento,descarga lso datos de manera estatica

---

### 3) Gestión de despachos

- Al seleccionar un despacho de la lista se cae la aplicacion en general

---

### 4) Promociones

- En el modal "Agregar promoción" se actualmente debes de ingresar el valor por cada producto (la idea es que la promocion tenga el mismo Nombre,Descripción,Tipo de Promoción,Sucursal,Precio) y los productos son los que se agregaran de manera dinamica
- El error anterior provoca que en la lista de promociones aparezcan los productos independientes y no anidados por promocio

---

#### CORRECCIONES SOLVENDO

### 1) Ventas

- En la seccion de "Clientes" -> "Registrar nuevo cliente" cuando el tipo de cliente sea empresa se deben eliminar los campos ["Nombre","Apellido"]
- En la seccion de "Clientes" -> "Registrar nuevo cliente" cuando el tipo de cliente sea emppersonaresa se deben eliminar los campos ["Razon-Social","Giro"]

---

### 2) Movimientos efectivo

- Se cae en general cuando despliegas la ventana

---

### 3) Devolucion

- Se cae en general cuando despliegas la ventana
