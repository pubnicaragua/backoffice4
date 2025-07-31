### CORRECCIONES 31/07 AM

#### CORRECCIONES SOLVENDO POS v2

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
