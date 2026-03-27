document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input-personaje');
    const display = document.getElementById('img-protagonista');

    // Función que limpia el texto y busca la imagen
    const actualizarImagen = (nombre) => {
        const busquedaLimpia = nombre.trim().toLowerCase();
        
        if (busquedaLimpia === "") {
            display.style.opacity = "0";
            return;
        }

        // Importante: Tus imágenes deben estar en assets/img/ y ser .png
        display.src = `assets/img/${busquedaLimpia}.png`;
        display.style.opacity = "1";

        display.onerror = () => {
            display.src = "assets/img/default.png"; // Imagen por si no la encuentra
        };
    };

    input.addEventListener('input', () => actualizarImagen(input.value));

    // Función para los clics en las fotos pequeñas
    window.seleccionar = (nombre) => {
        input.value = nombre;
        actualizarImagen(nombre);
    };
});