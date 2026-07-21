/* =========================================================
   AUTENTICACIÓN TEMPORAL CON LOCALSTORAGE

   ADVERTENCIA:
   Este archivo guarda contraseñas sin cifrar porque se utiliza
   solamente como demostración local. No debe utilizarse así en
   una aplicación publicada.
   ========================================================= */

const CLAVE_USUARIOS = "usuariosTransporte";
const CLAVE_ADMINISTRADORES = "administradoresTransporte";
const CLAVE_SESION = "sesionTransporte";

const USUARIOS_INICIALES = [
    {
        id: 1,
        nombre: "Camila Soto",
        correo: "camila.soto@correo.cl",
        telefono: "+56 9 6123 4587",
        contrasena: "camila123"
    },
    {
        id: 2,
        nombre: "Diego Morales",
        correo: "diego.morales@correo.cl",
        telefono: "+56 9 7345 1820",
        contrasena: "diego123"
    },
    {
        id: 3,
        nombre: "Valentina Rojas",
        correo: "valentina.rojas@correo.cl",
        telefono: "+56 9 8456 2901",
        contrasena: "valentina123"
    }
];

const ADMINISTRADORES_INICIALES = [
    {
        id: 1,
        nombre: "Administrador General",
        correo: "admin@transporte.cl",
        contrasena: "admin123"
    }
];


function inicializarDatosAutenticacion() {
    if (localStorage.getItem(CLAVE_USUARIOS) === null) {
        localStorage.setItem(
            CLAVE_USUARIOS,
            JSON.stringify(USUARIOS_INICIALES)
        );
    }

    if (localStorage.getItem(CLAVE_ADMINISTRADORES) === null) {
        localStorage.setItem(
            CLAVE_ADMINISTRADORES,
            JSON.stringify(ADMINISTRADORES_INICIALES)
        );
    }
}


function obtenerUsuarios() {
    return leerArregloLocalStorage(CLAVE_USUARIOS);
}


function obtenerAdministradores() {
    return leerArregloLocalStorage(CLAVE_ADMINISTRADORES);
}


function leerArregloLocalStorage(clave) {
    const contenido = localStorage.getItem(clave);

    if (!contenido) {
        return [];
    }

    try {
        const datos = JSON.parse(contenido);
        return Array.isArray(datos) ? datos : [];
    } catch (error) {
        console.error(`No se pudo leer ${clave}:`, error);
        return [];
    }
}


function normalizarCorreo(correo) {
    return correo.trim().toLowerCase();
}


function iniciarSesionPasajero(correo, contrasena) {
    const correoNormalizado = normalizarCorreo(correo);

    const usuario = obtenerUsuarios().find(
        (elemento) =>
            normalizarCorreo(elemento.correo) === correoNormalizado &&
            elemento.contrasena === contrasena
    );

    if (!usuario) {
        return {
            correcto: false,
            mensaje: "El correo o la contraseña no son correctos."
        };
    }

    const sesion = {
        tipo: "pasajero",
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            correo: usuario.correo,
            telefono: usuario.telefono
        },
        inicio: new Date().toISOString()
    };

    guardarSesion(sesion);

    return {
        correcto: true,
        sesion
    };
}


function iniciarSesionAdministrador(correo, contrasena) {
    const correoNormalizado = normalizarCorreo(correo);

    const administrador = obtenerAdministradores().find(
        (elemento) =>
            normalizarCorreo(elemento.correo) === correoNormalizado &&
            elemento.contrasena === contrasena
    );

    if (!administrador) {
        return {
            correcto: false,
            mensaje: "Las credenciales de administrador no son correctas."
        };
    }

    const sesion = {
        tipo: "administrador",
        usuario: {
            id: administrador.id,
            nombre: administrador.nombre,
            correo: administrador.correo
        },
        inicio: new Date().toISOString()
    };

    guardarSesion(sesion);

    return {
        correcto: true,
        sesion
    };
}


function iniciarSesionInvitado() {
    const sesion = {
        tipo: "invitado",
        usuario: null,
        inicio: new Date().toISOString()
    };

    guardarSesion(sesion);
    return sesion;
}


function guardarSesion(sesion) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
}


function obtenerSesionActual() {
    const contenido = localStorage.getItem(CLAVE_SESION);

    if (!contenido) {
        return null;
    }

    try {
        const sesion = JSON.parse(contenido);

        if (
            !sesion ||
            !["pasajero", "administrador", "invitado"].includes(sesion.tipo)
        ) {
            return null;
        }

        return sesion;
    } catch (error) {
        console.error("No se pudo leer la sesión:", error);
        return null;
    }
}


function cerrarSesion(rutaDestino) {
    localStorage.removeItem(CLAVE_SESION);
    window.location.replace(rutaDestino);
}


function protegerPaginaPasajero() {
    const sesion = obtenerSesionActual();

    if (!sesion) {
        window.location.replace("login.html");
        return null;
    }

    if (sesion.tipo === "administrador") {
        window.location.replace("admin.html");
        return null;
    }

    return sesion;
}


function protegerPaginaAdministrador() {
    const sesion = obtenerSesionActual();

    if (!sesion) {
        window.location.replace("admin-login.html");
        return null;
    }

    if (sesion.tipo !== "administrador") {
        window.location.replace("index.html");
        return null;
    }

    return sesion;
}


inicializarDatosAutenticacion();
