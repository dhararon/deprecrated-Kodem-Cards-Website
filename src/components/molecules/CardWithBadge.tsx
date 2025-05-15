import React from 'react';
import { CardOriginal } from '../atoms/Card';
import { CardBadge } from '../atoms/CardBadge';

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

interface CardWithBadgeProps {
    title: string;
    description?: string;
    imageUrl: string;
    badgeText: string;
    badgeVariant?: BadgeVariant;
    onClick?: () => void;
    className?: string;
}

/**
 * Componente que combina Card y CardBadge para mostrar una tarjeta con etiqueta
 * @param title Título de la tarjeta
 * @param description Descripción opcional de la tarjeta
 * @param imageUrl URL de la imagen
 * @param badgeText Texto de la etiqueta
 * @param badgeVariant Variante de color de la etiqueta
 * @param onClick Función opcional a ejecutar al hacer clic
 * @param className Clases adicionales para personalizar
 */
export const CardWithBadge: React.FC<CardWithBadgeProps> = ({
    title,
    description,
    imageUrl,
    badgeText,
    badgeVariant = 'default',
    onClick,
    className = '',
}) => {
    return (
        <div className="relative">
            <CardOriginal
                title={title}
                description={description}
                imageUrl={imageUrl}
                onClick={onClick}
                className={className}
            />
            <div className="absolute top-3 right-3">
                <CardBadge variant={badgeVariant}>
                    {badgeText}
                </CardBadge>
            </div>
        </div>
    );
}; 