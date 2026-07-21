/* =========================================================
   DISTRIBUCIÓN DEL FURGÓN
   ========================================================= */

const distribucionAsientos = [
    ["A1", "A2", "A3", null],
    ["A4", "A5", null, null],
    ["A6", "A7", null, "A8"],
    ["A9", "A10", null, "A11"],
    ["A12", "A13", "A14", "A15"]
];


/* =========================================================
   REFERENCIAS DEL HTML
   ========================================================= */

const selectorConcierto = document.getElementById("concierto");
const estadoConciertos = document.getElementById("estado-conciertos");
const informacionConcierto = document.getElementById("informacion-concierto");
const detalleNombre = document.getElementById("detalle-nombre");
const detalleFecha = document.getElementById("detalle-fecha");
const detalleHora = document.getElementById("detalle-hora");
const detalleLugar = document.getElementById("detalle-lugar");
const detallePuntoSalida = document.getElementById("detalle-punto-salida");

const seccionDatosPasajero = document.getElementById("seccion-datos-pasajero");
const datosUsuarioRegistrado = document.getElementById("datos-usuario-registrado");
const formularioInvitado = document.getElementById("formulario-invitado");
const cuentaNombre = document.getElementById("cuenta-nombre");
const cuentaCorreo = document.getElementById("cuenta-correo");
const cuentaTelefono = document.getElementById("cuenta-telefono");
const invitadoNombre = document.getElementById("invitado-nombre");
const invitadoCorreo = document.getElementById("invitado-correo");
const invitadoTelefono = document.getElementById("invitado-telefono");

const seccionAsientos = document.getElementById("seccion-asientos");
const seccionResumen = document.getElementById("seccion-resumen");
const mapaAsientos = document.getElementById("mapa-asientos");
const listaAsientos = document.getElementById("lista-asientos");
const cantidadAsientos = document.getElementById("cantidad-asientos");
const botonLimpiar = document.getElementById("boton-limpiar");
const botonReservar = document.getElementById("boton-reservar");
const botonCerrarSesion = document.getElementById("boton-cerrar-sesion");
const usuarioSesion = document.getElementById("usuario-sesion");
const mensaje = document.getElementById("mensaje");


/* =========================================================
   ESTADO
   ========================================================= */

let sesionActual = null;
let conciertos = [];
let conciertoSeleccionado = null;
let asientosSeleccionados = [];


/* =========================================================
   INICIO
   ========================================================= */

function iniciarAplicacion() {
    sesionActual = protegerPaginaPasajero();

    if (!sesionActual) {
        return;
    }

    mostrarSesion();
    inicializarDatosConciertos();
    actualizarConciertosDesdeAlmacenamiento(false);

    selectorConcierto.addEventListener("change", cambiarConcierto);
    botonLimpiar.addEventListener("click", limpiarSeleccion);
    botonReservar.addEventListener("click", confirmarReserva);
    botonCerrarSesion.addEventListener("click", () => cerrarSesion("login.html"));

    window.addEventListener("focus", () => {
        actualizarConciertosDesdeAlmacenamiento(true);
    });

    window.addEventListener("storage", (evento) => {
        if (
            evento.key === CLAVE_CONCIERTOS ||
            evento.key === CLAVE_RESERVAS
        ) {
            actualizarConciertosDesdeAlmacenamiento(true);
        }
    });
}


function mostrarSesion() {
    if (sesionActual.tipo === "pasajero") {
        usuarioSesion.textContent =
            `Pasajero: ${sesionActual.usuario.nombre}`;
    } else {
        usuarioSesion.textContent = "Acceso como invitado";
    }
}


/* =========================================================
   CONCIERTOS
   ========================================================= */

function actualizarConciertosDesdeAlmacenamiento(preservarSeleccion) {
    const idAnterior =
        preservarSeleccion && conciertoSeleccionado
            ? String(conciertoSeleccionado.id)
            : "";

    conciertos = obtenerConciertos();
    cargarConciertosEnSelector(idAnterior);
}


function cargarConciertosEnSelector(idASeleccionar = "") {
    selectorConcierto.innerHTML = "";

    const opcionInicial = document.createElement("option");
    opcionInicial.value = "";
    opcionInicial.textContent =
        conciertos.length > 0
            ? "-- Selecciona un concierto --"
            : "-- No hay conciertos disponibles --";

    selectorConcierto.appendChild(opcionInicial);
    selectorConcierto.disabled = conciertos.length === 0;

    conciertos.forEach((concierto) => {
        const opcion = document.createElement("option");

        opcion.value = String(concierto.id);
        opcion.textContent =
            `${concierto.nombre} - ${formatearFecha(concierto.fecha)}`;

        selectorConcierto.appendChild(opcion);
    });

    estadoConciertos.textContent =
        conciertos.length > 0
            ? `${conciertos.length} concierto(s) disponible(s).`
            : "El administrador todavía no ha agregado conciertos.";

    const seleccionTodaviaExiste = conciertos.some(
        (concierto) => String(concierto.id) === idASeleccionar
    );

    if (seleccionTodaviaExiste) {
        selectorConcierto.value = idASeleccionar;
        cambiarConcierto();
    } else {
        selectorConcierto.value = "";
        conciertoSeleccionado = null;
        asientosSeleccionados = [];
        ocultarSeccionesDeReserva();
        actualizarResumen();
    }
}


function cambiarConcierto() {
    const idSeleccionado = selectorConcierto.value;

    conciertoSeleccionado =
        conciertos.find(
            (concierto) => String(concierto.id) === idSeleccionado
        ) || null;

    asientosSeleccionados = [];
    limpiarMensaje();

    if (!conciertoSeleccionado) {
        ocultarSeccionesDeReserva();
        actualizarResumen();
        return;
    }

    mostrarInformacionConcierto();
    mostrarDatosPasajero();

    seccionDatosPasajero.classList.remove("oculto");
    seccionAsientos.classList.remove("oculto");
    seccionResumen.classList.remove("oculto");

    renderizarAsientos();
    actualizarResumen();
}


function mostrarInformacionConcierto() {
    detalleNombre.textContent = conciertoSeleccionado.nombre;
    detalleFecha.textContent = formatearFecha(conciertoSeleccionado.fecha);
    detalleHora.textContent = conciertoSeleccionado.hora;
    detalleLugar.textContent = conciertoSeleccionado.lugar;
    detallePuntoSalida.textContent =
        conciertoSeleccionado.puntoSalida || "Por definir";

    informacionConcierto.classList.remove("oculto");
}


function mostrarDatosPasajero() {
    const esPasajeroRegistrado = sesionActual.tipo === "pasajero";

    datosUsuarioRegistrado.classList.toggle(
        "oculto",
        !esPasajeroRegistrado
    );

    formularioInvitado.classList.toggle(
        "oculto",
        esPasajeroRegistrado
    );

    if (esPasajeroRegistrado) {
        cuentaNombre.textContent = sesionActual.usuario.nombre;
        cuentaCorreo.textContent = sesionActual.usuario.correo;
        cuentaTelefono.textContent = sesionActual.usuario.telefono;
    }
}


function ocultarSeccionesDeReserva() {
    informacionConcierto.classList.add("oculto");
    seccionDatosPasajero.classList.add("oculto");
    seccionAsientos.classList.add("oculto");
    seccionResumen.classList.add("oculto");
    mapaAsientos.innerHTML = "";
}


/* =========================================================
   ASIENTOS
   ========================================================= */

function renderizarAsientos() {
    mapaAsientos.innerHTML = "";

    const asientosOcupados =
        obtenerAsientosOcupados(conciertoSeleccionado);

    distribucionAsientos.forEach((fila) => {
        fila.forEach((identificadorAsiento) => {
            if (identificadorAsiento === null) {
                const espacioVacio = document.createElement("div");
                espacioVacio.className = "espacio-vacio";
                espacioVacio.setAttribute("aria-hidden", "true");
                mapaAsientos.appendChild(espacioVacio);
                return;
            }

            const botonAsiento = document.createElement("button");

            botonAsiento.type = "button";
            botonAsiento.className = "asiento";
            botonAsiento.textContent = identificadorAsiento;
            botonAsiento.dataset.asiento = identificadorAsiento;
            botonAsiento.setAttribute(
                "aria-label",
                `Asiento ${identificadorAsiento}`
            );
            botonAsiento.setAttribute("aria-pressed", "false");

            if (asientosOcupados.includes(identificadorAsiento)) {
                botonAsiento.classList.add("ocupado");
                botonAsiento.disabled = true;
                botonAsiento.setAttribute(
                    "aria-label",
                    `Asiento ${identificadorAsiento} ocupado`
                );
            } else {
                botonAsiento.addEventListener(
                    "click",
                    seleccionarAsiento
                );
            }

            mapaAsientos.appendChild(botonAsiento);
        });
    });
}


function seleccionarAsiento(evento) {
    const boton = evento.currentTarget;
    const asiento = boton.dataset.asiento;
    const yaEstaSeleccionado =
        asientosSeleccionados.includes(asiento);

    if (yaEstaSeleccionado) {
        asientosSeleccionados = asientosSeleccionados.filter(
            (asientoGuardado) => asientoGuardado !== asiento
        );

        boton.classList.remove("seleccionado");
        boton.setAttribute("aria-pressed", "false");
    } else {
        asientosSeleccionados.push(asiento);
        asientosSeleccionados.sort(compararAsientos);

        boton.classList.add("seleccionado");
        boton.setAttribute("aria-pressed", "true");
    }

    limpiarMensaje();
    actualizarResumen();
}


function actualizarResumen() {
    const cantidad = asientosSeleccionados.length;

    listaAsientos.textContent =
        cantidad > 0 ? asientosSeleccionados.join(", ") : "Ninguno";

    cantidadAsientos.textContent = cantidad;
    botonReservar.disabled = cantidad === 0;
}


function limpiarSeleccion() {
    asientosSeleccionados = [];

    document
        .querySelectorAll(".asiento.seleccionado")
        .forEach((botonAsiento) => {
            botonAsiento.classList.remove("seleccionado");
            botonAsiento.setAttribute("aria-pressed", "false");
        });

    limpiarMensaje();
    actualizarResumen();
}


/* =========================================================
   RESERVA
   ========================================================= */

function confirmarReserva() {
    if (!conciertoSeleccionado || asientosSeleccionados.length === 0) {
        mostrarMensaje(
            "Debes seleccionar al menos un asiento.",
            "error"
        );
        return;
    }

    const datosPasajero = obtenerDatosPasajero();

    if (!datosPasajero) {
        return;
    }

    const ocupadosActualizados =
        obtenerAsientosOcupados(conciertoSeleccionado);

    const asientosYaOcupados = asientosSeleccionados.filter(
        (asiento) => ocupadosActualizados.includes(asiento)
    );

    if (asientosYaOcupados.length > 0) {
        mostrarMensaje(
            `Los asientos ${asientosYaOcupados.join(", ")} ya fueron ocupados. ` +
            "Selecciona otros asientos.",
            "error"
        );

        asientosSeleccionados = [];
        renderizarAsientos();
        actualizarResumen();
        return;
    }

    const textoAsientos = asientosSeleccionados.join(", ");

    const usuarioConfirma = window.confirm(
        `¿Deseas reservar los asientos ${textoAsientos} para ` +
        `${conciertoSeleccionado.nombre} a nombre de ` +
        `${datosPasajero.nombre}?`
    );

    if (!usuarioConfirma) {
        return;
    }

    guardarAsientosReservados(
        conciertoSeleccionado.id,
        asientosSeleccionados
    );

    guardarDetalleReserva({
        id: crearIdReserva(),
        conciertoId: conciertoSeleccionado.id,
        conciertoNombre: conciertoSeleccionado.nombre,
        conciertoFecha: conciertoSeleccionado.fecha,
        tipoPasajero:
            sesionActual.tipo === "pasajero"
                ? "Usuario registrado"
                : "Invitado",
        usuarioId:
            sesionActual.tipo === "pasajero"
                ? sesionActual.usuario.id
                : null,
        pasajero: datosPasajero,
        asientos: [...asientosSeleccionados],
        creadaEn: new Date().toISOString()
    });

    mostrarMensaje(
        `Reserva realizada correctamente. Asientos: ${textoAsientos}.`,
        "exito"
    );

    asientosSeleccionados = [];

    if (sesionActual.tipo === "invitado") {
        formularioInvitado.reset();
    }

    renderizarAsientos();
    actualizarResumen();
}


function obtenerDatosPasajero() {
    if (sesionActual.tipo === "pasajero") {
        return {
            nombre: sesionActual.usuario.nombre,
            correo: sesionActual.usuario.correo,
            telefono: sesionActual.usuario.telefono
        };
    }

    const nombre = invitadoNombre.value.trim();
    const correo = invitadoCorreo.value.trim();
    const telefono = invitadoTelefono.value.trim();

    if (!nombre || !correo || !telefono) {
        mostrarMensaje(
            "Como invitado debes completar nombre, correo y teléfono.",
            "error"
        );

        if (!nombre) {
            invitadoNombre.focus();
        } else if (!correo) {
            invitadoCorreo.focus();
        } else {
            invitadoTelefono.focus();
        }

        return null;
    }

    if (!esCorreoValido(correo)) {
        mostrarMensaje(
            "Ingresa un correo electrónico válido.",
            "error"
        );
        invitadoCorreo.focus();
        return null;
    }

    if (telefono.length < 8) {
        mostrarMensaje(
            "Ingresa un número de teléfono válido.",
            "error"
        );
        invitadoTelefono.focus();
        return null;
    }

    return {
        nombre,
        correo,
        telefono
    };
}


function obtenerAsientosOcupados(concierto) {
    const reservas = obtenerReservasLocales();
    const reservasDelConcierto =
        reservas[String(concierto.id)] || [];

    return [
        ...new Set([
            ...(concierto.asientosOcupadosIniciales || []),
            ...(Array.isArray(reservasDelConcierto)
                ? reservasDelConcierto
                : [])
        ])
    ];
}


/* =========================================================
   AUXILIARES
   ========================================================= */

function esCorreoValido(correo) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}


function formatearFecha(fechaISO) {
    const fecha = new Date(`${fechaISO}T00:00:00`);

    return new Intl.DateTimeFormat("es-CL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(fecha);
}


function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo}`;
}


function limpiarMensaje() {
    mensaje.textContent = "";
    mensaje.className = "mensaje";
}


iniciarAplicacion();
