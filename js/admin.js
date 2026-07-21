/* =========================================================
   DISTRIBUCIÓN DEL FURGÓN
   ========================================================= */

const distribucionAsientosAdmin = [
    ["A1", "A2", "A3", null],
    ["A4", "A5", null, null],
    ["A6", "A7", null, "A8"],
    ["A9", "A10", null, "A11"],
    ["A12", "A13", "A14", "A15"]
];

const todosLosAsientosAdmin = distribucionAsientosAdmin
    .flat()
    .filter((asiento) => asiento !== null);


/* =========================================================
   REFERENCIAS DEL HTML
   ========================================================= */

const formularioConcierto = document.getElementById("formulario-concierto");
const campoId = document.getElementById("concierto-id");
const campoNombre = document.getElementById("nombre");
const campoFecha = document.getElementById("fecha");
const campoHora = document.getElementById("hora");
const campoLugar = document.getElementById("lugar");
const campoPuntoSalida = document.getElementById("punto-salida");
const tituloFormulario = document.getElementById("titulo-formulario");
const botonGuardar = document.getElementById("boton-guardar");
const botonCancelar = document.getElementById("boton-cancelar");
const botonRestaurar = document.getElementById("boton-restaurar");
const listaConciertos = document.getElementById("lista-conciertos");
const contadorConciertos = document.getElementById("contador-conciertos");
const sinConciertos = document.getElementById("sin-conciertos");
const mensajeAdmin = document.getElementById("mensaje-admin");

const administradorSesion = document.getElementById("administrador-sesion");
const botonCerrarSesionAdmin =
    document.getElementById("boton-cerrar-sesion-admin");

const listaReservas = document.getElementById("lista-reservas");
const contadorReservas = document.getElementById("contador-reservas");
const sinReservas = document.getElementById("sin-reservas");

const modalAsientos = document.getElementById("modal-asientos");
const tituloModalAsientos = document.getElementById("titulo-modal-asientos");
const subtituloModalAsientos = document.getElementById("subtitulo-modal-asientos");
const botonCerrarModal = document.getElementById("boton-cerrar-modal");
const botonDescargarExcel = document.getElementById("boton-descargar-excel");
const botonDescargarCsv = document.getElementById("boton-descargar-csv");
const mapaAsientosAdmin = document.getElementById("mapa-asientos-admin");
const listaDetalleAsientos = document.getElementById("lista-detalle-asientos");
const resumenTotal = document.getElementById("resumen-total");
const resumenDisponibles = document.getElementById("resumen-disponibles");
const resumenConPasajero = document.getElementById("resumen-con-pasajero");
const resumenSinDatos = document.getElementById("resumen-sin-datos");


/* =========================================================
   ESTADO
   ========================================================= */

let sesionAdministrador = null;
let conciertos = [];
let conciertoDetalleActual = null;
let estadosAsientosActuales = [];


/* =========================================================
   INICIO
   ========================================================= */

function iniciarAdministracion() {
    sesionAdministrador = protegerPaginaAdministrador();

    if (!sesionAdministrador) {
        return;
    }

    administradorSesion.textContent =
        `Administrador: ${sesionAdministrador.usuario.nombre}`;

    botonCerrarSesionAdmin.addEventListener(
        "click",
        () => cerrarSesion("admin-login.html")
    );

    inicializarDatosConciertos();
    actualizarPanel();

    formularioConcierto.addEventListener(
        "submit",
        guardarConciertoDesdeFormulario
    );
    botonCancelar.addEventListener("click", limpiarFormulario);
    botonRestaurar.addEventListener(
        "click",
        restaurarDatosDeEjemplo
    );

    botonCerrarModal.addEventListener("click", cerrarDetalleAsientos);
    modalAsientos.addEventListener("click", (evento) => {
        if (evento.target.matches("[data-cerrar-modal]")) {
            cerrarDetalleAsientos();
        }
    });

    botonDescargarExcel.addEventListener("click", descargarExcelActual);
    botonDescargarCsv.addEventListener("click", descargarCsvActual);

    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape" && !modalAsientos.classList.contains("oculto")) {
            cerrarDetalleAsientos();
        }
    });

    window.addEventListener("storage", (evento) => {
        if (
            evento.key === CLAVE_CONCIERTOS ||
            evento.key === CLAVE_RESERVAS ||
            evento.key === CLAVE_DETALLES_RESERVAS
        ) {
            actualizarPanel();

            if (conciertoDetalleActual) {
                abrirDetalleAsientos(conciertoDetalleActual.id);
            }
        }
    });
}


function actualizarPanel() {
    actualizarListaConciertos();
    renderizarReservas();
}


/* =========================================================
   CREAR Y EDITAR CONCIERTOS
   ========================================================= */

function guardarConciertoDesdeFormulario(evento) {
    evento.preventDefault();
    limpiarMensajeAdmin();

    const datos = obtenerDatosFormulario();

    if (!datos) {
        return;
    }

    const idEnEdicion = campoId.value;

    const hayDuplicado = conciertos.some((concierto) => {
        const esElMismoRegistro =
            String(concierto.id) === idEnEdicion;
        const mismoNombre =
            concierto.nombre.trim().toLowerCase() ===
            datos.nombre.toLowerCase();
        const mismaFecha = concierto.fecha === datos.fecha;

        return !esElMismoRegistro && mismoNombre && mismaFecha;
    });

    if (hayDuplicado) {
        mostrarMensajeAdmin(
            "Ya existe un concierto con ese nombre en la misma fecha.",
            "error"
        );
        return;
    }

    if (idEnEdicion) {
        editarConcierto(idEnEdicion, datos);
    } else {
        agregarConcierto(datos);
    }
}


function obtenerDatosFormulario() {
    const nombre = campoNombre.value.trim();
    const fecha = campoFecha.value;
    const hora = campoHora.value;
    const lugar = campoLugar.value.trim();
    const puntoSalida = campoPuntoSalida.value.trim();

    if (!nombre || !fecha || !hora || !lugar || !puntoSalida) {
        mostrarMensajeAdmin(
            "Completa todos los campos del formulario.",
            "error"
        );
        return null;
    }

    return {
        nombre,
        fecha,
        hora,
        lugar,
        puntoSalida
    };
}


function agregarConcierto(datos) {
    const nuevoConcierto = {
        id: generarIdConcierto(conciertos),
        ...datos,
        asientosOcupadosIniciales: []
    };

    conciertos.push(nuevoConcierto);
    guardarConciertos(conciertos);
    actualizarPanel();
    limpiarFormulario(false);

    mostrarMensajeAdmin(
        `El concierto “${nuevoConcierto.nombre}” fue agregado correctamente.`,
        "exito"
    );
}


function editarConcierto(idConcierto, datos) {
    const indice = conciertos.findIndex(
        (concierto) =>
            String(concierto.id) === String(idConcierto)
    );

    if (indice === -1) {
        mostrarMensajeAdmin(
            "No se encontró el concierto que intentas editar.",
            "error"
        );
        return;
    }

    conciertos[indice] = {
        ...conciertos[indice],
        ...datos
    };

    const nombreEditado = conciertos[indice].nombre;

    guardarConciertos(conciertos);
    actualizarPanel();
    limpiarFormulario(false);

    mostrarMensajeAdmin(
        `El concierto “${nombreEditado}” fue actualizado correctamente.`,
        "exito"
    );
}


function cargarConciertoEnFormulario(idConcierto) {
    const concierto = conciertos.find(
        (elemento) =>
            String(elemento.id) === String(idConcierto)
    );

    if (!concierto) {
        mostrarMensajeAdmin(
            "No se encontró el concierto seleccionado.",
            "error"
        );
        return;
    }

    campoId.value = concierto.id;
    campoNombre.value = concierto.nombre;
    campoFecha.value = concierto.fecha;
    campoHora.value = concierto.hora;
    campoLugar.value = concierto.lugar;
    campoPuntoSalida.value = concierto.puntoSalida || "";

    tituloFormulario.textContent = "Editar concierto";
    botonGuardar.textContent = "Guardar cambios";
    botonCancelar.classList.remove("oculto");
    limpiarMensajeAdmin();

    formularioConcierto.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
    campoNombre.focus();
}


function limpiarFormulario(limpiarMensaje = true) {
    formularioConcierto.reset();
    campoId.value = "";
    tituloFormulario.textContent = "Agregar concierto";
    botonGuardar.textContent = "Agregar concierto";
    botonCancelar.classList.add("oculto");

    if (limpiarMensaje) {
        limpiarMensajeAdmin();
    }
}


/* =========================================================
   ELIMINAR Y RESTAURAR
   ========================================================= */

function eliminarConcierto(idConcierto) {
    const concierto = conciertos.find(
        (elemento) =>
            String(elemento.id) === String(idConcierto)
    );

    if (!concierto) {
        mostrarMensajeAdmin(
            "No se encontró el concierto seleccionado.",
            "error"
        );
        return;
    }

    const cantidadReservas =
        contarReservasDeConcierto(concierto.id);

    const advertenciaReservas =
        cantidadReservas > 0
            ? ` También se eliminarán ${cantidadReservas} asiento(s) reservado(s).`
            : "";

    const usuarioConfirma = window.confirm(
        `¿Deseas eliminar “${concierto.nombre}” del ` +
        `${formatearFecha(concierto.fecha)}?${advertenciaReservas}`
    );

    if (!usuarioConfirma) {
        return;
    }

    conciertos = conciertos.filter(
        (elemento) =>
            String(elemento.id) !== String(idConcierto)
    );

    guardarConciertos(conciertos);
    eliminarReservasDeConcierto(idConcierto);

    if (campoId.value === String(idConcierto)) {
        limpiarFormulario();
    }

    if (
        conciertoDetalleActual &&
        String(conciertoDetalleActual.id) === String(idConcierto)
    ) {
        cerrarDetalleAsientos();
    }

    actualizarPanel();

    mostrarMensajeAdmin(
        "El concierto fue eliminado correctamente.",
        "exito"
    );
}


function restaurarDatosDeEjemplo() {
    const usuarioConfirma = window.confirm(
        "¿Deseas restaurar los conciertos de ejemplo? " +
        "Esto reemplazará la lista actual y borrará las reservas de prueba."
    );

    if (!usuarioConfirma) {
        return;
    }

    restablecerConciertosIniciales();
    limpiarFormulario();
    cerrarDetalleAsientos();
    actualizarPanel();

    mostrarMensajeAdmin(
        "Los datos de ejemplo fueron restaurados.",
        "exito"
    );
}


/* =========================================================
   LISTADO DE CONCIERTOS
   ========================================================= */

function actualizarListaConciertos() {
    conciertos = obtenerConciertos();
    renderizarListaConciertos();
}


function renderizarListaConciertos() {
    listaConciertos.innerHTML = "";

    contadorConciertos.textContent =
        `${conciertos.length} concierto(s) registrado(s).`;

    const hayConciertos = conciertos.length > 0;
    sinConciertos.classList.toggle("oculto", hayConciertos);

    conciertos.forEach((concierto) => {
        const fila = document.createElement("tr");

        fila.appendChild(crearCelda(concierto.nombre));
        fila.appendChild(
            crearCelda(formatearFecha(concierto.fecha))
        );
        fila.appendChild(crearCelda(concierto.hora));
        fila.appendChild(crearCelda(concierto.lugar));
        fila.appendChild(
            crearCelda(
                String(contarOcupadosTotales(concierto))
            )
        );

        const celdaAcciones = document.createElement("td");
        const contenedorAcciones = document.createElement("div");
        contenedorAcciones.className = "acciones-tabla";

        const botonVer = document.createElement("button");
        botonVer.type = "button";
        botonVer.className = "boton-tabla boton-ver";
        botonVer.textContent = "Ver asientos";
        botonVer.addEventListener("click", () => {
            abrirDetalleAsientos(concierto.id);
        });

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.className = "boton-tabla boton-editar";
        botonEditar.textContent = "Editar";
        botonEditar.addEventListener("click", () => {
            cargarConciertoEnFormulario(concierto.id);
        });

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "boton-tabla boton-eliminar";
        botonEliminar.textContent = "Eliminar";
        botonEliminar.addEventListener("click", () => {
            eliminarConcierto(concierto.id);
        });

        contenedorAcciones.appendChild(botonVer);
        contenedorAcciones.appendChild(botonEditar);
        contenedorAcciones.appendChild(botonEliminar);
        celdaAcciones.appendChild(contenedorAcciones);
        fila.appendChild(celdaAcciones);

        listaConciertos.appendChild(fila);
    });
}


function contarOcupadosTotales(concierto) {
    return obtenerEstadosAsientos(concierto).filter(
        (estado) => estado.estado !== "Disponible"
    ).length;
}


/* =========================================================
   LISTADO GENERAL DE RESERVAS
   ========================================================= */

function renderizarReservas() {
    const reservas = obtenerDetallesReservas();

    listaReservas.innerHTML = "";
    contadorReservas.textContent =
        `${reservas.length} reserva(s) registrada(s).`;

    sinReservas.classList.toggle(
        "oculto",
        reservas.length > 0
    );

    reservas.forEach((reserva) => {
        const fila = document.createElement("tr");

        fila.appendChild(
            crearCelda(reserva.pasajero?.nombre || "Sin nombre")
        );

        const celdaTipo = document.createElement("td");
        const etiqueta = document.createElement("span");
        etiqueta.className = "etiqueta-tipo";
        etiqueta.textContent =
            reserva.tipoPasajero || "No especificado";
        celdaTipo.appendChild(etiqueta);
        fila.appendChild(celdaTipo);

        const celdaContacto = document.createElement("td");
        celdaContacto.className = "contacto-reserva";

        const correo = document.createElement("span");
        correo.textContent =
            reserva.pasajero?.correo || "Sin correo";

        const telefono = document.createElement("span");
        telefono.textContent =
            reserva.pasajero?.telefono || "Sin teléfono";

        celdaContacto.appendChild(correo);
        celdaContacto.appendChild(telefono);
        fila.appendChild(celdaContacto);

        fila.appendChild(
            crearCelda(reserva.conciertoNombre || "Concierto eliminado")
        );

        fila.appendChild(
            crearCelda(
                Array.isArray(reserva.asientos)
                    ? reserva.asientos.join(", ")
                    : "Sin asientos"
            )
        );

        fila.appendChild(
            crearCelda(formatearFechaHora(reserva.creadaEn))
        );

        listaReservas.appendChild(fila);
    });
}


/* =========================================================
   DETALLE DE ASIENTOS POR CONCIERTO
   ========================================================= */

function abrirDetalleAsientos(idConcierto) {
    const concierto = obtenerConciertos().find(
        (elemento) => String(elemento.id) === String(idConcierto)
    );

    if (!concierto) {
        mostrarMensajeAdmin(
            "No se encontró el concierto para mostrar sus asientos.",
            "error"
        );
        return;
    }

    conciertoDetalleActual = concierto;
    estadosAsientosActuales = obtenerEstadosAsientos(concierto);

    tituloModalAsientos.textContent = concierto.nombre;
    subtituloModalAsientos.textContent =
        `${formatearFecha(concierto.fecha)} · ${concierto.hora} · ` +
        `${concierto.lugar} · Salida: ${concierto.puntoSalida || "Por definir"}`;

    renderizarResumenOcupacion();
    renderizarMapaAsientosAdmin();
    renderizarTablaDetalleAsientos();

    modalAsientos.classList.remove("oculto");
    document.body.classList.add("modal-abierto");
    botonCerrarModal.focus();
}


function cerrarDetalleAsientos() {
    modalAsientos.classList.add("oculto");
    document.body.classList.remove("modal-abierto");
    conciertoDetalleActual = null;
    estadosAsientosActuales = [];
}


function obtenerEstadosAsientos(concierto) {
    const reservasDetalladas = obtenerDetallesReservas().filter(
        (reserva) =>
            String(reserva.conciertoId) === String(concierto.id)
    );

    const asientosConDetalle = new Map();

    reservasDetalladas.forEach((reserva) => {
        const asientos = Array.isArray(reserva.asientos)
            ? reserva.asientos
            : [];

        asientos.forEach((asiento) => {
            if (!asientosConDetalle.has(asiento)) {
                asientosConDetalle.set(asiento, reserva);
            }
        });
    });

    const reservasSimples = obtenerReservasLocales();
    const asientosReservadosSinDetalle = new Set(
        Array.isArray(reservasSimples[String(concierto.id)])
            ? reservasSimples[String(concierto.id)]
            : []
    );

    const asientosOcupadosIniciales = new Set(
        Array.isArray(concierto.asientosOcupadosIniciales)
            ? concierto.asientosOcupadosIniciales
            : []
    );

    return todosLosAsientosAdmin.map((asiento) => {
        const reserva = asientosConDetalle.get(asiento);

        if (reserva) {
            return {
                asiento,
                estado: "Reservado con pasajero",
                claseEstado: "con-pasajero",
                pasajero: reserva.pasajero?.nombre || "Sin nombre",
                tipoPasajero: reserva.tipoPasajero || "No especificado",
                telefono: reserva.pasajero?.telefono || "Sin teléfono",
                correo: reserva.pasajero?.correo || "Sin correo",
                reservaId: reserva.id || "Sin identificador",
                creadaEn: reserva.creadaEn || ""
            };
        }

        if (
            asientosReservadosSinDetalle.has(asiento) ||
            asientosOcupadosIniciales.has(asiento)
        ) {
            return {
                asiento,
                estado: "Ocupado sin datos",
                claseEstado: "sin-datos",
                pasajero: "Sin datos asociados",
                tipoPasajero: "No disponible",
                telefono: "",
                correo: "",
                reservaId: "",
                creadaEn: ""
            };
        }

        return {
            asiento,
            estado: "Disponible",
            claseEstado: "disponible-admin",
            pasajero: "",
            tipoPasajero: "",
            telefono: "",
            correo: "",
            reservaId: "",
            creadaEn: ""
        };
    });
}


function renderizarResumenOcupacion() {
    const disponibles = estadosAsientosActuales.filter(
        (estado) => estado.estado === "Disponible"
    ).length;
    const conPasajero = estadosAsientosActuales.filter(
        (estado) => estado.estado === "Reservado con pasajero"
    ).length;
    const sinDatos = estadosAsientosActuales.filter(
        (estado) => estado.estado === "Ocupado sin datos"
    ).length;

    resumenTotal.textContent = estadosAsientosActuales.length;
    resumenDisponibles.textContent = disponibles;
    resumenConPasajero.textContent = conPasajero;
    resumenSinDatos.textContent = sinDatos;
}


function renderizarMapaAsientosAdmin() {
    mapaAsientosAdmin.innerHTML = "";

    const estadosPorAsiento = new Map(
        estadosAsientosActuales.map((estado) => [estado.asiento, estado])
    );

    distribucionAsientosAdmin.forEach((fila) => {
        fila.forEach((identificadorAsiento) => {
            if (identificadorAsiento === null) {
                const espacioVacio = document.createElement("div");
                espacioVacio.className = "espacio-vacio";
                espacioVacio.setAttribute("aria-hidden", "true");
                mapaAsientosAdmin.appendChild(espacioVacio);
                return;
            }

            const estado = estadosPorAsiento.get(identificadorAsiento);
            const asiento = document.createElement("div");
            asiento.className =
                `asiento-admin ${estado?.claseEstado || "disponible-admin"}`;

            const numero = document.createElement("strong");
            numero.textContent = identificadorAsiento;

            const detalle = document.createElement("small");
            detalle.textContent =
                estado?.estado === "Reservado con pasajero"
                    ? estado.pasajero
                    : estado?.estado || "Disponible";

            asiento.title = crearTextoTooltipAsiento(estado);
            asiento.appendChild(numero);
            asiento.appendChild(detalle);
            mapaAsientosAdmin.appendChild(asiento);
        });
    });
}


function crearTextoTooltipAsiento(estado) {
    if (!estado) {
        return "Disponible";
    }

    if (estado.estado === "Reservado con pasajero") {
        return (
            `${estado.asiento}: ${estado.pasajero} · ` +
            `${estado.telefono} · ${estado.correo}`
        );
    }

    return `${estado.asiento}: ${estado.estado}`;
}


function renderizarTablaDetalleAsientos() {
    listaDetalleAsientos.innerHTML = "";

    estadosAsientosActuales.forEach((estado) => {
        const fila = document.createElement("tr");

        fila.appendChild(crearCelda(estado.asiento));

        const celdaEstado = crearCelda(estado.estado);
        celdaEstado.className = obtenerClaseTextoEstado(estado.estado);
        fila.appendChild(celdaEstado);

        fila.appendChild(crearCelda(estado.pasajero || "—"));
        fila.appendChild(crearCelda(estado.telefono || "—"));
        fila.appendChild(crearCelda(estado.correo || "—"));

        listaDetalleAsientos.appendChild(fila);
    });
}


function obtenerClaseTextoEstado(estado) {
    if (estado === "Disponible") {
        return "estado-disponible";
    }

    if (estado === "Reservado con pasajero") {
        return "estado-reservado";
    }

    return "estado-sin-datos";
}


/* =========================================================
   DESCARGAS CSV Y EXCEL COMPATIBLE
   ========================================================= */

function descargarCsvActual() {
    if (!conciertoDetalleActual) {
        return;
    }

    const filas = construirFilasExportacion();
    const contenidoCsv = filas
        .map((fila) => fila.map(escaparCsv).join(";"))
        .join("\r\n");

    const blob = new Blob(
        ["\ufeff", contenidoCsv],
        { type: "text/csv;charset=utf-8;" }
    );

    descargarBlob(
        blob,
        `${crearNombreArchivo(conciertoDetalleActual)}-asientos.csv`
    );
}


function descargarExcelActual() {
    if (!conciertoDetalleActual) {
        return;
    }

    const filas = construirFilasExportacion();
    const filasHtml = filas
        .map((fila, indice) => {
            const etiqueta = indice === 0 ? "th" : "td";
            const celdas = fila
                .map((valor) =>
                    `<${etiqueta}>${escaparHtml(String(valor))}</${etiqueta}>`
                )
                .join("");

            return `<tr>${celdas}</tr>`;
        })
        .join("");

    const contenidoExcel = `
        <!DOCTYPE html>
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { font-size: 18px; }
                p { margin: 3px 0; }
                table { border-collapse: collapse; margin-top: 16px; }
                th { background: #2457d6; color: #ffffff; }
                th, td { border: 1px solid #777777; padding: 7px; }
            </style>
        </head>
        <body>
            <h1>${escaparHtml(conciertoDetalleActual.nombre)}</h1>
            <p><strong>Fecha:</strong> ${escaparHtml(formatearFecha(conciertoDetalleActual.fecha))}</p>
            <p><strong>Hora de salida:</strong> ${escaparHtml(conciertoDetalleActual.hora)}</p>
            <p><strong>Lugar:</strong> ${escaparHtml(conciertoDetalleActual.lugar)}</p>
            <p><strong>Punto de salida:</strong> ${escaparHtml(conciertoDetalleActual.puntoSalida || "Por definir")}</p>
            <table>${filasHtml}</table>
        </body>
        </html>
    `;

    const blob = new Blob(
        ["\ufeff", contenidoExcel],
        { type: "application/vnd.ms-excel;charset=utf-8;" }
    );

    descargarBlob(
        blob,
        `${crearNombreArchivo(conciertoDetalleActual)}-asientos.xls`
    );
}


function construirFilasExportacion() {
    const encabezados = [
        "Concierto",
        "Fecha del concierto",
        "Hora de salida",
        "Lugar",
        "Punto de salida",
        "Asiento",
        "Estado",
        "Nombre del pasajero",
        "Tipo de pasajero",
        "Teléfono",
        "Correo",
        "ID de reserva",
        "Fecha de registro"
    ];

    const datos = estadosAsientosActuales.map((estado) => [
        conciertoDetalleActual.nombre,
        formatearFecha(conciertoDetalleActual.fecha),
        conciertoDetalleActual.hora,
        conciertoDetalleActual.lugar,
        conciertoDetalleActual.puntoSalida || "Por definir",
        estado.asiento,
        estado.estado,
        estado.pasajero,
        estado.tipoPasajero,
        estado.telefono,
        estado.correo,
        estado.reservaId,
        estado.creadaEn ? formatearFechaHora(estado.creadaEn) : ""
    ]);

    return [encabezados, ...datos];
}


function escaparCsv(valor) {
    const texto = String(valor ?? "");
    return `"${texto.replaceAll('"', '""')}"`;
}


function escaparHtml(texto) {
    return texto
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function descargarBlob(blob, nombreArchivo) {
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}


function crearNombreArchivo(concierto) {
    return `${concierto.fecha}-${concierto.nombre}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
}


/* =========================================================
   AUXILIARES
   ========================================================= */

function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
}


function formatearFecha(fechaISO) {
    const fecha = new Date(`${fechaISO}T00:00:00`);

    return new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(fecha);
}


function formatearFechaHora(fechaISO) {
    if (!fechaISO) {
        return "Sin fecha";
    }

    const fecha = new Date(fechaISO);

    if (Number.isNaN(fecha.getTime())) {
        return "Fecha inválida";
    }

    return new Intl.DateTimeFormat("es-CL", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(fecha);
}


function mostrarMensajeAdmin(texto, tipo) {
    mensajeAdmin.textContent = texto;
    mensajeAdmin.className = `mensaje ${tipo}`;
}


function limpiarMensajeAdmin() {
    mensajeAdmin.textContent = "";
    mensajeAdmin.className = "mensaje";
}


iniciarAdministracion();
