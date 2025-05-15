import React from 'react';
import { Card } from '../atoms/Card';
import { CardWithBadge } from '../molecules/CardWithBadge';
import { CardWithAction } from '../molecules/CardWithAction';

// Props comunes para todas las tarjetas
interface BaseCardProps {
    id: string;
    title: string;
    description?: string;
    imageUrl: string;
}

// Tipos específicos de tarjetas
interface TagCard extends BaseCardProps {
    type: 'tag';
    tag: {
        text: string;
        variant?: 'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    };
}

interface ActionCard extends BaseCardProps {
    type: 'action';
    actions: {
        primary?: {
            label: string;
            onClick: (id: string) => void;
            variant?: 'primary' | 'secondary' | 'outline';
        };
        secondary?: {
            label: string;
            onClick: (id: string) => void;
            variant?: 'outline' | 'ghost';
        };
    };
}

interface SimpleCard extends BaseCardProps {
    type: 'simple';
    onClick?: (id: string) => void;
}

// Unión de tipos para cualquier tipo de tarjeta
type CardItem = SimpleCard | TagCard | ActionCard;

interface CardGridProps {
    cards: CardItem[];
    columns?: {
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    gap?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Componente para mostrar una cuadrícula de tarjetas con opciones de personalización
 * @param cards Array de objetos con la información de las tarjetas
 * @param columns Configuración de columnas para diferentes tamaños de pantalla
 * @param gap Espaciado entre tarjetas
 */
export const CardGrid: React.FC<CardGridProps> = ({
    cards,
    columns = {
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4
    },
    gap = 'md'
}) => {
    // Mapear los valores de columnas a clases de Tailwind
    const getColumnsClasses = () => {
        const classes = ['grid'];
        
        if (columns.sm) classes.push(`grid-cols-${columns.sm}`);
        if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
        if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
        if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
        
        return classes.join(' ');
    };
    
    // Mapear los valores de gap a clases de Tailwind
    const getGapClass = () => {
        switch (gap) {
            case 'none': return 'gap-0';
            case 'sm': return 'gap-2';
            case 'lg': return 'gap-6';
            case 'md':
            default: return 'gap-4';
        }
    };

    return (
        <div className={`${getColumnsClasses()} ${getGapClass()}`}>
            {cards.map((card) => {
                switch (card.type) {
                    case 'tag':
                        return (
                            <CardWithBadge
                                key={card.id}
                                title={card.title}
                                description={card.description}
                                imageUrl={card.imageUrl}
                                badgeText={card.tag.text}
                                badgeVariant={card.tag.variant}
                            />
                        );
                    case 'action':
                        return (
                            <CardWithAction
                                key={card.id}
                                title={card.title}
                                description={card.description}
                                imageUrl={card.imageUrl}
                                primaryAction={card.actions.primary ? {
                                    label: card.actions.primary.label,
                                    onClick: () => card.actions.primary?.onClick(card.id),
                                    variant: card.actions.primary.variant
                                } : undefined}
                                secondaryAction={card.actions.secondary ? {
                                    label: card.actions.secondary.label,
                                    onClick: () => card.actions.secondary?.onClick(card.id),
                                    variant: card.actions.secondary.variant
                                } : undefined}
                            />
                        );
                    case 'simple':
                    default:
                        return (
                            <Card
                                key={card.id}
                                title={card.title}
                                description={card.description}
                                imageUrl={card.imageUrl}
                                onClick={() => card.onClick && card.onClick(card.id)}
                            />
                        );
                }
            })}
        </div>
    );
}; 