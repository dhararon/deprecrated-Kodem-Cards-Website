import React, { memo } from 'react';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import QuantityControl from '@/components/atoms/QuantityControl';
import { CardDetails } from '@/types/card';
import { cn } from '@/lib/utils';

interface CollectionCardProps {
    card: CardDetails & { quantity: number; inCollection: boolean };
    onUpdateQuantity: (cardId: string, quantity: number) => void;
    isUpdating: boolean;
    hasAlts?: boolean;
    altCount?: number;
    className?: string;
}

/**
 * CollectionCard - Componente para mostrar una carta de colección con controles de cantidad
 */
export const CollectionCard = memo(function CollectionCard({
    card,
    onUpdateQuantity,
    isUpdating,
    hasAlts,
    altCount = 0,
    className
}: CollectionCardProps) {
    // Formatear el precio
    const formatPrice = (price?: number, currency?: string) => {
        // Manejar caso cuando el precio o la moneda no están definidos
        if (price === undefined || price === null || currency === undefined || currency === null) {
            return 'N/A';
        }

        if (currency === 'EUR') {
            return `${price.toFixed(2)} €`;
        } else if (currency === 'USD') {
            return `$${price.toFixed(2)}`;
        } else {
            return `${price.toFixed(2)} ${currency}`;
        }
    };

    // Asegurarse de que prices existe antes de acceder a sus propiedades
    const displayPrice = card.prices
        ? formatPrice(card.prices.amount, card.prices.currency)
        : formatPrice(undefined, undefined);

    return (
        <Card
            className={cn(
                "overflow-hidden h-full flex flex-col shadow-sm transition-all",
                card.quantity > 0 ? "border-green-200 dark:border-green-800" : "border-gray-200 dark:border-gray-800",
                className
            )}
            data-fullid={card.fullId || ''}
        >
            <div className="relative flex-1 flex flex-col min-h-0 w-full">
                {/* Imagen de la carta con efecto de escala de grises si no está en la colección */}
                <div
                    className={cn(
                        "relative overflow-hidden flex-shrink-0",
                        "aspect-[2/3] w-full",
                        card.quantity === 0 ? 'grayscale brightness-75' : ''
                    )}
                >
                    <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-full h-full object-cover object-center rounded-t-md"
                        loading="lazy"
                    />

                    {/* Badges superpuestos */}
                    <div className="absolute inset-0 p-1 sm:p-2 flex flex-col justify-between">
                        <div className="flex justify-between">
                            {/* Badge de número de carta */}
                            <Badge 
                                variant="outline" 
                                className="bg-black/70 border-0 text-white text-[10px] sm:text-xs py-0.5 px-1"
                            >
                                #{card.cardNumber || '?'}
                            </Badge>
                            
                            {/* Badge de versiones alternativas */}
                            {hasAlts && (
                                <Badge
                                    variant="outline"
                                    className="bg-black/70 border-0 text-white text-[10px] sm:text-xs py-0.5 px-1"
                                >
                                    {altCount + 1}v
                                </Badge>
                            )}
                        </div>
                        
                        <div className="flex justify-between items-end">
                            {/* Badge de cantidad */}
                            {card.quantity > 0 && (
                                <Badge
                                    className="bg-primary text-white text-[10px] sm:text-xs py-0.5 px-1"
                                >
                                    x{card.quantity}
                                </Badge>
                            )}
                            
                            {/* Badge de precio */}
                            <Badge
                                variant="secondary"
                                className="bg-black/70 text-white text-[10px] sm:text-xs py-0.5 px-1"
                            >
                                {displayPrice}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Información mínima en móvil, más completa en desktop */}
                <div className="p-1.5 sm:p-2 bg-card flex-shrink-0 flex flex-col">
                    <h3 className="text-xs sm:text-sm font-medium truncate" title={card.name}>
                        {card.name}
                    </h3>

                    {/* Control de cantidad compacto */}
                    <div className="flex items-center justify-between mt-1 sm:mt-2">
                        <span className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                            {card.rarity || 'N/A'}
                        </span>
                        
                        <QuantityControl
                            id={card.id}
                            quantity={card.quantity}
                            onUpdate={(qty) => onUpdateQuantity(card.id, qty)}
                            isUpdating={isUpdating}
                            compact={true}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
});

export default CollectionCard; 