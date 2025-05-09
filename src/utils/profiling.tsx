import React, { Profiler, ReactNode } from 'react';

/**
 * Analizador de rendimiento de componentes React
 * Utilidad para detectar re-renders innecesarios y medir tiempos de renderizado
 */

// Colores para los tiempos de renderizado
const colors = {
    normal: '#4caf50',    // Verde para tiempos rápidos (<10ms)
    warning: '#ff9800',   // Naranja para tiempos medios (<30ms)
    critical: '#f44336',  // Rojo para tiempos lentos (>30ms)
};

// Formatear tiempo para mostrar
const formatTime = (time: number): string => {
    if (time < 1) {
        return `${(time * 1000).toFixed(1)}μs`;
    } else if (time < 1000) {
        return `${time.toFixed(1)}ms`;
    }
    return `${(time / 1000).toFixed(1)}s`;
};

// Obtener color basado en el tiempo de renderizado
const getTimeColor = (duration: number): string => {
    if (duration < 10) return colors.normal;
    if (duration < 30) return colors.warning;
    return colors.critical;
};

// Configuración para recarga automática
const AUTO_RELOAD_STORAGE_KEY = 'lastAutoReloadTime';
const AUTO_RELOAD_INTERVAL = 30 * 60 * 1000; // 30 minutos

// Verificar el tiempo desde la última recarga
function checkLastReload() {
    if (typeof window === 'undefined') return false;
    const lastReload = localStorage.getItem(AUTO_RELOAD_STORAGE_KEY);
    return lastReload && (Date.now() - parseInt(lastReload, 10)) > AUTO_RELOAD_INTERVAL;
}

// Props para el componente ProfilingWrapper
interface ProfilingWrapperProps {
    id: string;
    children: ReactNode;
    enableLogging?: boolean;
}

/**
 * Componente wrapper para medir el rendimiento de renderizado
 */
export function ProfilingWrapper({
    id,
    children,
    enableLogging = true
}: ProfilingWrapperProps) {
    // En entornos de producción, desactivar el perfilador
    if (process.env.NODE_ENV !== 'development') {
        return <>{children}</>;
    }

    // Función que se ejecuta cada vez que se renderiza el componente
    // Compatible con la nueva definición en React 19.1
    const handleRender = (
        id: string,
        phase: "mount" | "update" | "nested-update",
        actualDuration: number,
        baseDuration: number,
        startTime: number,
        commitTime: number
    ) => {
        if (enableLogging) {
            const color = getTimeColor(actualDuration);

            console.group(`%c🔍 ${id} [${phase}]`, `color: ${color}; font-weight: bold;`);
            console.log(`Tiempo actual: ${formatTime(actualDuration)}`);
            console.log(`Tiempo base: ${formatTime(baseDuration)}`);
            console.log(`Tiempo inicio: ${new Date(startTime).toISOString()}`);
            console.log(`Tiempo commit: ${new Date(commitTime).toISOString()}`);
            console.log('Diferencia: ', commitTime - startTime, 'ms');

            console.groupEnd();
        }
    };

    return (
        <Profiler id={id} onRender={handleRender}>
            {children}
        </Profiler>
    );
}

// Configuración global para métricas de rendimiento
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Crear o recuperar el objeto de métricas globales
    if (!window.hasOwnProperty('__REACT_PERF_METRICS__')) {
        window.__REACT_PERF_METRICS__ = {
            components: {},
            measurements: [],
            getComponentMetrics: (componentId) => {
                return window.__REACT_PERF_METRICS__.components[componentId] || null;
            },
            getAllMetrics: () => {
                return window.__REACT_PERF_METRICS__.components;
            },
            clearMetrics: () => {
                window.__REACT_PERF_METRICS__.components = {};
                window.__REACT_PERF_METRICS__.measurements = [];
                console.log('Métricas de rendimiento limpiadas');
            }
        };

        // Modificar el método de renderizado de React
        const originalRender = React.createElement;
        React.createElement = function () {
            const element = originalRender.apply(this, arguments);
            if (element && typeof element.type === 'function' && element.type.name) {
                const componentName = element.type.displayName || element.type.name;
                // Registrar componente
                if (!window.__REACT_PERF_METRICS__.components[componentName]) {
                    window.__REACT_PERF_METRICS__.components[componentName] = {
                        renders: 0,
                        totalTime: 0,
                        lastRenderTime: 0
                    };
                }
            }
            return element;
        };

        console.log('Métricas de rendimiento React activadas. Accede vía window.__REACT_PERF_METRICS__');
    }

    // Auto-recarga para prevenir fugas de memoria en desarrollo largo
    if (checkLastReload()) {
        localStorage.setItem(AUTO_RELOAD_STORAGE_KEY, Date.now().toString());
        window.location.reload();
    } else if (!localStorage.getItem(AUTO_RELOAD_STORAGE_KEY)) {
        localStorage.setItem(AUTO_RELOAD_STORAGE_KEY, Date.now().toString());
    }
}

// Definir propiedades en el objeto window para TypeScript
declare global {
    interface Window {
        __REACT_PERF_METRICS__: {
            components: Record<string, {
                renders: number;
                totalTime: number;
                lastRenderTime: number;
            }>;
            measurements: any[];
            getComponentMetrics: (componentId: string) => any;
            getAllMetrics: () => Record<string, any>;
            clearMetrics: () => void;
        };
    }
}

export default ProfilingWrapper; 