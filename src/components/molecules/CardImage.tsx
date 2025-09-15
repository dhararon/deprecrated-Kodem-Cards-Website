import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import OptimizedImage from '@/components/atoms/OptimizedImage';

export interface CardImageProps {
    imageUrl?: string;
    cardName: string;
    element?: string;
    className?: string;
    onClick?: () => void;
    aspectRatio?: '2/3' | '3/4' | 'square';
}

/**
 * CardImage - Un componente para mostrar la imagen de una carta con un placeholder fallback
 */
function CardImage({
    imageUrl,
    cardName,
    element,
    className,
    onClick,
    aspectRatio = '2/3',
}: CardImageProps) {
    // Generar un placeholder de imagen basado en el tipo/elemento de la carta
    const getCardPlaceholder = () => {
        const colorMap: Record<string, string> = {
            Agua: '#0096c7',
            Fuego: '#e5383b',
            Tierra: '#a68a64',
            Naturaleza: '#588157',
            Espíritu: '#9d4edd',
            Oscuridad: '#3a0ca3',
            Luz: '#ffba08',
            Neutral: '#4d4d4d',
            water: '#0096c7',
            fire: '#e5383b',
            earth: '#a68a64',
            wind: '#588157',
            spirit: '#9d4edd',
            dark: '#3a0ca3',
            light: '#ffba08'
        };

        const elementKey = element?.toLowerCase() || 'neutral';
        const bgColor = colorMap[elementKey] || colorMap[element || ''] || '#4361ee';

        return `https://placehold.co/300x400/${bgColor.replace('#', '')}/FFFFFF?text=${encodeURIComponent(cardName)}`;
    };

    return (
        <motion.div
            className={cn(
                `relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`,
                className
            )}
            style={{ aspectRatio: aspectRatio === 'square' ? '1/1' : aspectRatio }}
            whileHover={{ scale: onClick ? 1.05 : 1 }}
            whileTap={{ scale: onClick ? 0.98 : 1 }}
            onClick={onClick}
        >
            <OptimizedImage
                src={imageUrl || ''}
                alt={cardName}
                fallbackSrc={getCardPlaceholder()}
                className="w-full h-full rounded-md"
            />
        </motion.div>
    );
}

// Exportar con memo para evitar re-renders innecesarios
export default memo(CardImage);

// Mantener la exportación nombrada para compatibilidad
export { CardImage }; 