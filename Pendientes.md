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

- **Seccion opciones de caja**: NADA DE LO QUE AHI APARECE ES FUNCIONAL (Palabras de Andres)

---

### 4) Documentos

- **Seccion Documentos emitidos**:
  - El modal de "detalles del documento" tiene en duro la 2da y 3ra seccion
  - Al presionar cualquier elemento de la lista que no sea el primero no me aparece ningun modal
  - Todos los datos que se muestran en esta lista estan en duro,se realiza la peticion a la BD,pero no se muestran lso datos
  - El modal de filtro por fecha no funciona

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
- En el panel de filtro "Buscar producto" no sigue la misma logica que el resto de los componentes (no me genera el autocompletado)
- En ventas,cuando aplicas los filtros por metodo de pago si el total que tenemos es de 24 ventas y cuando filtramos por efectivo salen 20,cuando filtres por tarjeta deberia de salir el resto,no lo hace.....
- Ninguno de lso 2 refresh funciona

---

### 6) Inventario
  - El editar producto no funciona,el endpoint genera error 409 en todos los casos de prueba
  - Actualizar inventario masivo,descargar (los dos) no tienen sus funcionalidades
  

