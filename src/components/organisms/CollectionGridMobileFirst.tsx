import React, { memo, useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/atoms/Card';
import { CardWithQuantity } from '@/types/collection';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/atoms/Dialog';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Separator } from '@/components/atoms/Separator';
import { ChevronDown, ChevronUp } from 'lucide-react';
import QuantityControl from '@/components/atoms/QuantityControl';

interface CollectionGridMobileFirstProps {
    cards: CardWithQuantity[];
    cardsByRarity: Record<string, CardWithQuantity[]>;
    updateCardQuantity: (cardId: string, quantity: number) => void;
    updatingCardId: string | null;
    className?: string;
}

// Componente para una sección de rareza, optimizado para mobile-first
const RaritySectionMobileFirst = memo(({
    rarity,
    cards,
    updateCardQuantity,
    updatingCardId,
    expandAllSignal
}: {
    rarity: string;
    cards: CardWithQuantity[];
    updateCardQuantity: (cardId: string, quantity: number) => void;
    updatingCardId: string | null;
    expandAllSignal: boolean | null;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedCard, setSelectedCard] = useState<CardWithQuantity | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Escuchar el signal de expandir/contraer todas las secciones
    useEffect(() => {
        if (expandAllSignal !== null) {
            setIsExpanded(expandAllSignal);
        }
    }, [expandAllSignal]);

    // Ordenar las cartas por número de carta
    const sortedCards = useMemo(() => {
        return [...cards].sort((a, b) => (a.mainCard.cardNumber || 0) - (b.mainCard.cardNumber || 0));
    }, [cards]);

    const collectedCount = sortedCards.filter(c => c.mainCard.quantity > 0).length;
    const percentage = Math.round((collectedCount / sortedCards.length) * 100);

    const handleCardClick = (card: CardWithQuantity) => {
        setSelectedCard(card);
        setIsModalOpen(true);
    };

    return (
        <div className="border rounded-lg overflow-hidden bg-white">
            {/* Header colapsable */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
                <div className="flex-1 text-left">
                    <h3 className="font-medium text-sm sm:text-base">{rarity}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs sm:text-sm text-muted-foreground">
                            {collectedCount} de {sortedCards.length}
                        </span>
                        <Badge variant="secondary" className="text-xs">{percentage}%</Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-muted-foreground">({sortedCards.length})</span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </button>

            {/* Contenido colapsable */}
            {isExpanded && (
                <>
                    <Separator />
                    <div className="p-3 sm:p-4 space-y-3">
                        {sortedCards.map((card) => (
                            <div
                                key={card.mainCard.id}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => handleCardClick(card)}
                            >
                                {/* Imagen pequeña */}
                                <div className="flex-shrink-0 w-12 h-16 rounded border overflow-hidden">
                                    <img
                                        src={card.mainCard.imageUrl}
                                        alt={card.mainCard.name}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                    />
                                </div>

                                {/* Información de la carta */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium truncate">{card.mainCard.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-xs">
                                            #{card.mainCard.cardNumber || '?'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {card.mainCard.cardType}
                                        </span>
                                    </div>
                                </div>

                                {/* Control de cantidad */}
                                <div
                                    className="flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <QuantityControl
                                        id={card.mainCard.id}
                                        quantity={card.mainCard.quantity}
                                        onUpdate={(qty) => updateCardQuantity(card.mainCard.id, qty)}
                                        isUpdating={updatingCardId === card.mainCard.id}
                                        compact={true}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal para ver detalles */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[90vw] max-w-md">
                    <DialogHeader>
                        <DialogTitle>{selectedCard?.mainCard.name}</DialogTitle>
                    </DialogHeader>
                    {selectedCard && (
                        <div className="space-y-4">
                            <img
                                src={selectedCard.mainCard.imageUrl}
                                alt={selectedCard.mainCard.name}
                                className="w-full rounded"
                            />
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">ID:</span>
                                    <span className="text-sm font-medium">{selectedCard.mainCard.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Tipo:</span>
                                    <span className="text-sm font-medium">{selectedCard.mainCard.cardType}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Energía:</span>
                                    <span className="text-sm font-medium">{selectedCard.mainCard.cardEnergy}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm text-muted-foreground">Cantidad:</span>
                                    <QuantityControl
                                        id={selectedCard.mainCard.id}
                                        quantity={selectedCard.mainCard.quantity}
                                        onUpdate={(qty) => updateCardQuantity(selectedCard.mainCard.id, qty)}
                                        isUpdating={updatingCardId === selectedCard.mainCard.id}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
});

RaritySectionMobileFirst.displayName = 'RaritySectionMobileFirst';

/**
 * CollectionGridMobileFirst - Layout de colección optimizado para mobile-first
 * Diseño similar a la imagen proporcionada con secciones colapsables por rareza
 */
export const CollectionGridMobileFirst = memo(function CollectionGridMobileFirst({
    cards,
    cardsByRarity,
    updateCardQuantity,
    updatingCardId,
    className
}: CollectionGridMobileFirstProps) {
    const [allExpanded, setAllExpanded] = useState(false);

    const getSortedRarities = (): string[] => {
        const rarityOrder = [
            'Especial',
            'Épica',
            'Rara',
            'Poco Común',
            'Común',
            'Custom'
        ];

        return rarityOrder.filter(rarity => cardsByRarity[rarity]?.length > 0);
    };

    const sortedRarities = useMemo(() => getSortedRarities(), [cardsByRarity]);

    // Calcular estadísticas totales
    const totalCards = cards.length;
    const collectedCards = cards.filter(card => card.mainCard.quantity > 0).length;
    const collectionPercentage = totalCards > 0 ? Math.round((collectedCards / totalCards) * 100) : 0;
    const activeDeckCount = Math.floor(totalCards / 40); // Aproximadamente

    if (totalCards === 0) {
        return (
            <div className="p-4 sm:p-6 text-center rounded-lg border border-border bg-card">
                <h3 className="text-base sm:text-lg font-medium mb-2">No hay cartas para mostrar</h3>
                <p className="text-sm text-muted-foreground">Ajusta los filtros o selecciona otro set</p>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Estadísticas principales */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                <div className="bg-card p-4 rounded-lg border">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{totalCards}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Total cartas</div>
                </div>
                <div className="bg-card p-4 rounded-lg border">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{collectedCards}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Coleccionadas</div>
                </div>
                <div className="bg-card p-4 rounded-lg border sm:col-span-1 col-span-2 sm:col-span-1">
                    <div className="text-2xl sm:text-3xl font-bold text-primary">{collectionPercentage}%</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">Completitud</div>
                </div>
            </div>

            {/* Barra de progreso */}
            <div className="bg-card p-4 rounded-lg border">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progreso de colección</span>
                    <Badge variant="outline">{collectionPercentage}%</Badge>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${collectionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Botón expandir/contraer todas las secciones */}
            <Button
                variant="outline"
                className="w-full"
                onClick={() => setAllExpanded(!allExpanded)}
            >
                {allExpanded ? 'Contraer todas' : 'Expandir todas'}
            </Button>

            {/* Secciones por rareza */}
            <div className="space-y-3">
                {sortedRarities.map(rarity => (
                    <RaritySectionMobileFirst
                        key={rarity}
                        rarity={rarity}
                        cards={cardsByRarity[rarity] || []}
                        updateCardQuantity={updateCardQuantity}
                        updatingCardId={updatingCardId}
                        expandAllSignal={allExpanded}
                    />
                ))}
            </div>
        </div>
    );
});

CollectionGridMobileFirst.displayName = 'CollectionGridMobileFirst';

export default CollectionGridMobileFirst;
