### CORRECCIONES 31/07 AM

#### CORRECCIONES SOLVENDO POS

### 1) Home

- Al precionar el icono de perfil aparecen 2 campos,"Caja aperturada" al parecer muestra datos estaticos,no corresponde a los datos que se cargan del endpoint
- El buscador de clientes en el lado izquierdo,al escribir cualquier caracter que coincida con algun cliente realiza una auto seleccion (sugerencia:eliminar ese campo,no le veo uso logico)
- Al aplicar un cupon ya se valida si es valido o no,pero dudo de esa procedencia,pues no se realiza ninguna consulta a nivel sql ni al cargar la pagina,ni al buscar (revisa de donde traes esos datos)
- La "Boleta manual" sigue dando errores a la hora de realizar el pago
- En el menu de seleccion de metodos de pago la opcion "Boleta manual" aparece duplicada
- En la seccion de "Clientes" -> "Registrar nuevo cliente" cuando el tipo de cliente sea empresa se deben eliminar los campos ["Nombre","Apellido"]
- En la seccion de "Clientes" -> "Registrar nuevo cliente" cuando el tipo de cliente sea emppersonaresa se deben eliminar los campos ["Razon-Social","Giro"]
- Corregir en "Clientes" -> "Registrar nuevo cliente" los estilos y css de los botones que aparecen ahi

---

### 2) Cierre de caja

- El header -> icono de usuario en esta seccion tiene un comportamiento extrano en relacion con el del home (muestra datos diferentes)

---

### 3) Devolucion

- Al abrir la vista devolucion no se dispara ningun endpoint de la API,asumo que me estas mostrando datos estaticos,validar eso
- El buscador de "Folio de documento" tiene un comportamiento extrano,actualmente lo que sea que busques lo agrega fijo en el componente de abajo
- El buscador por "Clientes" no funciona o no tiene ninguna funcion corriendo por detras
- El buscador por "Producto o servicio" no funciona no tiene ninguna funcion corriendo por detras

---

### 4) Movimiento de efectivo

- El No de caja no creo que sea los correctos,pues no se realiza ninguna consulta a la API para extraer esa informacion (asumo que estan en duro)

---

### 5) Despacho

- El menu de seleccion "Caja" muestra datos estaticos (no se usa ningun endpoint para traer esos datos)
- El menu de seleccion "Sucursal" muestra datos estaticos (no se usa ningun endpoint para traer esos datos)

---

### GENERAL

- El icono de usuario en toda la aplicacion en general que aparece en el header si comporta de maneras extranas

---

#### CORRECCIONES BACKOFICE 4

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
