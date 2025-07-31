### CORRECCIONES 30/07 PM

#### CORRECCIONES SOLVENDO POS v2

### 1) Home

- **Ventana para pagar productos**:
  - El buscador de clientes no tiene ninguna funcionalidad corriendo por detras (no realiza accion ni retorna nada)
  - Al selecciona "Tipo de documento" -> "Boleta manual" y proceder al pago se genera un error por parte del endpoint que consumes (new row for relation "ventas" violates check constrain "ventas_tipo_dte_check")
  - La boleta que se imprime una vez generado el pago no se envia al correo seleccionado y los datos que meustra los hace de manera estatica
  - A la hora de realizar el pago con cupon de descuento,no valida si el cupon existe,tampoco se ve reflejado cuanto descontara con dicho cupon
  - En la seccion de "Clientes" -> "Registrar nuevo cliente" cuando el tipo de cliente sea empresa se deben eliminar los campos ["Nombre","Apellido"]
  - En la seccion de "Clientes" -> "Registrar nuevo cliente" cuando el tipo de cliente sea emppersonaresa se deben eliminar los campos ["Razon-Social","Giro"]
  - Corregir en "Clientes" -> "Registrar nuevo cliente" los estilos y css de los botones que aparecen ahi
  - Al seleccionar un cliente aparecen 3 mensajes toast en vez de uno

---

### 2) Cierre de caja

- La fecha en "Fecha del cierre" aparece estatica o por lo menos a mi se me muestra mal

---

### 3) Devolucion

- El buscador por productos no funciona o no devuelve datos
- El buscador por clientes no funciona o no devuelve datos
- En esta vista se carga la pantalla pero no se realizan peticiones a la API,asumo que esta mostrando datos estaticos

---

### 4) Reimprimir

- El buscador siempre retorna "Busqueda exitosa" aun el campo ingresado sea nulo,validar este
- Una vez seleccionas una boleta no aparece ningun boton que te permita ir al estado anterior para seleccionar otra
- El buscador funciona de manera extrana (no busca,sino que te selecciona la priemra coincidencia que encuentre)

---

### 5) Despacho

- Al generar un despacho el menu de opciones de "Caja" y "Sucursal" muestra lso datos de manera estatica y no los carga de la API

---

### 6) Login

- Los inputs al del logion tienen un comportamiento erroneo con lso estls css

---
