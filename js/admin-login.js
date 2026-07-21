const formularioAdminLogin = document.getElementById("formulario-admin-login");
const campoCorreoAdmin = document.getElementById("correo-admin");
const campoContrasenaAdmin = document.getElementById("contrasena-admin");
const mensajeAdminLogin = document.getElementById("mensaje-admin-login");


function iniciarPaginaAdminLogin() {
    redirigirSiYaExisteSesion();

    formularioAdminLogin.addEventListener(
        "submit",
        procesarLoginAdministrador
    );
}


function redirigirSiYaExisteSesion() {
    const sesion = obtenerSesionActual();

    if (!sesion) {
        return;
    }

    if (sesion.tipo === "administrador") {
        window.location.replace("admin.html");
    } else {
        window.location.replace("index.html");
    }
}


function procesarLoginAdministrador(evento) {
    evento.preventDefault();
    limpiarMensajeAdminLogin();

    const correo = campoCorreoAdmin.value.trim();
    const contrasena = campoContrasenaAdmin.value;

    if (!correo || !contrasena) {
        mostrarMensajeAdminLogin(
            "Completa el correo y la contraseña.",
            "error"
        );
        return;
    }

    const resultado = iniciarSesionAdministrador(correo, contrasena);

    if (!resultado.correcto) {
        mostrarMensajeAdminLogin(resultado.mensaje, "error");
        return;
    }

    window.location.replace("admin.html");
}


function mostrarMensajeAdminLogin(texto, tipo) {
    mensajeAdminLogin.textContent = texto;
    mensajeAdminLogin.className = `mensaje ${tipo}`;
}


function limpiarMensajeAdminLogin() {
    mensajeAdminLogin.textContent = "";
    mensajeAdminLogin.className = "mensaje";
}


iniciarPaginaAdminLogin();
