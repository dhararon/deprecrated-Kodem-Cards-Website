import { useState, useEffect } from 'react';

/**
 * Un hook personalizado que devuelve un valor debounced
 * @param value El valor a debounce
 * @param delay El tiempo de retardo en milisegundos
 * @returns El valor después del delay
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Configurar el timeout para actualizar el valor después del delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Limpiar el timeout si el valor cambia antes del delay
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
} 