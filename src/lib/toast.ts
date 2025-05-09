import { toast, ExternalToast } from 'sonner';
import React from 'react';

/**
 * Tipo de severidad de las notificaciones
 */
export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

/**
 * Posiciones disponibles para las notificaciones
 */
export type ToastPosition = 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';

/**
 * Opciones para las notificaciones
 */
export interface ToastOptions extends Partial<ExternalToast> {
    /**
     * Duración en milisegundos
     * @default 4000
     */
    duration?: number;

    /**
     * Si la notificación debe tener acción de deshacer
     * @default false
     */
    undoable?: boolean;

    /**
     * Callback para cuando se hace clic en deshacer
     */
    onUndo?: () => void;

    /**
     * ID para identificar la notificación
     */
    id?: string | number;

    /**
     * Descripción adicional para la notificación
     */
    description?: string;

    /**
     * Posición de la notificación
     * @default 'top-right'
     */
    position?: ToastPosition;

    /**
     * Acciones adicionales para la notificación
     */
    actions?: {
        label: string;
        onClick: () => void;
    }[];
}

// Generador de ID único para los toasts
const generateToastId = (message: string) => `toast-${message}-${Date.now()}`;

/**
 * Muestra una notificación informativa
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales
 * @returns ID de la notificación
 */
export function showInfo(message: string, options?: ToastOptions): string | number {
    const { duration = 4000, undoable, onUndo, id = generateToastId(message), description, position, ...rest } = options || {};

    if (undoable && onUndo) {
        return toast.info(message, {
            duration,
            id,
            description,
            position,
            action: {
                label: 'Deshacer',
                onClick: onUndo
            },
            ...rest
        });
    }

    return toast.info(message, {
        duration,
        id,
        description,
        position,
        ...rest
    });
}

/**
 * Muestra una notificación de éxito
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales
 * @returns ID de la notificación
 */
export function showSuccess(message: string, options?: ToastOptions): string | number {
    const { duration = 4000, undoable, onUndo, id = generateToastId(message), description, position, ...rest } = options || {};

    if (undoable && onUndo) {
        return toast.success(message, {
            duration,
            id,
            description,
            position,
            action: {
                label: 'Deshacer',
                onClick: onUndo
            },
            ...rest
        });
    }

    return toast.success(message, {
        duration,
        id,
        description,
        position,
        ...rest
    });
}

/**
 * Muestra una notificación de error
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales
 * @returns ID de la notificación
 */
export function showError(message: string, options?: ToastOptions): string | number {
    const { duration = 4000, id = generateToastId(message), ...rest } = options || {};

    return toast.error(message, {
        duration,
        id,
        ...rest
    });
}

/**
 * Muestra una notificación de advertencia
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales
 * @returns ID de la notificación
 */
export function showWarning(message: string, options?: ToastOptions): string | number {
    const { duration = 4000, undoable, onUndo, id = generateToastId(message), description, position, ...rest } = options || {};

    // Definimos el icono de advertencia como una cadena JSX
    const warningIcon = React.createElement('svg', {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "24",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "text-yellow-600",
        children: [
            React.createElement('path', {
                key: "path1",
                d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
            }),
            React.createElement('path', { key: "path2", d: "M12 9v4" }),
            React.createElement('path', { key: "path3", d: "M12 17h.01" })
        ]
    });

    if (undoable && onUndo) {
        return toast(message, {
            duration,
            id,
            description,
            position,
            action: {
                label: 'Deshacer',
                onClick: onUndo
            },
            icon: warningIcon,
            ...rest
        });
    }

    return toast(message, {
        duration,
        id,
        description,
        position,
        icon: warningIcon,
        ...rest
    });
}

/**
 * Muestra una notificación de carga
 * @param message Mensaje a mostrar
 * @returns Objeto con métodos para actualizar o descartar la notificación
 */
export function showLoading(message: string, options?: Omit<ToastOptions, 'duration'>): {
    update: (message: string, severity: ToastSeverity) => void,
    dismiss: () => void
} {
    const { id = generateToastId(message), description, position, ...rest } = options || {};
    const toastId = toast.loading(message, {
        id,
        description,
        position,
        ...rest
    });

    return {
        update: (message: string, severity: ToastSeverity) => {
            toast.dismiss(toastId);
            switch (severity) {
                case 'success':
                    showSuccess(message, { id: toastId });
                    break;
                case 'error':
                    showError(message, { id: toastId });
                    break;
                case 'info':
                    showInfo(message, { id: toastId });
                    break;
                case 'warning':
                    showWarning(message, { id: toastId });
                    break;
            }
        },
        dismiss: () => toast.dismiss(toastId)
    };
}

/**
 * Tipo para los datos devueltos por una promesa
 */
export interface PromiseData<T> {
    data: T;
}

/**
 * Tipo para errores de promesa
 */
export interface PromiseError {
    message: string;
    [key: string]: unknown;
}

/**
 * Tipo para los mensajes del toast.promise
 */
interface PromiseToastMessages {
    loading: React.ReactNode;
    success: React.ReactNode | ((data: unknown) => React.ReactNode);
    error: React.ReactNode | ((error: unknown) => React.ReactNode);
}

/**
 * Muestra una notificación asociada a una promesa
 * @param promise Promesa a ejecutar
 * @param messages Mensajes a mostrar en cada estado
 * @param options Opciones adicionales
 * @returns La promesa original
 */
export function showPromise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: PromiseToastMessages,
    options?: Omit<ToastOptions, 'duration' | 'id'>
): Promise<T> {
    const actualPromise = typeof promise === 'function' ? promise() : promise;
    
    // Eliminamos variables no utilizadas
    const { ...rest } = options || {};
    
    toast.promise(actualPromise, {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
        ...rest
    });
    
    return actualPromise;
}

/**
 * Muestra una notificación con acciones personalizadas
 * @param message Mensaje a mostrar
 * @param actions Acciones a mostrar
 * @param options Opciones adicionales
 * @returns ID de la notificación
 */
export function showActionToast(
    message: string,
    actions: Array<{ label: string; onClick: () => void; primary?: boolean }>,
    options?: ToastOptions
): string | number {
    const { duration = 8000, id = generateToastId(message), description, position, ...rest } = options || {};

    return toast(message, {
        duration,
        id,
        description,
        position,
        action: {
            label: actions[0].label,
            onClick: actions[0].onClick
        },
        cancel: actions.length > 1 ? {
            label: actions[1].label,
            onClick: actions[1].onClick
        } : undefined,
        ...rest
    });
}

/**
 * Descarta una notificación por ID
 * @param id ID de la notificación a descartar
 */
export function dismissToast(id: string | number): void {
    toast.dismiss(id);
}

/**
 * Descarta todas las notificaciones
 */
export function dismissAllToasts(): void {
    toast.dismiss();
}

// Exportamos el objeto toast directamente para usos avanzados
export { toast }; 