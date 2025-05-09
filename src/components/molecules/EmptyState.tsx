import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
    /**
     * Icono principal a mostrar
     */
    icon?: ReactNode;

    /**
     * Título del estado vacío
     */
    title: string;

    /**
     * Descripción detallada 
     */
    description?: string;

    /**
     * Acción principal (botón, enlace, etc.)
     */
    action?: ReactNode;

    /**
     * Clases CSS adicionales
     */
    className?: string;
}

/**
 * EmptyState - Componente para mostrar un mensaje cuando no hay datos 
 * con opciones para añadir una acción principal
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    className
}: EmptyStateProps) {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 rounded-lg border-2 border-dashed border-border bg-muted/50",
            className
        )}>
            {icon && (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    {icon}
                </div>
            )}

            <h3 className="text-xl font-semibold mb-2">{title}</h3>

            {description && (
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                    {description}
                </p>
            )}

            {action && action}
        </div>
    );
} 