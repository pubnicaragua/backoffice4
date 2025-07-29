#### CORRECCIONES BACKOFICE 4 ####

### 1) Recepción de Pedidos

- **Filtrar por fecha** Actualmente funciona mal,no muestra correctamente los productos del dia seleccionado

---

### 2) Gestion de despachos

- **Detalles del despacho** Al seleccionar cualquier elemento de la lista de despachos,el modal que muestra los detalles lo hace mostradome datos en duro
- **Editar despacho**: El componente no funciona en general
- **Elementos de filtro**:
- El elemento de ordenar por fecha no funciona correcamente
- El elemento de mostrar x cant. de datos no funciona correcamente

---

### 3) Informacion POS

- **Seccion movimientos en efectivo**:

  - Los datos que aparecen en la columna "Sucursales" se encuentran en duro
  - Los datos que aparecen en la columna "Caja" se encuentran en duro
  - En el menu de filtros no funciona el campo tipo de movimiento
  - El No` de cajas aparece en duro,no se carga de la BD (asumo que es un error)

- **Seccion opciones de caja**: NADA DE LO QUE AHI APARECE ES FUNCIONAL

---

### 4) Documentos

- **Seccion Documentos emitidos**:
  - El modal de "detalles del documento" tiene en duro la 2da y 3ra seccion
  - Al presionar cualquier elemento de la lista que no sea el primero no me aparece ningun modal
  - Todos los datos que se muestran en esta lista estan en duro,se realiza la peticion a la BD,pero no se muestran los datos (sucursales - No cajas)
  - El modal de filtro por fecha no funciona,tambien se le debe de permitir agregar hora
  - Tambien se debe permitir filtrar por monto total
  - Agregar una barra de busqueda que te permita buscar por folio desde el panel principal de este modulo

---

### 5) Colaboradores

- **Seccion Gestion usuarios**:
  - Al desplegar el modal de descripccion de cada usuario consumes diversos ednpoints,entre estos hay 2 que estan dando error 400 "son los endpoints encargados de mostrar los datos del usuario y sus permisos"
  - Agregar tareas modal de descripccion de cada usuario activa el endpoint pero en la ventana se mantienen los datos estaticos
  - Los endpoints para editar los roles y permisos de los usuarios dan error 400,no se realiza la en modal de descripccion de cada usuario
  - El endpoint de asignar turno en modal de descripccion de cada usuario no esta trabajando,las sucursales que aparecen listadas no son las correctas (tiene una de mas)
  - Los filtros de esta seccion estan mal,permite filtrar por fechas pero no las muestro en ninguna columna,las sucursales a usar para filtrar estan estaticas

---

### 6) Ventas

- **Panel principal**:
  - En el panel de filtro "Buscar producto" no sigue la misma logica que el resto de los componentes (no me genera el autocompletado),tampoco esta funcioando
  - En ventas,cuando aplicas los filtros por metodo de pago si el total que tenemos es de 24 ventas y cuando filtramos por efectivo salen 20,cuando filtres por tarjeta deberia de salir el resto,no lo hace.....
  - Ninguno de los 2 refresh funciona
  - En el panel de filtro "Buscar producto" por cajero no esta funcionando

---

### 7) Inventario

- El editar producto no funciona,el endpoint genera error 409 en todos los casos de prueba
- Actualizar inventario masivo,descargar (los dos botones) no tienen sus funcionalidades

---

### 8) Promociones

- **Panel agregar promociones**:
  - Al agregar una promocion el nombre,la descripcion y el precio deberian de ser unicos (un solo ingreso) y los productos deberian de ir acumulandose

---
---

#### CORRECCIONES SOLVENDO POS ####

### 1) Home

- **Ventana para pagar productos**:
  - Al seleccionar "Tipo de documento" -> "Facturacion electronica", se necesita seleccionar el cliente o registrarlo en caso de no estar
  - El campo de "Descuento" no esta funcionando (no se ven los cambios de manera visual - no aplica el descuesto por detras)
  - Eliminar el boton de seleccion "Entrega inmediata",este campo debe aparecer por defecto sin necesidad de seleccionarlo con el boton
  - El campo "Monto recivido" tiene un comportamiento extrano con el numero 0 que aparece por defecto (no se remplaza o elimina al insertar mas numeros)
  - El componente "Toast" que lanza un error cuando no se puede "Confirmar pago" lanza un mensaje poco intuitivo para el usuario (arroja el error en codigo,no da descripccion del error)
  - Al seleccionar en "Tipo de documento" -> "Boleta manual" no te permite realizar el pago y lanza un error
  - El comprobante que se imprime una vez realizado el pago no muestra los datos correctos (productos)
  - En la seccion de "Clientes" -> "Registrar nuevo cliente" en la misma ventana,corregir temas de diseno,el css sigue estilos raros que no estan acorde al figma
  - En la seccion de "Clientes" -> "Registrar nuevo cliente" cuando el tipo de cliente sea empresa se deben eliminar los campos ["Nombre","Apellido"]
  - En la seccion de "Clientes" -> "Registrar nuevo cliente" cuando el tipo de cliente sea emppersonaresa se deben eliminar los campos ["Razon-Social","Giro"]

---

### 2) Devolucion

- **Modal "Datos del cliente"**:
  - No se puede escribir ni modificar el RUT del cliente
  - Al seleccionar en "Tipo de rembolso" -> "Bancario" debes de visualizarse los campos ["Tipo de cuenta","No cuenta","Nombre del banco"]

---

### 3) Reportes

- "REALIZAR UNA COPIA LO MAS SIMILAR POSIBLE A BACKOFFICE": No me dio detalles concretos de este apartado,el comentario anterior son palabras textuales de Andre,los componentes deben de tener el mismo funcionamiento y graficamente debe de ser similar a BackOffice
- Eliminar el simbolo $ en unidades vendidas y No` ventas
- En el menu filtro debe aparecer opciones como agregar productos con poco movimiento y con mucho movimiento

---

### 4) Despacho

- "La funcionalidad de despachar esta rota por completo",revisar el componente de manera general

---
---

#### GENERAL ####
 - En muchos componentes se detecto que las cajas y las sucursales aparecen de manera estatica y no se cargan de la BD 
