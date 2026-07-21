/* =========================================================
   ALMACENAMIENTO COMPARTIDO
   ========================================================= */

const CLAVE_CONCIERTOS = "conciertosTransporte";
const CLAVE_RESERVAS = "reservasTransporte";
const CLAVE_DETALLES_RESERVAS = "detallesReservasTransporte";
const CLAVE_VERSION_DISTRIBUCION = "versionDistribucionTransporte";
const VERSION_DISTRIBUCION = "2-AAAB-AABB-AABA-AABA-AAAA";

const ASIENTOS_VALIDOS_DISTRIBUCION = Array.from(
    { length: 15 },
    (_, indice) => `A${indice + 1}`
);

/*
   Conversión desde la distribución antigua de 16 asientos.
   D4 era el asiento número 16 y no tiene equivalente en el
   nuevo furgón de 15 asientos.
*/
const MAPEO_ASIENTOS_ANTERIORES = {
    A1: "A1",
    A2: "A2",
    A3: "A3",
    A4: "A4",
    B1: "A5",
    B2: "A6",
    B3: "A7",
    B4: "A8",
    C1: "A9",
    C2: "A10",
    C3: "A11",
    C4: "A12",
    D1: "A13",
    D2: "A14",
    D3: "A15",
    D4: null
};

const CONCIERTOS_INICIALES = [
    {
        id: 1,
        nombre: "Concierto de ejemplo 1",
        fecha: "2026-08-15",
        hora: "18:30",
        lugar: "Estadio principal",
        puntoSalida: "Plaza de Armas",
        asientosOcupadosIniciales: ["A2", "A8", "A9"]
    },
    {
        id: 2,
        nombre: "Concierto de ejemplo 2",
        fecha: "2026-09-05",
        hora: "20:00",
        lugar: "Arena central",
        puntoSalida: "Terminal de buses",
        asientosOcupadosIniciales: ["A1", "A4", "A15"]
    },
    {
        id: 3,
        nombre: "Concierto de ejemplo 3",
        fecha: "2026-10-10",
        hora: "19:00",
        lugar: "Parque de eventos",
        puntoSalida: "Municipalidad",
        asientosOcupadosIniciales: ["A6", "A11", "A14"]
    }
];


function inicializarDatosConciertos() {
    migrarDistribucionSiEsNecesario();

    if (localStorage.getItem(CLAVE_CONCIERTOS) === null) {
        guardarConciertos(CONCIERTOS_INICIALES);
    }
}


function obtenerConciertos() {
    const datosGuardados = localStorage.getItem(CLAVE_CONCIERTOS);

    if (!datosGuardados) {
        return [];
    }

    try {
        const conciertos = JSON.parse(datosGuardados);

        if (!Array.isArray(conciertos)) {
            return [];
        }

        return conciertos
            .filter(esConciertoValido)
            .map((concierto) => ({
                ...concierto,
                puntoSalida: concierto.puntoSalida || "Por definir",
                asientosOcupadosIniciales:
                    Array.isArray(concierto.asientosOcupadosIniciales)
                        ? concierto.asientosOcupadosIniciales
                        : []
            }))
            .sort(compararConciertosPorFecha);
    } catch (error) {
        console.error("No se pudieron leer los conciertos:", error);
        return [];
    }
}


function guardarConciertos(conciertos) {
    const conciertosOrdenados = [...conciertos].sort(
        compararConciertosPorFecha
    );

    localStorage.setItem(
        CLAVE_CONCIERTOS,
        JSON.stringify(conciertosOrdenados)
    );
}


function generarIdConcierto(conciertos) {
    const mayorId = conciertos.reduce((mayor, concierto) => {
        const id = Number(concierto.id);
        return Number.isFinite(id) && id > mayor ? id : mayor;
    }, 0);

    return mayorId + 1;
}


function restablecerConciertosIniciales() {
    guardarConciertos(CONCIERTOS_INICIALES);
    localStorage.removeItem(CLAVE_RESERVAS);
    localStorage.removeItem(CLAVE_DETALLES_RESERVAS);
}


function obtenerReservasLocales() {
    const datosGuardados = localStorage.getItem(CLAVE_RESERVAS);

    if (!datosGuardados) {
        return {};
    }

    try {
        const reservas = JSON.parse(datosGuardados);
        return reservas && typeof reservas === "object" ? reservas : {};
    } catch (error) {
        console.error("No se pudieron leer las reservas:", error);
        return {};
    }
}


function guardarReservasLocales(reservas) {
    localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(reservas));
}


function guardarAsientosReservados(idConcierto, nuevosAsientos) {
    const reservas = obtenerReservasLocales();
    const claveConcierto = String(idConcierto);
    const asientosGuardados = Array.isArray(reservas[claveConcierto])
        ? reservas[claveConcierto]
        : [];

    reservas[claveConcierto] = [
        ...new Set([...asientosGuardados, ...nuevosAsientos])
    ].sort(compararAsientos);

    guardarReservasLocales(reservas);
}


function obtenerDetallesReservas() {
    const contenido = localStorage.getItem(CLAVE_DETALLES_RESERVAS);

    if (!contenido) {
        return [];
    }

    try {
        const reservas = JSON.parse(contenido);

        return Array.isArray(reservas)
            ? reservas.sort((a, b) =>
                String(b.creadaEn).localeCompare(String(a.creadaEn))
            )
            : [];
    } catch (error) {
        console.error("No se pudieron leer los detalles de reservas:", error);
        return [];
    }
}


function guardarDetalleReserva(reserva) {
    const reservas = obtenerDetallesReservas();

    reservas.push(reserva);

    localStorage.setItem(
        CLAVE_DETALLES_RESERVAS,
        JSON.stringify(reservas)
    );
}


function crearIdReserva() {
    return `RES-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}


function eliminarReservasDeConcierto(idConcierto) {
    const reservas = obtenerReservasLocales();
    delete reservas[String(idConcierto)];
    guardarReservasLocales(reservas);

    const detallesFiltrados = obtenerDetallesReservas().filter(
        (reserva) => String(reserva.conciertoId) !== String(idConcierto)
    );

    localStorage.setItem(
        CLAVE_DETALLES_RESERVAS,
        JSON.stringify(detallesFiltrados)
    );
}


function contarReservasDeConcierto(idConcierto) {
    const reservas = obtenerReservasLocales();
    const asientos = reservas[String(idConcierto)] || [];

    return Array.isArray(asientos) ? asientos.length : 0;
}


function limpiarTodasLasReservas() {
    localStorage.removeItem(CLAVE_RESERVAS);
    localStorage.removeItem(CLAVE_DETALLES_RESERVAS);
}


/* =========================================================
   MIGRACIÓN DE LA DISTRIBUCIÓN DE ASIENTOS
   ========================================================= */

function migrarDistribucionSiEsNecesario() {
    const versionGuardada = localStorage.getItem(
        CLAVE_VERSION_DISTRIBUCION
    );

    if (versionGuardada === VERSION_DISTRIBUCION) {
        return;
    }

    migrarConciertosGuardados();
    migrarReservasSimples();
    migrarReservasDetalladas();

    localStorage.setItem(
        CLAVE_VERSION_DISTRIBUCION,
        VERSION_DISTRIBUCION
    );
}


function migrarConciertosGuardados() {
    const contenido = localStorage.getItem(CLAVE_CONCIERTOS);

    if (!contenido) {
        return;
    }

    try {
        const conciertos = JSON.parse(contenido);

        if (!Array.isArray(conciertos)) {
            return;
        }

        const conciertosMigrados = conciertos.map((concierto) => ({
            ...concierto,
            asientosOcupadosIniciales: migrarListaAsientos(
                concierto.asientosOcupadosIniciales
            )
        }));

        localStorage.setItem(
            CLAVE_CONCIERTOS,
            JSON.stringify(conciertosMigrados)
        );
    } catch (error) {
        console.error("No se pudieron migrar los conciertos:", error);
    }
}


function migrarReservasSimples() {
    const contenido = localStorage.getItem(CLAVE_RESERVAS);

    if (!contenido) {
        return;
    }

    try {
        const reservas = JSON.parse(contenido);

        if (!reservas || typeof reservas !== "object") {
            return;
        }

        Object.keys(reservas).forEach((idConcierto) => {
            reservas[idConcierto] = migrarListaAsientos(
                reservas[idConcierto]
            );
        });

        localStorage.setItem(
            CLAVE_RESERVAS,
            JSON.stringify(reservas)
        );
    } catch (error) {
        console.error("No se pudieron migrar las reservas:", error);
    }
}


function migrarReservasDetalladas() {
    const contenido = localStorage.getItem(CLAVE_DETALLES_RESERVAS);

    if (!contenido) {
        return;
    }

    try {
        const reservas = JSON.parse(contenido);

        if (!Array.isArray(reservas)) {
            return;
        }

        const reservasMigradas = reservas
            .map((reserva) => ({
                ...reserva,
                asientos: migrarListaAsientos(reserva.asientos)
            }))
            .filter((reserva) => reserva.asientos.length > 0);

        localStorage.setItem(
            CLAVE_DETALLES_RESERVAS,
            JSON.stringify(reservasMigradas)
        );
    } catch (error) {
        console.error(
            "No se pudieron migrar los detalles de reservas:",
            error
        );
    }
}


function migrarListaAsientos(asientos) {
    if (!Array.isArray(asientos)) {
        return [];
    }

    return [...new Set(
        asientos
            .map(convertirAsientoADistribucionActual)
            .filter(Boolean)
    )].sort(compararAsientos);
}


function convertirAsientoADistribucionActual(asiento) {
    if (ASIENTOS_VALIDOS_DISTRIBUCION.includes(asiento)) {
        return asiento;
    }

    return MAPEO_ASIENTOS_ANTERIORES[asiento] || null;
}


function compararAsientos(asientoA, asientoB) {
    const numeroA = Number(String(asientoA).replace(/\D/g, ""));
    const numeroB = Number(String(asientoB).replace(/\D/g, ""));

    return numeroA - numeroB;
}


function esConciertoValido(concierto) {
    return Boolean(
        concierto &&
        concierto.id !== undefined &&
        typeof concierto.nombre === "string" &&
        typeof concierto.fecha === "string" &&
        typeof concierto.hora === "string" &&
        typeof concierto.lugar === "string"
    );
}


function compararConciertosPorFecha(conciertoA, conciertoB) {
    const fechaA = `${conciertoA.fecha}T${conciertoA.hora || "00:00"}`;
    const fechaB = `${conciertoB.fecha}T${conciertoB.hora || "00:00"}`;

    return fechaA.localeCompare(fechaB);
}
