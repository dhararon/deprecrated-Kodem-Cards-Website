import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/atoms/Card';
import { CardImage } from '@/components/molecules/CardImage';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Dialog, DialogContent } from '@/components/atoms/Dialog';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/atoms/Pagination';

export interface CardItem {
    id: string;
    name: string;
    imageUrl?: string;
    type?: string;
    rarity?: string;
    attack?: number;
    defense?: number;
    description?: string;
}

export interface CardsGridProps {
    cards: CardItem[];
    onCardSelect?: (card: CardItem) => void;
    selectedCardIds?: string[];
    itemsPerPage?: number;
    className?: string;
    canClick?: boolean;
    showBadges?: boolean;
}

export function CardsGrid({
    cards,
    onCardSelect,
    selectedCardIds = [],
    itemsPerPage = 12,
    className,
    canClick = true,
    showBadges = true,
}: CardsGridProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calcular el índice inicial y final para la paginación
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCards = cards.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.max(1, Math.ceil(cards.length / itemsPerPage));

    // Manejar cambio de página
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Manejar selección de carta
    const handleCardClick = (card: CardItem) => {
        if (onCardSelect && canClick) {
            onCardSelect(card);
        } else {
            setSelectedCard(card);
            setIsModalOpen(true);
        }
    };

    // Obtener color según el tipo de carta
    const getTypeColor = (type?: string): string => {
        const typeColors: Record<string, string> = {
            Agua: 'bg-blue-500',
            Fuego: 'bg-red-500',
            Tierra: 'bg-amber-700',
            Naturaleza: 'bg-green-500',
            Espíritu: 'bg-purple-500',
            Oscuridad: 'bg-indigo-800',
            Luz: 'bg-yellow-500',
            Neutral: 'bg-gray-500',
        };

        return type ? typeColors[type] || 'bg-gray-500' : 'bg-gray-500';
    };

    // Obtener color según la rareza
    const getRarityColor = (rarity?: string): string => {
        const rarityColors: Record<string, string> = {
            Común: 'bg-gray-300 text-gray-800',
            Poco_común: 'bg-green-200 text-green-800',
            Rara: 'bg-blue-200 text-blue-800',
            Legendaria: 'bg-purple-200 text-purple-800',
            Mítica: 'bg-amber-200 text-amber-800',
        };

        return rarity ? rarityColors[rarity] || 'bg-gray-300 text-gray-800' : 'bg-gray-300 text-gray-800';
    };

    return (
        <div className="space-y-4">
            <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4", className)}>
                {currentCards.map((card) => (
                    <div key={card.id} className="relative">
                        <Card
                            className={cn(
                                "h-full transition-all duration-200 overflow-hidden",
                                selectedCardIds?.includes(card.id) && "ring-2 ring-primary"
                            )}
                        >
                            <CardImage
                                imageUrl={card.imageUrl}
                                cardName={card.name}
                                element={card.type}
                                onClick={() => handleCardClick(card)}
                                className="w-full aspect-[2/3]"
                            />
                            {showBadges && (
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    {card.type && (
                                        <Badge className={cn("text-white", getTypeColor(card.type))}>
                                            {card.type}
                                        </Badge>
                                    )}
                                    {card.rarity && (
                                        <Badge className={getRarityColor(card.rarity)}>
                                            {card.rarity.replace('_', ' ')}
                                        </Badge>
                                    )}
                                </div>
                            )}
                            {selectedCardIds?.includes(card.id) && (
                                <div className="absolute top-2 right-2">
                                    <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center">
                                        ✓
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                ))}
            </div>

            {totalPages > 1 && (
                <Pagination className="mt-4">
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => handlePageChange(currentPage - 1)}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            >
                                Anterior
                            </PaginationPrevious>
                        </PaginationItem>
                        <div className="mx-4">
                            Página {currentPage} de {totalPages}
                        </div>
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => handlePageChange(currentPage + 1)}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            >
                                Siguiente
                            </PaginationNext>
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            {/* Modal para ver detalles de la carta */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-md">
                    {selectedCard && (
                        <div className="flex flex-col items-center space-y-4">
                            <h3 className="text-xl font-bold">{selectedCard.name}</h3>
                            <CardImage
                                imageUrl={selectedCard.imageUrl}
                                cardName={selectedCard.name}
                                element={selectedCard.type}
                                className="w-full max-w-[250px] mx-auto"
                            />
                            <div className="flex gap-2 justify-center w-full">
                                {selectedCard.type && (
                                    <Badge className={cn("text-white", getTypeColor(selectedCard.type))}>
                                        {selectedCard.type}
                                    </Badge>
                                )}
                                {selectedCard.rarity && (
                                    <Badge className={getRarityColor(selectedCard.rarity)}>
                                        {selectedCard.rarity.replace('_', ' ')}
                                    </Badge>
                                )}
                            </div>
                            {(selectedCard.attack !== undefined || selectedCard.defense !== undefined) && (
                                <div className="flex gap-4 justify-center w-full">
                                    {selectedCard.attack !== undefined && (
                                        <div className="text-center">
                                            <span className="text-sm text-gray-500">Ataque</span>
                                            <p className="font-bold">{selectedCard.attack}</p>
                                        </div>
                                    )}
                                    {selectedCard.defense !== undefined && (
                                        <div className="text-center">
                                            <span className="text-sm text-gray-500">Defensa</span>
                                            <p className="font-bold">{selectedCard.defense}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedCard.description && (
                                <div className="text-sm text-gray-700 mt-2 text-center">
                                    {selectedCard.description}
                                </div>
                            )}
                            {onCardSelect && canClick && (
                                <Button
                                    onClick={() => {
                                        onCardSelect(selectedCard);
                                        setIsModalOpen(false);
                                    }}
                                    className="mt-4"
                                >
                                    {selectedCardIds?.includes(selectedCard.id) ? "Quitar" : "Añadir"}
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
} 