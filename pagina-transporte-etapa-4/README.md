# Página de transporte — Etapa 4

Esta etapa mejora el panel del administrador y elimina del lado del pasajero
la herramienta que permitía reiniciar las reservas.

## Cambios principales

- Se eliminó del `index.html` la sección **Herramienta de prueba**.
- El administrador mantiene el listado general de registros de pasajeros.
- Cada concierto tiene ahora una opción **Ver asientos**.
- La vista de asientos muestra:
  - Asientos disponibles.
  - Asientos reservados con pasajero identificado.
  - Asientos ocupados que no tienen datos asociados.
  - Nombre, teléfono y correo asignados a cada asiento.
- Se pueden descargar los datos del concierto en:
  - Excel compatible (`.xls`).
  - CSV compatible con Excel y otras hojas de cálculo.

## Inicio recomendado

Ejecuta la carpeta completa con **Live Server** y abre:

```text
login.html
```

## Credenciales de pasajeros

| Nombre | Correo | Contraseña |
|---|---|---|
| Camila Soto | camila.soto@correo.cl | camila123 |
| Diego Morales | diego.morales@correo.cl | diego123 |
| Valentina Rojas | valentina.rojas@correo.cl | valentina123 |

## Administrador

- Correo: `admin@transporte.cl`
- Contraseña: `admin123`

## Cómo revisar los asientos

1. Ingresa mediante `admin-login.html`.
2. En **Conciertos registrados**, presiona **Ver asientos**.
3. Se abrirá una ventana con el mapa del furgón.
4. Los colores representan:
   - Blanco: disponible.
   - Verde: reservado con datos de pasajero.
   - Rojo: ocupado sin datos asociados.
5. Debajo se muestra una tabla con la asignación de cada asiento.

## Descargas

Dentro de la vista **Ver asientos** existen dos botones:

- **Descargar Excel (.xls):** genera un archivo que se abre con Microsoft
  Excel y LibreOffice Calc.
- **Descargar CSV:** genera un archivo de texto tabular con codificación UTF-8.

Ambos archivos incluyen:

- Concierto y fecha.
- Hora y punto de salida.
- Número de asiento.
- Estado del asiento.
- Nombre del pasajero.
- Tipo de pasajero.
- Teléfono.
- Correo.
- Identificador y fecha de reserva.

El archivo `.xls` es una exportación compatible con Excel generada directamente
en el navegador. Más adelante, con un backend o una librería especializada, se
puede reemplazar por un archivo `.xlsx` moderno con varias hojas y formatos más
avanzados.

## Estructura

```text
pagina-transporte-etapa-4/
├── login.html
├── admin-login.html
├── index.html
├── admin.html
├── css/
│   ├── styles.css
│   ├── login.css
│   └── admin.css
├── js/
│   ├── auth.js
│   ├── login.js
│   ├── admin-login.js
│   ├── storage.js
│   ├── app.js
│   └── admin.js
├── assets/
└── README.md
```

## Consideración sobre reservas antiguas

Los asientos de ejemplo que ya aparecen ocupados no tienen una persona asociada.
Por eso se muestran en rojo como **Ocupado sin datos**. Las reservas nuevas sí
quedan asociadas al nombre, teléfono y correo del pasajero.

## Advertencia de seguridad

El proyecto continúa usando `localStorage`. Las sesiones, contraseñas y reservas
solo sirven para pruebas locales. Una versión real necesita backend, base de
datos, contraseñas con hash y validación de permisos desde el servidor.
