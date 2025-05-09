/**
 * Sistema centralizado de manejo de errores para la aplicación
 * Provee clases de error estándar, funciones de utilidad y tracking
 */

// Códigos de error estandarizados
export enum ErrorCode {
    // Errores de autenticación - rango 1000
    AUTH_INVALID_CREDENTIALS = 1001,
    AUTH_USER_NOT_FOUND = 1002,
    AUTH_EMAIL_IN_USE = 1003,
    AUTH_WEAK_PASSWORD = 1004,
    AUTH_INVALID_EMAIL = 1005,
    AUTH_REQUIRES_RECENT_LOGIN = 1006,
    AUTH_SESSION_EXPIRED = 1007,

    // Errores de permisos - rango 2000
    PERMISSION_DENIED = 2001,
    INSUFFICIENT_PERMISSIONS = 2002,

    // Errores de recursos - rango 3000
    RESOURCE_NOT_FOUND = 3001,
    RESOURCE_ALREADY_EXISTS = 3002,
    RESOURCE_INVALID = 3003,

    // Errores de Firebase/Firestore - rango 4000
    FIREBASE_UNAVAILABLE = 4001,
    FIREBASE_INTERNAL_ERROR = 4002,
    FIREBASE_QUOTA_EXCEEDED = 4003,
    FIRESTORE_WRITE_ERROR = 4004,
    FIRESTORE_READ_ERROR = 4005,

    // Errores de red - rango 5000
    NETWORK_ERROR = 5001,
    TIMEOUT_ERROR = 5002,

    // Errores de validación - rango 6000
    VALIDATION_ERROR = 6001,
    INVALID_PARAMETERS = 6002,

    // Errores generales - rango 9000
    UNKNOWN_ERROR = 9001,
    UNHANDLED_EXCEPTION = 9002
}

// Interfaz para el contexto de error
export interface ErrorContext {
    [key: string]: unknown;
}

// Error base personalizado con código
export class AppError extends Error {
    public readonly code: ErrorCode;
    public readonly originalError?: Error;
    public readonly context?: ErrorContext;
    public readonly timestamp: Date;

    constructor(
        message: string,
        code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        originalError?: Error,
        context?: ErrorContext
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.originalError = originalError;
        this.context = context;
        this.timestamp = new Date();

        // Mantener stack trace apropiado
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // Devuelve un objeto simple para serializar
    public toJSON(): Record<string, unknown> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            originalError: this.originalError?.message,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

// Errores específicos
export class AuthError extends AppError {
    constructor(
        message: string,
        code: ErrorCode = ErrorCode.AUTH_INVALID_CREDENTIALS,
        originalError?: Error,
        context?: ErrorContext
    ) {
        super(message, code, originalError, context);
    }
}

export class PermissionError extends AppError {
    constructor(
        message: string,
        code: ErrorCode = ErrorCode.PERMISSION_DENIED,
        originalError?: Error,
        context?: ErrorContext
    ) {
        super(message, code, originalError, context);
    }
}

export class NotFoundError extends AppError {
    constructor(
        message: string,
        originalError?: Error,
        context?: ErrorContext
    ) {
        super(message, ErrorCode.RESOURCE_NOT_FOUND, originalError, context);
    }
}

export class ValidationError extends AppError {
    constructor(
        message: string,
        originalError?: Error,
        context?: ErrorContext
    ) {
        super(message, ErrorCode.VALIDATION_ERROR, originalError, context);
    }
}

export class NetworkError extends AppError {
    constructor(
        message: string,
        originalError?: Error,
        context?: ErrorContext
    ) {
        super(message, ErrorCode.NETWORK_ERROR, originalError, context);
    }
}

// Interfaz para errores de Firebase
export interface FirebaseError extends Error {
    code?: string;
    name: string;
    message: string;
}

// Función para mapear errores de Firebase a nuestros tipos de error
export function mapFirebaseErrorToAppError(error: FirebaseError): AppError {
    // Mensajes de error amigables para el usuario
    const userFriendlyMessages: Record<string, string> = {
        'auth/wrong-password': 'La contraseña es inválida.',
        'auth/user-not-found': 'No existe ningún usuario con este correo electrónico.',
        'auth/invalid-email': 'El formato del correo electrónico no es válido.',
        'auth/email-already-in-use': 'Este correo electrónico ya está en uso por otra cuenta.',
        'auth/weak-password': 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.',
        'auth/requires-recent-login': 'Esta operación requiere que hayas iniciado sesión recientemente.',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
        'permission-denied': 'No tienes permiso para realizar esta acción.',
        'not-found': 'El recurso solicitado no existe.',
        'unavailable': 'El servicio no está disponible en este momento.',
        'deadline-exceeded': 'La operación tardó demasiado en completarse.',
        'invalid-argument': 'Los datos proporcionados no son válidos.',
        'resource-exhausted': 'Se han agotado los recursos disponibles.',
    };

    // Extraer el código de Firebase
    const errorCode = error.code || '';
    const errorMessage = error.message || 'Ocurrió un error desconocido';

    // Mensajes amigables
    const userMessage = userFriendlyMessages[errorCode] || errorMessage;

    // Mapeo de códigos de Firebase a nuestros códigos
    if (errorCode.startsWith('auth/')) {
        switch (errorCode) {
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return new AuthError(userMessage, ErrorCode.AUTH_INVALID_CREDENTIALS, error);
            case 'auth/user-not-found':
                return new AuthError(userMessage, ErrorCode.AUTH_USER_NOT_FOUND, error);
            case 'auth/email-already-in-use':
                return new AuthError(userMessage, ErrorCode.AUTH_EMAIL_IN_USE, error);
            case 'auth/weak-password':
                return new AuthError(userMessage, ErrorCode.AUTH_WEAK_PASSWORD, error);
            case 'auth/invalid-email':
                return new AuthError(userMessage, ErrorCode.AUTH_INVALID_EMAIL, error);
            case 'auth/requires-recent-login':
                return new AuthError(userMessage, ErrorCode.AUTH_REQUIRES_RECENT_LOGIN, error);
            default:
                return new AuthError(userMessage, ErrorCode.UNKNOWN_ERROR, error);
        }
    }

    // Errores de Firestore/Firebase
    switch (errorCode) {
        case 'permission-denied':
            return new PermissionError(userMessage, ErrorCode.PERMISSION_DENIED, error);
        case 'not-found':
            return new NotFoundError(userMessage, error);
        case 'unavailable':
            return new AppError(userMessage, ErrorCode.FIREBASE_UNAVAILABLE, error);
        case 'deadline-exceeded':
            return new NetworkError(userMessage, error, { timeout: true });
        case 'invalid-argument':
            return new ValidationError(userMessage, error);
        case 'resource-exhausted':
            return new AppError(userMessage, ErrorCode.FIREBASE_QUOTA_EXCEEDED, error);
        default:
            // Para otros errores, mantener como error genérico
            return new AppError(userMessage, ErrorCode.UNKNOWN_ERROR, error);
    }
}

// Handler global para errores no capturados
export function setupGlobalErrorHandler() {
    if (typeof window !== 'undefined') {
        // Capturar errores no manejados en eventos
        window.addEventListener('error', (event) => {
            console.error('Unhandled error:', event.error);
            logError(new AppError(
                event.message || 'Error no manejado',
                ErrorCode.UNHANDLED_EXCEPTION,
                event.error
            ));

            // No prevenimos el comportamiento por defecto
        });

        // Capturar promesas rechazadas sin manejar
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            logError(new AppError(
                'Promesa rechazada sin manejar',
                ErrorCode.UNHANDLED_EXCEPTION,
                event.reason instanceof Error ? event.reason : new Error(String(event.reason))
            ));
        });
    }
}

// Función para registrar errores (podría integrarse con Sentry u otro servicio)
export function logError(error: AppError | Error, context?: Record<string, unknown>): void {
    // Formateamos el error para registro
    const logError = error instanceof AppError
        ? error
        : new AppError(error.message, ErrorCode.UNKNOWN_ERROR, error, context);

    // Enviar a la consola
    console.error('[ErrorHandler]', logError);

    // AQUÍ: Integración con un servicio de monitoreo como Sentry
    // Si se añade Sentry en el futuro, descomentar:
    /*
    if (typeof Sentry !== 'undefined') {
        Sentry.captureException(error, {
            extra: {
                ...(logError.context || {}),
                ...(context || {})
            }
        });
    }
    */
}

// Función para mostrar mensajes de error amigables al usuario
export function getUserFriendlyErrorMessage(error: unknown): string {
    if (error instanceof AppError) {
        return error.message;
    }

    // Si es un error de Firebase, mapearlo
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
        return mapFirebaseErrorToAppError(error as FirebaseError).message;
    }

    // Mensaje genérico para otros errores
    return 'Ha ocurrido un error. Por favor intenta de nuevo más tarde.';
}

// Inicializar el sistema de manejo de errores
export default function initErrorHandling(): void {
    setupGlobalErrorHandler();

    // Aquí se podrían configurar otros aspectos como
    // inicializar Sentry, configurar logging, etc.
    console.info('[ErrorHandler] Sistema de manejo de errores inicializado');
} 