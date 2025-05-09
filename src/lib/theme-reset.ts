/**
 * Función de utilidad para restablecer forzosamente el tema a claro
 * Esto puede ser útil en casos donde el tema queda atascado en modo oscuro
 */
export function resetThemeToLight() {
    // Limpiar localStorage
    localStorage.removeItem('theme');

    // Establecer tema claro
    localStorage.setItem('theme', 'light');

    // Aplicar clases
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');

    // Establecer color-scheme
    document.documentElement.style.colorScheme = 'light';

    // Refrescar la página para aplicar los cambios
    window.location.reload();
} 