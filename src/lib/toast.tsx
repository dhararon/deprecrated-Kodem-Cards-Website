import { toast } from 'sonner';
import React from 'react';

/**
 * Tipo de severidad de las notificaciones
 */
export type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

/**
 * Opciones para las notificaciones
 */
export interface ToastOptions {
    /**
     * Duración en milisegundos
     * @default 5000
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
    id?: string;

    /**
     * Descripción adicional para la notificación
     */
    description?: string;
}

/**
 * Muestra una notificación informativa
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales
 */
export function showInfo(message: string, options?: ToastOptions): void {
    const { duration = 5000, undoable, onUndo, id, description } = options || {};

    if (undoable && onUndo) {
        toast.info(message, {
            duration,
            id,
            description,
            action: {
                label: 'Deshacer',
                onClick: onUndo
            }
        });
        return;
    }

    toast.info(message, {
        duration,
        id,
        description
    });
}

/**
 * Muestra una notificación de éxito
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales
 */
export function showSuccess(message: string, options?: ToastOptions): void {
    const { duration = 5000, undoable, onUndo, id, description } = options || {};

    if (undoable && onUndo) {
        toast.success(message, {
            duration,
            id,
            description,
            action: {
                label: 'Deshacer',
                onClick: onUndo
            }
        });
        return;
    }

    toast.success(message, {
        duration,
        id,
        description
    });
}

/**
 * Muestra una notificación de error
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales
 */
export function showError(message: string, options?: ToastOptions): void {
    const { duration = 5000, id, description } = options || {};

    toast.error(message, {
        duration,
        id,
        description
    });
}

/**
 * Muestra una notificación de advertencia
 * @param message Mensaje a mostrar
 * @param options Opciones adicionales
 */
export function showWarning(message: string, options?: ToastOptions): void {
    const { duration = 5000, undoable, onUndo, id, description } = options || {};

    const warningIcon = (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
            <path d="M12 9v4"></path>
            <path d="M12 17h.01"></path>
        </svg>
    );

    if (undoable && onUndo) {
        toast(message, {
            duration,
            id,
            description,
            action: {
                label: 'Deshacer',
                onClick: onUndo
            },
            className: 'bg-yellow-50 border-yellow-400 text-yellow-800',
            icon: warningIcon
        });
        return;
    }

    toast(message, {
        duration,
        id,
        description,
        className: 'bg-yellow-50 border-yellow-400 text-yellow-800',
        icon: warningIcon
    });
}

/**
 * Muestra una notificación de carga
 * @param message Mensaje a mostrar
 * @returns Funciones para actualizar o descartar la notificación
 */
export function showLoading(message: string): {
    update: (message: string, severity: ToastSeverity) => void,
    dismiss: () => void
} {
    const id = toast.loading(message);

    return {
        update: (message: string, severity: ToastSeverity) => {
            toast.dismiss(id);
            switch (severity) {
                case 'success':
                    showSuccess(message, { id });
                    break;
                case 'error':
                    showError(message, { id });
                    break;
                case 'info':
                    showInfo(message, { id });
                    break;
                case 'warning':
                    showWarning(message, { id });
                    break;
            }
        },
        dismiss: () => toast.dismiss(id)
    };
}

/**
 * Muestra una notificación de promesa
 * @param promise Promesa a ejecutar
 * @param messages Mensajes a mostrar en cada estado
 */
export function showPromise<T>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string;
        error: string;
    }
): Promise<T> {
    return toast.promise(promise, {
        loading: messages.loading,
        success: messages.success,
        error: (err) => err.message || messages.error
    });
} 