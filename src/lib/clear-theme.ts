/**
 * Este script elimina cualquier configuración de tema oscuro
 * y fuerza el tema claro en la aplicación.
 */

export function ensureLightTheme() {
    // Eliminar clases de tema
    document.documentElement.classList.remove('dark');

    // Forzar tema claro
    document.documentElement.classList.add('light');

    // Establecer en localStorage
    localStorage.setItem('theme', 'light');

    // Asegurar que color-scheme sea light
    document.documentElement.style.colorScheme = 'light';
}

// Ejecutar esta función al cargar el módulo
ensureLightTheme(); 