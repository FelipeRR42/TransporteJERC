const formularioLogin = document.getElementById("formulario-login");
const campoCorreo = document.getElementById("correo");
const campoContrasena = document.getElementById("contrasena");
const botonInvitado = document.getElementById("boton-invitado");
const mensajeLogin = document.getElementById("mensaje-login");


function iniciarPaginaLogin() {
    redirigirSiYaExisteSesion();

    formularioLogin.addEventListener("submit", procesarLogin);
    botonInvitado.addEventListener("click", ingresarComoInvitado);
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


function procesarLogin(evento) {
    evento.preventDefault();
    limpiarMensajeLogin();

    const correo = campoCorreo.value.trim();
    const contrasena = campoContrasena.value;

    if (!correo || !contrasena) {
        mostrarMensajeLogin("Completa el correo y la contraseña.", "error");
        return;
    }

    const resultado = iniciarSesionPasajero(correo, contrasena);

    if (!resultado.correcto) {
        mostrarMensajeLogin(resultado.mensaje, "error");
        return;
    }

    window.location.replace("index.html");
}


function ingresarComoInvitado() {
    iniciarSesionInvitado();
    window.location.replace("index.html");
}


function mostrarMensajeLogin(texto, tipo) {
    mensajeLogin.textContent = texto;
    mensajeLogin.className = `mensaje ${tipo}`;
}


function limpiarMensajeLogin() {
    mensajeLogin.textContent = "";
    mensajeLogin.className = "mensaje";
}


iniciarPaginaLogin();
