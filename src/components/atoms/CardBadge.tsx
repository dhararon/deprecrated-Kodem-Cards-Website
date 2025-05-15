import React from 'react';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

interface CardBadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

/**
 * Componente Badge para mostrar etiquetas o estados en las tarjetas
 * @param children Contenido del badge
 * @param variant Variante de color del badge
 * @param className Clases adicionales para personalizar
 */
export const CardBadge: React.FC<CardBadgeProps> = ({
    children,
    variant = 'default',
    className = ''
}) => {
    const variantClasses = {
        default: 'bg-neutral-100 text-neutral-800',
        primary: 'bg-primary-50 text-primary-700',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-success-50 text-success-700',
        error: 'bg-error-50 text-error-700',
        warning: 'bg-warning-50 text-warning-700',
        info: 'bg-info-50 text-info-700'
    };

    return (
        <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
        >
            {children}
        </span>
    );
}; 