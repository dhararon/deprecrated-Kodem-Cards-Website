import React from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';

interface CardWithActionProps {
    title: string;
    description?: string;
    imageUrl: string;
    primaryAction?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary' | 'outline';
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
        variant?: 'outline' | 'ghost';
    };
    className?: string;
}

/**
 * Componente que combina Card con botones de acción
 * @param title Título de la tarjeta
 * @param description Descripción opcional de la tarjeta
 * @param imageUrl URL de la imagen
 * @param primaryAction Configuración de la acción principal
 * @param secondaryAction Configuración de la acción secundaria
 * @param className Clases adicionales para personalizar
 */
export const CardWithAction: React.FC<CardWithActionProps> = ({
    title,
    description,
    imageUrl,
    primaryAction,
    secondaryAction,
    className = '',
}) => {
    return (
        <div className={`bg-card rounded-lg shadow-md overflow-hidden ${className}`}>
            <div className="relative h-48 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="p-4">
                <h3 className="font-semibold text-lg text-card-foreground mb-1">{title}</h3>
                {description && (
                    <p className="text-muted-foreground text-sm mb-4">{description}</p>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                    {primaryAction && (
                        <Button 
                            variant={primaryAction.variant || 'primary'} 
                            onClick={primaryAction.onClick}
                            fullWidth
                        >
                            {primaryAction.label}
                        </Button>
                    )}
                    
                    {secondaryAction && (
                        <Button 
                            variant={secondaryAction.variant || 'outline'} 
                            onClick={secondaryAction.onClick}
                            fullWidth
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}; 