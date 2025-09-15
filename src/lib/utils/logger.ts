/**
 * Utilidad para gestionar logs en la aplicación de manera que se puedan
 * eliminar automáticamente en producción, pero se mantengan durante el desarrollo.
 * 
 * Esta versión es compatible con el navegador y no usa winston para evitar
 * problemas con APIs específicas de Node.js
 */

// Configuración para diferentes entornos
const isProduction = process.env.NODE_ENV === 'production';

// Tipos para mejorar la tipificación
type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
type LogMessage = string | Record<string, unknown>;
type LogMetadata = Record<string, unknown>;

// Implementación simple de logger para navegador
const getBrowserLogger = () => {
    const formatTimestamp = () => {
        const now = new Date();
        return now.toISOString();
    };

    return {
        error(message: LogMessage, metadata?: LogMetadata): void {
            const timestamp = formatTimestamp();
            if (typeof message === 'string') {
                console.error(`${timestamp} [ERROR]: ${message}`, metadata || '');
            } else {
                console.error(`${timestamp} [ERROR]:`, { ...message, ...metadata });
            }
        },
        
        warn(message: LogMessage, metadata?: LogMetadata): void {
            const timestamp = formatTimestamp();
            if (typeof message === 'string') {
                console.warn(`${timestamp} [WARN]: ${message}`, metadata || '');
            } else {
                console.warn(`${timestamp} [WARN]:`, { ...message, ...metadata });
            }
        },
        
        info(message: LogMessage, metadata?: LogMetadata): void {
            if (isProduction) return;
            
            const timestamp = formatTimestamp();
            if (typeof message === 'string') {
                console.info(`${timestamp} [INFO]: ${message}`, metadata || '');
            } else {
                console.info(`${timestamp} [INFO]:`, { ...message, ...metadata });
            }
        },
        
        debug(message: LogMessage, metadata?: LogMetadata): void {
            if (isProduction) return;
            
            const timestamp = formatTimestamp();
            if (typeof message === 'string') {
                console.debug(`${timestamp} [DEBUG]: ${message}`, metadata || '');
            } else {
                console.debug(`${timestamp} [DEBUG]:`, { ...message, ...metadata });
            }
        },
        
        log(level: LogLevel, message: LogMessage, metadata?: LogMetadata): void {
            switch (level) {
                case 'error':
                    this.error(message, metadata);
                    break;
                case 'warn':
                    this.warn(message, metadata);
                    break;
                case 'info':
                    this.info(message, metadata);
                    break;
                default:
                    this.debug(message, metadata);
                    break;
            }
        }
    };
};

/**
 * Logger para información general
 * @param message Mensaje o datos a mostrar
 * @param optionalParams Parámetros adicionales opcionales
 */
export const logInfo = (message?: unknown, ...optionalParams: unknown[]): void => {
    if (!isProduction) {
        console.log(message, ...optionalParams);
    }
};

/**
 * Logger para eventos relacionados con datos o servicios
 * @param message Mensaje o datos a mostrar
 * @param optionalParams Parámetros adicionales opcionales
 */
export const logData = (message?: unknown, ...optionalParams: unknown[]): void => {
    if (!isProduction) {
        console.log('[DATA]', message, ...optionalParams);
    }
};

/**
 * Logger para advertencias
 * @param message Mensaje o datos a mostrar
 * @param optionalParams Parámetros adicionales opcionales
 */
export const logWarning = (message?: unknown, ...optionalParams: unknown[]): void => {
    if (!isProduction) {
        console.warn(message, ...optionalParams);
    }
};

/**
 * Logger para errores importantes que siempre deben registrarse
 * incluso en producción para posteriormente ser analizados
 * @param message Mensaje o datos a mostrar
 * @param optionalParams Parámetros adicionales opcionales
 */
export const logError = (error: unknown, message?: string, ...optionalParams: unknown[]): void => {
    // Los errores importantes deben registrarse incluso en producción
    if (message) {
        console.error(message, error, ...optionalParams);
    } else {
        console.error(error, ...optionalParams);
    }
};

/**
 * Logger para eventos relacionados con el rendimiento
 * @param message Mensaje o datos a mostrar
 * @param optionalParams Parámetros adicionales opcionales
 */
export const logPerformance = (message?: unknown, ...optionalParams: unknown[]): void => {
    if (!isProduction) {
        console.log('[PERF]', message, ...optionalParams);
    }
};

// Exportar el logger compatible con navegador
export default getBrowserLogger(); 